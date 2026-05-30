import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { fetchNoteById, noteDisplayUrl, logDownload } from "@/lib/notes-api";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/notes/$id")({
  head: () => ({ meta: [{ title: "Note viewer — Acadex" }] }),
  component: NoteViewer,
});

function NoteViewer() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const { data: note, isLoading } = useQuery({
    queryKey: ["note", id],
    queryFn: () => fetchNoteById(id),
  });

  if (isLoading)
    return (
      <PageShell title="Loading">
        <div className="flex justify-center py-20"><Loader2 className="h-5 w-5 animate-spin" /></div>
      </PageShell>
    );
  if (!note)
    return (
      <PageShell title="Not found">
        <div className="glass rounded-3xl p-8 text-center">
          <p className="text-sm">This note doesn't exist.</p>
          <Link to="/notes" className="btn-brand inline-flex mt-3 rounded-xl px-4 py-2 text-xs">Back to notes</Link>
        </div>
      </PageShell>
    );

  const url = noteDisplayUrl(note);

  return (
    <PageShell
      title={note.title}
      subtitle={`${note.subject} · ${note.branch} · ${note.semester}`}
      right={
        <Link to="/notes" aria-label="Back" className="glass rounded-full h-9 w-9 flex items-center justify-center">
          <ArrowLeft className="h-4 w-4" />
        </Link>
      }
    >
      {url ? (
        <div className="glass rounded-3xl overflow-hidden gradient-border" style={{ height: "70vh" }}>
          <iframe src={`${url}#toolbar=0`} title={note.title} className="w-full h-full bg-white" />
        </div>
      ) : (
        <div className="glass rounded-3xl p-8 text-center text-sm text-muted-foreground">
          No PDF link attached yet.
        </div>
      )}
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener"
          onClick={() => logDownload(note.id, user?.id ?? null)}
          className="btn-brand mt-4 w-full rounded-2xl py-3 text-sm font-medium flex items-center justify-center gap-2"
        >
          <Download className="h-4 w-4" /> Open / Download PDF
        </a>
      )}
    </PageShell>
  );
}
