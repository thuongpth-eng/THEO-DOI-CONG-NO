// Nghiệp vụ + công thức tính công nợ (dùng chung toàn app).

export const STATUS_NAMES = [
  "Chưa làm hồ sơ",
  "Đang hoàn thiện hồ sơ",
  "Đã gửi hồ sơ CĐT",
  "CĐT đã xác nhận",
  "Đã xuất hóa đơn",
  "Thanh toán một phần",
  "Đã thanh toán đủ",
];

export const statusName = (s) => STATUS_NAMES[s] ?? "—";

// ----- Định dạng tiền / ngày -----
export const fmtVND = (n) =>
  n ? Math.round(n).toLocaleString("vi-VN") + " đ" : "0 đ";

export const fmtTy = (n) => {
  if (!n) return "0";
  const abs = Math.abs(n);
  if (abs >= 1e9)
    return (n / 1e9).toLocaleString("vi-VN", { maximumFractionDigits: 1 }) + " tỷ";
  if (abs >= 1e6)
    return (n / 1e6).toLocaleString("vi-VN", { maximumFractionDigits: 0 }) + " tr";
  return Math.round(n).toLocaleString("vi-VN");
};

export const fmtDate = (s) => {
  if (!s) return "—";
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
};

const parseD = (s) => {
  if (!s) return null;
  const d = new Date(s + "T00:00:00");
  return isNaN(d) ? null : d;
};

const today = () => {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
};

// ----- Tính toán trên 1 đợt thanh toán -----
export const outstanding = (r) => Math.max(0, (r.value || 0) - (r.paid || 0));

export const isPaid = (r) => outstanding(r) <= 0.5;

// Số ngày quá hạn (>0 nghĩa là đã trễ). Chỉ tính khi còn nợ.
export const daysLate = (r) => {
  const due = parseD(r.ngayDenHan);
  if (!due || isPaid(r)) return 0;
  return Math.max(0, Math.round((today() - due) / 86400000));
};

// Số ngày còn lại tới hạn (null nếu không có hạn hoặc đã trả).
export const daysToDue = (r) => {
  const due = parseD(r.ngayDenHan);
  if (!due || isPaid(r)) return null;
  return Math.round((due - today()) / 86400000);
};

// ----- Tổng hợp trên tập đợt thanh toán -----
export function summarize(installments) {
  let totalValue = 0,
    totalPaid = 0,
    overdue = 0;
  for (const r of installments) {
    totalValue += r.value || 0;
    totalPaid += r.paid || 0;
    if (daysLate(r) > 0) overdue += outstanding(r);
  }
  return {
    totalValue,
    totalPaid,
    outstanding: totalValue - totalPaid,
    overdue,
  };
}
