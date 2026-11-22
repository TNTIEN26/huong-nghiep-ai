"use client";

import { useEffect, useRef, useState } from "react";
// Render câu trả lời AI dạng Markdown (react-markdown + remark-gfm)
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

import type { ApiResult, FormData, Survey, SurveyAnswers } from "@/lib/types";
import { surveyAnswersToForm } from "@/lib/survey";
import { luuKetQua } from "@/lib/ket-qua-luu";
import CareerResult from "./CareerResult";
import { layPhienMa } from "./DanhGia";
import MascotOwl from "./MascotOwl";
import SurveyCard from "./SurveyCard";

type TinVanBan = { tuAi: "bot" | "ban"; noiDung: string; id?: string };
type TinKetQua = {
  tuAi: "ket-qua";
  id: string;
  result?: ApiResult | null;
  dangChay?: boolean;
  trangThai?: string;
  loi?: string;
};
type TinNhan = TinVanBan | TinKetQua;

const isTinVanBan = (t: TinNhan): t is TinVanBan =>
  (t.tuAi === "bot" || t.tuAi === "ban") &&
  "noiDung" in t &&
  typeof t.noiDung === "string";

const KH_HISTORY = "hn:chat-history";
const KH_CONTEXT = "hn:student-context";
const KH_DRAFT = "hn:chat-draft";
const KH_MBTI = "hn:mbti";
const MAX_TIN = 30; // giới hạn MAX_MESSAGES bên server

// Đọc lịch sử chat từ localStorage — không mất khi refresh trang (lưu cả tin nhắn văn bản và kết quả tư vấn)
function restoreHistory(): TinNhan[] {
  try {
    const raw = localStorage.getItem(KH_HISTORY);
    const arr = raw ? JSON.parse(raw) : null;
    if (!Array.isArray(arr) || arr.length === 0) return [];
    return arr
      .filter((t): t is TinNhan => {
        if (!t || typeof t !== "object") return false;
        if (
          (t.tuAi === "bot" || t.tuAi === "ban") &&
          typeof t.noiDung === "string" &&
          t.noiDung.trim() !== ""
        ) {
          return true;
        }
        if (
          t.tuAi === "ket-qua" &&
          typeof t.id === "string" &&
          t.result &&
          typeof t.result === "object"
        ) {
          return true;
        }
        return false;
      })
      .slice(-MAX_TIN);
  } catch {
    return [];
  }
}

// Chuyển đổi kết quả khảo sát từ AI thành văn bản định hướng để lưu vào ngữ cảnh chat cho AI
export function ketQuaToText(res: ApiResult): string {
  const parts: string[] = [];

  if (res.gioi_thieu) {
    parts.push(`[KẾT QUẢ ĐỊNH HƯỚNG TỪ CÚ ĐẬU]\n${res.gioi_thieu}`);
  } else {
    parts.push("[KẾT QUẢ ĐỊNH HƯỚNG TỪ CÚ ĐẬU]");
  }

  if (res.khoi_thi_de_nghi && res.khoi_thi_de_nghi.length > 0) {
    parts.push(`*Khối thi nên hướng tới:* ${res.khoi_thi_de_nghi.join(", ")}`);
  }

  if (res.nghe_nghiep && res.nghe_nghiep.length > 0) {
    const lines = ["*Các ngành nghề Cú Đậu gợi ý cho bạn:*"];
    res.nghe_nghiep.forEach((n, idx) => {
      const items = [
        `${idx + 1}. **${n.ten}** (Độ phù hợp: ${n.do_phu_hop}%)`,
        `   - Lý do phù hợp: ${n.ly_do}`,
        `   - Khối thi & Môn trọng tâm: ${n.khoi_thi?.join(", ") || "Chưa rõ"} (Môn: ${n.mon_trong_tam?.join(", ") || "Chưa rõ"})`,
        n.truong_tieu_bieu?.length ? `   - Trường tiêu biểu: ${n.truong_tieu_bieu.join(", ")}` : "",
        n.lo_trinh ? `   - Lộ trình: ${n.lo_trinh}` : "",
        n.muc_luong_tk ? `   - Mức lương tham khảo: ${n.muc_luong_tk}` : "",
        n.rui_ro ? `   - Lưu ý thị trường: ${n.rui_ro}` : "",
      ].filter(Boolean);
      lines.push(items.join("\n"));
    });
    parts.push(lines.join("\n\n"));
  }

  if (res.canh_bao && res.canh_bao.length > 0) {
    parts.push(`*Bẫy hướng nghiệp cần tránh:* ${res.canh_bao.join("; ")}`);
  }

  if (res.xu_truong && res.xu_truong.length > 0) {
    parts.push(`*Xu hướng thị trường lao động:* ${res.xu_truong.join("; ")}`);
  }

  if (res.loi_khuyen) {
    parts.push(`*Lời khuyên từ Cú Đậu:* ${res.loi_khuyen}`);
  }

  if (res.luu_y) {
    parts.push(`*Lưu ý:* ${res.luu_y}`);
  }

  return parts.join("\n\n").slice(0, 3500);
}

// Chuyển đổi toàn bộ danh sách tin nhắn (cả tin nhắn văn bản và kết quả khảo sát) sang định dạng chat API
function chuyenDoiLichSuChoAi(
  tinList: TinNhan[],
): { role: "user" | "assistant"; content: string }[] {
  const result: { role: "user" | "assistant"; content: string }[] = [];
  for (const t of tinList) {
    if (isTinVanBan(t)) {
      if (t.noiDung.trim()) {
        result.push({
          role: t.tuAi === "ban" ? "user" : "assistant",
          content: t.noiDung,
        });
      }
    } else if (t.tuAi === "ket-qua" && t.result) {
      result.push({
        role: "assistant",
        content: ketQuaToText(t.result),
      });
    }
  }
  return result.slice(-MAX_TIN);
}

// Đọc thông tin học sinh (lưu từ form tư vấn khi đã điền) — gắn vào prompt chat
type MbtiLuu = {
  code: string;
  ten: string;
  nhom?: string;
  moTa?: string;
  manh?: string[];
  ngheNghiep?: string[];
};

function docMangChuoi(value: unknown): string[] | undefined {
  return Array.isArray(value)
    ? value.filter((n): n is string => typeof n === "string")
    : undefined;
}

function readMbti(): MbtiLuu | null {
  try {
    const raw = localStorage.getItem(KH_MBTI);
    if (!raw) return null;
    const obj: unknown = JSON.parse(raw);
    if (typeof obj !== "object" || obj === null) return null;
    const data = obj as Record<string, unknown>;
    if (typeof data.code !== "string" || typeof data.ten !== "string") return null;
    return {
      code: data.code,
      ten: data.ten,
      nhom: typeof data.nhom === "string" ? data.nhom : undefined,
      moTa: typeof data.moTa === "string" ? data.moTa : undefined,
      manh: docMangChuoi(data.manh),
      ngheNghiep: docMangChuoi(data.ngheNghiep),
    };
  } catch {
    return null;
  }
}

function readStudentContext(): string {
  try {
    const raw = localStorage.getItem(KH_CONTEXT);
    const mbti = readMbti();
    let lop = "";
    let moTa = "";
    if (raw) {
      const obj: unknown = JSON.parse(raw);
      if (typeof obj === "object" && obj !== null) {
        const data = obj as Record<string, unknown>;
        lop = typeof data.lop === "string" ? data.lop.trim() : "";
        moTa = typeof data.vanBan === "string" ? data.vanBan.trim() : "";
      }
    }
    const mbtiText = mbti
      ? [
          `Kết quả trắc nghiệm tính cách: ${mbti.code} — ${mbti.ten}${
            mbti.nhom ? ` (nhóm ${mbti.nhom})` : ""
          }.`,
          mbti.moTa ? `Mô tả: ${mbti.moTa}` : "",
          mbti.manh && mbti.manh.length > 0
            ? `Điểm mạnh: ${mbti.manh.join(", ")}.`
            : "",
          mbti.ngheNghiep && mbti.ngheNghiep.length > 0
            ? `Ngành gợi ý theo tính cách: ${mbti.ngheNghiep.join(", ")}.`
            : "",
        ]
          .filter(Boolean)
          .join(" ")
      : "";
    if (!lop && !moTa && !mbtiText) return "";
    return [
      lop ? `Học sinh đang học: ${lop}.` : "",
      moTa ? `Mô tả bản thân: ${moTa}` : "",
      mbtiText,
    ]
      .filter(Boolean)
      .join(" ");
  } catch {
    return "";
  }
}

// Đọc bản nháp gõ từ trang chủ (một lần rồi xoá) — lazy init để không setState trong effect
function consumeDraft(): string {
  try {
    const draft = localStorage.getItem(KH_DRAFT);
    if (draft) localStorage.removeItem(KH_DRAFT);
    return draft ?? "";
  } catch {
    return "";
  }
}

const DEFAULT_WELCOME: TinNhan[] = [
  {
    tuAi: "bot",
    noiDung: "Chào bạn! Mình là Cú Đậu. Hãy kể cho mình nghe về bạn: môn nào giỏi, môn nào còn gặp khó khăn, thích làm gì, tính cách ra sao nhé?",
  },
];

// Kiểm tra xem người dùng có đang ở gần đáy khung chat hay không
function dangODayChat(el: HTMLElement | null, nguong = 180): boolean {
  if (!el) return true;
  return el.scrollHeight - el.scrollTop - el.clientHeight <= nguong;
}

// Cuộn mượt để đỉnh của phần tử hiển thị ngay đầu khung chat (cách 16px)
function cuonLenDauPhanTu(el: HTMLElement | null, container: HTMLElement | null) {
  if (!el || !container) return;
  const elRect = el.getBoundingClientRect();
  const cRect = container.getBoundingClientRect();
  const targetScrollTop = container.scrollTop + (elRect.top - cRect.top) - 16;
  container.scrollTo({ top: Math.max(0, targetScrollTop), behavior: "smooth" });
}

// Cuộn nhanh xuống đáy khung chat
function cuonXuongDay(container: HTMLElement | null) {
  if (!container) return;
  container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
}

// Khung chat AI full màn hình — logic giữ nguyên từ HeroSection.
export default function ChatBot() {
  const [nhap, setNhap] = useState(consumeDraft);
  const [dangGo, setDangGo] = useState(false);
  const [tinNhans, setTinNhans] = useState<TinNhan[]>(DEFAULT_WELCOME);
  const khungRef = useRef<HTMLDivElement>(null);
  const daCuonTinNhanRef = useRef<Set<string>>(new Set());

  // Phiếu khảo sát đang mở (survey = null nghĩa là đang chờ AI soạn)
  const [surveyMsg, setSurveyMsg] = useState<{
    id: string;
    survey: Survey | null;
    loi?: string;
  } | null>(null);

  // Đã điền xong phiếu khảo sát hay chưa — nếu đã điền thì không hiển thị lại nút
  const [daDienSurvey, setDaDienSurvey] = useState(false);

  // Đọc lịch sử từ localStorage sau khi mount ở client (tránh lỗi hydration mismatch)
  useEffect(() => {
    try {
      const saved = restoreHistory();
      if (saved.length > 0) {
        setTinNhans(saved);
      } else {
        const mbti = readMbti();
        if (mbti) {
          setTinNhans([
            ...DEFAULT_WELCOME,
            {
              tuAi: "bot",
              noiDung: `Mình thấy bạn vừa hoàn thành trắc nghiệm tính cách: ${mbti.code} — ${mbti.ten}. Bạn muốn mình gợi ý ngành học, khối thi và trường phù hợp với nhóm tính cách này không?`,
            },
          ]);
        }
      }
      if (
        localStorage.getItem(KH_CONTEXT) ||
        saved.some(
          (t) =>
            t.tuAi === "ket-qua" ||
            (t.tuAi === "ban" && t.noiDung.includes("phiếu khảo sát")),
        )
      ) {
        setDaDienSurvey(true);
      }
    } catch {
      // storage not available
    }
  }, []);

  // Phiếu khảo sát hiển thị dạng popup: khoá cuộn nền và cho phép đóng bằng Esc
  useEffect(() => {
    if (!surveyMsg) return;
    const TruocDo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function esc(e: KeyboardEvent) {
      if (e.key === "Escape") setSurveyMsg(null);
    }
    document.addEventListener("keydown", esc);
    return () => {
      document.body.style.overflow = TruocDo;
      document.removeEventListener("keydown", esc);
    };
  }, [surveyMsg]);

  // Lưu tự động lịch sử chat — lưu cả tin nhắn văn bản và kết quả khảo sát hoàn tất từ AI
  useEffect(() => {
    try {
      const danhSachLuu = tinNhans.filter((t) => {
        if (isTinVanBan(t)) return t.noiDung.trim() !== "";
        if (t.tuAi === "ket-qua") return Boolean(t.result && !t.dangChay && !t.loi);
        return false;
      });
      localStorage.setItem(KH_HISTORY, JSON.stringify(danhSachLuu.slice(-MAX_TIN)));
    } catch {
      // storage not available — ignore
    }
  }, [tinNhans]);

  function xoaLichSu() {
    setTinNhans(DEFAULT_WELCOME);
    setSurveyMsg(null);
    setDaDienSurvey(false);
    try {
      localStorage.removeItem(KH_HISTORY);
      localStorage.removeItem(KH_CONTEXT);
    } catch {
      // storage not available — ignore
    }
  }
  async function batDauSurvey() {
    if (surveyMsg) return; // đang mở rồi
    const id = `sv${Date.now()}`;
    setSurveyMsg({ id, survey: null });
    try {
      const response = await fetch("/api/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate" }),
      });
      const data = (await response.json()) as { survey?: Survey; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Đã có lỗi xảy ra.");
      if (
        !data.survey ||
        !Array.isArray(data.survey.questions) ||
        data.survey.questions.length === 0
      ) {
        throw new Error("Phiếu khảo sát trống. Hãy thử lại.");
      }
      setSurveyMsg((m) => (m && m.id === id ? { id, survey: data.survey as Survey } : m));
    } catch (err) {
      setSurveyMsg((m) =>
        m && m.id === id
          ? {
              id,
              survey: null,
              loi: err instanceof Error ? err.message : "Đã có lỗi xảy ra, hãy thử lại.",
            }
          : m,
      );
    }
  }

  function tomTatCauTraLoi(answers: SurveyAnswers): string {
    const lop = typeof answers.lop === "string" ? answers.lop : "";
    const pick = (key: string) =>
      Array.isArray(answers[key]) ? (answers[key] as string[]).join(", ") : "";
    const monManh = pick("mon_manh");
    const monYeu = pick("mon_yeu");
    const soThich = pick("so_thich");
    const tuMoTa = typeof answers.tinh_cach === "string" ? answers.tinh_cach.trim() : "";

    const dongThongTin = [
      lop && `• Lớp đang học: ${lop}`,
      monManh && `• Môn học thế mạnh: ${monManh}`,
      monYeu && `• Môn học còn gặp khó khăn: ${monYeu}`,
      soThich && `• Sở thích & đam mê: ${soThich}`,
      tuMoTa && `• Đôi nét về bản thân / băn khoăn: "${tuMoTa}"`,
    ].filter(Boolean);

    return [
      `Chào Cú Đậu! Mình vừa điền phiếu khảo sát bản thân để nhờ bạn định hướng giúp:`,
      ``,
      ...dongThongTin,
      ``,
      `Nhờ Cú Đậu phân tích và gợi ý giúp mình ngành học, khối thi cùng lộ trình phù hợp nhất nhé!`,
    ].join("\n");
  }

  async function chayTuVan(form: FormData) {
    const msgId = `q${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const userWasNearBottom = dangODayChat(khungRef.current);

    setTinNhans((prev) => [
      ...prev,
      { tuAi: "ket-qua", id: msgId, result: null, dangChay: true },
    ]);
    setTimeout(() => cuonXuongDay(khungRef.current), 50);

    const update = (p: Partial<TinKetQua>) => {
      setTinNhans((prev) =>
        prev.map((t) => (t.tuAi === "ket-qua" && t.id === msgId ? { ...t, ...p } : t)),
      );
      if (p.result) {
        // Kết quả tư vấn đã về -> nếu trước đó người dùng ở cuối, cuộn lên ĐẦU kết quả để đọc từ trên xuống
        if (userWasNearBottom || dangODayChat(khungRef.current, 300)) {
          setTimeout(() => {
            const el = document.getElementById(`msg-${msgId}`);
            cuonLenDauPhanTu(el, khungRef.current);
          }, 80);
        }
      }
    };

    let gotResult = false;
    try {
      const response = await fetch("/api/consult", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, stream: true, phien_ma: layPhienMa() }),
      });

      const contentType = response.headers.get("content-type") ?? "";
      if (!response.body || !contentType.includes("text/event-stream")) {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Đã có lỗi xảy ra.");
        update({ result: data as ApiResult, dangChay: false });
        luuKetQua(data as ApiResult, form.lop);
        gotResult = true;
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      outer: while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, idx).trim();
          buf = buf.slice(idx + 1);
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload) continue;
          let ev: { s?: string; r?: ApiResult; e?: string };
          try {
            ev = JSON.parse(payload);
          } catch {
            continue;
          }
          if (typeof ev.s === "string") {
            update({ trangThai: ev.s, dangChay: true });
          } else if (typeof ev.e === "string") {
            update({ loi: ev.e, dangChay: false });
            return;
          } else if (ev.r && typeof ev.r === "object") {
            update({ result: ev.r as ApiResult, dangChay: false });
            luuKetQua(ev.r as ApiResult, form.lop);
            gotResult = true;
            break outer;
          }
        }
      }
      try {
        reader.cancel();
      } catch {
        // ignore
      }
      if (!gotResult) update({ loi: "Đã có lỗi xảy ra, vui lòng thử lại.", dangChay: false });
    } catch (err) {
      update({
        loi: err instanceof Error ? err.message : "Đã có lỗi xảy ra, vui lòng thử lại.",
        dangChay: false,
      });
    }
  }

  async function guiSurvey(answers: SurveyAnswers) {
    const form = surveyAnswersToForm(answers);
    if (!form) {
      setSurveyMsg((m) =>
        m ? { ...m, loi: "Bạn chưa chọn lớp học. Vui lòng kiểm tra lại." } : m,
      );
      return;
    }
    // Lưu bối cảnh học sinh để chat tiếp vẫn biết về bạn
    try {
      localStorage.setItem(KH_CONTEXT, JSON.stringify({ lop: form.lop, vanBan: form.tinh_cach }));
    } catch {
      // lưu không quan trọng — chat vẫn chạy
    }
    setTinNhans((prev) => [...prev, { tuAi: "ban", noiDung: tomTatCauTraLoi(answers) }]);
    setSurveyMsg(null);
    setDaDienSurvey(true);
    await chayTuVan(form);
  }

  async function gui(e: React.FormEvent) {
    e.preventDefault();
    const text = nhap.trim();
    if (!text || dangGo) return;

    const userWasNearBottom = dangODayChat(khungRef.current);

    const userMsg: TinVanBan = { tuAi: "ban", noiDung: text };
    const msgId = `s${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const botMsg: TinVanBan = { tuAi: "bot", noiDung: "", id: msgId };

    // Giữ nguyên toàn bộ lịch sử (bao gồm cả thẻ kết quả khảo sát từ AI), nối thêm tin nhắn mới
    setTinNhans((prev) => [...prev, userMsg, botMsg]);
    setNhap("");
    setDangGo(true);

    setTimeout(() => cuonXuongDay(khungRef.current), 50);

    const studentContext = readStudentContext();

    // Chuyển đổi toàn bộ ngữ cảnh (bao gồm kết quả khảo sát) để gửi tới AI
    const messagesChoAi = chuyenDoiLichSuChoAi([...tinNhans, userMsg]);

    const cuonLenDauBot = () => {
      if (!daCuonTinNhanRef.current.has(msgId)) {
        if (userWasNearBottom || dangODayChat(khungRef.current, 250)) {
          daCuonTinNhanRef.current.add(msgId);
          setTimeout(() => {
            const el = document.getElementById(`msg-${msgId}`);
            cuonLenDauPhanTu(el, khungRef.current);
          }, 60);
        }
      }
    };

    const update = (noiDung: string) => {
      setTinNhans((prev) => prev.map((t) => (t.id === msgId ? { ...t, noiDung } : t)));
      cuonLenDauBot();
    };

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messagesChoAi,
          ...(studentContext ? { context: studentContext } : {}),
          stream: true,
        }),
      });

      const contentType = response.headers.get("content-type") ?? "";
      if (!response.body || !contentType.includes("text/event-stream")) {
        // Old JSON format (e.g. non-streaming servers) — plain single reply.
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Đã có lỗi xảy ra.");
        update((data as { reply?: string }).reply ?? "Trợ lý AI không phản hồi.");
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      let buf = "";
      outer: while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, idx).trim();
          buf = buf.slice(idx + 1);
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload) continue;
          let ev: { d?: string; e?: string; done?: boolean };
          try {
            ev = JSON.parse(payload);
          } catch {
            continue;
          }
          if (typeof ev.d === "string" && ev.d) {
            acc += ev.d;
            setDangGo(false);
            update(acc);
          } else if (typeof ev.e === "string") {
            throw new Error(ev.e);
          } else if (ev.done === true) {
            break outer;
          }
        }
      }
      try {
        reader.cancel();
      } catch {
        // ignore
      }
      if (!acc.trim()) update("Trợ lý AI không phản hồi. Hãy thử lại.");
    } catch (err) {
      update(
        `⚠️ ${err instanceof Error ? err.message : "Đã có lỗi xảy ra, vui lòng thử lại."}`,
      );
    } finally {
      setDangGo(false);
    }
  }

  // Khung nội dung: căn giữa, đủ rộng để đọc thoải mái (không kéo dãn hết màn hình lớn)
  const cot = "mx-auto w-full max-w-4xl";

  return (
    <>
    <div className="-mx-4 flex h-[calc(100dvh-8rem)] min-h-[520px] flex-col overflow-hidden border-y border-stone-900/10 bg-white sm:mx-0 sm:h-[calc(100dvh-7.5rem)] max-sm:[[data-nav-an=true]_&]:h-[calc(100dvh-4.75rem)] transition-[height] duration-300 sm:rounded-2xl sm:border sm:shadow-[0_24px_70px_-30px_rgba(37,99,235,0.4)]">
      {/* Tiêu đề khung chat — gọn một hàng */}
      <div className="flex items-center gap-3 border-b border-stone-900/10 px-4 py-2.5 sm:px-6">
        <MascotOwl className="h-9 w-9 shrink-0" bay={false} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[15px] font-extrabold leading-tight tracking-tight sm:text-base">
            Trợ lý hướng nghiệp AI
          </h1>
          <p className="flex items-center gap-1.5 text-xs text-stone-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Kể về bản thân — AI gợi ý ngành, khối thi, lộ trình
          </p>
        </div>
        <button
          type="button"
          onClick={xoaLichSu}
          aria-label="Xóa lịch sử chat"
          title="Xóa lịch sử chat"
          className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-semibold text-stone-500 transition hover:bg-stone-900/5 hover:text-stone-900"
        >
          <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
          </svg>
          <span className="hidden sm:inline">Xóa</span>
        </button>
      </div>

      {/* Vùng tin nhắn */}
      <div ref={khungRef} className="flex-1 overflow-y-auto bg-[#F8FAFE] px-3 py-4 sm:px-6 sm:py-6">
        <div className={`${cot} space-y-4`}>
          {tinNhans.map((t, i) => {
            if (t.tuAi === "ket-qua") {
              return (
                <div key={`ket-qua-${t.id}`} id={`msg-${t.id}`} className="flex justify-start">
                  {t.dangChay ? (
                    <p className="min-w-[220px] max-w-full rounded-2xl rounded-tl-md border border-stone-900/10 bg-white px-4 py-3 text-[15px] text-stone-500 shadow-sm">
                      <span className="animate-pulse">
                        🦉 {t.trangThai ?? "Cú Đậu đang phân tích và chuẩn bị lộ trình cho bạn nhé…"}
                      </span>
                    </p>
                  ) : t.loi ? (
                    <p className="max-w-full rounded-2xl border border-red-500/30 bg-red-50 px-4 py-3 text-[15px] font-medium text-red-700">
                      ⚠️ {t.loi}
                    </p>
                  ) : t.result ? (
                    <div className="w-full min-w-0">
                      <CareerResult result={t.result} tieuDe="Kết quả tư vấn nhanh" />
                    </div>
                  ) : (
                    <p className="max-w-full rounded-2xl border border-red-500/30 bg-red-50 px-4 py-3 text-[15px] font-medium text-red-700">
                      ⚠️ Đã có lỗi xảy ra, vui lòng thử lại.
                    </p>
                  )}
                </div>
              );
            }
            return (
              <div
                key={`${t.tuAi}-${i}`}
                id={t.id ? `msg-${t.id}` : `msg-${i}`}
                className={`flex ${t.tuAi === "ban" ? "justify-end" : "justify-start"}`}
              >
                {t.tuAi === "ban" ? (
                  <p className="max-w-[88%] whitespace-pre-wrap break-words rounded-2xl rounded-tr-md bg-blue-600 px-4 py-2.5 text-base leading-relaxed text-white sm:max-w-[80%]">
                    {t.noiDung}
                  </p>
                ) : (
                  <div className="chat-md max-w-[94%] break-words rounded-2xl rounded-tl-md border border-stone-900/10 bg-white px-4 py-3 text-base leading-relaxed text-stone-900 shadow-sm sm:max-w-[88%]">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                      components={{
                        a: ({ href, children }) => (
                          <a
                            href={href}
                            target="_blank"
                            rel="noreferrer"
                            className="font-semibold text-blue-700 underline decoration-blue-300 underline-offset-2"
                          >
                            {children}
                          </a>
                        ),
                      }}
                    >
                      {t.noiDung}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            );
          })}
          {dangGo && (
            <div className="flex justify-start">
              <p className="rounded-2xl rounded-tl-md border border-stone-900/10 bg-white px-4 py-3 text-base text-stone-500 shadow-sm">
                <span className="animate-pulse">Đang trả lời…</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Thanh nhập */}
      <form onSubmit={gui} className="border-t border-stone-900/10 bg-white px-3 pb-2.5 pt-2 sm:px-6 sm:pb-3">
        <div className={cot}>
          {!daDienSurvey && !surveyMsg && (
            <div className="mb-2 flex items-center">
              <button
                type="button"
                onClick={batDauSurvey}
                disabled={dangGo}
                className="inline-flex h-8 items-center gap-1.5 rounded-full border border-blue-600/25 bg-blue-50 px-3.5 text-[13px] font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span aria-hidden>📋</span>
                Tư vấn nhanh bằng phiếu khảo sát
              </button>
            </div>
          )}
          <div className="flex items-center gap-2 rounded-2xl border border-stone-900/15 bg-[#F4F8FE] py-1.5 pl-4 pr-1.5 transition focus-within:border-blue-500/70 focus-within:bg-white">
            <input
              value={nhap}
              maxLength={2000}
              onChange={(e) => setNhap(e.target.value)}
              placeholder="Nhập tin nhắn…"
              aria-label="Nhập tin nhắn"
              enterKeyHint="send"
              className="h-11 w-full min-w-0 bg-transparent text-base text-stone-900 outline-none placeholder:text-stone-400"
            />
            <button
              type="submit"
              aria-label="Gửi tin nhắn"
              disabled={!nhap.trim() || dangGo}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-stone-300"
            >
              <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </div>
          <p className="mt-1.5 hidden text-[11.5px] leading-snug text-stone-500 sm:block">
            Trợ lý AI có thể sai sót — kết quả chỉ mang tính tham khảo, không thay thế tư vấn trực tiếp từ thầy cô.
          </p>
        </div>
      </form>
    </div>

    {surveyMsg && (
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-6"
      >
        <div
          aria-hidden
          className="absolute inset-0 bg-stone-950/60 backdrop-blur-[2px]"
          onClick={() => setSurveyMsg(null)}
        />
        <div className="relative flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="flex-1 overflow-y-auto">
            <SurveyCard
              survey={surveyMsg.survey}
              loi={surveyMsg.loi}
              dangTao={!surveyMsg.survey && !surveyMsg.loi}
              onGui={guiSurvey}
              onDong={() => setSurveyMsg(null)}
              onThuLai={batDauSurvey}
            />
          </div>
        </div>
      </div>
    )}
    </>
  );
}
