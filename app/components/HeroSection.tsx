"use client";

import Link from "next/link";

import MascotOwl from "./MascotOwl";

// Hero trang chủ: nút bắt đầu chat với Cú Đậu.
export default function HeroSection() {
  return (
    <div>

      {/* Nút bắt đầu trò chuyện với linh vật */}
      <div className="mx-auto mt-10 max-w-2xl">
        <Link
          href="/huong-nghiep"
          className="group flex items-center gap-4 rounded-2xl border border-stone-900/10 bg-white p-4 text-left shadow-[0_18px_50px_-20px_rgba(234,88,12,0.35)] transition hover:border-orange-400/60 hover:shadow-[0_0_28px_-8px_rgba(234,88,12,0.4)]"
        >
          <MascotOwl className="h-16 w-16 shrink-0 transition group-hover:scale-110" />
          <span className="min-w-0 flex-1">
            <span className="block text-base font-extrabold text-stone-900">Hãy bắt đầu</span>
            <span className="mt-0.5 block truncate text-sm text-stone-500 sm:whitespace-normal">
              Trò chuyện với Cú Đậu để hiểu rõ định hướng tương lai của bạn
            </span>
          </span>
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-600 text-xl font-bold text-white transition group-hover:bg-orange-500">
            →
          </span>
        </Link>
      </div>
    </div>
  );
}
