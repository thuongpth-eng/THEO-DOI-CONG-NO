// Xuất Excel theo ý muốn: lọc theo tháng / chủ đầu tư / công trình / quá hạn / đến hạn
// và chỉ lấy các cột người dùng tích chọn.
import { fmtDate, statusName, outstanding, daysLate, daysToDue } from "./models";

const p2 = (n) => String(n).padStart(2, "0");
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
};

// Tất cả cột có thể xuất. key dùng để tích chọn, get() lấy giá trị 1 dòng.
export const FIELDS = [
  { key: "maDuAn", label: "Mã dự án", w: 14, get: (r, c) => c?.maDuAn || "" },
  { key: "code", label: "Số hợp đồng", w: 22, get: (r, c) => c?.code || "" },
  { key: "contractName", label: "Công trình", w: 20, get: (r, c) => c?.name || r.contractName || "" },
  { key: "customerName", label: "Chủ đầu tư", w: 34, get: (r, c) => c?.customerName || "" },
  { key: "loai", label: "Loại", w: 10, get: (r, c) => c?.loai || "Hợp đồng" },
  { key: "work", label: "Hạng mục", w: 40, get: (r, c) => c?.work || "" },
  { key: "loc", label: "Địa điểm", w: 40, get: (r, c) => c?.loc || "" },
  { key: "dot", label: "Đợt", w: 12, get: (r) => r.dot || "" },
  { key: "noidung", label: "Nội dung cần hoàn thành", w: 50, get: (r) => r.noidung || "" },
  { key: "hoso", label: "Hồ sơ yêu cầu", w: 30, get: (r) => r.hoso || "" },
  { key: "status", label: "Trạng thái hồ sơ", w: 20, get: (r) => statusName(r.status) },
  { key: "ngayGuiHS", label: "Ngày gửi HS", w: 13, get: (r) => fmtDate(r.ngayGuiHS), date: true },
  { key: "ngayXuatHD", label: "Ngày xuất HĐ", w: 13, get: (r) => fmtDate(r.ngayXuatHD), date: true },
  { key: "ngayDenHan", label: "Ngày đến hạn", w: 13, get: (r) => fmtDate(r.ngayDenHan), date: true },
  { key: "value", label: "Giá trị đợt (VNĐ)", w: 18, money: true, get: (r) => r.value || 0 },
  { key: "paid", label: "Đã thu (VNĐ)", w: 18, money: true, get: (r) => r.paid || 0 },
  { key: "os", label: "Còn lại (VNĐ)", w: 18, money: true, get: (r) => outstanding(r) },
  { key: "ngayTT", label: "Ngày thực thu", w: 13, get: (r) => fmtDate(r.ngayTT), date: true },
  { key: "late", label: "Số ngày quá hạn", w: 14, get: (r) => daysLate(r) || "" },
  { key: "duKienHD", label: "Dự kiến thu HĐ", w: 14, get: (r) => fmtDate(r.duKienHD), date: true },
  { key: "duKienQLDA", label: "Dự kiến thu QLDA", w: 15, get: (r) => fmtDate(r.duKienQLDA), date: true },
  { key: "duKienCDT", label: "Dự kiến thu CĐT", w: 15, get: (r) => fmtDate(r.duKienCDT), date: true },
  { key: "nguoiPhuTrach", label: "Người phụ trách", w: 18, get: (r, c) => r.nguoiPhuTrach || c?.nguoiPhuTrach || "" },
  { key: "ghichu", label: "Ghi chú", w: 40, get: (r) => r.ghichu || "" },
  { key: "updatedAt", label: "Cập nhật lần cuối", w: 16, get: (r) => fmtDate(r.updatedAt), date: true },
  { key: "updatedBy", label: "Người cập nhật", w: 18, get: (r) => r.updatedBy || "" },
];

// Cột mặc định tích sẵn
export const DEFAULT_FIELDS = [
  "code", "contractName", "customerName", "dot", "noidung", "status",
  "ngayXuatHD", "ngayDenHan", "value", "paid", "os", "ngayTT", "late", "ghichu",
];

export const MOC_NGAY = [
  { key: "", label: "Không lọc theo ngày (toàn bộ)" },
  { key: "ngayDenHan", label: "Ngày đến hạn" },
  { key: "ngayXuatHD", label: "Ngày xuất hóa đơn" },
  { key: "ngayTT", label: "Ngày thực thu" },
  { key: "ngayGuiHS", label: "Ngày gửi hồ sơ" },
];

// dd/mm/yyyy từ yyyy-mm-dd
export const ddmmyyyy = (iso) => {
  const s = String(iso || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return "";
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
};

// Lọc danh sách đợt theo bộ tiêu chí
export function filterRows(installments, contracts, f) {
  const ctById = new Map(contracts.map((c) => [c.id, c]));
  return installments.filter((r) => {
    const c = ctById.get(r.contractId);
    if (f.customers?.length && !f.customers.includes(c?.customerName || "")) return false;
    if (f.contracts?.length && !f.contracts.includes(r.contractId)) return false;

    // Khoảng ngày (yyyy-mm-dd) theo mốc ngày đã chọn. Mốc rỗng = không lọc theo ngày.
    if (f.mocNgay && (f.tuNgay || f.denNgay)) {
      const d = String(r[f.mocNgay] || "").slice(0, 10);
      // Đợt chưa có ngày: chỉ giữ khi người dùng tích "kèm đợt chưa có ngày"
      if (!d) return !!f.kemChuaCoNgay;
      if (f.tuNgay && d < f.tuNgay) return false;
      if (f.denNgay && d > f.denNgay) return false;
    }

    const os = outstanding(r);
    if (f.chiConNo && os <= 0) return false;
    // Quá hạn / đến hạn tính đúng chuẩn app (daysLate, daysToDue)
    if (f.chiQuaHan && !(daysLate(r) > 0 && os > 0)) return false;
    if (f.chiDenHan) {
      const d = daysToDue(r);
      if (!(d !== null && d >= 0 && os > 0)) return false;
    }
    return true;
  });
}

// Xuất Excel 1 sheet phẳng theo cột đã chọn
export async function exportCustomExcel(contracts, installments, f, opts = {}) {
  const ExcelJS = (await import("exceljs")).default || (await import("exceljs"));
  const rows = filterRows(installments, contracts, f);
  const cols = FIELDS.filter((x) => f.fields.includes(x.key));
  if (!cols.length) throw new Error("Chưa chọn cột nào để xuất.");

  const ctById = new Map(contracts.map((c) => [c.id, c]));
  const wb = new ExcelJS.Workbook();
  wb.creator = "HP CONS";
  const ws = wb.addWorksheet("DỮ LIỆU", {
    views: [{ state: "frozen", ySplit: 4 }],
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });

  const n = cols.length;
  const GREEN = "FF60BB46";
  const MONEY = "#,##0;[Red]-#,##0";

  // Tiêu đề
  ws.mergeCells(1, 1, 1, n);
  const t = ws.getCell(1, 1);
  t.value = "BÁO CÁO CÔNG NỢ CHỦ ĐẦU TƯ – HP CONS";
  t.font = { bold: true, size: 14, color: { argb: "FF4B4F55" } };
  t.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(1).height = 24;

  ws.mergeCells(2, 1, 2, n);
  const s = ws.getCell(2, 1);
  s.value = moTaLoc(f, contracts, rows.length, opts.exportedBy);
  s.font = { size: 9, italic: true, color: { argb: "FF888888" } };
  s.alignment = { horizontal: "center" };

  // Đầu bảng ở dòng 4
  const hr = ws.getRow(4);
  cols.forEach((c, i) => {
    const cell = hr.getCell(i + 1);
    cell.value = c.label;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GREEN } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    ws.getColumn(i + 1).width = c.w;
  });
  hr.height = 30;

  // Dữ liệu
  rows.forEach((r, ri) => {
    const c = ctById.get(r.contractId);
    const row = ws.getRow(5 + ri);
    cols.forEach((col, i) => {
      const cell = row.getCell(i + 1);
      cell.value = col.get(r, c);
      cell.font = { size: 10 };
      cell.alignment = {
        vertical: "top",
        wrapText: !col.money && !col.date,
        horizontal: col.money ? "right" : col.date ? "center" : "left",
      };
      if (col.money) cell.numFmt = MONEY;
      cell.border = {
        top: { style: "thin", color: { argb: "FFEEEEEE" } },
        left: { style: "thin", color: { argb: "FFEEEEEE" } },
        bottom: { style: "thin", color: { argb: "FFEEEEEE" } },
        right: { style: "thin", color: { argb: "FFEEEEEE" } },
      };
    });
  });

  // Dòng tổng
  const totalIdx = 5 + rows.length;
  const tr = ws.getRow(totalIdx);
  cols.forEach((col, i) => {
    const cell = tr.getCell(i + 1);
    if (i === 0) cell.value = "TỔNG";
    else if (col.money) cell.value = rows.reduce((sum, r) => sum + (Number(col.get(r, ctById.get(r.contractId))) || 0), 0);
    cell.font = { bold: true, size: 10 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEAF6E6" } };
    if (col.money) {
      cell.numFmt = MONEY;
      cell.alignment = { horizontal: "right" };
    }
  });

  if (rows.length) ws.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4, column: n } };

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `HPCons-CongNo-${tenFile(f)}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return rows.length;
}

// Xuất PDF (qua hộp thoại in của trình duyệt) — cùng bộ lọc & cột đã chọn
export function exportCustomPDF(contracts, installments, f, opts = {}) {
  const rows = filterRows(installments, contracts, f);
  const cols = FIELDS.filter((x) => f.fields.includes(x.key));
  if (!cols.length) throw new Error("Chưa chọn cột nào để xuất.");
  const ctById = new Map(contracts.map((c) => [c.id, c]));
  const esc = (v) =>
    String(v ?? "").replace(/[&<>]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[m]));
  const tien = (n) => new Intl.NumberFormat("vi-VN").format(Math.round(Number(n) || 0));

  const tong = {};
  for (const c of cols)
    if (c.money) tong[c.key] = rows.reduce((s, r) => s + (Number(c.get(r, ctById.get(r.contractId))) || 0), 0);

  const thead = cols
    .map((c) => `<th class="${c.money ? "r" : c.date ? "c" : ""}">${esc(c.label)}</th>`)
    .join("");
  const tbody = rows
    .map((r) => {
      const c0 = ctById.get(r.contractId);
      return `<tr>${cols
        .map((c) => {
          const v = c.get(r, c0);
          const cls = c.money ? "r" : c.date ? "c" : "";
          return `<td class="${cls}">${c.money ? tien(v) : esc(v)}</td>`;
        })
        .join("")}</tr>`;
    })
    .join("");
  const tfoot = `<tr>${cols
    .map((c, i) =>
      i === 0
        ? `<td><b>TỔNG</b></td>`
        : c.money
        ? `<td class="r"><b>${tien(tong[c.key])}</b></td>`
        : "<td></td>"
    )
    .join("")}</tr>`;

  const html = `<!doctype html><html lang="vi"><head><meta charset="utf-8">
  <title>Báo cáo công nợ — HP CONS</title>
  <style>
    @page { size: A4 landscape; margin: 10mm; }
    *{box-sizing:border-box}
    body{font:11px/1.45 Arial,"Segoe UI",sans-serif;color:#1e293b;margin:0;padding:14px}
    .head{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:3px solid #60BB46;padding-bottom:8px}
    .brand{font-size:18px;font-weight:800;color:#4B4F55;letter-spacing:.5px}
    .brand span{color:#60BB46}
    .meta{text-align:right;font-size:10px;color:#64748b}
    h1{font-size:15px;margin:12px 0 2px}
    .sub{color:#64748b;font-size:10px;margin-bottom:10px}
    .kpi{display:flex;gap:8px;margin:0 0 12px}
    .kpi div{flex:1;border:1px solid #e2e8f0;border-radius:6px;padding:7px 9px;background:#fafafa}
    .kpi .lbl{font-size:9px;color:#64748b;text-transform:uppercase}
    .kpi .val{font-size:13px;font-weight:800;margin-top:2px}
    table{width:100%;border-collapse:collapse;font-size:9.5px}
    th,td{border:1px solid #dbe3ea;padding:4px 5px;text-align:left;vertical-align:top}
    thead th{background:#60BB46;color:#fff;font-size:9px;text-transform:uppercase}
    thead{display:table-header-group}
    tr{page-break-inside:avoid}
    td.r,th.r{text-align:right;white-space:nowrap}
    td.c,th.c{text-align:center;white-space:nowrap}
    tfoot td{background:#EAF6E6;font-weight:800}
    .ft{margin-top:14px;font-size:9px;color:#94a3b8;text-align:center}
  </style></head><body>
    <div class="head">
      <div class="brand">HP <span>CONS</span></div>
      <div class="meta">Ngày in: ${new Date().toLocaleString("vi-VN")}${
    opts.exportedBy ? `<br>Người xuất: ${esc(opts.exportedBy)}` : ""
  }</div>
    </div>
    <h1>BÁO CÁO CÔNG NỢ CHỦ ĐẦU TƯ</h1>
    <div class="sub">${esc(moTaLoc(f, contracts, rows.length, ""))}</div>
    <div class="kpi">
      <div><div class="lbl">Số dòng</div><div class="val">${rows.length}</div></div>
      <div><div class="lbl">Giá trị đợt</div><div class="val">${tien(
        rows.reduce((s, r) => s + (r.value || 0), 0)
      )} đ</div></div>
      <div><div class="lbl">Đã thu</div><div class="val" style="color:#059669">${tien(
        rows.reduce((s, r) => s + (r.paid || 0), 0)
      )} đ</div></div>
      <div><div class="lbl">Còn phải thu</div><div class="val" style="color:#dc2626">${tien(
        rows.reduce((s, r) => s + outstanding(r), 0)
      )} đ</div></div>
    </div>
    <table><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody><tfoot>${tfoot}</tfoot></table>
    <div class="ft">Báo cáo tự động từ hệ thống Kiểm soát hợp đồng chủ đầu tư · HP CONS</div>
    <script>window.onload=()=>{window.print()}</script>
  </body></html>`;

  const w = window.open("", "_blank");
  if (!w) throw new Error("Trình duyệt đã chặn cửa sổ in. Sếp cho phép pop-up rồi thử lại.");
  w.document.write(html);
  w.document.close();
  return rows.length;
}

function moTaLoc(f, contracts, soDong, by) {
  const parts = [];
  const moc = MOC_NGAY.find((m) => m.key === f.mocNgay)?.label;
  if (f.mocNgay && (f.tuNgay || f.denNgay))
    parts.push(
      `Kỳ: ${ddmmyyyy(f.tuNgay) || "…"} → ${ddmmyyyy(f.denNgay) || "…"} (theo ${moc})`
    );
  if (f.customers?.length) parts.push(`CĐT: ${f.customers.join(", ")}`);
  if (f.contracts?.length) {
    const names = contracts.filter((c) => f.contracts.includes(c.id)).map((c) => c.name);
    parts.push(`Công trình: ${names.join(", ")}`);
  }
  if (f.chiQuaHan) parts.push("Chỉ công nợ QUÁ HẠN");
  if (f.chiDenHan) parts.push("Chỉ công nợ ĐẾN HẠN");
  if (f.chiConNo) parts.push("Chỉ còn phải thu");
  if (!parts.length) parts.push("Toàn bộ dữ liệu");
  parts.push(`${soDong} dòng`);
  if (by) parts.push(`Người xuất: ${by}`);
  return parts.join(" · ");
}

function tenFile(f) {
  const bits = [];
  if (f.tuNgay) bits.push(f.tuNgay.replace(/-/g, ""));
  if (f.denNgay && f.denNgay !== f.tuNgay) bits.push(f.denNgay.replace(/-/g, ""));
  if (f.chiQuaHan) bits.push("QuaHan");
  if (f.chiDenHan) bits.push("DenHan");
  if (!bits.length) bits.push(todayISO().replace(/-/g, ""));
  return bits.join("-");
}
