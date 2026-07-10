import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Overview from "./pages/Overview";
import Contracts from "./pages/Contracts";
import ContractDetail from "./pages/ContractDetail";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Login from "./pages/Login";
import { useAuth } from "./context/AuthContext";

function todayVN() {
  const days = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
  const d = new Date();
  return `${days[d.getDay()]}, ${d.getDate()} tháng ${d.getMonth() + 1}, ${d.getFullYear()}`;
}

function Placeholder({ title }) {
  return (
    <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/50 text-slate-400">
      Trang “{title}” sẽ được xây ở giai đoạn tiếp theo.
    </div>
  );
}

const TITLES = [
  { re: /^\/$/, title: "Tổng quan" },
  { re: /^\/contracts\/.+/, title: "Chi tiết công trình" },
  { re: /^\/contracts$/, title: "Hợp đồng & công nợ" },
  { re: /^\/dashboard/, title: "Dashboard dòng tiền" },
  { re: /^\/history/, title: "Lịch sử thay đổi" },
  { re: /^\/users/, title: "Người dùng" },
];

// Chỉ cho admin (TGĐ/PTGĐ) vào trang quản trị
function AdminOnly({ children }) {
  const { isAdmin } = useAuth();
  return isAdmin ? children : <Navigate to="/" replace />;
}

export default function App() {
  const { user, ready } = useAuth();
  const { pathname } = useLocation();

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f7f8fa] text-slate-400">
        Đang tải…
      </div>
    );
  }

  // Chưa đăng nhập → trang Login
  if (!user) return <Login />;

  const isHome = pathname === "/";
  const title = TITLES.find((t) => t.re.test(pathname))?.title || "HPC Receivable";

  return (
    <div className="flex h-screen bg-[#f7f8fa]">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="px-8 py-6">
          {isHome ? (
            <>
              <h1 className="text-2xl font-bold text-slate-800">
                Xin chào, {user.name} 👋
              </h1>
              <p className="mt-1 text-sm text-slate-400">{todayVN()}</p>
            </>
          ) : (
            <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
          )}
        </header>

        <main className="flex-1 overflow-y-auto px-8 pb-10">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/contracts" element={<Contracts />} />
            <Route path="/contracts/:id" element={<ContractDetail />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/history" element={<Placeholder title="Lịch sử thay đổi" />} />
            <Route
              path="/users"
              element={
                <AdminOnly>
                  <Users />
                </AdminOnly>
              }
            />
          </Routes>
        </main>
      </div>
    </div>
  );
}
