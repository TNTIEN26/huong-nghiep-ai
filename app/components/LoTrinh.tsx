"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";

export type BuocTienTrinh = "kham-pha" | "thu-suc" | "ve-dich";

const KHOA = "hn:tien-trinh";

type TrangThai = Record<BuocTienTrinh, boolean>;

const MAC_DINH: TrangThai = { "kham-pha": false, "thu-suc": false, "ve-dich": false };

// Đánh dấu 1 bước đã xong (lưu ở máy HS, không gửi server).
export function danhDauTienTrinh(buoc: BuocTienTrinh): void {
  try {
    const raw = localStorage.getItem(KHOA);
    const obj = raw ? (JSON.parse(raw) as Partial<TrangThai>) : {};
    obj[buoc] = true;
    localStorage.setItem(KHOA, JSON.stringify(obj));
    bump();
  } catch {
    // storage không có — bỏ qua
  }
}

function docTrangThai(): TrangThai {
  const tt: TrangThai = { ...MAC_DINH };
  try {
    const raw = localStorage.getItem(KHOA);
    if (raw) {
      const obj = JSON.parse(raw) as Partial<TrangThai>;
      for (const k of Object.keys(tt) as BuocTienTrinh[]) {
        if (obj[k] === true) tt[k] = true;
      }
    }
    // Tự nhận biết bước khám phá: đã chat hoặc đã có kết quả tư vấn lưu lại.
    if (!tt["kham-pha"]) {
      const lichSu = localStorage.getItem("hn:chat-history");
      const ketQua = localStorage.getItem("hn:ket-qua-da-luu");
      if ((lichSu && JSON.parse(lichSu).length > 0) || ketQua) {
        tt["kham-pha"] = true;
      }
    }
  } catch {
    // storage không có — giữ mặc định
  }
  return tt;
}

// Store ngoài React: server render MAC_DINH (tránh hydration mismatch),
// client đọc localStorage sau khi subscribe. Bump mỗi khi tab focus,
// storage đổi, hoặc danhDauTienTrinh được gọi.
let version = 0;
let cache: { version: number; state: TrangThai } = { version: -1, state: MAC_DINH };
const listeners = new Set<() => void>();

function bump(): void {
  version += 1;
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  const onFocus = () => bump();
  window.addEventListener("focus", onFocus);
  window.addEventListener("storage", onFocus);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("focus", onFocus);
    window.removeEventListener("storage", onFocus);
  };
}

function getSnapshot(): TrangThai {
  if (cache.version !== version) {
    cache = { version, state: docTrangThai() };
  }
  return cache.state;
}

const BUOCS: { id: BuocTienTrinh; so: string; ten: string; href: string }[] = [
  { id: "kham-pha", so: "1", ten: "Khám phá", href: "/huong-nghiep" },
  { id: "thu-suc", so: "2", ten: "Thử sức · tính điểm", href: "/tinh-diem" },
  { id: "ve-dich", so: "3", ten: "Về đích · chốt trường", href: "/tinh-diem#chon-truong" },
];

// Thanh hành trình 3 bước đặt đầu mỗi trang công cụ.
export default function LoTrinh({ hienTai }: { hienTai?: BuocTienTrinh }) {
  const trangThai = useSyncExternalStore(subscribe, getSnapshot, () => MAC_DINH);

  return (
    <nav aria-label="Hành trình của em" className="mx-auto w-full max-w-[1440px] px-4 pt-5 sm:px-8">
      <ol className="flex items-center gap-1.5 rounded-2xl border border-stone-900/10 bg-white/80 px-3 py-2.5 backdrop-blur sm:gap-2 sm:px-4">
        {BUOCS.map((b, i) => {
          const xong = trangThai[b.id];
          const dangO = hienTai === b.id;
          return (
            <li key={b.id} className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
              {i > 0 && (
                <span aria-hidden className="h-px min-w-2 flex-1 bg-stone-900/10 sm:min-w-4" />
              )}
              <Link
                href={b.href}
                aria-current={dangO ? "step" : undefined}
                className={`flex min-w-0 items-center gap-2 rounded-xl px-2 py-1.5 text-left transition sm:px-3 ${
                  dangO ? "bg-orange-50 ring-1 ring-orange-500/40" : "hover:bg-stone-900/5"
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black ${
                    xong ? "bg-emerald-600 text-white" : "bg-stone-900/10 text-stone-500"
                  }`}
                >
                  {xong ? "✓" : b.so}
                </span>
                <span className="truncate text-xs font-bold text-stone-700 sm:text-[13px]">
                  {b.ten}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
