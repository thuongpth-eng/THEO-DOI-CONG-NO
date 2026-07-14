// Công cụ xuất báo cáo: Excel (.xlsx có định dạng), CSV, JSON, In (PDF qua trình duyệt).
// exceljs được tải động trong exportExcel để không làm nặng trang khi mới mở.
import {
  fmtVND,
  fmtDate,
  statusName,
  outstanding,
  daysLate,
  summarize,
} from "./models";

const todayStr = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
};
const todayVN = () => new Date().toLocaleDateString("vi-VN");

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

/* ===================== EXCEL (.xlsx) chuyên nghiệp ===================== */
// Bảng màu theo HPCons
const GREEN = "FF60BB46";
const NAVY = "FF4B4F55";
const GREENSOFT = "FFEAF6E6";
const MONEY = '#,##0;[Red]-#,##0';
const thin = { style: "thin", color: { argb: "FFDDDDDD" } };
const BORDER = { top: thin, left: thin, bottom: thin, right: thin };

function headerRow(ws, rowIdx, ncol, fill = GREEN) {
  const row = ws.getRow(rowIdx);
  row.height = 22;
  for (let c = 1; c <= ncol; c++) {
    const cell = row.getCell(c);
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10, name: "Arial" };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fill } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = BORDER;
  }
}

function styleTitle(ws, ncol, title, subtitle) {
  ws.mergeCells(1, 1, 1, ncol);
  const t = ws.getCell(1, 1);
  t.value = "HP CONS — KIỂM SOÁT HỢP ĐỒNG CHỦ ĐẦU TƯ";
  t.font = { bold: true, size: 14, color: { argb: NAVY }, name: "Arial" };
  t.alignment = { horizontal: "left", vertical: "middle" };
  ws.getRow(1).height = 24;

  ws.mergeCells(2, 1, 2, ncol);
  const s = ws.getCell(2, 1);
  s.value = title;
  s.font = { bold: true, size: 12, color: { argb: GREEN }, name: "Arial" };

  ws.mergeCells(3, 1, 3, ncol);
  const d = ws.getCell(3, 1);
  d.value = `${subtitle} · Ngày lập: ${todayVN()}`;
  d.font = { italic: true, size: 10, color: { argb: "FF888888" }, name: "Arial" };
}

// Đổ dữ liệu 1 bảng + kẻ ô + dòng tổng
function fillTable(ws, startRow, columns, rows, totals) {
  headerRow(ws, startRow, columns.length);
  ws.getRow(startRow).values = columns.map((c) => c.header);

  let r = startRow + 1;
  for (const item of rows) {
    const row = ws.getRow(r);
    columns.forEach((col, i) => {
      const cell = row.getCell(i + 1);
      cell.value = item[col.key] ?? (col.money ? 0 : "");
      cell.border = BORDER;
      cell.font = { size: 10, name: "Arial" };
      if (col.money) {
        cell.numFmt = MONEY;
        cell.alignment = { horizontal: "right" };
      } else if (col.center) {
        cell.alignment = { horizontal: "center" };
      } else {
        cell.alignment = { horizontal: "left", wrapText: true, vertical: "top" };
      }
    });
    r++;
  }

  if (totals) {
    const row = ws.getRow(r);
    columns.forEach((col, i) => {
      const cell = row.getCell(i + 1);
      cell.border = BORDER;
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GREENSOFT } };
      cell.font = { bold: true, size: 10, name: "Arial" };
      if (i === 0) cell.value = "TỔNG CỘNG";
      if (col.money && totals[col.key] != null) {
        cell.value = totals[col.key];
        cell.numFmt = MONEY;
        cell.alignment = { horizontal: "right" };
      }
    });
    r++;
  }

  ws.columns = columns.map((c) => ({ width: c.width || 14 }));
  // Cố định vùng tiêu đề + auto lọc
  ws.views = [{ state: "frozen", ySplit: startRow }];
  ws.autoFilter = {
    from: { row: startRow, column: 1 },
    to: { row: startRow, column: columns.length },
  };
  return r;
}

export async function exportExcel(contracts, installments, customers = []) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "HPC Receivable";
  wb.created = new Date();

  const rowsOf = (cid) => installments.filter((r) => r.contractId === cid);
  const g = summarize(installments);

  /* ---- Sheet 1: Tổng hợp theo công trình ---- */
  const ws1 = wb.addWorksheet("Tổng hợp", {
    views: [{ showGridLines: false }],
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });
  const cols1 = [
    { header: "STT", key: "stt", width: 5, center: true },
    { header: "Công trình", key: "name", width: 26 },
    { header: "Chủ đầu tư", key: "cus", width: 34 },
    { header: "Số hợp đồng", key: "code", width: 20 },
    { header: "Giá trị HĐ (VND)", key: "value", width: 18, money: true },
    { header: "Đã thu (VND)", key: "paid", width: 18, money: true },
    { header: "Còn phải thu (VND)", key: "os", width: 18, money: true },
    { header: "Quá hạn (VND)", key: "overdue", width: 16, money: true },
    { header: "% đã thu", key: "pct", width: 9, center: true },
    { header: "Địa điểm", key: "loc", width: 34 },
  ];
  const data1 = contracts.map((c, i) => {
    const s = summarize(rowsOf(c.id));
    const base = c.totalAfterTax || s.totalValue;
    return {
      stt: i + 1,
      name: c.name,
      cus: c.customerName,
      code: c.code || "",
      value: c.totalAfterTax || s.totalValue,
      paid: s.totalPaid,
      os: s.outstanding,
      overdue: s.overdue,
      pct: base > 0 ? Math.round((s.totalPaid / base) * 100) + "%" : "0%",
      loc: c.loc || "",
    };
  });
  const totalValue1 = contracts.reduce(
    (a, c) => a + (c.totalAfterTax || summarize(rowsOf(c.id)).totalValue),
    0
  );
  styleTitle(ws1, cols1.length, "BÁO CÁO CÔNG NỢ PHẢI THU — TỔNG HỢP", `${contracts.length} công trình · ${customers.length || "—"} chủ đầu tư`);
  fillTable(ws1, 5, cols1, data1, {
    value: totalValue1,
    paid: g.totalPaid,
    os: g.outstanding,
    overdue: g.overdue,
  });

  /* ---- Sheet 2: Chi tiết đợt thanh toán ---- */
  const ws2 = wb.addWorksheet("Chi tiết đợt", {
    views: [{ showGridLines: false }],
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });
  const cols2 = [
    { header: "STT", key: "stt", width: 5, center: true },
    { header: "Công trình", key: "name", width: 22 },
    { header: "Đợt", key: "dot", width: 8, center: true },
    { header: "Nội dung cần hoàn thành", key: "noidung", width: 30 },
    { header: "Hồ sơ yêu cầu", key: "hoso", width: 22 },
    { header: "Trạng thái hồ sơ", key: "st", width: 20 },
    { header: "Giá trị đợt (VND)", key: "value", width: 16, money: true },
    { header: "Đã thu (VND)", key: "paid", width: 16, money: true },
    { header: "Còn lại (VND)", key: "os", width: 16, money: true },
    { header: "Ngày gửi HS", key: "guiHS", width: 13, center: true },
    { header: "Ngày xuất HĐ", key: "xuatHD", width: 13, center: true },
    { header: "Ngày đến hạn", key: "denHan", width: 13, center: true },
    { header: "Ngày thực thu", key: " tt", width: 13, center: true },
    { header: "Số ngày trễ", key: "late", width: 10, center: true },
    { header: "Ghi chú", key: "ghichu", width: 30 },
  ];
  const data2 = installments.map((r, i) => ({
    stt: i + 1,
    name: r.contractName,
    dot: r.dot,
    noidung: r.noidung || "",
    hoso: r.hoso || "",
    st: statusName(r.status),
    value: r.value || 0,
    paid: r.paid || 0,
    os: outstanding(r),
    guiHS: fmtDate(r.ngayGuiHS) === "—" ? "" : fmtDate(r.ngayGuiHS),
    xuatHD: fmtDate(r.ngayXuatHD) === "—" ? "" : fmtDate(r.ngayXuatHD),
    denHan: fmtDate(r.ngayDenHan) === "—" ? "" : fmtDate(r.ngayDenHan),
    " tt": fmtDate(r.ngayTT) === "—" ? "" : fmtDate(r.ngayTT),
    late: daysLate(r) || "",
    ghichu: r.ghichu || "",
  }));
  styleTitle(ws2, cols2.length, "BÁO CÁO CÔNG NỢ PHẢI THU — CHI TIẾT ĐỢT", `${installments.length} đợt thanh toán`);
  fillTable(ws2, 5, cols2, data2, {
    value: installments.reduce((a, r) => a + (r.value || 0), 0),
    paid: g.totalPaid,
    os: installments.reduce((a, r) => a + outstanding(r), 0),
  });

  /* ---- Sheet 3: Theo khách hàng ---- */
  const byCus = new Map();
  for (const c of contracts) {
    const key = c.customerName || "Khác";
    if (!byCus.has(key)) byCus.set(key, { name: key, value: 0, paid: 0, os: 0, overdue: 0, n: 0 });
    const s = summarize(rowsOf(c.id));
    const o = byCus.get(key);
    o.value += c.totalAfterTax || s.totalValue;
    o.paid += s.totalPaid;
    o.os += s.outstanding;
    o.overdue += s.overdue;
    o.n += 1;
  }
  const ws3 = wb.addWorksheet("Theo khách hàng", {
    views: [{ showGridLines: false }],
    pageSetup: { orientation: "landscape", fitToPage: true },
  });
  const cols3 = [
    { header: "STT", key: "stt", width: 5, center: true },
    { header: "Chủ đầu tư", key: "name", width: 38 },
    { header: "Số HĐ/PL", key: "n", width: 10, center: true },
    { header: "Giá trị (VND)", key: "value", width: 18, money: true },
    { header: "Đã thu (VND)", key: "paid", width: 18, money: true },
    { header: "Còn phải thu (VND)", key: "os", width: 18, money: true },
    { header: "Quá hạn (VND)", key: "overdue", width: 16, money: true },
    { header: "% đã thu", key: "pct", width: 9, center: true },
  ];
  const data3 = [...byCus.values()]
    .sort((a, b) => b.os - a.os)
    .map((o, i) => ({
      stt: i + 1,
      name: o.name,
      n: o.n,
      value: o.value,
      paid: o.paid,
      os: o.os,
      overdue: o.overdue,
      pct: o.value > 0 ? Math.round((o.paid / o.value) * 100) + "%" : "0%",
    }));
  styleTitle(ws3, cols3.length, "BÁO CÁO CÔNG NỢ PHẢI THU — THEO KHÁCH HÀNG", `${byCus.size} chủ đầu tư`);
  fillTable(ws3, 5, cols3, data3, {
    value: [...byCus.values()].reduce((a, o) => a + o.value, 0),
    paid: g.totalPaid,
    os: g.outstanding,
    overdue: g.overdue,
  });

  const buf = await wb.xlsx.writeBuffer();
  download(
    new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    `HPCons-BaoCaoCongNo-${todayStr()}.xlsx`
  );
}

/* ===================== CSV ===================== */
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

/* ===================== JSON (sao lưu) ===================== */
export function exportJSON(data) {
  download(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
    `HPCons-SaoLuu-${todayStr()}.json`
  );
}

/* ===================== IN BÁO CÁO (PDF qua trình duyệt) ===================== */
export function printReport(contracts, installments) {
  const s = summarize(installments);
  const esc = (v) => String(v ?? "").replace(/[&<>]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[m]));
  const totalValue = contracts.reduce(
    (a, c) => a + (c.totalAfterTax || summarize(installments.filter((r) => r.contractId === c.id)).totalValue),
    0
  );

  const rowsHtml = contracts
    .map((c, i) => {
      const rs = installments.filter((r) => r.contractId === c.id);
      const cs = summarize(rs);
      const base = c.totalAfterTax || cs.totalValue;
      const pct = base > 0 ? Math.round((cs.totalPaid / base) * 100) : 0;
      const late = rs.some((r) => daysLate(r) > 0);
      return `<tr>
        <td class="c">${i + 1}</td>
        <td><b>${esc(c.name)}</b>${late ? ' <span class="tag">QUÁ HẠN</span>' : ""}<div class="mut">${esc(c.code || "")}</div></td>
        <td>${esc(c.customerName)}</td>
        <td class="r">${fmtVND(base)}</td>
        <td class="r green">${fmtVND(cs.totalPaid)}</td>
        <td class="r"><b>${fmtVND(cs.outstanding)}</b></td>
        <td class="r red">${cs.overdue > 0 ? fmtVND(cs.overdue) : "—"}</td>
        <td class="c">${pct}%</td>
      </tr>`;
    })
    .join("");

  const html = `<!doctype html><html lang="vi"><head><meta charset="utf-8">
  <title>Báo cáo công nợ phải thu — HP CONS</title>
  <style>
    *{box-sizing:border-box}
    body{font:12px/1.5 Arial,"Segoe UI",sans-serif;color:#1e293b;padding:28px;max-width:1000px;margin:0 auto}
    .head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #60BB46;padding-bottom:12px;margin-bottom:6px}
    .brand{font-size:20px;font-weight:800;color:#4B4F55;letter-spacing:.5px}
    .brand span{color:#60BB46}
    .brand .cap{display:block;font-size:11px;font-weight:600;color:#64748b;letter-spacing:1px;margin-top:2px}
    .meta{text-align:right;font-size:11px;color:#64748b}
    h1{font-size:17px;margin:14px 0 2px;color:#0f172a}
    .sub{color:#64748b;font-size:11px;margin-bottom:14px}
    .kpi{display:flex;gap:10px;margin:14px 0 18px}
    .kpi div{flex:1;border:1px solid #e2e8f0;border-radius:8px;padding:10px 12px;background:#fafafa}
    .kpi .lbl{font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:.4px}
    .kpi .val{font-size:15px;font-weight:800;margin-top:3px}
    table{width:100%;border-collapse:collapse;font-size:11px}
    th,td{border:1px solid #e2e8f0;padding:6px 8px;text-align:left;vertical-align:top}
    thead th{background:#60BB46;color:#fff;font-size:10px;text-transform:uppercase;letter-spacing:.3px;border-color:#4fa23a}
    td.r,th.r{text-align:right;white-space:nowrap}
    td.c,th.c{text-align:center}
    tfoot td{background:#EAF6E6;font-weight:800}
    .green{color:#059669}.red{color:#dc2626}
    .mut{color:#94a3b8;font-size:10px;font-weight:400}
    .tag{background:#dc2626;color:#fff;font-size:9px;padding:1px 5px;border-radius:6px;font-weight:700}
    .sign{display:flex;justify-content:space-around;margin-top:40px;text-align:center}
    .sign div{width:30%}
    .sign .role{font-weight:700}
    .sign .note{font-size:10px;color:#94a3b8;font-style:italic}
    .sign .line{margin-top:64px;border-top:1px dotted #94a3b8}
    .foot{margin-top:24px;font-size:10px;color:#94a3b8;text-align:center;border-top:1px solid #e2e8f0;padding-top:8px}
    @media print{body{padding:6mm}.kpi div{background:#fafafa !important;-webkit-print-color-adjust:exact;print-color-adjust:exact}thead th,tfoot td{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style></head><body>
    <div class="head">
      <div class="brand">HP <span>CONS</span><span class="cap">KIỂM SOÁT HỢP ĐỒNG CHỦ ĐẦU TƯ</span></div>
      <div class="meta">Ngày lập: ${todayVN()}<br>${contracts.length} công trình</div>
    </div>
    <h1>BÁO CÁO CÔNG NỢ PHẢI THU</h1>
    <div class="sub">Theo dõi tình hình thu hồi công nợ các hợp đồng chủ đầu tư</div>
    <div class="kpi">
      <div><div class="lbl">Tổng giá trị HĐ</div><div class="val" style="color:#0969A7">${fmtVND(totalValue)}</div></div>
      <div><div class="lbl">Đã thu</div><div class="val green">${fmtVND(s.totalPaid)}</div></div>
      <div><div class="lbl">Còn phải thu</div><div class="val" style="color:#4B4F55">${fmtVND(s.outstanding)}</div></div>
      <div><div class="lbl">Nợ quá hạn</div><div class="val red">${fmtVND(s.overdue)}</div></div>
    </div>
    <table>
      <thead><tr>
        <th class="c">STT</th><th>Công trình</th><th>Chủ đầu tư</th>
        <th class="r">Giá trị HĐ</th><th class="r">Đã thu</th><th class="r">Còn phải thu</th>
        <th class="r">Quá hạn</th><th class="c">% thu</th>
      </tr></thead>
      <tbody>${rowsHtml}</tbody>
      <tfoot><tr>
        <td class="c" colspan="3">TỔNG CỘNG</td>
        <td class="r">${fmtVND(totalValue)}</td>
        <td class="r">${fmtVND(s.totalPaid)}</td>
        <td class="r">${fmtVND(s.outstanding)}</td>
        <td class="r">${fmtVND(s.overdue)}</td>
        <td class="c">${totalValue > 0 ? Math.round((s.totalPaid / totalValue) * 100) : 0}%</td>
      </tr></tfoot>
    </table>
    <div class="sign">
      <div><div class="role">NGƯỜI LẬP BÁO CÁO</div><div class="note">(Ký, ghi rõ họ tên)</div><div class="line"></div></div>
      <div><div class="role">KẾ TOÁN TRƯỞNG</div><div class="note">(Ký, ghi rõ họ tên)</div><div class="line"></div></div>
      <div><div class="role">GIÁM ĐỐC</div><div class="note">(Ký, ghi rõ họ tên)</div><div class="line"></div></div>
    </div>
    <div class="foot">Báo cáo tự động từ hệ thống HPC Receivable · HP CONS</div>
  </body></html>`;

  // In bằng iframe ẩn — không mở popup nên không bị trình duyệt chặn
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  Object.assign(iframe.style, {
    position: "fixed",
    right: "0",
    bottom: "0",
    width: "0",
    height: "0",
    border: "0",
    visibility: "hidden",
  });
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();
  const cleanup = () => setTimeout(() => iframe.remove(), 1000);
  iframe.contentWindow.onafterprint = cleanup;
  setTimeout(() => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch (e) {
      alert("Không mở được hộp thoại in: " + (e?.message || e));
      iframe.remove();
    }
  }, 400);
}
