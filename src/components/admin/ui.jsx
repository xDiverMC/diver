// src/components/admin/ui.jsx — shared building blocks for /admin pages.
import { Loader2, Inbox } from "lucide-react";

export function Card({ children, className = "" }) {
  return (
    <div className={`bg-neutral-900 border border-neutral-800 rounded-lg ${className}`}>
      {children}
    </div>
  );
}

export function PageHeader({ title, description, action }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-5">
      <div>
        <h1 className="text-xl font-bold text-white">{title}</h1>
        {description && (
          <p className="text-sm text-neutral-500 mt-1">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

const VARIANTS = {
  primary: "bg-emerald-600 hover:bg-emerald-500 text-white",
  secondary: "bg-neutral-800 hover:bg-neutral-700 text-white",
  danger: "bg-red-900/50 hover:bg-red-900 text-red-300",
};

export function Button({ variant = "primary", className = "", children, ...props }) {
  return (
    <button
      className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-md transition disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
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
  "w-full rounded-md bg-neutral-800 border border-neutral-700 px-3 py-2 text-white outline-none focus:border-emerald-500";

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
      <Loader2 size={16} className="animate-spin" /> Loading...
    </div>
  );
}

export function Badge({ tone = "neutral", children }) {
  const tones = {
    success: "bg-emerald-900/50 text-emerald-300",
    neutral: "bg-neutral-800 text-neutral-400",
    danger: "bg-red-900/50 text-red-300",
    info: "bg-blue-900/50 text-blue-300",
  };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}
