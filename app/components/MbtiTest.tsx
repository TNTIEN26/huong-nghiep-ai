"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import type { MbtiKetQua, MbtiPole, MbtiType } from "@/lib/mbti";
import { MBTI_QUESTIONS, MBTI_TYPE_MAP, tinhMbti } from "@/lib/mbti";
import MbtiCarousel from "./MbtiCarousel";

type View = "gioi-thieu" | "lam-bai" | "ket-qua";

const SO_CAU = MBTI_QUESTIONS.length;
const KH_MBTI = "hn:mbti";

type MbtiDaLuu = {
  code: string;
  traLoi: MbtiPole[];
};

function luuMbti(kq: MbtiKetQua, traLoi: MbtiPole[]) {
  try {
    localStorage.setItem(
      KH_MBTI,
      JSON.stringify({
        code: kq.code,
        ten: kq.type.ten,
        nhom: kq.type.nhom,
        moTa: kq.type.moTa,
        manh: kq.type.manh,
        ngheNghiep: kq.type.ngheNghiep,
        dem: kq.dem,
        traLoi,
        ngay: new Date().toISOString(),
      }),
    );
  } catch {
    // localStorage có thể bị chặn — không ảnh hưởng kết quả
  }
}

const POLES: MbtiPole[] = ["E", "I", "S", "N", "T", "F", "J", "P"];

function docMbtiDaLuu(): MbtiDaLuu | null {
  try {
    const raw = localStorage.getItem(KH_MBTI);
    if (!raw) return null;
    const o: unknown = JSON.parse(raw);
    if (typeof o !== "object" || o === null) return null;
    const code = (o as { code?: unknown }).code;
    if (typeof code !== "string" || !MBTI_TYPE_MAP[code]) return null;
    const traLoiRaw = (o as { traLoi?: unknown }).traLoi;
    const traLoi = Array.isArray(traLoiRaw)
      ? traLoiRaw.filter((p): p is MbtiPole => POLES.includes(p as MbtiPole))
      : [];
    if (traLoi.length !== SO_CAU) return null;
    return { code, traLoi };
  } catch {
    return null;
  }
}

function ChiTietType({
  type,
  onStart,
  onClose,
}: {
  type: MbtiType;
  onStart: () => void;
  onClose: () => void;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-stone-900/10 bg-white shadow-sm">
      <div className="grid gap-6 p-5 sm:grid-cols-[180px_1fr] sm:p-7">
        <div className="relative aspect-square overflow-hidden rounded-2xl">
          <Image
            src={type.hinh}
            alt={type.code}
            fill
            sizes="180px"
            className="object-cover"
          />
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/55 to-transparent"
          />
          <div className="absolute inset-x-0 bottom-0 p-3 text-white">
            <p className="font-display text-2xl font-extrabold tracking-tight drop-shadow-sm">
              {type.code}
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-white/90">
              {type.ten}
            </p>
          </div>
        </div>

        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-blue-700">
            {type.nhom}
          </p>
          <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight">
            {type.code} — {type.ten}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-stone-600">{type.moTa}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            {type.manh.map((m) => (
              <span
                key={m}
                className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700"
              >
                {m}
              </span>
            ))}
          </div>

          <p className="mt-4 text-xs font-bold uppercase tracking-wide text-stone-400">
            Ngành gợi ý
          </p>
          <p className="mt-1 text-sm font-semibold text-stone-700">
            {type.ngheNghiep.join(" · ")}
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onStart}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              Làm trắc nghiệm để xác nhận
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-stone-900/15 px-5 py-2.5 text-sm font-bold text-stone-600 transition hover:border-stone-900/30 hover:text-stone-900"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function MbtiTest({ initialType }: { initialType?: string }) {
  const router = useRouter();
  const [view, setView] = useState<View>("gioi-thieu");
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<(MbtiPole | null)[]>(() =>
    Array(SO_CAU).fill(null),
  );
  const [ketQua, setKetQua] = useState<MbtiKetQua | null>(null);

  const typeParam = (initialType ?? "").toUpperCase();
  const xemType = typeParam && MBTI_TYPE_MAP[typeParam] ? MBTI_TYPE_MAP[typeParam] : null;

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- khôi phục localStorage sau mount, tránh hydration mismatch */
    const daLuu = docMbtiDaLuu();
    if (daLuu) {
      setAnswers(daLuu.traLoi);
      setKetQua(tinhMbti(daLuu.traLoi));
      setView("ket-qua");
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const tiLe = useMemo(() => {
    if (!ketQua) return [];
    const d = ketQua.dem;
    const pct = (a: MbtiPole, b: MbtiPole) => {
      const tong = d[a] + d[b];
      return tong === 0 ? 50 : Math.round((d[a] / tong) * 100);
    };
    return [
      {
        ten: "Năng lượng",
        viTri: 0,
        trai: "E" as MbtiPole,
        phai: "I" as MbtiPole,
        nhanTrai: "Hướng ngoại",
        nhanPhai: "Hướng nội",
        pct: pct("E", "I"),
      },
      {
        ten: "Cách nhận thức",
        viTri: 1,
        trai: "S" as MbtiPole,
        phai: "N" as MbtiPole,
        nhanTrai: "Giác quan",
        nhanPhai: "Trực giác",
        pct: pct("S", "N"),
      },
      {
        ten: "Cách quyết định",
        viTri: 2,
        trai: "T" as MbtiPole,
        phai: "F" as MbtiPole,
        nhanTrai: "Lý trí",
        nhanPhai: "Cảm xúc",
        pct: pct("T", "F"),
      },
      {
        ten: "Cách sống",
        viTri: 3,
        trai: "J" as MbtiPole,
        phai: "P" as MbtiPole,
        nhanTrai: "Nguyên tắc",
        nhanPhai: "Linh hoạt",
        pct: pct("J", "P"),
      },
    ];
  }, [ketQua]);

  const coDuLieu = ketQua ? Object.values(ketQua.dem).some((v) => v > 0) : false;

  function batDau() {
    setAnswers(Array(SO_CAU).fill(null));
    setCurrent(0);
    setKetQua(null);
    setView("lam-bai");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function chon(pole: MbtiPole) {
    const next = [...answers];
    next[current] = pole;
    setAnswers(next);

    if (current === SO_CAU - 1) {
      const traLoi = next.filter((p): p is MbtiPole => p !== null);
      const kq = tinhMbti(traLoi);
      setKetQua(kq);
      setView("ket-qua");
      luuMbti(kq, traLoi);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setCurrent(current + 1);
    }
  }

  function quayLai() {
    if (current > 0) setCurrent(current - 1);
    else setView("gioi-thieu");
  }

  function moChat() {
    if (!ketQua) return;
    luuMbti(ketQua, answers.filter((p): p is MbtiPole => p !== null));
    router.push("/huong-nghiep");
  }

  function xemChiTiet() {
    if (!ketQua) return;
    luuMbti(ketQua, answers.filter((p): p is MbtiPole => p !== null));
    router.push(`/mbti/${ketQua.code}`);
  }

  if (view === "lam-bai") {
    const q = MBTI_QUESTIONS[current];
    const daChon = answers[current];
    const tienDo = Math.round(((current + (daChon ? 1 : 0)) / SO_CAU) * 100);

    return (
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between text-xs font-bold text-stone-400">
          <span>
            Câu {current + 1} / {SO_CAU}
          </span>
          <button
            type="button"
            onClick={() => setView("gioi-thieu")}
            className="transition hover:text-blue-700"
          >
            Thoát
          </button>
        </div>

        <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-200">
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-300"
            style={{ width: `${tienDo}%` }}
          />
        </div>

        <div className="mt-8 rounded-2xl border border-stone-900/10 bg-white p-5 shadow-sm sm:p-7">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-blue-700">
            Câu hỏi {current + 1}
          </p>
          <h2 className="mt-2 font-display text-xl font-extrabold leading-snug tracking-tight sm:text-2xl">
            {q.cau}
          </h2>

          <div className="mt-5 grid gap-3">
            {[q.a, q.b].map((opt, index) => (
              <button
                key={opt.pole}
                type="button"
                onClick={() => chon(opt.pole)}
                className={`flex items-start gap-3 rounded-xl border px-4 py-3.5 text-left transition ${
                  daChon === opt.pole
                    ? "border-blue-600 bg-blue-50 text-stone-900"
                    : "border-stone-900/10 bg-[#F4F8FE] text-stone-700 hover:border-blue-300 hover:bg-blue-50/60"
                }`}
              >
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${
                    daChon === opt.pole
                      ? "bg-blue-600 text-white"
                      : "bg-white text-stone-500 ring-1 ring-stone-900/10"
                  }`}
                >
                  {index === 0 ? "A" : "B"}
                </span>
                <span className="text-sm font-semibold leading-relaxed">{opt.text}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={quayLai}
            className="rounded-lg border border-stone-900/15 px-4 py-2 text-sm font-bold text-stone-600 transition hover:border-stone-900/30 hover:text-stone-900"
          >
            ← Quay lại
          </button>
          <p className="text-right text-xs text-stone-400">
            Chọn câu trả lời gần với bạn nhất
          </p>
        </div>
      </div>
    );
  }

  if (view === "ket-qua" && ketQua) {
    const t = ketQua.type;

    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="overflow-hidden rounded-2xl border border-stone-900/10 bg-white shadow-sm">
          <div
            className="p-6 text-white sm:p-8"
            style={{ backgroundImage: `linear-gradient(135deg, ${t.mau[0]}, ${t.mau[1]})` }}
          >
            <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-white/75">
              {t.nhom}
            </p>
            <div className="mt-3 flex flex-wrap items-end gap-4">
              <Image
                src={t.hinh}
                alt={t.code}
                width={80}
                height={80}
                className="rounded-2xl border-2 border-white/40 object-cover shadow-md"
              />
              <div>
                <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
                  {ketQua.code}
                </h1>
                <p className="mt-1 text-lg font-bold text-white/90">{t.ten}</p>
              </div>
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/85">{t.moTa}</p>
          </div>

          {coDuLieu && (
          <div className="p-5 sm:p-7">
            <h2 className="text-sm font-extrabold uppercase tracking-[0.16em] text-stone-400">
              Bốn nhóm thiên hướng
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {tiLe.map((d) => {
                const chonTrai = ketQua.code[d.viTri] === d.trai;
                return (
                  <div key={d.ten}>
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className={chonTrai ? "text-blue-700" : "text-stone-400"}>
                        {d.nhanTrai} · {d.pct}%
                      </span>
                      <span className={!chonTrai ? "text-emerald-600" : "text-stone-400"}>
                        {d.nhanPhai} · {100 - d.pct}%
                      </span>
                    </div>
                    <div className="mt-1.5 flex h-2.5 overflow-hidden rounded-full bg-stone-100">
                      <div className="h-full bg-blue-600" style={{ width: `${d.pct}%` }} />
                      <div className="h-full flex-1 bg-emerald-500" />
                    </div>
                    <p className="mt-1 text-center text-[10px] font-semibold uppercase tracking-wide text-stone-400">
                      {d.ten}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
          )}
        </section>

        <div className="grid gap-5 sm:grid-cols-2">
          <section className="rounded-2xl border border-stone-900/10 bg-white p-5 shadow-sm">
            <h2 className="font-display text-lg font-extrabold tracking-tight">Điểm mạnh</h2>
            <ul className="mt-3 space-y-2">
              {t.manh.map((m) => (
                <li key={m} className="flex items-start gap-2 text-sm font-semibold text-stone-700">
                  <span aria-hidden className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                  {m}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-stone-900/10 bg-white p-5 shadow-sm">
            <h2 className="font-display text-lg font-extrabold tracking-tight">Ngành nghề gợi ý</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {t.ngheNghiep.map((n) => (
                <span
                  key={n}
                  className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700"
                >
                  {n}
                </span>
              ))}
            </div>
            <p className="mt-4 text-xs font-bold uppercase tracking-wide text-stone-400">
              Khối thi gợi ý
            </p>
            <p className="mt-1 text-sm font-semibold text-stone-700">{t.khoiGoiY.join(" · ")}</p>
          </section>
        </div>

        <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 sm:p-6">
          <h2 className="font-display text-xl font-extrabold tracking-tight">
            Bước tiếp theo: nối tính cách với ngành học
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-stone-600">
            Cú Đậu sẽ dùng kết quả <strong className="text-stone-900">{ketQua.code}</strong> để gợi
            ý ngành, trường, khối thi và lộ trình phù hợp với bạn.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={moChat}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              Cùng Cú Đậu tìm hiểu ngành nghề →
            </button>
            <button
              type="button"
              onClick={xemChiTiet}
              className="rounded-lg border border-stone-900/15 bg-white px-5 py-2.5 text-sm font-bold text-stone-700 transition hover:border-stone-900/30 hover:text-stone-900"
            >
              Xem mô tả chi tiết
            </button>
            <Link
              href={`/tra-cuu/nganh?q=${encodeURIComponent(t.ngheNghiep[0])}`}
              className="rounded-lg border border-stone-900/15 bg-white px-5 py-2.5 text-sm font-bold text-stone-700 transition hover:border-stone-900/30 hover:text-stone-900"
            >
              Tra cứu ngành liên quan
            </Link>
            <button
              type="button"
              onClick={batDau}
              className="rounded-lg border border-stone-900/15 bg-white px-5 py-2.5 text-sm font-bold text-stone-700 transition hover:border-stone-900/30 hover:text-stone-900"
            >
              Làm lại
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {xemType && (
        <ChiTietType
          type={xemType}
          onStart={batDau}
          onClose={() => router.replace("/trac-nghiem-tinh-cach")}
        />
      )}

      <section className="text-center">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-blue-700">
          Trắc nghiệm tính cách
        </p>
        <h1 className="mx-auto mt-3 max-w-3xl font-display text-[clamp(2rem,4.5vw,3.2rem)] font-extrabold leading-tight tracking-[-0.03em]">
          Khám phá tính cách của bạn
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-stone-500">
          Bạn thực sự là ai? Chỉ vài câu hỏi đơn giản để khám phá tính cách và mở ra định hướng
          chính xác nhất về ngành nghề phù hợp với tiềm năng của bạn.
        </p>
      </section>

      <section>
        <MbtiCarousel />
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={batDau}
            className="rounded-lg bg-blue-600 px-7 py-3.5 text-[15px] font-bold text-white transition hover:bg-blue-700"
          >
            Khám phá 16 nhóm tính cách →
          </button>
          <p className="mt-2 text-xs text-stone-400">20 câu hỏi · khoảng 2 phút · có kết quả ngay</p>
        </div>
      </section>

      <section>
        <h2 className="text-center font-display text-2xl font-extrabold tracking-tight">
          Lời khuyên khi làm trắc nghiệm
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: "🌤️",
              ten: "Tâm trạng ổn định",
              moTa: "Kết quả phụ thuộc nhiều vào cảm xúc. Hãy làm khi bạn đang bình ổn nhất, không quá vui hay quá buồn.",
            },
            {
              icon: "🪞",
              ten: "Trung thực tuyệt đối",
              moTa: "Phân biệt rõ giữa con người hiện tại và người bạn muốn trở thành. Đừng để áp lực bên ngoài chi phối.",
            },
            {
              icon: "🔄",
              ten: "Kiểm tra định kỳ",
              moTa: "Con người thay đổi theo thời gian. Hãy làm lại trắc nghiệm ở các giai đoạn khác nhau để cập nhật.",
            },
          ].map((c) => (
            <div
              key={c.ten}
              className="rounded-2xl border border-stone-900/10 bg-white p-5 shadow-sm"
            >
              <span aria-hidden className="text-2xl">
                {c.icon}
              </span>
              <h3 className="mt-2 font-display text-base font-extrabold tracking-tight">{c.ten}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-stone-500">{c.moTa}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-stone-900/10 bg-stone-900 p-6 text-center text-white sm:p-8">
        <h2 className="font-display text-2xl font-extrabold tracking-tight">
          Chắc chắn rồi, tôi muốn test ngay!
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-stone-300">
          Làm trắc nghiệm trước, rồi để Cú Đậu nối kết quả tính cách với ngành học, trường và khối
          thi phù hợp.
        </p>
        <button
          type="button"
          onClick={batDau}
          className="mt-5 rounded-lg bg-blue-500 px-7 py-3.5 text-[15px] font-bold text-white transition hover:bg-blue-400"
        >
          Bắt đầu làm trắc nghiệm →
        </button>
      </section>
    </div>
  );
}
