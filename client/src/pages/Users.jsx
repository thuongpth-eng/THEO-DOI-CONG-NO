import { Shield, ShieldCheck, Pencil, Eye } from "lucide-react";
import { DEMO_USERS, ROLES } from "../lib/roles";
import { authBackend } from "../lib/auth";

function RoleBadge({ role }) {
  const r = ROLES[role];
  const admin = r?.admin;
  const edit = r?.canEdit;
  const Icon = admin ? ShieldCheck : edit ? Pencil : Eye;
  const tone = admin
    ? "bg-brand-50 text-brand-700"
    : edit
    ? "bg-emerald-50 text-emerald-700"
    : "bg-slate-100 text-slate-500";
  return (
    <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${tone}`}>
      <Icon size={12} /> {r?.name || role}
    </span>
  );
}

export default function Users() {
  return (
    <div>
      {authBackend !== "firestore" && (
        <div className="mb-5 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-500">
          <Shield size={16} className="text-brand-500" />
          Danh sách <b className="mx-1">tài khoản demo (local)</b>. Khi dùng Firebase
          thật, danh sách này lấy từ Firebase Authentication + collection <code>users</code>.
        </div>
      )}

      {/* Bảng người dùng */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-card">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-800">Người dùng &amp; vai trò</h2>
          <p className="text-xs text-slate-400">{DEMO_USERS.length} tài khoản</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wider text-slate-400">
                <th className="px-5 py-3 font-medium">Họ tên</th>
                <th className="px-5 py-3 font-medium">Tên đăng nhập</th>
                <th className="px-5 py-3 font-medium">Vai trò</th>
                <th className="px-5 py-3 font-medium">Quyền</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_USERS.map((u) => (
                <tr key={u.username} className="border-b border-slate-50 last:border-0">
                  <td className="px-5 py-3 font-semibold text-slate-800">{u.name}</td>
                  <td className="px-5 py-3 text-slate-500">{u.username}</td>
                  <td className="px-5 py-3">
                    <RoleBadge role={u.role} />
                  </td>
                  <td className="px-5 py-3 text-slate-500">
                    {ROLES[u.role]?.canEdit ? "Nhập & sửa dữ liệu" : "Chỉ xem"}
                    {ROLES[u.role]?.admin && " · Quản trị"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Giải thích vai trò */}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Object.values(ROLES).map((r) => (
          <div key={r.key} className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
            <div className="text-sm font-semibold text-slate-800">{r.name}</div>
            <div className="mt-1 text-xs text-slate-500">
              {r.admin ? "Quản trị · " : ""}
              {r.canEdit ? "Được nhập & sửa dữ liệu công nợ" : "Chỉ xem báo cáo, không sửa"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
