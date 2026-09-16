# Trợ lý AI định hướng nghề nghiệp & chọn khối thi

Trợ lý AI đóng vai chuyên gia tư vấn hướng nghiệp cho học sinh cấp 2, cấp 3 tại Việt Nam.
Dựa trên câu trả lời của học sinh, hệ thống gợi ý ngành nghề phù hợp, khối thi tương ứng và lộ trình học tập.

## Công nghệ

- **Next.js** (App Router + TypeScript + Tailwind CSS)
- **OpenRouter** (mặc định — key miễn phí, chạy cả một số model miễn phí), hoặc **Google Gemini** để dự phòng
- Dữ liệu khối thi / ngành nghề / trường ĐH dạng JSON trong thư mục `data/`

## Cách chạy

1. Cài Node.js (bản 20 trở lên).
2. Tạo key miễn phí tại <https://openrouter.ai/keys> (đăng nhập Google là xong).
3. Tạo file `.env.local` (sao chép từ `.env.local.example`) và dán key vào:
   ```
   AI_PROVIDER=openrouter
   OPENROUTER_API_KEY=key_cua_ban
   ```
4. Cài dependencies và chạy:
   ```bash
   npm install
   npm run dev
   ```
5. Mở <http://localhost:3000> và trải nghiệm.

> **Thời gian phản hồi:** mỗi lần tư vấn mất khoảng **20–90 giây** (model AI miễn phí sinh văn bản chậm hơn model trả phí). App tự động thử lần lượt nhiều model nếu model đầu bị quá tải. Có thể đổi thứ tự/ thêm model trong `OPENROUTER_MODEL` ở `.env.local`.
>
> **Nếu muốn đổi sang Google Gemini:** trong `.env.local` đặt `AI_PROVIDER=gemini`
> và thêm `GEMINI_API_KEY`. Lưu ý: từ giữa 2026 Google cấp key dạng mới `AQ.`
> và hiện có lỗi khiến nhiều key bị từ chối (`API key not valid`).

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
3. Trong phần Environment Variables, thêm `AI_PROVIDER=openrouter` và `OPENROUTER_API_KEY` = key của bạn.
4. Deploy — có nhiều model miễn phí trên OpenRouter đủ dùng cho demo.

## App mobile (kế hoạch tương lai)

Khi phát triển app mobile, chỉ cần dùng lại API `/api/consult` — không phải viết lại logic.