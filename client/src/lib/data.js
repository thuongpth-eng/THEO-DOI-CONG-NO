// Lớp truy cập dữ liệu — 1 API dùng chung, 2 chế độ backend:
//   - "local":    đọc seed.json + lưu chỉnh sửa vào localStorage (chạy thử ở máy, không cần Firebase)
//   - "firestore": đọc/ghi thẳng Firebase Firestore (production, IT cấu hình)
// Chọn chế độ qua biến môi trường VITE_DATA_BACKEND (mặc định "local").
import seed from "../data/seed.json";

const BACKEND = import.meta.env.VITE_DATA_BACKEND || "local";
const LS_KEY = "hpc_receivable_data_v1";

/* ===================== BACKEND LOCAL ===================== */
function loadLocal() {
  const cached = localStorage.getItem(LS_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      /* rơi xuống seed */
    }
  }
  const fresh = {
    customers: structuredClone(seed.customers),
    contracts: structuredClone(seed.contracts),
    installments: structuredClone(seed.installments),
  };
  localStorage.setItem(LS_KEY, JSON.stringify(fresh));
  return fresh;
}

function saveLocal(store) {
  localStorage.setItem(LS_KEY, JSON.stringify(store));
}

const genId = (prefix) =>
  `${prefix}_${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;

const localApi = {
  async listCustomers() {
    return loadLocal().customers;
  },
  async listContracts() {
    return loadLocal().contracts.sort((a, b) => (a.order || 0) - (b.order || 0));
  },
  async addCustomer(c) {
    const store = loadLocal();
    const item = { ...c, id: c.id || genId("cus") };
    if (!store.customers.some((x) => x.id === item.id)) store.customers.push(item);
    saveLocal(store);
    return item;
  },
  async listInstallments() {
    return loadLocal().installments;
  },
  async addContract(c) {
    const store = loadLocal();
    const item = { ...c, id: c.id || genId("ct") };
    store.contracts.push(item);
    saveLocal(store);
    return item;
  },
  async updateContract(id, patch) {
    const store = loadLocal();
    const i = store.contracts.findIndex((x) => x.id === id);
    if (i >= 0) store.contracts[i] = { ...store.contracts[i], ...patch };
    saveLocal(store);
    return store.contracts[i];
  },
  async deleteContract(id) {
    const store = loadLocal();
    store.contracts = store.contracts.filter((x) => x.id !== id);
    store.installments = store.installments.filter((x) => x.contractId !== id);
    saveLocal(store);
  },
  async addInstallment(r) {
    const store = loadLocal();
    const item = { ...r, id: r.id || genId("inst") };
    store.installments.push(item);
    saveLocal(store);
    return item;
  },
  async updateInstallment(id, patch) {
    const store = loadLocal();
    const i = store.installments.findIndex((x) => x.id === id);
    if (i >= 0) store.installments[i] = { ...store.installments[i], ...patch };
    saveLocal(store);
    return store.installments[i];
  },
  async deleteInstallment(id) {
    const store = loadLocal();
    store.installments = store.installments.filter((x) => x.id !== id);
    saveLocal(store);
  },
  async resetToSeed() {
    localStorage.removeItem(LS_KEY);
    return loadLocal();
  },
};

/* =================== BACKEND FIRESTORE =================== */
// Các hàm Firestore chỉ nạp thư viện khi thực sự dùng (tránh nặng khi chạy local).
async function fs() {
  const { getFb } = await import("./firebase");
  const fsdk = await import("firebase/firestore");
  return { db: getFb().db, ...fsdk };
}

const firestoreApi = {
  async listCustomers() {
    const { db, collection, getDocs } = await fs();
    const snap = await getDocs(collection(db, "customers"));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },
  async listContracts() {
    const { db, collection, getDocs, query, orderBy } = await fs();
    const snap = await getDocs(query(collection(db, "contracts"), orderBy("order")));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },
  async addCustomer(c) {
    const { db, doc, setDoc, collection, addDoc } = await fs();
    if (c.id) {
      await setDoc(doc(db, "customers", c.id), { name: c.name });
      return c;
    }
    const ref = await addDoc(collection(db, "customers"), { name: c.name });
    return { ...c, id: ref.id };
  },
  async listInstallments() {
    const { db, collection, getDocs } = await fs();
    const snap = await getDocs(collection(db, "installments"));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },
  async addContract(c) {
    const { db, collection, addDoc, doc, setDoc } = await fs();
    if (c.id) {
      await setDoc(doc(db, "contracts", c.id), c);
      return c;
    }
    const ref = await addDoc(collection(db, "contracts"), c);
    return { ...c, id: ref.id };
  },
  async updateContract(id, patch) {
    const { db, doc, updateDoc } = await fs();
    await updateDoc(doc(db, "contracts", id), patch);
    return { id, ...patch };
  },
  async deleteContract(id) {
    const { db, doc, deleteDoc, collection, getDocs, query, where } = await fs();
    await deleteDoc(doc(db, "contracts", id));
    const snap = await getDocs(
      query(collection(db, "installments"), where("contractId", "==", id))
    );
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
  },
  async addInstallment(r) {
    const { db, collection, addDoc, doc, setDoc } = await fs();
    if (r.id) {
      await setDoc(doc(db, "installments", r.id), r);
      return r;
    }
    const ref = await addDoc(collection(db, "installments"), r);
    return { ...r, id: ref.id };
  },
  async updateInstallment(id, patch) {
    const { db, doc, updateDoc } = await fs();
    await updateDoc(doc(db, "installments", id), patch);
    return { id, ...patch };
  },
  async deleteInstallment(id) {
    const { db, doc, deleteDoc } = await fs();
    await deleteDoc(doc(db, "installments", id));
  },
  async resetToSeed() {
    throw new Error("resetToSeed chỉ dùng ở chế độ local.");
  },
};

/* ======================= XUẤT RA ======================== */
export const backendName = BACKEND;
const api = BACKEND === "firestore" ? firestoreApi : localApi;
export default api;
