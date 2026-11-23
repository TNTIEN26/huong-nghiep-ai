# Đề cương nghiên cứu

**Tên đề tài:** Hệ thống tư vấn hướng nghiệp ứng dụng mô hình ngôn ngữ lớn có neo dữ liệu (grounding) và kiểm chứng tự động

**Lĩnh vực dự thi:** Hệ thống phần mềm
**Cấp dự thi:** Cấp tỉnh
**Thời gian thực hiện:** tháng 11

---

## 1. Lý do chọn đề tài

Học sinh trung học phổ thông phải chọn tổ hợp môn và ngành học ở độ tuổi chưa có nhiều trải nghiệm nghề nghiệp. Các kênh tư vấn hiện có thường rơi vào hai cực: hoặc là bài trắc nghiệm tính cách cho ra một nhãn chung chung, hoặc là tư vấn viên trao đổi trực tiếp với số lượng học sinh rất hạn chế.

Mô hình ngôn ngữ lớn (LLM) hứa hẹn lấp khoảng trống này vì có thể đối thoại tự nhiên và cá nhân hoá. Tuy nhiên khi dùng LLM cho tư vấn hướng nghiệp tại Việt Nam, ba vấn đề kỹ thuật xuất hiện ngay:

1. **Ảo giác dữ liệu.** Model có thể sinh ra ngành học không tồn tại, hoặc trường không đào tạo ngành đó. Với học sinh, thông tin sai về trường và ngành là lỗi nghiêm trọng vì ảnh hưởng trực tiếp đến quyết định đăng ký nguyện vọng.
2. **Lệch chuẩn định dạng.** Ứng dụng cần dữ liệu có cấu trúc để hiển thị (danh sách ngành, khối thi, trường tiêu biểu). Đầu ra văn bản tự do không dùng được cho giao diện.
3. **Khó kiểm chứng.** Một câu trả lời "nghe hợp lý" không chứng minh được là đúng. Cần cơ chế đo lường thay vì đánh giá cảm tính.

Đề tài không đặt mục tiêu xây một chatbot tư vấn hay hơn về mặt hội thoại, mà đặt mục tiêu **xây một kiến trúc phần mềm buộc LLM trả lời trong khuôn khổ dữ liệu đã kiểm duyệt, và đo được mức độ tuân thủ đó bằng chỉ số tự động**. Đây là bài toán hệ thống phần mềm: thiết kế ràng buộc, thiết kế kiểm chứng, thiết kế đo lường.

## 2. Mục tiêu nghiên cứu

**Mục tiêu tổng quát:** Thiết kế, hiện thực và đánh giá một hệ thống tư vấn hướng nghiệp trong đó đầu ra của LLM bị ràng buộc bởi một tập dữ liệu ngành–trường–khối thi đã kiểm duyệt tại địa phương, và mức độ ràng buộc được định lượng bằng thực nghiệm so sánh với LLM không ràng buộc.

**Mục tiêu cụ thể:**

1. Xây dựng kho dữ liệu hướng nghiệp có cấu trúc, có kiểm tra tính hợp lệ và nguồn tham chiếu.
2. Thiết kế tầng neo dữ liệu (grounding) nằm giữa dữ liệu và LLM: chọn lọc ngữ cảnh theo hồ sơ học sinh, ép định dạng đầu ra, và kiểm tra hậu kiểm.
3. Xây dựng bộ công cụ đo lường tự động: sinh hồ sơ kiểm thử cố định, gọi hệ thống ở hai nhánh (có neo dữ liệu / không neo dữ liệu), chấm điểm bằng script tất định.
4. Đánh giá bốn chỉ số: tỉ lệ phân tích JSON thành công, tỉ lệ mã khối thi hợp lệ, tỉ lệ trường xuất hiện trong dữ liệu, và phân bố thời gian phản hồi.

**Ngoài phạm vi:** không đánh giá độ "hay" của lời khuyên, không đo mức độ hài lòng của học sinh bằng bảng hỏi, không so sánh với tư vấn viên con người. Các yếu tố đó cần thiết kế nghiên cứu định tính riêng và không phù hợp với thời lượng ba tuần.

## 3. Câu hỏi nghiên cứu

- **CH1:** Khi bị ràng buộc bởi ngữ cảnh dữ liệu đã kiểm duyệt và schema đầu ra, LLM có duy trì được định dạng máy đọc được không, và tỉ lệ đó là bao nhiêu?
- **CH2:** Việc neo dữ liệu có làm tăng tỉ lệ trường/ngành mà model nêu ra thực sự tồn tại trong kho dữ liệu hay không, so với cùng model khi không neo?
- **CH3:** Chi phí của ràng buộc (thời gian phản hồi, tỉ lệ lỗi) là bao nhiêu, và có nằm trong ngưỡng dùng được cho một ứng dụng web tương tác không?

## 4. Giả thuyết

| Mã | Giả thuyết | Chỉ số | Ngưỡng chấp nhận |
| --- | --- | --- | --- |
| H1 | Đầu ra phân tích được thành JSON hợp lệ ở phần lớn lượt gọi | `json_hop_le` | ≥ 95% |
| H2 | Mã khối thi model đề xuất nằm trong danh mục hợp lệ | `khoi_hop_le` | ≥ 95% |
| H3 | Trường model nêu ra khớp với kho dữ liệu, và tỉ lệ này cao hơn nhánh không neo | `truong_khop_data` | ≥ 90% và > baseline |
| H4 | Thời gian phản hồi đủ nhanh cho giao diện hội thoại | p50/p95 latency | chỉ ghi nhận, không đặt ngưỡng |

H4 cố ý không đặt ngưỡng: model miễn phí có độ trễ biến động lớn do hàng đợi phía nhà cung cấp, nên một ngưỡng cứng sẽ phản ánh hạ tầng hơn là chất lượng thiết kế. Số liệu được báo cáo đầy đủ để người đọc tự đánh giá.

## 5. Phương pháp nghiên cứu

### 5.1 Đối tượng và biến

Đơn vị thực nghiệm là **một lượt tư vấn** (một hồ sơ học sinh đưa vào, một kết quả trả ra). Biến độc lập duy nhất là **chế độ gọi**:

- `grounded`: hệ thống chèn ngữ cảnh dữ liệu đã lọc theo hồ sơ, ép schema đầu ra, và hậu kiểm.
- `baseline`: cùng model, cùng hồ sơ, nhưng không chèn ngữ cảnh dữ liệu; chỉ dặn model trả JSON theo cùng schema để phép so sánh không bị nhiễu bởi khác biệt định dạng.

Giữ nguyên model, tham số sinh, hồ sơ đầu vào và cách chấm điểm giữa hai nhánh. Đây là thiết kế trong–đối tượng (within-subject) để khử biến thiên giữa các hồ sơ.

### 5.2 Bộ hồ sơ kiểm thử

Bộ hồ sơ được sinh tất định bằng vòng lặp trong script, không dùng số ngẫu nhiên, để lần chạy sau tái lập đúng lần chạy trước:

- 7 lớp (Lớp 6 đến Lớp 12) × 4 nhóm định hướng (kỹ thuật, xã hội, sức khoẻ, kinh doanh) × 2 mức hồ sơ (rõ ràng / mơ hồ) = 56 hồ sơ.
- Cộng 4 hồ sơ "trung bình" không thiên về nhóm nào, dùng để kiểm tra hành vi khi tín hiệu yếu.
- Tổng: **60 hồ sơ cố định**, nhân hai nhánh thành **120 lượt gọi**.

Nếu điều kiện hạ tầng không cho phép chạy đủ, script hỗ trợ giảm xuống 40 hồ sơ; việc giảm được ghi rõ trong báo cáo kết quả kèm lý do, không cắt lặng lẽ.

### 5.3 Quy trình thu thập

Harness chạy ngoài ứng dụng, gọi endpoint HTTP ở chế độ không streaming. Lý do không import trực tiếp mã TypeScript: harness phải đo đúng đường đi mà người dùng thật đi qua, gồm cả tầng kiểm tra dữ liệu vào, giới hạn tần suất và xử lý lỗi của route. Đo ở tầng hàm nội bộ sẽ bỏ qua các tầng này.

Mỗi lượt gọi được ghi lại: mã hồ sơ, chế độ, thời gian, mã trạng thái HTTP, cờ JSON hợp lệ, số khối đề xuất, số khối hợp lệ, số trường đề xuất, số trường khớp dữ liệu, và loại lỗi nếu có. Kết quả ghi ra CSV theo từng nhánh.

### 5.4 Chấm điểm

Chấm điểm hoàn toàn tất định, không dùng LLM để chấm LLM (tránh vòng lặp tin cậy). Ba phép kiểm tra:

1. **Phân tích JSON:** thử `JSON.parse` trên nội dung trả về.
2. **Khối thi hợp lệ:** mỗi mã khối trong `khoi_thi_de_nghi` phải thuộc danh mục khối thi của kho dữ liệu.
3. **Trường khớp dữ liệu:** mỗi tên trường trong các ngành gợi ý phải khớp (sau khi bỏ dấu, chuẩn hoá khoảng trắng) với một trường trong kho dữ liệu, theo khớp tuyệt đối hoặc quan hệ bao hàm hai chiều.

Phép kiểm tra thứ ba là phép đo trung tâm của đề tài: nó biến câu hỏi "model có bịa trường không" thành một con số đếm được.

### 5.5 Phân tích

Với mỗi nhánh, tính tỉ lệ trên toàn bộ lượt gọi (không loại bỏ lượt lỗi — loại bỏ sẽ che giấu đúng thứ cần đo), phân vị 50 và 95 của thời gian phản hồi, độ lệch chuẩn, và phân loại lỗi theo nhóm (định dạng, dữ liệu, vận chuyển, giới hạn tần suất). So sánh hai nhánh theo từng chỉ số và theo từng nhóm hồ sơ.

## 6. Kiến trúc hệ thống (tóm tắt)

Chi tiết ở `kien-truc.md`. Bốn tầng:

1. **Tầng dữ liệu:** ba tệp JSON (khối thi, ngành nghề, trường đại học) kèm script kiểm tra tính hợp lệ và nguồn tham chiếu. Hiện trạng: 30 trường, 74 ngành, toàn bộ 74 ngành đạt kiểm tra nguồn; 8 mã khối chưa có trường nào phủ được ghi nhận là cảnh báo, không phải lỗi.
2. **Tầng neo dữ liệu:** chọn ngữ cảnh theo lớp và nhóm định hướng của học sinh, chèn vào prompt hệ thống kèm ràng buộc "chỉ dùng dữ liệu được cung cấp", và ép schema JSON đầu ra.
3. **Tầng gọi model:** hàng đợi model dự phòng có giới hạn, thời hạn tuyệt đối cho cả lượt gọi, phân loại lỗi để quyết định dừng hay thử model kế tiếp.
4. **Tầng kiểm chứng và ghi log:** hậu kiểm kết quả, ghi log ẩn danh, tổng hợp chỉ số, và một cổng đo lường chỉ bật khi có biến môi trường cho phép.

## 7. Kế hoạch thực hiện

| Tuần | Nội dung | Sản phẩm |
| --- | --- | --- |
| 1 | Hoàn thiện tầng neo dữ liệu, schema, và cổng đo lường; rà soát kho dữ liệu | Mã nguồn ổn định, dữ liệu sạch |
| 2 | Chạy thực nghiệm hai nhánh, xử lý lỗi hạ tầng, tổng hợp số liệu | CSV thô, bảng chỉ số |
| 3 | Viết báo cáo, dựng video demo dự phòng, chuẩn bị phần trả lời phản biện | Báo cáo, video, slide |

Video demo dự phòng là hạng mục bắt buộc, không phải tuỳ chọn: hệ thống phụ thuộc dịch vụ model bên ngoài, nên phần trình diễn tại hội thi không được phép phụ thuộc mạng.

## 8. Đóng góp dự kiến

1. **Về kỹ thuật:** một mẫu kiến trúc neo dữ liệu + hậu kiểm cho bài toán tư vấn có ràng buộc dữ liệu địa phương, kèm cách tách cổng đo lường khỏi luồng production để không ảnh hưởng người dùng thật.
2. **Về phương pháp:** một bộ harness đo lường tất định, chạy được lặp lại, không dùng LLM để chấm LLM — có thể tái sử dụng cho các bài toán "LLM trả lời trong khuôn khổ dữ liệu" khác.
3. **Về thực tiễn:** một kho dữ liệu ngành–trường–khối thi có kiểm tra nguồn, dùng được cho học sinh trong tỉnh.

## 9. Hạn chế và rủi ro

- **Phụ thuộc nhà cung cấp model.** Model miễn phí có thể quá tải hoặc ngừng cung cấp giữa chừng. Giảm thiểu: hàng đợi model dự phòng, script có cơ chế thử lại, và video demo dự phòng. Rủi ro còn lại: số lượt gọi thành công có thể thấp hơn dự kiến trong một đợt chạy; khi đó chạy rải nhiều đợt và báo cáo rõ.
- **Quy mô dữ liệu.** 30 trường và 74 ngành là đủ để chứng minh cơ chế nhưng chưa phủ toàn quốc. Kết luận về tỉ lệ khớp dữ liệu chỉ có hiệu lực trong phạm vi kho dữ liệu này.
- **Phép đo khớp tên trường.** Khớp chuỗi sau khi bỏ dấu không bắt được cách gọi tên khác biệt hợp lệ (ví dụ viết tắt). Điều này làm chỉ số H3 có xu hướng **đánh giá thấp** hệ thống, không phải đánh giá cao — hướng sai lệch này chấp nhận được vì bảo thủ.
- **Không đo được chất lượng lời khuyên.** Đề tài đo tính tuân thủ dữ liệu và định dạng, không đo tính hữu ích sư phạm. Cần nêu rõ để tránh suy diễn quá mức từ kết quả.

## 10. Tài liệu tham khảo

- Lewis, P. và cộng sự. *Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks.* NeurIPS 2020.
- Ji, Z. và cộng sự. *Survey of Hallucination in Natural Language Generation.* ACM Computing Surveys, 2023.
- Tài liệu Google Gemini API (structured output, response schema, giới hạn tốc độ theo khoá).
- Tài liệu Next.js App Router và React 19.
