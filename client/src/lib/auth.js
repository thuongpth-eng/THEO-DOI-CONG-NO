// Lớp đăng nhập — 2 chế độ:
//   - "local":    kiểm tra với danh sách tài khoản demo, lưu phiên vào localStorage
//   - "firebase": dùng Firebase Authentication (production, IT cấu hình)
// Chọn qua VITE_DATA_BACKEND (dùng chung với lớp dữ liệu).
import { DEMO_USERS, ROLES } from "./roles";

const BACKEND = import.meta.env.VITE_DATA_BACKEND || "local";
const LS_SESSION = "hpc_receivable_session";

/* ===================== LOCAL ===================== */
const localAuth = {
  async login(username, password) {
    const u = DEMO_USERS.find(
      (x) => x.username === username.trim().toLowerCase() && x.password === password
    );
    if (!u) throw new Error("Sai tên đăng nhập hoặc mật khẩu.");
    const session = { username: u.username, name: u.name, role: u.role };
    localStorage.setItem(LS_SESSION, JSON.stringify(session));
    return session;
  },
  async logout() {
    localStorage.removeItem(LS_SESSION);
  },
  current() {
    try {
      return JSON.parse(localStorage.getItem(LS_SESSION)) || null;
    } catch {
      return null;
    }
  },
  // Cho phép lắng nghe (local không đổi ngoài tab nên gọi callback 1 lần)
  onChange(cb) {
    cb(this.current());
    return () => {};
  },
};

/* ==================== FIREBASE ==================== */
// Vai trò lưu trong Firestore: users/{uid} = { name, role }.
const firebaseAuth = {
  async login(email, password) {
    const { getFb } = await import("./firebase");
    const { signInWithEmailAndPassword } = await import("firebase/auth");
    const { doc, getDoc } = await import("firebase/firestore");
    const { auth, db } = getFb();
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const snap = await getDoc(doc(db, "users", cred.user.uid));
    const data = snap.exists() ? snap.data() : {};
    return {
      uid: cred.user.uid,
      username: cred.user.email,
      name: data.name || cred.user.email,
      role: data.role || "kd",
    };
  },
  async logout() {
    const { getFb } = await import("./firebase");
    const { signOut } = await import("firebase/auth");
    await signOut(getFb().auth);
  },
  current() {
    return null; // Firebase lấy qua onChange
  },
  onChange(cb) {
    let unsub = () => {};
    (async () => {
      const { getFb } = await import("./firebase");
      const { onAuthStateChanged } = await import("firebase/auth");
      const { doc, getDoc } = await import("firebase/firestore");
      const { auth, db } = getFb();
      unsub = onAuthStateChanged(auth, async (user) => {
        if (!user) return cb(null);
        const snap = await getDoc(doc(db, "users", user.uid));
        const data = snap.exists() ? snap.data() : {};
        cb({
          uid: user.uid,
          username: user.email,
          name: data.name || user.email,
          role: data.role || "kd",
        });
      });
    })();
    return () => unsub();
  },
};

export const authBackend = BACKEND;
export { ROLES };
export default BACKEND === "firestore" ? firebaseAuth : localAuth;
