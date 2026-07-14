/* Logo HP CONS — dùng file ảnh thật (public/logo.png). size = chiều cao (px). */
export default function Logo({ size = 34, className = "" }) {
  return (
    <img
      src="/logo.png"
      alt="HP CONS"
      style={{ height: size, width: "auto" }}
      className={`select-none object-contain ${className}`}
      draggable={false}
    />
  );
}
