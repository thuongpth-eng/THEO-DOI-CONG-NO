import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileSpreadsheet, FileText, Download, Printer } from "lucide-react";
import api, { backendName } from "../lib/data";
import { fmtVND, outstanding, daysLate } from "../lib/models";
import { exportExcel, exportCSV, exportJSON, printReport } from "../lib/exporter";
import {
  buildKpis,
  buildCustomerProgress,
  buildDueSoon,
  buildOverdue,
} from "../lib/dashboard";
import KpiStrip from "../components/dashboard/KpiStrip";
import OverviewWidgets from "../components/dashboard/OverviewWidgets";
import CollectionCalendar from "../components/dashboard/CollectionCalendar";
import DueLists from "../components/dashboard/DueLists";
import TrendCharts from "../components/dashboard/TrendCharts";

function ExportBtn({ icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex h-10 items-center gap-1.5 rounded-lg border border-line bg-card px-3 text-xs font-medium text-sub shadow-sm hover:border-brand-400 hover:text-brand-500"
    >
      <Icon size={14} /> <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

export default function Overview() {
  const nav = useNavigate();
  const [view, setView] = useState("dash"); // 'dash' | 'detail'
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

  if (loading)
    return <div className="py-20 text-center text-faint">Đang tải dữ liệu…</div>;

  const kpis = buildKpis(contracts, customers, installments);
  const custData = buildCustomerProgress(customers, installments);
  const dueSoon = buildDueSoon(installments, 30);
  const overdueRows = buildOverdue(installments);

  const byContract = contracts
    .map((c) => {
      const rows = installments.filter((i) => i.contractId === c.id);
      return {
        ...c,
        count: rows.length,
        paid: rows.reduce((s, r) => s + (r.paid || 0), 0),
        os: rows.reduce((s, r) => s + outstanding(r), 0),
        late: rows.some((r) => daysLate(r) > 0),
      };
    })
    .sort((a, b) => b.os - a.os);

  const Tab = ({ id, label }) => (
    <button
      onClick={() => setView(id)}
      className={`border-b-4 pb-1 text-2xl font-bold xl:text-[28px] xl:leading-9 ${
        view === id ? "border-brand-500 text-ink" : "border-transparent text-faint hover:text-ink"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="pt-4 xl:pt-6">
      {/* 2 TAB + nút xuất */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-end gap-6">
          <Tab id="dash" label="Dashboard tổng quan" />
          <Tab id="detail" label="Chi tiết công nợ" />
        </div>
        <div className="flex flex-wrap gap-2">
          <ExportBtn icon={FileSpreadsheet} label="Xuất Excel" onClick={() => exportExcel(contracts, installments)} />
          <ExportBtn icon={FileText} label="CSV" onClick={() => exportCSV(installments)} />
          <ExportBtn icon={Download} label="Sao lưu JSON" onClick={() => exportJSON({ customers, contracts, installments })} />
          <ExportBtn icon={Printer} label="In / PDF" onClick={() => printReport(contracts, installments)} />
        </div>
      </div>

      {backendName === "local" && (
        <div className="mb-5 flex items-center gap-2 rounded-lg border border-line bg-card px-4 py-2.5 text-sm text-sub">
          Đang chạy chế độ <b className="mx-1">thử nghiệm (local)</b> — dữ liệu thật đã chuyển từ file v31.
        </div>
      )}

      {/* ===== TAB 1: DASHBOARD ===== */}
      {view === "dash" && (
        <div className="space-y-6">
          <KpiStrip k={kpis} />
          <OverviewWidgets kpis={kpis} customerData={custData} installments={installments} />
          <CollectionCalendar installments={installments} />
          <DueLists dueSoon={dueSoon} overdue={overdueRows} />
          <TrendCharts installments={installments} customers={customers} />
        </div>
      )}

      {/* ===== TAB 2: CHI TIẾT CÔNG NỢ ===== */}
      {view === "detail" && (
        <div className="rounded-xl border border-line bg-card shadow-card">
          <div className="border-b border-line px-5 py-4">
            <h2 className="text-base font-semibold text-ink">Chi tiết công nợ theo công trình</h2>
            <p className="text-xs text-faint">{byContract.length} công trình · sắp theo còn phải thu</p>
          </div>

          {/* Thẻ — điện thoại */}
          <div className="space-y-2 p-3 md:hidden">
            {byContract.map((c) => (
              <button
                key={c.id}
                onClick={() => nav(`/contracts/${c.id}`)}
                className="block w-full rounded-xl border border-line p-3 text-left"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-semibold text-ink">{c.name}</span>
                  {c.late && (
                    <span className="shrink-0 rounded-full bg-danger px-2 py-0.5 text-[10px] font-semibold text-white">
                      QUÁ HẠN
                    </span>
                  )}
                </div>
                <div className="mt-0.5 truncate text-xs text-faint">{c.customerName}</div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-[11px] text-faint">Đã thu</div>
                    <div className="tabular-nums text-brand-500">{fmtVND(c.paid)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] text-faint">Còn phải thu</div>
                    <div className="font-semibold tabular-nums text-ink">{fmtVND(c.os)}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Bảng — desktop/tablet */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="h-12 border-b border-line text-left text-xs uppercase tracking-wider text-faint">
                  <th className="px-3 py-3 font-medium">Công trình</th>
                  <th className="px-3 py-3 font-medium">Chủ đầu tư</th>
                  <th className="px-3 py-3 text-center font-medium">Số đợt</th>
                  <th className="px-3 py-3 text-right font-medium">Giá trị HĐ</th>
                  <th className="px-3 py-3 text-right font-medium">Đã thu</th>
                  <th className="px-3 py-3 text-right font-medium">Còn phải thu</th>
                </tr>
              </thead>
              <tbody>
                {byContract.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => nav(`/contracts/${c.id}`)}
                    className="cursor-pointer border-b border-line/60 last:border-0 hover:bg-hover"
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
                      <div className="text-xs font-normal text-faint">{c.code}</div>
                    </td>
                    <td className="px-3 py-3 text-sub">{c.customerName}</td>
                    <td className="px-3 py-3 text-center text-sub">{c.count}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-sub">{fmtVND(c.totalAfterTax)}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-brand-500">{fmtVND(c.paid)}</td>
                    <td className="px-3 py-3 text-right font-semibold tabular-nums text-ink">{fmtVND(c.os)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
