import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

import sharp from "sharp";

const RAW = "C:/Users/Jido/AppData/Local/Temp/opencode/hocmai-raw/de-an.json";
const CACHE_ANH = "C:/Users/Jido/AppData/Local/Temp/opencode/anh-de-an";
const OUT_HTML = path.resolve("content/de-an-html");
const OUT_ANH = path.resolve("public/de-an/anh");
const OUT_MAP = path.resolve("data/tra-cuu/de-an-anh.json");
const MOI = process.argv.includes("--moi");
const CONC = 6;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function bam(s) {
  return crypto.createHash("md5").update(s).digest("hex").slice(0, 14);
}

function chuanUrl(u) {
  if (!u) return "";
  let s = u.trim().replace(/&amp;/g, "&");
  if (s.startsWith("//")) s = "https:" + s;
  return s;
}

async function pool(items, n, fn) {
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (i < items.length) {
        const k = i++;
        try {
          await fn(items[k], k);
      } catch {
          console.log("  loi:", items[k], e.message);
        }
      }
    }),
  );
}

const posts = JSON.parse(fs.readFileSync(RAW, "utf8"));
console.log("posts:", posts.length);

const urls = new Map();
for (const p of posts) {
  const h = p.content?.rendered || "";
  for (const m of h.matchAll(/<img\b[^>]*?src="([^"]+)"/gi)) {
    const u = chuanUrl(m[1]);
    if (/^https?:/i.test(u) && !urls.has(u)) urls.set(u, 0);
    if (urls.has(u)) urls.set(u, urls.get(u) + 1);
  }
}
console.log("anh duy nhat:", urls.size);

fs.mkdirSync(CACHE_ANH, { recursive: true });
fs.mkdirSync(OUT_ANH, { recursive: true });
fs.mkdirSync(OUT_HTML, { recursive: true });

const mapAnh = {};
const kichThuoc = {};
const danhSach = [...urls.keys()];
let xong = 0;
let tongTruoc = 0;
let tongSau = 0;
let loi = 0;

await pool(danhSach, CONC, async (u) => {
  const duoiGoc = (u.split("?")[0].match(/\.([a-z0-9]+)$/i) || [, "jpg"])[1].toLowerCase();
  const gocFile = path.join(CACHE_ANH, bam(u) + "." + duoiGoc);
  let buf = null;
  if (!MOI && fs.existsSync(gocFile)) {
    buf = fs.readFileSync(gocFile);
  } else {
    for (let k = 0; k < 3 && !buf; k++) {
      try {
        const r = await fetch(u, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
            Referer: "https://huongnghiep.hocmai.vn/",
          },
          signal: AbortSignal.timeout(30000),
        });
        if (!r.ok) throw new Error("HTTP " + r.status);
        buf = Buffer.from(await r.arrayBuffer());
      } catch {
        await sleep(1200 * (k + 1));
      }
    }
    if (buf) fs.writeFileSync(gocFile, buf);
  }
  if (!buf) {
    loi++;
    return;
  }
  tongTruoc += buf.length;

  const laSvg = duoiGoc === "svg" || buf.slice(0, 200).toString().includes("<svg");
  const laGif = duoiGoc === "gif";

  if (laSvg) {
    const f = bam(u) + ".svg";
    fs.writeFileSync(path.join(OUT_ANH, f), buf);
    mapAnh[u] = "/de-an/anh/" + f;
    tongSau += buf.length;
  } else if (laGif) {
    const f = bam(u) + ".gif";
    fs.writeFileSync(path.join(OUT_ANH, f), buf);
    mapAnh[u] = "/de-an/anh/" + f;
    tongSau += buf.length;
  } else {
    try {
      const meta = await sharp(buf).metadata();
      if (meta.width) kichThuoc[u] = [meta.width, meta.height || 0];
      const out = await sharp(buf)
        .rotate()
        .resize({ width: 1400, height: 1400, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82, effort: 4 })
        .toBuffer();
      const f = bam(u) + ".webp";
      fs.writeFileSync(path.join(OUT_ANH, f), out);
      mapAnh[u] = "/de-an/anh/" + f;
      tongSau += out.length;
    } catch {
      const f = bam(u) + "." + duoiGoc;
      fs.writeFileSync(path.join(OUT_ANH, f), buf);
      mapAnh[u] = "/de-an/anh/" + f;
      tongSau += buf.length;
    }
  }

  xong++;
  if (xong % 40 === 0) console.log(`  anh ${xong}/${danhSach.length} | ${(tongSau / 1e6).toFixed(1)} MB`);
});

console.log(
  `anh xong: ${xong}/${danhSach.length} | goc ${(tongTruoc / 1e6).toFixed(1)} MB -> ${(tongSau / 1e6).toFixed(1)} MB | loi ${loi}`,
);

function lamSach(html) {
  let h = html.replace(/<!--[\s\S]*?-->/g, "");
  h = h.replace(/<script\b[\s\S]*?<\/script>/gi, "");
  h = h.replace(/<style\b[\s\S]*?<\/style>/gi, "");
  h = h.replace(/<iframe\b[^>]*src="([^"]+)"[^>]*>[\s\S]*?<\/iframe>/gi, (_, src) => {
    const yt = /youtube(?:-nocookie)?\.com\/(?:embed|watch\?v=)\/?([A-Za-z0-9_-]{6,})/.exec(src);
    if (yt) {
      return `<p class="de-an-video"><a href="https://www.youtube.com/watch?v=${yt[1]}" target="_blank" rel="noopener noreferrer">Xem video trên YouTube</a></p>`;
    }
    return "";
  });
  h = h.replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  h = h.replace(/\s(src|href)\s*=\s*"(javascript:[^"]*)"/gi, ' $1="#"');
  h = h.replace(/<img\b[^>]*>/gi, (tag) => {
    const src = (/src="([^"]+)"/i.exec(tag) || [])[1];
    if (!src) return "";
    const u = chuanUrl(src);
    const local = mapAnh[u];
    if (!local) return "";
    const alt = (/alt="([^"]*)"/i.exec(tag) || [])[1] || "";
    const kt = kichThuoc[u];
    if (kt) {
      const rong = kt[0] >= 480;
      return `<img src="${local}" alt="${alt}" width="${kt[0]}" height="${kt[1]}" loading="lazy"${rong ? ' class="anh-rong"' : ""} />`;
    }
    return `<img src="${local}" alt="${alt}" loading="lazy" />`;
  });
  h = h.replace(/<a\b([^>]*)>/gi, (m, attrs) => {
    if (/href="https?:/i.test(attrs) && !/target=/i.test(attrs)) {
      return `<a${attrs} target="_blank" rel="noopener noreferrer">`;
    }
    return m;
  });
  return h.trim();
}

let tongHtml = 0;
let tongGz = 0;
for (const p of posts) {
  const html = lamSach(p.content?.rendered || "");
  const gz = zlib.gzipSync(Buffer.from(html, "utf8"), { level: 9 });
  fs.writeFileSync(path.join(OUT_HTML, `${p.slug}.html.gz`), gz);
  tongHtml += html.length;
  tongGz += gz.length;
}

fs.writeFileSync(OUT_MAP, JSON.stringify(mapAnh, null, 0) + "\n", "utf8");
console.log(
  `html: ${(tongHtml / 1e6).toFixed(1)} MB -> gz ${(tongGz / 1e6).toFixed(1)} MB (${posts.length} trang)`,
);
