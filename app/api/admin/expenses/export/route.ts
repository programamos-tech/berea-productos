import { NextResponse } from "next/server";
import {
  buildExpensesExportCsv,
  expensesExportFilename,
  fetchExpensesExportRows,
} from "@/lib/admin-expenses-export";
import {
  isValidYearMonth,
  prettyYearMonthLabel,
} from "@/lib/admin-report-range";
import { requireAdminApiSession } from "@/lib/admin-api";
import { loadAdminPermissions } from "@/lib/load-admin-permissions";

export async function GET(request: Request) {
  const gate = await requireAdminApiSession();
  if (!gate.ok) return gate.response;

  const perm = await loadAdminPermissions();
  if (!perm?.permissions.egresos_ver) {
    return NextResponse.json({ error: "Prohibido" }, { status: 403 });
  }

  const ym = new URL(request.url).searchParams.get("month")?.trim() ?? "";
  if (!isValidYearMonth(ym)) {
    return NextResponse.json(
      { error: "Indicá month=YYYY-MM." },
      { status: 400 },
    );
  }

  const { rows, error } = await fetchExpensesExportRows(gate.supabase, ym);
  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
  if (rows.length === 0) {
    return NextResponse.json(
      {
        error: `No hay gastos ni egresos en ${prettyYearMonthLabel(ym)}.`,
      },
      { status: 404 },
    );
  }

  const csv = buildExpensesExportCsv(rows);
  const filename = expensesExportFilename(ym);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
