"use client";

import { useEffect, useState } from "react";

// Công tắc sáng/tối dạng icon mặt trời/mặt trăng, lưu vào localStorage.
function MatTroi() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="4.5" fill="currentColor" stroke="none" />
      <line x1="12" y1="1.5" x2="12" y2="5" />
      <line x1="12" y1="19" x2="12" y2="22.5" />
      <line x1="1.5" y1="12" x2="5" y2="12" />
      <line x1="19" y1="12" x2="22.5" y2="12" />
      <line x1="4.6" y1="4.6" x2="7" y2="7" />
      <line x1="17" y1="17" x2="19.4" y2="19.4" />
      <line x1="4.6" y1="19.4" x2="7" y2="17" />
      <line x1="17" y1="7" x2="19.4" y2="4.6" />
    </svg>
  );
}

function MatTrang() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a.8.8 0 0 0-1-1A10 10 0 1 0 21.5 15.5a.8.8 0 0 0-1-1Z" />
    </svg>
  );
}

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
      className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${
        toi
          ? "border-white/20 bg-[#0b1a30] text-orange-400"
          : "border-stone-900/15 bg-white text-orange-500"
      }`}
    >
      {toi ? <MatTroi /> : <MatTrang />}
    </button>
  );
}
