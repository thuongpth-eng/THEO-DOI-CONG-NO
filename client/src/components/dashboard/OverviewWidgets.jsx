import {
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  Treemap,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import { Gauge, PieChart as PieIcon, LayoutGrid } from "lucide-react";
import { fmtVND, fmtTy } from "../../lib/models";
import { buildAgingSimple } from "../../lib/dashboard";
import { useTheme } from "../../context/ThemeContext";

const TREE_COLORS = ["#60BB46", "#0969A7", "#FFA726", "#4B4F55", "#7cc95f", "#9E9E9E", "#4fa23a", "#096FA7"];

function Card({ icon: Icon, title, sub, children }) {
  return (
    <div className="rounded-xl border border-line bg-card p-4 shadow-card">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/15 text-brand-500">
          <Icon size={20} />
        </span>
        <div>
          <h3 className="text-base font-semibold text-ink">{title}</h3>
          {sub && <p className="text-xs text-faint">{sub}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

// Ô nhãn trong treemap
function TreeCell(props) {
  const { x, y, width, height, name, value, index } = props;
  if (width < 4 || height < 4) return null;
  const show = width > 60 && height > 30;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={TREE_COLORS[index % TREE_COLORS.length]}
        stroke="var(--card)"
        strokeWidth={2}
        rx={4}
      />
      {show && (
        <>
          <text x={x + 8} y={y + 18} fill="#fff" fontSize={11} fontWeight={600}>
            {(name || "").length > 18 ? name.slice(0, 16) + "…" : name}
          </text>
          <text x={x + 8} y={y + 34} fill="#fff" fontSize={11} opacity={0.9}>
            {fmtTy(value)}
          </text>
        </>
      )}
    </g>
  );
}

export default function OverviewWidgets({ kpis, customerData, installments, showGauge = true }) {
  const { isDark } = useTheme();
  const agingData = buildAgingSimple(installments).filter((a) => a.value > 0);
  const treeData = customerData
    .filter((c) => c.outstanding > 0)
    .map((c) => ({ name: c.name, value: c.outstanding }));

  const tipStyle = {
    background: isDark ? "#111a2e" : "#fff",
    border: `1px solid ${isDark ? "#24314a" : "#e2e8f0"}`,
    borderRadius: 8,
    fontSize: 12,
  };
  const progress = Math.round(kpis.progress * 10) / 10;

  return (
    <div className={`grid grid-cols-1 gap-4 ${showGauge ? "xl:grid-cols-3" : "xl:grid-cols-2"}`}>
      {/* Đồng hồ tiến độ thu */}
      {showGauge && (
      <Card icon={Gauge} title="Tiến độ thu tiền" sub="Đã thu / tổng giá trị đợt">
        <div className="relative">
          <ResponsiveContainer width="100%" height={200}>
            <RadialBarChart
              innerRadius="72%"
              outerRadius="100%"
              data={[{ name: "Tiến độ", value: progress, fill: "#60BB46" }]}
              startAngle={210}
              endAngle={-30}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
              <RadialBar background={{ fill: isDark ? "#24314a" : "#eef1f4" }} dataKey="value" cornerRadius={12} isAnimationActive={false} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[32px] font-bold leading-none text-brand-500">{progress}%</span>
            <span className="mt-1 text-xs text-faint">đã thu</span>
          </div>
        </div>
        <div className="mt-1 flex justify-between border-t border-line pt-2 text-xs">
          <span className="text-sub">Đã thu <b className="text-brand-500">{fmtTy(kpis.totalPaid)}</b></span>
          <span className="text-sub">Còn <b className="text-ink">{fmtTy(kpis.outstanding)}</b></span>
        </div>
      </Card>
      )}

      {/* Treemap công nợ theo khách hàng */}
      <Card icon={LayoutGrid} title="Công nợ theo khách hàng" sub={`${treeData.length} chủ đầu tư còn nợ`}>
        <ResponsiveContainer width="100%" height={228}>
          <Treemap
            data={treeData}
            dataKey="value"
            aspectRatio={4 / 3}
            content={<TreeCell />}
            isAnimationActive={false}
          >
            <Tooltip formatter={(v) => fmtVND(v)} contentStyle={tipStyle} />
          </Treemap>
        </ResponsiveContainer>
      </Card>

      {/* Donut tuổi nợ phải thu */}
      <Card icon={PieIcon} title="Tuổi nợ phải thu" sub="Trong hạn · quá hạn">
        <ResponsiveContainer width="100%" height={228}>
          <PieChart>
            <Pie
              data={agingData}
              dataKey="value"
              nameKey="name"
              innerRadius={52}
              outerRadius={82}
              paddingAngle={2}
              isAnimationActive={false}
            >
              {agingData.map((a, i) => (
                <Cell key={i} fill={a.fill} stroke="var(--card)" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => fmtVND(v)} contentStyle={tipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
