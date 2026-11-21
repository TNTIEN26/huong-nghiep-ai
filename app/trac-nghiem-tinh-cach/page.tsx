import type { Metadata } from "next";

import MbtiTest from "../components/MbtiTest";
import SiteNav from "../components/SiteNav";

export const metadata: Metadata = {
  title: "Trắc nghiệm tính cách 16 nhóm | Cú Đậu",
  description:
    "Làm trắc nghiệm tính cách ngắn để khám phá 16 nhóm tính cách, điểm mạnh và ngành nghề phù hợp với học sinh cấp 2, cấp 3.",
};

export default async function TracNghiemTinhCachPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string | string[] }>;
}) {
  const sp = await searchParams;
  const type = typeof sp.type === "string" ? sp.type : undefined;

  return (
    <div className="relative z-10 flex min-h-screen flex-col text-stone-900">
      <SiteNav active="trac-nghiem" />

      <main className="mx-auto w-full max-w-[1100px] flex-1 px-4 py-8 sm:px-8 sm:py-12">
        <MbtiTest initialType={type} />
      </main>
    </div>
  );
}
