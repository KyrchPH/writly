const healthUrl =
  process.env.API_HEALTH_URL?.trim() || "http://localhost:4000/api/health/ready";

const timeoutMs = Number(process.env.API_HEALTH_TIMEOUT_MS || 5000);
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), timeoutMs);

async function run() {
  try {
    const response = await fetch(healthUrl, {
      method: "GET",
      signal: controller.signal,
    });

    const body = (await response.json().catch(() => null)) as
      | Record<string, unknown>
      | null;

    if (!response.ok) {
      console.error(
        `[health-check] FAIL ${response.status} ${response.statusText} - ${healthUrl}`,
      );
      if (body) {
        console.error(JSON.stringify(body, null, 2));
      }
      process.exit(1);
    }

    console.log(`[health-check] OK ${healthUrl}`);
    if (body) {
      console.log(JSON.stringify(body, null, 2));
    }
    process.exit(0);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[health-check] FAIL ${healthUrl} - ${message}`);
    process.exit(1);
  } finally {
    clearTimeout(timeout);
  }
}

void run();
