"use client";

import { useState } from "react";

// Mã phiên ẩn danh: chuỗi ngẫu nhiên lưu ở trình duyệt, dùng để nối lượt
// tư vấn với phiếu đánh giá. KHÔNG phải tên HS, không truy ngược được.
export function layPhienMa(): string {
  try {
    const cu = localStorage.getItem("hn:phien-ma");
    if (cu && /^[A-Za-z0-9-]{8,64}$/.test(cu)) return cu;
    const moi = `hs-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem("hn:phien-ma", moi);
    return moi;
  } catch {
    return "an-danh";
  }
}

const CAU_HOI = [
  { key: "hieu_ban_than", tieuDe: "Em hiểu rõ điểm mạnh của mình hơn" },
  { key: "tu_tin_chon_khoi", tieuDe: "Em tự tin chọn khối thi hơn" },
  { key: "ro_buoc_tiep", tieuDe: "Em biết bước tiếp theo cần làm gì" },
] as const;

export default function DanhGia() {
  const [diem, setDiem] = useState<Record<string, number>>({});
  const [ghiChu, setGhiChu] = useState("");
  const [trangThai, setTrangThai] = useState<"chua" | "dang-gui" | "xong" | "loi">("chua");

  const duDiem = CAU_HOI.every((c) => diem[c.key] !== undefined);

  async function gui() {
    if (!duDiem || trangThai === "dang-gui" || trangThai === "xong") return;
    setTrangThai("dang-gui");
    try {
      const res = await fetch("/api/danh-gia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phien_ma: layPhienMa(),
          hieu_ban_than: diem.hieu_ban_than,
          tu_tin_chon_khoi: diem.tu_tin_chon_khoi,
          ro_buoc_tiep: diem.ro_buoc_tiep,
          ...(ghiChu.trim() ? { ghi_chu: ghiChu.trim() } : {}),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setTrangThai("xong");
    } catch {
      setTrangThai("loi");
    }
  }

  if (trangThai === "xong") {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50 p-6 text-center">
        <p className="font-bold text-emerald-800">Cảm ơn em đã đánh giá!</p>
        <p className="mt-1 text-sm text-emerald-700">
          Ý kiến ẩn danh của em giúp nhóm hoàn thiện đề tài nghiên cứu.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-stone-900/10 bg-white p-6 sm:p-7">
      <h3 className="font-extrabold tracking-tight">Đánh giá nhanh (ẩn danh)</h3>
      <p className="mt-1 text-[13px] leading-relaxed text-stone-500">
        3 câu, 10 giây — không hỏi tên, chỉ phục vụ nghiên cứu khoa học.
      </p>
      <div className="mt-4 space-y-4">
        {CAU_HOI.map((c) => (
          <div key={c.key}>
            <p className="text-sm font-semibold text-stone-700">{c.tieuDe}</p>
            <div className="mt-2 flex gap-2" role="radiogroup" aria-label={c.tieuDe}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={diem[c.key] === n}
                  aria-label={`${n} điểm`}
                  onClick={() => setDiem((d) => ({ ...d, [c.key]: n }))}
                  className={`h-10 w-10 rounded-xl text-sm font-bold transition ${
                    diem[c.key] === n
                      ? "bg-orange-600 text-white"
                      : "border border-stone-900/10 text-stone-500 hover:border-orange-400/60 hover:text-stone-900"
                  }`}
                >
                  {n}
                </button>
              ))}
              <span className="ml-1 self-center text-xs text-stone-400">1 = không, 5 = rất đồng ý</span>
            </div>
          </div>
        ))}
      </div>
      <textarea
        value={ghiChu}
        onChange={(e) => setGhiChu(e.target.value)}
        rows={2}
        maxLength={300}
        placeholder="Góp ý thêm (không bắt buộc, đừng ghi tên — ví dụ: em muốn thêm ngành Y...)"
        className="mt-4 w-full resize-none rounded-xl border border-stone-900/10 bg-[#faf4e9] p-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-orange-500/60"
      />
      {trangThai === "loi" && (
        <p className="mt-3 text-sm font-medium text-red-600">
          Gửi chưa thành công, em bấm lại giúp nhé.
        </p>
      )}
      <button
        type="button"
        onClick={gui}
        disabled={!duDiem || trangThai === "dang-gui"}
        className="mt-4 w-full rounded-xl bg-stone-900 px-6 py-3 text-sm font-bold text-[#faf4e9] transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {trangThai === "dang-gui" ? "Đang gửi…" : "Gửi đánh giá ẩn danh"}
      </button>
    </div>
  );
}
