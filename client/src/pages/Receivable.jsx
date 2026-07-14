import { useState } from "react";
import { LayoutDashboard, LayoutGrid, Table2 } from "lucide-react";
import Overview from "./Overview";
import Tracking from "./Tracking";

const TABS = [
  { key: "dash", label: "Dashboard", icon: LayoutDashboard },
  { key: "overview", label: "Tổng quan", icon: LayoutGrid },
  { key: "detail", label: "Chi tiết", icon: Table2 },
];

export default function Receivable() {
  const [tab, setTab] = useState("dash");

  return (
    <div className="pt-4 xl:pt-6">
      {/* Thanh 3 tab */}
      <div className="mb-5 flex flex-wrap items-center gap-1 border-b border-line">
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
                active
                  ? "border-brand-500 text-brand-500"
                  : "border-transparent text-faint hover:text-ink"
              }`}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Nội dung theo tab */}
      {tab === "dash" && <Overview embedded />}
      {tab === "overview" && <Tracking summary embedded />}
      {tab === "detail" && <Tracking embedded />}
    </div>
  );
}
