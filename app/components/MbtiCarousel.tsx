"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";

import { MBTI_TYPES } from "@/lib/mbti";

export default function MbtiCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  function buocNhay(): number {
    const el = trackRef.current;
    if (!el) return 180;
    const card = el.querySelector<HTMLElement>("[data-card]");
    return card ? card.offsetWidth + 12 : 180;
  }

  function cuon(dir: number) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * buocNhay() * 2, behavior: "smooth" });
  }

  function den(index: number) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: index * buocNhay(), behavior: "smooth" });
  }

  function capNhatActive() {
    const el = trackRef.current;
    if (!el) return;
    const step = buocNhay();
    const index = Math.round(el.scrollLeft / step);
    setActive(Math.max(0, Math.min(MBTI_TYPES.length - 1, index)));
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Xem nhóm tính cách trước"
        onClick={() => cuon(-1)}
        className="absolute -left-1 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-stone-900/10 bg-white text-xl font-bold text-stone-600 shadow-sm transition hover:border-blue-300 hover:text-blue-700 sm:-left-3"
      >
        ‹
      </button>

      <div
        ref={trackRef}
        onScroll={capNhatActive}
        className="khong-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-1 py-2"
      >
        {MBTI_TYPES.map((t) => (
          <Link
            key={t.code}
            data-card
            href={`/mbti/${t.code.toLowerCase()}`}
            className="group relative aspect-[4/5] w-[150px] shrink-0 snap-start overflow-hidden rounded-2xl p-4 text-white shadow-sm ring-1 ring-black/5 transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:w-[170px] lg:w-[190px]"
            style={{ backgroundImage: `linear-gradient(150deg, ${t.mau[0]}, ${t.mau[1]})` }}
          >
            <Image
              src={t.hinh}
              alt={t.code}
              fill
              sizes="(max-width: 640px) 150px, (max-width: 1024px) 170px, 190px"
              className="object-cover transition duration-300 group-hover:scale-105"
            />
            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 via-black/20 to-transparent"
            />
            <div className="absolute inset-x-4 bottom-4">
              <p className="font-display text-2xl font-extrabold tracking-tight drop-shadow-sm">{t.code}</p>
              <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-white/90">
                {t.ten}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <button
        type="button"
        aria-label="Xem nhóm tính cách tiếp theo"
        onClick={() => cuon(1)}
        className="absolute -right-1 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-stone-900/10 bg-white text-xl font-bold text-stone-600 shadow-sm transition:hover:border-blue-300 hover:text-blue-700 sm:-right-3"
      >
        ›
      </button>

      <div className="mt-4 flex flex-wrap justify-center gap-1.5">
        {MBTI_TYPES.map((t, index) => (
          <button
            key={t.code}
            type="button"
            aria-label={`Xem ${t.code} — ${t.ten}`}
            onClick={() => den(index)}
            className={`h-2 rounded-full transition-all ${index === active ? "w-5 bg-blue-600" : "w-2 bg-stone-300 hover:bg-stone-400"}`}
          />
        ))}
      </div>
    </div>
  );
}