// Thanh tab dùng chung. items: [{key,label,icon}]. value/onChange điều khiển.
export default function Tabs({ items, value, onChange, className = "" }) {
  return (
    <div className={`flex flex-wrap items-center gap-1 ${className}`} role="tablist">
      {items.map((t) => {
        const active = value === t.key;
        const Icon = t.icon;
        return (
          <button
            key={t.key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.key)}
            className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
              active
                ? "border-brand-500 text-brand-500"
                : "border-transparent text-faint hover:text-ink"
            }`}
          >
            {Icon && <Icon size={16} />}
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
