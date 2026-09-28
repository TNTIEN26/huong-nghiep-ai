"use client";

import { useState } from "react";
import Link from "next/link";

type Tin = { tieuDe: string; moTa: string; href: string; anh: string; chu: string };

const ANH_TS = "https://tuyensinh.moet.gov.vn/ts/Content/images/banner.png";
const ANH_MOET = "https://moet.gov.vn/upload/2007219/20251022/bannerbgd_2b22b.png";
const ANH_HUST = "https://hust.edu.vn/uploads/sys/banners/trangchu1_1.jpg";
const ANH_VNU =
  "https://cdnportal.vnu.edu.vn/data/0/images/2026/06/11/upload_2/banner-tuyensinh-2026-ver2-w.jpg";

const TABS: { ten: string; tins: [Tin, Tin, Tin] }[] = [
  {
    ten: "Thi vào 10",
    tins: [
      {
        tieuDe: "Tra cứu đề án tuyển sinh vào 10",
        moTa: "Tìm trường, chỉ tiêu và phương thức xét tuyển lớp 10 trên cổng chính thức của Bộ.",
        href: "https://tuyensinh.moet.gov.vn/",
        anh: ANH_TS,
        chu: "",
      },
      {
        tieuDe: "Quy chế thi vào 10 mới nhất",
        moTa: "Văn bản, quy định và lịch thi vào 10 cập nhật từ Bộ GD&ĐT.",
        href: "https://moet.gov.vn/",
        anh: ANH_MOET,
        chu: "",
      },
      {
        tieuDe: "Tính điểm xét tuyển vào 10",
        moTa: "Nhập điểm học bạ và điểm thi thử để áng chừng khả năng đỗ.",
        href: "/tinh-diem",
        anh: "",
        chu: "ĐIỂM",
      },
    ],
  },
  {
    ten: "Tốt nghiệp THPT",
    tins: [
      {
        tieuDe: "Lịch thi tốt nghiệp 2027",
        moTa: "Ngày giờ từng môn thi kèm đồng hồ đếm ngược theo giờ thật.",
        href: "#lich-thi",
        anh: "",
        chu: "2027",
      },
      {
        tieuDe: "Cách tính điểm tốt nghiệp",
        moTa: "Trọng số học bạ, điểm liệt, điểm ưu tiên — xem sơ đồ trực quan.",
        href: "/tinh-diem",
        anh: "",
        chu: "ĐXTN",
      },
      {
        tieuDe: "Hệ thống thí sinh",
        moTa: "Đăng ký dự thi, đăng ký nguyện vọng và tra cứu điểm thi chính thức.",
        href: "https://thisinh.thitotnghiepthpt.edu.vn/",
        anh: "",
        chu: "THÍ SINH",
      },
    ],
  },
  {
    ten: "ĐGTD TSA",
    tins: [
      {
        tieuDe: "Tuyển sinh Bách khoa Hà Nội",
        moTa: "Đề án, lịch thi và đăng ký kỳ thi đánh giá tư duy TSA.",
        href: "https://ts.hust.edu.vn/",
        anh: ANH_HUST,
        chu: "",
      },
      {
        tieuDe: "Quy đổi điểm TSA",
        moTa: "Đổi điểm TSA thang 100 sang thang 30 để so với điểm chuẩn.",
        href: "/tinh-diem",
        anh: "",
        chu: "TSA",
      },
      {
        tieuDe: "Cổng tuyển sinh của Bộ",
        moTa: "Đối chiếu quy chế và phương thức xét tuyển chính thức.",
        href: "https://tuyensinh.moet.gov.vn/",
        anh: ANH_TS,
        chu: "",
      },
    ],
  },
  {
    ten: "ĐGNL HN",
    tins: [
      {
        tieuDe: "Kỳ thi HSA ĐHQG Hà Nội",
        moTa: "Lịch thi, địa điểm và cấu trúc bài thi đánh giá năng lực HSA.",
        href: "https://vnu.edu.vn/",
        anh: ANH_VNU,
        chu: "",
      },
      {
        tieuDe: "Quy đổi điểm HSA",
        moTa: "Đổi điểm HSA thang 150 sang thang 30.",
        href: "/tinh-diem",
        anh: "",
        chu: "HSA",
      },
      {
        tieuDe: "Cổng tuyển sinh của Bộ",
        moTa: "Đối chiếu quy chế và phương thức xét tuyển chính thức.",
        href: "https://tuyensinh.moet.gov.vn/",
        anh: ANH_TS,
        chu: "",
      },
    ],
  },
  {
    ten: "ĐGNL HCM",
    tins: [
      {
        tieuDe: "Quy đổi điểm V-ACT",
        moTa: "Đổi điểm V-ACT thang 1200 sang thang 30.",
        href: "/tinh-diem",
        anh: "",
        chu: "V-ACT",
      },
      {
        tieuDe: "Cổng tuyển sinh của Bộ",
        moTa: "Đối chiếu quy chế và phương thức xét tuyển chính thức.",
        href: "https://tuyensinh.moet.gov.vn/",
        anh: ANH_TS,
        chu: "",
      },
      {
        tieuDe: "Tin tức từ Bộ GD&ĐT",
        moTa: "Văn bản và thông báo mới nhất về các kỳ thi.",
        href: "https://moet.gov.vn/",
        anh: ANH_MOET,
        chu: "",
      },
    ],
  },
];

function AnhTin({ tin }: { tin: Tin }) {
  if (tin.anh) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={tin.anh}
        alt={tin.tieuDe}
        loading="lazy"
        referrerPolicy="no-referrer"
        className="h-full w-full object-cover"
      />
    );
  }
  return (
    <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-100 via-amber-50 to-[#faf4e9] px-4 text-center text-3xl font-black tracking-tight text-stone-900/25 sm:text-4xl">
      {tin.chu}
    </span>
  );
}

export default function TinTuc() {
  const [tab, setTab] = useState(0);
  const ngoai = (href: string) => href.startsWith("http");

  return (
    <div>
      <div className="flex flex-wrap justify-center gap-2">
        {TABS.map((t, i) => (
          <button
            key={t.ten}
            type="button"
            onClick={() => setTab(i)}
            aria-pressed={tab === i}
            className={`rounded-full px-5 py-2.5 text-sm font-bold transition ${
              tab === i
                ? "bg-stone-900 text-[#faf4e9]"
                : "border border-stone-900/10 bg-white text-stone-500 hover:border-stone-900/25 hover:text-stone-900"
            }`}
          >
            {t.ten}
          </button>
        ))}
      </div>

      <div key={tab} className="spot-hien mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {TABS[tab].tins.map((tin) => {
          const noiDung = (
            <>
              <span className="block h-44 w-full overflow-hidden bg-orange-100 sm:h-48">
                <AnhTin tin={tin} />
              </span>
              <span className="block p-5">
                <span className="block font-extrabold leading-snug">{tin.tieuDe}</span>
                <span className="mt-2 line-clamp-3 block text-sm leading-relaxed text-stone-500">
                  {tin.moTa}
                </span>
                <span className="mt-3 block text-sm font-bold text-orange-700">Đọc thêm →</span>
              </span>
            </>
          );
          const lop =
            "block overflow-hidden rounded-3xl border border-stone-900/10 bg-white transition hover:border-orange-400/60 hover:shadow-[0_20px_50px_-24px_rgba(234,88,12,0.45)]";
          return ngoai(tin.href) ? (
            <a key={tin.tieuDe} href={tin.href} target="_blank" rel="noreferrer" className={lop}>
              {noiDung}
            </a>
          ) : (
            <Link key={tin.tieuDe} href={tin.href} className={lop}>
              {noiDung}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
