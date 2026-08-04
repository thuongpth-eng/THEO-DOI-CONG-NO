// Quản lý các "thẻ năm" người dùng tự thêm (năm chưa có hợp đồng nào).
// Dùng chung cho Theo dõi công nợ và Kho lưu trữ hợp đồng.
import { useState } from "react";

export const LS_EXTRA_YEARS = "hpc_extra_years_v1";

// Năm gợi ý trong ô "chuyển năm" của hợp đồng
export const NAM_GOI_Y = (() => {
  const n = new Date().getFullYear();
  return [n - 1, n, n + 1, n + 2].map(String);
})();

const doc = () => {
  try {
    const v = JSON.parse(localStorage.getItem(LS_EXTRA_YEARS) || "[]");
    return Array.isArray(v) ? v.filter((y) => /^\d{4}$/.test(String(y))).map(String) : [];
  } catch {
    return [];
  }
};

export function useExtraYears() {
  const [extraYears, setExtraYears] = useState(doc);

  const luu = (list) => {
    setExtraYears(list);
    try {
      localStorage.setItem(LS_EXTRA_YEARS, JSON.stringify(list));
    } catch {
      /* trình duyệt chặn lưu — bỏ qua */
    }
  };

  return {
    extraYears,
    themNam: (y) => luu(extraYears.includes(y) ? extraYears : [...extraYears, y]),
    doiNam: (cu, moi) => {
      const conLai = extraYears.filter((x) => x !== cu);
      luu(conLai.includes(moi) ? conLai : [...conLai, moi]);
    },
    xoaNam: (y) => luu(extraYears.filter((x) => x !== y)),
  };
}
