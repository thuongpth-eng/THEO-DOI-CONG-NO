import { Users } from "lucide-react";
import { fmtVND } from "../../lib/models";

export default function CustomerProgress({ data }) {
  return (
    <div className="rounded-xl border border-line bg-card p-4 shadow-card">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent">
          <Users size={20} />
        </span>
        <div>
          <h3 className="text-base font-semibold text-ink">Tình hình thanh toán theo khách hàng</h3>
          <p className="text-xs text-faint">{data.length} chủ đầu tư · sắp theo còn phải thu</p>
        </div>
      </div>

      <div className="space-y-4">
        {data.map((g) => (
          <div key={g.id}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-500/15 text-xs font-bold text-brand-500">
                  {(g.name || "?").charAt(0)}
                </span>
                <span className="truncate text-sm font-semibold text-ink">{g.name}</span>
              </div>
              <span className="shrink-0 text-sm tabular-nums text-sub">
                Còn phải thu <b className="text-ink">{fmtVND(g.outstanding)}</b>
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-hover">
                <div
                  className="h-full rounded-full bg-brand-500"
                  style={{ width: `${Math.min(100, g.pct)}%` }}
                />
              </div>
              <span className="w-16 shrink-0 text-right text-xs tabular-nums text-faint">
                {g.pct}% đã thu
              </span>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {g.overdue > 0 ? (
                <span className="rounded-full bg-danger px-2 py-0.5 text-[11px] font-semibold text-white">
                  Quá hạn · cần thu {fmtVND(g.overdue)}
                </span>
              ) : g.dueSoon > 0 ? (
                <span className="rounded-full bg-warning px-2 py-0.5 text-[11px] font-semibold text-white">
                  Đến hạn 30 ngày · {fmtVND(g.dueSoon)}
                </span>
              ) : g.outstanding > 0 ? (
                <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-semibold text-accent">
                  Chưa đến hạn HĐ
                </span>
              ) : (
                <span className="rounded-full bg-brand-500 px-2 py-0.5 text-[11px] font-semibold text-white">
                  Đã thu đủ
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
