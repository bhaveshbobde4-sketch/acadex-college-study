import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Trash2, Pencil, Plus, X, ShieldCheck } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/use-admin";
import { fetchNotes, type Note } from "@/lib/notes-api";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Acadex" }] }),
  component: AdminPage,
});

const branches = ["CSE", "ECE", "ME", "EE", "CE", "IT"];
const semesters = ["Sem 1", "Sem 2", "Sem 3", "Sem 4", "Sem 5", "Sem 6", "Sem 7", "Sem 8"];
const examTypes = [
  { value: "timetable", label: "Timetable" },
  { value: "notice", label: "Notice" },
  { value: "important_date", label: "Important date" },
  { value: "result", label: "Result link" },
];

function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"notes" | "exam">("notes");

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
          <p className="text-xs text-muted-foreground mt-2">
            Ask the project owner to grant your account the <code>admin</code> role.
          </p>
          <Link to="/" className="btn-brand inline-flex mt-4 rounded-xl px-4 py-2 text-xs font-medium">Go home</Link>
        </div>
      </PageShell>
    );

  return (
    <PageShell title="Admin Panel" subtitle="Manage content">
      <div className="glass rounded-2xl p-1 flex gap-1">
        {(["notes", "exam"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-xl py-2 text-xs font-medium ${tab === t ? "btn-brand" : "text-muted-foreground"}`}
          >
            {t === "notes" ? "Notes / PDFs" : "Exam Hub"}
          </button>
        ))}
      </div>

      {tab === "notes" ? <NotesAdmin /> : <ExamAdmin />}
    </PageShell>
  );
}

/* ───────── Notes admin ───────── */

type NoteForm = {
  id?: string;
  title: string;
  subject: string;
  branch: string;
  semester: string;
  description: string;
  pdf_url: string;
};

const emptyNote: NoteForm = {
  title: "", subject: "", branch: "CSE", semester: "Sem 1", description: "", pdf_url: "",
};

function NotesAdmin() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [form, setForm] = useState<NoteForm | null>(null);

  const { data: notes, isLoading } = useQuery({
    queryKey: ["admin-notes"],
    queryFn: () => fetchNotes(),
  });

  const save = useMutation({
    mutationFn: async (f: NoteForm) => {
      if (!f.title.trim() || !f.subject.trim() || !f.pdf_url.trim()) {
        throw new Error("Title, subject and PDF URL are required");
      }
      const payload = {
        title: f.title.trim(),
        subject: f.subject.trim(),
        branch: f.branch,
        semester: f.semester,
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
            <h3 className="text-sm font-semibold">{form.id ? "Edit note" : "New note"}</h3>
            <button onClick={() => setForm(null)} aria-label="Close"><X className="h-4 w-4" /></button>
          </div>
          <TextField label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
          <TextField label="Subject" value={form.subject} onChange={(v) => setForm({ ...form, subject: v })} />
          <div className="grid grid-cols-2 gap-3">
            <SelectField label="Branch" value={form.branch} options={branches} onChange={(v) => setForm({ ...form, branch: v })} />
            <SelectField label="Semester" value={form.semester} options={semesters} onChange={(v) => setForm({ ...form, semester: v })} />
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
        <div className="glass rounded-2xl p-6 text-center text-sm text-muted-foreground">No notes yet.</div>
      ) : (
        notes.map((n) => (
          <article key={n.id} className="glass rounded-2xl p-4 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{n.title}</div>
              <div className="text-xs text-muted-foreground truncate">{n.subject} · {n.branch} · {n.semester}</div>
            </div>
            <button onClick={() => setForm(noteToForm(n))} className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center" aria-label="Edit">
              <Pencil className="h-4 w-4" />
            </button>
            <button onClick={() => confirm("Delete this note?") && del.mutate(n.id)} className="h-9 w-9 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center" aria-label="Delete">
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
    subject: n.subject,
    branch: n.branch,
    semester: n.semester,
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
          <SelectField label="Type" value={form.type} options={examTypes.map((t) => t.value)} onChange={(v) => setForm({ ...form, type: v })} />
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
            <button onClick={() => confirm("Delete this entry?") && del.mutate(e.id)} className="h-9 w-9 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center" aria-label="Delete">
              <Trash2 className="h-4 w-4" />
            </button>
          </article>
        ))
      )}
    </div>
  );
}

/* ───────── Tiny inputs ───────── */

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
function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full glass rounded-2xl px-3 py-2.5 text-sm bg-transparent outline-none"
      >
        {options.map((o) => <option key={o} value={o} className="bg-background">{o}</option>)}
      </select>
    </label>
  );
}
