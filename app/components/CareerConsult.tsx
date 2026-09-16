"use client";

import { useState } from "react";

import type { ApiResult, FormData } from "@/lib/types";

const classOptions = ["Lớp 6", "Lớp 7", "Lớp 8", "Lớp 9", "Lớp 10", "Lớp 11", "Lớp 12"];

const subjectOptions = [
  "Toán",
  "Ngữ văn",
  "Tiếng Anh",
  "Vật lý",
  "Hóa học",
  "Sinh học",
  "Lịch sử",
  "Địa lý",
  "GDCD",
  "Tin học",
];

const hobbyOptions = [
  "Máy tính, công nghệ",
  "Đọc sách, viết lách",
  "Vẽ, tạo hình, chụp ảnh",
  "Chăm sóc người bệnh, người thân",
  "Thuyết trình, nói trước đám đông",
  "Lắp ráp, sửa chữa đồ vật",
  "Chăm sóc cây trồng, vật nuôi",
  "Thể thao",
  "Khám phá thiên nhiên",
  "Kinh doanh, bán hàng online",
  "Nấu ăn, ẩm thực",
  "Nghe nhạc, chơi nhạc cụ",
];

function Chip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm transition-colors ${
        active
          ? "border-indigo-600 bg-indigo-600 text-white"
          : "border-slate-300 bg-white text-slate-700 hover:border-indigo-400"
      }`}
    >
      {label}
    </button>
  );
}

export default function CareerConsult() {
  const [form, setForm] = useState<FormData>({
    lop: "Lớp 9",
    mon_manh: [],
    mon_yeu: [],
    so_thich: [],
    tinh_cach: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiResult | null>(null);

  function toggle(list: keyof Pick<FormData, "mon_manh" | "mon_yeu" | "so_thich">, value: string) {
    setForm((prev) => {
      const current = prev[list] as string[];
      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      return { ...prev, [list]: next };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/consult", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Đã có lỗi xảy ra.");
      }
      setResult(data as ApiResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setResult(null);
    setError(null);
    setForm({ lop: "Lớp 9", mon_manh: [], mon_yeu: [], so_thich: [], tinh_cach: "" });
  }

  if (result) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-8">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-slate-800 leading-relaxed">{result.gioi_thieu}</p>
        </div>

        <div className="space-y-5">
          {result.nghe_nghiep.map((nganh, index) => (
            <article
              key={nganh.ten}
              className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
            >
              <div className="flex flex-wrap items-center gap-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700">
                  {index + 1}
                </span>
                <h2 className="text-xl font-bold text-slate-900">{nganh.ten}</h2>
                <span
                  className={`ml-auto rounded-full px-3 py-1 text-sm font-semibold ${
                    nganh.do_phu_hop >= 80
                      ? "bg-emerald-100 text-emerald-700"
                      : nganh.do_phu_hop >= 60
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {nganh.do_phu_hop}% phù hợp
                </span>
              </div>

              <p className="mt-3 text-slate-700 leading-relaxed">{nganh.ly_do}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {nganh.khoi_thi.map((khoi) => (
                  <span
                    key={khoi}
                    className="rounded-lg bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 ring-1 ring-indigo-200"
                  >
                    {khoi}
                  </span>
                ))}
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Môn cần ưu tiên
                  </h3>
                  <p className="mt-1 text-slate-700">{nganh.mon_trong_tam.join(", ")}</p>
                </div>
                {nganh.truong_tieu_bieu.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Trường đại học tiêu biểu
                    </h3>
                    <ul className="mt-1 space-y-0.5 text-slate-700">
                      {nganh.truong_tieu_bieu.map((truong) => (
                        <li key={truong}>• {truong}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="mt-4 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Lộ trình
                </h3>
                <p className="mt-1 text-slate-700 leading-relaxed">{nganh.lo_trinh}</p>
              </div>
            </article>
          ))}
        </div>

        {result.khoi_thi_de_nghi.length > 0 && (
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="font-semibold text-slate-900">Khối thi nên hướng tới</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {result.khoi_thi_de_nghi.map((khoi) => (
                <span
                  key={khoi}
                  className="rounded-lg bg-rose-50 px-3 py-1 text-sm font-semibold text-rose-700 ring-1 ring-rose-200"
                >
                  {khoi}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-2xl bg-gradient-to-r from-indigo-50 to-violet-50 p-6 ring-1 ring-indigo-100">
          <h2 className="font-semibold text-indigo-900">Lời khuyên</h2>
          <p className="mt-2 text-slate-800 leading-relaxed">{result.loi_khuyen}</p>
        </div>

        <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-amber-100">
          ⚠️ {result.luu_y}
        </p>

        <div className="text-center">
          <button
            onClick={reset}
            className="rounded-full bg-slate-900 px-8 py-3 font-semibold text-white transition-colors hover:bg-slate-700"
          >
            Làm lại từ đầu
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-2xl space-y-8">
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-lg font-semibold text-slate-900">Bạn đang học lớp mấy?</h2>
        <p className="mt-1 text-sm text-slate-500">
          Học sinh cấp 2 (lớp 6–9) sẽ được tư vấn dài hạn, học sinh cấp 3 (lớp 10–12) được tư vấn sát khối thi hơn.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {classOptions.map((lop) => (
            <Chip
              key={lop}
              active={form.lop === lop}
              onClick={() => setForm((prev) => ({ ...prev, lop }))}
              label={lop}
            />
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-lg font-semibold text-slate-900">Môn học bạn học tốt nhất</h2>
        <p className="mt-1 text-sm text-slate-500">Chọn từ 1 đến 3 môn.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {subjectOptions.map((mon) => (
            <Chip
              key={mon}
              active={form.mon_manh.includes(mon)}
              onClick={() => toggle("mon_manh", mon)}
              label={mon}
            />
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-lg font-semibold text-slate-900">Môn học bạn thấy khó nhất</h2>
        <p className="mt-1 text-sm text-slate-500">Chọn từ 1 đến 3 môn.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {subjectOptions.map((mon) => (
            <Chip
              key={mon}
              active={form.mon_yeu.includes(mon)}
              onClick={() => toggle("mon_yeu", mon)}
              label={mon}
            />
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-lg font-semibold text-slate-900">Bạn thích làm gì nhất?</h2>
        <p className="mt-1 text-sm text-slate-500">Chọn những hoạt động bạn thực sự thấy hứng thú.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {hobbyOptions.map((soThich) => (
            <Chip
              key={soThich}
              active={form.so_thich.includes(soThich)}
              onClick={() => toggle("so_thich", soThich)}
              label={soThich}
            />
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-lg font-semibold text-slate-900">
          Kể thêm về bạn (không bắt buộc){" "}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Ví dụ: “Mình thích tự mày mò sửa đồ điện tử”, “Mình hay kèm em học và thích dạy”,…
        </p>
        <textarea
          value={form.tinh_cach}
          onChange={(e) => setForm((prev) => ({ ...prev, tinh_cach: e.target.value }))}
          rows={3}
          className="mt-4 w-full rounded-xl border border-slate-300 p-3 text-slate-800 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          placeholder="Viết ở đây nếu bạn muốn..."
        />
      </section>

      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-indigo-600 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-indigo-200 transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Đang phân tích định hướng..." : "Xem kết quả định hướng"}
      </button>

      {loading && (
        <p className="text-center text-sm text-slate-500">
          AI chuyên gia đang đối chiếu dữ liệu khối thi, ngành nghề và trường đại học… thường mất 30 giây đến 2 phút, bạn nhấn đúng 1 lần và chờ nhé.
        </p>
      )}
    </form>
  );
}