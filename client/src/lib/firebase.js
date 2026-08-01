// Khởi tạo Firebase — chỉ chạy khi backend = "firestore".
// IT điền các khóa này qua biến môi trường (file .env), KHÔNG hard-code.
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { initializeAuth, browserSessionPersistence, getAuth } from "firebase/auth";

const config = {
  apiKey: import.meta.env.VITE_FB_API_KEY,
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FB_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FB_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FB_SENDER_ID,
  appId: import.meta.env.VITE_FB_APP_ID,
};

let _db = null;
let _auth = null;

export function getFb() {
  if (!_db) {
    if (!config.projectId) {
      throw new Error(
        "Chưa cấu hình Firebase. IT cần điền các biến VITE_FB_* trong file .env"
      );
    }
    const app = initializeApp(config);
    _db = getFirestore(app);
    // Phiên đăng nhập chỉ sống trong tab đang mở: đóng tab/trình duyệt là phải
    // đăng nhập lại (mặc định của Firebase là lưu vĩnh viễn — ai mở máy cũng vào được).
    try {
      _auth = initializeAuth(app, { persistence: browserSessionPersistence });
    } catch {
      _auth = getAuth(app);
    }
  }
  return { db: _db, auth: _auth };
}
