import { NextResponse } from "next/server";

import { chuanHoaPhienMa, ghiLogDanhGia } from "@/lib/eval-log";

export const runtime = "nodejs";

// Phiếu Likert ẩn danh sau tư vấn. KHÔNG nhận tên/lớp/trường —
// chỉ mã phiên ngẫu nhiên + 3 điểm 1–5 + ghi chú tự do (tối đa 300 ký tự).
function laDiemHopLe(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= 5;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });
  }
  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });
  }
  const obj = body as Record<string, unknown>;
  if (
    !laDiemHopLe(obj.hieu_ban_than) ||
    !laDiemHopLe(obj.tu_tin_chon_khoi) ||
    !laDiemHopLe(obj.ro_buoc_tiep)
  ) {
    return NextResponse.json(
      { error: "Vui lòng chấm đủ 3 câu hỏi (mỗi câu 1–5 điểm)." },
      { status: 400 },
    );
  }

  // Bóc thẻ HTML khỏi ghi chú tự do trước khi lưu (chống XSS khi
  // số liệu được render lại ở trang thống kê/báo cáo sau này).
  const ghi_chu =
    typeof obj.ghi_chu === "string" && obj.ghi_chu.trim() !== ""
      ? obj.ghi_chu
          .trim()
          .replace(/<[^>]*>/g, "")
          .replace(/\s+/g, " ")
          .slice(0, 300)
      : undefined;

  ghiLogDanhGia({
    phien_ma: chuanHoaPhienMa(obj.phien_ma),
    hieu_ban_than: obj.hieu_ban_than,
    tu_tin_chon_khoi: obj.tu_tin_chon_khoi,
    ro_buoc_tiep: obj.ro_buoc_tiep,
    ...(ghi_chu ? { ghi_chu } : {}),
  });
  return NextResponse.json({ ok: true });
}
