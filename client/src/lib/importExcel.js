// Đọc file Excel công nợ (định dạng chuẩn app: sheet "DANH SÁCH CÔNG TRÌNH" + mỗi công trình 1 sheet)
// → trả { customers, contracts, installments, warnings }. Tự nhận diện cột.
import { STATUS_NAMES } from "./models.js";
import { slug } from "./contractsUtil.js";

const statusIdx = (t) => {
  const i = STATUS_NAMES.findIndex((s) => s.toLowerCase() === String(t || "").trim().toLowerCase());
  return i < 0 ? 0 : i;
};
const num = (v) => (typeof v === "number" ? v : Number(String(v || "").replace(/[^\d.-]/g, "")) || 0);
function toISO(v) {
  if (v == null || v === "") return "";
  if (v instanceof Date) {
    const p = (n) => String(n).padStart(2, "0");
    return `${v.getFullYear()}-${p(v.getMonth() + 1)}-${p(v.getDate())}`;
  }
  if (typeof v === "number") {
    const d = new Date(Math.round((v - 25569) * 86400000));
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`;
  }
  return String(v);
}
const s = (v) => String(v == null ? "" : v).trim();

export async function parseCongNoExcel(arrayBuffer) {
  const XLSX = (await import("xlsx")).default;
  const wb = XLSX.read(arrayBuffer, { cellDates: true });
  const rowsOf = (name) => XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: "" });
  const warnings = [];

  const dsName = wb.SheetNames.find((n) => n.toUpperCase().replace(/\s/g, "").includes("DANHSÁCH".toUpperCase())) ||
    wb.SheetNames.find((n) => n.toUpperCase().replace(/\s/g, "").includes("DANHSACH"));
  if (!dsName) {
    return { customers: [], contracts: [], installments: [], warnings: ["Không tìm thấy sheet 'DANH SÁCH CÔNG TRÌNH'. File phải theo mẫu chuẩn của app."] };
  }

  // DANH SÁCH → contracts cơ bản (key = số HĐ)
  const ds = rowsOf(dsName);
  const hdrIdx = ds.findIndex((r) => s(r[0]) === "STT");
  const byCode = new Map();
  if (hdrIdx >= 0) {
    for (let i = hdrIdx + 1; i < ds.length; i++) {
      const r = ds[i];
      if (s(r[0]) === "TỔNG" || !r[1]) continue;
      const code = s(r[1]);
      byCode.set(code, { code, name: s(r[2]), customerName: s(r[3]), totalAfterTax: num(r[4]) });
    }
  }

  const contracts = [];
  const installments = [];
  let order = 0;
  for (const name of wb.SheetNames) {
    const up = name.toUpperCase().replace(/\s/g, "");
    if (up.includes("TỔNGQUAN".toUpperCase()) || up.includes("TONGQUAN") || up.includes("DANHSÁCH".toUpperCase()) || up.includes("DANHSACH")) continue;
    const rows = rowsOf(name);
    const info = {};
    for (const r of rows) { if (r[0] && r[1] !== "") info[s(r[0])] = r[1]; }
    const code = s(info["Số hợp đồng"]) || name.replace(/^\d+-/, "");
    const base = byCode.get(code) || { code, name: name.replace(/^\d+-/, ""), customerName: s(info["Chủ đầu tư"]), totalAfterTax: 0 };
    const cid = "ct_" + slug(code || name).slice(4);
    const nguoi = s(info["Người phụ trách"]);
    contracts.push({
      id: cid, code, name: base.name, customerName: base.customerName, customerId: slug(base.customerName),
      totalAfterTax: base.totalAfterTax || num(info["Giá trị hợp đồng"]),
      work: s(info["Hạng mục"]), loc: s(info["Địa điểm"]), fullName: s(info["Công trình"]),
      ngayKy: toISO(info["Ngày ký"]), nguoiPhuTrach: nguoi,
      maDuAn: "", group: base.name, loai: "Hợp đồng", order: ++order,
      updatedAt: new Date().toISOString(), updatedBy: "Nhập Excel",
    });
    const dh = rows.findIndex((r) => s(r[0]) === "Đợt");
    if (dh >= 0) {
      let o = 0;
      for (let i = dh + 1; i < rows.length; i++) {
        const r = rows[i];
        const d0 = s(r[0]);
        if (!d0 || d0.startsWith("TỔNG")) continue;
        installments.push({
          id: cid + "_d" + (++o), contractId: cid, contractName: base.name, customerId: slug(base.customerName),
          dot: d0, noidung: s(r[1]), hoso: s(r[2]), status: statusIdx(r[3]),
          value: num(r[8]), paid: num(r[9]),
          ngayGuiHS: toISO(r[5]), ngayXuatHD: toISO(r[6]), ngayDenHan: toISO(r[7]), ngayTT: toISO(r[10]),
          duKienHD: "", duKienQLDA: "", duKienCDT: "",
          ghichu: s(r[17]), nguoiPhuTrach: nguoi, hanTT: 0, order: o,
          updatedAt: new Date().toISOString(), updatedBy: "Nhập Excel",
        });
      }
    } else {
      warnings.push(`Sheet "${name}" không có bảng đợt (thiếu dòng tiêu đề "Đợt").`);
    }
  }

  const cusMap = new Map();
  for (const c of contracts) if (c.customerName) cusMap.set(c.customerId, { id: c.customerId, name: c.customerName });
  const customers = [...cusMap.values()];

  if (!contracts.length) warnings.push("Không đọc được công trình nào từ file.");
  return { customers, contracts, installments, warnings };
}

const isSheetTongHop = (n) => {
  const up = n.toUpperCase().replace(/\s/g, "");
  return (
    up.includes("TỔNGQUAN".toUpperCase()) || up.includes("TONGQUAN") ||
    up.includes("DANHSÁCH".toUpperCase()) || up.includes("DANHSACH")
  );
};

// Liệt kê các sheet công trình trong file (để người dùng chọn công trình nào cần đọc)
export async function listContractSheets(arrayBuffer) {
  const XLSX = (await import("xlsx")).default;
  const wb = XLSX.read(arrayBuffer, { bookSheets: true });
  return wb.SheetNames.filter((n) => !isSheetTongHop(n));
}

// Đọc file công nợ của MỘT hợp đồng (mẫu chuẩn app: 1 sheet công trình = khối thông tin + bảng "Đợt")
// → trả { contract, installments, sheets, sheetName, warnings }.
// Dùng khi thêm HĐ mới: chỉ điền form + tạo đợt, KHÔNG xóa dữ liệu cũ.
// pick = tên sheet muốn đọc (bỏ trống = sheet công trình đầu tiên).
export async function parseOneContract(arrayBuffer, pick = "") {
  const XLSX = (await import("xlsx")).default;
  const wb = XLSX.read(arrayBuffer, { cellDates: true });
  const rowsOf = (name) => XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: "" });
  const warnings = [];

  const sheets = wb.SheetNames.filter((n) => !isSheetTongHop(n));
  if (!sheets.length)
    return { contract: null, installments: [], sheets: [], sheetName: "", warnings: ["Không tìm thấy sheet công trình trong file. File phải theo mẫu chuẩn của app."] };

  const sheetName = sheets.includes(pick) ? pick : sheets[0];
  const rows = rowsOf(sheetName);
  const info = {};
  for (const r of rows) if (r[0] && r[1] !== "") info[s(r[0])] = r[1];

  const code = s(info["Số hợp đồng"]) || sheetName.replace(/^\d+-/, "");

  // Sheet công trình không chứa Chủ đầu tư → tra thêm ở sheet "DANH SÁCH CÔNG TRÌNH" theo số HĐ
  let cdt = s(info["Chủ đầu tư"]);
  let tenNgan = "";
  const dsName = wb.SheetNames.find((n) => {
    const up = n.toUpperCase().replace(/\s/g, "");
    return up.includes("DANHSÁCH".toUpperCase()) || up.includes("DANHSACH");
  });
  if (dsName) {
    const ds = rowsOf(dsName);
    const hit = ds.find((r) => s(r[1]) && s(r[1]) === code);
    if (hit) {
      tenNgan = s(hit[2]);
      if (!cdt) cdt = s(hit[3]);
    }
  }

  const contract = {
    code,
    // Tên ngắn (HOWELL) chứ không lấy tên dài; tên dài để riêng ở fullName
    name: tenNgan || sheetName.replace(/^\d+-/, ""),
    fullName: s(info["Công trình"]),
    customerName: cdt,
    totalAfterTax: num(info["Giá trị hợp đồng"]),
    work: s(info["Hạng mục"]),
    loc: s(info["Địa điểm"]),
    ngayKy: toISO(info["Ngày ký"]),
    nguoiPhuTrach: s(info["Người phụ trách"]),
  };
  if (!cdt) warnings.push("File không có tên Chủ đầu tư — Sếp nhập tay giúp.");

  const installments = [];
  const dh = rows.findIndex((r) => s(r[0]) === "Đợt");
  if (dh >= 0) {
    let o = 0;
    for (let i = dh + 1; i < rows.length; i++) {
      const r = rows[i];
      const d0 = s(r[0]);
      if (!d0 || d0.startsWith("TỔNG")) continue;
      installments.push({
        dot: d0, noidung: s(r[1]), hoso: s(r[2]), status: statusIdx(r[3]),
        value: num(r[8]), paid: num(r[9]),
        ngayGuiHS: toISO(r[5]), ngayXuatHD: toISO(r[6]), ngayDenHan: toISO(r[7]), ngayTT: toISO(r[10]),
        duKienHD: toISO(r[14]), duKienQLDA: toISO(r[15]), duKienCDT: toISO(r[16]),
        ghichu: s(r[17]), order: ++o,
      });
    }
  } else {
    warnings.push(`Sheet "${sheetName}" không có bảng đợt (thiếu dòng tiêu đề "Đợt").`);
  }

  return { contract, installments, sheets, sheetName, warnings };
}
