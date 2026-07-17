import { useCallback, useEffect, useMemo, useState } from "react";
import api, { backendName } from "../lib/data";
import { buildKpis, buildCustomerProgress, buildDueSoon, buildOverdue } from "../lib/dashboard";
import { outstanding, daysLate, daysToDue, arisen } from "../lib/models";
import { yearOf } from "../lib/contractsUtil";
import {
  FilterBar,
  KpiCards,
  DebtByCustomer,
  DebtStructure,
  CashflowLine,
  AlertsPanel,
  PriorityProjects,
  AgingBars,
  TopDebtors,
  DocFlow,
} from "../components/dashboard/blocks";
import LoadingState from "../components/shared/LoadingState";

function contractStatus(rows) {
  if (rows.some((r) => daysLate(r) > 0)) return "overdue";
  const os = rows.reduce((s, r) => s + outstanding(r), 0);
  const paid = rows.reduce((s, r) => s + (r.paid || 0), 0);
  if (os <= 0.5 && paid > 0) return "done";
  return "progress";
}

function nowStr(d) {
  const p = (x) => String(x).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

const emptyFilters = { year: "all", customerId: "all", contractId: "all", status: "all" };

export default function Overview({ embedded = false }) {
  const [contracts, setContracts] = useState([]);
  const [installments, setInstallments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadedAt, setLoadedAt] = useState(() => new Date());
  const [filters, setFilters] = useState(emptyFilters);

  const load = useCallback(async () => {
    const [ct, inst, cus] = await Promise.all([
      api.listContracts(),
      api.listInstallments(),
      api.listCustomers(),
    ]);
    setContracts(ct);
    setInstallments(inst);
    setCustomers(cus);
    setLoadedAt(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const rowsByContract = useMemo(() => {
    const m = new Map();
    for (const r of installments) {
      if (!m.has(r.contractId)) m.set(r.contractId, []);
      m.get(r.contractId).push(r);
    }
    for (const arr of m.values()) arr.sort((a, b) => (a.order || 0) - (b.order || 0));
    return m;
  }, [installments]);

  const years = useMemo(
    () => [...new Set(contracts.map(yearOf))].sort((a, b) => String(b).localeCompare(String(a))),
    [contracts]
  );

  const { fContracts, fInstallments, fCustomers } = useMemo(() => {
    const fc = contracts.filter((c) => {
      if (filters.year !== "all" && yearOf(c) !== filters.year) return false;
      if (filters.customerId !== "all" && c.customerId !== filters.customerId) return false;
      if (filters.contractId !== "all" && c.id !== filters.contractId) return false;
      if (filters.status !== "all" && contractStatus(rowsByContract.get(c.id) || []) !== filters.status)
        return false;
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

  // Dự án cần ưu tiên xử lý
  const priority = fContracts
    .map((c) => {
      const rows = rowsByContract.get(c.id) || [];
      const value = c.totalAfterTax || rows.reduce((s, r) => s + (r.value || 0), 0);
      const paid = rows.reduce((s, r) => s + (r.paid || 0), 0);
      const os = rows.reduce((s, r) => s + outstanding(r), 0);
      const maxLate = rows.reduce((m, r) => Math.max(m, daysLate(r)), 0);
      const dueList = rows
        .filter((r) => outstanding(r) > 0 && arisen(r))
        .map((r) => daysToDue(r))
        .filter((d) => d !== null && d >= 0);
      const nearDue = dueList.length ? Math.min(...dueList) : null;
      const cur = rows.find((r) => outstanding(r) > 0) || rows[rows.length - 1];
      const st = contractStatus(rows);
      let dueLabel = null;
      if (maxLate > 0) dueLabel = `Quá hạn ${maxLate} ngày`;
      else if (nearDue !== null && nearDue <= 30) dueLabel = `Đến hạn ${nearDue} ngày`;
      return {
        id: c.id,
        name: c.name,
        value,
        paid,
        os,
        maxLate,
        nearDue,
        st,
        dueLabel,
        pctPaid: value > 0 ? Math.round((paid / value) * 100) : 0,
        hs: cur?.dot || "",
        urgency: maxLate > 0 ? 3 : nearDue !== null && nearDue <= 30 ? 2 : 1,
      };
    })
    .filter((p) => p.os > 0)
    .sort((a, b) => b.urgency - a.urgency || b.maxLate - a.maxLate || b.os - a.os)
    .slice(0, 6);

  // Luồng trạng thái hồ sơ (đếm theo status)
  const flow = { lap: 0, trinh: 0, duyet: 0, cho: 0, da: 0 };
  for (const r of fInstallments) {
    const s = Number(r.status) || 0;
    const paidFull = outstanding(r) <= 0.5 && (r.paid || 0) > 0;
    if (paidFull || s >= 6) flow.da++;
    else if (s >= 4) flow.cho++;
    else if (s === 3) flow.duyet++;
    else if (s === 2) flow.trinh++;
    else flow.lap++;
  }

  return (
    <div className={embedded ? "" : "pt-4 xl:pt-6"}>
      {backendName === "local" && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-line bg-card px-4 py-2.5 text-sm text-sub">
          Đang chạy chế độ <b className="mx-1">thử nghiệm (local)</b> — dữ liệu thật đã chuyển từ file v31.
        </div>
      )}

      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-bold text-ink xl:text-2xl">Dashboard công nợ chủ đầu tư</h1>
          <p className="text-xs text-faint">Cập nhật lúc: {nowStr(loadedAt)}</p>
        </div>

        <FilterBar
          years={years}
          customers={customers}
          contracts={contracts}
          filters={filters}
          onChange={setFilters}
          onRefresh={load}
        />

        <KpiCards kpis={kpis} installments={fInstallments} />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
          <DebtByCustomer customerData={custData} />
          <DebtStructure kpis={kpis} />
          <CashflowLine installments={fInstallments} />
          <AlertsPanel overdue={overdueRows} dueSoon={dueSoon} />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
          <PriorityProjects projects={priority} className="xl:col-span-2" />
          <AgingBars installments={fInstallments} />
          <TopDebtors customerData={custData} />
        </div>

        <DocFlow counts={flow} />
      </div>
    </div>
  );
}
