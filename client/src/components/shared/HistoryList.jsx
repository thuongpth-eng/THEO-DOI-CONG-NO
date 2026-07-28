import { FIELD_LABELS } from "../../lib/history";

function fmt(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  if (isNaN(d.getTime())) return "";
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

// Hiển thị lịch sử thay đổi (mới nhất lên đầu)
export default function HistoryList({ items }) {
  if (!items || items.length === 0)
    return <p className="text-xs italic text-faint">Chưa có thay đổi nào được ghi cho đợt này.</p>;
  return (
    <div className="max-h-52 space-y-1.5 overflow-auto pr-1">
      {[...items].reverse().map((h, i) => (
        <div key={i} className="rounded-lg border border-line bg-page/40 px-3 py-1.5 text-xs">
          <div className="mb-0.5 flex items-center justify-between text-faint">
            <span>🕓 {fmt(h.ts)}</span>
            {h.by && <span className="font-medium">{h.by}</span>}
          </div>
          <div className="text-ink">
            <b>{FIELD_LABELS[h.field] || h.field}:</b>{" "}
            <span className="text-faint line-through">{h.old}</span> →{" "}
            <b className="text-brand-600">{h.new}</b>
          </div>
        </div>
      ))}
    </div>
  );
}
