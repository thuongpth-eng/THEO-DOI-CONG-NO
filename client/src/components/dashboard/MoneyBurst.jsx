import { useCallback, useRef, useState } from "react";

// Các ký hiệu tiền bay lên — thiên về tiền Việt
const BITS = ["💵", "💰", "🪙", "đ", "💵", "🪙"];

let seq = 0;

// Hook dùng cho thẻ số liệu: trỏ chuột vào là "tiền bay lên"
// Trả về { bits, onEnter, pulse } — gắn onEnter vào onMouseEnter của thẻ.
export function useMoneyBurst({ so = 7 } = {}) {
  const [bits, setBits] = useState([]);
  const [pulse, setPulse] = useState(false);
  const khoa = useRef(false); // chặn spam khi chuột đi qua đi lại

  const onEnter = useCallback(() => {
    if (khoa.current) return;
    khoa.current = true;
    setTimeout(() => (khoa.current = false), 750);

    const moi = Array.from({ length: so }, (_, i) => {
      const id = ++seq;
      return {
        id,
        emoji: BITS[Math.floor(Math.random() * BITS.length)],
        left: 8 + Math.random() * 78, // % chiều ngang thẻ
        dx: `${Math.round(-18 + Math.random() * 36)}px`,
        rot: `${Math.round(-28 + Math.random() * 56)}deg`,
        delay: `${i * 55}ms`,
        size: 12 + Math.round(Math.random() * 8),
      };
    });
    setBits((cu) => [...cu, ...moi]);
    setPulse(true);
    setTimeout(() => setPulse(false), 600);
    // Dọn hạt sau khi bay xong
    const ids = new Set(moi.map((b) => b.id));
    setTimeout(() => setBits((cu) => cu.filter((b) => !ids.has(b.id))), 1500);
  }, [so]);

  return { bits, onEnter, pulse };
}

// Lớp phủ chứa các hạt tiền đang bay
export default function MoneyBurst({ bits }) {
  if (!bits.length) return null;
  return (
    <>
      {bits.map((b) => (
        <span
          key={b.id}
          className="money-bit"
          style={{
            left: `${b.left}%`,
            fontSize: b.size,
            animationDelay: b.delay,
            "--dx": b.dx,
            "--rot": b.rot,
          }}
        >
          {b.emoji}
        </span>
      ))}
    </>
  );
}
