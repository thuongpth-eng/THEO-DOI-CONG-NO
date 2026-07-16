import { useEffect, useState } from "react";
import api, { backendName } from "../lib/data";
import {
  buildKpis,
  buildCustomerProgress,
  buildDueSoon,
  buildOverdue,
} from "../lib/dashboard";
import KpiStrip from "../components/dashboard/KpiStrip";
import OverviewWidgets from "../components/dashboard/OverviewWidgets";
import ProjectProgress from "../components/dashboard/ProjectProgress";
import CollectionCalendar from "../components/dashboard/CollectionCalendar";
import DueLists from "../components/dashboard/DueLists";
import TrendCharts from "../components/dashboard/TrendCharts";
import LoadingState from "../components/shared/LoadingState";

export default function Overview({ embedded = false }) {
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

  if (loading) return <LoadingState />;

  const kpis = buildKpis(contracts, customers, installments);
  const custData = buildCustomerProgress(customers, installments);
  const dueSoon = buildDueSoon(installments, 30);
  const overdueRows = buildOverdue(installments);

  return (
    <div className={embedded ? "" : "pt-4 xl:pt-6"}>
      {backendName === "local" && (
        <div className="mb-5 flex items-center gap-2 rounded-lg border border-line bg-card px-4 py-2.5 text-sm text-sub">
          Đang chạy chế độ <b className="mx-1">thử nghiệm (local)</b> — dữ liệu thật đã chuyển từ file v31.
        </div>
      )}

      <div className="space-y-6">
        <KpiStrip k={kpis} />
        <OverviewWidgets kpis={kpis} customerData={custData} installments={installments} />
        <ProjectProgress contracts={contracts} installments={installments} />
        <CollectionCalendar installments={installments} />
        <DueLists dueSoon={dueSoon} overdue={overdueRows} />
        <TrendCharts installments={installments} customers={customers} />
      </div>
    </div>
  );
}
