import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve("src");
const forbidden = [
  /DATABASE_URL/,
  /DIRECT_URL/,
  /NEON_AUTH_COOKIE_SECRET/,
  /NEON_AUTH_BASE_URL/,
  /from ["']@prisma\/client["']/,
  /from ["']@\/lib\/db["']/,
  /from ["']pg["']/,
  /NEXT_PUBLIC_DATABASE/,
];

async function files(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const found = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...(await files(full)));
    else if (/\.(tsx|ts|jsx|js)$/.test(entry.name)) found.push(full);
  }
  return found;
}

const offenders = [];
for (const file of await files(root)) {
  const text = await readFile(file, "utf8");
  if (!text.includes(`"use client"`) && !text.includes(`'use client'`)) continue;
  for (const pattern of forbidden) {
    if (pattern.test(text)) offenders.push(`${file} matches ${pattern}`);
  }
}

const gitignore = await readFile(".gitignore", "utf8");
if (!gitignore.includes(".env.local")) offenders.push(".gitignore must ignore .env.local");

if (offenders.length) {
  console.error(offenders.join("\n"));
  process.exit(1);
}
console.log("Client bundles do not reference database credentials.");
