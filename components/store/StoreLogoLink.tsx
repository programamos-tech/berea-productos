"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { flashStorePageEnter } from "@/components/store/StorePageEnter";

export function StoreLogoLink({
  href = "/",
  brand,
  logoPath,
  square = false,
  className,
}: {
  href?: string;
  brand: string;
  logoPath: string;
  square?: boolean;
  className?: string;
}) {
  const pathname = usePathname() || "/";

  return (
    <Link
      href={href}
      className={className}
      onClick={(e) => {
        if (pathname === href || (href === "/" && pathname === "/")) {
          e.preventDefault();
          flashStorePageEnter();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }}
    >
      <Image
        src={logoPath}
        alt={brand}
        width={420}
        height={square ? 420 : 150}
        unoptimized
        className={
          square
            ? "mx-auto h-[4.75rem] w-auto max-w-full bg-transparent object-contain object-center sm:h-20 lg:h-[5.75rem] xl:h-24"
            : "mx-auto h-11 w-auto max-w-full bg-transparent object-contain object-center sm:h-12 lg:h-[4.25rem]"
        }
        style={{ backgroundColor: "transparent" }}
        priority
      />
    </Link>
  );
}
