# Kết quả thực nghiệm

**Bộ dữ liệu:** 60 hồ sơ kiểm thử × 2 nhánh (grounded / baseline) = **120 lượt gọi**, cả 120 lượt đã hoàn thành hoặc được ghi nhận đủ.
**Model:** Google `gemini-3.1-flash-lite` (free tier), cùng model và cùng tham số cho cả hai nhánh.
**Ngày chạy:** tháng 11, hai nhánh chạy liên tiếp trong cùng đợt bằng harness tất định (`scripts/danh-gia-he-thong.mjs`).

> Toàn bộ số liệu dưới đây sinh từ CSV thô `data/.danh-gia/he-thong-grounded.csv` và `he-thong-baseline.csv` bằng `scripts/tong-hop-ket-qua.mjs`; lần chạy lại cho đúng kết quả trên.

## 1. Kết quả chính

| Chỉ số | Nhánh grounded | Nhánh baseline | Giả thuyết | Kết luận |
| --- | --- | --- | --- | --- |
| JSON hợp lệ | 60/60 (100%) | 56/60 (93.3%) | H1 ≥ 95% | **Đạt** |
| Mã khối thi hợp lệ | 159/159 (100%) | 131/131 (100%) | H2 ≥ 95% | **Đạt** |
| Trường khớp kho dữ liệu | 151/151 (100%) | 146/343 (42.6%) | H3 ≥ 90% và > baseline | **Đạt, chênh lệch rõ** |
| Latency p50 | 4422 ms | 4486 ms | H4 (chỉ ghi nhận) | tương đương |
| Latency p95 | 9384 ms | 41181 ms | H4 (chỉ ghi nhận) | grounded thấp hơn |
| Lỗi vận chuyển | 0/60 | 4/60 | — | chi tiết §4 |

Ba trong bốn giả thuyết đạt với biên dư rõ; H4 không đặt ngưỡng nên chỉ ghi nhận phân bố (§3).

## 2. H1 — Tỉ lệ JSON hợp lệ

- Grounded: 60/60 lượt phân tích thành JSON hợp lệ (100%).
- Baseline: 56/60 (93.3%). Trong đó **cả 4 lượt thất bại đều là HTTP 503** do nhà cung cấp ("This model is currently experiencing high demand"), tức model không trả nội dung nào — không có lượt nào model trả lời được mà JSON sai cấu trúc (trên 56 lượt phản hồi được, JSON hợp lệ 56/56).
- Nhận xét: schema ép trong prompt hệ thống của nhánh grounded, kết hợp hậu kiểm và thử lại ở tầng kiến trúc, giữ tỉ lệ 100% trong khi nhánh baseline chịu trọn cả rủi ro hạ tầng lẫn rủi ro định dạng. Nhánh grounded không gặp lượt 503 nào trong đợt chạy này.

## 3. H4 — Thời gian phản hồi

| Đại lượng | Grounded | Baseline |
| --- | --- | --- |
| p50 | 4422 ms | 4486 ms |
| p95 | 9384 ms | 41181 ms |
| trung bình | 5552 ms | 9046 ms |
| độ lệch chuẩn | 3943 ms | 11966 ms |
| max | 26496 ms | 57558 ms |

- p50 của hai nhánh gần như trùng nhau: chèn ngữ cảnh dữ liệu làm prompt dài hơn nhưng không tăng thời gian phản hồi đáng kể ở cấp dùng được cho giao diện hội thoại (~4–5 giây).
- p95 và độ lệch chuẩn của baseline cao hơn nhiều, chủ yếu do outlier hạ tầng (2 lượt 41–52 s, lượt max 57.6 s; lượt 503 bị tính theo thời gian đến khi lỗi). Nhánh grounded chỉ có một outlier 26 s.
- Hạn chế đọc kết luận: model free tier chịu hàng đợi biến động phía nhà cung cấp, phân bố này phản ánh hạ tầng ít nhất là phản ánh thiết kế; theo de-cuong (§4) số liệu chỉ ghi nhận, không đặt ngưỡng.

## 4. Lỗi vận chuyển (CH3)

- Grounded: 0 lượt lỗi.
- Baseline: 4/60 lượt HTTP 503 UNAVAILABLE (HS-24, HS-26, HS-27, HS-35), xảy ra rải rác giữa đợt chạy, đủ để harness không phục hồi được sau vòng thử lại. Phân loại lỗi: nhóm `van_chuyen`, không có lỗi giới hạn tần suất nào được tính (một số lần 429 trong quá trình chạy được harness tự thử lại sau khi chờ, không ảnh hưởng CSV).

Điều này minh hoạ đúng rủi ro nêu ở de-cuong §9: một phần rủi ro phụ thuộc nhà cung cấp, và tầng kiến trúc (hàng đợi model dự phòng, thử lại) là lớp giảm thiểu. Trong đợt chạy này nhánh grounded chạy trước, baseline chạy sau — chênh lệch 503 có thể do biến động tải theo thời gian, không khẳng định được là do thiết kế.

## 5. H2 — Mã khối thi

Cả hai nhánh đạt 100% mã khối hợp lệ (grounded 159/159, baseline 131/131). Danh mục khối thi là bộ từ vựng nhỏ (8 mã), model dễ tuân thủ cả khi không được neo. Nghĩa là H2 phân biệt kém giữa hai nhánh — chỉ số này kiểm soát rủi ro định dạng, không phải rủi ro ảo giác.

## 6. H3 — Trường khớp dữ liệu (phép đo trung tâm)

| Phép đo | Grounded | Baseline |
| --- | --- | --- |
| Tổng trường được nêu | 151 | 343 |
| Trường khớp kho dữ liệu | 151 | 146 |
| Tỉ lệ khớp | 100% | 42.6% |
| Số trường nêu trung bình mỗi lượt | ~2.5 | ~6.1 |

- Baseline không được neo nên **nêu nhiều trường hơn** (343 so với 151) nhưng hơn một nửa trong số đó không tồn tại trong kho dữ liệu — chính là hiện tượng ảo giác mà đề tài muốn biến thành con số đếm được.
- Grounded chỉ nêu những trường có trong ngữ cảnh được chọn lọc nên nói ít nhưng đúng hết (100%).
- Nhóm học sinh suc-khoe ở nhánh grounded: 44 mã khối hợp lệ nhưng **0 trường được nêu** — model dám im lặng thay vì bịa khi ngành/tổ hợp trong dữ liệu không có trường cụ thể phù hợp. Đây là hành vi mong muốn của thiết kế "chỉ dùng dữ liệu được cung cấp".
- Baseline nêu nhầm cả ở mọi nhóm: ky-thuat 41/96 (42.7%), xa-hoi 28/84 (33.3%), suc-khoe 26/78 (33.3%), kinh-doanh 51/85 (60.0%).

### Phân bố theo biến hồ sơ (grounded — tất cả nhóm đều 100% trường khớp)

| Biến | n | JSON | Khối | Trường | p50 ms |
| --- | --- | --- | --- | --- | --- |
| gioi | 28 | 28/28 | 77/77 | 68/68 | 4456 |
| yeu | 28 | 28/28 | 71/71 | 74/74 | 4422 |
| trung-binh | 4 | 4/4 | 11/11 | 9/9 | 4011 |
| ky-thuat | 15 | 15/15 | 30/30 | 42/42 | 4429 |
| xa-hoi | 15 | 15/15 | 40/40 | 49/49 | 4418 |
| suc-khoe | 15 | 15/15 | 44/44 | 0/0 (không nêu) | 4434 |
| kinh-doanh | 15 | 15/15 | 45/45 | 60/60 | 4327 |

Không có nhóm hồ sơ nào (lớp 6–12, hai mức rõ/mơ hồ, bốn nhóm định hướng) làm sụt chỉ số của nhánh grounded — hiệu ứng ràng buộc đồng nhất, không phụ thuộc kiểu hồ sơ.

## 7. Kết luận theo câu hỏi nghiên cứu

- **CH1:** Khi bị ràng buộc bởi ngữ cảnh dữ liệu và schema, model duy trì 100% định dạng JSON máy đọc được (60/60); nhánh đối chứng chỉ đạt 93.3% trên tổng lượt gửi do lệch hạ tầng.
- **CH2:** Neo dữ liệu nâng tỉ lệ trường nêu ra thực sự tồn tại từ 42.6% lên 100%, và đồng thời giảm số trường bịa ra (343 → 151 tên được nêu, 197 tên sai ở nhánh đối chứng so với 0 ở nhánh neo).
- **CH3:** Chi phí của ràng buộc về thời gian là không đáng kể ở mức p50 (4422 ms so với 4486 ms) và nhánh neo thậm chí có p95 thấp hơn; chi phí chính nằm ở rủi ro 503 nhà cung cấp vốn ảnh hưởng cả hai nhánh.

## 8. Hạn chế của đợt thực nghiệm

1. **Một model duy nhất.** Toàn bộ 120 lượt dùng `gemini-3.1-flash-lite`; kết quả không suy rộng sang model khác. Lựa chọn này cố ý để khử biến độc lập ngoài "chế độ gọi", nhưng phải nêu rõ.
2. **Chênh lệch 503 giữa hai đợt.** Grounded chạy trước, baseline chạy sau; 4 lượt 503 của baseline có thể là biến động tải theo thời điểm chứ không phải do thiết kế. Không đảo đợt nên không tách được hai nguồn biến thiên này.
3. **Free tier.** Giới hạn mỗi phút từng model làm harness đôi khi chờ và thử lại; các lượt đó không vào CSV (chỉ 429 được thử lại, lượt chạy sau khi hồi phục vẫn tính là ok).
4. **Phép đo khớp chuỗi.** Khớp tên trường sau khi bỏ dấu có thể đánh giá thấp nhánh baseline nếu model gọi tên khác nhưng đúng thực tế; hướng sai lệch này bảo thủ, không làm 100% của nhánh grounded bị đánh giá thấp.
5. **Không đo chất lượng lời khuyên.** Tỉ lệ khớp dữ liệu không đồng nghĩa lời khuyên tốt sư phạm; theo phạm vi de-cuong, điều đó thuộc nghiên cứu định tính khác.

## 9. Tái lập

```bash
node scripts/danh-gia-he-thong.mjs --branch grounded   # > data/.danh-gia/he-thong-grounded.csv
node scripts/danh-gia-he-thong.mjs --branch baseline   # > data/.danh-gia/he-thong-baseline.csv
node scripts/tong-hop-ket-qua.mjs                      # bảng số liệu này
```

Yêu cầu: `.env.local` có `GEMINI_API_KEY`, `GEMINI_MODEL=gemini-3.1-flash-lite`, server chạy với `CHO_PHEP_DO_LUONG=1`. Hàng đợi hồ sơ cố định (7 lớp × 4 nhóm × 2 mức + 4 hồ sơ trung bình), không dùng số ngẫu nhiên.
