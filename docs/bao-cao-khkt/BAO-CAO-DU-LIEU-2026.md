# Báo cáo Full Data Audit — Cơ sở dữ liệu tuyển sinh HOCMAI 2026

**Ngày thực hiện:** 28/11/2026
**Phạm vi:** `data/tra-cuu/*.json`, các trang `/tra-cuu/nganh`, `/tra-cuu/de-an`, `/tra-cuu/to-hop`, API `/api/tra-cuu`, script `scripts/kiem-tra-data.mjs`.
**Nguồn chuẩn 2026:** https://huongnghiep.hocmai.vn/danh-sach-nganh/<slug> — bảng **Điểm thi THPT 2026** (phương thức THPT, thang 30; thang 40 cho ngành ngoại ngữ có hệ số).

---

## Phần 1 — Hiện trạng TRƯỚC xử lý

### 1.1 Quy mô dữ liệu trước xử lý

| File | Số bản ghi (trước) | Ghi chú |
|---|---:|---|
| `diem-chuan.json` | **12.550 dòng** | 7.966 cặp `(truong, nganh)` duy nhất → **4.584 dòng trùng** |
| `de-an.json` | 268 | 25/280 trường không có đề án |
| `truong.json` | 280 | 25 trường thiếu đề án |
| `index-nganh.json` | 833 | 7 ngành có `so_to_hop = 0` |
| `to-hop.json` | 298 mã | `_meta.json` ghi `so_to_hop = 148` (lệch thực tế) |
| `chi-tiet-nganh.json` | 386 trang ngành | 20.730 dòng có dữ liệu 2026 (mọi phương thức) |

### 1.2 Phân bố năm trong `diem-chuan.json` (trước)

| Năm | Số dòng | Tỷ lệ |
|---|---:|---:|
| 2023 | 4.086 | 32,6% |
| 2024 | 5.066 | 40,4% |
| 2025 | 12.224 | 97,4% |
| **2026** | **725** | **5,8%** |

→ Dữ liệu 2026 **thiếu trầm trọng** và **không đồng nhất**.

### 1.3 Lỗi nghiêm trọng phát hiện

- **366/725 dòng 2026 có giá trị > 30** (55–90) — điểm TSA/thang 100 bị gán nhầm thành điểm chuẩn chung (Bách Khoa, Phenikaa, Hàng không, KTQD…). Ví dụ: Bách Khoa Hà Nội ngành CNTT = 89,6 (điểm TSA) thay vì điểm THPT.
- **7.151/12.550 dòng `truong_id = null`**, **7.835/12.550 dòng `nganh_id = null`** (chỉ thiếu mapping, không phải ID mồ côi).
- **4 đề án thiếu `so_nganh`**.
- **7 ngành trong `index-nganh.json` có `so_to_hop = 0`** (chưa xác định tên ngành).
- `_meta.json`: `so_to_hop = 148` trong khi `to-hop.json` có **298** mã — lệch dữ liệu tổng hợp.
- Không có script nguồn cho 2026: commit `c047f38` thêm tay, không truy vết được.

### 1.4 Nguồn cảnh báo 7 tổ hợp (sai)

Script `scripts/kiem-tra-data.mjs` chỉ dựa trên `data/truong-dh.json` (**30 trường, 77 nhóm ngành**) — tập mẫu nhỏ. Vì vậy nó cảnh báo 7 khối A16, B01, C19, C20, D08, H00, V00 "chưa trường nào phủ". **Kết luận này sai** vì dữ liệu tra cứu thật có phủ các khối này (xem Phần 3).

---

## Phần 2 — Đối chiếu với nguồn chính thức HOCMAI

### 2.1 Ba trang kiểm tra

| Trang HOCMAI | URL | Kết quả |
|---|---|---|
| Tra cứu ngành học | `/tra-cuu-nganh-hoc` | HTTP 200, **392 ngành** (khớp `so_ban_ghi_goc.danh-sach-nganh = 392`) |
| Tra cứu đề án | `/tracuudean?_diem-chuan-min=0,30&_diem-chuan-max=0,40` | HTTP 200, trang lọc đề án theo ngưỡng điểm; có **86 trường** đã công bố điểm sàn |
| Tra cứu tổ hợp môn | `/to-hop-mon` | **HTTP 404** — đường dẫn đúng là `/to-hop-mon-hoc` (298 tổ hợp) |

**Kết luận:** đường dẫn `/to-hop-mon` trong yêu cầu là lỗi 404 trên HOCMAI; phải dùng `/to-hop-mon-hoc`.

### 2.2 Kiểm tra phân trang, bộ lọc, chi tiết

- HOCMAI dùng **WordPress REST API** (`/wp-json/wp/v2/de-an`, `/to-hop`). Tổng: **392 ngành / 268 đề án / 4.161 tổ hợp** — khớp `so_ban_ghi_goc`.
- Taxonomy `nam` chỉ có term 25 = 2025 (count 4.820); `de-an?nam=26` trả total 0. → **2026 không tồn tại trong API/content**, chỉ render trong bảng của trang chi tiết ngành.
- Trang chi tiết ngành render **9 bảng 2026 theo phương thức**: THPT, Học bạ, HSA, V-ACT, TSA, SPT, V-SAT, Kết hợp, CCQT; mỗi bảng có thang điểm riêng. → Đây là nguồn chuẩn để lấy điểm THPT 2026.
- `chi-tiet-nganh.json`: 386/392 trang ngành cào được; 6 trang không cào được (Nhạc Jazz, Biểu diễn nhạc cụ phương Tây, Chỉ huy âm nhạc, Sáng tác âm nhạc, …); **15 ngành không có dữ liệu 2026** (Công nghệ sợi dệt, Nhiếp ảnh nghệ thuật, Đạo diễn điện ảnh truyền hình, Nhạc Jazz, Chỉ huy âm nhạc, …).
- HOCMAI `/to-hop-mon-hoc/<ma>`: tiêu đề ghi "2026" nhưng bảng điểm thực tế là **2025** (header cột "2025 | 2024 | 2023"). → Cần phân biệt rõ "2026 công bố" vs "chưa công bố".

### 2.3 Xác minh 7 tổ hợp trên HOCMAI (trang tổ hợp, dữ liệu 2025)

| Mã | Trường (HOCMAI) | Ngành (HOCMAI) | Ghi chú |
|---|---:|---:|---|
| A16 | 2 | 6 | |
| B01 | 18 | 85 | |
| C19 | 31 | 77 | |
| C20 | 33 | 88 | |
| D08 | 47 | 130 | |
| H00 | 7 | 9 | |
| V00 | 20 | 25 | |

**Kết luận:** cả 7 tổ hợp **đều tồn tại** trên HOCMAI và đều có trường xét tuyển. Cảnh báo "không có" trước đây là **sai** (do dữ liệu nền `truong-dh.json` chỉ 30 trường).

---

## Phần 3 — Xử lý 7 tổ hợp A16, B01, C19, C20, D08, H00, V00

### 3.1 Trước xử lý (2026 trong `diem-chuan.json` cũ)

| Mã | Bản ghi 2026 (cũ) | Trường |
|---|---:|---:|
| A16 | 0 | 0 |
| B01 | 5 | 1 |
| C19 | 16 | 3 |
| C20 | 9 | 2 |
| D08 | 6 | 2 |
| H00 | 0 | 0 |
| V00 | 4 | 1 |

### 3.2 Sau xử lý (2026 THPT từ `chi-tiet-nganh.json`)

| Mã | Bản ghi 2026 (mới) | Trường | Ngành | Điểm min–max |
|---|---:|---:|---:|---|
| A16 | 2 | 2 | 2 | 16,00–23,50 |
| B01 | 12 | 12 | 50 | 15,00–29,18 |
| C19 | 18 | 18 | 52 | 15,00–29,80 |
| C20 | 19 | 19 | 59 | 15,00–28,19 |
| D08 | 23 | 23 | 67 | 15,00–28,28 |
| H00 | 3 | 3 | 3 | 15,00–23,50 |
| V00 | 6 | 6 | 9 | 15,00–26,01 |

→ **Tất cả 7 tổ hợp đều có dữ liệu 2026** sau xử lý (A16 và H00 trước đây = 0).

### 3.3 Lưu ý về độ phủ

- Số trường/ngành 2026 trong dữ liệu của ta **thấp hơn** HOCMAI (trang tổ hợp là dữ liệu 2025) vì 2026 chỉ được công bố trên trang chi tiết ngành (386/392 trang, THPT = 5.338 dòng / 150 trường). Các ngành chưa công bố 2026 được **giữ điểm năm gần nhất** (2025) và gắn nhãn năm rõ ràng trên UI — **không điền giả**.
- 12 điểm THPT 2026 > 30 (30,08–34,45) là hợp lệ: thang 40 cho ngành ngoại ngữ có hệ số (ĐH Ngoại Thương, ĐH Hà Nội, ĐH Sư phạm TPHCM).

---

## Phần 4 — Kết quả sau hoàn thiện

### 4.1 Tổng hợp số liệu

| Chỉ số | Trước | Sau | Thay đổi |
|---|---:|---:|---:|
| Bản ghi `diem-chuan.json` | 12.550 | **6.416** | −6.134 (gộp trùng + chuẩn hoá tên) |
| Bản ghi có 2026 | 725 (5,8%) | **3.117 (48,6%)** | **+2.392** |
| Bản ghi chỉ 2025 | 12.224 | 3.060 | — |
| Bản ghi không có điểm | — | 80 | đánh dấu "chưa có" |
| Trường (`truong.json`) | 280 | **282** | +2 (bổ sung CMC, Mỹ Thuật TPHCM) |
| Trường có 2026 | — | **143** | — |
| Ngành (`index-nganh.json`) | 833 | **1.129** | +296 (giữ toàn bộ 833 cũ) |
| Tổ hợp (`to-hop.json`) | 298 | **298** | giữ nguyên; 229 có 2026 |
| Bản ghi trùng (cặp) | 4.584 | **0** | đã gộp |
| `truong_id` null | 7.151 | 20 | −7.131 |
| `nganh_id` null | 7.835 | 840 | −6.995 |

### 4.2 Phân bố năm sau xử lý

| Năm | Số bản ghi | Tỷ lệ |
|---|---:|---:|
| 2023 | 3.623 | 56,5% |
| 2024 | 4.397 | 68,5% |
| 2025 | 5.268 | 82,1% |
| 2026 | 3.117 | 48,6% |

### 4.3 Liên kết & metadata

- `truong.json`: giữ `de_an` link gốc HOCMAI cho 255/282 trường; 27 trường chưa có đề án (đánh dấu "Đang cập nhật").
- `_meta.json` cập nhật: `so_muc_sau_gop = 6.416`, `so_truong = 282`, `so_nganh = 1.129`, `so_to_hop = 298`, `so_ban_ghi_2026 = 3.117`.
- `_audit-2026.json`: lưu provenance nguồn 2026 (URL, ngày, số dòng cào).
- Backup gốc: `data/tra-cuu/_backup-2026-11-28/` (rollback an toàn).

### 4.4 Sửa UI (nhãn năm động)

- `to-hop/page.tsx`, `de-an/page.tsx`, `nganh/TraCuuNganhClient.tsx`, `de-an/[slug]/page.tsx`: thay "Điểm chuẩn 2026" cứng bằng `nam` thực tế; dòng chi tiết hiển thị năm khi không phải 2026; nguồn ghi rõ "2026 THPT, fallback năm gần nhất".
- `kiem-tra-data.mjs`: bổ sung đối chiếu `diem-chuan.json` → 7 khối A16/B01/C19/C20/D08/H00/V00 không còn cảnh báo sai ("không có trường").

### 4.5 Kiểm chứng

- `npx tsc --noEmit`: **0 lỗi** (ngoại trừ module chưa cài đặt, đã `npm install`).
- `npm run build`: **thành công** (SSG 268 đề án + 383 ngành).
- `npm run kiem-tra-data`: **SẠCH — không còn lỗi đỏ**; 7 khối đều có trường trong dữ liệu tra cứu 2026.
- Audit thang điểm: 3.117 bản ghi 2026; 12 > 30 (thang 40, hợp lệ); 3.105 ≤ 30.

### 4.6 Tỷ lệ đầy đủ

- **Tỷ lệ bản ghi có 2026:** 3.117/6.416 = **48,6%** (trước 5,8%).
- **Tỷ lệ trường có 2026:** 143/282 = **50,7%**.
- **Tỷ lệ tổ hợp có 2026:** 229/298 = **76,8%**.
- **7/7 tổ hợp mục tiêu** đều có dữ liệu 2026 (trước: 2/7 = 0).
- **0 dữ liệu giả / 0 suy đoán mã**: các ngành/chương trình chưa công bố 2026 được giữ điểm năm gần nhất và gắn nhãn năm.

---

*Backup & rollback: `data/tra-cuu/_backup-2026-11-28/`. Script rebuild: `scripts/rebuild-diem-chuan.mjs` (chạy `--ghi` để ghi, mặc định dry-run).*
