"use client";

import { useEffect, useRef, useState } from "react";
// Render câu trả lời AI dạng Markdown (react-markdown + remark-gfm)
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

import type { ApiResult, FormData, Survey, SurveyAnswers } from "@/lib/types";
import { surveyAnswersToForm } from "@/lib/survey";
import { luuKetQua } from "@/lib/ket-qua-luu";
import CareerResult from "./CareerResult";
import { layPhienMa } from "./DanhGia";
import SurveyCard from "./SurveyCard";

type TinVanBan = { tuAi: "bot" | "ban"; noiDung: string; id?: string };
type TinKetQua = {
  tuAi: "ket-qua";
  id: string;
  result?: ApiResult | null;
  dangChay?: boolean;
  trangThai?: string;
  loi?: string;
};
type TinNhan = TinVanBan | TinKetQua;

const isTinVanBan = (t: TinNhan): t is TinVanBan =>
  (t.tuAi === "bot" || t.tuAi === "ban") &&
  "noiDung" in t &&
  typeof t.noiDung === "string";

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

// Đọc bản nháp gõ từ trang chủ (một lần rồi xoá) — lazy init để không setState trong effect
function consumeDraft(): string {
  try {
    const draft = localStorage.getItem(KH_DRAFT);
    if (draft) localStorage.removeItem(KH_DRAFT);
    return draft ?? "";
  } catch {
    return "";
  }
}

// Khung chat AI full màn hình — logic giữ nguyên từ HeroSection.
export default function ChatBot() {
  const [nhap, setNhap] = useState(consumeDraft);
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
  // Phiếu khảo sát đang mở (survey = null nghĩa là đang chờ AI soạn)
  const [surveyMsg, setSurveyMsg] = useState<{
    id: string;
    survey: Survey | null;
    loi?: string;
  } | null>(null);

  useEffect(() => {
    khungRef.current?.scrollTo({ top: khungRef.current.scrollHeight, behavior: "smooth" });
  }, [tinNhans, dangGo, surveyMsg]);

  // Lưu tự động lịch sử chat — chỉ lưu tin nhắn văn bản; thẻ khảo sát/kết quả là tạm thời.
  useEffect(() => {
    try {
      const vanBanMsgs = tinNhans.filter(isTinVanBan);
      localStorage.setItem(KH_HISTORY, JSON.stringify(vanBanMsgs.slice(-MAX_TIN)));
    } catch {
      // storage not available — ignore
    }
  }, [tinNhans]);

  function xoaLichSu() {
    setTinNhans([]);
    setSurveyMsg(null);
    try {
      localStorage.removeItem(KH_HISTORY);
    } catch {
      // storage not available — ignore
    }
  }
  async function batDauSurvey() {
    if (surveyMsg) return; // đang mở rồi
    const id = `sv${Date.now()}`;
    setSurveyMsg({ id, survey: null });
    try {
      const response = await fetch("/api/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate" }),
      });
      const data = (await response.json()) as { survey?: Survey; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Đã có lỗi xảy ra.");
      if (
        !data.survey ||
        !Array.isArray(data.survey.questions) ||
        data.survey.questions.length === 0
      ) {
        throw new Error("Phiếu khảo sát trống. Hãy thử lại.");
      }
      setSurveyMsg((m) => (m && m.id === id ? { id, survey: data.survey as Survey } : m));
    } catch (err) {
      setSurveyMsg((m) =>
        m && m.id === id
          ? {
              id,
              survey: null,
              loi: err instanceof Error ? err.message : "Đã có lỗi xảy ra, hãy thử lại.",
            }
          : m,
      );
    }
  }

  function tomTatCauTraLoi(answers: SurveyAnswers): string {
    const lop = typeof answers.lop === "string" ? answers.lop : "";
    const pick = (key: string) =>
      Array.isArray(answers[key]) ? (answers[key] as string[]).join(", ") : "";
    const tuMoTa = typeof answers.tinh_cach === "string" ? answers.tinh_cach : "";
    const chiTiet = [
      lop && `Lớp: ${lop}`,
      pick("mon_manh") && `Môn mạnh: ${pick("mon_manh")}`,
      pick("mon_yeu") && `Môn yếu: ${pick("mon_yeu")}`,
      pick("so_thich") && `Sở thích: ${pick("so_thich")}`,
      tuMoTa && `Bản thân: ${tuMoTa}`,
    ]
      .filter(Boolean)
      .join(" | ");
    return `📋 Đã điền phiếu khảo sát nhanh. ${chiTiet}`;
  }

  async function chayTuVan(form: FormData) {
    const msgId = `q${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setTinNhans((prev) => [
      ...prev,
      { tuAi: "ket-qua", id: msgId, result: null, dangChay: true },
    ]);
    const update = (p: Partial<TinKetQua>) =>
      setTinNhans((prev) =>
        prev.map((t) => (t.tuAi === "ket-qua" && t.id === msgId ? { ...t, ...p } : t)),
      );

    let gotResult = false;
    try {
      const response = await fetch("/api/consult", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, stream: true, phien_ma: layPhienMa() }),
      });

      const contentType = response.headers.get("content-type") ?? "";
      if (!response.body || !contentType.includes("text/event-stream")) {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Đã có lỗi xảy ra.");
        update({ result: data as ApiResult, dangChay: false });
        luuKetQua(data as ApiResult, form.lop);
        gotResult = true;
        return;
      }

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
            update({ trangThai: ev.s, dangChay: true });
          } else if (typeof ev.e === "string") {
            update({ loi: ev.e, dangChay: false });
            return;
          } else if (ev.r && typeof ev.r === "object") {
            update({ result: ev.r as ApiResult, dangChay: false });
            luuKetQua(ev.r as ApiResult, form.lop);
            gotResult = true;
            break outer;
          }
        }
      }
      try {
        reader.cancel();
      } catch {
        // ignore
      }
      if (!gotResult) update({ loi: "Đã có lỗi xảy ra, vui lòng thử lại.", dangChay: false });
    } catch (err) {
      update({
        loi: err instanceof Error ? err.message : "Đã có lỗi xảy ra, vui lòng thử lại.",
        dangChay: false,
      });
    }
  }

  async function guiSurvey(answers: SurveyAnswers) {
    const form = surveyAnswersToForm(answers);
    if (!form) {
      setSurveyMsg((m) =>
        m ? { ...m, loi: "Bạn chưa chọn lớp học. Vui lòng kiểm tra lại." } : m,
      );
      return;
    }
    // Lưu bối cảnh học sinh để chat tiếp vẫn biết về bạn
    try {
      localStorage.setItem(KH_CONTEXT, JSON.stringify({ lop: form.lop, vanBan: form.tinh_cach }));
    } catch {
      // lưu không quan trọng — chat vẫn chạy
    }
    setTinNhans((prev) => [...prev, { tuAi: "ban", noiDung: tomTatCauTraLoi(answers) }]);
    setSurveyMsg(null);
    await chayTuVan(form);
  }

  async function gui(e: React.FormEvent) {
    e.preventDefault();
    const text = nhap.trim();
    if (!text || dangGo) return;
    const lichSu: TinVanBan[] = [
      ...tinNhans.filter(isTinVanBan),
      { tuAi: "ban", noiDung: text },
    ];
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
        {tinNhans.map((t, i) => {
          if (t.tuAi === "ket-qua") {
            return (
              <div key={`ket-qua-${t.id}`} className="flex justify-start">
                {t.dangChay ? (
                  <p className="min-w-[220px] max-w-[85%] rounded-2xl border border-stone-900/10 bg-orange-50 px-4 py-3 text-sm text-stone-500">
                    <span className="animate-pulse">
                      🔎 {t.trangThai ?? "Đang phân tích, vui lòng chờ…"}
                    </span>
                  </p>
                ) : t.loi ? (
                  <p className="max-w-[85%] rounded-2xl border border-red-500/30 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    ⚠️ {t.loi}
                  </p>
                ) : t.result ? (
                  <CareerResult result={t.result} tieuDe="Kết quả tư vấn nhanh" />
                ) : (
                  <p className="max-w-[85%] rounded-2xl border border-red-500/30 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    ⚠️ Đã có lỗi xảy ra, vui lòng thử lại.
                  </p>
                )}
              </div>
            );
          }
          return (
            <div key={`${t.tuAi}-${i}`} className={`flex ${t.tuAi === "ban" ? "justify-end" : "justify-start"}`}>
              {t.tuAi === "ban" ? (
                <p className="max-w-[85%] rounded-2xl bg-stone-900 px-4 py-2.5 text-sm leading-relaxed text-[#faf4e9]">
                  {t.noiDung}
                </p>
              ) : (
                <div className="chat-md max-w-[85%] rounded-2xl border border-stone-900/10 bg-orange-50 px-4 py-2.5 text-sm leading-relaxed text-stone-900">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeSanitize]}
                    components={{
                      a: ({ href, children }) => (
                        <a
                          href={href}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-orange-700 underline decoration-orange-300 underline-offset-2"
                        >
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {t.noiDung}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          );
        })}
        {dangGo && (
          <div className="flex justify-start">
            <p className="rounded-2xl border border-stone-900/10 bg-orange-50 px-4 py-3 text-sm text-stone-500">
              <span className="animate-pulse">…</span>
            </p>
          </div>
        )}

        {surveyMsg && (
          <div className="flex justify-start">
            <SurveyCard
              survey={surveyMsg.survey}
              loi={surveyMsg.loi}
              dangTao={!surveyMsg.survey && !surveyMsg.loi}
              onGui={guiSurvey}
              onDong={() => setSurveyMsg(null)}
              onThuLai={batDauSurvey}
            />
          </div>
        )}
      </div>

      <div className="flex justify-end px-3 pb-1.5">
        <button
          type="button"
          onClick={batDauSurvey}
          disabled={dangGo || !!surveyMsg}
          className="rounded-lg border border-orange-600/30 bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-700 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          📋 Tư vấn nhanh — điền phiếu khảo sát
        </button>
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
