import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const BASE = "https://huongnghiep.hocmai.vn/danh-sach-nganh/";
const RAW = path.join(os.tmpdir(), "opencode", "hocmai-raw");
const CACHE = path.join(os.tmpdir(), "opencode", "chi-tiet-nganh");
const OUT = path.resolve("data/tra-cuu/chi-tiet-nganh.json");
const CONC = 3;
const THU = Number((process.argv.find((a) => a.startsWith("--thu=")) || "").split("=")[1] || 0);
const MOI = process.argv.includes("--moi");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const ENT = { "&amp;": "&", "&#8211;": "-", "&#8212;": "-", "&#8217;": "'", "&#038;": "&", "&#039;": "'", "&nbsp;": " ", "&quot;": '"', "&lt;": "<", "&gt;": ">", "&hellip;": "..." };

function text(html) {
  let s = String(html || "").replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, " ");
  for (const [k, v] of Object.entries(ENT)) s = s.split(k).join(v);
  return s.replace(/\s+/g, " ").trim();
}

function so(v) {
  const s = String(v || "").replace(/\s/g, "");
  const m = /(\d{1,2}(?:[.,]\d{1,2})?)/.exec(s);
  if (!m) return null;
  const n = Number(m[1].replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function tachToHop(v) {
  return String(v || "")
    .replace(/^Tổ hợp:\s*/i, "")
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .filter((x) => /^[A-Z]{1,3}\d{0,3}$/.test(x) && x.length >= 2 && x.length <= 5);
}

function docPane(pane, phuongThuc) {
  const h3 = text((/<h3[^>]*>([\s\S]*?)<\/h3>/.exec(pane) || [])[1]);
  const scale = text((/<p class="hm-ng-scale">([\s\S]*?)<\/p>/.exec(pane) || [])[1]);
  const thang = Number((/Thang\s*(\d+)/i.exec(scale) || [])[1]) || null;
  const rows = [];

  for (const m of pane.matchAll(/<tr[^>]*data-r="(\d)"[^>]*>([\s\S]*?)<\/tr>/g)) {
    const r = m[2];
    const sc = (/<td class="sc">([\s\S]*?)<\/td>/.exec(r) || [])[1];
    const nm = (/<td class="nm">([\s\S]*?)<\/td>/.exec(r) || [])[1];
    const ns = [...r.matchAll(/<td class="n">([\s\S]*?)<\/td>/g)].map((x) => x[1]);
    if (!sc || !nm) continue;

    const a = /<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/.exec(sc);
    const cd = text((/<span class="cd">([\s\S]*?)<\/span>/.exec(sc) || [])[1]);
    const [maTruong, tinh] = cd.split("·").map((x) => x.trim());

    const nganhTen = text(nm.split('<span class="mx">')[0]);
    const mx = text((/<span class="mx">([\s\S]*?)<\/span>/.exec(nm) || [])[1]);
    const thm = text((/<span class="thm">([\s\S]*?)<\/span>/.exec(nm) || [])[1]);
    const [maNganhRaw] = mx.split("·").map((x) => x.trim());
    const chiTieu = /(\d[\d.]*)\s*chỉ tiêu/i.test(mx) ? Number((/([\d.]+)\s*chỉ tiêu/i.exec(mx) || [])[1]?.replace(/\./g, "")) || null : null;

    const o2026 = (/<b>([\s\S]*?)<\/b>/.exec(ns[0] || "") || [])[1];
    const o2025 = (/<b>([\s\S]*?)<\/b>/.exec(ns[1] || "") || [])[1];
    const d = text((/<span class="d[^"]*">([\s\S]*?)<\/span>/.exec(ns[1] || "") || [])[1]).replace("−", "-");

    rows.push({
      truong: a ? text(a[2]) : "",
      truong_slug: a ? a[1].replace(/^\//, "") : null,
      ma_truong: maTruong || null,
      tinh: tinh || null,
      nganh: nganhTen,
      ma_nganh: maNganhRaw && maNganhRaw !== "" ? maNganhRaw : null,
      chi_tieu: chiTieu,
      to_hop: tachToHop(thm),
      diem2026: so(text(o2026)),
      diem2025: so(text(o2025)),
      chenh_lech: d || null,
      phuong_thuc: phuongThuc,
    });
  }

  return { ma: phuongThuc, ten: h3, thang, so_dong: rows.length, rows };
}

function docTrang(html) {
  const i = html.indexOf('<section class="hm-ng"');
  if (i < 0) return null;
  const j = html.indexOf("</section>", i);
  const sec = html.slice(i, j);

  const tomTat = text((/<p class="hm-ng-sum">([\s\S]*?)<\/p>/.exec(sec) || [])[1]);

  const h2s = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => text(m[1]));
  let ten = (h2s.find((t) => /trường đào tạo/i.test(t)) || "").replace(/^.*?\bngành\s+/i, "").trim();
  if (!ten) {
    const m = /đào tạo ngành\s+(.+?)\s+với\s+\d+\s+mã xét tuyển/i.exec(tomTat);
    ten = m ? m[1].trim() : "";
  }

  const tabs = [...sec.matchAll(/<button[^>]*data-t="([^"]+)"[^>]*>([\s\S]*?)<\/button>/g)].map((m) => ({
    ma: m[1],
    ten: text(m[2].replace(/<span[\s\S]*?<\/span>/, "")),
    so: Number(text((/<span>([\s\S]*?)<\/span>/.exec(m[2]) || [])[1])) || 0,
  }));

  const starts = [...sec.matchAll(/<div class="hm-ng-pane[^"]*"[^>]*data-t="([^"]+)"/g)];
  const phuongThuc = [];
  for (let k = 0; k < starts.length; k++) {
    const from = starts[k].index;
    const to = k + 1 < starts.length ? starts[k + 1].index : sec.length;
    phuongThuc.push(docPane(sec.slice(from, to), starts[k][1]));
  }

  if (!ten) return null;
  return { ten, tom_tat: tomTat, tabs, phuong_thuc: phuongThuc };
}

async function tai(slug, tries = 4) {
  for (let k = 0; k < tries; k++) {
    try {
      const res = await fetch(BASE + slug, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36", "Accept-Language": "vi-VN,vi;q=0.9" },
        signal: AbortSignal.timeout(25000),
      });
      if (res.status === 429 || res.status >= 500) {
        await sleep(1500 * (k + 1));
        continue;
      }
      if (!res.ok) return { loi: `HTTP ${res.status}` };
      return { html: await res.text() };
    } catch (e) {
      if (k === tries - 1) return { loi: e instanceof Error ? e.message : String(e) };
      await sleep(1200 * (k + 1));
    }
  }
  return { loi: "het luot thu" };
}

async function pool(items, n, fn) {
  let i = 0;
  const out = new Array(items.length);
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (i < items.length) {
        const k = i++;
        out[k] = await fn(items[k], k);
        await sleep(450);
      }
    }),
  );
  return out;
}

(async () => {
  await fs.mkdir(CACHE, { recursive: true });
  const ds = JSON.parse(await fs.readFile(path.join(RAW, "danh-sach-nganh.json"), "utf8"));
  let slugs = ds.map((p) => p.slug).filter(Boolean);
  if (THU > 0) slugs = slugs.slice(0, THU);
  console.log(`can cao: ${slugs.length} trang`);

  let daXong = 0;
  const loi = [];

  await pool(slugs, CONC, async (slug) => {
    const f = path.join(CACHE, `${slug}.json`);
    if (!MOI) {
      try {
        await fs.access(f);
        return;
      } catch {}
    }
    const r = await tai(slug);
    if (!r.html) {
      loi.push(`${slug}: ${r.loi}`);
      return;
    }
    let d = docTrang(r.html);
    let thu = 0;
    while (!d && thu < 2) {
      thu++;
      await sleep(2500 * thu);
      const lai = await tai(slug);
      if (lai.html) d = docTrang(lai.html);
    }
    if (!d) {
      loi.push(`${slug}: khong thay khoi hm-ng`);
      return;
    }
    d.slug = slug;
    await fs.writeFile(f, JSON.stringify(d), "utf8");
    daXong++;
    if (daXong % 20 === 0) console.log(`  ... ${daXong}/${slugs.length} (loi ${loi.length})`);
  });

  const all = [];
  for (const slug of slugs) {
    try {
      const d = JSON.parse(await fs.readFile(path.join(CACHE, `${slug}.json`), "utf8"));
      all.push(d);
    } catch {}
  }

  await fs.mkdir(path.dirname(OUT), { recursive: true });
  await fs.writeFile(OUT, JSON.stringify(all) + "\n", "utf8");
  const st = await fs.stat(OUT);
  const slugMap = Object.fromEntries(all.map((d) => [d.ten, d.slug]));
  await fs.writeFile(path.resolve("data/tra-cuu/slug-nganh.json"), JSON.stringify(slugMap, null, 1) + "\n", "utf8");
  const tongDong = all.reduce((s, d) => s + d.phuong_thuc.reduce((x, p) => x + p.rows.length, 0), 0);

  console.log(`\n== KET QUA ==`);
  console.log(`trang: ${all.length}/${slugs.length} | loi: ${loi.length}`);
  console.log(`tong dong (moi phuong thuc): ${tongDong}`);
  console.log(`file: ${(st.size / 1024 / 1024).toFixed(2)} MB`);
  if (loi.length) console.log(`loi vd: ${loi.slice(0, 8).join(" | ")}`);
})();
