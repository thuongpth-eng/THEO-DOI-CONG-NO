import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

// Đường dẫn tuyệt đối, dấu "/" — để quét đúng file dù chạy từ thư mục nào.
const D = dirname(fileURLToPath(import.meta.url)).replace(/\\/g, "/");

/** @type {import('tailwindcss').Config} */
export default {
  content: [`${D}/index.html`, `${D}/src/**/*.{js,jsx}`],
  darkMode: "class",
  theme: {
    extend: {
      screens: {
        // HPCons ITASSET: Desktop >=1200px
        xl: "1200px",
      },
      colors: {
        // Màu thương hiệu HPCons — xanh lá #60BB46
        brand: {
          50: "#eef8ea",
          100: "#d3edc9",
          200: "#aadd98",
          400: "#7cc95f",
          500: "#60bb46", // brand-primary
          600: "#4fa23a",
          700: "#3f8330",
        },
        // Màu nhấn HPCons — xanh dương
        accent: "#0969a7",
        // Màu trạng thái HPCons
        danger: "#e53935",
        warning: "#ffa726",
        muted: "#9e9e9e",
        // Thanh điều hướng (dark rail)
        nav: "var(--nav)",
        navfg: "var(--nav-fg)",
        navdim: "var(--nav-fg-dim)",
        navhover: "var(--nav-hover)",
        navactivebg: "var(--nav-active-bg)",
        navactivefg: "var(--nav-active-fg)",
        // Token theo "biến màu" — tự đổi sáng/tối (định nghĩa ở index.css)
        page: "var(--page)",
        card: "var(--card)",
        hover: "var(--hover)",
        ink: "var(--ink)",
        sub: "var(--sub)",
        faint: "var(--faint)",
        line: "var(--line)",
        brandtint: "var(--brand-tint)",
        brandink: "var(--brand-ink)",
      },
      fontFamily: {
        sans: ["Inter", "Segoe UI", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(15,23,42,.06), 0 1px 2px rgba(15,23,42,.04)",
      },
    },
  },
  plugins: [],
};
