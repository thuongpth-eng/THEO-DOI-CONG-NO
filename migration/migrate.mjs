// Chuyển dữ liệu từ file v31 (v31-raw.json) sang cấu trúc chuẩn hóa cho Firestore.
// Chạy: node migrate.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dir = dirname(fileURLToPath(import.meta.url));
const raw = JSON.parse(readFileSync(join(__dir, "v31-raw.json"), "utf8"));

// Bỏ dấu tiếng Việt + tạo slug làm id gọn
const slug = (s) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);

const customers = [];
const customerIdByName = new Map();
const contracts = [];
const installments = [];

raw.projects.forEach((p, pi) => {
  // --- Khách hàng (chủ đầu tư) ---
  const cdt = (p.cdt || "").trim();
  let customerId = customerIdByName.get(cdt);
  if (!customerId) {
    customerId = "cus_" + slug(cdt || "khong-ro");
    customerIdByName.set(cdt, customerId);
    customers.push({ id: customerId, name: cdt });
  }

  // --- Hợp đồng / công trình ---
  const contractId = p.id; // giữ id gốc: HOWELL, SHUNHING...
  contracts.push({
    id: contractId,
    customerId,
    customerName: cdt,
    code: p.contract || "",
    name: p.name || contractId,
    work: p.work || "",
    loc: p.loc || "",
    totalAfterTax: Number(p.totalAfterTax) || 0,
    group: p.group || "",
    loai: p.loai || "Hợp đồng",
    maDuAn: p.maDuAn || "",
    order: pi + 1,
  });

  // --- Đợt thanh toán ---
  (p.rows || []).forEach((r, ri) => {
    installments.push({
      id: `${contractId}_${ri + 1}`,
      contractId,
      contractName: p.name || contractId,
      customerId,
      order: ri + 1,
      dot: r.dot || `ĐỢT ${ri + 1}`,
      hoso: r.hoso || "",
      noidung: r.noidung || "",
      value: Number(r.value) || 0,
      paid: Number(r.paid) || 0,
      status: Number(r.status) || 0,
      ngayGuiHS: r.ngayGuiHS || "",
      ngayXuatHD: r.ngayXuatHD || "",
      ngayDenHan: r.ngayDenHan || "",
      ngayTT: r.ngayTT || "",
      duKienHD: r.duKienHD || "",
      duKienQLDA: r.duKienQLDA || "",
      duKienCDT: r.duKienCDT || "",
      ghichu: r.ghichu || "",
      hanTT: Number(r.hanTT) || 0,
    });
  });
});

const seed = {
  meta: {
    source: "theo-doi-cong-no-hpcons_v31.html",
    migratedFrom: raw.meta?.updatedAt || "",
    counts: {
      customers: customers.length,
      contracts: contracts.length,
      installments: installments.length,
    },
  },
  customers,
  contracts,
  installments,
};

// Ghi ra 2 nơi: migration (bản gốc) + client/src/data (để app dùng khi chạy local)
writeFileSync(join(__dir, "seed.json"), JSON.stringify(seed, null, 2), "utf8");
writeFileSync(
  join(__dir, "..", "client", "src", "data", "seed.json"),
  JSON.stringify(seed, null, 2),
  "utf8"
);

// Kiểm tra tổng tiền để đối chiếu
const totalContract = contracts.reduce((s, c) => s + c.totalAfterTax, 0);
const totalValue = installments.reduce((s, i) => s + i.value, 0);
const totalPaid = installments.reduce((s, i) => s + i.paid, 0);

console.log("✓ Chuyển dữ liệu xong:");
console.log(`  - Khách hàng:      ${customers.length}`);
console.log(`  - Hợp đồng:        ${contracts.length}`);
console.log(`  - Đợt thanh toán:  ${installments.length}`);
console.log(`  - Tổng giá trị HĐ: ${totalContract.toLocaleString("vi-VN")} đ`);
console.log(`  - Tổng các đợt:    ${totalValue.toLocaleString("vi-VN")} đ`);
console.log(`  - Đã thu:          ${totalPaid.toLocaleString("vi-VN")} đ`);
console.log(`  - Còn phải thu:    ${(totalValue - totalPaid).toLocaleString("vi-VN")} đ`);
