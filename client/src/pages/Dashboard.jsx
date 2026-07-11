import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  Legend,
} from "recharts";
import { TrendingUp, CalendarClock, Users, AlertTriangle } from "lucide-react";
import api from "../lib/data";
import { fmtVND, fmtTy, outstanding, daysLate } from "../lib/models";
import { useTheme } from "../context/ThemeContext";

const COLORS = {
  brand: "#2563eb",
  green: "#10b981",
  amber: "#f59e0b",
  red: "#ef4444",
  slate: "#94a3b8",
};

function monthKey(s) {
  if (!s) return null;
  const [y, m] = s.split("-");
  return `${m}/${y}`;
}

function buildCashflow(installments) {
  const map = new Map();
  const bump = (key, field, amt) => {
    if (!key) return;
    if (!map.has(key)) map.set(key, { month: key, collected: 0, due: 0 });
    map.get(key)[field] += amt;
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

function buildByCustomer(installments, customers) {
  const nameById = new Map(customers.map((c) => [c.id, c.name]));
  const map = new Map();
  for (const r of installments) {
    const os = outstanding(r);
    if (os <= 0) continue;
    const name = nameById.get(r.customerId) || r.customerId || "Khác";
    map.set(name, (map.get(name) || 0) + os);
  }
  return [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function buildAging(installments) {
  const buckets = [
    { name: "1–30 ngày", value: 0, fill: COLORS.amber },
    { name: "31–60 ngày", value: 0, fill: "#fb923c" },
    { name: "61–90 ngày", value: 0, fill: "#f87171" },
    { name: "> 90 ngày", value: 0, fill: COLORS.red },
  ];
  for (const r of installments) {
    const d = daysLate(r);
    if (d <= 0) continue;
    const os = outstanding(r);
    if (d <= 30) buckets[0].value += os;
    else if (d <= 60) buckets[1].value += os;
    else if (d <= 90) buckets[2].value += os;
    else buckets[3].value += os;
  }
  return buckets;
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

function ChartCard({ icon: Icon, title, subtitle, children, empty }) {
  return (
    <div className="rounded-2xl border border-line bg-card p-5 shadow-card">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/15 text-brand-600 dark:text-brand-400">
          <Icon size={16} />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-ink">{title}</h3>
          {subtitle && <p className="text-xs text-faint">{subtitle}</p>}
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

const tip = (v) => fmtVND(v);
const axisTy = (v) => fmtTy(v);

export default function Dashboard() {
  const { isDark } = useTheme();
  const [inst, setInst] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [i, c] = await Promise.all([api.listInstallments(), api.listCustomers()]);
      setInst(i);
      setCustomers(c);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="py-20 text-center text-faint">Đang tải…</div>;

  const cashflow = buildCashflow(inst);
  const byCustomer = buildByCustomer(inst, customers);
  const aging = buildAging(inst);
  const forecast = buildForecast(inst, customers);
  const agingTotal = aging.reduce((s, b) => s + b.value, 0);

  // Màu biểu đồ theo theme
  const grid = isDark ? "#24314a" : "#f1f5f9";
  const axis = isDark ? "#94a3b8" : "#64748b";
  const axis2 = isDark ? "#64748b" : "#94a3b8";
  const tipStyle = {
    background: isDark ? "#111a2e" : "#ffffff",
    border: `1px solid ${isDark ? "#24314a" : "#e2e8f0"}`,
    borderRadius: 8,
    fontSize: 12,
  };
  const tipLabel = { color: isDark ? "#e8eef7" : "#334155" };
  const tipItem = { color: isDark ? "#cbd5e1" : "#334155" };

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      {/* 1. Dòng tiền theo tháng */}
      <ChartCard
        icon={TrendingUp}
        title="Dòng tiền theo tháng"
        subtitle="Đã thu (theo ngày TT) vs Đến hạn (theo ngày đến hạn)"
        empty={cashflow.length === 0}
      >
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={cashflow} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: axis }} />
            <YAxis tickFormatter={axisTy} tick={{ fontSize: 11, fill: axis2 }} width={48} />
            <Tooltip formatter={tip} contentStyle={tipStyle} labelStyle={tipLabel} itemStyle={tipItem} cursor={{ fill: grid }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="collected" name="Đã thu" fill={COLORS.green} radius={[4, 4, 0, 0]} isAnimationActive={false} />
            <Bar dataKey="due" name="Đến hạn" fill={COLORS.brand} radius={[4, 4, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 2. Dự báo thu 90 ngày */}
      <ChartCard
        icon={CalendarClock}
        title="Dự báo thu 90 ngày tới"
        subtitle="Các đợt còn phải thu, có ngày đến hạn trong 90 ngày"
        empty={forecast.length === 0}
      >
        <ResponsiveContainer width="100%" height={260}>
          <BarChart layout="vertical" data={forecast} margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={grid} horizontal={false} />
            <XAxis type="number" tickFormatter={axisTy} tick={{ fontSize: 11, fill: axis2 }} />
            <YAxis type="category" dataKey="label" width={140} tick={{ fontSize: 11, fill: axis }} />
            <Tooltip formatter={tip} contentStyle={tipStyle} labelStyle={tipLabel} itemStyle={tipItem} cursor={{ fill: grid }} />
            <Bar dataKey="value" name="Phải thu" fill={COLORS.amber} radius={[0, 4, 4, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 3. Còn phải thu theo khách hàng */}
      <ChartCard
        icon={Users}
        title="Còn phải thu theo khách hàng"
        subtitle={`${byCustomer.length} khách hàng`}
        empty={byCustomer.length === 0}
      >
        <ResponsiveContainer width="100%" height={260}>
          <BarChart layout="vertical" data={byCustomer} margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={grid} horizontal={false} />
            <XAxis type="number" tickFormatter={axisTy} tick={{ fontSize: 11, fill: axis2 }} />
            <YAxis
              type="category"
              dataKey="name"
              width={150}
              tick={{ fontSize: 10, fill: axis }}
              tickFormatter={(s) => (s.length > 24 ? s.slice(0, 22) + "…" : s)}
            />
            <Tooltip formatter={tip} contentStyle={tipStyle} labelStyle={tipLabel} itemStyle={tipItem} cursor={{ fill: grid }} />
            <Bar dataKey="value" name="Còn phải thu" fill={COLORS.brand} radius={[0, 4, 4, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 4. Tuổi nợ quá hạn */}
      <ChartCard
        icon={AlertTriangle}
        title="Tuổi nợ quá hạn"
        subtitle={agingTotal > 0 ? `Tổng quá hạn: ${fmtVND(agingTotal)}` : "Không có nợ quá hạn"}
        empty={agingTotal === 0}
      >
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={aging} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: axis }} />
            <YAxis tickFormatter={axisTy} tick={{ fontSize: 11, fill: axis2 }} width={48} />
            <Tooltip formatter={tip} contentStyle={tipStyle} labelStyle={tipLabel} itemStyle={tipItem} cursor={{ fill: grid }} />
            <Bar dataKey="value" name="Nợ quá hạn" radius={[4, 4, 0, 0]} isAnimationActive={false}>
              {aging.map((b, i) => (
                <Cell key={i} fill={b.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
