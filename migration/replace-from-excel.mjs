// ============================================================
// THAY THẾ dữ liệu Firestore bằng dữ liệu đã đọc từ file Excel Sếp gửi.
// Quy trình an toàn: SAO LƯU hiện tại → XÓA → NẠP mới.
//   node replace-from-excel.mjs
// ============================================================
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const __dir = dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(readFileSync(join(__dir, "parsed-from-excel.json"), "utf8"));
const svc = JSON.parse(readFileSync(join(__dir, "serviceAccount.json"), "utf8"));

initializeApp({ credential: cert(svc) });
const db = getFirestore();
const COLS = ["customers", "contracts", "installments"];

// 1) SAO LƯU
const backup = {};
for (const name of COLS) {
  const snap = await db.collection(name).get();
  backup[name] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
const p = (n) => String(n).padStart(2, "0");
const now = new Date();
const stamp = `${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}-${p(now.getHours())}${p(now.getMinutes())}`;
const backupFile = join(__dir, `backup-${stamp}.json`);
writeFileSync(backupFile, JSON.stringify(backup, null, 2), "utf8");
console.log(`✓ SAO LƯU → ${backupFile}`);
console.log(`  hiện có: ${backup.customers.length} KH · ${backup.contracts.length} HĐ · ${backup.installments.length} đợt`);

// 2) XÓA sạch 3 collection
for (const name of COLS) {
  const snap = await db.collection(name).get();
  let batch = db.batch();
  let n = 0;
  for (const d of snap.docs) {
    batch.delete(d.ref);
    if (++n % 400 === 0) { await batch.commit(); batch = db.batch(); }
  }
  await batch.commit();
  console.log(`  ✓ đã xóa ${name}: ${snap.size}`);
}

// 3) NẠP dữ liệu mới
async function put(name, items) {
  let batch = db.batch();
  let n = 0;
  for (const item of items) {
    const { id, ...rest } = item;
    batch.set(db.collection(name).doc(id), rest);
    if (++n % 400 === 0) { await batch.commit(); batch = db.batch(); }
  }
  await batch.commit();
  console.log(`  ✓ nạp ${name}: ${items.length}`);
}
await put("customers", data.customers);
await put("contracts", data.contracts);
await put("installments", data.installments);
console.log("✓ HOÀN TẤT — Firestore đã cập nhật theo file Excel.");
