# Kiến trúc hệ thống

Tài liệu mô tả hệ thống như nó đang được hiện thực trong mã nguồn, không phải như thiết kế mong muốn. Mọi con số ở đây lấy từ cấu hình trong mã.

---

## 1. Tổng quan

Mục tiêu kiến trúc: buộc một mô hình ngôn ngữ lớn trả lời trong khuôn khổ một kho dữ liệu hướng nghiệp đã kiểm duyệt, đồng thời giữ được khả năng đo lường mức độ tuân thủ mà không ảnh hưởng người dùng thật.

Bốn tầng, xếp theo chiều dữ liệu đi qua:

```
┌──────────────────────────────────────────────────────────────┐
│ 1. DỮ LIỆU                                                   │
│    data/khoi-thi.json · data/nganh-nghe.json · data/truong-dh│
│    + scripts/kiem-tra-data.mjs  (kiểm tra hợp lệ và nguồn)   │
└───────────────────────────┬──────────────────────────────────┘
                            │ đọc, lọc theo lớp
┌───────────────────────────▼──────────────────────────────────┐
│ 2. NEO DỮ LIỆU (lib/prompt.ts)                               │
│    buildGroundingContext(form)  → ngữ cảnh đã chọn lọc       │
│    buildSystemPrompt(cheDo)     → ràng buộc + schema         │
│    buildUserPrompt(form)        → hồ sơ học sinh             │
└───────────────────────────┬──────────────────────────────────┘
                            │ prompt
┌───────────────────────────▼──────────────────────────────────┐
│ 3. GỌI MODEL (lib/ai.ts)                                     │
│    danhSachModelGemini()     → model chính + dự phòng        │
│    callGemini() · vòng key × model (xoay API key)            │
│    deadline tuyệt đối · timeout từng model · phân loại lỗi   │
└───────────────────────────┬──────────────────────────────────┘
                            │ chuỗi JSON
┌───────────────────────────▼──────────────────────────────────┐
│ 4. HẬU KIỂM VÀ GHI LOG (lib/eval-log.ts)                     │
│    parseResult() → ApiResult                                 │
│    kiemTraGrounding() → đếm khối hợp lệ, trường khớp dữ liệu │
│    ghiLogConsult() → JSONL ẩn danh                           │
│    /api/thong-ke  → tổng hợp, có khoá                        │
└──────────────────────────────────────────────────────────────┘
```

Ngoài luồng trên còn một nhánh đo lường độc lập: `scripts/danh-gia-he-thong.mjs` gọi endpoint HTTP từ bên ngoài, không import mã nội bộ, để đo đúng đường đi của người dùng thật.

## 2. Tầng dữ liệu

Ba tệp JSON, mỗi tệp có kiểu tương ứng trong `lib/types.ts`:

| Tệp | Nội dung | Hiện trạng |
| --- | --- | --- |
| `data/khoi-thi.json` | Danh mục tổ hợp môn thi | Mã khối dùng làm tập hợp lệ khi hậu kiểm |
| `data/nganh-nghe.json` | Ngành nghề, mô tả, khối phù hợp, trường tiêu biểu | 74 ngành |
| `data/truong-dh.json` | Trường đại học, mã trường, địa bàn | 30 trường |

`scripts/kiem-tra-data.mjs` kiểm tra cấu trúc, kiểm tra chéo tham chiếu (ngành trỏ tới trường có tồn tại không, mã khối có thuộc danh mục không) và kiểm tra nguồn. Kết quả hiện tại: **74/74 ngành đạt kiểm tra nguồn, trạng thái SẠCH**, kèm 8 cảnh báo mã khối chưa có trường nào phủ (`A16, B01, C20, D08, D10, D15, H00, V00`).

Cách xử lý cảnh báo là một quyết định thiết kế có chủ ý: mã khối chưa được phủ vẫn giữ trong danh mục hợp lệ, vì đó là tổ hợp thi hợp pháp theo quy chế, chỉ là kho dữ liệu hiện chưa có ngành nào yêu cầu. Xoá chúng đi sẽ làm tập hợp lệ hẹp hơn thực tế và khiến hậu kiểm báo sai.

Tầng dữ liệu **không** gọi mạng. Toàn bộ dữ liệu nằm trong repo, đọc lúc khởi động, nên phần lõi chạy được khi mất mạng — trừ bước gọi model.

## 3. Tầng neo dữ liệu

Đây là phần quyết định chất lượng của hệ thống, nằm trong `lib/prompt.ts`.

### 3.1 Chọn ngữ cảnh theo lứa tuổi

`findByLop(lop)` ánh xạ lớp sang nhóm cấp:

- Lớp 6–9 → cấp 2
- Lớp 10–12 → cấp 3

Nhóm cấp quyết định ngành nào được đưa vào ngữ cảnh. Học sinh cấp 2 nhận danh sách ngành rộng hơn để khám phá; học sinh cấp 3 nhận danh sách bám sát việc chọn tổ hợp và nguyện vọng. Cùng một kho dữ liệu, hai góc nhìn.

### 3.2 Xây ngữ cảnh

`buildGroundingContext(form)` chọn các ngành liên quan tới môn mạnh, sở thích và nhóm định hướng của học sinh, rồi kết xuất thành khối văn bản có cấu trúc: tên ngành, mô tả ngắn, khối phù hợp, trường tiêu biểu. Ngữ cảnh chỉ chứa dữ liệu thật từ kho — không có phần "model tự biết".

### 3.3 Ràng buộc trong prompt hệ thống

`buildSystemPrompt(cheDo)` sinh prompt theo chế độ:

- `grounded`: thêm khối `rangBuocDuLieu` — chỉ được dùng ngành, trường, khối có trong ngữ cảnh; không được thêm trường ngoài danh sách; nếu dữ liệu không đủ thì nói rõ là không đủ thay vì suy đoán.
- `baseline`: không chèn ngữ cảnh dữ liệu; vẫn dặn trả JSON theo cùng schema để phép so sánh không bị nhiễu bởi khác biệt định dạng.

`PROMPT_VERSION = "2.0"` được ghi kèm mỗi bản ghi log, để khi đọc lại số liệu cũ biết được chúng sinh ra từ phiên bản prompt nào. Không có phiên bản prompt thì số liệu lịch sử không so sánh được với nhau.

### 3.4 Ép định dạng

Dùng một đường ép duy nhất (Gemini):

- Gemini: dùng `GEMINI_RESPONSE_SCHEMA` khai báo cấu trúc phản hồi, kèm `responseMimeType: "application/json"`. Vì vậy hình dạng cuối cùng vẫn được kiểm tra ở tầng hậu kiểm, không thể tin tuyệt đối vào cờ định dạng.

Hình dạng đích (`ApiResult` trong `lib/types.ts`):

```
gioi_thieu        : string
nghe_nghiep[]     : { ten, do_phu_hop, truong_tieu_bieu[], lo_trinh }
khoi_thi_de_nghi[]: string (mã khối)
loi_khuyen        : string
luu_y             : string
canh_bao?         : string
xu_truong?        : string
```

Chú ý: `lo_trinh` nằm **trong từng ngành**, không phải trường cấp gốc. Đây là điểm dễ hiểu sai khi viết kiểm tra hậu kỳ — một phiên bản harness trước đây đã kiểm sai trường này và báo lỗi giả.

## 4. Tầng gọi model

### 4.1 Chọn nhà cung cấp và xoay API key

Hệ thống chỉ dùng Google Gemini. `danhSachGeminiKey()` gom `GEMINI_API_KEY`, `GEMINI_API_KEY_2..20` và `GEMINI_API_KEYS` (trim, bỏ trùng) thành danh sách client. Nếu không có key nào, lời gọi ném lỗi có hướng dẫn thay vì lỗi mơ hồ.

Vòng lặp ngoài duyệt qua từng key, vòng trong duyệt qua từng model; gặp lỗi khóa/hết quota (`401/403/429`, `resource_exhausted`, `api key not valid`…) thì chuyển sang key kế tiếp, nhờ đó nhiều account Google có thể gánh tải thay nhau.

### 4.2 Danh sách model dự phòng

Danh sách model do cấu hình quyết định, không lấy động từ API. `danhSachModelGemini()` đặt `GEMINI_MODEL` (mặc định `gemini-3.1-flash-lite`) lên đầu, rồi nối thêm các model trong `GEMINI_MODEL_FALLBACK` (phân tách bằng dấu phẩy), bỏ trùng. Nhờ vậy việc đổi model dự phòng chỉ là sửa biến môi trường, không cần build lại logic.

Không có xếp hạng tự động, không cache danh mục, không chặn số model thử: mỗi lượt gọi đi hết danh sách theo thứ tự cho tới khi một model trả về kết quả hợp lệ. Đổi lại, thứ tự trong danh sách chính là thứ tự ưu tiên — model đứng trước được thử trước.

### 4.3 Thử lại và giãn cách

Mỗi lần gọi model được bọc trong `thuLai()`: tối đa 4 lần, chỉ thử lại khi lỗi thuộc nhóm tạm thời (`laLoiTamThoi`). Giữa các lần chờ theo cấp số nhân `800 × 2^lần + nhiễu ngẫu nhiên 0–300 ms`, để lỗi mạng chớp nhoáng tự khỏi mà không dội thêm tải lên model đang quá tải.

Lỗi cứng (sai khoá, sai yêu cầu) không thử lại — chuyển thẳng sang bước xử lý lỗi bên dưới.

### 4.4 Phân loại lỗi

Sau khi hết lượt thử lại, thông điệp lỗi được phân hai nhánh:

- **Lỗi khoá/hết quota** (`401/403/429`, `resource_exhausted`, `api key not valid`, `user not found`…): `laLoiKhoa` báo đúng → thoát vòng model của key hiện tại, sang key kế tiếp.
- **Lỗi cứng của model** (không thuộc nhóm tạm thời): thoát vòng model hiện tại, thử model kế tiếp trong danh sách.

Khi mọi key và model đều thất bại, `thongBaoLoiGemini()` đổi lỗi thô thành câu thân thiện: bị giới hạn tốc độ → "đang giới hạn tốc độ, thử lại sau ít giây"; quá tải → "đang quá tải, thử lại sau ít giây"; lỗi khoá → nhắc kiểm tra `GEMINI_API_KEY`; còn lại trả nguyên văn lỗi. Thông điệp mơ hồ kiểu "đã xảy ra lỗi" bị loại bỏ vì không giúp người dùng quyết định có nên thử lại hay không.

### 4.5 Chấm điểm ngành (đường không dùng LLM)

`getCareerAdvice` có một nhánh chấm điểm cục bộ, không gọi model:

```
+2  mỗi môn mạnh khớp với ngành
+1  mỗi sở thích khớp với ngành
+1  nếu ngành phù hợp với nhóm cấp của học sinh
 1  nếu không có tín hiệu nào (điểm nền, không phải 0)
```

Khớp từ dùng `chuanHoaTu` (bỏ dấu, tách từ) và `khopTu` (so khớp theo ranh giới từ, tránh "toán" khớp nhầm trong "toán học ứng dụng" khi không nên). Nhánh này vừa là đường dự phòng khi model hỏng, vừa là mốc so sánh nội bộ.

## 5. Tầng hậu kiểm và ghi log

### 5.1 Hậu kiểm

`kiemTraGrounding()` đếm bốn thứ trên mỗi kết quả:

```
so_khoi_goi_y   : số mã khối model đề xuất
so_khoi_hop_le  : số mã khối thuộc danh mục
so_truong_goi_y : số tên trường model nêu
so_truong_khop_data : số tên trường khớp kho dữ liệu
```

Phép khớp trường: chuẩn hoá (bỏ dấu, gộp khoảng trắng), rồi so tuyệt đối hoặc quan hệ bao hàm hai chiều (một tên chứa tên kia). Bao hàm hai chiều để chấp nhận biến thể như "Đại học Bách khoa Hà Nội" và "Bách khoa Hà Nội".

Đây là phép đo cốt lõi của đề tài. Nó không cần LLM, không cần người chấm, và chạy lại cho cùng kết quả.

### 5.2 Ghi log

`lib/eval-log.ts` ghi hai tệp JSONL trong `data/.danh-gia/`:

- `consult.jsonl`: mỗi lượt tư vấn — hình dạng hồ sơ đã ẩn danh, chế độ, phiên bản prompt, bốn chỉ số grounding, thời gian, loại lỗi.
- `danh-gia.jsonl`: phản hồi người dùng (thang 1–5), chỉ là bằng chứng phụ.

Mọi hàm ghi log **nuốt lỗi**. Ghi log hỏng không được làm hỏng lượt tư vấn của người dùng. Đây là đánh đổi có ý thức: mất một dòng số liệu rẻ hơn mất một lượt dùng.

### 5.3 Tổng hợp

`docThongKe()` đọc log và tính: tổng lượt, tỉ lệ JSON hợp lệ, tỉ lệ khối hợp lệ, tỉ lệ trường khớp, phân vị 50/95 thời gian, độ lệch chuẩn, phân bố theo chế độ, và phân loại lỗi theo nhóm.

## 6. Cổng đo lường

Nhánh `baseline` là thứ không được phép xuất hiện trong production. Nó được khoá bằng hai điều kiện đồng thời:

1. Biến môi trường `CHO_PHEP_DO_LUONG=1`.
2. Giá trị `che_do` trong body thuộc `{"grounded", "baseline"}`.

Thiếu một trong hai, route bỏ qua `che_do` và chạy như bình thường. Mỗi bản ghi log đều mang `che_do` và `prompt_version`, nên số liệu đo không bao giờ bị lẫn với lưu lượng thật mà không phân biệt được.

Cách làm này giữ nguyên một đường mã cho cả production và thực nghiệm, thay vì nhân đôi route. Nhân đôi route sẽ khiến hai đường trôi khỏi nhau theo thời gian, và kết quả đo sẽ không còn nói gì về hệ thống thật.

## 7. Endpoint và giới hạn

| Endpoint | Chức năng |
| --- | --- |
| `/api/chat` | Hội thoại tự do, streaming |
| `/api/consult` | Tư vấn có cấu trúc, streaming hoặc JSON |
| `/api/danh-gia` | Nhận phản hồi 1–5, làm sạch đầu vào |
| `/api/survey` | Khảo sát |
| `/api/thong-ke` | Tổng hợp số liệu, yêu cầu khoá |

`/api/consult` kiểm tra hồ sơ vào: lớp phải thuộc "Lớp 6" đến "Lớp 12", `mon_manh`/`mon_yeu`/`so_thich` phải là mảng, `tinh_cach` phải là chuỗi. Trường thừa bị bỏ qua, không gây lỗi.

Giới hạn tần suất: 10 lượt tư vấn mỗi phút mỗi IP, lưu trong bộ nhớ tiến trình. Đây là giới hạn thô, đủ cho quy mô dùng thật, nhưng là điểm cần thay khi chạy nhiều tiến trình — đã ghi nhận, chưa sửa vì ngoài phạm vi đề tài.

Streaming dùng SSE kèm nhịp tim 3 giây để giữ kết nối qua proxy và để giao diện biết lượt gọi còn sống trong khoảng chờ 20–90 giây.

## 8. Riêng tư

Ba quy tắc cứng:

1. **Không lưu tên, không lưu lớp gắn với danh tính.** Log chỉ chứa hình dạng hồ sơ đã ẩn danh và một mã phiên.
2. **`data/.danh-gia/` nằm trong `.gitignore`.** Số liệu đo không bao giờ vào lịch sử mã nguồn.
3. **`/api/thong-ke` đóng theo mặc định.** Thiếu hoặc sai `THONG_KE_KEY` trả 403, không trả dữ liệu một phần.

Phía trình duyệt, dữ liệu học sinh nằm trong `localStorage` với bốn khoá `hn:chat-history`, `hn:student-context`, `hn:ket-qua-da-luu`, `hn:phien-ma`. Các khoá này là hợp đồng với giao diện hiện có và không được đổi tên khi sửa phần đo lường.

## 9. Bộ đo lường ngoài

`scripts/danh-gia-he-thong.mjs` chạy tách khỏi ứng dụng:

- Sinh 60 hồ sơ tất định (7 lớp × 4 nhóm × 2 mức, cộng 4 hồ sơ trung tính).
- Gọi `POST /api/consult` ở chế độ JSON, lần lượt hai nhánh.
- Khi gặp giới hạn tần suất: chờ 65 giây rồi thử lại, tối đa 4 lần.
- Mặc định nghỉ 1 giây giữa các lượt để không tự bắn vào giới hạn của chính mình.
- Ghi CSV theo nhánh, in bảng so sánh, thoát mã lỗi nếu không có lượt nào thành công.

Ba quyết định đáng ghi lại:

- **Gọi qua HTTP, không import mã.** Đo đúng đường người dùng đi, gồm cả tầng kiểm tra đầu vào và xử lý lỗi.
- **Không loại bỏ lượt lỗi khi tính tỉ lệ.** Loại bỏ sẽ che giấu đúng hiện tượng cần đo.
- **Chấm điểm tất định.** Không dùng LLM để chấm LLM; một vòng lặp tin cậy như vậy làm kết quả không kiểm chứng được.

## 10. Các đánh đổi đã chọn

| Quyết định | Được | Mất | Vì sao chấp nhận |
| --- | --- | --- | --- |
| Một route, hai chế độ qua cổng môi trường | Số liệu đo nói về đúng hệ thống thật | Route phức tạp hơn một chút | Nhân đôi route sẽ trôi khỏi nhau |
| Tối đa 3 model dự phòng | Chặn trần độ trễ | Giảm cơ hội thành công khi cả 3 hỏng | Thử 5 model chậm hơn nhiều, lợi ít |
| Hậu kiểm bằng khớp chuỗi | Rẻ, tất định, chạy lại được | Bỏ sót biến thể tên hợp lệ | Sai lệch theo hướng bảo thủ, không thổi phồng kết quả |
| Giữ mã khối chưa phủ | Tập hợp lệ đúng quy chế | Cảnh báo tồn tại dai dẳng | Xoá đi sẽ làm hậu kiểm báo sai |
| Log nuốt lỗi | Không hỏng trải nghiệm người dùng | Có thể mất dòng số liệu | Mất số liệu rẻ hơn mất lượt dùng |
| Không đặt ngưỡng cho H4 | Không biến hạ tầng thành tiêu chí chất lượng | Báo cáo thiếu một mốc phán xét | Ngưỡng cứng sẽ phản ánh nhà cung cấp, không phản ánh thiết kế |

## 11. Điều hệ thống này không chứng minh

Cần nêu rõ để tránh suy diễn quá mức khi đọc kết quả:

- Không chứng minh lời khuyên hữu ích về mặt sư phạm. Chỉ đo tính tuân thủ dữ liệu và định dạng.
- Không chứng minh mô hình "hiểu" học sinh. Chỉ đo đầu ra có nằm trong khuôn khổ cho phép không.
- Không suy rộng ra ngoài kho dữ liệu 30 trường, 74 ngành. Tỉ lệ khớp chỉ có nghĩa trong phạm vi này.
- Không chứng minh hệ thống chịu được tải lớn. Giới hạn tần suất là bộ nhớ tiến trình, phù hợp quy mô thử nghiệm.
