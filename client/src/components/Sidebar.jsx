import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  History,
  Users,
  LogOut,
  ArrowLeft,
  Wallet,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const NAV = [
  { to: "/", label: "Tổng quan", icon: LayoutDashboard, end: true },
  { to: "/contracts", label: "Hợp đồng & công nợ", icon: FileText },
  { to: "/dashboard", label: "Dashboard dòng tiền", icon: BarChart3 },
  { to: "/history", label: "Lịch sử thay đổi", icon: History },
];

const ADMIN = [{ to: "/users", label: "Người dùng", icon: Users }];

const PORTAL_URL = import.meta.env.VITE_PORTAL_URL || "#";

function Item({ to, label, icon: Icon, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
          isActive
            ? "bg-brand-50 text-brand-700"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={18} className={isActive ? "text-brand-600" : "text-slate-400"} />
          {label}
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar() {
  const { user, roleName, isAdmin, logout } = useAuth();

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm">
          <Wallet size={18} />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-bold text-slate-800">HPC Receivable</div>
          <div className="text-[11px] text-slate-400">Công nợ &amp; dòng tiền</div>
        </div>
      </div>

      <a
        href={PORTAL_URL}
        className="mx-3 mb-2 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-brand-600"
      >
        <ArrowLeft size={14} />
        Về HP CONS Portal
      </a>

      <nav className="flex-1 space-y-1 px-3">
        {NAV.map((item) => (
          <Item key={item.to} {...item} />
        ))}
        {isAdmin && (
          <>
            <div className="px-3 pb-1 pt-5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Quản trị
            </div>
            {ADMIN.map((item) => (
              <Item key={item.to} {...item} />
            ))}
          </>
        )}
      </nav>

      <div className="border-t border-slate-100 p-3">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
            {(user?.name || "?").charAt(0)}
          </div>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-sm font-semibold text-slate-800">
              {user?.name || "Người dùng"}
            </div>
            <div className="text-[11px] text-slate-400">{roleName}</div>
          </div>
        </div>
        <button
          onClick={logout}
          className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={18} className="text-slate-400" />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
