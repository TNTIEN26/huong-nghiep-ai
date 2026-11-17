import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import SiteNav from "../../../components/SiteNav";
import ChiTietNganh, { type PhuongThuc } from "../../../components/ChiTietNganh";
import chiTietData from "@/data/tra-cuu/chi-tiet-nganh.json";

type BanGhi = {
  slug: string;
  ten: string;
  tom_tat: string;
  tabs: { ma: string; ten: string; so: number }[];
  phuong_thuc: PhuongThuc[];
};

const TAT_CA = chiTietData as BanGhi[];
const THEO_SLUG = new Map(TAT_CA.map((d) => [d.slug, d]));

export function generateStaticParams() {
  return TAT_CA.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const d = THEO_SLUG.get(slug);
  if (!d) return { title: "Không tìm thấy ngành" };
  return {
    title: `Ngành ${d.ten}: trường đào tạo, tổ hợp và điểm chuẩn`,
    description: d.tom_tat.slice(0, 180),
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const d = THEO_SLUG.get(slug);
  if (!d) notFound();

  return (
    <div className="relative z-10 flex min-h-screen flex-col text-stone-900">
      <SiteNav active="tra-cuu" />

      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-10 sm:px-8">
        <nav className="flex items-center gap-1.5 text-xs font-semibold text-stone-400">
          <Link href="/tra-cuu/nganh" className="hover:text-blue-700">
            Tra cứu ngành
          </Link>
          <span>/</span>
          <span className="text-stone-600">{d.ten}</span>
        </nav>

        <h1 className="mt-2 text-2xl font-extrabold leading-snug tracking-tight sm:text-3xl">
          Các trường đào tạo và khối xét tuyển ngành {d.ten}
        </h1>

        <div className="mt-7">
          <ChiTietNganh tomTat={d.tom_tat} phuongThuc={d.phuong_thuc} />
        </div>

        <p className="mt-8 text-xs leading-relaxed text-stone-400">
          Nguồn: tổng hợp đề án tuyển sinh và điểm chuẩn từ HOCMAI (huongnghiep.hocmai.vn), cập nhật theo từng
          trường. Số liệu mang tính tham khảo — hãy đối chiếu đề án chính thức của trường trước khi đăng ký.
        </p>
      </main>
    </div>
  );
}
