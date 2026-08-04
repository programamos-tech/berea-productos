import { NextResponse } from "next/server";
import {
  aleyaExportFilename,
  aleyaExportRangeFilename,
  buildAleyaExportCsv,
  buildAleyaExportMultiMonthCsv,
  fetchAleyaExportPayload,
  type AleyaExportPayload,
} from "@/lib/admin-reports-aleya-export";
import {
  isValidYearMonth,
  monthYmdBounds,
  prettyYearMonthLabel,
  yearMonthsInclusive,
} from "@/lib/admin-report-range";
import { requireAdminApiSession } from "@/lib/admin-api";
import { loadAdminPermissions } from "@/lib/load-admin-permissions";

export async function GET(request: Request) {
  const gate = await requireAdminApiSession();
  if (!gate.ok) return gate.response;

  const perm = await loadAdminPermissions();
  if (!perm?.permissions.inicio_reportes) {
    return NextResponse.json({ error: "Prohibido" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const monthRaw = searchParams.get("month")?.trim() ?? "";
  const fromRaw = searchParams.get("from")?.trim() ?? "";
  const toRaw = searchParams.get("to")?.trim() ?? "";

  let months: string[] = [];
  if (fromRaw || toRaw) {
    if (!isValidYearMonth(fromRaw) || !isValidYearMonth(toRaw)) {
      return NextResponse.json(
        { error: "Parámetros from/to inválidos (YYYY-MM)." },
        { status: 400 },
      );
    }
    const list = yearMonthsInclusive(fromRaw, toRaw);
    if (!list) {
      return NextResponse.json(
        {
          error:
            "Rango de meses inválido o demasiado amplio (máximo 24 meses).",
        },
        { status: 400 },
      );
    }
    months = list;
  } else if (isValidYearMonth(monthRaw)) {
    months = [monthRaw];
  } else {
    return NextResponse.json(
      {
        error:
          "Indicá month=YYYY-MM o from=YYYY-MM&to=YYYY-MM.",
      },
      { status: 400 },
    );
  }

  const payloads: AleyaExportPayload[] = [];
  const emptyMonths: string[] = [];

  for (const ym of months) {
    const bounds = monthYmdBounds(ym);
    if (!bounds) {
      return NextResponse.json({ error: `Mes inválido: ${ym}` }, { status: 400 });
    }
    const { payload, error } = await fetchAleyaExportPayload(
      gate.supabase,
      bounds.from,
      bounds.to,
      ym,
    );
    if (error || !payload) {
      return NextResponse.json(
        { error: error ?? `No se pudo generar el export de ${ym}.` },
        { status: 500 },
      );
    }
    if (payload.rows.length === 0) {
      emptyMonths.push(ym);
      continue;
    }
    payloads.push(payload);
  }

  if (payloads.length === 0) {
    const label =
      months.length === 1
        ? prettyYearMonthLabel(months[0]!)
        : `${prettyYearMonthLabel(months[0]!)} – ${prettyYearMonthLabel(months[months.length - 1]!)}`;
    return NextResponse.json(
      {
        error: `No hay ventas pagadas en ${label}.`,
      },
      { status: 404 },
    );
  }

  const csv =
    payloads.length === 1
      ? buildAleyaExportCsv(payloads[0]!)
      : buildAleyaExportMultiMonthCsv(payloads);

  const filename =
    months.length === 1
      ? aleyaExportFilename(months[0]!)
      : aleyaExportRangeFilename(months[0]!, months[months.length - 1]!);

  const note =
    emptyMonths.length > 0
      ? `; meses sin ventas omitidos: ${emptyMonths.join(", ")}`
      : "";

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
      ...(note
        ? { "X-Aleya-Export-Note": note.slice(2) }
        : {}),
    },
  });
}
