#!/usr/bin/env bun
/**
 * Generates a minimal wrangler.jsonc config file for testing purposes.
 * This config contains no secrets and is suitable for CI/test environments.
 */

import { existsSync, writeFileSync } from "fs";
import { join } from "path";

const wranglerConfig = {
  $schema: "node_modules/wrangler/config-schema.json",
  account_id: "test-account-id",
  main: ".open-next/worker.js",
  name: "docs-test-worker",
  compatibility_date: "2024-12-30",
  compatibility_flags: [
    "nodejs_compat",
    "global_fetch_strictly_public"
  ],
  assets: {
    directory: ".open-next/assets",
    binding: "ASSETS"
  },
  services: [{
    binding: "WORKER_SELF_REFERENCE",
    service: "docs-test-worker"
  }],
  routes: [],
  env: {
    staging: {
      workers_dev: true,
      routes: []
    }
  }
};

/**
 * Generates a test wrangler.jsonc config file if it doesn't already exist.
 * @param configPath Optional path to the config file. Defaults to "wrangler.jsonc" in the current working directory.
 * @returns The path to the config file.
 */
export function generateTestWranglerConfig(configPath?: string, silent = false): string {
  const path = configPath || join(process.cwd(), "wrangler.jsonc");
  
  if (existsSync(path)) {
    return path;
  }

  const configContent = JSON.stringify(wranglerConfig, null, 2);
  writeFileSync(path, configContent, "utf-8");
  if (!silent) {
    console.log(`✓ Generated test wrangler.jsonc at ${path}`);
  }
  return path;
}

// If run as a script, generate the config
if (import.meta.main) {
  generateTestWranglerConfig();
}

