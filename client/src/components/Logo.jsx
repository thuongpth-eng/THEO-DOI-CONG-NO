/* Logo HP CONS — vẽ lại theo nhận diện: cột nhà xám, mái xanh lá, vòng elip xanh dương */
export default function Logo({ size = 34 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="HP CONS"
    >
      <ellipse cx="50" cy="64" rx="45" ry="21" stroke="#0969A7" strokeWidth="6" />
      <rect x="26" y="30" width="11" height="46" fill="#4B4F55" />
      <rect x="41" y="20" width="11" height="56" fill="#4B4F55" />
      <path d="M56 22h16a13 13 0 0 1 0 26h-8v28h-8V22z" fill="#4B4F55" />
      <path d="M26 28 37 16v12H26z" fill="#60BB46" />
      <path d="M41 18 52 6v12H41z" fill="#60BB46" />
    </svg>
  );
}
