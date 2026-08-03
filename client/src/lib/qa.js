// Hỏi nhanh – đáp nhanh về CÔNG NỢ: tính trực tiếp từ dữ liệu hợp đồng/đợt.
// Không phải AI: nhận diện theo từ khóa + tên công trình/chủ đầu tư.
import { fmtVND, fmtTy, outstanding, daysLate, daysToDue, statusName } from "./models";

const norm = (v) =>
  String(v || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .trim();

const p2 = (n) => String(n).padStart(2, "0");
const dmy = (iso) => {
  const s = String(iso || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return "";
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
};

// Câu hỏi gợi ý (bấm là trả lời ngay)
export const GOI_Y = [
  "Tổng công nợ còn phải thu bao nhiêu?",
  "Đã thu được bao nhiêu, tỷ lệ thế nào?",
  "Chủ đầu tư nào nợ nhiều nhất?",
  "Đợt nào đang quá hạn?",
  "Đợt nào sắp đến hạn trong 30 ngày?",
  "Tháng này thu được bao nhiêu?",
  "Hợp đồng nào chưa thu được đồng nào?",
  "Công trình nào thu xong rồi?",
];

// Trả về { tieuDe, dong: [chuỗi], ghiChu? }
export function traLoi(cauHoi, { contracts = [], installments = [] } = {}) {
  const q = norm(cauHoi);
  if (!q) return null;
  const ctById = new Map(contracts.map((c) => [c.id, c]));
  const tenHD = (r) => ctById.get(r.contractId)?.name || r.contractName || "—";

  const tongHD = contracts.reduce((s, c) => s + (c.totalAfterTax || 0), 0);
  const daThu = installments.reduce((s, r) => s + (r.paid || 0), 0);
  const conThu = installments.reduce((s, r) => s + outstanding(r), 0);

  // 1) Quá hạn
  if (q.includes("qua han")) {
    const list = installments
      .filter((r) => daysLate(r) > 0 && outstanding(r) > 0)
      .sort((a, b) => daysLate(b) - daysLate(a));
    const tong = list.reduce((s, r) => s + outstanding(r), 0);
    if (!list.length)
      return { tieuDe: "Công nợ quá hạn", dong: ["Hiện KHÔNG có đợt nào quá hạn. 👍"] };
    return {
      tieuDe: `Đang quá hạn: ${list.length} đợt · ${fmtVND(tong)}`,
      dong: list
        .slice(0, 12)
        .map(
          (r) =>
            `${tenHD(r)} · ${r.dot}: ${fmtVND(outstanding(r))} — quá ${daysLate(r)} ngày (hạn ${dmy(r.ngayDenHan)})`
        ),
      ghiChu: list.length > 12 ? `…và ${list.length - 12} đợt khác.` : "",
    };
  }

  // 2) Sắp đến hạn
  if (q.includes("den han") || q.includes("sap toi") || q.includes("30 ngay")) {
    const soNgay = Number((q.match(/(\d+)\s*ngay/) || [])[1]) || 30;
    const list = installments
      .filter((r) => {
        const d = daysToDue(r);
        return d !== null && d >= 0 && d <= soNgay && outstanding(r) > 0;
      })
      .sort((a, b) => daysToDue(a) - daysToDue(b));
    const tong = list.reduce((s, r) => s + outstanding(r), 0);
    if (!list.length)
      return {
        tieuDe: `Đến hạn trong ${soNgay} ngày tới`,
        dong: [`Không có đợt nào đến hạn trong ${soNgay} ngày tới.`],
      };
    return {
      tieuDe: `Đến hạn trong ${soNgay} ngày: ${list.length} đợt · ${fmtVND(tong)}`,
      dong: list.map(
        (r) => `${tenHD(r)} · ${r.dot}: ${fmtVND(outstanding(r))} — còn ${daysToDue(r)} ngày (${dmy(r.ngayDenHan)})`
      ),
    };
  }

  // 3) Nợ nhiều nhất (theo chủ đầu tư)
  if ((q.includes("no nhieu") || q.includes("top")) && !q.includes("cong trinh")) {
    const m = new Map();
    for (const r of installments) {
      const c = ctById.get(r.contractId);
      const k = c?.customerName || "—";
      m.set(k, (m.get(k) || 0) + outstanding(r));
    }
    const list = [...m.entries()].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
    if (!list.length) return { tieuDe: "Nợ theo chủ đầu tư", dong: ["Không còn khoản nào phải thu."] };
    return {
      tieuDe: `Chủ đầu tư còn nợ nhiều nhất (${list.length} CĐT)`,
      dong: list
        .slice(0, 10)
        .map(([k, v], i) => `${i + 1}. ${k}: ${fmtVND(v)} (${((v / conThu) * 100).toFixed(1)}% tổng nợ)`),
    };
  }

  // 4) Đã thu / tỷ lệ
  if (q.includes("da thu") || q.includes("ty le") || q.includes("thu duoc bao nhieu")) {
    if (q.includes("thang")) return thangNay(installments, ctById, q);
    return {
      tieuDe: "Tình hình thu tiền",
      dong: [
        `Tổng giá trị hợp đồng: ${fmtVND(tongHD)} (${fmtTy(tongHD)})`,
        `Đã thu: ${fmtVND(daThu)} — đạt ${tongHD > 0 ? ((daThu / tongHD) * 100).toFixed(1) : 0}%`,
        `Còn phải thu: ${fmtVND(conThu)}`,
      ],
    };
  }

  // 5) Tháng này / tháng trước
  if (q.includes("thang")) return thangNay(installments, ctById, q);

  // 6) Chưa thu được đồng nào
  if (q.includes("chua thu")) {
    const list = contracts
      .map((c) => {
        const rs = installments.filter((r) => r.contractId === c.id);
        return { c, thu: rs.reduce((s, r) => s + (r.paid || 0), 0), gt: c.totalAfterTax || 0 };
      })
      .filter((x) => x.thu <= 0 && x.gt > 0)
      .sort((a, b) => b.gt - a.gt);
    if (!list.length) return { tieuDe: "Hợp đồng chưa thu", dong: ["Mọi hợp đồng đều đã thu được ít nhất một phần."] };
    return {
      tieuDe: `Chưa thu được đồng nào: ${list.length} hợp đồng · ${fmtVND(list.reduce((s, x) => s + x.gt, 0))}`,
      dong: list.map((x) => `${x.c.name}${x.c.code ? ` (${x.c.code})` : ""}: ${fmtVND(x.gt)} — ${x.c.customerName || ""}`),
    };
  }

  // 7) Thu xong / hoàn thành
  if (q.includes("thu xong") || q.includes("thu du") || q.includes("hoan thanh")) {
    const list = contracts.filter((c) => {
      const rs = installments.filter((r) => r.contractId === c.id);
      const os = rs.reduce((s, r) => s + outstanding(r), 0);
      const thu = rs.reduce((s, r) => s + (r.paid || 0), 0);
      return rs.length > 0 && os <= 0.5 && thu > 0;
    });
    if (!list.length) return { tieuDe: "Hợp đồng đã thu đủ", dong: ["Chưa có hợp đồng nào thu đủ 100%."] };
    return {
      tieuDe: `Đã thu đủ: ${list.length} hợp đồng`,
      dong: list.map((c) => `${c.name}${c.code ? ` (${c.code})` : ""} — ${c.customerName || ""}`),
    };
  }

  // 8) Tổng nợ
  if (q.includes("tong") || q.includes("con phai thu") || q.includes("con no") || q.includes("cong no")) {
    const qh = installments.filter((r) => daysLate(r) > 0).reduce((s, r) => s + outstanding(r), 0);
    return {
      tieuDe: "Tổng quan công nợ",
      dong: [
        `Còn phải thu: ${fmtVND(conThu)} (${fmtTy(conThu)})`,
        `Trong đó quá hạn: ${fmtVND(qh)}`,
        `Đã thu: ${fmtVND(daThu)} / ${fmtVND(tongHD)} — ${tongHD > 0 ? ((daThu / tongHD) * 100).toFixed(1) : 0}%`,
        `Số hợp đồng đang theo dõi: ${contracts.length} · số đợt: ${installments.length}`,
      ],
    };
  }

  // 9) Tra theo tên công trình / chủ đầu tư
  const hit = contracts.filter(
    (c) => norm(c.name).includes(q) || norm(c.code).includes(q) || norm(c.customerName).includes(q) || norm(c.maDuAn).includes(q)
  );
  if (hit.length) {
    const rs = installments.filter((r) => hit.some((c) => c.id === r.contractId));
    const gt = hit.reduce((s, c) => s + (c.totalAfterTax || 0), 0);
    const thu = rs.reduce((s, r) => s + (r.paid || 0), 0);
    const os = rs.reduce((s, r) => s + outstanding(r), 0);
    const qh = rs.filter((r) => daysLate(r) > 0);
    return {
      tieuDe: hit.length === 1 ? `${hit[0].name} — ${hit[0].customerName || ""}` : `${hit.length} hợp đồng khớp "${cauHoi}"`,
      dong: [
        `Giá trị hợp đồng: ${fmtVND(gt)}`,
        `Đã thu: ${fmtVND(thu)} — ${gt > 0 ? ((thu / gt) * 100).toFixed(1) : 0}%`,
        `Còn phải thu: ${fmtVND(os)}`,
        qh.length ? `⚠ Quá hạn ${qh.length} đợt: ${fmtVND(qh.reduce((s, r) => s + outstanding(r), 0))}` : "Không có đợt quá hạn.",
        ...rs
          .slice(0, 10)
          .map((r) => `• ${r.dot}: ${fmtVND(r.value)} — đã thu ${fmtVND(r.paid)} — ${statusName(r.status)}`),
      ],
    };
  }

  return {
    tieuDe: "Chưa hiểu câu hỏi",
    dong: [
      "Sếp thử gõ tên công trình (VD: HOWELL), tên chủ đầu tư, hoặc bấm một câu gợi ý bên dưới.",
    ],
  };
}

// Thu trong tháng (mặc định tháng hiện tại, hỗ trợ "tháng 5", "tháng trước")
function thangNay(installments, ctById, q = "") {
  const now = new Date();
  let y = now.getFullYear();
  let m = now.getMonth() + 1;
  const mm = Number((q.match(/thang\s*(\d{1,2})/) || [])[1]);
  if (mm >= 1 && mm <= 12) m = mm;
  if (q.includes("thang truoc")) {
    m = m - 1 || 12;
    if (m === 12 && now.getMonth() === 0) y -= 1;
  }
  const key = `${y}-${p2(m)}`;
  const list = installments.filter((r) => String(r.ngayTT || "").slice(0, 7) === key && (r.paid || 0) > 0);
  const tong = list.reduce((s, r) => s + (r.paid || 0), 0);
  return {
    tieuDe: `Thu trong tháng ${p2(m)}/${y}: ${fmtVND(tong)}`,
    dong: list.length
      ? list.map(
          (r) =>
            `${ctById.get(r.contractId)?.name || r.contractName} · ${r.dot}: ${fmtVND(r.paid)} (${dmy(r.ngayTT)})`
        )
      : ["Chưa ghi nhận khoản thu nào trong tháng này."],
  };
}
