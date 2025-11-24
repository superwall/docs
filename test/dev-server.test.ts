import { test, expect, afterAll } from "bun:test";
import { spawn, execSync, ChildProcess } from "child_process";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

const PORT = 8293;
const BASE_URL = `http://localhost:${PORT}`;
const HOME_PAGE_URL = `${BASE_URL}/docs/home`;
// Increase timeout for CI environments
const IS_CI = process.env.CI === "true";
const TIMEOUT_MS = IS_CI ? 120000 : 60000; // 2 minutes in CI, 60s locally
const POLL_INTERVAL_MS = 500; // 500ms

// Track the dev server process for cleanup
let devServerProcess: ChildProcess | null = null;

// Track if the dev server has failed
let serverError: string | null = null;
let serverExited = false;

/**
 * Kill any process using a specific port (macOS/Linux)
 */
function killProcessOnPort(port: number): void {
  try {
    execSync(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`, {
      stdio: "ignore",
    });
  } catch (error) {
    // Ignore errors
  }
}

/**
 * Kill a process group
 */
function killProcessGroup(pid: number, signal: NodeJS.Signals = "SIGTERM"): void {
  try {
    process.kill(-pid, signal);
  } catch (error) {
    // Process group may already be dead
  }
}

// Cleanup after all tests - this runs synchronously before exit
afterAll(() => {
  console.log("Cleanup: Stopping dev server...");
  
  if (devServerProcess && devServerProcess.pid) {
    killProcessGroup(devServerProcess.pid, "SIGKILL");
  }
  
  // Kill any remaining processes on the port
  killProcessOnPort(PORT);
  
  // Give OS time to release the port
  execSync("sleep 1", { stdio: "ignore" });
});

/**
 * Check if a port is already in use by attempting to connect to it
 */
async function isPortInUse(port: number): Promise<boolean> {
  try {
    await fetch(`http://localhost:${port}`, {
      signal: AbortSignal.timeout(1000),
    });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Wait for the server to be ready by polling the endpoint.
 * Fails immediately if the dev server process exits or emits an error.
 */
async function waitForServerReady(
  url: string,
  timeoutMs: number,
  pollIntervalMs: number
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    // Check if the server process has failed
    if (serverError) {
      throw new Error(`Dev server failed to start:\n${serverError}`);
    }
    if (serverExited) {
      throw new Error("Dev server process exited unexpectedly");
    }

    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(2000),
      });
      if (response.ok) {
        return;
      }
    } catch (error) {
      // Server not ready yet, continue polling
    }
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(`Server did not become ready within ${timeoutMs}ms`);
}

test("dev server starts and serves home page", async () => {
  const stderrChunks: Buffer[] = [];

  // Reset state
  serverError = null;
  serverExited = false;

  // Step 1: Check if port is already in use
  const portInUse = await isPortInUse(PORT);
  if (portInUse) {
    throw new Error(
      `Port ${PORT} is already in use. Please stop any running dev server before running this test.`
    );
  }

  // Step 2: Start dev server
  console.log("Starting dev server...");
  devServerProcess = spawn("bun", ["run", "dev"], {
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"],
    shell: false,
    detached: true,
  });

  // Consume stdout to prevent blocking, but we don't need to store it all
  devServerProcess.stdout?.on("data", () => {
    // No-op to drain buffer
  });

  // Monitor for process exit
  devServerProcess.on("exit", (code) => {
    serverExited = true;
    const stderr = Buffer.concat(stderrChunks).toString();
    serverError = `Process exited unexpectedly with code ${code}\n${stderr}`;
  });

  devServerProcess.on("error", (err) => {
    serverError = `Process error: ${err.message}`;
  });

  // Capture stderr and detect errors
  devServerProcess.stderr?.on("data", (data: Buffer) => {
    stderrChunks.push(data);
    const output = data.toString();
    
    // Detect fatal errors that should fail the test immediately
    if (output.includes("Module not found") || 
        output.includes("error:") ||
        output.includes("Error:") ||
        output.includes("exited with code 1")) {
      serverError = Buffer.concat(stderrChunks).toString();
    }
  });

  try {
    // Step 3: Wait for server to be ready (will fail fast if error detected)
    console.log("Waiting for server to be ready...");
    await waitForServerReady(HOME_PAGE_URL, TIMEOUT_MS, POLL_INTERVAL_MS);
    console.log("Server is ready!");

    // Step 4: Test home page HTTP response
    console.log("Testing home page HTTP response...");
    const response = await fetch(HOME_PAGE_URL);
    expect(response.status).toBe(200);

    const html = await response.text();
    expect(html).toContain("Superwall");
    expect(html).toContain("Welcome");

    // Step 5: Test generated markdown file
    console.log("Testing generated markdown file...");
    const markdownPath = join(process.cwd(), "public", "home.md");
    expect(existsSync(markdownPath)).toBe(true);

    const markdownContent = readFileSync(markdownPath, "utf-8");
    expect(markdownContent.length).toBeGreaterThan(0);
    expect(markdownContent).toContain("Superwall");

    console.log("All tests passed!");
  } catch (error) {
    // Log captured stderr for debugging if not already in error message
    if (stderrChunks.length > 0 && !serverError) {
      const stderr = Buffer.concat(stderrChunks).toString();
      if (stderr) console.error("Dev server stderr:", stderr);
    }
    throw error;
  }
}, TIMEOUT_MS + 10000);
