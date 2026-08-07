import { Resend } from "resend";

export type SendEmailResult =
  | { ok: true; id: string | null }
  | { ok: false; error: string };

export function cashCloseReportToAddress(): string {
  return (
    process.env.CASH_CLOSE_REPORT_TO?.trim() ||
    "programamos.st@gmail.com"
  );
}

export function emailFromAddress(): string {
  return (
    process.env.EMAIL_FROM?.trim() ||
    "Milagros Guacarí <onboarding@resend.dev>"
  );
}

export async function sendHtmlEmail(args: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return {
      ok: false,
      error: "Falta RESEND_API_KEY en el entorno (Vercel / .env.local).",
    };
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: emailFromAddress(),
      to: Array.isArray(args.to) ? args.to : [args.to],
      subject: args.subject,
      html: args.html,
      text: args.text,
    });
    if (error) {
      console.error("[email] resend:", error);
      return { ok: false, error: error.message };
    }
    return { ok: true, id: data?.id ?? null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al enviar correo";
    console.error("[email]", e);
    return { ok: false, error: msg };
  }
}
