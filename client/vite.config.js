import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Cố định thư mục gốc = nơi chứa file config này, để chạy được
  // dù tiến trình khởi động từ thư mục nào (khung xem trước, CI...).
  root: import.meta.dirname,
  server: {
    // Cổng do khung xem trước gán qua biến môi trường PORT (mặc định 5180)
    port: Number(process.env.PORT) || 5180,
    host: true,
  },
})
