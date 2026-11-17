"use client";

import { useMemo, useState } from "react";

import SiteNav from "../../components/SiteNav";
import type { KhoiThi } from "@/lib/types";
import khoiThiData from "@/data/khoi-thi.json";

const DS_KHOI = khoiThiData as KhoiThi[];

const oNhap =
  "w-full rounded-xl border border-stone-900/10 bg-[#F4F8FE] px-4 py-3 text-[15px] text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-blue-500/60";

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function TraCuuToHopPage() {
  const [tuKhoa, setTuKhoa] = useState("");

  const ketQua = useMemo(() => {
    const k = norm(tuKhoa);
    if (!k) return DS_KHOI;
    return DS_KHOI.filter((x) =>
      norm([x.code, x.ten, ...x.mon_thi, ...x.phu_hop].join(" ")).includes(k)
    );
  }, [tuKhoa]);

  return (
    <div className="relative z-10 flex min-h-screen flex-col text-stone-900">
      <SiteNav active="tra-cuu" />

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-10 sm:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Tra cứu</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">Tra cứu tổ hợp môn</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-500">
          {DS_KHOI.length} khối thi phổ biến: môn thi gồm những gì và khối đó hợp với nhóm ngành nào.
        </p>

        <div className="mt-7 max-w-3xl">
          <input
            value={tuKhoa}
            onChange={(e) => setTuKhoa(e.target.value)}
            placeholder="VD: A00, Toán, Hóa, y - dược..."
            className={oNhap}
          />
        </div>

        <p className="mt-5 text-sm font-semibold text-stone-500">
          Tìm thấy <span className="font-black text-stone-900">{ketQua.length}</span> khối
        </p>

        {ketQua.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-stone-900/20 bg-white p-10 text-center">
            <p className="font-bold text-stone-700">Không có khối nào khớp</p>
            <p className="mt-1 text-sm text-stone-500">Thử mã khối (VD: D01) hoặc tên môn (VD: Ngữ văn).</p>
          </div>
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {ketQua.map((k) => (
              <li key={k.code} className="rounded-2xl border border-stone-900/10 bg-white p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-black text-white">
                    {k.code}
                  </span>
                  <h2 className="text-sm font-extrabold leading-snug text-stone-900">{k.ten}</h2>
                </div>

                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">Môn thi</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {k.mon_thi.map((m) => (
                      <span
                        key={m}
                        className="rounded-md border border-stone-900/10 bg-stone-900/[0.04] px-2.5 py-1 text-xs font-semibold text-stone-700"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                    Hợp với ngành
                  </p>
                  <ul className="mt-1.5 space-y-0.5 text-sm text-stone-600">
                    {k.phu_hop.map((p) => (
                      <li key={p}>— {p}</li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
