import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Wallet,
  FolderOpen,
  TrendingUp,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  ArrowLeft,
  FileBarChart2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Logo from "./Logo";

// Menu theo mockup Dashboard (mục chưa có trang thật → "Sắp ra mắt")
const NAV = [
  { to: "/", label: "Tổng quan", icon: LayoutDashboard, end: true },
  { to: "/tracking", label: "Công nợ chi tiết", icon: Wallet },
  { to: "/contracts", label: "Hồ sơ thanh toán", icon: FolderOpen },
  { to: "/cashflow", label: "Dòng tiền", icon: TrendingUp, soon: true },
  { to: "/reports", label: "Báo cáo", icon: BarChart3, soon: true },
  { to: "/alerts", label: "Cảnh báo", icon: Bell, soon: true },
  { to: "/settings", label: "Thiết lập", icon: Settings },
];

const PORTAL_URL = import.meta.env.VITE_PORTAL_URL || "#";

function Item({ to, label, icon: Icon, end, soon }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-semibold uppercase tracking-wide leading-tight transition-colors ${
          isActive ? "bg-accent text-white" : "text-navdim hover:bg-navhover hover:text-navfg"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={20} className={isActive ? "text-white" : "text-navdim"} />
          <span className="flex-1">{label}</span>
          {soon && (
            <span className="rounded-full bg-warning/20 px-1.5 py-0.5 text-[9px] font-bold normal-case tracking-normal text-warning">
              Sắp ra mắt
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar({ open = false, onClose }) {
  const { user, roleName, logout } = useAuth();

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/50 xl:hidden" onClick={onClose} />}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] shrink-0 flex-col bg-nav text-navfg transition-transform duration-200 xl:static xl:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-4 py-4">
          <div className="flex items-center justify-center rounded-xl bg-white px-3 py-3 shadow-sm">
            <Logo size={54} />
          </div>
          <div className="mt-2 text-center text-[11px] font-semibold uppercase tracking-wide text-navdim">
            Xây dựng giá trị · Dựng tương lai
          </div>
        </div>

        <a
          href={PORTAL_URL}
          className="mx-3 mb-2 flex min-h-[40px] items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wide text-navdim hover:bg-navhover hover:text-navfg"
        >
          <ArrowLeft size={14} />
          Về HP CONS Portal
        </a>

        <nav className="flex-1 space-y-1 overflow-y-auto px-2">
          {NAV.map((item) => (
            <Item key={item.to} {...item} />
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <NavLink
            to="/"
            className="mb-2 flex min-h-[40px] w-full items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-navfg hover:bg-navhover"
          >
            <FileBarChart2 size={15} /> Xuất báo cáo
          </NavLink>
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">
              {(user?.name || "?").charAt(0)}
            </div>
            <div className="min-w-0 leading-tight">
              <div className="truncate text-sm font-semibold text-navfg">{user?.name || "Người dùng"}</div>
              <div className="text-[11px] text-navdim">{roleName}</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="mt-1 flex min-h-[40px] w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-semibold uppercase tracking-wide text-navdim hover:bg-navhover hover:text-danger"
          >
            <LogOut size={18} />
            Đăng xuất
          </button>
        </div>
      </aside>
    </>
  );
}
