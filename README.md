# Levit Problem Solver — AI Shopping Agent

여러 쇼핑몰을 오가며 상품 조건과 구매후기를 따로 비교해야 하는 문제를 줄이기 위해 만든 evidence-based 의류 탐색 MVP입니다. 자연어로 조건을 말하면 실제 수집 상품 중 최대 3개를 찾고, 조건 적합 이유·판매 사이즈·후기 신호·구매 전 확인사항·후보 간 차이를 함께 보여줍니다.

## Live Demo

[levit-problem-solver.onrender.com](https://levit-problem-solver.onrender.com)

Render free instance는 비활성 상태에서 다시 시작할 때 첫 요청이 늦어질 수 있습니다.

## Problem

의류 구매자는 가격·색상·사이즈 같은 조건으로 후보를 먼저 좁힌 뒤에도 사진과 실물의 차이, 실제 착용 사이즈와 핏, 소재 품질을 여러 후기에서 직접 확인해야 합니다. 검색 결과를 단순히 늘리기보다 조건에 맞는 후보를 줄이고 판단 근거와 불확실성을 함께 제공하는 것이 이 프로젝트의 목표입니다.

## Survey

2026-09-01에 수집한 22명 중 목표 연령대인 35~50세 21명의 응답을 탐색적으로 분석했습니다. 표본이 작고 편의 표집이므로 시장 전체를 대표하는 통계로 사용하지 않습니다.

- 조건에 맞는 상품만 선별해 달라는 응답: 12/21 (57%)
- 사이즈가 맞지 않았던 구매 실패 경험: 12/21 (57%)
- 생각한 핏과 달랐던 구매 실패 경험: 12/21 (57%)
- 사이즈 결정이 어렵다는 응답: 8/21 (38%)
- 비슷한 상품 간 차이 비교 요구: 8/21 (38%)

이 결과를 반영해 조건 기반 탐색을 제품의 본체로, 실제 구매후기를 추천을 검증하는 evidence layer로 설계했습니다. 사이즈를 확정적으로 추천하는 대신 판매 옵션·치수표·review signal과 정보 부족을 함께 보여줍니다.

## Solution / MVP

- 그레이시크·아이팜므의 Cafe24 바지 상품 각 20개, 총 40개
- 실제 텍스트 리뷰 406개
- 가격·category는 SQLite hard filter, 색상·사이즈는 확인 가능한 값이 불일치할 때 제외
- deterministic soft retrieval로 최대 15개 candidate 구성
- GPT-5.6 Sol이 candidate 안에서 최대 3개를 최종 비교
- 서버가 상품 ID와 evidence를 DB에 다시 대조한 뒤 factual field를 병합
- recommendation·clarification·no-result와 `responseId` 기반 후속 대화

## User Flow

1. 원하는 바지를 자연어로 입력합니다.
2. 필요하면 가격 상한과 사이즈 조건을 더합니다.
3. AI 답변과 최대 3개 상품 요약을 비교합니다.
4. 상품을 펼쳐 사이즈표·후기 신호·근거·위험을 확인합니다.
5. 후속 질문으로 기존 후보를 다시 좁히거나 새로 찾습니다.
6. 명시적인 링크를 통해 원본 쇼핑몰 상품 페이지로 이동합니다.

## Architecture

```text
Cafe24 상품/리뷰
  → HTTP crawler + shop config
  → data/raw JSON (source of truth)
  → GPT-5.6 Luna offline enrichment
  → data/enriched JSON
  → deterministic SQLite build

React UI
  → POST /api/chat
  → GPT-5.6 Sol + search_products tool
  → SQLite hard filter + lightweight retrieval (max 15)
  → structured recommendation
  → server factual validation + DB field merge
  → max 3 product cards
```

Express가 API와 production React build를 하나의 Render Web Service에서 제공합니다.

## Crawling

대상 두 쇼핑몰이 공통 Cafe24 구조를 사용해 하나의 parser와 소규모 shop override로 재사용성을 확보했습니다. 서버 부하와 browser automation 복잡도를 줄이기 위해 HTTP-first로 구현했습니다.

- 그레이시크: 상품 상세 HTML의 공개 리뷰
- 아이팜므: Crema widget이 사용하는 공개 JSON endpoint
- 요청 간격과 상품당 최근 리뷰 최대 20개 적용
- 작성자 이름·ID 등 reviewer 식별정보 미저장
- Playwright는 fallback 후보로 검토했으나 두 source 모두 HTTP로 확보되어 도입하지 않음

## Data Pipeline

- `data/raw/*.json`: 크롤링한 상품·리뷰 원본이며 데이터의 source of truth
- `data/enriched/products.json`: style·occasion·fit·season과 구조화된 review summary
- `data/products.db`: build 때 raw/enriched JSON으로 재생성하는 runtime SQLite, Git 제외
- `db/migrations/001_initial.sql`: table·foreign key·migration 정의

`npm run db:build`는 stale row와 중복 review를 남기지 않고 동일 입력에서 동일 DB를 재현합니다.

## AI Agent

Agent가 사용할 수 있는 tool은 `search_products` 하나입니다. 자연어를 required hard constraint와 preferred signal로 나누고, SQL과 deterministic retrieval이 만든 최대 15개 candidate만 model에 전달합니다. model은 candidate를 비교하고 이유·evidence·장점·위험·comparison을 strict structured output으로 반환합니다.

상품이 없으면 조건 완화를 제안하고, 요청이 모호하면 필요한 조건을 질문합니다. 후속 질문은 OpenAI Responses API의 previous response state를 사용하지만, 실제 상품 데이터는 매 요청에서 다시 local search와 DB validation을 거칩니다.

## Trust / Hallucination Prevention

- DB가 이름·가격·이미지·상품 URL·색상·사이즈·치수표·리뷰의 사실 원천입니다.
- LLM은 조건 해석·후보 ranking·요약만 담당합니다.
- candidate 밖의 상품 ID나 DB와 맞지 않는 evidence는 서버가 응답 전에 거부합니다.
- `unknown` review signal은 추천 근거로 사용할 수 없고 정보 부족 또는 concern으로만 표현합니다.
- 사이즈표가 없으면 만들지 않고, `66` 같은 체형 표기를 판매 옵션과 임의 대응하지 않습니다.
- raw query, IP, reviewer 식별정보와 API key를 repository나 영구 application log에 저장하지 않습니다.

## Key Design Decisions

- SQLite: 40개 MVP catalog에서 운영 부담 없이 SQL hard filter와 재현 가능한 build를 제공
- vector search 미사용: 현재 controlled tag와 소규모 candidate에는 deterministic score가 더 설명 가능하고 충분함
- streaming 미사용: strict JSON 전체를 검증하고 factual field를 병합한 뒤 한 번에 전달하는 신뢰성을 우선
- tool 하나: 탐색 경로와 validation surface를 작게 유지
- Cafe24 한정: 짧은 일정에서 여러 쇼핑몰 parser 재사용성을 실제로 검증하기 위한 의도적 범위 제한
- unknown-aware filter: factual 색상·사이즈가 있을 때만 불일치를 제외해 missing data 때문에 recall을 과도하게 잃지 않음

세부 결정과 이력은 [`docs/IMPLEMENTATION_STATUS.md`](docs/IMPLEMENTATION_STATUS.md)에 기록되어 있습니다.

## Testing / Evaluation

```bash
npm test
npm run build
```

- parser, PII 제거, raw/enriched schema, deterministic DB build, repository와 search
- strict Agent contract, factual merge, hallucinated evidence·candidate 거부
- rate limit, API error, frontend reducer·API·query 조합
- 2026-09-03 전체 자동 테스트 71/71 통과
- Render 실제 Agent eval 8/8 자동·수동 판정 통과

case별 상품 ID와 판정은 [`docs/EVAL_REPORT.md`](docs/EVAL_REPORT.md)에 있습니다. 실제 live eval은 API 비용과 공개 rate limit을 사용하므로 명시적인 승인 없이 실행하지 않습니다.

## Difficulties & Solutions

- 쇼핑몰별 HTML 차이: 공통 Cafe24 parser와 selector/config override로 분리했습니다.
- 동적 리뷰 widget: browser 자동화 대신 widget의 공개 JSON 요청을 분석해 HTTP 수집을 유지했습니다.
- 후기의 상반된 의견: 하나의 축에서 명시적 충돌이 있으면 `mixed`로 보수적으로 집계했습니다.
- 색상·사이즈 missing data: 없는 값을 불일치로 단정하지 않고 unknown candidate로 유지했습니다.
- LLM factual drift: strict schema만으로 끝내지 않고 latest search candidate와 DB를 서버에서 재검증했습니다.
- 공개 API 비용 위험: IP당 10분 10회와 service 전체 시간당 30회 제한, message 크기 제한을 적용했습니다.

## Limitations

- catalog가 여성용 바지 40개와 두 Cafe24 쇼핑몰에 한정됩니다.
- 가격과 판매 가능 여부는 마지막 crawl 시점 기준이며 실시간 재고를 보장하지 않습니다.
- `66`과 같은 체형 표기에서 판매 사이즈를 확정하는 profile 기반 추천은 지원하지 않습니다.
- in-memory rate limit은 단일 무료 instance용 MVP 보호이며 재시작 시 초기화됩니다.
- LLM 응답은 비결정적이며 live evaluation 재실행에는 비용이 듭니다.

## What I Would Improve Next

- 상의·원피스 등 category와 Cafe24 쇼핑몰 확대
- 주기적 crawl과 가격·품절 상태 freshness 표시
- 사용자 동의를 전제로 한 체형/선호 profile과 더 정교한 size guidance
- offline golden set과 반복 eval로 model 변화 감시
- 다중 instance에서도 공유되는 persistent rate limiting
- 접근성·저속 네트워크·다양한 모바일 실기기 검증 확대

## Setup

요구 환경은 Node.js 24입니다.

```bash
npm ci
cp .env.example .env
# .env에 OPENAI_API_KEY 입력
npm run db:build
npm run dev
```

- Frontend 개발 서버: `http://localhost:5173`
- API/production 서버: `http://localhost:3000`
- Health check: `http://localhost:3000/api/health`

Production build:

```bash
npm run build
npm start
```

크롤링과 enrichment는 외부 서비스 요청 및 OpenAI 비용을 사용합니다. 실행 전 각 script와 대상 범위를 확인하세요.
