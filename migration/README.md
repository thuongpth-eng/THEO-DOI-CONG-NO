# 📦 Bàn giao dữ liệu — HPC Receivable (gửi IT)

Tài liệu chuyển dữ liệu công nợ từ file cũ `theo-doi-cong-no-hpcons_v31.html` sang **Firebase Firestore**.

## 1. Các file trong thư mục này

| File | Ý nghĩa |
|------|---------|
| `v31-raw.json` | Dữ liệu gốc trích nguyên từ file v31 (để đối chiếu) |
| `migrate.mjs` | Script chuyển đổi v31 → cấu trúc chuẩn hóa |
| `seed.json` | **Dữ liệu đã chuẩn hóa, sẵn sàng nạp vào Firestore** |
| `import-to-firestore.mjs` | Script nạp `seed.json` lên Firestore thật |

## 2. Cấu trúc dữ liệu Firestore (3 collection)

```
customers/{id}      Khách hàng (chủ đầu tư)
  ├─ name           Tên đầy đủ

contracts/{id}      Hợp đồng / công trình   (id gốc: HOWELL, SHUNHING, ...)
  ├─ customerId     → trỏ tới customers
  ├─ customerName   Tên KH (lưu kèm cho tiện hiển thị)
  ├─ code           Số hợp đồng (vd: 01/2026/HĐXD-HPCS)
  ├─ name, work, loc
  ├─ totalAfterTax  Giá trị HĐ sau thuế
  ├─ group, loai, maDuAn, order

installments/{id}   Đợt thanh toán          (id: <contractId>_<số thứ tự>)
  ├─ contractId     → trỏ tới contracts
  ├─ contractName, customerId, order
  ├─ dot, hoso, noidung
  ├─ value          Giá trị đợt
  ├─ paid           Đã thanh toán
  ├─ status         0..6 (Chưa làm HS → Đã thanh toán đủ)
  ├─ ngayGuiHS, ngayXuatHD, ngayDenHan, ngayTT
  ├─ duKienHD, duKienQLDA, duKienCDT
  ├─ ghichu, hanTT
```

## 3. Số liệu đối chiếu (phải khớp sau khi nạp)

- Khách hàng: **6** · Hợp đồng: **8** · Đợt thanh toán: **26**
- Tổng giá trị hợp đồng: **276.020.240.299 đ**
- Đã thu: **86.220.786.642 đ** · Còn phải thu: **189.799.453.661 đ**

## 4. Các bước nạp (IT thực hiện)

```bash
# 1. Cài thư viện
npm install firebase-admin

# 2. Tải service account key từ Firebase Console
#    (Project settings > Service accounts > Generate new private key)
#    lưu thành: serviceAccount.json

# 3. Chạy nạp dữ liệu
node import-to-firestore.mjs
```

## 5. Cấu hình phía app (client)

App đọc chế độ dữ liệu qua biến môi trường (xem `client/.env.example`):
- Đặt `VITE_DATA_BACKEND=firestore`
- Điền các khóa `VITE_FB_*` (từ Firebase Console > SDK setup)

> ⚠️ **Phân quyền (Firestore Security Rules)** sẽ được bổ sung ở Giai đoạn 5
> cùng với Firebase Authentication.
