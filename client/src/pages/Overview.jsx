import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  Building2,
  AlertTriangle,
  Wallet,
  FileSpreadsheet,
  FileText,
  Download,
  Printer,
  ListTree,
} from "lucide-react";
import api, { backendName } from "../lib/data";
import { fmtVND, fmtTy, summarize, outstanding, daysLate } from "../lib/models";
import { exportExcel, exportCSV, exportJSON, printReport } from "../lib/exporter";
import { buildKpis, buildCustomerProgress } from "../lib/dashboard";
import OverviewWidgets from "../components/dashboard/OverviewWidgets";

function KpiCard({ icon: Icon, label, value, sub, tone = "brand" }) {
  const tones = {
    brand: "bg-brand-500/15 text-brand-600 dark:text-brand-400",
    green: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    amber: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    red: "bg-red-500/15 text-red-600 dark:text-red-400",
    slate: "bg-slate-500/15 text-sub",
  };
  return (
    <div className="rounded-xl border border-line bg-card p-4 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-sub">{label}</span>
        <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${tones[tone]}`}>
          <Icon size={20} />
        </span>
      </div>
      <div className="mt-3 text-[32px] font-bold leading-10 text-ink">{value}</div>
      {sub && <div className="mt-1 text-xs text-faint">{sub}</div>}
    </div>
  );
}

export default function Overview() {
  const nav = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [installments, setInstallments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [ct, inst, cus] = await Promise.all([
        api.listContracts(),
        api.listInstallments(),
        api.listCustomers(),
      ]);
      setContracts(ct);
      setInstallments(inst);
      setCustomers(cus);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <div className="py-20 text-center text-faint">Đang tải dữ liệu…</div>;
  }

  const s = summarize(installments);

  const byContract = contracts.map((c) => {
    const rows = installments.filter((i) => i.contractId === c.id);
    const os = rows.reduce((sum, r) => sum + outstanding(r), 0);
    const late = rows.some((r) => daysLate(r) > 0);
    return { ...c, outstanding: os, late };
  });

  const ExportBtn = ({ icon: Icon, label, onClick }) => (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-lg border border-line bg-card px-3 py-1.5 text-xs font-medium text-sub shadow-sm hover:border-brand-400 hover:text-brand-600"
    >
      <Icon size={14} /> {label}
    </button>
  );

  const kpis = buildKpis(contracts, customers, installments);
  const custData = buildCustomerProgress(customers, installments);

  return (
    <div>
      {/* Thanh hành động */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <button
          onClick={() => nav("/contracts")}
          className="flex h-10 items-center gap-1.5 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700"
        >
          <ListTree size={16} /> Chi tiết công nợ
        </button>
        <div className="flex flex-wrap gap-2">
        <ExportBtn
          icon={FileSpreadsheet}
          label="Xuất Excel"
          onClick={() => exportExcel(contracts, installments)}
        />
        <ExportBtn icon={FileText} label="CSV" onClick={() => exportCSV(installments)} />
        <ExportBtn
          icon={Download}
          label="Sao lưu JSON"
          onClick={() => exportJSON({ customers, contracts, installments })}
        />
        <ExportBtn
          icon={Printer}
          label="In / PDF"
          onClick={() => printReport(contracts, installments)}
        />
        </div>
      </div>

      {backendName === "local" && (
        <div className="mb-5 flex items-center gap-2 rounded-lg border border-line bg-card px-4 py-2.5 text-sm text-sub">
          <AlertTriangle size={16} className="text-amber-500" />
          Đang chạy chế độ <b className="mx-1">thử nghiệm (local)</b> — dữ liệu thật
          đã chuyển từ file v31. Khi IT cắm Firebase, tự chuyển sang dữ liệu đám mây.
        </div>
      )}

      {/* KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={Wallet}
          label="Còn phải thu"
          value={fmtTy(s.outstanding)}
          sub={fmtVND(s.outstanding)}
          tone="brand"
        />
        <KpiCard
          icon={TrendingUp}
          label="Đã thu"
          value={fmtTy(s.totalPaid)}
          sub={`Trên tổng ${fmtTy(s.totalValue)}`}
          tone="green"
        />
        <KpiCard
          icon={AlertTriangle}
          label="Nợ quá hạn"
          value={fmtTy(s.overdue)}
          sub={s.overdue > 0 ? "Cần thu hồi gấp" : "Không có"}
          tone={s.overdue > 0 ? "red" : "slate"}
        />
        <KpiCard
          icon={Building2}
          label="Công trình / Khách hàng"
          value={`${contracts.length} / ${customers.length}`}
          sub="Hợp đồng đang theo dõi"
          tone="slate"
        />
      </div>

      {/* Widget ERP: đồng hồ tiến độ · treemap KH · donut tuổi nợ */}
      <div className="mt-6">
        <OverviewWidgets kpis={kpis} customerData={custData} installments={installments} />
      </div>

      {/* Bảng chi tiết công nợ */}
      <div className="mt-6 rounded-xl border border-line bg-card shadow-card">
        <div className="border-b border-line px-5 py-4">
          <h2 className="text-base font-semibold text-ink">Chi tiết công nợ theo công trình</h2>
          <p className="text-xs text-faint">
            {contracts.length} công trình · sắp theo còn phải thu
          </p>
        </div>

        {/* Danh sách dạng thẻ — điện thoại */}
        <div className="space-y-2 p-3 md:hidden">
          {byContract
            .slice()
            .sort((a, b) => b.outstanding - a.outstanding)
            .map((c) => (
              <div key={c.id} className="rounded-xl border border-line p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-semibold text-ink">{c.name}</span>
                  {c.late && (
                    <span className="shrink-0 rounded-full bg-danger px-2 py-0.5 text-[10px] font-semibold text-white">
                      QUÁ HẠN
                    </span>
                  )}
                </div>
                <div className="mt-0.5 truncate text-xs text-faint">{c.customerName}</div>
                <div className="mt-2 flex items-end justify-between">
                  <span className="text-[11px] text-faint">Còn phải thu</span>
                  <span className="font-semibold tabular-nums text-brand-500">
                    {fmtVND(c.outstanding)}
                  </span>
                </div>
              </div>
            ))}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="h-12 border-b border-line text-left text-xs uppercase tracking-wider text-faint">
                <th className="px-3 py-3 font-medium">Công trình</th>
                <th className="px-3 py-3 font-medium">Chủ đầu tư</th>
                <th className="px-3 py-3 text-right font-medium">Giá trị HĐ</th>
                <th className="px-3 py-3 text-right font-medium">Còn phải thu</th>
              </tr>
            </thead>
            <tbody>
              {byContract
                .slice()
                .sort((a, b) => b.outstanding - a.outstanding)
                .map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-line/60 last:border-0 hover:bg-hover"
                  >
                    <td className="px-3 py-3 font-semibold text-ink">
                      <div className="flex items-center gap-2">
                        {c.name}
                        {c.late && (
                          <span className="rounded-full bg-danger px-2 py-0.5 text-[10px] font-semibold text-white">
                            QUÁ HẠN
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-sub">{c.customerName}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-sub">
                      {fmtVND(c.totalAfterTax)}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold tabular-nums text-ink">
                      {fmtVND(c.outstanding)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
