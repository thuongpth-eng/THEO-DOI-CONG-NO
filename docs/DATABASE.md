# DATABASE — Thiết kế dữ liệu HPC Receivable
Phiên bản: 1.0 · Backend: Firebase Firestore · Project: `theo-doi-cong-no-cdf6e`

## 1. Mô hình hiện tại (v1 — đang chạy)

### customers/{id}
| Trường | Kiểu | Ghi chú |
|---|---|---|
| name | string | Tên chủ đầu tư |

id dạng slug: `cus_cong-ty-tnhh-...`

### contracts/{id}
| Trường | Kiểu | Ghi chú |
|---|---|---|
| customerId | string | → customers |
| customerName | string | denormalized để hiển thị nhanh |
| code | string | Số hợp đồng (01/2026/HĐXD-HPCS) |
| name | string | Tên công trình (HOWELL...) |
| work | string | Hạng mục công việc |
| loc | string | Địa điểm |
| totalAfterTax | number | Giá trị HĐ sau thuế (VND) |
| group / loai / maDuAn | string | Nhóm, loại, mã dự án |
| order | number | Thứ tự hiển thị |

id giữ nguyên từ v31: `HOWELL`, `SHUNHING`, `CHENKAI1`...

### installments/{id}  (đợt thanh toán)
| Trường | Kiểu | Ghi chú |
|---|---|---|
| contractId / contractName / customerId | string | liên kết |
| order | number | thứ tự đợt |
| dot | string | "ĐỢT 1" |
| hoso | string | loại hồ sơ yêu cầu |
| noidung | string | mô tả điều kiện thanh toán |
| value | number | giá trị đợt |
| paid | number | đã thanh toán |
| status | number | 0..6 (xem PRD §3.2) |
| ngayGuiHS / ngayXuatHD / ngayDenHan / ngayTT | string | ISO `YYYY-MM-DD`, có thể rỗng |
| duKienHD / duKienQLDA / duKienCDT | string | ngày dự kiến các bên |
| ghichu | string | |
| hanTT | number | số ngày thanh toán theo HĐ |

id: `{contractId}_{order}` (vd `HOWELL_1`).

### users/{uid}
| Trường | Kiểu | Ghi chú |
|---|---|---|
| name | string | Họ tên hiển thị |
| role | string | tgd · ptgd · kt · pm · kd |

uid = Firebase Auth UID. Đăng nhập bằng email/mật khẩu.

## 2. Bảo mật (firestore.rules — đã deploy)
- Đọc: mọi tài khoản đã đăng nhập
- Ghi customers/contracts/installments: role ∈ {kt, pm}
- Ghi users: role ∈ {tgd, ptgd}

## 3. Số liệu gốc đã nạp (đối chiếu)
6 khách hàng · 8 hợp đồng · 26 đợt · Tổng HĐ 276.020.240.299đ ·
Đã thu 86.220.786.642đ · Còn phải thu 189.799.453.661đ.

## 4. Mở rộng v2 (đề xuất — chưa triển khai)
| Collection | Mục đích |
|---|---|
| activity_logs | Audit: ai, làm gì, khi nào, giá trị cũ/mới |
| attachments | File hồ sơ/hóa đơn gắn với installment (Firebase Storage) |
| reminders | Nhắc việc: loại, hạn, người nhận, trạng thái |
| notifications | Thông báo in-app cho từng user |
| invoices | Tách hóa đơn khỏi đợt nếu 1 đợt nhiều hóa đơn |
| payment_history | Tách từng lần thu tiền (1 đợt thu nhiều lần) thay vì chỉ tổng `paid` |

Nguyên tắc chuyển đổi: KHÔNG phá schema v1; thêm collection mới, giữ tương thích ngược.
Script nạp/di trú nằm trong `migration/` (seed.json + import-to-firestore.mjs).
