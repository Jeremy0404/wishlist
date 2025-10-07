import { useI18n } from "vue-i18n";
import { buildJoinUrl } from "../utils/buildJoinUrl.ts";

export type ShareMethod = "web-share" | "clipboard" | "mailto";
export type ShareResult =
  | {
      ok: true;
      method: ShareMethod;
      url: string;
      subject?: string;
      text?: string;
    }
  | {
      ok: false;
      url: string;
      error: unknown;
      canceled?: boolean;
      subject?: string;
      text?: string;
    };

type ShareOpts = { name: string; code: string };

function buildMessage(t: (k: string, p?: any) => string, opts: ShareOpts) {
  const url = buildJoinUrl(opts.code);
  const subject = t("family.shareSubject", { name: opts.name });
  const text = t("family.shareBody", {
    name: opts.name,
    code: opts.code,
    url,
    catchPhrase: t("family.shareCatchPhrase"),
  });

  const payload: ShareData = {
    title: t("family.shareTitle", { name: opts.name }),
    text,
    url,
  };
  return { url, subject, text, payload };
}

function openMailClient(subject: string, body: string): boolean {
  const mailto =
    "mailto:?" +
    "subject=" +
    encodeURIComponent(subject) +
    "&body=" +
    encodeURIComponent(body);
  try {
    globalThis.location.href = mailto;
    return true;
  } catch {
    return false;
  }
}

export function useInviteShare() {
  const { t } = useI18n();

  async function shareFamily(opts: ShareOpts): Promise<ShareResult> {
    const { url, subject, text, payload } = buildMessage(t, opts);
    const nav = globalThis.navigator as Navigator | undefined;

    if (typeof nav?.share === "function") {
      try {
        await nav.share(payload);
        return { ok: true, method: "web-share", url, subject, text };
      } catch (e: any) {
        const canceled =
          e?.name === "AbortError" ||
          /AbortError/i.test(String(e?.message ?? ""));

        return { ok: false, error: e, canceled, url, subject, text };
      }
    }

    if (typeof nav?.clipboard?.writeText === "function") {
      try {
        await nav.clipboard.writeText(`${text}\n`);
        return { ok: true, method: "clipboard", url, subject, text };
      } catch (e) {
        console.error(e);
      }
    }

    const ok = openMailClient(subject, text);
    if (ok) {
      return { ok: true, method: "mailto", url, subject, text };
    }

    return {
      ok: false,
      url,
      subject,
      text,
      error: new Error(
        "Share/Clipboard/Email not available in this environment.",
      ),
    };
  }

  return { shareFamily };
}
