import type { Metadata } from "next";

import TraCuuNganhClient from "./TraCuuNganhClient";

export const metadata: Metadata = {
  title: "Tra cứu ngành nghề | Cú Đậu",
  description:
    "Tra cứu ngành nghề, trường đào tạo, tổ hợp xét tuyển và điểm chuẩn tham khảo dành cho học sinh cấp 2, cấp 3.",
};

export default async function TraCuuNganhPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";

  return <TraCuuNganhClient initialQuery={q} />;
}
