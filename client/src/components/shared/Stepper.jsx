import { Fragment } from "react";
import { stageState, STAGE_DOT, STAGE_LABEL } from "../../lib/contractsUtil";

// Dãy đợt Đ1..Đn tô màu theo trạng thái — dùng chung Kho & Theo dõi công nợ.
// size: "sm" (chấm 24px, dùng trong bảng/tab) | "md" (chấm 28px, thẻ Kho).
export default function Stepper({ rows, size = "sm", emptyText = "Chưa có đợt" }) {
  if (!rows || rows.length === 0)
    return <span className="text-xs italic text-faint">{emptyText}</span>;

  const dot = size === "md" ? "h-7 w-7" : "h-6 w-6";
  return (
    <div className="flex items-center">
      {rows.map((r, i) => {
        const st = stageState(r);
        return (
          <Fragment key={r.id}>
            {i > 0 && (
              <div
                className={size === "md" ? "h-0.5 flex-1 bg-line" : "h-0.5 w-4 bg-line sm:w-8"}
              />
            )}
            <span
              title={`${r.dot} · ${STAGE_LABEL[st]}`}
              className={`flex ${dot} items-center justify-center rounded-full text-[10px] font-bold ${STAGE_DOT[st]}`}
            >
              {i + 1}
            </span>
          </Fragment>
        );
      })}
    </div>
  );
}
