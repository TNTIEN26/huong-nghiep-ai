import { NextResponse } from "next/server";

import { docThongKe } from "@/lib/eval-log";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const key =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ??
    url.searchParams.get("key") ??
    "";
  const secret = (process.env.THONG_KE_KEY ?? "").trim();
  // Fail-closed: không cấu hình key hoặc key sai đều từ chối.
  if (!secret || key !== secret) {
    return NextResponse.json({ error: "Không có quyền truy xuất." }, { status: 403 });
  }

  const thongKe = await docThongKe();
  return NextResponse.json(thongKe, {
    headers: { "Cache-Control": "no-store" },
  });
}
