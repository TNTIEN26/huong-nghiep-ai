"use client";

import { useMemo, useState } from "react";

export type DongChiTiet = {
  truong: string;
  truong_slug: string;
  ma_truong: string | null;
  tinh: string | null;
  nganh: string;
  ma_nganh: string | null;
  chi_tieu: number | null;
  to_hop: string[];
  diem2026: number | null;
  diem2025: number | null;
  chenh_lech: number | null;
};

export type PhuongThuc = {
  ma: string;
  ten: string;
  thang: number | null;
  so_dong: number;
  rows: DongChiTiet[];
};

const oNhap =
  "w-full rounded-xl border border-stone-900/10 bg-[#F4F8FE] px-4 py-3 text-[15px] text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-blue-500/60";

function norm(s: string): string {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function soDiem(v: number | null): string {
  if (v == null) return "—";
  return v.toFixed(2).replace(/\.00$/, "").replace(".", ",");
}

export default function ChiTietNganh({
  tomTat,
  phuongThuc,
}: {
  tomTat: string;
  phuongThuc: PhuongThuc[];
}) {
  const [ma, setMa] = useState(phuongThuc[0]?.ma ?? "");
  const [tuKhoa, setTuKhoa] = useState("");
  const [tinh, setTinh] = useState("");
  const [soHien, setSoHien] = useState(40);

  const dangChon = phuongThuc.find((p) => p.ma === ma) ?? phuongThuc[0];

  const tinhList = useMemo(() => {
    const s = new Set<string>();
    for (const p of phuongThuc) for (const r of p.rows) if (r.tinh) s.add(r.tinh);
    return [...s].sort((a, b) => a.localeCompare(b, "vi"));
  }, [phuongThuc]);

  const dongHien = useMemo(() => {
    if (!dangChon) return [];
    const k = norm(tuKhoa);
    return dangChon.rows.filter((r) => {
      if (tinh && r.tinh !== tinh) return false;
      if (!k) return true;
      return norm(`${r.truong} ${r.nganh} ${r.ma_truong ?? ""} ${r.ma_nganh ?? ""} ${r.to_hop.join(" ")}`).includes(k);
    });
  }, [dangChon, tuKhoa, tinh]);

  if (phuongThuc.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-900/20 bg-white p-10 text-center">
        <p className="font-bold text-stone-700">Chưa có dữ liệu chi tiết cho ngành này</p>
        <p className="mt-1 text-sm text-stone-500">Đề án của các trường chưa công bố đủ thông tin xét tuyển 2026.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-2xl border border-blue-600/15 bg-blue-600/[0.04] p-5 sm:p-6">
        <p className="text-sm leading-relaxed text-stone-700">{tomTat}</p>
      </div>

      <div className="mt-7">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-stone-400">Phương thức xét tuyển</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {phuongThuc.map((p) => {
            const chon = p.ma === dangChon?.ma;
            return (
              <button
                key={p.ma}
                type="button"
                onClick={() => {
                  setMa(p.ma);
                  setSoHien(40);
                  setTinh("");
                }}
                className={
                  "rounded-xl border px-3.5 py-2 text-sm font-bold transition " +
                  (chon
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-stone-900/10 bg-white text-stone-600 hover:border-blue-600/40 hover:text-blue-700")
                }
              >
                {p.ten}
                <span className={"ml-1.5 text-xs " + (chon ? "text-white/70" : "text-stone-400")}>{p.so_dong}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <input
          value={tuKhoa}
          onChange={(e) => {
            setTuKhoa(e.target.value);
            setSoHien(40);
          }}
          placeholder="Tìm trường, mã ngành, tổ hợp..."
          className={oNhap + " sm:flex-1"}
        />
        <select
          value={tinh}
          onChange={(e) => {
            setTinh(e.target.value);
            setSoHien(40);
          }}
          className={oNhap + " sm:w-64"}
        >
          <option value="">Tất cả tỉnh/thành</option>
          {tinhList.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <p className="mt-4 text-sm font-semibold text-stone-500">
        <span className="font-black text-stone-900">{dongHien.length}</span> dòng
        {dangChon?.thang ? ` · thang ${dangChon.thang}` : ""} · {dangChon?.ten}
      </p>

      <div className="mt-3 overflow-x-auto rounded-2xl border border-stone-900/10 bg-white">
        <table className="w-full min-w-[820px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-stone-900/10 bg-stone-900/[0.03] text-xs uppercase tracking-wide text-stone-500">
              <th className="px-4 py-3 font-bold">Trường</th>
              <th className="px-4 py-3 font-bold">Ngành &amp; tổ hợp</th>
              <th className="w-24 px-4 py-3 text-right font-bold">2026</th>
              <th className="w-28 px-4 py-3 text-right font-bold">2025</th>
            </tr>
          </thead>
          <tbody>
            {dongHien.slice(0, soHien).map((r, i) => {
              const cl = r.chenh_lech ?? (r.diem2026 != null && r.diem2025 != null ? r.diem2026 - r.diem2025 : null);
              return (
                <tr key={`${r.truong_slug}-${r.ma_nganh ?? ""}-${i}`} className="border-b border-stone-900/[0.06] align-top last:border-0">
                  <td className="px-4 py-3">
                    <a
                      href={`https://huongnghiep.hocmai.vn/${r.truong_slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold leading-snug text-stone-900 hover:text-blue-700"
                    >
                      {r.truong}
                    </a>
                    <p className="mt-0.5 text-xs font-semibold text-stone-400">
                      {[r.ma_truong, r.tinh].filter(Boolean).join(" · ")}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="leading-snug text-stone-700">{r.nganh}</p>
                    <p className="mt-0.5 text-xs text-stone-400">
                      {[
                        r.ma_nganh,
                        r.chi_tieu != null ? `${r.chi_tieu} chỉ tiêu` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {r.to_hop.length > 0 && (
                      <p className="mt-0.5 text-xs text-stone-400">
                        Tổ hợp: {r.to_hop.slice(0, 8).join(", ")}
                        {r.to_hop.length > 8 ? "…" : ""}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right align-top">
                    <span className="font-extrabold text-stone-900">{soDiem(r.diem2026)}</span>
                  </td>
                  <td className="px-4 py-3 text-right align-top">
                    <span className="font-semibold text-stone-600">{soDiem(r.diem2025)}</span>
                    {cl != null && Math.abs(cl) >= 0.01 && (
                      <span
                        className={
                          "ml-1.5 text-xs font-bold " + (cl > 0 ? "text-rose-600" : "text-emerald-600")
                        }
                      >
                        {cl > 0 ? "▲" : "▼"} {soDiem(Math.abs(cl))}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {dongHien.length === 0 && (
        <div className="mt-3 rounded-2xl border border-dashed border-stone-900/20 bg-white p-8 text-center">
          <p className="font-bold text-stone-700">Không có dòng nào khớp</p>
          <p className="mt-1 text-sm text-stone-500">Thử bỏ bộ lọc hoặc từ khóa ngắn hơn.</p>
        </div>
      )}

      {soHien < dongHien.length && (
        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={() => setSoHien((s) => s + 40)}
            className="rounded-xl border border-stone-900/15 bg-white px-5 py-2.5 text-sm font-bold text-stone-700 transition hover:border-stone-900/30"
          >
            Xem thêm ({dongHien.length - soHien} dòng)
          </button>
        </div>
      )}
    </div>
  );
}
