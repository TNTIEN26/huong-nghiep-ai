"use client";

import { useMemo, useState } from "react";

import SiteNav from "../components/SiteNav";

const toHop: Record<string, [string, string, string]> = {
  A00: ["Toán", "Vật lý", "Hóa học"],
  A01: ["Toán", "Vật lý", "Tiếng Anh"],
  B00: ["Toán", "Hóa học", "Sinh học"],
  C00: ["Ngữ văn", "Lịch sử", "Địa lý"],
  D01: ["Ngữ văn", "Toán", "Tiếng Anh"],
  D07: ["Toán", "Hóa học", "Tiếng Anh"],
};

function parseDiem(v: string): number | null {
  if (v.trim() === "") return null;
  const n = Number(v.replace(",", "."));
  if (Number.isNaN(n) || n < 0 || n > 10) return null;
  return n;
}

const oNhap =
  "w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-[15px] text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-white/40";

function Nhan({ ten, children }: { ten: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-zinc-300">{ten}</span>
      {children}
    </label>
  );
}

function TabTotNghiep() {
  const [toan, setToan] = useState("");
  const [van, setVan] = useState("");
  const [anh, setAnh] = useState("");
  const [tuChon, setTuChon] = useState("");
  const [tb12, setTb12] = useState("");
  const [kk, setKk] = useState("");
  const [ut, setUt] = useState("");

  const kq = useMemo(() => {
    const ds = [toan, van, anh, tuChon, tb12].map(parseDiem);
    const k = kk.trim() === "" ? 0 : parseDiem(kk);
    const u = ut.trim() === "" ? 0 : parseDiem(ut);
    if (ds.some((d) => d === null) || k === null || u === null) return null;
    const [t, v, a, tc, tb] = ds as number[];
    const diem = ((t + v + a + tc + k) / 4 + tb) / 2 + u;
    return Math.round(diem * 100) / 100;
  }, [toan, van, anh, tuChon, tb12, kk, ut]);

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Nhan ten="Toán">
          <input value={toan} onChange={(e) => setToan(e.target.value)} inputMode="decimal" placeholder="VD: 8.5" className={oNhap} />
        </Nhan>
        <Nhan ten="Ngữ văn">
          <input value={van} onChange={(e) => setVan(e.target.value)} inputMode="decimal" placeholder="VD: 7.25" className={oNhap} />
        </Nhan>
        <Nhan ten="Ngoại ngữ">
          <input value={anh} onChange={(e) => setAnh(e.target.value)} inputMode="decimal" placeholder="VD: 9" className={oNhap} />
        </Nhan>
        <Nhan ten="Bài thi tự chọn">
          <input value={tuChon} onChange={(e) => setTuChon(e.target.value)} inputMode="decimal" placeholder="VD: 8" className={oNhap} />
        </Nhan>
        <Nhan ten="Điểm TB cả năm lớp 12">
          <input value={tb12} onChange={(e) => setTb12(e.target.value)} inputMode="decimal" placeholder="VD: 8.2" className={oNhap} />
        </Nhan>
        <Nhan ten="Điểm khuyến khích (nếu có)">
          <input value={kk} onChange={(e) => setKk(e.target.value)} inputMode="decimal" placeholder="VD: 1" className={oNhap} />
        </Nhan>
        <Nhan ten="Điểm ưu tiên (nếu có)">
          <input value={ut} onChange={(e) => setUt(e.target.value)} inputMode="decimal" placeholder="VD: 0.5" className={oNhap} />
        </Nhan>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-zinc-950 p-6 text-center">
        {kq === null ? (
          <p className="text-sm text-zinc-500">Nhập đủ điểm các ô để xem kết quả. Thang điểm 0–10.</p>
        ) : (
          <>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Điểm xét tốt nghiệp
            </p>
            <p className="mt-2 text-5xl font-black tabular-nums">{kq.toFixed(2)}</p>
            <p className={`mt-3 text-sm font-bold ${kq >= 5 ? "text-zinc-100" : "text-zinc-400"}`}>
              {kq >= 5 ? "Đủ điều kiện đỗ tốt nghiệp." : "Chưa đủ 5.00 để đỗ tốt nghiệp."}
            </p>
          </>
        )}
      </div>
      <p className="mt-4 text-xs leading-relaxed text-zinc-600">
        Công thức: [(tổng 4 bài thi + điểm khuyến khích) / 4 + điểm TB lớp 12] / 2 + điểm ưu tiên.
        Kết quả tham khảo.
      </p>
    </div>
  );
}

function TabToHop() {
  const [ma, setMa] = useState("A00");
  const [d1, setD1] = useState("");
  const [d2, setD2] = useState("");
  const [d3, setD3] = useState("");
  const [ut, setUt] = useState("");
  const mons = toHop[ma];

  const kq = useMemo(() => {
    const ds = [d1, d2, d3].map(parseDiem);
    const u = ut.trim() === "" ? 0 : parseDiem(ut);
    if (ds.some((d) => d === null) || u === null) return null;
    const tong = (ds as number[]).reduce((a, b) => a + b, 0) + u;
    return Math.round(tong * 100) / 100;
  }, [d1, d2, d3, ut]);

  const setters = [setD1, setD2, setD3];
  const values = [d1, d2, d3];

  return (
    <div>
      <Nhan ten="Tổ hợp xét tuyển">
        <div className="flex flex-wrap gap-2">
          {Object.keys(toHop).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMa(m)}
              aria-pressed={ma === m}
              className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
                ma === m
                  ? "bg-zinc-100 text-zinc-950"
                  : "border border-white/10 text-zinc-400 hover:border-white/25 hover:text-zinc-100"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </Nhan>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {mons.map((mon, i) => (
          <Nhan key={ma + mon} ten={mon}>
            <input
              value={values[i]}
              onChange={(e) => setters[i](e.target.value)}
              inputMode="decimal"
              placeholder="VD: 8.5"
              className={oNhap}
            />
          </Nhan>
        ))}
        <Nhan ten="Điểm ưu tiên (nếu có)">
          <input value={ut} onChange={(e) => setUt(e.target.value)} inputMode="decimal" placeholder="VD: 0.75" className={oNhap} />
        </Nhan>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-zinc-950 p-6 text-center">
        {kq === null ? (
          <p className="text-sm text-zinc-500">Nhập đủ điểm 3 môn để xem kết quả. Thang điểm 0–10.</p>
        ) : (
          <>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Tổng điểm {ma}
            </p>
            <p className="mt-2 text-5xl font-black tabular-nums">{kq.toFixed(2)}</p>
            <p className="mt-3 text-sm font-bold text-zinc-100">
              {kq >= 15
                ? "Đạt ngưỡng nguồn tuyển tối thiểu 15/30."
                : "Chưa đạt ngưỡng nguồn tuyển tối thiểu 15/30."}
            </p>
          </>
        )}
      </div>
      <p className="mt-4 text-xs leading-relaxed text-zinc-600">
        Tổng 3 môn + điểm ưu tiên, thang 30. Từ 2026, mọi phương thức đều cần tổng 3 môn thi
        tốt nghiệp đạt tối thiểu 15. Kết quả tham khảo.
      </p>
    </div>
  );
}

export default function TinhDiemPage() {
  const [tab, setTab] = useState<"tn" | "th">("tn");

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100">
      <SiteNav active="tinh-diem" />

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12 sm:py-16">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Tính điểm</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          Công cụ tính nhanh điểm xét tốt nghiệp và điểm xét tuyển tổ hợp. Chỉ mang tính tham khảo.
        </p>

        <div className="mt-8 flex gap-2 rounded-2xl border border-white/10 bg-zinc-900 p-1.5">
          {(
            [
              ["tn", "Xét tốt nghiệp"],
              ["th", "Xét tuyển tổ hợp"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-pressed={tab === id}
              className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold transition ${
                tab === id ? "bg-zinc-100 text-zinc-950" : "text-zinc-400 hover:text-zinc-100"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-zinc-900 p-6 sm:p-8">
          {tab === "tn" ? <TabTotNghiep /> : <TabToHop />}
        </div>
      </main>

      <footer className="border-t border-white/10 px-5 py-6 text-center text-xs text-zinc-600">
        Kết quả chỉ mang tính tham khảo.
      </footer>
    </div>
  );
}
