import { useState } from "react";
import { LayoutGrid, Table2, FileSpreadsheet, FileText, Download, Printer } from "lucide-react";
import Tracking from "./Tracking";
import api from "../lib/data";
import { exportExcel, exportCSV, exportJSON, printReport } from "../lib/exporter";
import Tabs from "../components/shared/Tabs";

const TABS = [
  { key: "overview", label: "Tổng quan", icon: LayoutGrid },
  { key: "detail", label: "Chi tiết", icon: Table2 },
];

function ExportBtn({ icon: Icon, label, onClick, busy, primary }) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={`flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold shadow-sm transition-colors disabled:opacity-50 ${
        primary
          ? "bg-brand-500 text-white hover:bg-brand-600"
          : "border border-line bg-card text-sub hover:border-brand-400 hover:text-brand-500"
      }`}
    >
      <Icon size={14} /> <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

export default function Detail() {
  const [tab, setTab] = useState("detail");
  const [busy, setBusy] = useState("");

  async function run(kind) {
    if (busy) return;
    setBusy(kind);
    try {
      const [contracts, installments, customers] = await Promise.all([
        api.listContracts(),
        api.listInstallments(),
        api.listCustomers(),
      ]);
      if (kind === "excel") await exportExcel(contracts, installments, customers);
      else if (kind === "csv") exportCSV(installments);
      else if (kind === "json") exportJSON({ customers, contracts, installments });
      else if (kind === "print") printReport(contracts, installments);
    } catch (e) {
      alert("Không xuất được báo cáo: " + (e?.message || e));
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="pt-4 xl:pt-6">
      <h1 className="mb-3 text-xl font-bold uppercase text-ink xl:text-2xl">Công nợ chi tiết</h1>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-line">
        <Tabs items={TABS} value={tab} onChange={setTab} />
        <div className="flex flex-wrap gap-2 pb-2">
          <ExportBtn icon={FileSpreadsheet} label={busy === "excel" ? "Đang xuất…" : "Xuất Excel"} onClick={() => run("excel")} busy={busy === "excel"} primary />
          <ExportBtn icon={Printer} label="In báo cáo" onClick={() => run("print")} busy={busy === "print"} />
          <ExportBtn icon={FileText} label="CSV" onClick={() => run("csv")} busy={busy === "csv"} />
          <ExportBtn icon={Download} label="Sao lưu JSON" onClick={() => run("json")} busy={busy === "json"} />
        </div>
      </div>

      {tab === "overview" && <Tracking summary embedded />}
      {tab === "detail" && <Tracking embedded />}
    </div>
  );
}
