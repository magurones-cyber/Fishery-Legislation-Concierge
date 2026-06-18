#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const warnBytes = 10 * 1024 * 1024;
const errorBytes = 50 * 1024 * 1024;

const skippedDirs = new Set([".git", "node_modules", ".next", "work", "dist", "coverage", ".turbo", ".vercel"]);
const forbiddenRootDirs = new Set([
  "data",
  "uploads",
  "storage",
  "backups",
  "exports",
  "archives",
  "embeddings",
  "vector-store",
  "rag-cache",
  "qa-logs",
  "analytics-exports",
  "private",
  "secrets",
  "local-seed",
  "real-data"
]);
const largeOrSensitiveExtensions = new Set([
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".zip",
  ".7z",
  ".tar",
  ".gz",
  ".heic",
  ".tif",
  ".tiff",
  ".mp4",
  ".mov",
  ".m4a",
  ".wav"
]);

let totalBytes = 0;
const warnings = [];
const errors = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name);
    const relative = path.relative(root, absolute);
    const parts = relative.split(path.sep);

    if (entry.isDirectory()) {
      if (skippedDirs.has(entry.name) || relative === "supabase/.branches" || relative === "supabase/.temp") continue;
      if (parts.length === 1 && forbiddenRootDirs.has(entry.name)) {
        errors.push(`Git管理外にすべきディレクトリがあります: ${relative}/`);
        continue;
      }
      walk(absolute);
      continue;
    }

    if (!entry.isFile()) continue;

    if (entry.name.startsWith(".env") && entry.name !== ".env.example") {
      errors.push(`環境変数ファイルはコミット禁止です: ${relative}`);
    }

    const stat = fs.statSync(absolute);
    totalBytes += stat.size;
    const extension = path.extname(entry.name).toLowerCase();

    if (largeOrSensitiveExtensions.has(extension)) {
      warnings.push(`大容量・実データ候補ファイルはStorage保存を検討してください: ${relative}`);
    }
  }
}

walk(root);

if (totalBytes >= errorBytes) {
  errors.push(`リポジトリ容量が50MBを超えています: ${formatBytes(totalBytes)}`);
} else if (totalBytes >= warnBytes) {
  warnings.push(`リポジトリ容量が10MBを超えています: ${formatBytes(totalBytes)}`);
}

for (const warning of warnings) console.warn(`[repo-size:warn] ${warning}`);
for (const error of errors) console.error(`[repo-size:error] ${error}`);

if (errors.length > 0) process.exit(1);
console.log(`[repo-size] OK: ${formatBytes(totalBytes)} scanned`);

function formatBytes(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)}MB`;
}
