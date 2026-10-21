import type { FormData, Survey, SurveyAnswers, SurveyQuestion } from "./types";

// Các lựa chọn phổ biến — AI nên dùng đúng nhãn này để mapping sang FormData chuẩn.
export const LOP_OPTIONS: string[] = [
  "Lớp 6",
  "Lớp 7",
  "Lớp 8",
  "Lớp 9",
  "Lớp 10",
  "Lớp 11",
  "Lớp 12",
];

export const MON_HOC_OPTIONS: string[] = [
  "Toán",
  "Ngữ văn",
  "Tiếng Anh",
  "Vật lý",
  "Hóa học",
  "Sinh học",
  "Lịch sử",
  "Địa lý",
  "GDCD",
  "Tin học",
];

export const SO_THICH_OPTIONS: string[] = [
  "Máy tính, công nghệ",
  "Đọc sách, viết lách",
  "Vẽ, thiết kế, chụp ảnh",
  "Chăm sóc người bệnh, người thân",
  "Thuyết trình, nói trước đám đông",
  "Lắp ráp, sửa chữa",
  "Chăm sóc cây trồng, vật nuôi",
  "Thể thao",
  "Khám phá thiên nhiên",
  "Kinh doanh, bán hàng",
  "Nấu ăn, ẩm thực",
  "Nghe nhạc, chơi nhạc cụ",
];

export const MAX_SURVEY_QUESTIONS = 6;

// Các khóa bắt buộc để ánh xạ câu trả lời survey sang FormData tư vấn.
const CORE_IDS = ["lop", "mon_manh", "mon_yeu", "so_thich", "tinh_cach"] as const;

function isValidQuestion(value: unknown): value is SurveyQuestion {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  if (typeof obj.id !== "string" || obj.id.trim() === "") return false;
  if (typeof obj.title !== "string" || obj.title.trim() === "") return false;
  if (obj.bat_buoc !== undefined && typeof obj.bat_buoc !== "boolean") return false;

  switch (obj.type) {
    case "lop":
      return obj.id === "lop"; // buộc đúng khóa đặc biệt
    case "text":
      return obj.placeholder === undefined || typeof obj.placeholder === "string";
    case "scale":
      return true;
    case "choice":
    case "multi": {
      if (!Array.isArray(obj.options)) return false;
      const clean = [
        ...new Set(
          obj.options
            .filter((o): o is string => typeof o === "string" && o.trim() !== "")
            .map((s) => s.trim()),
        ),
      ];
      return clean.length >= 2 && clean.length <= 8;
    }
    default:
      return false;
  }
}

export function isValidSurvey(value: unknown): value is Survey {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  if (obj.title !== undefined && typeof obj.title !== "string") return false;
  if (obj.moTa !== undefined && typeof obj.moTa !== "string") return false;
  if (!Array.isArray(obj.questions) || obj.questions.length === 0) return false;
  if (obj.questions.length > MAX_SURVEY_QUESTIONS) return false;

  const questions = obj.questions.filter((q): q is SurveyQuestion => isValidQuestion(q));
  if (questions.length === 0) return false;

  const ids = new Set(questions.map((q) => q.id));
  if (ids.size !== questions.length) return false; // không trùng id
  for (const core of CORE_IDS) {
    if (!ids.has(core)) return false; // phải đủ các khóa để tư vấn được
  }
  return true;
}

// AI đôi khi bọc JSON trong markdown / thừa ký tự — lấy ra chuỗi JSON rồi validate.
export function parseSurvey(text: string): Survey | null {
  let parsed: unknown;
  try {
    const cleaned = text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    const json = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
    parsed = JSON.parse(json);
  } catch {
    return null;
  }
  return isValidSurvey(parsed) ? parsed : null;
}

// Phiếu khảo sát dự phòng — dùng khi AI không trả về JSON hợp lệ / quá tải.
export const SURVEY_DEFAULT: Survey = {
  title: "Phiếu khảo sát nhanh · 2 phút",
  moTa: "Trả lời một lượt, AI sẽ phân tích và gợi ý hướng nghiệp ngay trong chat.",
  questions: [
    { id: "lop", type: "lop", title: "Bạn đang học lớp mấy?", bat_buoc: true },
    {
      id: "mon_manh",
      type: "multi",
      title: "Môn nào bạn học giỏi nhất?",
      options: MON_HOC_OPTIONS,
      bat_buoc: true,
    },
    { id: "mon_yeu", type: "multi", title: "Môn nào bạn còn yếu?", options: MON_HOC_OPTIONS },
    {
      id: "so_thich",
      type: "multi",
      title: "Lúc rảnh bạn thích làm gì?",
      options: SO_THICH_OPTIONS,
      bat_buoc: true,
    },
    {
      id: "tinh_cach",
      type: "text",
      title: "Kể ngắn 1-3 câu về tính cách, điểm đặc biệt, áp lực hoặc mong muốn của bạn…",
      placeholder: "Ví dụ: mình hướng nội, kiên trì, bố mẹ muốn mình làm kinh tế…",
      bat_buoc: true,
    },
  ],
};

// Ánh xạ câu trả lời survey sang FormData để dùng lại pipeline /api/consult.
export function surveyAnswersToForm(answers: SurveyAnswers): FormData | null {
  if (typeof answers !== "object" || answers === null) return null;

  const lop = typeof answers.lop === "string" ? answers.lop.trim() : "";
  if (!LOP_OPTIONS.includes(lop)) return null;

  const pick = (key: string): string[] => {
    const v = answers[key];
    if (!Array.isArray(v)) return [];
    return [
      ...new Set(
        v
          .filter((x): x is string => typeof x === "string" && x.trim() !== "")
          .map((s) => s.trim()),
      ),
    ];
  };
  const textOf = (key: string): string => {
    const v = answers[key];
    if (typeof v === "string") return v.trim();
    if (typeof v === "number") return String(v);
    return "";
  };

  const mon_manh = pick("mon_manh");
  const mon_yeu = pick("mon_yeu");
  const so_thich = pick("so_thich");
  const tinh_cach = textOf("tinh_cach");

  // Gom các câu hỏi phụ (id khác core) vào mô tả tự do để AI tư vấn vẫn dùng được.
  const known = new Set(["lop", "mon_manh", "mon_yeu", "so_thich", "tinh_cach"]);
  const extras: string[] = [];
  for (const [key, value] of Object.entries(answers)) {
    if (known.has(key)) continue;
    if (Array.isArray(value) && value.length > 0) {
      extras.push(`${key}: ${value.join(", ")}`);
    } else if (value !== undefined && value !== null && value !== "" && value !== 0) {
      extras.push(`${key}: ${value}`);
    }
  }

  return {
    lop,
    mon_manh,
    mon_yeu,
    so_thich,
    tinh_cach: [tinh_cach, ...extras].filter(Boolean).join(" · "),
  };
}