// Nạp dữ liệu tuyển sinh từ các file .txt trong data/_NHAP/ vào file JSON.
// Chạy: npm run nap-du-lieu
// - Đọc 1-KHOI-THI.txt, 2-TRUONG.txt, 3-NGANH-DIEM.txt (mỗi dòng = 1 bản ghi, cột ngăn bằng " | ")
// - Gộp vào data/khoi-thi.json và data/truong-dh.json
// - Tự backup file cũ vào data/.backup/
// - In ra báo cáo: thêm mới / cập nhật / bỏ qua / lỗi

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(root, "data");
const nhapDir = path.join(dataDir, "_NHAP");
const backupDir = path.join(dataDir, ".backup");

const docJson = (f) => JSON.parse(fs.readFileSync(path.join(dataDir, f), "utf-8"));

/** Ghi JSON giữ nguyên style của file gốc (mảng 1 dòng hay nhiều dòng) để đỡ rối diff git. */
function ghiJson(f, data) {
  const goc = fs.readFileSync(path.join(dataDir, f), "utf-8");
  const giuMangNhieuDong = /:\s*\[\s*\n/.test(goc);
  let json = JSON.stringify(data, null, 2);
  if (!giuMangNhieuDong) {
    json = json.replace(/\[\s*\n\s*((?:"(?:[^"\\]|\\.)*"(?:,\s*\n\s*)?)+)\s*\n\s*\]/g, (match, body) => {
      const items = body.match(/"(?:[^"\\]|\\.)*"/g) ?? [];
      const one = `[${items.join(", ")}]`;
      return one.length <= 110 ? one : match;
    });
  }
  fs.writeFileSync(path.join(dataDir, f), json + "\n", "utf-8");
}

/** Đọc 1 file .txt, bỏ comment + dòng trống, tách cột. */
function docDong(file) {
  const p = path.join(nhapDir, file);
  if (!fs.existsSync(p)) return [];
  return fs
    .readFileSync(p, "utf-8")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l !== "" && !l.startsWith("#"))
    .map((l, i) => {
      const cot = l.split("|").map((c) => c.trim());
      return { cot, dong: i + 1, raw: l };
    });
}

const tachDanhSach = (s) =>
  (s ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

const chuanHoa = (s) =>
  (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "")
    .trim();

function slug(ten) {
  const s = chuanHoa(ten).slice(0, 24);
  return s || "truong";
}

const loi = [];
const canhBao = [];
let them = 0;
let capNhat = 0;
let boQua = 0;

// ---------------------------------------------------------------- 1. KHỐI THI
const khoiThi = docJson("khoi-thi.json");
const khoiDaCo = new Map(khoiThi.map((k) => [k.code.toUpperCase(), k]));
const xoaKhoi = new Set();

for (const { cot, dong } of docDong("1-KHOI-THI.txt")) {
  if (cot[0]?.toUpperCase().startsWith("XOA:")) {
    xoaKhoi.add(cot[0].slice(4).trim().toUpperCase());
    continue;
  }
  const [code, ten, monThi, phuHop] = cot;
  if (!code) {
    loi.push(`1-KHOI-THI.txt dòng ${dong}: thiếu mã khối`);
    continue;
  }
  const ma = code.toUpperCase();
  const duLieu = {
    code: ma,
    ten: ten || `Khối ${ma}`,
    mon_thi: tachDanhSach(monThi),
    phu_hop: tachDanhSach(phuHop),
  };
  if (khoiDaCo.has(ma)) {
    const cu = khoiDaCo.get(ma);
    if (ten) cu.ten = ten;
    if (duLieu.mon_thi.length > 0) cu.mon_thi = duLieu.mon_thi;
    if (duLieu.phu_hop.length > 0) cu.phu_hop = duLieu.phu_hop;
    capNhat++;
  } else {
    khoiThi.push(duLieu);
    khoiDaCo.set(ma, duLieu);
    them++;
  }
}

const truong = docJson("truong-dh.json");
const truongDaCo = new Map(truong.map((t) => [chuanHoa(t.ten), t]));
const xoaTruong = new Set();

// ----------------------------------------------------------------- 2. TRƯỜNG
for (const { cot, dong } of docDong("2-TRUONG.txt")) {
  if (cot[0]?.toUpperCase().startsWith("XOA:")) {
    xoaTruong.add(chuanHoa(cot[0].slice(4).trim()));
    continue;
  }
  const [ten, thanhPho, ma] = cot;
  if (!ten) {
    loi.push(`2-TRUONG.txt dòng ${dong}: thiếu tên trường`);
    continue;
  }
  const key = chuanHoa(ten);
  if (truongDaCo.has(key)) {
    const t = truongDaCo.get(key);
    if (thanhPho) t.thanh_pho = thanhPho;
    if (ma) t.id = ma;
    capNhat++;
  } else {
    const moi = {
      id: ma || slug(ten),
      ten,
      thanh_pho: thanhPho || "",
      nhom_nganh: [],
    };
    truong.push(moi);
    truongDaCo.set(key, mois);
    them++;
  }
}

// ------------------------------------------------------ 3. NGÀNH + ĐIỂM CHUẨN
const namHienTai = new Date().getFullYear();
for (const { cot, dong } of docDong("3-NGANH-DIEM.txt")) {
  const [tenTruong, tenNganh, toHop, diem, nam, nguon, ngayCapNhat, hocPhi, hocBong, ghiChu] = cot;
  if (!tenTruong || !tenNganh) {
    loi.push(`3-NGANH-DIEM.txt dòng ${dong}: thiếu tên trường hoặc tên ngành`);
    continue;
  }
  let t = truongDaCo.get(chuanHoa(tenTruong));
  if (!t) {
    t = { id: slug(tenTruong), ten: tenTruong, thanh_pho: "", nhom_nganh: [] };
    truong.push(t);
    truongDaCo.set(chuanHoa(tenTruong), t);
    canhBao.push(`dòng ${dong}: trường "${tenTruong}" chưa có trong danh sách → đã tự thêm`);
    them++;
  }

  const diemSo = Number(String(diem ?? "").replace(",", "."));
  if (!Number.isFinite(diemSo) || diemSo < 10 || diemSo > 30) {
    loi.push(`3-NGANH-DIEM.txt dòng ${dong}: điểm chuẩn không hợp lệ ("${diem ?? ""}") — phải từ 10 đến 30`);
    continue;
  }
  const namSo = Number(nam);
  if (!Number.isFinite(namSo) || namSo < 2015 || namSo > namHienTai + 1) {
    loi.push(`3-NGANH-DIEM.txt dòng ${dong}: năm không hợp lệ ("${nam ?? ""}")`);
    continue;
  }
  if (!nguon || !/^https?:\/\//.test(nguon)) {
    loi.push(`3-NGANH-DIEM.txt dòng ${dong}: thiếu link nguồn (bắt đầu bằng https://)`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ngayCapNhat ?? "")) {
    loi.push(`3-NGANH-DIEM.txt dòng ${dong}: ngày kiểm chứng phải có dạng YYYY-MM-DD`);
  }

  const duLieu = {
    ten: tenNganh,
    to_hop: tachDanhSach(toHop),
    diem_chuan_tk: diemSo,
    ghichu: ghiChu ?? "",
    hoc_phi_tk: hocPhi ?? "",
    hoc_bong: hocBong ?? "",
    nam: namSo,
    nguon: nguon ?? "",
    ngay_cap_nhat: ngayCapNhat ?? "",
  };

  const cungTen = (t.nhom_nganh ?? []).find((n) => chuanHoa(n.ten) === chuanHoa(tenNganh));
  if (cungTen) {
    // Cột để trống nghĩa là "không đổi" - giữ nguyên giá trị cũ
    for (const k of Object.keys(duLieu)) {
      if (k === "ten" || k === "to_hop" || k === "diem_chuan_tk" || k === "nam") {
        cungTen[k] = duLieu[k];
      } else if (String(duLieu[k]).trim() !== "") {
        cungTen[k] = duLieu[k];
      }
    }
    capNhat++;
  } else {
    t.nhom_nganh.push(duLieu);
    them++;
  }
}

// ------------------------------------------------------------------ XOÁ + GHI
if (xoaKhoi.size > 0) {
  const truoc = khoiThi.length;
  const con = khoiThi.filter((k) => !xoaKhoi.has(k.code.toUpperCase()));
  capNhat += truoc - con.length;
  khoiThi.length = 0;
  khoiThi.push(...con);
}
if (xoaTruong.size > 0) {
  const truoc = truong.length;
  const con = truong.filter((t) => !xoaTruong.has(chuanHoa(t.ten)));
  capNhat += truoc - con.length;
  truong.length = 0;
  truong.push(...con);
}

// kiểm tra mã khối có tồn tại không
const maKhoi = new Set(khoiThi.map((k) => k.code));
for (const t of truong) {
  for (const n of t.nhom_nganh ?? []) {
    for (const c of n.to_hop ?? []) {
      if (!maKhoi.has(c.toUpperCase())) {
        loi.push(`${t.ten} / ${n.ten}: tổ hợp "${c}" chưa có trong 1-KHOI-THI.txt`);
      }
    }
  }
}

if (loi.length > 0) {
  console.log(`KHÔNG GHI FILE vì còn ${loi.length} lỗi:`);
  for (const e of loi.slice(0, 40)) console.log(`  x ${e}`);
  if (loi.length > 40) console.log(`  … và ${loi.length - 40} lỗi nữa`);
  console.log("\nSửa lại các file trong data/_NHAP/ rồi chạy lại npm run nap-du-lieu");
  process.exit(1);
}

fs.mkdirSync(backupDir, { recursive: true });
const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
for (const f of ["khoi-thi.json", "truong-dh.json"]) {
  fs.copyFileSync(path.join(dataDir, f), path.join(backupDir, `${stamp}_${f}`));
}

ghiJson("khoi-thi.json", khoiThi);
ghiJson("truong-dh.json", truong);

const tongNhom = truong.reduce((s, t) => s + (t.nhom_nganh ?? []).length, 0);
console.log(`Đã nạp xong. Thêm mới: ${them} · Cập nhật: ${capNhat} · Bỏ qua: ${boQua}`);
console.log(`Khối thi: ${khoiThi.length} · Trường: ${truong.length} · Nhóm ngành: ${tongNhom}`);
if (canhBao.length > 0) {
  console.log("\nCẢNH BÁO:");
  for (const c of canhBao) console.log(`  ! ${c}`);
}
console.log(`Backup cũ: data/.backup/${stamp}_*`);
console.log("Chạy 'npm run kiem-tra-data' để kiểm tra chất lượng dữ liệu.");
