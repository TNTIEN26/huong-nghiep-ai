import fs from "fs";
import path from "path";

import { Redis } from "@upstash/redis";

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

const EVAL_STORE = (process.env.EVAL_STORE ?? "file").trim().toLowerCase();
const redisUrl = (process.env.UPSTASH_REDIS_REST_URL ?? "").trim();
const redisToken = (process.env.UPSTASH_REDIS_REST_TOKEN ?? "").trim();
const redis =
  EVAL_STORE === "redis" && redisUrl && redisToken
    ? new Redis({ url: redisUrl, token: redisToken })
    : null;
if (EVAL_STORE === "redis" && !redis) {
  console.warn(
    "[eval-log] EVAL_STORE=redis nhưng thiếu UPSTASH_REDIS_REST_URL/TOKEN — dùng lưu file.",
  );
}

const CONSULT_KEY = "hn:danh-gia:consult";
const DANH_GIA_KEY = "hn:danh-gia:danh-gia";

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
  che_do?: "grounded" | "baseline";
  prompt_version?: string;
  loai_loi?: string;
  model?: string;
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

/** Phân loại lỗi consult thành taxonomy cố định để thống kê trong báo cáo. */
export function phanLoaiLoi(loi?: string): string {
  if (!loi) return "khac";
  const s = loi.toLowerCase();
  if (/không đúng định dạng|json|unexpected token/.test(s)) return "json_parse";
  if (/thiếu thông tin|schema/.test(s)) return "schema";
  if (/từ chối key|api key|unauthorized|authentication/.test(s)) return "auth";
  if (/timeout|quá chậm|abort/.test(s)) return "timeout";
  if (/quá tải|http 429|http 5\d\d|http 4\d\d/.test(s)) return "transport";
  return "khac";
}

async function ghiDong(
  key: string,
  file: string,
  obj: Record<string, unknown>,
): Promise<void> {
  try {
    if (redis) {
      await redis.rpush(key, JSON.stringify(obj));
      return;
    }
    fs.mkdirSync(LOG_DIR, { recursive: true });
    fs.appendFileSync(file, JSON.stringify(obj) + "\n", "utf-8");
  } catch {
    // logging không bao giờ được làm hỏng luồng chính
  }
}

export async function ghiLogConsult(input: LogConsultInput): Promise<void> {
  await ghiDong(CONSULT_KEY, CONSULT_FILE, {
    v: 2,
    loai: "consult",
    thoi_gian: new Date().toISOString(),
    phien_ma: chuanHoaPhienMa(input.phien_ma),
    lop: chuanHoaLop(input.lop),
    kenh: input.kenh,
    thanh_cong: input.thanh_cong,
    ms: Math.max(0, Math.round(input.ms)),
    che_do: input.che_do ?? "khong-ro",
    ...(input.prompt_version ? { prompt_version: input.prompt_version } : {}),
    ...(input.model ? { model: input.model } : {}),
    ...(input.loi ? { loi: input.loi.slice(0, 200) } : {}),
    ...(input.loi ? { loai_loi: input.loai_loi ?? phanLoaiLoi(input.loi) } : {}),
    ...(input.grounding ? { grounding: input.grounding } : {}),
  });
}

export async function ghiLogDanhGia(input: LogDanhGiaInput): Promise<void> {
  await ghiDong(DANH_GIA_KEY, DANH_GIA_FILE, {
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

async function docDong(key: string, file: string): Promise<Record<string, unknown>[]> {
  try {
    if (redis) {
      const dong = (await redis.lrange(key, 0, -1)) as unknown;
      if (!Array.isArray(dong)) return [];
      return dong
        .map((line) => {
          try {
            return typeof line === "string" ? (JSON.parse(line) as Record<string, unknown>) : null;
          } catch {
            return null;
          }
        })
        .filter((o): o is Record<string, unknown> => o !== null);
    }
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

function doLechChuan(nums: number[]): number {
  if (nums.length < 2) return 0;
  const tb = nums.reduce((a, b) => a + b, 0) / nums.length;
  const phuongSai = nums.reduce((a, b) => a + (b - tb) ** 2, 0) / (nums.length - 1);
  return Math.round(Math.sqrt(phuongSai) * 100) / 100;
}

/** Percentile nội suy tuyến tính; p trong (0, 100]. */
function phanVi(nums: number[], p: number): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  if (sorted.length === 1) return sorted[0];
  const viTri = (p / 100) * (sorted.length - 1);
  const duoi = Math.floor(viTri);
  const tren = Math.ceil(viTri);
  const phan = viTri - duoi;
  return Math.round((sorted[duoi] + (sorted[tren] - sorted[duoi]) * phan) * 100) / 100;
}

function tyLe(tu: number, mau: number): number {
  return mau > 0 ? Math.round((tu / mau) * 1000) / 10 : 0;
}

type DongLog = Record<string, unknown>;

/** Tổng hợp một nhánh đo (grounded / baseline / khong-ro). */
function tongHopNhanh(list: DongLog[]) {
  const thanhCong = list.filter((c) => c.thanh_cong === true);
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

  return {
    luot: list.length,
    thanh_cong: thanhCong.length,
    ty_le_thanh_cong: tyLe(thanhCong.length, list.length),
    ms_tb: trungBinh(msList),
    ms_p50: phanVi(msList, 50),
    ms_p95: phanVi(msList, 95),
    ms_do_lech_chuan: doLechChuan(msList),
    khoi_thi: {
      goi_y: khoiGoiY,
      hop_le: khoiHopLe,
      ty_le: tyLe(khoiHopLe, khoiGoiY),
    },
    truong: {
      goi_y: truongGoiY,
      khop_data: truongKhop,
      ty_le: tyLe(truongKhop, truongGoiY),
    },
  };
}

/** Thống kê tổng hợp (chỉ số, không dòng thô) cho báo cáo KHKT. */
export async function docThongKe() {
  const consults = await docDong(CONSULT_KEY, CONSULT_FILE);
  const danhGias = await docDong(DANH_GIA_KEY, DANH_GIA_FILE);

  const tong = tongHopNhanh(consults);

  const nhomTheoCheDo: Record<string, DongLog[]> = {};
  for (const c of consults) {
    const cheDo = typeof c.che_do === "string" ? c.che_do : "khong-ro";
    (nhomTheoCheDo[cheDo] ??= []).push(c);
  }
  const theoCheDo: Record<string, ReturnType<typeof tongHopNhanh>> = {};
  for (const [cheDo, list] of Object.entries(nhomTheoCheDo)) {
    theoCheDo[cheDo] = tongHopNhanh(list);
  }

  const demLoi: Record<string, number> = {};
  for (const c of consults) {
    if (c.thanh_cong === true) continue;
    const loai = typeof c.loai_loi === "string" ? c.loai_loi : phanLoaiLoi(
      typeof c.loi === "string" ? c.loi : undefined,
    );
    demLoi[loai] = (demLoi[loai] ?? 0) + 1;
  }

  const diem = (key: string) =>
    danhGias.map((d) => d[key]).filter((n): n is number => typeof n === "number");

  return {
    cap_nhat: new Date().toISOString(),
    luot_tu_van: consults.length,
    tu_van_thanh_cong: tong.thanh_cong,
    thoi_gian_trung_binh_ms: tong.ms_tb,
    thoi_gian_p50_ms: tong.ms_p50,
    thoi_gian_p95_ms: tong.ms_p95,
    thoi_gian_do_lech_chuan_ms: tong.ms_do_lech_chuan,
    khoi_thi: tong.khoi_thi,
    truong: tong.truong,
    theo_che_do: theoCheDo,
    loi: {
      tong: consults.length - tong.thanh_cong,
      theo_loai: demLoi,
    },
    danh_gia: {
      so_phieu: danhGias.length,
      hieu_ban_than_tb: trungBinh(diem("hieu_ban_than")),
      tu_tin_chon_khoi_tb: trungBinh(diem("tu_tin_chon_khoi")),
      ro_buoc_tiep_tb: trungBinh(diem("ro_buoc_tiep")),
    },
  };
}
