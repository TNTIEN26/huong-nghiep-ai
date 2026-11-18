import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import sharp from "sharp";

const URL_HOME = "https://huongnghiep.hocmai.vn/";
const CACHE = "C:/Users/Jido/AppData/Local/Temp/opencode/anh-tin-tuc";
const OUT_ANH = path.resolve("public/tin-tuc");
const OUT = path.resolve("data/tin-tuc.json");

const NHOM = ["Thi vào 10", "Tốt nghiệp THPT", "ĐGTD TSA", "ĐGNL HN", "ĐGNL HCM"];

const NAMED = {
  amp: "&",
  nbsp: " ",
  quot: '"',
  apos: "'",
  lt: "<",
  gt: ">",
  hellip: "…",
  ndash: "–",
  mdash: "—",
  laquo: "«",
  raquo: "»",
};

function giaiMa(s) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, t) => NAMED[t.toLowerCase()] ?? m);
}

function boThe(s) {
  return giaiMa(s.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function bam(s) {
  return crypto.createHash("md5").update(s).digest("hex").slice(0, 10);
}

function slugAnh(link) {
  const m = link.match(/hocmai\.vn\/([^/?#]+)/);
  const goc = m ? decodeURIComponent(m[1]) : bam(link);
  const sach = goc
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return sach || bam(link);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const r = await fetch(URL_HOME, {
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Accept-Language": "vi-VN,vi;q=0.9",
  },
  signal: AbortSignal.timeout(30000),
});
if (!r.ok) throw new Error("HTTP " + r.status);
const html = await r.text();
console.log("tai trang chu:", r.status, html.length);

const baiViet = [];
for (const m of html.matchAll(/<article class="elementor-post[^"]*"[\s\S]*?<\/article>/g)) {
  const khoi = m[0];
  const href = /<a class="elementor-post__thumbnail__link" href="([^"]+)"/.exec(khoi)?.[1];
  if (!href) continue;
  const h3 = /<h3 class="elementor-post__title">([\s\S]*?)<\/h3>/.exec(khoi)?.[1] ?? "";
  const ex = /<div class="elementor-post__excerpt">([\s\S]*?)<\/div>/.exec(khoi)?.[1] ?? "";
  const srcset = /<img[^>]+srcset="([^"]+)"/.exec(khoi)?.[1] ?? "";
  const src = /<img[^>]+src="([^"]+)"/.exec(khoi)?.[1] ?? "";
  let anh = src;
  if (srcset) {
    const ds = srcset
      .split(",")
      .map((x) => x.trim().split(/\s+/))
      .filter((x) => x[0]);
    ds.sort((a, b) => parseInt(b[1] || "0", 10) - parseInt(a[1] || "0", 10));
    if (ds[0]?.[0]) anh = ds[0][0];
  }
  baiViet.push({
    tieuDe: boThe(h3),
    moTa: boThe(ex),
    href: giaiMa(href),
    anhGoc: giaiMa(anh),
  });
}

console.log("bai viet tim thay:", baiViet.length);
if (baiViet.length < 15) throw new Error("khong du 15 bai viet");
const dung = baiViet.slice(0, 15);

fs.mkdirSync(CACHE, { recursive: true });
fs.mkdirSync(OUT_ANH, { recursive: true });

const ketQua = NHOM.map((nhom) => ({ nhom, tin: [] }));
let loi = 0;

for (let i = 0; i < dung.length; i++) {
  const b = dung[i];
  const slug = slugAnh(b.href);
  let anh = "";
  if (b.anhGoc) {
    const gocFile = path.join(CACHE, bam(b.anhGoc) + "-goc");
    let buf = null;
    if (fs.existsSync(gocFile)) {
      buf = fs.readFileSync(gocFile);
    } else {
      for (let k = 0; k < 3 && !buf; k++) {
        try {
          const rr = await fetch(b.anhGoc, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
              Referer: URL_HOME,
            },
            signal: AbortSignal.timeout(30000),
          });
          if (!rr.ok) throw new Error("HTTP " + rr.status);
          buf = Buffer.from(await rr.arrayBuffer());
        } catch (e) {
          console.log("  loi anh:", e.message);
          await sleep(1000 * (k + 1));
        }
      }
      if (buf) fs.writeFileSync(gocFile, buf);
    }
    if (buf) {
      try {
        const out = await sharp(buf)
          .rotate()
          .resize({ width: 900, withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();
        const ten = slug + ".webp";
        fs.writeFileSync(path.join(OUT_ANH, ten), out);
        anh = "/tin-tuc/" + ten;
      } catch (e) {
        console.log("  loi sharp:", b.href, e.message);
        loi++;
      }
    } else {
      loi++;
    }
  }
  ketQua[Math.floor(i / 3)].tin.push({
    tieuDe: b.tieuDe,
    moTa: b.moTa,
    href: b.href,
    anh,
  });
  console.log(
    `[${NHOM[Math.floor(i / 3)]}] ${b.tieuDe.slice(0, 60)} | anh: ${anh ? "co" : "KHONG"}`,
  );
}

fs.writeFileSync(OUT, JSON.stringify(ketQua, null, 1) + "\n", "utf8");
const dungLuong = fs
  .readdirSync(OUT_ANH)
  .reduce((s, f) => s + fs.statSync(path.join(OUT_ANH, f)).size, 0);
console.log(`xong ${dung.length} bai | loi anh: ${loi} | ${(dungLuong / 1e6).toFixed(2)} MB`);
