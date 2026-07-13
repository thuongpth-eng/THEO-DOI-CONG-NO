import { useState, useEffect } from "react";
import { Routes, Route, useLocation, Navigate, Link } from "react-router-dom";
import { Menu, Bell, Sun, Moon } from "lucide-react";
import Logo from "./components/Logo";
import Sidebar from "./components/Sidebar";
import Overview from "./pages/Overview";
import Contracts from "./pages/Contracts";
import ContractDetail from "./pages/ContractDetail";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Login from "./pages/Login";
import { useAuth } from "./context/AuthContext";
import { useTheme } from "./context/ThemeContext";

function todayVN() {
  const days = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
  const d = new Date();
  return `${days[d.getDay()]}, ${d.getDate()} tháng ${d.getMonth() + 1}, ${d.getFullYear()}`;
}

function Placeholder({ title }) {
  return (
    <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-line bg-card/50 text-faint">
      Trang “{title}” sẽ được xây ở giai đoạn tiếp theo.
    </div>
  );
}

const TITLES = [
  { re: /^\/$/, title: "Theo dõi công nợ" },
  { re: /^\/contracts\/.+/, title: "Chi tiết công trình" },
  { re: /^\/contracts$/, title: "Kho lưu trữ hợp đồng thi công" },
  { re: /^\/dashboard/, title: "Dashboard dòng tiền" },
  { re: /^\/history/, title: "Lịch sử thay đổi" },
  { re: /^\/users/, title: "Người dùng" },
];

function AdminOnly({ children }) {
  const { isAdmin } = useAuth();
  return isAdmin ? children : <Navigate to="/" replace />;
}

export default function App() {
  const { user, ready, roleName } = useAuth();
  const { isDark, setMode } = useTheme();
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
        {/* Thanh trên cho điện thoại + tablet (ẩn ở desktop ≥1200px) */}
        <div className="flex h-14 items-center gap-3 border-b border-line bg-card px-4 xl:hidden">
          <button
            onClick={() => setDrawer(true)}
            className="rounded-lg p-1.5 text-sub hover:bg-hover"
            aria-label="Mở menu"
          >
            <Menu size={22} />
          </button>
          <div className="flex min-w-0 items-center gap-2">
            <Logo size={26} />
            <span className="truncate text-[13px] font-bold uppercase text-ink">
              Kiểm soát hợp đồng chủ đầu tư
            </span>
          </div>
          {/* Avatar góc phải trên điện thoại */}
          <div className="ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">
            {(user.name || "?").charAt(0)}
          </div>
        </div>

        {/* Header 60px — desktop (≥1200px): Notification · Theme · Avatar, cách nhau 16px */}
        <header className="hidden h-[60px] shrink-0 items-center justify-between border-b border-line bg-card px-6 xl:flex">
          <p className="text-sm text-faint">{todayVN()}</p>
          <div className="flex items-center gap-4">
            <button
              className="relative flex h-10 w-10 items-center justify-center rounded-lg text-sub hover:bg-hover"
              aria-label="Thông báo"
              title="Thông báo"
            >
              <Bell size={20} />
            </button>
            <button
              onClick={() => setMode(isDark ? "light" : "dark")}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-sub hover:bg-hover"
              aria-label={isDark ? "Chuyển giao diện sáng" : "Chuyển giao diện tối"}
              title={isDark ? "Giao diện sáng" : "Giao diện tối"}
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">
                {(user.name || "?").charAt(0)}
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold text-ink">{user.name}</div>
                <div className="text-xs text-faint">{roleName}</div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 pb-10 xl:px-6">
          {/* Page Title 28px Bold — trang chủ & chi tiết công nợ là 2 tab cạnh nhau */}
          <div className="py-4 xl:py-6">
            {isHome || pathname === "/contracts" ? (
              <div className="flex flex-wrap items-end gap-6">
                <Link
                  to="/"
                  className={`border-b-4 pb-1 text-2xl font-bold xl:text-[28px] xl:leading-9 ${
                    isHome
                      ? "border-brand-500 text-ink"
                      : "border-transparent text-faint hover:text-ink"
                  }`}
                >
                  Dashboard tổng quan
                </Link>
                <Link
                  to="/contracts"
                  className={`border-b-4 pb-1 text-2xl font-bold xl:text-[28px] xl:leading-9 ${
                    pathname === "/contracts"
                      ? "border-brand-500 text-ink"
                      : "border-transparent text-faint hover:text-ink"
                  }`}
                >
                  Chi tiết công nợ
                </Link>
              </div>
            ) : (
              <h1 className="truncate text-2xl font-bold text-ink xl:text-[28px] xl:leading-9">
                {title}
              </h1>
            )}
            <p className="mt-1 text-sm text-faint xl:hidden">{todayVN()}</p>
          </div>
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
