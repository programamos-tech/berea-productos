import type { Metadata } from "next";
import Link from "next/link";
import { BereaWord } from "@/components/brand/BereaWord";

export const metadata: Metadata = {
  title: {
    default: "Berea Productos",
    template: "%s · Berea Productos",
  },
  description: "Creá tu tienda de productos con Berea House",
};

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-900 antialiased">
      <header className="border-b border-zinc-200/80 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/empezar" className="inline-flex items-center gap-2 no-underline">
            <BereaWord className="text-[1.7rem] text-[#0197b2]" />
          </Link>
          <Link
            href="/admin/login"
            className="text-sm font-medium text-zinc-600 underline-offset-2 hover:text-zinc-900 hover:underline"
          >
            Ya tengo cuenta
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}
