import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";
import { SlidersHorizontal } from "lucide-react";
import { fmtTy } from "../../lib/models";
import { useTheme } from "../../context/ThemeContext";

function Sel({ label, value, onChange, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-faint">
        {label}
      </span>
      <select
        value={value}
        onChange={onChange}
        className="h-10 w-full rounded-lg border border-line bg-page px-3 text-sm text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
      >
        {children}
      </select>
    </label>
  );
}

const LEGEND = [
  { c: "bg-brand-500", t: "Bình thường" },
  { c: "bg-warning", t: "Sắp đến hạn" },
  { c: "bg-danger", t: "Quá hạn" },
  { c: "bg-line", t: "Chưa đến hạn" },
];

export default function DashboardFilters({ years, customers, contracts, filters, onChange, kpis }) {
  const { isDark } = useTheme();
  const set = (k) => (e) => onChange({ ...filters, [k]: e.target.value });
  const progress = Math.round((kpis.progress || 0) * 10) / 10;
  // Dự án lọc theo chủ đầu tư đang chọn
  const projList = contracts.filter(
    (c) => filters.customerId === "all" || c.customerId === filters.customerId
  );

  return (
    <aside className="w-full shrink-0 space-y-4 xl:w-64 xl:sticky xl:top-4 xl:self-start">
      {/* Bộ lọc */}
      <div className="rounded-xl border border-line bg-card p-4 shadow-card">
        <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-ink">
          <SlidersHorizontal size={16} className="text-brand-500" /> Bộ lọc
        </div>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-1">
          <Sel label="Năm" value={filters.year} onChange={set("year")}>
            <option value="all">Tất cả</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </Sel>
          <Sel label="Chủ đầu tư" value={filters.customerId} onChange={(e) => onChange({ ...filters, customerId: e.target.value, contractId: "all" })}>
            <option value="all">Tất cả</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Sel>
          <Sel label="Dự án" value={filters.contractId} onChange={set("contractId")}>
            <option value="all">Tất cả</option>
            {projList.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Sel>
          <Sel label="Trạng thái" value={filters.status} onChange={set("status")}>
            <option value="all">Tất cả</option>
            <option value="overdue">Có quá hạn</option>
            <option value="progress">Đang thực hiện</option>
            <option value="done">Đã thu đủ</option>
          </Sel>
        </div>
      </div>

      {/* Tỷ lệ thu tiền */}
      <div className="rounded-xl border border-line bg-card p-4 shadow-card">
        <div className="text-sm font-bold uppercase tracking-wide text-ink">Tỷ lệ thu tiền</div>
        <div className="relative">
          <ResponsiveContainer width="100%" height={150}>
            <RadialBarChart
              innerRadius="70%"
              outerRadius="100%"
              data={[{ name: "Thu", value: progress, fill: "#60BB46" }]}
              startAngle={210}
              endAngle={-30}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
              <RadialBar
                background={{ fill: isDark ? "#24314a" : "#eef1f4" }}
                dataKey="value"
                cornerRadius={10}
                isAnimationActive={false}
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-3">
            <span className="text-[28px] font-bold leading-none text-brand-500">{progress}%</span>
            <span className="mt-1 text-xs text-faint">đã thu</span>
          </div>
        </div>
        <div className="mt-1 flex justify-between border-t border-line pt-2 text-xs">
          <span className="text-sub">Đã thu <b className="text-brand-500">{fmtTy(kpis.totalPaid)}</b></span>
          <span className="text-sub">Còn <b className="text-ink">{fmtTy(kpis.outstanding)}</b></span>
        </div>
      </div>

      {/* Ghi chú */}
      <div className="rounded-xl border border-line bg-card p-4 shadow-card">
        <div className="mb-2 text-sm font-bold uppercase tracking-wide text-ink">Ghi chú</div>
        <div className="space-y-1.5">
          {LEGEND.map((l) => (
            <div key={l.t} className="flex items-center gap-2 text-xs text-sub">
              <span className={`h-3 w-3 rounded-full ${l.c}`} /> {l.t}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
