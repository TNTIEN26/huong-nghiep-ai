"use client";

import { useState, useSyncExternalStore } from "react";

import type { KetQuaLuu } from "@/lib/ket-qua-luu";
import {
  RONG_KET_QUA,
  getSnapshotKetQuaLuu,
  ngayDep,
  subscribeKetQuaLuu,
  xoaKetQua,
} from "@/lib/ket-qua-luu";
import CareerResult from "./CareerResult";

function tomTat(k: KetQuaLuu): string {
  return k.result.nghe_nghiep.map((n) => `${n.ten} (${n.do_phu_hop}%)`).join(" · ");
}

function BangSoSanh({ a, b }: { a: KetQuaLuu; b: KetQuaLuu }) {
  const hang = (ten: string, layA: string, layB: string) => (
    <tr key={ten} className="border-t border-stone-900/10">
      <th className="px-3 py-2 text-left align-top text-xs font-bold text-stone-500">{ten}</th>
      <td className="px-3 py-2 align-top text-[13px] text-stone-700">{layA}</td>
      <td className="px-3 py-2 align-top text-[13px] text-stone-700">{layB}</td>
    </tr>
  );
  const nganh = (k: KetQuaLuu, i: number) => {
    const n = k.result.nghe_nghiep[i];
    return n ? `${n.ten} (${n.do_phu_hop}%)` : "—";
  };
  return (
    <div className="overflow-x-auto rounded-2xl border border-stone-900/10 bg-white">
      <table className="w-full min-w-[480px] border-collapse">
        <thead>
          <tr>
            <th className="px-3 py-2 text-left text-xs font-bold text-stone-400">Tiêu chí</th>
            <th className="px-3 py-2 text-left text-xs font-bold text-orange-700">
              {ngayDep(a.ngay)} · {a.lop}
            </th>
            <th className="px-3 py-2 text-left text-xs font-bold text-orange-700">
              {ngayDep(b.ngay)} · {b.lop}
            </th>
          </tr>
        </thead>
        <tbody>
          {hang("Ngành 1", nganh(a, 0), nganh(b, 0))}
          {hang("Ngành 2", nganh(a, 1), nganh(b, 1))}
          {hang("Ngành 3", nganh(a, 2), nganh(b, 2))}
          {hang("Khối đề nghị", a.result.khoi_thi_de_nghi.join(", ") || "—", b.result.khoi_thi_de_nghi.join(", ") || "—")}
        </tbody>
      </table>
    </div>
  );
}

// Danh sách kết quả đã lưu ở máy HS: xem lại, so sánh 2 bản, xóa.
// Đọc sau khi mount để server/client render giống nhau.
export default function KetQuaDaLuu() {
  const ds = useSyncExternalStore(subscribeKetQuaLuu, getSnapshotKetQuaLuu, () => RONG_KET_QUA);
  const [moId, setMoId] = useState<string | null>(null);
  const [chon, setChon] = useState<string[]>([]);

  if (ds.length === 0) return null;

  const doiChieu = chon
    .map((id) => ds.find((k) => k.id === id))
    .filter((k): k is KetQuaLuu => k !== undefined);
  const duCap = doiChieu.length === 2;

  function bamChon(id: string) {
    setChon((c) => {
      if (c.includes(id)) return c.filter((x) => x !== id);
      if (c.length >= 2) return [c[1], id];
      return [...c, id];
    });
  }

  return (
    <section aria-label="Kết quả đã lưu" className="mx-auto w-full max-w-3xl space-y-4">
      <div className="rounded-2xl border border-stone-900/10 bg-white p-6 sm:p-7">
        <h2 className="font-extrabold tracking-tight">Kết quả đã lưu của em ({ds.length})</h2>
        <p className="mt-1 text-[13px] text-stone-500">
          Chỉ lưu ở máy này, không gửi đi đâu. Tick 2 bản để so sánh.
        </p>
        <ul className="mt-4 space-y-3">
          {ds.map((k) => {
            const dangMo = moId === k.id;
            const duocChon = chon.includes(k.id);
            return (
              <li key={k.id} className="rounded-xl border border-stone-900/10 bg-[#faf4e9] p-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={duocChon}
                    onChange={() => bamChon(k.id)}
                    aria-label={`Chọn để so sánh: ${ngayDep(k.ngay)}`}
                    className="mt-1 h-4 w-4 accent-orange-600"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-stone-900">
                      {ngayDep(k.ngay)} · {k.lop}
                    </p>
                    <p className="mt-1 text-[13px] leading-relaxed text-stone-600">{tomTat(k)}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setMoId(dangMo ? null : k.id)}
                        className="rounded-lg border border-stone-900/15 px-3 py-1.5 text-xs font-bold text-stone-700 transition hover:border-orange-400/60"
                      >
                        {dangMo ? "Thu gọn" : "Xem lại"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          xoaKetQua(k.id);
                          setChon((c) => c.filter((x) => x !== k.id));
                          if (moId === k.id) setMoId(null);
                        }}
                        className="rounded-lg border border-stone-900/15 px-3 py-1.5 text-xs font-bold text-stone-500 transition hover:border-red-400/60 hover:text-red-600"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
                {dangMo && (
                  <div className="mt-4 border-t border-stone-900/10 pt-4">
                    <CareerResult result={k.result} tieuDe={`Xem lại · ${k.lop}`} anDanhGia />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        {duCap && (
          <div className="mt-4">
            <BangSoSanh a={doiChieu[0]} b={doiChieu[1]} />
          </div>
        )}
      </div>
    </section>
  );
}
