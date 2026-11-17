import Link from "next/link";

import ExamCountdown from "./components/ExamCountdown";
import MascotOwl from "./components/MascotOwl";
import SiteNav from "./components/SiteNav";
import TinTuc from "./components/TinTuc";

function TieuDeMuc({ nho, to, moTa }: { nho: string; to: string; moTa: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">{nho}</p>
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
          className="pointer-events-none absolute -top-32 left-1/2 h-64 w-[720px] max-w-full -translate-x-1/2 rounded-full bg-blue-300/30 blur-[100px]"
        />
        <div className="relative mx-auto grid w-full max-w-[1440px] items-center gap-8 px-4 py-10 sm:px-8 sm:py-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-blue-600/30 bg-blue-50 px-4 py-1.5 text-xs font-bold text-blue-700">
              <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
              CÚ ĐẬU • HƯỚNG NGHIỆP AI
            </p>
            <h1 className="mt-4 text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl">
              Chọn đúng ngành,
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-sky-500 bg-clip-text text-transparent">
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
                className="rounded-2xl bg-blue-600 px-7 py-3.5 text-[15px] font-bold text-white shadow-[0_18px_40px_-16px_rgba(37,99,235,0.6)] transition hover:bg-blue-500"
              >
                Chat với Cú Đậu →
              </Link>
              <Link
                href="/tinh-diem"
                className="rounded-2xl border border-stone-900/15 bg-white px-7 py-3.5 text-[15px] font-bold transition hover:border-blue-400/60"
              >
                Tính điểm ngay
              </Link>
            </div>
            <dl className="mt-6 flex gap-7">
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
            <MascotOwl className="h-80 w-80 lg:h-96 lg:w-96" src="/cudemhocbai.png" />
          </div>
        </div>
      </header>

<main id="trai-nghiem" className="mx-auto w-full max-w-[1440px] flex-1 px-4 sm:px-8">
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

        {/* CTA CHAT */}
        <section className="pb-14 sm:pb-20">
          <div className="flex flex-col items-center gap-5 rounded-[2rem] bg-stone-900 px-6 py-10 text-center text-[#F4F8FE] sm:flex-row sm:gap-8 sm:p-10 sm:text-left">
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
                className="mt-5 inline-block rounded-2xl bg-blue-600 px-8 py-3.5 text-[15px] font-bold text-white transition hover:bg-blue-500"
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
              <li><Link href="/tinh-diem" className="hover:text-blue-700">Tính điểm</Link></li>
              <li><Link href="/huong-nghiep" className="hover:text-blue-700">Chat hướng nghiệp</Link></li>
              <li><Link href="#lich-thi" className="hover:text-blue-700">Lịch thi 2027</Link></li>
            </ul>
          </nav>
          <nav aria-label="Tham khảo">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-stone-400">Tham khảo</p>
            <ul className="mt-3 space-y-2 text-sm font-semibold">
              <li><a href="https://moet.gov.vn/" target="_blank" rel="noreferrer" className="hover:text-blue-700">Bộ GD&ĐT</a></li>
              <li><a href="https://tuyensinh.moet.gov.vn/" target="_blank" rel="noreferrer" className="hover:text-blue-700">Cổng tuyển sinh</a></li>
              <li><a href="https://thisinh.thitotnghiepthpt.edu.vn/" target="_blank" rel="noreferrer" className="hover:text-blue-700">Hệ thống thí sinh</a></li>
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
