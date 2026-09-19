"use client";

import { useState } from "react";

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
    <form onSubmit={go}>
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-zinc-900 py-2.5 pl-6 pr-2.5 transition hover:border-white/30 hover:shadow-[0_0_28px_-8px_rgba(255,255,255,0.35)] focus-within:border-white/40 focus-within:shadow-[0_0_32px_-6px_rgba(255,255,255,0.4)]">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => khiMo?.()}
          placeholder="Mô tả bản thân bạn… VD: giỏi Toán, yếu Văn, thích máy tính"
          aria-label="Mô tả bản thân bạn"
          className="h-14 w-full bg-transparent text-base text-zinc-100 outline-none placeholder:text-zinc-600"
        />
        <button
          type="submit"
          aria-label="Gửi mô tả"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-xl font-bold text-zinc-950 transition hover:bg-white"
        >
          →
        </button>
      </div>
      <p className="mt-3 text-xs text-zinc-600">
        Mô tả càng chi tiết, gợi ý càng chính xác. Nhấn Enter để tiếp tục.
      </p>
    </form>
  );
}
