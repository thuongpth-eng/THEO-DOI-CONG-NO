# 04 — UI INCONSISTENCY REPORT

So sánh các trang chính (thay cho "5 tab" trong prompt). Cột "Chuẩn mục tiêu" = trạng thái sau chuẩn hóa.

| Tiêu chí | Theo dõi công nợ (`/`) | Kho lưu trữ (`/contracts`) | Chi tiết công trình (`/contracts/:id`) | Mã liên kết (`/links`) | Người dùng (`/users`) | Chuẩn mục tiêu |
|---|---|---|---|---|---|---|
| PageHeader | tab bar + toolbar (Receivable) | h1 + mô tả + nút tự vẽ | Link back + h1 tự vẽ | title từ App | title từ App | `PageHeader` dùng chung |
| Tiêu đề | ẩn (tab thay) | tự vẽ | tự vẽ | App vẽ | App vẽ | thống nhất qua PageHeader/Tabs |
| Toolbar xuất | có (3 tab) | không | không | không | không | giữ ở Receivable; các trang khác không cần |
| Search | FilterBar riêng | FilterBar riêng (trùng) | — | — | — | `SearchBox`/`FilterBar` chung |
| Filter | select CĐT + trạng thái | select CĐT + trạng thái (trùng) | — | — | — | `FilterBar` chung |
| Button | `Btn` (chuẩn) | `Btn` (chuẩn) | `Btn` + `text-red-600` | `Btn` | `Btn` | `Btn` + variant danger token |
| Card | `bg-card rounded-xl shadow-card` | như trái | như trái | như trái | như trái | thống nhất (tạo `Card`) |
| Table | inline EditCell (đặc thù) | không (card) | bảng 20 cột | bảng đơn | bảng đơn | giữ; style hàng/cell theo spec |
| Badge/tag | span rounded-full (nhiều) | span rounded-full | span rounded-full | — | badge emerald (lệch) | `StatusBadge`/`Badge` chung |
| Dialog | Modal (chuẩn) | Modal (chuẩn, trùng form) | Modal | Modal | — | Modal chung + form HĐ gộp |
| Spacing | theo lưới | theo lưới | theo lưới | theo lưới | theo lưới | OK |
| Responsive | tốt (card list) | tốt | overflow-x | ổn | ổn | OK |
| Loading | `Đang tải…` tự vẽ | tự vẽ | tự vẽ | tự vẽ | (kiểm) | `LoadingState` chung |
| Empty | câu tự vẽ | câu tự vẽ | — | (kiểm) | (kiểm) | `EmptyState` chung |
| Error (fetch lỗi) | **không có** | không có | không có | không có | không có | `ErrorState` chung + try/catch |
| Stepper | bản A | bản B (khác nhẹ) | — | — | — | 1 `Stepper` chung |

## Điểm không nhất quán nổi bật
1. **Stepper 2 phiên bản** (kích thước chấm, tooltip khác nhau).
2. **Loading/Empty viết tay mỗi nơi** → không đồng nhất câu chữ & spacing.
3. **Badge trạng thái**: chỗ dùng token, chỗ dùng `emerald/red` mặc định.
4. **PageHeader mỗi trang một kiểu** (chỗ App vẽ, chỗ trang tự vẽ).
5. **Không có xử lý lỗi tải dữ liệu** ở bất kỳ trang nào (nếu Firestore lỗi → treo "Đang tải…").
