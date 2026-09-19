import ExamCountdown from "./components/ExamCountdown";
import HeroSection from "./components/HeroSection";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-zinc-950 text-zinc-100">
      {/* NAV */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-zinc-950/90 backdrop-blur">
        <div className="relative flex w-full items-center gap-3 px-5 py-3.5 sm:px-8">
          <p className="text-[15px] font-bold tracking-tight">
            Hướng nghiệp AI
            <span className="ml-2 rounded border border-white/15 px-1.5 py-0.5 align-middle text-[11px] font-semibold text-zinc-400">
              Beta
            </span>
          </p>
          <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-1">
            {/* TODO(pages): các trang Thông tin / Tính điểm / Lịch thi sẽ được thêm sau */}
            <button
              type="button"
              title="Sắp ra mắt"
              className="rounded-lg px-5 py-2.5 text-[15px] text-zinc-400 transition hover:bg-white/5 hover:text-zinc-100"
            >
              Thông tin
            </button>
            <button
              type="button"
              title="Sắp ra mắt"
              className="rounded-lg px-5 py-2.5 text-[15px] text-zinc-400 transition hover:bg-white/5 hover:text-zinc-100"
            >
              Tính điểm
            </button>
            <button
              type="button"
              title="Sắp ra mắt"
              className="rounded-lg px-5 py-2.5 text-[15px] text-zinc-400 transition hover:bg-white/5 hover:text-zinc-100"
            >
              Lịch thi
            </button>
          </div>
        </div>
      </nav>

      {/* HERO — chiếm 1 màn hình */}
      <header className="relative flex min-h-[calc(100vh-65px)] items-center overflow-hidden border-b border-white/10">
        {/* Vân chấm mờ + quầng sáng nhẹ cho đỡ trơn */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
            maskImage: "radial-gradient(ellipse 75% 65% at 50% 0%, black 25%, transparent 78%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 75% 65% at 50% 0%, black 25%, transparent 78%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 h-64 w-[720px] max-w-full -translate-x-1/2 rounded-full bg-white/[0.04] blur-[100px]"
        />

        <div className="relative mx-auto w-full max-w-5xl px-5 py-16 sm:py-20">
          <HeroSection />

          <dl className="mx-auto mt-12 flex max-w-2xl justify-center gap-10 border-t border-white/10 pt-8">
            {[
              ["3", "ngành gợi ý"],
              ["15", "nguyện vọng tối đa"],
              ["15/30", "điểm sàn xét tuyển"],
            ].map(([so, label]) => (
              <div key={label}>
                <dt className="sr-only">{label}</dt>
                <dd className="text-2xl font-extrabold">{so}</dd>
                <dd className="mt-1 text-xs text-zinc-500">{label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      {/* BỘ ĐẾM NGƯỢC */}
      <main id="trai-nghiem" className="mx-auto w-full max-w-[1440px] scroll-mt-20 px-4 py-12 sm:px-8 sm:py-16">
        <ExamCountdown />
      </main>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-white/10 px-5 py-8">
        <div className="mx-auto w-full max-w-5xl">
          <p className="text-sm font-bold">Hướng nghiệp AI</p>
          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-zinc-500">
            Kết quả chỉ mang tính tham khảo, không thay thế tư vấn trực tiếp từ thầy cô.
            Điểm chuẩn đại học thay đổi hằng năm — đối chiếu website chính thức của từng trường
            trước khi đăng ký nguyện vọng.
          </p>
        </div>
      </footer>
    </div>
  );
}
