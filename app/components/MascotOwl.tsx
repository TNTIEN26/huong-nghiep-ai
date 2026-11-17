import Image from "next/image";

// Linh vật cú — ảnh vẽ tay (public/cudem.png), nền trong suốt.
// Bay nhẹ (keyframes bob-nhe trong globals.css).
export default function MascotOwl({
  className = "h-24 w-24",
  src = "/cudem.png",
  bay = true,
}: {
  className?: string;
  /** Ảnh linh vật (public/). */
  src?: string;
  /** Tắt hiệu ứng bay lắc (dùng cho logo ở menu). */
  bay?: boolean;
}) {
  return (
    <Image
      src={src}
      alt="Linh vật cú Cú Đậu"
      width={500}
      height={500}
      draggable={false}
      className={`${bay ? "bob-nhe" : ""} ${className}`}
    />
  );
}
