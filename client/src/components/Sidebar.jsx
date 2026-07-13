import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  History,
  Users,
  LogOut,
  ArrowLeft,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import Logo from "./Logo";

const NAV = [
  { to: "/", label: "Theo dõi công nợ", icon: LayoutDashboard, end: true },
  { to: "/contracts", label: "Kho lưu trữ hợp đồng thi công", icon: FileText },
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
        `flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
          isActive
            ? "bg-brand-500 text-white"
            : "text-navdim hover:bg-navhover hover:text-navfg"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={20} className={isActive ? "text-white" : "text-navdim"} />
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
    <div className="mb-2 flex gap-1 rounded-lg border border-white/10 p-1">
      {opts.map((o) => {
        const Icon = o.icon;
        const active = mode === o.key;
        return (
          <button
            key={o.key}
            onClick={() => setMode(o.key)}
            title={o.label}
            aria-label={o.label}
            className={`flex min-h-[36px] flex-1 items-center justify-center gap-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
              active ? "bg-navactivebg text-navactivefg" : "text-navdim hover:bg-navhover"
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
      {/* Nền mờ khi mở menu trên điện thoại/tablet */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 xl:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] shrink-0 flex-col bg-nav text-navfg transition-transform duration-200 xl:static xl:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white p-1">
            <Logo size={36} />
          </div>
          <div className="min-w-0 leading-snug">
            <div className="text-[12.5px] font-bold uppercase tracking-wide text-navfg">
              Kiểm soát hợp đồng chủ đầu tư
            </div>
            <div className="text-[11px] text-navdim">HP CONS</div>
          </div>
        </div>

        <a
          href={PORTAL_URL}
          className="mx-3 mb-2 flex min-h-[44px] items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-navdim hover:bg-navhover hover:text-navfg"
        >
          <ArrowLeft size={14} />
          Về HP CONS Portal
        </a>

        <nav className="flex-1 space-y-1 overflow-y-auto px-2">
          {NAV.map((item) => (
            <Item key={item.to} {...item} />
          ))}
          {isAdmin && (
            <>
              <div className="px-3 pb-1 pt-5 text-[11px] font-semibold uppercase tracking-wider text-navdim">
                Quản trị
              </div>
              {ADMIN.map((item) => (
                <Item key={item.to} {...item} />
              ))}
            </>
          )}
        </nav>

        <div className="border-t border-white/10 p-3">
          <ThemeToggle />
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">
              {(user?.name || "?").charAt(0)}
            </div>
            <div className="min-w-0 leading-tight">
              <div className="truncate text-sm font-semibold text-navfg">
                {user?.name || "Người dùng"}
              </div>
              <div className="text-[11px] text-navdim">{roleName}</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="mt-1 flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-navdim hover:bg-navhover hover:text-red-400"
          >
            <LogOut size={18} />
            Đăng xuất
          </button>
        </div>
      </aside>
    </>
  );
}
