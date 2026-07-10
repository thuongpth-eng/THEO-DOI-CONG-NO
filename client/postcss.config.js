import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

const __dir = dirname(fileURLToPath(import.meta.url)).replace(/\\/g, "/");

export default {
  plugins: [
    // Chỉ đích danh file config để Tailwind không phụ thuộc thư mục chạy.
    tailwindcss({ config: `${__dir}/tailwind.config.js` }),
    autoprefixer(),
  ],
};
