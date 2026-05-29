import { createFileRoute, Link } from "@tanstack/react-router";
import { Bookmark, Download, Settings, Crown, ChevronRight, LogOut } from "lucide-react";
import { PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Acadex" },
      { name: "description", content: "Your saved notes, downloads, premium membership and account settings." },
    ],
  }),
  component: ProfilePage,
});

const rows = [
  { label: "Saved notes", value: "42", icon: Bookmark },
  { label: "Downloads", value: "118", icon: Download },
  { label: "Settings", value: "", icon: Settings },
];

function ProfilePage() {
  return (
    <PageShell subtitle="Account" title="Profile">
      <section className="glass-strong rounded-3xl p-5 flex items-center gap-4 gradient-border">
        <div className="relative">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500 to-sky-500 flex items-center justify-center text-xl font-semibold">
            A
          </div>
          <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-400 border-2 border-background" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold truncate">Aarav Mehta</h2>
          <p className="text-xs text-muted-foreground truncate">aarav.mehta@iitb.ac.in</p>
          <p className="text-[11px] text-muted-foreground mt-1">CSE · Sem 5 · IIT Bombay</p>
        </div>
      </section>

      <section className="mt-5 grid grid-cols-3 gap-3">
        <Stat label="Streak" value="14" />
        <Stat label="Notes saved" value="42" />
        <Stat label="Hours focus" value="86" />
      </section>

      <section className="mt-5 relative overflow-hidden rounded-3xl p-5 glass gradient-border">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-amber-400/30 blur-3xl" />
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-amber-300 to-fuchsia-500 flex items-center justify-center">
            <Crown className="h-5 w-5 text-black" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold">Go Premium</h3>
            <p className="text-xs text-muted-foreground">Unlimited AI, no ads, premium notes.</p>
          </div>
          <button className="btn-brand text-xs rounded-xl px-3 py-2">Upgrade</button>
        </div>
      </section>

      <section className="mt-5 glass rounded-3xl divide-y divide-white/5">
        {rows.map(({ label, value, icon: Icon }) => (
          <button key={label} className="w-full flex items-center gap-3 px-4 py-4 text-left">
            <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Icon className="h-4 w-4" />
            </div>
            <span className="flex-1 text-sm">{label}</span>
            {value && <span className="text-xs text-muted-foreground">{value}</span>}
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </section>

      <Link to="/login" className="mt-6 w-full glass rounded-2xl px-4 py-3 flex items-center justify-center gap-2 text-sm text-destructive">
        <LogOut className="h-4 w-4" /> Sign out
      </Link>
    </PageShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-2xl p-3 text-center">
      <div className="text-xl font-semibold gradient-text">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}
