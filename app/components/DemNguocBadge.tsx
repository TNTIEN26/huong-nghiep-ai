"use client";

import { useSyncExternalStore } from "react";

import { soNgayConLai } from "@/lib/lich-thi";

// Huy hiệu "Còn N ngày tới kỳ thi THPT 2027" ở trang chủ.
// Số ngày tính trong store (ngoài render) để qua được rule purity;
// server render "…" rồi client cập nhật sau (tránh hydration mismatch).
// Đồng hồ tick mỗi giờ là đủ vì đơn vị hiển thị là ngày.
function subscribe(cb: () => void): () => void {
  const id = setInterval(cb, 3_600_000);
  return () => clearInterval(id);
}

function getSnapshot(): number {
  return soNgayConLai(Date.now());
}

export default function DemNguocBadge() {
  const ngay = useSyncExternalStore(subscribe, getSnapshot, () => -1);
  const label = ngay < 0 ? "Còn … ngày" : `Còn ${ngay} ngày`;
  return (
    <div
      className="bob-nhe absolute bottom-6 left-10 rounded-2xl border border-stone-900/10 bg-white/90 px-4 py-2.5 text-left shadow-lg backdrop-blur"
      style={{ animationDelay: "3.2s" }}
    >
      <p className="text-xs font-bold">{label}</p>
      <p className="text-[11px] text-stone-500">Tới kỳ thi THPT 2027</p>
    </div>
  );
}
