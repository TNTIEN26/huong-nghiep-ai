"use client";

import type { ApiResult, TruongDH } from "@/lib/types";
import truongDhData from "@/data/truong-dh.json";
import DanhGia from "./DanhGia";

const truongDhRaw = truongDhData as TruongDH[];

type TruongKetQua = {
  ten: string;
  thanh_pho: string;
  nhom_nganh: TruongDH["nhom_nganh"];
  khu: string;
};

// Match university names from the AI result against our local dataset (fuzzy: bỏ dấu, chứa từ khóa).
function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function findTruong(uniNames: string[]): TruongKetQua[] {
  const out: TruongKetQua[] = [];
  for (const uniName of uniNames) {
    const target = norm(uniName);
    if (!target) continue;
    const words = target.split(" ").filter((w) => w.length > 2 && !["dai", "hoc"].includes(w));
    const uni =
      truongDhRaw.find((u) => norm(u.ten) === target) ??
      truongDhRaw.find((u) => {
        const n = norm(u.ten);
        return target.includes(n) || n.includes(target);
      }) ??
      truongDhRaw.find((u) => {
        const n = norm(u.ten);
        const hit = words.filter((w) => n.includes(w)).length;
        return hit >= 2 || (words.length === 1 && hit === 1);
      });
    if (!uni) continue;
    const all = uni.nhom_nganh.map((n) => n.diem_chuan_tk);
    const khu =
      all.length > 0 ? `${Math.min(...all).toFixed(1)}–${Math.max(...all).toFixed(1)}` : "";
    out.push({ ten: uni.ten, thanh_pho: uni.thanh_pho, nhom_nganh: uni.nhom_nganh, khu });
  }
  return out;
}

function diemTieu(p: TruongDH["nhom_nganh"][number]): string {
  const bits = [
    `${p.diem_chuan_tk.toFixed(1)} điểm${p.nam ? ` (${p.nam})` : ""}`,
  ];
  if (p.to_hop.length > 0) bits.push(`khối: ${p.to_hop.join(", ")}`);
  if (p.hoc_phi_tk) bits.push(p.hoc_phi_tk);
  if (p.ghichu) bits.push(p.ghichu);
  return bits.join(" · ");
}

function thanhDoPhuHop(percent: number) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-900/10">
      <div className="h-full rounded-full bg-orange-500" style={{ width: `${percent}%` }} />
    </div>
  );
}

// Thẻ kết quả tư vấn dùng chung: trang /tinh-diem (CareerConsult) và trong chat (ChatBot).
export default function CareerResult({
  result,
  tieuDe = "Kết quả tư vấn",
  anDanhGia = false,
}: {
  result: ApiResult;
  tieuDe?: string;
  /** Ẩn form Likert (dùng khi xem lại bản đã lưu — tránh chấm trùng). */
  anDanhGia?: boolean;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <div className="rounded-2xl border border-stone-900/10 bg-white p-6 sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">{tieuDe}</p>
        <p className="mt-3 text-[15px] leading-relaxed text-stone-700">{result.gioi_thieu}</p>
        {result.khoi_thi_de_nghi.length > 0 && (
          <div className="mt-5">
            <p className="text-xs font-semibold text-stone-500">Khối thi nên hướng tới</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {result.khoi_thi_de_nghi.map((k) => (
                <span
                  key={k}
                  className="rounded-lg border border-orange-600/30 bg-orange-50 px-3 py-1.5 text-sm font-bold text-orange-700"
                >
                  {k}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {(result.canh_bao ?? []).length > 0 && (
        <div className="rounded-2xl border border-amber-400/40 bg-amber-50 p-5 sm:p-6 dark:border-amber-400/30 dark:bg-amber-400/10">
          <h3 className="text-sm font-extrabold text-amber-900 dark:text-amber-200">
            ⚠ Bẫy hướng nghiệp — xem trước khi chọn
          </h3>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-amber-900 dark:text-amber-200">
            {(result.canh_bao ?? []).map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      {(result.xu_truong ?? []).length > 0 && (
        <div className="rounded-2xl border border-sky-300/40 bg-sky-50 p-5 sm:p-6 dark:border-sky-400/30 dark:bg-sky-400/10">
          <h3 className="text-sm font-extrabold text-sky-900 dark:text-sky-200">
            Xu hướng thị trường lao động · tham khảo
          </h3>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-sky-900 dark:text-sky-200">
            {(result.xu_truong ?? []).map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
      )}

      <ol className="space-y-4">
        {result.nghe_nghiep.map((nganh, i) => (
          <li
            key={nganh.ten}
            className="rounded-2xl border border-stone-900/10 bg-white p-6 sm:p-7"
          >
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-lg font-extrabold tracking-tight">
                <span className="mr-2 text-sm font-bold text-stone-500">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {nganh.ten}
              </h2>
              <p className="shrink-0 text-sm font-extrabold text-orange-600">
                {nganh.do_phu_hop}%
              </p>
            </div>
            <div className="mt-3">{thanhDoPhuHop(nganh.do_phu_hop)}</div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-slate-400">
              Vì sao phù hợp
            </p>
            <p className="mt-1 text-[15px] leading-relaxed text-stone-600 dark:text-slate-400">{nganh.ly_do}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {nganh.khoi_thi.map((k) => (
                <span
                  key={k}
                  className="rounded-md border border-stone-900/10 bg-stone-900/[0.04] px-2.5 py-1 text-xs font-semibold text-stone-600"
                >
                  {k}
                </span>
              ))}
            </div>

            {nganh.khoi_thi.length > 0 && (
              <a
                href={`/tinh-diem?khoi=${encodeURIComponent(nganh.khoi_thi[0])}#chon-truong`}
                className="mt-3 inline-block rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-orange-500"
              >
                Tính điểm cho khối {nganh.khoi_thi[0]} →
              </a>
            )}

            <dl className="mt-5 grid gap-4 border-t border-stone-900/10 pt-5 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Môn trọng tâm
                </dt>
                <dd className="mt-1 font-medium text-stone-700">
                  {nganh.mon_trong_tam.join(" · ")}
                </dd>
              </div>
              {nganh.muc_luong_tk && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-slate-400">
                    Mức lương (tham khảo)
                  </dt>
                  <dd className="mt-1 font-medium text-stone-700 dark:text-slate-300">{nganh.muc_luong_tk}</dd>
                </div>
              )}
              {nganh.rui_ro && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-slate-400">
                    Rủi ro / xu hướng
                  </dt>
                  <dd className="mt-1 font-medium text-stone-700 dark:text-slate-300">{nganh.rui_ro}</dd>
                </div>
              )}
              {nganh.truong_tieu_bieu.length > 0 && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Trường tiêu biểu
                  </dt>
                  <dd className="mt-1 space-y-1 font-medium text-stone-700">
                    {nganh.truong_tieu_bieu.map((t) => (
                      <p key={t}>— {t}</p>
                    ))}
                  </dd>
                </div>
              )}
            </dl>

            <div className="mt-4 rounded-xl border border-stone-900/10 bg-[#faf4e9] p-4 text-sm leading-relaxed text-stone-600">
              <span className="font-bold text-stone-900">Lộ trình. </span>
              {nganh.lo_trinh}
            </div>

            {findTruong(nganh.truong_tieu_bieu).map((t) => (
              <div key={t.ten} className="mt-4 rounded-xl border border-stone-900/10 bg-[#faf4e9] dark:border-white/10 dark:bg-[#060f1e] p-4">
                <p className="text-sm font-bold text-stone-900 dark:text-slate-100">
                  {t.ten}
                  <span className="ml-1.5 text-xs font-medium text-stone-500 dark:text-slate-400">
                    · {t.thanh_pho} · điểm {t.khu} (tham khảo)
                  </span>
                </p>
                <ul className="mt-2 space-y-1.5 text-[13px] leading-snug text-stone-600 dark:text-slate-400">
                  {t.nhom_nganh.map((p) => (
                    <li key={`${t.ten}-${p.ten}`}>
                      <span className="font-semibold text-stone-800 dark:text-slate-200">{p.ten}</span>
                      {" — "}
                      {diemTieu(p)}
                      {p.nguon ? (
                        <>
                          {" · "}
                          <a
                            href={p.nguon}
                            target="_blank"
                            rel="noreferrer"
                            className="font-semibold text-orange-700 underline decoration-orange-300 underline-offset-2 hover:text-orange-600"
                          >
                            Đề án ↗
                          </a>
                        </>
                      ) : (
                        <>
                          {" · "}
                          <span className="text-stone-400">đang kiểm chứng nguồn</span>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
                {t.nhom_nganh[0]?.hoc_bong && (
                  <p className="mt-1.5 text-xs text-stone-500 dark:text-slate-500">Học bổng: {t.nhom_nganh[0].hoc_bong}</p>
                )}
              </div>
            ))}
          </li>
        ))}
      </ol>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-stone-900/10 bg-white p-6">
          <h3 className="font-bold">Lời khuyên</h3>
          <p className="mt-2 text-sm leading-relaxed text-stone-500">{result.loi_khuyen}</p>
        </div>
        <div className="rounded-2xl border border-stone-900/15 bg-stone-900/[0.03] p-6">
          <h3 className="font-bold text-stone-900">Lưu ý</h3>
          <p className="mt-2 text-sm leading-relaxed text-stone-400">{result.luu_y}</p>
        </div>
      </div>

      {!anDanhGia && <DanhGia />}
    </div>
  );
}