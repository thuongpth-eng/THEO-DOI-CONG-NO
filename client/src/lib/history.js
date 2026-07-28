// Ghi & hiển thị lịch sử thay đổi cho từng đợt.
import { STATUS_NAMES } from "./models";

export const FIELD_LABELS = {
  dot: "Tên đợt",
  hoso: "Hồ sơ yêu cầu",
  noidung: "Nội dung",
  status: "Trạng thái hồ sơ",
  value: "Giá trị đợt",
  paid: "Đã thanh toán",
  ngayGuiHS: "Ngày gửi HS",
  ngayXuatHD: "Ngày xuất HĐ",
  ngayDenHan: "Ngày công nợ đến hạn",
  ngayTT: "Ngày thực thu",
  hanTT: "Số ngày theo HĐ",
  duKienHD: "Dự kiến thu HĐ",
  duKienQLDA: "Dự kiến thu QLDA",
  duKienCDT: "Dự kiến thu CĐT",
  ghichu: "Ghi chú",
  nguoiPhuTrach: "Người phụ trách",
};

const disp = (field, v) => {
  if (field === "status") return STATUS_NAMES[Number(v)] ?? String(v ?? "—");
  if (v === "" || v == null) return "—";
  return String(v);
};

// So sánh bản cũ với các trường thay đổi → mảng entry {ts, by, field, old, new}
export function buildHistory(oldObj, patch, by) {
  const entries = [];
  const ts = new Date().toISOString();
  for (const k of Object.keys(patch)) {
    if (!(k in FIELD_LABELS)) continue;
    const before = oldObj?.[k];
    const after = patch[k];
    if (String(before ?? "") === String(after ?? "")) continue;
    entries.push({ ts, by: by || "", field: k, old: disp(k, before), new: disp(k, after) });
  }
  return entries;
}

// Gộp lịch sử cũ + mới, giữ tối đa 80 mục gần nhất (tránh phình document)
export const appendHistory = (old = [], entries = []) => [...old, ...entries].slice(-80);
