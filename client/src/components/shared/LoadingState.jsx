// Trạng thái đang tải — dùng chung mọi trang.
export default function LoadingState({ label = "Đang tải dữ liệu…", className = "" }) {
  return (
    <div className={`flex items-center justify-center gap-3 py-20 text-faint ${className}`}>
      <span
        className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-brand-500"
        aria-hidden="true"
      />
      <span className="text-sm">{label}</span>
    </div>
  );
}
