import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HOCMAI_SLUG, MBTI_TYPES, MBTI_TYPE_MAP } from "@/lib/mbti";
import { MBTI_HOCMAI, type MbtiHocmaiBlock } from "@/lib/mbti-hocmai";

type PageProps = {
  params: Promise<{ slug: string }>;
};

function resolveCode(slug: string) {
  const raw = slug.split("-")[0].toUpperCase();
  return raw === "JSFP" ? "ISFP" : raw;
}

export function generateStaticParams() {
  return MBTI_TYPES.flatMap((type) => [
    { slug: type.code.toLowerCase() },
    { slug: HOCMAI_SLUG[type.code] },
  ]);
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const type = MBTI_TYPE_MAP[resolveCode(slug)];
  if (!type) return { title: "Không tìm thấy nhóm tính cách" };
  return {
    title: `${type.code} – ${type.ten} | Cú Đậu`,
    description: type.moTa,
  };
}

function Block({ label, text }: MbtiHocmaiBlock) {
  return (
    <p className="text-sm leading-7 text-stone-600">
      {label ? <strong className="font-semibold text-stone-900">{label} </strong> : null}
      {text}
    </p>
  );
}

function SectionTitle({
  id,
  eyebrow,
  title,
}: {
  id: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <div id={id} className="scroll-mt-24">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600">
        {eyebrow}
      </p>
      <h2 className="mt-1 text-xl font-bold text-stone-900 md:text-2xl">{title}</h2>
    </div>
  );
}

export default async function MbtiDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const code = resolveCode(slug);
  const type = MBTI_TYPE_MAP[code];

  if (!type) notFound();

  const profile = MBTI_HOCMAI[code];
  const hocmaiSlug = HOCMAI_SLUG[code];

  return (
    <div className="min-h-screen bg-[#f6f9ff]">
      <nav className="border-b border-stone-200 bg-white/80 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 text-sm">
          <Link
            href="/"
            className="font-semibold text-stone-600 transition hover:text-blue-600"
          >
            ← Trang chủ
          </Link>
          <Link
            href="/trac-nghiem-tinh-cach"
            className="font-semibold text-stone-600 transition hover:text-blue-600"
          >
            Làm trắc nghiệm
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-4 py-6 md:px-6 md:py-10">
        <section className="overflow-hidden rounded-3xl border border-white/40 shadow-sm">
          <div
            className="relative p-6 text-white md:p-10"
            style={{
              background: `linear-gradient(135deg, ${type.mau[0]}, ${type.mau[1]})`,
            }}
          >
            <div className="flex flex-col items-center gap-6 text-center md:flex-row md:items-start md:text-left">
              <Image
                src={type.hinh}
                alt={`${type.code} – ${type.ten}`}
                width={160}
                height={160}
                priority
                className="h-32 w-32 shrink-0 rounded-2xl border border-white/30 bg-white/10 object-cover shadow-lg md:h-40 md:w-40"
              />
              <div className="max-w-2xl">
                <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
                  Nhóm tính cách {type.code}
                </span>
                <h1 className="mt-3 text-2xl font-bold md:text-4xl">{type.ten}</h1>
                <p className="mt-2 text-sm leading-6 text-white/85 md:text-base">
                  {type.moTa}
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2 md:justify-start">
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                    {type.nhom}
                  </span>
                  {type.khoiGoiY.map((khoi) => (
                    <span
                      key={khoi}
                      className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold"
                    >
                      Khối {khoi}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 text-xs font-semibold text-stone-600 [scrollbar-width:none]">
          {[
            ["#tong-quan", "Tổng quan"],
            ["#dac-diem", "4 đặc điểm"],
            ["#cuoc-song", "Cuộc sống"],
            ["#diem-manh", "Điểm mạnh"],
            ["#loi-khuyen", "Lời khuyên"],
            ["#nganh-nghe", "Ngành nghề"],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="shrink-0 rounded-full border border-stone-200 bg-white px-3 py-1.5 transition hover:border-blue-300 hover:text-blue-600"
            >
              {label}
            </a>
          ))}
        </nav>

        {profile ? (
          <div className="mt-6 space-y-6">
            <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm md:p-7">
              <SectionTitle id="tong-quan" eyebrow="Chân dung" title="Tổng quan" />
              <div className="mt-4 space-y-3">
                {profile.overview.map((block, index) => (
                  <Block key={index} label={block.label} text={block.text} />
                ))}
              </div>

              {profile.traits.length > 0 && (
                <div id="dac-diem" className="mt-7 scroll-mt-24">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600">
                    4 đặc điểm nổi bật
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
                    {profile.traits.map((trait) => (
                      <div
                        key={trait.letter}
                        className="rounded-xl border border-stone-200 bg-stone-50 p-3"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
                          {trait.letter}
                        </span>
                        <p className="mt-2 text-sm font-bold text-stone-900">{trait.title}</p>
                        <p className="text-xs text-stone-500">{trait.sub}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {profile.famous.length > 0 && (
                <div className="mt-7">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600">
                    Người nổi tiếng cùng nhóm
                  </p>
                  <ul className="mt-3 grid gap-2 text-sm text-stone-600 sm:grid-cols-2">
                    {profile.famous.map((name) => (
                      <li key={name} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                        <span>{name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            <section
              id="cuoc-song"
              className="scroll-mt-24 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm md:p-7"
            >
              <SectionTitle id="cuoc-song-title" eyebrow="Đời sống" title="Trong cuộc sống & công việc" />
              <div className="mt-4 grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wide text-blue-700">
                    Trong cuộc sống
                  </h3>
                  <div className="mt-2 space-y-3">
                    {profile.life.map((paragraph, index) => (
                      <p key={index} className="text-sm leading-7 text-stone-600">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wide text-blue-700">
                    Trong công việc
                  </h3>
                  <div className="mt-2 space-y-3">
                    {profile.work.map((paragraph, index) => (
                      <p key={index} className="text-sm leading-7 text-stone-600">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section
              id="diem-manh"
              className="scroll-mt-24 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm md:p-7"
            >
              <SectionTitle id="diem-manh-title" eyebrow="Điểm mạnh & thách thức" title="Bạn giỏi gì, cần lưu ý gì" />
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-emerald-700">
                    Điểm mạnh nổi bật
                  </h3>
                  <ul className="mt-3 space-y-3">
                    {profile.strengths.map((item) => (
                      <li key={item.label} className="text-sm leading-6 text-stone-700">
                        <strong className="font-semibold text-emerald-800">{item.label}:</strong>{" "}
                        {item.text}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-rose-700">
                    Thách thức cần vượt qua
                  </h3>
                  <ul className="mt-3 space-y-3">
                    {profile.weaknesses.map((item) => (
                      <li key={item.label} className="text-sm leading-6 text-stone-700">
                        <strong className="font-semibold text-rose-800">{item.label}:</strong>{" "}
                        {item.text}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            <section
              id="loi-khuyen"
              className="scroll-mt-24 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm md:p-7"
            >
              <SectionTitle id="loi-khuyen-title" eyebrow="Dành cho bạn" title="Lời khuyên phát triển bản thân" />
              <ol className="mt-4 space-y-3">
                {profile.advice.map((item, index) => (
                  <li
                    key={`${item.label}-${index}`}
                    className="rounded-xl border border-stone-200 bg-stone-50 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-bold text-stone-900">{item.label}</p>
                        <p className="mt-1 text-sm leading-7 text-stone-600">{item.text}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <section
              id="nganh-nghe"
              className="scroll-mt-24 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm md:p-7"
            >
              <SectionTitle id="nganh-nghe-title" eyebrow="Định hướng" title="Ngành nghề phù hợp" />
              {profile.careerIntro.map((paragraph, index) => (
                <p key={index} className="mt-3 text-sm leading-7 text-stone-600">
                  {paragraph}
                </p>
              ))}
              <div className="mt-4 flex flex-wrap gap-2">
                {profile.careers.map((career) => (
                  <span
                    key={career}
                    className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700"
                  >
                    {career}
                  </span>
                ))}
              </div>
            </section>
          </div>
        ) : (
          <section className="mt-6 rounded-2xl border border-stone-200 bg-white p-6">
            <p className="text-sm leading-7 text-stone-600">{type.moTa}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {type.ngheNghiep.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700"
                >
                  {item}
                </span>
              ))}
            </div>
          </section>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-3 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <Link
            href="/trac-nghiem-tinh-cach"
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            Làm lại trắc nghiệm
          </Link>
          {hocmaiSlug && (
            <a
              href={`https://huongnghiep.hocmai.vn/mbti/${hocmaiSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-stone-200 px-5 py-2.5 text-sm font-semibold text-stone-600 transition hover:border-blue-300 hover:text-blue-600"
            >
              Nguồn: HOCMAI ↗
            </a>
          )}
        </div>
      </main>
    </div>
  );
}
