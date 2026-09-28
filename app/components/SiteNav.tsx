import Link from "next/link";

import MascotOwl from "./MascotOwl";

export default function SiteNav({ active }: { active?: "trang-chu" | "tinh-diem" | "huong-nghiep" }) {
  const nutChung = "rounded-lg px-5 py-2.5 text-[15px] transition";
  const nutThuong = `${nutChung} text-stone-500 hover:bg-stone-900/5 hover:text-stone-900`;
  const nutDangXem =
    "bg-stone-900 font-semibold text-[#faf4e9]";
  return (
    <nav className="sticky top-0 z-50 border-b border-stone-900/10 bg-[#faf4e9]/90 backdrop-blur">
      <div className="relative flex w-full items-center gap-3 px-5 py-3.5 sm:px-8">
        <Link href="/" className="flex items-center gap-2 text-[15px] font-black tracking-tight text-stone-900">
          <MascotOwl className="h-9 w-9" />
          CÚ ĐẬU
        </Link>
        <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-1">
          {active === "trang-chu" ? (
            <span className={`${nutChung} ${nutDangXem}`}>Trang chủ</span>
          ) : (
            <Link href="/" className={nutThuong}>
              Trang chủ
            </Link>
          )}
          {active === "tinh-diem" ? (
            <span className={`${nutChung} ${nutDangXem}`}>Tính điểm</span>
          ) : (
            <Link href="/tinh-diem" className={nutThuong}>
              Tính điểm
            </Link>
          )}
          {active === "huong-nghiep" ? (
            <span className={`${nutChung} ${nutDangXem}`}>Hướng Nghiệp</span>
          ) : (
            <Link href="/huong-nghiep" className={nutThuong}>
              Hướng Nghiệp
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
