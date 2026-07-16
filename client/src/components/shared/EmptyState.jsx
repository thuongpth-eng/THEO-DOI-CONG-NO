// Trạng thái rỗng — dùng chung. icon là component lucide (tùy chọn).
export default function EmptyState({ icon: Icon, title, hint, action, className = "" }) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-card/50 px-4 py-12 text-center ${className}`}
    >
      {Icon && (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-hover text-faint">
          <Icon size={22} />
        </div>
      )}
      <div className="text-sm font-medium text-sub">{title}</div>
      {hint && <div className="mt-1 max-w-sm text-xs text-faint">{hint}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
