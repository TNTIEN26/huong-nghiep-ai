import { NextResponse } from "next/server";

import { generateSurvey } from "@/lib/ai";
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

  // AI tạo phiếu khảo sát; nếu thất bại (quá tải/JSON sai) thì dùng phiếu mặc định.
  const survey = await generateSurvey();
  return NextResponse.json({ survey: survey ?? SURVEY_DEFAULT });
}