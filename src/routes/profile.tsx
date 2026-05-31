import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Bookmark, Download, Settings, Crown, ChevronRight, LogOut, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/use-admin";
import { useDisplayName } from "@/hooks/use-display-name";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Acadex" },
      { name: "description", content: "Your saved notes, downloads, premium membership and account settings." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();

  const { name } = useDisplayName();
  const initial = (name || "S").charAt(0).toUpperCase();
  const email = user?.email ?? "Not signed in";

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    navigate({ to: "/login" });
  };

  return (
    <PageShell subtitle="Account" title="Profile">
      <section className="glass-strong rounded-3xl p-5 flex items-center gap-4 gradient-border">
        <div className="relative">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500 to-sky-500 flex items-center justify-center text-xl font-semibold">
            {initial}
          </div>
          <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-400 border-2 border-background" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold truncate">{name}</h2>
          <p className="text-xs text-muted-foreground truncate">{email}</p>
          {isAdmin && (
            <p className="text-[11px] mt-1 inline-flex items-center gap-1 text-amber-300">
              <ShieldCheck className="h-3 w-3" /> Admin
            </p>
          )}
        </div>
      </section>

      <section className="mt-5 grid grid-cols-3 gap-3">
        <Stat label="Branch" value={"—"} />
        <Stat label="Saved" value={"—"} />
        <Stat label="Hours" value={"—"} />
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
        {isAdmin && (
          <Link to="/admin" className="w-full flex items-center gap-3 px-4 py-4 text-left">
            <div className="h-9 w-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-amber-300" />
            </div>
            <span className="flex-1 text-sm">Admin Panel</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        )}
        <button className="w-full flex items-center gap-3 px-4 py-4 text-left">
          <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Bookmark className="h-4 w-4" />
          </div>
          <span className="flex-1 text-sm">Saved notes</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-4 text-left">
          <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Download className="h-4 w-4" />
          </div>
          <span className="flex-1 text-sm">Downloads</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-4 text-left">
          <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Settings className="h-4 w-4" />
          </div>
          <span className="flex-1 text-sm">Settings</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </section>

      {user ? (
        <button onClick={handleSignOut} className="mt-6 w-full glass rounded-2xl px-4 py-3 flex items-center justify-center gap-2 text-sm text-destructive">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      ) : (
        <Link to="/login" className="mt-6 w-full glass rounded-2xl px-4 py-3 flex items-center justify-center gap-2 text-sm">
          Sign in
        </Link>
      )}
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
