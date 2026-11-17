"use client";

import { useMemo, useState } from "react";

import SiteNav from "../../components/SiteNav";
import type { KhoiThi } from "@/lib/types";
import khoiThiData from "@/data/khoi-thi.json";
import toHopData from "@/data/tra-cuu/to-hop.json";

type MucToHop = {
  ma: string;
  so_truong: number;
  so_nganh: number;
  diem_min: number | null;
  diem_max: number | null;
};

type DongDiem = {
  truong: string;
  nganh: string;
  to_hop: string[];
  diem: { [nam: string]: number | null };
};

const DS_KHOI = khoiThiData as KhoiThi[];
const KHOI = new Map(DS_KHOI.map((k) => [k.code.toUpperCase(), k]));
const DS: MucToHop[] = toHopData;

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
  return v == null ? "—" : v.toFixed(2).replace(/\.00$/, "");
}

export default function TraCuuToHopPage() {
  const [tuKhoa, setTuKhoa] = useState("");
  const [mo, setMo] = useState<string | null>(null);
  const [chiTiet, setChiTiet] = useState<{ [ma: string]: DongDiem[] }>({});
  const [dangTai, setDangTai] = useState<string | null>(null);

  const ketQua = useMemo(() => {
    const k = norm(tuKhoa);
    if (!k) return DS;
    return DS.filter((x) => {
      const goc = KHOI.get(x.ma);
      const noi = [x.ma, goc?.ten ?? "", ...(goc?.mon_thi ?? []), ...(goc?.phu_hop ?? [])].join(" ");
      return norm(noi).includes(k);
    });
  }, [tuKhoa]);

  async function moChiTiet(x: MucToHop) {
    if (mo === x.ma) {
      setMo(null);
      return;
    }
    setMo(x.ma);
    if (chiTiet[x.ma]) return;
    setDangTai(x.ma);
    try {
      const res = await fetch(`/api/tra-cuu?tohop=${encodeURIComponent(x.ma)}&limit=200`);
      const j = await res.json();
      setChiTiet((cu) => ({ ...cu, [x.ma]: (j.muc ?? []) as DongDiem[] }));
    } finally {
      setDangTai(null);
    }
  }

  return (
    <div className="relative z-10 flex min-h-screen flex-col text-stone-900">
      <SiteNav active="tra-cuu" />

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-10 sm:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Tra cứu</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">Tra cứu tổ hợp môn</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-500">
          {DS.length} tổ hợp xét tuyển có dữ liệu. Xem mã nào được bao nhiêu trường dùng, tuyển ngành gì
          và điểm chuẩn dao động bao nhiêu.
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
          Tìm thấy <span className="font-black text-stone-900">{ketQua.length}</span> tổ hợp
        </p>

        {ketQua.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-stone-900/20 bg-white p-10 text-center">
            <p className="font-bold text-stone-700">Không có tổ hợp nào khớp</p>
            <p className="mt-1 text-sm text-stone-500">Thử mã tổ hợp (VD: D01) hoặc tên môn (VD: Ngữ văn).</p>
          </div>
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {ketQua.map((x) => {
              const goc = KHOI.get(x.ma);
              const dangMo = mo === x.ma;
              const dong = chiTiet[x.ma];
              return (
                <li key={x.ma} className="rounded-2xl border border-stone-900/10 bg-white p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 min-w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 px-2 text-sm font-black text-white">
                      {x.ma}
                    </span>
                    <div className="min-w-0">
                      <h2 className="truncate text-sm font-extrabold leading-snug text-stone-900">
                        {goc?.ten ?? `Tổ hợp ${x.ma}`}
                      </h2>
                      <p className="text-xs font-semibold text-stone-500">
                        {x.so_truong} trường · {x.so_nganh} ngành
                      </p>
                    </div>
                  </div>

                  {goc && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {goc.mon_thi.map((m) => (
                        <span
                          key={m}
                          className="rounded-md border border-stone-900/10 bg-stone-900/[0.04] px-2.5 py-1 text-xs font-semibold text-stone-700"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  )}

                  {x.diem_min != null && x.diem_max != null && (
                    <p className="mt-3 text-xs font-bold text-emerald-800">
                      Điểm chuẩn 2025: {soDiem(x.diem_min)}–{soDiem(x.diem_max)}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => moChiTiet(x)}
                    className="mt-3 rounded-lg border border-blue-600/30 px-3 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-blue-600 hover:text-white"
                  >
                    {dangMo ? "Ẩn danh sách" : "Xem ngành & trường"}
                  </button>

                  {dangMo && (
                    <div className="mt-3 border-t border-stone-900/10 pt-3">
                      {dangTai === x.ma ? (
                        <p className="text-sm text-stone-500">Đang tải…</p>
                      ) : !dong || dong.length === 0 ? (
                        <p className="text-sm text-stone-500">Chưa có dữ liệu cho tổ hợp này.</p>
                      ) : (
                        <ul className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
                          {dong.map((d) => (
                            <li key={`${d.truong}-${d.nganh}`} className="text-xs leading-relaxed">
                              <span className="font-bold text-stone-900">{d.nganh}</span>
                              <span className="text-stone-500"> — {d.truong}</span>
                              <span className="ml-1 font-semibold text-emerald-700">{soDiem(d.diem["2025"] ?? null)}</span>
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

        <p className="mt-8 text-xs text-stone-400">
          Nguồn: tổng hợp đề án tuyển sinh từ HOCMAI (dữ liệu 2025, tham khảo — đối chiếu đề án chính thức của trường).
        </p>
      </main>
    </div>
  );
}
