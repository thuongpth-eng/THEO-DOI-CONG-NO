# TASK — Backlog phát triển HPC Receivable
Trạng thái: ✅ xong · 🔵 kế tiếp · ⚪ sau

## Giai đoạn 0–6 (✅ HOÀN THÀNH — v1 đang chạy production)
- ✅ Dựng dự án React + Vite + Tailwind; Node portable trên máy dev
- ✅ Chuyển 100% dữ liệu v31 → seed.json → Firestore (6 KH / 8 HĐ / 26 đợt, đối chiếu khớp)
- ✅ Lớp dữ liệu 2 backend (local / firestore) + lớp auth 2 backend
- ✅ CRUD hợp đồng + đợt thanh toán + khách hàng; tự tính còn lại/quá hạn
- ✅ Dashboard: 4 KPI + 4 biểu đồ (dòng tiền, dự báo 90 ngày, theo KH, tuổi nợ)
- ✅ Firebase Auth 5 tài khoản + phân quyền + firestore.rules (deploy qua REST API)
- ✅ Xuất Excel/CSV/JSON/In PDF
- ✅ Deploy Firebase Hosting + GitHub private repo
- ✅ Dark mode (mặc định tối) + theme toggle sáng/tối/tự động
- ✅ Responsive: drawer mobile, Card List thay bảng trên mobile
- ✅ Áp HPCons Design System V1.0 + spec ITASSET (header 60px, sidebar 260px,
     card 12px/16px, input/button 40px, table 48/44/12, tag 999px nền đặc, KPI 32px,
     breakpoint 1200px, icon 20/40px, màu #60BB46/#0969A7/#4B4F55)

## Giai đoạn 7 — Hoàn thiện nghiệp vụ (🔵 kế tiếp, làm trên app hiện tại)
- 🔵 T7.1 Trang Lịch sử thay đổi: ghi activity_logs khi thêm/sửa/xóa (ai, gì, khi nào, cũ→mới)
- 🔵 T7.2 Xác nhận xóa bằng Dialog chuẩn (thay window.confirm)
- 🔵 T7.3 Toast thông báo khi lưu thành công/thất bại (spec 12-feedback)
- 🔵 T7.4 Trường duKienHD/duKienQLDA/duKienCDT + ngayGuiHS/ngayXuatHD vào form đợt (đang thiếu 2 trường dự kiến)
- 🔵 T7.5 Đính kèm link hồ sơ cho từng đợt (như v31 có)
- 🔵 T7.6 Đổi mật khẩu trong app + trang Người dùng đọc từ Firestore thật
- 🔵 T7.7 Bộ lọc: theo trạng thái, theo khách hàng, theo quá hạn
- 🔵 T7.8 Cảnh báo trên Dashboard: danh sách đợt quá hạn + sắp đến hạn 7 ngày

## Giai đoạn 8 — Bảng nâng cao & UX (⚪)
- ⚪ T8.1 TanStack Table: sort, filter cột, pin, chọn cột, phân trang
- ⚪ T8.2 Inline edit số tiền đã thu ngay trên bảng
- ⚪ T8.3 React Hook Form + Zod cho form (validate số tiền, ngày)
- ⚪ T8.4 Undo/dirty state cho form
- ⚪ T8.5 Skeleton loading (spec 12-feedback)

## Giai đoạn 9 — Nhắc việc & thông báo (⚪)
- ⚪ T9.1 reminders collection + Cloud Function quét hằng ngày (cần gói Blaze hoặc chạy script định kỳ)
- ⚪ T9.2 Thông báo in-app (chuông trên header)
- ⚪ T9.3 Email nhắc quá hạn / đến hạn

## Giai đoạn 10 — Tùy chọn nâng cấp nền tảng (⚪ QUYẾT ĐỊNH SAU)
- ⚪ T10.1 Đánh giá chuyển Next.js 15 + TypeScript strict (xem ghi chú bên dưới)
- ⚪ T10.2 Tách payment_history (nhiều lần thu/1 đợt), invoices
- ⚪ T10.3 Module AI (dự báo dòng tiền, tổng hợp báo cáo TGĐ)
- ⚪ T10.4 Thêm vai trò QAQC/Site/Viewer nếu nghiệp vụ cần

### Ghi chú quyết định T10.1 (viết lại Next.js)
- KHÔNG đập bỏ app đang chạy khi chưa có bản thay thế chạy song song đầy đủ.
- Nếu làm: dựng repo mới theo 4 tài liệu này, dùng chung Firestore (schema v1),
  chạy song song → nghiệm thu → chuyển link. Dữ liệu KHÔNG cần di trú lại.
- Lưu ý: prompt tham khảo bên ngoài ghi theme "Steel Blue + Orange" — SAI so với
  HPCons Design System (#60BB46). Mọi bản viết lại phải theo DESIGN_SYSTEM.md.
