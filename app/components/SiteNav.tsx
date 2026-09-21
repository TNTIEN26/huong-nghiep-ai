import Link from "next/link";

import ThemeToggle from "./ThemeToggle";

export default function SiteNav({ active }: { active?: "tinh-diem" }) {
  const nutChung = "rounded-lg px-5 py-2.5 text-[15px] transition";
  return (
    <nav className="sticky top-0 z-50 border-b border-stone-900/10 bg-[#faf4e9]/90 backdrop-blur dark:border-white/10 dark:bg-[#060f1e]/90">
      <div className="relative flex w-full items-center gap-3 px-5 py-3.5 sm:px-8">
        <Link href="/" className="text-[15px] font-bold tracking-tight text-stone-900 dark:text-slate-100">
          Hướng nghiệp AI
          <span className="ml-2 rounded border border-stone-900/15 px-1.5 py-0.5 align-middle text-[11px] font-semibold text-stone-500 dark:border-white/15 dark:text-slate-400">
            Beta
          </span>
        </Link>
        <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-1">
          {/* TODO(pages): trang Thông tin / Lịch thi sẽ được thêm sau */}
          <button
            type="button"
            title="Sắp ra mắt"
            className={`${nutChung} text-stone-500 hover:bg-stone-900/5 hover:text-stone-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-100`}
          >
            Thông tin
          </button>
          {active === "tinh-diem" ? (
            <span className={`${nutChung} bg-stone-900 font-semibold text-[#faf4e9] dark:bg-gradient-to-r dark:from-[#3cdf5f] dark:to-[#00a0dd] dark:text-[#06121f]`}>
              Tính điểm
            </span>
          ) : (
            <Link
              href="/tinh-diem"
              className={`${nutChung} text-stone-500 hover:bg-stone-900/5 hover:text-stone-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-100`}
            >
              Tính điểm
            </Link>
          )}
          <button
            type="button"
            title="Sắp ra mắt"
            className={`${nutChung} text-stone-500 hover:bg-stone-900/5 hover:text-stone-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-100`}
          >
            Lịch thi
          </button>
        </div>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
