import { GoogleGenAI } from "@google/genai";

import type { FormData, ApiResult, Survey } from "./types";
import {
  buildSystemPrompt,
  buildUserPrompt,
  buildGroundingContext,
  buildFormatInstruction,
  buildChatSystemPrompt,
  buildSurveyPrompt,
  findByLop,
} from "./prompt";
import { parseSurvey } from "./survey";
import { khoiThiList, nganhNgheList, truongDhList } from "./data";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const provider = (process.env.AI_PROVIDER ?? "openrouter").trim().toLowerCase();

const geminiApiKey = process.env.GEMINI_API_KEY ?? "";
const geminiModel = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
const geminiClient = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

const openRouterApiKey = process.env.OPENROUTER_API_KEY ?? "";

const DEFAULT_FREE_MODELS = [
  "dots-studio/dots-3-note-preview:free",
  "qwen/qwen3.8-27b:free",
  "google/gemma-4-26b-a4b-it:free",
  "poolside/laguna-xs-2.1:free",
  "liquid/lfm-2.5-2.6b:free",
];

const openRouterModels = (process.env.OPENROUTER_MODEL ?? DEFAULT_FREE_MODELS.join(","))
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);

const GEMINI_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    gioi_thieu: {
      type: "string",
      description: "Đoạn mở đầu giới thiệu ngắn gọn về học sinh và kết luận chung.",
    },
    nghe_nghiep: {
      type: "array",
      description: "Tối đa 3 nghề phù hợp nhất, xếp theo độ phù hợp giảm dần.",
      items: {
        type: "object",
        properties: {
          ten: { type: "string", description: "Tên ngành nghề gợi ý." },
          do_phu_hop: { type: "integer", description: "Phần trăm phù hợp từ 1 đến 100." },
          ly_do: { type: "string", description: "Lý do phù hợp, nối từ thông tin học sinh cung cấp." },
          khoi_thi: {
            type: "array",
            description: "Các khối/tổ hợp nên theo đuổi, lấy từ danh sách khối trong dữ liệu.",
            items: { type: "string" },
          },
          mon_trong_tam: {
            type: "array",
            description: "Các môn học cần ưu tiên ở trường để hướng tới ngành này.",
            items: { type: "string" },
          },
          lo_trinh: { type: "string", description: "Lộ trình học tập cụ thể theo độ tuổi của học sinh." },
          truong_tieu_bieu: {
            type: "array",
            description: "Tên các trường đại học tiêu biểu, chỉ lấy từ danh sách trong dữ liệu.",
            items: { type: "string" },
          },
          muc_luong_tk: {
            type: "string",
            description: "Reference salary band (tham khào only), short, e.g. \"≈ 25–60 mln/tháng\".",
          },
          rui_ro: {
            type: "string",
            description: "Automation/AI-replacement risk and market outlook for this career (tham khào only).",
          },
        },
        required: ["ten", "do_phu_hop", "ly_do", "khoi_thi", "mon_trong_tam", "lo_trinh", "truong_tieu_bieu"],
      },
    },
    khoi_thi_de_nghi: {
      type: "array",
      description: "Danh sách mã khối thi nên xét tuyển cho giai đoạn sắp tới.",
      items: { type: "string" },
    },
    loi_khuyen: {
      type: "string",
      description: "Lời khuyên tổng quát ngắn gọn, khích lệ học sinh.",
    },
    luu_y: {
      type: "string",
      description: "Lưu ý quan trọng: điểm chuẩn thay đổi hằng năm, kết quả phụ thuộc nỗ lực, không phải lời hứa đỗ.",
    },
    canh_bao: {
      type: "array",
      description: "2-4 career-choice traps relevant for THIS student (following the trend, family pressure, flashy name, score-chasing without interest).",
      items: { type: "string" },
    },
    xu_truong: {
      type: "array",
      description: "3-5 labor-market facts: where demand grows, automation/AI risk, reference salary level (approx only).",
      items: { type: "string" },
    },
  },
  required: ["gioi_thieu", "nghe_nghiep", "khoi_thi_de_nghi", "loi_khuyen", "luu_y"],
};

function isApiResult(value: unknown): value is ApiResult {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.gioi_thieu === "string" &&
    Array.isArray(obj.nghe_nghiep) &&
    Array.isArray(obj.khoi_thi_de_nghi) &&
    typeof obj.loi_khuyen === "string" &&
    typeof obj.luu_y === "string"
  );
}

function parseResult(text: string): ApiResult {
  let parsed: unknown;
  try {
    const cleaned = text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("AI trả về nội dung không đúng định dạng. Hãy thử lại.");
  }
  if (!isApiResult(parsed)) {
    throw new Error("Kết quả AI thiếu thông tin cần thiết. Hãy thử lại.");
  }
  return normalizeApiResult(parsed);
}

// Fill optional fields with safe defaults so the UI and types are bulletproof.
function normalizeApiResult(result: ApiResult): ApiResult {
  const khoiHopLe = new Set(khoiThiList.map((k) => k.code));
  result.canh_bao = Array.isArray(result.canh_bao)
    ? result.canh_bao.filter((s): s is string => typeof s === "string" && s.trim() !== "")
    : [];
  result.xu_truong = Array.isArray(result.xu_truong)
    ? result.xu_truong.filter((s): s is string => typeof s === "string" && s.trim() !== "")
    : [];
  result.nghe_nghiep = result.nghe_nghiep.slice(0, 3).map((n) => ({
    ...n,
    do_phu_hop: Math.min(100, Math.max(1, Math.round(Number(n.do_phu_hop) || 50))),
    khoi_thi: Array.isArray(n.khoi_thi)
      ? n.khoi_thi.filter((c): c is string => typeof c === "string" && khoiHopLe.has(c))
      : [],
    muc_luong_tk: typeof n.muc_luong_tk === "string" ? n.muc_luong_tk : "",
    rui_ro: typeof n.rui_ro === "string" ? n.rui_ro : "",
  }));
  result.khoi_thi_de_nghi = Array.isArray(result.khoi_thi_de_nghi)
    ? result.khoi_thi_de_nghi.filter((c): c is string => typeof c === "string" && khoiHopLe.has(c))
    : [];
  return result;
}

async function callGemini(userMessage: string, systemPrompt: string): Promise<ApiResult> {
  if (!geminiClient) {
    throw new Error("Thiếu GEMINI_API_KEY. Thêm vào .env.local (xem .env.local.example).");
  }
  const response = await geminiClient.models.generateContent({
    model: geminiModel,
    contents: userMessage,
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: "application/json",
      responseSchema: GEMINI_RESPONSE_SCHEMA,
      temperature: 0.5,
    },
  });
  return parseResult(response.text ?? "");
}

const SPECIALIZED_MODEL = /vl|sante|fin|content-safety|code|note-preview|omni|inkling|nemotron|gemma-4-31b/i;

// Cache danh sách model free 10 phút để mỗi tin nhắn không phải fetch /models một lần.
let modelCache: { at: number; models: string[] } | null = null;
const MODEL_CACHE_MS = 10 * 60 * 1000;
const MAX_CANDIDATE_MODELS = 3;

async function resolveCandidateModels(): Promise<string[]> {
  if (modelCache && Date.now() - modelCache.at < MODEL_CACHE_MS) {
    return modelCache.models;
  }
  const candidates: string[] = [];
  try {
    const res = await fetch("https://openrouter.ai/api/v1/models", { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as {
        data?: { id: string; pricing?: { prompt?: string }; context_length?: number }[];
      };
      const free = (data.data ?? []).filter((m) => m.id.endsWith(":free"));
      const available = new Set(free.map((m) => m.id));

      for (const preferred of openRouterModels) {
        if (available.has(preferred)) candidates.push(preferred);
      }

      const general = free
        .filter(
          (m) =>
            !SPECIALIZED_MODEL.test(m.id) && (m.pricing?.prompt ?? "1") === "0",
        )
        .sort((a, b) => (a.context_length ?? 0) - (b.context_length ?? 0));

      for (const g of general) {
        if (!candidates.includes(g.id)) candidates.push(g.id);
      }
    }
  } catch {
    // bỏ qua, dùng danh sách tĩnh bên dưới
  }
  for (const preferred of openRouterModels) {
    if (!candidates.includes(preferred)) candidates.push(preferred);
  }
  const trimmed = candidates.slice(0, MAX_CANDIDATE_MODELS);
  modelCache = { at: Date.now(), models: trimmed };
  return trimmed;
}

type ModelAttempt =
  | { ok: true; value: ApiResult }
  | { ok: false; fatal: boolean; error: string };

async function tryModel(
  model: string,
  userMessage: string,
  systemPrompt: string,
): Promise<ModelAttempt> {
  const post = async (body: Record<string, unknown>) => {
    return fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openRouterApiKey}`,
      },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(60000),
    });
  };

  const baseBody = {
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    temperature: 0.5,
    response_format: { type: "json_object" },
  };

  try {
    let res = await post(baseBody);

    if (res.status === 400) {
      const fallback = { ...baseBody };
      delete (fallback as { response_format?: unknown }).response_format;
      res = await post(fallback);
    }

    if (!res.ok) {
      const text = await res.text();
      if (res.status === 401 || res.status === 403) {
        const isAuthError = /invalid api key|unauthorized|authentication|permission/i.test(text);
        if (isAuthError) {
          return {
            ok: false,
            fatal: true,
            error: `OpenRouter từ chối key (${res.status}). Kiểm tra OPENROUTER_API_KEY trong .env.local.`,
          };
        }
      }
      return { ok: false, fatal: false, error: `HTTP ${res.status}: ${text.slice(0, 160)}` };
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data?.choices?.[0]?.message?.content ?? "";
    return { ok: true, value: parseResult(content) };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, fatal: false, error: msg };
  }
}

async function callOpenRouter(userMessage: string, systemPrompt: string): Promise<ApiResult> {
  if (!openRouterApiKey) {
    throw new Error(
      "Thiếu OPENROUTER_API_KEY. Tạo key miễn phí tại https://openrouter.ai/keys rồi thêm vào .env.local (xem .env.local.example).",
    );
  }

  const models = await resolveCandidateModels();
  if (models.length === 0) {
    throw new Error("Không tìm thấy model miễn phí nào trên OpenRouter.");
  }

  const deadline = Date.now() + 90000;
  const errors: string[] = [];
  for (const model of models) {
    if (Date.now() > deadline) break;
    const attempt = await tryModel(model, userMessage, systemPrompt);
    if (attempt.ok) return attempt.value;
    errors.push(`${model} → ${attempt.error}`);
    if (attempt.fatal) break;
  }

  const timeoutCount = errors.filter((e) => /timeout|abort/i.test(e)).length;
  if (timeoutCount === errors.length && errors.length > 0) {
    throw new Error(
      "Các model AI miễn phí đang phản hồi quá chậm (quá tải). Hãy chờ 1–2 phút rồi thử lại, hoặc thêm model khác vào OPENROUTER_MODEL trong .env.local.",
    );
  }
  throw new Error(
    errors[0]
      ? `Các model AI miễn phí đang quá tải: ${errors[0].slice(0, 160)}. Hãy thử lại sau 1–2 phút.`
      : "Không có model AI nào phản hồi. Hãy thử lại sau.",
  );
}

async function callGeminiChat(messages: ChatMessage[], systemPrompt: string): Promise<string> {
  if (!geminiClient) {
    throw new Error("Thiếu GEMINI_API_KEY. Thêm vào .env.local (xem .env.local.example).");
  }
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  const response = await geminiClient.models.generateContent({
    model: geminiModel,
    contents,
    config: {
      systemInstruction: systemPrompt,
      temperature: 0.7,
    },
  });
  return (response.text ?? "").trim();
}

type ChatAttempt =
  | { ok: true; value: string }
  | { ok: false; fatal: boolean; error: string };

async function tryChatModel(
  model: string,
  messages: ChatMessage[],
  systemPrompt: string,
): Promise<ChatAttempt> {
  const post = async (body: Record<string, unknown>) => {
    return fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openRouterApiKey}`,
      },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(30000),
    });
  };

  const baseBody = {
    model,
    messages: [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
    ],
    temperature: 0.7,
  };

  try {
    const res = await post(baseBody);
    if (!res.ok) {
      const text = await res.text();
      if (res.status === 401 || res.status === 403) {
        const isAuthError = /invalid api key|unauthorized|authentication|permission/i.test(text);
        if (isAuthError) {
          return {
            ok: false,
            fatal: true,
            error: `OpenRouter từ chối key (${res.status}). Kiểm tra OPENROUTER_API_KEY trong .env.local.`,
          };
        }
      }
      return { ok: false, fatal: false, error: `HTTP ${res.status}: ${text.slice(0, 160)}` };
    }
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data?.choices?.[0]?.message?.content ?? "";
    if (!content.trim()) {
      return { ok: false, fatal: false, error: "Model trả về nội dung rỗng." };
    }
    return { ok: true, value: content.trim() };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, fatal: false, error: msg };
  }
}

async function callOpenRouterChat(messages: ChatMessage[], systemPrompt: string): Promise<string> {
  if (!openRouterApiKey) {
    throw new Error(
      "Thiếu OPENROUTER_API_KEY. Tạo key miễn phí tại https://openrouter.ai/keys rồi thêm vào .env.local (xem .env.local.example).",
    );
  }

  const models = await resolveCandidateModels();
  if (models.length === 0) {
    throw new Error("Không tìm thấy model miễn phí nào trên OpenRouter.");
  }

  const deadline = Date.now() + 60000;
  const errors: string[] = [];
  for (const model of models) {
    if (Date.now() > deadline) break;
    const attempt = await tryChatModel(model, messages, systemPrompt);
    if (attempt.ok) return attempt.value;
    errors.push(`${model} → ${attempt.error}`);
    if (attempt.fatal) break;
  }

  throw new Error(
    errors[0]
      ? `Các model AI miễn phí đang quá tải: ${errors[0].slice(0, 160)}. Hãy thử lại sau 1–2 phút.`
      : "Không có model AI nào phản hồi. Hãy thử lại sau.",
  );
}

// ---------- STREAMING (SSE) ----------

export type ChatStreamEvent =
  | { type: "delta"; delta: string }
  | { type: "done" }
  | { type: "error"; error: string };

type ChatStreamAttempt =
  | { ok: true; emitted: boolean; error: "" }
  | { ok: false; fatal: boolean; emitted: boolean; error: string };

// Streams one chat completion through OpenRouter (SSE). onDelta is called per token;
// returns ok:true when the stream finished cleanly.
async function tryChatModelStream(
  model: string,
  messages: ChatMessage[],
  systemPrompt: string,
  onDelta: (delta: string) => void,
): Promise<ChatStreamAttempt> {
  let emitted = false;
  const post = async (body: Record<string, unknown>) => {
    return fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openRouterApiKey}`,
      },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(60000),
    });
  };

  const baseBody = {
    model,
    messages: [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
    ],
    temperature: 0.7,
    stream: true,
  };

  try {
    const res = await post(baseBody);
    if (!res.ok) {
      const text = await res.text();
      if (res.status === 401 || res.status === 403) {
        const isAuthError = /invalid api key|unauthorized|authentication|permission/i.test(text);
        if (isAuthError) {
          return {
            ok: false,
            fatal: true,
            emitted,
            error: `OpenRouter từ chối key (${res.status}). Kiểm tra OPENROUTER_API_KEY trong .env.local.`,
          };
        }
      }
      return { ok: false, fatal: false, emitted, error: `HTTP ${res.status}: ${text.slice(0, 160)}` };
    }

    if (!res.body) {
      return { ok: false, fatal: false, emitted, error: "OpenRouter không trả về content stream." };
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    let finishOk = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });

      let idx: number;
      while ((idx = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, idx).trim();
        buf = buf.slice(idx + 1);
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (payload === "[DONE]") {
          finishOk = true;
          break;
        }
        if (!payload) continue;
        try {
          const json = JSON.parse(payload) as {
            choices?: { delta?: { content?: string }; message?: { content?: string } }[];
          };
          const piece =
            json?.choices?.[0]?.delta?.content ??
            json?.choices?.[0]?.message?.content ??
            "";
          if (piece) {
            emitted = true;
            onDelta(piece);
          }
        } catch {
          // ignore broken/empty SSE frames
        }
      }
      if (finishOk) break;
    }
    try {
      reader.cancel();
    } catch {
      // client closed — ignore
    }
    return { ok: true, emitted, error: "" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, fatal: false, emitted, error: msg };
  }
}

async function streamGeminiChat(
  messages: ChatMessage[],
  systemPrompt: string,
  onEvent: (ev: ChatStreamEvent) => void,
): Promise<void> {
  if (!geminiClient) {
    onEvent({
      type: "error",
      error: "Thiếu GEMINI_API_KEY. Thêm vào .env.local (xem .env.local.example).",
    });
    return;
  }
  try {
    const contents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
    const stream = await geminiClient.models.generateContentStream({
      model: geminiModel,
      contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      },
    });
    let any = false;
    for await (const chunk of stream) {
      const piece = chunk.text ?? "";
      if (piece) {
        any = true;
        onEvent({ type: "delta", delta: piece });
      }
    }
    if (any) {
      onEvent({ type: "done" });
    } else {
      onEvent({ type: "error", error: "Model trả về nội dung rỗng." });
    }
  } catch (err) {
    onEvent({ type: "error", error: err instanceof Error ? err.message : String(err) });
  }
}

async function streamOpenRouterChat(
  messages: ChatMessage[],
  systemPrompt: string,
  onEvent: (ev: ChatStreamEvent) => void,
): Promise<void> {
  if (!openRouterApiKey) {
    onEvent({
      type: "error",
      error:
        "Thiếu OPENROUTER_API_KEY. Tạo key miễn phí tại https://openrouter.ai/keys rồi thêm vào .env.local (xem .env.local.example).",
    });
    return;
  }

  const models = await resolveCandidateModels();
  if (models.length === 0) {
    onEvent({ type: "error", error: "Không tìm thấy model miễn phí nào trên OpenRouter." });
    return;
  }

  const deadline = Date.now() + 90000;
  const errors: string[] = [];
  for (const model of models) {
    if (Date.now() > deadline) break;
    const attempt = await tryChatModelStream(model, messages, systemPrompt, (delta) => {
      onEvent({ type: "delta", delta });
    });
    if (attempt.ok) {
      if (!attempt.emitted) {
        errors.push(`${model} → nội dung rỗng`);
        continue;
      }
      onEvent({ type: "done" });
      return;
    }
    if (attempt.emitted) {
      // Stream already started — can't restart with another model mid-way, report error.
      onEvent({
        type: "error",
        error: `Trả lời đang sinh bị ngắt: ${attempt.error.slice(0, 160)}. Hãy thử lại.`,
      });
      return;
    }
    errors.push(`${model} → ${attempt.error}`);
    if (attempt.fatal) break;
  }

  const timeoutCount = errors.filter((e) => /timeout|abort/i.test(e)).length;
  if (timeoutCount === errors.length && errors.length > 0) {
    onEvent({
      type: "error",
      error:
        "Các model AI miễn phí đang phản hồi quá chậm (quá tải). Hãy chờ 1–2 phút rồi thử lại, hoặc thêm model khác vào OPENROUTER_MODEL trong .env.local.",
    });
    return;
  }
  onEvent({
    type: "error",
    error: errors[0]
      ? `Các model AI miễn phí đang quá tải: ${errors[0].slice(0, 160)}. Hãy thử lại sau 1–2 phút.`
      : "Không có model AI nào phản hồi. Hãy thử lại sau.",
  });
}

// AI sinh phiếu khảo sát nhanh (JSON) để học sinh điền một lượt thay vì chat qua lại.
// Trả null khi mọi model đều thất bại → route sẽ dùng SURVEY_DEFAULT dự phòng.
export async function generateSurvey(): Promise<Survey | null> {
  const systemPrompt = buildSurveyPrompt();
  const userMessage =
    "Tạo phiếu khảo sát hướng nghiệp nhanh cho học sinh, theo đúng yêu cầu định dạng ở trên.";

  if (provider === "gemini") {
    if (!geminiClient) return null;
    try {
      const response = await geminiClient.models.generateContent({
        model: geminiModel,
        contents: userMessage,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          temperature: 0.6,
        },
      });
      return parseSurvey(response.text ?? "");
    } catch {
      return null;
    }
  }

  if (provider !== "openrouter" || !openRouterApiKey) return null;

  const models = await resolveCandidateModels();
  if (models.length === 0) return null;

  const deadline = Date.now() + 90000;
  for (const model of models) {
    if (Date.now() > deadline) break;
    const baseBody: Record<string, unknown> = {
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.6,
      response_format: { type: "json_object" },
    };
    const post = (body: Record<string, unknown>) =>
      fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openRouterApiKey}`,
        },
        body: JSON.stringify(body),
        cache: "no-store",
        signal: AbortSignal.timeout(60000),
      });

    try {
      let res = await post(baseBody);
      if (res.status === 400) {
        const fallback = { ...baseBody };
        delete (fallback as { response_format?: unknown }).response_format;
        res = await post(fallback);
      }
      if (!res.ok) continue;
      const data = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const survey = parseSurvey(data?.choices?.[0]?.message?.content ?? "");
      if (survey) return survey;
    } catch {
      // model lỗi/timeout → thử model kế tiếp
    }
  }
  return null;
}

export async function streamChatReply(
  messages: ChatMessage[],
  context: string,
  onEvent: (ev: ChatStreamEvent) => void,
): Promise<void> {
  const systemPrompt = buildChatSystemPrompt(context);
  if (provider === "gemini") {
    await streamGeminiChat(messages, systemPrompt, onEvent);
    return;
  }
  if (provider === "openrouter") {
    await streamOpenRouterChat(messages, systemPrompt, onEvent);
    return;
  }
  onEvent({
    type: "error",
    error: `AI_PROVIDER không hợp lệ: "${provider}" (chỉ chấp nhận "gemini" hoặc "openrouter").`,
  });
}
export async function chatReply(messages: ChatMessage[], context?: string): Promise<string> {
  const systemPrompt = buildChatSystemPrompt(context);
  if (provider === "gemini") {
    return callGeminiChat(messages, systemPrompt);
  }
  if (provider === "openrouter") {
    return callOpenRouterChat(messages, systemPrompt);
  }
  throw new Error(`AI_PROVIDER không hợp lệ: "${provider}" (chỉ chấp nhận "gemini" hoặc "openrouter").`);
}

export async function getCareerAdvice(form: FormData): Promise<ApiResult> {
  const cap = findByLop(form.lop).cap;
  const hint = [...form.mon_manh, ...form.so_thich, form.tinh_cach].join(" ").toLowerCase();
  const scored = nganhNgheList.map((n) => {
    const text = [...n.mon_trong_tam, ...n.ky_nang, ...n.tinh_cach, n.mo_ta, n.linh_vuc]
      .join(" ")
      .toLowerCase();
    let score = 0;
    for (const m of form.mon_manh) if (m && text.includes(m.toLowerCase())) score += 2;
    for (const s of form.so_thich) if (s && text.includes(s.split(",")[0].toLowerCase())) score += 1;
    if (n.muc_hoc_phu_hop.includes(cap)) score += 1;
    if (!hint) score = 1;
    return { n, score };
  });
  const topNganh = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((s) => s.n);
  const khoiCan = new Set(topNganh.flatMap((n) => n.khoi_phu_hop));
  const topTruong = truongDhList
    .map((t) => ({
      t,
      hit: t.nhom_nganh.filter((g) => g.to_hop.some((c) => khoiCan.has(c))).length,
    }))
    .filter((x) => x.hit > 0)
    .sort((a, b) => b.hit - a.hit)
    .slice(0, 6)
    .map((x) => x.t);
  const grounding = buildGroundingContext(
    khoiThiList,
    topNganh.length > 0 ? topNganh : nganhNgheList.slice(0, 8),
    topTruong.length > 0 ? topTruong : truongDhList.slice(0, 6),
    cap,
  );
  const userMessage = `${buildUserPrompt(form)}\n\n${buildFormatInstruction()}\n\n${grounding}`;
  const systemPrompt = buildSystemPrompt();

  if (provider === "gemini") {
    return callGemini(userMessage, systemPrompt);
  }
  if (provider === "openrouter") {
    return callOpenRouter(userMessage, systemPrompt);
  }
  throw new Error(`AI_PROVIDER không hợp lệ: "${provider}" (chỉ chấp nhận "gemini" hoặc "openrouter").`);
}