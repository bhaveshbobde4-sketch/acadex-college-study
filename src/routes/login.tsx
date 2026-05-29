import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, Lock, GraduationCap } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Acadex" },
      { name: "description", content: "Sign in to Acadex with Google or email." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col px-6 py-10">
      <div className="flex items-center gap-2">
        <div className="h-9 w-9 rounded-xl btn-brand flex items-center justify-center">
          <GraduationCap className="h-5 w-5" />
        </div>
        <span className="text-lg font-semibold">Acadex</span>
      </div>

      <div className="mt-12">
        <h1 className="text-3xl font-semibold leading-tight">
          Welcome back to <span className="gradient-text">Acadex</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to access your notes, AI tutor and study streak.
        </p>
      </div>

      <div className="mt-8 glass-strong rounded-3xl p-5 gradient-border">
        <button className="w-full h-12 rounded-2xl bg-white text-black font-medium text-sm flex items-center justify-center gap-2">
          <GoogleIcon /> Continue with Google
        </button>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-white/10" />
          or with email
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <Field icon={Mail} placeholder="you@college.edu" type="email" />
        <div className="h-3" />
        <Field icon={Lock} placeholder="Password" type="password" />

        <Link to="/login" className="block text-right mt-2 text-xs text-muted-foreground">
          Forgot password?
        </Link>

        <button className="mt-5 btn-brand w-full h-12 rounded-2xl text-sm font-semibold">
          Sign in
        </button>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        New to Acadex? <Link to="/login" className="text-foreground underline-offset-4 underline">Create account</Link>
      </p>

      <Link to="/" className="mt-auto text-center text-xs text-muted-foreground">
        Skip for now
      </Link>
    </div>
  );
}

function Field({ icon: Icon, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { icon: typeof Mail }) {
  return (
    <label className="flex items-center gap-2 rounded-2xl bg-white/5 border border-white/10 px-3 h-12">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <input
        {...props}
        className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
      />
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.55c2.08-1.92 3.29-4.74 3.29-8.09Z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.55-2.76c-.99.66-2.25 1.06-3.73 1.06-2.87 0-5.3-1.94-6.17-4.55H2.18v2.86A11 11 0 0 0 12 23Z"/>
      <path fill="#FBBC05" d="M5.83 14.09a6.6 6.6 0 0 1 0-4.18V7.05H2.18a11 11 0 0 0 0 9.9l3.65-2.86Z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.07.56 4.21 1.64l3.15-3.15C17.45 2.1 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.65 2.86C6.7 7.32 9.13 5.38 12 5.38Z"/>
    </svg>
  );
}
