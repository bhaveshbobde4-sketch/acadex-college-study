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

function getGreeting() {
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
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground" suppressHydrationWarning>
          {typeof window === "undefined" ? "Welcome back" : getGreeting()}
        </p>
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
      <ContinueSection userId={user?.id ?? null} />

      {/* Trending notes */}
      <TrendingSection />

      {/* Upcoming from Exam Hub */}
      <UpcomingSection />
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

function ContinueSection({ userId }: { userId: string | null }) {
  const { data } = useQuery({
    queryKey: ["recent-download", userId ?? "anon"],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("note_downloads")
        .select("note_id, downloaded_at, notes(id,title,subject,branch,semester)")
        .eq("user_id", userId!)
        .order("downloaded_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });
  const note = (data as { notes?: { id: string; title: string; subject: string; branch: string; semester: string } } | null)?.notes;
  if (!note) return null;
  return (
    <section className="mt-7">
      <SectionHeader title="Continue studying" to="/notes" />
      <Link to="/notes/$id" params={{ id: note.id }} className="block mt-3 glass rounded-3xl p-4 gradient-border">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500/40 to-sky-500/30 flex items-center justify-center">
            <BookOpen className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">{note.title}</div>
            <div className="text-xs text-muted-foreground truncate">{note.subject} · {note.branch} · {note.semester}</div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </Link>
    </section>
  );
}

function UpcomingSection() {
  const today = new Date().toISOString().slice(0, 10);
  const { data = [] } = useQuery({
    queryKey: ["home-upcoming"],
    queryFn: async () => {
      const { data } = await supabase
        .from("exam_events")
        .select("id,title,type,event_date,branch,semester")
        .gte("event_date", today)
        .order("event_date", { ascending: true })
        .limit(3);
      return data ?? [];
    },
  });
  if (!data.length) return null;
  return (
    <section className="mt-7">
      <SectionHeader title="Upcoming" to="/exam-hub" />
      <div className="mt-3 space-y-2">
        {data.map((e) => (
          <div key={e.id} className="glass rounded-2xl p-4 flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-[var(--brand-2)]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{e.title}</div>
              <div className="text-xs text-muted-foreground truncate">
                {[e.branch, e.semester].filter(Boolean).join(" · ") || e.type.replace("_", " ")}
                {e.event_date ? ` · ${new Date(e.event_date).toLocaleDateString()}` : ""}
              </div>
            </div>
            <GraduationCap className="h-5 w-5 text-muted-foreground" />
          </div>
        ))}
      </div>
    </section>
  );
}

