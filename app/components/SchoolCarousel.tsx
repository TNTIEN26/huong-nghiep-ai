"use client";

import { useEffect, useRef, useState } from "react";

type School = { ten: string; url: string; host: string; anh: string };

// Kho link tuyển sinh + thông tin thi: mỗi lần mở web sẽ xáo ngẫu nhiên lấy 5 ô.
const KHO_LINK: School[] = [
  {
    ten: "Bộ Giáo dục và Đào tạo",
    url: "https://moet.gov.vn/",
    host: "moet.gov.vn",
    anh: "https://moet.gov.vn/upload/2007219/20251022/bannerbgd_2b22b.png",
  },
  {
    ten: "Cổng tuyển sinh Bộ GD&ĐT",
    url: "https://tuyensinh.moet.gov.vn/",
    host: "tuyensinh.moet.gov.vn",
    anh: "https://tuyensinh.moet.gov.vn/ts/Content/images/banner.png",
  },
  {
    ten: "Hệ thống thí sinh THPT",
    url: "https://thisinh.thitotnghiepthpt.edu.vn/",
    host: "thisinh.thitotnghiepthpt.edu.vn",
    anh: "",
  },
  {
    ten: "Nhạc viện TP. Hồ Chí Minh",
    url: "https://hcmcons.vn/",
    host: "hcmcons.vn",
    anh: "https://hcmcons.vn/images/banner.jpg",
  },
  {
    ten: "Đại học Kinh tế Quốc dân",
    url: "https://neu.edu.vn/",
    host: "neu.edu.vn",
    anh: "https://neu.edu.vn/wp-content/uploads/2024/07/NEU1.webp",
  },
  {
    ten: "Đại học Quốc gia Hà Nội",
    url: "https://vnu.edu.vn/",
    host: "vnu.edu.vn",
    anh: "https://cdnportal.vnu.edu.vn/data/0/images/2026/06/11/upload_2/banner-tuyensinh-2026-ver2-w.jpg",
  },
  {
    ten: "Tuyển sinh Bách khoa Hà Nội",
    url: "https://ts.hust.edu.vn/",
    host: "ts.hust.edu.vn",
    anh: "https://hust.edu.vn/uploads/sys/banners/trangchu1_1.jpg",
  },
];

const SO_O_MOI_LAN = 5;

function xaoMang<T>(mang: T[]): T[] {
  const a = [...mang];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function The({ s, an }: { s: School; an?: boolean }) {
  const [loi, setLoi] = useState(false);
  return (
    <a
      href={s.url}
      target="_blank"
      rel="noreferrer"
      data-card
      aria-hidden={an || undefined}
      tabIndex={an ? -1 : undefined}
      className="relative mr-5 w-72 shrink-0 origin-center overflow-hidden rounded-2xl border border-stone-900/10 bg-white text-left transition-all duration-200 last:mr-5 hover:z-10 hover:scale-[1.07] hover:border-orange-400/60 hover:shadow-[0_0_36px_-8px_rgba(234,88,12,0.45)] dark:border-white/10 dark:bg-[#0b1a30] dark:hover:border-orange-400/60 dark:hover:shadow-[0_0_36px_-8px_rgba(234,88,12,0.45)] sm:w-[26rem]"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-orange-100 dark:bg-[#06121f]">
        {loi || !s.anh ? (
          <span className="flex h-full w-full items-center justify-center text-5xl font-black text-orange-300 dark:text-orange-300/50">
            {s.ten.charAt(0)}
          </span>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={s.anh}
            alt={s.ten}
            loading="lazy"
            draggable={false}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
            onError={() => setLoi(true)}
          />
        )}
      </div>
      <div className="px-5 py-4">
        <p className="truncate text-base font-bold text-stone-900 dark:text-slate-100">{s.ten}</p>
        <p className="mt-1 text-[13px] text-stone-500 dark:text-slate-400">{s.host}</p>
      </div>
    </a>
  );
}

const LAN = 5; // nhân 5 bản để điểm nối luôn nằm trong tầm cuộn (kể cả màn 4K)
const BAN_DAU = 2; // bắt đầu từ bản giữa

export default function SchoolCarousel() {
  const ref = useRef<HTMLDivElement>(null);
  const keo = useRef({ dang: false, x: 0, left: 0, dich: 0 });
  const cuoi = useRef({ x: 0, t: 0 });
  const vanToc = useRef(0);
  const raf = useRef(0);
  const hinh = useRef({ low: 0, size: 0 });
  // 5 ô đầu để render phía server, mở web trên trình duyệt sẽ xáo ngẫu nhiên
  const [hien, setHien] = useState<School[]>(() => KHO_LINK.slice(0, SO_O_MOI_LAN));

  // Đo chính xác chiều rộng 1 bản (gồm khoảng cách đều nhau sau mỗi ô)
  function doRong(datLai = false) {
    const el = ref.current;
    if (!el) return;
    const items = el.querySelectorAll<HTMLElement>("[data-card]");
    const n = items.length / LAN;
    if (!Number.isInteger(n) || n === 0 || items.length < n) return;
    const dau = items[0];
    const cuoiSet = items[n - 1];
    const mr = parseFloat(getComputedStyle(cuoiSet).marginRight || "0");
    const size = cuoiSet.offsetLeft + cuoiSet.offsetWidth + mr - dau.offsetLeft;
    hinh.current = { low: dau.offsetLeft + BAN_DAU * size, size };
    if (datLai || el.scrollLeft < dau.offsetLeft + 1) el.scrollLeft = hinh.current.low;
  }

  function quanVong(muon: number) {
    const { low, size } = hinh.current;
    if (size === 0) return muon;
    while (muon >= low + size) muon -= size;
    while (muon < low) muon += size;
    return muon;
  }

  function dungDa() {
    cancelAnimationFrame(raf.current);
    raf.current = 0;
  }

  function chayDa() {
    dungDa();
    const buoc = () => {
      const el = ref.current;
      if (!el || Math.abs(vanToc.current) < 0.05) {
        raf.current = 0;
        return;
      }
      el.scrollLeft = quanVong(el.scrollLeft - vanToc.current * 16);
      vanToc.current *= 0.94;
      raf.current = requestAnimationFrame(buoc);
    };
    raf.current = requestAnimationFrame(buoc);
  }

  function batDau(e: React.PointerEvent) {
    const el = ref.current;
    if (!el) return;
    dungDa();
    vanToc.current = 0;
    keo.current = { dang: true, x: e.clientX, left: el.scrollLeft, dich: 0 };
    cuoi.current = { x: e.clientX, t: performance.now() };
  }

  function keoQua(e: React.PointerEvent) {
    const el = ref.current;
    if (!el || !keo.current.dang) return;
    const dx = e.clientX - keo.current.x;
    keo.current.dich = Math.max(keo.current.dich, Math.abs(dx));
    const bayGio = performance.now();
    const dt = bayGio - cuoi.current.t;
    if (dt > 0) vanToc.current = (e.clientX - cuoi.current.x) / dt;
    cuoi.current = { x: e.clientX, t: bayGio };
    let muon = keo.current.left - dx;
    const truoc = muon;
    muon = quanVong(muon);
    keo.current.left += muon - truoc;
    el.scrollLeft = muon;
  }

  function ketThuc() {
    if (!keo.current.dang) return;
    keo.current.dang = false;
    if (Math.abs(vanToc.current) > 0.25) chayDa();
  }

  useEffect(() => {
    // Xáo ngẫu nhiên mỗi lần mở web
    setHien(xaoMang(KHO_LINK).slice(0, SO_O_MOI_LAN));
  }, []);

  useEffect(() => {
    doRong(true);
    const trenResize = () => doRong();
    window.addEventListener("resize", trenResize);
    return () => {
      window.removeEventListener("resize", trenResize);
      cancelAnimationFrame(raf.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hien]);

  const tatCa = Array.from({ length: LAN }, (_, i) => i).flatMap((i) =>
    hien.map((s) => ({ s, key: `${i}-${s.url}`, an: i !== BAN_DAU })),
  );

  return (
    <div
      ref={ref}
      onPointerDown={batDau}
      onPointerMove={keoQua}
      onPointerUp={ketThuc}
      onPointerLeave={ketThuc}
      onScroll={(e) => {
        if (!keo.current.dang) e.currentTarget.scrollLeft = quanVong(e.currentTarget.scrollLeft);
      }}
      onDragStart={(e) => e.preventDefault()}
      onClickCapture={(e) => {
        if (keo.current.dich > 8) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      className="flex cursor-grab select-none overflow-x-auto px-4 py-6 [scrollbar-width:none] [touch-action:pan-y] active:cursor-grabbing sm:px-8 [&::-webkit-scrollbar]:hidden"
    >
      {tatCa.map(({ s, key, an }) => (
        <The key={key} s={s} an={an} />
      ))}
    </div>
  );
}
