// Đồ dùng học tập trong suốt bay lơ lửng khắp nền web.
// Vẽ tay bằng SVG, không tương tác, không ảnh hưởng nội dung.
const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function ButChi() {
  return (
    <svg viewBox="0 0 60 160" className="h-full w-full">
      <g transform="rotate(24 30 80)" {...stroke}>
        <rect x="18" y="8" width="24" height="96" rx="3" />
        <polygon points="18,104 42,104 30,142" />
        <line x1="18" y1="30" x2="42" y2="30" />
        <circle cx="30" cy="134" r="2.5" />
      </g>
    </svg>
  );
}

function Thuoc() {
  return (
    <svg viewBox="0 0 160 60" className="h-full w-full">
      <g transform="rotate(-14 80 30)" {...stroke}>
        <rect x="6" y="14" width="148" height="32" rx="4" />
        {[24, 40, 56, 72, 88, 104, 120, 136].map((x, i) => (
          <line key={x} x1={x} y1="14" x2={x} y2={i % 2 ? 24 : 30} />
        ))}
      </g>
    </svg>
  );
}

function MayTinh() {
  return (
    <svg viewBox="0 0 90 120" className="h-full w-full">
      <g transform="rotate(10 45 60)" {...stroke}>
        <rect x="8" y="6" width="74" height="108" rx="10" />
        <rect x="18" y="16" width="54" height="22" rx="3" />
        {[0, 1, 2].map((r) =>
          [0, 1, 2].map((c) => (
            <circle key={`${r}${c}`} cx={26 + c * 19} cy={56 + r * 18} r="4" />
          )),
        )}
      </g>
    </svg>
  );
}

function QuyenSach() {
  return (
    <svg viewBox="0 0 120 90" className="h-full w-full">
      <g transform="rotate(-8 60 45)" {...stroke}>
        <rect x="14" y="10" width="92" height="70" rx="4" />
        <line x1="34" y1="10" x2="34" y2="80" />
        <line x1="46" y1="24" x2="94" y2="24" />
        <line x1="46" y1="38" x2="94" y2="38" />
        <line x1="46" y1="52" x2="80" y2="52" />
      </g>
    </svg>
  );
}

function QuyenVo() {
  return (
    <svg viewBox="0 0 100 120" className="h-full w-full">
      <g transform="rotate(12 50 60)" {...stroke}>
        <rect x="22" y="8" width="66" height="104" rx="6" />
        {[28, 48, 68, 88].map((y) => (
          <circle key={y} cx="22" cy={y} r="5" />
        ))}
        <line x1="38" y1="30" x2="76" y2="30" />
        <line x1="38" y1="46" x2="76" y2="46" />
        <line x1="38" y1="62" x2="66" y2="62" />
      </g>
    </svg>
  );
}

function DenBan() {
  return (
    <svg viewBox="0 0 120 130" className="h-full w-full">
      <g transform="rotate(-6 60 65)" {...stroke}>
        <polygon points="30,10 90,10 76,52 44,52" />
        <line x1="60" y1="52" x2="60" y2="100" />
        <line x1="40" y1="112" x2="80" y2="112" />
        <line x1="60" y1="100" x2="40" y2="112" />
        <line x1="60" y1="100" x2="80" y2="112" />
      </g>
    </svg>
  );
}

function Compa() {
  return (
    <svg viewBox="0 0 100 120" className="h-full w-full">
      <g transform="rotate(16 50 60)" {...stroke}>
        <circle cx="50" cy="22" r="7" />
        <line x1="46" y1="28" x2="28" y2="108" />
        <line x1="54" y1="28" x2="72" y2="108" />
        <line x1="38" y1="66" x2="62" y2="66" />
      </g>
    </svg>
  );
}

const items = [
  { C: ButChi, cls: "left-[3%] top-[12%] h-36 w-16 text-teal-700/20 dark:text-teal-200/15", t: "7s", d: "0s", x: "12deg" },
  { C: Thuoc, cls: "right-[4%] top-[9%] h-16 w-44 text-sky-800/20 dark:text-sky-300/15", t: "8s", d: "1s", x: "-8deg" },
  { C: MayTinh, cls: "left-[6%] top-[46%] h-32 w-24 text-emerald-700/15 dark:text-emerald-200/10", t: "9s", d: "0.5s", x: "6deg" },
  { C: QuyenSach, cls: "right-[5%] top-[42%] hidden w-40 text-teal-700/15 dark:text-teal-100/10 sm:block", t: "7.5s", d: "2s", x: "-10deg" },
  { C: QuyenVo, cls: "left-[10%] bottom-[8%] h-32 w-28 text-sky-800/15 dark:text-sky-200/10", t: "8.5s", d: "1.2s", x: "8deg" },
  { C: DenBan, cls: "right-[9%] bottom-[10%] h-36 w-32 text-emerald-700/15 dark:text-emerald-100/10", t: "9.5s", d: "0.3s", x: "-6deg" },
  { C: Compa, cls: "left-[45%] top-[4%] hidden h-28 w-24 text-cyan-800/15 dark:text-cyan-200/10 lg:block", t: "8s", d: "2.5s", x: "10deg" },
  { C: ButChi, cls: "right-[30%] bottom-[5%] hidden h-28 w-12 text-teal-700/15 dark:text-teal-200/10 md:block", t: "7s", d: "1.8s", x: "-14deg" },
];

export default function FloatingSupplies() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {items.map(({ C, cls, t, d, x }, i) => (
        <div
          key={i}
          className={`bob-nhe absolute ${cls}`}
          style={{ animationDuration: t, animationDelay: d, ["--xoay" as string]: x }}
        >
          <C />
        </div>
      ))}
    </div>
  );
}
