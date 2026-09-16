import { GoogleGenAI } from "@google/genai";

import type { FormData, ApiResult } from "./types";
import { buildSystemPrompt, buildUserPrompt, buildGroundingContext, buildFormatInstruction, findByLop } from "./prompt";
import { khoiThiList, nganhNgheList, truongDhList } from "./data";

const provider = (process.env.AI_PROVIDER ?? "openrouter").trim().toLowerCase();

const geminiApiKey = process.env.GEMINI_API_KEY ?? "";
const geminiModel = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
const geminiClient = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

const openRouterApiKey = process.env.OPENROUTER_API_KEY ?? "";

const DEFAULT_FREE_MODELS = [
  "nex-agi/nex-n2.5-pro:free",
  "nex-agi/nex-n2.5-mini:free",
  "dots-studio/dots-3-note-preview:free",
  "poolside/laguna-xs-2.1:free",
  "google/gemma-4-26b-a4b-it:free",
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
  return parsed;
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

async function resolveCandidateModels(): Promise<string[]> {
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
  return candidates.slice(0, 8);
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
      signal: AbortSignal.timeout(90000),
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

  const deadline = Date.now() + 145000;
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

export async function getCareerAdvice(form: FormData): Promise<ApiResult> {
  const cap = findByLop(form.lop).cap;
  const grounding = buildGroundingContext(khoiThiList, nganhNgheList, truongDhList, cap);
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