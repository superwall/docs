// test/cf-preview.test.ts
import { test, expect } from "bun:test";
import { spawn } from "child_process";

const PORT = 8790;
const BASE_URL = `http://127.0.0.1:${PORT}`;

function waitForServer(url: string, timeoutMs = 60000) {
  const start = Date.now();
  return new Promise<void>((resolve, reject) => {
    const tick = async () => {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
        if (res.ok) return resolve();
      } catch {
        // ignore
      }

      if (Date.now() - start > timeoutMs) {
        reject(new Error(`CF preview server didn't become ready at ${url}`));
      } else {
        setTimeout(tick, 500);
      }
    };
    tick();
  });
}

test("Cloudflare preview runs and serves /docs/home", async () => {
  // Assumes `bun run build:cf` has already run in CI
  const server = spawn(
    "bunx",
    ["opennextjs-cloudflare", "preview", "--port", String(PORT)],
    {
      stdio: "inherit",
    }
  );

  try {
    await waitForServer(`${BASE_URL}/docs/home`, 60000);
    const res = await fetch(`${BASE_URL}/docs/home`);
    expect(res.status).toBe(200);

    const html = await res.text();
    expect(html).toContain("Superwall");
    expect(html).toContain("Welcome");
  } finally {
    // SIGINT is usually enough to bring down wrangler/preview
    server.kill("SIGINT");
  }
});
