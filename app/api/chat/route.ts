import { NextResponse } from "next/server";

import { chatReply } from "@/lib/ai";
import type { ChatMessage } from "@/lib/ai";

export const runtime = "nodejs";

const MAX_MESSAGES = 30;

function isValidChatRequest(body: unknown): body is { messages: ChatMessage[] } {
  if (typeof body !== "object" || body === null) return false;
  const obj = body as Record<string, unknown>;
  if (!Array.isArray(obj.messages) || obj.messages.length === 0) return false;
  if (obj.messages.length > MAX_MESSAGES) return false;
  return obj.messages.every(
    (m) =>
      typeof m === "object" &&
      m !== null &&
      (m as ChatMessage).role === "user" &&
      typeof (m as ChatMessage).content === "string" &&
      (m as ChatMessage).content.trim().length > 0 &&
      (m as ChatMessage).content.length <= 2000,
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });
  }

  if (!isValidChatRequest(body)) {
    return NextResponse.json(
      { error: "Tin nhắn không hợp lệ hoặc quá dài." },
      { status: 400 },
    );
  }

  try {
    const reply = await chatReply(body.messages);
    return NextResponse.json({ reply });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Đã có lỗi xảy ra, vui lòng thử lại.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}