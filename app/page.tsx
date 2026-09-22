import ExamCountdown from "./components/ExamCountdown";
import HeroSection from "./components/HeroSection";
import SiteNav from "./components/SiteNav";

export default function Home() {
  return (
    <div className="relative z-10 flex min-h-screen flex-col overflow-x-clip text-stone-900 dark:text-slate-100">
      <SiteNav active="trang-chu" />

      {/* HERO — chiếm 1 màn hình */}
      <header className="relative flex min-h-[calc(100vh-65px)] items-center overflow-hidden border-b border-stone-900/10 dark:border-white/10">
        {/* Vân chấm mờ + quầng nắng nhẹ cho đỡ trơn */}
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
          className="pointer-events-none absolute -top-32 left-1/2 h-64 w-[720px] max-w-full -translate-x-1/2 rounded-full bg-orange-300/30 blur-[100px] dark:bg-orange-500/10"
        />

        <div className="relative mx-auto w-full max-w-5xl px-5 py-16 sm:py-20">
          <HeroSection />
        </div>
      </header>

      {/* BỘ ĐẾM NGƯỢC */}
      <main id="trai-nghiem" className="mx-auto w-full max-w-[1440px] scroll-mt-20 px-4 py-12 sm:px-8 sm:py-16">
        <ExamCountdown />
        {/*
          TẠM ẨN form tư vấn (CareerConsult) khỏi hiển thị theo yêu cầu.
          File + API /api/consult vẫn giữ nguyên cho bạn phụ trách tính năng.
        */}
      </main>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-stone-900/10 bg-white/60 px-5 py-8 dark:border-white/10 dark:bg-[#0b1a30]/60">
        <div className="mx-auto w-full max-w-5xl">
          <p className="text-sm font-bold">Hướng nghiệp AI</p>
          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-stone-500 dark:text-slate-400">
            Kết quả chỉ mang tính tham khảo, không thay thế tư vấn trực tiếp từ thầy cô.
            Điểm chuẩn đại học thay đổi hằng năm — đối chiếu website chính thức của từng trường
            trước khi đăng ký nguyện vọng.
          </p>
        </div>
      </footer>
    </div>
  );
}
