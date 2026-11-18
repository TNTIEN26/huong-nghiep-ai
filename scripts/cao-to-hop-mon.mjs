import fs from "node:fs";
import path from "node:path";

const RAW = "data/tra-cuu/to-hop.json";
const OUT = "data/tra-cuu/to-hop-mon.json";
const CACHE = "C:/Users/Jido/AppData/Local/Temp/opencode/tohop-mon-trang";
const MOI = process.argv.includes("--moi");
const CONC = 4;

const BASE = "https://huongnghiep.hocmai.vn/to-hop-mon-hoc/";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const ds = JSON.parse(fs.readFileSync(RAW, "utf8")).map((x) => x.ma);
console.log("so ma:", ds.length);

fs.mkdirSync(CACHE, { recursive: true });

function slugCua(ma) {
  return ma.toLowerCase();
}

function docMon(html) {
  const i = html.indexOf('class="tohop-intro"');
  if (i < 0) return { mon: [], tom_tat: "" };
  const j = html.indexOf("</div>", i);
  const sec = html.slice(i, j);
  const tomTat = sec.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const m = /bao gồm các môn thi:\s*<b>([\s\S]*?)<\/b>/i.exec(sec);
  if (!m) return { mon: [], tom_tat: tomTat };
  const raw = m[1]
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&#8211;/g, "-")
    .replace(/&#8217;/g, "'");
  const mon = raw
    .split(/[,;]/)
    .map((x) => x.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  return { mon, tom_tat: tomTat };
}

async function tai(slug) {
  const f = path.join(CACHE, `${slug}.html`);
  if (!MOI && fs.existsSync(f)) {
    return fs.readFileSync(f, "utf8");
  }
  for (let k = 0; k < 3; k++) {
    try {
      const r = await fetch(BASE + slug, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
          "Accept-Language": "vi-VN,vi;q=0.9",
        },
        signal: AbortSignal.timeout(25000),
      });
      if (!r.ok) throw new Error("HTTP " + r.status);
      const t = await r.text();
      fs.writeFileSync(f, t);
      return t;
    } catch {
      await sleep(1200 * (k + 1));
    }
  }
  return "";
}

let i = 0;
const ketQua = [];
const loi = [];
await Promise.all(
  Array.from({ length: CONC }, async () => {
    while (i < ds.length) {
      const k = i++;
      const ma = ds[k];
      const slug = slugCua(ma);
      const html = await tai(slug);
      if (!html) {
        loi.push(`${ma}: khong tai duoc`);
        continue;
      }
      const { mon, tom_tat } = docMon(html);
      ketQua.push({ ma, mon, tom_tat, link: BASE + slug });
      await sleep(400);
    }
  }),
);

ketQua.sort((a, b) => a.ma.localeCompare(b.ma));
fs.writeFileSync(OUT, JSON.stringify(ketQua, null, 1) + "\n", "utf8");
const thieu = ketQua.filter((x) => x.mon.length === 0);
console.log(`xong: ${ketQua.length}/${ds.length} | khong co mon: ${thieu.length} | loi: ${loi.length}`);
console.log("vi du:", ketQua.slice(0, 6).map((x) => `${x.ma} [${x.mon.join(", ")}]`).join(" | "));
if (thieu.length) console.log("thieu:", thieu.map((x) => x.ma).join(","));
if (loi.length) console.log("loi:", loi.slice(0, 5).join(" | "));
