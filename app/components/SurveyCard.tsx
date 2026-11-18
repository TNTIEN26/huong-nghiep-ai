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
      <div className="max-w-full rounded-2xl border border-stone-900/10 bg-white px-4 py-3.5 text-[15px] text-stone-500 shadow-sm">
        {loi ? (
          <div>
            <p className="font-medium text-red-700">⚠️ {loi}</p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={onThuLai}
                className="h-9 rounded-lg bg-blue-600 px-4 text-[13px] font-bold text-white transition hover:bg-blue-500"
              >
                Thử lại
              </button>
              <button
                type="button"
                onClick={onDong}
                className="h-9 rounded-lg border border-stone-900/10 px-4 text-[13px] font-semibold text-stone-600 transition hover:bg-stone-900/5"
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
      className="w-full max-w-2xl space-y-5 rounded-2xl border border-stone-900/10 bg-white p-4 text-[15px] text-stone-900 shadow-sm sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-bold uppercase tracking-[0.12em] text-blue-600">
            {survey.title ?? "Phiếu khảo sát nhanh"}
          </p>
          {survey.moTa && (
            <p className="mt-1 text-sm leading-relaxed text-stone-500">{survey.moTa}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onDong}
          aria-label="Đóng phiếu khảo sát"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-stone-500 transition hover:bg-stone-900/5 hover:text-stone-900"
        >
          <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>

      <div className="space-y-5">
        {survey.questions.map((q) => (
          <CauHoi key={q.id} q={q} value={answers[q.id]} set={set} />
        ))}
      </div>

      {loi && (
        <p className="rounded-xl border border-red-500/30 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          ⚠️ {loi}
        </p>
      )}
      {thieuBatBuoc && (
        <p className="text-sm font-medium text-stone-500">
          Vui lòng trả lời các câu có dấu * trước khi gửi.
        </p>
      )}

      <button
        type="submit"
        disabled={thieuBatBuoc || dangGui}
        className="h-11 w-full rounded-xl bg-blue-600 px-6 text-[15px] font-bold text-white sm:w-auto sm:min-w-[220px] sm:float-right transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {dangGui ? "Đang phân tích, vui lòng chờ…" : "Gửi phiếu để tư vấn"}
      </button>
      <div className="clear-both" />
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
    <p className="text-base font-bold leading-snug text-stone-900">
      {q.title}
      {batBuoc && <span className="ml-1 text-blue-600">*</span>}
    </p>
  );

  switch (q.type) {
    case "lop": {
      return (
        <div>
          {tieuDe}
          <div className="mt-3 flex flex-wrap gap-2">
            {LOP_OPTIONS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => set(q.id, l)}
                aria-pressed={value === l}
                className={`h-10 rounded-lg px-4 text-sm font-semibold transition ${
                  value === l
                    ? "bg-stone-900 text-[#F4F8FE]"
                    : "border border-stone-900/10 bg-white text-stone-600 hover:border-blue-400/60 hover:text-stone-900"
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
          <p className="mt-0.5 text-xs text-stone-500">Chọn nhiều.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {q.options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => toggle(opt)}
                aria-pressed={arr.includes(opt)}
                className={`min-h-10 rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                  arr.includes(opt)
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-stone-900/10 bg-white text-stone-600 hover:border-blue-400/60 hover:text-stone-900"
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
          <div className="mt-3 flex flex-wrap gap-2">
            {q.options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => set(q.id, opt)}
                aria-pressed={value === opt}
                className={`min-h-10 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                  value === opt
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-stone-900/10 bg-white text-stone-600 hover:border-blue-400/60 hover:text-stone-900"
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
          <div className="mt-3 grid grid-cols-5 gap-2 sm:flex sm:flex-wrap">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => set(q.id, n)}
                aria-pressed={so === n}
                className={`h-10 rounded-lg text-sm font-bold transition sm:w-10 ${
                  so === n
                    ? "bg-blue-600 text-white"
                    : "border border-stone-900/10 bg-white text-stone-500 hover:border-blue-400/60"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-stone-500">
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
            className="mt-3 w-full resize-none rounded-xl border border-stone-900/15 bg-[#F4F8FE] p-3 text-base leading-relaxed text-stone-900 outline-none placeholder:text-stone-400 focus:border-blue-500/60"
          />
        </div>
      );
    }
  }
}