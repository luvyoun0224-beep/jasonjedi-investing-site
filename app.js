const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(date);
};

const postCard = (post) => `
  <article class="article-card" data-category="${post.topicId}">
    <div class="article-meta">
      <span class="pill">${post.topicLabel}</span>
      <span>${formatDate(post.isoDate)}</span>
    </div>
    <h3><a href="${post.localPath}">${post.title}</a></h3>
    <p>${post.summary}</p>
  </article>
`;

async function loadPosts() {
  const response = await fetch("data/posts.json");
  if (!response.ok) throw new Error("posts.json load failed");
  return response.json();
}

async function main() {
  const year = document.querySelector("#year");
  if (year) year.textContent = String(new Date().getFullYear());

  const topicGrid = document.querySelector("#topic-grid");
  const latestPosts = document.querySelector("#latest-posts");

  if (!topicGrid && !latestPosts) return;

  const { posts, categories } = await loadPosts();

  if (topicGrid) {
    topicGrid.innerHTML = categories
      .map(
        (category) => `
          <article class="topic-card">
            <strong>${category.label}</strong>
            <p>${category.description}</p>
          </article>
        `
      )
      .join("");
  }

  if (latestPosts) {
    latestPosts.innerHTML = posts.slice(0, 6).map(postCard).join("");
  }
}

main().catch((error) => {
  console.error(error);
  const latestPosts = document.querySelector("#latest-posts");
  if (latestPosts) {
    latestPosts.innerHTML = '<p class="article-card">글 목록을 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.</p>';
  }
});
