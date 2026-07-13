import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { TrendingUp, CalendarClock } from "lucide-react";
import { fmtVND, fmtTy, outstanding } from "../../lib/models";
import { useTheme } from "../../context/ThemeContext";

const BRAND = "#60bb46";
const GREEN = "#4fa23a";
const AMBER = "#ffa726";

function monthKey(s) {
  if (!s) return null;
  const [y, m] = s.split("-");
  return `${m}/${y}`;
}
function buildCashflow(installments) {
  const map = new Map();
  const bump = (k, f, a) => {
    if (!k) return;
    if (!map.has(k)) map.set(k, { month: k, collected: 0, due: 0 });
    map.get(k)[f] += a;
  };
  for (const r of installments) {
    if (r.ngayTT && r.paid) bump(monthKey(r.ngayTT), "collected", r.paid);
    if (r.ngayDenHan && r.value) bump(monthKey(r.ngayDenHan), "due", r.value);
  }
  return [...map.values()].sort((a, b) => {
    const [ma, ya] = a.month.split("/").map(Number);
    const [mb, yb] = b.month.split("/").map(Number);
    return ya - yb || ma - mb;
  });
}
function buildForecast(installments, customers) {
  const nameById = new Map(customers.map((c) => [c.id, c.name]));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const limit = new Date(today);
  limit.setDate(limit.getDate() + 90);
  return installments
    .filter((r) => {
      if (!r.ngayDenHan || outstanding(r) <= 0) return false;
      const due = new Date(r.ngayDenHan + "T00:00:00");
      return due >= today && due <= limit;
    })
    .map((r) => ({
      label: `${nameById.get(r.customerId) || r.contractName} · ${r.dot}`,
      value: outstanding(r),
      ngayDenHan: r.ngayDenHan,
    }))
    .sort((a, b) => a.ngayDenHan.localeCompare(b.ngayDenHan));
}

function Card({ icon: Icon, title, sub, empty, children }) {
  return (
    <div className="rounded-xl border border-line bg-card p-4 shadow-card">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/15 text-brand-500">
          <Icon size={20} />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-ink">{title}</h3>
          {sub && <p className="text-xs text-faint">{sub}</p>}
        </div>
      </div>
      {empty ? (
        <div className="flex h-56 items-center justify-center text-sm text-faint">
          Chưa có dữ liệu phù hợp.
        </div>
      ) : (
        children
      )}
    </div>
  );
}

export default function TrendCharts({ installments, customers }) {
  const { isDark } = useTheme();
  const cashflow = buildCashflow(installments);
  const forecast = buildForecast(installments, customers);

  const grid = isDark ? "#24314a" : "#f1f5f9";
  const axis = isDark ? "#94a3b8" : "#64748b";
  const tipStyle = {
    background: isDark ? "#111a2e" : "#fff",
    border: `1px solid ${isDark ? "#24314a" : "#e2e8f0"}`,
    borderRadius: 8,
    fontSize: 12,
  };

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <Card
        icon={TrendingUp}
        title="Dòng tiền theo tháng"
        sub="Đã thu (theo ngày TT) vs Đến hạn (theo ngày đến hạn)"
        empty={cashflow.length === 0}
      >
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={cashflow} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: axis }} />
            <YAxis tickFormatter={fmtTy} tick={{ fontSize: 11, fill: axis }} width={48} />
            <Tooltip formatter={(v) => fmtVND(v)} contentStyle={tipStyle} cursor={{ fill: grid }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="collected" name="Đã thu" fill={GREEN} radius={[4, 4, 0, 0]} isAnimationActive={false} />
            <Bar dataKey="due" name="Đến hạn" fill={BRAND} radius={[4, 4, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card
        icon={CalendarClock}
        title="Dự báo thu 90 ngày tới"
        sub="Các đợt còn phải thu, có ngày đến hạn trong 90 ngày"
        empty={forecast.length === 0}
      >
        <ResponsiveContainer width="100%" height={260}>
          <BarChart layout="vertical" data={forecast} margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={grid} horizontal={false} />
            <XAxis type="number" tickFormatter={fmtTy} tick={{ fontSize: 11, fill: axis }} />
            <YAxis type="category" dataKey="label" width={140} tick={{ fontSize: 11, fill: axis }} />
            <Tooltip formatter={(v) => fmtVND(v)} contentStyle={tipStyle} cursor={{ fill: grid }} />
            <Bar dataKey="value" name="Phải thu" fill={AMBER} radius={[0, 4, 4, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
