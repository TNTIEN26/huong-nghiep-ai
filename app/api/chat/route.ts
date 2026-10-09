import { NextResponse } from "next/server";

import { chatReply, streamChatReply } from "@/lib/ai";
import type { ChatMessage } from "@/lib/ai";
import { kiemTraGioiHan } from "@/lib/rate-limit";

export const runtime = "nodejs";

const MAX_MESSAGES = 30;
const MAX_CONTENT_LEN = 2000;
const MAX_CONTEXT_LEN = 500;

const encoder = new TextEncoder();

function isValidRole(value: unknown): value is ChatMessage["role"] {
  return value === "user" || value === "assistant";
}

function isValidChatRequest(body: unknown): body is {
  messages: ChatMessage[];
  context?: string;
  stream?: boolean;
} {
  if (typeof body !== "object" || body === null) return false;
  const obj = body as Record<string, unknown>;
  if (!Array.isArray(obj.messages) || obj.messages.length === 0) return false;
  if (obj.messages.length > MAX_MESSAGES) return false;
  if (obj.stream !== undefined && typeof obj.stream !== "boolean") return false;
  const messagesOk = obj.messages.every(
    (m) =>
      typeof m === "object" &&
      m !== null &&
      isValidRole((m as ChatMessage).role) &&
      typeof (m as ChatMessage).content === "string" &&
      (m as ChatMessage).content.trim().length > 0 &&
      (m as ChatMessage).content.length <= MAX_CONTENT_LEN,
  );
  if (!messagesOk) return false;
  const { context } = obj;
  if (context === undefined) return true;
  // Empty context is fine (student profile may not be filled yet)
  return typeof context === "string" && context.length <= MAX_CONTEXT_LEN;
}

export async function POST(request: Request) {
  const biChan = kiemTraGioiHan(request, "chat");
  if (biChan) {
    return NextResponse.json({ error: biChan }, { status: 429 });
  }

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

  const messages = body.messages;
  const context = body.context?.trim() ?? "";
  const { stream } = body;

  // ---------- STREAMING (SSE): trả lời token by token ----------
  if (stream === true) {
    const readStream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let closed = false;
        const send = (payload: unknown) => {
          if (closed) return;
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
          } catch {
            closed = true;
          }
        };

        try {
          await streamChatReply(messages, context, (ev) => {
            switch (ev.type) {
              case "delta":
                send({ d: ev.delta });
                break;
              case "done":
                send({ done: true });
                break;
              case "error":
                send({ e: ev.error });
                break;
            }
          });
        } catch (err) {
          send({
            e: err instanceof Error ? err.message : "Đã có lỗi xảy ra, vui lòng thử lại.",
          });
        } finally {
          try {
            controller.close();
          } catch {
            // client already closed — ignore
          }
        }
      },
    });

    return new Response(readStream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  }

  // ---------- NON-STREAMING (JSON) ----------
  try {
    const reply = await chatReply(messages, context);
    return NextResponse.json({ reply });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Đã có lỗi xảy ra, vui lòng thử lại.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}