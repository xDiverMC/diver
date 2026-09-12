// src/components/admin/ui.jsx
// Small shared UI primitives so every admin page looks consistent.

export function Card({ children, className = "" }) {
  return (
    <div
      className={`bg-neutral-900 border border-neutral-800 rounded-xl shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function PageHeader({ title, description, action }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        {description && (
          <p className="text-sm text-neutral-400 mt-1">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}) {
  const variants = {
    primary: "bg-emerald-600 hover:bg-emerald-500 text-white",
    secondary: "bg-neutral-800 hover:bg-neutral-700 text-white",
    danger: "bg-red-950 hover:bg-red-900 text-red-300",
    ghost: "hover:bg-neutral-800 text-neutral-300",
  };
  return (
    <button
      className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-300 mb-1.5">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-neutral-500 mt-1.5">{hint}</p>}
    </div>
  );
}

const inputBase =
  "w-full rounded-lg bg-neutral-950 border border-neutral-700 px-3 py-2 text-[15px] text-white outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 placeholder:text-neutral-600";

export function Input(props) {
  return <input className={inputBase} {...props} />;
}

export function Textarea(props) {
  return <textarea className={inputBase} {...props} />;
}

export function Select(props) {
  return <select className={inputBase} {...props} />;
}

export function EmptyState({ icon: Icon, title, description }) {
  return (
    <Card className="py-14 flex flex-col items-center text-center px-6">
      {Icon && <Icon size={28} className="text-neutral-600 mb-3" />}
      <p className="text-white font-medium">{title}</p>
      {description && (
        <p className="text-sm text-neutral-500 mt-1 max-w-sm">{description}</p>
      )}
    </Card>
  );
}

export function Spinner() {
  return (
    <div className="flex justify-center py-14">
      <div className="h-6 w-6 rounded-full border-2 border-neutral-700 border-t-emerald-500 animate-spin" />
    </div>
  );
}

export function Badge({ children, tone = "neutral" }) {
  const tones = {
    neutral: "bg-neutral-800 text-neutral-300",
    success: "bg-emerald-950 text-emerald-400",
    danger: "bg-red-950 text-red-400",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
