// Ô số liệu nhỏ (nhãn + giá trị) — dùng chung. tone = class màu cho giá trị.
export default function Stat({ label, value, tone = "text-ink", className = "" }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <div className="text-xs text-faint">{label}</div>
      <div className={`mt-0.5 truncate text-sm font-bold tabular-nums ${tone}`}>{value}</div>
    </div>
  );
}
