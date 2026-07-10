// ============================================================
// SCRIPT NẠP DỮ LIỆU VÀO FIREBASE FIRESTORE (dành cho IT)
// ============================================================
// Nạp seed.json (đã chuyển từ file v31) vào Firestore thật.
// Chạy 1 lần duy nhất khi khởi tạo dữ liệu ban đầu.
//
// CHUẨN BỊ:
//   1. npm install firebase-admin
//   2. Tải "service account key" JSON từ:
//      Firebase Console > Project settings > Service accounts > Generate new private key
//      Lưu thành file: serviceAccount.json (cùng thư mục này)
//
// CHẠY:
//   node import-to-firestore.mjs
// ============================================================
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const __dir = dirname(fileURLToPath(import.meta.url));
const seed = JSON.parse(readFileSync(join(__dir, "seed.json"), "utf8"));
const svc = JSON.parse(readFileSync(join(__dir, "serviceAccount.json"), "utf8"));

initializeApp({ credential: cert(svc) });
const db = getFirestore();

async function importCollection(name, items) {
  let batch = db.batch();
  let n = 0;
  for (const item of items) {
    const { id, ...data } = item;
    batch.set(db.collection(name).doc(id), data);
    if (++n % 400 === 0) {
      await batch.commit();
      batch = db.batch();
    }
  }
  await batch.commit();
  console.log(`  ✓ ${name}: ${items.length} bản ghi`);
}

console.log("Đang nạp dữ liệu vào Firestore...");
await importCollection("customers", seed.customers);
await importCollection("contracts", seed.contracts);
await importCollection("installments", seed.installments);
console.log("✓ HOÀN TẤT. Dữ liệu đã lên Firestore.");
