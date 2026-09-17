import Image from "next/image";

export function OperatorAccountLogo({
  src,
  name,
  size = 56,
  plateColor = "#18181B",
}: {
  src: string;
  name: string;
  size?: 32 | 40 | 56 | 64;
  plateColor?: string;
}) {
  const box =
    size === 32
      ? "size-8 rounded-md"
      : size === 40
        ? "size-10 rounded-lg"
        : size === 64
          ? "size-16 rounded-xl"
          : "size-14 rounded-xl";
  const pad =
    size === 32 || size === 40 ? "p-[14%]" : "p-[16%]";

  return (
    <span
      className={`relative block aspect-square ${box} shrink-0 overflow-hidden`}
      style={{ backgroundColor: plateColor }}
    >
      <Image
        src={src}
        alt={name}
        fill
        sizes={`${size}px`}
        unoptimized
        className={`bg-transparent object-contain ${pad}`}
      />
    </span>
  );
}
