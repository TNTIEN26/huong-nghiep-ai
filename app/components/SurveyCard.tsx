"use client";

import { useMemo, useState } from "react";

import type { Survey, SurveyAnswers, SurveyQuestion } from "@/lib/types";
import { LOP_OPTIONS } from "@/lib/survey";

type Props = {
  survey: Survey | null;
  loi?: string;
  dangTao: boolean;
  onGui: (answers: SurveyAnswers) => void;
  onDong: () => void;
  onThuLai: () => void;
};

// Thẻ phiếu khảo sát nhanh hiển thị ngay trong khung chat.
export default function SurveyCard({
  survey,
  loi,
  dangTao,
  onGui,
  onDong,
  onThuLai,
}: Props) {
  const [answers, setAnswers] = useState<SurveyAnswers>({});
  const [dangGui, setDangGui] = useState(false);

  const thieuBatBuoc = useMemo(() => {
    if (!survey) return false;
    return survey.questions.some((q) => {
      const v = answers[q.id];
      if (q.bat_buoc !== true) return false;
      if (q.type === "text") return typeof v !== "string" || v.trim() === "";
      if (q.type === "multi") return !Array.isArray(v) || v.length === 0;
      return v === undefined || v === null || v === "";
    });
  }, [survey, answers]);

  if (dangTao || !survey) {
    return (
      <div className="max-w-[85%] rounded-2xl border border-stone-900/10 bg-orange-50 px-4 py-3.5 text-sm text-stone-500">
        {loi ? (
          <div>
            <p className="font-medium text-red-700">⚠️ {loi}</p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={onThuLai}
                className="rounded-lg bg-orange-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-orange-500"
              >
                Thử lại
              </button>
              <button
                type="button"
                onClick={onDong}
                className="rounded-lg border border-stone-900/10 px-4 py-2 text-xs font-semibold text-stone-600 transition hover:bg-stone-900/5"
              >
                Đóng
              </button>
            </div>
          </div>
        ) : (
          <span className="animate-pulse">📋 Đang soạn phiếu khảo sát…</span>
        )}
      </div>
    );
  }

  const set = (id: string, value: string | string[] | number) =>
    setAnswers((prev) => ({ ...prev, [id]: value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (thieuBatBuoc || dangGui) return;
    setDangGui(true);
    onGui(answers);
  }

  return (
    <form
      onSubmit={submit}
      className="w-full min-w-[280px] max-w-[85%] space-y-4 rounded-2xl border border-stone-900/10 bg-orange-50 p-4 text-sm text-stone-900 sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-orange-600">
            {survey.title ?? "Phiếu khảo sát nhanh"}
          </p>
          {survey.moTa && (
            <p className="mt-1 text-xs leading-relaxed text-stone-500">{survey.moTa}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onDong}
          aria-label="Đóng phiếu khảo sát"
          className="rounded-lg px-2 py-1 text-stone-500 transition hover:bg-stone-900/5 hover:text-stone-900"
        >
          ✕
        </button>
      </div>

      <div className="space-y-5">
        {survey.questions.map((q) => (
          <CauHoi key={q.id} q={q} value={answers[q.id]} set={set} />
        ))}
      </div>

      {loi && (
        <p className="rounded-xl border border-red-500/30 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
          ⚠️ {loi}
        </p>
      )}
      {thieuBatBuoc && (
        <p className="text-xs font-medium text-stone-500">
          Vui lòng trả lời các câu có dấu * trước khi gửi.
        </p>
      )}

      <button
        type="submit"
        disabled={thieuBatBuoc || dangGui}
        className="w-full rounded-xl bg-orange-600 px-6 py-3 text-[15px] font-bold text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {dangGui ? "Đang phân tích, vui lòng chờ…" : "Gửi phiếu để tư vấn"}
      </button>
    </form>
  );
}

function CauHoi({
  q,
  value,
  set,
}: {
  q: SurveyQuestion;
  value: SurveyAnswers[string];
  set: (id: string, value: string | string[] | number) => void;
}) {
  const batBuoc = q.bat_buoc ?? false;
  const tieuDe = (
    <p className="font-bold leading-snug text-stone-900">
      {q.title}
      {batBuoc && <span className="ml-1 text-orange-600">*</span>}
    </p>
  );

  switch (q.type) {
    case "lop": {
      return (
        <div>
          {tieuDe}
          <div className="mt-2.5 flex flex-wrap gap-2">
            {LOP_OPTIONS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => set(q.id, l)}
                aria-pressed={value === l}
                className={`rounded-lg px-3.5 py-2 text-[13px] font-semibold transition ${
                  value === l
                    ? "bg-stone-900 text-[#faf4e9]"
                    : "border border-stone-900/10 bg-white text-stone-600 hover:border-orange-400/60 hover:text-stone-900"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      );
    }
    case "multi": {
      const arr = Array.isArray(value) ? (value as string[]) : [];
      const toggle = (opt: string) =>
        set(q.id, arr.includes(opt) ? arr.filter((x) => x !== opt) : [...arr, opt]);
      return (
        <div>
          {tieuDe}
          <p className="mt-0.5 text-[11px] text-stone-500">Chọn nhiều.</p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {q.options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => toggle(opt)}
                aria-pressed={arr.includes(opt)}
                className={`rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition ${
                  arr.includes(opt)
                    ? "border-orange-600 bg-orange-600 text-white"
                    : "border-stone-900/10 bg-white text-stone-600 hover:border-orange-400/60 hover:text-stone-900"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      );
    }
    case "choice": {
      return (
        <div>
          {tieuDe}
          <div className="mt-2.5 flex flex-wrap gap-2">
            {q.options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => set(q.id, opt)}
                aria-pressed={value === opt}
                className={`rounded-xl border px-4 py-2 text-[13px] font-semibold transition ${
                  value === opt
                    ? "border-orange-600 bg-orange-600 text-white"
                    : "border-stone-900/10 bg-white text-stone-600 hover:border-orange-400/60 hover:text-stone-900"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      );
    }
    case "scale": {
      const so = typeof value === "number" ? value : 0;
      return (
        <div>
          {tieuDe}
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => set(q.id, n)}
                aria-pressed={so === n}
                className={`h-8 w-8 rounded-lg text-[12px] font-bold transition ${
                  so === n
                    ? "bg-orange-600 text-white"
                    : "border border-stone-900/10 bg-white text-stone-500 hover:border-orange-400/60"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="mt-1 text-[11px] text-stone-500">
            1 = hoàn toàn không · 10 = rất đúng với bạn
          </p>
        </div>
      );
    }
    case "text":
    default: {
      return (
        <div>
          {tieuDe}
          <textarea
            rows={3}
            maxLength={800}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => set(q.id, e.target.value)}
            placeholder={q.placeholder ?? "Viết ngắn gọn 1-3 câu…"}
            className="mt-2.5 w-full resize-none rounded-xl border border-stone-900/10 bg-white p-3 text-[13px] leading-relaxed text-stone-900 outline-none placeholder:text-stone-400 focus:border-orange-500/60"
          />
        </div>
      );
    }
  }
}