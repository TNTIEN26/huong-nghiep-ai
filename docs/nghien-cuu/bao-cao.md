# Báo cáo đề tài

**Tên đề tài:** Hệ thống tư vấn hướng nghiệp ứng dụng mô hình ngôn ngữ lớn có neo dữ liệu (grounding) và kiểm chứng tự động

**Lĩnh vực dự thi:** Hệ thống phần mềm — **Cấp dự thi:** Cấp tỉnh
**Thời gian thực hiện:** tháng 11

Tài liệu kèm theo: `de-cuong.md` (thiết kế nghiên cứu), `kien-truc.md` (kiến trúc chi tiết), `ket-qua.md` (số liệu thực nghiệm đầy đủ). Báo cáo này tóm lược toàn bộ: thiết kế, hiện thực, kết quả đo lường và kết luận.

---

## 1. Lý do chọn đề tài

Học sinh THPT phải chọn tổ hợp môn và ngành học ở độ tuổi chưa có nhiều trải nghiệm nghề nghiệp. Các kênh tư vấn hiện có thường rơi vào hai cực: hoặc là bài trắc nghiệm tính cách cho ra một nhãn chung chung, hoặc là tư vấn viên trao đổi trực tiếp với số lượng học sinh rất hạn chế.

Mô hình ngôn ngữ lớn (LLM) hứa hẹn lấp khoảng trống này vì đối thoại tự nhiên và cá nhân hoá được. Nhưng khi dùng LLM cho tư vấn hướng nghiệp tại Việt Nam, ba vấn đề kỹ thuật xuất hiện ngay:

1. **Ảo giác dữ liệu.** Model có thể sinh ra ngành học không tồn tại, hoặc trường không đào tạo ngành đó. Thông tin sai về trường và ngành ảnh hưởng trực tiếp đến quyết định đăng ký nguyện vọng của học sinh — đây là lỗi nghiêm trọng.
2. **Lệch chuẩn định dạng.** Ứng dụng cần dữ liệu có cấu trúc để hiển thị (danh sách ngành, khối thi, trường tiêu biểu). Đầu ra văn bản tự do không dùng được cho giao diện.
3. **Khó kiểm chứng.** Một câu trả lời "nghe hợp lý" không chứng minh được là đúng. Cần cơ chế đo lường thay vì đánh giá cảm tính.

Đề tài không đặt mục tiêu xây một chatbot "hay hơn" về mặt hội thoại, mà đặt mục tiêu **xây một kiến trúc phần mềm buộc LLM trả lời trong khuôn khổ dữ liệu đã kiểm duyệt, và đo được mức độ tuân thủ đó bằng chỉ số tự động**. Đây là bài toán hệ thống phần mềm: thiết kế ràng buộc, thiết kế kiểm chứng, thiết kế đo lường.

## 2. Mục tiêu

**Mục tiêu tổng quát:** Thiết kế, hiện thực và đánh giá một hệ thống tư vấn hướng nghiệp trong đó đầu ra của LLM bị ràng buộc bởi một tập dữ liệu ngành–trường–khối thi đã kiểm duyệt tại địa phương, và mức độ ràng buộc được định lượng bằng thực nghiệm so sánh với chính model đó khi không bị ràng buộc.

**Mục tiêu cụ thể:**

1. Xây dựng kho dữ liệu hướng nghiệp có cấu trúc, có kiểm tra tính hợp lệ và nguồn tham chiếu.
2. Thiết kế tầng neo dữ liệu (grounding) nằm giữa dữ liệu và LLM: chọn lọc ngữ cảnh theo hồ sơ học sinh, ép định dạng đầu ra, hậu kiểm.
3. Xây dựng bộ công cụ đo lường tự động: sinh hồ sơ kiểm thử cố định, gọi hệ thống ở hai nhánh, chấm điểm bằng script tất định.
4. Đánh giá bốn chỉ số: tỉ lệ JSON phân tích được, tỉ lệ mã khối thi hợp lệ, tỉ lệ trường tồn tại trong kho dữ liệu, phân bố thời gian phản hồi.

**Ngoài phạm vi:** không đánh giá độ "hay" của lời khuyên, không đo mức độ hài lòng của học sinh, không so sánh với tư vấn viên con người. Những yếu tố đó cần nghiên cứu định tính riêng và không phù hợp với thời lượng thực hiện.

## 3. Câu hỏi nghiên cứu và giả thuyết

| Mã | Nội dung | Chỉ số | Ngưỡng |
| --- | --- | --- | --- |
| CH1 | LLM bị ràng buộc có duy trì được định dạng máy đọc được không? | `json_hop_le` (H1) | ≥ 95% |
| CH2 | Neo dữ liệu có làm tăng tỉ lệ trường model nêu ra mà thực sự tồn tại trong kho dữ liệu? | `truong_khop_data` (H3) | ≥ 90% và > nhánh đối chứng |
| CH3 | Chi phí của ràng buộc (thời gian, tỉ lệ lỗi) là bao nhiêu, có dùng được cho web tương tác không? | p50/p95 latency (H4), lỗi | H4 chỉ ghi nhận |

Chỉ số phụ `khoi_hop_le` (H2, ≥ 95%) kiểm soát rủi ro định dạng về mã khối thi. H4 cố ý không đặt ngưỡng vì model miễn phí có độ trễ biến động do hàng đợi phía nhà cung cấp — một ngưỡng cứng sẽ phản ánh hạ tầng hơn là chất lượng thiết kế.

## 4. Phương pháp

### 4.1 Thiết kế

Đơn vị thực nghiệm là **một lượt tư vấn** (một hồ sơ vào, một kết quả ra). Biến độc lập duy nhất là **chế độ gọi**:

- `grounded`: hệ thống chèn ngữ cảnh dữ liệu đã lọc theo hồ sơ, ép schema đầu ra, hậu kiểm.
- `baseline`: cùng model, cùng hồ sơ, cùng schema — nhưng không chèn ngữ cảnh dữ liệu.

Thiết kế trong–đối tượng (within-subject): giữ nguyên model (`gemini-3.1-flash-lite`), tham số sinh, hồ sơ đầu vào và cách chấm điểm giữa hai nhánh, nên khác biệt thu được quy về đúng biến đang đo.

Bộ hồ sơ sinh **tất định** (không dùng số ngẫu nhiên) để lần chạy sau tái lập đúng lần trước: 7 lớp (6–12) × 4 nhóm định hướng (kỹ thuật, xã hội, sức khoẻ, kinh doanh) × 2 mức (rõ ràng / mơ hồ) = 56, cộng 4 hồ sơ trung bình không thiên nhóm nào. Tổng **60 hồ sơ × 2 nhánh = 120 lượt gọi**.

### 4.2 Quy trình và chấm điểm

Harness chạy ngoài ứng dụng, gọi endpoint HTTP ở chế độ không streaming — đo đúng đường đi của người dùng thật, gồm cả tầng kiểm tra dữ liệu vào, giới hạn tần suất và xử lý lỗi của route; đo ở tầng hàm nội bộ sẽ bỏ qua các tầng này.

Chấm điểm **hoàn toàn tất định, không dùng LLM để chấm LLM** (tránh vòng lặp tin cậy):

1. **JSON hợp lệ:** thử `JSON.parse` trên nội dung trả về.
2. **Khối thi hợp lệ:** mỗi mã khối đề xuất thuộc danh mục khối của kho dữ liệu.
3. **Trường khớp dữ liệu:** mỗi tên trường khớp (sau bỏ dấu, chuẩn hoá khoảng trắng) với một trường trong kho dữ liệu, theo khớp tuyệt đối hoặc bao hàm hai chiều.

Phép kiểm tra thứ ba là phép đo trung tâm: nó biến câu hỏi "model có bịa trường không" thành một con số đếm được. Tỉ lệ tính trên **toàn bộ lượt gọi**, không loại bỏ lượt lỗi — loại bỏ sẽ che giấu đúng thứ cần đo.

## 5. Kiến trúc hệ thống

Chi tiết ở `kien-truc.md`. Bốn tầng:

1. **Tầng dữ liệu:** ba tệp JSON (khối thi, ngành nghề, trường đại học) kèm script kiểm tra tính hợp lệ và nguồn tham chiếu. Hiện trạng: 30 trường, 74 ngành, toàn bộ 74 ngành đạt kiểm tra nguồn; 8 mã khối chưa có trường nào phủ được ghi nhận là cảnh báo, không phải lỗi.
2. **Tầng neo dữ liệu:** chọn ngữ cảnh theo lớp và nhóm định hướng, chèn vào prompt hệ thống kèm ràng buộc "chỉ dùng dữ liệu được cung cấp", ép schema JSON đầu ra.
3. **Tầng gọi model:** hàng đợi model dự phòng có giới hạn, thời hạn tuyệt đối cho cả lượt gọi, phân loại lỗi để quyết định dừng hay thử model kế tiếp.
4. **Tầng kiểm chứng và ghi log:** hậu kiểm kết quả, ghi log ẩn danh, tổng hợp chỉ số, và một cổng đo lường chỉ bật khi có biến môi trường cho phép (`CHO_PHEP_DO_LUONG`) — tách rời khỏi luồng production để không ảnh hưởng người dùng thật. Kho lưu log hỗ trợ hai chế độ: tệp trên máy (chạy local) hoặc Upstash Redis qua REST (khi triển khai lên nền tảng serverless nơi hệ thống tệp chỉ đọc).

## 6. Kết quả thực nghiệm

Cả 120 lượt đã hoàn thành hoặc được ghi nhận đủ; hai nhánh chạy liên tiếp trong cùng đợt. Toàn bộ số liệu sinh từ CSV thô bằng script tổng hợp, có thể chạy lại.

### 6.1 Bảng chính

| Chỉ số | Grounded | Baseline | Giả thuyết | Kết luận |
| --- | --- | --- | --- | --- |
| JSON hợp lệ | 60/60 (100%) | 56/60 (93.3%) | H1 ≥ 95% | **Đạt** |
| Mã khối thi hợp lệ | 159/159 (100%) | 131/131 (100%) | H2 ≥ 95% | **Đạt** |
| Trường khớp kho dữ liệu | 151/151 (100%) | 146/343 (42.6%) | H3 ≥ 90% và > baseline | **Đạt, chênh lệch rõ** |
| Latency p50 | 4422 ms | 4486 ms | H4 (chỉ ghi nhận) | tương đương |
| Latency p95 | 9384 ms | 41181 ms | H4 (chỉ ghi nhận) | grounded thấp hơn |
| Lỗi vận chuyển | 0/60 | 4/60 | — | §6.3 |

### 6.2 H1 — Định dạng JSON

Grounded 60/60 (100%). Baseline 56/60 (93.3%): cả 4 lượt thất bại đều là HTTP 503 từ nhà cung cấp ("high demand"), tức model không trả nội dung nào; **trên 56 lượt phản hồi được, JSON hợp lệ 56/56**. Schema ép trong prompt hệ thống, kết hợp hậu kiểm và thử lại ở tầng kiến trúc, giữ nhánh grounded ở 100% trong khi nhánh đối chứng chịu trọn cả rủi ro hạ tầng lẫn rủi ro định dạng.

### 6.3 CH3 — Chi phí và lỗi

- p50 hai nhánh gần như trùng nhau (~4,4–4,5 s): chèn ngữ cảnh làm prompt dài hơn nhưng không tăng thời gian phản hồi đáng kể ở cấp dùng được cho giao diện hội thoại.
- p95 và độ lệch chuẩn của baseline cao hơn nhiều, chủ yếu do outlier hạ tầng (2 lượt 41–52 s, max 57,6 s; lượt 503 tính theo thời gian đến khi lỗi). Grounded chỉ có một outlier 26 s.
- Baseline có 4 lượt 503 UNAVAILABLE rải rác giữa đợt chạy, đủ để harness không phục hồi được sau vòng thử lại. Grounded không gặp lượt nào. Lưu ý: grounded chạy trước, baseline chạy sau, nên chênh lệch 503 có thể do biến động tải theo thời điểm — không đảo đợt nên không tách được hai nguồn biến thiên này.

### 6.4 H2 — Mã khối thi

Cả hai nhánh 100% (159/159 và 131/131). Danh mục khối thi là bộ từ vựng nhỏ (8 mã) nên model dễ tuân thủ cả khi không được neo — H2 phân biệt kém giữa hai nhánh, chỉ số này kiểm soát rủi ro định dạng chứ không phải rủi ro ảo giác.

### 6.5 H3 — Trường khớp dữ liệu (phép đo trung tâm)

| Phép đo | Grounded | Baseline |
| --- | --- | --- |
| Tổng trường được nêu | 151 | 343 |
| Trường khớp kho dữ liệu | 151 | 146 |
| Tỉ lệ khớp | **100%** | 42.6% |
| Trung bình mỗi lượt | ~2.5 | ~6.1 |

Baseline không được neo nên nêu **nhiều trường hơn** (343 so với 151) nhưng hơn một nửa không tồn tại trong kho dữ liệu — chính là hiện tượng ảo giác được biến thành con số đếm được: 197 tên trường sai ở nhánh đối chứng so với 0 ở nhánh neo. Baseline sai rải đều mọi nhóm hồ sơ (kỹ thuật 42,7%, xã hội 33,3%, sức khoẻ 33,3%, kinh doanh 60,0%).

Một quan sát đáng chú ý ở nhánh grounded: nhóm học sinh thiên về sức khoẻ nêu 44 mã khối hợp lệ nhưng **0 trường** — model dám im lặng thay vì bịa khi dữ liệu không có trường cụ thể phù hợp. Đây đúng là hành vi mong muốn của ràng buộc "chỉ dùng dữ liệu được cung cấp".

Phân bố theo biến hồ sơ (lớp 6–12, hai mức rõ/mơ hồ, bốn nhóm định hướng) cho thấy **không nhóm nào làm sụt chỉ số của nhánh grounded** — mọi phân đoạn đều đạt 100% trường khớp; hiệu ứng ràng buộc đồng nhất, không phụ thuộc kiểu hồ sơ.

## 7. Kết luận

- **CH1:** Khi bị ràng buộc bởi ngữ cảnh dữ liệu và schema, model duy trì 100% định dạng JSON máy đọc được; nhánh đối chứng chỉ đạt 93.3% trên tổng lượt gửi do lệch hạ tầng.
- **CH2:** Neo dữ liệu nâng tỉ lệ trường nêu ra thực sự tồn tại từ 42.6% lên 100%, đồng thời giảm lượng tên trường sai ra (197 → 0).
- **CH3:** Chi phí của ràng buộc về thời gian là không đáng kể ở mức p50; nhánh neo thậm chí có p95 thấp hơn. Chi phí chính nằm ở rủi ro 503 nhà cung cấp — vốn ảnh hưởng cả hai nhánh và được tầng kiến trúc giảm thiểu.

Ba trong bốn giả thuyết đạt với biên dư rõ; H4 không đặt ngưỡng, phân bố đã báo cáo đầy đủ để người đọc tự đánh giá.

## 8. Đóng góp

1. **Về kỹ thuật:** một mẫu kiến trúc neo dữ liệu + hậu kiểm cho bài toán tư vấn có ràng buộc dữ liệu địa phương, kèm cách tách cổng đo lường khỏi luồng production; tầng log lưu được trên cả hệ thống tệp và Redis cho môi trường serverless.
2. **Về phương pháp:** một bộ harness đo lường tất định, chạy lặp lại được, không dùng LLM để chấm LLM — tái sử dụng được cho các bài toán "LLM trả lời trong khuôn khổ dữ liệu" khác.
3. **Về thực tiễn:** một kho dữ liệu ngành–trường–khối thi có kiểm tra nguồn (30 trường, 74 ngành, 100% ngành đạt kiểm tra nguồn), dùng được cho học sinh trong tỉnh.

## 9. Hạn chế

1. **Một model duy nhất.** Toàn bộ 120 lượt dùng `gemini-3.1-flash-lite`; kết quả không suy rộng sang model khác. Lựa chọn cố ý để khử biến ngoài "chế độ gọi", nhưng phải nêu rõ.
2. **Chênh lệch 503 giữa hai đợt.** Hai nhánh chạy liên tiếp, không đảo đợt; 4 lượt 503 của baseline có thể là biến động tải theo thời điểm chứ không phải do thiết kế.
3. **Free tier.** Giới hạn mỗi phút từng model làm harness đôi khi chờ và thử lại; các lượt đó không vào CSV.
4. **Phép đo khớp chuỗi.** Khớp tên trường sau khi bỏ dấu không bắt được cách gọi khác biệt hợp lệ (viết tắt), làm chỉ số có xu hướng **đánh giá thấp** — hướng sai lệch bảo thủ, chấp nhận được.
5. **Không đo chất lượng lời khuyên.** Tỉ lệ khớp dữ liệu không đồng nghĩa lời khuyên tốt sư phạm; điều đó thuộc nghiên cứu định tính khác.

## 10. Hướng phát triển

1. **Triển khai công khai** (Vercel + Upstash Redis) để học sinh dùng thật; cổng đo lường tắt trên môi trường production.
2. **Thu phản hồi học sinh** qua phiếu ẩn danh (đánh giá độ hữu ích, độ tin cậy cảm nhận) — bổ sung góc nhìn định tính cho phần đo lường tự động.
3. **Mở rộng kho dữ liệu** và đảo đợt chạy hai nhánh trong các đợt tái lập sau để tách biến thời điểm khỏi biến thiết kế.
4. **Đa model:** chạy cùng thiết kế trên thêm một model khác để kiểm tra kết luận CH1–CH3 có bền theo model hay không.

## 11. Tài liệu tham khảo

- Lewis, P. và cộng sự. *Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks.* NeurIPS 2020.
- Ji, Z. và cộng sự. *Survey of Hallucination in Natural Language Generation.* ACM Computing Surveys, 2023.
- Tài liệu Google Gemini API (structured output, response schema).
- Tài liệu Next.js App Router và React 19.
