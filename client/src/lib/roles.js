// 5 vai trò + quyền hạn (theo app cũ HPCons).
export const ROLES = {
  tgd: { key: "tgd", name: "Tổng Giám đốc", canEdit: false, admin: true },
  ptgd: { key: "ptgd", name: "Phó Tổng Giám đốc", canEdit: false, admin: true },
  kt: { key: "kt", name: "Kế toán", canEdit: true, admin: false },
  pm: { key: "pm", name: "PM (Quản lý dự án)", canEdit: true, admin: false },
  kd: { key: "kd", name: "Kinh doanh / QS", canEdit: false, admin: false },
};

export const roleName = (r) => ROLES[r]?.name || "Người dùng";
export const canEdit = (r) => !!ROLES[r]?.canEdit;
export const isAdmin = (r) => !!ROLES[r]?.admin;

// Tài khoản demo cho chế độ chạy thử (local). Production dùng Firebase Auth.
export const DEMO_USERS = [
  { username: "thuong", password: "123456", name: "Phạm Thị Hồng Thương", role: "kt" },
  { username: "tgd", password: "123456", name: "Tổng Giám đốc", role: "tgd" },
  { username: "ptgd", password: "123456", name: "Phó Tổng Giám đốc", role: "ptgd" },
  { username: "pm", password: "123456", name: "Trưởng phòng Dự án", role: "pm" },
  { username: "kd", password: "123456", name: "Phòng Kinh doanh", role: "kd" },
];
