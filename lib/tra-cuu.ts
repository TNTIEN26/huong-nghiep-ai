import diemChuanData from "@/data/tra-cuu/diem-chuan.json";
import deAnData from "@/data/tra-cuu/de-an.json";
import indexNganhData from "@/data/tra-cuu/index-nganh.json";
import toHopData from "@/data/tra-cuu/to-hop.json";
import truongData from "@/data/tra-cuu/truong.json";

export type MucDiem = {
  truong: string;
  truong_id: number | null;
  nganh: string;
  nganh_id: number | null;
  to_hop: string[];
  diem: { [nam: string]: number | null };
};

export type MucNganhIndex = {
  ten: string;
  id: number | null;
  so_truong: number;
  so_to_hop: number;
  diem_min: number | null;
  diem_max: number | null;
  nam?: number | null;
};

export type MucTruong = {
  ten: string;
  id: number | null;
  thanh_pho: string | null;
  so_nganh: number;
  so_to_hop: number;
  diem_min: number | null;
  diem_max: number | null;
  nam?: number | null;
  de_an: { slug: string; link: string; so_nganh: number | null; phuong_thuc: number } | null;
};

export type MucToHop = {
  ma: string;
  so_truong: number;
  so_nganh: number;
  diem_min: number | null;
  diem_max: number | null;
  nam?: number | null;
};

/** Năm của mức điểm đang dùng để so sánh (2026 nếu có, ngược lại năm gần nhất). */
export function namCuaDiem(m: MucDiem): number | null {
  for (const y of ["2026", "2025", "2024", "2023"]) {
    if (m.diem[y] != null) return Number(y);
  }
  return null;
}

export type MucDeAn = {
  ten: string;
  truong_id: number | null;
  thanh_pho: string | null;
  so_nganh: number | null;
  slug: string;
  link: string;
  noi_dung: string;
};

const MUC = diemChuanData as MucDiem[];
const DE_AN = deAnData as MucDeAn[];

export const DANH_SACH_NGANH = indexNganhData as MucNganhIndex[];
export const DANH_SACH_TRUONG = truongData as MucTruong[];
export const DANH_SACH_TO_HOP = toHopData as MucToHop[];

export function boDau(s: string): string {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export type LocMucParams = {
  nganh?: string;
  nganh_id?: number;
  truong?: string;
  truong_id?: number;
  tohop?: string;
  min?: number;
  max?: number;
  q?: string;
  limit?: number;
};

export function locMuc(p: LocMucParams): MucDiem[] {
  const k = p.nganh ? boDau(p.nganh) : "";
  const kq: MucDiem[] = [];

  for (const m of MUC) {
    if (p.nganh_id != null && m.nganh_id !== p.nganh_id) continue;
    if (k) {
      const n = boDau(m.nganh);
      if (!(n === k || n.includes(k) || k.includes(n))) continue;
    }
    if (p.truong_id != null && m.truong_id !== p.truong_id) continue;
    if (p.truong && !boDau(m.truong).includes(boDau(p.truong))) continue;
    if (p.tohop && !m.to_hop.includes(p.tohop.toUpperCase())) continue;
    const d = m.diem["2026"] ?? m.diem["2025"];
    if (p.min != null && (d == null || d < p.min)) continue;
    if (p.max != null && (d == null || d > p.max)) continue;
    if (p.q) {
      const noi = boDau(`${m.nganh} ${m.truong} ${m.to_hop.join(" ")}`);
      if (!noi.includes(boDau(p.q))) continue;
    }
    kq.push(m);
  }

  kq.sort((a, b) => {
    const da = a.diem["2026"] ?? a.diem["2025"] ?? -1;
    const db = b.diem["2026"] ?? b.diem["2025"] ?? -1;
    if (db !== da) return db - da;
    return a.truong.localeCompare(b.truong, "vi");
  });

  return kq.slice(0, p.limit ?? 60);
}

export function mucTheoNganh(tenNganh: string, gioiHan = 8): MucDiem[] {
  const k = boDau(tenNganh);
  if (k.length < 4) return [];
  const kq = MUC.filter((m) => {
    const n = boDau(m.nganh);
    return n === k || n.includes(k) || (n.length >= 4 && k.includes(n));
  });
  kq.sort((a, b) => {
    const da = a.diem["2026"] ?? a.diem["2025"] ?? -1;
    const db = b.diem["2026"] ?? b.diem["2025"] ?? -1;
    if (db !== da) return db - da;
    return a.truong.localeCompare(b.truong, "vi");
  });
  const daCo = new Set<string>();
  const ra: MucDiem[] = [];
  for (const m of kq) {
    const khoa = boDau(m.truong);
    if (daCo.has(khoa)) continue;
    daCo.add(khoa);
    ra.push(m);
    if (ra.length >= gioiHan) break;
  }
  return ra;
}

export function deAnTheoSlug(slug: string): MucDeAn | null {
  return DE_AN.find((d) => d.slug === slug) ?? null;
}

export type DongTuVan = {
  nganh: string;
  truong: string;
  to_hop: string[];
  diem2026: number | null;
  diem2025: number | null;
  diem2024: number | null;
};

export function timTheoCauHoi(cauHoi: string, gioiHan = 6): DongTuVan[] {
  const q = boDau(cauHoi);
  if (q.length < 5) return [];

  const diemNganh = new Map<string, number>();
  for (const n of DANH_SACH_NGANH) {
    const ten = boDau(n.ten);
    if (ten.length < 4) continue;
    if (q.includes(ten)) {
      diemNganh.set(n.ten, ten.length);
      continue;
    }
    const tu = ten.split(" ").filter((t) => t.length >= 4);
    if (tu.length < 2) continue;
    let hit = 0;
    for (const t of tu) if (q.includes(t)) hit++;
    if (hit >= 2) diemNganh.set(n.ten, hit * 3 + ten.length / 10);
  }

  const top = [...diemNganh.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([ten]) => ten);

  return duLieuChoTuVan(top, Math.max(2, Math.floor(gioiHan / Math.max(1, top.length))));
}

export function duLieuChoTuVan(tenNganh: string[], moiNganh = 4): DongTuVan[] {  const ra: DongTuVan[] = [];
  const daCo = new Set<string>();
  for (const ten of tenNganh) {
    for (const m of mucTheoNganh(ten, moiNganh)) {
      const khoa = `${boDau(m.nganh)}|${boDau(m.truong)}`;
      if (daCo.has(khoa)) continue;
      daCo.add(khoa);
      ra.push({
        nganh: m.nganh,
        truong: m.truong,
        to_hop: m.to_hop.slice(0, 8),
        diem2026: m.diem["2026"] ?? null,
        diem2025: m.diem["2025"] ?? null,
        diem2024: m.diem["2024"] ?? null,
      });
    }
  }
  return ra;
}
