import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cho phép mở dev server từ điện thoại/máy khác trong cùng mạng LAN
  // (mặc định Next.js dev chặn origin khác localhost → JS không chạy trên điện thoại).
  allowedDevOrigins: ["192.168.1.31", "192.168.*.*", "10.*.*.*"],
};

export default nextConfig;
