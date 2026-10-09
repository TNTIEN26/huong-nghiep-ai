import ChatBot from "../components/ChatBot";
import KetQuaDaLuu from "../components/KetQuaDaLuu";
import LoTrinh from "../components/LoTrinh";
import MascotOwl from "../components/MascotOwl";
import SiteNav from "../components/SiteNav";

export default function HuongNghiepPage() {
  return (
    <div className="relative z-10 flex min-h-screen flex-col text-stone-900">
      <SiteNav active="huong-nghiep" />
      <LoTrinh hienTai="kham-pha" />

      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-4 py-6 sm:px-8 sm:py-8">
        <div className="mb-5 flex items-center gap-4">
          <MascotOwl className="h-16 w-16 shrink-0 sm:h-20 sm:w-20" />
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              Trợ lý hướng nghiệp AI
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              Kể về bản thân — AI gợi ý ngành, khối thi và lộ trình phù hợp.
            </p>
          </div>
        </div>
        <div className="flex flex-1 flex-col">
          <ChatBot />
        </div>
        <div className="mt-6">
          <KetQuaDaLuu />
        </div>
      </main>
    </div>
  );
}
