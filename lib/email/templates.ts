/**
 * Transactional email templates.
 *
 * Every interpolated value is tenant-controlled (business name, colour,
 * receipt number) and the mail goes out from Businesspadi's domain — escape
 * everything, or a business name like `<a href=...>` becomes a phishing link.
 */

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]!);
}

/** Only allow a plain hex colour into a style attribute. */
function safeColor(color: string | null | undefined): string {
  return color && /^#[0-9a-fA-F]{3,8}$/.test(color) ? color : "#000000";
}

export type ReceiptEmailInput = {
  businessName: string;
  brandColor: string | null;
  receiptNumber: string;
  amountLabel: string;
  receiptUrl: string;
};

export function receiptEmail(input: ReceiptEmailInput): { subject: string; html: string } {
  const name = escapeHtml(input.businessName);
  const number = escapeHtml(input.receiptNumber);
  const amount = escapeHtml(input.amountLabel);
  const url = escapeHtml(input.receiptUrl);
  const color = safeColor(input.brandColor);

  return {
    // Subject is plain text, not HTML — no escaping needed.
    subject: `Receipt ${input.receiptNumber} from ${input.businessName}`,
    html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">You've received a receipt from ${name}</h2>
          <p>Hi there,</p>
          <p>Please find your receipt <strong>${number}</strong> for the amount of <strong>${amount}</strong>.</p>
          <div style="margin: 30px 0;">
            <a href="${url}" style="background-color: ${color}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Receipt</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p><a href="${url}">${url}</a></p>
          <p style="color: #888; font-size: 12px; margin-top: 40px;">
            Powered by Businesspadi
          </p>
        </div>
      `,
  };
}
