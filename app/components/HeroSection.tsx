"use client";

import { useEffect, useRef, useState } from "react";

import HeroPrompt from "./HeroPrompt";
import SchoolCarousel from "./SchoolCarousel";

type TinNhan = { tuAi: "bot" | "ban"; noiDung: string };

export default function HeroSection() {
  const [moChat, setMoChat] = useState(false);
  const [nhap, setNhap] = useState("");
  const [dangGo, setDangGo] = useState(false);
  const [tinNhans, setTinNhans] = useState<TinNhan[]>([
    { tuAi: "bot", noiDung: "Chào bạn! Hãy kể về bản thân: môn nào giỏi, môn nào yếu, thích làm gì, tính cách ra sao?" },
  ]);
  const khungRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    khungRef.current?.scrollTo({ top: khungRef.current.scrollHeight, behavior: "smooth" });
  }, [tinNhans, dangGo, moChat]);

  async function gui(e: React.FormEvent) {
    e.preventDefault();
    const text = nhap.trim();
    if (!text || dangGo) return;
    const lichSu: TinNhan[] = [...tinNhans, { tuAi: "ban", noiDung: text }];
    setTinNhans(lichSu);
    setNhap("");
    setDangGo(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: lichSu.map((t) => ({
            role: t.tuAi === "ban" ? "user" : "assistant",
            content: t.noiDung,
          })),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Đã có lỗi xảy ra.");
      setTinNhans((prev) => [...prev, { tuAi: "bot", noiDung: data.reply }]);
    } catch (err) {
      setTinNhans((prev) => [
        ...prev,
        {
          tuAi: "bot",
          noiDung: err instanceof Error ? err.message : "Đã có lỗi xảy ra, vui lòng thử lại.",
        },
      ]);
    } finally {
      setDangGo(false);
    }
  }

  return (
    <div>
      {/* Dãy web tràn mép: mở chat thì mờ dần + thu gọn */}
      <div
        className={`mx-[calc(-50vw+50%)] grid transition-all duration-700 ease-out ${
          moChat ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
        }`}
      >
        <div className="overflow-hidden">
          <SchoolCarousel />
        </div>
      </div>

      {/* Ô nhập hero: là công tắc mở chat, ẩn dần cùng lúc */}
      <div
        className={`mx-auto grid max-w-2xl transition-all duration-500 ${
          moChat ? "mt-0 grid-rows-[0fr] opacity-0" : "mt-10 grid-rows-[1fr] opacity-100"
        }`}
      >
        <div className="overflow-hidden">
          <HeroPrompt khiMo={() => setMoChat(true)} />
        </div>
      </div>

      {/* Khung chat bot: hiện từ từ sau khi dãy web mờ đi */}
      <div
        className={`mx-auto grid max-w-6xl transition-all duration-700 ease-out ${
          moChat
            ? "mt-10 grid-rows-[1fr] translate-y-0 opacity-100 delay-300"
            : "grid-rows-[0fr] translate-y-6 opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900">
            <div className="flex items-center gap-3 border-b border-white/10 px-5 py-3.5">
              <span className="h-2.5 w-2.5 rounded-full bg-zinc-100" />
              <p className="text-sm font-bold">Trợ lý AI</p>
              <span className="text-xs text-zinc-500">đang hoạt động</span>
              <button
                type="button"
                onClick={() => setMoChat(false)}
                aria-label="Đóng chat"
                className="ml-auto rounded-lg px-2.5 py-1 text-lg leading-none text-zinc-500 transition hover:bg-white/5 hover:text-zinc-100"
              >
                ×
              </button>
            </div>

            <div ref={khungRef} className="h-[380px] space-y-3 overflow-y-auto p-5 sm:h-[440px] sm:p-6">
              {tinNhans.map((t, i) => (
                <div key={i} className={`flex ${t.tuAi === "ban" ? "justify-end" : "justify-start"}`}>
                  <p
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      t.tuAi === "ban"
                        ? "bg-zinc-100 text-zinc-950"
                        : "border border-white/10 bg-zinc-800 text-zinc-100"
                    }`}
                  >
                    {t.noiDung}
                  </p>
                </div>
              ))}
              {dangGo && (
                <div className="flex justify-start">
                  <p className="rounded-2xl border border-white/10 bg-zinc-800 px-4 py-3 text-sm text-zinc-400">
                    <span className="animate-pulse">…</span>
                  </p>
                </div>
              )}
            </div>

            <form onSubmit={gui} className="border-t border-white/10 p-3">
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-950 py-1.5 pl-4 pr-1.5 transition focus-within:border-white/30">
                <input
                  value={nhap}
                  onChange={(e) => setNhap(e.target.value)}
                  placeholder="Nhập tin nhắn…"
                  aria-label="Nhập tin nhắn"
                  className="h-10 w-full bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
                />
                <button
                  type="submit"
                  aria-label="Gửi tin nhắn"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-base font-bold text-zinc-950 transition hover:bg-white"
                >
                  →
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
