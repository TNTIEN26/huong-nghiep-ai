import { NextResponse } from "next/server";

import { SURVEY_DEFAULT } from "@/lib/survey";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });
  }

  const action =
    typeof body === "object" && body !== null
      ? (body as Record<string, unknown>).action
      : null;

  if (action !== "generate") {
    return NextResponse.json(
      { error: "Hành động không hợp lệ. Chỉ hỗ trợ action=\"generate\"." },
      { status: 400 },
    );
  }

  // Trả phiếu mẫu ngay để học sinh điền luôn (<100ms); AI cá nhân hóa sau nếu cần.
  // Giữ generateSurvey cho tương lai nhưng không chặn UX hiện tại.
  return NextResponse.json({ survey: SURVEY_DEFAULT, nguon: "mac-dinh" });
}