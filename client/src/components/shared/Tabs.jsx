// Thanh tab dùng chung — kiểu "viên thuốc" (segmented) cho gọn và rõ tab đang mở.
// items: [{key,label,icon}]. value/onChange điều khiển.
export default function Tabs({ items, value, onChange, className = "" }) {
  return (
    <div
      className={`inline-flex flex-wrap items-center gap-1 rounded-xl border border-line bg-page/60 p-1 ${className}`}
      role="tablist"
    >
      {items.map((t) => {
        const active = value === t.key;
        const Icon = t.icon;
        return (
          <button
            key={t.key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.key)}
            title={t.label}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-all ${
              active
                ? "bg-brand-500 text-white shadow-sm"
                : "text-sub hover:bg-hover hover:text-ink"
            }`}
          >
            {Icon && <Icon size={16} className={active ? "text-white" : "text-faint"} />}
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
