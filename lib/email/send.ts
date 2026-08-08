import { Resend } from "resend";

export type SendEmailResult =
  | { ok: true; id: string | null }
  | { ok: false; error: string };

export function cashCloseReportToAddresses(): string[] {
  const fromEnv = process.env.CASH_CLOSE_REPORT_TO?.trim();
  const defaults = [
    "programamos.st@gmail.com",
    "aleyashopoficial@gmail.com",
  ];
  const parsed = (fromEnv ? fromEnv.split(/[,;]+/) : defaults)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return [...new Set(parsed.length > 0 ? parsed : defaults)];
}

/** @deprecated Prefer `cashCloseReportToAddresses`. */
export function cashCloseReportToAddress(): string {
  return cashCloseReportToAddresses()[0] ?? "programamos.st@gmail.com";
}

export function cashCloseReportRecipientsLabel(): string {
  return cashCloseReportToAddresses().join(", ");
}

export function emailFromAddress(): string {
  return (
    process.env.EMAIL_FROM?.trim() ||
    // Dominio compartido Berea (verificar en Resend).
    "Milagros Guacarí <caja@berea.house>"
  );
}

export type EmailInlineAttachment = {
  filename: string;
  content: Buffer;
  contentId: string;
  contentType?: string;
};

export async function sendHtmlEmail(args: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailInlineAttachment[];
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
      attachments: args.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentId: a.contentId,
        contentType: a.contentType,
      })),
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
