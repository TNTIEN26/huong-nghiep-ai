import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const BASE = "https://huongnghiep.hocmai.vn/wp-json/wp/v2/";
const OUT = path.resolve("data/tra-cuu");
const RAW = path.join(os.tmpdir(), "opencode", "hocmai-raw");
const CONC = 5;
const CHUNK = 100;
const REPARSE = process.argv.includes("--reparse");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function json(url, tries = 5) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "huong-nghiep-ai/1.0 (du-an-hoc-sinh)" } });
      if (res.status === 429 || res.status >= 500) {
        await sleep(1500 * (i + 1));
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
      const data = await res.json();
      return { data, totalPages: Number(res.headers.get("x-wp-totalpages") || 1), total: Number(res.headers.get("x-wp-total") || 0) };
    } catch (e) {
      if (i === tries - 1) throw e;
      await sleep(1000 * (i + 1));
    }
  }
}

async function pool(items, n, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (i < items.length) {
        const k = i++;
        out[k] = await fn(items[k], k);
        await sleep(80);
      }
    })
  );
  return out;
}

async function layHet(type, fields) {
  const first = await json(`${BASE}${type}?per_page=${CHUNK}&page=1&_fields=${fields}`);
  const pages = first.totalPages || 1;
  const all = [...first.data];
  if (pages > 1) {
    const jobs = [];
    for (let p = 2; p <= pages; p++) jobs.push(`${BASE}${type}?per_page=${CHUNK}&page=${p}&_fields=${fields}`);
    const rest = await pool(jobs, CONC, async (u) => (await json(u)).data);
    for (const arr of rest) if (Array.isArray(arr)) all.push(...arr);
  }
  return all;
}

const ENT = { "&amp;": "&", "&#8211;": "-", "&#8212;": "-", "&#8217;": "'", "&#8216;": "'", "&#8220;": '"', "&#8221;": '"', "&nbsp;": " ", "&#038;": "&", "&#039;": "'", "&quot;": '"', "&lt;": "<", "&gt;": ">", "&hellip;": "..." };

function text(html) {
  let s = String(html || "").replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, " ");
  for (const [k, v] of Object.entries(ENT)) s = s.split(k).join(v);
  return s.replace(/\s+/g, " ").trim();
}

function norm(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function cellsOf(rowHtml) {
  const out = [];
  const re = /<(td|th)([^>]*)>([\s\S]*?)<\/\1>/gi;
  let m;
  while ((m = re.exec(rowHtml))) {
    const rs = /rowspan\s*=\s*["']?(\d+)/i.exec(m[2]);
    const cs = /colspan\s*=\s*["']?(\d+)/i.exec(m[2]);
    out.push({ text: text(m[3]), rowspan: rs ? Number(rs[1]) : 1, colspan: cs ? Number(cs[1]) : 1 });
  }
  return out;
}

function bangTrong(html) {
  const out = [];
  const tre = /<table[\s\S]*?<\/table>/gi;
  let t;
  while ((t = tre.exec(html || ""))) {
    const rows = [];
    const rre = /<tr[\s\S]*?<\/tr>/gi;
    let r;
    while ((r = rre.exec(t[0]))) rows.push(cellsOf(r[0]));
    if (rows.length) out.push(rows);
  }
  return out;
}

function moRong(rows) {
  const luoi = [];
  for (let h = 0; h < rows.length; h++) {
    luoi[h] = luoi[h] || [];
    let c = 0;
    for (const cell of rows[h]) {
      while (luoi[h][c] !== undefined) c++;
      for (let dc = 0; dc < cell.colspan; dc++) {
        for (let dr = 0; dr < cell.rowspan; dr++) {
          luoi[h + dr] = luoi[h + dr] || [];
          luoi[h + dr][c + dc] = cell.text;
        }
      }
      c += cell.colspan;
    }
  }
  return luoi;
}

function soDiem(v) {
  const s = String(v || "").replace(/\s/g, "");
  const m = /(\d{1,2})(?:[.,](\d{1,2}))?/.exec(s);
  if (!m) return null;
  const n = Number(m[1] + (m[2] ? "." + m[2] : ""));
  if (!Number.isFinite(n) || n <= 0 || n > 40) return null;
  return n;
}

let BO_TO_HOP = null;

function tachToHop(v) {
  const ra = String(v || "")
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .filter((x) => /^[A-Z]{1,3}\d{0,3}$/.test(x) && x.length >= 2 && x.length <= 4);
  if (!BO_TO_HOP) return ra.filter((x) => /\d/.test(x));
  return ra.filter((x) => BO_TO_HOP.has(x));
}

function chuanNganh(ten) {
  return String(ten || "").replace(/\s+/g, " ").trim();
}

function boNgoac(ten) {
  return String(ten || "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\s+[–-]\s+.*$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function docBang(html) {
  const rows = [];
  for (const bang of bangTrong(html)) {
    const l = moRong(bang);
    if (l.length < 2) continue;
    let h = -1;
    for (let i = 0; i < Math.min(3, l.length); i++) {
      if ((l[i] || []).some((c) => /2025|điểm chuẩn/i.test(String(c || "")))) h = i;
    }
    if (h < 0) continue;
    const timCot = (re) => {
      for (let i = 0; i <= h; i++) {
        for (let c = 0; c < (l[i] || []).length; c++) {
          if (re.test(String(l[i][c] || ""))) return c;
        }
      }
      return -1;
    };
    const cot = {
      truong: timCot(/tên trường/i),
      nganh: timCot(/tên ngành/i),
      tohop: timCot(/tổ hợp/i),
      y2025: timCot(/2025/),
      y2024: timCot(/2024/),
      y2023: timCot(/2023/),
    };
    if (cot.nganh < 0 || cot.y2025 < 0) continue;
    for (let i = h + 1; i < l.length; i++) {
      const r = l[i] || [];
      const nganh = String(r[cot.nganh] || "").trim();
      if (!nganh || nganh.length < 3) continue;
      const diem = {
        2025: soDiem(r[cot.y2025]),
        2024: cot.y2024 >= 0 ? soDiem(r[cot.y2024]) : null,
        2023: cot.y2023 >= 0 ? soDiem(r[cot.y2023]) : null,
      };
      const toHop = cot.tohop >= 0 ? tachToHop(r[cot.tohop]) : [];
      if (diem[2025] == null && diem[2024] == null && diem[2023] == null && !toHop.length) continue;
      rows.push({
        truong: cot.truong >= 0 ? String(r[cot.truong] || "").trim() : "",
        nganh,
        to_hop: toHop,
        diem,
      });
    }
  }
  return rows;
}

async function taiTatCa() {
  await fs.mkdir(RAW, { recursive: true });
  const raws = {};
  const nay = new Date().toISOString().slice(0, 10);
  const metaFile = path.join(RAW, "_ngay.txt");
  let daCo = false;
  try {
    const d = (await fs.readFile(metaFile, "utf8")).trim();
    daCo = d === nay && REPARSE;
  } catch {}

  if (daCo) {
    for (const k of ["truong", "nganh-xet-tuyen-tax", "nhom-nganh-tax", "to-hop-tax", "thanh-pho-tax", "de-an", "danh-sach-nganh", "to-hop"]) {
      raws[k] = JSON.parse(await fs.readFile(path.join(RAW, `${k}.json`), "utf8"));
      console.log(`  (cache) ${k}: ${raws[k].length}`);
    }
    return raws;
  }

  const taxs = ["truong", "nganh-xet-tuyen-tax", "nhom-nganh-tax", "to-hop-tax", "thanh-pho-tax"];
  for (const t of taxs) {
    raws[t] = await layHet(t, "id,name,slug,count");
    console.log(`  ${t}: ${raws[t].length} terms`);
    await fs.writeFile(path.join(RAW, `${t}.json`), JSON.stringify(raws[t]));
  }

  const F_DEAN = "id,slug,link,title,content,truong,thanh-pho-tax,phuong-thuc-xet-tuyen,so-nganh-dao-tao,ky-thi,nam";
  const F_NGANH = "id,slug,link,title,content,nganh-xet-tuyen-tax,nhom-nganh-tax,to-hop-tax,truong,so-truong-dao-tao,nam";
  const F_TOHOP = "id,slug,link,title,content,truong,to-hop-tax,thanh-pho-tax,nam";

  console.log("  dang tai de-an ...");
  raws["de-an"] = await layHet("de-an", F_DEAN);
  console.log(`  de-an: ${raws["de-an"].length}`);
  await fs.writeFile(path.join(RAW, "de-an.json"), JSON.stringify(raws["de-an"]));

  console.log("  dang tai danh-sach-nganh ...");
  raws["danh-sach-nganh"] = await layHet("danh-sach-nganh", F_NGANH);
  console.log(`  danh-sach-nganh: ${raws["danh-sach-nganh"].length}`);
  await fs.writeFile(path.join(RAW, "danh-sach-nganh.json"), JSON.stringify(raws["danh-sach-nganh"]));

  console.log("  dang tai to-hop ...");
  raws["to-hop"] = await layHet("to-hop", F_TOHOP);
  console.log(`  to-hop: ${raws["to-hop"].length}`);
  await fs.writeFile(path.join(RAW, "to-hop.json"), JSON.stringify(raws["to-hop"]));

  await fs.writeFile(metaFile, nay);
  return raws;
}

function tenTu(title) {
  return text(title?.rendered || "").replace(/^Tổ hợp\s+\S+\s*-\s*/i, "");
}

(async () => {
  console.log("== TAI DU LIEU ==");
  const raws = await taiTatCa();

  const truongTerm = new Map(raws["truong"].map((t) => [t.id, text(t.name)]));
  const nganhTerm = new Map(raws["nganh-xet-tuyen-tax"].map((t) => [t.id, text(t.name)]));
  const tohopTerm = new Map(raws["to-hop-tax"].map((t) => [t.id, text(t.name)]));
  const thanhPhoTerm = new Map(raws["thanh-pho-tax"].map((t) => [t.id, text(t.name)]));

  const truongTheoTen = new Map();
  for (const [id, ten] of truongTerm) truongTheoTen.set(norm(ten), id);
  const nganhTheoTen = new Map();
  for (const [id, ten] of nganhTerm) nganhTheoTen.set(norm(ten), id);

  BO_TO_HOP = new Set([...tohopTerm.values()].map((v) => String(v).toUpperCase().replace(/\s+/g, "")));

  const nganhNorm = [...nganhTerm].map(([id, ten]) => ({ id, n: norm(ten) })).filter((x) => x.n.length >= 4);

  const timNganh = (ten) => {
    const n = norm(boNgoac(ten));
    if (!n) return null;
    if (nganhTheoTen.has(n)) return nganhTheoTen.get(n);
    let best = null;
    for (const t of nganhNorm) {
      if (n === t.n || n.startsWith(t.n + " ") || t.n.startsWith(n + " ")) {
        if (!best || t.n.length > best.len) best = { id: t.id, len: t.n.length };
      }
    }
    return best ? best.id : null;
  };

  const deAn = new Map();
  for (const p of raws["de-an"]) {
    const tId = (p["truong"] || [])[0];
    if (!tId) continue;
    const ten = truongTerm.get(tId) || tenTu(p.title) || text(p.title?.rendered);
    deAn.set(tId, {
      ten,
      slug: p.slug,
      link: p.link,
      thanh_pho: thanhPhoTerm.get((p["thanh-pho-tax"] || [])[0]) || null,
      phuong_thuc: (p["phuong-thuc-xet-tuyen"] || []).length,
      so_nganh: Number(p["so-nganh-dao-tao"]?.[0] ?? 0) || null,
      noi_dung: text(p.content?.rendered).slice(0, 2000),
    });
  }

  const gop = new Map();
  const them = (truongTenRaw, truongId, nganhTenRaw, toHop, diem) => {
    const truongTen = String(truongTenRaw || "").trim();
    const nganhTen = chuanNganh(nganhTenRaw);
    if (!truongTen || nganhTen.length < 4) return;
    const nganhId = timNganh(nganhTen);
    const k = `${norm(truongTen)}|${norm(nganhTen)}`;
    const cu = gop.get(k);
    if (!cu) {
      gop.set(k, {
        truong: truongTen,
        truong_id: truongId ?? null,
        nganh: nganhTen,
        nganh_id: nganhId,
        to_hop: new Set(toHop),
        diem: { ...diem },
      });
      return;
    }
    if (cu.truong_id == null && truongId != null) cu.truong_id = truongId;
    if (cu.nganh_id == null && nganhId != null) cu.nganh_id = nganhId;
    for (const x of toHop) cu.to_hop.add(x);
    for (const y of ["2025", "2024", "2023"]) if (cu.diem[y] == null && diem[y] != null) cu.diem[y] = diem[y];
  };

  let nDong = 0;
  const nguonLoi = [];

  for (const p of raws["danh-sach-nganh"]) {
    const truongList = (p["truong"] || []).map((id) => truongTerm.get(id)).filter(Boolean);
    const dong = docBang(p.content?.rendered);
    if (!dong.length) {
      nguonLoi.push(`danh-sach-nganh#${p.id} ${p.slug}: 0 dong`);
      continue;
    }
    const nganhChinh = (p["nganh-xet-tuyen-tax"] || []).map((id) => nganhTerm.get(id)).filter(Boolean)[0];
    for (const d of dong) {
      nDong++;
      const tenTruong = d.truong || truongList[0] || "";
      them(tenTruong, truongTheoTen.get(norm(tenTruong)) ?? null, d.nganh, d.to_hop, d.diem);
    }
    if (!truongList.length) nguonLoi.push(`danh-sach-nganh#${p.id}: khong co truong tax (dung ten trong bang)`);
    if (nganhChinh == null) nguonLoi.push(`danh-sach-nganh#${p.id}: khong co nganh tax`);
  }

  let nToHopDong = 0;
  const thanhPhoTheoTruong = new Map();
  for (const p of raws["to-hop"]) {
    const tId = (p["truong"] || [])[0];
    const tenTruong = tId ? truongTerm.get(tId) : tenTu(p.title);
    if (!tenTruong) continue;
    const tp = thanhPhoTerm.get((p["thanh-pho-tax"] || [])[0]);
    if (tId && tp && !thanhPhoTheoTruong.has(tId)) thanhPhoTheoTruong.set(tId, tp);
    const dong = docBang(p.content?.rendered);
    if (!dong.length) {
      nguonLoi.push(`to-hop#${p.id} ${p.slug}: 0 dong`);
      continue;
    }
    for (const d of dong) {
      nToHopDong++;
      const toHop = d.to_hop.length ? d.to_hop : (p["to-hop-tax"] || []).map((id) => tohopTerm.get(id)).filter(Boolean);
      them(tenTruong, truongTheoTen.get(norm(tenTruong)) ?? tId ?? null, d.nganh, toHop, d.diem);
    }
  }

  const rows = [...gop.values()].map((r) => ({
    truong: r.truong,
    truong_id: r.truong_id,
    nganh: r.nganh,
    nganh_id: r.nganh_id,
    to_hop: [...r.to_hop].sort(),
    diem: r.diem,
  }));

  rows.sort((a, b) => a.truong.localeCompare(b.truong, "vi") || a.nganh.localeCompare(b.nganh, "vi"));

  const nganhMap = new Map();
  for (const r of rows) {
    const k = r.nganh_id != null ? `id:${r.nganh_id}` : `ten:${norm(boNgoac(r.nganh))}`;
    if (!nganhMap.has(k)) {
      const ten = r.nganh_id != null ? nganhTerm.get(r.nganh_id) || boNgoac(r.nganh) : boNgoac(r.nganh);
      nganhMap.set(k, { ten, id: r.nganh_id, truong: new Set(), to_hop: new Set(), diem: [] });
    }
    const n = nganhMap.get(k);
    if (n.id == null && r.nganh_id != null) n.id = r.nganh_id;
    if (r.truong) n.truong.add(r.truong);
    for (const x of r.to_hop) n.to_hop.add(x);
    if (r.diem[2025] != null) n.diem.push(r.diem[2025]);
  }
  const nganhOut = [...nganhMap.values()].map((n) => ({
    ten: n.ten,
    id: n.id,
    so_truong: n.truong.size,
    to_hop: [...n.to_hop].sort(),
    diem_min: n.diem.length ? Math.min(...n.diem) : null,
    diem_max: n.diem.length ? Math.max(...n.diem) : null,
    so_muc_diem: n.diem.length,
  }));
  nganhOut.sort((a, b) => b.so_truong - a.so_truong || a.ten.localeCompare(b.ten, "vi"));

  const truongMap = new Map();
  for (const r of rows) {
    const k = norm(r.truong);
    if (!truongMap.has(k)) truongMap.set(k, { ten: r.truong, id: r.truong_id, nganh: new Set(), to_hop: new Set(), diem: [] });
    const t = truongMap.get(k);
    if (t.id == null && r.truong_id != null) t.id = r.truong_id;
    t.nganh.add(r.nganh);
    for (const x of r.to_hop) t.to_hop.add(x);
    if (r.diem[2025] != null) t.diem.push(r.diem[2025]);
  }
  const truongOut = [...truongMap.values()].map((t) => {
    const da = t.id != null ? deAn.get(t.id) : null;
    return {
      ten: t.ten,
      id: t.id,
      thanh_pho: da?.thanh_pho ?? (t.id != null ? thanhPhoTheoTruong.get(t.id) : null) ?? null,
      so_nganh: t.nganh.size,
      so_to_hop: t.to_hop.size,
      diem_min: t.diem.length ? Math.min(...t.diem) : null,
      diem_max: t.diem.length ? Math.max(...t.diem) : null,
      de_an: da ? { slug: da.slug, link: da.link, so_nganh: da.so_nganh, phuong_thuc: da.phuong_thuc } : null,
    };
  });
  truongOut.sort((a, b) => a.ten.localeCompare(b.ten, "vi"));

  const toHopMap = new Map();
  for (const r of rows) {
    for (const ma of r.to_hop) {
      if (!toHopMap.has(ma)) toHopMap.set(ma, { ma, truong: new Set(), nganh: new Set(), diem: [] });
      const x = toHopMap.get(ma);
      if (r.truong) x.truong.add(r.truong);
      x.nganh.add(r.nganh);
      if (r.diem[2025] != null) x.diem.push(r.diem[2025]);
    }
  }
  const toHopOut = [...toHopMap.values()].map((x) => ({
    ma: x.ma,
    so_truong: x.truong.size,
    so_nganh: x.nganh.size,
    diem_min: x.diem.length ? Math.min(...x.diem) : null,
    diem_max: x.diem.length ? Math.max(...x.diem) : null,
  }));
  toHopOut.sort((a, b) => b.so_nganh - a.so_nganh || a.ma.localeCompare(b.ma));

  const deAnOut = raws["de-an"].map((p) => {
    const tId = (p["truong"] || [])[0];
    const da = tId ? deAn.get(tId) : null;
    return {
      ten: da?.ten || text(p.title?.rendered),
      truong_id: tId ?? null,
      thanh_pho: da?.thanh_pho ?? null,
      so_nganh: da?.so_nganh ?? null,
      slug: p.slug,
      link: p.link,
      noi_dung: da?.noi_dung || text(p.content?.rendered).slice(0, 2000),
    };
  });
  deAnOut.sort((a, b) => a.ten.localeCompare(b.ten, "vi"));

  await fs.mkdir(OUT, { recursive: true });
  const ghi = async (ten, data) => {
    const f = path.join(OUT, ten);
    await fs.writeFile(f, JSON.stringify(data, null, 1) + "\n", "utf8");
    const kb = Math.round((await fs.stat(f)).size / 1024);
    console.log(`  ${ten}: ${Array.isArray(data) ? data.length : "?"} muc, ${kb} KB`);
  };

  await ghi("truong.json", truongOut);
  await ghi("nganh.json", nganhOut);
  await ghi("diem-chuan.json", rows);
  await ghi("to-hop.json", toHopOut);
  await ghi("de-an.json", deAnOut);
  await ghi(
    "index-nganh.json",
    nganhOut.map((n) => ({
      ten: n.ten,
      id: n.id,
      so_truong: n.so_truong,
      so_to_hop: n.to_hop.length,
      diem_min: n.diem_min,
      diem_max: n.diem_max,
    })),
  );
  await ghi("_meta.json", {
    nguon: "https://huongnghiep.hocmai.vn (HOCMAI) — du lieu diem chuan theo de an tuyen sinh",
    ngay_cao: new Date().toISOString().slice(0, 10),
    so_ban_ghi_goc: {
      "de-an": raws["de-an"].length,
      "danh-sach-nganh": raws["danh-sach-nganh"].length,
      "to-hop": raws["to-hop"].length,
    },
    so_dong_bang_doc_duoc: nDong,
    so_dong_to_hop_doc_duoc: nToHopDong,
    so_muc_sau_gop: rows.length,
    so_truong: truongOut.length,
    so_nganh: nganhOut.length,
    so_to_hop: toHopOut.length,
    so_bai_khong_doc_duoc: nguonLoi.length,
    vi_du_loi: nguonLoi.slice(0, 15),
  });

  console.log("\n== TONG KET ==");
  console.log(`dong bang: danh-sach-nganh=${nDong}, to-hop=${nToHopDong}`);
  console.log(`sau gop: ${rows.length} muc | truong=${truongOut.length} | nganh=${nganhOut.length} | to-hop=${toHopOut.length}`);
  console.log(`bai khong doc duoc: ${nguonLoi.length}`);
  console.log(`co diem 2025: ${rows.filter((r) => r.diem[2025] != null).length}`);
  console.log(`truong khop tax: ${rows.filter((r) => r.truong_id != null).length}/${rows.length}`);
  console.log(`nganh khop tax: ${rows.filter((r) => r.nganh_id != null).length}/${rows.length}`);
})();
