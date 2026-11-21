export type MbtiPole = "E" | "I" | "S" | "N" | "T" | "F" | "J" | "P";

export type MbtiType = {
  code: string;
  ten: string;
  nhom: string;
  moTa: string;
  manh: string[];
  ngheNghiep: string[];
  khoiGoiY: string[];
  mau: [string, string];
  hinh: string;
};

export type MbtiQuestion = {
  id: number;
  cau: string;
  a: { text: string; pole: MbtiPole };
  b: { text: string; pole: MbtiPole };
};

export type MbtiDiem = {
  E: number;
  I: number;
  S: number;
  N: number;
  T: number;
  F: number;
  J: number;
  P: number;
};

export type MbtiKetQua = {
  code: string;
  type: MbtiType;
  dem: MbtiDiem;
};

export const MBTI_TYPES: MbtiType[] = [
  {
    code: "INTJ",
    ten: "Nhà khoa học",
    nhom: "Nhà phân tích",
    moTa: "Thích nhìn bức tranh lớn, lập kế hoạch dài hạn và giải quyết vấn đề bằng logic. Bạn độc lập, kỷ luật và luôn muốn hiểu sâu bản chất.",
    manh: ["Tư duy chiến lược", "Tự học tốt", "Kiên định với mục tiêu"],
    ngheNghiep: ["Khoa học dữ liệu", "Trí tuệ nhân tạo", "Kiến trúc", "Nghiên cứu", "Quản lý chiến lược"],
    khoiGoiY: ["A00", "A01", "D07"],
    mau: ["#4c1d95", "#7c3aed"],
    hinh: "/mbti/INTJ.png",
  },
  {
    code: "INTP",
    ten: "Nhà tư duy",
    nhom: "Nhà phân tích",
    moTa: "Tò mò, thích phân tích và tìm ra quy luật ẩn sau mọi thứ. Bạn thích tự do khám phá hơn là làm theo khuôn mẫu.",
    manh: ["Phân tích logic", "Sáng tạo ý tưởng", "Giải quyết vấn đề"],
    ngheNghiep: ["Kỹ thuật phần mềm", "Khoa học máy tính", "Toán ứng dụng", "Nghiên cứu", "Phân tích dữ liệu"],
    khoiGoiY: ["A00", "A01", "B00"],
    mau: ["#1e3a8a", "#3b82f6"],
    hinh: "/mbti/INTP.png",
  },
  {
    code: "ENTJ",
    ten: "Nhà điều hành",
    nhom: "Nhà phân tích",
    moTa: "Tự tin, quyết đoán và thích dẫn dắt. Bạn giỏi biến mục tiêu thành kế hoạch và thúc đẩy mọi người cùng tiến.",
    manh: ["Lãnh đạo", "Ra quyết định", "Tổ chức công việc"],
    ngheNghiep: ["Quản trị kinh doanh", "Tài chính", "Luật", "Khởi nghiệp", "Quản lý dự án"],
    khoiGoiY: ["A00", "A01", "D01"],
    mau: ["#312e81", "#4f46e5"],
    hinh: "/mbti/ENTJ.png",
  },
  {
    code: "ENTP",
    ten: "Người nhìn xa",
    nhom: "Nhà phân tích",
    moTa: "Nhanh trí, thích tranh luận và thử cái mới. Bạn nhìn ra nhiều khả năng mà người khác chưa thấy.",
    manh: ["Tư duy linh hoạt", "Thuyết phục", "Nhìn ra cơ hội"],
    ngheNghiep: ["Khởi nghiệp", "Marketing", "Tư vấn", "Luật", "Quản lý sản phẩm"],
    khoiGoiY: ["A00", "A01", "D01"],
    mau: ["#5b21b6", "#8b5cf6"],
    hinh: "/mbti/ENTP.png",
  },
  {
    code: "INFJ",
    ten: "Người che chở",
    nhom: "Nhà ngoại giao",
    moTa: "Sâu sắc, giàu lòng trắc ẩn và có lý tưởng rõ ràng. Bạn muốn làm điều có ý nghĩa cho người khác.",
    manh: ["Đồng cảm", "Kiên nhẫn", "Nhìn thấu con người"],
    ngheNghiep: ["Tâm lý học", "Giáo dục", "Công tác xã hội", "Y tế", "Viết lách"],
    khoiGoiY: ["C00", "D01", "B00"],
    mau: ["#065f46", "#10b981"],
    hinh: "/mbti/INFJ.png",
  },
  {
    code: "INFP",
    ten: "Người lý tưởng hóa",
    nhom: "Nhà ngoại giao",
    moTa: "Nhạy cảm, giàu trí tưởng tượng và trung thành với giá trị cá nhân. Bạn thích tạo ra điều đẹp đẽ và tử tế.",
    manh: ["Sáng tạo", "Đồng cảm", "Trung thực"],
    ngheNghiep: ["Thiết kế", "Viết lách", "Tâm lý học", "Giáo dục", "Nghệ thuật"],
    khoiGoiY: ["C00", "D01", "A01"],
    mau: ["#047857", "#34d399"],
    hinh: "/mbti/INFP.png",
  },
  {
    code: "ENFJ",
    ten: "Người cho đi",
    nhom: "Nhà ngoại giao",
    moTa: "Ấm áp, biết lắng nghe và giỏi truyền cảm hứng. Bạn thích giúp người khác phát triển.",
    manh: ["Giao tiếp", "Lãnh đạo nhóm", "Truyền cảm hứng"],
    ngheNghiep: ["Giáo dục", "Truyền thông", "Nhân sự", "Tư vấn", "Y tế"],
    khoiGoiY: ["C00", "D01", "B00"],
    mau: ["#0f766e", "#14b8a6"],
    hinh: "/mbti/ENFJ.png",
  },
  {
    code: "ENFP",
    ten: "Người truyền cảm hứng",
    nhom: "Nhà ngoại giao",
    moTa: "Nhiệt huyết, tò mò và thích kết nối. Bạn có nhiều ý tưởng và dễ tạo không khí tích cực.",
    manh: ["Sáng tạo", "Kết nối", "Năng lượng tích cực"],
    ngheNghiep: ["Marketing", "Truyền thông", "Du lịch", "Giáo dục", "Sáng tạo nội dung"],
    khoiGoiY: ["D01", "C00", "A01"],
    mau: ["#0d9488", "#2dd4bf"],
    hinh: "/mbti/ENFP.png",
  },
  {
    code: "ISTJ",
    ten: "Người trách nhiệm",
    nhom: "Người trật tự",
    moTa: "Cẩn thận, đáng tin và làm việc có nguyên tắc. Bạn thích sự rõ ràng và hoàn thành việc đến cùng.",
    manh: ["Trách nhiệm", "Tỉ mỉ", "Đáng tin cậy"],
    ngheNghiep: ["Kế toán", "Tài chính", "Luật", "Hành chính", "Kỹ thuật"],
    khoiGoiY: ["A00", "A01", "D01"],
    mau: ["#1e293b", "#475569"],
    hinh: "/mbti/ISTJ.png",
  },
  {
    code: "ISFJ",
    ten: "Người nuôi dưỡng",
    nhom: "Người trật tự",
    moTa: "Chu đáo, kiên nhẫn và luôn quan tâm đến người xung quanh. Bạn thích giúp đỡ bằng những việc thiết thực.",
    manh: ["Chu đáo", "Kiên nhẫn", "Trung thành"],
    ngheNghiep: ["Điều dưỡng", "Giáo viên", "Nhân sự", "Chăm sóc sức khỏe", "Thư viện"],
    khoiGoiY: ["B00", "C00", "D01"],
    mau: ["#334155", "#64748b"],
    hinh: "/mbti/ISFJ.png",
  },
  {
    code: "ESTJ",
    ten: "Người giám hộ",
    nhom: "Người trật tự",
    moTa: "Thực tế, quyết đoán và giỏi tổ chức. Bạn thích mọi thứ vận hành đúng kế hoạch.",
    manh: ["Tổ chức", "Quyết đoán", "Thực tế"],
    ngheNghiep: ["Quản trị kinh doanh", "Kế toán", "Luật", "Logistics", "Hành chính"],
    khoiGoiY: ["A00", "A01", "D01"],
    mau: ["#0c4a6e", "#0284c7"],
    hinh: "/mbti/ESTJ.png",
  },
  {
    code: "ESFJ",
    ten: "Người quan tâm",
    nhom: "Người trật tự",
    moTa: "Thân thiện, hòa đồng và nhạy cảm với nhu cầu của người khác. Bạn thích môi trường tập thể ấm áp.",
    manh: ["Giao tiếp", "Hợp tác", "Quan tâm"],
    ngheNghiep: ["Giáo dục", "Nhân sự", "Y tế", "Dịch vụ", "Truyền thông"],
    khoiGoiY: ["C00", "D01", "B00"],
    mau: ["#075985", "#0ea5e9"],
    hinh: "/mbti/ESFJ.png",
  },
  {
    code: "ISTP",
    ten: "Nhà kỹ thuật",
    nhom: "Người khám phá",
    moTa: "Thực tế, thích tìm hiểu cách mọi thứ hoạt động và giải quyết vấn đề bằng tay. Bạn bình tĩnh và linh hoạt.",
    manh: ["Thực hành", "Bình tĩnh", "Xử lý tình huống"],
    ngheNghiep: ["Cơ khí", "Ô tô", "Điện tử", "Công nghệ thông tin", "Vận hành"],
    khoiGoiY: ["A00", "A01", "D07"],
    mau: ["#1e40af", "#3b82f6"],
    hinh: "/mbti/ISTP.png",
  },
  {
    code: "ISFP",
    ten: "Người nghệ sĩ",
    nhom: "Người khám phá",
    moTa: "Nhẹ nhàng, tinh tế và có gu thẩm mỹ. Bạn thích tự do sáng tạo và sống theo cảm xúc.",
    manh: ["Thẩm mỹ", "Sáng tạo", "Tinh tế"],
    ngheNghiep: ["Thiết kế", "Thời trang", "Nhiếp ảnh", "Âm nhạc", "Thủ công"],
    khoiGoiY: ["A01", "C00", "D01"],
    mau: ["#9a3412", "#f97316"],
    hinh: "/mbti/ISFP.png",
  },
  {
    code: "ESTP",
    ten: "Người thực thi",
    nhom: "Người khám phá",
    moTa: "Năng động, thích trải nghiệm và hành động nhanh. Bạn giỏi nắm bắt cơ hội và xử lý tình huống thực tế.",
    manh: ["Hành động", "Nhanh nhạy", "Thuyết phục"],
    ngheNghiep: ["Kinh doanh", "Bán hàng", "Thể thao", "Logistics", "Du lịch"],
    khoiGoiY: ["A00", "D01", "A01"],
    mau: ["#b45309", "#f59e0b"],
    hinh: "/mbti/ESTP.png",
  },
  {
    code: "ESFP",
    ten: "Người trình diễn",
    nhom: "Người khám phá",
    moTa: "Vui vẻ, hòa đồng và thích đứng trước đám đông. Bạn mang năng lượng tích cực đến cho mọi người.",
    manh: ["Giao tiếp", "Tự tin", "Tạo không khí"],
    ngheNghiep: ["Truyền thông", "Sự kiện", "Du lịch", "Nghệ thuật", "Bán hàng"],
    khoiGoiY: ["D01", "C00", "A01"],
    mau: ["#c2410c", "#fb923c"],
    hinh: "/mbti/ESFP.png",
  },
];

export const MBTI_TYPE_MAP: Record<string, MbtiType> = Object.fromEntries(
  MBTI_TYPES.map((t) => [t.code, t]),
);

export const MBTI_QUESTIONS: MbtiQuestion[] = [
  {
    id: 1,
    cau: "Sau giờ học, bạn thường làm gì để nạp lại năng lượng?",
    a: { text: "Rủ bạn bè đi chơi, nói chuyện cho vui", pole: "E" },
    b: { text: "Về nhà nghỉ ngơi, làm việc riêng", pole: "I" },
  },
  {
    id: 2,
    cau: "Khi học một bài mới, bạn thích cách nào hơn?",
    a: { text: "Có ví dụ cụ thể và bài tập thực tế", pole: "S" },
    b: { text: "Hiểu ý tưởng lớn rồi tự liên hệ", pole: "N" },
  },
  {
    id: 3,
    cau: "Bạn thân gặp chuyện buồn, bạn sẽ?",
    a: { text: "Tìm cách giúp bạn giải quyết vấn đề", pole: "T" },
    b: { text: "Ngồi nghe, an ủi và đồng cảm", pole: "F" },
  },
  {
    id: 4,
    cau: "Lịch học của bạn thường như thế nào?",
    a: { text: "Lên kế hoạch trước, làm theo thứ tự", pole: "J" },
    b: { text: "Tùy hứng, thích nghi theo tình huống", pole: "P" },
  },
  {
    id: 5,
    cau: "Trong lớp có hoạt động phát biểu, bạn?",
    a: { text: "Giơ tay phát biểu trước", pole: "E" },
    b: { text: "Nghe kỹ rồi mới nói", pole: "I" },
  },
  {
    id: 6,
    cau: "Bạn chú ý đến điều gì hơn khi quan sát một sự việc?",
    a: { text: "Chi tiết, sự kiện đã xảy ra", pole: "S" },
    b: { text: "Khả năng, ý nghĩa trong tương lai", pole: "N" },
  },
  {
    id: 7,
    cau: "Khi tranh luận với bạn bè, bạn quan tâm hơn đến?",
    a: { text: "Lý lẽ đúng và kết quả rõ ràng", pole: "T" },
    b: { text: "Giữ hòa khí và hiểu cảm xúc của nhau", pole: "F" },
  },
  {
    id: 8,
    cau: "Trước kỳ thi, bạn thường?",
    a: { text: "Ôn theo kế hoạch từ sớm", pole: "J" },
    b: { text: "Học nước rút và ứng biến", pole: "P" },
  },
  {
    id: 9,
    cau: "Khi có bài tập nhóm, bạn thích?",
    a: { text: "Thảo luận sôi nổi với cả nhóm", pole: "E" },
    b: { text: "Tự làm phần mình rồi góp ý", pole: "I" },
  },
  {
    id: 10,
    cau: "Khi đọc một câu chuyện, bạn thích?",
    a: { text: "Tình tiết rõ ràng, dễ theo dõi", pole: "S" },
    b: { text: "Suy đoán ẩn ý và thông điệp phía sau", pole: "N" },
  },
  {
    id: 11,
    cau: "Giáo viên nhận xét bài của bạn, bạn muốn điều gì hơn?",
    a: { text: "Nhận xét công bằng, đúng năng lực", pole: "T" },
    b: { text: "Nhận xét quan tâm đến cảm xúc", pole: "F" },
  },
  {
    id: 12,
    cau: "Khi đi du lịch cùng gia đình, bạn thích?",
    a: { text: "Lên lịch trình chi tiết từng ngày", pole: "J" },
    b: { text: "Đi đến đâu tính đến đó", pole: "P" },
  },
  {
    id: 13,
    cau: "Cuối tuần lý tưởng của bạn là?",
    a: { text: "Gặp nhiều bạn bè, tham gia hoạt động", pole: "E" },
    b: { text: "Ở nhà với sách, phim hoặc sở thích riêng", pole: "I" },
  },
  {
    id: 14,
    cau: "Khi làm một dự án, bạn thích?",
    a: { text: "Làm theo các bước đã có sẵn", pole: "S" },
    b: { text: "Thử cách mới, sáng tạo hơn", pole: "N" },
  },
  {
    id: 15,
    cau: "Khi chọn ngành học, bạn quan tâm hơn đến?",
    a: { text: "Thu nhập, triển vọng và nhu cầu thị trường", pole: "T" },
    b: { text: "Đam mê và sự phù hợp với bản thân", pole: "F" },
  },
  {
    id: 16,
    cau: "Bài tập lớn được giao, bạn thường?",
    a: { text: "Chia nhỏ và làm đều mỗi ngày", pole: "J" },
    b: { text: "Để gần hạn rồi làm tập trung", pole: "P" },
  },
  {
    id: 17,
    cau: "Khi gặp vấn đề khó, bạn thường?",
    a: { text: "Nói ra để cùng người khác gỡ", pole: "E" },
    b: { text: "Tự suy nghĩ thật kỹ trước", pole: "I" },
  },
  {
    id: 18,
    cau: "Bạn tin vào điều gì hơn?",
    a: { text: "Kinh nghiệm thực tế đã trải qua", pole: "S" },
    b: { text: "Trực giác và linh cảm của mình", pole: "N" },
  },
  {
    id: 19,
    cau: "Khi phải từ chối một lời nhờ, bạn thường?",
    a: { text: "Nói thẳng và rõ lý do", pole: "T" },
    b: { text: "Nói nhẹ nhàng để không làm buồn", pole: "F" },
  },
  {
    id: 20,
    cau: "Khi kế hoạch thay đổi vào phút chót, bạn?",
    a: { text: "Thấy khó chịu, muốn sắp xếp lại ngay", pole: "J" },
    b: { text: "Thấy bình thường, thích nghi nhanh", pole: "P" },
  },
];

export const HOCMAI_SLUG: Record<string, string> = {
  INTJ: "intj-nha-khoa-hoc",
  INTP: "intp-nha-tu-duy",
  ENTJ: "entj-nha-dieu-hanh",
  ENTP: "entp-nguoi-nhin-xa",
  INFJ: "infj-nguoi-che-cho",
  INFP: "infp-nguoi-ly-tuong-hoa",
  ENFJ: "enfj-nguoi-cho-di",
  ENFP: "enfp-nguoi-truyen-cam-hung",
  ISTJ: "istj-nguoi-trach-nhiem",
  ISFJ: "isfj-nguoi-nuoi-duong",
  ESTJ: "estj-nguoi-giam-ho",
  ESFJ: "esfj-nguoi-quan-tam",
  ISTP: "istp-nha-ky-thuat",
  ISFP: "jsfp-nguoi-nghe-si",
  ESTP: "estp-nguoi-thuc-thi",
  ESFP: "esfp-nguoi-trinh-dien",
};

export function tinhMbti(answers: MbtiPole[]): MbtiKetQua {
  const dem: MbtiDiem = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
  for (const p of answers) dem[p] += 1;

  const chon = (a: MbtiPole, b: MbtiPole): MbtiPole => (dem[a] >= dem[b] ? a : b);
  const code = `${chon("E", "I")}${chon("S", "N")}${chon("T", "F")}${chon("J", "P")}`;
  const type = MBTI_TYPE_MAP[code] ?? MBTI_TYPES[0];
  return { code, type, dem };
}
