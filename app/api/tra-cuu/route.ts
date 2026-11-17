import { NextResponse } from "next/server";

import { deAnTheoSlug, locMuc } from "@/lib/tra-cuu";

export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;

  const slug = sp.get("de_an");
  if (slug) {
    const da = deAnTheoSlug(slug);
    if (!da) return NextResponse.json({ loi: "Không tìm thấy đề án" }, { status: 404 });
    return NextResponse.json(da);
  }

  const so = (v: string | null) => {
    if (v == null || v === "") return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };

  const limit = Math.min(500, Math.max(1, so(sp.get("limit")) ?? 60));

  const muc = locMuc({
    nganh: sp.get("nganh") ?? undefined,
    nganh_id: so(sp.get("nganh_id")),
    truong: sp.get("truong") ?? undefined,
    truong_id: so(sp.get("truong_id")),
    tohop: sp.get("tohop") ?? undefined,
    min: so(sp.get("min")),
    max: so(sp.get("max")),
    q: sp.get("q") ?? undefined,
    limit,
  });

  return NextResponse.json({ tong: muc.length, muc });
}
