import { Building2, MapPin } from "lucide-react";
import { fmtVND, fmtTy, outstanding, daysLate, receivable } from "../../lib/models";

// Vòng tròn % (SVG thuần — không animation để tránh treo preview)
function Ring({ pct, color }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.min(100, Math.max(0, pct)) / 100);
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" className="shrink-0">
      <circle cx="32" cy="32" r={r} fill="none" strokeWidth="7" className="stroke-hover" />
      <circle
        cx="32"
        cy="32"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={off}
        transform="rotate(-90 32 32)"
      />
      <text x="32" y="37" textAnchor="middle" className="fill-ink text-[13px] font-bold">
        {pct}%
      </text>
    </svg>
  );
}

const ST = {
  overdue: { label: "Quá hạn", badge: "bg-danger", ring: "#E53935" },
  done: { label: "Hoàn thành", badge: "bg-brand-500", ring: "#60BB46" },
  progress: { label: "Đang thực hiện", badge: "bg-accent", ring: "#0969A7" },
};

function Stat({ label, value, cls = "text-ink" }) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] uppercase tracking-wide text-faint">{label}</div>
      <div className={`truncate text-sm font-semibold tabular-nums ${cls}`}>{value}</div>
    </div>
  );
}

export default function ProjectProgress({ contracts, installments }) {
  const rows = contracts
    .map((c) => {
      const rs = installments.filter((i) => i.contractId === c.id);
      const value = rs.reduce((s, r) => s + (r.value || 0), 0);
      const paid = rs.reduce((s, r) => s + (r.paid || 0), 0);
      const total = c.totalAfterTax || value;
      const os = receivable(rs); // chỉ đợt đã phát sinh
      const overdue = rs
        .filter((r) => daysLate(r) > 0)
        .reduce((s, r) => s + outstanding(r), 0);
      const pct = total > 0 ? Math.round((paid / total) * 100) : 0;
      const late = rs.some((r) => daysLate(r) > 0);
      const st = late ? "overdue" : total > 0 && os <= 0.5 && paid > 0 ? "done" : "progress";
      return { c, total, paid, os, overdue, pct, st, count: rs.length };
    })
    .sort((a, b) => b.os - a.os);

  if (rows.length === 0) return null;

  return (
    <section className="rounded-xl border border-line bg-card p-4 shadow-card xl:p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-ink xl:text-lg">Tiến độ theo công trình</h2>
          <p className="text-xs text-faint">Xếp theo công nợ còn phải thu · vòng tròn = % đã thu</p>
        </div>
        <span className="rounded-full bg-brandtint px-2.5 py-1 text-xs font-semibold text-brand-500">
          {rows.length} công trình
        </span>
      </div>

      <div className="space-y-3">
        {rows.map(({ c, total, paid, os, overdue, pct, st, count }) => {
          const meta = ST[st];
          return (
            <div
              key={c.id}
              className="flex flex-col gap-4 rounded-xl border border-line bg-page/40 p-3 md:flex-row md:items-center xl:p-4"
            >
              {/* Tên + CĐT */}
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Ring pct={pct} color={meta.ring} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-semibold text-ink">{c.name}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold text-white ${meta.badge}`}
                    >
                      {meta.label}
                    </span>
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-faint">
                    <span className="flex items-center gap-1">
                      <Building2 size={11} className="text-brand-500" />
                      <span className="truncate">{c.customerName}</span>
                    </span>
                    {c.loc && (
                      <span className="flex items-center gap-1">
                        <MapPin size={11} /> {c.loc}
                      </span>
                    )}
                    <span>{count} đợt</span>
                  </div>
                  {/* Thanh tiến độ thu */}
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1.5 w-40 max-w-full overflow-hidden rounded-full bg-hover">
                      <div
                        className="h-full rounded-full bg-brand-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-medium text-faint">
                      {fmtTy(paid)} / {fmtTy(total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Số liệu */}
              <div className="grid shrink-0 grid-cols-3 gap-4 border-t border-line pt-3 md:border-l md:border-t-0 md:pl-5 md:pt-0">
                <Stat label="Đã thu" value={fmtVND(paid)} cls="text-brand-500" />
                <Stat label="Còn phải thu" value={fmtVND(os)} />
                <Stat
                  label="Quá hạn"
                  value={overdue > 0 ? fmtVND(overdue) : "—"}
                  cls={overdue > 0 ? "text-danger" : "text-faint"}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
