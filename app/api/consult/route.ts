import { NextResponse } from "next/server";

import type { FormData } from "@/lib/types";
import { getCareerAdvice } from "@/lib/ai";

export const runtime = "nodejs";

const validClasses = [
  "Lớp 6",
  "Lớp 7",
  "Lớp 8",
  "Lớp 9",
  "Lớp 10",
  "Lớp 11",
  "Lớp 12",
];

function isValidForm(body: unknown): body is FormData {
  if (typeof body !== "object" || body === null) return false;
  const obj = body as Record<string, unknown>;
  return (
    typeof obj.lop === "string" &&
    validClasses.includes(obj.lop) &&
    Array.isArray(obj.mon_manh) &&
    Array.isArray(obj.mon_yeu) &&
    Array.isArray(obj.so_thich) &&
    typeof obj.tinh_cach === "string"
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });
  }

  if (!isValidForm(body)) {
    return NextResponse.json(
      { error: "Vui lòng điền đầy đủ thông tin trước khi gửi." },
      { status: 400 },
    );
  }

  try {
    const result = await getCareerAdvice(body);
    return NextResponse.json(result);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Đã có lỗi xảy ra, vui lòng thử lại.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}