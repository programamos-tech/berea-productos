import {
  storeAnnouncementMessage,
  storeCopyrightHolder,
  storeInstagramUrl,
  storeShortDescription,
  storeSupportEmail,
  storeSupportHours,
  storeSupportPhone,
  storeTagline,
  storeWhatsAppPrefilledText,
} from "@/lib/brand";
import {
  adminAccountChrome,
  parseTenantBrand,
  type TenantBrand,
  type TenantBrandBank,
} from "@/lib/tenant-brand";

export type StorefrontCheckoutMode = "wompi" | "transfer";

export type StorefrontTheme = {
  primary: string;
  primaryHover: string;
  foreground: string;
  announcement: string;
  imageTint: string;
  wash: string;
};

/** Cookie para pintar overlay de checkout / vars en html antes de React. */
export const STORE_THEME_COOKIE = "berea_store_theme";

export type StorefrontChrome = {
  tenantId: string;
  tenantSlug: string;
  name: string;
  logoSrc: string;
  logoSquare: boolean;
  primaryColor: string;
  tagline: string;
  description: string;
  announcement: string;
  phone: string;
  email: string;
  supportHours: string;
  whatsappUrl: string | null;
  whatsappPrefilledText: string;
  instagramUrl: string | null;
  copyrightHolder: string;
  bank?: TenantBrandBank;
  checkoutMode: StorefrontCheckoutMode;
  theme: StorefrontTheme;
};

export type StorefrontClientChrome = Omit<StorefrontChrome, "bank">;

export function storefrontClientChrome(
  chrome: StorefrontChrome,
): StorefrontClientChrome {
  const clientChrome: Partial<StorefrontChrome> = { ...chrome };
  delete clientChrome.bank;
  return clientChrome as StorefrontClientChrome;
}

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

export function normalizeStorefrontColor(
  value: string | null | undefined,
  fallback = "#18181B",
): string {
  const color = String(value ?? "").trim();
  return HEX_COLOR.test(color) ? color.toUpperCase() : fallback;
}

function rgb(hex: string): [number, number, number] {
  return [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ];
}

function mix(hex: string, target: number, amount: number): string {
  const channels = rgb(hex).map((channel) =>
    Math.round(channel + (target - channel) * amount),
  );
  return `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

function readableForeground(hex: string): string {
  const [red, green, blue] = rgb(hex).map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  return luminance > 0.46 ? "#18181B" : "#FFFFFF";
}

export function buildStorefrontTheme(primaryRaw?: string): StorefrontTheme {
  const primary = normalizeStorefrontColor(primaryRaw);
  return {
    primary,
    primaryHover: mix(primary, 0, 0.14),
    foreground: readableForeground(primary),
    announcement: mix(primary, 255, 0.9),
    imageTint: mix(primary, 255, 0.82),
    wash: mix(primary, 255, 0.92),
  };
}

export function storefrontCssVars(
  theme: StorefrontTheme,
): Record<`--${string}`, string> {
  return {
    "--store-accent": theme.primary,
    "--store-accent-hover": theme.primaryHover,
    "--store-brand": theme.primary,
    "--store-brand-hover": theme.primaryHover,
    "--store-header-bg": theme.primary,
    "--store-header-fg": theme.foreground,
    "--store-announcement-bg": theme.announcement,
    "--store-image-well-tint": theme.imageTint,
    "--store-wash": theme.wash,
  };
}

function checkoutMode(raw: unknown): StorefrontCheckoutMode {
  if (
    raw &&
    typeof raw === "object" &&
    (raw as Record<string, unknown>).checkout_mode === "wompi"
  ) {
    return "wompi";
  }
  return "transfer";
}

function optionalUrl(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export function buildStorefrontChrome(input: {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  brandRaw: unknown;
  storefrontConfigRaw: unknown;
}): StorefrontChrome {
  const brand: TenantBrand = parseTenantBrand(input.brandRaw);
  const isAleya = input.tenantSlug === "aleya";
  const account = adminAccountChrome({
    slug: input.tenantSlug,
    name: input.tenantName,
    brand: input.brandRaw,
  });
  const name = brand.trade_name || account.name || input.tenantName;
  const primaryColor = normalizeStorefrontColor(
    brand.primary_color,
    isAleya ? "#FF76A1" : "#18181B",
  );
  const phone = brand.phone || (isAleya ? storeSupportPhone : "");
  const whatsappDigits = (brand.whatsapp || phone).replace(/\D/g, "");

  return {
    tenantId: input.tenantId,
    tenantSlug: input.tenantSlug,
    name,
    logoSrc: account.logoSrc,
    logoSquare: account.logoSquare,
    primaryColor,
    tagline: brand.tagline || (isAleya ? storeTagline : `Catálogo de ${name}`),
    description:
      brand.description ||
      (isAleya
        ? storeShortDescription
        : `Conoce los productos disponibles de ${name}.`),
    announcement:
      brand.announcement ||
      (isAleya
        ? storeAnnouncementMessage
        : `${name} · productos disponibles · atención personalizada`),
    phone,
    email: brand.email || (isAleya ? storeSupportEmail : ""),
    supportHours:
      brand.support_hours ||
      (isAleya ? storeSupportHours : "Atención según disponibilidad"),
    whatsappUrl: whatsappDigits ? `https://wa.me/${whatsappDigits}` : null,
    whatsappPrefilledText: isAleya
      ? storeWhatsAppPrefilledText
      : `Hola, te escribo desde el catálogo de ${name}.`,
    instagramUrl:
      optionalUrl(brand.instagram_url) || (isAleya ? storeInstagramUrl : null),
    copyrightHolder:
      brand.legal_name || brand.trade_name || (isAleya ? storeCopyrightHolder : name),
    bank: brand.bank,
    checkoutMode: checkoutMode(input.storefrontConfigRaw),
    theme: buildStorefrontTheme(primaryColor),
  };
}
