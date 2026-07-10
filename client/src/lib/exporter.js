// Công cụ xuất báo cáo: Excel (.xlsx), CSV, JSON, In (PDF qua trình duyệt).
import * as XLSX from "xlsx";
import { fmtVND, statusName, outstanding, daysLate, summarize } from "./models";

const todayStr = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
};

function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ----- Excel (.xlsx) 2 sheet: Hợp đồng + Đợt thanh toán -----
export function exportExcel(contracts, installments) {
  const wb = XLSX.utils.book_new();

  const sheetHD = contracts.map((c, i) => {
    const rows = installments.filter((r) => r.contractId === c.id);
    const s = summarize(rows);
    return {
      STT: i + 1,
      "Công trình": c.name,
      "Chủ đầu tư": c.customerName,
      "Số hợp đồng": c.code,
      "Giá trị HĐ": c.totalAfterTax,
      "Đã thu": s.totalPaid,
      "Còn phải thu": s.outstanding,
      "Quá hạn": s.overdue,
      "Địa điểm": c.loc,
    };
  });

  const sheetDot = installments.map((r, i) => ({
    STT: i + 1,
    "Công trình": r.contractName,
    Đợt: r.dot,
    "Hồ sơ": r.hoso,
    "Nội dung": r.noidung,
    "Giá trị": r.value,
    "Đã thu": r.paid,
    "Còn lại": outstanding(r),
    "Trạng thái": statusName(r.status),
    "Ngày đến hạn": r.ngayDenHan,
    "Ngày TT": r.ngayTT,
    "Số ngày trễ": daysLate(r) || "",
    "Ghi chú": r.ghichu,
  }));

  const ws1 = XLSX.utils.json_to_sheet(sheetHD);
  const ws2 = XLSX.utils.json_to_sheet(sheetDot);
  ws1["!cols"] = [{ wch: 5 }, { wch: 22 }, { wch: 34 }, { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 40 }];
  ws2["!cols"] = [{ wch: 5 }, { wch: 20 }, { wch: 8 }, { wch: 28 }, { wch: 44 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 13 }, { wch: 13 }, { wch: 10 }, { wch: 34 }];
  XLSX.utils.book_append_sheet(wb, ws1, "Hợp đồng");
  XLSX.utils.book_append_sheet(wb, ws2, "Đợt thanh toán");
  XLSX.writeFile(wb, `HPCons-CongNo-${todayStr()}.xlsx`);
}

// ----- CSV (đợt thanh toán) -----
export function exportCSV(installments) {
  const header = ["Công trình", "Đợt", "Giá trị", "Đã thu", "Còn lại", "Trạng thái", "Đến hạn"];
  const lines = [header.join(",")];
  for (const r of installments) {
    lines.push(
      [r.contractName, r.dot, r.value, r.paid, outstanding(r), statusName(r.status), r.ngayDenHan]
        .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
        .join(",")
    );
  }
  download(new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" }), `HPCons-CongNo-${todayStr()}.csv`);
}

// ----- JSON (sao lưu toàn bộ) -----
export function exportJSON(data) {
  download(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
    `HPCons-CongNo-${todayStr()}.json`
  );
}

// ----- In báo cáo (mở cửa sổ in → lưu PDF) -----
export function printReport(contracts, installments) {
  const s = summarize(installments);
  const esc = (v) => String(v ?? "").replace(/[&<>]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[m]));
  const rowsHtml = contracts
    .map((c, i) => {
      const rs = installments.filter((r) => r.contractId === c.id);
      const cs = summarize(rs);
      const late = rs.some((r) => daysLate(r) > 0);
      return `<tr>
        <td>${i + 1}</td>
        <td><b>${esc(c.name)}</b>${late ? ' <span style="color:#dc2626">(QUÁ HẠN)</span>' : ""}</td>
        <td>${esc(c.customerName)}</td>
        <td class="r">${fmtVND(c.totalAfterTax)}</td>
        <td class="r">${fmtVND(cs.totalPaid)}</td>
        <td class="r"><b>${fmtVND(cs.outstanding)}</b></td>
      </tr>`;
    })
    .join("");

  const html = `<!doctype html><html lang="vi"><head><meta charset="utf-8">
  <title>Báo cáo công nợ HPCons</title>
  <style>
    body{font:13px/1.5 Arial,sans-serif;color:#1e293b;padding:24px;max-width:900px;margin:0 auto}
    h1{font-size:20px;margin:0 0 4px}
    .sub{color:#64748b;font-size:12px;margin-bottom:16px}
    .kpi{display:flex;gap:12px;margin:16px 0}
    .kpi div{flex:1;border:1px solid #e2e8f0;border-radius:8px;padding:10px}
    .kpi .lbl{font-size:11px;color:#64748b}
    .kpi .val{font-size:16px;font-weight:bold;color:#2563eb}
    table{width:100%;border-collapse:collapse;font-size:12px}
    th,td{border-bottom:1px solid #e2e8f0;padding:7px 8px;text-align:left}
    th{background:#f1f5f9;font-size:11px;text-transform:uppercase;color:#64748b}
    td.r,th.r{text-align:right}
    .foot{margin-top:20px;font-size:11px;color:#94a3b8}
    @media print{body{padding:0}}
  </style></head><body>
    <h1>BÁO CÁO CÔNG NỢ PHẢI THU — HP CONS</h1>
    <div class="sub">Ngày lập: ${new Date().toLocaleDateString("vi-VN")} · ${contracts.length} công trình</div>
    <div class="kpi">
      <div><div class="lbl">Còn phải thu</div><div class="val">${fmtVND(s.outstanding)}</div></div>
      <div><div class="lbl">Đã thu</div><div class="val" style="color:#059669">${fmtVND(s.totalPaid)}</div></div>
      <div><div class="lbl">Nợ quá hạn</div><div class="val" style="color:#dc2626">${fmtVND(s.overdue)}</div></div>
    </div>
    <table>
      <thead><tr><th>STT</th><th>Công trình</th><th>Chủ đầu tư</th><th class="r">Giá trị HĐ</th><th class="r">Đã thu</th><th class="r">Còn phải thu</th></tr></thead>
      <tbody>${rowsHtml}</tbody>
    </table>
    <div class="foot">Báo cáo tự động từ HPC Receivable · HP CONS Portal</div>
    <script>window.onload=()=>{window.print()}</script>
  </body></html>`;

  const w = window.open("", "_blank");
  w.document.write(html);
  w.document.close();
}
