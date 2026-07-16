import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  FileText,
  CircleDollarSign,
  Hourglass,
  AlertTriangle,
  FolderOpen,
  Clock,
  Check,
  X,
} from "lucide-react";
import { fmtVND, fmtTy, outstanding, daysLate } from "../../lib/models";
import { useTheme } from "../../context/ThemeContext";

/* ---------- Khung card chung ---------- */
export function Panel({ title, sub, children, className = "" }) {
  return (
    <section className={`rounded-xl border border-line bg-card p-4 shadow-card ${className}`}>
      {title && (
        <div className="mb-3">
          <h3 className="text-sm font-bold uppercase tracking-wide text-ink">{title}</h3>
          {sub && <p className="text-xs text-faint">{sub}</p>}
        </div>
      )}
      {children}
    </section>
  );
}

const pct = (v, base) => (base > 0 ? Math.round((v / base) * 1000) / 10 : 0);

/* ---------- 6 thẻ KPI ---------- */
export function KpiCards({ kpis, installments }) {
  const base = kpis.totalPaid + kpis.outstanding; // = tổng giá trị đợt
  const pending = Math.max(0, kpis.outstanding - kpis.overdue);
  const lateRows = installments.filter((r) => daysLate(r) > 0);
  const avgAge = lateRows.length
    ? Math.round(lateRows.reduce((s, r) => s + daysLate(r), 0) / lateRows.length)
    : 0;

  const cards = [
    { icon: FileText, label: "Tổng giá trị hợp đồng", value: fmtTy(kpis.totalContract || base), sub: "100%", tone: "accent" },
    { icon: CircleDollarSign, label: "Đã thanh toán", value: fmtTy(kpis.totalPaid), sub: `${pct(kpis.totalPaid, base)}%`, tone: "brand" },
    { icon: Hourglass, label: "Chờ thanh toán", value: fmtTy(pending), sub: `${pct(pending, base)}%`, tone: "warning" },
    { icon: AlertTriangle, label: "Quá hạn", value: fmtTy(kpis.overdue), sub: `${pct(kpis.overdue, base)}%`, tone: "danger" },
    { icon: FolderOpen, label: "Hồ sơ đang trình", value: `${kpis.sentHSCount} bộ`, sub: "chờ thu", tone: "accent" },
    { icon: Clock, label: "Tuổi công nợ TB", value: `${avgAge} ngày`, sub: "nợ quá hạn", tone: "muted" },
  ];
  const TONE = {
    accent: "text-accent bg-accent/10",
    brand: "text-brand-500 bg-brand-500/10",
    warning: "text-warning bg-warning/10",
    danger: "text-danger bg-danger/10",
    muted: "text-sub bg-muted/15",
  };
  const VAL = {
    accent: "text-accent",
    brand: "text-brand-500",
    warning: "text-warning",
    danger: "text-danger",
    muted: "text-ink",
  };
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border border-line bg-card p-3 shadow-card">
          <div className="flex items-center gap-2">
            <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${TONE[c.tone]}`}>
              <c.icon size={16} />
            </span>
            <span className="text-[11px] font-semibold uppercase leading-tight text-faint">{c.label}</span>
          </div>
          <div className={`mt-2 text-xl font-bold tabular-nums ${VAL[c.tone]}`}>{c.value}</div>
          <div className="text-[11px] text-faint">{c.sub}</div>
        </div>
      ))}
    </div>
  );
}

/* ---------- 1. Công nợ theo chủ đầu tư (bar ngang) ---------- */
export function DebtByCustomer({ customerData }) {
  const { isDark } = useTheme();
  const data = customerData
    .filter((c) => c.outstanding > 0)
    .slice(0, 6)
    .map((c) => ({ name: c.name.replace(/^CÔNG TY (TNHH )?/i, ""), value: Math.round((c.outstanding / 1e9) * 10) / 10 }));
  return (
    <Panel title="1. Công nợ theo chủ đầu tư" sub="Đơn vị: tỷ đồng">
      <ResponsiveContainer width="100%" height={230}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24 }}>
          <CartesianGrid horizontal={false} stroke="var(--line)" />
          <XAxis type="number" tick={{ fontSize: 11, fill: "var(--faint)" }} />
          <YAxis type="category" dataKey="name" width={92} tick={{ fontSize: 10, fill: "var(--sub)" }} />
          <Tooltip
            formatter={(v) => v + " tỷ"}
            contentStyle={{ background: isDark ? "#111a2e" : "#fff", border: "1px solid var(--line)", borderRadius: 8, fontSize: 12 }}
          />
          <Bar dataKey="value" fill="#0969A7" radius={[0, 4, 4, 0]} isAnimationActive={false} label={{ position: "right", fontSize: 11, fill: "var(--sub)" }} />
        </BarChart>
      </ResponsiveContainer>
    </Panel>
  );
}

/* ---------- 2. Cơ cấu công nợ (donut) ---------- */
export function DebtStructure({ kpis }) {
  const { isDark } = useTheme();
  const pending = Math.max(0, kpis.outstanding - kpis.overdue);
  const data = [
    { name: "Đã thanh toán", value: kpis.totalPaid, fill: "#60BB46" },
    { name: "Chờ thanh toán", value: pending, fill: "#FFA726" },
    { name: "Quá hạn", value: kpis.overdue, fill: "#E53935" },
  ].filter((d) => d.value > 0);
  return (
    <Panel title="2. Cơ cấu công nợ">
      <ResponsiveContainer width="100%" height={230}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2} isAnimationActive={false}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.fill} stroke="var(--card)" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v) => fmtVND(v)}
            contentStyle={{ background: isDark ? "#111a2e" : "#fff", border: "1px solid var(--line)", borderRadius: 8, fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </Panel>
  );
}

/* ---------- 3. Dòng tiền theo tháng (bar) ---------- */
export function MonthlyCashflow({ installments }) {
  const { isDark } = useTheme();
  const map = new Map();
  for (const r of installments) {
    if (!r.ngayTT || !(r.paid > 0)) continue;
    const key = r.ngayTT.slice(0, 7); // YYYY-MM
    map.set(key, (map.get(key) || 0) + r.paid);
  }
  const data = [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-7)
    .map(([k, v]) => ({ month: k.slice(5) + "/" + k.slice(0, 4), value: Math.round((v / 1e9) * 10) / 10 }));
  return (
    <Panel title="3. Dòng tiền theo tháng" sub="Đơn vị: tỷ đồng">
      <ResponsiveContainer width="100%" height={230}>
        <BarChart data={data} margin={{ left: -10, right: 8 }}>
          <CartesianGrid vertical={false} stroke="var(--line)" />
          <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--faint)" }} />
          <YAxis tick={{ fontSize: 11, fill: "var(--faint)" }} />
          <Tooltip
            formatter={(v) => v + " tỷ"}
            contentStyle={{ background: isDark ? "#111a2e" : "#fff", border: "1px solid var(--line)", borderRadius: 8, fontSize: 12 }}
          />
          <Bar dataKey="value" fill="#0969A7" radius={[4, 4, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
      {data.length === 0 && <p className="text-center text-xs text-faint">Chưa có dữ liệu thực thu.</p>}
    </Panel>
  );
}

/* ---------- 6. Cảnh báo ---------- */
export function AlertsPanel({ overdue, dueSoon }) {
  const over30 = overdue.filter((r) => r.late > 30);
  return (
    <Panel title="6. Cảnh báo">
      <div className="space-y-3">
        {over30.slice(0, 2).map((r) => (
          <div key={r.id} className="rounded-lg border border-danger/30 bg-danger/5 p-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-danger">
              <AlertTriangle size={13} /> QUÁ HẠN &gt; 30 NGÀY
            </div>
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="truncate text-ink">{r.contractName}</span>
              <span className="shrink-0 font-semibold text-danger">{fmtTy(r.remain)} · {r.late}n</span>
            </div>
          </div>
        ))}
        {dueSoon.slice(0, 2).map((r) => (
          <div key={r.id} className="rounded-lg border border-warning/30 bg-warning/5 p-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-warning">
              <Clock size={13} /> ĐẾN HẠN {r.daysTo} NGÀY TỚI
            </div>
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="truncate text-ink">{r.contractName}</span>
              <span className="shrink-0 font-semibold text-warning">{fmtTy(r.remain)}</span>
            </div>
          </div>
        ))}
        {over30.length === 0 && dueSoon.length === 0 && (
          <p className="py-4 text-center text-xs text-faint">Không có cảnh báo.</p>
        )}
      </div>
    </Panel>
  );
}

/* ---------- 4. Danh sách công nợ chi tiết ---------- */
export function DetailTable({ rows, className = "" }) {
  return (
    <Panel title="4. Danh sách công nợ chi tiết" className={`overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="h-11 border-b border-line text-left text-[11px] uppercase tracking-wide text-faint">
              <th className="px-2 py-2 font-medium">STT</th>
              <th className="min-w-[150px] px-2 py-2 font-medium">Công trình</th>
              <th className="min-w-[160px] px-2 py-2 font-medium">Chủ đầu tư</th>
              <th className="px-2 py-2 text-right font-medium">Giá trị HĐ</th>
              <th className="px-2 py-2 text-right font-medium">Đã thu</th>
              <th className="px-2 py-2 text-right font-medium">Còn nợ</th>
              <th className="px-2 py-2 text-center font-medium">Quá hạn</th>
              <th className="px-2 py-2 font-medium">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c, i) => (
              <tr key={c.id} className="border-b border-line/60 last:border-0">
                <td className="px-2 py-2 text-faint">{i + 1}</td>
                <td className="px-2 py-2 font-semibold text-ink">{c.name}</td>
                <td className="px-2 py-2 text-sub">{c.customerName}</td>
                <td className="px-2 py-2 text-right tabular-nums text-sub">{fmtTy(c.value)}</td>
                <td className="px-2 py-2 text-right tabular-nums text-brand-500">{fmtTy(c.paid)}</td>
                <td className="px-2 py-2 text-right font-semibold tabular-nums text-ink">{fmtTy(c.os)}</td>
                <td className="px-2 py-2 text-center">
                  {c.maxLate > 0 ? (
                    <span className="rounded-full bg-danger px-2 py-0.5 text-[11px] font-semibold text-white">{c.maxLate}n</span>
                  ) : (
                    <span className="text-faint">—</span>
                  )}
                </td>
                <td className="px-2 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium text-white ${c.st === "overdue" ? "bg-danger" : c.st === "done" ? "bg-brand-500" : "bg-accent"}`}>
                    {c.st === "overdue" ? "Quá hạn" : c.st === "done" ? "Hoàn thành" : "Đang thực hiện"}
                  </span>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={8} className="py-6 text-center text-xs text-faint">Không có dữ liệu.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

/* ---------- 5. Aging report (4 mức) ---------- */
export function AgingBars({ installments }) {
  const buckets = [
    { label: "0 - 30 ngày", color: "#60BB46", value: 0 },
    { label: "31 - 60 ngày", color: "#FFA726", value: 0 },
    { label: "61 - 90 ngày", color: "#FF7043", value: 0 },
    { label: "> 90 ngày", color: "#E53935", value: 0 },
  ];
  for (const r of installments) {
    const os = outstanding(r);
    if (os <= 0) continue;
    const late = daysLate(r);
    if (late <= 30) buckets[0].value += os;
    else if (late <= 60) buckets[1].value += os;
    else if (late <= 90) buckets[2].value += os;
    else buckets[3].value += os;
  }
  const max = Math.max(1, ...buckets.map((b) => b.value));
  const total = buckets.reduce((s, b) => s + b.value, 0);
  return (
    <Panel title="5. Aging report (tuổi công nợ)" sub="Đơn vị: tỷ đồng">
      <div className="space-y-3">
        {buckets.map((b) => (
          <div key={b.label}>
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-sub">{b.label}</span>
              <span className="font-semibold tabular-nums text-ink">{fmtTy(b.value)}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-hover">
              <div className="h-full rounded-full" style={{ width: `${(b.value / max) * 100}%`, background: b.color }} />
            </div>
          </div>
        ))}
        <div className="flex justify-between border-t border-line pt-2 text-xs font-bold">
          <span className="text-sub uppercase">Tổng cộng</span>
          <span className="tabular-nums text-ink">{fmtTy(total)}</span>
        </div>
      </div>
    </Panel>
  );
}

/* ---------- 7. Theo dõi hồ sơ thanh toán (ma trận) ---------- */
function StepIcon({ ok }) {
  return ok ? (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-white"><Check size={12} /></span>
  ) : (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-danger/15 text-danger"><X size={12} /></span>
  );
}
export function DocMatrix({ rows }) {
  return (
    <Panel title="7. Theo dõi hồ sơ thanh toán">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="h-10 border-b border-line text-left text-[11px] uppercase tracking-wide text-faint">
              <th className="px-2 py-2 font-medium">Công trình</th>
              <th className="px-2 py-2 text-center font-medium">Trình CĐT</th>
              <th className="px-2 py-2 text-center font-medium">Kiểm tra</th>
              <th className="px-2 py-2 text-center font-medium">Xuất HĐ</th>
              <th className="px-2 py-2 text-center font-medium">Thanh toán</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-line/60 last:border-0">
                <td className="px-2 py-2 font-medium text-ink">{r.name}</td>
                <td className="px-2 py-2 text-center"><StepIcon ok={r.s >= 2} /></td>
                <td className="px-2 py-2 text-center"><StepIcon ok={r.s >= 3} /></td>
                <td className="px-2 py-2 text-center"><StepIcon ok={r.s >= 4} /></td>
                <td className="px-2 py-2 text-center"><StepIcon ok={r.paid} /></td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={5} className="py-6 text-center text-xs text-faint">Không có dữ liệu.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

/* ---------- 8. Timeline thanh toán theo hồ sơ ---------- */
const SEG = { paid: "#60BB46", pending: "#FFA726", review: "#0969A7", draft: "var(--line)" };
function segOf(r) {
  if (outstanding(r) <= 0.5 && (r.paid || 0) > 0) return "paid";
  if ((r.status || 0) >= 3) return "review";
  if ((r.status || 0) >= 2 || (r.paid || 0) > 0) return "pending";
  return "draft";
}
export function DocTimeline({ items }) {
  return (
    <Panel title="8. Timeline thanh toán theo hồ sơ">
      <div className="space-y-2.5">
        {items.map((it) => {
          const total = it.rows.reduce((s, r) => s + (r.value || 0), 0) || 1;
          return (
            <div key={it.id} className="flex items-center gap-2">
              <span className="w-16 shrink-0 truncate text-xs font-medium text-sub">{it.name}</span>
              <div className="flex h-3.5 flex-1 overflow-hidden rounded-full bg-hover">
                {it.rows.map((r) => (
                  <div key={r.id} title={`${r.dot}: ${fmtTy(r.value)}`} style={{ width: `${((r.value || 0) / total) * 100}%`, background: SEG[segOf(r)] }} />
                ))}
              </div>
            </div>
          );
        })}
        {items.length === 0 && <p className="py-4 text-center text-xs text-faint">Không có dữ liệu.</p>}
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-sub">
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full" style={{ background: SEG.paid }} /> Đã thanh toán</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full" style={{ background: SEG.pending }} /> Chờ thanh toán</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full" style={{ background: SEG.review }} /> Đang duyệt</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-line" /> Đang lập HS</span>
      </div>
    </Panel>
  );
}

/* ---------- 9. Top chủ đầu tư còn nợ nhiều nhất ---------- */
export function TopDebtors({ customerData }) {
  const rows = customerData.filter((c) => c.outstanding > 0).slice(0, 5);
  const total = rows.reduce((s, c) => s + c.outstanding, 0);
  return (
    <Panel title="9. Top chủ đầu tư còn nợ nhiều nhất">
      <table className="w-full text-sm">
        <thead>
          <tr className="h-10 border-b border-line text-left text-[11px] uppercase tracking-wide text-faint">
            <th className="px-2 py-2 font-medium">STT</th>
            <th className="px-2 py-2 font-medium">Chủ đầu tư</th>
            <th className="px-2 py-2 text-right font-medium">Còn nợ (tỷ)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c, i) => (
            <tr key={c.id} className="border-b border-line/60 last:border-0">
              <td className="px-2 py-2 text-faint">{i + 1}</td>
              <td className="px-2 py-2 font-medium text-ink">{c.name}</td>
              <td className="px-2 py-2 text-right font-semibold tabular-nums text-ink">{fmtTy(c.outstanding)}</td>
            </tr>
          ))}
          {rows.length > 0 && (
            <tr className="font-bold">
              <td className="px-2 py-2 uppercase text-sub" colSpan={2}>Tổng cộng</td>
              <td className="px-2 py-2 text-right tabular-nums text-danger">{fmtTy(total)}</td>
            </tr>
          )}
          {rows.length === 0 && (
            <tr><td colSpan={3} className="py-6 text-center text-xs text-faint">Không có dữ liệu.</td></tr>
          )}
        </tbody>
      </table>
    </Panel>
  );
}
