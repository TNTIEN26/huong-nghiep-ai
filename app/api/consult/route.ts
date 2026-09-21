import { NextResponse } from "next/server";

import type { FormData, ApiResult } from "@/lib/types";
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

const encoder = new TextEncoder();

// Rotating progress messages so the student can see the AI is working
// (a full consult usually takes 20–90 seconds).
const STATUS_MESSAGES = [
  "Đọc dữ li ngành nghề…",
  "Nối môn học, sở thích với ngành…",
  "Trò chuyện với model AI…",
  "Viết phân tích…",
  "Đang phân tinh, vui lòng chờ…",
] as const;

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

function sseResponse(readStream: ReadableStream<Uint8Array>): Response {
  return new Response(readStream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
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

  const form = body as FormData;
  const stream = (body as { stream?: unknown }).stream === true;

  // ---------- STREAMING (SSE): live status + final result ----------
  if (stream) {
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

        // Run the AI consult in the background; meanwhile emit heartbeats.
        let finalResult: ApiResult | null = null;
        let finalError: unknown = null;
        const settled = new Promise<void>((resolve) => {
          void (async () => {
            try {
              finalResult = await getCareerAdvice(form);
            } catch (err) {
              finalError = err;
            } finally {
              resolve();
            }
          })();
        });

        const pipe = (ms: number) =>
          new Promise<void>((resolve) => setTimeout(resolve, ms));

        let ticks = 0;
        while (true) {
          const finished = await Promise.race([
            settled.then(() => true),
            pipe(3000).then(() => false),
          ]);
          if (finished) break;
          send({ s: STATUS_MESSAGES[Math.min(ticks, STATUS_MESSAGES.length - 1)] });
          ticks += 1;
        }

        if (finalError !== null) {
          send({
            e: finalError instanceof Error ? finalError.message : "Đã có lỗi xảy ra, vui lòng thử lại.",
          });
        } else if (finalResult) {
          send({ r: finalResult });
        } else {
          send({ e: "Đã có lỗi xảy ra, vui lòng thử lại." });
        }

        try {
          controller.close();
        } catch {
          // client already closed — ignore
        }
      },
    });

    return sseResponse(readStream);
  }

  // ---------- NON-STREAMING (JSON) ----------
  try {
    const result = await getCareerAdvice(form);
    return NextResponse.json(result);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Đã có lỗi xảy ra, vui lòng thử lại.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}