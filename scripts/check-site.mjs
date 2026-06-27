import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const required = [
  "index.html",
  "posts/index.html",
  "about.html",
  "contact.html",
  "privacy.html",
  "disclaimer.html",
  "data/posts.json",
  "sitemap.xml",
  "robots.txt",
  "ads.txt"
];

const missing = [];
for (const file of required) {
  try {
    await fs.access(path.join(root, file));
  } catch {
    missing.push(file);
  }
}

if (missing.length) {
  console.error(`Missing required files: ${missing.join(", ")}`);
  process.exit(1);
}

const posts = JSON.parse(await fs.readFile(path.join(root, "data", "posts.json"), "utf8"));
if (!Array.isArray(posts.posts) || posts.posts.length < 10) {
  console.error("Expected at least 10 RSS posts.");
  process.exit(1);
}

const home = await fs.readFile(path.join(root, "index.html"), "utf8");
for (const phrase of ["개인정보처리방침", "투자 고지", "AdSense 준비 영역"]) {
  if (!home.includes(phrase)) {
    console.error(`Home page is missing phrase: ${phrase}`);
    process.exit(1);
  }
}

console.log(`Site check passed with ${posts.posts.length} posts.`);
