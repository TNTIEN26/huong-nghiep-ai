export type KhoiThi = {
  code: string;
  ten: string;
  mon_thi: string[];
  phu_hop: string[];
};

export type NganhNghe = {
  id: string;
  ten: string;
  linh_vuc: string;
  mo_ta: string;
  mon_trong_tam: string[];
  khoi_phu_hop: string[];
  ky_nang: string[];
  tinh_cach: string[];
  cong_viec: string[];
  trien_vong: string;
  /** Reference salary band (tham khào only), e.g. "≈ 25–60 mln/tháng". */
  muc_luong_tk?: string;
  /** Automation/replacement risk + labor market note (tham khào only). */
  rui_ro_thay_the?: string;
  muc_hoc_phu_hop: string[];
};

export type TruongDH = {
  id: string;
  ten: string;
  thanh_pho: string;
  nhom_nganh: {
    ten: string;
    to_hop: string[];
    diem_chuan_tk: number;
    ghichu?: string;
    hoc_phi_tk?: string;
    hoc_bong?: string;
  }[];
};

export type LopInfo = {
  label: string;
  cap: "C2" | "C3";
};

export type FormData = {
  lop: string;
  mon_manh: string[];
  mon_yeu: string[];
  so_thich: string[];
  tinh_cach: string;
};

export type GoiYNganh = {
  ten: string;
  do_phu_hop: number;
  ly_do: string;
  khoi_thi: string[];
  mon_trong_tam: string[];
  lo_trinh: string;
  truong_tieu_bieu: string[];
  /** Reference salary band (tham khào only), e.g. "≈ 25–60 mln/tháng". */
  muc_luong_tk?: string;
  /** Automation/replacement risk note (tham khào only). */
  rui_ro?: string;
};

export type ApiResult = {
  gioi_thieu: string;
  nghe_nghiep: GoiYNganh[];
  khoi_thi_de_nghi: string[];
  loi_khuyen: string;
  luu_y: string;
  /** Career-choice traps specific to this student (fashion, family pressure, flashy title...). */
  canh_bao?: string[];
  /** Labor-market trends: demand growth, automation risk, salary range (approx). */
  xu_truong?: string[];
};

// ---------- SURVEY (phiếu khảo sát nhanh do AI sinh trong chat) ----------

export type SurveyQuestion =
  | { id: "lop"; type: "lop"; title: string; bat_buoc?: boolean }
  | { id: string; type: "choice"; title: string; options: string[]; bat_buoc?: boolean }
  | { id: string; type: "multi"; title: string; options: string[]; bat_buoc?: boolean }
  | { id: string; type: "text"; title: string; placeholder?: string; bat_buoc?: boolean }
  | { id: string; type: "scale"; title: string; bat_buoc?: boolean };

export type Survey = {
  title?: string;
  moTa?: string;
  questions: SurveyQuestion[];
};

export type SurveyAnswers = Record<string, string | string[] | number>;