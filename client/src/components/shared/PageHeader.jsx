// Tiêu đề trang dùng chung: title + mô tả + vùng hành động (actions).
export default function PageHeader({ title, subtitle, actions, className = "" }) {
  return (
    <div className={`mb-4 flex flex-wrap items-start justify-between gap-3 ${className}`}>
      <div className="min-w-0">
        <h1 className="text-xl font-bold text-ink xl:text-2xl">{title}</h1>
        {subtitle && <p className="mt-0.5 text-xs text-faint">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
