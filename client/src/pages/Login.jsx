import { useState } from "react";
import { Wallet, LogIn } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { authBackend } from "../lib/auth";
import { DEMO_USERS, ROLES } from "../lib/roles";
import { Input, Btn } from "../components/Modal";

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e, u, p) {
    e?.preventDefault();
    setErr("");
    setBusy(true);
    try {
      await login(u ?? username, p ?? password);
    } catch (ex) {
      setErr(ex.message || "Đăng nhập thất bại.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f8fa] p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-6 flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm">
            <Wallet size={24} />
          </div>
          <h1 className="mt-3 text-lg font-bold text-slate-800">HPC Receivable</h1>
          <p className="text-sm text-slate-400">Theo dõi công nợ &amp; dòng tiền</p>
        </div>

        {/* Form */}
        <form
          onSubmit={submit}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card"
        >
          <h2 className="mb-4 text-base font-semibold text-slate-800">Đăng nhập</h2>

          {err && (
            <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {err}
            </div>
          )}

          <label className="mb-1 block text-sm font-medium text-slate-600">
            Tên đăng nhập
          </label>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="VD: thuong"
            autoFocus
          />
          <label className="mb-1 mt-3 block text-sm font-medium text-slate-600">
            Mật khẩu
          </label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••"
          />

          <Btn type="submit" disabled={busy} className="mt-5 w-full">
            <span className="flex items-center justify-center gap-2">
              <LogIn size={16} /> {busy ? "Đang vào…" : "Đăng nhập"}
            </span>
          </Btn>
        </form>

        {/* Đăng nhập nhanh (chỉ hiện ở chế độ local để thử) */}
        {authBackend !== "firestore" && (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white/60 p-4">
            <p className="mb-2 text-xs font-medium text-slate-500">
              Đăng nhập nhanh (bản thử — mật khẩu: 123456)
            </p>
            <div className="flex flex-wrap gap-2">
              {DEMO_USERS.map((u) => (
                <button
                  key={u.username}
                  onClick={(e) => submit(e, u.username, u.password)}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:border-brand-400 hover:text-brand-600"
                  title={u.name}
                >
                  {ROLES[u.role]?.name || u.role}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
