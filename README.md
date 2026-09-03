# Levit Problem Solver — AI Shopping Agent

실제 상품 정보와 구매후기를 근거로 조건에 맞는 옷을 찾아주는 여성 의류 탐색 Agent입니다. 자연어로 조건을 말하면 실제 수집 상품 중 최대 3개를 찾고, 조건 적합 이유·판매 사이즈·검증된 실측표·후기 신호·구매 전 확인사항을 한 흐름에서 비교합니다.

## Live Demo

[levit-problem-solver.onrender.com](https://levit-problem-solver.onrender.com)

Render free instance는 비활성 상태에서 다시 시작할 때 첫 요청이 늦어질 수 있습니다.

## Project Status

핵심 MVP 구현과 Render 배포를 완료했습니다. 현재 10개 쇼핑몰·5개 category의 실제 상품 520개와 후기 3,798개를 검색하며, 전체 자동 테스트 118개와 확장 catalog 자연스러움 평가 20개를 통과한 상태입니다.

- 완료: crawling, review 수집, offline enrichment, SQLite build/search, Agent, 반응형 frontend, Render 배포
- 완료: factual validation, rate limit, 대화형 오류 recovery, 현재 세션의 이전 대화 다시 보기
- 남은 범위: 다양한 모바일 실기기에서의 세부 UI·접근성·저속 네트워크 수동 검증

## Problem

의류 구매자는 가격·색상·사이즈 같은 조건으로 후보를 먼저 좁힌 뒤에도 사진과 실물의 차이, 실제 착용 사이즈와 핏, 소재 품질을 여러 후기에서 직접 확인해야 합니다. 검색 결과를 단순히 늘리기보다 조건에 맞는 후보를 줄이고 판단 근거와 불확실성을 함께 제공하는 것이 이 프로젝트의 목표입니다.

## Survey

2026-09-01에 수집한 22명 중 목표 연령대인 35~50세 21명의 응답을 탐색적으로 분석했습니다. 표본이 작고 편의 표집이므로 시장 전체를 대표하는 통계로 사용하지 않습니다.

- 조건에 맞는 상품만 선별해 달라는 응답: 12/21 (57%)
- 사이즈가 맞지 않았던 구매 실패 경험: 12/21 (57%)
- 생각한 핏과 달랐던 구매 실패 경험: 12/21 (57%)
- 사이즈 결정이 어렵다는 응답: 8/21 (38%)
- 비슷한 상품 간 차이 비교 요구: 8/21 (38%)

이 결과를 반영해 조건에 맞는 상품을 먼저 찾고, 실제 구매후기는 추천 결과를 확인하는 근거로 활용했습니다. 사이즈를 확정적으로 추천하는 대신 판매 옵션·실측 사이즈표·후기에서 확인된 신호와 정보 부족을 함께 보여줍니다.

## Solution / MVP

- 10개 Cafe24 쇼핑몰의 여성 의류 5개 category(바지·상의·원피스·스커트·아우터) 상품 520개
- 실제 텍스트 리뷰 3,798개
- deterministic parser가 검증한 실측 사이즈표 60개
- 가격·category는 SQLite hard filter, 색상·사이즈는 확인 가능한 값이 불일치할 때 제외
- deterministic soft retrieval로 최대 15개 candidate 구성
- GPT-5.6 Sol이 candidate 안에서 최대 3개를 최종 비교
- 서버가 상품 ID와 evidence를 DB에 다시 대조한 뒤 factual field를 병합
- recommendation·clarification·no-result와 `responseId` 기반 후속 대화
- 추천 성공·추가 질문·검색 결과 없음까지 시간순으로 다시 펼쳐보는 현재 세션 대화 이력

## User Flow

1. 원하는 옷을 자연어로 입력합니다.
2. 검색창에 focus하면 나타나는 category·가격 상한·사이즈 조건을 필요할 때만 더합니다.
3. AI 답변과 최대 3개 상품 요약을 비교합니다.
4. 상품을 펼쳐 사이즈표·후기 신호·근거·위험을 확인합니다.
5. 후속 질문으로 기존 후보를 다시 좁히거나 새로 찾습니다.
6. 이전 질문과 AI 답변을 펼쳐 다시 비교하거나 원본 쇼핑몰 상품 페이지로 이동합니다.

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
  → 원문 기반 deterministic 가격 의도 보정
  → SQLite hard filter + lightweight retrieval (max 15)
  → structured recommendation
  → server factual validation + DB field merge
  → max 3 product cards
```

Express가 API와 production React build를 하나의 Render Web Service에서 제공합니다.

## Crawling

그레이시크·아이팜므·리리앤코·안나앤플러스·시크라인·핫핑·커먼유니크·도드리·메이빈스·배드다이어리가 공통 Cafe24 구조를 사용해 하나의 parser와 소규모 shop config override로 재사용성을 확보했습니다. category-aware 상품 discovery로 5개 category를 수집하며, 서버 부하와 browser automation 복잡도를 줄이기 위해 HTTP-first로 구현했습니다.

- 상품 상세 HTML의 공개 리뷰: 범용 Cafe24 static review adapter
- Crema review widget 사용 쇼핑몰: widget이 호출하는 공개 JSON endpoint
- 요청 간격과 상품당 최근 리뷰 최대 20개 적용
- 작성자 이름·ID 등 reviewer 식별정보 미저장
- Playwright는 fallback 후보로 검토했으나 두 source 모두 HTTP로 확보되어 도입하지 않음

## Data Pipeline

- `data/raw/*.json`: 크롤링한 상품·리뷰 원본이며 데이터의 source of truth
- `data/enriched/products.json`: style·occasion·fit·season과 구조화된 review summary
- `data/products.db`: build 때 raw/enriched JSON으로 재생성하는 runtime SQLite, Git 제외
- `db/migrations/001_initial.sql`: table·foreign key·migration 정의

`npm run db:build`는 stale row와 중복 review를 남기지 않고 동일 입력에서 동일 DB를 재현합니다. Render도 배포 build 과정에서 이 DB를 다시 생성합니다.

## AI Agent

Agent가 사용할 수 있는 tool은 `search_products` 하나입니다. 자연어를 required hard constraint와 preferred signal로 나누고, SQL과 deterministic retrieval이 만든 최대 15개 candidate만 model에 전달합니다. model은 candidate를 비교하고 이유·evidence·장점·위험·comparison을 strict structured output으로 반환합니다.

가격 표현은 원문을 서버에서 한 번 더 해석합니다. 예를 들어 단독 목표 `8만원`은 7만~9만원, `8만원대`는 80,000~89,999원으로 검색하고, `8만원 이하` 같은 명시 조건은 그대로 유지합니다. 일반적인 흰색 선호에서 정확한 후보가 부족할 때만 아이보리·크림까지 한 번 확장하며, 이 사실을 답변에 명시합니다.

상품이 없으면 조건 완화를 제안하고, 요청이 모호하면 필요한 조건을 질문합니다. Agent 응답의 형식이나 factual validation이 실패하면 일반 오류 화면 대신 문맥에 맞는 추가 질문으로 복구합니다. 후속 질문은 OpenAI Responses API의 previous response state를 사용하지만, 실제 상품 데이터는 매 요청에서 다시 local search와 DB validation을 거칩니다.

## Trust / Hallucination Prevention

- DB가 이름·가격·이미지·상품 URL·색상·사이즈·치수표·리뷰의 사실 원천입니다.
- LLM은 조건 해석·후보 ranking·요약만 담당합니다.
- candidate 밖의 상품 ID나 DB와 맞지 않는 evidence는 서버가 응답 전에 거부합니다.
- `unknown` review signal은 추천 근거로 사용할 수 없고 정보 부족 또는 concern으로만 표현합니다.
- strict parser가 검증한 실측 사이즈표만 HTML table로 보여주며, 검증하지 못한 값은 노출하지 않습니다.
- 사이즈표가 없으면 만들지 않고, `66` 같은 체형 표기를 판매 옵션과 임의 대응하지 않습니다.
- 흰색의 아이보리·크림 확장 외에는 임의의 유사 색상 관계를 만들지 않습니다.
- raw query, IP, reviewer 식별정보와 API key를 repository나 영구 application log에 저장하지 않습니다.

## Key Design Decisions

- SQLite: 520개 MVP catalog에서 운영 부담 없이 SQL hard filter와 재현 가능한 build를 제공
- vector search 미사용: 현재 controlled tag와 소규모 candidate에는 deterministic score가 더 설명 가능하고 충분함
- streaming 미사용: strict JSON 전체를 검증하고 factual field를 병합한 뒤 한 번에 전달하는 신뢰성을 우선
- tool 하나: 탐색 경로와 validation surface를 작게 유지
- Cafe24 한정: 짧은 일정에서 여러 쇼핑몰 parser 재사용성을 실제로 검증하기 위한 의도적 범위 제한
- unknown-aware filter: factual 색상·사이즈가 있을 때만 불일치를 제외해 missing data 때문에 recall을 과도하게 잃지 않음
- 원문 가격 normalization: model이 가격 표현을 다르게 해석해도 명시·근사 가격의 검색 경계를 서버에서 일관되게 보장
- client-memory 대화 이력: 별도 사용자 DB 없이 현재 세션의 질문과 모든 응답 유형을 다시 확인

세부 결정과 이력은 [`docs/IMPLEMENTATION_STATUS.md`](docs/IMPLEMENTATION_STATUS.md)에 기록되어 있습니다.

## Testing / Evaluation

```bash
npm test
npm run build
```

- parser, PII 제거, raw/enriched schema, deterministic DB build, repository와 search
- strict Agent contract, factual merge, hallucinated evidence·candidate 거부
- 가격 의도·controlled color relaxation·실측 사이즈표 parser
- rate limit, API error recovery, frontend reducer·API·query·대화 이력
- 2026-09-03 전체 자동 테스트 118/118 통과
- Render 실제 Agent eval 8/8 자동·수동 판정 통과 (catalog 확장 전 2 shops·40 products 배포 기준)
- 확장된 10 shops·520 products catalog 대상 자연스러움 eval 20/20 통과

case별 상품 ID와 판정은 [`docs/EVAL_REPORT.md`](docs/EVAL_REPORT.md)와 [`docs/NATURALNESS_EVAL_REPORT.md`](docs/NATURALNESS_EVAL_REPORT.md)에 있습니다. 실제 live eval은 API 비용과 공개 rate limit을 사용하므로 명시적인 승인 없이 실행하지 않습니다.

## Difficulties & Solutions

- 쇼핑몰별 HTML 차이: 공통 Cafe24 parser와 selector/config override로 분리했습니다.
- 동적 리뷰 widget: browser 자동화 대신 widget의 공개 JSON 요청을 분석해 HTTP 수집을 유지했습니다.
- 후기의 상반된 의견: 하나의 축에서 명시적 충돌이 있으면 `mixed`로 보수적으로 집계했습니다.
- 색상·사이즈 missing data: 없는 값을 불일치로 단정하지 않고 unknown candidate로 유지했습니다.
- 사이즈표 오수집: 상품 설명·변환표·후기처럼 보이는 값을 strict parser로 차단하고 검증된 60개만 구조화했습니다.
- 자연어 가격의 모호함: 단독 목표 가격과 `만원대`·상한·하한을 원문 기반 deterministic rule로 구분했습니다.
- LLM factual drift: strict schema만으로 끝내지 않고 latest search candidate와 DB를 서버에서 재검증했습니다.
- 공개 API 비용 위험: IP당 10분 10회와 service 전체 시간당 30회 제한, message 크기 제한을 적용했습니다.

## Limitations

- catalog가 10개 Cafe24 쇼핑몰의 여성 의류 520개(5개 category)에 한정됩니다.
- 가격과 판매 가능 여부는 마지막 crawl 시점 기준이며 실시간 재고를 보장하지 않습니다.
- 검증된 실측 사이즈표는 520개 중 60개이며, 나머지는 판매 사이즈 옵션만 제공하거나 정보가 없습니다.
- `66`과 같은 체형 표기에서 판매 사이즈를 확정하는 profile 기반 추천은 지원하지 않습니다.
- 화면의 이전 대화 목록은 현재 client memory에만 있어 새로고침이나 `새로 찾기` 후 영구 보관되지 않습니다.
- 자동 유사 색상 완화는 현재 흰색 → 아이보리·크림 관계에만 적용됩니다.
- in-memory rate limit은 단일 무료 instance용 MVP 보호이며 재시작 시 초기화됩니다.
- LLM 응답은 비결정적이며 live evaluation 재실행에는 비용이 듭니다.

## What I Would Improve Next

- Cafe24 외 플랫폼으로 쇼핑몰 확대와 경계 상품의 category 분류 품질 개선
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

## Deployment

[`render.yaml`](render.yaml)은 하나의 Node Web Service를 구성합니다.

- Build: `npm ci && npm run build && npm run db:build`
- Start: `npm start`
- Health check: `/api/health`
- Secret: Render dashboard에 `OPENAI_API_KEY` 등록

`main` push 시 Render 자동 배포가 시작됩니다. 배포 완료 여부는 live URL과 `/api/health`를 각각 확인해야 합니다.
