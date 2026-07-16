# 01 — UI AUDIT REPORT (HPC Receivable)

> Phase 1 — Discovery & Audit. **Chỉ đọc, chưa sửa code.**
> Ngày lập: 14/07/2026 · Người lập: Claude (theo yêu cầu chuẩn hóa giao diện).

## 0. Điều chỉnh so với prompt gốc

Prompt "PROMPT_CHUAN_HOA_GIAO_DIEN_APP" giả định stack **Next.js 15 + App Router + TypeScript + shadcn/ui + React Table**.
App thật **HPC Receivable** dùng **React 19 + Vite + JavaScript + component tự viết** (không TS, không shadcn, không React Table).
→ Theo quyết định của Sếp: **chuẩn hóa trên nền hiện tại**, KHÔNG migrate sang Next/TS/shadcn.
Toàn bộ audit dưới đây đã ánh xạ mục tiêu của prompt vào stack thật.

Cũng lưu ý: prompt viết cho "App QL Công việc" (có logic phân công/trạng thái công việc) — không áp dụng cho app công nợ; các mục đó bỏ qua.

## 1. Tổng quan UI hiện tại

- **AppShell** (`src/App.jsx`): Sidebar trái 260px + Header desktop 60px + thanh top mobile 56px + `<main>` cuộn dọc. Dùng chung cho mọi trang. Guard `AdminOnly` cho /users.
- **Điều hướng** (`src/components/Sidebar.jsx`): 4 mục chính + mục Quản trị (admin). Dùng `NavLink` (active tự động).
- **Theme**: dark mode mặc định, có toggle sáng/tối (`ThemeContext`), token qua CSS var (`index.css`) → Tailwind.
- **Đăng nhập** (`src/pages/Login.jsx`): trang riêng, backend firestore/local.

## 2. Danh sách trang & route (thay cho "5 tab" trong prompt)

| # | Khu vực | Route | Page component | Layout | Ghi chú |
|---|---|---|---|---|---|
| 1 | Theo dõi công nợ | `/` | `Receivable.jsx` | AppShell | Bọc 3 tab nội bộ: Dashboard (`Overview`) · Tổng quan (`Tracking summary`) · Chi tiết (`Tracking`) |
| 2 | Kho lưu trữ hợp đồng | `/contracts` | `Contracts.jsx` | AppShell | Gom theo năm → công ty → HĐ + stepper |
| 3 | Chi tiết công trình | `/contracts/:id` | `ContractDetail.jsx` | AppShell | Bảng đối chiếu 20 cột + hồ sơ |
| 4 | Mã liên kết | `/links` | `Links.jsx` | AppShell | Bảng link hồ sơ |
| 5 | Lịch sử thay đổi | `/history` | `Placeholder` | AppShell | Chưa xây |
| 6 | Người dùng (admin) | `/users` | `Users.jsx` | AppShell | Guard admin |
| — | Đăng nhập | (no route) | `Login.jsx` | riêng | — |

→ "5 tab" của prompt ≈ 5–6 khu vực trên. Trọng tâm chuẩn hóa: 1, 2, 3, 4, 6.

## 3. Vấn đề phát hiện (theo nhóm)

### 3.1 Màu sắc — 13 chỗ dùng màu Tailwind mặc định thay vì token
Chi tiết + cách sửa: xem `03-DESIGN-TOKEN-AUDIT.md`. Tóm tắt: `red-*` → `danger`, `emerald-*` → `brand`, `amber-*` → `warning`, `slate-*` overlay/icon nền → token.

### 3.2 Typography
- Cơ bản ĐÚNG chuẩn (KPI 32px, title 28px, body 14px). Còn vài caption `text-[10px]`/`text-[11px]` ở badge/stepper — chấp nhận được nhưng cần rà theo luật "không <12px cho nội dung quan trọng".

### 3.3 Spacing / layout
- Phần lớn theo lưới 8px (p-4, gap-4, mt-6, px-6). Ít lệch.
- Mỗi page tự render tiêu đề (h1 + mô tả + nút) theo cách riêng → **không có `PageHeader` dùng chung**.

### 3.4 Responsive
- Tốt: sidebar → drawer, bảng lớn → card list ở mobile, breakpoint `xl=1200`. Bảng 20 cột (ContractDetail/Tracking) dùng `overflow-x-auto`.

### 3.5 Accessibility
- Thiếu `aria-label` ở một số icon-button (nút chuyển tháng lịch, một số nút xóa có title nhưng nên thêm aria).
- Ô nhập inline (EditCell) chưa gắn label ẩn.
- Focus ring có ở input/nút chính; cần rà nút icon.

### 3.6 Component trùng lặp (điểm lớn nhất)
- **Stepper** viết 2 bản gần giống nhau ở `Tracking.jsx` và `Contracts.jsx`.
- **Hàm tiện ích** `slug()`, `yearOf()`, `stageState()`+`DOT` copy ở cả Tracking & Contracts.
- **Modal Thêm HĐ/PL** và **Modal Thêm khách hàng** trùng gần như 100% giữa Tracking & Contracts.
- **Thanh tìm kiếm + bộ lọc** (search + select CĐT + select trạng thái + nút xóa lọc) trùng giữa Tracking & Contracts.
- **Thanh NĂM** trùng giữa Tracking & Contracts.
- **`Stat`** viết riêng ở `ContractDetail.jsx` và `ProjectProgress.jsx`.
- **Loading**: `<div className="py-20 text-center text-faint">Đang tải…</div>` lặp ở mọi page.
- **Empty**: các câu "Không tìm thấy…/Chưa có…" viết tay rải rác.
- **Badge/tag**: span `rounded-full` nền đặc lặp nhiều nơi (HỢP ĐỒNG/PHỤ LỤC/QUÁ HẠN/trạng thái TT).

### 3.7 Style hard-code
- 62 lần dùng arbitrary value `x-[...]` — **phần lớn là ĐÚNG spec** (w-[260px], h-[60px], min-h-[44px], text-[28px]/[32px]). Số thật sự "tùy tiện" rất ít; xem `03`.

### 3.8 Thiếu component nền theo prompt
Chưa có dạng dùng chung: `PageHeader`, `FilterBar`, `SearchBox`, `Badge/StatusBadge`, `Card`, `EmptyState`, `LoadingState`, `ErrorState`, `Tabs`, `Stepper` (đang nhân bản). `Button/Input/Select/Textarea/Modal/Field` ĐÃ có (trong `Modal.jsx`) và dùng nhất quán — điểm cộng.

## 4. Mức độ rủi ro refactor

| Vùng | Rủi ro | Lý do |
|---|---|---|
| Token màu (13 chỗ) | Thấp | Đổi class, không đụng logic |
| Tách shared: Badge, LoadingState, EmptyState, PageHeader, Stepper, FilterBar | Thấp–TB | Thuần trình bày |
| Gộp Modal Thêm HĐ/PL + tìm kiếm/lọc (Tracking↔Contracts) | **Trung bình–cao** | Dính state, handler, nghiệp vụ; cần test kỹ |
| Bảng inline EditCell (Tracking) | Cao | Nhập liệu ghi thật Firestore — không nên refactor sâu |

## 5. Đề xuất thứ tự migration
Foundation/token → Shared primitives (Badge, LoadingState, EmptyState, PageHeader) → Stepper dùng chung → FilterBar/SearchBox + Modal dùng chung → áp lần lượt trang đơn giản (Links, Users) → Contracts → Tracking/ContractDetail (phức tạp, cuối). Chi tiết: `06-UI-MIGRATION-PLAN.md`.
