import { useEffect, useMemo, useState } from "react";
import api, { backendName } from "../lib/data";
import {
  buildKpis,
  buildCustomerProgress,
  buildDueSoon,
  buildOverdue,
} from "../lib/dashboard";
import { outstanding, daysLate } from "../lib/models";
import { yearOf } from "../lib/contractsUtil";
import KpiStrip from "../components/dashboard/KpiStrip";
import OverviewWidgets from "../components/dashboard/OverviewWidgets";
import ProjectProgress from "../components/dashboard/ProjectProgress";
import DueLists from "../components/dashboard/DueLists";
import TrendCharts from "../components/dashboard/TrendCharts";
import DashboardFilters from "../components/dashboard/DashboardFilters";
import LoadingState from "../components/shared/LoadingState";

// Trạng thái tổng của 1 công trình (để lọc)
function contractStatus(rows) {
  if (rows.some((r) => daysLate(r) > 0)) return "overdue";
  const os = rows.reduce((s, r) => s + outstanding(r), 0);
  const paid = rows.reduce((s, r) => s + (r.paid || 0), 0);
  if (os <= 0.5 && paid > 0) return "done";
  return "progress";
}

const emptyFilters = { year: "all", customerId: "all", contractId: "all", status: "all" };

export default function Overview({ embedded = false }) {
  const [contracts, setContracts] = useState([]);
  const [installments, setInstallments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(emptyFilters);

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

  const rowsByContract = useMemo(() => {
    const m = new Map();
    for (const r of installments) {
      if (!m.has(r.contractId)) m.set(r.contractId, []);
      m.get(r.contractId).push(r);
    }
    return m;
  }, [installments]);

  const years = useMemo(
    () => [...new Set(contracts.map(yearOf))].sort((a, b) => String(b).localeCompare(String(a))),
    [contracts]
  );

  // Lọc theo bộ lọc bên trái
  const { fContracts, fInstallments, fCustomers } = useMemo(() => {
    const fc = contracts.filter((c) => {
      if (filters.year !== "all" && yearOf(c) !== filters.year) return false;
      if (filters.customerId !== "all" && c.customerId !== filters.customerId) return false;
      if (filters.contractId !== "all" && c.id !== filters.contractId) return false;
      if (filters.status !== "all") {
        if (contractStatus(rowsByContract.get(c.id) || []) !== filters.status) return false;
      }
      return true;
    });
    const ids = new Set(fc.map((c) => c.id));
    const fi = installments.filter((r) => ids.has(r.contractId));
    const cusIds = new Set(fc.map((c) => c.customerId));
    const fcus = customers.filter((cu) => cusIds.has(cu.id));
    return { fContracts: fc, fInstallments: fi, fCustomers: fcus };
  }, [contracts, installments, customers, filters, rowsByContract]);

  if (loading) return <LoadingState />;

  const kpis = buildKpis(fContracts, fCustomers, fInstallments);
  const custData = buildCustomerProgress(fCustomers, fInstallments);
  const dueSoon = buildDueSoon(fInstallments, 30);
  const overdueRows = buildOverdue(fInstallments);

  return (
    <div className={embedded ? "" : "pt-4 xl:pt-6"}>
      {backendName === "local" && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-line bg-card px-4 py-2.5 text-sm text-sub">
          Đang chạy chế độ <b className="mx-1">thử nghiệm (local)</b> — dữ liệu thật đã chuyển từ file v31.
        </div>
      )}

      <div className="flex flex-col gap-4 xl:flex-row">
        <DashboardFilters
          years={years}
          customers={customers}
          contracts={contracts}
          filters={filters}
          onChange={setFilters}
          kpis={kpis}
        />

        <div className="min-w-0 flex-1 space-y-4">
          <KpiStrip k={kpis} />
          <OverviewWidgets
            kpis={kpis}
            customerData={custData}
            installments={fInstallments}
            showGauge={false}
          />
          <TrendCharts installments={fInstallments} customers={fCustomers} />
          <DueLists dueSoon={dueSoon} overdue={overdueRows} />
          <ProjectProgress contracts={fContracts} installments={fInstallments} />
        </div>
      </div>
    </div>
  );
}
