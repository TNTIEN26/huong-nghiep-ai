import Link from "next/link";

export default function SiteNav({ active }: { active?: "tinh-diem" }) {
  const nutChung = "rounded-lg px-5 py-2.5 text-[15px] transition";
  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-zinc-950/90 backdrop-blur">
      <div className="relative flex w-full items-center gap-3 px-5 py-3.5 sm:px-8">
        <Link href="/" className="text-[15px] font-bold tracking-tight">
          Hướng nghiệp AI
          <span className="ml-2 rounded border border-white/15 px-1.5 py-0.5 align-middle text-[11px] font-semibold text-zinc-400">
            Beta
          </span>
        </Link>
        <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-1">
          {/* TODO(pages): trang Thông tin / Lịch thi sẽ được thêm sau */}
          <button
            type="button"
            title="Sắp ra mắt"
            className={`${nutChung} text-zinc-400 hover:bg-white/5 hover:text-zinc-100`}
          >
            Thông tin
          </button>
          {active === "tinh-diem" ? (
            <span className={`${nutChung} bg-white/10 font-semibold text-zinc-100`}>
              Tính điểm
            </span>
          ) : (
            <Link
              href="/tinh-diem"
              className={`${nutChung} text-zinc-400 hover:bg-white/5 hover:text-zinc-100`}
            >
              Tính điểm
            </Link>
          )}
          <button
            type="button"
            title="Sắp ra mắt"
            className={`${nutChung} text-zinc-400 hover:bg-white/5 hover:text-zinc-100`}
          >
            Lịch thi
          </button>
        </div>
      </div>
    </nav>
  );
}
