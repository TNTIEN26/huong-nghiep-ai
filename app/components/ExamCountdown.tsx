"use client";

import { useEffect, useState } from "react";

// Lịch DỰ KIẾN kỳ thi tốt nghiệp THPT 2027 (lịch chính thức chờ Bộ GD&ĐT công bố).
// Bạn phụ trách tính năng có thể chuyển sang lấy từ API/data khi có lịch thật.
const lichThi = [
  { mon: "Ngữ văn", ngay: "11/06/2027", gio: "07:30", at: new Date(2027, 5, 11, 7, 30).getTime() },
  { mon: "Toán", ngay: "11/06/2027", gio: "14:20", at: new Date(2027, 5, 11, 14, 20).getTime() },
  { mon: "Bài thi tự chọn thứ nhất", ngay: "12/06/2027", gio: "07:30", at: new Date(2027, 5, 12, 7, 30).getTime() },
  { mon: "Bài thi tự chọn thứ hai", ngay: "12/06/2027", gio: "10:30", at: new Date(2027, 5, 12, 10, 30).getTime() },
];

function pad(n: number) {
  return String(Math.max(0, n)).padStart(2, "0");
}

export default function ExamCountdown() {
  const [now, setNow] = useState<number | null>(null);
  const [chon, setChon] = useState<string | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const t = now ?? 0;
  // Mốc sắp tới gần nhất (tự động)
  const sapToi = lichThi.find((m) => t < m.at) ?? null;
  // Môn đang hiển thị: ưu tiên môn người dùng bấm chọn, nếu chưa chọn thì theo mốc sắp tới
  const dangXem = lichThi.find((m) => m.mon === chon) ?? sapToi ?? lichThi[0];
  const daThiXong = now !== null && dangXem.at <= now;
  const diff = now === null ? 0 : Math.max(0, dangXem.at - now);

  const ngay = Math.floor(diff / 86_400_000);
  const gio = Math.floor((diff % 86_400_000) / 3_600_000);
  const phut = Math.floor((diff % 3_600_000) / 60_000);
  const giay = Math.floor((diff % 60_000) / 1000);

  const o = [
    [String(ngay).padStart(3, "0"), "Ngày"],
    [pad(gio), "Giờ"],
    [pad(phut), "Phút"],
    [pad(giay), "Giây"],
  ] as const;

  return (
    <section aria-label="Đếm ngược kỳ thi" className="w-full rounded-[2rem] border border-white/10 bg-zinc-900 p-8 sm:p-14 xl:p-20">
      <div className="grid items-start gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
        {/* Trái: tiêu đề + đếm ngược */}
        <div>
          <h2 className="text-3xl font-extrabold leading-snug tracking-tight sm:text-4xl xl:text-5xl">
            Thời gian dự kiến thi tốt nghiệp THPT 2027
          </h2>
          <p className="mt-3 text-[15px] text-zinc-400">
            {daThiXong ? (
              <>
                <span className="font-bold text-zinc-100">{dangXem.mon}</span> đã kết thúc.
              </>
            ) : (
              <>
                Thời gian còn lại:{" "}
                <span className="font-bold text-zinc-100">
                  {now === null ? "…" : dangXem.mon}
                </span>
              </>
            )}
          </p>

          {/* 4 ô bằng kích thước nhau */}
          <div className="mt-8 grid grid-cols-4 gap-2 sm:gap-5">
            {o.map(([so, label]) => (
              <div key={label} className="min-w-0 text-center">
                <div className="flex min-h-[10rem] items-center justify-center rounded-2xl bg-zinc-100 px-1 py-10 sm:min-h-[14rem] sm:py-12">
                  <p className="whitespace-nowrap text-4xl font-black tabular-nums leading-none tracking-tighter text-zinc-950 sm:text-6xl 2xl:text-7xl">
                    {now === null ? "–" : so}
                  </p>
                </div>
                <p className="mt-2.5 text-sm font-semibold text-zinc-400">{label}</p>
              </div>
            ))}
          </div>

          <p className="mt-6 text-xs leading-relaxed text-zinc-600">
            Lịch trên là dự kiến theo khung các năm gần đây. Lịch chính thức chờ Bộ Giáo dục
            và Đào tạo công bố.
          </p>
        </div>

        {/* Phải: lịch thi tổng quan — bấm vào từng môn để xem đếm ngược riêng */}
        <div className="rounded-2xl border border-white/10 bg-zinc-950 p-5 sm:p-7">
          <p className="px-1 pb-1 text-base font-bold">Lịch thi tổng quan 2027</p>
          <p className="px-1 pb-3 text-xs text-zinc-500">
            Bấm vào từng môn để xem đếm ngược riêng.
          </p>
          <ul className="space-y-3">
            {lichThi.map((m) => {
              const active = dangXem.mon === m.mon;
              const quaRoi = now !== null && m.at <= now;
              return (
                <li key={m.mon}>
                  <button
                    type="button"
                    onClick={() => setChon(m.mon)}
                    aria-pressed={active}
                    className={`block w-full rounded-xl border px-5 py-4 text-left transition hover:shadow-[0_0_24px_-8px_rgba(255,255,255,0.35)] focus-visible:outline-none focus-visible:shadow-[0_0_24px_-8px_rgba(255,255,255,0.35)] ${
                      active
                        ? "border-zinc-100 bg-zinc-100 text-zinc-950 shadow-[0_0_24px_-10px_rgba(255,255,255,0.5)]"
                        : "border-white/10 bg-zinc-900 text-zinc-200 hover:border-white/30"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-bold">{m.mon}</p>
                      {active && (
                        <span className="shrink-0 rounded-full border border-zinc-950/20 px-2.5 py-1 text-[11px] font-bold">
                          {quaRoi ? "Đã kết thúc" : "Đang đếm ngược"}
                        </span>
                      )}
                    </div>
                    <p className={`mt-1 text-[13px] ${active ? "text-zinc-600" : "text-zinc-500"}`}>
                      {m.ngay} · {m.gio}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
