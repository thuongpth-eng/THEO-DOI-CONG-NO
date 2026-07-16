# 03 — DESIGN TOKEN AUDIT

## A. Màu lệch token (13 chỗ) — cần đổi sang token HPCons

Token đích: `brand-*` (#60BB46 xanh lá) · `accent` (#0969A7) · `danger` (#E53935) · `warning` (#FFA726) · `muted` (#9E9E9E) · `text-ink/sub/faint`, `bg-card/hover`, `border-line`.

| Giá trị hiện tại | File:dòng | Ý nghĩa | Token đích | Hành động |
|---|---|---|---|---|
| `text-red-400` (hover Đăng xuất) | Sidebar.jsx:110 | nguy hiểm | `hover:text-danger` | đổi class |
| `text-red-600` (nút xóa HĐ) | ContractDetail.jsx:279 | nguy hiểm | `text-danger` | đổi class |
| `text-emerald-600 dark:text-emerald-400` (Đã thu) | ContractDetail.jsx:288 | thành công | `text-brand-500` | đổi class |
| `text-red-600 dark:text-red-400` (Quá hạn) | ContractDetail.jsx:293 | nguy hiểm | `text-danger` | đổi class |
| `hover:bg-red-500/10 hover:text-red-600` (xóa) | ContractDetail.jsx:400 | nguy hiểm | `hover:bg-danger/10 hover:text-danger` | đổi class |
| `bg-slate-900/50` (nền mờ Modal) | Modal.jsx:7 | overlay | `bg-black/50` | đổi class (thống nhất với Sidebar drawer) |
| `hover:bg-red-700` (Btn danger) | Modal.jsx:67 | nguy hiểm | `hover:brightness-95` hoặc `hover:bg-danger/90` | đổi class |
| `text-emerald-600 dark:text-emerald-400` (cột Đã thu) | Tracking.jsx:792 | thành công | `text-brand-500` | đổi class |
| `text-amber-600 dark:text-amber-400` (ghi chú) | Tracking.jsx:832 | cảnh báo/chú ý | `text-warning` | đổi class |
| `hover:bg-red-500/10 hover:text-red-600` (xóa đợt) | Tracking.jsx:838 | nguy hiểm | `hover:bg-danger/10 hover:text-danger` | đổi class |
| `bg-red-500/15 text-red-600 dark:text-red-400` (báo lỗi login) | Login.jsx:53 | lỗi | `bg-danger/15 text-danger` | đổi class |
| `bg-emerald-500/15 text-emerald-600 dark:text-emerald-400` (badge active) | Users.jsx:15 | thành công | `bg-brand-500/15 text-brand-600` | đổi class |
| `bg-slate-500/15 text-sub` (icon KPI) | KpiStrip.jsx:67 | trung tính | `bg-muted/15 text-sub` | đổi class |

> Lưu ý: cần thêm `danger`/`warning` vào Tailwind ở dạng có shade nếu muốn `/10 /15 /90` (hiện `danger`/`warning` là màu đơn — Tailwind vẫn hỗ trợ opacity `/xx` cho màu đơn nên OK).

## B. Arbitrary value `x-[...]` (62 lần) — phần lớn ĐÚNG spec, KHÔNG đổi

Các giá trị sau là **chuẩn HPCons ITASSET, giữ nguyên**: `w-[260px]` (sidebar), `h-[60px]` (header), `h-14`/`h-12`, `min-h-[44px]` (vùng chạm), `text-[28px]` (title), `text-[32px]` (KPI), `text-[11px]/[12.5px]/[13px]` (caption/label spec).

Cần rà (có thể quy về scale chuẩn nếu tiện, ưu tiên thấp): vài `max-w-[...]`, `w-[...]` cục bộ trong biểu đồ/treemap.

**Kết luận token:** vấn đề thực chất chỉ là **13 chỗ màu** (rủi ro thấp) + thiếu vài token phụ. Nền token đã tốt.
