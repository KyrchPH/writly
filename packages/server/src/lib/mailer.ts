import { env, isEmailConfigured } from "../config/env.js";

const GMAIL_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GMAIL_SEND_URL = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";

type GmailTokenResponse = {
  access_token?: string;
  expires_in?: number;
  token_type?: string;
  error?: string;
  error_description?: string;
};

type GmailErrorResponse = {
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
};

type MailPayload = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const sanitizeHeaderValue = (value: string) => value.replace(/[\r\n]+/g, " ").trim();

const encodeHeader = (value: string) => {
  const sanitized = sanitizeHeaderValue(value);
  return /^[\x00-\x7F]*$/.test(sanitized)
    ? sanitized
    : `=?UTF-8?B?${Buffer.from(sanitized, "utf8").toString("base64")}?=`;
};

const encodeBase64Url = (value: string) =>
  Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const encodeMimePart = (value: string) =>
  Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/.{1,76}/g, "$&\r\n")
    .trim();

const getSender = () => {
  if (!env.GMAIL_SENDER_EMAIL) {
    throw new Error(
      "Gmail API is not configured. Set GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, and GMAIL_SENDER_EMAIL.",
    );
  }

  const fromName = sanitizeHeaderValue(env.GMAIL_FROM_NAME);
  return fromName
    ? `${encodeHeader(fromName)} <${env.GMAIL_SENDER_EMAIL}>`
    : env.GMAIL_SENDER_EMAIL;
};

const getGmailAccessToken = async () => {
  if (!isEmailConfigured) {
    throw new Error(
      "Gmail API is not configured. Set GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, and GMAIL_SENDER_EMAIL.",
    );
  }

  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 60_000) {
    return cachedAccessToken.token;
  }

  const body = new URLSearchParams({
    client_id: env.GMAIL_CLIENT_ID!,
    client_secret: env.GMAIL_CLIENT_SECRET!,
    refresh_token: env.GMAIL_REFRESH_TOKEN!,
    grant_type: "refresh_token",
  });

  const response = await fetch(GMAIL_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const payload = (await response.json().catch(() => ({}))) as GmailTokenResponse;
  if (!response.ok || !payload.access_token) {
    throw new Error(
      payload.error_description ||
        payload.error ||
        "Failed to authorize Gmail API email delivery.",
    );
  }

  cachedAccessToken = {
    token: payload.access_token,
    expiresAt: Date.now() + Math.max(60, payload.expires_in ?? 3600) * 1000,
  };

  return cachedAccessToken.token;
};

const buildMimeMessage = ({ to, subject, text, html }: MailPayload) => {
  const boundary = `ace_mail_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const headers = [
    `From: ${getSender()}`,
    `To: ${sanitizeHeaderValue(to)}`,
    `Subject: ${encodeHeader(subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ];

  if (env.GMAIL_REPLY_TO) {
    headers.splice(2, 0, `Reply-To: ${sanitizeHeaderValue(env.GMAIL_REPLY_TO)}`);
  }

  return [
    ...headers,
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    encodeMimePart(text),
    "",
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    encodeMimePart(html),
    "",
    `--${boundary}--`,
    "",
  ].join("\r\n");
};

const sendMail = async (payload: MailPayload) => {
  const accessToken = await getGmailAccessToken();
  const response = await fetch(GMAIL_SEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      raw: encodeBase64Url(buildMimeMessage(payload)),
    }),
  });

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => ({}))) as GmailErrorResponse;
    throw new Error(
      errorPayload.error?.message ||
        `Gmail API email delivery failed with status ${response.status}.`,
    );
  }
};

const renderCvOtpEmailHtml = (otp: string, minutes: number) => `
  <div style="margin:0;padding:24px;background:#0b1020;font-family:Arial,Helvetica,sans-serif;color:#e8ecf8;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;background:#10182c;border-radius:16px;border:1px solid #233253;">
      <tr>
        <td style="padding:28px 28px 12px;">
          <h1 style="margin:0;font-size:20px;line-height:1.3;color:#ffffff;">CV Download Verification</h1>
          <p style="margin:10px 0 0;font-size:14px;line-height:1.5;color:#a8b4d1;">
            Use the one-time code below to verify your request.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 28px 12px;">
          <div style="background:#0d1426;border:1px solid #2b3f67;border-radius:14px;padding:16px;text-align:center;">
            <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#8fa6d8;">Your OTP Code</p>
            <p style="margin:0;font-size:32px;font-weight:700;letter-spacing:0.24em;color:#f8fbff;">${otp}</p>
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 28px 28px;">
          <p style="margin:0;font-size:13px;line-height:1.6;color:#a8b4d1;">
            This code expires in <strong style="color:#ffffff;">${minutes} minutes</strong>.
            If you did not request this download, you can safely ignore this email.
          </p>
        </td>
      </tr>
    </table>
  </div>
`;

export const sendCvOtpEmail = async (params: {
  to: string;
  otp: string;
  expiresInMinutes: number;
}) => {
  const subject = `Your CV OTP Code: ${params.otp}`;
  const text = [
    "CV Download Verification",
    "",
    `Your one-time code is: ${params.otp}`,
    `This code expires in ${params.expiresInMinutes} minutes.`,
    "",
    "If you did not request this download, please ignore this email.",
  ].join("\n");

  await sendMail({
    to: params.to,
    subject,
    text,
    html: renderCvOtpEmailHtml(params.otp, params.expiresInMinutes),
  });
};

const renderPasswordResetEmailHtml = (resetUrl: string, minutes: number) => `
  <div style="margin:0;padding:24px;background:#0b1020;font-family:Arial,Helvetica,sans-serif;color:#e8ecf8;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;background:#10182c;border-radius:16px;border:1px solid #233253;">
      <tr>
        <td style="padding:28px 28px 12px;">
          <h1 style="margin:0;font-size:20px;line-height:1.3;color:#ffffff;">Admin Password Reset</h1>
          <p style="margin:10px 0 0;font-size:14px;line-height:1.5;color:#a8b4d1;">
            A password reset request was made for your admin account.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 28px 12px;">
          <a href="${resetUrl}" style="display:inline-block;background:#2f6fff;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:600;">
            Reset Password
          </a>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 28px 28px;">
          <p style="margin:0;font-size:13px;line-height:1.6;color:#a8b4d1;">
            This reset link expires in <strong style="color:#ffffff;">${minutes} minutes</strong>.
            If you did not request this, you can ignore this email.
          </p>
          <p style="margin:10px 0 0;font-size:12px;line-height:1.5;color:#8fa6d8;word-break:break-all;">
            ${resetUrl}
          </p>
        </td>
      </tr>
    </table>
  </div>
`;

export const sendPasswordResetEmail = async (params: {
  to: string;
  resetUrl: string;
  expiresInMinutes: number;
}) => {
  const subject = "Reset your admin password";
  const text = [
    "Admin Password Reset",
    "",
    "Open this link to reset your password:",
    params.resetUrl,
    "",
    `This link expires in ${params.expiresInMinutes} minutes.`,
    "If you did not request this, you can ignore this email.",
  ].join("\n");

  await sendMail({
    to: params.to,
    subject,
    text,
    html: renderPasswordResetEmailHtml(params.resetUrl, params.expiresInMinutes),
  });
};

const renderReviewInvitationEmailHtml = (params: {
  clientName: string;
  reviewUrl: string;
  expiresInDays: number;
}) => {
  const clientName = escapeHtml(params.clientName);
  const reviewUrl = escapeHtml(params.reviewUrl);
  return `
  <div style="margin:0;padding:40px 20px;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#374151;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:18px;padding:32px;border:1px solid #e5eaf2;">
      <h1 style="margin:0 0 16px;color:#111827;font-size:26px;line-height:1.2;">
        Share Your Feedback
      </h1>

      <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 16px;">
        Hi ${clientName},
      </p>

      <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 16px;">
        Thank you again for working with me. I would really appreciate it if you could take a minute to share your honest feedback about your experience.
      </p>

      <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">
        Your review helps me improve my work and helps future clients understand what it is like to work with me.
      </p>

      <a href="${reviewUrl}" style="display:inline-block;background:#14b8a6;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:10px;font-weight:bold;font-size:15px;">
        Leave a Review
      </a>

      <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:28px 0 0;">
        This secure one-time link expires in <strong>${params.expiresInDays} days</strong>. Once submitted, the review can no longer be edited.
      </p>

      <p style="color:#9ca3af;font-size:12px;line-height:1.5;margin:20px 0 0;">
        If the button does not work, copy and paste this link into your browser:<br>
        <a href="${reviewUrl}" style="color:#2563eb;word-break:break-all;">${reviewUrl}</a>
      </p>
    </div>
  </div>
`;
};

export const sendReviewInvitationEmail = async (params: {
  to: string;
  clientName: string;
  reviewUrl: string;
  expiresInDays: number;
}) => {
  const subject = "Review request";
  const text = [
    `Hi ${params.clientName},`,
    "",
    "Please open this one-time link to submit your review:",
    params.reviewUrl,
    "",
    `This link expires in ${params.expiresInDays} days.`,
    "Once submitted, the link cannot be reused or edited from your side.",
  ].join("\n");

  await sendMail({
    to: params.to,
    subject,
    text,
    html: renderReviewInvitationEmailHtml(params),
  });
};

const renderContractEmailHtml = (params: {
  recipientName: string;
  contractTitle: string;
  contractUrl: string;
}) => {
  const recipientName = escapeHtml(params.recipientName);
  const contractTitle = escapeHtml(params.contractTitle);
  const contractUrl = escapeHtml(params.contractUrl);
  return `
  <div style="margin:0;padding:40px 20px;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#374151;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:18px;padding:32px;border:1px solid #e5eaf2;">
      <h1 style="margin:0 0 16px;color:#111827;font-size:26px;line-height:1.2;">
        Document Ready for Review
      </h1>

      <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 16px;">
        Hi ${recipientName},
      </p>

      <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">
        Your document, <strong>${contractTitle}</strong>, is ready. Open the secure link below to review it.
      </p>

      <a href="${contractUrl}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:10px;font-weight:bold;font-size:15px;">
        Open Document
      </a>

      <p style="color:#9ca3af;font-size:12px;line-height:1.5;margin:24px 0 0;">
        If the button does not work, copy and paste this link into your browser:<br>
        <a href="${contractUrl}" style="color:#2563eb;word-break:break-all;">${contractUrl}</a>
      </p>
    </div>
  </div>
`;
};

export const sendContractEmail = async (params: {
  to: string;
  recipientName: string;
  contractTitle: string;
  contractUrl: string;
}) => {
  const subject = `Document: ${params.contractTitle}`;
  const text = [
    `Hi ${params.recipientName},`,
    "",
    `Your document, "${params.contractTitle}", is ready for review:`,
    params.contractUrl,
  ].join("\n");

  await sendMail({
    to: params.to,
    subject,
    text,
    html: renderContractEmailHtml(params),
  });
};
