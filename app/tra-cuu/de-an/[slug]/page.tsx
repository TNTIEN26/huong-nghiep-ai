import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import SiteNav from "../../../components/SiteNav";
import NoiDungDeAn from "../../../components/NoiDungDeAn";
import deAnData from "@/data/tra-cuu/de-an.json";
import { locMuc } from "@/lib/tra-cuu";

type DeAn = {
  ten: string;
  truong_id: number | null;
  thanh_pho: string | null;
  so_nganh: number | null;
  slug: string;
  link: string;
  noi_dung: string;
};

const TAT_CA = deAnData as DeAn[];
const THEO_SLUG = new Map(TAT_CA.map((d) => [d.slug, d]));

const THU_MUC_HTML = path.join(process.cwd(), "content", "de-an-html");

function docHtml(slug: string): string {
  try {
    const gz = fs.readFileSync(path.join(THU_MUC_HTML, `${slug}.html.gz`));
    return zlib.gunzipSync(gz).toString("utf8");
  } catch {
    return "";
  }
}

function soDiem(v: number | null): string {
  return v == null ? "—" : v.toFixed(2).replace(/\.00$/, "").replace(".", ",");
}

export function generateStaticParams() {
  return TAT_CA.map((d) => ({ slug: d.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const d = THEO_SLUG.get(slug);
  if (!d) return { title: "Không tìm thấy đề án" };
  return {
    title: `Đề án tuyển sinh ${d.ten}`,
    description: d.noi_dung.slice(0, 180),
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const d = THEO_SLUG.get(slug);
  if (!d) notFound();

  const html = docHtml(slug);
  const diem = d.truong_id != null ? locMuc({ truong_id: d.truong_id, limit: 10 }) : [];

  return (
    <div className="relative z-10 flex min-h-screen flex-col text-stone-900">
      <SiteNav active="tra-cuu" />

      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-10 sm:px-8">
        <nav className="flex items-center gap-1.5 text-xs font-semibold text-stone-400">
          <Link href="/tra-cuu/de-an" className="hover:text-blue-700">
            Tra cứu đề án
          </Link>
          <span>/</span>
          <span className="text-stone-600">{d.ten}</span>
        </nav>

        <h1 className="mt-2 text-2xl font-extrabold leading-snug tracking-tight sm:text-3xl">
          Đề án tuyển sinh — {d.ten}
        </h1>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold">
          {d.thanh_pho && (
            <span className="rounded-md border border-stone-900/10 bg-stone-900/[0.04] px-2.5 py-1 text-stone-600">
              {d.thanh_pho}
            </span>
          )}
          {d.so_nganh != null && (
            <span className="rounded-md border border-stone-900/10 bg-stone-900/[0.04] px-2.5 py-1 text-stone-600">
              {d.so_nganh} ngành đào tạo
            </span>
          )}
          <a
            href={d.link}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-blue-600/25 px-2.5 py-1 text-blue-700 transition hover:bg-blue-600 hover:text-white"
          >
            Đề án gốc ↗
          </a>
        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
          <article className="min-w-0 rounded-2xl border border-stone-900/10 bg-white p-4 sm:p-7">
            {html ? (
              <NoiDungDeAn html={html} />
            ) : (
              <p className="text-sm leading-relaxed text-stone-500">
                Chưa tải được nội dung đề án.{" "}
                <a href={d.link} target="_blank" rel="noopener noreferrer" className="font-bold text-blue-700 underline">
                  Xem bản gốc trên HOCMAI ↗
                </a>
              </p>
            )}
          </article>

          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            {diem.length > 0 && (
              <div className="rounded-2xl border border-stone-900/10 bg-white p-5">
                <h2 className="text-sm font-extrabold uppercase tracking-wide text-stone-500">
                  Điểm chuẩn 2025 cao nhất
                </h2>
                <ul className="mt-3 space-y-2.5">
                  {diem.map((m) => (
                    <li key={`${m.nganh}-${m.to_hop.join()}`} className="text-sm leading-snug">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-semibold text-stone-800">{m.nganh}</span>
                        <span className="shrink-0 font-extrabold text-emerald-700">{soDiem(m.diem["2025"])}</span>
                      </div>
                      {m.to_hop.length > 0 && (
                        <p className="mt-0.5 text-xs text-stone-400">{m.to_hop.slice(0, 5).join(", ")}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="rounded-2xl border border-stone-900/10 bg-[#F4F8FE] p-5 text-xs leading-relaxed text-stone-500">
              Nội dung đề án được tổng hợp tự động từ HOCMAI (huongnghiep.hocmai.vn) để tiện tra cứu. Hãy đối chiếu
              đề án chính thức của trường trước khi đăng ký xét tuyển.
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
