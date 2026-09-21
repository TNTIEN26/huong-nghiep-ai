"use client";

import { useEffect, useState } from "react";

// Công tắc sáng/tối: lưu vào localStorage, nhớ lần sau mở lại.
export default function ThemeToggle() {
  const [toi, setToi] = useState(false);

  useEffect(() => {
    setToi(document.documentElement.classList.contains("dark"));
  }, []);

  function doi() {
    const m = !toi;
    setToi(m);
    document.documentElement.classList.toggle("dark", m);
    try {
      localStorage.setItem("hn-theme", m ? "dark" : "light");
    } catch {
      // storage không dùng được — bỏ qua
    }
  }

  return (
    <button
      type="button"
      onClick={doi}
      aria-label={toi ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
      aria-pressed={toi}
      title={toi ? "Chế độ sáng" : "Chế độ tối"}
      className={`flex h-7 w-[3.4rem] items-center rounded-full border px-1 transition ${
        toi ? "justify-end border-white/20 bg-[#0b1a30]" : "justify-start border-stone-900/15 bg-white"
      }`}
    >
      <span
        className={`h-5 w-5 rounded-full transition ${
          toi
            ? "bg-gradient-to-br from-[#3cdf5f] to-[#00a0dd]"
            : "bg-gradient-to-br from-amber-300 to-orange-500"
        }`}
      />
    </button>
  );
}
