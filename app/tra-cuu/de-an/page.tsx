"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import SiteNav from "../../components/SiteNav";
import truongData from "@/data/tra-cuu/truong.json";
import boSungData from "@/data/tra-cuu/de-an-bo-sung.json";

type MucTruong = {
  ten: string;
  id: number | null;
  thanh_pho: string | null;
  so_nganh: number;
  so_to_hop: number;
  diem_min: number | null;
  diem_max: number | null;
  de_an: { slug: string; link: string; so_nganh: number | null; phuong_thuc: number } | null;
};

type BoSung = { anh: string | null; phuong_thuc: string[] };

type DongDiem = {
  truong: string;
  nganh: string;
  to_hop: string[];
  diem: { [nam: string]: number | null };
};

const DS: MucTruong[] = truongData;
const BO_SUNG = boSungData as { [slug: string]: BoSung };

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
  return v == null ? "—" : v.toFixed(2).replace(/\.00$/, "").replace(".", ",");
}

function chuDau(ten: string): string {
  const bo = ten.replace(/^(Trường|Đại học|ĐH|Học viện|HV)\s+/gi, "").trim();
  const tu = (bo || ten).split(/\s+/).slice(0, 3);
  return tu.map((t) => t[0]?.toUpperCase() ?? "").join("");
}

export default function TraCuuDeAnPage() {
  const [tuKhoa, setTuKhoa] = useState("");
  const [thanhPho, setThanhPho] = useState("");
  const [mo, setMo] = useState<string | null>(null);
  const [chiTiet, setChiTiet] = useState<{ [ten: string]: DongDiem[] }>({});
  const [dangTai, setDangTai] = useState<string | null>(null);
  const [soHien, setSoHien] = useState(24);

  const cacThanhPho = useMemo(
    () => Array.from(new Set(DS.map((t) => t.thanh_pho).filter((x): x is string => !!x))).sort(),
    [],
  );

  const ketQua = useMemo(() => {
    const k = norm(tuKhoa);
    return DS.filter((t) => {
      if (thanhPho && t.thanh_pho !== thanhPho) return false;
      if (!k) return true;
      return norm(`${t.ten} ${t.thanh_pho ?? ""}`).includes(k);
    });
  }, [tuKhoa, thanhPho]);

  async function moChiTiet(t: MucTruong) {
    if (mo === t.ten) {
      setMo(null);
      return;
    }
    setMo(t.ten);
    if (chiTiet[t.ten]) return;
    setDangTai(t.ten);
    try {
      const qs = t.id != null ? `truong_id=${t.id}` : `truong=${encodeURIComponent(t.ten)}`;
      const res = await fetch(`/api/tra-cuu?${qs}&limit=300`);
      const j = await res.json();
      setChiTiet((cu) => ({ ...cu, [t.ten]: (j.muc ?? []) as DongDiem[] }));
    } finally {
      setDangTai(null);
    }
  }

  return (
    <div className="relative z-10 flex min-h-screen flex-col text-stone-900">
      <SiteNav active="tra-cuu" />

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-10 sm:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Tra cứu</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Tra cứu đề án tuyển sinh
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-500">
          {DS.length} trường có dữ liệu đề án. Bấm vào trường để xem toàn văn đề án, phương án tuyển sinh
          và điểm chuẩn các năm.
        </p>

        <div className="mt-7 max-w-3xl">
          <input
            value={tuKhoa}
            onChange={(e) => {
              setTuKhoa(e.target.value);
              setSoHien(24);
            }}
            placeholder="VD: Bách Khoa, Y Hà Nội, Sư phạm, Cần Thơ..."
            className={oNhap}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setThanhPho("")}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                thanhPho === ""
                  ? "bg-blue-600 text-white"
                  : "border border-stone-900/10 bg-white text-stone-600 hover:border-stone-900/25"
              }`}
            >
              Tất cả ({DS.length})
            </button>
            {cacThanhPho.map((tp) => (
              <button
                key={tp}
                type="button"
                onClick={() => {
                  setThanhPho(tp === thanhPho ? "" : tp);
                  setSoHien(24);
                }}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                  thanhPho === tp
                    ? "bg-blue-600 text-white"
                    : "border border-stone-900/10 bg-white text-stone-600 hover:border-stone-900/25"
                }`}
              >
                {tp.replace(/^Thành phố\s+/i, "")}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-5 text-sm font-semibold text-stone-500">
          Tìm thấy <span className="font-black text-stone-900">{ketQua.length}</span> trường
        </p>

        {ketQua.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-stone-900/20 bg-white p-10 text-center">
            <p className="font-bold text-stone-700">Không tìm thấy trường nào</p>
            <p className="mt-1 text-sm text-stone-500">Thử bỏ bộ lọc thành phố hoặc đổi từ khóa.</p>
          </div>
        ) : (
          <ul className="mt-4 grid gap-4 xl:grid-cols-2">
            {ketQua.slice(0, soHien).map((t) => {
              const bst = t.de_an ? BO_SUNG[t.de_an.slug] : undefined;
              const anh = bst?.anh ?? null;
              const pt = bst?.phuong_thuc ?? [];
              const dangMo = mo === t.ten;
              const dong = chiTiet[t.ten];
              const chiTietHref = t.de_an ? `/tra-cuu/de-an/${t.de_an.slug}` : null;

              return (
                <li
                  key={t.ten}
                  className="group flex flex-col rounded-2xl border border-stone-900/10 bg-white p-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)] transition hover:border-blue-600/25 hover:shadow-[0_6px_20px_rgba(28,25,23,0.08)]"
                >
                  <div className="flex gap-4">
                    <div className="relative h-[92px] w-[124px] shrink-0 overflow-hidden rounded-xl bg-[#F4F8FE] sm:h-[104px] sm:w-[150px]">
                      {anh ? (
                        <Image
                          src={anh}
                          alt={`Ảnh ${t.ten}`}
                          width={150}
                          height={104}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xl font-black text-blue-600/50">
                          {chuDau(t.ten)}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-stone-400">{t.thanh_pho ?? "Việt Nam"}</p>
                      {chiTietHref ? (
                        <Link
                          href={chiTietHref}
                          className="mt-0.5 block text-base font-extrabold leading-snug text-blue-700 hover:underline sm:text-lg"
                        >
                          {t.ten}
                        </Link>
                      ) : (
                        <h2 className="mt-0.5 text-base font-extrabold leading-snug text-stone-800 sm:text-lg">
                          {t.ten}
                        </h2>
                      )}

                      <p className="mt-2 text-xs font-semibold text-stone-400">Phương án tuyển sinh</p>
                      <p className="text-sm font-semibold text-stone-700">
                        {pt.length > 0 ? pt.join(", ") : "Đang cập nhật"}
                      </p>
                    </div>

                    {chiTietHref && (
                      <Link
                        href={chiTietHref}
                        className="hidden shrink-0 items-center self-start rounded-xl bg-indigo-100 px-4 py-2.5 text-sm font-bold text-indigo-600 transition hover:bg-indigo-200 sm:flex"
                      >
                        Xem chi tiết
                      </Link>
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-stone-900/10 pt-3">
                    <div>
                      <p className="text-xs font-semibold text-stone-400">Điểm chuẩn 2025</p>
                      <p className="text-sm font-bold text-blue-700">
                        {t.diem_min != null && t.diem_max != null
                          ? `${soDiem(t.diem_min)} – ${soDiem(t.diem_max)}`
                          : "Đang cập nhật"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-stone-400">Số ngành tuyển sinh</p>
                      <p className="text-sm font-bold text-blue-700">{t.so_nganh > 0 ? t.so_nganh : "—"}</p>
                    </div>
                  </div>

                  {chiTietHref && (
                    <Link
                      href={chiTietHref}
                      className="mt-3 flex items-center justify-center rounded-xl bg-indigo-100 px-4 py-2 text-sm font-bold text-indigo-600 transition hover:bg-indigo-200 sm:hidden"
                    >
                      Xem chi tiết
                    </Link>
                  )}

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => moChiTiet(t)}
                      className="text-xs font-bold text-stone-500 underline decoration-stone-300 underline-offset-2 transition hover:text-blue-700"
                    >
                      {dangMo ? "Ẩn danh sách ngành" : "Xem ngành & điểm chuẩn"}
                    </button>
                    <div className="flex items-center gap-3 text-xs font-semibold text-stone-400">
                      <span>{t.so_to_hop} tổ hợp</span>
                      {t.de_an && (
                        <a
                          href={t.de_an.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-blue-700"
                        >
                          Đề án gốc ↗
                        </a>
                      )}
                    </div>
                  </div>

                  {dangMo && (
                    <div className="mt-3 border-t border-stone-900/10 pt-3">
                      {dangTai === t.ten ? (
                        <p className="text-sm text-stone-500">Đang tải…</p>
                      ) : !dong || dong.length === 0 ? (
                        <p className="text-sm text-stone-500">Chưa có dữ liệu điểm cho trường này.</p>
                      ) : (
                        <ul className="max-h-80 space-y-2 overflow-y-auto pr-1">
                          {dong.map((d) => (
                            <li key={`${d.truong}-${d.nganh}`} className="text-sm leading-relaxed">
                              <span className="font-bold text-stone-900">{d.nganh}</span>
                              <span className="text-xs text-stone-500">
                                {" "}
                                · 2025: <b className="text-emerald-700">{soDiem(d.diem["2025"] ?? null)}</b>
                                {" · "}2024: {soDiem(d.diem["2024"] ?? null)}
                                {d.to_hop.length > 0 && (
                                  <span className="text-stone-400"> · {d.to_hop.slice(0, 5).join(", ")}{d.to_hop.length > 5 ? "…" : ""}</span>
                                )}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {soHien < ketQua.length && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setSoHien((s) => s + 24)}
              className="rounded-xl border border-stone-900/15 bg-white px-5 py-2.5 text-sm font-bold text-stone-700 transition hover:border-stone-900/30"
            >
              Xem thêm ({ketQua.length - soHien} trường)
            </button>
          </div>
        )}

        <p className="mt-8 text-xs text-stone-400">
          Nguồn: tổng hợp đề án tuyển sinh từ HOCMAI (dữ liệu 2025, tham khảo — đối chiếu đề án chính thức của trường).
        </p>
      </main>
    </div>
  );
}
