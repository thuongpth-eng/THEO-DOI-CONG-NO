import { useEffect, useState } from "react";
import { FileSpreadsheet, FileText, Download, Printer } from "lucide-react";
import api, { backendName } from "../lib/data";
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

  return (
    <div className="pt-4 xl:pt-6">
      {/* Tiêu đề + nút xuất */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-ink xl:text-[28px] xl:leading-9">
          Dashboard tổng quan
        </h1>
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

      <div className="space-y-6">
        <KpiStrip k={kpis} />
        <OverviewWidgets kpis={kpis} customerData={custData} installments={installments} />
        <CollectionCalendar installments={installments} />
        <DueLists dueSoon={dueSoon} overdue={overdueRows} />
        <TrendCharts installments={installments} customers={customers} />
      </div>
    </div>
  );
}
