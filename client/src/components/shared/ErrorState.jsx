import { AlertTriangle, RotateCw } from "lucide-react";

// Trạng thái lỗi tải dữ liệu — dùng chung. onRetry để thử lại.
export default function ErrorState({ message, onRetry, className = "" }) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border border-line bg-card px-4 py-12 text-center ${className}`}
      role="alert"
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-danger/15 text-danger">
        <AlertTriangle size={22} />
      </div>
      <div className="text-sm font-medium text-ink">Không tải được dữ liệu</div>
      <div className="mt-1 max-w-md text-xs text-faint">
        {message || "Có lỗi khi kết nối máy chủ. Vui lòng kiểm tra mạng và thử lại."}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 flex h-10 items-center gap-1.5 rounded-lg bg-brand-600 px-6 text-sm font-medium text-white hover:bg-brand-700"
        >
          <RotateCw size={15} /> Thử lại
        </button>
      )}
    </div>
  );
}
