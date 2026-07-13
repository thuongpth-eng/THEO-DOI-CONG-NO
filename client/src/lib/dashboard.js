// Tính toán cho Dashboard TGĐ (theo nghiệp vụ v31).
import { outstanding, daysLate, daysToDue } from "./models";

// ----- KPI tổng hợp -----
export function buildKpis(contracts, customers, installments) {
  const totalContract = contracts.reduce((s, c) => s + (c.totalAfterTax || 0), 0);
  let totalValue = 0,
    totalPaid = 0,
    unpaidCount = 0,
    sentHS = 0,
    sentHSCount = 0,
    overdue = 0,
    overdueCount = 0,
    maxLate = 0;

  for (const r of installments) {
    totalValue += r.value || 0;
    totalPaid += r.paid || 0;
    const os = outstanding(r);
    if (os <= 0) continue;
    unpaidCount++;
    const late = daysLate(r);
    if (late > 0) {
      overdue += os;
      overdueCount++;
      maxLate = Math.max(maxLate, late);
    }
    const st = Number(r.status) || 0;
    // Đã gửi hồ sơ CĐT / xác nhận / xuất hóa đơn / trả một phần → đang chờ thu
    if ((st >= 2 && st <= 5) || r.ngayGuiHS || r.ngayXuatHD) {
      sentHS += os;
      sentHSCount++;
    }
  }

  return {
    totalContract,
    contractCount: contracts.length,
    customerCount: customers.length,
    totalPaid,
    outstanding: totalValue - totalPaid,
    unpaidCount,
    progress: totalValue > 0 ? (totalPaid / totalValue) * 100 : 0,
    sentHS,
    sentHSCount,
    overdue,
    overdueCount,
    maxLate,
  };
}

// ----- Tình hình thanh toán theo khách hàng -----
export function buildCustomerProgress(customers, installments) {
  const byId = new Map();
  for (const c of customers) {
    byId.set(c.id, { id: c.id, name: c.name, value: 0, paid: 0, overdue: 0, dueSoon: 0 });
  }
  for (const r of installments) {
    const g = byId.get(r.customerId);
    if (!g) continue;
    g.value += r.value || 0;
    g.paid += r.paid || 0;
    const os = outstanding(r);
    if (os > 0) {
      if (daysLate(r) > 0) g.overdue += os;
      const dtd = daysToDue(r);
      if (dtd !== null && dtd >= 0 && dtd <= 30) g.dueSoon += os;
    }
  }
  return [...byId.values()]
    .map((g) => ({
      ...g,
      outstanding: g.value - g.paid,
      pct: g.value > 0 ? Math.round((g.paid / g.value) * 100) : 0,
    }))
    .sort((a, b) => b.outstanding - a.outstanding);
}

// ----- Tuổi nợ phải thu (3 mức, theo token màu HPCons) -----
export function buildAgingSimple(installments) {
  let inTerm = 0,
    b30 = 0,
    over30 = 0;
  for (const r of installments) {
    const os = outstanding(r);
    if (os <= 0) continue;
    const late = daysLate(r);
    if (late <= 0) inTerm += os;
    else if (late <= 30) b30 += os;
    else over30 += os;
  }
  return [
    { name: "Trong hạn", value: inTerm, fill: "#0969A7" },
    { name: "Quá hạn 1–30 ngày", value: b30, fill: "#FFA726" },
    { name: "Quá hạn >30 ngày", value: over30, fill: "#E53935" },
  ];
}

// ----- Danh sách đến hạn (0..days ngày tới) & quá hạn -----
export function buildDueSoon(installments, days = 30) {
  return installments
    .filter((r) => {
      if (outstanding(r) <= 0) return false;
      const d = daysToDue(r);
      return d !== null && d >= 0 && d <= days;
    })
    .map((r) => ({ ...r, daysTo: daysToDue(r), remain: outstanding(r) }))
    .sort((a, b) => a.daysTo - b.daysTo);
}

export function buildOverdue(installments) {
  return installments
    .filter((r) => daysLate(r) > 0)
    .map((r) => ({ ...r, late: daysLate(r), remain: outstanding(r) }))
    .sort((a, b) => b.late - a.late);
}

// ----- Sự kiện lịch thu theo tháng -----
// Trả về Map: ngày (1..31) → { due, overdue, paid, amount }
export function buildCalendarMarks(installments, year, month /* 0-based */) {
  const marks = new Map();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const get = (d) => {
    if (!marks.has(d)) marks.set(d, { due: false, overdue: false, paid: false, amount: 0 });
    return marks.get(d);
  };
  for (const r of installments) {
    if (r.ngayDenHan) {
      const [y, m, d] = r.ngayDenHan.split("-").map(Number);
      if (y === year && m - 1 === month && outstanding(r) > 0) {
        const mk = get(d);
        mk.amount += outstanding(r);
        const dt = new Date(y, m - 1, d);
        if (dt < today) mk.overdue = true;
        else mk.due = true;
      }
    }
    if (r.ngayTT) {
      const [y, m, d] = r.ngayTT.split("-").map(Number);
      if (y === year && m - 1 === month) get(d).paid = true;
    }
  }
  return marks;
}

// Danh sách sự kiện trong tháng (đợt còn nợ có hạn trong tháng)
export function buildMonthEvents(installments, year, month) {
  return installments
    .filter((r) => {
      if (!r.ngayDenHan || outstanding(r) <= 0) return false;
      const [y, m] = r.ngayDenHan.split("-").map(Number);
      return y === year && m - 1 === month;
    })
    .map((r) => ({
      ...r,
      remain: outstanding(r),
      late: daysLate(r),
      daysTo: daysToDue(r),
    }))
    .sort((a, b) => a.ngayDenHan.localeCompare(b.ngayDenHan));
}
