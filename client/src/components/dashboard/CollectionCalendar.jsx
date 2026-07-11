import { useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { buildCalendarMarks, buildMonthEvents } from "../../lib/dashboard";
import { fmtVND } from "../../lib/models";

const DOW = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const p2 = (n) => String(n).padStart(2, "0");

export default function CollectionCalendar({ installments }) {
  const now = new Date();
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() });

  const marks = buildCalendarMarks(installments, ym.y, ym.m);
  const events = buildMonthEvents(installments, ym.y, ym.m);

  const first = new Date(ym.y, ym.m, 1);
  const daysInMonth = new Date(ym.y, ym.m + 1, 0).getDate();
  const offset = (first.getDay() + 6) % 7; // Thứ 2 đầu tuần
  const cells = [...Array(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const today = new Date();
  const isThisMonth = today.getFullYear() === ym.y && today.getMonth() === ym.m;

  const move = (d) =>
    setYm(({ y, m }) => {
      const t = new Date(y, m + d, 1);
      return { y: t.getFullYear(), m: t.getMonth() };
    });

  return (
    <div className="rounded-xl border border-line bg-card p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/15 text-brand-500">
            <CalendarDays size={20} />
          </span>
          <div>
            <h3 className="text-base font-semibold text-ink">Lịch thu</h3>
            <p className="text-xs text-faint">Ngày đến hạn thu tiền trong tháng</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => move(-1)} aria-label="Tháng trước" className="flex h-10 w-10 items-center justify-center rounded-lg text-sub hover:bg-hover">
            <ChevronLeft size={18} />
          </button>
          <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">
            Tháng {ym.m + 1}/{ym.y}
          </span>
          <button onClick={() => move(1)} aria-label="Tháng sau" className="flex h-10 w-10 items-center justify-center rounded-lg text-sub hover:bg-hover">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Lưới lịch */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase text-faint">
        {DOW.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d === null) return <div key={`e${i}`} />;
          const mk = marks.get(d);
          const isToday = isThisMonth && d === today.getDate();
          let cls = "text-ink hover:bg-hover";
          if (mk?.overdue) cls = "bg-danger text-white font-bold";
          else if (mk?.due) cls = "bg-brand-500 text-white font-bold";
          else if (mk?.paid) cls = "border border-accent text-accent font-semibold";
          return (
            <div
              key={d}
              title={mk?.amount ? `Cần thu: ${fmtVND(mk.amount)}` : undefined}
              className={`flex h-9 items-center justify-center rounded-lg text-sm tabular-nums ${cls} ${
                isToday ? "ring-2 ring-brand-500 ring-offset-1 ring-offset-card" : ""
              }`}
            >
              {d}
            </div>
          );
        })}
      </div>

      {/* Chú giải */}
      <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-sub">
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-brand-500" /> Công nợ đến hạn</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-danger" /> Công nợ quá hạn</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full border border-accent" /> Ngày đã thu tiền</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full ring-2 ring-brand-500" /> Hôm nay</span>
      </div>

      {/* Sự kiện trong tháng */}
      {events.length > 0 && (
        <div className="mt-3 space-y-2 border-t border-line pt-3">
          {events.map((e) => {
            const day = e.ngayDenHan.slice(8, 10);
            const isLate = e.late > 0;
            return (
              <div key={e.id} className="flex items-center gap-3 text-sm">
                <span
                  className={`flex h-9 w-14 shrink-0 flex-col items-center justify-center rounded-lg text-[11px] font-bold leading-tight text-white ${
                    isLate ? "bg-danger" : "bg-brand-500"
                  }`}
                >
                  {day}-{p2(ym.m + 1)}
                  <span className="text-[9px] font-medium opacity-90">
                    {isLate ? `trễ ${e.late} ngày` : `còn ${e.daysTo} ngày`}
                  </span>
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-ink">
                    {e.contractName} · {e.dot}
                  </div>
                </div>
                <div className="shrink-0 font-semibold tabular-nums text-ink">
                  {fmtVND(e.remain)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
