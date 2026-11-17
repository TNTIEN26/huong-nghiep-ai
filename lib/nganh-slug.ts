import slugData from "@/data/tra-cuu/slug-nganh.json";

function norm(s: string): string {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const MUC = Object.entries(slugData as Record<string, string>).map(([ten, slug]) => ({
  n: norm(ten),
  tu: norm(ten).split(" "),
  slug,
}));

const CHINH_XAC = new Map(MUC.map((m) => [m.n, m.slug]));

export function slugNganh(ten: string): string | null {
  const n = norm(ten);
  const chinhXac = CHINH_XAC.get(n);
  if (chinhXac) return chinhXac;

  const tu = new Set(n.split(" "));
  let tot: { slug: string; diem: number } | null = null;
  for (const m of MUC) {
    const giao = m.tu.filter((t) => tu.has(t)).length;
    const diem = (2 * giao) / (m.tu.length + tu.size);
    if (!tot || diem > tot.diem) tot = { slug: m.slug, diem };
  }
  return tot && tot.diem >= 0.85 ? tot.slug : null;
}
