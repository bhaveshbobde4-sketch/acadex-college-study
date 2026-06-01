import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Flame, BookOpen, FileText, Sparkles, Calendar, ChevronRight,
  Timer, Calculator, TrendingUp, GraduationCap,
} from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { fetchTrendingNotes } from "@/lib/notes-api";
import { useDisplayName } from "@/hooks/use-display-name";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Acadex — Home" },
      { name: "description", content: "Your daily study dashboard: streaks, trending notes, upcoming exams and quick tools." },
    ],
  }),
  component: HomePage,
});


const quick = [
  { to: "/tools", label: "Pomodoro", icon: Timer },
  { to: "/tools", label: "CGPA", icon: Calculator },
  { to: "/exam-hub", label: "Exam Hub", icon: Calendar },
  { to: "/ai", label: "AI Tutor", icon: Sparkles },
] as const;

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function HomePage() {
  const { firstName } = useDisplayName();
  const { user } = useAuth();
  const { data: stats } = useQuery({
    queryKey: ["home-stats", user?.id ?? "anon"],
    enabled: !!user,
    queryFn: async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
      const [dl, saved] = await Promise.all([
        supabase
          .from("note_downloads")
          .select("downloaded_at", { count: "exact", head: true })
          .eq("user_id", user!.id)
          .gte("downloaded_at", sevenDaysAgo),
        supabase
          .from("saved_notes")
          .select("note_id", { count: "exact", head: true })
          .eq("user_id", user!.id),
      ]);
      return { weekly: dl.count ?? 0, saved: saved.count ?? 0 };
    },
  });

  return (
    <PageShell>
      {/* Welcome banner */}
      <section className="relative overflow-hidden rounded-3xl p-6 glass gradient-border">
        <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-[var(--brand)] opacity-30 blur-3xl" />
        <div className="absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-[var(--brand-2)] opacity-25 blur-3xl" />
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{greeting()}</p>
        <h1 className="mt-1 text-2xl font-semibold">
          Hey {firstName}, <span className="gradient-text">let's keep it going.</span>
        </h1>

        <div className="mt-5 flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-2xl bg-white/5 px-3 py-2 border border-white/10">
            <Flame className="h-5 w-5 text-orange-400" />
            <div>
              <div className="text-sm font-semibold leading-none">{stats?.saved ?? 0} saved</div>
              <div className="text-[11px] text-muted-foreground">your library</div>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-white/5 px-3 py-2 border border-white/10">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
            <div>
              <div className="text-sm font-semibold leading-none">{stats?.weekly ?? 0} this week</div>
              <div className="text-[11px] text-muted-foreground">PDFs opened</div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick access */}
      <section className="mt-6 grid grid-cols-4 gap-3">
        {quick.map(({ to, label, icon: Icon }) => (
          <Link
            key={label}
            to={to}
            className="glass rounded-2xl p-3 flex flex-col items-center gap-2 hover:bg-white/[0.08] transition-colors"
          >
            <span className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500/30 to-sky-500/30 flex items-center justify-center">
              <Icon className="h-5 w-5" />
            </span>
            <span className="text-[11px] text-muted-foreground">{label}</span>
          </Link>
        ))}
      </section>

      {/* Continue studying */}
      <section className="mt-7">
        <SectionHeader title="Continue studying" to="/notes" />
        <Link to="/notes" className="block mt-3 glass rounded-3xl p-4 gradient-border">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500/40 to-sky-500/30 flex items-center justify-center">
              <BookOpen className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">Computer Networks — Unit 3</div>
              <div className="text-xs text-muted-foreground">Page 42 of 78 · 12 min left</div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                <div className="h-full w-[54%] rounded-full bg-gradient-to-r from-violet-400 to-sky-400" />
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </Link>
      </section>

      {/* Trending notes */}
      <TrendingSection />


      {/* Upcoming exams */}
      <section className="mt-7">
        <SectionHeader title="Upcoming exams" to="/tools" />
        <div className="mt-3 space-y-2">
          {upcoming.map((e) => (
            <div key={e.code} className="glass rounded-2xl p-4 flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-[var(--brand-2)]" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold">{e.name}</div>
                <div className="text-xs text-muted-foreground">{e.code} · {e.date}</div>
              </div>
              <GraduationCap className="h-5 w-5 text-muted-foreground" />
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

function SectionHeader({ title, to }: { title: string; to: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-base font-semibold">{title}</h2>
      <Link to={to} className="text-xs text-muted-foreground inline-flex items-center gap-1">
        See all <ChevronRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

function TrendingSection() {
  const { data, isLoading } = useQuery({
    queryKey: ["trending-notes"],
    queryFn: () => fetchTrendingNotes(6),
  });
  const grads = [
    "from-violet-500/30 to-fuchsia-500/20",
    "from-sky-500/30 to-indigo-500/20",
    "from-emerald-400/25 to-teal-500/20",
  ];
  return (
    <section className="mt-7">
      <SectionHeader title="Trending notes" to="/notes" />
      <div className="mt-3 -mx-4 px-4 flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2">
        {isLoading ? (
          <div className="min-w-[72%] glass rounded-3xl p-4 h-36 animate-pulse" />
        ) : !data || data.length === 0 ? (
          <div className="min-w-full glass rounded-3xl p-6 text-center text-xs text-muted-foreground">
            No notes yet — be the first to upload!
          </div>
        ) : (
          data.map((n, i) => (
            <Link
              key={n.id}
              to="/notes"
              className={`snap-start min-w-[72%] glass rounded-3xl p-4 bg-gradient-to-br ${grads[i % grads.length]}`}
            >
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="rounded-full bg-white/10 px-2 py-0.5">{n.subject}</span>
                <span>{n.downloads} ↓</span>
              </div>
              <div className="mt-6 text-base font-semibold leading-snug line-clamp-2">{n.title}</div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {n.branch} · {n.semester}
                </span>
                <span className="btn-brand text-xs font-medium rounded-xl px-3 py-1.5">Open</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}
