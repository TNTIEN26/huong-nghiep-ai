import type { ApiResult } from "./types";

// Kết quả tư vấn đã lưu ở máy HS (localStorage) — xem lại, so sánh,
// không mất khi refresh. Chỉ lưu ở trình duyệt, KHÔNG gửi server
// (đúng cam kết ẩn danh của đề tài KHKT).

const KHOA = "hn:ket-qua-da-luu";
const TOI_DA = 5;

export type KetQuaLuu = {
  id: string;
  ngay: string; // ISO
  lop: string;
  result: ApiResult;
};

function laKetQuaLuu(v: unknown): v is KetQuaLuu {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.ngay === "string" &&
    typeof o.lop === "string" &&
    typeof o.result === "object" &&
    o.result !== null &&
    Array.isArray((o.result as ApiResult).nghe_nghiep)
  );
}

/** Lưu 1 kết quả mới nhất lên đầu (giữ tối đa TOI_DA bản). */
export function luuKetQua(result: ApiResult, lop: string): KetQuaLuu[] {
  const moi: KetQuaLuu = {
    id: `kq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ngay: new Date().toISOString(),
    lop,
    result,
  };
  const ds = [moi, ...docKetQuaLuu()].slice(0, TOI_DA);
  try {
    localStorage.setItem(KHOA, JSON.stringify(ds));
  } catch {
    // đầy/không có storage — bỏ qua, app vẫn chạy
  }
  bumpKetQuaLuu();
  return ds;
}

export function docKetQuaLuu(): KetQuaLuu[] {
  try {
    const raw = localStorage.getItem(KHOA);
    if (!raw) return [];
    const arr: unknown = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter(laKetQuaLuu).slice(0, TOI_DA);
  } catch {
    return [];
  }
}

export function xoaKetQua(id: string): KetQuaLuu[] {
  const ds = docKetQuaLuu().filter((k) => k.id !== id);
  try {
    localStorage.setItem(KHOA, JSON.stringify(ds));
  } catch {
    // bỏ qua
  }
  bumpKetQuaLuu();
  return ds;
}

export function ngayDep(iso: string): string {
  try {
    return new Date(iso).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

// Store ngoài React cho useSyncExternalStore: server render rỗng,
// client đọc localStorage sau subscribe. Mọi chỗ ghi (lưu/xóa/focus/
// storage) đều bump để các component cùng refresh.
export const RONG_KET_QUA: KetQuaLuu[] = [];

let version = 0;
let cache: { version: number; ds: KetQuaLuu[] } = { version: -1, ds: RONG_KET_QUA };
const listeners = new Set<() => void>();

export function bumpKetQuaLuu(): void {
  version += 1;
  listeners.forEach((l) => l());
}

export function subscribeKetQuaLuu(cb: () => void): () => void {
  listeners.add(cb);
  if (typeof window === "undefined") {
    return () => {
      listeners.delete(cb);
    };
  }
  const onChange = () => bumpKetQuaLuu();
  window.addEventListener("focus", onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("focus", onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function getSnapshotKetQuaLuu(): KetQuaLuu[] {
  if (cache.version !== version) {
    cache = { version, ds: docKetQuaLuu() };
  }
  return cache.ds;
}
