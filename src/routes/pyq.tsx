import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download, Star, FileText } from "lucide-react";
import { PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/pyq")({
  head: () => ({
    meta: [
      { title: "Previous Year Questions — Acadex" },
      { name: "description", content: "Year, subject and university-wise previous year question papers with important repeated questions." },
    ],
  }),
  component: PYQPage,
});

const years = ["2024", "2023", "2022", "2021", "2020"];
const subjects = ["All", "DSA", "OS", "DBMS", "CN", "TOC"];
const universities = ["AKTU", "VTU", "Anna", "Pune", "MAKAUT"];

const papers = [
  { subject: "Operating Systems", year: "2024", uni: "AKTU", size: "1.1 MB" },
  { subject: "DBMS", year: "2024", uni: "AKTU", size: "0.9 MB" },
  { subject: "Computer Networks", year: "2023", uni: "AKTU", size: "1.4 MB" },
  { subject: "Theory of Computation", year: "2023", uni: "AKTU", size: "1.0 MB" },
];

const repeated = [
  "Explain process scheduling algorithms with examples. (Asked 6 times)",
  "Normalization up to BCNF — derive with example. (Asked 5 times)",
  "TCP vs UDP — detailed comparison. (Asked 4 times)",
];

function PYQPage() {
  const [year, setYear] = useState("2024");
  const [subject, setSubject] = useState("All");
  const [uni, setUni] = useState("AKTU");

  return (
    <PageShell title="PYQs" subtitle="Previous Years">
      <Row items={years} value={year} onChange={setYear} />
      <Row items={subjects} value={subject} onChange={setSubject} />
      <Row items={universities} value={uni} onChange={setUni} />

      <section className="mt-6 space-y-3">
        {papers.map((p) => (
          <article key={p.subject + p.year} className="glass rounded-2xl p-4 flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-sky-500/30 to-violet-500/30 flex items-center justify-center">
              <FileText className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold truncate">{p.subject}</h3>
              <div className="text-xs text-muted-foreground">{p.uni} · {p.year} · {p.size}</div>
            </div>
            <button className="h-9 w-9 rounded-xl btn-brand flex items-center justify-center" aria-label="Download">
              <Download className="h-4 w-4" />
            </button>
          </article>
        ))}
      </section>

      <section className="mt-7 glass-strong rounded-3xl p-5 gradient-border">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-amber-300" />
          <h2 className="text-sm font-semibold">Important repeated questions</h2>
        </div>
        <ul className="mt-3 space-y-2">
          {repeated.map((q) => (
            <li key={q} className="text-sm text-foreground/90 leading-relaxed pl-3 border-l-2 border-[var(--brand)]/60">
              {q}
            </li>
          ))}
        </ul>
      </section>
    </PageShell>
  );
}

function Row({ items, value, onChange }: { items: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="-mx-4 px-4 mt-3 flex gap-2 overflow-x-auto">
      {items.map((i) => {
        const active = i === value;
        return (
          <button
            key={i}
            onClick={() => onChange(i)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium border transition-all ${
              active ? "btn-brand border-transparent" : "bg-white/5 border-white/10 text-muted-foreground"
            }`}
          >
            {i}
          </button>
        );
      })}
    </div>
  );
}
