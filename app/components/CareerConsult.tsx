"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { ApiResult } from "@/lib/types";
import CareerResult from "./CareerResult";

const lopOptions = ["Lớp 6", "Lớp 7", "Lớp 8", "Lớp 9", "Lớp 10", "Lớp 11", "Lớp 12"];

const goiYNhanh = [
  "Mình học lớp 11, giỏi Toán và Tin, yếu Văn. Thích mày mò máy tính, lắp ráp đồ điện tử. Tính kiên trì, thích làm một mình.",
  "Mình học lớp 10, giỏi Văn và Anh, yếu Lý và Hóa. Thích đọc sách, viết lách, thuyết trình. Hay giúp bạn học bài.",
  "Mình học lớp 12, giỏi Sinh và Hóa, yếu Toán. Thích chăm sóc người khác, yêu động vật. Tính cẩn thận, nhẹ nhàng.",
];

const monHocKeywords = [
  "Toán",
  "Ngữ văn",
  "Tiếng Anh",
  "Vật lý",
  "Hóa học",
  "Sinh học",
  "Lịch sử",
  "Địa lý",
  "GDCD",
  "Tin học",
];

const soThichKeywords: { key: string[]; label: string }[] = [
  { key: ["máy tính", "công nghệ", "code", "lập trình", "game", "tin học"], label: "Máy tính, công nghệ" },
  { key: ["sách", "viết", "văn", "blog"], label: "Đọc sách, viết lách" },
  { key: ["vẽ", "thiết kế", "ảnh", "chụp"], label: "Vẽ, tạo hình, chụp ảnh" },
  { key: ["bệnh", "chăm sóc", "giúp người", "y tế"], label: "Chăm sóc người bệnh, người thân" },
  { key: ["thuyết trình", "nói", "mc", "tranh biện"], label: "Thuyết trình, nói trước đám đông" },
  { key: ["lắp", "sửa", "điện tử", "robot", "máy móc"], label: "Lắp ráp, sửa chữa đồ vật" },
  { key: ["cây", "vật nuôi", "động vật", "thú cưng"], label: "Chăm sóc cây trồng, vật nuôi" },
  { key: ["thể thao", "bóng đá", "chạy", "gym"], label: "Thể thao" },
  { key: ["thiên nhiên", "du lịch", "khám phá"], label: "Khám phá thiên nhiên" },
  { key: ["kinh doanh", "bán hàng", "kiếm tiền", "online"], label: "Kinh doanh, bán hàng online" },
  { key: ["nấu ăn", "ẩm thực", "làm bánh"], label: "Nấu ăn, ẩm thực" },
  { key: ["nhạc", "đàn", "hát", "guitar", "piano"], label: "Nghe nhạc, chơi nhạc cụ" },
];

// Tách từ khóa từ đoạn văn tự do để backend cũ vẫn nhận đủ FormData
function trichXuatTuVanBan(text: string) {
  const lower = text.toLowerCase();
  const mon_manh = monHocKeywords.filter((m) => lower.includes(m.toLowerCase()));
  const so_thich = soThichKeywords
    .filter((s) => s.key.some((k) => lower.includes(k)))
    .map((s) => s.label);
  return { mon_manh, mon_yeu: [] as string[], so_thich };
}

export default function CareerConsult() {
  const [lop, setLop] = useState("Lớp 10");
  const [vanBan, setVanBan] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [result, setResult] = useState<ApiResult | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Nhận nội dung gõ từ ô nhập trên hero
  useEffect(() => {
    function onPrompt(e: Event) {
      const text = (e as CustomEvent<string>).detail ?? "";
      if (!text) return;
      setResult(null);
      setError(null);
      setVanBan(text);
      requestAnimationFrame(() => textareaRef.current?.focus({ preventScroll: true }));
    }
    window.addEventListener("hn:prompt", onPrompt);
    return () => window.removeEventListener("hn:prompt", onPrompt);
  }, []);

  const hopLe = useMemo(() => vanBan.trim().length >= 12, [vanBan]);
  const soKyTu = vanBan.trim().length;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!hopLe || loading) return;
    setLoading(true);
    setError(null);
    setStatus(null);

    // Lưu bối cảnh học sinh (Lớp, mô tả) để chat bot biết về ai học sinh
    try {
      localStorage.setItem("hn:student-context", JSON.stringify({ lop, vanBan: vanBan.trim() }));
    } catch {
      // lưu không thành công — chat vẫn chạy, chỉ mất lịch sử thôi
    }

    let gotResult = false;
    try {
      const { mon_manh, mon_yeu, so_thich } = trichXuatTuVanBan(vanBan);
      const response = await fetch("/api/consult", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lop,
          mon_manh,
          mon_yeu,
          so_thich,
          tinh_cach: vanBan.trim(),
          stream: true,
        }),
      });

      const contentType = response.headers.get("content-type") ?? "";
      if (!response.body || !contentType.includes("text/event-stream")) {
        // Old JSON format — read the whole result at once.
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Đã có lỗi xảy ra.");
        setResult(data as ApiResult);
        gotResult = true;
        setTimeout(() => {
          document.getElementById("ket-qua")?.scrollIntoView({ behavior: "smooth" });
        }, 100);
        return;
      }

      // SSE: live status lines, then the final { r: ... } event.
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
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
          let ev: { s?: string; r?: ApiResult; e?: string };
          try {
            ev = JSON.parse(payload);
          } catch {
            continue;
          }
          if (typeof ev.s === "string") {
            setStatus(ev.s);
          } else if (typeof ev.e === "string") {
            throw new Error(ev.e);
          } else if (ev.r && typeof ev.r === "object") {
            setResult(ev.r);
            gotResult = true;
            setTimeout(() => {
              document.getElementById("ket-qua")?.scrollIntoView({ behavior: "smooth" });
            }, 100);
            break outer;
          }
        }
      }
      try {
        reader.cancel();
      } catch {
        // ignore
      }
      if (!gotResult) throw new Error("Đã có lỗi xảy ra, vui lòng thử lại.");
    } catch (err) {
      if (!gotResult) {
        setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra.");
      }
    } finally {
      setLoading(false);
      setStatus(null);
    }
  }

  function lamLai() {
    setResult(null);
    setError(null);
    setVanBan("");
  }

  // ---------- MÀN HÌNH KẾT QUẢ ----------
  if (result) {
    return (
      <div id="ket-qua" className="mx-auto w-full max-w-3xl space-y-4">
        <CareerResult result={result} tieuDe={`Kết quả · ${lop}`} />

        <div className="flex flex-wrap gap-3 pt-1">
          <button
            onClick={lamLai}
            className="rounded-xl bg-orange-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-500"
          >
            Viết mô tả khác
          </button>
          <a
            href="#trai-nghiem"
            className="rounded-xl border border-stone-900/15 px-6 py-3 text-sm font-semibold text-stone-600 transition hover:bg-stone-900/5"
          >
            Về đầu trang
          </a>
        </div>
      </div>
    );
  }

  // ---------- MÀN HÌNH NHẬP LIỆU ----------
  return (
    <div className="mx-auto w-full max-w-3xl">
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-stone-900/10 bg-white p-6 sm:p-8"
      >
        <div>
          <p className="text-sm font-bold">
            1. Lớp đang học <span className="text-stone-500">(bắt buộc)</span>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {lopOptions.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLop(l)}
                aria-pressed={lop === l}
                className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
                  lop === l
                    ? "bg-stone-900 text-[#faf4e9]"
                    : "border border-stone-900/10 text-stone-500 hover:border-stone-900/25 hover:text-stone-900"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-7">
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor="mo-ta" className="text-sm font-bold">
              2. Mô tả về bản thân <span className="text-stone-500">(bắt buộc)</span>
            </label>
            <span className={`text-xs ${hopLe ? "text-zinc-100" : "text-stone-500"}`}>
              {soKyTu}/12 ký tự tối thiểu
            </span>
          </div>
          <p className="mt-1 text-[13px] leading-relaxed text-stone-500">
            Viết 2–4 câu: môn nào giỏi, môn nào yếu, thích làm gì, tính cách ra sao.
          </p>
          <textarea
            id="mo-ta"
            ref={textareaRef}
            value={vanBan}
            onChange={(e) => setVanBan(e.target.value)}
            rows={5}
            maxLength={800}
            placeholder="Mình học lớp 11, giỏi Toán với Tin, yếu Văn. Thích mày mò máy tính, lắp ráp đồ điện tử. Tính kiên trì, thích làm việc một mình hơn làm nhóm."
            className="mt-3 w-full resize-none rounded-xl border border-stone-900/10 bg-[#faf4e9] p-4 text-[15px] leading-relaxed text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-orange-500/60"
          />
          <div className="mt-4">
            <p className="text-xs font-semibold text-stone-500">Chưa biết viết gì, dùng mẫu sau:</p>
            <div className="mt-2 space-y-2">
              {goiYNhanh.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setVanBan(g)}
                  className="block w-full rounded-xl border border-stone-900/10 bg-[#faf4e9] px-4 py-3 text-left text-[13px] leading-relaxed text-stone-500 transition hover:border-orange-400/60 hover:text-stone-800"
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <p className="mt-5 rounded-xl border border-red-500/30 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!hopLe || loading}
          className="mt-6 w-full rounded-xl bg-orange-600 px-6 py-3.5 text-[15px] font-bold text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? "Đang phân tích, vui lòng chờ…" : "Xem định hướng của mình"}
        </button>
        {status && (
          <p aria-live="polite" className="mt-3 text-center text-[13px] font-semibold text-stone-500">
            {status}
          </p>
        )}
        <p className="mt-3 text-center text-xs leading-relaxed text-stone-500">
          Phân tích thường mất 30–90 giây. Kết quả chỉ mang tính tham khảo.
        </p>
      </form>
    </div>
  );
}
