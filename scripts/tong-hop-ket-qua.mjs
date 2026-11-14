import { readFileSync } from 'node:fs';

const file = new URL('../data/.danh-gia/', import.meta.url);
const docPhan = (p) => readFileSync(new URL(p, file), 'utf8')
  .trim().split(/\r?\n/).slice(1)
  .map((line) => {
    const cells = [];
    let cur = '', inQuote = false;
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote; continue; }
      if (ch === ',' && !inQuote) { cells.push(cur); cur = ''; continue; }
      cur += ch;
    }
    cells.push(cur);
    return {
      id: cells[0], che_do: cells[1], lop: cells[2], nhom: cells[3], muc: cells[4],
      loai: cells[5], ms: +cells[6], json_hop_le: +cells[7], so_khoi: +cells[8],
      khoi_hop_le: +cells[9], so_truong: +cells[10], truong_khop: +cells[11], loi: cells[12] || '',
    };
  });

const pct = (arr, q) => {
  if (!arr.length) return NaN;
  const s = [...arr].sort((a, b) => a - b);
  const i = Math.min(s.length - 1, Math.ceil(q * s.length) - 1);
  return s[i];
};
const mean = (arr) => arr.reduce((a, b) => a + b, 0) / (arr.length || 1);
const sd = (arr) => {
  const m = mean(arr);
  return Math.sqrt(mean(arr.map((x) => (x - m) ** 2)));
};
const okMs = (rows) => rows.filter((r) => r.loi === '').map((r) => r.ms);

const phanLoaiLoi = (loi) => {
  if (/429|rate/.test(loi)) return 'gioi_han_tan_suat';
  if (/429|rate|timeout|network|fetch|transport/.test(loi)) return 'van_chuyen';
  if (/json/.test(loi)) return 'dinh_dang';
  return 'khac';
};

const hoSo = { grounded: docPhan('he-thong-grounded.csv'), baseline: docPhan('he-thong-baseline.csv') };

const nhomSoLieu = (rows) => {
  const loiNhoms = {};
  for (const r of rows.filter((r) => r.loi)) {
    const g = phanLoaiLoi(r.loi);
    loiNhoms[g] = (loiNhoms[g] || 0) + 1;
  }
  return {
    n: rows.length,
    json_hop_le: rows.filter((r) => r.json_hop_le === 1).length,
    khoi_da_xuat: rows.reduce((a, r) => a + r.so_khoi, 0),
    khoi_hop_le: rows.reduce((a, r) => a + r.khoi_hop_le, 0),
    truong_da_xuat: rows.reduce((a, r) => a + r.so_truong, 0),
    truong_khop: rows.reduce((a, r) => a + r.truong_khop, 0),
    ms: okMs(rows),
    loiNhoms,
  };
};

const inSoLieu = (ten, s) => {
  const ms = s.ms;
  console.log(`--- ${ten} (n=${s.n})`);
  console.log(`  json: ${s.json_hop_le}/${s.n} (${((s.json_hop_le / s.n) * 100).toFixed(1)}%)`);
  console.log(`  khoi: ${s.khoi_hop_le}/${s.khoi_da_xuat} (${s.khoi_da_xuat ? ((s.khoi_hop_le / s.khoi_da_xuat) * 100).toFixed(1) : '-'}%)`);
  console.log(`  truong: ${s.truong_khop}/${s.truong_da_xuat} (${s.truong_da_xuat ? ((s.truong_khop / s.truong_da_xuat) * 100).toFixed(1) : '-'}%)`);
  if (ms.length) console.log(`  ms: p50 ${pct(ms, .5)} · p95 ${pct(ms, .95)} · mean ${mean(ms).toFixed(0)} · sd ${sd(ms).toFixed(0)} · max ${Math.max(...ms)}`);
  const loi = JSON.stringify(s.loiNhoms);
  if (loi !== '{}') console.log(`  loi: ${loi}`);
};

for (const [cheDo, rows] of Object.entries(hoSo)) {
  inSoLieu(`TONG ${cheDo}`, nhomSoLieu(rows));
  const theoNhom = {};
  for (const r of rows) (theoNhom[r.nhom] ??= []).push(r);
  for (const [nhom, rs] of Object.entries(theoNhom)) inSoLieu(`nhom=${nhom}`, nhomSoLieu(rs));
  const theoMuc = {};
  for (const r of rows) (theoMuc[r.muc] ??= []).push(r);
  for (const [muc, rs] of Object.entries(theoMuc)) inSoLieu(`muc=${muc}`, nhomSoLieu(rs));
  const theoLop = {};
  for (const r of rows) (theoLop[r.lop] ??= []).push(r);
  for (const [lop, rs] of Object.entries(theoLop)) inSoLieu(lop, nhomSoLieu(rs));
}

const dayMs = (cheDo) => hoSo[cheDo].filter((r) => r.loi === '').map((r) => r.ms);
const gs = dayMs('grounded'), bs = dayMs('baseline');
console.log(`\n--- SO SANH (lượt OK)`);
console.log(`grounded: n=${gs.length} p50 ${pct(gs, .5)} p95 ${pct(gs, .95)}`);
console.log(`baseline: n=${bs.length} p50 ${pct(bs, .5)} p95 ${pct(bs, .95)}`);
