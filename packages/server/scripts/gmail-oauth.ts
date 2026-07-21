import "dotenv/config";
import { createServer } from "node:http";

const GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const CALLBACK_PORT = Number(process.env.GMAIL_OAUTH_CALLBACK_PORT || 53114);
const REDIRECT_URI = `http://127.0.0.1:${CALLBACK_PORT}/oauth2callback`;

type TokenResponse = {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
};

const clientId = process.env.GMAIL_CLIENT_ID?.trim();
const clientSecret = process.env.GMAIL_CLIENT_SECRET?.trim();

if (!clientId || !clientSecret) {
  console.error(
    [
      "Missing Gmail OAuth client credentials.",
      "Set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET in packages/server/.env first.",
    ].join("\n"),
  );
  process.exit(1);
}

const exchangeCodeForTokens = async (code: string) => {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: REDIRECT_URI,
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as TokenResponse;
  if (!response.ok || !payload.refresh_token) {
    throw new Error(
      payload.error_description ||
        payload.error ||
        "Google did not return a refresh token. Revoke app access and try again with prompt=consent.",
    );
  }

  return payload;
};

const buildAuthUrl = () => {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", REDIRECT_URI);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GMAIL_SEND_SCOPE);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  return url.toString();
};

const authUrl = buildAuthUrl();

const server = createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url ?? "/", REDIRECT_URI);
    if (requestUrl.pathname !== "/oauth2callback") {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    const error = requestUrl.searchParams.get("error");
    if (error) {
      throw new Error(`Google OAuth error: ${error}`);
    }

    const code = requestUrl.searchParams.get("code");
    if (!code) {
      throw new Error("Missing authorization code.");
    }

    const tokens = await exchangeCodeForTokens(code);
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(
      "<h1>Gmail API connected</h1><p>You can close this browser tab and return to the terminal.</p>",
    );

    console.log("\nGmail API refresh token generated.\n");
    console.log("Add these to Render and packages/server/.env:");
    console.log(`GMAIL_CLIENT_ID=${clientId}`);
    console.log(`GMAIL_CLIENT_SECRET=${clientSecret}`);
    console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log("GMAIL_SENDER_EMAIL=<the Gmail address you authorized>");
    console.log("GMAIL_FROM_NAME=Archie Sevillano");
    console.log("GMAIL_REPLY_TO=<your reply-to email>\n");
  } catch (error) {
    const message = error instanceof Error ? error.message : "OAuth setup failed.";
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(message);
    console.error(message);
  } finally {
    server.close();
  }
});

server.listen(CALLBACK_PORT, "127.0.0.1", () => {
  console.log("Gmail OAuth helper is listening for the callback.");
  console.log(`Callback URL: ${REDIRECT_URI}`);
  console.log("\nOpen this URL, choose your Gmail account, and allow Gmail send access:\n");
  console.log(authUrl);
  console.log("\nThe refresh token will be printed here after approval.\n");
});
