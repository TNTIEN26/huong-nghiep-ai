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
};

export type ApiResult = {
  gioi_thieu: string;
  nghe_nghiep: GoiYNganh[];
  khoi_thi_de_nghi: string[];
  loi_khuyen: string;
  luu_y: string;
};