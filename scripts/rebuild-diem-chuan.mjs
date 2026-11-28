import fs from "fs";

const DRY = !process.argv.includes("--ghi");

const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));

// Nguồn "gốc" để rebuild: ưu tiên backup đã tạo trước lần ghi đầu tiên.
// Nhờ vậy chạy lại nhiều lần vẫn không làm mất bản ghi cũ.
const BACKUP_DIR = "data/tra-cuu/_backup-2026-11-28";
const SRC = fs.existsSync(`${BACKUP_DIR}/diem-chuan.json`) ? BACKUP_DIR : "data/tra-cuu";

const OLD = read(`${SRC}/diem-chuan.json`);
const D = read("data/tra-cuu/chi-tiet-nganh.json");
const TRUONG = read(`${SRC}/truong.json`);
const NGANH_FULL = read(`${SRC}/nganh.json`);
const NGANH = read(`${SRC}/index-nganh.json`);

const norm = (s) =>
  String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase()
    .replace(/[^a-z0-9]+/g, " ").trim();

// ---------- MAP TRUONG ----------
const aliasNorm = new Map(); // norm(name) -> id
const aliasChuan = new Map();

function chuanTruong(s) {
  let x = norm(s);
  x = x.replace(/\b(dai hoc quoc gia ha noi|dh quoc gia ha noi|dhqg ha noi|dai hoc quoc gia tp hcm|dh quoc gia tp hcm|dhqg tphcm|dhqg hcm)\b/g, " ");
  x = x.replace(/\([^)]*\)/g, " ");
  x = x.replace(/\b(truong|dai hoc|dh|hoc vien|hv|vien dai hoc|phan hieu|co so|phia bac|phia nam)\b/g, " ");
  x = x.replace(/\b\d+\b/g, " ");
  return x.replace(/\s+/g, " ").trim();
}

for (const t of TRUONG) {
  if (t.id == null) continue;
  aliasNorm.set(norm(t.ten), t.id);
  const c = chuanTruong(t.ten);
  if (!aliasChuan.has(c)) aliasChuan.set(c, []);
  aliasChuan.get(c).push(t.id);
}
for (const m of OLD) {
  if (m.truong_id == null) continue;
  if (!aliasNorm.has(norm(m.truong))) aliasNorm.set(norm(m.truong), m.truong_id);
  const c = chuanTruong(m.truong);
  if (!aliasChuan.has(c)) aliasChuan.set(c, []);
  if (!aliasChuan.get(c).includes(m.truong_id)) aliasChuan.get(c).push(m.truong_id);
}

const ALIAS = {
  "hoc vien hanh chinh quoc gia phia bac": 565,
  "hoc vien bao chi tuyen truyen": 883,
  "dai hoc lam nghiep co so 2 phan hieu dong nai": 765,
  "khoa y duoc dai hoc da nang": 536,
  "dh tai nguyen moi truong tphcm": 766,
  "dai hoc hang hai": 556,
  "hoc vien ki thuat quan su he dan su": 869,
  "hoc vien tai chinh phan hieu hung yen": 358,
  "hoc vien ki thuat quan su he quan su": 427,
  "dai hoc cong nghiep ha noi": TRUONG.find((t) => /Công Nghiệp Hà Nội/i.test(t.ten))?.id ?? null,
  "dai hoc khoa hoc xa hoi va nhan van dai hoc quoc gia ha noi": 452,
  "dai hoc lao dong xa hoi co so ha noi": 589,
  "dai hoc khoa hoc tu nhien dai hoc quoc gia ha noi": 459,
  "dai hoc kiem sat ha noi": 471,
  "phan hieu dai hoc nong lam tp hcm tai ninh thuan": 687,
};

function idTruong(ten) {
  const n = norm(ten);
  if (ALIAS[n]) return ALIAS[n];
  if (aliasNorm.has(n)) return aliasNorm.get(n);
  const c = chuanTruong(ten);
  const arr = aliasChuan.get(c);
  if (arr && arr.length === 1) return arr[0];
  if (arr && arr.length > 1) return arr[0]; // chon dau tien, ghi log
  return null;
}

// ---------- MAP NGANH ----------
function chuanNganh(s) {
  let x = norm(s);
  x = x.replace(/\([^)]*\)/g, " ");
  x = x.replace(/\b(chuong trinh|ct|clc|chat luong cao|dao tao|he|chuyen nganh|dinh huong|quoc te|tieng anh|ta|cttt|tien tien|moi|ky su tai nang)\b/g, " ");
  return x.replace(/\s+/g, " ").trim();
}
const nganhNorm = new Map();
const nganhChuan = new Map();
for (const n of NGANH) {
  nganhNorm.set(norm(n.ten), n.id);
  const c = chuanNganh(n.ten);
  if (!nganhChuan.has(c)) nganhChuan.set(c, []);
  nganhChuan.get(c).push(n.id);
}
function idNganh(ten) {
  const n = norm(ten);
  if (nganhNorm.has(n)) return nganhNorm.get(n);
  const c = chuanNganh(ten);
  const arr = nganhChuan.get(c);
  if (arr && arr.length) return arr[0];
  // fuzzy token
  const tu = new Set(c.split(" ").filter((x) => x.length >= 3));
  if (tu.size === 0) return null;
  let best = null, bestScore = 0;
  for (const [k, ids] of nganhChuan) {
    const tu2 = new Set(k.split(" ").filter((x) => x.length >= 3));
    if (tu2.size === 0) continue;
    let hit = 0;
    for (const w of tu) if (tu2.has(w)) hit++;
    const score = hit / Math.max(tu.size, tu2.size);
    if (score > bestScore) { bestScore = score; best = Array.isArray(ids) ? ids[0] : ids; }
  }
  return bestScore >= 0.8 ? best : null;
}

// ---------- THPT 2026 rows ----------
const thpt = [];
for (const n of D) for (const pt of n.phuong_thuc || []) if (pt.ma === "THPT") for (const r of pt.rows || []) if (r.diem2026 != null) thpt.push({ ...r, trang: n.ten });

let mapTruong = 0, mapNganh = 0;
const khongTruong = new Set(), khongNganh = new Set();
for (const r of thpt) {
  if (idTruong(r.truong) != null) mapTruong++; else khongTruong.add(r.truong);
  if (idNganh(r.nganh) != null) mapNganh++; else khongNganh.add(r.nganh);
}
console.log("THPT 2026 rows:", thpt.length);
console.log("  map truong:", mapTruong, "| khong:", khongTruong.size, "->", [...khongTruong].join(" | "));
console.log("  map nganh:", mapNganh, "| khong:", khongNganh.size);
console.log("  vi du nganh khong map:", [...khongNganh].slice(0, 12).join(" | "));

// ---------- GHEP ----------
// key: truong_id||nganh_id (neu co) hoac truong_id||norm(nganh)
const oldKey = new Map();
const khoaGop = (tid, truong, nganh) => `${tid ?? "t:" + norm(truong)}||${norm(nganh)}`;
for (const m of OLD) {
  const tidRaw = Array.isArray(m.truong_id) ? m.truong_id[0] : m.truong_id;
  const nidRaw = Array.isArray(m.nganh_id) ? m.nganh_id[0] : m.nganh_id;
  const tid = tidRaw ?? idTruong(m.truong);
  const nid = nidRaw ?? idNganh(m.nganh);
  const key = khoaGop(tid, m.truong, m.nganh);
  if (!oldKey.has(key)) oldKey.set(key, { ...m, truong_id: tid, nganh_id: nid, _tohop: new Set(m.to_hop || []), _2026: [] });
  else {
    const x = oldKey.get(key);
    for (const t of m.to_hop || []) x._tohop.add(t);
    for (const y of ["2023", "2024", "2025"]) if (x.diem[y] == null && m.diem[y] != null) x.diem[y] = m.diem[y];
  }
}

let gan2026 = 0, themMoi = 0;
const moi = [];
for (const r of thpt) {
  const tid = idTruong(r.truong);
  const nid = idNganh(r.nganh) ?? idNganh(r.trang);
  const key = khoaGop(tid, r.truong, r.nganh);
  let rec = oldKey.get(key);
  if (rec) {
    rec._2026.push({ diem: r.diem2026, to_hop: r.to_hop || [] });
    gan2026++;
  } else {
    rec = {
      truong: r.truong, truong_id: tid, nganh: r.nganh, nganh_id: nid,
      to_hop: [], diem: { 2026: null }, _tohop: new Set(r.to_hop || []), _2026: [{ diem: r.diem2026, to_hop: r.to_hop || [] }], _moi: true,
    };
    oldKey.set(key, rec);
    themMoi++;
    if (moi.length < 10) moi.push(`${r.truong} | ${r.nganh} | ${r.diem2026}`);
  }
}

// ---------- KET QUA ----------
const recs = [...oldKey.values()];
let co2026 = 0;
for (const r of recs) {
  // bo 2026 cu (sai), chi lay tu THPT
  r.diem = { 2023: r.diem["2023"] ?? null, 2024: r.diem["2024"] ?? null, 2025: r.diem["2025"] ?? null };
  if (r._2026.length) {
    r.diem["2026"] = Math.max(...r._2026.map((x) => x.diem));
    r.phuong_thuc = "THPT";
    r.thang = r.diem["2026"] > 30 ? 40 : 30;
    r.chi_tiet_to_hop = {};
    for (const x of r._2026) for (const t of x.to_hop) r.chi_tiet_to_hop[t] = Math.max(r.chi_tiet_to_hop[t] ?? 0, x.diem);
    co2026++;
  }
  r.to_hop = [...r._tohop].sort();
  delete r._tohop; delete r._2026; delete r._moi;
}

console.log("\n== KET QUA (dry-run) ==");
console.log("records cu:", OLD.length, "-> sau ghep:", recs.length);
console.log("  gan 2026 vao record cu:", gan2026, "| them record moi:", themMoi);
console.log("  record co 2026:", co2026, `(${((co2026 / recs.length) * 100).toFixed(1)}%)`);
console.log("  record chi co 2025:", recs.filter((r) => r.diem["2026"] == null && r.diem["2025"] != null).length);
console.log("  record khong co diem:", recs.filter((r) => Object.values(r.diem).every((v) => v == null)).length);
console.log("  vi du moi:", moi.join(" ;; "));

// Thong ke 7 to hop
const FOCUS = ["A16", "B01", "C19", "C20", "D08", "H00", "V00"];
console.log("\n== 7 to hop (record co 2026) ==");
for (const ma of FOCUS) {
  const rr = recs.filter((r) => r.diem["2026"] != null && (r.to_hop || []).includes(ma));
  const t = new Set(rr.map((r) => r.truong_id ?? norm(r.truong)));
  console.log(`  ${ma}: ${rr.length} record | ${t.size} truong`);
}

// Thong ke nganh
const nganhSet = new Set(recs.map((r) => "n:" + norm(r.nganh)));
const truongSet = new Set(recs.map((r) => r.truong_id ?? "t:" + norm(r.truong)));
console.log("\n  so truong:", truongSet.size, "| so nganh:", nganhSet.size);

// ---------- TINH LAI CAC BANG TONG HOP ----------
function diemDaiDien(r) {
  return r.diem["2026"] ?? r.diem["2025"] ?? r.diem["2024"] ?? r.diem["2023"] ?? null;
}
function namDaiDien(r) {
  for (const y of ["2026", "2025", "2024", "2023"]) if (r.diem[y] != null) return Number(y);
  return null;
}

function taoDiem() {
  return { 2023: [], 2024: [], 2025: [], 2026: [] };
}
function tongHopDiem(d) {
  for (const y of ["2026", "2025", "2024", "2023"]) {
    const ds = d[y];
    if (ds && ds.length) return { nam: Number(y), min: Math.min(...ds), max: Math.max(...ds) };
  }
  return { nam: null, min: null, max: null };
}

// truong.json
const oldTruongById = new Map(TRUONG.filter((t) => t.id != null).map((t) => [t.id, t]));
const oldTruongByNorm = new Map(TRUONG.map((t) => [norm(t.ten), t]));
const gTruong = new Map();
for (const r of recs) {
  const key = r.truong_id != null ? `id:${r.truong_id}` : "n:" + norm(r.truong);
  if (!gTruong.has(key)) gTruong.set(key, { ten: r.truong, id: r.truong_id, nganh: new Set(), to_hop: new Set(), diem: taoDiem() });
  const g = gTruong.get(key);
  g.nganh.add(norm(r.nganh));
  for (const t of r.to_hop || []) g.to_hop.add(t);
  for (const y of ["2023", "2024", "2025", "2026"]) if (r.diem[y] != null) g.diem[y].push(r.diem[y]);
}
const truongOut = [...gTruong.values()]
  .map((g) => {
    const old = (g.id != null ? oldTruongById.get(g.id) : null) ?? oldTruongByNorm.get(norm(g.ten));
    const t = tongHopDiem(g.diem);
    return {
      ten: old?.ten ?? g.ten,
      id: g.id,
      thanh_pho: old?.thanh_pho ?? null,
      so_nganh: g.nganh.size,
      so_to_hop: g.to_hop.size,
      diem_min: t.min,
      diem_max: t.max,
      nam: t.nam,
      de_an: old?.de_an ?? null,
    };
  })
  .sort((a, b) => a.ten.localeCompare(b.ten, "vi"));

// Không làm mất trường cũ: bổ sung trường có trong danh mục gốc nhưng không còn bản ghi nào.
{
  const tenDaCo = new Set(truongOut.map((t) => norm(t.ten)));
  const idDaCo = new Set(truongOut.map((t) => t.id).filter((x) => x != null));
  for (const t of TRUONG) {
    if (t.id != null && idDaCo.has(t.id)) continue;
    if (tenDaCo.has(norm(t.ten))) continue;
    truongOut.push({ ...t, nam: (t).nam ?? null });
    tenDaCo.add(norm(t.ten));
    if (t.id != null) idDaCo.add(t.id);
  }
  truongOut.sort((a, b) => a.ten.localeCompare(b.ten, "vi"));
}

// nganh.json + index-nganh.json
const oldNganhById = new Map(NGANH_FULL.filter((n) => n.id != null).map((n) => [n.id, n]));
const oldNganhByNorm = new Map(NGANH_FULL.map((n) => [norm(n.ten), n]));
const gNganh = new Map();
for (const r of recs) {
  const key = r.nganh_id != null ? `id:${r.nganh_id}` : "n:" + norm(r.nganh);
  if (!gNganh.has(key)) gNganh.set(key, { ten: r.nganh, id: r.nganh_id, truong: new Set(), to_hop: new Set(), diem: taoDiem() });
  const g = gNganh.get(key);
  g.truong.add(r.truong_id ?? "t:" + norm(r.truong));
  for (const t of r.to_hop || []) g.to_hop.add(t);
  for (const y of ["2023", "2024", "2025", "2026"]) if (r.diem[y] != null) g.diem[y].push(r.diem[y]);
}
const nganhOut = [...gNganh.values()]
  .map((g) => {
    const old = (g.id != null ? oldNganhById.get(g.id) : null) ?? oldNganhByNorm.get(norm(g.ten));
    const t = tongHopDiem(g.diem);
    return {
      ten: old?.ten ?? g.ten,
      id: g.id,
      so_truong: g.truong.size,
      to_hop: [...g.to_hop].sort(),
      diem_min: t.min,
      diem_max: t.max,
      so_muc_diem: g.diem[t.nam]?.length ?? 0,
      nam: t.nam,
    };
  })
  .sort((a, b) => b.so_truong - a.so_truong || a.ten.localeCompare(b.ten, "vi"));

// Không làm mất ngành cũ (kể cả ngành chưa có bản ghi điểm).
{
  const tenDaCo = new Set(nganhOut.map((n) => norm(n.ten)));
  const idDaCo = new Set(nganhOut.map((n) => n.id).filter((x) => x != null));
  for (const n of NGANH_FULL) {
    if (n.id != null && idDaCo.has(n.id)) continue;
    if (tenDaCo.has(norm(n.ten))) continue;
    nganhOut.push({ ...n, nam: (n).nam ?? null });
    tenDaCo.add(norm(n.ten));
    if (n.id != null) idDaCo.add(n.id);
  }
  nganhOut.sort((a, b) => b.so_truong - a.so_truong || a.ten.localeCompare(b.ten, "vi"));
}

const indexNganhOut = nganhOut.map((n) => ({
  ten: n.ten,
  id: n.id,
  so_truong: n.so_truong,
  so_to_hop: n.to_hop.length,
  diem_min: n.diem_min,
  diem_max: n.diem_max,
  nam: n.nam,
}));

// to-hop.json
const gToHop = new Map();
for (const r of recs) {
  for (const ma of r.to_hop || []) {
    if (!gToHop.has(ma)) {
      const nam = { 2023: new Set(), 2024: new Set(), 2025: new Set(), 2026: new Set() };
      gToHop.set(ma, { ma, truong: new Set(), nganh: new Set(), diem: taoDiem(), truongNam: nam, nganhNam: { 2023: new Set(), 2024: new Set(), 2025: new Set(), 2026: new Set() } });
    }
    const g = gToHop.get(ma);
    const tk = r.truong_id ?? "t:" + norm(r.truong);
    const nk = r.nganh_id != null ? `id:${r.nganh_id}` : "n:" + norm(r.nganh);
    g.truong.add(tk);
    g.nganh.add(nk);
    for (const y of ["2023", "2024", "2025", "2026"]) {
      if (r.diem[y] != null) {
        g.diem[y].push(r.diem[y]);
        g.truongNam[y].add(tk);
        g.nganhNam[y].add(nk);
      }
    }
  }
}
const toHopOut = [...gToHop.values()]
  .map((g) => {
    const t = tongHopDiem(g.diem);
    const y = t.nam;
    return {
      ma: g.ma,
      so_truong: y != null ? g.truongNam[y].size : g.truong.size,
      so_nganh: y != null ? g.nganhNam[y].size : g.nganh.size,
      diem_min: t.min,
      diem_max: t.max,
      nam: y,
    };
  })
  .sort((a, b) => b.so_nganh - a.so_nganh || a.ma.localeCompare(b.ma));

console.log("\n== TONG HOP SAU KHI TINH LAI ==");
console.log("  truong.json:", truongOut.length, "| nganh.json:", nganhOut.length, "| index-nganh:", indexNganhOut.length, "| to-hop.json:", toHopOut.length);
console.log("  truong co de_an:", truongOut.filter((t) => t.de_an).length);
console.log("  truong co 2026:", truongOut.filter((t) => t.nam === 2026).length);
console.log("  to hop co 2026:", toHopOut.filter((t) => t.nam === 2026).length);
const tb = toHopOut.find((t) => t.ma === "A16");
console.log("  vi du A16:", JSON.stringify(tb));

if (!DRY) {
  const OUT = "data/tra-cuu";
  const BACKUP = `${OUT}/_backup-2026-11-28`;
  fs.mkdirSync(BACKUP, { recursive: true });
  for (const f of ["diem-chuan.json", "truong.json", "nganh.json", "index-nganh.json", "to-hop.json"]) {
    // Chỉ backup lần đầu; các lần chạy lại không được ghi đè bản gốc.
    if (!fs.existsSync(`${BACKUP}/${f}`)) fs.copyFileSync(`${OUT}/${f}`, `${BACKUP}/${f}`);
  }
  fs.writeFileSync(`${OUT}/diem-chuan.json`, JSON.stringify(recs, null, 1) + "\n", "utf8");
  fs.writeFileSync(`${OUT}/truong.json`, JSON.stringify(truongOut, null, 1) + "\n", "utf8");
  fs.writeFileSync(`${OUT}/nganh.json`, JSON.stringify(nganhOut, null, 1) + "\n", "utf8");
  fs.writeFileSync(`${OUT}/index-nganh.json`, JSON.stringify(indexNganhOut, null, 1) + "\n", "utf8");
  fs.writeFileSync(`${OUT}/to-hop.json`, JSON.stringify(toHopOut, null, 1) + "\n", "utf8");
  fs.writeFileSync(
    `${OUT}/_audit-2026.json`,
    JSON.stringify(
      {
        ngay: new Date().toISOString().slice(0, 10),
        nguon_2026: "https://huongnghiep.hocmai.vn/danh-sach-nganh/<slug> (bảng Điểm thi THPT 2026)",
        so_dong_thpt_2026: thpt.length,
        so_ban_ghi_truoc: OLD.length,
        so_ban_ghi_sau: recs.length,
        so_ban_ghi_co_2026: co2026,
        so_ban_ghi_gan_2026: gan2026,
        so_ban_ghi_them_moi: themMoi,
        so_truong: truongOut.length,
        so_nganh: nganhOut.length,
        so_to_hop: toHopOut.length,
        so_truong_co_2026: truongOut.filter((t) => t.nam === 2026).length,
        so_to_hop_co_2026: toHopOut.filter((t) => t.nam === 2026).length,
      },
      null,
      1,
    ) + "\n",
    "utf8",
  );
  console.log(`\nDa ghi. Backup tai ${BACKUP}`);
}
