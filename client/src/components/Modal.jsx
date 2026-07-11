import { X } from "lucide-react";

export default function Modal({ open, onClose, title, children, footer, wide }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 sm:p-8"
      onMouseDown={onClose}
    >
      <div
        className={`mt-6 w-full ${wide ? "max-w-2xl" : "max-w-lg"} rounded-xl bg-card shadow-xl`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h3 className="text-base font-semibold text-ink">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-faint hover:bg-hover hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-line px-5 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-sub">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-faint">{hint}</span>}
    </label>
  );
}

const field =
  "w-full rounded-lg border border-line bg-card px-3 text-sm text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 placeholder:text-faint";

/* Spec HPCons: Input cao 40px, radius 8px */
export function Input(props) {
  return <input {...props} className={`${field} h-10`} />;
}
export function Textarea(props) {
  return <textarea {...props} className={`${field} py-2`} rows={props.rows || 3} />;
}
export function Select({ children, ...props }) {
  return (
    <select {...props} className={`${field} h-10`}>
      {children}
    </select>
  );
}

/* Spec HPCons: Button cao 40px, padding ngang 24px, radius 8px */
export function Btn({ variant = "primary", className = "", ...props }) {
  const styles = {
    primary: "bg-brand-600 text-white hover:bg-brand-700",
    ghost: "text-sub hover:bg-hover",
    danger: "bg-danger text-white hover:bg-red-700",
    outline: "border border-line text-sub hover:bg-hover",
  };
  return (
    <button
      {...props}
      className={`h-10 rounded-lg px-6 text-sm font-medium transition-colors disabled:opacity-50 ${styles[variant]} ${className}`}
    />
  );
}
