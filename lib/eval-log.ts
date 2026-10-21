import fs from "fs";
import path from "path";

import type { ApiResult } from "./types";
import { khoiThiList, truongDhList } from "./data";

// ---------------------------------------------------------------------------
// LOG ĐÁNH GIÁ ẨN DANH cho đề tài KHKT.
//
// - KHÔNG lưu tên, lớp cụ thể của cá nhân, hay bất kỳ thông tin định danh nào.
//   "phien_ma" là chuỗi ngẫu nhiên do trình duyệt tự sinh (localStorage),
//   chỉ dùng để nối lượt tư vấn với phiếu Likert, không truy ngược được HS.
// - Dữ liệu ghi nối tiếp (append-only) vào data/.danh-gia/*.jsonl.
//   Thư mục này đã cho vào .gitignore để không commit dữ liệu HS lên GitHub.
// - Mọi hàm ghi log đều nuốt lỗi: logging không bao giờ làm hỏng tư vấn.
// ---------------------------------------------------------------------------

const LOG_DIR = path.join(process.cwd(), "data", ".danh-gia");
const CONSULT_FILE = path.join(LOG_DIR, "consult.jsonl");
const DANH_GIA_FILE = path.join(LOG_DIR, "danh-gia.jsonl");

const LOP_HOP_LE = [
  "Lớp 6",
  "Lớp 7",
  "Lớp 8",
  "Lớp 9",
  "Lớp 10",
  "Lớp 11",
  "Lớp 12",
];

export type KiemTraGrounding = {
  so_khoi_goi_y: number;
  so_khoi_hop_le: number;
  so_truong_goi_y: number;
  so_truong_khop_data: number;
};

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const khoiHopLe = new Set(khoiThiList.map((k) => k.code.trim()));
const tenTruongChuan = truongDhList.map((t) => norm(t.ten));

function truongKhopData(ten: string): boolean {
  const target = norm(ten);
  if (!target) return false;
  if (tenTruongChuan.includes(target)) return true;
  return tenTruongChuan.some((n) => target.includes(n) || n.includes(target));
}

/** Kiểm tra kết quả AI có nằm trong dữ liệu local không (chống bịa). */
export function kiemTraGrounding(result: ApiResult): KiemTraGrounding {
  const khoi = result.khoi_thi_de_nghi ?? [];
  const tenTruongs = (result.nghe_nghiep ?? []).flatMap((n) => n.truong_tieu_bieu ?? []);
  return {
    so_khoi_goi_y: khoi.length,
    so_khoi_hop_le: khoi.filter((k) => khoiHopLe.has(String(k).trim())).length,
    so_truong_goi_y: tenTruongs.length,
    so_truong_khop_data: tenTruongs.filter(truongKhopData).length,
  };
}

export type LogConsultInput = {
  phien_ma: string;
  lop: string;
  kenh: "stream" | "json";
  thanh_cong: boolean;
  ms: number;
  loi?: string;
  grounding?: KiemTraGrounding;
};

export type LogDanhGiaInput = {
  phien_ma: string;
  hieu_ban_than: number;
  tu_tin_chon_khoi: number;
  ro_buoc_tiep: number;
  ghi_chu?: string;
};

export function chuanHoaPhienMa(value: unknown): string {
  if (typeof value === "string" && /^[A-Za-z0-9-]{8,64}$/.test(value)) return value;
  return "an-danh";
}

export function chuanHoaLop(value: unknown): string {
  return typeof value === "string" && LOP_HOP_LE.includes(value) ? value : "khong-ro";
}

function ghiDong(file: string, obj: Record<string, unknown>): void {
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    fs.appendFileSync(file, JSON.stringify(obj) + "\n", "utf-8");
  } catch {
    // logging không bao giờ được làm hỏng luồng chính
  }
}

export function ghiLogConsult(input: LogConsultInput): void {
  ghiDong(CONSULT_FILE, {
    v: 1,
    loai: "consult",
    thoi_gian: new Date().toISOString(),
    phien_ma: chuanHoaPhienMa(input.phien_ma),
    lop: chuanHoaLop(input.lop),
    kenh: input.kenh,
    thanh_cong: input.thanh_cong,
    ms: Math.max(0, Math.round(input.ms)),
    ...(input.loi ? { loi: input.loi.slice(0, 200) } : {}),
    ...(input.grounding ? { grounding: input.grounding } : {}),
  });
}

export function ghiLogDanhGia(input: LogDanhGiaInput): void {
  ghiDong(DANH_GIA_FILE, {
    v: 1,
    loai: "danh-gia",
    thoi_gian: new Date().toISOString(),
    phien_ma: chuanHoaPhienMa(input.phien_ma),
    hieu_ban_than: input.hieu_ban_than,
    tu_tin_chon_khoi: input.tu_tin_chon_khoi,
    ro_buoc_tiep: input.ro_buoc_tiep,
    ...(input.ghi_chu ? { ghi_chu: input.ghi_chu.slice(0, 300) } : {}),
  });
}

function docDong(file: string): Record<string, unknown>[] {
  try {
    if (!fs.existsSync(file)) return [];
    return fs
      .readFileSync(file, "utf-8")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line) as Record<string, unknown>;
        } catch {
          return null;
        }
      })
      .filter((o): o is Record<string, unknown> => o !== null);
  } catch {
    return [];
  }
}

function trungBinh(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100;
}

/** Thống kê tổng hợp (chỉ số, không dòng thô) cho báo cáo KHKT. */
export function docThongKe() {
  const consults = docDong(CONSULT_FILE);
  const danhGias = docDong(DANH_GIA_FILE);

  const thanhCong = consults.filter((c) => c.thanh_cong === true);
  const msList = thanhCong
    .map((c) => c.ms)
    .filter((m): m is number => typeof m === "number");

  let khoiGoiY = 0;
  let khoiHopLe = 0;
  let truongGoiY = 0;
  let truongKhop = 0;
  for (const c of thanhCong) {
    const g = c.grounding as KiemTraGrounding | undefined;
    if (!g) continue;
    khoiGoiY += g.so_khoi_goi_y ?? 0;
    khoiHopLe += g.so_khoi_hop_le ?? 0;
    truongGoiY += g.so_truong_goi_y ?? 0;
    truongKhop += g.so_truong_khop_data ?? 0;
  }

  const diem = (key: string) =>
    danhGias.map((d) => d[key]).filter((n): n is number => typeof n === "number");

  return {
    cap_nhat: new Date().toISOString(),
    luot_tu_van: consults.length,
    tu_van_thanh_cong: thanhCong.length,
    thoi_gian_trung_binh_ms: trungBinh(msList),
    khoi_thi: {
      goi_y: khoiGoiY,
      hop_le: khoiHopLe,
      ty_le: khoiGoiY > 0 ? Math.round((khoiHopLe / khoiGoiY) * 1000) / 10 : 0,
    },
    truong: {
      goi_y: truongGoiY,
      khop_data: truongKhop,
      ty_le: truongGoiY > 0 ? Math.round((truongKhop / truongGoiY) * 1000) / 10 : 0,
    },
    danh_gia: {
      so_phieu: danhGias.length,
      hieu_ban_than_tb: trungBinh(diem("hieu_ban_than")),
      tu_tin_chon_khoi_tb: trungBinh(diem("tu_tin_chon_khoi")),
      ro_buoc_tiep_tb: trungBinh(diem("ro_buoc_tiep")),
    },
  };
}
