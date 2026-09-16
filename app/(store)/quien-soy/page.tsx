import Link from "next/link";
import { getStorefrontChromeForRequest } from "@/lib/tenant-context";

export async function generateMetadata() {
  const chrome = await getStorefrontChromeForRequest();
  return { title: `Quiénes somos | ${chrome.name}` };
}

export default async function QuienSoyPage() {
  const chrome = await getStorefrontChromeForRequest();
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-[var(--store-brand)] sm:text-4xl">
        Quiénes somos
      </h1>
      <p className="mt-2 text-sm font-medium text-stone-600">{chrome.tagline}</p>
      <p className="mt-6 text-sm leading-relaxed text-stone-600 sm:text-base">
        Detrás de {chrome.name} hay un equipo que cuida cada detalle: productos
        seleccionados, asesoría cercana y envíos coordinados para que compres con
        confianza.
      </p>
      <p className="mt-4 text-sm leading-relaxed text-stone-600 sm:text-base">
        Trabajamos con productos originales y envíos a toda Colombia, con la misma
        cercanía que en redes: asesoría clara, entregas coordinadas y catálogo
        actualizado.
      </p>
      <p className="mt-4 text-sm leading-relaxed text-stone-600 sm:text-base">
        Si tienes dudas sobre tallas, marcas o tiempos de envío, escríbeme: estoy para
        ayudarte a comprar con confianza.
      </p>
      <Link
        href="/products"
        className="mt-8 inline-flex rounded-xl bg-[var(--store-brand)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--store-brand-hover)]"
      >
        Ver productos
      </Link>
    </div>
  );
}
