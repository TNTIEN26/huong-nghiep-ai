"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import SiteNav from "../../components/SiteNav";
import { slugNganh } from "@/lib/nganh-slug";
import type { NganhNghe } from "@/lib/types";
import nganhNgheData from "@/data/nganh-nghe.json";
import indexData from "@/data/tra-cuu/index-nganh.json";

type MucNganh = {
  ten: string;
  id: number | null;
  so_truong: number;
  so_to_hop: number;
  diem_min: number | null;
  diem_max: number | null;
};

type DongDiem = {
  truong: string;
  nganh: string;
  to_hop: string[];
  diem: { [nam: string]: number | null };
};

const DS: MucNganh[] = indexData;
const NGANH_NGHE = new Map(
  (nganhNgheData as NganhNghe[]).map((n) => [
    n.ten
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim(),
    n,
  ]),
);

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

function diemCua(d: { [nam: string]: number | null }, nam: string): string {
  const v = d[nam];
  return v == null ? "—" : v.toFixed(2).replace(/\.00$/, "");
}

export default function TraCuuNganhPage() {
  const [tuKhoa, setTuKhoa] = useState("");
  const [mo, setMo] = useState<string | null>(null);
  const [chiTiet, setChiTiet] = useState<{ [ten: string]: DongDiem[] }>({});
  const [dangTai, setDangTai] = useState<string | null>(null);
  const [soHien, setSoHien] = useState(36);

  const ketQua = useMemo(() => {
    const k = norm(tuKhoa);
    if (!k) return DS;
    return DS.filter((n) => norm(n.ten).includes(k));
  }, [tuKhoa]);

  async function moChiTiet(m: MucNganh) {
    if (mo === m.ten) {
      setMo(null);
      return;
    }
    setMo(m.ten);
    if (chiTiet[m.ten]) return;
    setDangTai(m.ten);
    try {
      const qs = m.id != null ? `nganh_id=${m.id}` : `nganh=${encodeURIComponent(m.ten)}`;
      const res = await fetch(`/api/tra-cuu?${qs}&limit=200`);
      const j = await res.json();
      setChiTiet((cu) => ({ ...cu, [m.ten]: (j.muc ?? []) as DongDiem[] }));
    } finally {
      setDangTai(null);
    }
  }

  return (
    <div className="relative z-10 flex min-h-screen flex-col text-stone-900">
      <SiteNav active="tra-cuu" />

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-10 sm:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Tra cứu</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">Tra cứu ngành học</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-500">
          {DS.length} ngành theo dữ liệu đề án tuyển sinh 2026. Xem ngành nào có bao nhiêu trường đào tạo,
          điểm chuẩn từ đâu đến đâu và xét tuyển bằng tổ hợp nào.
        </p>

        <div className="mt-7 max-w-3xl">
          <input
            value={tuKhoa}
            onChange={(e) => {
              setTuKhoa(e.target.value);
              setSoHien(36);
            }}
            placeholder="VD: công nghệ thông tin, y khoa, kế toán, du lịch..."
            className={oNhap}
          />
        </div>

        <p className="mt-5 text-sm font-semibold text-stone-500">
          Tìm thấy <span className="font-black text-stone-900">{ketQua.length}</span> ngành
        </p>

        {ketQua.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-stone-900/20 bg-white p-10 text-center">
            <p className="font-bold text-stone-700">Không có ngành nào khớp</p>
            <p className="mt-1 text-sm text-stone-500">Thử từ khóa ngắn hơn.</p>
          </div>
        ) : (
          <ul className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {ketQua.slice(0, soHien).map((n) => {
              const nghe = NGANH_NGHE.get(norm(n.ten));
              const dangMo = mo === n.ten;
              const dong = chiTiet[n.ten];
              return (
                <li key={n.ten} className="flex flex-col rounded-2xl border border-stone-900/10 bg-white p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-base font-extrabold leading-snug text-stone-900">{n.ten}</h2>
                    {nghe && (
                      <span className="shrink-0 rounded-md bg-blue-600/10 px-3 py-1 text-xs font-bold text-blue-700">
                        {nghe.linh_vuc}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5 text-xs font-semibold">
                    <span className="rounded-md border border-stone-900/10 bg-stone-900/[0.04] px-2.5 py-1 text-stone-600">
                      {n.so_truong} trường
                    </span>
                    {n.diem_min != null && n.diem_max != null && (
                      <span className="rounded-md border border-emerald-600/20 bg-emerald-600/10 px-2.5 py-1 text-emerald-800">
                        {n.diem_min.toFixed(2).replace(/\.00$/, "")}–{n.diem_max.toFixed(2).replace(/\.00$/, "")} điểm
                      </span>
                    )}
                    <span className="rounded-md border border-stone-900/10 bg-stone-900/[0.04] px-2.5 py-1 text-stone-600">
                      {n.so_to_hop} tổ hợp
                    </span>
                  </div>

                  {nghe && <p className="mt-3 text-sm leading-relaxed text-stone-600">{nghe.mo_ta}</p>}

                  {(() => {
                    const slug = slugNganh(n.ten);
                    if (slug) {
                      return (
                        <Link
                          href={`/tra-cuu/nganh/${slug}`}
                          className="mt-4 self-start rounded-lg border border-blue-600/30 px-3 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-blue-600 hover:text-white"
                        >
                          Xem trường &amp; điểm chuẩn 2026 →
                        </Link>
                      );
                    }
                    return (
                      <button
                        type="button"
                        onClick={() => moChiTiet(n)}
                        className="mt-4 self-start rounded-lg border border-stone-900/15 px-3 py-1.5 text-xs font-bold text-stone-600 transition hover:border-stone-900/30"
                      >
                        {dangMo ? "Ẩn danh sách trường" : "Xem điểm chuẩn 2026"}
                      </button>
                    );
                  })()}

                  {dangMo && (
                    <div className="mt-3 border-t border-stone-900/10 pt-3">
                      {dangTai === n.ten ? (
                        <p className="text-sm text-stone-500">Đang tải…</p>
                      ) : !dong || dong.length === 0 ? (
                        <p className="text-sm text-stone-500">Chưa có dữ liệu điểm cho ngành này.</p>
                      ) : (
                        <ul className="space-y-2">
                          {dong.map((d) => (
                            <li key={`${d.truong}-${d.nganh}`} className="text-sm leading-relaxed">
                              <span className="font-bold text-stone-900">{d.truong}</span>
                              <span className="text-stone-500"> — {d.nganh}</span>
                              <div className="mt-0.5 flex flex-wrap gap-1 text-xs text-stone-500">
                                <span className="font-semibold text-emerald-700">2026: {diemCua(d.diem, "2026") || diemCua(d.diem, "2025")}</span>
                                <span>· 2025: {diemCua(d.diem, "2025")}</span>
                                <span>· 2024: {diemCua(d.diem, "2024")}</span>
                                {d.to_hop.length > 0 && (
                                  <span className="text-stone-400">· {d.to_hop.slice(0, 6).join(", ")}{d.to_hop.length > 6 ? "…" : ""}</span>
                                )}
                              </div>
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
              onClick={() => setSoHien((s) => s + 36)}
              className="rounded-xl border border-stone-900/15 bg-white px-5 py-2.5 text-sm font-bold text-stone-700 transition hover:border-stone-900/30"
            >
              Xem thêm ({ketQua.length - soHien} ngành)
            </button>
          </div>
        )}

        <p className="mt-8 text-xs text-stone-400">
          Nguồn: tổng hợp đề án tuyển sinh từ HOCMAI (dữ liệu 2026, tham khảo — đối chiếu đề án chính thức của trường).
        </p>
      </main>
    </div>
  );
}
