import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { Geist_Mono, Poppins } from "next/font/google";
import Script from "next/script";
import { storeBrand, storeShortDescription } from "@/lib/brand";
import {
  ADMIN_CORAL,
  ADMIN_CORAL_DEEP,
  ADMIN_CORAL_HOVER,
  ADMIN_CORAL_MIST,
  ADMIN_CORAL_SOFT,
  ADMIN_SIDEBAR_BG,
  STORE_CHROME_BG,
} from "@/lib/admin-theme";
import { storeCheckoutBootScriptSource } from "@/lib/store-checkout-nav";
import {
  STORE_ACCENT,
  STORE_ACCENT_HOVER,
  STORE_ANNOUNCEMENT_BG,
  STORE_BRAND,
  STORE_BRAND_HOVER,
  STORE_IMAGE_WELL,
  STORE_IMAGE_WELL_TINT,
} from "@/lib/store-theme";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: storeBrand,
  description: storeShortDescription,
  /** Favicon: `app/icon.svg` + `app/apple-icon.png` (marca Milagros). */
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${poppins.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Stack+Sans+Notch:wght@200..700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="flex min-h-full flex-col bg-white text-stone-800"
        style={
          {
            "--admin-sidebar-bg": ADMIN_SIDEBAR_BG,
            "--admin-coral": ADMIN_CORAL,
            "--admin-coral-hover": ADMIN_CORAL_HOVER,
            "--admin-coral-deep": ADMIN_CORAL_DEEP,
            "--admin-coral-soft": ADMIN_CORAL_SOFT,
            "--admin-coral-mist": ADMIN_CORAL_MIST,
            "--store-chrome-bg": STORE_CHROME_BG,
            "--store-accent": STORE_ACCENT,
            "--store-accent-hover": STORE_ACCENT_HOVER,
            "--store-brand": STORE_BRAND,
            "--store-brand-hover": STORE_BRAND_HOVER,
            "--store-image-well": STORE_IMAGE_WELL,
            "--store-image-well-tint": STORE_IMAGE_WELL_TINT,
            "--store-announcement-bg": STORE_ANNOUNCEMENT_BG,
          } as CSSProperties
        }
      >
        <Script
          id="store-checkout-boot"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: storeCheckoutBootScriptSource(storeBrand),
          }}
        />
        {children}
      </body>
    </html>
  );
}
