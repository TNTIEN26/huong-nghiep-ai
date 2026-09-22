"use client";

import { useState } from "react";

import MascotOwl from "./MascotOwl";

export default function HeroPrompt({ khiMo }: { khiMo?: () => void }) {
  const [value, setValue] = useState("");

  function go(e: React.FormEvent) {
    e.preventDefault();
    const text = value.trim();
    if (text.length < 2) return;
    // Đưa nội dung xuống form bên dưới (CareerConsult lắng nghe sự kiện này)
    window.dispatchEvent(new CustomEvent("hn:prompt", { detail: text }));
    document.getElementById("trai-nghiem")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <form onSubmit={go} className="relative">
      {/* Cú đậu trên ô nhập */}
      <MascotOwl className="pointer-events-none absolute -top-[4.7rem] right-4 h-20 w-20 sm:right-8" />
      <div className="flex items-center gap-3 rounded-2xl border border-stone-900/10 bg-white py-2.5 pl-6 pr-2.5 shadow-[0_18px_50px_-20px_rgba(234,88,12,0.35)] transition hover:border-orange-400/60 hover:shadow-[0_0_28px_-8px_rgba(234,88,12,0.4)] focus-within:border-orange-500/70 focus-within:shadow-[0_0_32px_-6px_rgba(234,88,12,0.45)] dark:border-white/10 dark:bg-[#0b1a30] dark:hover:border-orange-400/60 dark:hover:shadow-[0_0_28px_-8px_rgba(234,88,12,0.45)] dark:focus-within:border-orange-500/70 dark:focus-within:shadow-[0_0_32px_-6px_rgba(234,88,12,0.5)]">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => khiMo?.()}
          placeholder="Mô tả bản thân bạn… VD: giỏi Toán, yếu Văn, thích máy tính"
          aria-label="Mô tả bản thân bạn"
          className="h-14 w-full bg-transparent text-base text-stone-900 outline-none placeholder:text-stone-400 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
        <button
          type="submit"
          aria-label="Gửi mô tả"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-600 text-xl font-bold text-white transition hover:bg-orange-500"
        >
          →
        </button>
      </div>
      <p className="mt-3 text-xs text-stone-500 dark:text-slate-400">
        Mô tả càng chi tiết, gợi ý càng chính xác. Nhấn Enter để tiếp tục.
      </p>
    </form>
  );
}
