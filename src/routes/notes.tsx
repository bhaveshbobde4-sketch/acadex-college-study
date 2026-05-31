import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Download, Bookmark, FileText, Filter, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";
import { fetchNotes, logDownload, noteDisplayUrl, fetchMySavedIds, toggleSave, type Note } from "@/lib/notes-api";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/use-admin";
import { useBranches, useSemesters } from "@/hooks/use-taxonomy";

export const Route = createFileRoute("/notes")({
  head: () => ({
    meta: [
      { title: "Notes — Acadex" },
      { name: "description", content: "Branch and semester-wise engineering notes with PDF viewer and offline access." },
    ],
  }),
  component: NotesPage,
});

function NotesPage() {
  const { data: branches = [] } = useBranches();
  const { data: semesters = [] } = useSemesters();
  const [branch, setBranch] = useState("");
  const [sem, setSem] = useState("");
  const [search, setSearch] = useState("");
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const qc = useQueryClient();

  useEffect(() => { if (!branch && branches.length) setBranch(branches[0].name); }, [branches, branch]);
  useEffect(() => { if (!sem && semesters.length) setSem(semesters[0].name); }, [semesters, sem]);

  const { data: notes, isLoading } = useQuery({
    queryKey: ["notes", branch, sem, search],
    enabled: !!branch && !!sem,
    queryFn: () => fetchNotes({ branch, semester: sem, search: search.trim() || undefined }),
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
    <PageShell
      title="Notes"
      subtitle="Library"
      right={
        isAdmin ? (
          <Link to="/admin" aria-label="Admin" className="btn-brand h-9 w-9 rounded-full flex items-center justify-center">
            <Plus className="h-4 w-4" />
          </Link>
        ) : null
      }
    >
      <div className="glass rounded-2xl flex items-center gap-2 px-3 py-2.5">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search subjects, topics…"
          className="bg-transparent outline-none text-sm flex-1 placeholder:text-muted-foreground"
        />
        <button className="text-muted-foreground" aria-label="Filters">
          <Filter className="h-4 w-4" />
        </button>
      </div>

      <Chips label="Branch" items={branches.map((b) => b.name)} value={branch} onChange={setBranch} />
      <Chips label="Semester" items={semesters.map((s) => s.name)} value={sem} onChange={setSem} />

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-muted-foreground mb-2">
          {search ? "Search results" : "Most downloaded"}
        </h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : !notes || notes.length === 0 ? (
          <EmptyState
            title="No notes yet"
            body={
              isAdmin
                ? `No notes for ${branch} · ${sem} yet. Add one from the Admin Panel.`
                : `No notes for ${branch} · ${sem} yet. Check back soon!`
            }
            cta={
              isAdmin ? (
                <Link to="/admin" className="btn-brand inline-flex rounded-xl px-4 py-2 text-xs font-medium mt-3">Open Admin</Link>
              ) : !user ? (
                <Link to="/login" className="btn-brand inline-flex rounded-xl px-4 py-2 text-xs font-medium mt-3">Sign in</Link>
              ) : null
            }
          />
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
                        {n.subject} · {n.branch} · {n.semester}
                        {n.file_size_kb ? ` · ${(n.file_size_kb / 1024).toFixed(1)} MB` : ""} · {n.downloads} ↓
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
    </PageShell>
  );
}

function Chips({ label, items, value, onChange }: { label: string; items: string[]; value: string; onChange: (v: string) => void; }) {
  return (
    <div className="mt-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{label}</div>
      <div className="-mx-4 px-4 flex gap-2 overflow-x-auto pb-1">
        {items.map((i) => {
          const active = i === value;
          return (
            <button
              key={i}
              onClick={() => onChange(i)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium border transition-all ${
                active ? "btn-brand border-transparent" : "bg-white/5 border-white/10 text-muted-foreground hover:text-foreground"
              }`}
            >
              {i}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EmptyState({ title, body, cta }: { title: string; body: string; cta?: React.ReactNode }) {
  return (
    <div className="glass rounded-3xl p-8 text-center gradient-border">
      <div className="text-2xl mb-1">📚</div>
      <div className="text-sm font-semibold">{title}</div>
      <p className="text-xs text-muted-foreground mt-1">{body}</p>
      {cta}
    </div>
  );
}
