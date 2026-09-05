/** Cookie + sessionStorage + evento para cubrir bolsa → checkout hasta que el contenido esté listo. */

export const STORE_CHECKOUT_NAV_COOKIE = "store_nav_checkout";
export const STORE_CHECKOUT_NAV_START_EVENT = "store:checkout-nav-start";
export const STORE_CHECKOUT_READY_EVENT = "store:checkout-ready";
export const STORE_CHECKOUT_BOOT_OVERLAY_ID = "store-checkout-boot-overlay";
export const STORE_CHECKOUT_NAV_HTML_CLASS = "store-checkout-nav-pending";
/** Tiempo mínimo del overlay tras el ready para no parpadear. */
export const STORE_CHECKOUT_NAV_MIN_MS = 400;

/** Evita perder el evento si el beacon corre antes de que el shell monte el listener. */
let checkoutContentReady = false;

export function markStoreCheckoutNavigation() {
  checkoutContentReady = false;
  const started = String(Date.now());
  if (typeof document === "undefined") return;
  document.cookie = `${STORE_CHECKOUT_NAV_COOKIE}=1; path=/; max-age=120; SameSite=Lax`;
  try {
    sessionStorage.setItem(STORE_CHECKOUT_NAV_COOKIE, started);
  } catch {
    /* ignore */
  }
  document.documentElement.classList.add(STORE_CHECKOUT_NAV_HTML_CLASS);
  window.dispatchEvent(new Event(STORE_CHECKOUT_NAV_START_EVENT));
}

export function clearStoreCheckoutNavigation() {
  if (typeof document === "undefined") return;
  document.cookie = `${STORE_CHECKOUT_NAV_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  try {
    sessionStorage.removeItem(STORE_CHECKOUT_NAV_COOKIE);
  } catch {
    /* ignore */
  }
}

export function readStoreCheckoutNavStartedAt(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORE_CHECKOUT_NAV_COOKIE);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : Date.now();
  } catch {
    return null;
  }
}

export function isStoreCheckoutNavMarked(): boolean {
  return readStoreCheckoutNavStartedAt() != null;
}

export function isStoreCheckoutContentReady() {
  return checkoutContentReady;
}

export function resetStoreCheckoutReady() {
  checkoutContentReady = false;
}

/** Solo avisa; el shell / chrome / bolsa quitan overlays. */
export function signalStoreCheckoutReady() {
  checkoutContentReady = true;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(STORE_CHECKOUT_READY_EVENT));
  }
}

export function removeStoreCheckoutBootOverlay() {
  if (typeof document === "undefined") return;
  document.documentElement.classList.remove(STORE_CHECKOUT_NAV_HTML_CLASS);
  document.getElementById(STORE_CHECKOUT_BOOT_OVERLAY_ID)?.remove();
}

/**
 * Script beforeInteractive: pinta overlay desde sessionStorage antes del primer paint.
 * Estilos inline para no depender de que globals.css haya cargado.
 * Next lo inyecta en <head>, así que el body puede no existir aún.
 */
export function storeCheckoutBootScriptSource(brand: string): string {
  const key = JSON.stringify(STORE_CHECKOUT_NAV_COOKIE);
  const id = JSON.stringify(STORE_CHECKOUT_BOOT_OVERLAY_ID);
  const cls = JSON.stringify(STORE_CHECKOUT_NAV_HTML_CLASS);
  const brandJson = JSON.stringify(brand);
  const styleId = JSON.stringify("store-checkout-boot-critical");
  return `(()=>{try{var path=location.pathname||"";if(path.indexOf("/admin")===0||path.indexOf("/empezar")===0){try{sessionStorage.removeItem(${key});}catch(e){}document.documentElement.classList.remove(${cls});var dead=document.getElementById(${id});if(dead)dead.remove();return;}var k=${key};if(!sessionStorage.getItem(k))return;var html=document.documentElement;html.classList.add(${cls});if(!document.getElementById(${styleId})){var s=document.createElement("style");s.id=${styleId};s.textContent='html.${STORE_CHECKOUT_NAV_HTML_CLASS}::before{content:"";position:fixed;inset:0;z-index:2147483645;background:#fff8fb;pointer-events:auto}html.${STORE_CHECKOUT_NAV_HTML_CLASS},html.${STORE_CHECKOUT_NAV_HTML_CLASS} body{overflow:hidden!important;background:#fff8fb!important}#${STORE_CHECKOUT_BOOT_OVERLAY_ID}{position:fixed;inset:0;z-index:2147483646;display:flex;align-items:center;justify-content:center;padding:1.5rem;background:#fff8fb;pointer-events:auto;font-family:system-ui,-apple-system,sans-serif}#${STORE_CHECKOUT_BOOT_OVERLAY_ID} .store-checkout-boot-inner{position:relative;width:100%;max-width:24rem;text-align:center}#${STORE_CHECKOUT_BOOT_OVERLAY_ID} .store-checkout-boot-brand{margin:0;font-size:11px;font-weight:600;letter-spacing:.22em;text-transform:uppercase;color:#5c3d4a}#${STORE_CHECKOUT_BOOT_OVERLAY_ID} .store-checkout-boot-spinner{width:2.75rem;height:2.75rem;margin:2rem auto 0;border-radius:9999px;border:3px solid rgba(196,90,122,.25);border-top-color:#c45a7a;animation:store-checkout-boot-spin .75s linear infinite}#${STORE_CHECKOUT_BOOT_OVERLAY_ID} .store-checkout-boot-msg{margin:2rem 0 0;min-height:3.25rem;font-size:1rem;font-weight:500;line-height:1.375;color:#292524}#${STORE_CHECKOUT_BOOT_OVERLAY_ID} .store-checkout-boot-note{margin:.75rem 0 0;font-size:12px;line-height:1.5;color:#78716c}@keyframes store-checkout-boot-spin{to{transform:rotate(360deg)}}';(document.head||html).appendChild(s);}function mount(){if(document.getElementById(${id}))return;var d=document.createElement("div");d.id=${id};d.setAttribute("role","status");d.setAttribute("aria-live","polite");d.setAttribute("aria-busy","true");d.innerHTML='<div class="store-checkout-boot-inner"><p class="store-checkout-boot-brand"></p><div class="store-checkout-boot-spinner" aria-hidden="true"></div><p class="store-checkout-boot-msg">Llevándote a finalizar tu compra…</p><p class="store-checkout-boot-note">Estamos armando tu checkout; un segundo y listo.</p></div>';var b=d.querySelector(".store-checkout-boot-brand");if(b)b.textContent=${brandJson};(document.body||html).appendChild(d);}if(document.body)mount();else document.addEventListener("DOMContentLoaded",mount);setTimeout(function(){try{sessionStorage.removeItem(k);}catch(e){}html.classList.remove(${cls});var o=document.getElementById(${id});if(o)o.remove();},15000);}catch(e){}})();`;
}
