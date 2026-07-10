import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

// Đường dẫn tuyệt đối, dấu "/" — để quét đúng file dù chạy từ thư mục nào.
const D = dirname(fileURLToPath(import.meta.url)).replace(/\\/g, "/");

/** @type {import('tailwindcss').Config} */
export default {
  content: [`${D}/index.html`, `${D}/src/**/*.{js,jsx}`],
  theme: {
    extend: {
      colors: {
        // Màu nhấn chính - xanh royal theo HP CONS Portal
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb", // màu chủ đạo
          700: "#1d4ed8",
        },
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
