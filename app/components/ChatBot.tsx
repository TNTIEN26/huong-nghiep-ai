"use client";

import { useEffect, useRef, useState } from "react";
// Render câu trả lời AI dạng Markdown (react-markdown + remark-gfm)
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type TinNhan = { tuAi: "bot" | "ban"; noiDung: string; id?: string };

const KH_HISTORY = "hn:chat-history";
const KH_CONTEXT = "hn:student-context";
const KH_DRAFT = "hn:chat-draft";
const MAX_TIN = 30; // giới hạn MAX_MESSAGES bên server

// Đọc lịch sử chat từ localStorage — không mất khi refresh trang
function restoreHistory(): TinNhan[] {
  try {
    const raw = localStorage.getItem(KH_HISTORY);
    const arr = raw ? JSON.parse(raw) : null;
    if (!Array.isArray(arr) || arr.length === 0) return [];
    return arr
      .filter(
        (t): t is TinNhan =>
          typeof t === "object" &&
          t !== null &&
          (t.tuAi === "bot" || t.tuAi === "ban") &&
          typeof t.noiDung === "string" &&
          t.noiDung.trim() !== "",
      )
      .slice(-MAX_TIN);
  } catch {
    return [];
  }
}

// Đọc thông tin học sinh (lưu từ form tư vấn khi đã điền) — gắn vào prompt chat
function readStudentContext(): string {
  try {
    const raw = localStorage.getItem(KH_CONTEXT);
    if (!raw) return "";
    const obj: unknown = JSON.parse(raw);
    if (typeof obj !== "object" || obj === null) return "";
    const data = obj as Record<string, unknown>;
    const lop = typeof data.lop === "string" ? data.lop.trim() : "";
    const moTa = typeof data.vanBan === "string" ? data.vanBan.trim() : "";
    if (!lop && !moTa) return "";
    return [
      lop ? `Học sinh đang học: ${lop}.` : "",
      moTa ? `Mô tả bản thân: ${moTa}` : "",
    ]
      .filter(Boolean)
      .join(" ");
  } catch {
    return "";
  }
}

// Khung chat AI full màn hình — logic giữ nguyên từ HeroSection.
export default function ChatBot() {
  const [nhap, setNhap] = useState("");
  const [dangGo, setDangGo] = useState(false);
  const [tinNhans, setTinNhans] = useState<TinNhan[]>(() => {
    // Restore chat history from localStorage without setState-in-effect
    // (restoreHistory returns [] when localStorage is unavailable, e.g. SSR).
    const saved = restoreHistory();
    return saved.length > 0
      ? saved
      : [
          {
            tuAi: "bot",
            noiDung: "Chào bạn! Hãy kể về bản thân: môn nào giỏi, môn nào yếu, thích làm gì, tính cách ra sao?",
          },
        ];
  });
  const khungRef = useRef<HTMLDivElement>(null);

  // Nhận bản nháp gõ từ trang chủ gửi sang
  useEffect(() => {
    try {
      const draft = localStorage.getItem(KH_DRAFT);
      if (draft) {
        setNhap(draft);
        localStorage.removeItem(KH_DRAFT);
      }
    } catch {
      // storage not available — ignore
    }
  }, []);

  useEffect(() => {
    khungRef.current?.scrollTo({ top: khungRef.current.scrollHeight, behavior: "smooth" });
  }, [tinNhans, dangGo]);

  // Lưu tự động lịch sử chat (giới hạn 30 tin)
  useEffect(() => {
    try {
      localStorage.setItem(KH_HISTORY, JSON.stringify(tinNhans.slice(-MAX_TIN)));
    } catch {
      // storage not available — ignore
    }
  }, [tinNhans]);

  function xoaLichSu() {
    setTinNhans([]);
    try {
      localStorage.removeItem(KH_HISTORY);
    } catch {
      // storage not available — ignore
    }
  }
  async function gui(e: React.FormEvent) {
    e.preventDefault();
    const text = nhap.trim();
    if (!text || dangGo) return;
    const lichSu: TinNhan[] = [...tinNhans, { tuAi: "ban", noiDung: text }];
    setTinNhans(lichSu);
    setNhap("");
    setDangGo(true);
    const studentContext = readStudentContext();

    // Show an empty bot bubble right away, then fill it token by token.
    const msgId = `s${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setTinNhans((prev) => [...prev, { tuAi: "bot", noiDung: "", id: msgId }]);
    const update = (noiDung: string) =>
      setTinNhans((prev) => prev.map((t) => (t.id === msgId ? { ...t, noiDung } : t)));

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: lichSu.slice(-MAX_TIN).map((t) => ({
            role: t.tuAi === "ban" ? "user" : "assistant",
            content: t.noiDung,
          })),
          ...(studentContext ? { context: studentContext } : {}),
          stream: true,
        }),
      });

      const contentType = response.headers.get("content-type") ?? "";
      if (!response.body || !contentType.includes("text/event-stream")) {
        // Old JSON format (e.g. non-streaming servers) — plain single reply.
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Đã có lỗi xảy ra.");
        update((data as { reply?: string }).reply ?? "Trợ lý AI không phản hồi.");
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      let buf = "";
      outer: while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, idx).trim();
          buf = buf.slice(idx + 1);
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload) continue;
          let ev: { d?: string; e?: string; done?: boolean };
          try {
            ev = JSON.parse(payload);
          } catch {
            continue;
          }
          if (typeof ev.d === "string" && ev.d) {
            acc += ev.d;
            setDangGo(false);
            update(acc);
          } else if (typeof ev.e === "string") {
            throw new Error(ev.e);
          } else if (ev.done === true) {
            break outer;
          }
        }
      }
      try {
        reader.cancel();
      } catch {
        // ignore
      }
      if (!acc.trim()) update("Trợ lý AI không phản hồi. Hãy thử lại.");
    } catch (err) {
      update(
        `⚠️ ${err instanceof Error ? err.message : "Đã có lỗi xảy ra, vui lòng thử lại."}`,
      );
    } finally {
      setDangGo(false);
    }
  }

  return (
    <div className="flex h-[calc(100dvh-16rem)] min-h-[420px] flex-col overflow-hidden rounded-2xl border border-stone-900/10 bg-white shadow-[0_24px_70px_-30px_rgba(234,88,12,0.4)]">
      <div className="flex items-center gap-3 border-b border-stone-900/10 px-5 py-3.5">
        <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
        <p className="text-sm font-bold">Trợ lý AI</p>
        <span className="text-xs text-stone-500">đang hoạt động</span>
        <button
          type="button"
          onClick={xoaLichSu}
          aria-label="Xóa lịch sử chat"
          className="ml-auto rounded-lg px-2.5 py-1 text-xs font-semibold text-stone-500 transition hover:bg-stone-900/5 hover:text-stone-900"
        >
          Xóa lịch sử
        </button>
      </div>

      <div ref={khungRef} className="flex-1 space-y-3 overflow-y-auto p-5 sm:p-6">
        {tinNhans.map((t, i) => (
          <div key={`${t.tuAi}-${i}`} className={`flex ${t.tuAi === "ban" ? "justify-end" : "justify-start"}`}>
            {t.tuAi === "ban" ? (
              <p className="max-w-[85%] rounded-2xl bg-stone-900 px-4 py-2.5 text-sm leading-relaxed text-[#faf4e9]">
                {t.noiDung}
              </p>
            ) : (
              <div className="chat-md max-w-[85%] rounded-2xl border border-stone-900/10 bg-orange-50 px-4 py-2.5 text-sm leading-relaxed text-stone-900">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{t.noiDung}</ReactMarkdown>
              </div>
            )}
          </div>
        ))}
        {dangGo && (
          <div className="flex justify-start">
            <p className="rounded-2xl border border-stone-900/10 bg-orange-50 px-4 py-3 text-sm text-stone-500">
              <span className="animate-pulse">…</span>
            </p>
          </div>
        )}
      </div>

      <form onSubmit={gui} className="border-t border-stone-900/10 p-3">
        <div className="flex items-center gap-2 rounded-xl border border-stone-900/10 bg-[#faf4e9] py-1.5 pl-4 pr-1.5 transition focus-within:border-orange-500/60">
          <input
            value={nhap}
            maxLength={2000}
            onChange={(e) => setNhap(e.target.value)}
            placeholder="Nhập tin nhắn…"
            aria-label="Nhập tin nhắn"
            className="h-10 w-full bg-transparent text-sm text-stone-900 outline-none placeholder:text-stone-400"
          />
          <button
            type="submit"
            aria-label="Gửi tin nhắn"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-600 text-base font-bold text-white transition hover:bg-orange-500"
          >
            →
          </button>
        </div>
        <p className="mt-1.5 text-[11px] leading-snug text-stone-500">
          Trợ lý AI có sai sót — kết quả chỉ mang tính tham khảo, không thay thế tư vấn trực tiếp từ thầy cô.
        </p>
      </form>
    </div>
  );
}
