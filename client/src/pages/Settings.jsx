import { Link } from "react-router-dom";
import { Link2, History, Users, ChevronRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Settings() {
  const { isAdmin } = useAuth();
  const items = [
    { to: "/links", label: "Mã liên kết", desc: "Liên kết hồ sơ / Drive cho công trình", icon: Link2 },
    { to: "/history", label: "Lịch sử thay đổi", desc: "Nhật ký chỉnh sửa dữ liệu công nợ", icon: History },
  ];
  if (isAdmin) items.push({ to: "/users", label: "Người dùng & phân quyền", desc: "Quản lý tài khoản, vai trò", icon: Users });

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((it) => (
        <Link
          key={it.to}
          to={it.to}
          className="flex items-center gap-3 rounded-xl border border-line bg-card p-4 shadow-card transition-colors hover:border-brand-400"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-500/10 text-brand-500">
            <it.icon size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-ink">{it.label}</div>
            <div className="text-xs text-faint">{it.desc}</div>
          </div>
          <ChevronRight size={18} className="text-faint" />
        </Link>
      ))}
    </div>
  );
}
