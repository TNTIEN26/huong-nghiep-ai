import fs from "fs";
import path from "path";

import type { KhoiThi, NganhNghe, TruongDH } from "./types";

const dataDir = path.join(process.cwd(), "data");

function loadJson<T>(name: string): T {
  return JSON.parse(fs.readFileSync(path.join(dataDir, name), "utf-8")) as T;
}

export const khoiThiList = loadJson<KhoiThi[]>("khoi-thi.json");
export const nganhNgheList = loadJson<NganhNghe[]>("nganh-nghe.json");
export const truongDhList = loadJson<TruongDH[]>("truong-dh.json");