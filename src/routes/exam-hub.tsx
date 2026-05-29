import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Bell, FileCheck, ExternalLink, ClipboardList } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { supabase } from "@/integrations/supabase/client";

type ExamType = "timetable" | "notice" | "important_date" | "result";

type ExamEvent = {
  id: string;
  type: ExamType;
  title: string;
  description: string | null;
  branch: string | null;
  semester: string | null;
  event_date: string | null;
  link: string | null;
};

export const Route = createFileRoute("/exam-hub")({
  head: () => ({
    meta: [
      { title: "Exam Hub — Acadex" },
      { name: "description", content: "Exam timetables, notices, important dates and result links." },
    ],
  }),
  component: ExamHubPage,
  errorComponent: ({ error }) => (
    <PageShell title="Exam Hub">
      <div className="glass rounded-2xl p-6 text-sm text-muted-foreground">
        Could not load exam hub: {error.message}
      </div>
    </PageShell>
  ),
});

const SECTIONS: { type: ExamType; title: string; icon: typeof Calendar; emptyText: string }[] = [
  { type: "timetable", title: "Exam Timetable", icon: Calendar, emptyText: "No timetables posted yet." },
  { type: "notice", title: "Notices", icon: Bell, emptyText: "No notices right now." },
  { type: "important_date", title: "Important Dates", icon: ClipboardList, emptyText: "No important dates added." },
  { type: "result", title: "Results", icon: FileCheck, emptyText: "No result links yet." },
];

function ExamHubPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["exam_events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_events")
        .select("*")
        .order("event_date", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as ExamEvent[];
    },
  });

  return (
    <PageShell title="Exam Hub" subtitle="Academics">
      {SECTIONS.map(({ type, title, icon: Icon, emptyText }) => {
        const items = data?.filter((e) => e.type === type) ?? [];
        return (
          <section key={type} className="mt-6 first:mt-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500/30 to-sky-500/30 flex items-center justify-center">
                <Icon className="h-4 w-4" />
              </div>
              <h2 className="text-base font-semibold">{title}</h2>
            </div>
            {isLoading ? (
              <div className="glass rounded-2xl p-4 animate-pulse h-20" />
            ) : items.length === 0 ? (
              <div className="glass rounded-2xl p-4 text-xs text-muted-foreground">{emptyText}</div>
            ) : (
              <div className="space-y-2">
                {items.map((e) => (
                  <article key={e.id} className="glass rounded-2xl p-4 gradient-border">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold">{e.title}</h3>
                        {e.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{e.description}</p>
                        )}
                        <div className="text-[11px] text-muted-foreground mt-2 flex flex-wrap gap-2">
                          {e.event_date && <span>📅 {new Date(e.event_date).toLocaleDateString()}</span>}
                          {e.branch && <span>· {e.branch}</span>}
                          {e.semester && <span>· {e.semester}</span>}
                        </div>
                      </div>
                      {e.link && (
                        <a
                          href={e.link}
                          target="_blank"
                          rel="noreferrer"
                          className="shrink-0 h-9 w-9 rounded-xl btn-brand flex items-center justify-center"
                          aria-label="Open link"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </PageShell>
  );
}
