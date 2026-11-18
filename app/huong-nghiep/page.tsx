import ChatBot from "../components/ChatBot";
import KetQuaDaLuu from "../components/KetQuaDaLuu";
import SiteNav from "../components/SiteNav";

export default function HuongNghiepPage() {
  return (
    <div className="relative z-10 flex min-h-dvh flex-col text-stone-900">
      <SiteNav active="huong-nghiep" />

      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-4 py-3 sm:px-8 sm:py-4">
        <ChatBot />
        <div className="mt-6 pb-6">
          <KetQuaDaLuu />
        </div>
      </main>
    </div>
  );
}
