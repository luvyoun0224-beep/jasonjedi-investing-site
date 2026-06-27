import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import config from "../site.config.mjs";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));

const ensureDir = async (dir) => {
  await fs.mkdir(path.join(root, dir), { recursive: true });
};

const decodeEntities = (value) =>
  value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

const stripTags = (value) =>
  decodeEntities(value.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();

const pick = (xml, tag) => {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  if (!match) return "";
  return match[1].replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "").trim();
};

const slugify = (link, index) => {
  const id = link.match(/\/(\d{8,})(?:\?|$)/)?.[1];
  return `${String(index + 1).padStart(2, "0")}-${id || "investment-note"}`;
};

const topicFor = (title, category, summary) => {
  const text = `${title} ${category} ${summary}`;
  if (/스페이스|우주|SpaceX|레드와이어/i.test(text)) return config.categories.find((c) => c.id === "space-economy");
  if (/마이크론|하이닉스|삼성전자|삼성전기|엔비디아|브로드컴|마벨|반도체|HBM|메모리|하드디스크|데이터센터/i.test(text)) {
    return config.categories.find((c) => c.id === "semiconductors");
  }
  if (/AI|인공지능|팔란티어|앤트로픽|xAI|바이오/i.test(text)) return config.categories.find((c) => c.id === "ai-infrastructure");
  if (/환율|FOMC|금리|나스닥|S&P|정부|세금|코스피|종전|이란/i.test(text)) return config.categories.find((c) => c.id === "macro");
  if (/우리나라|한국|국민성장|코스피|상장/i.test(text)) return config.categories.find((c) => c.id === "korea-market");
  return config.categories[0];
};

const pageShell = ({ title, description, body, canonical }) => `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta name="robots" content="index,follow" />
    <link rel="canonical" href="${canonical}" />
    <link rel="stylesheet" href="../../styles.css" />
  </head>
  <body>
    <header class="site-header">
      <a class="brand" href="../../index.html"><span class="brand-mark">JJ</span><span><strong>Jason Jedi Investing</strong><small>AI 인프라 투자노트</small></span></a>
      <nav class="nav" aria-label="주요 메뉴">
        <a href="../../posts/">글 목록</a><a href="../../about.html">소개</a><a href="../../disclaimer.html">투자 고지</a><a href="../../contact.html">문의</a>
      </nav>
    </header>
    <main>${body}</main>
    <footer class="site-footer">
      <p>© <span id="year"></span> Jason Jedi Investing. 개인 투자 기록이며 투자 권유가 아닙니다.</p>
      <nav><a href="../../privacy.html">개인정보처리방침</a><a href="../../disclaimer.html">투자 고지</a><a href="../../contact.html">문의</a></nav>
    </footer>
    <script>document.querySelector("#year").textContent = new Date().getFullYear();</script>
  </body>
</html>`;

const escapeHtml = (value) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const response = await fetch(config.rssUrl, {
  headers: { "user-agent": "JasonJediInvestingSite/0.1" }
});

if (!response.ok) {
  throw new Error(`RSS fetch failed: ${response.status}`);
}

const xml = await response.text();
const itemMatches = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];

const posts = itemMatches.slice(0, 50).map((match, index) => {
  const item = match[1];
  const title = stripTags(pick(item, "title"));
  const rawDescription = pick(item, "description");
  const summary = stripTags(rawDescription).slice(0, 190);
  const category = stripTags(pick(item, "category")) || "투자 노트";
  const link = decodeEntities(stripTags(pick(item, "link")));
  const pubDate = stripTags(pick(item, "pubDate"));
  const isoDate = new Date(pubDate).toISOString();
  const topic = topicFor(title, category, summary);
  const slug = slugify(link, index);
  return {
    title,
    category,
    topicId: topic.id,
    topicLabel: topic.label,
    summary,
    sourceUrl: link,
    isoDate,
    slug,
    localPath: `posts/${slug}/`
  };
});

await ensureDir("data");
await ensureDir("posts");

for (const entry of await fs.readdir(path.join(root, "posts"), { withFileTypes: true })) {
  if (entry.name === "index.html") continue;
  await fs.rm(path.join(root, "posts", entry.name), { recursive: true, force: true });
}

await fs.writeFile(
  path.join(root, "data", "posts.json"),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      source: config.rssUrl,
      categories: config.categories,
      posts
    },
    null,
    2
  ),
  "utf8"
);

for (const post of posts) {
  const postDir = path.join(root, "posts", post.slug);
  await fs.mkdir(postDir, { recursive: true });
  const body = `
    <article class="post-body">
      <section class="page-hero">
        <p class="eyebrow">${escapeHtml(post.topicLabel)} · ${new Intl.DateTimeFormat("ko-KR", {
          year: "numeric",
          month: "long",
          day: "numeric"
        }).format(new Date(post.isoDate))}</p>
        <h1>${escapeHtml(post.title)}</h1>
        <p>${escapeHtml(post.summary)}</p>
      </section>
      <section class="ad-slot" aria-label="광고 영역"><span>AdSense 준비 영역</span></section>
      <section class="content-page">
        <h2>이 글의 핵심 관점</h2>
        <p>
          이 페이지는 네이버 블로그 원문을 바탕으로 주제와 맥락을 정리한 요약 페이지입니다.
          전체 분석과 세부 문장은 원문에서 확인할 수 있습니다.
        </p>
        <p class="callout">${escapeHtml(post.summary)}</p>
        <h2>관련 투자 주제</h2>
        <p>${escapeHtml(post.topicLabel)} 흐름은 장기 성장주를 볼 때 산업 병목, 수요 지속성, 밸류에이션, 정책 리스크를 함께 확인해야 하는 영역입니다.</p>
        <p><a class="button primary" href="${escapeHtml(post.sourceUrl)}" target="_blank" rel="noopener">네이버 원문 읽기</a></p>
      </section>
    </article>
  `;
  await fs.writeFile(
    path.join(postDir, "index.html"),
    pageShell({
      title: `${post.title} | Jason Jedi Investing`,
      description: post.summary,
      canonical: `${config.siteUrl}/${post.localPath}`,
      body
    }),
    "utf8"
  );
}

const urls = [
  "",
  "posts/",
  "about.html",
  "contact.html",
  "privacy.html",
  "disclaimer.html",
  ...posts.map((post) => post.localPath)
];

await fs.writeFile(
  path.join(root, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${config.siteUrl}/${url}</loc>
    <lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>
  </url>`
  )
  .join("\n")}
</urlset>
`,
  "utf8"
);

await fs.writeFile(
  path.join(root, "robots.txt"),
  `User-agent: *
Allow: /

Sitemap: ${config.siteUrl}/sitemap.xml
`,
  "utf8"
);

await fs.writeFile(
  path.join(root, "ads.txt"),
  `# Add your Google AdSense publisher entry after approval.
# Example: google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0
`,
  "utf8"
);

console.log(`Synced ${posts.length} posts from ${config.rssUrl}`);
