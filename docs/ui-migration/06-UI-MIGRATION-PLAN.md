# 06 — UI MIGRATION PLAN

Nguyên tắc: refactor có kiểm soát, KHÔNG đổi nghiệp vụ/route/Firestore/permission. Sau mỗi phase chạy `npm run lint` + `npm run build`, verify preview, rồi mới sang phase sau. Không dùng TypeScript (app là JS) → bỏ bước `typecheck`; dùng JSDoc nếu cần.

## Phase 2 — Token & Foundation (rủi ro Thấp)
- Đổi 13 chỗ màu lệch sang token (bảng 03).
- Thống nhất overlay Modal `bg-black/50`.
- Mở rộng `Btn`: bỏ `hover:bg-red-700`, dùng token; (tùy chọn) thêm prop `loading`/`size`.
- **Kiểm:** lint + build + verify màu qua CSS/preview.

## Phase 3 — Shared primitives trình bày (Thấp)
Tạo trong `src/components/shared/`:
- `Badge.jsx` + `StatusBadge.jsx` (map trạng thái → token màu + chữ).
- `LoadingState.jsx`, `EmptyState.jsx`, `ErrorState.jsx`.
- `Stat.jsx` (gộp 2 bản).
- Áp `LoadingState`/`EmptyState` vào các page (thay câu tự vẽ). Bọc data fetch bằng try/catch → `ErrorState`.

## Phase 4 — Layout & util dùng chung (Thấp–TB)
- `PageHeader.jsx` (title + mô tả + slot actions) → áp cho Contracts, ContractDetail, Users, Links.
- `Tabs.jsx` → Receivable dùng.
- `Stepper.jsx` (gộp bản Tracking/Contracts).
- `lib/contractsUtil.js`: `slug`, `yearOf`, `stageState`, `DOT` (bỏ bản copy).

## Phase 5 — Feature-shared (TB–Cao, làm cẩn thận)
- `FilterBar.jsx` + `SearchBox.jsx` (search + select CĐT + select trạng thái + xóa lọc).
- `YearBar.jsx`.
- `ContractFormModal.jsx` (gộp Modal Thêm HĐ/PL + Thêm KH của Tracking & Contracts). **Test kỹ ghi Firestore.**

## Phase 6 — Áp chuẩn từng trang
Thứ tự: **Users → Links → ContractDetail → Contracts → Tracking/Receivable**.
Mỗi trang: thay style hard-code → dùng shared → giữ nguyên nghiệp vụ → verify (responsive/loading/empty/error/quyền) → lint + build.
KHÔNG refactor sâu logic `EditCell` inline (rủi ro cao, ghi thật).

## Phase 7 — Responsive & Accessibility
- Rà mobile/tablet/desktop mọi trang.
- Thêm `aria-label` cho icon-button (chuyển tháng, xóa, toggle theme, mở menu…).
- Kiểm focus-visible, contrast.

## Phase 8 — Cleanup & Validation
- Xóa util/component đã gộp (sau khi chắc không còn nơi dùng).
- `npm run lint` + `npm run build` sạch. Deploy khi Sếp duyệt.

## Ước lượng
- P2 nhanh (nửa buổi). P3–P4 vừa. P5 nặng nhất (gộp modal + filter). P6 theo từng trang.
- Đề xuất: **làm P2–P4 trước, deploy, Sếp xem; rồi mới P5–P6** để kiểm soát rủi ro.
