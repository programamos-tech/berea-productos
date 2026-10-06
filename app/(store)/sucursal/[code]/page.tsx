import { redirect } from "next/navigation";
import { redeemStorefrontCode } from "@/app/actions/storefront-access";
import { getStorefrontScope } from "@/lib/storefront-scope";
import { getStorefrontTenant } from "@/lib/storefront-tenant";
import { storeShellClass } from "@/lib/store-theme";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ code: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props) {
  const { code } = await params;
  const label = code.replace(/-/g, " ");
  return { title: `Tienda ${label}` };
}

export default async function StorefrontBranchGatePage({
  params,
  searchParams,
}: Props) {
  const { code } = await params;
  const sp = await searchParams;
  const branchCode = code.trim().toLowerCase();
  const failed = sp.error === "1";

  const tenant = await getStorefrontTenant();
  const supabase = createSupabaseServiceClient();
  const { data: branch } = await supabase
    .from("branches")
    .select("id,code,name,is_default")
    .eq("tenant_id", tenant.id)
    .eq("code", branchCode)
    .eq("is_active", true)
    .maybeSingle();

  if (!branch?.id) redirect("/");
  if (branch.is_default) redirect("/");

  const scope = await getStorefrontScope();
  const alreadyHere =
    scope.customer != null && scope.branchCode === String(branch.code).toLowerCase();

  return (
    <div className={`${storeShellClass} py-16 sm:py-24`}>
      <div className="mx-auto max-w-md">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-stone-400">
          Catálogo mayorista
        </p>
        <h1 className="mt-2 text-2xl font-semibold uppercase tracking-[0.06em] text-[var(--store-brand)]">
          Tienda {branch.name}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-stone-600">
          Entra con el código de tu cuenta. Vas a ver solo los productos de esta
          sucursal y tu descuento.
        </p>

        {alreadyHere ? (
          <p className="mt-6 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700">
            Ya estás en esta tienda como {scope.customer?.name}
            {scope.customer && scope.customer.wholesalePct > 0
              ? ` · ${scope.customer.wholesalePct}%`
              : ""}
            .
          </p>
        ) : null}

        <form action={redeemStorefrontCode} className="mt-8 space-y-4">
          <input type="hidden" name="branch" value={String(branch.code).toLowerCase()} />
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
              Código
            </span>
            <input
              name="code"
              required
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-base uppercase tracking-[0.18em] text-stone-900 outline-none focus:border-[var(--store-accent)]"
            />
          </label>
          {failed ? (
            <p className="text-sm text-red-600" role="alert">
              Ese código no corresponde a un cliente de {branch.name}.
            </p>
          ) : null}
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-full bg-[var(--store-brand)] px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-white"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
