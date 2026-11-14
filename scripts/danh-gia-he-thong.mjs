// Đánh giá hệ thống tư vấn hướng nghiệp cho đề tài KHKT.
// So sánh hai nhánh trên CÙNG một bộ hồ sơ cố định:
//   - grounded: dữ liệu local + validator (mặc định của sản phẩm)
//   - baseline: LLM thuần, không grounding
//
// Chạy (dev server phải đang chạy, .env.local có API key):
//   npm run danh-gia-he-thong
//   npm run danh-gia-he-thong -- --limit 5 --branch both
//
// Kết quả: data/.danh-gia/he-thong-<che_do>.csv (từng request)
//          + bảng tổng hợp in ra terminal.
//
// Lưu ý: server chỉ nhận "che_do" khi env CHO_PHEP_DO_LUONG=1.
// Rate limit 10 request/phút/IP — script tự chờ và thử lại khi gặp 429.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const doc = (f) => JSON.parse(fs.readFileSync(path.join(root, "data", f), "utf-8"));

const khoiThi = doc("khoi-thi.json");
const truongDh = doc("truong-dh.json");

const MA_KHOI = new Set(khoiThi.map((k) => k.code.trim()));

function norm(s) {
  return String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const TEN_TRUONG = truongDh.map((t) => norm(t.ten));

function truongKhopData(ten) {
  const target = norm(ten);
  if (!target) return false;
  if (TEN_TRUONG.includes(target)) return true;
  return TEN_TRUONG.some((n) => target.includes(n) || n.includes(target));
}

// ---------------------------------------------------------------------------
// Bộ hồ sơ test cố định: 60 hồ sơ, sinh tất định (không phụ thuộc thời gian).
// 7 lớp × 4 nhóm hồ sơ × 2 mức học lực = 56, cộng 4 hồ sơ "trung bình" đầu.
// ---------------------------------------------------------------------------

const LOP = ["Lớp 6", "Lớp 7", "Lớp 8", "Lớp 9", "Lớp 10", "Lớp 11", "Lớp 12"];

const NHOM_HO_SO = [
  {
    ten: "ky-thuat",
    manh: ["Toán", "Tin học", "Vật lý"],
    yeu: ["Ngữ văn", "Lịch sử"],
    soThich: ["Máy tính, công nghệ", "Lắp ráp, sửa chữa đồ vật"],
    tinhCach: "Kiên trì, thích mày mò kỹ thuật, thích làm việc một mình.",
  },
  {
    ten: "xa-hoi",
    manh: ["Ngữ văn", "Tiếng Anh", "Lịch sử"],
    yeu: ["Vật lý", "Hóa học"],
    soThich: ["Đọc sách, viết lách", "Thuyết trình, nói trước đám đông"],
    tinhCach: "Hòa đồng, thích giúp bạn học bài, thích tranh luận.",
  },
  {
    ten: "suc-khoe",
    manh: ["Sinh học", "Hóa học"],
    yeu: ["Toán", "Địa lý"],
    soThich: ["Chăm sóc người bệnh, người thân", "Chăm sóc cây trồng, vật nuôi"],
    tinhCach: "Cẩn thận, nhẹ nhàng, kiên nhẫn với người khác.",
  },
  {
    ten: "kinh-doanh",
    manh: ["Toán", "GDCD", "Địa lý"],
    yeu: ["Sinh học", "Vật lý"],
    soThich: ["Kinh doanh, bán hàng online", "Nghe nhạc, chơi nhạc cụ"],
    tinhCach: "Năng động, thích thử việc mới, thích làm việc nhóm.",
  },
];

function taoHoSo() {
  const hoSo = [];
  let n = 0;
  for (const muc of ["gioi", "yeu"]) {
    for (const lop of LOP) {
      for (const nhom of NHOM_HO_SO) {
        if (hoSo.length >= 60) break;
        n += 1;
        const lat = muc === "yeu";
        hoSo.push({
          id: `HS-${String(n).padStart(2, "0")}`,
          lop,
          nhom: nhom.ten,
          muc,
          mon_manh: lat ? nhom.manh.slice(0, 1) : nhom.manh,
          mon_yeu: lat ? [...nhom.yeu, ...nhom.manh.slice(1)] : nhom.yeu,
          so_thich: nhom.soThich,
          tinh_cach: nhom.tinhCach,
        });
      }
    }
  }
  // Bù đủ 60 hồ sơ "trung bình" bằng cách lặp 4 tổ hợp đầu.
  while (hoSo.length < 60) {
    const goc = hoSo[hoSo.length - 56];
    n += 1;
    hoSo.push({
      ...goc,
      id: `HS-${String(n).padStart(2, "0")}`,
      muc: "trung-binh",
      mon_manh: goc.mon_manh.slice(0, 2),
      mon_yeu: goc.mon_yeu.slice(0, 1),
    });
  }
  return hoSo;
}

const HO_SO = taoHoSo();

// ---------------------------------------------------------------------------
// Gọi API và chấm điểm
// ---------------------------------------------------------------------------

function chamDiem(result) {
  const khoi = Array.isArray(result?.khoi_thi_de_nghi) ? result.khoi_thi_de_nghi : [];
  const truongs = (Array.isArray(result?.nghe_nghiep) ? result.nghe_nghiep : []).flatMap(
    (n) => (Array.isArray(n?.truong_tieu_bieu) ? n.truong_tieu_bieu : []),
  );
  return {
    so_khoi: khoi.length,
    khoi_hop_le: khoi.filter((k) => MA_KHOI.has(String(k).trim())).length,
    so_truong: truongs.length,
    truong_khop: truongs.filter(truongKhopData).length,
  };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function goiMotLan(base, form, cheDo, phienMa) {
  const batDau = Date.now();
  try {
    const res = await fetch(`${base}/api/consult`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, stream: false, che_do: cheDo, phien_ma: phienMa }),
      signal: AbortSignal.timeout(240000),
    });
    const ms = Date.now() - batDau;
    if (res.status === 429) {
      return { loai: "rate_limit", ms, http: 429 };
    }
    const text = await res.text();
    let data = null;
    try {
      data = JSON.parse(text);
    } catch {
      return {
        loai: "json_parse",
        ms,
        http: res.status,
        loi: `HTTP ${res.status}: ${text.slice(0, 160)}`,
      };
    }
    if (!res.ok) {
      return {
        loai: "transport",
        ms,
        http: res.status,
        loi: String(data?.error ?? `HTTP ${res.status}`).slice(0, 200),
      };
    }
    if (data && typeof data.error === "string") {
      return { loai: "transport", ms, http: res.status, loi: data.error.slice(0, 200) };
    }
    const hopLe =
      data &&
      Array.isArray(data.khoi_thi_de_nghi) &&
      Array.isArray(data.nghe_nghiep) &&
      data.nghe_nghiep.length > 0 &&
      data.nghe_nghiep.every((n) => n && Array.isArray(n.truong_tieu_bieu));
    if (!hopLe) {
      return { loai: "schema", ms, http: res.status, loi: "JSON thiếu trường bắt buộc" };
    }
    return { loai: "ok", ms, http: res.status, data };
  } catch (err) {
    const ms = Date.now() - batDau;
    const msg = err instanceof Error ? err.message : String(err);
    return { loai: /abort|timeout/i.test(msg) ? "timeout" : "transport", ms, loi: msg };
  }
}

async function goiCoThuLai(base, form, cheDo, phienMa, soLanThu = 4) {
  for (let lan = 1; lan <= soLanThu; lan += 1) {
    const kq = await goiMotLan(base, form, cheDo, phienMa);
    if (kq.loai !== "rate_limit") return kq;
    if (lan === soLanThu) {
      return { loai: "transport", ms: kq.ms, http: 429, loi: "HTTP 429 (hết lượt thử lại)" };
    }
    const cho = 65000;
    console.log(`  429 — chờ ${Math.round(cho / 1000)}s rồi thử lại (${lan}/${soLanThu})…`);
    await sleep(cho);
  }
  return { loai: "transport", ms: 0, loi: "không gọi được API" };
}

function pct(a, b) {
  if (!b) return 0;
  return Math.round((a / b) * 1000) / 10;
}

function percentile(nums, p) {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const idx = Math.min(s.length - 1, Math.max(0, Math.ceil((p / 100) * s.length) - 1));
  return s[idx];
}

function tomTat(rows) {
  const n = rows.length;
  const thanhCong = rows.filter((r) => r.loai === "ok");
  const loiDem = {};
  for (const r of rows) {
    if (r.loai !== "ok") loiDem[r.loai] = (loiDem[r.loai] ?? 0) + 1;
  }
  const msList = thanhCong.map((r) => r.ms);
  const soKhoi = thanhCong.reduce((a, r) => a + r.diem.so_khoi, 0);
  const khoiHopLe = thanhCong.reduce((a, r) => a + r.diem.khoi_hop_le, 0);
  const soTruong = thanhCong.reduce((a, r) => a + r.diem.so_truong, 0);
  const truongKhop = thanhCong.reduce((a, r) => a + r.diem.truong_khop, 0);
  return {
    n,
    thanh_cong: thanhCong.length,
    ty_le_json: pct(thanhCong.length, n),
    khoi: { goi_y: soKhoi, hop_le: khoiHopLe, ty_le: pct(khoiHopLe, soKhoi) },
    truong: { goi_y: soTruong, khop: truongKhop, ty_le: pct(truongKhop, soTruong) },
    p50: percentile(msList, 50),
    p95: percentile(msList, 95),
    loi: loiDem,
  };
}

function inBang(ten, t) {
  console.log(`\n=== ${ten} (n=${t.n}) ===`);
  console.log(`  JSON hợp lệ : ${t.thanh_cong}/${t.n} (${t.ty_le_json}%)`);
  console.log(`  Khối hợp lệ : ${t.khoi.hop_le}/${t.khoi.goi_y} (${t.khoi.ty_le}%)`);
  console.log(`  Trường khớp : ${t.truong.khop}/${t.truong.goi_y} (${t.truong.ty_le}%)`);
  console.log(`  Thời gian   : p50 ${t.p50}ms · p95 ${t.p95}ms`);
  const loi = Object.entries(t.loi);
  console.log(`  Lỗi         : ${loi.length ? loi.map(([k, v]) => `${k}=${v}`).join(", ") : "không có"}`);
}

function ghiCsv(file, rows) {
  const header = [
    "id",
    "che_do",
    "lop",
    "nhom",
    "muc",
    "loai",
    "ms",
    "json_hop_le",
    "so_khoi",
    "khoi_hop_le",
    "so_truong",
    "truong_khop",
    "loi",
  ];
  const lines = [header.join(",")];
  for (const r of rows) {
    const cells = [
      r.id,
      r.che_do,
      r.lop,
      r.nhom,
      r.muc,
      r.loai,
      r.ms,
      r.loai === "ok" ? 1 : 0,
      r.diem?.so_khoi ?? "",
      r.diem?.khoi_hop_le ?? "",
      r.diem?.so_truong ?? "",
      r.diem?.truong_khop ?? "",
      (r.loi ?? "").replace(/"/g, '""'),
    ];
    lines.push(cells.map((c) => `"${String(c)}"`).join(","));
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, lines.join("\n") + "\n", "utf-8");
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function docThamSo() {
  const args = process.argv.slice(2);
  const lay = (ten, macDinh) => {
    const idx = args.indexOf(`--${ten}`);
    return idx >= 0 && args[idx + 1] ? args[idx + 1] : macDinh;
  };
  return {
    base: lay("base", process.env.EVAL_BASE_URL || "http://localhost:3000"),
    limit: Math.max(1, Number(lay("limit", "60")) || 60),
    delay: Math.max(0, Number(lay("delay", "1000")) || 0),
    branch: lay("branch", "both"),
    outDir: path.join(root, "data", ".danh-gia"),
  };
}

async function chayNhanh(base, cheDo, hoSo, delay, outDir) {
  const rows = [];
  console.log(`\n>>> Nhánh ${cheDo.toUpperCase()} — ${hoSo.length} hồ sơ`);
  for (let i = 0; i < hoSo.length; i += 1) {
    const hs = hoSo[i];
    const phienMa = `eval-${cheDo}-${String(i + 1).padStart(3, "0")}`;
    const kq = await goiCoThuLai(base, hs, cheDo, phienMa);
    const row = {
      id: hs.id,
      che_do: cheDo,
      lop: hs.lop,
      nhom: hs.nhom,
      muc: hs.muc,
      loai: kq.loai,
      ms: kq.ms,
      diem: kq.data ? chamDiem(kq.data) : null,
      loi: kq.loi ?? "",
    };
    rows.push(row);
    const nhan = kq.loai === "ok" ? "OK" : kq.loai;
    const chiTiet =
      kq.loai === "ok"
        ? `khối ${row.diem.khoi_hop_le}/${row.diem.so_khoi}, trường ${row.diem.truong_khop}/${row.diem.so_truong}`
        : (kq.loi ?? "").slice(0, 80);
    console.log(`  [${i + 1}/${hoSo.length}] ${hs.id} ${hs.lop} ${hs.nhom}/${hs.muc}: ${nhan} (${kq.ms}ms) ${chiTiet}`);

    const file = path.join(outDir, `he-thong-${cheDo}.csv`);
    ghiCsv(file, rows);
    if (i < hoSo.length - 1) await sleep(delay);
  }
  inBang(`Tổng hợp ${cheDo}`, tomTat(rows));
  console.log(`  CSV: ${path.relative(root, path.join(outDir, `he-thong-${cheDo}.csv`))}`);
  return rows;
}

async function main() {
  const { base, limit, delay, branch, outDir } = docThamSo();
  const hoSo = HO_SO.slice(0, limit);

  if (!["grounded", "baseline", "both"].includes(branch)) {
    console.error(`--branch phải là grounded | baseline | both (nhận: ${branch})`);
    process.exit(1);
  }

  console.log("Đánh giá hệ thống tư vấn hướng nghiệp");
  console.log(`  Server : ${base}`);
  console.log(`  Hồ sơ  : ${hoSo.length}`);
  console.log(`  Delay  : ${delay}ms`);
  console.log(`  Nhánh  : ${branch}`);
  console.log("  Lưu ý  : server phải chạy với CHO_PHEP_DO_LUONG=1.");

  let ketQua = {};
  if (branch === "grounded" || branch === "both") {
    ketQua.grounded = await chayNhanh(base, "grounded", hoSo, delay, outDir);
  }
  if (branch === "baseline" || branch === "both") {
    ketQua.baseline = await chayNhanh(base, "baseline", hoSo, delay, outDir);
  }

  if (ketQua.grounded && ketQua.baseline) {
    const g = tomTat(ketQua.grounded);
    const b = tomTat(ketQua.baseline);
    console.log("\n=== SO SÁNH grounded vs baseline ===");
    console.log(
      `  JSON hợp lệ : grounded ${g.ty_le_json}% vs baseline ${b.ty_le_json}%`,
    );
    console.log(
      `  Khối hợp lệ : grounded ${g.khoi.ty_le}% vs baseline ${b.khoi.ty_le}%`,
    );
    console.log(
      `  Trường khớp : grounded ${g.truong.ty_le}% vs baseline ${b.truong.ty_le}%`,
    );
    console.log(`  p95         : grounded ${g.p95}ms vs baseline ${b.p95}ms`);
  }

  const tongThanhCong = Object.values(ketQua)
    .flat()
    .filter((r) => r.loai === "ok").length;
  if (tongThanhCong === 0) {
    console.error("\nKhông có request nào thành công — kiểm tra dev server / API key.");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Lỗi không mong muốn:", err);
  process.exit(1);
});
