// Quản lý giới hạn tần suất (Rate Limit) đa tầng: Phút, Giờ, Ngày.
// Giúp chống spam, chống bot khai thác API AI, đồng thời đảm bảo học sinh
// thoải mái trò chuyện và hỏi bài mà không bị gián đoạn vô cớ.

type TierConfig = {
  gioiHan: number; // Số lượt tối đa được phép
  cuaSoMs: number; // Độ dài cửa sổ thời gian (ms)
  tenDonVi: "phút" | "giờ" | "ngày";
};

type KenhConfig = {
  phut: TierConfig;
  gio: TierConfig;
  ngay: TierConfig;
};

// Cấu hình linh hoạt: ngưỡng vừa phải, đủ cao để học sinh hỏi nhiều
// không bị chặn vô cớ, nhưng chặn đứng ngay các script spam tự động.
const CAU_HINH: Record<"chat" | "consult", KenhConfig> = {
  chat: {
    // 25 tin nhắn / 1 phút (học sinh gõ nhanh cũng chỉ ~5-10 tin/phút)
    phut: { gioiHan: 25, cuaSoMs: 60_000, tenDonVi: "phút" },
    // 150 tin nhắn / 1 giờ (trung bình 2.5 tin/phút liên tục trong cả tiếng)
    gio: { gioiHan: 150, cuaSoMs: 3_600_000, tenDonVi: "giờ" },
    // 500 tin nhắn / 1 ngày
    ngay: { gioiHan: 500, cuaSoMs: 86_400_000, tenDonVi: "ngày" },
  },
  consult: {
    // 8 lượt tư vấn / 1 phút (mỗi lượt sinh phân tích đầy đủ ngành/khối/lộ trình)
    phut: { gioiHan: 8, cuaSoMs: 60_000, tenDonVi: "phút" },
    // 40 lượt tư vấn / 1 giờ
    gio: { gioiHan: 40, cuaSoMs: 3_600_000, tenDonVi: "giờ" },
    // 120 lượt tư vấn / 1 ngày
    ngay: { gioiHan: 120, cuaSoMs: 86_400_000, tenDonVi: "ngày" },
  },
};

type Bucket = {
  dem: number;
  hetHan: number;
};

// Map lưu trữ theo key: `${kenh}:${tang}:${ip}`
const buckets = new Map<string, Bucket>();

let lanDonRacCuoi = Date.now();

function layIp(request: Request): string {
  // Lấy IP từ các header chuẩn của Reverse Proxy / Cloudflare / Vercel
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) {
    const dau = fwd.split(",")[0].trim();
    if (dau) return dau.slice(0, 64);
  }
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim().slice(0, 64);

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim().slice(0, 64);

  return "127.0.0.1";
}

function donRacTuDong() {
  const now = Date.now();
  // Dọn rác mỗi 5 phút một lần hoặc khi Map quá 5,000 phần tử
  if (now - lanDonRacCuoi > 300_000 || buckets.size > 5_000) {
    lanDonRacCuoi = now;
    for (const [k, b] of buckets) {
      if (now > b.hetHan) {
        buckets.delete(k);
      }
    }
  }
}

/**
 * Kiểm tra giới hạn 3 tầng (phút, giờ, ngày).
 * @returns null nếu hợp lệ (cho phép qua), hoặc chuỗi thông báo lỗi tiếng Việt thân thiện kèm thời gian chờ.
 */
export function kiemTraGioiHan(
  request: Request,
  kenh: keyof typeof CAU_HINH,
): string | null {
  const ip = layIp(request);
  const now = Date.now();
  const cauHinhKenh = CAU_HINH[kenh];

  donRacTuDong();

  // Kiểm tra lần lượt từng tầng: phút -> giờ -> ngày
  const cacTang: (keyof KenhConfig)[] = ["phut", "gio", "ngay"];

  for (const tang of cacTang) {
    const tier = cauHinhKenh[tang];
    const key = `${kenh}:${tang}:${ip}`;
    const bucket = buckets.get(key);

    if (!bucket || now >= bucket.hetHan) {
      // Bắt đầu chu kỳ mới cho tầng này
      buckets.set(key, { dem: 1, hetHan: now + tier.cuaSoMs });
    } else {
      // Đã vượt quá giới hạn
      if (bucket.dem >= tier.gioiHan) {
        const conLaiMs = Math.max(0, bucket.hetHan - now);

        if (tang === "phut") {
          const giayConLai = Math.max(1, Math.ceil(conLaiMs / 1000));
          return `Bạn đang gửi câu hỏi hơi nhanh! Hãy nghỉ tay khoảng ${giayConLai} giây nữa rồi cùng Cú Đậu tiếp tục nhé.`;
        }

        if (tang === "gio") {
          const phutConLai = Math.max(1, Math.ceil(conLaiMs / 60_000));
          return `Bạn đã trao đổi khá nhiều trong 1 giờ qua (đạt mức ${tier.gioiHan} lượt/giờ). Để hệ thống ổn định, hãy quay lại sau ${phutConLai} phút nhé!`;
        }

        if (tang === "ngay") {
          const gioConLai = Math.max(1, Math.ceil(conLaiMs / 3_600_000));
          return `Bạn đã đạt giới hạn trò chuyện trong ngày (${tier.gioiHan} lượt/ngày). Hãy nghỉ ngơi và quay lại sau khoảng ${gioConLai} giờ nữa nhé!`;
        }
      }

      // Tăng số lượt đếm
      bucket.dem += 1;
    }
  }

  return null;
}
