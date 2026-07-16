import { useState } from "react";
import { LogIn } from "lucide-react";
import Logo from "../components/Logo";
import { useAuth } from "../context/AuthContext";
import { authBackend } from "../lib/auth";
import { DEMO_USERS, ROLES } from "../lib/roles";
import { Input, Btn } from "../components/Modal";

const isCloud = authBackend === "firestore";

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
    <div className="flex min-h-screen items-center justify-center bg-page p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-6 flex flex-col items-center">
          <div className="flex items-center justify-center rounded-2xl bg-white px-6 py-4 shadow-card">
            <Logo size={76} />
          </div>
          <h1 className="mt-4 text-center text-lg font-bold uppercase text-ink">
            Kiểm soát hợp đồng chủ đầu tư
          </h1>
          <p className="text-sm text-faint">HP CONS · Công nợ &amp; dòng tiền</p>
        </div>

        {/* Form */}
        <form
          onSubmit={submit}
          className="rounded-xl border border-line bg-card p-6 shadow-card"
        >
          <h2 className="mb-4 text-base font-semibold text-ink">Đăng nhập</h2>

          {err && (
            <div className="mb-3 rounded-lg bg-danger/15 px-3 py-2 text-sm text-danger">
              {err}
            </div>
          )}

          <label className="mb-1 block text-sm font-medium text-sub">
            {isCloud ? "Email đăng nhập" : "Tên đăng nhập"}
          </label>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={isCloud ? "ten@hpcons.com.vn" : "VD: thuong"}
            autoComplete="username"
            autoFocus
          />
          <label className="mb-1 mt-3 block text-sm font-medium text-sub">Mật khẩu</label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••"
            autoComplete="current-password"
          />

          <Btn type="submit" disabled={busy} className="mt-5 w-full">
            <span className="flex items-center justify-center gap-2">
              <LogIn size={16} /> {busy ? "Đang vào…" : "Đăng nhập"}
            </span>
          </Btn>
        </form>

        {/* Đăng nhập nhanh (chỉ hiện ở chế độ local để thử) */}
        {!isCloud && (
          <div className="mt-4 rounded-xl border border-dashed border-line bg-card/60 p-4">
            <p className="mb-2 text-xs font-medium text-sub">
              Đăng nhập nhanh (bản thử — mật khẩu: 123456)
            </p>
            <div className="flex flex-wrap gap-2">
              {DEMO_USERS.map((u) => (
                <button
                  key={u.username}
                  onClick={(e) => submit(e, u.username, u.password)}
                  className="rounded-lg border border-line bg-card px-2.5 py-1 text-xs font-medium text-sub hover:border-brand-400 hover:text-brand-600"
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
