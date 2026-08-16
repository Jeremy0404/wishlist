import nodemailer, { type Transporter } from "nodemailer";
import { getChildLogger } from "../logging/logger.js";

const DEFAULT_FROM = "Wishlist <wishlist@jerco.fr>";

export type Mail = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

let transporter: Transporter | null | undefined;

/** The provider is one environment variable, never a dependency: every
 *  candidate relay speaks SMTP. */
function getTransporter(): Transporter | null {
  if (transporter !== undefined) return transporter;

  const url = process.env.SMTP_URL;
  transporter = url ? nodemailer.createTransport(url) : null;
  return transporter;
}

export async function sendMail(mail: Mail): Promise<void> {
  const log = getChildLogger({ module: "mail" });
  const transport = getTransporter();

  if (!transport) {
    log.warn(
      { to: mail.to, subject: mail.subject, body: mail.text },
      "SMTP_URL is unset — the message is logged instead of sent",
    );
    return;
  }

  await transport.sendMail({
    from: process.env.MAIL_FROM ?? DEFAULT_FROM,
    ...mail,
  });
  log.info({ to: mail.to, subject: mail.subject }, "Mail sent");
}
