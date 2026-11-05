import type { ReactNode } from "react";

export function Page({ title, sub, action, children }: { title: string; sub?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-5 pb-28 md:pb-10 md:pt-8">
      <header className="mb-5 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
          {sub && <p className="mt-1 text-sub">{sub}</p>}
        </div>
        {action}
      </header>
      {children}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-line bg-panel p-4 ${className}`}>{children}</section>;
}

export function Label({ children }: { children: ReactNode }) {
  return <h2 className="mb-3 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-accent">{children}</h2>;
}

export function Empty({ title, hint, action }: { title: string; hint: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line px-5 py-10 text-center">
      <p className="font-semibold">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sub">{hint}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Button({ children, onClick, kind = "primary", type = "button", disabled }: { children: ReactNode; onClick?: () => void; kind?: "primary" | "ghost" | "danger"; type?: "button" | "submit"; disabled?: boolean }) {
  const look = {
    primary: "bg-accent text-ink hover:brightness-110",
    ghost: "border border-line text-text hover:bg-raise",
    danger: "border border-alert/40 text-alert hover:bg-alert/10",
  }[kind];
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 font-semibold transition disabled:opacity-40 ${look}`}>
      {children}
    </button>
  );
}

export function Field(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`h-10 w-full rounded-xl border border-line bg-ink px-3 text-text placeholder:text-dim focus:border-accent focus:outline-none ${props.className ?? ""}`} />;
}

export function Bar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-raise" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${value}%` }} />
    </div>
  );
}

export const STATUS_LOOK: Record<string, string> = {
  active: "text-accent border-accent/40",
  paused: "text-sub border-line",
  done: "text-done border-done/40",
};
