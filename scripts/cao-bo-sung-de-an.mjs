import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import sharp from "sharp";

const RAW = "C:/Users/Jido/AppData/Local/Temp/opencode/hocmai-raw/de-an.json";
const CACHE = "C:/Users/Jido/AppData/Local/Temp/opencode/anh-truong-de-an";
const OUT_ANH = path.resolve("public/de-an/truong");
const OUT = path.resolve("data/tra-cuu/de-an-bo-sung.json");
const CONC = 6;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function bam(s) {
  return crypto.createHash("md5").update(s).digest("hex").slice(0, 12);
}

async function pool(items, n, fn) {
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (i < items.length) {
        const k = i++;
        try {
          await fn(items[k], k);
        } catch (e) {
          console.log("  loi:", e.message);
        }
      }
    }),
  );
}

console.log("== tai ten phuong thuc ==");
const rPt = await fetch(
  "https://huongnghiep.hocmai.vn/wp-json/wp/v2/phuong-thuc-xet-tuyen?per_page=100&_fields=id,name",
  { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(25000) },
);
const dsPt = await rPt.json();
const tenPt = new Map(dsPt.map((t) => [t.id, t.name]));
console.log("phuong thuc:", dsPt.length);

const posts = JSON.parse(fs.readFileSync(RAW, "utf8"));
console.log("posts:", posts.length);

fs.mkdirSync(CACHE, { recursive: true });
fs.mkdirSync(OUT_ANH, { recursive: true });

const ketQua = {};
let loi = 0;
let xong = 0;

await pool(posts, CONC, async (p) => {
  const h = p.content?.rendered || "";
  const m =
    /<img[^>]*class="[^"]*basic-info__image-school[^"]*"[^>]*src="([^"]+)"/i.exec(h) ||
    /<img[^>]*src="([^"]+)"[^>]*class="[^"]*basic-info__image-school[^"]*"/i.exec(h);
  const phuongThuc = (p["phuong-thuc-xet-tuyen"] || []).map((id) => tenPt.get(id)).filter(Boolean);
  const ban = { phuong_thuc: phuongThuc, anh: null };
  ketQua[p.slug] = ban;

  if (!m) return;
  const url = m[1].replace(/&amp;/g, "&").replace(/^\/\//, "https://");
  const duoi = (url.split("?")[0].match(/\.([a-z0-9]+)$/i) || [, "jpg"])[1].toLowerCase();
  const gocFile = path.join(CACHE, bam(url) + "." + duoi);
  let buf = null;
  if (fs.existsSync(gocFile)) {
    buf = fs.readFileSync(gocFile);
  } else {
    for (let k = 0; k < 3 && !buf; k++) {
      try {
        const r = await fetch(url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
            Referer: "https://huongnghiep.hocmai.vn/",
          },
          signal: AbortSignal.timeout(25000),
        });
        if (!r.ok) throw new Error("HTTP " + r.status);
        buf = Buffer.from(await r.arrayBuffer());
      } catch {
        await sleep(1000 * (k + 1));
      }
    }
    if (buf) fs.writeFileSync(gocFile, buf);
  }
  if (!buf) {
    loi++;
    return;
  }
  const laSvg = duoi === "svg" || buf.slice(0, 200).toString().includes("<svg");
  try {
    if (laSvg) {
      const f = p.slug + ".svg";
      fs.writeFileSync(path.join(OUT_ANH, f), buf);
      ban.anh = "/de-an/truong/" + f;
    } else {
      const out = await sharp(buf)
        .rotate()
        .resize({ width: 400, height: 400, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
      const f = p.slug + ".webp";
      fs.writeFileSync(path.join(OUT_ANH, f), out);
      ban.anh = "/de-an/truong/" + f;
    }
  } catch {
    const f = p.slug + "." + duoi;
    fs.writeFileSync(path.join(OUT_ANH, f), buf);
    ban.anh = "/de-an/truong/" + f;
  }
  xong++;
});

fs.writeFileSync(OUT, JSON.stringify(ketQua, null, 1) + "\n", "utf8");
const coAnh = Object.values(ketQua).filter((x) => x.anh).length;
const coPt = Object.values(ketQua).filter((x) => x.phuong_thuc.length > 0).length;
const dungLuong = fs.readdirSync(OUT_ANH).reduce((s, f) => s + fs.statSync(path.join(OUT_ANH, f)).size, 0);
console.log(`xong: ${xong}/${posts.length} | co anh: ${coAnh} | co phuong thuc: ${coPt} | loi: ${loi}`);
console.log(`dung luong anh: ${(dungLuong / 1e6).toFixed(2)} MB`);
console.log("vd:", JSON.stringify(ketQua[posts[0].slug], null, 1));
