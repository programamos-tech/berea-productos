import Image from "next/image";
import Link from "next/link";
import { adminProductBrand, adminSidebarLogoPath } from "@/lib/brand";
import { storeShellClass } from "@/lib/store-theme";
import type { StorefrontChrome } from "@/lib/storefront-brand";

const footerColumnTitle =
  "text-[11px] font-semibold uppercase tracking-[0.14em] text-white/90";

const footerLink =
  "block text-sm leading-relaxed text-white/85 transition hover:text-white hover:underline underline-offset-4";

const footerLinkMuted =
  "text-[11px] text-white/75 transition hover:text-white hover:underline underline-offset-4 sm:text-xs";

export function StoreFooter({ chrome }: { chrome: StorefrontChrome }) {
  const year = new Date().getFullYear();
  const telHref = chrome.phone
    ? `tel:${chrome.phone.replace(/[^\d+]/g, "")}`
    : null;

  return (
    <footer className="border-t border-white/20 bg-[var(--store-header-bg)] text-[var(--store-header-fg)]">
      {/* 1 · Columnas de navegación */}
      <div>
        <div className={`${storeShellClass} py-10 sm:py-12 lg:py-14`}>
          <div className="flex flex-col gap-10 lg:gap-12">
            <div className="flex justify-center px-2">
              <Link
                href="/"
                className="inline-block outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-white/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--store-header-bg)]"
              >
                <Image
                  src={chrome.logoSrc}
                  alt={chrome.name}
                  width={560}
                  height={200}
                  unoptimized
                  className="h-14 w-auto max-w-[min(88vw,20rem)] bg-transparent object-contain object-center sm:h-16 sm:max-w-[min(85vw,24rem)] md:h-[4.5rem] lg:h-20 lg:max-w-[min(80vw,28rem)] xl:h-24 xl:max-w-[32rem]"
                  style={{ backgroundColor: "transparent" }}
                />
              </Link>
            </div>
            <div className="min-w-0 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
              <div>
                <p className={footerColumnTitle}>Ayuda</p>
                <ul className="mt-5 space-y-3">
                  {telHref ? (
                    <li>
                      <a href={telHref} className={footerLink}>
                        Llámanos · {chrome.phone}
                      </a>
                    </li>
                  ) : null}
                  {chrome.email ? (
                    <li>
                      <a
                        href={`mailto:${chrome.email}`}
                        className={footerLink}
                      >
                        {chrome.email}
                      </a>
                    </li>
                  ) : null}
                  {chrome.whatsappUrl ? (
                    <li>
                      <a
                        href={chrome.whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={footerLink}
                      >
                        WhatsApp
                      </a>
                    </li>
                  ) : null}
                  <li>
                    <span className="text-sm leading-relaxed text-white/80">
                      {chrome.supportHours}
                    </span>
                  </li>
                </ul>
              </div>

              <div>
                <p className={footerColumnTitle}>Tienda</p>
                <ul className="mt-5 space-y-3">
                  <li>
                    <Link href="/" className={footerLink}>
                      Inicio
                    </Link>
                  </li>
                  <li>
                    <Link href="/products" className={footerLink}>
                      Productos
                    </Link>
                  </li>
                  <li>
                    <Link href="/checkout" className={footerLink}>
                      Bolsa
                    </Link>
                  </li>
                  <li>
                    <Link href="/favoritos" className={footerLink}>
                      Favoritos
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <p className={footerColumnTitle}>Sobre nosotros</p>
                <ul className="mt-5 space-y-3">
                  <li>
                    <Link href="/quien-soy" className={footerLink}>
                      Quién soy
                    </Link>
                  </li>
                  <li>
                    <Link href="/products" className={footerLink}>
                      Catálogo completo
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <p className={footerColumnTitle}>Síguenos</p>
                <ul className="mt-5 space-y-3">
                  {chrome.instagramUrl ? (
                    <li>
                      <a
                        href={chrome.instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={footerLink}
                      >
                        Instagram
                      </a>
                    </li>
                  ) : null}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2 · Legal */}
      <div className="border-t border-white/15">
        <div className={`${storeShellClass} flex flex-col gap-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6`}>
          <p className="text-[11px] text-white/70 sm:text-xs">
            © {year} {chrome.copyrightHolder}. Todos los derechos reservados.
          </p>
          <div className="flex w-full flex-col items-end gap-4 sm:w-auto sm:flex-row sm:items-center sm:justify-end sm:gap-8">
            <nav
              aria-label="Legal y equipo"
              className="flex flex-wrap justify-end gap-x-6 gap-y-2 text-[11px] sm:text-xs"
            >
              <Link href="/privacidad" className={footerLinkMuted}>
                Privacidad
              </Link>
              <Link href="/terminos" className={footerLinkMuted}>
                Términos de uso
              </Link>
              <Link href="/cookies" className={footerLinkMuted}>
                Cookies
              </Link>
              <Link
                href="/admin"
                className={`${footerLinkMuted} font-semibold text-white/90`}
              >
                Backoffice
              </Link>
            </nav>
            <div className="flex shrink-0 flex-col items-end gap-1 sm:pl-1">
              <span className="text-[8px] font-medium uppercase tracking-[0.16em] text-white/45">
                Powered by
              </span>
              <Image
                src={adminSidebarLogoPath}
                alt={adminProductBrand}
                width={280}
                height={146}
                unoptimized
                className="h-5 w-auto max-w-[7.25rem] bg-transparent object-contain object-right opacity-70 sm:h-6"
                style={{ backgroundColor: "transparent" }}
              />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
