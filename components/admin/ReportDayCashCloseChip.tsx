import Link from "next/link";
import { fetchCashSessionForBusinessDay } from "@/lib/cash-register";
import { formatCop } from "@/lib/money";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Señal de cierre del día (Por periodo, un solo día).
 * No duplica el historial de Caja: solo OK / faltante / sobrante + link.
 */
export async function ReportDayCashCloseChip({ dayYmd }: { dayYmd: string }) {
  const supabase = await createSupabaseServerClient();
  const session = await fetchCashSessionForBusinessDay(supabase, dayYmd);

  if (!session) {
    return (
      <Link
        href="/admin/caja"
        className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200/80 bg-zinc-50 px-2.5 py-1 text-[11px] font-medium text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
      >
        Sin cierre ese día
      </Link>
    );
  }

  if (session.status === "open") {
    return (
      <Link
        href="/admin/caja"
        className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/80 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-900 transition hover:border-amber-300 hover:bg-amber-100/80 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100 dark:hover:bg-amber-950/60"
      >
        Caja abierta
      </Link>
    );
  }

  const diff = session.cash_difference_cents;
  const href = `/admin/caja/${session.id}`;

  if (diff == null || diff === 0) {
    return (
      <Link
        href={href}
        className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 transition hover:border-emerald-300 hover:bg-emerald-100/80 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200 dark:hover:bg-emerald-950/60"
      >
        Cierre OK
      </Link>
    );
  }

  if (diff < 0) {
    return (
      <Link
        href={href}
        className="inline-flex items-center gap-1.5 rounded-full border border-red-200/80 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-800 transition hover:border-red-300 hover:bg-red-100/80 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200 dark:hover:bg-red-950/60"
      >
        Faltante {formatCop(Math.abs(diff))}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/80 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-900 transition hover:border-amber-300 hover:bg-amber-100/80 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100 dark:hover:bg-amber-950/60"
    >
      Sobrante {formatCop(diff)}
    </Link>
  );
}

export function ReportDayCashCloseChipSkeleton() {
  return (
    <span
      className="inline-block h-6 w-24 animate-pulse rounded-full bg-zinc-100/80 dark:bg-zinc-800/80"
      aria-hidden
    />
  );
}
