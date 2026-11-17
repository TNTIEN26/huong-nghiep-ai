"use client";

import { useCallback, useEffect, useState } from "react";

export default function NoiDungDeAn({ html }: { html: string }) {
  const [anh, setAnh] = useState<string | null>(null);

  const dong = useCallback(() => setAnh(null), []);

  useEffect(() => {
    if (!anh) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAnh(null);
    };
    document.addEventListener("keydown", onKey);
    const cu = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = cu;
    };
  }, [anh]);

  function bamVaoNoiDung(e: React.MouseEvent<HTMLDivElement>) {
    const t = e.target as HTMLElement;
    if (t.tagName !== "IMG") return;
    e.preventDefault();
    setAnh((t as HTMLImageElement).currentSrc || (t as HTMLImageElement).src);
  }

  return (
    <>
      <div className="de-an-noi-dung" onClick={bamVaoNoiDung} dangerouslySetInnerHTML={{ __html: html }} />

      {anh && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Xem ảnh"
          onClick={dong}
          className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-stone-950/85 p-3 sm:p-6"
        >
          <div className="relative flex w-full max-w-[1400px] flex-col items-center">
            <div className="sticky top-0 z-10 mb-2 flex w-full items-center justify-between gap-3 bg-stone-950/85 py-1 text-xs font-semibold text-white/80 backdrop-blur">
              <a
                href={anh}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="rounded-lg bg-white/10 px-3 py-1.5 transition hover:bg-white/20"
              >
                Mở ảnh gốc ↗
              </a>
              <button
                type="button"
                onClick={dong}
                className="rounded-lg bg-white/10 px-3 py-1.5 transition hover:bg-white/20"
              >
                Đóng (Esc)
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={anh}
              alt="Ảnh trong đề án"
              onClick={(e) => e.stopPropagation()}
              className="h-auto w-full rounded-lg bg-white"
            />
            <p className="mt-2 text-center text-xs text-white/50">
              Bấm ra ngoài hoặc nhấn Esc để đóng · ảnh đang hiển thị phóng to hết khung
            </p>
          </div>
        </div>
      )}
    </>
  );
}
