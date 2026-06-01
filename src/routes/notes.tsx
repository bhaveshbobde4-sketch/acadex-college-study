import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search, Download, Bookmark, FileText, Loader2, Plus, ChevronRight, ArrowLeft, FolderOpen,
} from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";
import {
  fetchNotes, logDownload, noteDisplayUrl, fetchMySavedIds, toggleSave, type Note,
} from "@/lib/notes-api";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/use-admin";
import { useBranches, useSemesters, useSubjects } from "@/hooks/use-taxonomy";
import { MATERIAL_TYPES, materialLabel, type MaterialType } from "@/lib/taxonomy-api";

export const Route = createFileRoute("/notes")({
  head: () => ({
    meta: [
      { title: "Notes — Acadex" },
      { name: "description", content: "Branch, semester and subject-wise engineering study materials." },
    ],
  }),
  component: NotesPage,
});

type Step = "branch" | "semester" | "subject" | "material" | "list";

function NotesPage() {
  const { isAdmin } = useIsAdmin();
  const [branch, setBranch] = useState<string | null>(null);
  const [semester, setSemester] = useState<string | null>(null);
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [subjectName, setSubjectName] = useState<string | null>(null);
  const [material, setMaterial] = useState<MaterialType | null>(null);
  const [search, setSearch] = useState("");

  const step: Step = search.trim()
    ? "list"
    : !branch ? "branch"
    : !semester ? "semester"
    : !subjectId ? "subject"
    : !material ? "material"
    : "list";

  const goBack = () => {
    if (search.trim()) return setSearch("");
    if (material) return setMaterial(null);
    if (subjectId) { setSubjectId(null); setSubjectName(null); return; }
    if (semester) return setSemester(null);
    if (branch) return setBranch(null);
  };

  const subtitleParts = [branch, semester, subjectName, material && materialLabel(material)].filter(Boolean);
  const subtitle = subtitleParts.length ? subtitleParts.join(" · ") : "Library";

  return (
    <PageShell
      title="Notes"
      subtitle={subtitle}
      right={
        <div className="flex items-center gap-2">
          {(branch || search) && (
            <button onClick={goBack} aria-label="Back" className="glass rounded-full h-9 w-9 flex items-center justify-center">
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          {isAdmin && (
            <Link to="/admin" aria-label="Admin" className="btn-brand h-9 w-9 rounded-full flex items-center justify-center">
              <Plus className="h-4 w-4" />
            </Link>
          )}
        </div>
      }
    >
      <div className="glass rounded-2xl flex items-center gap-2 px-3 py-2.5">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search across all notes…"
          className="bg-transparent outline-none text-sm flex-1 placeholder:text-muted-foreground"
        />
      </div>

      {step === "branch" && <BranchPicker onPick={setBranch} />}
      {step === "semester" && branch && (
        <SemesterPicker branch={branch} onPick={setSemester} />
      )}
      {step === "subject" && branch && semester && (
        <SubjectPicker
          branch={branch}
          semester={semester}
          onPick={(s) => { setSubjectId(s.id); setSubjectName(s.name); }}
        />
      )}
      {step === "material" && <MaterialPicker onPick={setMaterial} />}
      {step === "list" && (
        <NotesList
          filters={{
            branch: branch ?? undefined,
            semester: semester ?? undefined,
            subjectId: subjectId ?? undefined,
            materialType: material ?? undefined,
            search: search.trim() || undefined,
          }}
          isAdmin={isAdmin}
        />
      )}
    </PageShell>
  );
}

/* ───────── Drill-down pickers ───────── */

function BranchPicker({ onPick }: { onPick: (v: string) => void }) {
  const { data = [], isLoading } = useBranches();
  return (
    <Section title="Choose your branch" loading={isLoading} empty={!data.length} emptyText="No branches yet.">
      <div className="grid grid-cols-2 gap-3">
        {data.map((b) => (
          <PickCard key={b.id} label={b.name} onClick={() => onPick(b.name)} />
        ))}
      </div>
    </Section>
  );
}

function SemesterPicker({ branch, onPick }: { branch: string; onPick: (v: string) => void }) {
  const { data = [], isLoading } = useSemesters(branch);
  return (
    <Section title={`${branch} · Choose semester`} loading={isLoading} empty={!data.length} emptyText="No semesters yet.">
      <div className="grid grid-cols-2 gap-3">
        {data.map((s) => (
          <PickCard key={s.id} label={s.name} onClick={() => onPick(s.name)} />
        ))}
      </div>
    </Section>
  );
}

function SubjectPicker({
  branch, semester, onPick,
}: { branch: string; semester: string; onPick: (s: { id: string; name: string }) => void }) {
  const { data = [], isLoading } = useSubjects(branch, semester);
  return (
    <Section title={`${semester} · Choose subject`} loading={isLoading} empty={!data.length} emptyText="No subjects added for this branch & semester.">
      <div className="space-y-2">
        {data.map((s) => (
          <button
            key={s.id}
            onClick={() => onPick({ id: s.id, name: s.name })}
            className="w-full glass rounded-2xl p-4 flex items-center gap-3 hover:bg-white/[0.08]"
          >
            <span className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500/30 to-sky-500/30 flex items-center justify-center">
              <FolderOpen className="h-5 w-5" />
            </span>
            <span className="flex-1 text-left text-sm font-semibold">{s.name}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </div>
    </Section>
  );
}

function MaterialPicker({ onPick }: { onPick: (v: MaterialType) => void }) {
  return (
    <Section title="Material type">
      <div className="grid grid-cols-2 gap-3">
        {MATERIAL_TYPES.map((m) => (
          <PickCard key={m.value} label={m.label} onClick={() => onPick(m.value)} />
        ))}
      </div>
    </Section>
  );
}

function PickCard({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="glass rounded-2xl p-4 text-left hover:bg-white/[0.08] gradient-border"
    >
      <div className="text-sm font-semibold">{label}</div>
      <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
        Open <ChevronRight className="h-3 w-3" />
      </div>
    </button>
  );
}

function Section({
  title, children, loading, empty, emptyText,
}: { title: string; children: React.ReactNode; loading?: boolean; empty?: boolean; emptyText?: string }) {
  return (
    <section className="mt-6">
      <h2 className="text-sm font-semibold text-muted-foreground mb-3">{title}</h2>
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : empty ? (
        <div className="glass rounded-3xl p-6 text-center text-xs text-muted-foreground gradient-border">
          {emptyText ?? "Nothing here yet."}
        </div>
      ) : children}
    </section>
  );
}

/* ───────── PDF list ───────── */

function NotesList({
  filters, isAdmin,
}: { filters: Parameters<typeof fetchNotes>[0]; isAdmin: boolean }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const queryKey = useMemo(() => ["notes", filters], [filters]);
  const { data: notes, isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchNotes(filters),
  });
  const { data: savedIds } = useQuery({
    queryKey: ["saved-ids", user?.id ?? "anon"],
    queryFn: fetchMySavedIds,
    enabled: !!user,
  });

  const saveMut = useMutation({
    mutationFn: ({ id, saved }: { id: string; saved: boolean }) => toggleSave(id, saved),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved-ids"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const handleDownload = async (note: Note) => {
    const url = noteDisplayUrl(note);
    if (!url) { toast.error("No PDF link"); return; }
    try {
      await logDownload(note.id, user?.id ?? null);
      window.open(url, "_blank", "noopener");
      toast.success(`Opening ${note.title}`);
    } catch {
      toast.error("Could not open file");
    }
  };

  return (
    <section className="mt-6">
      <h2 className="text-sm font-semibold text-muted-foreground mb-2">
        {filters.search ? "Search results" : "PDFs"}
      </h2>
      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : !notes || notes.length === 0 ? (
        <div className="glass rounded-3xl p-8 text-center gradient-border">
          <div className="text-2xl mb-1">📚</div>
          <div className="text-sm font-semibold">No PDFs yet</div>
          <p className="text-xs text-muted-foreground mt-1">
            {isAdmin ? "Add one from the Admin Panel." : "Check back soon!"}
          </p>
          {isAdmin && (
            <Link to="/admin" className="btn-brand inline-flex rounded-xl px-4 py-2 text-xs font-medium mt-3">
              Open Admin
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((n) => {
            const saved = savedIds?.has(n.id) ?? false;
            return (
              <article key={n.id} className="glass rounded-2xl p-4 flex items-center gap-3 gradient-border">
                <Link
                  to="/notes/$id"
                  params={{ id: n.id }}
                  className="flex-1 flex items-center gap-3 min-w-0"
                >
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500/30 to-sky-500/30 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold truncate">{n.title}</h3>
                      {n.is_hot && (
                        <span className="text-[10px] uppercase rounded-full px-2 py-0.5 bg-gradient-to-r from-violet-500/30 to-sky-500/30 border border-white/10">
                          Hot
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 truncate">
                      {materialLabel(n.material_type)} · {n.subject} · {n.branch} · {n.semester} · {n.downloads} ↓
                    </div>
                  </div>
                </Link>
                <button
                  onClick={() => user ? saveMut.mutate({ id: n.id, saved }) : toast.error("Sign in to save")}
                  className={`h-9 w-9 rounded-xl border flex items-center justify-center shrink-0 ${saved ? "btn-brand border-transparent" : "bg-white/5 border-white/10"}`}
                  aria-label="Save"
                >
                  <Bookmark className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
                </button>
                <button
                  onClick={() => handleDownload(n)}
                  className="h-9 w-9 rounded-xl btn-brand flex items-center justify-center shrink-0"
                  aria-label="Download"
                >
                  <Download className="h-4 w-4" />
                </button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
