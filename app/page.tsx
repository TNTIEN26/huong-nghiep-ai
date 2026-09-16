import CareerConsult from "./components/CareerConsult";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600">
        <div className="mx-auto w-full max-w-4xl px-6 py-16 text-center">
          <p className="inline-block rounded-full bg-white/20 px-4 py-1 text-sm font-medium text-white">
            Dành cho học sinh cấp 2 & cấp 3 Việt Nam
          </p>
          <h1 className="mt-5 text-3xl font-extrabold leading-tight text-white sm:text-5xl">
            Trợ lý AI định hướng nghề nghiệp
            <br className="hidden sm:block" /> & chọn khối thi
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-indigo-100 sm:text-lg">
            Không biết mình hợp ngành gì? Mạnh môn nào, yếu môn nào, thích làm gì?
            Hãy trả lời vài câu hỏi ngắn, AI chuyên gia sẽ gợi ý ngành nghề phù hợp,
            khối thi tương ứng và lộ trình học tập rõ ràng.
          </p>
        </div>
      </header>

      <main className="flex-1 bg-slate-50 px-6 py-10">
        <CareerConsult />
      </main>

      <footer className="bg-slate-900 px-6 py-6 text-center text-sm text-slate-400">
        <p>
          Gợi ý mang tính tham khảo, không thay thế tư vấn trực tiếp từ thầy cô hoặc chuyên gia.
          Điểm chuẩn đại học thay đổi hằng năm theo Bộ Giáo dục và Đào tạo.
        </p>
      </footer>
    </div>
  );
}