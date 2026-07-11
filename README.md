# HPC Receivable — Theo dõi công nợ & dòng tiền

Web app quản lý công nợ phải thu của HP CONS. App **độc lập**, nhái phong cách HP CONS Portal, có link qua lại với Portal.

> 📄 Tài liệu này dành cho **IT** để deploy. Người dùng cuối chỉ cần link web + tài khoản.

## 1. Công nghệ

| Thành phần | Công nghệ |
|---|---|
| Giao diện | React + Vite + Tailwind CSS |
| Biểu đồ | Recharts |
| Dữ liệu | **Firebase Firestore** |
| Đăng nhập | **Firebase Authentication** |
| Hosting | **Vercel** (giao diện) |
| Mã nguồn | **GitHub** |

## 2. Cấu trúc thư mục

```
hpc-receivable/
├── client/              App React (deploy lên Vercel)
│   ├── src/
│   │   ├── lib/         data.js, auth.js, firebase.js, models.js, roles.js, exporter.js
│   │   ├── pages/       Overview, Contracts, ContractDetail, Dashboard, Login, Users
│   │   ├── components/  Sidebar, Modal
│   │   └── context/     AuthContext
│   ├── .env.example     Mẫu biến môi trường (copy thành .env)
│   └── vercel.json      Cấu hình SPA cho Vercel
├── migration/           Chuyển dữ liệu cũ → Firestore (xem migration/README.md)
├── firestore.rules      Quy tắc bảo mật + phân quyền
└── README.md            (file này)
```

## 3. Chạy thử ở máy (local)

```bash
cd client
npm install
npm run dev        # mở http://localhost:5173
```
Mặc định chạy chế độ `local` (dữ liệu mẫu, đăng nhập demo mật khẩu `123456`), **không cần Firebase**.

## 4. Deploy lên production (3 bước)

### Bước 1 — Firebase
1. Tạo project tại [console.firebase.google.com](https://console.firebase.google.com)
2. Bật **Firestore Database** và **Authentication → Email/Password**
3. **Nạp dữ liệu**: xem `migration/README.md` (chạy `import-to-firestore.mjs`)
4. **Nạp quy tắc bảo mật**: dán nội dung `firestore.rules` vào Firestore → Rules → Publish
5. **Tạo người dùng**: với mỗi nhân viên, tạo tài khoản trong Authentication, rồi tạo document `users/{uid}` với:
   ```json
   { "name": "Nguyễn Văn A", "role": "kt" }
   ```
   Vai trò (`role`): `tgd` · `ptgd` · `kt` · `pm` · `kd`

### Bước 2 — GitHub
```bash
cd hpc-receivable
git init && git add . && git commit -m "HPC Receivable"
git remote add origin <repo-của-công-ty>
git push -u origin main
```
> ⚠️ Repo nên để **private** vì chứa dữ liệu công nợ thật (`migration/seed.json`).

### Bước 3 — Vercel
1. [vercel.com](https://vercel.com) → New Project → chọn repo GitHub
2. **Root Directory**: đặt là `client`
3. **Environment Variables** — điền theo `client/.env.example`:
   ```
   VITE_DATA_BACKEND=firestore
   VITE_FB_API_KEY=...
   VITE_FB_AUTH_DOMAIN=...
   VITE_FB_PROJECT_ID=...
   VITE_FB_STORAGE_BUCKET=...
   VITE_FB_SENDER_ID=...
   VITE_FB_APP_ID=...
   VITE_PORTAL_URL=<link HP CONS Portal>
   ```
   (Lấy các khóa `VITE_FB_*` tại: Firebase Console → Project settings → SDK setup)
4. Deploy. Xong → có link web chạy thật.

### Liên kết với HP CONS Portal
- App có nút **"← Về HP CONS Portal"** (dùng `VITE_PORTAL_URL`).
- Ở Portal, sửa ô **HPC Receivable** trỏ tới link Vercel là xong 2 chiều.

## 5. Phân quyền (5 vai trò)

| Vai trò | `role` | Quyền |
|---|---|---|
| Tổng Giám đốc | `tgd` | Xem tất cả + Quản trị người dùng |
| Phó TGĐ | `ptgd` | Xem tất cả + Quản trị người dùng |
| Kế toán | `kt` | Nhập & sửa dữ liệu công nợ |
| PM | `pm` | Nhập & sửa dữ liệu công nợ |
| Kinh doanh/QS | `kd` | Chỉ xem |

Quyền được kiểm soát 2 lớp: giao diện (ẩn nút) **và** `firestore.rules` (chặn ghi trái phép).

## 6. Kiến trúc "2 chế độ"

App đọc biến `VITE_DATA_BACKEND`:
- `local` — dữ liệu mẫu + đăng nhập demo (dev, không cần Firebase)
- `firestore` — Firebase thật (production)

Nhờ vậy dev/test không phụ thuộc Firebase; khi deploy chỉ đổi biến môi trường.
