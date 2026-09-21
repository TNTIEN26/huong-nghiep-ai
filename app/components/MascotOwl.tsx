// Linh vật cú đội mũ tốt nghiệp — vẽ tay bằng SVG, tone cam ấm.
// Mắt tự chớp, cả người bay nhẹ (keyframes trong globals.css).
export default function MascotOwl({ className = "h-24 w-24" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 130" className={`bob-nhe ${className}`} role="img" aria-label="Linh vật cú">
      {/* tai */}
      <polygon points="28,34 20,10 44,26" fill="#ea580c" />
      <polygon points="92,34 100,10 76,26" fill="#ea580c" />
      {/* thân */}
      <ellipse cx="60" cy="72" rx="42" ry="48" fill="#f59e0b" />
      {/* bụng */}
      <ellipse cx="60" cy="88" rx="26" ry="30" fill="#fde68a" />
      {/* cánh */}
      <ellipse cx="22" cy="76" rx="10" ry="22" fill="#ea580c" transform="rotate(12 22 76)" />
      <ellipse cx="98" cy="76" rx="10" ry="22" fill="#ea580c" transform="rotate(-12 98 76)" />
      {/* mắt */}
      <g className="mat-chop">
        <circle cx="44" cy="58" r="15" fill="#fffbeb" />
        <circle cx="76" cy="58" r="15" fill="#fffbeb" />
        <circle cx="46" cy="60" r="6.5" fill="#1c1917" />
        <circle cx="74" cy="60" r="6.5" fill="#1c1917" />
        <circle cx="48" cy="57.5" r="2.2" fill="#fffbeb" />
        <circle cx="76" cy="57.5" r="2.2" fill="#fffbeb" />
      </g>
      {/* mỏ */}
      <polygon points="60,68 52,76 68,76" fill="#ea580c" />
      {/* chân */}
      <rect x="46" y="116" width="9" height="8" rx="4" fill="#ea580c" />
      <rect x="65" y="116" width="9" height="8" rx="4" fill="#ea580c" />
      {/* mũ tốt nghiệp */}
      <g transform="rotate(-6 60 22)">
        <rect x="30" y="8" width="60" height="10" rx="2" fill="#1c1917" />
        <polygon points="60,4 24,14 60,24 96,14" fill="#292524" />
        <rect x="72" y="14" width="3" height="14" fill="#fbbf24" />
        <circle cx="73.5" cy="30" r="4" fill="#fbbf24" />
      </g>
    </svg>
  );
}
