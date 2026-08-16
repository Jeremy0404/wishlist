import { MAGIC_LINK_TTL_MINUTES } from "../auth/magic-link.js";
import type { Mail } from "./mailer.js";

/** Email clients strip CSS custom properties — Gmail among them — so every
 *  design token is resolved to a literal here. */
const GROUND = "#eee7db";
const CARD = "#f5ead8";
const INK = "#201e1d";
const MUTED = "#807a71";
const DIVIDER = "#d3c9ba";
const ACCENT = "#c67139";
const ON_ACCENT = "#fdf6ee";

const HEADING_FONT = "Georgia, 'Times New Roman', serif";
const BODY_FONT = "Figtree, -apple-system, 'Segoe UI', Arial, sans-serif";

const SUBJECT = "Votre lien de connexion";
const HEADING = "Voici votre lien de connexion";
const LEAD = `Appuyez sur le bouton ci-dessous pour ouvrir Wishlist. Il fonctionne pendant ${MAGIC_LINK_TTL_MINUTES} minutes, et une seule fois.`;
const CTA = "Ouvrir Wishlist";
const FALLBACK = "Ou copiez ce lien dans votre navigateur :";
const IGNORE =
  "Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function magicLinkEmail(to: string, url: string): Mail {
  const href = escapeHtml(url);

  return {
    to,
    subject: SUBJECT,
    text: `${HEADING}\n\n${LEAD}\n\n${url}\n\n${IGNORE}`,
    html: `<body style="margin:0;padding:0;background-color:${GROUND};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${GROUND};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" border="0" style="width:480px;max-width:100%;background-color:${CARD};border-radius:16px;padding:32px;">
          <tr>
            <td style="font-family:${HEADING_FONT};font-size:22px;color:${ACCENT};padding-bottom:24px;">Wishlist</td>
          </tr>
          <tr>
            <td style="font-family:${HEADING_FONT};font-size:26px;line-height:1.2;color:${INK};padding-bottom:12px;">${HEADING}</td>
          </tr>
          <tr>
            <td style="font-family:${BODY_FONT};font-size:15px;line-height:1.6;color:${MUTED};padding-bottom:24px;">${LEAD}</td>
          </tr>
          <tr>
            <td style="padding-bottom:24px;">
              <a href="${href}" style="display:inline-block;font-family:${BODY_FONT};font-size:15px;font-weight:600;color:${ON_ACCENT};background-color:${ACCENT};border-radius:999px;padding:14px 28px;text-decoration:none;">${CTA}</a>
            </td>
          </tr>
          <tr>
            <td style="font-family:${BODY_FONT};font-size:13px;line-height:1.6;color:${MUTED};padding-bottom:8px;">${FALLBACK}</td>
          </tr>
          <tr>
            <td style="font-family:${BODY_FONT};font-size:13px;line-height:1.6;color:${INK};word-break:break-all;padding-bottom:24px;">${href}</td>
          </tr>
          <tr>
            <td style="border-top:1px solid ${DIVIDER};padding-top:16px;font-family:${BODY_FONT};font-size:12px;line-height:1.6;color:${MUTED};">${IGNORE}</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>`,
  };
}
