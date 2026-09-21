import CareerConsult from "./components/CareerConsult";
import ExamCountdown from "./components/ExamCountdown";
import HeroSection from "./components/HeroSection";
import SiteNav from "./components/SiteNav";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-zinc-950 text-zinc-100">
      <SiteNav />

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

        {/* AI career consult: form + result */}
        <section aria-label="Tư vấn định hướng nghẹ" className="mt-16 sm:mt-24">
          <CareerConsult />
        </section>
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
