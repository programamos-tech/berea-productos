import Image from "next/image";

export function OperatorAccountLogo({
  src,
  name,
  size = 56,
}: {
  src: string;
  name: string;
  size?: 40 | 56 | 64;
}) {
  const box =
    size === 40 ? "size-10 rounded-lg" : size === 64 ? "size-16 rounded-xl" : "size-14 rounded-xl";
  return (
    <span
      className={`relative block aspect-square ${box} shrink-0 overflow-hidden ring-1 ring-zinc-200/80 dark:ring-zinc-700/80`}
    >
      <Image
        src={src}
        alt={name}
        fill
        sizes={`${size}px`}
        className="object-cover"
      />
    </span>
  );
}
