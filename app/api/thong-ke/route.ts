import { NextResponse } from "next/server";

import { docThongKe } from "@/lib/eval-log";

export const runtime = "nodejs";

// Chỉ trả số tổng hợp cho báo cáo KHKT — không trả dòng thô,
// không lộ mã phiên, không có thông tin định danh.
//
// Khóa bằng key dùng chung: ?key=... trùng THONG_KE_KEY trong .env.local.
// Không có key đúng → 403 (fail closed, kể cả khi quên cấu hình).
export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get("key") ?? "";
  const expected = (process.env.THONG_KE_KEY ?? "").trim();
  if (!expected || key !== expected) {
    return NextResponse.json(
      { error: "Khu vực nội bộ của nhóm nghiên cứu." },
      { status: 403 },
    );
  }
  return NextResponse.json(docThongKe());
}
