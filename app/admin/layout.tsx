import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { AdminThemeProvider } from "@/components/admin/AdminThemeProvider";

export const metadata: Metadata = {
  title: {
    default: "Berea House",
    template: "%s · Berea House",
  },
  applicationName: "Berea House",
  appleWebApp: {
    capable: true,
    title: "Berea House",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light dark",
};

/** Aplica theme-color / color-scheme antes del paint según localStorage del admin. */
const ADMIN_THEME_BOOT = `(function(){try{var t=localStorage.getItem("tiendas-admin-theme");if(t!=="dark"&&t!=="light")t="light";var c=t==="dark"?"#09090b":"#ffffff";document.documentElement.style.colorScheme=t;document.documentElement.style.backgroundColor=c;var metas=document.querySelectorAll('meta[name="theme-color"]');if(!metas.length){var m=document.createElement("meta");m.setAttribute("name","theme-color");document.head.appendChild(m);metas=document.querySelectorAll('meta[name="theme-color"]');}metas.forEach(function(m){m.setAttribute("content",c);m.removeAttribute("media");});var a=document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');if(!a){a=document.createElement("meta");a.setAttribute("name","apple-mobile-web-app-status-bar-style");document.head.appendChild(a);}a.setAttribute("content",t==="dark"?"black-translucent":"default");}catch(e){}})();`;

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Script
        id="admin-theme-boot"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: ADMIN_THEME_BOOT }}
      />
      <AdminThemeProvider>{children}</AdminThemeProvider>
    </>
  );
}
