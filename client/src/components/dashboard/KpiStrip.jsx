import { Landmark, TrendingUp, Wallet, FileClock, AlertTriangle } from "lucide-react";
import { fmtVND } from "../../lib/models";

const pctVN = (n) => n.toLocaleString("vi-VN", { maximumFractionDigits: 1 }) + "%";

function SmallKpi({ icon: Icon, label, value, sub, valueClass, iconClass }) {
  return (
    <div className="rounded-xl border border-line bg-card p-4 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-sub">{label}</span>
        <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconClass}`}>
          <Icon size={20} />
        </span>
      </div>
      <div className={`mt-2 text-2xl font-bold tabular-nums xl:text-[28px] xl:leading-9 ${valueClass}`}>
        {value}
      </div>
      <div className="mt-1 text-xs text-faint">{sub}</div>
    </div>
  );
}

export default function KpiStrip({ k }) {
  return (
    <div className="space-y-4">
      {/* Thẻ tổng */}
      <div className="rounded-xl border border-line bg-card p-4 shadow-card">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-sub">
            Tổng giá trị các công trình (sau thuế)
          </span>
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent">
            <Landmark size={20} />
          </span>
        </div>
        <div className="mt-2 text-[32px] font-bold leading-10 tabular-nums text-accent">
          {fmtVND(k.totalContract)}
        </div>
        <div className="mt-1 text-xs text-faint">
          {k.contractCount} hợp đồng / phụ lục · {k.customerCount} công ty · Tiến độ thu{" "}
          <b className="text-ink">{pctVN(k.progress)}</b>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-hover">
          <div
            className="h-full rounded-full bg-brand-500"
            style={{ width: `${Math.min(100, k.progress)}%` }}
          />
        </div>
      </div>

      {/* 4 thẻ chi tiết */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SmallKpi
          icon={TrendingUp}
          label="Đã thu (thực thu)"
          value={fmtVND(k.totalPaid)}
          sub={`${pctVN(k.progress)} tổng giá trị`}
          valueClass="text-brand-500"
          iconClass="bg-brand-500/15 text-brand-500"
        />
        <SmallKpi
          icon={Wallet}
          label="Còn phải thu"
          value={fmtVND(k.outstanding)}
          sub={`${k.unpaidCount} đợt chưa thu đủ`}
          valueClass="text-ink"
          iconClass="bg-muted/15 text-sub"
        />
        <SmallKpi
          icon={FileClock}
          label="Đã gửi HS (chờ thu)"
          value={fmtVND(k.sentHS)}
          sub={`${k.sentHSCount} đợt đã gửi hồ sơ CĐT`}
          valueClass="text-warning"
          iconClass="bg-warning/15 text-warning"
        />
        <SmallKpi
          icon={AlertTriangle}
          label="Quá hạn"
          value={fmtVND(k.overdue)}
          sub={
            k.overdueCount > 0
              ? `${k.overdueCount} đợt · lâu nhất ${k.maxLate} ngày`
              : "Không có nợ quá hạn"
          }
          valueClass="text-danger"
          iconClass="bg-danger/15 text-danger"
        />
      </div>
    </div>
  );
}
