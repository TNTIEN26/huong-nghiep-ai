import ChatBot from "../components/ChatBot";
import KetQuaDaLuu from "../components/KetQuaDaLuu";
import MascotOwl from "../components/MascotOwl";
import SiteNav from "../components/SiteNav";

export default function HuongNghiepPage() {
  return (
    <div className="relative z-10 flex min-h-screen flex-col text-stone-900">
      <SiteNav active="huong-nghiep" />

      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-4 py-5 sm:px-8 sm:py-8">
        <div className="mb-4 flex items-center gap-3 sm:mb-5 sm:gap-4">
          <MascotOwl className="h-12 w-12 shrink-0 sm:h-20 sm:w-20" />
          <div>
            <h1 className="text-xl font-extrabold tracking-tight sm:text-3xl">
              Trợ lý hướng nghiệp AI
            </h1>
            <p className="mt-0.5 text-[13px] leading-relaxed text-stone-500 sm:mt-1 sm:text-sm">
              Kể về bản thân — AI gợi ý ngành, khối thi và lộ trình phù hợp.
            </p>
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col">
          <ChatBot />
        </div>
        <div className="mt-5">
          <KetQuaDaLuu />
        </div>
      </main>
    </div>
  );
}
