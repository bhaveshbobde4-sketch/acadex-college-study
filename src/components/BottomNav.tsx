import { Link, useRouterState } from "@tanstack/react-router";
import { Home, BookOpen, Sparkles, Users, User } from "lucide-react";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/notes", label: "Notes", icon: BookOpen },
  { to: "/ai", label: "AI", icon: Sparkles, primary: true },
  { to: "/community", label: "Community", icon: Users },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-0 right-0 z-50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2"
    >
      <div className="mx-auto max-w-md glass-strong rounded-3xl px-2 py-2 flex items-center justify-between">
        {items.map(({ to, label, icon: Icon, primary }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          if (primary) {
            return (
              <Link
                key={to}
                to={to}
                aria-label={label}
                className="-mt-7 flex flex-col items-center"
              >
                <span className="btn-brand h-14 w-14 rounded-2xl flex items-center justify-center animate-float">
                  <Icon className="h-6 w-6" />
                </span>
                <span className="mt-1 text-[10px] text-muted-foreground">{label}</span>
              </Link>
            );
          }
          return (
            <Link
              key={to}
              to={to}
              aria-label={label}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-2xl transition-colors ${
                active ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "drop-shadow-[0_0_8px_oklch(0.70_0.22_270/0.7)]" : ""}`} />
              <span className="text-[10px]">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
