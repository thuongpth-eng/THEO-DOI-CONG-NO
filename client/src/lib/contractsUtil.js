// Tiện ích dùng chung cho Kho lưu trữ & Theo dõi công nợ (trước đây copy ở 2 nơi).
import { outstanding, daysLate, arisen } from "./models";

// Tạo id khách hàng từ tên (bỏ dấu, gạch nối).
export const slug = (s) =>
  "cus_" +
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);

// Lấy năm từ số hợp đồng / mã dự án (fallback "Chưa rõ năm").
export const yearOf = (c) => {
  const m = (c.code || "").match(/(20\d{2})/) || (c.maDuAn || "").match(/(20\d{2})/);
  return m ? m[1] : "Chưa rõ năm";
};

export const todayISO = () => new Date().toISOString().slice(0, 10);

// Trạng thái 1 đợt → khóa màu cho Stepper (canonical: nợ chỉ tính đợt đã phát sinh).
export function stageState(r) {
  if (daysLate(r) > 0) return "overdue";
  if (outstanding(r) <= 0.5 && (r.paid || 0) > 0) return "paid";
  if (!arisen(r)) return "todo";
  return "progress";
}

export const STAGE_DOT = {
  overdue: "bg-danger text-white",
  paid: "bg-brand-500 text-white",
  progress: "bg-warning text-white",
  todo: "bg-line text-sub",
};

export const STAGE_LABEL = {
  overdue: "Quá hạn",
  paid: "Đã thu đủ",
  progress: "Đang xử lý",
  todo: "Chưa tới",
};
