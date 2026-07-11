# DESIGN_SYSTEM — Chuẩn UI/UX áp dụng cho HPC Receivable
Nguồn chuẩn đầy đủ: bộ tài liệu **HPCons Design System V1.0**
(thư mục `D:\Thuong AI\HPCons-Design-System-v1.0\` — CLAUDE.md là luật gốc).
File này tóm tắt các giá trị ĐÃ ÁP DỤNG vào app, để dev sau tra nhanh.

## 1. Màu (Design Token — không hard-code)
| Token | Giá trị | Dùng cho |
|---|---|---|
| brand-primary | `#60BB46` | Nút chính, menu active, hoàn thành/đã duyệt |
| brand-accent | `#0969A7` | Liên kết, thông tin, processing |
| nav-base | `#4B4F55` | Sidebar |
| danger | `#E53935` | Lỗi/quá hạn/xóa (nền đặc + chữ trắng) |
| warning | `#FFA726` | Chờ duyệt/cảnh báo (nền đặc + chữ trắng) |
| muted | `#9E9E9E` | Hủy/không hoạt động |

Dark mode (mặc định): background `#0F1720` · card `#18232E` · chữ chính `#F5F7FA` ·
chữ phụ `#B8C0C8` · viền `rgba(255,255,255,0.08)`.
Trong code: CSS variables tại `client/src/index.css` (`--page --card --ink --sub --faint --line...`),
map vào Tailwind tại `client/tailwind.config.js` (bg-page, bg-card, text-ink, text-sub, border-line...).

## 2. Kích thước chuẩn (ITASSET spec)
| Thành phần | Giá trị | Trong code |
|---|---|---|
| Sidebar | 260px | `w-[260px]` |
| Header desktop | 60px | `h-[60px]` (Bell · Theme · Avatar, cách 16px) |
| Header mobile | 56px | `h-14` |
| Menu item | 44px | `min-h-[44px]`, icon 20px, text 14px |
| Lề ngoài page | 24px desktop / 16px mobile | `xl:px-6` / `px-4` |
| Section ↔ section | 24px | `mt-6` |
| Card padding / gap | 16px / 16px | `p-4` / `gap-4` |
| Input & Button | cao 40px, radius 8px | `h-10 rounded-lg` (Button px 24 = `px-6`) |
| Bảng: header/row/cell | 48px / 44px / 12px | `h-12` (thead tr), `px-3 py-3` |
| Radius: card / button / tag | 12px / 8px / 999px | `rounded-xl` / `rounded-lg` / `rounded-full` |
| Page title / KPI number | 28px Bold / 32px Bold | `text-[28px]` / `text-[32px]` |
| Icon thường / icon card | 20px / 40×40 | `size={20}` / `h-10 w-10` |

## 3. Responsive
Desktop ≥1200px (`xl` đã custom trong tailwind.config) · Tablet 768–1199 · Mobile <768 (`md`).
- Mobile: sidebar → Drawer overlay; bảng → **Card List** (không ép bảng nhiều cột); vùng chạm ≥44px.

## 4. Luật bắt buộc (trích CLAUDE.md)
1. Dark mode mặc định. 2. Không tạo màu ngoài token. 3. Không khoảng cách ngoài lưới 8px.
4. Không inline style / hard-code màu. 5. Không lặp lại component có sẵn.
6. Trạng thái phải có màu + chữ. 7. Không chữ <12px cho nội dung quan trọng.
8. Không emoji làm icon chức năng. 9. Không bóng đổ mạnh.
10. Trước khi code phải nêu tài liệu đã đọc; sau khi code tự kiểm tra theo `20-quality/ui-checklist.md`.
