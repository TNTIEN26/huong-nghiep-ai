"use client";

import { useMemo, useState } from "react";

import SiteNav from "../../components/SiteNav";
import type { KhoiThi, TruongDH } from "@/lib/types";
import truongDhData from "@/data/truong-dh.json";
import khoiThiData from "@/data/khoi-thi.json";

const DS_TRUONG = truongDhData as TruongDH[];
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

function dongDiem(t: TruongDH["nhom_nganh"][number]): string {
  const bits = [`${t.diem_chuan_tk.toFixed(1)} điểm${t.nam ? ` (${t.nam})` : ""}`];
  if (t.to_hop.length > 0) bits.push(`khối ${t.to_hop.join(", ")}`);
  if (t.hoc_phi_tk) bits.push(t.hoc_phi_tk);
  if (t.ghichu) bits.push(t.ghichu);
  return bits.join(" · ");
}

export default function TraCuuDeAnPage() {
  const [tuKhoa, setTuKhoa] = useState("");
  const [khoi, setKhoi] = useState("");

  const ketQua = useMemo(() => {
    const k = norm(tuKhoa);
    const ra: { truong: TruongDH; nhom: TruongDH["nhom_nganh"] }[] = [];
    let tongNhom = 0;

    for (const t of DS_TRUONG) {
      const nhom = t.nhom_nganh.filter((n) => {
        if (khoi && !n.to_hop.includes(khoi)) return false;
        if (!k) return true;
        return norm(`${t.ten} ${t.thanh_pho} ${n.ten} ${(n.to_hop ?? []).join(" ")}`).includes(k);
      });
      if (nhom.length > 0) {
        ra.push({ truong: t, nhom });
        tongNhom += nhom.length;
      }
    }
    return { truong: ra, tongNhom };
  }, [tuKhoa, khoi]);

  const tongNhomGoc = DS_TRUONG.reduce((s, t) => s + t.nhom_nganh.length, 0);

  return (
    <div className="relative z-10 flex min-h-screen flex-col text-stone-900">
      <SiteNav active="tra-cuu" />

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-10 sm:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Tra cứu</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Tra cứu đề án tuyển sinh
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-500">
          Điểm chuẩn theo từng nhóm ngành của {DS_TRUONG.length} trường. Gõ tên trường, thành phố hoặc
          ngành — hoặc lọc theo khối thi.
        </p>

        <div className="mt-7 max-w-3xl">
          <input
            value={tuKhoa}
            onChange={(e) => setTuKhoa(e.target.value)}
            placeholder="VD: Bách Khoa, Y Hà Nội, CNTT, An Giang..."
            className={oNhap}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setKhoi("")}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                khoi === ""
                  ? "bg-blue-600 text-white"
                  : "border border-stone-900/10 bg-white text-stone-600 hover:border-stone-900/25"
              }`}
            >
              Tất cả khối
            </button>
            {DS_KHOI.map((k) => (
              <button
                key={k.code}
                type="button"
                onClick={() => setKhoi(k.code === khoi ? "" : k.code)}
                className={`rounded-full px-3 py-1.5 text-xs font-black transition ${
                  khoi === k.code
                    ? "bg-blue-600 text-white"
                    : "border border-stone-900/10 bg-white text-stone-600 hover:border-stone-900/25"
                }`}
              >
                {k.code}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-5 text-sm font-semibold text-stone-500">
          <span className="font-black text-stone-900">{ketQua.truong.length}</span> trường ·{" "}
          <span className="font-black text-stone-900">{ketQua.tongNhom}</span> nhóm ngành
          {ketQua.tongNhom !== tongNhomGoc && (
            <span className="text-stone-400"> (trong tổng số {tongNhomGoc})</span>
          )}
        </p>

        {ketQua.truong.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-stone-900/20 bg-white p-10 text-center">
            <p className="font-bold text-stone-700">Không tìm thấy trường nào</p>
            <p className="mt-1 text-sm text-stone-500">Thử bỏ bộ lọc khối hoặc đổi từ khóa.</p>
          </div>
        ) : (
          <ul className="mt-4 grid gap-4 lg:grid-cols-2">
            {ketQua.truong.map(({ truong: t, nhom }) => (
              <li key={t.id} className="rounded-2xl border border-stone-900/10 bg-white p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-stone-900/10 pb-3">
                  <h2 className="text-base font-extrabold text-stone-900">{t.ten}</h2>
                  <span className="text-xs font-semibold text-stone-500">{t.thanh_pho}</span>
                </div>

                <ul className="mt-3 space-y-2.5">
                  {nhom.map((n) => (
                    <li key={`${t.id}-${n.ten}`} className="text-sm leading-relaxed">
                      <span className="font-bold text-stone-900">{n.ten}</span>
                      <span className="text-stone-600"> — {dongDiem(n)}</span>
                      {n.nguon && (
                        <a
                          href={n.nguon}
                          target="_blank"
                          rel="noreferrer"
                          className="ml-1.5 font-semibold text-blue-700 underline decoration-blue-300 underline-offset-2 hover:text-blue-600"
                        >
                          Đề án ↗
                        </a>
                      )}
                      {n.ngay_cap_nhat && (
                        <span className="ml-1.5 text-xs text-stone-400">
                          cập nhật {n.ngay_cap_nhat}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>

                {nhom[0]?.hoc_bong && (
                  <p className="mt-3 border-t border-stone-900/10 pt-3 text-xs text-stone-500">
                    <span className="font-semibold text-stone-700">Học bổng:</span> {nhom[0].hoc_bong}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}

        <p className="mt-8 text-xs text-stone-400">
          Điểm chuẩn, học phí chỉ mang tính tham khảo — đối chiếu đề án chính thức của từng trường.
        </p>
      </main>
    </div>
  );
}
