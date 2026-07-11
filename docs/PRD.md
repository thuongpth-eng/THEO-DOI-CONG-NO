# PRD — HPC Receivable (Theo dõi công nợ phải thu)
Phiên bản: 1.0 · Cập nhật: 2026-07-11

## 1. Mục tiêu
Hệ thống theo dõi **công nợ phải thu** của HP CONS: hợp đồng xây dựng theo công trình,
các đợt thanh toán, tiến độ thu tiền, cảnh báo quá hạn, báo cáo dòng tiền cho Ban Giám đốc.

Nguồn nghiệp vụ gốc: file `theo-doi-cong-no-hpcons_v31.html` (đã phân tích và chuyển đổi).

## 2. Người dùng & phân quyền
| Vai trò | Mã | Quyền |
|---|---|---|
| Tổng Giám đốc | `tgd` | Xem tất cả + Quản trị người dùng |
| Phó Tổng Giám đốc | `ptgd` | Xem tất cả + Quản trị người dùng |
| Kế toán | `kt` | Nhập & sửa dữ liệu công nợ |
| PM (Quản lý dự án) | `pm` | Nhập & sửa dữ liệu công nợ |
| Kinh doanh / QS | `kd` | Chỉ xem |

Quyền kiểm soát 2 lớp: giao diện (ẩn nút) + Firestore Security Rules (chặn ghi trái phép).

## 3. Nghiệp vụ cốt lõi
### 3.1 Mô hình 3 cấp
`Khách hàng (Chủ đầu tư) → Hợp đồng/Công trình → Đợt thanh toán`

### 3.2 Trạng thái đợt thanh toán (0→6)
0 Chưa làm hồ sơ · 1 Đang hoàn thiện hồ sơ · 2 Đã gửi hồ sơ CĐT · 3 CĐT đã xác nhận ·
4 Đã xuất hóa đơn · 5 Thanh toán một phần · 6 Đã thanh toán đủ.

Mọi trạng thái hiển thị bằng **màu + chữ** (không chỉ màu).

### 3.3 Công thức
- `Còn lại (đợt) = value − paid` (coi như đã trả đủ nếu ≤ 0,5đ)
- `Quá hạn`: còn nợ và `ngayDenHan < hôm nay`; số ngày trễ = hôm nay − ngày đến hạn
- `Còn phải thu (HĐ/toàn cty)` = tổng còn lại các đợt
- `Dự báo 90 ngày` = các đợt còn nợ có ngày đến hạn trong [hôm nay, +90 ngày]
- `Tuổi nợ`: nhóm 1–30 / 31–60 / 61–90 / >90 ngày

### 3.4 KPI Dashboard
Còn phải thu · Đã thu · Nợ quá hạn · Số công trình/khách hàng ·
Dòng tiền theo tháng (đã thu vs đến hạn) · Dự báo thu 90 ngày ·
Còn phải thu theo khách hàng · Tuổi nợ quá hạn.

## 4. Tính năng
### Đã có (v1 — đang chạy production)
- Đăng nhập Firebase Auth, phân quyền 5 vai trò
- CRUD khách hàng / hợp đồng / đợt thanh toán
- Dashboard 4 biểu đồ + 4 thẻ KPI
- Tìm kiếm hợp đồng/khách hàng
- Xuất Excel (2 sheet) / CSV / JSON / In PDF
- Dark mode (mặc định tối) + responsive PC/tablet/mobile (Card List trên mobile)
- Giao diện theo HPCons Design System V1.0

### Kế hoạch (v2 — xem TASK.md)
- Lịch sử thay đổi (audit log): ai sửa gì, khi nào
- Nhắc việc tự động: đến hạn / quá hạn / thiếu hồ sơ / thiếu hóa đơn
- Đính kèm hồ sơ (biên bản nghiệm thu, hóa đơn) theo đợt
- Bảng nâng cao: sort/filter/group/pin/inline edit (TanStack Table)
- Thông báo (in-app, email)
- Báo cáo TGĐ tự động tổng hợp

## 5. Phi chức năng
- Web chạy mọi thiết bị, tiếng Việt
- Dữ liệu tập trung (Firestore), backup qua xuất JSON
- Hosting: Firebase Hosting — https://theo-doi-cong-no-cdf6e.web.app
- Mã nguồn: GitHub private `thuongpth-eng/THEO-DOI-CONG-NO`
