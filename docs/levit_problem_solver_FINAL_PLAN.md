# 레브잇 Problem Solver (AI Agent) 과제 — 최종 구현 계획서

> **최종 기준일: 2026-09-02**
>
> **제품 한 문장:**  
> 35~50세 여성이 원하는 의류 조건을 입력하면 여러 쇼핑몰의 실제 상품을 대신 탐색해 후보를 좁히고, 상품 정보와 실제 구매후기를 함께 분석해 **“왜 조건에 맞는지”와 “구매 전에 무엇을 조심해야 하는지”**까지 알려주는 AI Shopping Agent를 구현한다.

---

## 0. 최종 결론

이번 MVP의 우선순위는 다음과 같이 고정한다.

```text
1. 원하는 조건에 맞는 상품을 여러 쇼핑몰에서 찾아 후보를 압축한다.
2. 상품 상세정보와 실제 구매후기를 분석해 사진·실물, 사이즈·핏, 소재·품질의 구매 불확실성을 줄인다.
3. 최종 1~3개 상품에 대해 추천 근거, 구매 리스크와 후보 간 핵심 차이를 함께 보여준다.
```

즉 제품의 중심은 **Review Agent**도, 단순한 **AI 상품 추천 챗봇**도 아니다.

> **조건 기반 상품 탐색이 본체이고, 실제 구매후기는 추천을 검증하는 evidence layer다.**

사용자가 원래 직접 하던 다음 작업을 하나의 흐름으로 압축하는 것이 목표다.

```text
검색어 고민
→ 여러 쇼핑몰 탐색
→ 비슷한 상품 비교
→ 상세페이지 확인
→ 사이즈표 확인
→ 구매후기 탐색
→ 나와 비슷한 사람의 후기 확인
→ 실제 상품이 사진/기대와 다를 위험 판단
→ 구매 여부 결정
```

---

# 1. 설문 기반 문제 정의

## 1.1 조사 범위

2026-09-01 진행한 탐색적 설문에서:

- 전체 응답: 22명
- 타깃 범위 외 `그 외`: 1명 제외
- **35~50세 유효 응답: 21명**

원본 응답은 `docs/설문결과.csv`에 보존한다.

복수선택 문항은 각 선택지를 고른 응답자 수로 집계하므로 비율 합계가 100%가 아닐 수 있다. Q8, Q12와 Q15에는 설문에 표시된 최대 선택 수보다 많은 응답도 있어 원문을 임의로 수정하지 않고 그대로 집계했다.

표본이 작기 때문에 이 결과를 시장 전체를 대표하는 통계로 주장하지 않는다.

용도는 명확하다.

> **2일 안에 구현할 MVP의 문제와 기능 우선순위를 선택하기 위한 탐색적 근거**

---

## 1.2 가장 반복적으로 나타난 불편

35~50세 유효 응답 21명 기준:

| 불편 | 응답 |
|---|---:|
| 상품 사진과 실제 모습이 다를까 걱정 | **15/21 (71%)** |
| 비슷한 상품이 너무 많아 무엇을 골라야 할지 모르겠음 | **9/21 (43%)** |
| 소재·품질을 사진만 보고 판단하기 어려움 | **9/21 (43%)** |
| 사이즈를 결정하기 어려움 | **8/21 (38%)** |
| 원하는 스타일의 상품을 찾는 데 오래 걸림 | **7/21 (33%)** |
| 내 체형에 맞을지 판단하기 어려움 | **7/21 (33%)** |
| 광고성/협찬성 후기인지 구분하기 어려움 | **6/21 (29%)** |

`가장 불편한 한 가지` 역시 다음과 같이 분산되어 있다.

- 상품 사진 ↔ 실제 모습 차이: 4명
- 사이즈 결정: 4명
- 소재·품질 판단: 3명
- 원하는 스타일 탐색: 3명
- 비슷한 상품이 너무 많음: 2명
- 반품 부담: 2명
- 검색어 설정: 1명
- 나에게 어울릴지 판단: 1명
- 내 체형에 맞을지 판단: 1명

따라서 단일 세부 문제 하나보다는 아래의 공통된 상위 문제로 묶는 것이 적절하다.

> **온라인에서 원하는 옷을 찾는 데 탐색·비교 비용이 크고, 상품을 찾은 뒤에도 화면에 보이는 정보만으로 실제 구매 결과를 확신하기 어렵다.**

---

## 1.3 실제 구매 실패와 연결되는 문제

온라인 구매 후 교환/반품 또는 불만의 대표 원인:

- 사이즈가 맞지 않음: **12/21 (57%)**
- 생각했던 핏과 다름: **12/21 (57%)**
- 나에게 어울리지 않음: **6/21 (29%)**
- 소재·품질이 기대와 다름: **6/21 (29%)**

또한 **15/21 (71%)**이 옷 하나를 결정하는 데 `여러 날에 걸쳐 고민한다`고 응답했다.

따라서 문제는 단순한 검색 편의성이 아니다.

```text
탐색 비용
+
구매 전 불확실성
+
잘못 구매했을 때의 교환/반품 비용
```

이 연결되어 있다.

---

## 1.4 사용자가 이미 하고 있는 행동

구매 결정을 위해 응답자들은 이미:

- 구매후기 읽기: **12/21**
- 사진 후기 확인: **11/21**
- 여러 쇼핑몰/앱 비교: **10/21**
- 사이즈표 확인: **10/21**
- 나와 비슷한 체형/연령 후기 찾기: **7/21**
- 상세페이지 확인: **7/21**
- 상품 목록을 오래 탐색: **7/21**
- 검색어를 반복 변경: **6/21**

등을 수행하고 있다.

따라서 AI Agent가 새로운 행동을 학습시키는 것이 아니라:

> **사용자가 현재 직접 수행하는 정보 탐색·정리·비교 작업을 대신 수행하는 것**

이 MVP의 핵심이다.

---

## 1.5 원하는 도움

설문 Q15 기준:

| 원하는 도움 | 응답 |
|---|---:|
| 내가 말한 조건에 맞는 상품만 골라주기 | **12/21 (57%)** |
| 나와 비슷한 체형/연령의 후기만 찾아주기 | **9/21 (43%)** |
| 비슷한 상품끼리 차이점을 비교 | **8/21 (38%)** |
| 여러 쇼핑몰 상품을 한 번에 찾기 | **5/21 (24%)** |
| 나에게 맞는 사이즈를 추천해주기 | **4/21 (19%)** |
| 내 체형에 잘 맞을 상품인지 알려주기 | **4/21 (19%)** |
| 수많은 리뷰에서 중요한 내용만 정리 | **4/21 (19%)** |

여기서 제품 우선순위를 결정한다.

```text
조건 기반 탐색
    ↓
후보 압축/비교
    ↓
실제 후기 기반 검증
```

---

## 1.6 인터랙션 방식

설문에서 선호 방식:

- 일반 쇼핑앱처럼 조건 선택: 7명
- 여러 상품을 선택해 비교: 5명
- 원하는 것을 자연어로 설명해 추천: 4명
- 보고 있는 상품에 대해 질문: 1명
- 잘 모르겠다: 3명
- 무응답: 1명

따라서 UI는 ChatGPT형 빈 대화창이 아니다.

> **쇼핑 검색 UI를 중심으로 두고, 자연어 conversation은 검색과 refinement를 도와주는 방식**

으로 구현한다.

---

# 2. 최종 고객 문제

## Problem Statement

> **35~50세 여성은 온라인 의류 쇼핑에서 원하는 상품을 찾기 위해 여러 쇼핑몰과 상품을 반복적으로 탐색해야 한다. 상품을 찾은 뒤에도 사진과 상세정보만으로 실제 핏·사이즈·소재·품질이 기대와 같을지 확신하기 어려워 사이즈표와 수많은 후기, 비슷한 체형의 구매 경험을 추가로 확인한다. 이 과정은 구매 결정을 지연시키고, 잘못 구매할 경우 교환·반품 비용으로 이어진다.**

---

# 3. 최종 MVP 정의

## 3.1 서비스

사용자가 원하는 옷의 조건을 입력한다.

예:

> "회사에서 입을 검정 여름 바지 찾아줘. 10만원 이하고 너무 딱 붙는 건 싫어."

Agent는:

1. 사용자의 요청을 해석한다.
2. 정보가 충분하면 바로 상품 DB를 검색한다.
3. 여러 Cafe24 쇼핑몰의 크롤링 상품에서 조건에 맞는 후보를 찾는다.
4. 최대 15개의 후보를 가져온다.
5. 상품 상세정보와 review summary를 함께 비교한다.
6. 최대 3개를 추천한다.
7. 각 상품에:
   - 왜 내 조건에 맞는지
   - 실제 구매자는 어떻게 평가했는지
   - 사진과 실제가 다르다는 의견이 있는지
   - 핏/사이즈 이슈가 있는지
   - 소재/품질 관련 우려가 있는지
   - 구매 전 확인해야 할 점
   을 제공한다.
8. 추천 상품이 2개 이상이면 각 후보가 누구에게 더 적합한지와 핵심 trade-off를 자동 비교한다.

---

## 3.2 Product Card 정보 우선순위

```text
1. 실제 상품 정보
2. 왜 내 조건에 맞는지
3. 사이즈·핏 참고
4. 실제 구매후기 요약
5. 구매 전 리스크 / 확인할 점
6. 원본 상품 페이지 링크
```

예:

```text
┌────────────────────────────────┐
│ [상품 이미지]                   │
│                                │
│ 세미 와이드 슬랙스              │
│ 59,000원                       │
│                                │
│ 왜 내 조건에 맞나요?            │
│ ✓ 10만원 이하                  │
│ ✓ 출근용으로 활용 가능          │
│ ✓ 여유 있는 실루엣              │
│                                │
│ 사이즈·핏 참고                  │
│ · 판매 사이즈: M / L            │
│ · 정사이즈 의견이 우세           │
│ · 사이즈표 정보가 없으면         │
│   판단할 정보가 부족해요 표시     │
│                                │
│ 실제 구매한 사람들은?           │
│ · 실제 색상이 사진과 비슷하다는  │
│   의견이 많음                   │
│                                │
│ 구매 전 확인하세요              │
│ △ 허벅지가 붙는다는 의견 일부    │
│ △ 소재가 얇다는 의견 일부        │
│                                │
│ [상품 보러가기 →]               │
└────────────────────────────────┘
```

근거 없는 `92% 적합` 같은 숫자는 사용하지 않는다.

추천 상품이 2개 이상이면 카드 위에 자동 비교 요약을 제공한다.

```text
상품 A: 여유 있는 핏을 우선할 때 적합 / 소재가 얇다는 의견 일부
상품 B: 가격을 우선할 때 적합 / 사이즈 관련 후기 부족
```

---

# 4. 구현 범위 / Non-goals

## 반드시 구현

- React 기반 외부 접속 가능한 웹
- Node.js Express Backend
- 여러 Cafe24 쇼핑몰 상품 크롤링
- 실제 상품 정보 저장
- 상품별 일부 텍스트 리뷰 크롤링
- OpenAI 기반 offline enrichment
- SQLite DB
- 자연어 상품 조건 입력
- `search_products` custom function tool
- 조건 기반 검색
- LLM final ranking
- 리뷰 기반 구매 위험 요약
- 실제 판매 사이즈와 확보 가능한 사이즈표 정보 표시
- 사이즈·핏 근거가 없을 때 정보 부족 상태 표시
- 추천 상품 2~3개의 자동 비교 요약
- 최대 3개의 실제 상품 추천
- 상품 원본 링크
- 후속 conversation refinement
- 모바일 대응

## 구현하지 않음

- 회원가입
- 로그인
- 사용자 DB
- 장바구니
- 결제
- 찜
- 관리자 페이지
- PostgreSQL
- Vector DB
- Embedding search
- RAG framework
- LangChain
- 자체 ML 추천모델
- 실시간 production crawling
- Streaming response
- 장기 conversation 저장
- 사용자 행동 로그 저장
- 리뷰 이미지 Vision 분석
- 가상 피팅
- 확정적인 개인 사이즈 추천
- 키·체형 정보를 저장하는 사용자 프로필
- 사용자가 상품을 선택하는 별도 비교 화면
- 보유 옷장 기능
- 코디 recommendation system
- 근거 없는 적합도 %

---

# 5. 확정 기술 스택

## Runtime

- **Node.js 24 LTS**
- JavaScript
- npm
- root `package.json` 하나

## Frontend

- React
- Vite
- JavaScript
- Tailwind CSS
- `useReducer`

## Backend

- Node.js
- Express
- JavaScript

## Database

- SQLite
- `better-sqlite3`
- ORM 사용 안 함
- 직접 SQL migration 작성

## AI

### Runtime Shopping Agent

- Model ID: **`gpt-5.6-sol`**
- Reasoning effort: `low`
- OpenAI Responses API
- Custom function calling
- `previous_response_id`로 multi-turn context 유지

### Offline Product / Review Enrichment

- Model ID: **`gpt-5.6-luna`**
- Reasoning effort: `none`

모델과 reasoning effort는 config 파일에서 변경 가능하게 한다.

## Crawling

- Node `fetch`
- Cheerio
- internal API/XHR direct call
- Playwright fallback

## Deployment

- Render 단일 Web Service
- Express가 React build static serving

---

# 6. 전체 Architecture

```text
┌──────────────────── Offline Data Pipeline ────────────────────┐

Cafe24 Shop A ─┐
Cafe24 Shop B ─┼────→ Cafe24 Crawler
Cafe24 Shop C ─┘             │
                              │
                              ▼
                    data/raw/{shop}.json
                              │
                              ▼
                          Normalize
                              │
                              ▼
              GPT-5.6 Luna Offline Enrichment
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
         Product Attributes           Review Summary
                │                           │
                └─────────────┬─────────────┘
                              ▼
                  data/enriched/{shop}.json
                              │
                              ▼
                         DB Build
                              │
                              ▼
                    SQLite products.db

└───────────────────────────────────────────────────────────────┘


┌──────────────────────── Runtime ──────────────────────────────┐

User
 │
 ▼
React Search UI
 │
 ▼
POST /api/chat
 │
 ▼
GPT-5.6 Sol Agent
 │
 │ function call
 ▼
search_products()
 │
 ▼
SQLite Hard Filtering
 │
 ▼
Lightweight Retrieval
 │
 ▼
max 15 Candidates
 │
 ▼
GPT-5.6 Sol Final Ranking
 │
 ▼
Structured Recommendation
 │
 ▼
DB Factual Data Merge
 │
 ▼
1~3 Product Cards

└───────────────────────────────────────────────────────────────┘
```

---

# 7. Repository 구조

```text
SeongeunKim-YYYYMMDD/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ProductCard.jsx
│   │   │   └── LoadingState.jsx
│   │   │
│   │   ├── features/
│   │   │   └── shopping/
│   │   │       ├── ShoppingAgent.jsx
│   │   │       ├── SearchInput.jsx
│   │   │       ├── RecommendationResult.jsx
│   │   │       ├── ClarificationMessage.jsx
│   │   │       ├── NoResultMessage.jsx
│   │   │       ├── reducer.js
│   │   │       └── api.js
│   │   │
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   │
│   ├── index.html
│   └── vite.config.js
│
├── server/
│   ├── agent/
│   │   ├── agent.js
│   │   ├── prompt.js
│   │   ├── tools.js
│   │   ├── toolExecutor.js
│   │   └── responseSchema.js
│   │
│   ├── products/
│   │   ├── productRepository.js
│   │   ├── searchProducts.js
│   │   ├── retrievalScore.js
│   │   └── productDto.js
│   │
│   ├── db/
│   │   ├── connection.js
│   │   └── migrationRunner.js
│   │
│   ├── config/
│   │   ├── ai.js
│   │   └── retrieval.js
│   │
│   ├── routes/
│   │   ├── chat.js
│   │   └── health.js
│   │
│   └── index.js
│
├── crawler/
│   ├── cafe24/
│   │   ├── discoverProductUrls.js
│   │   ├── parseProduct.js
│   │   ├── parseReviews.js
│   │   └── fallbacks.js
│   │
│   ├── pipeline/
│   │   ├── crawl.js
│   │   ├── normalize.js
│   │   └── enrich.js
│   │
│   └── config/
│       └── shops.js
│
├── db/
│   └── migrations/
│       └── 001_initial.sql
│
├── data/
│   ├── raw/
│   ├── enriched/
│   └── products.db          # gitignore
│
├── eval/
│   └── cases.json
│
├── tests/
│   ├── normalize.test.js
│   ├── searchProducts.test.js
│   ├── retrievalScore.test.js
│   └── dbBuild.test.js
│
├── scripts/
│   ├── buildDatabase.js
│   └── runMigrations.js
│
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

# 8. Cafe24 Crawler

## 8.1 대상 전략

제품 가치는 여러 쇼핑몰 탐색에서 확보하되 크롤링에는 과투자하지 않는다.

따라서:

> **Cafe24로 생성된 여러 여성 의류 쇼핑몰을 하나의 Cafe24 전용 crawler로 수집한다.**

쇼핑몰마다 crawler를 만들지 않는다.

```text
Cafe24 Common Parser
+
Shop Config
+
필요한 경우 selector override
```

---

## 8.2 Shop Config

`crawler/config/shops.js`

```js
export const SHOPS = {
  shopA: {
    id: 'shop-a',
    name: '...',
    baseUrl: '...',
    categories: [
      {
        id: 'tops',
        name: '상의',
        url: '...'
      }
    ],
    selectors: {
      // 공통 parser로 해결되지 않을 때만 override
    }
  }
};
```

---

## 8.3 Crawler 구현 방식

class보다 pure function 위주.

```text
discoverProductUrls(shopConfig)
fetchPage(url)
parseCafe24Product(html, shopConfig)
parseCafe24Reviews(html, shopConfig)
tryInternalApi(...)
fetchWithPlaywright(...)
```

---

## 8.4 Parsing 우선순위

```text
HTTP fetch
 ↓
1. JSON-LD Product
2. OpenGraph / meta
3. Cafe24 공통 DOM pattern
4. shop-specific selector override
5. embedded serialized JSON
 ↓ 부족
6. internal API / XHR
 ↓ 부족
7. Playwright rendered DOM
```

원칙:

> 사이트가 React인지 아닌지가 아니라 **필요한 데이터가 JavaScript 실행 후에만 생성되는지**로 Playwright 필요 여부를 결정한다.

---

## 8.5 수집량

- 최초: `1 shop × 10 products`
- end-to-end 확인 후 확대
- 최종: **사이트당 최대 50개**
- 사이트 2~3개 정도로 충분
- 상품 다양성이 서비스 시연에 부족할 경우에만 추가

과제에서 크롤링 양 자체는 평가 핵심이 아니므로 수량 경쟁을 하지 않는다.

## 8.6 사이즈표 수집

상품 상세페이지에서 실제 판매 사이즈와 사이즈표 원문을 확보한다.

- `sizes`: 판매 옵션에서 확인되는 사이즈 목록
- `sizeGuideText`: 상품 상세페이지에서 확인되는 사이즈표 또는 치수 안내 원문

`sizeGuideText`는 nullable이다. 쇼핑몰별 사이즈표 구조를 완전히 정규화하는 데 과투자하지 않고, 크롤러가 실제로 읽은 원문만 저장한다. 사이즈표가 이미지로만 제공되고 텍스트를 안전하게 추출할 수 없으면 `null`로 둔다.

---

# 9. Review Crawling

설문 결과에 따라 리뷰 수집을 **MVP 필수**로 고정한다.

하지만 review crawler 때문에 프로젝트 전체가 막히면 안 된다.

## 9.1 목표

상품별:

- 최근 텍스트 리뷰 최대 **10~20개**
- rating
- 구매 옵션
- 작성일
- 공개적으로 제공되는 reviewer profile 정보

가능한 경우:

- height
- weight
- usual size
- age group

수집하지 않는 것:

- reviewer 이름
- reviewer ID
- 개인 식별 정보

리뷰 이미지:

- URL이 쉽게 얻어지면 nullable로 저장
- **이미지 분석은 MVP에서 하지 않음**

---

## 9.2 Review 수집 우선순위

```text
HTML
 ↓
Embedded JSON / Cafe24 review data
 ↓
Internal review API/XHR
 ↓
Playwright fallback
```

시간 우선순위:

```text
텍스트 리뷰
>
구매 옵션
>
공개된 체형 metadata
>
리뷰 이미지
```

리뷰를 못 가져왔다고 상품 자체를 버리지 않는다.

---

# 10. Raw Product Schema

```js
{
  source: {
    shopId: 'shop-a',
    shopName: '...',
    sourceProductId: '1234',
    productUrl: 'https://...'
  },

  name: '...',
  brand: null,
  category: 'pants',

  price: 59000,
  originalPrice: null,

  imageUrl: 'https://...',

  colors: [],
  sizes: [],
  sizeGuideText: null,
  material: null,

  description: '원문 상품 설명',

  rating: null,
  reviewCount: null,

  reviews: [
    {
      rating: 5,
      text: '원문 리뷰',
      optionText: null,

      reviewerProfile: {
        heightCm: null,
        weightKg: null,
        usualSize: null,
        ageGroup: null
      },

      imageUrls: [],
      createdAt: null
    }
  ],

  crawledAt: '...'
}
```

Nullable 허용:

- brand
- originalPrice
- colors
- sizes
- sizeGuideText
- material
- rating
- reviewCount
- reviews
- 모든 review metadata

---

# 11. Source of Truth

```text
data/raw/*.json
    = 크롤링 원본 / source of truth

data/enriched/*.json
    = AI-derived data

data/products.db
    = runtime storage
```

정책:

- raw JSON → Git commit
- enriched JSON → Git commit
- migration SQL → Git commit
- products.db → `.gitignore`

언제든:

```bash
npm run db:build
```

만으로 DB를 재생성할 수 있어야 한다.

---

# 12. Offline AI Enrichment

## 12.1 역할

Enrichment는 크게 두 가지다.

### A. Product Understanding

- 상품 설명 summary
- style
- occasion
- fit
- season
- extra tags

### B. Review Aggregation

- 사진 ↔ 실제 appearance signal
- 사이즈/핏 signal
- 소재/품질 signal
- 반복적으로 나타난 장점
- 반복적으로 나타난 concern
- 실제로 metadata가 있는 유사 체형 후기

---

## 12.2 Controlled Vocabulary

### Style

```text
minimal
classic
casual
feminine
modern
sporty
```

### Occasion

```text
daily
office
formal
event
travel
exercise
```

### Fit

```text
slim
regular
relaxed
oversized
wide
```

### Season

```text
spring
summer
fall
winter
all_season
```

미리 정의하기 어려운 특징:

```js
extraTags: []
```

에 free-form으로 저장.

---

## 12.3 AI가 생성하면 안 되는 정보

Enrichment LLM은 다음 factual field를 생성하지 않는다.

- price
- brand
- colors
- actual sizes
- size guide text / measurements
- material
- rating
- review count
- stock
- URL
- reviewer profile

Crawler가 없는 정보를 LLM으로 채우지 않는다.

---

# 13. Review Summary Schema

```js
{
  analyzedReviewCount: 14,

  appearanceMatch: {
    signal: 'similar',
    // similar | different | mixed | unknown
    summary: '실제 색상이 상품 사진과 비슷하다는 의견이 주로 확인됨'
  },

  sizeFit: {
    signal: 'true_to_size',
    // runs_small | true_to_size | runs_large | mixed | unknown
    summary: '정사이즈 의견이 우세하며 허벅지가 붙는다는 의견 일부'
  },

  materialQuality: {
    signal: 'mixed',
    // positive | negative | mixed | unknown
    summary: '촉감은 좋다는 평가가 많지만 원단이 얇다는 의견 일부'
  },

  positives: [
    '실제 색상이 상품 사진과 비슷하다는 의견이 반복됨'
  ],

  concerns: [
    '허벅지가 예상보다 붙는다는 의견이 일부 있음'
  ],

  similarReviewerNotes: [
    {
      profile: '165cm / 평소 66',
      note: 'M 사이즈가 정사이즈였다는 후기'
    }
  ]
}
```

규칙:

- `analyzedReviewCount`를 항상 같이 저장
- 근거 부족 → `unknown`
- 리뷰가 없으면 긍정/부정으로 추론 금지
- 소수 의견을 다수 의견으로 표현 금지
- 서로 의견이 갈리면 `mixed`
- 실제 metadata가 있는 리뷰만 `similarReviewerNotes`에 사용

---

# 14. Enriched Product

```js
{
  productId: 'shop-a:1234',

  summary: '...',

  styleTags: ['minimal'],
  occasionTags: ['office'],
  fitTags: ['regular'],
  seasonTags: ['spring', 'fall'],
  extraTags: ['허리 밴딩'],

  reviewSummary: {
    // Review Summary Schema
  },

  model: 'gpt-5.6-luna',
  promptVersion: 'v-final',
  enrichedAt: '...'
}
```

원본 description/reviews는 유지한다.

Runtime Agent에는 raw text 전체 대신 summary 위주로 전달한다.

---

# 15. SQLite Schema

핵심 엔티티만 정규화한다.

```text
shops
  │ 1:N
products
  ├── 1:N reviews
  └── 1:1 product_enrichments
```

---

## shops

```sql
CREATE TABLE shops (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  base_url TEXT NOT NULL
);
```

## products

```sql
CREATE TABLE products (
  id TEXT PRIMARY KEY,

  shop_id TEXT NOT NULL,
  source_product_id TEXT NOT NULL,

  name TEXT NOT NULL,
  brand TEXT,
  category TEXT NOT NULL,

  price INTEGER NOT NULL,
  original_price INTEGER,

  image_url TEXT NOT NULL,
  product_url TEXT NOT NULL,

  colors_json TEXT,
  sizes_json TEXT,
  size_guide_text TEXT,

  material TEXT,
  description TEXT,

  rating REAL,
  review_count INTEGER,

  crawled_at TEXT NOT NULL,

  FOREIGN KEY (shop_id)
    REFERENCES shops(id),

  UNIQUE(shop_id, source_product_id)
);
```

## reviews

```sql
CREATE TABLE reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  product_id TEXT NOT NULL,

  rating REAL,
  text TEXT NOT NULL,

  option_text TEXT,
  reviewer_profile_json TEXT,
  image_urls_json TEXT,

  created_at TEXT,

  FOREIGN KEY (product_id)
    REFERENCES products(id)
    ON DELETE CASCADE
);
```

## product_enrichments

```sql
CREATE TABLE product_enrichments (
  product_id TEXT PRIMARY KEY,

  summary TEXT,

  style_tags_json TEXT,
  occasion_tags_json TEXT,
  fit_tags_json TEXT,
  season_tags_json TEXT,
  extra_tags_json TEXT,

  review_summary_json TEXT,

  model TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  enriched_at TEXT NOT NULL,

  FOREIGN KEY (product_id)
    REFERENCES products(id)
    ON DELETE CASCADE
);
```

---

# 16. Migration

별도 ORM/migration library를 사용하지 않는다.

```text
db/migrations/
├── 001_initial.sql
└── ...
```

`schema_migrations` 테이블로 version 관리.

Migration runner:

1. migration 파일 정렬
2. 적용 여부 확인
3. 미적용 SQL transaction 실행
4. 성공하면 version 기록
5. 오류 시 rollback

---

# 17. DB Build

```text
raw JSON
+
enriched JSON
+
migration
   ↓
npm run db:build
   ↓
products.db
```

상품 식별:

```text
shop_id + source_product_id
```

UPSERT:

```sql
ON CONFLICT(shop_id, source_product_id)
DO UPDATE ...
```

---

# 18. Product Repository

상위 레이어가 `better-sqlite3` 구현에 직접 의존하지 않는다.

```js
saveProducts(products)
searchProducts(filters)
getProductById(id)
getProductsByIds(ids)
getReviewsByProductId(id)
```

---

# 19. Agent 기본 설정

`server/config/ai.js`

```js
export const AI_CONFIG = {
  agent: {
    model: 'gpt-5.6-sol',
    reasoningEffort: 'low',
    maxToolRounds: 3
  },

  enrichment: {
    model: 'gpt-5.6-luna',
    reasoningEffort: 'none'
  }
};
```

추후 품질/latency를 확인하면서 config만 수정한다.

---

# 20. Conversation State

Responses API의:

```text
previous_response_id
```

사용.

Frontend:

```js
sessionStorage.setItem(
  'previousResponseId',
  responseId
);
```

정책:

- 별도의 conversation table 없음
- 실제 사용자 query 저장 안 함
- 새 탭이면 새로운 세션
- `새로 찾기` 버튼으로 state reset
- 매 OpenAI 요청에 instructions/tools를 다시 전달

---

# 21. Agent 행동 원칙

```text
1. 현재 요청만으로 검색이 가능하면 즉시 search_products 호출.
2. 있으면 좋은 정보 때문에 검색을 막지 않는다.
3. 검색 자체가 의미 없을 정도로 정보가 부족할 때만 질문.
4. 질문은 한 번에 하나.
5. 최대 3개 상품 추천.
6. search_products 결과에 없는 상품 추천 금지.
7. 적절한 후보가 1~2개라면 억지로 3개를 채우지 않는다.
8. 조건 적합성을 먼저 설명한다.
9. 리뷰는 추천을 검증하는 evidence로 사용한다.
10. 리뷰가 없으면 없는 대로 표현하고 추측하지 않는다.
11. 실제 후기 의견이 갈리면 mixed/불확실성으로 표현한다.
12. 사이즈/핏/소재 결과를 확정적으로 보장하지 않는다.
13. 실제 reviewer metadata가 있을 때만 유사 체형 후기라고 표현한다.
14. 장점과 함께 구매 전 concern을 반드시 고려한다.
15. 판매 사이즈나 사이즈표가 없으면 이를 생성하지 않고 정보 부족으로 표현한다.
16. 추천이 2개 이상이면 동일한 기준으로 핵심 차이와 trade-off를 비교한다.
```

---

# 22. Agent Tool

MVP에서는 custom tool 하나만 사용한다.

```text
search_products
```

다음 tool은 만들지 않는다.

- compare_products
- search_reviews
- get_product_details

현재 데이터 규모에서는 `search_products`가 필요한 product summary + review summary를 한 번에 반환하면 충분하다.

필요성이 실제로 확인될 때만 tool을 추가한다.

---

# 23. `search_products` Tool Input

원문 query를 버리지 않는다.

```js
{
  query:
    '회사에서 입을 편한 검정 바지. 10만원 이하고 너무 붙는 건 싫어요.',

  required: {
    category: 'pants',
    minPrice: null,
    maxPrice: 100000,

    colors: [],
    sizes: []
  },

  preferred: {
    colors: ['black'],
    sizes: [],

    styleTags: ['minimal'],
    occasionTags: ['office'],
    fitTags: ['relaxed'],
    seasonTags: [],

    keywords: ['편한'],
    avoidKeywords: ['슬림', '타이트'],

    reviewSignals: {
      appearanceMatch: null,
      sizeFit: null,
      materialQuality: null
    }
  }
}
```

사용자의 원래 문장:

> "너무 결혼식 하객처럼 차려입은 느낌은 싫어"

같은 nuanced intent가 structured tags에서 손실되지 않도록 final ranking에 원문도 제공한다.

키·체형을 저장하는 별도 사용자 프로필이나 `fitContext`는 추가하지 않는다. 사용자가 현재 질의에 평소 사이즈나 체형 고민을 적으면 원문 `query`와 기존 `sizes`, `fitTags`, `keywords` 안에서만 soft context로 해석한다.

---

# 24. Required / Preferred

## Hard filter

항상 가능:

- category
- minPrice
- maxPrice

조건부:

- color
- size

color/size를 hard로 처리하려면:

1. 사용자가 반드시 필요한 조건이라고 명시
2. 해당 상품의 데이터가 신뢰할 수 있게 존재

둘 다 만족해야 한다.

---

## Soft preference

- color
- size
- style
- occasion
- fit
- season
- keywords
- subjective preference
- review-derived signal

리뷰가 없는 상품:

```text
unknown
```

으로 처리하고 감점하지 않는다.

---

# 25. 검색 Pipeline

```text
전체 상품
   ↓
SQLite Hard Filtering
   ↓
N products
   ↓
N <= 15
 ├─ Yes → 그대로 Agent
 └─ No
      ↓
 Lightweight Retrieval Score
      ↓
 Top 15
      ↓
 GPT-5.6 Sol
 Final Semantic Ranking
      ↓
 Top 1~3
```

핵심:

> **Retrieval score는 최종 추천 점수가 아니다.**

Retrieval 목적:

```text
많은 상품 중 LLM이 검토할 가치가 있는 후보를
놓치지 않으면서 최대 15개로 줄이는 것
```

최종 추천은 GPT-5.6 Sol이 직접 판단한다.

---

# 26. Retrieval Score

`server/config/retrieval.js`

```js
export const RETRIEVAL_CONFIG = {
  candidateLimit: 15,

  weights: {
    keyword: 1,
    color: 2,
    size: 2,
    style: 2,
    occasion: 2,
    fit: 3,
    season: 1,
    reviewSignal: 2
  }
};
```

설문을 반영한 기본 원칙:

- `fit` 중요도를 높게 둔다.
- review signal도 retrieval에 활용한다.
- 하지만 조건 기반 탐색이 제품의 1순위이므로 review가 retrieval을 지배하지 않게 한다.
- review가 `unknown`이면 감점 없음.

이 값은 **수동 evaluation 후 config에서 조정**한다.

UI에는 노출하지 않는다.

---

# 27. Agent용 Compact Product DTO

```js
{
  id: 'shop-a:1234',

  name: '세미 와이드 슬랙스',
  brand: '...',
  category: 'pants',

  price: 59000,

  colors: ['black', 'navy'],
  sizes: ['M', 'L'],
  sizeGuideText: 'M 허리 70cm / L 허리 74cm',
  material: '...',

  summary: '...',

  styleTags: ['minimal'],
  occasionTags: ['office'],
  fitTags: ['wide'],
  seasonTags: ['spring', 'fall'],
  extraTags: ['허리 밴딩'],

  reviewSummary: {
    analyzedReviewCount: 14,

    appearanceMatch: {
      signal: 'similar',
      summary: '실제 색상이 사진과 비슷하다는 의견이 많음'
    },

    sizeFit: {
      signal: 'true_to_size',
      summary: '정사이즈 의견이 우세하고 허벅지가 붙는 의견 일부'
    },

    materialQuality: {
      signal: 'mixed',
      summary: '촉감은 좋지만 원단이 얇다는 의견 일부'
    },

    positives: [],
    concerns: [],
    similarReviewerNotes: []
  }
}
```

Agent에게 넘기지 않는 정보:

- image URL
- source URL
- raw description
- raw reviews

Final response 단계에서 서버가 결합한다.

---

# 28. Final Structured Output

LLM이 반환:

```json
{
  "message": "조건과 실제 구매후기를 함께 보고 상품을 골랐어요.",
  "recommendations": [
    {
      "productId": "shop-a:1234",

      "reason":
        "10만원 이하의 출근용 바지이며 여유 있는 핏을 원하는 조건에 잘 맞습니다.",

      "evidence": [
        {
          "type": "occasion",
          "value": "office"
        },
        {
          "type": "fit",
          "value": "wide"
        },
        {
          "type": "review_size_fit",
          "value": "true_to_size"
        }
      ],

      "strengths": [
        "요청 가격 범위 안에 있음",
        "정사이즈라는 구매후기가 우세함"
      ],

      "concerns": [
        "허벅지 부분이 예상보다 붙는다는 의견이 일부 있음"
      ]
    },
    {
      "productId": "shop-b:5678",
      "reason":
        "요청 가격 범위 안에서 소재 관련 긍정 후기가 확인된 출근용 바지입니다.",
      "evidence": [
        {
          "type": "occasion",
          "value": "office"
        },
        {
          "type": "review_material_quality",
          "value": "positive"
        }
      ],
      "strengths": [
        "소재가 괜찮다는 구매후기가 확인됨"
      ],
      "concerns": [
        "사이즈 관련 후기가 부족함"
      ]
    }
  ],
  "comparison": [
    {
      "productId": "shop-a:1234",
      "bestFor": "여유 있는 출근용 핏을 우선하는 경우",
      "tradeoff": "허벅지가 붙는다는 의견이 일부 있음"
    },
    {
      "productId": "shop-b:5678",
      "bestFor": "소재 관련 구매후기를 우선하는 경우",
      "tradeoff": "사이즈 관련 후기가 부족함"
    }
  ]
}
```

`comparison` 규칙:

- 추천이 1개면 빈 배열
- 추천이 2~3개면 각 추천 상품마다 최대 한 개 항목
- `productId`는 recommendations와 동일한 candidate set만 허용
- `bestFor`와 `tradeoff`는 실제 상품·리뷰 근거 안에서만 작성

---

# 29. Hallucination 방지

LLM이 직접 생성:

- productId 선택
- reason
- strengths
- concerns
- evidence reference

서버가 DB에서 결합:

- actual product name
- brand
- price
- image
- URL
- color
- size
- size guide text
- rating
- review summary
- review count

LLM은 존재하지 않는 상품/가격/링크/사이즈를 만들 수 없다.

추가 검증:

```text
recommendation.productId가 candidate set에 존재하는지 확인
comparison.productId가 recommendation set에 존재하는지 확인
```

가능하다면 evidence도 실제 candidate data와 일치 여부 검증.

---

# 30. Tool Execution Loop

최대 3회.

```js
for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
  // OpenAI call
  // function call 확인
  // search_products 실행
  // tool output 전달
}
```

가능:

```text
첫 검색
→ 너무 적거나 부적절
→ Agent가 soft 조건 조정
→ 재검색
→ 추천
```

금지:

```text
무제한 반복
```

---

# 31. Backend API

두 개만 제공.

```http
POST /api/chat
GET /api/health
```

## POST `/api/chat`

Request:

```json
{
  "message": "10만원 이하 출근용 검정 바지 찾아줘",
  "previousResponseId": null
}
```

정상 response type:

```text
clarification
recommendation
no_result
```

Error는 `type: error`의 200 응답이 아니라 HTTP status code로 처리한다.

---

# 32. Response Types

## clarification

```json
{
  "type": "clarification",
  "responseId": "resp_xxx",
  "message": "어떤 종류의 옷을 찾고 계세요?"
}
```

## recommendation

```json
{
  "type": "recommendation",
  "responseId": "resp_xxx",
  "message": "조건에 맞는 상품을 골랐어요.",
  "criteria": {},
  "products": [],
  "comparison": []
}
```

## no_result

```json
{
  "type": "no_result",
  "responseId": "resp_xxx",
  "message": "조건을 만족하는 상품을 찾지 못했어요.",
  "suggestion": "가격 범위를 조금 넓혀볼까요?"
}
```

---

# 33. Non-streaming

MVP에서는 streaming 미사용.

이유:

- 핵심 결과가 text stream이 아니라 product cards
- function calling + structured output 단순화
- JSON 완료 후 rendering이 안전
- 에러 처리 간단

Frontend에서 loading stage를 보여준다.

```text
조건을 확인하고 있어요…
→ 상품을 찾고 있어요…
→ 실제 구매후기를 함께 확인하고 있어요…
→ 결과
```

---

# 34. Frontend UX

## 34.1 첫 화면

ChatGPT blank chat 형태를 사용하지 않는다.

```text
어떤 옷을 찾고 계세요?

[ 원하는 조건을 자유롭게 입력해주세요               ]

카테고리      가격대      사이즈

예시
[출근용 여름 바지]
[모임에 입을 단정한 옷]
[편하게 입을 상의]
```

검색 조건 form과 자연어 input을 같이 사용할 수 있게 한다.

초기 구현에서는 UI condition이 모두 optional.

---

## 34.2 검색 이후

```text
내가 찾는 조건

AI가 찾은 결과

[후보 간 핵심 차이 자동 비교]

[Product 1] [Product 2] [Product 3]

[조금 더 저렴한 걸로 찾아줘                ]
```

Conversation은 검색 이후 refinement 수단.

각 Product Card는 같은 순서로 다음 정보를 표시한다.

```text
가격
→ 핏
→ 소재
→ 판매 사이즈 / 사이즈표
→ 사진·실물 후기 신호
→ 사이즈·핏 후기 신호
→ 핵심 우려
```

사이즈표 또는 관련 후기가 없으면 빈 영역을 숨기지 않고 `판단할 정보가 부족해요`라고 표시한다.

예:

- "1번 같은데 좀 더 저렴한 걸로"
- "사이즈 작다는 후기가 적은 걸로"
- "좀 더 캐주얼한 걸로"
- "소재가 괜찮다는 후기 많은 걸로"

---

# 35. React State

`useReducer`

```js
{
  messages: [],
  status: 'idle',
  previousResponseId: null,
  error: null
}
```

Actions:

```text
SEND_MESSAGE
RECEIVE_CLARIFICATION
RECEIVE_RECOMMENDATION
RECEIVE_NO_RESULT
REQUEST_FAILED
RESET_CONVERSATION
```

Zustand/Redux 등 외부 state library 미사용.

---

# 36. Responsive Product UI

Desktop:

```text
[후보 간 핵심 차이]
[Product 1] [Product 2] [Product 3]
```

Mobile:

```text
[후보 간 핵심 차이]
[Product 1]
[Product 2]
[Product 3]
```

Tailwind로 responsive layout 구현.

---

# 37. Reset

`새로 찾기` 버튼:

```js
sessionStorage.removeItem('previousResponseId');
```

그리고 frontend reducer 초기화.

---

# 38. Environment / Config

## `.env`

```env
OPENAI_API_KEY=
PORT=3000
```

Secret만 env에 둔다.

## config

- model
- reasoning effort
- tool round
- candidate limit
- retrieval weights

등은 Git에서 확인 가능한 JS config로 관리한다.

---

# 39. npm Scripts

```text
npm run dev

npm run crawl -- --shop <shopId>
npm run crawl -- --all

npm run enrich -- --shop <shopId>
npm run enrich -- --all

npm run db:migrate
npm run db:build

npm run build
npm start

npm test
npm run eval
```

전체 data pipeline이 script 이름만으로 이해되게 한다.

---

# 40. Render Deployment

## Build

```bash
npm install
npm run build
npm run db:build
```

## Start

```bash
node server/index.js
```

Production build 중:

```text
NO crawling
NO OpenAI enrichment
```

Git에 이미 존재하는:

```text
data/raw
+
data/enriched
+
migrations
```

만 사용해 SQLite 생성.

---

# 41. Git Policy

Commit:

- `data/raw/*.json`
- `data/enriched/*.json`
- `db/migrations/*.sql`
- `eval/cases.json`

Ignore:

- `.env`
- `data/products.db`
- `node_modules/`
- client build output

평가자가 repository에서:

```text
실제 크롤링 데이터
→ AI 보강 데이터
→ DB schema
→ Agent
```

를 따라갈 수 있게 한다.

---

# 42. Testing

자동 테스트는 deterministic 영역에 집중한다.

## Unit

### normalize

- price parsing
- URL normalization
- nullable handling
- sizeGuideText extraction / nullable fallback
- review normalization

### DB

- migration
- import
- UPSERT
- product/review 관계

### Search

- category filter
- min/max price
- conditional size/color filtering
- sizeGuideText pass-through
- null review behavior
- retrieval score

### Agent integration

실제 OpenAI API 대신 mock:

- function call parsing
- tool executor
- structured output parsing
- response types
- factual data merge
- comparison productId validation
- recommendation 1개일 때 빈 comparison

---

## 수동 테스트

실제 AI 품질은 수동 evaluation.

최소:

```text
1. 10만원 이하 출근용 검정 바지
2. 모임에 입을 옷인데 너무 화려하지 않은 것
3. 사이즈가 작다는 후기가 적은 바지
4. 소재가 괜찮다는 평가가 있는 상의
5. 사진과 실제 색상이 비슷하다는 후기가 있는 옷
6. 평소 66인데 허벅지가 너무 붙지 않는 바지
7. 사이즈표나 사이즈 후기가 없는 상품
8. 후보 2~3개의 핵심 차이 자동 비교
9. 조건이 거의 없는 "예쁜 옷 추천해줘"
10. 조건이 너무 좁아 결과가 없는 query
```

---

# 43. Evaluation Dataset

`eval/cases.json`

```json
[
  {
    "query": "10만원 이하 출근용 검정 바지",
    "must": {
      "category": "pants",
      "maxPrice": 100000
    }
  },
  {
    "query": "친구 모임에 입을 옷인데 너무 꾸민 느낌은 싫어",
    "semanticExpectations": [
      "casual",
      "event"
    ]
  },
  {
    "query": "사진이랑 실제 색상이 비슷하다는 후기가 있는 옷",
    "reviewExpectation": {
      "appearanceMatch": "similar"
    }
  },
  {
    "query": "평소 66인데 허벅지가 너무 붙지 않는 출근용 바지",
    "semanticExpectations": [
      "office",
      "relaxed"
    ],
    "reviewExpectation": {
      "sizeFit": "not_unknown_when_supported"
    }
  }
]
```

목적:

- prompt 수정 전후 비교
- retrieval weight 조정
- 추천 품질 회귀 방지
- README에서 검증 방식 설명

---

# 44. Logging

별도 logger 미사용.

Structured `console.log`.

```text
[agent] request_received
[agent] previous_response_id=...
[tool] search_products
[search] hard_filter_matches=61
[search] retrieval_candidates=15
[agent] tool_round=1
[agent] recommendation_count=3
```

금지:

- API key
- 개인정보
- 실제 사용자 query DB 저장
- reviewer 식별정보

---

# 45. 구현 순서

## Phase 0 — Skeleton / Deployment

### 작업

- private GitHub repository
- repo name: `SeongeunKim-YYYYMMDD`
- Node 24
- root package
- Vite/React
- Express
- Tailwind
- Render 연결

### DoD

```text
외부 URL 접속 성공
GET /api/health → 200
```

---

## Phase 1 — Cafe24 Product Crawler

### 작업

1. Cafe24 쇼핑몰 1개 선정
2. 카테고리 product URL 10개 discovery
3. 상세상품 parsing
4. 판매 사이즈와 nullable `sizeGuideText` parsing
5. `data/raw` 저장
6. fallback 구조
7. shop config
8. 두 번째 쇼핑몰 연결
9. 최대 50개로 확대

### DoD

```text
여러 Cafe24 쇼핑몰의 실제 상품이
판매 사이즈와 nullable sizeGuideText를 포함해
data/raw/*.json에 존재
```

---

## Phase 2 — Review Crawling

### 작업

1. 첫 쇼핑몰 리뷰 데이터 구조 조사
2. HTML/embedded JSON/API 중 가장 단순한 방법 선택
3. 상품당 10~20개 리뷰
4. option metadata
5. 공개된 reviewer metadata가 있으면 수집
6. raw JSON에 포함

### DoD

```text
최소 일부 상품에 실제 text reviews가 존재
```

### Fallback

review scraping 문제로 전체 프로젝트가 멈추면:

```text
리뷰 수집 가능한 상품/쇼핑몰만 review 지원
+
review가 없는 상품은 정상 검색 가능
```

으로 진행한다.

---

## Phase 3 — SQLite

### 작업

1. `001_initial.sql`
2. migration runner
3. DB build
4. raw product/review import
5. repository
6. UPSERT tests

### DoD

- DB 정상 생성
- products count 정상
- reviews relation 정상

---

## Phase 4 — Offline Enrichment

### 작업

1. controlled vocabulary
2. product summary prompt
3. review aggregation prompt
4. Structured Output
5. 5개 product 테스트
6. 결과 확인
7. 전체 실행
8. enriched JSON commit
9. DB rebuild

### DoD

최소 일부 상품에:

```text
product summary
+
style/occasion/fit
+
review appearance/size/material summary
```

존재.

---

## Phase 5 — Search

### 작업

1. tool input schema
2. hard filters
3. retrieval scoring
4. review signals
5. compact DTO
6. sizeGuideText pass-through
7. unit tests
8. eval cases

### DoD

다양한 자연어 조건에서 관련 후보 최대 15개를 안정적으로 반환.

---

## Phase 6 — Agent

### 작업

1. Agent instructions
2. `search_products`
3. tool loop
4. `previous_response_id`
5. clarification
6. final ranking
7. Structured Output
8. 자동 comparison summary
9. no_result
10. factual data merge
11. hallucination validation

### DoD

```text
natural language
→ Agent
→ search_products
→ SQLite
→ candidates
→ GPT ranking
→ actual products 1~3
```

완료.

---

## Phase 7 — Frontend

### 작업

1. Search Hero
2. optional condition selectors
3. reducer
4. loading states
5. clarification
6. result grid
7. Product Card
8. condition match section
9. size / fit evidence section
10. automatic comparison summary
11. real review section
12. risk section
13. refinement
14. reset
15. mobile responsive

### DoD

배포 URL에서 end-to-end shopping flow 가능.

---

## Phase 8 — Final Validation / Polish

새 기능 개발을 최소화한다.

- 실제 상품 링크 전수 확인
- broken image
- mobile
- loading/error
- hallucination
- 7개 이상 eval query
- README
- 배포 재검증
- `.env` 검사
- Git status
- commit history
- 최종 collaborator 초대

---

# 46. 최종 Definition of Done

> **배포된 웹에서 35~50세 여성 사용자가 원하는 의류 조건을 입력하면, GPT Agent가 `search_products`를 호출하고 여러 Cafe24 쇼핑몰에서 크롤링한 실제 상품 중 후보를 찾아 최대 3개를 추천한다. 결과에는 조건 적합 이유가 가장 먼저 표시되고, 판매 사이즈와 확보 가능한 사이즈표, 사진/실물·사이즈/핏·소재/품질 관련 실제 후기, 구매 전 확인할 리스크가 제공된다. 추천이 2개 이상이면 후보 간 핵심 차이도 자동 비교한다.**

반드시:

- 실제 크롤링 상품만 표시
- 실제 상품 URL 사용
- 실제 가격/이미지 사용
- LLM이 상품 factual data 생성하지 않음
- 리뷰가 없으면 추론하지 않음
- 사이즈표가 없으면 생성하지 않고 정보 부족 표시
- 추천이 2개 이상이면 자동 비교 요약 제공
- 최대 3개
- 후속 conversation 가능
- 새로 찾기 가능
- 외부 배포
- 모바일 정상
- OpenAI key 미노출

---

# 47. README 구조

```text
# Service Name

## Live Demo

## Problem
- 고객 문제
- 왜 의류인가

## Survey
- 21명 유효 응답의 탐색적 설문
- 표본 한계
- 주요 결과
- 결과가 MVP에 미친 영향

## Solution / MVP

## User Flow

## Architecture

## Crawling
- 왜 Cafe24인가
- HTTP-first
- Playwright fallback
- 리뷰 수집

## Data Pipeline
- Raw JSON
- Enrichment
- SQLite

## AI Agent
- search_products
- required/preferred
- max 15
- LLM final ranking
- review evidence
- automatic comparison summary

## Trust / Hallucination Prevention
- DB = 사실
- LLM = 해석

## Key Design Decisions
- SQLite 선택
- vector search를 사용하지 않은 이유
- streaming을 사용하지 않은 이유
- tool 하나만 사용한 이유
- Cafe24로 범위를 제한한 이유

## Testing / Evaluation

## Difficulties & Solutions

## Limitations

## What I Would Improve Next

## Setup
```

---

# 48. Commit Strategy

```text
chore: initialize React and Express application

feat: add Cafe24 product crawler

feat: crawl product reviews from Cafe24 shops

feat: normalize crawled product and review data

feat: add SQLite schema and migrations

feat: enrich product and review metadata with OpenAI

feat: implement product search and retrieval

feat: implement conversational shopping agent

feat: add evidence-based recommendation cards

feat: refine recommendation flow from survey findings

test: add product search and agent evaluation cases

docs: document problem solving and architecture
```

커밋 수보다:

> **어떤 순서로 문제를 해결했는지**

가 보이게 한다.

---

# 49. 최종 설계 원칙

## Product

```text
조건에 맞는 상품 탐색
>
후보 비교
>
사진·실물 / 사이즈·핏 / 소재·품질 위험 검증
```

## Crawler

```text
Cafe24 여러 쇼핑몰
+
공통 parser
+
shop config
+
HTTP-first
+
Playwright fallback
```

## Data

```text
Raw JSON = 원본
Enriched JSON = AI-derived
SQLite = Runtime
```

## Retrieval

```text
Hard Constraint = SQL

Soft Candidate Retrieval
= lightweight deterministic score

Final Ranking
= GPT-5.6 Sol
```

## AI

```text
Offline 반복 분석
= GPT-5.6 Luna

Runtime 복합 판단
= GPT-5.6 Sol
```

## Reviews

```text
리뷰 = recommendation의 본체가 아님

리뷰 = 상품 상세정보와
실제 구매 결과 사이의 gap을 줄이는 evidence
```

## Trust

```text
LLM = 해석 / 비교 / 요약

Crawler + DB = 사실
```

---

# 50. 확정 의사결정 로그

| # | 최종 결정 |
|---:|---|
| 1 | Node.js 24 LTS |
| 2 | root package.json 하나 |
| 3 | 한 source부터 시작, 확장 가능 crawler |
| 4 | fetch → Cheerio → internal API → Playwright |
| 5 | 상세상품 + 리뷰 MVP 포함 |
| 6 | 여러 Cafe24 쇼핑몰 + Cafe24 crawler |
| 7 | 상세 + reviews nullable schema |
| 8 | Raw JSON + SQLite |
| 9 | OpenAI offline enrichment |
| 10 | function calling 기반 search_products |
| 11 | shops/products/reviews/enrichments 정규화 |
| 12 | 직접 SQL migration |
| 13 | Raw JSON source of truth |
| 14 | AI enrichment 별도 |
| 15 | shop_id + source_product_id UPSERT |
| 16 | Agent `gpt-5.6-sol`, Enrichment `gpt-5.6-luna` |
| 17 | Agent low / Enrichment none |
| 18 | previous_response_id |
| 19 | 검색 우선, 필요한 경우만 clarification |
| 20 | search_products tool 하나 |
| 21 | required / preferred 분리 |
| 22 | SQLite hard filtering |
| 23 | 최종 ranking은 LLM |
| 24 | Agent 후보 최대 15개 |
| 25 | controlled vocabulary + extraTags |
| 26 | 15개 초과 시 lightweight retrieval |
| 27 | category/price hard, color/size 조건부 hard |
| 28 | compact Product DTO |
| 29 | Structured Output + productId |
| 30 | 최대 3개 추천 |
| 31 | 원문 query + structured filter |
| 32 | config 기반 retrieval score |
| 33 | 작은 vocabulary |
| 34 | raw description + offline summary |
| 35 | raw reviews + offline aggregation |
| 36 | LLM interpretation / DB factual merge |
| 37 | 추천 evidence 포함 |
| 38 | POST /api/chat + GET /api/health |
| 39 | max 3 tool rounds |
| 40 | non-streaming |
| 41 | clarification / recommendation / no_result |
| 42 | React useReducer |
| 43 | Tailwind |
| 44 | Search 중심 + conversational refinement |
| 45 | Desktop 3-column / Mobile vertical |
| 46 | session 유지 + 새로 찾기 |
| 47 | Render 단일 Web Service |
| 48 | Render build에서 SQLite rebuild |
| 49 | enrichment JSON 보존 |
| 50 | shop별 crawler CLI |
| 51 | 사이트당 최대 50개 |
| 52 | 핵심 unit test + 수동 E2E |
| 53 | AI 자동 테스트 mock + 실제 AI 수동 평가 |
| 54 | structured console logging |
| 55 | eval cases |
| 56 | 실제 사용자 대화 저장 안 함 |
| 57 | secret만 env, 나머지 config |
| 58 | raw/enriched/migrations commit, DB ignore |
| 59 | Problem-solving 중심 README |
| 60 | 의미 있는 개발 단계 단위 commit |
| 61 | domain별 repository 구조 |
| 62 | JS Cafe24 shop config |
| 63 | crawler pure function 중심 |
| 64 | 직접 migration runner |
| 65 | 관심사별 config |
| 66 | data pipeline npm scripts |
| 67 | Render build phase DB 생성 |
| 68 | React shopping feature 구조 |
| 69 | 설문 기준 전체 22명, 35~50세 유효 응답 21명 |
| 70 | 사이즈·핏을 사진·실물, 소재·품질과 같은 핵심 구매위험 축으로 취급 |
| 71 | nullable sizeGuideText를 crawler/DB의 factual data로 저장 |
| 72 | 키·체형 사용자 프로필과 확정적 개인 사이즈 추천은 MVP에서 제외 |
| 73 | 별도 compare_products tool 없이 최종 2~3개 후보 자동 비교 |
| 74 | 선택형 비교 UI는 제외하고 기존 검색 결과에서 comparison summary 제공 |

---

# 51. 이 계획 이후 변경 기준

이 문서를 구현 기준으로 고정한다.

개발 도중 변경 가능한 것:

- crawler selector
- 실제 선택 쇼핑몰
- retrieval weight
- controlled vocabulary 일부
- prompt wording
- CSS/UI 세부 디자인
- 리뷰 크롤링 방법
- model reasoning effort
- 최대 상품 수

다음 핵심 구조는 특별한 blocker가 없는 이상 변경하지 않는다.

```text
Cafe24 multi-shop crawling
→ Raw JSON
→ Offline enrichment
→ SQLite
→ search_products
→ Top 15
→ GPT final ranking
→ 1~3 actual product recommendations
→ review evidence / risk
```

기능을 추가할 때는 항상 다음 질문으로 판단한다.

> **이 기능이 사용자가 현재 직접 수행하는 의류 탐색·비교·구매 판단 작업을 실제로 하나 이상 없애는가?**

아니라면 이번 과제에서는 구현하지 않는다.
