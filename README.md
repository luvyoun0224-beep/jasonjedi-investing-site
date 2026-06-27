# Jason Jedi Investing

네이버 블로그 `미국 주식으로 100억 만들기`를 기반으로 만든 독립 투자 콘텐츠 홈페이지입니다.

이 사이트의 목적은 단순 미러링이 아니라 AdSense 승인과 검색 유입에 맞춘 콘텐츠 허브를 만드는 것입니다.

## 구성

- `index.html`: 홈페이지
- `posts/`: RSS 기반 글 요약 페이지
- `about.html`, `contact.html`, `privacy.html`, `disclaimer.html`: AdSense/신뢰용 필수 페이지
- `data/posts.json`: 네이버 RSS에서 동기화한 글 데이터
- `scripts/sync-rss.mjs`: RSS 동기화 및 글 페이지/sitemap 생성
- `.github/workflows/sync-rss.yml`: 매일 RSS 동기화 자동화

## 로컬 실행

```bash
npm run sync
npm run check
npm run serve
```

브라우저에서 `http://127.0.0.1:4173`을 열면 됩니다.

## AdSense 메모

Google AdSense는 고유하고 유용한 콘텐츠, 쉬운 내비게이션, 정책 준수, HTML 접근 가능성을 요구합니다. 이 사이트는 원문 전체 복사가 아니라 요약/허브/원문 링크 구조로 시작합니다.

승인 가능성을 높이려면 다음 작업이 필요합니다.

1. 핵심 글 10~20개를 네이버 원문 그대로가 아니라 독립 사이트용으로 리라이팅합니다.
2. 개인 투자 원칙, 포트폴리오 철학, 종목 분석 방법론 같은 고정 콘텐츠를 추가합니다.
3. 개인정보처리방침, 문의, 투자 고지 페이지를 유지합니다.
4. 광고 클릭 유도 문구를 넣지 않습니다.
