import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LabelList,
} from "recharts";
import {
  FileText,
  CircleDollarSign,
  Hourglass,
  AlertTriangle,
  FolderOpen,
  Clock,
  RotateCw,
  Building2,
  ChevronRight,
  FileEdit,
  Send,
  UserCheck,
  CheckCircle2,
  FileSpreadsheet,
  FileBarChart2,
} from "lucide-react";
import { fmtVND, fmtTy, outstanding, daysLate } from "../../lib/models";
import { useTheme } from "../../context/ThemeContext";

const BLUE = "#0969A7";
const GREEN = "#60BB46";
const ORANGE = "#FFA726";

export function Panel({ title, sub, children, className = "", extra }) {
  return (
    <section className={`rounded-xl border border-line bg-card p-4 shadow-card ${className}`}>
      {title && (
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-ink">{title}</h3>
            {sub && <p className="text-xs text-faint">{sub}</p>}
          </div>
          {extra}
        </div>
      )}
      {children}
    </section>
  );
}

const pct = (v, base) => (base > 0 ? Math.round((v / base) * 1000) / 10 : 0);
const tip = (isDark) => ({
  background: isDark ? "#111a2e" : "#fff",
  border: "1px solid var(--line)",
  borderRadius: 8,
  fontSize: 12,
});

/* ---------- Thanh lọc ngang ---------- */
function FSel({ label, value, onChange, children }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-line bg-card px-2.5 shadow-sm">
      <span className="whitespace-nowrap text-xs font-semibold text-faint">{label}</span>
      <select value={value} onChange={onChange} className="h-9 min-w-[86px] bg-transparent text-sm text-ink outline-none">
        {children}
      </select>
    </div>
  );
}
export function FilterBar({ years, customers, contracts, filters, onChange, onRefresh, onExport, onReport }) {
  const projList = contracts.filter((c) => filters.customerId === "all" || c.customerId === filters.customerId);
  const btn = "flex h-9 items-center gap-1.5 rounded-lg border border-line bg-card px-3 text-sm font-medium text-sub shadow-sm hover:border-brand-400 hover:text-brand-500";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <FSel label="Năm" value={filters.year} onChange={(e) => onChange({ ...filters, year: e.target.value })}>
        <option value="all">Tất cả</option>
        {years.map((y) => (<option key={y} value={y}>{y}</option>))}
      </FSel>
      <FSel label="Chủ đầu tư" value={filters.customerId} onChange={(e) => onChange({ ...filters, customerId: e.target.value, contractId: "all" })}>
        <option value="all">Tất cả</option>
        {customers.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
      </FSel>
      <FSel label="Dự án" value={filters.contractId} onChange={(e) => onChange({ ...filters, contractId: e.target.value })}>
        <option value="all">Tất cả</option>
        {projList.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
      </FSel>
      <FSel label="Trạng thái" value={filters.status} onChange={(e) => onChange({ ...filters, status: e.target.value })}>
        <option value="all">Tất cả</option>
        <option value="overdue">Có quá hạn</option>
        <option value="progress">Đang thực hiện</option>
        <option value="done">Đã thu đủ</option>
      </FSel>
      <button onClick={onRefresh} className={`ml-auto ${btn}`}>
        <RotateCw size={14} /> Làm mới
      </button>
      <button onClick={onExport} className={btn}>
        <FileSpreadsheet size={14} className="text-brand-500" /> Xuất Excel
      </button>
      <button onClick={onReport} className={btn}>
        <FileBarChart2 size={14} /> Báo cáo
      </button>
    </div>
  );
}

/* ---------- 6 thẻ KPI (có thanh %) ---------- */
export function KpiCards({ kpis, installments }) {
  const base = kpis.totalPaid + kpis.outstanding;
  const lateRows = installments.filter((r) => daysLate(r) > 0);
  const avgAge = lateRows.length ? Math.round(lateRows.reduce((s, r) => s + daysLate(r), 0) / lateRows.length) : 0;
  const cards = [
    { icon: FileText, label: "Tổng giá trị hợp đồng", value: fmtTy(kpis.totalContract || base), sub: "100%", bar: 100, tone: "accent" },
    { icon: CircleDollarSign, label: "Đã thanh toán", value: fmtTy(kpis.totalPaid), sub: `${pct(kpis.totalPaid, base)}% so với HĐ`, bar: pct(kpis.totalPaid, base), tone: "brand" },
    { icon: Hourglass, label: "Chờ thanh toán", value: fmtTy(kpis.outstanding), sub: `${pct(kpis.outstanding, base)}% so với HĐ`, bar: pct(kpis.outstanding, base), tone: "warning" },
    { icon: AlertTriangle, label: "Quá hạn", value: fmtTy(kpis.overdue), sub: `${pct(kpis.overdue, base)}%`, bar: pct(kpis.overdue, base), tone: "danger" },
    { icon: FolderOpen, label: "Hồ sơ đang trình", value: `${kpis.sentHSCount} bộ`, sub: "chờ thu", tone: "accent" },
    { icon: Clock, label: "Tuổi công nợ TB", value: `${avgAge} ngày`, sub: "nợ quá hạn", tone: "muted" },
  ];
  const TONE = {
    accent: { ic: "text-accent bg-accent/10", v: "text-accent", bar: BLUE },
    brand: { ic: "text-brand-500 bg-brand-500/10", v: "text-brand-500", bar: GREEN },
    warning: { ic: "text-warning bg-warning/10", v: "text-warning", bar: ORANGE },
    danger: { ic: "text-danger bg-danger/10", v: "text-danger", bar: "#E53935" },
    muted: { ic: "text-sub bg-muted/15", v: "text-ink", bar: "#9E9E9E" },
  };
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((c) => {
        const t = TONE[c.tone];
        return (
          <div key={c.label} className="rounded-xl border border-line bg-card p-3 shadow-card">
            <div className="flex items-center gap-2">
              <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${t.ic}`}><c.icon size={16} /></span>
              <span className="text-[11px] font-semibold uppercase leading-tight text-faint">{c.label}</span>
            </div>
            <div className={`mt-2 text-xl font-bold tabular-nums ${t.v}`}>{c.value}</div>
            {c.bar != null && (
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-hover">
                <div className="h-full rounded-full" style={{ width: `${Math.min(100, c.bar)}%`, background: t.bar }} />
              </div>
            )}
            <div className="mt-1 text-[11px] text-faint">{c.sub}</div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- 1. Công nợ theo chủ đầu tư ---------- */
export function DebtByCustomer({ customerData }) {
  const { isDark } = useTheme();
  const data = customerData
    .filter((c) => c.outstanding > 0)
    .slice(0, 6)
    .map((c) => ({ name: c.name.replace(/^CÔNG TY (TNHH )?/i, ""), value: Math.round((c.outstanding / 1e9) * 10) / 10 }));
  return (
    <Panel title="1. Công nợ theo chủ đầu tư" sub="Đơn vị: tỷ đồng">
      <ResponsiveContainer width="100%" height={230}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 28 }}>
          <CartesianGrid horizontal={false} stroke="var(--line)" />
          <XAxis type="number" tick={{ fontSize: 11, fill: "var(--faint)" }} />
          <YAxis type="category" dataKey="name" width={96} tick={{ fontSize: 10, fill: "var(--sub)" }} />
          <Tooltip formatter={(v) => v + " tỷ"} contentStyle={tip(isDark)} />
          <Bar dataKey="value" fill={BLUE} radius={[0, 4, 4, 0]} isAnimationActive={false}>
            <LabelList dataKey="value" position="right" fontSize={11} fill="var(--sub)" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Panel>
  );
}

/* ---------- 2. Cơ cấu công nợ (donut + tổng giữa) ---------- */
export function DebtStructure({ kpis }) {
  const { isDark } = useTheme();
  const base = kpis.totalPaid + kpis.outstanding;
  const data = [
    { name: "Đã thanh toán", value: kpis.totalPaid, fill: GREEN },
    { name: "Chờ thanh toán", value: kpis.outstanding, fill: ORANGE },
  ].filter((d) => d.value > 0);
  return (
    <Panel title="2. Cơ cấu công nợ" sub="Đơn vị: tỷ đồng">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <ResponsiveContainer width="100%" height={210}>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={62} outerRadius={92} paddingAngle={2} isAnimationActive={false}>
                {data.map((d, i) => (<Cell key={i} fill={d.fill} stroke="var(--card)" strokeWidth={2} />))}
              </Pie>
              <Tooltip formatter={(v) => fmtVND(v)} contentStyle={tip(isDark)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[11px] uppercase text-faint">Tổng công nợ</span>
            <span className="text-xl font-bold text-ink">{fmtTy(kpis.outstanding)}</span>
          </div>
        </div>
        <div className="shrink-0 space-y-2 text-xs">
          <div>
            <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: GREEN }} /> Đã thanh toán</div>
            <div className="pl-4 font-semibold text-ink">{fmtTy(kpis.totalPaid)} ({pct(kpis.totalPaid, base)}%)</div>
          </div>
          <div>
            <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: ORANGE }} /> Chờ thanh toán</div>
            <div className="pl-4 font-semibold text-ink">{fmtTy(kpis.outstanding)} ({pct(kpis.outstanding, base)}%)</div>
          </div>
        </div>
      </div>
    </Panel>
  );
}

/* ---------- 3. Dòng tiền thu theo tháng (line) ---------- */
export function CashflowLine({ installments }) {
  const { isDark } = useTheme();
  const map = new Map();
  for (const r of installments) {
    if (!r.ngayTT || !(r.paid > 0)) continue;
    const key = r.ngayTT.slice(0, 7);
    map.set(key, (map.get(key) || 0) + r.paid);
  }
  const data = [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-7)
    .map(([k, v]) => ({ month: k.slice(5) + "/" + k.slice(0, 4), value: Math.round((v / 1e9) * 10) / 10 }));
  return (
    <Panel title="3. Dòng tiền thu theo tháng" sub="Đơn vị: tỷ đồng">
      <ResponsiveContainer width="100%" height={230}>
        <LineChart data={data} margin={{ left: -8, right: 12, top: 12 }}>
          <CartesianGrid stroke="var(--line)" />
          <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--faint)" }} />
          <YAxis tick={{ fontSize: 11, fill: "var(--faint)" }} />
          <Tooltip formatter={(v) => v + " tỷ"} contentStyle={tip(isDark)} />
          <Line type="monotone" dataKey="value" stroke={BLUE} strokeWidth={2.5} dot={{ r: 3, fill: BLUE }} isAnimationActive={false}>
            <LabelList dataKey="value" position="top" fontSize={11} fill="var(--sub)" />
          </Line>
        </LineChart>
      </ResponsiveContainer>
      {data.length === 0 && <p className="text-center text-xs text-faint">Chưa có dữ liệu thực thu.</p>}
    </Panel>
  );
}

/* ---------- 4. Cảnh báo ---------- */
export function AlertsPanel({ overdue, dueSoon }) {
  const overTotal = overdue.reduce((s, r) => s + r.remain, 0);
  const due7 = dueSoon.filter((r) => r.daysTo <= 7);
  const dueTotal = due7.reduce((s, r) => s + r.remain, 0);
  return (
    <Panel title="4. Cảnh báo">
      <div className="space-y-3">
        <div className="rounded-lg border border-danger/30 bg-danger/5 p-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-danger"><AlertTriangle size={13} /> QUÁ HẠN</div>
          <div className="mt-1 flex items-center justify-between text-xs"><span className="text-sub">{overdue.length} dự án</span><span className="font-semibold text-danger">{fmtTy(overTotal)}</span></div>
        </div>
        <div className="rounded-lg border border-warning/30 bg-warning/5 p-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-warning"><Clock size={13} /> ĐẾN HẠN 7 NGÀY TỚI</div>
          <div className="mt-1 flex items-center justify-between text-xs"><span className="text-sub">{due7.length} dự án</span><span className="font-semibold text-warning">{fmtTy(dueTotal)}</span></div>
        </div>
        <div className="rounded-lg border border-line bg-hover/40 p-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-sub"><FolderOpen size={13} /> HỒ SƠ TREO</div>
          <div className="mt-1 text-xs text-faint">Theo dõi ở tab Chi tiết</div>
        </div>
      </div>
    </Panel>
  );
}

/* ---------- 5. Dự án cần ưu tiên xử lý ---------- */
export function PriorityProjects({ projects, className = "" }) {
  return (
    <Panel title="5. Dự án cần ưu tiên xử lý" className={className}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {projects.map((p) => {
          const badge =
            p.st === "overdue"
              ? { t: p.dueLabel || "Quá hạn", c: "text-danger border-danger/40 bg-danger/5" }
              : p.dueLabel
              ? { t: p.dueLabel, c: "text-warning border-warning/40 bg-warning/5" }
              : { t: "Đang thực hiện", c: "text-accent border-accent/40 bg-accent/5" };
          return (
            <div key={p.id} className="rounded-xl border border-line bg-page/40 p-3">
              <div className="flex items-center gap-2">
                <Building2 size={15} className="shrink-0 text-brand-500" />
                <span className="truncate text-sm font-bold text-ink">{p.name}</span>
              </div>
              <span className={`mt-2 inline-block rounded-full border px-2 py-0.5 text-[11px] font-medium ${badge.c}`}>{badge.t}</span>
              <div className="mt-2 space-y-0.5 text-xs">
                <div className="flex justify-between"><span className="text-faint">Giá trị HĐ</span><span className="tabular-nums text-sub">{fmtTy(p.value)}</span></div>
                <div className="flex justify-between"><span className="text-faint">Đã thu</span><span className="tabular-nums text-brand-500">{fmtTy(p.paid)} ({p.pctPaid}%)</span></div>
                <div className="flex justify-between"><span className="text-faint">Còn nợ</span><span className="font-semibold tabular-nums text-ink">{fmtTy(p.os)}</span></div>
                {p.hs && <div className="flex justify-between"><span className="text-faint">HS thanh toán</span><span className="text-sub">{p.hs}</span></div>}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-hover"><div className="h-full rounded-full bg-brand-500" style={{ width: `${p.pctPaid}%` }} /></div>
                <span className="text-[11px] font-semibold text-brand-500">{p.pctPaid}%</span>
              </div>
            </div>
          );
        })}
        {projects.length === 0 && <p className="py-4 text-center text-xs text-faint">Không có dự án.</p>}
      </div>
    </Panel>
  );
}

/* ---------- 6. Aging report ---------- */
export function AgingBars({ installments }) {
  const buckets = [
    { label: "0 - 30 ngày", color: GREEN, value: 0 },
    { label: "31 - 60 ngày", color: ORANGE, value: 0 },
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
    <Panel title="6. Aging report (tuổi công nợ)" sub="Đơn vị: tỷ đồng">
      <div className="space-y-3">
        {buckets.map((b) => (
          <div key={b.label}>
            <div className="mb-1 flex justify-between text-xs"><span className="text-sub">{b.label}</span><span className="font-semibold tabular-nums text-ink">{fmtTy(b.value)}</span></div>
            <div className="h-3 overflow-hidden rounded-full bg-hover"><div className="h-full rounded-full" style={{ width: `${(b.value / max) * 100}%`, background: b.color }} /></div>
          </div>
        ))}
        <div className="flex justify-between border-t border-line pt-2 text-xs font-bold"><span className="uppercase text-sub">Tổng cộng</span><span className="tabular-nums text-ink">{fmtTy(total)}</span></div>
      </div>
    </Panel>
  );
}

/* ---------- 7. Top chủ đầu tư còn nợ ---------- */
export function TopDebtors({ customerData }) {
  const rows = customerData.filter((c) => c.outstanding > 0).slice(0, 5);
  const total = rows.reduce((s, c) => s + c.outstanding, 0);
  return (
    <Panel title="7. Top chủ đầu tư còn nợ nhiều nhất" sub="Đơn vị: tỷ đồng">
      <table className="w-full text-sm">
        <tbody>
          {rows.map((c, i) => (
            <tr key={c.id} className="border-b border-line/60 last:border-0">
              <td className="py-2 pr-2 text-faint">{i + 1}</td>
              <td className="py-2 pr-2 font-medium text-ink">{c.name.replace(/^CÔNG TY (TNHH )?/i, "")}</td>
              <td className="py-2 text-right font-semibold tabular-nums text-ink">{fmtTy(c.outstanding)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-bold"><td className="py-2 uppercase text-sub" colSpan={2}>Tổng cộng</td><td className="py-2 text-right tabular-nums text-accent">{fmtTy(total)}</td></tr>
        </tfoot>
      </table>
    </Panel>
  );
}

/* ---------- 8. Tình trạng hồ sơ thanh toán (luồng) ---------- */
export function DocFlow({ counts }) {
  const steps = [
    { icon: FileEdit, label: "Đang lập", n: counts.lap, tone: "text-accent bg-accent/10" },
    { icon: Send, label: "Đã trình CĐT", n: counts.trinh, tone: "text-accent bg-accent/10" },
    { icon: UserCheck, label: "Đang duyệt", n: counts.duyet, tone: "text-warning bg-warning/10" },
    { icon: Hourglass, label: "Chờ thanh toán", n: counts.cho, tone: "text-warning bg-warning/10" },
    { icon: CheckCircle2, label: "Đã thanh toán", n: counts.da, tone: "text-brand-500 bg-brand-500/10" },
  ];
  return (
    <Panel title="8. Tình trạng hồ sơ thanh toán">
      <div className="flex flex-col items-stretch gap-2 md:flex-row md:items-center">
        {steps.map((s, i) => (
          <div key={s.label} className="flex flex-1 items-center gap-2">
            <div className="flex flex-1 items-center gap-3 rounded-xl border border-line bg-page/40 p-3">
              <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.tone}`}><s.icon size={20} /></span>
              <div>
                <div className="text-[11px] font-semibold uppercase text-faint">{s.label}</div>
                <div className="text-xl font-bold text-ink">{s.n}</div>
                <div className="text-[11px] text-faint">bộ hồ sơ</div>
              </div>
            </div>
            {i < steps.length - 1 && <ChevronRight size={18} className="hidden shrink-0 text-faint md:block" />}
          </div>
        ))}
      </div>
    </Panel>
  );
}
