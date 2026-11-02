// src/components/admin/ui.jsx — shared building blocks for /admin pages.
import { Loader2, Inbox } from "lucide-react";

export function Card({ children, className = "" }) {
  return (
    <div className={`bg-neutral-900/60 border border-white/[0.07] rounded-2xl ${className}`}>
      {children}
    </div>
  );
}

export function PageHeader({ title, description, action }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-white">{title}</h1>
        {description && (
          <p className="text-sm text-neutral-500 mt-1">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function Button({ variant = "primary", className = "", children, ...props }) {
  return (
    <button
      className={`btn btn-${variant} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-sm text-neutral-400 mb-1">{label}</label>
      {children}
      {hint && <p className="text-xs text-neutral-500 mt-1">{hint}</p>}
    </div>
  );
}

const fieldBase =
  "w-full rounded-lg bg-neutral-900 border border-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-neutral-600 focus:border-emerald-500/70";

export function Input(props) {
  return <input className={fieldBase} {...props} />;
}

export function Textarea(props) {
  return <textarea className={fieldBase} {...props} />;
}

export function Select({ children, ...props }) {
  return (
    <select className={fieldBase} {...props}>
      {children}
    </select>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center border border-dashed border-neutral-800 rounded-lg">
      <Icon size={28} className="text-neutral-600" />
      <p className="text-white font-medium">{title}</p>
      {description && <p className="text-sm text-neutral-500 max-w-xs">{description}</p>}
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex items-center gap-2 text-neutral-400 text-sm py-8">
      <Loader2 size={16} className="animate-spin" /> Memuat...
    </div>
  );
}

export function Badge({ tone = "neutral", children }) {
  const tones = {
    success: "bg-emerald-900/50 text-emerald-300",
    neutral: "bg-neutral-800 text-neutral-400",
    danger: "bg-red-900/50 text-red-300",
    info: "bg-blue-900/50 text-blue-300",
    warning: "bg-amber-900/50 text-amber-300",
  };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${tones[tone] ?? tones.neutral}`}>
      {children}
    </span>
  );
}

// Kartu angka ringkas untuk dashboard.
export function StatCard({ label, value, hint, delta, icon: Icon, tone = "neutral" }) {
  const accent = {
    neutral: "text-neutral-400 bg-neutral-800",
    success: "text-emerald-400 bg-emerald-900/40",
    info: "text-sky-400 bg-sky-900/40",
    warning: "text-amber-400 bg-amber-900/40",
    danger: "text-red-400 bg-red-900/40",
  }[tone];
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs text-neutral-500">{label}</span>
        {Icon && (
          <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${accent}`}>
            <Icon size={14} />
          </span>
        )}
      </div>
      <div className="mt-2 text-xl font-bold text-white sm:text-2xl">{value}</div>
      <div className="mt-1 flex items-center gap-2 text-xs">
        {delta != null && (
          <span className={delta >= 0 ? "text-emerald-400" : "text-red-400"}>
            {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}%
          </span>
        )}
        {hint && <span className="text-neutral-500">{hint}</span>}
      </div>
    </Card>
  );
}

// Pilihan berbentuk pil (mis. 7 / 30 / 90 hari).
export function Segmented({ options, value, onChange }) {
  return (
    <div className="seg">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={value === o.value ? "on" : ""}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
