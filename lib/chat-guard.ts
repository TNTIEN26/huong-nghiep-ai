import { boDau } from "./tra-cuu";

const PHAN_HOI_TU_CHOI =
  "Mình chỉ đồng hành bạn về chuyện học và nghề nghiệp thôi, chuyện này mình không rành. Bạn đang băn khoăn chọn môn, khối thi hay ngành học gì không?";

// Cụm từ cho thấy câu hỏi thuộc phạm vi hướng nghiệp / học hành.
// Nếu có bất kỳ cụm nào, KHÔNG chặn (ưu tiên trả lời).
const CUM_CHO_PHEP = [
  "hoc",
  "lop",
  "truong",
  "dai hoc",
  "cao dang",
  "nganh",
  "nghe nghiep",
  "nganh hoc",
  "khoi",
  "to hop",
  "tuyen sinh",
  "hoc bong",
  "hoc phi",
  "tu van",
  "lo trinh",
  "cong viec",
  "viec lam",
  "ky nang",
  "khao sat",
  "dinh huong",
  "sinh vien",
  "hoc sinh",
  "bang cap",
  "chuyen nganh",
  "diem chuan",
  "ky thi",
  "tot nghiep",
  "de an",
  "mon hoc",
  "mon trong tam",
  "mon nao",
  "mon gi",
  "mon manh",
  "mon yeu",
  "diem",
  "thi dai hoc",
  "thi tot nghiep",
  "thi hsa",
  "thi tsa",
  "thi nang luc",
  "thi vao",
  "cntt",
  "cong nghe thong tin",
  "diem cao",
  "diem yeu",
];

// Cụm từ cho thấy câu hỏi ngoại chủ đề (giải trí, thể thao, người nổi tiếng,
// thời tiết, du lịch, ẩm thực, chính trị, tình yêu...).
const CUM_NGOAI_PHAM_VI = [
  "gta",
  "game",
  "phim",
  "netflix",
  "messi",
  "ronaldo",
  "pubg",
  "anime",
  "manga",
  "truyen",
  "ca si",
  "nhac si",
  "dien vien",
  "idol",
  "lien minh",
  "lien quan",
  "free fire",
  "valorant",
  "minecraft",
  "nguoi noi tieng",
  "bong da",
  "world cup",
  "sea games",
  "thi dau",
  "doi tuyen",
  "cau thu",
  "thoi tiet",
  "du lich",
  "khach san",
  "ve may bay",
  "nha hang",
  "mon an",
  "nau an",
  "cong thuc",
  "tinh yeu",
  "hen ho",
  "xo so",
  "ca cuoc",
  "bau cu",
  "chinh tri",
  "tong thong",
  "thu tuong",
  "chinh phu",
  "am nhac",
  "bai hat",
  "thoi trang",
  "lam dep",
  "giam can",
  "truyen tranh",
  "tieu thuyet",
  "than thoai",
  "linh vat",
];

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function coCau(noiDungDaChuanHoa: string, cum: string): boolean {
  return new RegExp(`\\b${escapeRegex(cum)}\\b`, "i").test(noiDungDaChuanHoa);
}

// Trả về câu từ chối nếu câu hỏi rõ ràng ngoại phạm vi hướng nghiệp/học hành.
// Trả null nếu câu hỏi hợp lệ hoặc không rõ ràng (để model tự xử lý).
export function cauTraLoiTuChoi(cauHoi: string): string | null {
  const n = boDau(cauHoi);
  if (n.length < 2) return null;

  if (CUM_CHO_PHEP.some((cum) => coCau(n, cum))) return null;
  if (CUM_NGOAI_PHAM_VI.some((cum) => coCau(n, cum))) return PHAN_HOI_TU_CHOI;

  return null;
}
