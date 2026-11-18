import Link from "next/link";

import ExamCountdown from "./components/ExamCountdown";
import MascotOwl from "./components/MascotOwl";
import SiteNav from "./components/SiteNav";
import TinTuc from "./components/TinTuc";

const LUOI = {
  backgroundImage:
    "linear-gradient(to right, rgba(16,26,40,0.055) 1px, transparent 1px), linear-gradient(to bottom, rgba(16,26,40,0.055) 1px, transparent 1px)",
  backgroundSize: "56px 56px",
} as const;

function TieuDeMuc({
  so,
  nho,
  to,
  moTa,
}: {
  so: string;
  nho: string;
  to: string;
  moTa: string;
}) {
  return (
    <div className="flex flex-col gap-4 border-t-2 border-stone-900 pt-5 sm:flex-row sm:items-end sm:justify-between sm:gap-10">
      <div className="flex items-start gap-4">
        <span className="so-bang mt-1 font-display text-[13px] font-extrabold text-blue-600">{so}</span>
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-stone-400">{nho}</p>
          <h2 className="mt-1.5 font-display text-[1.6rem] font-extrabold leading-tight tracking-[-0.025em] sm:text-[2rem]">
            {to}
          </h2>
        </div>
      </div>
      <p className="max-w-md text-sm leading-relaxed text-stone-500 sm:text-right">{moTa}</p>
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
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            ...LUOI,
            maskImage: "linear-gradient(to bottom, black 10%, transparent 92%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 10%, transparent 92%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 hidden w-[42%] bg-blue-50/70 lg:block"
        />

        <div className="relative mx-auto grid w-full max-w-[1440px] items-center gap-10 px-4 py-12 sm:px-8 sm:py-16 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16">
          <div>
            <div className="flex items-center gap-3">
              <span aria-hidden className="h-px w-10 bg-blue-600" />
              <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-blue-700">
                Cú Đậu · Hướng nghiệp AI
              </p>
            </div>

            <h1 className="mt-5 font-display text-[clamp(2.6rem,5.4vw,4.5rem)] font-extrabold leading-[0.98] tracking-[-0.035em]">
              Chọn đúng ngành.
              <br />
              <span className="text-blue-600">Đi đúng đường.</span>
            </h1>

            <p className="mt-5 max-w-[48ch] text-[16.5px] leading-relaxed text-stone-600">
              Một lần chọn sai đánh đổi bằng nhiều năm tháng. Hiểu rõ bản thân từ ghế nhà trường —
              Cú Đậu đồng hành cùng bạn từ chat, tính điểm tới ngày thi.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/huong-nghiep"
                className="group inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3.5 text-[15px] font-bold text-white transition hover:bg-blue-700"
              >
                Chat với Cú Đậu
                <span aria-hidden className="transition group-hover:translate-x-0.5">→</span>
              </Link>
              <Link
                href="/tinh-diem"
                className="rounded-lg border border-stone-900/20 px-6 py-3.5 text-[15px] font-bold text-stone-800 transition hover:border-stone-900/45 hover:bg-white"
              >
                Tính điểm ngay
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[430px]">
            <div aria-hidden className="absolute inset-0 translate-x-2.5 translate-y-2.5 bg-blue-600/20" />
            <div className="relative border border-stone-900/15 bg-white p-3">
              <div className="flex items-center justify-between border-b border-stone-900/10 pb-2.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-stone-400">
                <span>Hồ sơ 2027</span>
                <span className="so-bang">VN</span>
              </div>
              <div className="relative mt-3 overflow-hidden bg-blue-50">
                <div
                  aria-hidden
                  className="absolute inset-0 opacity-60"
                  style={{ ...LUOI, backgroundSize: "28px 28px" }}
                />
                <MascotOwl className="relative mx-auto h-60 w-60 sm:h-72 sm:w-72" src="/cudemhocbai.png" />
              </div>
              <dl className="mt-3 grid grid-cols-3 divide-x divide-stone-900/10 border-t border-stone-900/10 pt-3 text-center">
                {[
                  ["12", "tổ hợp"],
                  ["07", "cổng"],
                  ["04", "kỳ thi"],
                ].map(([so, nhan]) => (
                  <div key={nhan}>
                    <dt className="sr-only">{nhan}</dt>
                    <dd className="so-bang font-display text-base font-extrabold">{so}</dd>
                    <dd className="text-[11px] font-semibold text-stone-400">{nhan}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <p className="mt-3 text-center text-[11px] font-semibold text-stone-400">
              Cú Đậu — trợ lý hướng nghiệp cho học sinh cấp 2, cấp 3
            </p>
          </div>
        </div>
      </header>

      <main id="trai-nghiem" className="mx-auto w-full max-w-[1440px] flex-1 px-4 sm:px-8">
        {/* TIN TỨC */}
        <section className="py-12 sm:py-16">
          <TieuDeMuc
            so="01"
            nho="Tin tuyển sinh & giáo dục"
            to="Nắm bắt thông tin từng kỳ thi"
            moTa="Chọn từng nhóm kỳ thi để xem link tra cứu, cách tính điểm và cổng chính thức."
          />
          <div className="mt-8">
            <TinTuc />
          </div>
        </section>

        {/* ĐẾM NGƯỢC */}
        <section id="lich-thi" className="scroll-mt-20 py-12 sm:py-16">
          <TieuDeMuc
            so="02"
            nho="Đếm ngược"
            to="Kỳ thi tốt nghiệp THPT 2027"
            moTa="Bấm vào từng môn để xem đồng hồ chạy theo đúng giờ thi."
          />
          <div className="mt-8">
            <ExamCountdown />
          </div>
        </section>

        {/* CTA CHAT */}
        <section className="pb-14 sm:pb-20">
          <div className="relative overflow-hidden bg-stone-900">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "linear-gradient(to right, rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.07) 1px, transparent 1px)",
                backgroundSize: "48px 48px",
              }}
            />
            <div className="relative flex flex-col items-center gap-6 px-6 py-10 text-center text-white sm:flex-row sm:gap-10 sm:p-12 sm:text-left">
              <MascotOwl className="h-28 w-28 shrink-0 sm:h-36 sm:w-36" />
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-[1.9rem] font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-[2.5rem]">
                  Còn phân vân?
                  <br />
                  Hỏi Cú Đậu.
                </h2>
                <p className="mt-3 max-w-lg text-sm leading-relaxed text-stone-300 sm:text-[15px]">
                  Kể về môn học, sở thích, tính cách — Cú Đậu gợi ý ngành và lộ trình riêng cho bạn.
                </p>
              </div>
              <Link
                href="/huong-nghiep"
                className="shrink-0 rounded-lg bg-blue-500 px-7 py-3.5 text-[15px] font-bold text-white transition hover:bg-blue-400"
              >
                Bắt đầu chat →
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-stone-900/10 bg-white/70 px-4 py-10 sm:px-8">
        <div className="mx-auto grid w-full max-w-[1440px] gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-display text-[15px] font-extrabold tracking-[-0.01em]">
              CÚ ĐẬU<span className="text-blue-600">.</span>
            </p>
            <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-stone-500">
              Trợ lý AI đồng hành cùng học sinh chọn ngành, tính điểm và về đích kỳ thi.
            </p>
          </div>
          <nav aria-label="Công cụ">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-stone-400">Công cụ</p>
            <ul className="mt-3 space-y-2 text-sm font-semibold">
              <li><Link href="/tinh-diem" className="hover:text-blue-700">Tính điểm</Link></li>
              <li><Link href="/huong-nghiep" className="hover:text-blue-700">Chat hướng nghiệp</Link></li>
              <li><Link href="#lich-thi" className="hover:text-blue-700">Lịch thi 2027</Link></li>
            </ul>
          </nav>
          <nav aria-label="Tham khảo">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-stone-400">Tham khảo</p>
            <ul className="mt-3 space-y-2 text-sm font-semibold">
              <li><a href="https://moet.gov.vn/" target="_blank" rel="noreferrer" className="hover:text-blue-700">Bộ GD&ĐT</a></li>
              <li><a href="https://tuyensinh.moet.gov.vn/" target="_blank" rel="noreferrer" className="hover:text-blue-700">Cổng tuyển sinh</a></li>
              <li><a href="https://thisinh.thitotnghiepthpt.edu.vn/" target="_blank" rel="noreferrer" className="hover:text-blue-700">Hệ thống thí sinh</a></li>
            </ul>
          </nav>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-stone-400">Lưu ý</p>
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
