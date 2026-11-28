"use client";

import { useEffect, useState } from "react";

import SiteNav from "../components/SiteNav";
import toHopMonData from "@/data/tra-cuu/to-hop-mon.json";

type Muc = "hocba" | "totnghiep" | "quydoi";

type Cot = "l10" | "l11" | "l12" | "hk1-12";
type BangDiem = { [mon: string]: Partial<Record<Cot, string>> };

const MON_HOC = [
  "Toán",
  "Ngữ văn",
  "Tiếng Anh",
  "Lịch sử",
  "Địa lí",
  "GDKTPL",
  "Vật lí",
  "Hóa học",
  "Sinh học",
  "Tin học",
  "Công nghệ",
] as const;

const NHAN_COT: Record<Cot, string> = {
  l10: "Cả năm lớp 10",
  l11: "Cả năm lớp 11",
  l12: "Cả năm lớp 12",
  "hk1-12": "HK1 lớp 12",
};

const PHUONG_THUC: { id: string; ten: string; cot: Cot[]; ghiChu: string }[] = [
  {
    id: "3-nam",
    ten: "Học bạ 3 năm (6 học kỳ)",
    cot: ["l10", "l11", "l12"],
    ghiChu: "Trung bình điểm cả năm của lớp 10, 11, 12 (mỗi năm tính như nhau).",
  },
  {
    id: "nam-12",
    ten: "Cả năm lớp 12",
    cot: ["l12"],
    ghiChu: "Chỉ dùng điểm cả năm lớp 12.",
  },
  {
    id: "10-11-hk1",
    ten: "Lớp 10, 11 + HK1 lớp 12 (5 học kỳ)",
    cot: ["l10", "l11", "hk1-12"],
    ghiChu: "Dùng điểm cả năm lớp 10, cả năm lớp 11 và học kỳ 1 lớp 12.",
  },
  {
    id: "3-hk",
    ten: "Học bạ 3 học kỳ",
    cot: ["l11", "hk1-12"],
    ghiChu: "Cả năm lớp 11 (2 học kỳ) + học kỳ 1 lớp 12.",
  },
];

const TO_HOP = toHopMonData as { ma: string; mon: string[] }[];

function chuanHoaMon(s: string): string | null {
  const k = s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  if (k === "toan") return "Toán";
  if (k === "van" || k === "ngu van") return "Ngữ văn";
  if (k === "tieng anh" || k === "anh") return "Tiếng Anh";
  if (k === "lich su") return "Lịch sử";
  if (k === "dia li" || k === "dia ly" || k === "dia") return "Địa lí";
  if (k.startsWith("gdkt") || k.startsWith("gdcd") || k === "giao duc kinh te va phap luat") return "GDKTPL";
  if (k === "vat li" || k === "vat ly") return "Vật lí";
  if (k === "hoa hoc" || k === "hoa") return "Hóa học";
  if (k === "sinh hoc" || k === "sinh") return "Sinh học";
  if (k === "tin hoc" || k === "tin") return "Tin học";
  if (k.startsWith("cong nghe")) return "Công nghệ";
  return null;
}

// Nhập nhanh kiểu tuyensinh247: 66 → 6.6, 625 → 6.25, 100 → 10.0
function parseDiemNhanh(v: string): number | null {
  const s = v.trim().replace(",", ".");
  if (s === "") return null;
  if (/^\d+$/.test(s) && s !== "10") {
    if (s.length === 2) return Number(s[0] + "." + s[1]);
    if (s.length === 3) return Number(s[0] + "." + s.slice(1));
  }
  return parseDiem(v);
}

const DANH_MUC: { id: Muc; so: string; ten: string; moTa: string }[] = [
  { id: "hocba", so: "1", ten: "Học bạ cấp 3", moTa: "11 môn × lớp 10, 11, 12 · 4 cách xét" },
  { id: "totnghiep", so: "2", ten: "Xét tốt nghiệp", moTa: "Tự lấy TB 3 năm, nhập thêm 4 môn thi" },
  { id: "quydoi", so: "3", ten: "Quy đổi ĐGNL", moTa: "Đổi điểm HSA, V-ACT, TSA sang thang 30" },
];

function parseDiem(v: string, max = 10): number | null {
  if (v.trim() === "") return null;
  const n = Number(v.replace(",", "."));
  if (Number.isNaN(n) || n < 0 || n > max) return null;
  return n;
}

const oNhap =
  "w-full rounded-xl border border-stone-900/10 bg-[#F4F8FE] px-4 py-3 text-[15px] text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-blue-500/60";

function Nhan({ ten, children }: { ten: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-stone-700">{ten}</span>
      {children}
    </label>
  );
}

function KetQua({ tieuDe, so, nhanXet }: { tieuDe: string; so: string; nhanXet: string }) {
  return (
    <div className="mt-6 rounded-2xl border border-stone-900/10 bg-[#F4F8FE] p-6 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">{tieuDe}</p>
            <p className="mt-2 text-5xl font-black tabular-nums text-blue-700">{so}</p>
      <p className="mt-3 text-sm font-bold text-stone-900">{nhanXet}</p>
    </div>
  );
}

/* ---------- MỤC 1: HỌC BẠ ---------- */
const oDiem =
  "h-11 w-full min-w-0 rounded-lg border border-stone-900/20 bg-white px-1 text-center text-base font-semibold tabular-nums text-stone-900 outline-none transition placeholder:font-normal placeholder:text-stone-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

function MucHocBa({
  bang,
  setBang,
  tbNam,
  tb3,
}: {
  bang: BangDiem;
  setBang: React.Dispatch<React.SetStateAction<BangDiem>>;
  tbNam: { lop10: string; lop11: string; lop12: string };
  tb3: string;
}) {
  const [pt, setPt] = useState("3-nam");
  const [heSo2, setHeSo2] = useState("");
  const [uuTien, setUuTien] = useState("");

  const phuongThuc = PHUONG_THUC.find((x) => x.id === pt) ?? PHUONG_THUC[0];
  const cot = phuongThuc.cot;

  const datDiem = (mon: string, c: Cot, v: string) => {
    setBang((cu) => ({ ...cu, [mon]: { ...(cu[mon] ?? {}), [c]: v } }));
  };

  // ĐTB từng môn trên các cột đang dùng; ô trống tính là 0.00
  const monDiem = MON_HOC.map((mon) => {
    const o = bang[mon] ?? {};
    const coNhap = cot.some((c) => (o[c] ?? "").trim() !== "");
    const tong = cot.reduce((s, c) => s + (parseDiemNhanh(o[c] ?? "") ?? 0), 0);
    return { mon, coNhap, tb: tong / cot.length };
  });
  const theoMon = new Map<string, { mon: string; coNhap: boolean; tb: number }>(
    monDiem.map((x) => [x.mon, x]),
  );

  const u = Math.min(3, Math.max(0, parseDiemNhanh(uuTien) ?? 0));
  const heSoKey = heSo2 === "" ? null : chuanHoaMon(heSo2);

  const toHop: { ma: string; mon: string[]; diem: number; diemUt: number }[] = [];
  for (const th of TO_HOP) {
    const mons = th.mon.map(chuanHoaMon);
    if (mons.some((m) => m === null)) continue;
    const sach = mons as string[];
    const dong = sach.map((m) => theoMon.get(m));
    if (dong.some((d) => !d || !d.coNhap)) continue;
    const viTriHeSo = heSoKey ? sach.indexOf(heSoKey) : -1;
    if (heSoKey && viTriHeSo === -1) continue;
    let diem = 0;
    let toiDa = 30;
    for (let i = 0; i < sach.length; i++) {
      const x2 = i === viTriHeSo;
      diem += (dong[i] as { tb: number }).tb * (x2 ? 2 : 1);
      if (x2) toiDa += 10;
    }
    const diemUt = diem < 22.5 ? diem + u : diem + ((toiDa - diem) / 7.5) * u;
    toHop.push({ ma: th.ma, mon: sach, diem, diemUt });
  }
  toHop.sort((a, b) => b.diemUt - a.diemUt);

  return (
    <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="min-w-0">
        <p className="text-sm font-bold text-stone-900">Phương thức xét học bạ</p>
        <div className="mt-2 grid grid-cols-2 gap-2 lg:grid-cols-4">
          {PHUONG_THUC.map((x) => (
            <button
              key={x.id}
              type="button"
              onClick={() => setPt(x.id)}
              aria-pressed={pt === x.id}
              className={`flex min-h-[3.25rem] items-center justify-center rounded-xl px-2.5 py-2 text-center text-[13.5px] font-bold leading-snug transition sm:text-sm ${
                pt === x.id
                  ? "bg-blue-600 text-white"
                  : "border border-stone-900/10 bg-white text-stone-600 hover:border-stone-900/25"
              }`}
            >
              {x.ten}
            </button>
          ))}
        </div>
        <p className="mt-2.5 rounded-lg bg-blue-50 px-3 py-2 text-[13px] leading-relaxed text-blue-900">{phuongThuc.ghiChu}</p>

        <div className="mt-4 overflow-hidden rounded-xl border border-stone-900/10">
          <table className="w-full table-fixed border-collapse text-sm">
            <thead>
              <tr className="bg-stone-900 text-[#F4F8FE]">
                <th className="w-[30%] bg-stone-900 px-3 py-2.5 text-left text-[13px] font-bold sm:w-40 sm:text-sm">Môn học</th>
                {cot.map((c) => (
                  <th key={c} className="px-1 py-2.5 text-center text-[12.5px] font-bold leading-tight sm:text-sm">
                    {NHAN_COT[c]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MON_HOC.map((mon, i) => (
                <tr key={mon} className={i % 2 ? "bg-[#F7FAFF]" : "bg-white"}>
                  <th
                    scope="row"
                    className={`px-3 py-1.5 text-left text-[14.5px] font-semibold leading-tight sm:text-[15px] ${
                      i % 2 ? "bg-[#F7FAFF]" : "bg-white"
                    }`}
                  >
                    {mon}
                  </th>
                  {cot.map((c) => (
                    <td key={c} className="px-1.5 py-1.5 sm:px-2">
                      <input
                        value={bang[mon]?.[c] ?? ""}
                        onChange={(e) => datDiem(mon, c, e.target.value)}
                        inputMode="decimal"
                        placeholder="0.00"
                        aria-label={`${mon} – ${NHAN_COT[c]}`}
                        className={oDiem}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-2 text-xs leading-relaxed text-stone-500">
          Không bắt buộc nhập hết: ô để trống tính là <b>0.00</b> (chỉ nên bỏ trống môn không học/xét).
          Mẹo nhập nhanh: <span className="tabular-nums">66</span> = 6.6,{" "}
          <span className="tabular-nums">625</span> = 6.25, <span className="tabular-nums">100</span> = 10.0.
        </p>
      </div>

      <aside className="h-fit xl:sticky xl:top-24">
        <div className="rounded-xl border border-stone-900/10 bg-[#F4F8FE] p-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-stone-500">Kết quả xét học bạ</p>

          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <Nhan ten="Điểm ưu tiên (Ư.T, nếu có)">
              <input
                value={uuTien}
                onChange={(e) => setUuTien(e.target.value)}
                inputMode="decimal"
                placeholder="VD: 0.5"
                className={oNhap}
              />
            </Nhan>
            <Nhan ten="Môn nhân hệ số 2 (nếu trường xét)">
              <select
                value={heSo2}
                onChange={(e) => setHeSo2(e.target.value)}
                className="w-full rounded-xl border border-stone-900/10 bg-white px-4 py-3 text-[15px] font-bold text-stone-900 outline-none focus:border-blue-500/60"
              >
                <option value="">Không nhân hệ số</option>
                {MON_HOC.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </Nhan>
          </div>

          <div className="mt-4">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-stone-500">ĐTB từng môn</p>
            <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              {monDiem.map((x) => (
                <li key={x.mon} className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-stone-600">{x.mon}</span>
                  <span
                    className={`tabular-nums font-bold ${x.coNhap ? "text-stone-900" : "text-stone-300"}`}
                  >
                    {x.tb.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Điểm trung bình từng năm — chỉ tính các môn đã nhập điểm */}
          <div className="mt-4 rounded-lg border border-blue-600/20 bg-blue-50/70 p-3">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-900">
              Điểm trung bình từng năm
            </p>
            <p className="mt-1 text-[11px] leading-snug text-blue-900/70">
              Chỉ tính các môn đã nhập điểm. Môn để trống (không học) không được chia trung bình.
            </p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(["lop10", "lop11", "lop12"] as const).map((k, i) => (
                <div key={k} className="rounded-lg bg-white px-1 py-2 text-center">
                  <span className="block text-[11px] font-semibold text-stone-500">Lớp {10 + i}</span>
                  <span
                    className={`tabular-nums text-base font-black ${tbNam[k] ? "text-blue-700" : "text-stone-300"}`}
                  >
                    {tbNam[k] || "—"}
                  </span>
                </div>
              ))}
            </div>
            {tb3 ? (
              <p className="mt-2 border-t border-blue-600/15 pt-2 text-xs font-semibold text-blue-900">
                ĐTB 3 năm (L10×1 + L11×2 + L12×3) ÷ 6: <span className="font-black">{tb3}</span>
                <span className="mt-0.5 block font-normal text-blue-900/70">
                  Đã tự động điền sang mục 2 “Điểm trung bình dùng để xét”.
                </span>
              </p>
            ) : (
              <p className="mt-2 text-[11px] text-blue-900/70">
                Nhập điểm ở ít nhất một năm để xem ĐTB 3 năm.
              </p>
            )}
          </div>

          <div className="mt-5 border-t border-stone-900/10 pt-3">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-stone-500">
              Điểm theo tổ hợp {toHop.length > 0 && `(${toHop.length})`}
            </p>
            {toHop.length === 0 ? (
              <p className="mt-2 text-sm leading-relaxed text-stone-500">
                Nhập điểm của ít nhất 3 môn có trong tổ hợp để xem điểm xét tuyển.
              </p>
            ) : (
              <ul className="mt-2 max-h-80 space-y-1.5 overflow-y-auto pr-1">
                {toHop.map((x) => (
                  <li
                    key={x.ma}
                    className="flex items-baseline justify-between gap-2 rounded-md bg-white px-2.5 py-1.5"
                  >
                    <span className="min-w-0">
                      <span className="text-sm font-bold text-blue-700">{x.ma}</span>
                      <span className="ml-1.5 truncate text-xs text-stone-400">{x.mon.join(" · ")}</span>
                    </span>
                    <span className="shrink-0 tabular-nums text-sm font-black text-stone-900">
                      {x.diemUt.toFixed(2)}
                      {u > 0 && (
                        <span className="ml-1 text-[10px] font-semibold text-stone-400">
                          (gốc {x.diem.toFixed(2)})
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <p className="mt-3 text-[11px] leading-relaxed text-stone-500">
            Tổ hợp = tổng ĐTB 3 môn (thang 30). Cộng ưu tiên: dưới 22.5 cộng thẳng; từ 22.5 trở lên cộng
            [(tối đa − tổng)/7.5] × Ư.T. Kết quả tham khảo.
          </p>
        </div>
      </aside>
    </div>
  );
}

/* ---------- Sơ đồ tính điểm tốt nghiệp (từng bước) ---------- */
function Chip({ nhan, v, tone = "xam" }: { nhan: string; v: string; tone?: "xam" | "xanh" | "cam" }) {
  const mau =
    tone === "xanh"
      ? "border-blue-200 bg-blue-50 text-blue-800"
      : tone === "cam"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : "border-stone-900/10 bg-white text-stone-900";
  return (
    <span className={`inline-flex min-w-[3.25rem] flex-col items-center rounded-lg border px-2 py-1 leading-tight ${mau}`}>
      <span className="text-[11px] font-medium opacity-70">{nhan}</span>
      <span className="text-[15px] font-bold tabular-nums">{v}</span>
    </span>
  );
}

function Toan({ c }: { c: string }) {
  return <span className="px-0.5 text-base font-bold text-stone-400">{c}</span>;
}

function BuocSoDo({
  so,
  tieuDe,
  moTa,
  ketQua,
  children,
}: {
  so: number;
  tieuDe: string;
  moTa?: string;
  ketQua: string;
  children: React.ReactNode;
}) {
  return (
    <li className="relative rounded-xl border border-stone-900/10 bg-white p-3.5">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
          {so}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold leading-snug text-stone-900">{tieuDe}</p>
          {moTa && <p className="mt-0.5 text-[13px] leading-snug text-stone-500">{moTa}</p>}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">{children}</div>
      <p className="mt-3 flex items-baseline justify-between gap-3 border-t border-dashed border-stone-900/15 pt-2.5">
        <span className="text-[13px] font-semibold text-stone-500">Kết quả bước {so}</span>
        <span className="text-xl font-black tabular-nums text-blue-700">{ketQua}</span>
      </p>
    </li>
  );
}

/* ---------- MỤC 2: XÉT TỐT NGHIỆP ---------- */
function MucTotNghiep({ tbSan, tbNam }: { tbSan: string; tbNam: { lop10: string; lop11: string; lop12: string } }) {
  const [toan, setToan] = useState("");
  const [van, setVan] = useState("");
  const [tc1, setTc1] = useState("");
  const [tc2, setTc2] = useState("");
  const [tbTay, setTbTay] = useState("");
  const [kk, setKk] = useState("");
  const [dien, setDien] = useState("D1");

  // Tự động điền ĐTB 3 năm từ mục 1 vào ô "Điểm trung bình dùng để xét".
  // Người dùng vẫn có thể sửa tay; giá trị tự động chỉ cập nhật khi dữ liệu mục 1 đổi.
  useEffect(() => {
    if (tbSan) setTbTay(tbSan);
  }, [tbSan]);

  // Ưu tiên số người dùng tự gõ, nếu chưa gõ thì lấy TB 3 năm từ mục 1
  const tb = tbTay !== "" ? tbTay : tbSan;

  const ds = [toan, van, tc1, tc2, tb].map((v) => parseDiem(v));
  // Điểm KK tối đa 4; điểm UT tốt nghiệp theo diện (D1: 0, D2: 0.25, D3: 0.5)
  const k = kk.trim() === "" ? 0 : parseDiem(kk, 4);
  const u = dien === "D3" ? 0.5 : dien === "D2" ? 0.25 : 0;
  const kq =
    ds.some((d) => d === null) || k === null
      ? null
      : Math.round((((ds as number[]).slice(0, 4).reduce((a, b) => a + b, 0) + k) / 4 + (ds as number[])[4]) / 2 * 100) / 100 + u;
  // Điểm liệt: bất kỳ môn thi nào ≤ 1.0 là trượt tốt nghiệp
  const liet = (ds as (number | null)[]).slice(0, 4).some((d) => d !== null && d <= 1);

  // Số hiện trên sơ đồ (chưa nhập thì hiện …)
  const hien = (v: string) => (parseDiem(v) === null ? "…" : v.trim());
  const hb = [tbNam.lop10, tbNam.lop11, tbNam.lop12].map((v) => parseDiem(v));
  const hbDu = hb.every((d) => d !== null);
  const tbSo = parseDiem(tb);
  const bon = ds.slice(0, 4) as (number | null)[];
  const tb4 =
    bon.every((d) => d !== null) && k !== null
      ? ((bon as number[]).reduce((x, y) => x + y, 0) + k) / 4
      : null;

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div>
      <Nhan ten="Điểm trung bình dùng để xét">
        <input
          value={tb}
          onChange={(e) => setTbTay(e.target.value)}
          inputMode="decimal"
          placeholder={tbSan ? `Tự lấy từ học bạ: ${tbSan}` : "VD: 8.2 (điền ở mục 1 để tự lấy)"}
          className={oNhap}
        />
      </Nhan>
      {tbSan && tbTay === tbSan && (
        <p className="mt-1.5 text-xs text-stone-500">
          Đã tự động điền TB 3 năm từ mục 1 — bạn có thể sửa tay nếu cần.
        </p>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Nhan ten="Toán">
          <input value={toan} onChange={(e) => setToan(e.target.value)} inputMode="decimal" placeholder="VD: 8.5" className={oNhap} />
        </Nhan>
        <Nhan ten="Ngữ văn">
          <input value={van} onChange={(e) => setVan(e.target.value)} inputMode="decimal" placeholder="VD: 7.25" className={oNhap} />
        </Nhan>
        <Nhan ten="Môn tự chọn 1">
          <input value={tc1} onChange={(e) => setTc1(e.target.value)} inputMode="decimal" placeholder="VD: 9" className={oNhap} />
        </Nhan>
        <Nhan ten="Môn tự chọn 2">
          <input value={tc2} onChange={(e) => setTc2(e.target.value)} inputMode="decimal" placeholder="VD: 8" className={oNhap} />
        </Nhan>
        <Nhan ten="Điểm khuyến khích (tối đa 4)">
          <input value={kk} onChange={(e) => setKk(e.target.value)} inputMode="decimal" placeholder="VD: 1.5" className={oNhap} />
        </Nhan>
        <Nhan ten="Diện ưu tiên tốt nghiệp">
          <select value={dien} onChange={(e) => setDien(e.target.value)} className="w-full rounded-xl border border-stone-900/10 bg-[#F4F8FE] px-4 py-3 text-[15px] font-bold text-stone-900 outline-none focus:border-blue-500/60">
            <option value="D1">Diện 1 — bình thường (+0)</option>
            <option value="D2">Diện 2 (+0.25)</option>
            <option value="D3">Diện 3 (+0.5)</option>
          </select>
        </Nhan>
      </div>

      {kq === null ? (
        <p className="mt-6 rounded-2xl border border-stone-900/10 bg-[#F4F8FE] p-6 text-center text-sm text-stone-500">
          Nhập đủ điểm các ô để xem có đỗ tốt nghiệp không.
        </p>
      ) : (
        <KetQua
          tieuDe="Điểm xét tốt nghiệp"
          so={kq.toFixed(2)}
          nhanXet={
            liet
              ? "Trượt tốt nghiệp do có môn bị điểm liệt (≤ 1.0)."
              : kq >= 5
                ? "Đủ điều kiện đỗ tốt nghiệp."
                : "Chưa đủ 5.00 để đỗ tốt nghiệp."
          }
        />
      )}
      <p className="mt-4 text-xs leading-relaxed text-stone-500">
        Công thức: [(tổng 4 bài thi + điểm khuyến khích) / 4 + điểm TB] / 2 + điểm ưu tiên.
        Đỗ khi mọi môn thi đều trên 1.0 và ĐXTN từ 5.0 trở lên. Kết quả tham khảo.
      </p>
      </div>

      {/* Sơ đồ tính điểm — từng bước, số nhảy theo ô nhập */}
      <aside className="h-fit rounded-2xl border border-stone-900/10 bg-[#F4F8FE] p-4 sm:p-5 xl:sticky xl:top-24">
        <p className="text-sm font-extrabold text-stone-900">Cách tính điểm xét tốt nghiệp</p>
        <p className="mt-1 text-[13px] leading-snug text-stone-500">
          Chia 3 bước. Nhập điểm bên cạnh, các số dưới đây tự cập nhật.
        </p>

        <ol className="mt-4 space-y-3">
          <BuocSoDo
            so={1}
            tieuDe="Điểm trung bình các năm học"
            moTa="Lớp 11 tính gấp đôi, lớp 12 gấp ba, rồi chia 6"
            ketQua={hbDu ? ((hb[0]! + hb[1]! * 2 + hb[2]! * 3) / 6).toFixed(2) : tb !== "" && parseDiem(tb) !== null ? Number(tb).toFixed(2) : "…"}
          >
            <Toan c="(" />
            <Chip nhan="Lớp 10 ×1" v={hien(tbNam.lop10)} tone="xanh" />
            <Toan c="+" />
            <Chip nhan="Lớp 11 ×2" v={hien(tbNam.lop11)} tone="xanh" />
            <Toan c="+" />
            <Chip nhan="Lớp 12 ×3" v={hien(tbNam.lop12)} tone="xanh" />
            <Toan c=")" />
            <Toan c="÷ 6" />
          </BuocSoDo>

          <BuocSoDo
            so={2}
            tieuDe="Trung bình 4 bài thi + điểm khuyến khích"
            moTa="Cộng 4 bài thi và điểm khuyến khích, chia 4"
            ketQua={tb4 === null ? "…" : tb4.toFixed(2)}
          >
            <Toan c="(" />
            <Chip nhan="Toán" v={hien(toan)} />
            <Toan c="+" />
            <Chip nhan="Ngữ văn" v={hien(van)} />
            <Toan c="+" />
            <Chip nhan="Tự chọn 1" v={hien(tc1)} />
            <Toan c="+" />
            <Chip nhan="Tự chọn 2" v={hien(tc2)} />
            <Toan c="+" />
            <Chip nhan="Khuyến khích" v={kk.trim() === "" ? "0" : hien(kk)} tone="cam" />
            <Toan c=")" />
            <Toan c="÷ 4" />
          </BuocSoDo>

          <BuocSoDo
            so={3}
            tieuDe="Điểm xét tốt nghiệp"
            moTa="Trung bình của bước 2 và bước 1, rồi cộng điểm ưu tiên"
            ketQua={kq === null ? "…" : kq.toFixed(2)}
          >
            <Toan c="(" />
            <Chip nhan="Bước 2" v={tb4 === null ? "…" : tb4.toFixed(2)} tone="xanh" />
            <Toan c="+" />
            <Chip nhan="Bước 1" v={tbSo === null ? "…" : tbSo.toFixed(2)} tone="xanh" />
            <Toan c=")" />
            <Toan c="÷ 2" />
            <Toan c="+" />
            <Chip nhan="Ưu tiên" v={u.toFixed(2)} tone="cam" />
          </BuocSoDo>
        </ol>

        <p className="mt-3 text-[13px] leading-snug text-stone-500">
          Đỗ khi <b>mọi bài thi trên 1.0</b> và điểm xét từ <b>5.0</b> trở lên.
        </p>
      </aside>
    </div>
  );
}

/* ---------- MỤC 3: QUY ĐỔI ĐIỂM (kiểu NEU) ---------- */
type Diem30 = { ten: string; chiTiet: string; diem: number };

function bandDiem(band: [number, number][], v: number): number | null {
  for (const [nguong, diem] of band) if (v >= nguong) return diem;
  return null;
}

// Bảng IELTS theo NEU 2026 (5 mức); TOEFL/TOEIC là tương đương gần đúng
const BANG_IELTS: [number, number][] = [[7.5, 10], [7.0, 9.5], [6.5, 9], [6.0, 8.5], [5.5, 8]];
const BANG_TOEFL: [number, number][] = [[110, 10], [102, 9.5], [94, 9], [87, 8.5], [80, 8]];
const BANG_TOEIC_LR: [number, number][] = [[940, 10], [880, 9.5], [820, 9], [750, 8.5], [680, 8]];

const KV_UT = [
  { id: "KV3", ten: "KV3 (không ưu tiên)", diem: 0 },
  { id: "KV2", ten: "KV2 (+0.25)", diem: 0.25 },
  { id: "KV2-NT", ten: "KV2-NT (+0.5)", diem: 0.5 },
  { id: "KV1", ten: "KV1 (+0.75)", diem: 0.75 },
];
const DT_UT = [
  { id: "khong", ten: "Không thuộc đối tượng (0)", diem: 0 },
  { id: "UT1-01", ten: "Đối tượng 01 (UT1) (2)", diem: 2 },
  { id: "UT1-02", ten: "Đối tượng 02 (UT1) (2)", diem: 2 },
  { id: "UT1-03", ten: "Đối tượng 03 (UT1) (2)", diem: 2 },
  { id: "UT2-04", ten: "Đối tượng 04 (UT2) (1)", diem: 1 },
  { id: "UT2-05", ten: "Đối tượng 05 (UT2) (1)", diem: 1 },
  { id: "UT2-06", ten: "Đối tượng 06 (UT2) (1)", diem: 1 },
  { id: "UT2-07", ten: "Đối tượng 07 (UT2) (1)", diem: 1 },
];
const HSG_UT = [
  { id: "khong", ten: "Không", diem: 0 },
  { id: "nhat", ten: "Giải Nhất", diem: 1.5 },
  { id: "nhi", ten: "Giải Nhì", diem: 1.0 },
  { id: "ba", ten: "Giải Ba", diem: 0.5 },
];

function MucQuyDoi() {
  const [sat, setSat] = useState("");
  const [act, setAct] = useState("");
  const [hsa, setHsa] = useState("");
  const [vact, setVact] = useState("");
  const [tsa, setTsa] = useState("");
  const [ielts, setIelts] = useState("");
  const [toefl, setToefl] = useState("");
  const [toeicLR, setToeicLR] = useState("");
  const [toeicS, setToeicS] = useState("");
  const [toeicW, setToeicW] = useState("");
  const [toan, setToan] = useState("");
  const [van, setVan] = useState("");
  const [mon3, setMon3] = useState("Vật lý");
  const [d3, setD3] = useState("");
  const [mon4, setMon4] = useState("");
  const [d4, setD4] = useState("");
  const [kv, setKv] = useState(KV_UT[0]);
  const [dt, setDt] = useState(DT_UT[0]);
  const [hsg, setHsg] = useState(HSG_UT[0]);

  const MON_TU_CHON = ["Vật lý", "Hóa học", "Sinh học", "Lịch sử", "Địa lý", "Tiếng Anh"];

  const BANG_TO_HOP: { ma: string; mons: [string, string, string] }[] = [
    { ma: "A00", mons: ["Toán", "Vật lý", "Hóa học"] },
    { ma: "A01", mons: ["Toán", "Vật lý", "Tiếng Anh"] },
    { ma: "A02", mons: ["Toán", "Vật lý", "Sinh học"] },
    { ma: "B00", mons: ["Toán", "Hóa học", "Sinh học"] },
    { ma: "B03", mons: ["Toán", "Sinh học", "Ngữ văn"] },
    { ma: "C00", mons: ["Ngữ văn", "Lịch sử", "Địa lý"] },
    { ma: "C01", mons: ["Ngữ văn", "Toán", "Vật lý"] },
    { ma: "C02", mons: ["Ngữ văn", "Toán", "Hóa học"] },
    { ma: "D01", mons: ["Ngữ văn", "Toán", "Tiếng Anh"] },
    { ma: "D07", mons: ["Toán", "Hóa học", "Tiếng Anh"] },
    { ma: "D09", mons: ["Toán", "Lịch sử", "Tiếng Anh"] },
    { ma: "D10", mons: ["Toán", "Địa lý", "Tiếng Anh"] },
  ];

  // Điểm cộng KV + ĐT theo kiểu lũy thoái của Bộ GD&ĐT.
  // Tổng mọi điểm cộng (KV + ĐT + HSG) không quá 10% thang điểm (= 3 điểm).
  // Tổng đạt ≥ 22,5 thì UT = [(30 − tổng)/7,5] × mức; điểm xét tuyển ≤ 30.
  // Giải HSG cộng thẳng vào tổng điểm tổ hợp THPT.
  const mucUT = Math.min(3, kv.diem + dt.diem);
  const cong = (diemGoc: number, thuongHSG = 0) => {
    const ut = diemGoc >= 22.5 ? ((30 - diemGoc) / 7.5) * mucUT : mucUT;
    const tongCong = Math.min(3, ut + thuongHSG);
    return Math.min(30, Math.round((diemGoc + tongCong) * 100) / 100);
  };

  const pp: Diem30[] = [];
  const vSat = parseDiem(sat, 1600);
  if (vSat !== null) pp.push({ ten: "SAT", chiTiet: `Điểm30(SAT ${sat.trim()})`, diem: cong((vSat / 1600) * 30) });
  const vAct = parseDiem(act, 36);
  if (vAct !== null) pp.push({ ten: "ACT", chiTiet: `Điểm30(ACT ${act.trim()})`, diem: cong((vAct / 36) * 30) });
  const vHsa = parseDiem(hsa, 150);
  if (vHsa !== null) pp.push({ ten: "HSA", chiTiet: `Điểm30(HSA ${hsa.trim()})`, diem: cong((vHsa / 150) * 30) });
  const vVact = parseDiem(vact, 1200);
  if (vVact !== null) pp.push({ ten: "V-ACT", chiTiet: `Điểm30(V-ACT ${vact.trim()})`, diem: cong((vVact / 1200) * 30) });
  const vTsa = parseDiem(tsa, 100);
  if (vTsa !== null) pp.push({ ten: "TSA", chiTiet: `Điểm30(TSA ${tsa.trim()})`, diem: cong((vTsa / 100) * 30) });

  const diemMon: Record<string, string> = { Toán: toan, "Ngữ văn": van, [mon3]: d3 };
  if (mon4) diemMon[mon4] = d4;

  const combos = BANG_TO_HOP.map((t) => {
    const ds = t.mons.map((m) => parseDiem(diemMon[m] ?? ""));
    return {
      ma: t.ma,
      mons: t.mons.join(" - ").replace(/Ngữ văn/g, "Văn").replace(/Vật lý/g, "Lý").replace(/Hóa học/g, "Hóa").replace(/Tiếng Anh/g, "Anh").replace(/Sinh học/g, "Sinh").replace(/Lịch sử/g, "Sử").replace(/Địa lý/g, "Địa"),
      tong: ds.every((d) => d !== null) ? cong((ds as number[]).reduce((a, b) => a + b, 0), hsg.diem) : null,
    };
  });
  const combosHien = combos.filter((c) => c.tong !== null);
  combosHien.forEach((c) => {
    if (c.tong !== null) pp.push({ ten: c.ma, chiTiet: `${c.ma} (${c.mons})`, diem: c.tong });
  });

  const anhPhu: string[] = [];
  const vIelts = parseDiem(ielts, 9);
  if (vIelts !== null) {
    const d = bandDiem(BANG_IELTS, vIelts);
    if (d !== null) anhPhu.push(`IELTS ${ielts.trim()} → Anh ${d.toFixed(1)}`);
  }
  const vToefl = parseDiem(toefl, 120);
  if (vToefl !== null) {
    const d = bandDiem(BANG_TOEFL, vToefl);
    if (d !== null) anhPhu.push(`TOEFL iBT ${toefl.trim()} → Anh ${d.toFixed(1)}`);
  }
  const vLr = parseDiem(toeicLR, 990);
  if (vLr !== null) {
    const d = bandDiem(BANG_TOEIC_LR, vLr);
    if (d !== null) anhPhu.push(`TOEIC L&R ${toeicLR.trim()} → Anh ${d.toFixed(1)}`);
  }
  const vS = parseDiem(toeicS, 200);
  const vW = parseDiem(toeicW, 200);
  if (vS !== null && vW !== null) {
    anhPhu.push(`TOEIC S&W → Anh ${(Math.min(10, Math.round(((vS + vW) / 2 / 20) * 10) / 10)).toFixed(1)}`);
  }

  const totNhat = pp.length > 0 ? pp.reduce((a, b) => (b.diem > a.diem ? b : a)) : null;

  const oKyThi: [string, string, string, (v: string) => void][] = [
    ["SAT", "1200–1600", sat, setSat],
    ["ACT", "26–36", act, setAct],
    ["HSA", "85–150", hsa, setHsa],
    ["V-ACT", "700–1200", vact, setVact],
    ["TSA", "60–100", tsa, setTsa],
    ["IELTS", "5.5–9", ielts, setIelts],
    ["TOEFL iBT", "46–120", toefl, setToefl],
    ["TOEIC L&R", "785–990", toeicLR, setToeicLR],
    ["TOEIC S", "160–200", toeicS, setToeicS],
    ["TOEIC W", "150–200", toeicW, setToeicW],
  ];
  const oThpt: [string, string, (v: string) => void][] = [
    ["Toán (bắt buộc)", toan, setToan],
    ["Ngữ văn (bắt buộc)", van, setVan],
  ];

  const oSelect =
    "w-full rounded-lg border border-stone-900/10 bg-[#F4F8FE] px-3 py-2.5 text-sm font-bold text-stone-900 outline-none focus:border-blue-500/60";

  return (
    <div className="space-y-5">
      {/* Thẻ 1: điểm các kỳ thi */}
      <section className="rounded-2xl border border-stone-900/10 bg-white p-5 sm:p-6">
        <h2 className="text-base font-extrabold">Điểm của các kỳ thi</h2>
        <p className="mt-1 text-[13px] text-stone-500">
          Có điểm kỳ thi hoặc chứng chỉ nào thì nhập vào hệ thống.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          {oKyThi.map(([ten, goiY, val, set]) => (
            <label key={ten} className="block">
              <span className="mb-1 block text-[13px] font-bold text-stone-700">{ten}</span>
              <input
                value={val}
                onChange={(e) => set(e.target.value)}
                inputMode="decimal"
                placeholder={goiY}
                className="w-full rounded-lg border border-stone-900/10 bg-[#F4F8FE] px-3 py-2.5 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-blue-500/60"
              />
            </label>
          ))}
        </div>
      </section>

      {/* Thẻ 2: điểm thi THPT + tổ hợp */}
      <section className="rounded-2xl border border-stone-900/10 bg-white p-5 sm:p-6">
        <h2 className="text-base font-extrabold">Điểm thi THPT</h2>
        <p className="mt-1 text-[13px] text-stone-500">
          Toán + Văn bắt buộc, chọn thêm 1–2 môn tự chọn — đủ điểm là tổ hợp hiện ra.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {oThpt.map(([ten, val, set]) => (
            <label key={ten} className="block">
              <span className="mb-1 block text-[13px] font-bold text-stone-700">{ten}</span>
              <input
                value={val}
                onChange={(e) => set(e.target.value)}
                inputMode="decimal"
                placeholder="0–10"
                className="w-full rounded-lg border border-stone-900/10 bg-[#F4F8FE] px-3 py-2.5 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-blue-500/60"
              />
            </label>
          ))}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-[13px] font-bold text-stone-700">Môn tự chọn 1</span>
              <select
                value={mon3}
                onChange={(e) => {
                  setMon3(e.target.value);
                  if (e.target.value === mon4) setMon4("");
                }}
                className={oSelect}
              >
                {MON_TU_CHON.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[13px] font-bold text-stone-700">Điểm {mon3}</span>
              <input
                value={d3}
                onChange={(e) => setD3(e.target.value)}
                inputMode="decimal"
                placeholder="0–10"
                className="w-full rounded-lg border border-stone-900/10 bg-[#F4F8FE] px-3 py-2.5 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-blue-500/60"
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-[13px] font-bold text-stone-700">Môn tự chọn 2</span>
              <select value={mon4} onChange={(e) => setMon4(e.target.value)} className={oSelect}>
                <option value="">Không thêm</option>
                {MON_TU_CHON.filter((m) => m !== mon3).map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[13px] font-bold text-stone-700">
                Điểm {mon4 || "…"}
              </span>
              <input
                value={d4}
                onChange={(e) => setD4(e.target.value)}
                disabled={!mon4}
                inputMode="decimal"
                placeholder={mon4 ? "0–10" : "–"}
                className="w-full rounded-lg border border-stone-900/10 bg-[#F4F8FE] px-3 py-2.5 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-blue-500/60 disabled:opacity-40"
              />
            </label>
          </div>
        </div>
        {combosHien.length === 0 ? (
          <p className="mt-4 rounded-xl border border-stone-900/10 bg-[#F4F8FE] px-4 py-3 text-center text-sm text-stone-500">
            Nhập đủ điểm 3 môn của 1 tổ hợp để xem tổng điểm.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
            {combosHien.map((c) => (
              <div key={c.ma} className="rounded-xl border border-stone-900/10 bg-[#F4F8FE] px-4 py-3">
                <p className="text-sm font-extrabold">{c.ma}</p>
                <p className="text-xs text-stone-500">{c.mons}</p>
                <p className="mt-1 text-lg font-black tabular-nums">
                  {c.tong === null ? "–" : c.tong.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Thẻ 3: ưu tiên */}
      <section className="rounded-2xl border border-stone-900/10 bg-white p-5 sm:p-6">
        <h2 className="text-base font-extrabold">Ưu tiên</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-[13px] font-bold text-stone-700">Khu vực ưu tiên</span>
            <select
              value={kv.id}
              onChange={(e) => setKv(KV_UT.find((k) => k.id === e.target.value) ?? KV_UT[0])}
              className="w-full rounded-lg border border-stone-900/10 bg-[#F4F8FE] px-3 py-2.5 text-sm text-stone-900 outline-none focus:border-blue-500/60"
            >
              {KV_UT.map((k) => (
                <option key={k.id} value={k.id}>{k.ten}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[13px] font-bold text-stone-700">Đối tượng ưu tiên</span>
            <select
              value={dt.id}
              onChange={(e) => setDt(DT_UT.find((k) => k.id === e.target.value) ?? DT_UT[0])}
              className="w-full rounded-lg border border-stone-900/10 bg-[#F4F8FE] px-3 py-2.5 text-sm text-stone-900 outline-none focus:border-blue-500/60"
            >
              {DT_UT.map((k) => (
                <option key={k.id} value={k.id}>{k.ten}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[13px] font-bold text-stone-700">Ưu tiên xét tuyển (giải HSG)</span>
            <select
              value={hsg.id}
              onChange={(e) => setHsg(HSG_UT.find((k) => k.id === e.target.value) ?? HSG_UT[0])}
              className="w-full rounded-lg border border-stone-900/10 bg-[#F4F8FE] px-3 py-2.5 text-sm text-stone-900 outline-none focus:border-blue-500/60"
            >
              {HSG_UT.map((k) => (
                <option key={k.id} value={k.id}>{k.ten}</option>
              ))}
            </select>
          </label>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-stone-500">
          Điểm thưởng giải HSG (nhất 1,5; nhì 1,0; ba 0,5) cộng thẳng vào tổng điểm tổ hợp THPT
          (với thí sinh xét bằng tổ hợp điểm THPT).
        </p>
        <p className="mt-1 text-xs leading-relaxed text-stone-500">
          Điểm ưu tiên KV + ĐT cộng lũy thoái theo Bộ GD&ĐT: nếu tổng điểm đạt được ≥ 22,5 thì
          UT = [(30 − tổng điểm)/7,5] × mức. Điểm xét tuyển ≤ 30.
        </p>
      </section>

      {/* Thẻ 4: kết quả quy đổi */}
      <section className="rounded-2xl border border-stone-900/10 bg-white p-5 sm:p-6">
        <h2 className="text-base font-extrabold">Kết quả quy đổi</h2>
        {totNhat === null ? (
          <p className="mt-3 text-sm text-stone-500">
            Nhập ít nhất 1 điểm ở các thẻ trên để xem quy đổi sang thang 30.
          </p>
        ) : (
          <div className="mt-4 grid gap-5 lg:grid-cols-[280px_1fr]">
            <div className="rounded-2xl border border-blue-600/30 bg-blue-50 p-6 text-center">
              <p className="text-[13px] text-stone-500">Điểm quy đổi cao nhất</p>
              <p className="mt-1 text-6xl font-black tabular-nums text-blue-700">
                {totNhat.diem.toFixed(2)}
              </p>
              <p className="mt-1 text-sm text-stone-500">
                điểm xét · theo phương thức <span className="font-bold text-stone-900">{totNhat.ten}</span>
              </p>
            </div>
            <div>
              <p className="text-sm font-bold">Tất cả phương thức</p>
              <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-stone-700">
                {pp.map((p) => (
                  <li key={p.ten}>
                    {p.ten}: <span className="font-extrabold text-stone-900">{p.diem.toFixed(2)}</span>{" "}
                    <span className="text-stone-500">({p.chiTiet} = {p.diem.toFixed(2)})</span>
                  </li>
                ))}
                {anhPhu.map((a) => (
                  <li key={a} className="text-stone-500">{a} (thang 10)</li>
                ))}
              </ol>
            </div>
          </div>
        )}
        <p className="mt-4 text-xs leading-relaxed text-stone-500">
          Kỳ thi riêng quy đổi tuyến tính về thang 30 rồi cộng ưu tiên (trần 30). Chứng chỉ tiếng Anh
          đổi sang điểm môn Anh thang 10 (IELTS theo bảng NEU 2026, TOEFL/TOEIC tương đương gần đúng).
          Mỗi trường có bảng riêng từng năm — đối chiếu đề án của trường. Kết quả tham khảo.
        </p>
      </section>
    </div>
  );
}

export default function TinhDiemPage() {
  const [muc, setMuc] = useState<Muc>("hocba");
  const [bang, setBang] = useState<BangDiem>({});

  // Chỉ tính trung bình các môn đã nhập điểm; môn không học / để trống
  // không được đưa vào mẫu số (không chia tb cho môn đó).
  const tbMotNam = (c: Cot): string => {
    let tong = 0;
    let dem = 0;
    for (const mon of MON_HOC) {
      const v = parseDiemNhanh(bang[mon]?.[c] ?? "");
      if (v === null) continue;
      tong += v;
      dem += 1;
    }
    if (dem === 0) return "";
    return (tong / dem).toFixed(2);
  };
  const tbNam = {
    lop10: tbMotNam("l10"),
    lop11: tbMotNam("l11"),
    lop12: tbMotNam("l12"),
  };
  const ds = [tbNam.lop10, tbNam.lop11, tbNam.lop12].map((v) => parseDiem(v));
  const tb3 = ds.every((d) => d !== null)
    ? String(Math.round((((ds as number[])[0] + (ds as number[])[1] * 2 + (ds as number[])[2] * 3) / 6) * 100) / 100)
    : "";

  return (
    <div className="relative z-10 flex min-h-screen flex-col text-stone-900">
      <SiteNav active="tinh-diem" />

      <main className="mx-auto w-full max-w-[1200px] flex-1 px-3 py-6 sm:px-8 sm:py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-blue-700">
              Công cụ tính điểm
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Tính điểm</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-500">
              Làm theo thứ tự 3 bước bên dưới. Kết quả chỉ mang tính tham khảo.
            </p>
          </div>
          <p className="hidden text-xs font-semibold text-stone-400 sm:block">
            Thang điểm 10 · 0–30
          </p>
        </div>

        <nav
          aria-label="Danh mục tính điểm"
          className="mt-5 rounded-xl md:sticky md:top-[68px] md:z-30 md:mt-7 border border-stone-900/10 bg-white/90 p-1.5 shadow-[0_12px_30px_-24px_rgba(15,99,240,0.5)] backdrop-blur"
        >
          <div className="grid grid-cols-3 gap-1.5">
            {DANH_MUC.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setMuc(d.id)}
                aria-pressed={muc === d.id}
                className={`flex min-w-0 flex-col items-center gap-1 rounded-lg px-1.5 py-2 text-center transition sm:flex-row sm:gap-3 sm:px-3 sm:py-2.5 sm:text-left ${
                  muc === d.id
                    ? "bg-stone-900 text-[#F4F8FE]"
                    : "text-stone-600 hover:bg-stone-900/5 hover:text-stone-900"
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[13px] font-black sm:h-8 sm:w-8 sm:text-sm ${
                    muc === d.id ? "bg-blue-500 text-white" : "bg-stone-900/5 text-stone-500"
                  }`}
                >
                  {d.so}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-bold leading-tight sm:truncate sm:text-sm">{d.ten}</span>
                  <span
                    className={`mt-0.5 hidden truncate text-xs sm:block ${
                      muc === d.id ? "text-stone-300" : "text-stone-500"
                    }`}
                  >
                    {d.moTa}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </nav>

        <div className="mt-4 rounded-2xl border border-stone-900/10 bg-white p-3.5 shadow-[0_24px_70px_-50px_rgba(15,99,240,0.55)] sm:p-7">
          {muc === "hocba" && (
            <MucHocBa bang={bang} setBang={setBang} tbNam={tbNam} tb3={tb3} />
          )}
          {muc === "totnghiep" && <MucTotNghiep tbSan={tb3} tbNam={tbNam} />}
          {muc === "quydoi" && <MucQuyDoi />}
        </div>
      </main>

      <footer className="border-t border-stone-900/10 px-5 py-6 text-center text-xs text-stone-500">
        Kết quả chỉ mang tính tham khảo.
      </footer>
    </div>
  );
}
