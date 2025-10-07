import path from "node:path";
import { fileURLToPath } from "node:url";

import fg from "fast-glob";
import fs from "fs-extra";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const directoriesToRemove = ["public/content", "public/images"];
const filePatterns = ["public/llm*.txt", "public/**/*.md"];

async function removeDirectories(): Promise<void> {
  for (const relativeDir of directoriesToRemove) {
    const target = path.join(rootDir, relativeDir);

    if (await fs.pathExists(target)) {
      await fs.remove(target);
    //   console.log(`Removed directory: ${relativeDir}`);
    } else {
      console.log(`Skipped directory (not found): ${relativeDir}`);
    }
  }
}

async function removeFiles(): Promise<void> {
  for (const pattern of filePatterns) {
    const matches = await fg(pattern, {
      cwd: rootDir,
      onlyFiles: true,
      dot: true,
      absolute: false,
    });

    if (matches.length === 0) {
      console.log(`No files matched pattern: ${pattern}`);
      continue;
    }

    await Promise.all(
      matches.map(async (relativePath) => {
        const target = path.join(rootDir, relativePath);
        await fs.remove(target);
        console.log(`Removed file: ${relativePath}`);
      }),
    );
  }
}

async function main(): Promise<void> {
  await removeDirectories();
  await removeFiles();
  console.log("Cache clear complete.");
}

main().catch((error) => {
  console.error("Failed to clear generated public assets.");
  console.error(error);
  process.exit(1);
});


