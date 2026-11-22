import type { Metadata } from "next";
import { Bricolage_Grotesque, Manrope } from "next/font/google";
import "katex/dist/katex.min.css";
import "./globals.css";
import FloatingSupplies from "./components/FloatingSupplies";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "vietnamese"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "Cú Đậu — Trợ lý AI định hướng nghề nghiệp & chọn khối thi",
  description:
    "Kể về bản thân bằng vài câu — AI gợi ý ngành phù hợp, khối thi và lộ trình cho học sinh cấp 2, cấp 3 Việt Nam.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${manrope.variable} ${bricolage.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <FloatingSupplies />
        {children}
      </body>
    </html>
  );
}
