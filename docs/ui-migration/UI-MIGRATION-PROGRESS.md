# UI Migration Progress

## Tổng trạng thái
- Audit (Phase 1): ✅ Xong
- Foundation / token (Phase 2): ✅ Xong (13 chỗ màu → token)
- UI primitives (Phase 3): ✅ Xong (LoadingState, EmptyState, ErrorState, Badge, Stat)
- Shared layout / util (Phase 4): ✅ Xong (PageHeader, Tabs, Stepper, lib/contractsUtil)
- Feature-shared (Phase 5 – FilterBar/YearBar/ContractFormModal): ⬜ Đợt 2
- Áp chuẩn từng trang (Phase 6): 🟡 Một phần (đã áp Loading/Empty/Stepper/PageHeader/Stat/Tabs vào Overview, Tracking, Contracts, ContractDetail, ProjectProgress, Receivable)
- ErrorState wiring (try/catch từng trang): ⬜ Đợt 2
- Responsive (Phase 7): ⬜ Đợt 2 rà lại
- Accessibility (Phase 7): 🟡 Tabs có role/aria-selected; còn icon-button cần aria-label (đợt 2)
- Build validation (Phase 8): ✅ build + lint sạch (không lỗi mới)

## Nhật ký thay đổi

### Phase 1 — Discovery & Audit (14/07/2026)
- File đã thay đổi: chỉ TẠO tài liệu trong `docs/ui-migration/` (01→06 + progress). KHÔNG sửa source.
- Nội dung: kiểm tra stack thật (React+Vite+JS, không Next/TS/shadcn); lập danh sách trang/route/layout; đếm 13 chỗ lệch token màu; xác định component trùng lặp (Stepper, Modal HĐ, FilterBar, YearBar, Stat, util); liệt kê component nền còn thiếu.
- Lý do: chuẩn hóa giao diện theo `docs/DESIGN_SYSTEM.md`.
- Rủi ro: không (read-only).
- Kiểm tra đã chạy: grep token/màu, đọc source.
- Kết quả: hoàn tất audit; nền token đã tốt, vấn đề chính là trùng lặp component + 13 chỗ màu + thiếu state components.

### Phase 2–4 — Đợt 1 (14/07/2026)
- Đổi 13 chỗ màu Tailwind mặc định sang token (danger/warning/brand/muted) ở Sidebar, Modal, Login, Users, KpiStrip, ContractDetail, Tracking.
- Tạo shared: `LoadingState`, `EmptyState`, `ErrorState`, `Badge`, `Stat`, `PageHeader`, `Tabs`, `Stepper` + `lib/contractsUtil.js` (slug, yearOf, todayISO, stageState, STAGE_DOT/LABEL).
- Áp: Receivable→Tabs; Overview/Tracking/Contracts/ContractDetail→LoadingState; Contracts/Tracking→Stepper+util+EmptyState; Contracts→PageHeader; ContractDetail/ProjectProgress→Stat chung.
- Gỡ trùng: bỏ Stepper/slug/yearOf/stageState/DOT copy ở Tracking & Contracts; gộp stageState về canonical (dùng `arisen`).
- Rủi ro: đã né refactor logic EditCell inline (ghi thật). Verify: build 14.29s OK, lint không lỗi mới, DOM 3 khu vực chạy đúng, đã deploy.

## Vấn đề chưa xử lý
| Vấn đề | Mức độ | Lý do chưa xử lý | Đề xuất |
|---|---|---|---|
| Stack prompt (Next/TS/shadcn) ≠ app thật | Nghiêm trọng (đã giải quyết) | Sếp đã chốt: chuẩn hóa trên nền React+Vite hiện tại | Không migrate stack |
| Chưa bắt đầu sửa code | — | Chờ Sếp duyệt `06-UI-MIGRATION-PLAN.md` | Duyệt rồi làm P2→P4 trước |
| Dữ liệu rác "NHÀ MÁY JIANG DONG" (CĐT=CFFFFFF) | Thấp | Là dữ liệu, không phải UI | Sếp quyết xóa/sửa |
