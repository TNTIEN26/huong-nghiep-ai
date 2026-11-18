import toHopMonData from "@/data/tra-cuu/to-hop-mon.json";

export type MucToHopMon = {
  ma: string;
  mon: string[];
  tom_tat: string;
  link: string;
};

export const DANH_SACH_TO_HOP_MON = toHopMonData as MucToHopMon[];
export const TO_HOP_MON = new Map(DANH_SACH_TO_HOP_MON.map((x) => [x.ma, x]));

function norm(s: string): string {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function khopMot(s: string, k: string): boolean {
  return s === k || s.startsWith(k + " ") || s.endsWith(" " + k) || s.includes(" " + k + " ");
}

export type NhomMon = { ten: string; bieuTuong: string; tu: string[] };

export const NHOM_MON: NhomMon[] = [
  { ten: "Toán", bieuTuong: "📐", tu: ["toan"] },
  { ten: "Ngữ văn", bieuTuong: "📖", tu: ["ngu van", "van"] },
  { ten: "Vật lí", bieuTuong: "⚡", tu: ["vat ly", "vat li", "ly"] },
  { ten: "Hóa học", bieuTuong: "🧪", tu: ["hoa hoc", "hoa"] },
  { ten: "Tiếng Anh", bieuTuong: "🌐", tu: ["tieng anh", "anh"] },
  { ten: "Tiếng Pháp", bieuTuong: "🌐", tu: ["tieng phap"] },
  { ten: "Tiếng Nga", bieuTuong: "🌐", tu: ["tieng nga"] },
  { ten: "Tiếng Nhật", bieuTuong: "🌐", tu: ["tieng nhat"] },
  { ten: "Tiếng Trung", bieuTuong: "🌐", tu: ["tieng trung"] },
  { ten: "Tiếng Hàn", bieuTuong: "🌐", tu: ["tieng han"] },
  { ten: "Sinh học", bieuTuong: "🧬", tu: ["sinh hoc", "sinh"] },
  { ten: "Lịch sử", bieuTuong: "🏛️", tu: ["lich su", "su"] },
  { ten: "Địa lí", bieuTuong: "🗺️", tu: ["dia ly", "dia li", "dia"] },
  { ten: "Tin học", bieuTuong: "💻", tu: ["tin hoc", "tin"] },
  { ten: "Vẽ", bieuTuong: "🎨", tu: ["ve", "hinh hoa", "trang tri", "my thuat"] },
  { ten: "Năng khiếu", bieuTuong: "🎯", tu: ["nang khieu", "nk", "hat", "mua", "am nhac", "nhac cu", "xuong am", "doc", "bieu dien", "chuyen mon", "hoa thanh", "chi huy", "pho tho"] },
  { ten: "Nhạc lí", bieuTuong: "🎵", tu: ["nhac ly"] },
  { ten: "GDKTPL", bieuTuong: "🌾", tu: ["gdktpl", "gdkt", "giao duc kinh te"] },
  { ten: "Công nghệ nông nghiệp", bieuTuong: "🚜", tu: ["cong nghe nong nghiep"] },
  { ten: "Công nghệ công nghiệp", bieuTuong: "🏭", tu: ["cong nghe cong nghiep"] },
];

const NHOM_THEO_MON = new Map<string, Set<string>>();
for (const n of NHOM_MON) NHOM_THEO_MON.set(n.ten, new Set(n.tu));

export function nhomMonCua(ma: string): string[] {
  const x = TO_HOP_MON.get(ma);
  if (!x) return [];
  const s = x.mon.map(norm);
  const ra: string[] = [];
  for (const n of NHOM_MON) {
    const tu = NHOM_THEO_MON.get(n.ten)!;
    if (s.some((v) => [...tu].some((k) => khopMot(v, k)))) ra.push(n.ten);
  }
  return ra;
}

export function monTheoNhom(ma: string): string[] {
  return TO_HOP_MON.get(ma)?.mon ?? [];
}
