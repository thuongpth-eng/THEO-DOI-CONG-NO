// Deploy Firestore rules trực tiếp qua Firebase Rules REST API (dùng service account).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { GoogleAuth } from "google-auth-library";

const __dir = dirname(fileURLToPath(import.meta.url));
const PROJECT = "theo-doi-cong-no-cdf6e";
const rulesSource = readFileSync(join(__dir, "..", "firestore.rules"), "utf8");

const auth = new GoogleAuth({
  keyFile: join(__dir, "serviceAccount.json"),
  scopes: ["https://www.googleapis.com/auth/cloud-platform"],
});
const client = await auth.getClient();
const token = (await client.getAccessToken()).token;
const H = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
const base = `https://firebaserules.googleapis.com/v1/projects/${PROJECT}`;

// 1) Tạo ruleset
const rs = await fetch(`${base}/rulesets`, {
  method: "POST",
  headers: H,
  body: JSON.stringify({
    source: { files: [{ name: "firestore.rules", content: rulesSource }] },
  }),
});
const rsData = await rs.json();
if (!rs.ok) {
  console.error("Lỗi tạo ruleset:", JSON.stringify(rsData, null, 2));
  process.exit(1);
}
console.log("✓ Đã tạo ruleset:", rsData.name);

// 2) Cập nhật release cloud.firestore trỏ tới ruleset mới
const relName = `projects/${PROJECT}/releases/cloud.firestore`;
let rel = await fetch(`https://firebaserules.googleapis.com/v1/${relName}`, {
  method: "PATCH",
  headers: H,
  body: JSON.stringify({ release: { name: relName, rulesetName: rsData.name } }),
});
if (rel.status === 404) {
  rel = await fetch(`${base}/releases`, {
    method: "POST",
    headers: H,
    body: JSON.stringify({ name: relName, rulesetName: rsData.name }),
  });
}
const relData = await rel.json();
if (!rel.ok) {
  console.error("Lỗi cập nhật release:", JSON.stringify(relData, null, 2));
  process.exit(1);
}
console.log("✓ Đã áp quy tắc mới cho Firestore. HOÀN TẤT!");
