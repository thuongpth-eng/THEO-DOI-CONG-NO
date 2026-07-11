import { useState, useEffect } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Menu, Wallet } from "lucide-react";
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
    <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-line bg-card/50 text-faint">
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

function AdminOnly({ children }) {
  const { isAdmin } = useAuth();
  return isAdmin ? children : <Navigate to="/" replace />;
}

export default function App() {
  const { user, ready } = useAuth();
  const { pathname } = useLocation();
  const [drawer, setDrawer] = useState(false);

  // Đóng menu điện thoại mỗi khi chuyển trang
  useEffect(() => {
    setDrawer(false);
  }, [pathname]);

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-page text-faint">
        Đang tải…
      </div>
    );
  }

  if (!user) return <Login />;

  const isHome = pathname === "/";
  const title = TITLES.find((t) => t.re.test(pathname))?.title || "HPC Receivable";

  return (
    <div className="flex h-screen bg-page">
      <Sidebar open={drawer} onClose={() => setDrawer(false)} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Thanh trên cho điện thoại (ẩn ở màn lớn) */}
        <div className="flex items-center gap-3 border-b border-line bg-card px-4 py-3 lg:hidden">
          <button
            onClick={() => setDrawer(true)}
            className="rounded-lg p-1.5 text-sub hover:bg-hover"
            aria-label="Mở menu"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white">
              <Wallet size={15} />
            </div>
            <span className="text-sm font-bold text-ink">HPC Receivable</span>
          </div>
        </div>

        <header className="px-5 py-5 sm:px-8 sm:py-6">
          {isHome ? (
            <>
              <h1 className="text-xl font-bold text-ink sm:text-2xl">
                Xin chào, {user.name} 👋
              </h1>
              <p className="mt-1 text-sm text-faint">{todayVN()}</p>
            </>
          ) : (
            <h1 className="text-xl font-bold text-ink sm:text-2xl">{title}</h1>
          )}
        </header>

        <main className="flex-1 overflow-y-auto px-5 pb-10 sm:px-8">
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
