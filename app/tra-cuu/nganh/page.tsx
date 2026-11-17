"use client";

import { useMemo, useState } from "react";

import SiteNav from "../../components/SiteNav";
import type { NganhNghe } from "@/lib/types";
import nganhNgheData from "@/data/nganh-nghe.json";

const DS_NGANH = nganhNgheData as NganhNghe[];

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

function Nhan({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md border border-stone-900/10 bg-stone-900/[0.04] px-2.5 py-1 text-xs font-semibold text-stone-600">
      {children}
    </span>
  );
}

function KhoiVuc({ ten }: { ten: string }) {
  return (
    <span className="rounded-full bg-blue-600/10 px-3 py-1 text-xs font-bold text-blue-700">{ten}</span>
  );
}

export default function TraCuuNganhPage() {
  const [tuKhoa, setTuKhoa] = useState("");
  const [linhVuc, setLinhVuc] = useState("");

  const cacLinhVuc = useMemo(
    () => Array.from(new Set(DS_NGANH.map((n) => n.linh_vuc))).sort(),
    []
  );

  const ketQua = useMemo(() => {
    const k = norm(tuKhoa);
    return DS_NGANH.filter((n) => {
      if (linhVuc && n.linh_vuc !== linhVuc) return false;
      if (!k) return true;
      const noi = [n.ten, n.linh_vuc, n.mo_ta, n.trien_vong, ...n.cong_viec, ...n.mon_trong_tam, ...n.ky_nang]
        .join(" ");
      return norm(noi).includes(k);
    });
  }, [tuKhoa, linhVuc]);

  return (
    <div className="relative z-10 flex min-h-screen flex-col text-stone-900">
      <SiteNav active="tra-cuu" />

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-10 sm:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Tra cứu</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">Tra cứu ngành học</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-500">
          Gõ tên ngành, lĩnh vực hoặc công việc bạn quan tâm. Xem môn trọng tâm, khối thi phù hợp và
          việc làm sau khi tốt nghiệp.
        </p>

        <div className="mt-7 max-w-3xl">
          <input
            value={tuKhoa}
            onChange={(e) => setTuKhoa(e.target.value)}
            placeholder="VD: công nghệ thông tin, y tá, kế toán, lập trình..."
            className={oNhap}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setLinhVuc("")}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                linhVuc === ""
                  ? "bg-blue-600 text-white"
                  : "border border-stone-900/10 bg-white text-stone-600 hover:border-stone-900/25"
              }`}
            >
              Tất cả ({DS_NGANH.length})
            </button>
            {cacLinhVuc.map((lv) => (
              <button
                key={lv}
                type="button"
                onClick={() => setLinhVuc(lv === linhVuc ? "" : lv)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                  linhVuc === lv
                    ? "bg-blue-600 text-white"
                    : "border border-stone-900/10 bg-white text-stone-600 hover:border-stone-900/25"
                }`}
              >
                {lv}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-5 text-sm font-semibold text-stone-500">
          Tìm thấy <span className="font-black text-stone-900">{ketQua.length}</span> ngành
        </p>

        {ketQua.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-stone-900/20 bg-white p-10 text-center">
            <p className="font-bold text-stone-700">Không có ngành nào khớp</p>
            <p className="mt-1 text-sm text-stone-500">Thử từ khóa ngắn hơn hoặc bỏ bớt bộ lọc.</p>
          </div>
        ) : (
          <ul className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {ketQua.map((n) => (
              <li key={n.id} className="flex flex-col rounded-2xl border border-stone-900/10 bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-base font-extrabold leading-snug text-stone-900">{n.ten}</h2>
                  <KhoiVuc ten={n.linh_vuc} />
                </div>

                <p className="mt-2 text-sm leading-relaxed text-stone-600">{n.mo_ta}</p>

                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                    Môn trọng tâm
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {n.mon_trong_tam.map((m) => (
                      <Nhan key={m}>{m}</Nhan>
                    ))}
                  </div>
                </div>

                <div className="mt-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                    Khối thi phù hợp
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {n.khoi_phu_hop.map((k) => (
                      <span
                        key={k}
                        className="rounded-md bg-blue-600 px-2 py-1 text-xs font-black text-white"
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                    Công việc tiêu biểu
                  </p>
                  <ul className="mt-1.5 space-y-0.5 text-sm text-stone-700">
                    {n.cong_viec.slice(0, 5).map((c) => (
                      <li key={c}>— {c}</li>
                    ))}
                  </ul>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-stone-600">
                  <span className="font-bold text-stone-900">Triển vọng:</span> {n.trien_vong}
                </p>

                {n.muc_luong_tk && (
                  <p className="mt-1.5 text-sm font-semibold text-emerald-700">{n.muc_luong_tk}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
