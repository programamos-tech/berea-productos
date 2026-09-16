import { FavoritosView } from "@/components/store/FavoritosView";
import { getStorefrontChromeForRequest } from "@/lib/tenant-context";

export async function generateMetadata() {
  const chrome = await getStorefrontChromeForRequest();
  return { title: `Favoritos | ${chrome.name}` };
}

export default function FavoritosPage() {
  return <FavoritosView />;
}
