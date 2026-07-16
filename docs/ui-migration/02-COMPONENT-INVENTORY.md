# 02 — COMPONENT INVENTORY

Phân loại: **primitive** (UI cơ bản) · **shared** (dùng chung nhiều nơi) · **layout** · **feature** (gắn nghiệp vụ) · **page**.

| Component | File | Loại | Được dùng tại | Trùng lặp | Đề xuất |
|---|---|---|---|---|---|
| Modal / Field / Input / Textarea / Select / Btn | `components/Modal.jsx` | primitive | toàn app | Không | Giữ. Cân nhắc thêm variant/size, `loading` cho Btn |
| Logo | `components/Logo.jsx` | primitive | Sidebar, App, Login | Không | OK (đã dùng ảnh thật) |
| Sidebar | `components/Sidebar.jsx` | layout | AppShell | Không | Giữ; tách token màu `hover:text-red-400`→danger |
| AppShell (inline trong App.jsx) | `App.jsx` | layout | mọi trang | Không | Cân nhắc tách `PageHeader` ra khỏi App |
| KpiStrip | `components/dashboard/KpiStrip.jsx` | feature | Overview | Không | Đổi `bg-slate-500/15`→token |
| OverviewWidgets | `components/dashboard/OverviewWidgets.jsx` | feature | Overview | Không | Giữ |
| ProjectProgress | `components/dashboard/ProjectProgress.jsx` | feature | Overview | `Stat`, `Ring` | Dùng `Stat`, `StatusBadge` chung |
| CollectionCalendar | `components/dashboard/CollectionCalendar.jsx` | feature | Overview | Không | Thêm aria cho nút chuyển tháng |
| DueLists | `components/dashboard/DueLists.jsx` | feature | Overview | Không | Giữ |
| CustomerProgress | `components/dashboard/CustomerProgress.jsx` | feature | (Overview cũ) | Không | Kiểm tra còn dùng không |
| TrendCharts | `components/dashboard/TrendCharts.jsx` | feature | Overview | Không | Giữ |
| Receivable (3 tab) | `pages/Receivable.jsx` | page | `/` | Tab bar inline | Tách `Tabs` + `ExportToolbar` dùng chung |
| Overview | `pages/Overview.jsx` | page | tab Dashboard | Loading lặp | Dùng `LoadingState` |
| Tracking | `pages/Tracking.jsx` | page | tab Tổng quan/Chi tiết | **Stepper, slug, yearOf, stageState, Modal HĐ, FilterBar, YearBar** | Nguồn trùng lặp lớn nhất |
| Contracts | `pages/Contracts.jsx` | page | `/contracts` | **Stepper, slug, yearOf, stageState, Modal HĐ, FilterBar, YearBar** | Gộp shared với Tracking |
| ContractDetail | `pages/ContractDetail.jsx` | page | `/contracts/:id` | `Stat` | Dùng `Stat`/`StatusBadge`/`Badge` chung; token màu |
| Links | `pages/Links.jsx` | page | `/links` | (kiểm) | Trang đơn giản — chuẩn hóa sớm |
| Users | `pages/Users.jsx` | page | `/users` | badge emerald | Token màu; trang đơn giản |
| Login | `pages/Login.jsx` | page | — | badge red | Token màu (bg-red-500/15) |

## Component NÊN tạo mới (shared) — chưa có
`shared/StatusBadge` · `shared/Badge` · `shared/LoadingState` · `shared/EmptyState` · `shared/ErrorState` · `shared/PageHeader` · `shared/FilterBar` (search+select) · `shared/Stepper` · `shared/Stat` · `shared/Tabs` · `shared/YearBar`.

> Nguyên tắc: shared component KHÔNG chứa nghiệp vụ, KHÔNG gọi Firestore, nhận dữ liệu qua props.
