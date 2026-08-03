import { useEffect, useRef, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const PHUT = 60 * 1000;
const HAN_CHO = 30 * PHUT; // không thao tác 30 phút → đăng xuất
const CANH_BAO = 60; // hiện cảnh báo trước 60 giây

// Tự động đăng xuất khi để máy lâu không dùng (tránh người khác dùng máy vào app).
export default function IdleLogout() {
  const { user, logout } = useAuth();
  const [conLai, setConLai] = useState(0); // >0 = đang đếm ngược cảnh báo
  const hetHan = useRef(0);

  useEffect(() => {
    if (!user) {
      setConLai(0);
      return;
    }
    const datLai = () => {
      hetHan.current = Date.now() + HAN_CHO;
      setConLai(0);
    };
    datLai();

    const sukien = ["mousedown", "keydown", "wheel", "touchstart", "mousemove"];
    let choPhep = true; // giảm tần suất xử lý mousemove
    const onAct = () => {
      if (!choPhep) return;
      choPhep = false;
      setTimeout(() => (choPhep = true), 2000);
      datLai();
    };
    sukien.forEach((e) => window.addEventListener(e, onAct, { passive: true }));

    const dem = setInterval(() => {
      const conMs = hetHan.current - Date.now();
      if (conMs <= 0) {
        clearInterval(dem);
        logout();
      } else if (conMs <= CANH_BAO * 1000) {
        setConLai(Math.ceil(conMs / 1000));
      }
    }, 1000);

    return () => {
      clearInterval(dem);
      sukien.forEach((e) => window.removeEventListener(e, onAct));
    };
  }, [user, logout]);

  if (!user || conLai <= 0) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-card p-5 text-center shadow-2xl">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-warning/15">
          <ShieldAlert size={26} className="text-warning" />
        </div>
        <div className="text-base font-bold text-ink">Sắp tự động đăng xuất</div>
        <p className="mt-1 text-sm text-sub">
          Không thấy Sếp thao tác trong 30 phút. Hệ thống sẽ đăng xuất sau{" "}
          <b className="text-danger">{conLai} giây</b> để bảo vệ dữ liệu.
        </p>
        <button
          onClick={() => {
            hetHan.current = Date.now() + HAN_CHO;
            setConLai(0);
          }}
          className="mt-4 w-full rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
        >
          Tôi vẫn đang làm việc
        </button>
        <button
          onClick={() => logout()}
          className="mt-2 w-full rounded-lg px-4 py-2 text-xs font-semibold text-faint hover:text-danger"
        >
          Đăng xuất ngay
        </button>
      </div>
    </div>
  );
}
