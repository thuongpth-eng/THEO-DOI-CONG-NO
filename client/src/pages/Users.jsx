import { Shield, ShieldCheck, Pencil, Eye } from "lucide-react";
import { DEMO_USERS, ROLES } from "../lib/roles";
import { authBackend } from "../lib/auth";

const isCloud = authBackend === "firestore";

function RoleBadge({ role }) {
  const r = ROLES[role];
  const admin = r?.admin;
  const edit = r?.canEdit;
  const Icon = admin ? ShieldCheck : edit ? Pencil : Eye;
  const tone = admin
    ? "bg-accent text-white"
    : edit
    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
    : "bg-muted text-white";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${tone}`}>
      <Icon size={12} /> {r?.name || role}
    </span>
  );
}

export default function Users() {
  return (
    <div>
      <div className="mb-5 flex items-center gap-2 rounded-lg border border-line bg-card px-4 py-2.5 text-sm text-sub">
        <Shield size={16} className="text-brand-500" />
        {isCloud ? (
          <span>
            Thêm/sửa tài khoản nhân viên trong <b>Firebase Console → Authentication</b>,
            rồi đặt vai trò ở collection <code>users</code>. Dưới đây là ý nghĩa 5 vai trò.
          </span>
        ) : (
          <span>
            Danh sách <b>tài khoản demo (local)</b>. Khi dùng Firebase thật, quản lý
            trong Firebase Authentication + collection <code>users</code>.
          </span>
        )}
      </div>

      {/* Bảng người dùng (chỉ bản thử local) */}
      {!isCloud && (
        <div className="rounded-xl border border-line bg-card shadow-card">
          <div className="border-b border-line px-5 py-4">
            <h2 className="text-base font-semibold text-ink">Người dùng &amp; vai trò</h2>
            <p className="text-xs text-faint">{DEMO_USERS.length} tài khoản</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="h-12 border-b border-line text-left text-xs uppercase tracking-wider text-faint">
                  <th className="px-3 py-3 font-medium">Họ tên</th>
                  <th className="px-3 py-3 font-medium">Tên đăng nhập</th>
                  <th className="px-3 py-3 font-medium">Vai trò</th>
                  <th className="px-3 py-3 font-medium">Quyền</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_USERS.map((u) => (
                  <tr key={u.username} className="border-b border-line/60 last:border-0">
                    <td className="px-3 py-3 font-semibold text-ink">{u.name}</td>
                    <td className="px-3 py-3 text-sub">{u.username}</td>
                    <td className="px-3 py-3">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-3 py-3 text-sub">
                      {ROLES[u.role]?.canEdit ? "Nhập & sửa dữ liệu" : "Chỉ xem"}
                      {ROLES[u.role]?.admin && " · Quản trị"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Giải thích vai trò */}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Object.values(ROLES).map((r) => (
          <div key={r.key} className="rounded-xl border border-line bg-card p-4 shadow-card">
            <div className="flex items-center gap-2">
              <RoleBadge role={r.key} />
            </div>
            <div className="mt-2 text-xs text-sub">
              {r.admin ? "Quản trị người dùng · " : ""}
              {r.canEdit ? "Được nhập & sửa dữ liệu công nợ" : "Chỉ xem báo cáo, không sửa"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
