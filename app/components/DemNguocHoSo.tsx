"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import { LICH_THI_2027 } from "@/lib/lich-thi";

// Mốc thi đầu tiên trong lịch dự kiến 2027 (dùng chung với ExamCountdown).
const MOC_THI = Math.min(...LICH_THI_2027.map((m) => m.at));

function pad(n: number, doDai = 2): string {
  return String(Math.max(0, n)).padStart(doDai, "0");
}

export default function DemNguocHoSo() {
  // Cờ mount giống ExamCountdown: HTML server và lần render đầu của client
  // đều là placeholder nên không lệch hydration.
  const daMount = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = daMount ? Math.max(0, MOC_THI - now) : 0;

  const o: [string, string][] = daMount
    ? [
        [pad(Math.floor(diff / 86_400_000), 3), "ngày"],
        [pad(Math.floor((diff % 86_400_000) / 3_600_000)), "giờ"],
        [pad(Math.floor((diff % 60_000) / 1000)), "giây"],
      ]
    : [
        ["---", "ngày"],
        ["--", "giờ"],
        ["--", "giây"],
      ];

  return (
    <div className="mt-3 grid grid-cols-3 divide-x divide-stone-900/10 border-t border-stone-900/10 pt-3 text-center">
      {o.map(([so, nhan]) => (
        <div key={nhan}>
          <p className="so-bang font-display text-base font-extrabold leading-none">{so}</p>
          <p className="mt-1.5 text-[11px] font-semibold text-stone-400">{nhan}</p>
        </div>
      ))}
    </div>
  );
}
