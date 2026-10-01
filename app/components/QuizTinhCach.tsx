"use client";

import { useState } from "react";

type Nhom = "logic" | "sangtao" | "chamsoc" | "tochuc";

const NHOMS: Record<Nhom, { ten: string; moTa: string; khoi: string[] }> = {
  logic: {
    ten: "Tư duy Logic",
    moTa: "Bạn mạnh về phân tích, số liệu và giải quyết vấn đề. Hợp các ngành kỹ thuật, công nghệ, data.",
    khoi: ["A00", "A01", "D07"],
  },
  sangtao: {
    ten: "Sáng tạo",
    moTa: "Bạn giàu tưởng tượng, thích thể hiện cái tôi. Hợp thiết kế, truyền thông, nghệ thuật, marketing.",
    khoi: ["D01", "D14", "V00"],
  },
  chamsoc: {
    ten: "Chăm sóc",
    moTa: "Bạn thấu cảm, thích giúp đỡ người khác. Hợp y tế, giáo dục, tâm lý, công tác xã hội.",
    khoi: ["B00", "C00", "D01"],
  },
  tochuc: {
    ten: "Tổ chức",
    moTa: "Bạn kỷ luật, giỏi sắp xếp và dẫn dắt. Hợp kinh tế, quản trị, luật, kế toán.",
    khoi: ["A01", "D01", "C01"],
  },
};

const CAU_HOI: { hoi: string; daps: { text: string; nhom: Nhom }[] }[] = [
  {
    hoi: "Giờ ra chơi, bạn thích nhất việc gì?",
    daps: [
      { text: "Ngồi giải đố, chơi cờ, đấu trí", nhom: "logic" },
      { text: "Vẽ vời, viết truyện, chụp ảnh", nhom: "sangtao" },
      { text: "Tâm sự, lắng nghe chuyện bạn bè", nhom: "chamsoc" },
      { text: "Đứng ra tổ chức trò chơi cho lớp", nhom: "tochuc" },
    ],
  },
  {
    hoi: "Bạn bè thường nhờ bạn việc gì?",
    daps: [
      { text: "Sửa máy tính, cài phần mềm", nhom: "logic" },
      { text: "Thiết kế poster, làm slide đẹp", nhom: "sangtao" },
      { text: "Cho lời khuyên lúc buồn", nhom: "chamsoc" },
      { text: "Lên kế hoạch đi chơi cho cả nhóm", nhom: "tochuc" },
    ],
  },
  {
    hoi: "Cuối tuần lý tưởng của bạn là?",
    daps: [
      { text: "Thi đấu trí tuệ, học thêm môn khó", nhom: "logic" },
      { text: "Sáng tác, quay clip, làm đồ handmade", nhom: "sangtao" },
      { text: "Đi tình nguyện, thăm người thân", nhom: "chamsoc" },
      { text: "Dọn phòng, sắp xếp lại mọi thứ", nhom: "tochuc" },
    ],
  },
  {
    hoi: "Ưu điểm lớn nhất của bạn?",
    daps: [
      { text: "Tư duy logic, tính toán nhanh", nhom: "logic" },
      { text: "Trí tưởng tượng phong phú", nhom: "sangtao" },
      { text: "Thấu cảm, dễ gần", nhom: "chamsoc" },
      { text: "Kỷ luật, đúng giờ, có kế hoạch", nhom: "tochuc" },
    ],
  },
  {
    hoi: "Bạn muốn người khác nhớ mình vì điều gì?",
    daps: [
      { text: "Một phát minh, một giải thưởng khoa học", nhom: "logic" },
      { text: "Một tác phẩm để đời", nhom: "sangtao" },
      { text: "Lòng tốt và sự tử tế", nhom: "chamsoc" },
      { text: "Uy tín và khả năng dẫn dắt", nhom: "tochuc" },
    ],
  },
  {
    hoi: "Môn học khiến bạn thấy thời gian trôi nhanh nhất?",
    daps: [
      { text: "Toán, Tin, Lý", nhom: "logic" },
      { text: "Văn, Vẽ, Âm nhạc", nhom: "sangtao" },
      { text: "Sinh, GDCD, Ngoại ngữ", nhom: "chamsoc" },
      { text: "Sử, Địa, Kinh tế - Pháp luật", nhom: "tochuc" },
    ],
  },
];

export default function QuizTinhCach() {
  const [buoc, setBuoc] = useState(0);
  const [diem, setDiem] = useState<Record<Nhom, number>>({ logic: 0, sangtao: 0, chamsoc: 0, tochuc: 0 });
  const [xong, setXong] = useState(false);

  function chon(nhom: Nhom) {
    const moi = { ...diem, [nhom]: diem[nhom] + 1 };
    setDiem(moi);
    if (buoc + 1 >= CAU_HOI.length) setXong(true);
    else setBuoc(buoc + 1);
  }

  function lamLai() {
    setBuoc(0);
    setDiem({ logic: 0, sangtao: 0, chamsoc: 0, tochuc: 0 });
    setXong(false);
  }

  if (xong) {
    const thang = (Object.keys(diem) as Nhom[]).reduce((a, b) => (diem[a] >= diem[b] ? a : b));
    const kq = NHOMS[thang];
    return (
      <div className="rounded-3xl border border-stone-900/10 bg-white p-6 text-center shadow-[0_20px_60px_-30px_rgba(234,88,12,0.35)] sm:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">
          Nhóm tính cách của bạn
        </p>
        <h3 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{kq.ten}</h3>
        <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-stone-500">{kq.moTa}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {kq.khoi.map((k) => (
            <span
              key={k}
              className="rounded-xl border border-orange-600/30 bg-orange-50 px-4 py-2 text-sm font-extrabold text-orange-700"
            >
              Khối {k}
            </span>
          ))}
        </div>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <a
            href="/huong-nghiep"
            className="rounded-xl bg-orange-600 px-7 py-3 text-sm font-bold text-white transition hover:bg-orange-500"
          >
            Hỏi Cú Đậu thêm →
          </a>
          <button
            type="button"
            onClick={lamLai}
            className="rounded-xl border border-stone-900/15 px-7 py-3 text-sm font-bold text-stone-600 transition hover:bg-stone-900/5"
          >
            Làm lại
          </button>
        </div>
        <p className="mt-4 text-xs text-stone-400">
          Kết quả tham khảo để khám phá bản thân, không phải kết luận duy nhất.
        </p>
      </div>
    );
  }

  const ch = CAU_HOI[buoc];
  return (
    <div className="rounded-3xl border border-stone-900/10 bg-white p-6 shadow-[0_20px_60px_-30px_rgba(234,88,12,0.35)] sm:p-10">
      <div className="flex items-center justify-between text-xs font-bold text-stone-500">
        <span>
          Câu {buoc + 1}/{CAU_HOI.length}
        </span>
        <button type="button" onClick={lamLai} className="hover:text-stone-900">
          Làm lại từ đầu
        </button>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-900/10">
        <div
          className="h-full rounded-full bg-orange-500 transition-all duration-300"
          style={{ width: `${((buoc + 1) / CAU_HOI.length) * 100}%` }}
        />
      </div>
      <h3 className="mt-6 text-xl font-extrabold tracking-tight sm:text-2xl">{ch.hoi}</h3>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {(ch.daps as { text: string; nhom: Nhom }[]).map((d) => (
          <button
            key={d.text}
            type="button"
            onClick={() => chon(d.nhom)}
            className="rounded-2xl border border-stone-900/10 bg-[#faf4e9] px-5 py-4 text-left text-[15px] font-semibold text-stone-700 transition hover:border-orange-400/60 hover:bg-orange-50 hover:text-stone-900"
          >
            {d.text}
          </button>
        ))}
      </div>
    </div>
  );
}
