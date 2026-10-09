// Giới hạn thô chống spam/quét API: đếm theo IP trong cửa sổ trượt,
// lưu bộ nhớ (đủ cho demo thi tỉnh và chạy 1 máy khảo sát).
// Không thay thế rate-limit của reverse proxy khi deploy thật.

type Bucket = { dem: number; hetHan: number };

const buckets = new Map<string, Bucket>();

const CUA_SO_MS = 60_000;

const GIOI_HAN: Record<string, number> = {
  consult: 10, // tư vấn AI nặng: 10 lượt/phút/IP
  chat: 30, // chat nhẹ hơn: 30 tin/phút/IP
};

function layIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) {
    const dau = fwd.split(",")[0].trim();
    if (dau) return dau.slice(0, 64);
  }
  return "local";
}

/** Trả null khi cho qua, chuỗi lỗi tiếng Việt khi vượt giới hạn. */
export function kiemTraGioiHan(request: Request, kenh: keyof typeof GIOI_HAN): string | null {
  const key = `${kenh}:${layIp(request)}`;
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now > bucket.hetHan) {
    buckets.set(key, { dem: 1, hetHan: now + CUA_SO_MS });
    return null;
  }
  bucket.dem += 1;
  if (bucket.dem > GIOI_HAN[kenh]) {
    return "Bạn gửi quá nhanh. Hãy chờ khoảng 1 phút rồi thử lại.";
  }
  // Dọn bucket hết hạn để không rò bộ nhớ.
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) {
      if (now > b.hetHan) buckets.delete(k);
    }
  }
  return null;
}
