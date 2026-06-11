import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Trash2, Pencil, Plus, X, ShieldCheck, Search, UserPlus, UserMinus, History } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { listUsers, grantRole, revokeRole, listAuditLog } from "@/lib/admin-users.functions";
import { PageShell } from "@/components/PageShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/use-admin";
import { useBranches, useSemesters, useSubjects } from "@/hooks/use-taxonomy";
import { fetchNotes, type Note } from "@/lib/notes-api";
import { MATERIAL_TYPES, materialLabel, type MaterialType } from "@/lib/taxonomy-api";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Acadex" }] }),
  component: AdminPage,
});

const examTypes = [
  { value: "timetable", label: "Timetable" },
  { value: "notice", label: "Notice" },
  { value: "important_date", label: "Important date" },
  { value: "result", label: "Result link" },
];

type Tab = "stats" | "branches" | "semesters" | "subjects" | "notes" | "exam" | "users" | "audit";

const TABS: { key: Tab; label: string }[] = [
  { key: "stats", label: "Overview" },
  { key: "users", label: "Users" },
  { key: "audit", label: "Audit Log" },
  { key: "branches", label: "Branches" },
  { key: "semesters", label: "Semesters" },
  { key: "subjects", label: "Subjects" },
  { key: "notes", label: "PDFs" },
  { key: "exam", label: "Exam Hub" },
];

function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("stats");

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login", replace: true });
  }, [authLoading, user, navigate]);

  if (authLoading || roleLoading)
    return (
      <PageShell title="Admin">
        <div className="flex justify-center py-20"><Loader2 className="h-5 w-5 animate-spin" /></div>
      </PageShell>
    );

  if (!isAdmin)
    return (
      <PageShell title="Admin" subtitle="Restricted">
        <div className="glass rounded-3xl p-8 text-center gradient-border">
          <ShieldCheck className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm">You don't have admin access.</p>
          <Link to="/" className="btn-brand inline-flex mt-4 rounded-xl px-4 py-2 text-xs font-medium">Go home</Link>
        </div>
      </PageShell>
    );

  return (
    <PageShell title="Admin Panel" subtitle="Manage content">
      <div className="glass rounded-2xl p-1 flex gap-1 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`shrink-0 rounded-xl px-3 py-2 text-xs font-medium ${tab === t.key ? "btn-brand" : "text-muted-foreground"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "stats" && <StatsPanel />}
      {tab === "users" && <UsersAdmin />}
      {tab === "audit" && <AuditLogPanel />}
      {tab === "branches" && <BranchAdmin />}
      {tab === "semesters" && <SemesterAdmin />}
      {tab === "subjects" && <SubjectAdmin />}
      {tab === "notes" && <NotesAdmin />}
      {tab === "exam" && <ExamAdmin />}
    </PageShell>
  );
}

/* ───────── Overview / stats ───────── */

function StatsPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const counts = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("branches").select("id", { count: "exact", head: true }),
        supabase.from("semesters").select("id", { count: "exact", head: true }),
        supabase.from("subjects").select("id", { count: "exact", head: true }),
        supabase.from("notes").select("id", { count: "exact", head: true }),
        supabase.from("note_downloads").select("id", { count: "exact", head: true }),
        supabase.from("exam_events").select("id", { count: "exact", head: true }).eq("type", "notice"),
      ]);
      return {
        users: counts[0].count ?? 0,
        branches: counts[1].count ?? 0,
        semesters: counts[2].count ?? 0,
        subjects: counts[3].count ?? 0,
        pdfs: counts[4].count ?? 0,
        downloads: counts[5].count ?? 0,
        notices: counts[6].count ?? 0,
      };
    },
  });

  const items = [
    { label: "Users", value: data?.users },
    { label: "Branches", value: data?.branches },
    { label: "Semesters", value: data?.semesters },
    { label: "Subjects", value: data?.subjects },
    { label: "PDFs", value: data?.pdfs },
    { label: "Downloads", value: data?.downloads },
    { label: "Notices", value: data?.notices },
  ];

  return (
    <div className="mt-4 grid grid-cols-2 gap-3">
      {items.map((it) => (
        <div key={it.label} className="glass rounded-2xl p-4 gradient-border">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{it.label}</div>
          <div className="text-2xl font-semibold mt-1">
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (it.value ?? 0)}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ───────── Branches admin ───────── */

type TaxRow = { id: string; name: string; sort_order: number };

function BranchAdmin() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [editing, setEditing] = useState<TaxRow | null>(null);

  const { data: rows = [], isLoading } = useBranches();

  const save = useMutation({
    mutationFn: async () => {
      const n = name.trim();
      if (!n) throw new Error("Name required");
      const so = sortOrder.trim() ? parseInt(sortOrder, 10) : rows.length + 1;
      if (editing) {
        const { error } = await supabase.from("branches").update({ name: n, sort_order: so }).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("branches").insert({ name: n, sort_order: so });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Saved");
      setName(""); setSortOrder(""); setEditing(null);
      qc.invalidateQueries({ queryKey: ["branches"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("branches").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["branches"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="mt-4 glass rounded-3xl p-4 gradient-border space-y-3">
      <h3 className="text-sm font-semibold">Branches</h3>
      <Row3
        name={name} setName={setName}
        sortOrder={sortOrder} setSortOrder={setSortOrder}
        editing={!!editing}
        onSave={() => save.mutate()}
        onCancel={() => { setEditing(null); setName(""); setSortOrder(""); }}
        saving={save.isPending}
        placeholder={editing ? "Edit branch" : "Add branch"}
      />
      <TaxList
        rows={rows}
        loading={isLoading}
        onEdit={(r) => { setEditing(r); setName(r.name); setSortOrder(String(r.sort_order)); }}
        onDelete={(r) =>
          confirm(
            `⚠ Delete branch "${r.name}"?\n\nAll its semesters, subjects and PDFs will keep this label as plain text but won't be reachable from the menu. This cannot be undone.`,
          ) && del.mutate(r.id)
        }
      />
    </section>
  );
}

/* ───────── Semesters admin (scoped to branch) ───────── */

type SemRow = { id: string; name: string; sort_order: number; branch: string | null };

function SemesterAdmin() {
  const qc = useQueryClient();
  const { data: branches = [] } = useBranches();
  const [filterBranch, setFilterBranch] = useState<string>("");
  const [name, setName] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [branch, setBranch] = useState<string>("");
  const [editing, setEditing] = useState<SemRow | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["sem-admin", filterBranch],
    queryFn: async () => {
      let q = supabase.from("semesters").select("id,name,sort_order,branch").order("sort_order").order("name");
      if (filterBranch) q = q.eq("branch", filterBranch);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as SemRow[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const n = name.trim();
      if (!n) throw new Error("Name required");
      const so = sortOrder.trim() ? parseInt(sortOrder, 10) : rows.length + 1;
      const payload = { name: n, sort_order: so, branch: branch || null };
      if (editing) {
        const { error } = await supabase.from("semesters").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("semesters").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Saved");
      setName(""); setSortOrder(""); setBranch(""); setEditing(null);
      qc.invalidateQueries({ queryKey: ["sem-admin"] });
      qc.invalidateQueries({ queryKey: ["semesters"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("semesters").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["sem-admin"] });
      qc.invalidateQueries({ queryKey: ["semesters"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="mt-4 glass rounded-3xl p-4 gradient-border space-y-3">
      <h3 className="text-sm font-semibold">Semesters</h3>

      <SelectField
        label="Filter by branch"
        value={filterBranch}
        options={["", ...branches.map((b) => b.name)]}
        labels={["All branches", ...branches.map((b) => b.name)]}
        onChange={setFilterBranch}
      />

      <div className="grid grid-cols-2 gap-3">
        <TextField label="Semester name" value={name} onChange={setName} placeholder="e.g. Sem 1" />
        <SelectField
          label="Branch (leave empty = all)"
          value={branch}
          options={["", ...branches.map((b) => b.name)]}
          labels={["All branches", ...branches.map((b) => b.name)]}
          onChange={setBranch}
        />
      </div>
      <div className="flex gap-2">
        <input
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          placeholder="Sort #"
          inputMode="numeric"
          className="w-24 glass rounded-2xl px-3 py-2.5 text-sm bg-transparent outline-none text-center placeholder:text-muted-foreground"
        />
        <button
          disabled={save.isPending}
          onClick={() => save.mutate()}
          className="flex-1 btn-brand rounded-2xl py-2.5 text-xs font-medium disabled:opacity-60"
        >
          {editing ? "Save changes" : "Add semester"}
        </button>
        {editing && (
          <button onClick={() => { setEditing(null); setName(""); setSortOrder(""); setBranch(""); }} className="rounded-2xl px-3 bg-white/5 border border-white/10" aria-label="Cancel">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6"><Loader2 className="h-4 w-4 animate-spin" /></div>
      ) : !rows.length ? (
        <p className="text-xs text-muted-foreground text-center py-4">No semesters.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
              <span className="text-[10px] text-muted-foreground w-6 text-center">{r.sort_order}</span>
              <span className="flex-1 text-sm truncate">
                {r.name}{" "}
                <span className="text-[10px] text-muted-foreground">· {r.branch ?? "all branches"}</span>
              </span>
              <button
                onClick={() => { setEditing(r); setName(r.name); setSortOrder(String(r.sort_order)); setBranch(r.branch ?? ""); }}
                className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center" aria-label="Edit"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => confirm(`Delete semester "${r.name}"? Existing PDFs keep this label.`) && del.mutate(r.id)}
                className="h-8 w-8 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center" aria-label="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ───────── Subjects admin ───────── */

type SubjRow = { id: string; name: string; branch: string; semester: string; sort_order: number };

function SubjectAdmin() {
  const qc = useQueryClient();
  const { data: branches = [] } = useBranches();
  const [filterBranch, setFilterBranch] = useState<string>("");
  const [filterSem, setFilterSem] = useState<string>("");
  const { data: filterSemList = [] } = useSemesters(filterBranch || undefined);

  const [name, setName] = useState("");
  const [branch, setBranch] = useState("");
  const [semester, setSemester] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [editing, setEditing] = useState<SubjRow | null>(null);
  const { data: formSemList = [] } = useSemesters(branch || undefined);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["subj-admin", filterBranch, filterSem],
    queryFn: async () => {
      let q = supabase.from("subjects").select("id,name,branch,semester,sort_order").order("branch").order("semester").order("sort_order").order("name");
      if (filterBranch) q = q.eq("branch", filterBranch);
      if (filterSem) q = q.eq("semester", filterSem);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as SubjRow[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const n = name.trim();
      if (!n || !branch || !semester) throw new Error("Name, branch and semester required");
      const so = sortOrder.trim() ? parseInt(sortOrder, 10) : 0;
      const payload = { name: n, branch, semester, sort_order: so };
      if (editing) {
        const { error } = await supabase.from("subjects").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("subjects").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Saved");
      setName(""); setSortOrder(""); setEditing(null);
      qc.invalidateQueries({ queryKey: ["subj-admin"] });
      qc.invalidateQueries({ queryKey: ["subjects"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("subjects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["subj-admin"] });
      qc.invalidateQueries({ queryKey: ["subjects"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="mt-4 glass rounded-3xl p-4 gradient-border space-y-3">
      <h3 className="text-sm font-semibold">Subjects</h3>

      <div className="grid grid-cols-2 gap-3">
        <SelectField
          label="Filter branch"
          value={filterBranch}
          options={["", ...branches.map((b) => b.name)]}
          labels={["All", ...branches.map((b) => b.name)]}
          onChange={(v) => { setFilterBranch(v); setFilterSem(""); }}
        />
        <SelectField
          label="Filter semester"
          value={filterSem}
          options={["", ...filterSemList.map((s) => s.name)]}
          labels={["All", ...filterSemList.map((s) => s.name)]}
          onChange={setFilterSem}
        />
      </div>

      <div className="border-t border-white/10 pt-3 space-y-3">
        <TextField label={editing ? "Edit subject" : "New subject name"} value={name} onChange={setName} placeholder="e.g. DLD" />
        <div className="grid grid-cols-2 gap-3">
          <SelectField
            label="Branch"
            value={branch}
            options={["", ...branches.map((b) => b.name)]}
            labels={["Pick…", ...branches.map((b) => b.name)]}
            onChange={(v) => { setBranch(v); setSemester(""); }}
          />
          <SelectField
            label="Semester"
            value={semester}
            options={["", ...formSemList.map((s) => s.name)]}
            labels={["Pick…", ...formSemList.map((s) => s.name)]}
            onChange={setSemester}
          />
        </div>
        <div className="flex gap-2">
          <input
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            placeholder="Sort #"
            inputMode="numeric"
            className="w-24 glass rounded-2xl px-3 py-2.5 text-sm bg-transparent outline-none text-center placeholder:text-muted-foreground"
          />
          <button
            disabled={save.isPending}
            onClick={() => save.mutate()}
            className="flex-1 btn-brand rounded-2xl py-2.5 text-xs font-medium disabled:opacity-60"
          >
            {editing ? "Save changes" : "Add subject"}
          </button>
          {editing && (
            <button onClick={() => { setEditing(null); setName(""); setSortOrder(""); }} className="rounded-2xl px-3 bg-white/5 border border-white/10" aria-label="Cancel">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6"><Loader2 className="h-4 w-4 animate-spin" /></div>
      ) : !rows.length ? (
        <p className="text-xs text-muted-foreground text-center py-4">No subjects yet.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate">{r.name}</div>
                <div className="text-[10px] text-muted-foreground">{r.branch} · {r.semester}</div>
              </div>
              <button
                onClick={() => { setEditing(r); setName(r.name); setBranch(r.branch); setSemester(r.semester); setSortOrder(String(r.sort_order)); }}
                className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center" aria-label="Edit"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => confirm(`Delete subject "${r.name}"? PDFs in this subject will keep the label but lose the link.`) && del.mutate(r.id)}
                className="h-8 w-8 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center" aria-label="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ───────── Notes / PDFs admin ───────── */

type NoteForm = {
  id?: string;
  title: string;
  branch: string;
  semester: string;
  subjectId: string;
  subjectName: string;
  materialType: MaterialType;
  description: string;
  pdf_url: string;
};

const emptyNote: NoteForm = {
  title: "", branch: "", semester: "", subjectId: "", subjectName: "",
  materialType: "notes", description: "", pdf_url: "",
};

function NotesAdmin() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: branches = [] } = useBranches();
  const [form, setForm] = useState<NoteForm | null>(null);

  const { data: semList = [] } = useSemesters(form?.branch || undefined);
  const { data: subjList = [] } = useSubjects(form?.branch || undefined, form?.semester || undefined);

  const { data: notes, isLoading } = useQuery({
    queryKey: ["admin-notes"],
    queryFn: () => fetchNotes(),
  });

  const save = useMutation({
    mutationFn: async (f: NoteForm) => {
      if (!f.title.trim() || !f.pdf_url.trim()) throw new Error("Title and PDF URL required");
      if (!f.branch || !f.semester || !f.subjectId) throw new Error("Branch, semester and subject required");
      const payload = {
        title: f.title.trim(),
        subject: f.subjectName,
        subject_id: f.subjectId,
        branch: f.branch,
        semester: f.semester,
        material_type: f.materialType,
        description: f.description.trim() || null,
        pdf_url: f.pdf_url.trim(),
      };
      if (f.id) {
        const { error } = await supabase.from("notes").update(payload).eq("id", f.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("notes").insert({ ...payload, uploaded_by: user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Saved");
      setForm(null);
      qc.invalidateQueries({ queryKey: ["admin-notes"] });
      qc.invalidateQueries({ queryKey: ["notes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-notes"] });
      qc.invalidateQueries({ queryKey: ["notes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const subjectOptions = useMemo(
    () => [{ id: "", name: "Pick subject…" }, ...subjList.map((s) => ({ id: s.id, name: s.name }))],
    [subjList],
  );

  return (
    <div className="mt-4 space-y-3">
      <button
        onClick={() => setForm(emptyNote)}
        className="btn-brand w-full rounded-2xl py-3 text-sm font-medium flex items-center justify-center gap-2"
      >
        <Plus className="h-4 w-4" /> Add new PDF
      </button>

      {form && (
        <div className="glass rounded-3xl p-4 gradient-border space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">{form.id ? "Edit PDF" : "New PDF"}</h3>
            <button onClick={() => setForm(null)} aria-label="Close"><X className="h-4 w-4" /></button>
          </div>
          <TextField label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
          <div className="grid grid-cols-2 gap-3">
            <SelectField
              label="Branch"
              value={form.branch}
              options={["", ...branches.map((b) => b.name)]}
              labels={["Pick…", ...branches.map((b) => b.name)]}
              onChange={(v) => setForm({ ...form, branch: v, semester: "", subjectId: "", subjectName: "" })}
            />
            <SelectField
              label="Semester"
              value={form.semester}
              options={["", ...semList.map((s) => s.name)]}
              labels={["Pick…", ...semList.map((s) => s.name)]}
              onChange={(v) => setForm({ ...form, semester: v, subjectId: "", subjectName: "" })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <SelectField
              label="Subject"
              value={form.subjectId}
              options={subjectOptions.map((s) => s.id)}
              labels={subjectOptions.map((s) => s.name)}
              onChange={(id) => {
                const s = subjectOptions.find((x) => x.id === id);
                setForm({ ...form, subjectId: id, subjectName: s?.name ?? "" });
              }}
            />
            <SelectField
              label="Material type"
              value={form.materialType}
              options={MATERIAL_TYPES.map((m) => m.value)}
              labels={MATERIAL_TYPES.map((m) => m.label)}
              onChange={(v) => setForm({ ...form, materialType: v as MaterialType })}
            />
          </div>
          <TextField label="PDF URL" placeholder="https://drive.google.com/…" value={form.pdf_url} onChange={(v) => setForm({ ...form, pdf_url: v })} />
          <TextArea label="Description (optional)" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
          <button
            disabled={save.isPending}
            onClick={() => save.mutate(form)}
            className="btn-brand w-full rounded-2xl py-3 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : !notes?.length ? (
        <div className="glass rounded-2xl p-6 text-center text-sm text-muted-foreground">No PDFs yet.</div>
      ) : (
        notes.map((n) => (
          <article key={n.id} className="glass rounded-2xl p-4 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{n.title}</div>
              <div className="text-xs text-muted-foreground truncate">
                {materialLabel(n.material_type)} · {n.subject} · {n.branch} · {n.semester}
              </div>
            </div>
            <button onClick={() => setForm(noteToForm(n))} className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center" aria-label="Edit">
              <Pencil className="h-4 w-4" />
            </button>
            <button onClick={() => confirm(`Delete PDF "${n.title}"? This cannot be undone.`) && del.mutate(n.id)} className="h-9 w-9 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center" aria-label="Delete">
              <Trash2 className="h-4 w-4" />
            </button>
          </article>
        ))
      )}
    </div>
  );
}

function noteToForm(n: Note): NoteForm {
  return {
    id: n.id,
    title: n.title,
    branch: n.branch,
    semester: n.semester,
    subjectId: n.subject_id ?? "",
    subjectName: n.subject,
    materialType: n.material_type,
    description: n.description ?? "",
    pdf_url: n.pdf_url ?? "",
  };
}

/* ───────── Exam admin ───────── */

type ExamForm = {
  id?: string;
  type: string;
  title: string;
  description: string;
  branch: string;
  semester: string;
  event_date: string;
  link: string;
};

const emptyExam: ExamForm = {
  type: "notice", title: "", description: "", branch: "", semester: "", event_date: "", link: "",
};

type ExamRow = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  branch: string | null;
  semester: string | null;
  event_date: string | null;
  link: string | null;
};

function ExamAdmin() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [form, setForm] = useState<ExamForm | null>(null);

  const { data: events, isLoading } = useQuery({
    queryKey: ["admin-exam"],
    queryFn: async () => {
      const { data, error } = await supabase.from("exam_events").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ExamRow[];
    },
  });

  const save = useMutation({
    mutationFn: async (f: ExamForm) => {
      if (!f.title.trim()) throw new Error("Title required");
      const payload = {
        type: f.type as "timetable" | "notice" | "important_date" | "result",
        title: f.title.trim(),
        description: f.description.trim() || null,
        branch: f.branch.trim() || null,
        semester: f.semester.trim() || null,
        event_date: f.event_date || null,
        link: f.link.trim() || null,
      };
      if (f.id) {
        const { error } = await supabase.from("exam_events").update(payload).eq("id", f.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("exam_events").insert({ ...payload, created_by: user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Saved");
      setForm(null);
      qc.invalidateQueries({ queryKey: ["admin-exam"] });
      qc.invalidateQueries({ queryKey: ["exam_events"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("exam_events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-exam"] });
      qc.invalidateQueries({ queryKey: ["exam_events"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mt-4 space-y-3">
      <button
        onClick={() => setForm(emptyExam)}
        className="btn-brand w-full rounded-2xl py-3 text-sm font-medium flex items-center justify-center gap-2"
      >
        <Plus className="h-4 w-4" /> Add new entry
      </button>

      {form && (
        <div className="glass rounded-3xl p-4 gradient-border space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">{form.id ? "Edit entry" : "New entry"}</h3>
            <button onClick={() => setForm(null)} aria-label="Close"><X className="h-4 w-4" /></button>
          </div>
          <SelectField
            label="Type"
            value={form.type}
            options={examTypes.map((t) => t.value)}
            labels={examTypes.map((t) => t.label)}
            onChange={(v) => setForm({ ...form, type: v })}
          />
          <TextField label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
          <TextArea label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Branch (optional)" value={form.branch} onChange={(v) => setForm({ ...form, branch: v })} />
            <TextField label="Semester (optional)" value={form.semester} onChange={(v) => setForm({ ...form, semester: v })} />
          </div>
          <TextField label="Date (YYYY-MM-DD, optional)" value={form.event_date} onChange={(v) => setForm({ ...form, event_date: v })} />
          <TextField label="Link (optional)" placeholder="https://…" value={form.link} onChange={(v) => setForm({ ...form, link: v })} />
          <button
            disabled={save.isPending}
            onClick={() => save.mutate(form)}
            className="btn-brand w-full rounded-2xl py-3 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : !events?.length ? (
        <div className="glass rounded-2xl p-6 text-center text-sm text-muted-foreground">No entries yet.</div>
      ) : (
        events.map((e) => (
          <article key={e.id} className="glass rounded-2xl p-4 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{e.type.replace("_", " ")}</div>
              <div className="text-sm font-semibold truncate">{e.title}</div>
              {e.event_date && <div className="text-xs text-muted-foreground">{new Date(e.event_date).toLocaleDateString()}</div>}
            </div>
            <button
              onClick={() => setForm({
                id: e.id, type: e.type, title: e.title,
                description: e.description ?? "", branch: e.branch ?? "", semester: e.semester ?? "",
                event_date: e.event_date ?? "", link: e.link ?? "",
              })}
              className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center" aria-label="Edit"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button onClick={() => confirm(`Delete entry "${e.title}"? This cannot be undone.`) && del.mutate(e.id)} className="h-9 w-9 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center" aria-label="Delete">
              <Trash2 className="h-4 w-4" />
            </button>
          </article>
        ))
      )}
    </div>
  );
}

/* ───────── Shared bits ───────── */

function Row3({
  name, setName, sortOrder, setSortOrder, editing, onSave, onCancel, saving, placeholder,
}: {
  name: string; setName: (v: string) => void;
  sortOrder: string; setSortOrder: (v: string) => void;
  editing: boolean; onSave: () => void; onCancel: () => void; saving: boolean; placeholder: string;
}) {
  return (
    <div className="flex gap-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={placeholder}
        className="flex-1 glass rounded-2xl px-3 py-2.5 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
      />
      <input
        value={sortOrder}
        onChange={(e) => setSortOrder(e.target.value)}
        placeholder="#"
        inputMode="numeric"
        className="w-14 glass rounded-2xl px-2 py-2.5 text-sm bg-transparent outline-none text-center placeholder:text-muted-foreground"
      />
      <button
        disabled={saving}
        onClick={onSave}
        className="btn-brand rounded-2xl px-4 text-xs font-medium disabled:opacity-60"
      >
        {editing ? "Save" : "Add"}
      </button>
      {editing && (
        <button onClick={onCancel} className="rounded-2xl px-2 bg-white/5 border border-white/10" aria-label="Cancel">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function TaxList({
  rows, loading, onEdit, onDelete,
}: { rows: TaxRow[]; loading: boolean; onEdit: (r: TaxRow) => void; onDelete: (r: TaxRow) => void }) {
  if (loading) return <div className="flex justify-center py-6"><Loader2 className="h-4 w-4 animate-spin" /></div>;
  if (!rows.length) return <p className="text-xs text-muted-foreground text-center py-4">None yet.</p>;
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.id} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
          <span className="text-[10px] text-muted-foreground w-6 text-center">{r.sort_order}</span>
          <span className="flex-1 text-sm truncate">{r.name}</span>
          <button onClick={() => onEdit(r)} className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center" aria-label="Edit">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => onDelete(r)} className="h-8 w-8 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center" aria-label="Delete">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </li>
      ))}
    </ul>
  );
}

function TextField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full glass rounded-2xl px-3 py-2.5 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
      />
    </label>
  );
}
function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <textarea
        value={value}
        rows={3}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full glass rounded-2xl px-3 py-2.5 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
      />
    </label>
  );
}
function SelectField({
  label, value, options, labels, onChange,
}: { label: string; value: string; options: string[]; labels?: string[]; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full glass rounded-2xl px-3 py-2.5 text-sm bg-transparent outline-none"
      >
        {options.map((o, i) => (
          <option key={`${o}-${i}`} value={o} className="bg-background">
            {labels?.[i] ?? o}
          </option>
        ))}
      </select>
    </label>
  );
}

/* ───────── Users / role management ───────── */

function UsersAdmin() {
  const qc = useQueryClient();
  const { user: currentUser } = useAuth();
  const fetchUsers = useServerFn(listUsers);
  const grantFn = useServerFn(grantRole);
  const revokeFn = useServerFn(revokeRole);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "admin" | "student">("all");
  const [confirm, setConfirm] = useState<
    | { action: "grant" | "revoke"; userId: string; email: string; role: "admin" }
    | null
  >(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => fetchUsers(),
  });

  const mutate = useMutation({
    mutationFn: async (c: NonNullable<typeof confirm>) => {
      if (c.action === "grant") await grantFn({ data: { userId: c.userId, role: c.role } });
      else await revokeFn({ data: { userId: c.userId, role: c.role } });
    },
    onSuccess: (_d, c) => {
      toast.success(c.action === "grant" ? "Admin access granted" : "Admin access removed");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-audit"] });
      qc.invalidateQueries({ queryKey: ["is-admin"] });
      setConfirm(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      const isAdmin = u.roles.includes("admin");
      if (filter === "admin" && !isAdmin) return false;
      if (filter === "student" && isAdmin) return false;
      if (!q) return true;
      return (
        (u.email ?? "").toLowerCase().includes(q) ||
        (u.full_name ?? "").toLowerCase().includes(q)
      );
    });
  }, [users, search, filter]);

  const adminCount = users.filter((u) => u.roles.includes("admin")).length;

  return (
    <div className="mt-4 space-y-3">
      <div className="glass rounded-2xl p-3 space-y-2">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email"
            className="flex-1 bg-transparent text-sm outline-none"
          />
        </div>
        <div className="flex gap-1">
          {(["all", "admin", "student"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-xl px-3 py-1.5 text-[11px] font-medium capitalize ${
                filter === f ? "btn-brand" : "text-muted-foreground glass"
              }`}
            >
              {f} {f === "admin" ? `(${adminCount})` : f === "all" ? `(${users.length})` : ""}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">No users found.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((u) => {
            const isAdmin = u.roles.includes("admin");
            const isMe = currentUser?.id === u.id;
            return (
              <div key={u.id} className="glass rounded-2xl p-3 gradient-border">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">
                      {u.full_name || "Unnamed"}
                      {isMe && <span className="ml-2 text-[10px] text-muted-foreground">(you)</span>}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                    <div className="text-[10px] text-muted-foreground mt-1">
                      Joined {new Date(u.created_at).toLocaleDateString()}
                      {u.last_sign_in_at && ` · Last seen ${new Date(u.last_sign_in_at).toLocaleDateString()}`}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      isAdmin ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                    }`}>
                      {isAdmin ? "Admin" : "Student"}
                    </span>
                    {isAdmin ? (
                      <button
                        disabled={isMe}
                        onClick={() => setConfirm({ action: "revoke", userId: u.id, email: u.email ?? "", role: "admin" })}
                        className="flex items-center gap-1 text-[11px] text-destructive disabled:opacity-40"
                      >
                        <UserMinus className="h-3 w-3" /> Remove admin
                      </button>
                    ) : (
                      <button
                        onClick={() => setConfirm({ action: "grant", userId: u.id, email: u.email ?? "", role: "admin" })}
                        className="flex items-center gap-1 text-[11px] text-primary"
                      >
                        <UserPlus className="h-3 w-3" /> Make admin
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.action === "grant" ? "Grant admin access?" : "Remove admin access?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.action === "grant"
                ? `${confirm?.email} will get full admin permissions, including managing branches, subjects, PDFs, and other users.`
                : `${confirm?.email} will lose admin access and become a regular student.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirm && mutate.mutate(confirm)}
              disabled={mutate.isPending}
            >
              {mutate.isPending ? "Saving…" : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ───────── Audit log ───────── */

function AuditLogPanel() {
  const fetchAudit = useServerFn(listAuditLog);
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["admin-audit"],
    queryFn: () => fetchAudit(),
  });

  if (isLoading)
    return <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin" /></div>;

  if (entries.length === 0)
    return <p className="text-center text-sm text-muted-foreground py-10">No activity yet.</p>;

  return (
    <div className="mt-4 space-y-2">
      {entries.map((e) => (
        <div key={e.id} className="glass rounded-2xl p-3 gradient-border">
          <div className="flex items-center gap-2 text-xs">
            <History className="h-3.5 w-3.5 text-muted-foreground" />
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
              e.action === "grant" ? "bg-primary/20 text-primary" : "bg-destructive/20 text-destructive"
            }`}>
              {e.action === "grant" ? "Granted" : "Revoked"}
            </span>
            <span className="text-muted-foreground">{e.role}</span>
          </div>
          <div className="mt-1.5 text-xs">
            <span className="font-medium">{e.actor_email ?? "system"}</span>
            <span className="text-muted-foreground"> {e.action === "grant" ? "→" : "✕"} </span>
            <span className="font-medium">{e.target_email ?? "(unknown)"}</span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">
            {new Date(e.created_at).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}
