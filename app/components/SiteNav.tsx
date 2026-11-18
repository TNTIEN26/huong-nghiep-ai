"use client";

import Link from "next/link";
import { useState } from "react";

import MascotOwl from "./MascotOwl";

type MucNav = "trang-chu" | "tinh-diem" | "huong-nghiep" | "tra-cuu";

const CAC_MUC: { id: Exclude<MucNav, "tra-cuu">; ten: string; href: string }[] = [
  { id: "trang-chu", ten: "Trang chủ", href: "/" },
  { id: "huong-nghiep", ten: "Hướng Nghiệp", href: "/huong-nghiep" },
  { id: "tinh-diem", ten: "Tính điểm", href: "/tinh-diem" },
];

const TRA_CUU: { ten: string; href: string; moTa: string }[] = [
  { ten: "Tra cứu ngành học", href: "/tra-cuu/nganh", moTa: "833 ngành · trường, điểm chuẩn, tổ hợp" },
  { ten: "Tra cứu đề án tuyển sinh", href: "/tra-cuu/de-an", moTa: "280 trường · đề án, điểm chuẩn" },
  { ten: "Tra cứu tổ hợp môn", href: "/tra-cuu/to-hop", moTa: "148 tổ hợp · mã khối, môn thi" },
];

export default function SiteNav({ active }: { active?: MucNav }) {
  const [moTraCuu, setMoTraCuu] = useState(false);

  const nutChung = "whitespace-nowrap rounded-lg px-2 py-2 text-[12px] transition sm:px-5 sm:py-2.5 sm:text-[15px]";
  const nutThuong = `${nutChung} text-stone-500 hover:bg-stone-900/5 hover:text-stone-900`;
  const nutDangXem = "bg-blue-600 font-semibold text-[#F4F8FE]";

  return (
    <nav className="sticky top-0 z-50 border-b border-stone-900/10 bg-[#F4F8FE]/90 backdrop-blur">
      <div className="relative flex w-full items-center gap-2 px-3 py-3 sm:gap-3 sm:px-8 sm:py-3.5">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-display text-[15px] font-black tracking-tight text-stone-900">
          <MascotOwl className="h-8 w-8 sm:h-9 sm:w-9" bay={false} />
          <span className="hidden sm:inline">CÚ ĐẬU</span>
        </Link>

        <div className="ml-auto flex min-w-0 items-center gap-0.5 overflow-x-auto sm:absolute sm:left-1/2 sm:ml-0 sm:gap-1 sm:overflow-visible sm:-translate-x-1/2">
          {CAC_MUC.map((m) =>
            active === m.id ? (
              <span key={m.id} className={`${nutChung} ${nutDangXem}`}>
                {m.ten}
              </span>
            ) : (
              <Link key={m.id} href={m.href} className={nutThuong}>
                {m.ten}
              </Link>
            )
          )}

          {/* Nút thứ 4: Tra Cứu — di chuột vào xổ ra danh sách */}
          <div
            className="relative"
            onMouseEnter={() => setMoTraCuu(true)}
            onMouseLeave={() => setMoTraCuu(false)}
          >
            <button
              type="button"
              onClick={() => setMoTraCuu((v) => !v)}
              aria-expanded={moTraCuu}
              aria-haspopup="true"
              className={`${nutChung} flex items-center gap-1 ${
                active === "tra-cuu"
                  ? nutDangXem
                  : moTraCuu
                    ? "bg-blue-50 text-blue-700"
                    : nutThuong
              }`}
            >
              Tra Cứu
              <span aria-hidden className={`text-[10px] transition ${moTraCuu ? "rotate-180" : ""}`}>
                ▼
              </span>
            </button>

            {moTraCuu && (
              <div className="absolute right-0 top-full mt-1 w-64 overflow-hidden rounded-2xl border border-stone-900/10 bg-white p-1.5 shadow-[0_24px_60px_-24px_rgba(37,99,235,0.35)] sm:left-0 sm:right-auto">
                {TRA_CUU.map((m) => (
                  <Link
                    key={m.href}
                    href={m.href}
                    onClick={() => setMoTraCuu(false)}
                    className="block rounded-xl px-3.5 py-2.5 transition hover:bg-blue-50"
                  >
                    <span className="block text-sm font-bold text-stone-800">{m.ten}</span>
                    <span className="mt-0.5 block text-xs text-stone-500">{m.moTa}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
