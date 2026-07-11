import { CalendarClock, AlertTriangle } from "lucide-react";
import { fmtVND, fmtDate } from "../../lib/models";

function Row({ label, value, strong }) {
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span className="text-sub">{label}</span>
      <span className={`tabular-nums ${strong ? "font-bold text-ink" : "text-ink"}`}>{value}</span>
    </div>
  );
}

function DueCard({ r, overdue }) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        overdue ? "border-danger/30 bg-danger/10" : "border-warning/30 bg-warning/10"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white ${
            overdue ? "bg-danger" : "bg-warning"
          }`}
        >
          {overdue ? `QUÁ HẠN ${r.late} NGÀY` : r.daysTo === 0 ? "ĐẾN HẠN HÔM NAY" : `CÒN ${r.daysTo} NGÀY`}
        </span>
        <span className="font-bold text-ink">
          {r.contractName} · {r.dot}
        </span>
      </div>
      <div className="mt-3 space-y-1.5">
        <Row label="Cần thu" value={fmtVND(r.remain)} strong />
        <Row label="Ngày xuất hóa đơn" value={r.ngayXuatHD ? fmtDate(r.ngayXuatHD) : "chưa nhập"} />
        <Row label="Hạn thanh toán theo hợp đồng" value={fmtDate(r.ngayDenHan)} />
        {r.duKienCDT && <Row label="Hạn thanh toán theo lịch CĐT" value={fmtDate(r.duKienCDT)} />}
      </div>
      {overdue && (
        <div className="mt-3 rounded-lg border border-dashed border-danger/40 px-3 py-2 text-xs">
          <span className="font-semibold text-danger">Lý do chậm thanh toán: </span>
          <span className={r.ghichu ? "text-ink" : "italic text-faint"}>
            {r.ghichu || "chưa nhập — vào Chi tiết công trình để ghi chú"}
          </span>
        </div>
      )}
    </div>
  );
}

export default function DueLists({ dueSoon, overdue }) {
  const dueTotal = dueSoon.reduce((s, r) => s + r.remain, 0);
  const overTotal = overdue.reduce((s, r) => s + r.remain, 0);

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      {/* Đến hạn 30 ngày */}
      <div className="rounded-xl border border-line bg-card p-4 shadow-card">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/15 text-warning">
            <CalendarClock size={20} />
          </span>
          <div>
            <h3 className="text-base font-semibold text-ink">Công nợ đến hạn thu</h3>
            <p className="text-xs text-faint">
              {dueSoon.length} đợt · dự kiến thu 30 ngày tới: <b className="text-ink">{fmtVND(dueTotal)}</b>
            </p>
          </div>
        </div>
        <div className="space-y-3">
          {dueSoon.map((r) => (
            <DueCard key={r.id} r={r} overdue={false} />
          ))}
          {dueSoon.length === 0 && (
            <div className="py-8 text-center text-sm text-faint">
              Không có đợt nào đến hạn trong 30 ngày tới.
            </div>
          )}
        </div>
      </div>

      {/* Quá hạn */}
      <div className="rounded-xl border border-line bg-card p-4 shadow-card">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-danger/15 text-danger">
            <AlertTriangle size={20} />
          </span>
          <div>
            <h3 className="text-base font-semibold text-ink">Công nợ quá hạn</h3>
            <p className="text-xs text-faint">
              {overdue.length} đợt · tổng quá hạn: <b className="text-danger">{fmtVND(overTotal)}</b>
            </p>
          </div>
        </div>
        <div className="space-y-3">
          {overdue.map((r) => (
            <DueCard key={r.id} r={r} overdue />
          ))}
          {overdue.length === 0 && (
            <div className="py-8 text-center text-sm text-faint">Không có nợ quá hạn. 🎉</div>
          )}
        </div>
      </div>
    </div>
  );
}
