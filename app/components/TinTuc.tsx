"use client";

import { useState } from "react";
import Image from "next/image";

import tinTucData from "@/data/tin-tuc.json";

type Tin = { tieuDe: string; moTa: string; href: string; anh: string };
type Nhom = { nhom: string; tin: Tin[] };

const TABS = tinTucData as Nhom[];

export default function TinTuc() {
  const [tab, setTab] = useState(0);

  return (
    <div>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:justify-center sm:px-0">
        {TABS.map((t, i) => (
          <button
            key={t.nhom}
            type="button"
            onClick={() => setTab(i)}
            aria-pressed={tab === i}
            className={`shrink-0 rounded-lg px-5 py-2.5 text-sm font-bold transition ${
              tab === i
                ? "bg-blue-600 text-white"
                : "border border-stone-900/10 bg-white text-stone-500 hover:border-stone-900/25 hover:text-stone-900"
            }`}
          >
            {t.nhom}
          </button>
        ))}
      </div>

      <div key={tab} className="spot-hien mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {TABS[tab].tin.map((tin) => (
          <a
            key={tin.href}
            href={tin.href}
            target="_blank"
            rel="noreferrer"
            className="group flex flex-col"
          >
            <span className="relative block aspect-video w-full overflow-hidden rounded-lg border border-stone-900/10 bg-blue-50">
              {tin.anh ? (
                <Image
                  src={tin.anh}
                  alt=""
                  width={900}
                  height={506}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center font-display text-2xl font-black text-stone-900/20">
                  CÚ ĐẬU
                </span>
              )}
            </span>
            <span className="mt-4 line-clamp-3 font-display text-[17px] font-extrabold leading-snug tracking-[-0.01em] transition group-hover:text-blue-700">
              {tin.tieuDe}
            </span>
            <span className="mt-2 line-clamp-3 text-sm leading-relaxed text-stone-500">{tin.moTa}</span>
            <span className="mt-3 flex items-center gap-1.5 text-sm font-bold text-blue-700">
              Đọc thêm
              <span aria-hidden className="transition group-hover:translate-x-0.5">
                →
              </span>
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
