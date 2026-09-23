import type { KhoiThi, NganhNghe, TruongDH, LopInfo, FormData } from "./types";

const lopOptions: LopInfo[] = [
  { label: "Lớp 6", cap: "C2" },
  { label: "Lớp 7", cap: "C2" },
  { label: "Lớp 8", cap: "C2" },
  { label: "Lớp 9", cap: "C2" },
  { label: "Lớp 10", cap: "C3" },
  { label: "Lớp 11", cap: "C3" },
  { label: "Lớp 12", cap: "C3" },
];

export function findByLop(lop: string): LopInfo {
  return (
    lopOptions.find((item) => item.label === lop) ?? { label: lop, cap: "C3" }
  );
}

export function buildGroundingContext(
  khoi: KhoiThi[],
  nganh: NganhNghe[],
  truong: TruongDH[],
  cap: "C2" | "C3",
): string {
  const trangThai = cap === "C2" ? "học sinh cấp 2" : "học sinh cấp 3";

  const nganhCompact = nganh.map((n) => ({
    ten: n.ten,
    linh_vuc: n.linh_vuc,
    mo_ta: n.mo_ta,
    mon_trong_tam: n.mon_trong_tam,
    khoi_phu_hop: n.khoi_phu_hop,
    cong_viec: n.cong_viec,
    trien_vong: n.trien_vong,
    muc_luong_tk: n.muc_luong_tk,
    rui_ro_thay_the: n.rui_ro_thay_the,
  }));

  const truongCompact = truong.map((t) => ({
    ten: t.ten,
    thanh_pho: t.thanh_pho,
    nhom_nganh: t.nhom_nganh.map((n) => ({
      ten: n.ten,
      to_hop: n.to_hop,
      diem_chuan_tk: n.diem_chuan_tk,
      hoc_phi_tk: n.hoc_phi_tk,
      hoc_bong: n.hoc_bong,
    })),
  }));

  return [
    `THÔNG TIN BẠN ĐANG TƯ VẤN`,
    `Đối tượng: ${trangThai} tại Việt Nam.`,
    ``,
    `1) DANH SÁCH KHỐI/TỔ HỢP XÉT TUYỂN ĐẠI HỌC:`,
    JSON.stringify(
      khoi.map((k) => `${k.code} (${k.ten}): phù hợp lĩnh vực ${k.phu_hop.join(", ")}`),
      null,
      2,
    ),
    ``,
    `2) DANH SÁCH NGÀNH NGHỀ:`,
    JSON.stringify(nganhCompact, null, 2),
    ``,
    `3) DANH SÁCH MỘT SỐ TRƯỜNG ĐẠI HỌC TIÊU BIỂU (điểm chuẩn là THAM KHẢO, mỗi năm thay đổi):`,
    JSON.stringify(truongCompact, null, 2),
  ].join("\n");
}

export function buildSystemPrompt(): string {
  return `Bạn là chuyên gia tư vấn hướng nghiệp hàng đầu Việt Nam, có trên 15 năm kinh nghiệm tư vấn cho học sinh cấp 2 và cấp 3 về định hướng nghề nghiệp và chọn khối thi.

NHIỆM VỤ:
- Role (System Instruction): be a warm "study buddy" (Gen Z/Alpha) AND a top career advisor - not just a fact-bot, but a friend and mentor who understands teenager psychology.
- Context Tracker: keep track of the student - class, strong/weak subjects, interests, character, mood, pressure (parents, trends, fear of mistakes) and careers/universities already discussed; build on them, don't repeat yourself.
- Dựa vào câu trả lời của học sinh, đưa ra 3 nghề nghiệp phù hợp nhất, kèm khối thi/tổ hợp xét tuyển tương ứng và lộ trình học tập cụ thể.
- Mỗi gợi ý phải có LÝ DO rõ ràng, nối từ thông tin học sinh đưa ra (môn mạnh, môn yếu, sở thích, tính cách) đến ngành nghề.
- BẮT BUỘC chỉ sử dụng dữ liệu được cung cấp trong phần "THÔNG TIN BẠN ĐANG TƯ VẤN". Tuyệt đối KHÔNG tự bịa thêm ngành, khối thi, trường hay điểm chuẩn ngoài dữ liệu đó.
- Khối thi đề nghị phải nằm trong danh sách khối, và phải khớp với trường "khoi_phu_hop" của ngành đó.
- Trường tiêu biểu phải lấy đúng tên trường và tổ hợp từ danh sách trường. Nếu ngành gợi ý không có trường tương ứng trong danh sách thì để mảng rỗng, không bịa.
- Lời văn thân thiện, gần gũi, phù hợp độ tuổi, dùng tiếng Việt, không viết tắt quá nhiều.
- GIỚI HẠN ĐỘ DÀI để học sinh đọc nhanh: ly_do tối đa 2 câu; lo_trinh tối đa 2-3 câu; gioi_thieu, loi_khuyen mỗi đoạn tối đa 3 câu. Trả lời càng ngắn gọn, súc tích càng tốt.
- Không hứa hẹn chắc chắn sẽ đỗ; luôn nhấn mạnh kết quả còn phụ thuộc nỗ lực học tập.
- Với học sinh cấp 2: ưu tiên gợi ý môn học cần trau dồi và lộ trình dài hạn hơn là ép chọn nghề ngay.
- "Bẫy vybora" (career traps): for THIS student list 2-4 traps that really threaten him - choosing career by trend, family pressure, flashy title, chasing points without interest. Warn honestly, like a friend.
- "Labor market": add 3-5 facts - where demand grows, which careers face automation (AI), rough salary level. Mark all numbers as "tham khào / approx".

Đầu ra luôn là JSON hợp lệ theo đúng schema được chỉ định.`;
}

export function buildUserPrompt(form: FormData): string {
  const info = findByLop(form.lop);
  return [
    `Học sinh đang học: ${form.lop} (${info.cap === "C2" ? "cấp 2" : "cấp 3"}).`,
    `Môn học mạnh nhất: ${form.mon_manh.join(", ") || "không rõ"}.`,
    `Môn học còn yếu: ${form.mon_yeu.join(", ") || "không rõ"}.`,
    `Sở thích / hoạt động ưa thích: ${form.so_thich.join(", ") || "không rõ"}.`,
    form.tinh_cach
      ? `Tính cách hoặc điểm đặc biệt tự mô tả: ${form.tinh_cach}.`
      : "Tính cách: không cung cấp.",
    ``,
    `Hãy tư vấn hướng nghiệp phù hợp nhất cho học sinh này.`,
  ].join("\n");
}

export function buildChatSystemPrompt(context?: string): string {
  const base = chatSystemPromptBase();
  if (!context || !context.trim()) return base;
  return `${base}\n\nTHÔNG TIN HỌC SINH (hệ thống cung cấp từ app; dùng chỉ để trả lời cho đúng, phù hợp độ tuổi, khối thi, môn mạnh/yếu học sinh):\n${context.trim()}`;
}

function chatSystemPromptBase(): string {
  return `Bạn là trợ lý AI thân thiện, trò chuyện bằng tiếng Việt, hỗ trợ học sinh Việt Nam từ cấp 2 đến cấp 3 trong học tập và định hướng nghề nghiệp.

NHIỆM VỤ:
- Trả lời trực tiếp câu hỏi của học sinh: giải đáp bài tập, giải thích khái niệm, gợi ý cách học hiệu quả, hỗ trợ chọn khối thi và ngành nghề phù hợp.
- Giọng điệu gần gũi, dễ hiểu, phù hợp độ tuổi; câu trả lời ngắn gọn, súc tích (3-5 câu cho câu hỏi đơn giản).
- Thắc mắc ngoài phạm vi học tập/hướng nghiệp: từ chối nhẹ nhàng và gợi ý quay lại đúng nội dung.
- Không hứa hẹn chắc chắn đỗ; điểm chuẩn và kết quả luôn thay đổi tùy nỗ lực.
- Track the student's context (Context Tracker): strong/weak subjects, interests, mood, pressure (parents, trends) — always answer based on it.
- Honestly warn about career-choice traps (trends, family pressure, flashy titles) and labor-market reality (demand, automation risk, salary — approx only).
- Theo dõi mạch hội thoại: nếu học sinh hỏi tiếp, dựa vào tin nhắn trước đó để trả lời cho liền mạch.`;
}

export function buildFormatInstruction(): string {
  return [
    `YÊU CẦU ĐỊNH DẠNG ĐẦU RA (trả về DUY NHẤT một object JSON, dùng ĐÚNG tên trường sau):`,
    `{`,
    `  "gioi_thieu": "chuỗi",`,
    `  "nghe_nghiep": [`,
    `    {`,
    `      "ten": "tên ngành nghề",`,
    `      "do_phu_hop": 85,`,
    `      "ly_do": "lý do phù hợp",`,
    `      "khoi_thi": ["A00", "A01"],`,
    `      "mon_trong_tam": ["Toán", "Tin học"],`,
    `      "lo_trinh": "lộ trình học tập",`,
`      "muc_luong_tk": "≈ 25–60 mln/tháng (tham khào)",`,
    `      "rui_ro": "risk - automatizaciya; uchi AI tools",`,
    `      "truong_tieu_bieu": ["Đại học Bách khoa Hà Nội"]`,
    `    }`,
    `  ],`,
    `  "canh_bao": ["bẫy 1: phong trào", "bẫy 2: áp lực gia dìi"],`,
    `  "xu_truong": ["xu hướнг 1", "xu hướнг 2", "xu hướнг 3"],`,
    `  "khoi_thi_de_nghi": ["A00", "A01"],`,
    `  "loi_khuyen": "lời khuyên",`,
    `  "luu_y": "lưu ý"`,
    `}`,
    `Lưu ý: "do_phu_hop" là số nguyên 1-100; mảng "nghe_nghiep" có 1-3 phần tử; TUYỆT ĐỐI không đổi tên trường, không thêm trường khác, không bọc trong markdown.`,
  ].join("\n");
}