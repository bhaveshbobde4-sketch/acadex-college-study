import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Download, Bookmark, FileText, Filter } from "lucide-react";
import { PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/notes")({
  head: () => ({
    meta: [
      { title: "Notes — Acadex" },
      { name: "description", content: "Branch and semester-wise engineering notes with PDF viewer and offline access." },
    ],
  }),
  component: NotesPage,
});

const branches = ["CSE", "ECE", "ME", "EE", "CE", "IT"];
const semesters = ["Sem 1", "Sem 2", "Sem 3", "Sem 4", "Sem 5", "Sem 6", "Sem 7", "Sem 8"];

const notes = [
  { title: "Data Structures — Complete", subject: "DSA", size: "3.2 MB", dl: "15.2k", hot: true },
  { title: "Operating Systems Handbook", subject: "OS", size: "5.1 MB", dl: "11.8k", hot: true },
  { title: "DBMS Notes — Normalization", subject: "DBMS", size: "1.8 MB", dl: "9.4k" },
  { title: "Computer Networks Quick Revision", subject: "CN", size: "2.4 MB", dl: "8.9k" },
  { title: "Discrete Mathematics", subject: "MA", size: "4.0 MB", dl: "6.2k" },
];

function NotesPage() {
  const [branch, setBranch] = useState("CSE");
  const [sem, setSem] = useState("Sem 5");

  return (
    <PageShell title="Notes" subtitle="Library">
      <div className="glass rounded-2xl flex items-center gap-2 px-3 py-2.5">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          placeholder="Search subjects, topics, authors…"
          className="bg-transparent outline-none text-sm flex-1 placeholder:text-muted-foreground"
        />
        <button className="text-muted-foreground" aria-label="Filters">
          <Filter className="h-4 w-4" />
        </button>
      </div>

      <Chips label="Branch" items={branches} value={branch} onChange={setBranch} />
      <Chips label="Semester" items={semesters} value={sem} onChange={setSem} />

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-muted-foreground mb-2">Most downloaded</h2>
        <div className="space-y-3">
          {notes.map((n) => (
            <article key={n.title} className="glass rounded-2xl p-4 flex items-center gap-3 gradient-border">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500/30 to-sky-500/30 flex items-center justify-center">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold truncate">{n.title}</h3>
                  {n.hot && (
                    <span className="text-[10px] uppercase rounded-full px-2 py-0.5 bg-gradient-to-r from-violet-500/30 to-sky-500/30 border border-white/10">
                      Hot
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {n.subject} · {branch} · {sem} · {n.size} · {n.dl} downloads
                </div>
              </div>
              <button className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center" aria-label="Save">
                <Bookmark className="h-4 w-4" />
              </button>
              <button className="h-9 w-9 rounded-xl btn-brand flex items-center justify-center" aria-label="Download">
                <Download className="h-4 w-4" />
              </button>
            </article>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

function Chips({
  label, items, value, onChange,
}: { label: string; items: string[]; value: string; onChange: (v: string) => void }) {
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
                active
                  ? "btn-brand border-transparent"
                  : "bg-white/5 border-white/10 text-muted-foreground hover:text-foreground"
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
