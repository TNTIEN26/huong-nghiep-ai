// Kiểm tra chất lượng data tuyển sinh cho đề tài KHKT.
// Chạy: npm run kiem-tra-data
// - LỖI (đỏ, exit 1): thiếu nam/nguon/ngày, điểm vô lý, mã khối không tồn tại.
// - CẢNH BÁO (vàng): khối không trường nào phủ, chữ Latin sót.
// Mục tiêu solo: 15 nhóm ưu tiên hết lỗi đỏ; nhóm còn lại ghi rõ "đang kiểm chứng".

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const doc = (f) => JSON.parse(fs.readFileSync(path.join(root, "data", f), "utf-8"));

const khoiThi = doc("khoi-thi.json");
const truongDh = doc("truong-dh.json");

const maKhoi = new Set(khoiThi.map((k) => k.code));
const loi = [];
const canhBao = [];

// Khối nào đang được phủ bởi ít nhất 1 nhóm ngành?
const khoiDuocPhu = new Set();

for (const t of truongDh) {
  for (const n of t.nhom_nganh ?? []) {
    const dinhDanh = `${t.ten} / ${n.ten}`;
    if (typeof n.diem_chuan_tk !== "number" || n.diem_chuan_tk < 10 || n.diem_chuan_tk > 30) {
      loi.push(`${dinhDanh}: diem_chuan_tk vô lý (${JSON.stringify(n.diem_chuan_tk)})`);
    }
    for (const c of n.to_hop ?? []) {
      if (!maKhoi.has(c)) {
        loi.push(`${dinhDanh}: mã khối "${c}" không có trong khoi-thi.json`);
      } else {
        khoiDuocPhu.add(c);
      }
    }
    if (typeof n.nam !== "number") {
      loi.push(`${dinhDanh}: thiếu "nam" (năm của điểm chuẩn)`);
    }
    if (typeof n.nguon !== "string" || !/^https?:\/\//.test(n.nguon)) {
      loi.push(`${dinhDanh}: thiếu "nguon" (link đề án, bắt đầu bằng http)`);
    }
    if (typeof n.ngay_cap_nhat !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(n.ngay_cap_nhat)) {
      loi.push(`${dinhDanh}: thiếu "ngay_cap_nhat" (dạng YYYY-MM-DD)`);
    }
    for (const k of ["hoc_phi_tk", "hoc_bong", "ghichu"]) {
      const v = n[k];
      if (typeof v === "string" && /(mln\/|tham khào|Scholarship|bakalavr|vybora|automatizaciya)/.test(v)) {
        canhBao.push(`${dinhDanh}: ${k} còn sót chữ nước ngoài/chính tả ("${v.slice(0, 60)}…")`);
      }
    }
  }
}

for (const code of [...maKhoi].sort()) {
  if (!khoiDuocPhu.has(code)) {
    canhBao.push(`Khối ${code} chưa trường nào phủ (AI gợi ý khối này sẽ thiếu trường)`);
  }
}

const tongNhom = truongDh.reduce((s, t) => s + (t.nhom_nganh ?? []).length, 0);
const nhomDat = (() => {
  let d = 0;
  for (const t of truongDh) {
    for (const n of t.nhom_nganh ?? []) {
      if (
        typeof n.nam === "number" &&
        typeof n.nguon === "string" &&
        /^https?:\/\//.test(n.nguon) &&
        /^\d{4}-\d{2}-\d{2}$/.test(n.ngay_cap_nhat ?? "")
      ) {
        d += 1;
      }
    }
  }
  return d;
})();

console.log(`Trường: ${truongDh.length} · Nhóm ngành: ${tongNhom} · Đạt chuẩn nguồn: ${nhomDat}/${tongNhom}`);
if (canhBao.length > 0) {
  console.log(`\nCẢNH BÁO (${canhBao.length}):`);
  for (const c of canhBao) console.log(`  ! ${c}`);
}
if (loi.length > 0) {
  console.log(`\nLỖI (${loi.length}):`);
  for (const e of loi.slice(0, 60)) console.log(`  x ${e}`);
  if (loi.length > 60) console.log(`  … và ${loi.length - 60} lỗi nữa`);
  process.exit(1);
}
console.log("\nSẠCH: không còn lỗi đỏ.");
