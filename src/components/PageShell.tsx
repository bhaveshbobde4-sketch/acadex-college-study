import type { ReactNode } from "react";

export function PageShell({
  title,
  subtitle,
  right,
  children,
}: {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen pb-32">
      <div className="mx-auto max-w-md px-4 pt-8">
        {(title || right) && (
          <header className="mb-6 flex items-end justify-between gap-3">
            <div>
              {subtitle && (
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {subtitle}
                </p>
              )}
              {title && (
                <h1 className="mt-1 text-3xl font-semibold">
                  <span className="gradient-text">{title}</span>
                </h1>
              )}
            </div>
            {right}
          </header>
        )}
        {children}
      </div>
    </div>
  );
}
