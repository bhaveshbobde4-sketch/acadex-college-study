import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Timer, Calculator, CalendarRange, CheckSquare, Play, Pause, RotateCcw } from "lucide-react";
import { PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/tools")({
  head: () => ({
    meta: [
      { title: "Productivity Tools — Acadex" },
      { name: "description", content: "Attendance tracker, CGPA calculator, Pomodoro timer and timetable creator." },
    ],
  }),
  component: ToolsPage,
});

function ToolsPage() {
  return (
    <PageShell title="Tools" subtitle="Productivity">
      <Pomodoro />

      <div className="mt-5 grid grid-cols-2 gap-3">
        <ToolCard icon={CheckSquare} title="Attendance" stat="86%" sub="22 / 25 classes" />
        <ToolCard icon={Calculator} title="CGPA" stat="8.74" sub="Sem 5 · GPA 9.1" />
        <ToolCard icon={CalendarRange} title="Timetable" stat="Mon" sub="Next: OS · 10:00" />
        <ToolCard icon={Timer} title="Focus today" stat="2h 40m" sub="6 pomodoros" />
      </div>
    </PageShell>
  );
}

function ToolCard({ icon: Icon, title, stat, sub }: { icon: typeof Timer; title: string; stat: string; sub: string }) {
  return (
    <div className="glass rounded-3xl p-4 gradient-border">
      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500/30 to-sky-500/30 flex items-center justify-center">
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-4 text-xs text-muted-foreground">{title}</div>
      <div className="text-xl font-semibold gradient-text">{stat}</div>
      <div className="text-[11px] text-muted-foreground mt-1">{sub}</div>
    </div>
  );
}

function Pomodoro() {
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [running]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const progress = 1 - seconds / (25 * 60);
  const circ = 2 * Math.PI * 86;

  return (
    <section className="glass-strong rounded-3xl p-6 gradient-border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Pomodoro</p>
          <h2 className="text-lg font-semibold">Deep focus session</h2>
        </div>
        <span className="rounded-full px-3 py-1 text-[10px] bg-white/5 border border-white/10">25 / 5</span>
      </div>

      <div className="mt-6 grid place-items-center">
        <div className="relative h-52 w-52">
          <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
            <defs>
              <linearGradient id="g" x1="0" x2="1">
                <stop offset="0%" stopColor="oklch(0.70 0.22 270)" />
                <stop offset="100%" stopColor="oklch(0.72 0.20 225)" />
              </linearGradient>
            </defs>
            <circle cx="100" cy="100" r="86" stroke="oklch(1 0 0 / 0.08)" strokeWidth="10" fill="none" />
            <circle
              cx="100" cy="100" r="86"
              stroke="url(#g)" strokeWidth="10" fill="none" strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - progress)}
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              <div className="text-4xl font-semibold tabular-nums">{mm}:{ss}</div>
              <div className="text-xs text-muted-foreground mt-1">focus block</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          onClick={() => setRunning((r) => !r)}
          className="btn-brand h-12 px-6 rounded-2xl flex items-center gap-2 text-sm font-medium"
        >
          {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {running ? "Pause" : "Start"}
        </button>
        <button
          onClick={() => { setRunning(false); setSeconds(25 * 60); }}
          className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center"
          aria-label="Reset"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
