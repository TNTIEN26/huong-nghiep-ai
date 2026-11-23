# Trợ lý AI định hướng nghề nghiệp & chọn khối thi

Trợ lý AI đóng vai chuyên gia tư vấn hướng nghiệp cho học sinh cấp 2, cấp 3 tại Việt Nam.
Dựa trên câu trả lời của học sinh, hệ thống gợi ý ngành nghề phù hợp, khối thi tương ứng và lộ trình học tập.

## Công nghệ

- **Next.js** (App Router + TypeScript + Tailwind CSS)
- **Google Gemini** (hỗ trợ xoay vòng nhiều API key khi key trước hết quota/bị khóa)
- Dữ liệu khối thi / ngành nghề / trường ĐH dạng JSON trong thư mục `data/`

## Cách chạy

1. Cài Node.js (bản 20 trở lên).
2. Tạo API key miễn phí tại <https://aistudio.google.com/apikey>.
3. Tạo file `.env.local` (sao chép từ `.env.local.example`) và dán key vào:
   ```
   GEMINI_API_KEY=key_cua_ban
   ```
   Có thể thêm `GEMINI_API_KEY_2..20` (key của account Google khác) hoặc gộp
   nhiều key vào một biến `GEMINI_API_KEYS=key1,key2,...` để tự động xoay vòng
   khi key trước hết quota hoặc bị khóa.
4. Cài dependencies và chạy:
   ```bash
   npm install
   npm run dev
   ```
5. Mở <http://localhost:3000> và trải nghiệm.

> **Thời gian phản hồi:** mỗi lần tư vấn mất khoảng **20–90 giây**. App tự động thử lần lượt các model dự phòng (`GEMINI_MODEL_FALLBACK`) và xoay vòng API key nếu key đầu bị quá tải hoặc hết quota. Có thể đổi model trong `GEMINI_MODEL` ở `.env.local`.
>
> **Streaming (SSE):** the chat bot streams its reply token by token, and the career form
> shows live status updates ("Đọc dữ liệu…", "Viết phân tích…") while the AI works.
> The non-streaming JSON endpoints still work for API clients (just omit `stream: true`).

## Cấu trúc

```
data/                 Dữ liệu: khối thi, ngành nghề, trường ĐH (cần kiểm chứng thêm)
lib/
  ai.ts               Gọi Gemini, ép JSON đúng schema
  prompt.ts           System prompt chuyên gia tư vấn + bối cảnh dữ liệu
  data.ts             Đọc dữ liệu JSON
  types.ts            Kiểu dữ liệu dùng chung
app/
  api/consult/route.ts  API tư vấn (web và app mobile tương lai đều dùng chung)
  components/           Giao diện form + kết quả
```

## Điểm chuẩn trường ĐH — lưu ý

Điểm chuẩn trong `data/truong-dh.json` chỉ mang tính **tham khảo** từ các năm gần đây,
thay đổi hằng năm. Trước khi dùng chính thức, hãy đối chiếu với website của từng trường.

## Deploy lên Vercel (miễn phí)

1. Đẩy project lên GitHub.
2. Vào <https://vercel.com/new>, import repo.
3. Trong phần Environment Variables, thêm `GEMINI_API_KEY` (và tùy chọn `GEMINI_API_KEY_2..20`, `GEMINI_API_KEYS`, `GEMINI_MODEL`, `GEMINI_MODEL_FALLBACK`).
4. Deploy — Gemini có hạn mức miễn phí đủ dùng cho demo; thêm nhiều key để tránh gián đoạn khi hết quota.

## App mobile (kế hoạch tương lai)

Khi phát triển app mobile, chỉ cần dùng lại API `/api/consult` — không phải viết lại logic.