import { GoogleGenAI } from "@google/genai";

import type { FormData, ApiResult, Survey } from "./types";
import {
  buildSystemPrompt,
  buildUserPrompt,
  buildGroundingContext,
  buildFormatInstruction,
  buildChatSystemPrompt,
  buildSurveyPrompt,
  buildTraCuuContext,
  findByLop,
} from "./prompt";
import { parseSurvey } from "./survey";
import { khoiThiList, nganhNgheList, truongDhList } from "./data";
import { duLieuChoTuVan } from "./tra-cuu";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const geminiModel = process.env.GEMINI_MODEL ?? "gemini-3.1-flash-lite";

// Nhiều API key (account Google khác nhau) để xoay vòng khi key trước hết
// quota hoặc bị khóa: GEMINI_API_KEY, GEMINI_API_KEY_2 ... GEMINI_API_KEY_5.
function danhSachGeminiKey(): string[] {
  const ds: string[] = [];
  const them = (k: string | undefined) => {
    const v = (k ?? "").trim();
    if (v && !ds.includes(v)) ds.push(v);
  };
  them(process.env.GEMINI_API_KEY);
  for (let i = 2; i <= 5; i++) them(process.env[`GEMINI_API_KEY_${i}`]);
  return ds;
}

const geminiClients = danhSachGeminiKey().map((apiKey) => new GoogleGenAI({ apiKey }));

// Model dự phòng (cùng provider Gemini) khi model chính quá tải — thêm qua
// GEMINI_MODEL_FALLBACK trong .env.local, phân tách bởi dấu phẩy.
function danhSachModelGemini(): string[] {
  const ds = [geminiModel];
  const them = (process.env.GEMINI_MODEL_FALLBACK ?? "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
  for (const m of them) if (!ds.includes(m)) ds.push(m);
  return ds;
}

const MAU_LOI_TAM_THOI =
  /429|503|unavailable|overloaded|high demand|rate limit|resource_exhausted|quá tải|timeout|timed out|aborted|ECONNRESET|ETIMEDOUT|ENOTFOUND|fetch failed/i;

function laLoiTamThoi(msg: string): boolean {
  return MAU_LOI_TAM_THOI.test(msg);
}

// Key hết quota / bị khóa / không hợp lệ → bỏ key này, xoay sang key kế tiếp.
const MAU_LOI_KHOA =
  /401|403|429|quota|resource_exhausted|rate limit|permission|unauthenticated|api key not valid|invalid api key|user not found/i;

function laLoiKhoa(msg: string): boolean {
  return MAU_LOI_KHOA.test(msg);
}

function cho(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Thử lại tối đa `soLan` lần với backoff kép cho các lỗi mạng/model quá tải.
async function thuLai<T>(fn: () => Promise<T>, soLan = 4): Promise<T> {
  let loiCuoi: unknown;
  for (let lan = 0; lan < soLan; lan++) {
    try {
      return await fn();
    } catch (err) {
      loiCuoi = err;
      const msg = err instanceof Error ? err.message : String(err);
      if (!laLoiTamThoi(msg) || lan === soLan - 1) throw err;
      await cho(800 * Math.pow(2, lan) + Math.random() * 300);
    }
  }
  throw loiCuoi;
}

// Đưa lỗi thô của Gemini về thông báo thân thiện hiển thị cho học sinh.
function thongBaoLoiGemini(msg: string): string {
  if (/429|rate limit|resource_exhausted/i.test(msg)) {
    return "Hệ thống AI đang giới hạn tốc độ, bạn thử lại sau ít giây nhé.";
  }
  if (/503|unavailable|overloaded|high demand|quá tải/i.test(msg)) {
    return "Hệ thống AI đang quá tải, bạn thử lại sau ít giây nhé.";
  }
  if (/401|403|api key|unauthorized|permission/i.test(msg)) {
    return "Cấu hình AI chưa hợp lệ, vui lòng kiểm tra GEMINI_API_KEY trong .env.local.";
  }
  return msg;
}

export function moTaModel(): string {
  return `gemini:${geminiModel}`;
}

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
            description: "Reference salary band (tham khảo only), short, e.g. \"≈ 25–60 triệu đồng/tháng\".",
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

function laChuoi(str: unknown): str is string {
  return typeof str === "string" && str.trim() !== "";
}

function laGoiYNganh(value: unknown): boolean {
  if (typeof value !== "object" || value === null) return false;
  const n = value as Record<string, unknown>;
  return (
    laChuoi(n.ten) &&
    typeof n.do_phu_hop === "number" &&
    Number.isFinite(n.do_phu_hop) &&
    n.do_phu_hop >= 1 &&
    n.do_phu_hop <= 100 &&
    laChuoi(n.ly_do) &&
    Array.isArray(n.khoi_thi) &&
    Array.isArray(n.mon_trong_tam) &&
    laChuoi(n.lo_trinh) &&
    Array.isArray(n.truong_tieu_bieu)
  );
}

function isApiResult(value: unknown): value is ApiResult {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  if (
    !laChuoi(obj.gioi_thieu) ||
    !Array.isArray(obj.nghe_nghiep) ||
    obj.nghe_nghiep.length < 1 ||
    obj.nghe_nghiep.length > 3 ||
    !obj.nghe_nghiep.every(laGoiYNganh) ||
    !Array.isArray(obj.khoi_thi_de_nghi) ||
    !laChuoi(obj.loi_khuyen) ||
    !laChuoi(obj.luu_y)
  ) {
    return false;
  }
  return true;
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
  if (geminiClients.length === 0) {
    throw new Error("Thiếu GEMINI_API_KEY. Thêm vào .env.local (xem .env.local.example).");
  }
  const models = danhSachModelGemini();
  let loiCuoi = "";
  for (const client of geminiClients) {
    for (const model of models) {
      try {
        const response = await thuLai(() =>
          client.models.generateContent({
            model,
            contents: userMessage,
            config: {
              systemInstruction: systemPrompt,
              responseMimeType: "application/json",
              responseSchema: GEMINI_RESPONSE_SCHEMA,
              temperature: 0.5,
            },
          }),
        );
        return parseResult(response.text ?? "");
      } catch (err) {
        loiCuoi = err instanceof Error ? err.message : String(err);
        if (laLoiKhoa(loiCuoi)) break; // key hỏng/hết quota → sang key kế
        if (!laLoiTamThoi(loiCuoi)) break; // lỗi cứng của model → thử model kế
      }
    }
  }
  throw new Error(thongBaoLoiGemini(loiCuoi));
}

function formatGeminiContents(
  messages: ChatMessage[],
): { role: "user" | "model"; parts: { text: string }[] }[] {
  const contents: { role: "user" | "model"; parts: { text: string }[] }[] = [];
  for (const m of messages) {
    const role: "user" | "model" = m.role === "assistant" ? "model" : "user";
    if (contents.length > 0 && contents[contents.length - 1].role === role) {
      contents[contents.length - 1].parts[0].text += `\n\n${m.content}`;
    } else {
      contents.push({ role, parts: [{ text: m.content }] });
    }
  }
  // Gemini requires multiturn conversation to start with "user"
  while (contents.length > 0 && contents[0].role === "model") {
    contents.shift();
  }
  if (contents.length === 0) {
    contents.push({ role: "user", parts: [{ text: "Xin chào Cú Đậu!" }] });
  }
  return contents;
}

async function callGeminiChat(messages: ChatMessage[], systemPrompt: string): Promise<string> {
  if (geminiClients.length === 0) {
    throw new Error("Thiếu GEMINI_API_KEY. Thêm vào .env.local (xem .env.local.example).");
  }
  const contents = formatGeminiContents(messages);
  let loiCuoi = "";
  for (const client of geminiClients) {
    for (const model of danhSachModelGemini()) {
      try {
        const response = await thuLai(() =>
          client.models.generateContent({
            model,
            contents,
            config: {
              systemInstruction: systemPrompt,
              temperature: 0.7,
            },
          }),
        );
        return (response.text ?? "").trim();
      } catch (err) {
        loiCuoi = err instanceof Error ? err.message : String(err);
        if (laLoiKhoa(loiCuoi)) break;
        if (!laLoiTamThoi(loiCuoi)) break;
      }
    }
  }
  throw new Error(thongBaoLoiGemini(loiCuoi));
}

// ---------- STREAMING (SSE) ----------

export type ChatStreamEvent =
  | { type: "delta"; delta: string }
  | { type: "done" }
  | { type: "error"; error: string };

async function streamGeminiChat(
  messages: ChatMessage[],
  systemPrompt: string,
  onEvent: (ev: ChatStreamEvent) => void,
): Promise<void> {
  if (geminiClients.length === 0) {
    onEvent({
      type: "error",
      error: "Thiếu GEMINI_API_KEY. Thêm vào .env.local (xem .env.local.example).",
    });
    return;
  }
  const contents = formatGeminiContents(messages);
  let loiCuoi = "";

  // Vòng ngoài = xoay API key; vòng trong = model. Mỗi model thử lại tối đa
  // 3 lần, chỉ khi chưa phát token nào (đã phát rồi thì không quay lại được).
  for (const client of geminiClients) {
    for (const model of danhSachModelGemini()) {
      for (let lan = 0; lan < 3; lan++) {
        let any = false;
        try {
          const stream = await client.models.generateContentStream({
            model,
            contents,
            config: {
              systemInstruction: systemPrompt,
              temperature: 0.7,
            },
          });
          for await (const chunk of stream) {
            const piece = chunk.text ?? "";
            if (piece) {
              any = true;
              onEvent({ type: "delta", delta: piece });
            }
          }
          if (any) {
            onEvent({ type: "done" });
            return;
          }
          loiCuoi = "Model trả về nội dung rỗng.";
        } catch (err) {
          loiCuoi = err instanceof Error ? err.message : String(err);
          if (any) {
            onEvent({ type: "error", error: thongBaoLoiGemini(loiCuoi) });
            return;
          }
        }
        if (!laLoiTamThoi(loiCuoi)) break;
        await cho(800 * Math.pow(2, lan) + Math.random() * 300);
      }
      if (laLoiKhoa(loiCuoi)) break;
      if (!laLoiTamThoi(loiCuoi)) break;
    }
  }

  onEvent({ type: "error", error: thongBaoLoiGemini(loiCuoi) });
}

// AI sinh phiếu khảo sát nhanh (JSON) để học sinh điền một lượt thay vì chat qua lại.
// Trả null khi mọi model đều thất bại → route sẽ dùng SURVEY_DEFAULT dự phòng.
export async function generateSurvey(): Promise<Survey | null> {
  const systemPrompt = buildSurveyPrompt();
  const userMessage =
    "Tạo phiếu khảo sát hướng nghiệp nhanh cho học sinh, theo đúng yêu cầu định dạng ở trên.";

  for (const client of geminiClients) {
    for (const model of danhSachModelGemini()) {
      try {
        const response = await thuLai(() =>
          client.models.generateContent({
            model,
            contents: userMessage,
            config: {
              systemInstruction: systemPrompt,
              responseMimeType: "application/json",
              temperature: 0.6,
            },
          }),
        );
        const survey = parseSurvey(response.text ?? "");
        if (survey) return survey;
      } catch (loi) {
        const thongBao = loi instanceof Error ? loi.message : String(loi);
        // key hỏng/hết quota → thử key kế tiếp; còn lại thử model kế tiếp
        if (laLoiKhoa(thongBao)) break;
      }
    }
  }
  return null;
}

export async function streamChatReply(
  messages: ChatMessage[],
  context: string,
  onEvent: (ev: ChatStreamEvent) => void,
): Promise<void> {
  await streamGeminiChat(messages, buildChatSystemPrompt(context), onEvent);
}

export async function chatReply(messages: ChatMessage[], context?: string): Promise<string> {
  return callGeminiChat(messages, buildChatSystemPrompt(context));
}

// So khớp theo từ nguyên (bỏ dấu, tách từ): "Toán" khớp từ "toán" đứng
// riêng, không khớp một phần chữ ("kế toán", "thanh toán" vẫn khớp vì cùng
// họ từ — chấp nhận được; nhưng "tin" không khớp "tin đồn", "sử" không khớp
// "lịch sử" nhờ ranh giới từ).
function chuanHoaTu(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function khopTu(haystack: string, kim: string): boolean {
  const tuHay = new Set(haystack.split(" ").filter(Boolean));
  const tuKim = kim.split(" ").filter(Boolean);
  if (tuKim.length === 0) return false;
  return tuKim.every((t) => tuHay.has(t));
}

export async function getCareerAdvice(
  form: FormData,
  opts: { cheDo?: "grounded" | "baseline" } = {},
): Promise<ApiResult> {
  const cheDo = opts.cheDo === "baseline" ? "baseline" : "grounded";
  const cap = findByLop(form.lop).cap;
  const hint = [...form.mon_manh, ...form.so_thich, form.tinh_cach].join(" ").toLowerCase();
  const scored = nganhNgheList.map((n) => {
    const text = chuanHoaTu(
      [...n.mon_trong_tam, ...n.ky_nang, ...n.tinh_cach, n.mo_ta, n.linh_vuc].join(" "),
    );
    let score = 0;
    for (const m of form.mon_manh) {
      if (m && khopTu(text, chuanHoaTu(m))) score += 2;
    }
    for (const s of form.so_thich) {
      // Dùng toàn bộ cụm sở thích ("Máy tính, công nghệ" → cả 3 từ phải có),
      // không cắt lấy nửa đầu như trước.
      if (s && khopTu(text, chuanHoaTu(s))) score += 1;
    }
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
  const dongTraCuu = duLieuChoTuVan(topNganh.map((n) => n.ten), 4);
  const groundingDayDu = dongTraCuu.length > 0 ? `${grounding}\n\n${buildTraCuuContext(dongTraCuu)}` : grounding;
  const userMessage =
    cheDo === "baseline"
      ? `${buildUserPrompt(form)}\n\n${buildFormatInstruction()}`
      : `${buildUserPrompt(form)}\n\n${buildFormatInstruction()}\n\n${groundingDayDu}`;
  const systemPrompt = buildSystemPrompt(cheDo);

  return callGemini(userMessage, systemPrompt);
}