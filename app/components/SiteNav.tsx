"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import MascotOwl from "./MascotOwl";

type MucNav = "trang-chu" | "tinh-diem" | "huong-nghiep" | "tra-cuu" | "trac-nghiem";

const Icon = ({ children }: { children: ReactNode }) => (
  <svg
    aria-hidden
    viewBox="0 0 24 24"
    className="h-5 w-5 shrink-0 md:hidden"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);

const ICON_NHA = <path d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10" />;
const ICON_CHAT = <path d="M4 5h16v11H9l-5 4V5z" />;
const ICON_TINH = (
  <>
    <rect x="5" y="3" width="14" height="18" rx="2" />
    <path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01" />
  </>
);
const ICON_TIM = (
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-4-4" />
  </>
);
const ICON_TINH_CACH = (
  <path d="M12 3l2.4 5.6L20 11l-5.6 2.4L12 19l-2.4-5.6L4 11l5.6-2.4z" />
);

const CAC_MUC: { id: Exclude<MucNav, "tra-cuu">; ten: string; href: string; icon: ReactNode }[] = [
  { id: "trang-chu", ten: "Trang chủ", href: "/", icon: ICON_NHA },
  { id: "huong-nghiep", ten: "Hướng nghiệp", href: "/huong-nghiep", icon: ICON_CHAT },
  { id: "trac-nghiem", ten: "Tính cách", href: "/trac-nghiem-tinh-cach", icon: ICON_TINH_CACH },
  { id: "tinh-diem", ten: "Tính điểm", href: "/tinh-diem", icon: ICON_TINH },
];

const TRA_CUU: { ten: string; href: string; moTa: string }[] = [
  { ten: "Tra cứu ngành học", href: "/tra-cuu/nganh", moTa: "833 ngành · trường, điểm chuẩn, tổ hợp" },
  { ten: "Tra cứu đề án tuyển sinh", href: "/tra-cuu/de-an", moTa: "280 trường · đề án, điểm chuẩn" },
  { ten: "Tra cứu tổ hợp môn", href: "/tra-cuu/to-hop", moTa: "298 tổ hợp · mã khối, môn thi" },
];

export default function SiteNav({ active }: { active?: MucNav }) {
  const [moTraCuu, setMoTraCuu] = useState(false);
  const [an, setAn] = useState(false); // điện thoại: ẩn hàng mục khi cuộn xuống
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function ngoai(e: MouseEvent | TouchEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setMoTraCuu(false);
    }
    function esc(e: KeyboardEvent) {
      if (e.key === "Escape") setMoTraCuu(false);
    }
    document.addEventListener("mousedown", ngoai);
    document.addEventListener("touchstart", ngoai);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", ngoai);
      document.removeEventListener("touchstart", ngoai);
      document.removeEventListener("keydown", esc);
    };
  }, []);

  // Điện thoại: cuộn xuống thì ẩn hàng mục (logo vẫn hiện), cuộn lên một chút thì hiện lại.
  // Nghe cả cuộn của trang lẫn cuộn bên trong các khung (vd: khung chat) bằng capture.
  useEffect(() => {
    const lastY = new WeakMap<object, number>();
    let dangAn = false;
    let khoaDen = 0; // bỏ qua scroll do chính việc co/giãn header gây ra
    document.documentElement.style.overflowAnchor = "none";
    function datAn(v: boolean) {
      if (v === dangAn) return;
      dangAn = v;
      khoaDen = performance.now() + 400;
      setAn(v);
      if (v) setMoTraCuu(false);
      document.documentElement.dataset.navAn = v ? "true" : "false";
    }
    function onScroll(e: Event) {
      if (!window.matchMedia("(max-width: 767px)").matches) {
        datAn(false);
        return;
      }
      if (performance.now() < khoaDen) return;
      const t = e.target;
      const el = t instanceof Element ? t : null;
      const key: object = el ?? document;
      const y = el ? el.scrollTop : Math.max(window.scrollY, 0);
      const truoc = lastY.get(key) ?? 0;
      const dy = y - truoc;
      if (dy === 0) return; // cuộn ngang hoặc không đổi: bỏ qua
      if (y < 24) {
        datAn(false);
        lastY.set(key, y);
      } else if (dy > 12) {
        datAn(true);
        lastY.set(key, y);
      } else if (dy < -8) {
        datAn(false);
        lastY.set(key, y);
      } else if (Math.abs(dy) > 12) {
        lastY.set(key, y);
      }
    }
    document.addEventListener("scroll", onScroll, { passive: true, capture: true });
    return () => {
      document.removeEventListener("scroll", onScroll, { capture: true });
      delete document.documentElement.dataset.navAn;
      document.documentElement.style.overflowAnchor = "";
    };
  }, []);

  // Điện thoại: icon trên, chữ dưới (kiểu tab bar). Máy tính: chỉ chữ, nút rộng.
  const mucChung =
    "flex flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-center text-[11px] leading-tight transition md:flex-row md:gap-1.5 md:whitespace-nowrap md:rounded-lg md:px-5 md:py-2.5 md:text-[15px]";
  const mucThuong = `${mucChung} font-medium text-stone-500 hover:bg-stone-900/5 hover:text-stone-900`;
  const mucDangXem = `${mucChung} bg-blue-600 font-semibold text-[#F4F8FE]`;

  return (
    <nav
      ref={navRef}
      className="sticky top-0 z-50 border-b border-stone-900/10 bg-[#F4F8FE]/90 backdrop-blur"
    >
      {/* Máy tính: logo trái, các mục căn giữa trong phần còn lại bên phải logo */}
      <div className={`mx-auto flex w-full max-w-[1440px] flex-col px-3 transition-[padding] duration-300 sm:px-8 md:flex-row md:items-center md:gap-0 md:py-3 ${
          an ? "gap-0 py-2" : "gap-2 pb-2 pt-2.5"
        }`}>
        <Link
          href="/"
          onClick={() => setMoTraCuu(false)}
          className="flex shrink-0 items-center justify-center gap-2 self-center font-display text-[15px] font-black tracking-tight text-stone-900 md:self-auto"
        >
          <MascotOwl className="h-8 w-8 md:h-9 md:w-9" bay={false} />
          <span>CÚ ĐẬU</span>
        </Link>

        <div
          className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out md:flex md:flex-1 md:grid-rows-none md:opacity-100 ${
            an ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
          }`}
        >
        <div
          className={`grid min-h-0 grid-cols-5 gap-2 md:flex md:flex-1 md:items-center md:justify-center md:gap-1 md:overflow-visible ${
            an ? "overflow-hidden" : "overflow-visible"
          }`}
        >
          {CAC_MUC.map((m) =>
            active === m.id ? (
              <span key={m.id} aria-current="page" className={mucDangXem}>
                <Icon>{m.icon}</Icon>
                {m.ten}
              </span>
            ) : (
              <Link key={m.id} href={m.href} className={mucThuong}>
                <Icon>{m.icon}</Icon>
                {m.ten}
              </Link>
            ),
          )}

          <div
            className="md:relative"
            onPointerEnter={(e) => e.pointerType === "mouse" && setMoTraCuu(true)}
            onPointerLeave={(e) => e.pointerType === "mouse" && setMoTraCuu(false)}
          >
            <button
              type="button"
              onClick={() => setMoTraCuu((v) => !v)}
              aria-expanded={moTraCuu}
              aria-haspopup="true"
              className={`${
                active === "tra-cuu"
                  ? mucDangXem
                  : moTraCuu
                    ? `${mucChung} bg-blue-50 font-medium text-blue-700`
                    : mucThuong
              } w-full`}
            >
              <Icon>{ICON_TIM}</Icon>
              <span className="flex items-center gap-1">
                Tra cứu
                <svg
                  aria-hidden
                  viewBox="0 0 12 12"
                  className={`h-2.5 w-2.5 shrink-0 transition ${moTraCuu ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 4l4 4 4-4" />
                </svg>
              </span>
            </button>

            {moTraCuu && (
              <div className="absolute inset-x-3 top-full z-50 pt-1 md:inset-x-auto md:left-1/2 md:w-72 md:-translate-x-1/2 md:pt-2">
                <div className="overflow-hidden rounded-2xl border border-stone-900/10 bg-white p-1.5 shadow-[0_24px_60px_-24px_rgba(37,99,235,0.35)]">
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
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </nav>
  );
}
