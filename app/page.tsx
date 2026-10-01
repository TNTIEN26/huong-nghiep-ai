import Link from "next/link";

import ExamCountdown from "./components/ExamCountdown";
import MascotOwl from "./components/MascotOwl";
import QuizTinhCach from "./components/QuizTinhCach";
import SiteNav from "./components/SiteNav";
import TinTuc from "./components/TinTuc";

const BUOCS = [
  {
    so: "01",
    ten: "Chat với Cú Đậu",
    moTa: "Kể về bản thân, AI gợi ý ngành, khối thi và lộ trình phù hợp.",
    href: "/huong-nghiep",
    nut: "Chat ngay →",
  },
  {
    so: "02",
    ten: "Tính điểm",
    moTa: "Học bạ, xét tốt nghiệp, quy đổi ĐGNL — tính đúng quy chế Bộ.",
    href: "/tinh-diem",
    nut: "Tính ngay →",
  },
  {
    so: "03",
    ten: "Xem lịch thi",
    moTa: "Đếm ngược từng môn thi tốt nghiệp THPT 2027 theo giờ thật.",
    href: "#lich-thi",
    nut: "Xem lịch →",
  },
];

const CONG_CU = [
  { ten: "Tính điểm học bạ", moTa: "TB 3 năm trọng số 1–2–3", href: "/tinh-diem" },
  { ten: "Tính điểm tốt nghiệp", moTa: "Kèm sơ đồ công thức trực quan", href: "/tinh-diem" },
  { ten: "Quy đổi ĐGNL", moTa: "HSA, V-ACT, TSA, SAT, IELTS…", href: "/tinh-diem" },
  { ten: "Tra tổ hợp môn", moTa: "Chọn môn, hiện tổ hợp tương ứng", href: "/tinh-diem" },
  { ten: "Đếm ngược kỳ thi", moTa: "Từng môn, từng giây", href: "#lich-thi" },
  { ten: "Chat hướng nghiệp", moTa: "Hỏi đáp cùng Cú Đậu", href: "/huong-nghiep" },
];

const CAM_NANG = [
  {
    ten: "Cách tính điểm tốt nghiệp 2027",
    moTa: "Trọng số học bạ, điểm liệt, điểm ưu tiên — giải thích từng bước.",
    href: "/tinh-diem",
  },
  {
    ten: "Lịch thi tốt nghiệp 2027",
    moTa: "Ngày giờ từng môn + đồng hồ đếm ngược theo giờ thật.",
    href: "#lich-thi",
  },
  {
    ten: "Quy chế tuyển sinh mới nhất",
    moTa: "Cổng thông tin tuyển sinh chính thức của Bộ GD&ĐT.",
    href: "https://tuyensinh.moet.gov.vn/",
    ngoai: true,
  },
];

const LO_TRINH = [
  {
    nam: "Lớp 10",
    ten: "Khám phá",
    moTa: "Làm quiz tính cách, chat với Cú Đậu để biết mình hợp nhóm nào.",
    href: "/huong-nghiep",
    nut: "Chat ngay →",
  },
  {
    nam: "Lớp 11",
    ten: "Thử sức",
    moTa: "Nhập học bạ, quy đổi thử điểm HSA, V-ACT, TSA xem tới đâu.",
    href: "/tinh-diem",
    nut: "Tính thử →",
  },
  {
    nam: "Lớp 12",
    ten: "Về đích",
    moTa: "Theo dõi đếm ngược, tính điểm tốt nghiệp, chốt nguyện vọng.",
    href: "#lich-thi",
    nut: "Xem lịch →",
  },
  {
    nam: "Tân sinh viên",
    ten: "Nhập học",
    moTa: "Đối chiếu đề án trường, chuẩn bị hồ sơ nhập học tự tin.",
    href: "https://tuyensinh.moet.gov.vn/",
    nut: "Cổng Bộ →",
  },
];

function TieuDeMuc({ nho, to, moTa }: { nho: string; to: string; moTa: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">{nho}</p>
      <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">{to}</h2>
      <p className="mt-2 text-sm leading-relaxed text-stone-500 sm:text-[15px]">{moTa}</p>
    </div>
  );
}

export default function Home() {
  return (
    <div className="relative z-10 flex min-h-screen flex-col overflow-x-clip text-stone-900">
      <SiteNav active="trang-chu" />

      {/* HERO */}
      <header className="relative overflow-hidden border-b border-stone-900/10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(var(--dot) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
            maskImage: "radial-gradient(ellipse 75% 65% at 50% 0%, black 25%, transparent 78%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 75% 65% at 50% 0%, black 25%, transparent 78%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 h-64 w-[720px] max-w-full -translate-x-1/2 rounded-full bg-orange-300/30 blur-[100px]"
        />
        <div className="relative mx-auto grid w-full max-w-[1440px] items-center gap-8 px-4 py-14 sm:px-8 sm:py-20 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-orange-600/30 bg-orange-50 px-4 py-1.5 text-xs font-bold text-orange-700">
              <span className="h-2 w-2 animate-pulse rounded-full bg-orange-500" />
              CÚ ĐẬU • HƯỚNG NGHIỆP AI
            </p>
            <h1 className="mt-4 text-4xl font-black leading-[1.08] tracking-tight sm:text-6xl">
              Chọn đúng ngành,
              <br />
              <span className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 bg-clip-text text-transparent">
                đi đúng đường.
              </span>
            </h1>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-stone-500 sm:text-base">
              Một lần chọn sai đánh đổi bằng nhiều năm tháng. Hiểu rõ bản thân từ ghế nhà
              trường — Cú Đậu đồng hành cùng bạn từ chat, tính điểm tới ngày thi.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/huong-nghiep"
                className="rounded-2xl bg-orange-600 px-7 py-3.5 text-[15px] font-bold text-white shadow-[0_18px_40px_-16px_rgba(234,88,12,0.6)] transition hover:bg-orange-500"
              >
                Chat với Cú Đậu →
              </Link>
              <Link
                href="/tinh-diem"
                className="rounded-2xl border border-stone-900/15 bg-white px-7 py-3.5 text-[15px] font-bold transition hover:border-orange-400/60"
              >
                Tính điểm ngay
              </Link>
            </div>
            <dl className="mt-8 flex gap-7">
              {[
                ["12", "tổ hợp môn"],
                ["7", "cổng tra cứu"],
                ["4", "kỳ thi riêng"],
              ].map(([so, label]) => (
                <div key={label}>
                  <dt className="sr-only">{label}</dt>
                  <dd className="text-xl font-black">{so}</dd>
                  <dd className="mt-0.5 text-xs text-stone-500">{label}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="relative hidden justify-center lg:flex">
            <MascotOwl className="h-72 w-72" />
            <div
              className="bob-nhe absolute -left-2 top-8 rounded-2xl border border-stone-900/10 bg-white/90 px-4 py-2.5 text-left shadow-lg backdrop-blur"
              style={{ animationDelay: "0.8s" }}
            >
              <p className="text-xs font-bold">A00 • Toán Lý Hóa</p>
              <p className="text-[11px] text-stone-500">Tư duy Logic hợp nhất</p>
            </div>
            <div
              className="bob-nhe absolute -right-2 top-1/3 rounded-2xl border border-stone-900/10 bg-white/90 px-4 py-2.5 text-left shadow-lg backdrop-blur"
              style={{ animationDelay: "2s" }}
            >
              <p className="text-xs font-bold">ĐXTN 8.48</p>
              <p className="text-[11px] text-stone-500">Đỗ tốt nghiệp</p>
            </div>
            <div
              className="bob-nhe absolute bottom-6 left-10 rounded-2xl border border-stone-900/10 bg-white/90 px-4 py-2.5 text-left shadow-lg backdrop-blur"
              style={{ animationDelay: "3.2s" }}
            >
              <p className="text-xs font-bold">Còn 261 ngày</p>
              <p className="text-[11px] text-stone-500">Tới kỳ thi THPT 2027</p>
            </div>
          </div>
        </div>
      </header>

<main id="trai-nghiem" className="mx-auto w-full max-w-[1440px] flex-1 px-4 sm:px-8">
        {/* 3 BƯỚC */}
        <section className="py-12 sm:py-16">
          <TieuDeMuc
            nho="Bắt đầu tại đây"
            to="3 bước để bắt đầu ngay"
            moTa="Dù bạn đang mông lung chọn ngành hay cần tính điểm gấp, cứ đi theo 3 bước này."
          />
          <ol className="mt-8 grid gap-4 sm:grid-cols-3">
            {BUOCS.map((b) => (
              <li
                key={b.so}
                className="flex flex-col rounded-3xl border border-stone-900/10 bg-white p-6 shadow-[0_16px_40px_-24px_rgba(28,25,23,0.3)]"
              >
                <p className="text-sm font-black text-orange-600">{b.so}</p>
                <h3 className="mt-2 font-extrabold">{b.ten}</h3>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-stone-500">{b.moTa}</p>
                <Link
                  href={b.href}
                  className="mt-4 text-sm font-bold text-orange-700 hover:text-orange-600"
                >
                  {b.nut}
                </Link>
              </li>
            ))}
          </ol>
        </section>

        {/* QUIZ */}
        <section className="border-t border-stone-900/10 py-12 sm:py-16">
          <TieuDeMuc
            nho="Khám phá bản thân"
            to="Bạn thuộc nhóm tính cách nào?"
            moTa="6 câu hỏi ngắn, 1 phút — biết ngay nhóm tính cách và khối thi gợi ý."
          />
          <div className="mx-auto mt-8 max-w-4xl">
            <QuizTinhCach />
          </div>
        </section>

        {/* TIN TỨC */}
        <section className="border-t border-stone-900/10 py-12 sm:py-16">
          <TieuDeMuc
            nho="Tin tuyển sinh & giáo dục"
            to="Nắm bắt thông tin từng kỳ thi"
            moTa="Chọn từng nhóm kỳ thi để xem link tra cứu, cách tính điểm và cổng chính thức."
          />
          <div className="mt-8">
            <TinTuc />
          </div>
        </section>

        {/* ĐẾM NGƯỢC — gọn, đúng chỗ */}
        <section id="lich-thi" className="scroll-mt-20 border-t border-stone-900/10 py-12 sm:py-16">
          <TieuDeMuc
            nho="Đếm ngược"
            to="Kỳ thi tốt nghiệp THPT 2027"
            moTa="Bấm vào từng môn để xem đồng hồ chạy theo đúng giờ thi."
          />
          <div className="mx-auto mt-8 max-w-6xl">
            <ExamCountdown />
          </div>
        </section>

        {/* BỘ CÔNG CỤ */}
        <section className="border-t border-stone-900/10 py-12 sm:py-16">
          <TieuDeMuc
            nho="Trọn bộ công cụ"
            to="Mọi thứ bạn cần, ở một chỗ"
            moTa="Tính toán đúng quy chế Bộ, miễn phí, không cần tài khoản."
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CONG_CU.map((c, i) => (
              <Link
                key={c.ten}
                href={c.href}
                className="group rounded-3xl border border-stone-900/10 bg-white p-6 transition hover:border-orange-400/60 hover:shadow-[0_0_28px_-10px_rgba(234,88,12,0.4)]"
              >
                <p className="text-sm font-black text-orange-600">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-2 font-extrabold">{c.ten}</h3>
                <p className="mt-1 text-sm text-stone-500">{c.moTa}</p>
                <p className="mt-3 text-sm font-bold text-orange-700">
                  Khám phá ngay <span className="inline-block transition group-hover:translate-x-1">→</span>
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* CẨM NANG */}
        <section className="border-t border-stone-900/10 py-12 sm:py-16">
          <TieuDeMuc
            nho="Cẩm nang"
            to="Đọc hiểu trước khi thi"
            moTa="Những bài giải thích ngắn gọn, đọc 3 phút hiểu ngay."
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {CAM_NANG.map((c) =>
              c.ngoai ? (
                <a
                  key={c.ten}
                  href={c.href}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-3xl border border-stone-900/10 bg-white p-6 transition hover:border-orange-400/60"
                >
                  <h3 className="font-extrabold leading-snug">{c.ten}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone-500">{c.moTa}</p>
                  <p className="mt-3 text-sm font-bold text-orange-700">Đọc ngay →</p>
                </a>
              ) : (
                <Link
                  key={c.ten}
                  href={c.href}
                  className="rounded-3xl border border-stone-900/10 bg-white p-6 transition hover:border-orange-400/60"
                >
                  <h3 className="font-extrabold leading-snug">{c.ten}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone-500">{c.moTa}</p>
                  <p className="mt-3 text-sm font-bold text-orange-700">Đọc ngay →</p>
                </Link>
              ),
            )}
          </div>
        </section>

        {/* LỘ TRÌNH 4 NĂM */}
        <section className="border-t border-stone-900/10 py-12 sm:py-16">
          <TieuDeMuc
            nho="Đồng hành dài hạn"
            to="Lộ trình 4 năm cùng Cú Đậu"
            moTa="Mỗi năm một việc — đi hết lộ trình là tới cổng trường mơ ước."
          />
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {LO_TRINH.map((g, i) => (
              <li
                key={g.nam}
                className="relative rounded-3xl border border-stone-900/10 bg-white p-6"
              >
                <span className="absolute -top-3.5 left-6 rounded-full bg-stone-900 px-3 py-1 text-[11px] font-black text-[#faf4e9]">
                  {i + 1}
                </span>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-600">
                  {g.nam}
                </p>
                <h3 className="mt-1 font-extrabold">{g.ten}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-stone-500">{g.moTa}</p>
                {g.href.startsWith("http") ? (
                  <a
                    href={g.href}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-block text-sm font-bold text-orange-700 hover:text-orange-600"
                  >
                    {g.nut}
                  </a>
                ) : (
                  <Link
                    href={g.href}
                    className="mt-3 inline-block text-sm font-bold text-orange-700 hover:text-orange-600"
                  >
                    {g.nut}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </section>

        {/* CTA CHAT */}
        <section className="pb-14 sm:pb-20">
          <div className="flex flex-col items-center gap-5 rounded-[2rem] bg-stone-900 px-6 py-10 text-center text-[#faf4e9] sm:flex-row sm:gap-8 sm:p-10 sm:text-left">
            <MascotOwl className="h-28 w-28 shrink-0 sm:h-36 sm:w-36" />
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
                Còn phân vân? Hỏi Cú Đậu.
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-stone-300 sm:text-[15px]">
                Kể về môn học, sở thích, tính cách — Cú Đậu gợi ý ngành và lộ trình riêng cho bạn.
              </p>
              <Link
                href="/huong-nghiep"
                className="mt-5 inline-block rounded-2xl bg-orange-600 px-8 py-3.5 text-[15px] font-bold text-white transition hover:bg-orange-500"
              >
                Hãy bắt đầu →
              </Link>
            </div>
          </div>
          {/*
            TẠM ẨN form tư vấn (CareerConsult) khỏi hiển thị theo yêu cầu.
            File + API /api/consult vẫn giữ nguyên cho bạn phụ trách tính năng.
          */}
        </section>
      </main>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-stone-900/10 bg-white/60 px-4 py-10 sm:px-8">
        <div className="mx-auto grid w-full max-w-[1440px] gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-sm font-black">CÚ ĐẬU</p>
            <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-stone-500">
              Trợ lý AI đồng hành cùng học sinh chọn ngành, tính điểm và về đích kỳ thi.
            </p>
          </div>
          <nav aria-label="Công cụ">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-stone-400">Công cụ</p>
            <ul className="mt-3 space-y-2 text-sm font-semibold">
              <li><Link href="/tinh-diem" className="hover:text-orange-700">Tính điểm</Link></li>
              <li><Link href="/huong-nghiep" className="hover:text-orange-700">Chat hướng nghiệp</Link></li>
              <li><Link href="#lich-thi" className="hover:text-orange-700">Lịch thi 2027</Link></li>
            </ul>
          </nav>
          <nav aria-label="Tham khảo">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-stone-400">Tham khảo</p>
            <ul className="mt-3 space-y-2 text-sm font-semibold">
              <li><a href="https://moet.gov.vn/" target="_blank" rel="noreferrer" className="hover:text-orange-700">Bộ GD&ĐT</a></li>
              <li><a href="https://tuyensinh.moet.gov.vn/" target="_blank" rel="noreferrer" className="hover:text-orange-700">Cổng tuyển sinh</a></li>
              <li><a href="https://thisinh.thitotnghiepthpt.edu.vn/" target="_blank" rel="noreferrer" className="hover:text-orange-700">Hệ thống thí sinh</a></li>
            </ul>
          </nav>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-stone-400">Lưu ý</p>
            <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-stone-500">
              Kết quả chỉ mang tính tham khảo, không thay thế tư vấn trực tiếp từ thầy cô.
              Đối chiếu website chính thức của từng trường trước khi đăng ký nguyện vọng.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
