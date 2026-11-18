"use client";

import { useMemo, useState } from "react";

import SiteNav from "../../components/SiteNav";
import { NHOM_MON, TO_HOP_MON, nhomMonCua } from "@/lib/to-hop";
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
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function soDiem(v: number | null): string {
  return v == null ? "—" : v.toFixed(2).replace(/\.00$/, "");
}

export default function TraCuuToHopPage() {
  const [tuKhoa, setTuKhoa] = useState("");
  const [chonMon, setChonMon] = useState<string[]>([]);
  const [mo, setMo] = useState<string | null>(null);
  const [chiTiet, setChiTiet] = useState<{ [ma: string]: DongDiem[] }>({});
  const [dangTai, setDangTai] = useState<string | null>(null);

  const nhomTheoMa = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const x of DS) m.set(x.ma, nhomMonCua(x.ma));
    return m;
  }, []);

  const ketQua = useMemo(() => {
    const k = norm(tuKhoa);
    return DS.filter((x) => {
      if (chonMon.length > 0) {
        const nhom = nhomTheoMa.get(x.ma) ?? [];
        if (nhom.length === 0) return false;
        if (!chonMon.every((c) => nhom.includes(c))) return false;
      }
      if (!k) return true;
      const goc = KHOI.get(x.ma);
      const noi = [x.ma, goc?.ten ?? "", ...(goc?.mon_thi ?? []), ...(goc?.phu_hop ?? ""), ...(TO_HOP_MON.get(x.ma)?.mon ?? [])].join(" ");
      return norm(noi).includes(k);
    });
  }, [tuKhoa, chonMon, nhomTheoMa]);

  function bamChonMon(ten: string) {
    setMo(null);
    setChonMon((cu) => {
      if (cu.includes(ten)) return cu.filter((x) => x !== ten);
      if (cu.length >= 3) return cu;
      return [...cu, ten];
    });
  }

  const maChuaMon = useMemo(() => {
    const dem = new Map<string, number>();
    for (const x of DS) {
      for (const n of nhomTheoMa.get(x.ma) ?? []) dem.set(n, (dem.get(n) ?? 0) + 1);
    }
    return dem;
  }, [nhomTheoMa]);

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

        <section className="mt-8 rounded-2xl border border-stone-900/10 bg-white p-5 sm:p-6">
          <h2 className="text-lg font-extrabold tracking-tight sm:text-xl">Chọn môn học trong tổ hợp của em</h2>
          <p className="mt-1 text-sm italic text-stone-500">Lưu ý: Chọn tối đa 03 môn trong tổ hợp</p>

          <div className="mt-4 flex flex-wrap gap-2">
            {NHOM_MON.map((n) => {
              const chon = chonMon.includes(n.ten);
              const so = maChuaMon.get(n.ten) ?? 0;
              const day = !chon && chonMon.length >= 3;
              return (
                <button
                  key={n.ten}
                  type="button"
                  onClick={() => bamChonMon(n.ten)}
                  disabled={day || so === 0}
                  title={so === 0 ? "Chưa có tổ hợp nào trong dữ liệu dùng môn này" : `${so} tổ hợp`}
                  className={
                    "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition " +
                    (chon
                      ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                      : day || so === 0
                        ? "cursor-not-allowed border-stone-900/10 bg-stone-50 text-stone-300"
                        : "border-stone-900/10 bg-white text-stone-700 hover:border-blue-600/40 hover:text-blue-700")
                  }
                >
                  <span aria-hidden="true">{n.bieuTuong}</span>
                  {n.ten}
                  {so > 0 && (
                    <span className={"text-xs font-bold " + (chon ? "text-white/70" : "text-stone-400")}>{so}</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            <p className="font-semibold text-stone-600">
              Đã chọn:{" "}
              {chonMon.length === 0 ? (
                <span className="font-normal text-stone-400">chưa chọn môn nào</span>
              ) : (
                <span className="font-extrabold text-blue-700">{chonMon.join(" · ")}</span>
              )}
            </p>
            {chonMon.length > 0 && (
              <button
                type="button"
                onClick={() => setChonMon([])}
                className="rounded-lg border border-stone-900/15 px-3 py-1 text-xs font-bold text-stone-600 transition hover:border-stone-900/30"
              >
                Xóa lựa chọn
              </button>
            )}
            {chonMon.length === 3 && (
              <span className="text-xs font-semibold text-emerald-700">Đã đủ 3 môn</span>
            )}
          </div>
        </section>

        <div className="mt-6 max-w-3xl">
          <input
            value={tuKhoa}
            onChange={(e) => setTuKhoa(e.target.value)}
            placeholder="VD: A00, Toán, Hóa, y - dược..."
            className={oNhap}
          />
        </div>

        <p className="mt-5 text-sm font-semibold text-stone-500">
          Tìm thấy <span className="font-black text-stone-900">{ketQua.length}</span> tổ hợp
          {chonMon.length > 0 && <span className="font-normal text-stone-400"> có đủ các môn đã chọn</span>}
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

                  {(() => {
                    const mon = TO_HOP_MON.get(x.ma)?.mon ?? goc?.mon_thi ?? [];
                    if (mon.length === 0) return null;
                    return (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {mon.map((m) => (
                          <span
                            key={m}
                            className="rounded-md border border-stone-900/10 bg-stone-900/[0.04] px-2.5 py-1 text-xs font-semibold text-stone-700"
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    );
                  })()}

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
