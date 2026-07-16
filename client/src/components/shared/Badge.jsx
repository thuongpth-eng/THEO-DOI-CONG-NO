// Badge/tag dùng chung — nền đặc chữ trắng theo token HPCons (trạng thái = màu + chữ).
const TONES = {
  brand: "bg-brand-500 text-white",
  accent: "bg-accent text-white",
  warning: "bg-warning text-white",
  danger: "bg-danger text-white",
  muted: "bg-muted text-white",
  line: "bg-line text-sub",
};

export default function Badge({ tone = "muted", className = "", children }) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${
        TONES[tone] || TONES.muted
      } ${className}`}
    >
      {children}
    </span>
  );
}
