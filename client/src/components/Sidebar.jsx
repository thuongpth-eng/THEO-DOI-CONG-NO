import { NavLink } from "react-router-dom";
import {
  Link2,
  FileText,
  Users,
  LogOut,
  ArrowLeft,
  Wallet,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Logo from "./Logo";

const NAV = [
  { to: "/", label: "Theo dõi công nợ", icon: Wallet, end: true },
  { to: "/contracts", label: "Kho lưu trữ hợp đồng thi công", icon: FileText },
  { to: "/links", label: "Mã liên kết", icon: Link2 },
];

const ADMIN = [{ to: "/users", label: "Người dùng", icon: Users }];

const PORTAL_URL = import.meta.env.VITE_PORTAL_URL || "#";

function Item({ to, label, icon: Icon, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `group relative flex min-h-[46px] w-full items-center gap-3 overflow-hidden rounded-xl py-2.5 pl-3 pr-2 text-[13.5px] font-semibold leading-snug transition-all ${
          isActive
            ? "bg-brand-500 text-white shadow-md shadow-brand-500/25"
            : "text-navdim hover:bg-navhover hover:text-navfg"
        }`
      }
    >
      {({ isActive }) => (
        <>
          {/* Vạch sáng đánh dấu mục đang mở */}
          {isActive && (
            <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-white/90" />
          )}
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
              isActive ? "bg-white/20 text-white" : "bg-white/5 text-navdim group-hover:text-navfg"
            }`}
          >
            <Icon size={17} />
          </span>
          <span className="min-w-0">{label}</span>
        </>
      )}
    </NavLink>
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
        <div className="px-4 py-4">
          <div className="flex items-center justify-center rounded-xl bg-white px-3 py-3 shadow-sm">
            <Logo size={54} />
          </div>
          <div className="mt-2 text-center text-sm font-bold uppercase leading-snug tracking-wide text-navfg">
            Kiểm soát hợp đồng<br />chủ đầu tư
          </div>
        </div>

        <a
          href={PORTAL_URL}
          className="mx-3 mb-3 flex min-h-[40px] items-center justify-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-[11.5px] font-semibold uppercase tracking-wide text-navdim transition-colors hover:border-white/30 hover:bg-navhover hover:text-navfg"
        >
          <ArrowLeft size={14} />
          Về HP CONS Portal
        </a>

        <nav className="flex-1 space-y-1.5 overflow-y-auto px-2.5">
          <div className="px-1.5 pb-1 text-[10.5px] font-bold uppercase tracking-wider text-navdim/70">
            Chức năng
          </div>
          {NAV.map((item) => (
            <Item key={item.to} {...item} />
          ))}
          {isAdmin && (
            <>
              <div className="mt-4 border-t border-white/10 px-1.5 pb-1 pt-4 text-[10.5px] font-bold uppercase tracking-wider text-navdim/70">
                Quản trị
              </div>
              {ADMIN.map((item) => (
                <Item key={item.to} {...item} />
              ))}
            </>
          )}
        </nav>

        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 px-2.5 py-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">
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
            className="mt-2 flex min-h-[42px] w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-navdim transition-colors hover:bg-danger/15 hover:text-danger"
          >
            <LogOut size={17} />
            Đăng xuất
          </button>
        </div>
      </aside>
    </>
  );
}
