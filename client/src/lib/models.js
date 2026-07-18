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

// Đọc số tiền VND thành chữ (VD: 70000000000 → "Bảy mươi tỷ đồng")
const _CS = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
function _readTriple(num, full) {
  const tram = Math.floor(num / 100);
  const chuc = Math.floor((num % 100) / 10);
  const dv = num % 10;
  let s = "";
  if (tram > 0) s += _CS[tram] + " trăm";
  else if (full && (chuc > 0 || dv > 0)) s += "không trăm";
  if (chuc > 1) {
    s += " " + _CS[chuc] + " mươi";
    if (dv === 1) s += " mốt";
    else if (dv === 5) s += " lăm";
    else if (dv > 0) s += " " + _CS[dv];
  } else if (chuc === 1) {
    s += " mười";
    if (dv === 5) s += " lăm";
    else if (dv > 0) s += " " + _CS[dv];
  } else if (dv > 0) {
    if (tram > 0 || full) s += " lẻ";
    s += " " + _CS[dv];
  }
  return s.trim();
}
export function docSoVND(n) {
  n = Math.round(Number(n) || 0);
  if (n === 0) return "Không đồng";
  const groups = [];
  let x = n;
  while (x > 0) {
    groups.push(x % 1000);
    x = Math.floor(x / 1000);
  }
  const highest = groups.length - 1;
  const scaleWord = (i) => {
    const base = ["", "nghìn", "triệu"][i % 3];
    const ty = Math.floor(i / 3);
    return (base + (ty > 0 ? " " + Array(ty).fill("tỷ").join(" ") : "")).trim();
  };
  const parts = [];
  for (let i = highest; i >= 0; i--) {
    if (groups[i] === 0) continue;
    const triple = _readTriple(groups[i], i !== highest);
    parts.push((triple + " " + scaleWord(i)).trim());
  }
  let s = parts.join(" ").replace(/\s+/g, " ").trim();
  return s.charAt(0).toUpperCase() + s.slice(1) + " đồng";
}

export const fmtDate = (s) => {
  if (!s) return "—";
  const [y, m, d] = s.slice(0, 10).split("-");
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

// Đợt đã "phát sinh công nợ" (đã gửi hồ sơ / đã đến hạn / đã thu một phần).
// Đợt chưa tới (chưa gửi HS, chưa đến hạn) KHÔNG tính vào công nợ phải thu.
export function arisen(r) {
  if ((r.paid || 0) > 0) return true;
  if ((r.status || 0) >= 2) return true; // 2 = đã gửi hồ sơ CĐT trở lên
  if (r.ngayGuiHS || r.ngayXuatHD) return true;
  const d = daysToDue(r);
  if (d !== null && d <= 0) return true; // đã đến hạn / quá hạn
  return false;
}

// Công nợ phải thu THỰC = chỉ cộng đợt đã phát sinh.
export function receivable(installments) {
  return installments.filter(arisen).reduce((s, r) => s + outstanding(r), 0);
}
// Phần chưa phát sinh (đợt tương lai) — để tham khảo, không tính vào nợ.
export function notYetDue(installments) {
  return installments.filter((r) => !arisen(r)).reduce((s, r) => s + outstanding(r), 0);
}

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
