"use client";

import { useState } from "react";

import SiteNav from "../components/SiteNav";

type Muc = "hocba" | "totnghiep" | "quydoi";

const DANH_MUC: { id: Muc; so: string; ten: string; moTa: string }[] = [
  { id: "hocba", so: "1", ten: "Học bạ cấp 3", moTa: "Nhập điểm TB cả năm lớp 10, 11, 12" },
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
  "w-full rounded-xl border border-stone-900/10 bg-[#faf4e9] px-4 py-3 text-[15px] text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-orange-500/60";

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
    <div className="mt-6 rounded-2xl border border-stone-900/10 bg-[#faf4e9] p-6 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">{tieuDe}</p>
            <p className="mt-2 text-5xl font-black tabular-nums text-orange-700">{so}</p>
      <p className="mt-3 text-sm font-bold text-stone-900">{nhanXet}</p>
    </div>
  );
}

/* ---------- MỤC 1: HỌC BẠ ---------- */
function MucHocBa({
  hocBa,
  setHocBa,
}: {
  hocBa: { lop10: string; lop11: string; lop12: string };
  setHocBa: (h: { lop10: string; lop11: string; lop12: string }) => void;
}) {
  const ds = [hocBa.lop10, hocBa.lop11, hocBa.lop12].map((v) => parseDiem(v));
  const du = ds.every((d) => d !== null);
  // Trọng số chính thức: lớp 10 × 1, lớp 11 × 2, lớp 12 × 3, chia 6
  const tb3 = du
    ? (Math.round((((ds as number[])[0] + (ds as number[])[1] * 2 + (ds as number[])[2] * 3) / 6) * 100) / 100).toFixed(2)
    : null;

  const o = [
    ["lop10", "Điểm TB cả năm lớp 10", hocBa.lop10],
    ["lop11", "Điểm TB cả năm lớp 11", hocBa.lop11],
    ["lop12", "Điểm TB cả năm lớp 12", hocBa.lop12],
  ] as const;

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-3">
        {o.map(([key, ten, val]) => (
          <Nhan key={key} ten={ten}>
            <input
              value={val}
              onChange={(e) => setHocBa({ ...hocBa, [key]: e.target.value })}
              inputMode="decimal"
              placeholder="VD: 8.2"
              className={oNhap}
            />
          </Nhan>
        ))}
      </div>
      {tb3 !== null ? (
        <KetQua tieuDe="Điểm TB các năm (trọng số 1–2–3)" so={tb3} nhanXet="Đã tự chuyển sang mục 2 để tính tốt nghiệp." />
      ) : (
        <p className="mt-6 rounded-2xl border border-stone-900/10 bg-[#faf4e9] p-6 text-center text-sm text-stone-500">
          Nhập đủ điểm 3 năm để tính trung bình. Thang điểm 0–10.
        </p>
      )}
      <p className="mt-4 text-xs leading-relaxed text-stone-500">
        Công thức: (ĐTB lớp 10 × 1 + ĐTB lớp 11 × 2 + ĐTB lớp 12 × 3) / 6.
      </p>
    </div>
  );
}

/* ---------- MỤC 2: XÉT TỐT NGHIỆP ---------- */
function MucTotNghiep({ tbSan, hocBa }: { tbSan: string; hocBa: { lop10: string; lop11: string; lop12: string } }) {
  const [toan, setToan] = useState("");
  const [van, setVan] = useState("");
  const [tc1, setTc1] = useState("");
  const [tc2, setTc2] = useState("");
  const [tbTay, setTbTay] = useState("");
  const [kk, setKk] = useState("");
  const [dien, setDien] = useState("D1");

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
  const hb = [hocBa.lop10, hocBa.lop11, hocBa.lop12].map((v) => parseDiem(v));
  const hbDu = hb.every((d) => d !== null);

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_560px]">
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
      {tbSan && tbTay === "" && (
        <p className="mt-1.5 text-xs text-stone-500">Đang dùng TB 3 năm từ mục 1 — bấm vào để sửa tay.</p>
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
          <select value={dien} onChange={(e) => setDien(e.target.value)} className="w-full rounded-xl border border-stone-900/10 bg-[#faf4e9] px-4 py-3 text-[15px] font-bold text-stone-900 outline-none focus:border-orange-500/60">
            <option value="D1">Diện 1 — bình thường (+0)</option>
            <option value="D2">Diện 2 (+0.25)</option>
            <option value="D3">Diện 3 (+0.5)</option>
          </select>
        </Nhan>
      </div>

      {kq === null ? (
        <p className="mt-6 rounded-2xl border border-stone-900/10 bg-[#faf4e9] p-6 text-center text-sm text-stone-500">
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

      {/* Sơ đồ tính điểm kiểu Phenikaa — số nhảy theo từng ô nhập */}
      <aside className="h-fit rounded-2xl border border-stone-900/10 bg-[#faf4e9] p-4 xl:sticky xl:top-24">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-stone-500">Sơ đồ tính điểm</p>

        {/* Khung 1: ĐTB các năm học */}
        <div className="mt-3 rounded-md border-[3px] border-dashed border-blue-800 bg-white p-2.5 text-stone-900">
          <p className="mx-auto w-fit rounded bg-red-600 px-2 py-0.5 text-center text-[10px] font-bold leading-tight text-white">
            ĐIỂM TRUNG BÌNH CÁC NĂM HỌC
          </p>
          <div className="mt-2 flex items-center gap-1">
            <span className="shrink-0 bg-yellow-300 px-1 py-1 text-center text-[9px] font-bold leading-tight">
              ĐTB CÁC
              <br />
              NĂM HỌC
            </span>
            <span className="font-black">=</span>
            <span className="min-w-0 flex-1 text-center font-serif text-[11px] leading-snug">
              <span className="block border-b-2 border-blue-900 px-0.5 pb-0.5">
                (ĐTB LỚP 10)x1 + (ĐTB LỚP 11)x2 + (ĐTB LỚP 12)x3
              </span>
              <span className="block pt-0.5 font-bold">6</span>
            </span>
          </div>
          <p className="mt-1.5 border-t border-dashed border-stone-900/15 pt-1.5 text-center text-[13px] tabular-nums text-stone-700">
            = ({hien(hocBa.lop10)}×1 + {hien(hocBa.lop11)}×2 + {hien(hocBa.lop12)}×3) ÷ 6 ={" "}
            <span className="font-black text-orange-700">
              {hbDu && tb ? Number(tb).toFixed(2) : "…"}
            </span>
          </p>
        </div>

        {/* Khung 2: ĐXTN */}
        <div className="mt-3 rounded-md border-[3px] border-dashed border-blue-800 bg-white p-2.5 text-stone-900">
          <p className="mx-auto w-fit rounded bg-yellow-300 px-2 py-0.5 text-center text-[10px] font-bold leading-tight">
            CÁCH TÍNH ĐIỂM XÉT TỐT NGHIỆP
          </p>
          <div className="mt-2 flex items-center gap-1">
            <span className="shrink-0 bg-yellow-300 px-1.5 py-1 text-[10px] font-bold">ĐXTN</span>
            <span className="font-black">=</span>
            <span className="min-w-0 flex-1 text-center font-serif text-[11px] leading-snug">
              <span className="flex items-center justify-center gap-1">
                <span className="border-b-2 border-red-600 px-1 pb-0.5">
                  <span className="inline-block align-top">
                    Tổng điểm 4<br />
                    môn thi
                  </span>
                  <span className="font-sans font-black text-red-600"> + </span>
                  <span className="inline-block align-top">
                    Điểm khuyến
                    <br />
                    khích (nếu có)
                  </span>
                </span>
                <span className="font-sans font-bold">+</span>
                <span className="rounded-sm bg-red-600 px-1 py-px font-sans text-[9px] font-bold text-white">
                  ĐTB CÁC NĂM HỌC
                </span>
              </span>
              <span className="block pt-0.5 font-bold">4</span>
              <span className="block border-b-2 border-blue-900" />
              <span className="block pt-0.5 font-bold">2</span>
            </span>
            <span className="shrink-0 text-center font-sans text-[9px] font-bold leading-tight">
              <span className="text-red-700">+</span> ĐIỂM
              <br />
              ƯU TIÊN
              <br />
              (NẾU CÓ)
            </span>
          </div>
          <p className="mt-1.5 border-t border-dashed border-stone-900/15 pt-1.5 text-center text-[13px] tabular-nums leading-relaxed text-stone-700">
            = [({hien(toan)}+{hien(van)}+{hien(tc1)}+{hien(tc2)}+{kk.trim() === "" ? "0" : hien(kk)})÷4
            + {tb !== "" ? Number(tb).toFixed(2) : "…"}]÷2+{u.toFixed(2)} ={" "}
            <span className="font-black text-orange-700">{kq === null ? "…" : kq.toFixed(2)}</span>
          </p>
        </div>
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
    "w-full rounded-lg border border-stone-900/10 bg-[#faf4e9] px-3 py-2.5 text-sm font-bold text-stone-900 outline-none focus:border-orange-500/60";

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
                className="w-full rounded-lg border border-stone-900/10 bg-[#faf4e9] px-3 py-2.5 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-orange-500/60"
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
                className="w-full rounded-lg border border-stone-900/10 bg-[#faf4e9] px-3 py-2.5 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-orange-500/60"
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
                className="w-full rounded-lg border border-stone-900/10 bg-[#faf4e9] px-3 py-2.5 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-orange-500/60"
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
                className="w-full rounded-lg border border-stone-900/10 bg-[#faf4e9] px-3 py-2.5 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-orange-500/60 disabled:opacity-40"
              />
            </label>
          </div>
        </div>
        {combosHien.length === 0 ? (
          <p className="mt-4 rounded-xl border border-stone-900/10 bg-[#faf4e9] px-4 py-3 text-center text-sm text-stone-500">
            Nhập đủ điểm 3 môn của 1 tổ hợp để xem tổng điểm.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
            {combosHien.map((c) => (
              <div key={c.ma} className="rounded-xl border border-stone-900/10 bg-[#faf4e9] px-4 py-3">
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
              className="w-full rounded-lg border border-stone-900/10 bg-[#faf4e9] px-3 py-2.5 text-sm text-stone-900 outline-none focus:border-orange-500/60"
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
              className="w-full rounded-lg border border-stone-900/10 bg-[#faf4e9] px-3 py-2.5 text-sm text-stone-900 outline-none focus:border-orange-500/60"
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
              className="w-full rounded-lg border border-stone-900/10 bg-[#faf4e9] px-3 py-2.5 text-sm text-stone-900 outline-none focus:border-orange-500/60"
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
            <div className="rounded-2xl border border-orange-600/30 bg-orange-50 p-6 text-center">
              <p className="text-[13px] text-stone-500">Điểm quy đổi cao nhất</p>
              <p className="mt-1 text-6xl font-black tabular-nums text-orange-700">
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
  const [hocBa, setHocBa] = useState({ lop10: "", lop11: "", lop12: "" });

  const ds = [hocBa.lop10, hocBa.lop11, hocBa.lop12].map((v) => parseDiem(v));
  const tb3 = ds.every((d) => d !== null)
    ? String(Math.round((((ds as number[])[0] + (ds as number[])[1] * 2 + (ds as number[])[2] * 3) / 6) * 100) / 100)
    : "";

  return (
    <div className="relative z-10 flex min-h-screen flex-col text-stone-900">
      <SiteNav active="tinh-diem" />

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-12 sm:px-8 sm:py-16">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Tính điểm</h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-500">
          Làm theo thứ tự 3 mục: nhập học bạ, tính tốt nghiệp, quy đổi ĐGNL. Chỉ mang tính tham khảo.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr] xl:gap-8">
          {/* Danh mục bên trái */}
          <nav aria-label="Danh mục tính điểm" className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
            {DANH_MUC.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setMuc(d.id)}
                aria-pressed={muc === d.id}
                className={`flex min-w-[220px] items-start gap-3 rounded-2xl border p-4 text-left transition lg:min-w-0 ${
                  muc === d.id
                    ? "border-stone-900 bg-stone-900 text-[#faf4e9] shadow-[0_16px_40px_-20px_rgba(28,25,23,0.5)]"
                    : "border-stone-900/10 bg-white text-stone-700 hover:border-stone-900/25 hover:text-stone-900"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-black ${
                    muc === d.id ? "bg-orange-500 text-white" : "bg-stone-900/5 text-stone-500"
                  }`}
                >
                  {d.so}
                </span>
                <span>
                  <span className="block text-sm font-bold">{d.ten}</span>
                  <span className={`mt-0.5 block text-xs ${muc === d.id ? "text-stone-300" : "text-stone-500"}`}>
                    {d.moTa}
                  </span>
                </span>
              </button>
            ))}
          </nav>

          {/* Nội dung */}
          <div className="rounded-2xl border border-stone-900/10 bg-white p-6 shadow-[0_20px_60px_-30px_rgba(234,88,12,0.35)] sm:p-8">
            {muc === "hocba" && <MucHocBa hocBa={hocBa} setHocBa={setHocBa} />}
            {muc === "totnghiep" && <MucTotNghiep tbSan={tb3} hocBa={hocBa} />}
            {muc === "quydoi" && <MucQuyDoi />}
          </div>
        </div>
      </main>

      <footer className="border-t border-stone-900/10 px-5 py-6 text-center text-xs text-stone-500">
        Kết quả chỉ mang tính tham khảo.
      </footer>
    </div>
  );
}
