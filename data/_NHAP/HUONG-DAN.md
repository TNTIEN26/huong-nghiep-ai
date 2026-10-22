# HƯỚNG DẪN BỎ DỮ LIỆU TUYỂN SINH

Chào bạn! Đây là **3 chỗ để bạn thêm dữ liệu**. Bạn chỉ cần **mở file `.txt` dán dữ liệu vào**, không cần biết lập trình.

## 3 file cần điền

| File | Bạn thêm gì |
|---|---|
| `1-KHOI-THI.txt` | Danh sách khối thi (A00, A01, B00, D01…) |
| `2-TRUONG.txt` | Danh sách trường + tỉnh/thành |
| `3-NGANH-DIEM.txt` | Ngành xét tuyển của từng trường + **điểm chuẩn** + link nguồn |

## Sau khi dán xong, chạy 1 lệnh

```bash
npm run nap-du-lieu
```

Lệnh này tự gộp dữ liệu của bạn vào web và in ra báo cáo. Nếu có dòng sai, nó sẽ báo **dòng nào, sai gì** — sửa rồi chạy lại là được. File cũ luôn được backup ở `data/.backup/` trước khi ghi đè.

Kiểm tra chất lượng dữ liệu (nên chạy luôn sau khi nạp):
```bash
npm run kiem-tra-data
```
Lệnh này báo **đỏ** nếu còn dòng thiếu năm / link nguồn / ngày kiểm chứng, **vàng** nếu còn khối thi chưa trường nào phủ.

## Quy tắc chung

* Mỗi dòng = 1 bản ghi. Các cột ngăn cách bằng dấu ` | `
* Dòng bắt đầu bằng `#` là ghi chú, sẽ bị bỏ qua (mẫu trong file đều ở dạng `#`)
* Xóa một mục đã có: thêm `XOA:` trước mã/tên, ví dụ `XOA:A00`
* **Cột để trống nghĩa là "không đổi"** — dữ liệu cũ được giữ nguyên
* Thêm trường mới trong file 3 mà chưa có trong file 2 → script tự thêm vào

## Ví dụ nhanh

Bạn muốn thêm ngành "Marketing" với điểm chuẩn của Đại học Bách khoa Hà Nội, mở `3-NGANH-DIEM.txt` và dán thêm dòng:

```
Đại học Bách khoa Hà Nội | Marketing | A00, A01 | 24.5 | 2025 | https://ts.hust.edu.vn/ | 2026-10-22 | | |
```

rồi chạy `npm run nap-du-lieu`.

## Cần thêm một ngành hoàn toàn mới?

`3-NGANH-DIEM.txt` chỉ chứa ngành **đã có** trong `data/nganh-nghe.json` (23 ngành: CNTT, Kỹ thuật cơ khí, Y - Dược, Luật, Marketing…). Nếu bạn muốn thêm ngành mới hoàn toàn (kèm mô tả, lương, rủi ro thay thế), sửa trực tiếp file `data/nganh-nghe.json` — mẫu cũng nằm ngay đó.

## Lưu ý về điểm chuẩn

* Điểm chuẩn là **số** từ 10 đến 30, ví dụ `28.5`
* Luôn ghi **năm** của điểm chuẩn (ví dụ `2025`) — web sẽ hiện "điểm chuẩn năm 2025"
* Luôn ghi **link đề án tuyển sinh chính thức** của trường để học sinh tự kiểm chứng
* Ngày kiểm chứng ghi dạng `2026-10-22` (năm-tháng-ngày)
