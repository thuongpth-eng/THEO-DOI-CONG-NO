# 05 — UI MIGRATION MAP

| UI hiện tại | File hiện tại | Chuẩn mục tiêu | Component mục tiêu | Rủi ro | Phase |
|---|---|---|---|---|---|
| Màu Tailwind mặc định (13 chỗ) | 7 file (xem 03) | token HPCons | — | Thấp | P2 |
| `bg-slate-900/50` overlay | Modal.jsx | overlay thống nhất | — | Thấp | P2 |
| `Đang tải…` lặp | các page | 1 chuẩn | `shared/LoadingState` | Thấp | P3 |
| "Không tìm thấy/Chưa có" lặp | các page | 1 chuẩn | `shared/EmptyState` | Thấp | P3 |
| (thiếu) lỗi tải | các page | có xử lý | `shared/ErrorState` | Thấp | P3 |
| span badge rounded-full | nhiều nơi | 1 chuẩn | `shared/Badge` + `shared/StatusBadge` | Thấp | P3 |
| `Stat` (2 bản) | ContractDetail, ProjectProgress | 1 chuẩn | `shared/Stat` | Thấp | P3 |
| Stepper (2 bản) | Tracking, Contracts | 1 chuẩn | `shared/Stepper` | TB | P4 |
| tiêu đề trang tự vẽ | các page + App | 1 chuẩn | `shared/PageHeader` | TB | P4 |
| Tab bar inline | Receivable | 1 chuẩn | `shared/Tabs` | Thấp | P4 |
| Search + filter + xóa lọc | Tracking, Contracts | 1 chuẩn | `shared/FilterBar` + `shared/SearchBox` | TB | P5 |
| Thanh NĂM | Tracking, Contracts | 1 chuẩn | `shared/YearBar` | TB | P5 |
| Modal Thêm HĐ/PL + Thêm KH | Tracking, Contracts | 1 chuẩn | `shared/ContractFormModal` (feature-shared) | **Cao** | P5 |
| util `slug/yearOf/stageState/DOT` | Tracking, Contracts | 1 chuẩn | `lib/contractsUtil.js` | Thấp | P4 |
| Btn danger `hover:bg-red-700` | Modal.jsx | token | mở rộng `Btn` variant | Thấp | P2 |

Trang áp chuẩn (Phase 6) theo thứ tự: Users → Links → ContractDetail → Contracts → Tracking (Receivable).
