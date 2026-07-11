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
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

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
            ? "bg-brandtint text-brandink"
            : "text-sub hover:bg-hover hover:text-ink"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={18} className={isActive ? "text-brandink" : "text-faint"} />
          {label}
        </>
      )}
    </NavLink>
  );
}

function ThemeToggle() {
  const { mode, setMode } = useTheme();
  const opts = [
    { key: "light", icon: Sun, label: "Sáng" },
    { key: "dark", icon: Moon, label: "Tối" },
    { key: "system", icon: Monitor, label: "Tự động" },
  ];
  return (
    <div className="mb-2 flex gap-1 rounded-lg border border-line p-1">
      {opts.map((o) => {
        const Icon = o.icon;
        const active = mode === o.key;
        return (
          <button
            key={o.key}
            onClick={() => setMode(o.key)}
            title={o.label}
            className={`flex flex-1 items-center justify-center gap-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
              active ? "bg-brandtint text-brandink" : "text-faint hover:bg-hover"
            }`}
          >
            <Icon size={14} />
          </button>
        );
      })}
    </div>
  );
}

export default function Sidebar({ open = false, onClose }) {
  const { user, roleName, isAdmin, logout } = useAuth();

  return (
    <>
      {/* Nền mờ khi mở menu trên điện thoại */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-line bg-card transition-transform duration-200 lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm">
            <Wallet size={18} />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold text-ink">HPC Receivable</div>
            <div className="text-[11px] text-faint">Công nợ &amp; dòng tiền</div>
          </div>
        </div>

        <a
          href={PORTAL_URL}
          className="mx-3 mb-2 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-sub hover:bg-hover hover:text-brandink"
        >
          <ArrowLeft size={14} />
          Về HP CONS Portal
        </a>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          {NAV.map((item) => (
            <Item key={item.to} {...item} />
          ))}
          {isAdmin && (
            <>
              <div className="px-3 pb-1 pt-5 text-[11px] font-semibold uppercase tracking-wider text-faint">
                Quản trị
              </div>
              {ADMIN.map((item) => (
                <Item key={item.to} {...item} />
              ))}
            </>
          )}
        </nav>

        <div className="border-t border-line p-3">
          <ThemeToggle />
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brandtint text-sm font-bold text-brandink">
              {(user?.name || "?").charAt(0)}
            </div>
            <div className="min-w-0 leading-tight">
              <div className="truncate text-sm font-semibold text-ink">
                {user?.name || "Người dùng"}
              </div>
              <div className="text-[11px] text-faint">{roleName}</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sub hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
          >
            <LogOut size={18} className="text-faint" />
            Đăng xuất
          </button>
        </div>
      </aside>
    </>
  );
}
