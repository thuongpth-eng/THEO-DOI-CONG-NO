// Tạo tài khoản đăng nhập trên Firebase (Auth + vai trò trong users/{uid}).
// Chạy: node create-users.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const __dir = dirname(fileURLToPath(import.meta.url));
const svc = JSON.parse(readFileSync(join(__dir, "serviceAccount.json"), "utf8"));
initializeApp({ credential: cert(svc) });
const auth = getAuth();
const db = getFirestore();

// Danh sách tài khoản ban đầu. Mật khẩu chung: hpcons2026 (đổi sau khi đăng nhập).
const PASSWORD = "hpcons2026";
const USERS = [
  { email: "thuongpth@hpcons.com.vn", name: "Phạm Thị Hồng Thương", role: "kt" },
  { email: "tgd@hpcons.com.vn", name: "Tổng Giám đốc", role: "tgd" },
  { email: "ptgd@hpcons.com.vn", name: "Phó Tổng Giám đốc", role: "ptgd" },
  { email: "pm@hpcons.com.vn", name: "Trưởng phòng Dự án", role: "pm" },
  { email: "kd@hpcons.com.vn", name: "Phòng Kinh doanh", role: "kd" },
];

for (const u of USERS) {
  try {
    let uid;
    try {
      const existing = await auth.getUserByEmail(u.email);
      uid = existing.uid;
      await auth.updateUser(uid, { password: PASSWORD, displayName: u.name });
      console.log(`  ↻ Cập nhật: ${u.email}`);
    } catch {
      const created = await auth.createUser({
        email: u.email,
        password: PASSWORD,
        displayName: u.name,
      });
      uid = created.uid;
      console.log(`  ✓ Tạo mới: ${u.email}`);
    }
    await db.collection("users").doc(uid).set({ name: u.name, role: u.role });
  } catch (e) {
    console.log(`  ✗ Lỗi ${u.email}: ${e.message}`);
  }
}
console.log(`\n✓ HOÀN TẤT. Mật khẩu chung: ${PASSWORD}`);
