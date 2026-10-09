// Lịch DỰ KIẾN kỳ thi tốt nghiệp THPT 2027 (lịch chính thức chờ Bộ GD&ĐT công bố).
// Dùng chung cho ExamCountdown và huy hiệu đếm ngược ở trang chủ để hai nơi
// không bao giờ lệch nhau.

export type LichThiMon = {
  mon: string;
  ngay: string;
  gio: string;
  at: number;
};

export const LICH_THI_2027: LichThiMon[] = [
  { mon: "Ngữ văn", ngay: "11/06/2027", gio: "07:30", at: new Date(2027, 5, 11, 7, 30).getTime() },
  { mon: "Toán", ngay: "11/06/2027", gio: "14:20", at: new Date(2027, 5, 11, 14, 20).getTime() },
  { mon: "Bài thi tự chọn thứ nhất", ngay: "12/06/2027", gio: "07:30", at: new Date(2027, 5, 12, 7, 30).getTime() },
  { mon: "Bài thi tự chọn thứ hai", ngay: "12/06/2027", gio: "10:30", at: new Date(2027, 5, 12, 10, 30).getTime() },
];

/** Số ngày còn lại tới môn thi đầu tiên (làm tròn lên, tối thiểu 0). */
export function soNgayConLai(now: number): number {
  const dauTien = Math.min(...LICH_THI_2027.map((m) => m.at));
  return Math.max(0, Math.ceil((dauTien - now) / 86_400_000));
}
