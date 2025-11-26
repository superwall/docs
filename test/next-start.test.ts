// test/next-start.test.ts
import { test, expect } from "bun:test";
import { spawn } from "child_process";

const PORT = 8293;
const BASE_URL = `http://localhost:${PORT}`;

function waitForServer(url: string, timeoutMs = 20000) {
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
        reject(new Error(`Server didn't become ready at ${url}`));
      } else {
        setTimeout(tick, 300);
      }
    };
    tick();
  });
}

test("next build/start runs and serves /docs/home", async () => {
  // Assumes `bun run build` has already run in CI
  const server = spawn("bunx", ["next", "start", "-p", String(PORT)], {
    stdio: "inherit",
  });

  try {
    await waitForServer(`${BASE_URL}/docs/home`);
    const res = await fetch(`${BASE_URL}/docs/home`);
    expect(res.status).toBe(200);

    const html = await res.text();
    expect(html).toContain("Superwall");
    expect(html).toContain("Welcome");
  } finally {
    server.kill("SIGTERM");
  }
});
