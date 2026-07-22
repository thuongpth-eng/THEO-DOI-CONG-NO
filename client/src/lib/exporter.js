// Công cụ xuất báo cáo: Excel (.xlsx có định dạng), CSV, JSON, In (PDF qua trình duyệt).
// exceljs được tải động trong exportExcel để không làm nặng trang khi mới mở.
import {
  fmtVND,
  fmtDate,
  statusName,
  outstanding,
  daysLate,
  arisen,
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

// Tô 1 ô nhãn/giá trị
function put(ws, addr, value, style = {}) {
  const c = ws.getCell(addr);
  c.value = value;
  if (style.font) c.font = style.font;
  if (style.fill) c.fill = style.fill;
  if (style.align) c.alignment = style.align;
  if (style.numFmt) c.numFmt = style.numFmt;
  if (style.border) c.border = style.border;
  return c;
}
const solid = (argb) => ({ type: "pattern", pattern: "solid", fgColor: { argb } });
const sanitizeSheet = (s, used) => {
  let n = (s || "Sheet").replace(/[\\/?*[\]:]/g, "-").slice(0, 28).trim() || "Sheet";
  let base = n, k = 2;
  while (used.has(n.toLowerCase())) n = `${base.slice(0, 25)} ${k++}`;
  used.add(n.toLowerCase());
  return n;
};

export async function exportExcel(contracts, installments, customers = [], opts = {}) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "HPC Receivable";
  wb.created = new Date();
  const exportedBy = opts.exportedBy || "";

  const rowsOf = (cid) =>
    installments.filter((r) => r.contractId === cid).slice().sort((a, b) => (a.order || 0) - (b.order || 0));
  const invoicedOf = (r) => (r.ngayXuatHD || (r.status || 0) >= 4 ? r.value || 0 : 0);

  // Số liệu từng công trình
  const perC = contracts.map((c, i) => {
    const rs = rowsOf(c.id);
    const value = c.totalAfterTax || rs.reduce((s, r) => s + (r.value || 0), 0);
    const invoiced = rs.reduce((s, r) => s + invoicedOf(r), 0);
    const paid = rs.reduce((s, r) => s + (r.paid || 0), 0);
    const os = value - paid;
    const overdue = rs.filter((r) => daysLate(r) > 0).reduce((s, r) => s + outstanding(r), 0);
    const maxLate = rs.reduce((m, r) => Math.max(m, daysLate(r)), 0);
    const st = maxLate > 0 ? "Quá hạn" : os <= 0.5 && paid > 0 ? "Đã hoàn thành" : "Đang thực hiện";
    return { c, i, rs, value, invoiced, paid, os, overdue, maxLate, st, pct: value > 0 ? paid / value : 0 };
  });
  const T = perC.reduce(
    (a, p) => ({
      value: a.value + p.value,
      invoiced: a.invoiced + p.invoiced,
      paid: a.paid + p.paid,
      os: a.os + p.os,
      overdue: a.overdue + p.overdue,
    }),
    { value: 0, invoiced: 0, paid: 0, os: 0, overdue: 0 }
  );
  const pctThu = T.value > 0 ? T.paid / T.value : 0;

  /* ============ SHEET 1 — TỔNG QUAN CÔNG NỢ ============ */
  const ov = wb.addWorksheet("TỔNG QUAN", {
    views: [{ showGridLines: false }],
    pageSetup: { orientation: "portrait", fitToPage: true, fitToWidth: 1, fitToHeight: 0, margins: { left: 0.5, right: 0.5, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 } },
  });
  ov.columns = [{ width: 5 }, { width: 30 }, { width: 24 }, { width: 22 }, { width: 22 }];
  try {
    const res = await fetch("/logo.png");
    if (res.ok) {
      const buf = await res.arrayBuffer();
      const id = wb.addImage({ buffer: buf, extension: "png" });
      ov.addImage(id, { tl: { col: 0.15, row: 0.15 }, ext: { width: 108, height: 90 } });
    }
  } catch { /* bỏ qua logo nếu lỗi */ }
  ov.getRow(1).height = 26;
  ov.getRow(2).height = 22;
  ov.getRow(3).height = 18;
  ov.mergeCells("B1:E1");
  put(ov, "B1", "HP CONS — KIỂM SOÁT HỢP ĐỒNG CHỦ ĐẦU TƯ", { font: { bold: true, size: 15, color: { argb: NAVY } }, align: { vertical: "middle" } });
  ov.mergeCells("B2:E2");
  put(ov, "B2", "BÁO CÁO TỔNG QUAN CÔNG NỢ PHẢI THU", { font: { bold: true, size: 13, color: { argb: GREEN } } });
  ov.mergeCells("B3:E3");
  put(ov, "B3", `Ngày xuất: ${todayVN()}${exportedBy ? " · Người xuất: " + exportedBy : ""}`, { font: { italic: true, size: 10, color: { argb: "FF888888" } } });

  // KPI
  const kpis = [
    { l: "Tổng giá trị hợp đồng", v: T.value, c: "FF0969A7" },
    { l: "Tổng đã xuất hóa đơn", v: T.invoiced, c: NAVY },
    { l: "Tổng đã thu", v: T.paid, c: GREEN },
    { l: "Tổng còn phải thu", v: T.os, c: "FFB26A00" },
    { l: "Tổng công nợ quá hạn", v: T.overdue, c: "FFC62828" },
  ];
  let r = 6;
  put(ov, `B${r}`, "CHỈ TIÊU", { font: { bold: true, color: { argb: "FFFFFFFF" } }, fill: solid(GREEN), align: { horizontal: "left" }, border: BORDER });
  ov.mergeCells(`C${r}:E${r}`);
  put(ov, `C${r}`, "GIÁ TRỊ (VNĐ)", { font: { bold: true, color: { argb: "FFFFFFFF" } }, fill: solid(GREEN), align: { horizontal: "right" }, border: BORDER });
  ov.getCell(`D${r}`).border = BORDER; ov.getCell(`E${r}`).border = BORDER;
  r++;
  for (const k of kpis) {
    put(ov, `B${r}`, k.l, { font: { size: 11 }, border: BORDER });
    ov.mergeCells(`C${r}:E${r}`);
    put(ov, `C${r}`, k.v, { font: { bold: true, size: 12, color: { argb: k.c } }, numFmt: MONEY, align: { horizontal: "right" }, border: BORDER });
    ov.getCell(`D${r}`).border = BORDER; ov.getCell(`E${r}`).border = BORDER;
    r++;
  }
  put(ov, `B${r}`, "Tổng số công trình", { font: { size: 11 }, border: BORDER });
  ov.mergeCells(`C${r}:E${r}`);
  put(ov, `C${r}`, contracts.length, { font: { bold: true, size: 12, color: { argb: NAVY } }, align: { horizontal: "right" }, border: BORDER });
  ov.getCell(`D${r}`).border = BORDER; ov.getCell(`E${r}`).border = BORDER; r++;
  put(ov, `B${r}`, "Tỷ lệ thu tiền", { font: { size: 11 }, border: BORDER });
  ov.mergeCells(`C${r}:E${r}`);
  put(ov, `C${r}`, pctThu, { font: { bold: true, size: 12, color: { argb: GREEN } }, numFmt: '0.0%', align: { horizontal: "right" }, border: BORDER });
  ov.getCell(`D${r}`).border = BORDER; ov.getCell(`E${r}`).border = BORDER; r += 2;

  // Cơ cấu công nợ (data bar)
  put(ov, `B${r}`, "CƠ CẤU CÔNG NỢ", { font: { bold: true, color: { argb: "FFFFFFFF" } }, fill: solid(NAVY), border: BORDER });
  ov.mergeCells(`C${r}:E${r}`);
  put(ov, `C${r}`, "GIÁ TRỊ (VNĐ)", { font: { bold: true, color: { argb: "FFFFFFFF" } }, fill: solid(NAVY), align: { horizontal: "right" }, border: BORDER });
  ov.getCell(`D${r}`).border = BORDER; ov.getCell(`E${r}`).border = BORDER; r++;
  const barStart = r;
  const coCau = [
    { l: "Đã thanh toán", v: T.paid },
    { l: "Chờ thanh toán (chưa quá hạn)", v: Math.max(0, T.os - T.overdue) },
    { l: "Quá hạn", v: T.overdue },
  ];
  for (const k of coCau) {
    put(ov, `B${r}`, k.l, { font: { size: 11 }, border: BORDER });
    ov.mergeCells(`C${r}:E${r}`);
    put(ov, `C${r}`, k.v, { font: { size: 11 }, numFmt: MONEY, align: { horizontal: "right" }, border: BORDER });
    ov.getCell(`D${r}`).border = BORDER; ov.getCell(`E${r}`).border = BORDER; r++;
  }
  ov.addConditionalFormatting({
    ref: `C${barStart}:C${r - 1}`,
    rules: [{ type: "dataBar", cfvo: [{ type: "min" }, { type: "max" }], color: { argb: GREEN } }],
  });
  put(ov, `B${r + 1}`, "Báo cáo tự động từ hệ thống HPC Receivable · HP CONS", { font: { italic: true, size: 9, color: { argb: "FFAAAAAA" } } });

  /* ============ SHEET 2 — DANH SÁCH CÔNG TRÌNH ============ */
  const ls = wb.addWorksheet("DANH SÁCH CÔNG TRÌNH", {
    views: [{ showGridLines: false, state: "frozen", ySplit: 5 }],
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });
  const cols = [
    { h: "STT", w: 5, c: true },
    { h: "Số hợp đồng", w: 20 },
    { h: "Tên công trình", w: 26 },
    { h: "Chủ đầu tư", w: 30 },
    { h: "Giá trị HĐ", w: 17, m: true },
    { h: "Đã xuất HĐ", w: 17, m: true },
    { h: "Đã thu", w: 17, m: true },
    { h: "Còn phải thu", w: 17, m: true },
    { h: "% thu", w: 9, p: true },
    { h: "Trạng thái", w: 16 },
  ];
  ls.columns = cols.map((c) => ({ width: c.w }));
  styleTitle(ls, cols.length, "DANH SÁCH CÔNG NỢ TẤT CẢ CÔNG TRÌNH", `${contracts.length} công trình · ${customers.length || "—"} chủ đầu tư`);
  const HR = 5;
  headerRow(ls, HR, cols.length);
  ls.getRow(HR).values = cols.map((c) => c.h);
  let rr = HR + 1;
  for (const p of perC) {
    const row = ls.getRow(rr);
    const vals = [p.i + 1, p.c.code || p.c.maDuAn || "", p.c.name, p.c.customerName, p.value, p.invoiced, p.paid, p.os, p.pct, p.st];
    cols.forEach((col, ci) => {
      const cell = row.getCell(ci + 1);
      cell.value = vals[ci];
      cell.border = BORDER;
      cell.font = { size: 10 };
      if (col.m) { cell.numFmt = MONEY; cell.alignment = { horizontal: "right" }; }
      else if (col.p) { cell.numFmt = '0%'; cell.alignment = { horizontal: "center" }; }
      else if (col.c) cell.alignment = { horizontal: "center" };
      else cell.alignment = { horizontal: "left", wrapText: true, vertical: "top" };
    });
    // Tô màu trạng thái
    const stCell = row.getCell(cols.length);
    stCell.font = { size: 10, bold: true, color: { argb: p.st === "Quá hạn" ? "FFC62828" : p.st === "Đã hoàn thành" ? "FF2E7D32" : "FF0969A7" } };
    rr++;
  }
  // Dòng tổng
  const totRow = ls.getRow(rr);
  cols.forEach((col, ci) => {
    const cell = totRow.getCell(ci + 1);
    cell.border = BORDER;
    cell.fill = solid(GREENSOFT);
    cell.font = { bold: true, size: 10 };
    if (ci === 0) cell.value = "TỔNG";
    const map = { 4: T.value, 5: T.invoiced, 6: T.paid, 7: T.os };
    if (map[ci] != null) { cell.value = map[ci]; cell.numFmt = MONEY; cell.alignment = { horizontal: "right" }; }
    if (ci === 8) { cell.value = pctThu; cell.numFmt = '0%'; cell.alignment = { horizontal: "center" }; }
  });
  ls.autoFilter = { from: { row: HR, column: 1 }, to: { row: HR, column: cols.length } };
  // Data bar cột % + tô đỏ dòng quá hạn (cột Còn phải thu)
  ls.addConditionalFormatting({
    ref: `I${HR + 1}:I${rr - 1}`,
    rules: [{ type: "colorScale", cfvo: [{ type: "num", value: 0 }, { type: "num", value: 0.5 }, { type: "num", value: 1 }], color: [{ argb: "FFF8CBAD" }, { argb: "FFFFF2CC" }, { argb: "FFC6EFCE" }] }],
  });
  ls.addConditionalFormatting({
    ref: `H${HR + 1}:H${rr - 1}`,
    rules: [{ type: "dataBar", cfvo: [{ type: "min" }, { type: "max" }], color: { argb: "FFFFA726" } }],
  });

  /* ============ SHEET 3+ — MỖI CÔNG TRÌNH 1 SHEET ============ */
  const used = new Set(["tổng quan", "danh sách công trình"]);
  for (const p of perC.slice(0, 40)) {
    const c = p.c;
    const ws = wb.addWorksheet(sanitizeSheet(c.name, used), {
      views: [{ showGridLines: false }],
      pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0, margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 } },
    });
    ws.columns = [
      { width: 20 }, { width: 30 }, { width: 22 }, { width: 18 }, { width: 18 }, { width: 12 },
      { width: 12 }, { width: 12 }, { width: 16 }, { width: 16 }, { width: 12 }, { width: 16 },
      { width: 16 }, { width: 14 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 28 },
    ];
    const NC = 18;
    ws.mergeCells(1, 1, 1, NC);
    put(ws, "A1", `CÔNG TRÌNH: ${c.name}`, { font: { bold: true, size: 14, color: { argb: NAVY } } });
    ws.mergeCells(2, 1, 2, NC);
    put(ws, "A2", `Chủ đầu tư: ${c.customerName || "—"}  ·  Mã DA: ${c.maDuAn || "—"}  ·  Số HĐ: ${c.code || "—"}`, { font: { size: 10, color: { argb: "FF666666" } } });
    // Khối thông tin
    const nguoiPT = c.nguoiPhuTrach || p.rs.map((x) => x.nguoiPhuTrach).filter(Boolean).join(", ") || "—";
    const info = [
      ["Số hợp đồng", c.code || "—", false],
      ["Ngày ký", c.ngayKy ? fmtDate(c.ngayKy) : "—", false],
      ["Giá trị hợp đồng", p.value, true],
      ["Đã xuất hóa đơn", p.invoiced, true],
      ["Đã thu", p.paid, true],
      ["Còn phải thu", p.os, true],
      ["Quá hạn", p.overdue, true],
      ["Tỷ lệ thu", p.pct, false, "pct"],
      ["Tình trạng", p.st, false],
      ["Người phụ trách", nguoiPT, false],
      ["Công trình", c.fullName || c.name, false],
      ["Hạng mục", c.work || "—", false],
      ["Địa điểm", c.loc || "—", false],
      ["Cập nhật lần cuối", c.updatedAt ? new Date(c.updatedAt).toLocaleString("vi-VN") : "—", false],
    ];
    let ir = 4;
    for (const [label, val, money, kind] of info) {
      put(ws, `A${ir}`, label, { font: { bold: true, size: 10 }, border: BORDER });
      ws.mergeCells(`B${ir}:D${ir}`);
      const cell = put(ws, `B${ir}`, val, { font: { size: 10 }, border: BORDER });
      if (money) { cell.numFmt = MONEY; cell.alignment = { horizontal: "right" }; }
      if (kind === "pct") cell.numFmt = '0.0%';
      ws.getCell(`C${ir}`).border = BORDER; ws.getCell(`D${ir}`).border = BORDER;
      ir++;
    }
    ir += 1;
    // Bảng tiến độ thanh toán các đợt
    put(ws, `A${ir}`, "TIẾN ĐỘ THANH TOÁN CÁC ĐỢT", { font: { bold: true, size: 12, color: { argb: GREEN } } });
    ir++;
    const dcols = [
      { h: "Đợt", w: 8, c: true },
      { h: "Nội dung cần hoàn thành", w: 30 },
      { h: "Hồ sơ yêu cầu", w: 22 },
      { h: "Trạng thái hồ sơ", w: 18 },
      { h: "Trạng thái TT", w: 18 },
      { h: "Ngày gửi HS", w: 12, c: true },
      { h: "Ngày xuất HĐ", w: 12, c: true },
      { h: "Ngày theo HĐ", w: 12, c: true },
      { h: "Giá trị đợt (VNĐ)", w: 16, m: true },
      { h: "TT thực tế (VNĐ)", w: 16, m: true },
      { h: "Ngày thực thu", w: 12, c: true },
      { h: "Còn lại (VNĐ)", w: 16, m: true },
      { h: "Công nợ đến hạn (VNĐ)", w: 16, m: true },
      { h: "Quá hạn (VNĐ)", w: 14, m: true },
      { h: "Dự kiến thu HĐ (VNĐ)", w: 16, m: true },
      { h: "Dự kiến thu QLDA (VNĐ)", w: 16, m: true },
      { h: "Dự kiến thu CĐT (VNĐ)", w: 16, m: true },
      { h: "Ghi chú", w: 28 },
    ];
    headerRow(ws, ir, dcols.length);
    ws.getRow(ir).values = dcols.map((d) => d.h);
    ir++;
    const dt = (v) => (fmtDate(v) === "—" ? "" : fmtDate(v));
    for (const rrow of p.rs) {
      const row = ws.getRow(ir);
      const os = outstanding(rrow);
      const payTT = (rrow.paid || 0) <= 0 ? "Chưa thanh toán" : os > 0.5 ? "Thanh toán một phần" : "Đã thanh toán";
      const vals = [
        rrow.dot, rrow.noidung || "", rrow.hoso || "", statusName(rrow.status), payTT,
        dt(rrow.ngayGuiHS), dt(rrow.ngayXuatHD), dt(rrow.ngayDenHan),
        rrow.value || 0, rrow.paid || 0, dt(rrow.ngayTT), os,
        arisen(rrow) ? os : 0, daysLate(rrow) > 0 ? os : 0,
        "", "", "", rrow.ghichu || "",
      ];
      dcols.forEach((d, ci) => {
        const cell = row.getCell(ci + 1);
        cell.value = vals[ci];
        cell.border = BORDER;
        cell.font = { size: 10 };
        if (d.m) { cell.numFmt = MONEY; cell.alignment = { horizontal: "right" }; }
        else if (d.c) cell.alignment = { horizontal: "center" };
        else cell.alignment = { horizontal: "left", wrapText: true, vertical: "top" };
      });
      ir++;
    }
    // tổng đợt
    const tr = ws.getRow(ir);
    const sumV = p.rs.reduce((s, x) => s + (x.value || 0), 0);
    const sumOs = p.rs.reduce((s, x) => s + outstanding(x), 0);
    const totMap = { 8: sumV, 9: p.paid, 11: sumOs, 12: p.rs.reduce((s, x) => s + (arisen(x) ? outstanding(x) : 0), 0), 13: p.overdue };
    dcols.forEach((d, ci) => {
      const cell = tr.getCell(ci + 1);
      cell.border = BORDER; cell.fill = solid(GREENSOFT); cell.font = { bold: true, size: 10 };
      if (ci === 0) cell.value = "TỔNG";
      if (totMap[ci] != null) { cell.value = totMap[ci]; cell.numFmt = MONEY; cell.alignment = { horizontal: "right" }; }
    });
  }

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
