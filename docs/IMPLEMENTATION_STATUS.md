# 구현 상태 로그

> 기준 계획: `docs/levit_problem_solver_FINAL_PLAN.md`  
> 작업 규칙: `AGENT.md`  
> 마지막 업데이트: 2026-09-03 (KST)
> 현재 단계: Phase 10 — UI/UX Final Polish 진행 중
> 다음 작업: Phase 10 변경 사용자 화면 검증

이 문서는 구현 진행 상태, 검증 결과, 결정 사항과 blocker를 계속 기록하는 단일 상태 로그다. 작업을 시작하거나 완료할 때마다 같은 파일을 갱신한다.

## 운영 규칙

- 모든 작업은 root `AGENT.md`의 협업 및 검증 규칙을 따른다.
- 의미 있는 구현 트레이드오프는 선택지, 영향과 추천안을 제시하고 사용자 결정 후 진행한다.
- 각 Phase 시작 전후에 사용자가 직접 수행할 작업과 수동 검증을 미리 안내한다.
- 사용자 결정을 아래 `결정 로그`에 기록한다.
- 작업을 시작하거나 완료할 때마다 현재 Phase, 체크리스트, 검증 결과, blocker와 다음 작업을 갱신한다.

## 전체 진행 현황

| Phase | 범위 | 상태 |
|---:|---|---|
| 0 | Skeleton / Deployment | 완료 |
| 1 | Cafe24 Product Crawler | 완료 — 쇼핑몰별 20개, 총 40개 |
| 2 | Review Crawling | 완료 — 40개 상품에서 실제 리뷰 406개 수집 |
| 3 | SQLite | 완료 — deterministic rebuild 및 40 products·406 reviews relation 검증 |
| 4 | Offline Enrichment | 완료 — 전체 40개 v2 enrichment·strict signal·DB import 검증 |
| 5 | Search | 완료 — hard filter·retrieval·compact DTO·실제 DB 검증 |
| 6 | Agent | 완료 — 실제 세 응답 분기·Render 전체 경로 검증 통과 |
| 7 | Frontend | 완료 — 사용자 UI 승인·전체 회귀·Render 최종 asset 검증 통과 |
| 8 | Final Validation / Polish | 부분 완료 — 자동 검증 기준선 commit, mobile·세부 UI는 확장 후 보류 |
| 9 | Multi-shop / Multi-category Catalog Expansion | 완료 — 10 shops·5 categories·520 products·자연스러움 eval·optional category UI 검증 |
| 10 | UI/UX Final Polish | 진행 중 — 핵심 차이 코멘트·상품 표시명·상세 이미지 interaction 개선 |

## 결정 로그

| ID | 날짜 (KST) | 주제 | 결정 | 근거 / 영향 |
|---|---|---|---|---|
| DEC-001 | 2026-09-01 | 구현 트레이드오프 처리 방식 | 의미 있는 선택은 구현 전에 사용자에게 확인 | 임의 결정 방지, 선택지·영향·추천안을 함께 제시 |
| DEC-002 | 2026-09-01 | 진행 상태 관리 | `docs/IMPLEMENTATION_STATUS.md`를 매 작업마다 갱신 | 단계, 검증, blocker와 다음 작업의 단일 기록 유지 |
| DEC-003 | 2026-09-01 | 사용자 수동 작업 안내 | 각 Phase 실행 전후에 필요한 사용자 작업을 안내 | 배포·인증·외부 연결 등 사용자 의존 작업을 미리 준비하고 누락 방지 |
| DEC-004 | 2026-09-01 | Phase 0 커밋 구성 | 문서와 구현을 2개 커밋으로 분리 | 문제 정의·운영 규칙과 application skeleton의 변경 이력을 명확히 구분 |
| DEC-005 | 2026-09-01 | Render build의 `NODE_ENV` 처리 | Blueprint에서 `NODE_ENV` 제거, Render runtime 기본값 사용 | build 시 devDependencies를 설치하고 runtime은 Render가 자동으로 production 설정 |
| DEC-006 | 2026-09-01 | 기존 Render Service 환경 정리 | Service에 보존된 `NODE_ENV=production`을 수동 제거 후 재배포 | Blueprint에서 제거한 환경변수는 기존 Service에서 자동 삭제되지 않으므로 A안의 의도와 일치하도록 정리 |
| DEC-007 | 2026-09-01 | Phase 0 완료 로그 push 시점 | Phase 1 첫 커밋에 함께 반영 | 상태 로그만을 위한 불필요한 Render 자동 재배포와 build 사용량 방지 |
| DEC-008 | 2026-09-01 | 이틀 구현 실행 방식 | DoD 우선으로 end-to-end를 먼저 완성한 뒤 데이터 수와 polish 확대 | 쇼핑몰 2개, 각 10개 상품으로 시작하고 리뷰는 최소 1개 몰에서 확보해 일정 위험 통제 |
| DEC-009 | 2026-09-02 | Phase 1 대상 쇼핑몰 선정 방식 | Agent가 공개 접근 가능한 Cafe24 여성 의류몰 후보를 조사하고 사용자 승인 후 크롤링 | 사용자가 직접 후보를 찾는 시간을 줄이면서 크롤링 대상에 대한 최종 통제 유지 |
| DEC-010 | 2026-09-02 | 첫 parser 검증 category | `pants` 10개로 공통 parser를 안정화한 뒤 상의 등 다른 category 추가 | 작은 샘플에서 반복 패턴을 확보해 parser 오류와 정상 nullable을 구분하고, 상의 구매 비율은 이후 데이터 확장에서 반영 |
| DEC-011 | 2026-09-02 | Phase 1 대상 쇼핑몰 | 그레이시크와 아이팜므를 선정하고 쇼핑몰별 바지 상품 10개부터 수집 | 두 곳 모두 공개 접근 가능한 Cafe24이며, 그레이시크는 정적 HTML 리뷰 확보가 가능하고 아이팜므는 명시적인 `PANTS` 카테고리를 제공 |
| DEC-012 | 2026-09-02 | 추가 설문 반영 범위 | 유효 응답 21명으로 통계를 갱신하고 사이즈·핏 근거와 자동 상품 비교를 MVP에 강화하되 사용자 프로필·확정적 사이즈 추천·선택형 비교 화면은 제외 | 조건 기반 탐색은 여전히 1위지만 사이즈 결정 8/21, 사이즈·핏 구매 실패 각각 12/21, 상품 비교 요구 8/21로 중요도가 상승했으며 2일 MVP 범위는 유지해야 함 |
| DEC-013 | 2026-09-02 | HTML parser dependency | production dependency로 `cheerio` 사용 | 정규식 기반 분석보다 Cafe24 DOM 변화에 견고하고 공통 parser·selector override·fixture 테스트 구현에 적합 |
| DEC-014 | 2026-09-02 | Phase 1 초기 상품 수 확대 | 그레이시크·아이팜므의 바지 상품을 각각 10개에서 20개로 확대 | 두 쇼핑몰 모두 후보가 충분하고, 상의 확장 전에 더 다양한 가격·옵션·치수표 구조로 공통 parser를 검증 |
| DEC-015 | 2026-09-02 | Phase 2 리뷰 수집 범위 | 그레이시크와 아이팜므 모두 20개 상품에서 상품당 최근 리뷰 최대 20개 수집 | 최종 제품의 여러 쇼핑몰 비교에서 리뷰 evidence 편중을 줄이고, 아이팜므 Crema 공개 API를 우선 조사하되 Playwright가 필요하면 도입 전에 다시 결정 |
| DEC-016 | 2026-09-02 | Phase 3 DB 동기화 방식 | `data/products.db`를 매 build마다 새로 만들고 raw JSON 전체를 import | raw JSON을 source of truth로 유지하고 stale 상품·중복 리뷰를 방지한다. runtime DB 변경 보존과 review row ID 안정성은 MVP 범위에서 필요하지 않음 |
| DEC-017 | 2026-09-02 | Phase 4 OpenAI API client | 공식 `openai` npm SDK 사용 | Responses API의 Structured Output, incomplete/refusal/error 처리를 공식 interface에 맞추고 API 변경 대응 부담을 줄임 |
| DEC-018 | 2026-09-02 | Phase 4 API 호출 단위 | 상품 이해와 리뷰 집계를 상품당 1회 통합 호출 | 표본 5개는 5회, 전체 40개는 40회로 제한해 입력 중복·비용·실행 시간을 줄이고 한 상품의 분석 결과 일관성을 유지 |
| DEC-019 | 2026-09-02 | Phase 4 OpenAI retry 정책 | 공식 SDK의 transient 오류 재시도를 최대 2회 허용 | 정상 시 표본 5회이며 429·5xx·연결 오류에만 상품별 재시도해 atomic batch 전체를 다시 실행할 위험을 낮춤; 최악에는 최대 15회 HTTP 시도 가능 |
| DEC-020 | 2026-09-02 | Phase 4 전체 enrichment 실행 방식 | 검증된 표본 5개를 재사용하지 않고 전체 40개를 같은 model·prompt로 다시 실행 | 추가 논리 호출 40회와 예상 비용 약 $0.06~$0.12를 승인하고 전체 결과의 실행 시점을 한 번으로 통일 |
| DEC-021 | 2026-09-02 | Review signal 충돌 기준 | 같은 축에 상반된 명시적 evidence가 하나라도 함께 있으면 다수 비율과 무관하게 `mixed` | 계획과 prompt의 불확실성 원칙을 엄격히 적용하고 소수 의견이 dominant signal에서 사라지는 것을 방지 |
| DEC-022 | 2026-09-02 | Strict signal prompt v2 재실행 범위 | 리뷰 유무와 무관하게 전체 40개를 prompt v2로 다시 실행 | 추가 논리 호출 40회와 예상 비용 약 $0.08~$0.14를 승인하고 모든 enrichment의 prompt version과 signal 검증 기준을 통일 |
| DEC-023 | 2026-09-02 | 모델 tally/signal 불일치 처리 | evidence tally를 source of truth로 삼고 코드 결정표가 persisted signal을 확정 | strict mixed 정책을 deterministic하게 보장하고 모델의 label 실수로 batch가 중단되는 문제를 제거; 상품별 checkpoint로 성공 결과의 반복 호출 방지 |
| DEC-024 | 2026-09-02 | Appearance evidence 경계 사례 보정 | 원문 감사로 확정한 2개 상품을 product ID 기반 deterministic override로 관리 | 추가 API 호출 없이 명시적 비교 원칙을 재현 가능하게 적용하며 source review 위치와 보정 근거를 코드에 함께 기록 |
| DEC-025 | 2026-09-02 | Required color/size의 missing data | 상품 factual 값이 존재하면서 불일치할 때만 제외하고, 값이 없으면 unknown 후보로 유지 | 현재 color coverage 28/40에서 recall 손실을 막고 “신뢰 가능한 데이터가 있을 때만 hard filter” 원칙을 적용; unknown에는 retrieval 일치 가점을 주지 않으며 Agent가 충족으로 단정하지 않음 |
| DEC-026 | 2026-09-02 | 공개 `/api/chat` 비용 보호 | Phase 6에서 IP 기반 요청 제한과 입력 크기 제한을 구현한 뒤 Render Agent를 실제 검증 | 공개 endpoint의 무제한 OpenAI 비용 발생 위험을 줄이면서 Phase 6에서 배포 환경까지 확인; 무료 단일 instance의 in-memory 제한이므로 재시작 시 초기화되는 MVP 보호 수준 |
| DEC-027 | 2026-09-02 | 공개 Agent 운영 한도 | IP당 10분 10회와 Service 전체 시간당 30회를 함께 적용하고 OpenAI transient retry는 최대 1회 | 연속 10개 평가를 허용하면서 분산 IP 호출도 전체 한도로 제한; raw IP·query는 영구 저장하지 않으며 in-memory counter는 재시작 시 초기화됨 |
| DEC-028 | 2026-09-02 | Product category canonical vocabulary | `pants`, `top`, `dress`, `skirt`, `outerwear`를 tool schema와 서버 validation에서 강제 | 한국어 category가 DB hard filter에 직접 전달되는 오류를 차단하고, 현재 pants-only DB는 다른 유효 category에 정확히 0건을 반환하며 향후 상품 확장 시 계약을 유지 |
| DEC-029 | 2026-09-02 | 추천 evidence value 계약 | 사용자 선택 A — evidence type별 nested `anyOf`와 canonical value를 Structured Output에서 강제하고 `unknown` review signal은 evidence에서 제외해 `concerns`로만 표현 | 임의 문장·잘못된 enum 값을 생성 단계에서 차단하고, 서버 factual validation을 이중 방어로 유지; `mixed`·부정 signal은 실제 불확실성/위험 근거로 허용 |
| DEC-030 | 2026-09-02 | Phase 6 남은 실제 eval 범위 | 사용자 선택 A — `vague` clarification과 `no-result`만 추가 실행하고 나머지 품질 표본은 Frontend 이후 Phase 8의 7개 이상 최종 eval에서 수행 | Phase 6에서 recommendation 포함 세 응답 분기의 실제 동작을 확인하면서 API 비용과 Phase 8 중복을 제한 |
| DEC-031 | 2026-09-02 | Render 외부 Agent 검증 범위 | 사용자 선택 B — Phase 6 변경을 commit/push한 뒤 외부 `/api/health`와 `office-black` recommendation 전체 경로를 검증 | 단순 clarification보다 비용은 높지만 Render→Agent→SQLite→실제 상품 추천까지 배포 환경의 핵심 DoD를 직접 확인 |
| DEC-032 | 2026-09-02 | Product Card 외부 링크 클릭 범위 | 사용자 선택 A — 상품 이미지·상품명·`상품 보러가기` CTA만 실제 쇼핑몰 `productUrl`을 새 탭으로 연결 | 카드 본문의 후기·사이즈 정보를 읽거나 텍스트를 선택할 때 의도치 않은 이동을 막고, 명시적인 외부 이동과 안전한 `rel` 속성을 제공 |
| DEC-033 | 2026-09-02 | Frontend 선택 조건 전달 방식 | 사용자 선택 A — 자연어와 선택한 카테고리·가격·사이즈를 명시적 조건 문장으로 합쳐 기존 `/api/chat`의 `message`로 전달 | 검증된 backend 계약을 유지하고 Phase 7 범위를 줄임; 자연어와 UI 선택값이 충돌할 때 선택값을 우선 조건으로 명시하고 화면에 최종 조건을 표시 |
| DEC-034 | 2026-09-02 | Phase 7 선택 조건 UI 범위 | 사용자 선택 A — 현재 지원 category를 바지로 명시하고 가격 상한 5만·7만·10만원 preset과 자유 사이즈 입력을 제공 | 실제 DB의 pants 40개 범위와 UI 기대를 일치시키고 결과 없는 category 선택을 방지; 향후 데이터 추가 시 category 옵션만 확장 가능하게 구성 |
| DEC-035 | 2026-09-02 | Product Card 정보 밀도 | 사용자 선택 A — 추천 이유·색상/사이즈·후기 신호·구매 전 확인사항은 항상 표시하고 긴 원문 사이즈표만 접기 | 사이즈·핏·후기 확인 부담을 줄이는 제품 목표에 맞춰 핵심 판단 근거와 불확실성을 숨기지 않으면서 긴 원문으로 인한 카드 과밀만 완화 |
| DEC-036 | 2026-09-02 | Progressive search form | 사용자 피드백에 따라 첫 화면은 자연어 검색창 중심으로 단순화하고, 문자를 입력한 뒤에만 카테고리·가격·사이즈 필터를 표시 | 첫 진입의 정보량과 실수 가능성을 줄이고 자연어 입력을 primary interaction으로 유지; query를 지우면 선택 조건도 초기화 |
| DEC-037 | 2026-09-02 | 결과 header·comparison 표현 | 사용자 피드백에 따라 `AI가 찾은 결과` 본문을 작은 semibold typography로 낮추고, 후보 비교를 개별 card가 아닌 연속된 추천 코멘트로 표시 | 결과 header의 시각적 과장을 줄이고 Product Card 위에 중복되는 card container를 제거해 비교를 빠르게 읽도록 개선 |
| DEC-038 | 2026-09-02 | 검색 결과 대화 표현 | 사용자 지시에 따라 사용자 검색 조건은 우측 말풍선, AI의 recommendation·clarification·no-result 응답은 좌측 말풍선으로 표시하고 상품 목록은 말풍선 밖의 전체 폭을 유지 | 질문과 답변의 흐름을 채팅처럼 즉시 인지시키면서 상세 상품 정보가 좁은 말풍선 폭에 갇히는 문제를 방지 |
| DEC-039 | 2026-09-02 | 모바일 추천 상품 구조 | 사용자 선택 B — 세 후보를 이미지·상품명·가격 중심의 세로 요약 행으로 한 화면에서 조망하고, 선택한 한 상품의 전체 정보만 아래에 펼침; 후속 질문 시 기존 AI 결과를 요약 말풍선으로 접고 실패 시 복구 | DEC-035의 핵심 정보 상시 노출을 사용자 선택으로 대체; 모바일 가독성과 비교 가능성을 확보하면서 상세 evidence·후기·위험 정보는 명시적 선택 후 그대로 제공 |
| DEC-040 | 2026-09-02 | AI 응답·상품 accordion 밀도 | 사용자 피드백에 따라 AI 답변을 일반 채팅 수준의 14px semibold로 낮추고, 선택한 상품 상세를 해당 요약 카드 내부에서 펼치며 최하단에 `카드 접기`를 제공 | 답변의 시각적 무게를 줄이고 선택 항목과 상세 정보의 공간적 연결을 유지; 긴 상세를 읽은 뒤 상단으로 돌아가지 않고 닫을 수 있음 |
| DEC-041 | 2026-09-02 | 주요 surface 색상 | 사용자 지시에 따라 진한 검정 배경의 사용자 말풍선·검색/외부 이동 버튼·선택 control·순위 배지·header mark를 연한 stone 회색으로 전환하고 진한 글자로 대비 유지 | 전체 화면의 시각적 무게와 검정 면적을 줄이되 주황색 AI identity·focus state는 유지 |
| DEC-042 | 2026-09-02 | 부족한 review 정보 표시 | 사용자 지시에 따라 `unknown` 후기 signal 카드는 렌더링하지 않고 세 signal이 모두 unknown이면 후기 섹션 전체를 숨김; size guide 부재 placeholder도 제거 | 정보가 없는 카드로 상세 화면이 길어지는 문제를 제거; 정보 부재는 별도 카드 대신 해당 항목의 omission으로 표현 |
| DEC-043 | 2026-09-02 | 결과·채팅 surface 범위 | 사용자 선택 1A — 상품 summary·확장 영역과 사용자 말풍선의 surface를 white로 통일하고 선택 상품은 orange border로만 구분; 후기·evidence의 의미별 tint는 유지 | 전체 카드 면을 가볍게 만들면서도 근거 종류와 후기 신호의 빠른 구분은 보존 |
| DEC-044 | 2026-09-02 | 모바일 조건 입력 구조 | 사용자 선택 2A — 단일 선택지인 category UI를 제거하고 `pants`를 모든 요청에 자동 포함; query 입력 후 가격 select와 사이즈 input을 모바일 2열로 직접 표시하고 submit은 모바일 전체 폭 사용 | 불필요한 category fieldset과 여러 가격 chip을 제거해 높이·복잡도를 줄이고 추가 tap 없이 조건을 편집 가능하게 유지 |
| DEC-045 | 2026-09-03 | Phase 8 실제 Agent eval 범위 | 사용자 선택 A — Render `/api/chat`을 재시도 없이 순차 8회 호출: 독립 추천 5개, clarification 1개, no-result 1개, 첫 추천의 follow-up 1개 | 핵심 조건·review·대화 연속성과 세 응답 분기를 모두 검증하며 예상 비용 약 $0.45~$0.70 승인; 실제 응답 원문은 임시 경로에만 저장하고 repository에는 synthetic query·판정·상품 ID만 기록 |
| DEC-046 | 2026-09-03 | 다중 category catalog 밀도 | 사용자 선택 1A — 총 10개 쇼핑몰에서 `pants`, `top`, `dress`, `skirt`, `outerwear` category별 약 10개 상품을 목표로 수집 | 기존 두 쇼핑몰의 바지 40개를 보존하면 최종 약 500개, 최대 예상 520개와 신규 enrichment 최대 약 480회; 10개 표본 비용을 먼저 측정하고 전체 실행은 별도 승인 |
| DEC-047 | 2026-09-03 | 확장 쇼핑몰 platform·접근 조건 | 사용자 선택 2A — Cafe24 여성 의류몰만 총 10개 선정하고 상품과 review를 공개 HTTP로 안정적으로 수집할 수 없는 후보는 교체 | 기존 공통 parser와 shop config를 재사용하고 browser automation·platform별 parser 확장을 피하면서 review evidence 품질 유지 |
| DEC-048 | 2026-09-03 | Phase 8 변경 기준선 | 사용자 선택 3A — 현재 검증 완료된 Phase 8 변경을 local commit하고 push 없이 Phase 9를 별도 이력으로 시작 | 불필요한 Render build를 발생시키지 않고 final validation 자산과 catalog 확장 변경을 분리해 복구·검토 가능성 확보 |
| DEC-049 | 2026-09-03 | Phase 9 신규 쇼핑몰 | 사용자 선택 A — 리리앤코·안나앤플러스·시크라인·핫핑·커먼유니크·도드리·메이빈스·배드다이어리를 신규 8개 shop으로 확정 | 8곳 모두 Cafe24, 5개 canonical category 상품, 공개 HTTP 상품·review 접근 조건을 충족하며 review API가 불안정한 레미떼는 제외 |
| DEC-050 | 2026-09-03 | category 간 중복 상품 처리 | 사용자 선택 A — 단일 `products.category`를 유지하고 `pants → top → dress → skirt → outerwear` 순서로 먼저 배정된 상품을 보존하며 후속 category는 다음 후보로 보충 | 첫 500 slot 중 중복은 10개(2%)뿐이므로 many-to-many DB·검색·Agent 계약 확장을 피하고 최대 520개 고유 상품 목표 유지 |
| DEC-051 | 2026-09-03 | Phase 9C 원본 수동 표본 검사 | 사용자 최신 결정 — 별도 수동 검사를 생략하고 초기 두 shop과 같은 공통 로직 및 520개 자동 전수 검증 결과를 승인 | 50/50 raw collection 계약, 520/520 page·image 실제 접근, 84/84 전체 test를 근거로 9C 완료 처리; 직전의 수동 검사 B 응답은 최신 지시로 대체 |
| DEC-052 | 2026-09-03 | 확장 catalog DB 반영 시점 | 사용자 선택 A — 신규 480개 enrichment를 완료한 뒤 실제 `data/products.db`를 한 번 rebuild | enrichment 없는 480개가 섞인 중간 DB와 중복 rebuild를 피하고, 520개가 완전한 시점에 Phase 9E로 연결 |
| DEC-053 | 2026-09-03 | Phase 9D 표본 실행·재사용 | 사용자 선택 A — 예상 $0.01~$0.03, 보수적 상한 $0.06인 신규 표본 10개 실제 호출을 승인하고 정상 결과를 전체 enrichment에 재사용 | 같은 `gpt-5.6-luna`·prompt v2·strict contract 결과를 재사용해 전체 신규 logical call을 480회(표본 10+나머지 470)로 유지 |
| DEC-054 | 2026-09-03 | Phase 9D 전체 신규 enrichment | 사용자 선택 A — 남은 470회 순차 checkpoint/resume 실행과 예상 $0.35~$0.55, 안전 예산 기준 $0.75 승인 | 기존 40개와 표본 10개를 보존하고 누락된 상품만 호출한 뒤, 성공 시 520개 단일 enriched output으로 원자적 교체 |
| DEC-055 | 2026-09-03 | 자연스러운 유사 조건 확장 주체 | 사용자 선택 B — 첫 검색 결과가 부족하면 AI가 soft preference를 유사 조건으로 바꿔 한 번 재검색하고 완화 사실을 응답에서 명시 | 고정 서버 확장보다 문맥에 유연하지만 재현성·호출 비용 부담이 있으므로 mock 회귀를 우선하고 실제 `gpt-5.6-sol` 반복 평가는 케이스 수·예상 비용을 별도 승인받아 실행 |
| DEC-056 | 2026-09-03 | 첫 자연스러움 실제 eval 규모 | 사용자 선택 A — local 독립 case 20개를 순차 실행하고 예상 $1.30~$2.00, 안전 예산 $2.50 승인 | 큰 50개 batch보다 실패를 prompt·audit에 빠르게 환류하며 반복하고, 원문 응답은 시스템 임시 디렉터리에만 보존 |
| DEC-057 | 2026-09-03 | batch 1 실패 case 재실행 | 사용자 선택 A — 보정된 prompt로 실패 1건만 다시 실행하고 예상 $0.07~$0.15, 안전 상한 $0.35 승인 | 최초 실패 원인이었던 허위 tag evidence 차단 보정과 plain-text 출력, 오류 usage 계측을 실제 model에서 검증 |
| DEC-058 | 2026-09-03 | 첫 검색 category 선택 방식 | 사용자 선택 A — 기본값은 `AI가 문장에서 판단`으로 두고 5개 category를 선택 사항으로 제공 | 자연어만으로 즉시 검색할 수 있고 사용자가 직접 선택한 경우에만 category를 필수 조건으로 전달; category가 불명확하면 Agent clarification 사용, follow-up에는 선택 UI를 표시하지 않음 |
| DEC-059 | 2026-09-03 | 후보 간 핵심 차이 표현 | 사용자 지시에 따라 독립 비교 섹션을 제거하고 각 상품 카드 바로 아래에 짧은 비카드 코멘트로 배치; 후속 피드백으로 `ㄴ` prefix도 제거 | 상품명·섹션 제목·장식 기호의 반복을 없애고 비교 설명과 해당 상품의 공간적 연결을 강화; 서버 응답 계약과 AI 호출은 변경하지 않음 |
| DEC-060 | 2026-09-03 | 긴 상품명 표시 규칙 | 사용자 승인 — 원본 상품명은 보존하고 화면에서만 선행 `[]`·`()`·`【】` 홍보 태그와 후행 SEO keyword block을 제거한 뒤 핵심 이름이 28자를 넘으면 `…` 처리 | 520개 상품명은 중앙값 30자·최장 253자로 홍보·검색 keyword 오염이 큼; 상품 링크의 접근성 이름과 factual source는 전체 원문을 유지하며 상품 카드와 접힌 이전 추천 요약에 같은 표시명을 사용 |
| DEC-061 | 2026-09-03 | 상세보기 이미지 확대 | 사용자 승인 — 기존 summary thumbnail을 상세 펼침 시 mobile `64→112px(1.75x)`, desktop `72→144px(2x)`로 300ms ease-out 확대하고 접을 때 원복 | 상세 영역에 이미지를 중복 추가하지 않고 선택한 상품의 시각적 강조를 제공; grid column 전환으로 주변 정보도 함께 재배치하고 reduced-motion 환경에서는 animation 제거 |
| DEC-062 | 2026-09-03 | hero 보조 문구 | 사용자 최신 선택 — 대체 한글 문구를 취소하고 최초의 `Search less. Decide better.` 영문 eyebrow와 원래 typography로 복원 | 한글 문구 적용 결과가 첫 화면의 의도한 분위기와 맞지 않아 최초 시각적 리듬을 최종 채택 |
| DEC-063 | 2026-09-03 | 첫 검색 조건 필터 노출 시점 | 사용자 지시 — 검색어가 빈 문자열이어도 첫 검색창 또는 form 내부 control이 focus되면 category·price·size를 표시하고, form 밖으로 focus가 이동해도 입력·선택값이 있으면 유지 | 입력 시작 전에도 조건을 발견·선택할 수 있게 하되 자연어 필수 제출 계약과 후속 질문의 filter 미표시는 유지 |
| DEC-064 | 2026-09-03 | 첫 화면 header badge | 사용자 승인 — `실제 여성 의류 상품 검색` badge를 제거하고 검색 전 header 우측을 비움 | hero title·설명과 정보가 중복되고 header를 복잡하게 하므로 제거; 검색 후 `새로 찾기` action은 그대로 유지 |
| DEC-065 | 2026-09-03 | 검색 안내·상세 toggle 후속 polish | 사용자 지시 및 위임 — focus 전 안내를 `검색창을 누르면…`으로 정정하고, 빈 query로 filter가 열리면 자연어 입력 필요성을 안내하며, 빈 error 공간 제거; 펼침 시 `상세보기` chip은 300ms 동안 원형으로 축소해 `↑`만 표시 | filter-only 검색은 Agent 대화 계약을 바꾸므로 자연어 필수를 유지하고 즉시 설명; 접힘 `↓`·펼침 `↑`으로 동작 방향을 명확히 하며 `aria-label=상세 접기`와 하단 `카드 접기`도 유지 |
| DEC-066 | 2026-09-03 | interactive focus 표현 | 사용자 위임 — text input·select는 editing focus를 계속 표시하고, link·button·details summary는 `focus-visible` ring으로 통일 | mouse click 후 주황 highlight 잔류를 전반적으로 제거하면서 keyboard `Tab` 사용자의 명확한 focus indicator는 보존 |
| DEC-067 | 2026-09-03 | 검색 submit action 배치 | 사용자 승인 — 첫 검색과 후속 질문 모두 별도 full-width text button을 제거하고 입력 행 오른쪽 내부의 원형 `→` button으로 통일; loading에는 spinner 표시 | filter 아래 button 행을 없애 mobile 높이와 시각적 무게를 줄이고 일반 chat composer interaction과 일치; 빈 query disabled·접근성 label·focus-visible은 유지 |
| DEC-068 | 2026-09-03 | 화살표 action visual state | 사용자 최신 지시 — 활성 button은 border 없는 36px black circle과 white arrow로 표시하고, 빈 query에서는 렌더링하지 않다가 입력 시 오른쪽에서 fade/scale animation으로 등장 | disabled placeholder가 차지하던 시각적 무게를 없애고 chat send interaction을 강화; request loading 중에는 같은 원 안의 white spinner를 유지 |
| DEC-069 | 2026-09-03 | 화살표 action 위치 | 사용자 지시 — 검색창 폭은 고정하고 36px action을 입력 영역 오른쪽 내부에 absolute overlay로 배치 | button 등장으로 input width와 주변 layout이 움직이는 현상을 방지; input은 처음부터 우측 48px padding을 확보해 입력 text와 action이 겹치지 않음 |
| DEC-070 | 2026-09-03 | 사이즈표 구조화·오수집 정리 | 사용자 전체 승인 — deterministic strict parser가 검증한 실측값만 반응형 HTML table로 표시하고, 검증 실패한 58개 raw 값은 `null` 처리하며 crawler 재수집도 차단; reviewer 식별정보가 포함된 기존 Git 이력은 rewrite 후 `main`을 강제 갱신 | LLM 호출·schema 변경 없이 mobile 가독성과 factual 안전성을 높임; 현재 유효한 Graychic 실측표 60개는 보존하고 상품 설명·아동 변환표·후기 오수집은 제거하며 Phase 9 이후 commit hash가 바뀔 수 있음 |

## Phase 1 시작 준비

- [x] 로컬 `.env` 존재 및 Git ignore 확인 — 값은 읽거나 출력하지 않음
- [x] 사용자 확인: `gpt-5.6-luna`, `gpt-5.6-sol` API 사용 가능
- [x] 쇼핑몰 선정 방식: 후보 조사 후 사용자 승인
- [x] 첫 검증 category: `pants` 10개
- [x] Cafe24 여성 의류몰 후보 조사
- [x] 최종 대상 쇼핑몰 승인: 그레이시크 + 아이팜므
- [x] 추가 설문 반영 데이터 계약 확정: nullable `sizeGuideText`, 기존 query 기반 fit 해석, 자동 comparison summary

### 추가 설문 반영 검증

| 시각 (KST) | 항목 | 결과 |
|---|---|---|
| 2026-09-02 | CSV 구조 | 18개 열, 전체 22개 고유 응답, 35~50세 유효 응답 21명 확인 |
| 2026-09-02 | 설문 집계 | Q9, Q12, Q13, Q15 핵심 수치를 CSV에서 재산출해 계획서와 일치 확인 |
| 2026-09-02 | 계획서 계약 | 구 17명 기준 수치 제거, `sizeGuideText`, 자동 `comparison`, 정보 부족 처리와 Non-goal의 일관성 확인 |
| 2026-09-02 | 문서 구조 | JSON 예시 6개 파싱 및 Markdown code fence 균형 확인 |

### 대상 쇼핑몰 사전 조사

| 쇼핑몰 | 판정 | 상품 수집 | 리뷰 수집 | 비고 |
|---|---|---|---|---|
| 그레이시크 (`graychic.co.kr`) | 후보 1순위 | Cafe24 확인, `BOTTOMS` 공개 목록에서 바지 계열 10개 이상 확보 가능 | 상품 상세 HTML에 실제 리뷰 제목·평점·작성일 노출 확인 | `BOTTOMS`가 바지와 스커트를 함께 포함하므로 초기 discovery에서 바지 상품명만 선별 필요 |
| 아이팜므 (`ifemme.co.kr`) | 후보 2순위 | Cafe24 확인, `PANTS` 공개 목록에서 상품 10개 이상 확보 가능 | Crema 위젯 동적 로딩으로 Phase 2 추가 조사 필요 | Phase 1 상품 parser의 두 번째 쇼핑몰 검증에 적합 |
| 조아맘·룸페커·메이블루·마이다스비·캔마트·안나앤블루·리린 | 제외 | MakeShop 계열 URL/호스팅 marker 확인 | 조사 중단 | 35~50세 타깃 적합도는 높지만 확정된 Cafe24 전용 crawler 범위와 불일치 |
| 미지니·유리진 | 제외 | 현재 DNS 조회 실패 | 조사 불가 | 검색 색인에는 남아 있으나 현재 공개 접근 가능한 수집 대상으로 사용할 수 없음 |

두 후보의 `robots.txt`는 공개 상품 목록·상세 페이지를 금지하지 않는다. 초기 수집은 서버 부하를 줄이기 위해 쇼핑몰별 10개 상품으로 제한하고 요청 간격을 적용할 예정이다.

## Phase 1 — Cafe24 Product Crawler

### 갱신된 목표

- 그레이시크·아이팜므에서 바지 상품을 각각 20개 수집한다.
- Cafe24 공통 parser와 필요한 최소 shop override를 구성한다.
- 실제 판매 옵션의 `sizes`를 수집한다.
- 상세페이지에 텍스트 치수 안내가 있으면 `sizeGuideText`에 원문을 저장하고, 안전하게 추출할 수 없으면 `null`로 둔다.
- 실제 상품을 `data/raw/*.json`에 source of truth로 저장한다.

### 체크리스트

- [x] 확정 설문 22명·유효 응답 21명 및 주요 집계 검산
- [x] 갱신된 `FINAL_PLAN`의 Phase 1 데이터 계약 확인
- [x] `cheerio` 사용 승인
- [x] `cheerio` 설치 — `1.2.0`, npm audit 취약점 0개
- [x] shop config 구현
- [x] 상품 URL discovery 구현
- [x] 공통 상품 parser 및 fallback 구현
- [x] `sizes`와 nullable `sizeGuideText` parsing 구현
- [x] parser unit test
- [x] 쇼핑몰별 10개 실제 상품 수집
- [x] `data/raw/*.json` 자동 검증
- [x] 사용자 원본 JSON 표본 검증
- [x] 쇼핑몰별 20개로 확대 수집
- [x] 총 40개 raw schema 재검증
- [x] 추가 상품 사용자 표본 검증

### 구현 및 검증 기록

| 시각 (KST) | 항목 | 결과 |
|---|---|---|
| 2026-09-02 | `cheerio` 설치 | `1.2.0`, 전체 149 packages, 취약점 0개 |
| 2026-09-02 | parser fixture test | 상품 URL 중복 제거·category filter·할인가·옵션·텍스트 치수표·이미지 치수표 nullable·상품명 단일 size fallback 검증 |
| 2026-09-02 | 실제 HTML 표본 | 그레이시크와 아이팜므의 필수 상품 필드, 현재가/정상가, 옵션과 치수표 parsing 확인 |
| 2026-09-02 | 첫 실제 수집 | 각 10개 수집 성공; 아이팜므 리뷰 표가 치수표로 오인되는 오류 발견 |
| 2026-09-02 | 치수표 판별 수정 | 리뷰 게시판 header 제외, 실제 치수 열 또는 `cm` 근거 요구; regression test 추가 |
| 2026-09-02 | 최종 실제 수집 | 그레이시크 10개 + 아이팜므 10개, 요청 간격 1초, 실패 0건 |
| 2026-09-02 | raw schema 검증 | 각 파일 10개·고유 ID 10개, 필수 필드/가격/HTTPS/array/nullable 계약 오류 0건 |
| 2026-09-02 | `sizes` | 양쪽 쇼핑몰 총 20개 상품 모두 판매 사이즈 확보 |
| 2026-09-02 | `sizeGuideText` | 그레이시크 10/10 텍스트 치수표, 아이팜므 0/10 이미지형이므로 `null`; 리뷰 오인 0건 |
| 2026-09-02 | 자동 테스트 | `npm test` — 6 tests, 6 passed |
| 2026-09-02 | production build | `npm run build` — Vite build 성공 |
| 2026-09-02 | 사용자 표본 검증 | 그레이시크 2개·아이팜므 2개 상품의 상품명·가격·이미지·판매 사이즈·치수표/null 처리 이상 없음 확인 |
| 2026-09-02 | 첫 20개 확대 실행 | 실행 중 사용자 중단; raw 파일은 기존 10개 상태로 유지되어 부분 저장·손상 없음 확인 |
| 2026-09-02 | 20개 확대 재실행 | 그레이시크 20개 + 아이팜므 20개 수집 성공, 실패 0건 |
| 2026-09-02 | 40개 raw schema 검증 | 파일별 20개·고유 ID 20개, 필수 필드/가격/HTTPS/array/nullable 계약 오류 0건 |
| 2026-09-02 | 확대 데이터 coverage | 그레이시크 sizes/치수표/소재 20/20, 아이팜므 sizes 20/20·이미지형 치수표 `null` 20/20, 리뷰 오인 0건 |
| 2026-09-02 | 확대 후 자동 검증 | `npm test` 6/6 및 `npm run build` 성공 |
| 2026-09-02 | 확대 후 사용자 표본 검증 | 추가된 그레이시크 2개·아이팜므 2개 상품의 상품명·가격·이미지·판매 사이즈·치수표/null 처리 이상 없음 확인 |

### 사용자 수동 작업

- Phase 1 구현 전 추가 작업 없음.
- 구현 후 원본 JSON 표본 검증 필요 — 결과 파일과 원본 상품 페이지의 상품명·가격·이미지·판매 사이즈·치수표를 비교한다.
- 최초 10개 및 확대 후 추가 상품의 사용자 표본 검증 완료.

### Blocker / 미해결

- Phase 1 blocker 없음.

### 다음 작업

1. Phase 2에서 두 쇼핑몰의 상품당 최근 리뷰 최대 20개를 수집한다.
2. raw review schema와 PII 제외 여부를 자동·수동 검증한다.

## Phase 2 — Review Crawling

### 목표

- 그레이시크 20개 상품에서 상품당 최근 실제 텍스트 리뷰를 최대 20개 수집한다.
- 아이팜므 20개 상품의 Crema 리뷰도 상품당 최대 20개 수집한다.
- 평점·구매 옵션·작성일과 공개된 체형 metadata를 가능한 범위에서 저장한다.
- 작성자 이름·ID 등 개인 식별정보를 raw data에 저장하지 않는다.
- 리뷰가 없거나 수집할 수 없는 상품도 정상 상품으로 유지한다.

### 체크리스트

- [x] 그레이시크 HTML 리뷰 목록·상세 구조 조사
- [x] 아이팜므 Crema 공개 API/embedded data 구조 조사
- [x] review parser와 normalization 구현
- [x] PII 제외 및 최대 20개 제한 테스트
- [x] 그레이시크 20개 상품 리뷰 수집
- [x] 아이팜므 20개 상품 리뷰 수집
- [x] raw JSON review schema 검증
- [x] 사용자 실제 리뷰 표본 검증

### 사용자 수동 작업

- Phase 2 구현 전 추가 작업 없음.
- 구현 후 원본 상품 리뷰와 raw JSON의 텍스트·평점·작성일·옵션 표본 비교가 필요하다.

### 구현 및 검증 기록

| 시각 (KST) | 항목 | 결과 |
|---|---|---|
| 2026-09-02 | 그레이시크 구조 조사 | 상품 상세 `#prdReview`에 최근순 리뷰 본문·별점·작성일이 서버 HTML로 노출되며 리뷰 상세 JSON-LD의 본문과 목록 본문이 일치함을 확인 |
| 2026-09-02 | 아이팜므 구조 조사 | Crema v2 widget이 사용하는 공개 `/api/ifemme.co.kr/reviews` JSON endpoint 확인; 최근순 `sort=20`, `per=20`과 본문·옵션·공개 profile·이미지·작성일 응답 검증 |
| 2026-09-02 | 수집 방식 | 두 쇼핑몰 모두 HTTP만 사용하며 Playwright dependency 불필요 |
| 2026-09-02 | parser unit test | 두 source normalization, 작성자명·내부 ID 제외, 상품당 최대 20개 제한 검증 |
| 2026-09-02 | 실제 응답 parser 표본 | 그레이시크 20개 및 아이팜므 20개 응답을 각각 parse하고 review schema 확인 |
| 2026-09-02 | 중간 자동 테스트 | `npm test` — 8 tests, 8 passed |
| 2026-09-02 | 실제 리뷰 수집 | 그레이시크 20개 + 아이팜므 20개 상품 요청 완료, 실패 0건 |
| 2026-09-02 | 리뷰 coverage | 그레이시크 17/20개 상품 290개, 아이팜므 8/20개 상품 116개로 총 406개 실제 텍스트 리뷰 저장 |
| 2026-09-02 | metadata coverage | 아이팜므 리뷰 중 공개 체형 metadata 93개, 구매 옵션 93개, 이미지 URL 34개; 그레이시크 source는 해당 metadata를 목록에서 제공하지 않아 nullable 유지 |
| 2026-09-02 | raw review schema | 상품당 최대 20개, 최근순, 필수 key·nullable profile·HTTPS image·ISO 작성일 오류 0건; 작성자명·작성자 ID key 0건 |
| 2026-09-02 | 리뷰 집계 정합성 | Phase 1 이후 추가된 아이팜므 리뷰를 반영해 Crema의 현재 `total_reviews_count`로 상품 review count 갱신; 저장 리뷰 수가 총 리뷰 수를 초과하는 상품 0건 |
| 2026-09-02 | 최종 자동 테스트 | `npm test` — 9 tests, 9 passed |
| 2026-09-02 | production build | `npm run build` — Vite build 성공 |
| 2026-09-02 | 변경 검사 | `git diff --check` 통과 |
| 2026-09-02 | 사용자 표본 검증 | 그레이시크·아이팜므 원본 리뷰와 raw JSON의 본문·별점·작성일·구매 옵션 및 작성자 식별정보 미저장 확인 완료 |

### Blocker / 미해결

- Phase 2 blocker 없음. 두 쇼핑몰 모두 공개 HTTP/JSON으로 수집 가능하다.

### 다음 작업

1. Phase 2 변경사항을 commit한다.
2. Phase 3에서 SQLite migration, raw product/review import와 repository를 구현한다.
3. DB 생성·상품 수·review relation·UPSERT를 자동 검증한다.

### Phase 3 사전 사용자 작업

- 사용자 수동 작업 없음. 로컬 SQLite 파일은 repository에 commit하지 않고 raw JSON에서 재생성한다.
- SQLite 구현 방식이나 dependency에 의미 있는 선택지가 생기면 구현 전에 사용자 결정을 받는다.

## Phase 3 — SQLite

### 목표

- commit된 raw JSON을 source of truth로 사용해 `data/products.db`를 재현 가능하게 생성한다.
- migration과 foreign key를 적용하고 상품 40개·리뷰 406개의 관계를 보존한다.
- 상위 search/agent layer가 SQLite driver에 직접 의존하지 않도록 Product Repository를 제공한다.
- build를 반복해도 stale 상품이나 중복 리뷰가 생기지 않게 한다.

### 체크리스트

- [x] `better-sqlite3` 설치
- [x] `001_initial.sql` 작성
- [x] `schema_migrations` 기반 migration runner 구현
- [x] migration transaction rollback 테스트
- [x] deterministic `npm run db:build` 구현
- [x] raw product/review import 구현
- [x] Product Repository 구현
- [x] 상품 UPSERT·리뷰 snapshot 교체 테스트
- [x] foreign key·cascade delete 테스트
- [x] Render build의 DB 재생성 연결
- [x] DB count·relation·integrity 자동 검증
- [x] 사용자 반복 build·표본 relation 검증

### 구현 및 검증 기록

| 시각 (KST) | 항목 | 결과 |
|---|---|---|
| 2026-09-02 | SQLite dependency | `better-sqlite3` `13.0.3`, Node `>=22` 호환, npm audit 취약점 0개 |
| 2026-09-02 | migration | `shops`, `products`, `reviews`, `product_enrichments`, index와 foreign key 생성; 두 번째 실행 미적용 0개 확인 |
| 2026-09-02 | migration rollback | 실패 migration의 schema 변경과 version 기록이 모두 rollback됨을 자동 테스트로 확인 |
| 2026-09-02 | DB build | `npm run db:build` — `shops=2`, `products=40`, `reviews=406`, `enrichments=0` |
| 2026-09-02 | deterministic rebuild | 동일 명령 두 번 실행 후 count 동일, 중복 상품·리뷰 0건 |
| 2026-09-02 | repository | save/search/get/getMany/getReviews 구현; deterministic product ID `shopId:sourceProductId` 사용 |
| 2026-09-02 | relation 표본 | `ifemme:31358` → 어텀 배기통 청바지 → 리뷰 14개 연결 및 최신 리뷰 본문 일치 |
| 2026-09-02 | DB integrity | `PRAGMA integrity_check = ok`, foreign keys 활성화 확인 |
| 2026-09-02 | read-only inspect | `npm run db:inspect` — 전체 count, integrity와 `ifemme:31358` 상품·리뷰 14개 relation 출력 확인 |
| 2026-09-02 | 자동 테스트 | `npm test` — 14 tests, 14 passed |
| 2026-09-02 | production build | `npm run build` 성공 |
| 2026-09-02 | Render config | `npm ci && npm run build && npm run db:build`; build 중 crawling/OpenAI 호출 없음 |
| 2026-09-02 | 변경 검사 | `git diff --check` 통과 |
| 2026-09-02 | 사용자 수동 검증 | `npm run db:build` 실행 완료 및 Phase 3 결과 이상 없음 확인 |
| 2026-09-02 | GitHub push | `main`의 `282c703`~`a6f5952` 4개 커밋 push 완료, local/remote 동기화 확인 |
| 2026-09-02 | Render latest build | 외부 frontend `Last-Modified: 2026-09-02 10:02:09 KST`로 push 이후 새 build 반영 확인; 새 build는 `npm run db:build` 성공 후에만 service start 가능 |
| 2026-09-02 | Render external health | `https://levit-problem-solver.onrender.com/api/health` HTTP 200, `{"status":"ok","service":"levit-problem-solver"}` |

### 사용자 수동 작업

- 구현 전 추가 작업 없음.
- 구현 후 `npm run db:build`을 두 번 실행해 두 번 모두 `shops=2`, `products=40`, `reviews=406`, `enrichments=0`인지 확인한다.
- read-only `npm run db:inspect`로 `ifemme:31358`의 상품명과 리뷰 14개 relation을 확인한다.
- GitHub push와 Render 자동 배포 및 외부 frontend/health 검증 완료. 추가 사용자 작업 없음.

### Blocker / 미해결

- Phase 3 blocker 없음.

### 다음 작업

1. Phase 4의 실제 5개 상품 표본 enrichment를 실행한다.
2. 표본 결과를 사용자와 검토한 뒤 전체 40개 상품을 실행한다.

## Phase 4 — Offline Enrichment

### 목표

- GPT-5.6 Luna를 상품당 한 번 호출해 상품 속성과 저장 리뷰의 구매 위험 신호를 함께 구조화한다.
- 상품 factual data는 raw JSON에 유지하고 AI 출력에는 해석 결과만 저장한다.
- 리뷰 근거 부족은 `unknown`, 상충 의견은 `mixed`로 보존하며 structured reviewer profile이 없으면 유사 체형 후기를 생성하지 않는다.
- 검증된 enriched JSON을 SQLite `product_enrichments`에 재현 가능하게 import한다.

### 체크리스트

- [x] 공식 `openai` SDK 설치 및 AI config 분리
- [x] controlled vocabulary와 review signal 계약 구현
- [x] 상품 요약·리뷰 집계 통합 prompt 구현
- [x] Responses API strict Structured Output 요청 구현
- [x] incomplete·refusal·invalid JSON·schema/evidence mismatch 차단
- [x] 표본 5개 deterministic selection과 `--dry-run` 구현
- [x] 전체 성공 후에만 enriched JSON을 교체하는 atomic write 구현
- [x] DB build의 optional enriched JSON import와 repository UPSERT 구현
- [x] mock 기반 자동 테스트·DB build·production build 검증
- [x] 실제 5개 상품 API 표본 실행
- [x] 표본 결과 사용자 검증
- [x] 전체 40개 상품 enrichment 실행
- [x] 전체 enriched JSON DB rebuild
- [x] 소수 반대 evidence의 signal 정책 확정 및 결과 보정
- [x] enriched JSON commit 대상 최종 확인
- [x] 사용자 최종 수동 검증

### 구현 및 검증 기록

| 시각 (KST) | 항목 | 결과 |
|---|---|---|
| 2026-09-02 | OpenAI dependency | 공식 `openai` SDK `7.8.0`, npm audit 취약점 0개 |
| 2026-09-02 | 모델 기능 확인 | 공식 문서에서 `gpt-5.6-luna`의 Responses API, Structured Output, reasoning effort `none` 지원 확인 |
| 2026-09-02 | 출력 계약 | 요약·controlled tags·리뷰 3축 signal·장점·우려·structured profile 기반 note만 허용; ID·model·prompt version·시각은 코드에서 부착 |
| 2026-09-02 | factual guard | 가격·브랜드·판매 색상/사이즈·치수·평점·URL·재고를 AI 출력 schema에서 제외하고, 리뷰 수·no-review·profile evidence를 로컬에서 재검증 |
| 2026-09-02 | 표본 구성 | 양쪽 쇼핑몰, 리뷰 74개, 리뷰 없음 1개, structured profile 있음/없음, size guide 있음/없음을 포함한 5개 고정 |
| 2026-09-02 | 표본 dry-run | 논리 API 호출 5회, 선택 상품 5개, 저장 리뷰 74개 확인; API 호출·과금·파일 생성 없음 |
| 2026-09-02 | 자동 테스트 | `npm test` — 23 tests, 23 passed; 실제 OpenAI 대신 mock 사용 |
| 2026-09-02 | 실패 안전성 | 2개 상품 중 두 번째 mock 실패 시 기존 output이 교체되지 않음을 자동 검증 |
| 2026-09-02 | 실제 표본 실행 | 승인된 `gpt-5.6-luna` 논리 호출 5회가 모두 성공하고 `data/enriched/products.json`에 5개 결과 atomic write 완료 |
| 2026-09-02 | 실제 표본 계약 검증 | product ID·model·prompt version·날짜·controlled tags·review count·no-review unknown·structured profile 제한 오류 0건 |
| 2026-09-02 | 실제 표본 리뷰 대조 | 그레이시크는 structured profile note 0개, 아이팜므 2개 상품은 실제 profile이 있는 리뷰에서만 note 생성; appearance·size·material signal과 concern의 원문 근거 확인 |
| 2026-09-02 | 자동 테스트 | 표본 파일 계약 테스트 추가 후 `npm test` — 24 tests, 24 passed |
| 2026-09-02 | DB build | `npm run db:build` — `shops=2`, `products=40`, `reviews=406`, `enrichments=5` |
| 2026-09-02 | DB hydration 표본 | 리뷰 없는 `graychic:15143`의 3개 signal `unknown`, `ifemme:31358`의 14개 리뷰·profile note 7개가 repository에서 정상 복원됨 |
| 2026-09-02 | 사용자 표본 검증 | 5개 결과의 상품 요약·tags·review signal·근거 수준과 no-review/profile 제한에 이상 없음 확인 |
| 2026-09-02 | 전체 실행 | 사용자 승인 B안으로 표본 포함 전체 40개·저장 리뷰 406개를 다시 분석; 논리 호출 40회 모두 성공하고 atomic write 완료 |
| 2026-09-02 | 전체 계약 검증 | raw product 40개와 enrichment 40개가 1:1 일치하고 controlled vocabulary·review count·no-review unknown·profile evidence 제한 오류 0건 |
| 2026-09-02 | 전체 coverage | 리뷰 없는 상품 15개, similar reviewer note 45개; appearance `unknown=30/different=1/similar=5/mixed=4`, size `mixed=21/unknown=17/runs_large=2`, material `mixed=9/positive=16/unknown=15` |
| 2026-09-02 | 전체 자동 검증 | `npm test` — 24 tests, 24 passed; `npm run build` 성공; secret pattern 검출 0건 |
| 2026-09-02 | 전체 DB build | `shops=2`, `products=40`, `reviews=406`, `enrichments=40` |
| 2026-09-02 | signal 수동 감사 | `ifemme:33134`가 화면/실물 차이를 요약하면서 appearance `similar`로 분류된 명시적 불일치 발견; 소수 반대 evidence를 항상 `mixed`로 할지 다수 signal을 유지할지 결정 필요 |
| 2026-09-02 | strict signal 결정 | 같은 축에 상반 evidence가 하나라도 있으면 `mixed`로 확정 |
| 2026-09-02 | prompt v2 검증 장치 | appearance·size·material polarity별 evidence tally를 Structured Output에 추가하고, 코드 결정표와 signal이 다르면 저장 전 실패하도록 구현; tally는 검증 후 persisted JSON에서 제거 |
| 2026-09-02 | prompt v2 mock test | 상반 appearance evidence tally에서 dominant `similar`를 반환하면 거부되는 테스트 포함 관련 7 tests 통과; 실제 API 호출 없음 |
| 2026-09-02 | prompt v2 실제 실행 실패 | 3번째 `graychic:11135` 응답에서 size tally상 예상 `true_to_size`와 모델 signal이 불일치해 저장 전 중단; v2 논리 호출 3회 발생, 기존 v1 40개 파일 정상 보존 |
| 2026-09-02 | deterministic signal·checkpoint | 모델 label 대신 evidence tally와 코드 결정표로 persisted signal을 확정하고, 상품별 성공 결과를 별도 checkpoint에 저장·resume하는 테스트 통과 |
| 2026-09-02 | prompt v2 전체 재실행 | 전체 40개·리뷰 406개 논리 호출 성공, `promptVersion=v2` 40개로 atomic 교체 후 checkpoint 제거 확인 |
| 2026-09-02 | prompt v2 최종 자동 검증 | `npm test` — 25 tests, 25 passed; `npm run build` 성공; DB `enrichments=40`; evidence tally·secret persisted 검출 0건 |
| 2026-09-02 | strict signal 개선 확인 | `ifemme:33134` appearance `different`, `ifemme:31358` appearance `mixed`로 최초 감사 문제 교정 |
| 2026-09-02 | evidence tally 경계 감사 | `graychic:12325`의 일반 색감 칭찬이 similar evidence로 집계돼 `mixed`가 됐고, `graychic:14387`의 “사진보다 실물이 더 낫다”를 similar로 집계한 사례 확인; 명시적 비교 원칙상 각각 `different`, `mixed` 보정 필요 |
| 2026-09-02 | deterministic override | 사용자 승인에 따라 두 상품 ID·source review 위치·근거·appearance signal/summary를 코드에 명시하고 현재 enriched JSON에도 동일 적용 |
| 2026-09-02 | override 최종 검증 | 감사 대상 4개 signal이 `graychic:12325=different`, `graychic:14387=mixed`, `ifemme:31358=mixed`, `ifemme:33134=different`로 확인됨 |
| 2026-09-02 | 최종 자동 검증 | `npm test` — 27 tests, 27 passed; `npm run build` 성공; DB `shops=2/products=40/reviews=406/enrichments=40`; `git diff --check` 통과 |
| 2026-09-02 | 사용자 최종 검증 | 감사 대상 4개 appearance signal, no-review unknown, DB enrichment 40개와 표본 요약·concern에 이상 없음 확인 |
| 2026-09-02 | 구현 commit | `f318435 feat: add offline product enrichment pipeline` — 코드·테스트·enriched 40개·DB import와 상태 로그 포함 |
| 2026-09-02 | GitHub push | Phase 4 구현 및 완료 상태 로그 commit을 `origin/main`에 push |
| 2026-09-02 | production build | `npm run build` 성공 |
| 2026-09-02 | 변경 검사 | `git diff --check` 통과 |

### 사용자 수동 작업

- 실제 API 표본 실행 전: 예상 호출 수·비용과 SDK retry 정책 확인 및 실행 승인 완료.
- 표본 실행 후: 5개 결과에서 상품 요약, tags, `unknown`/`mixed`, 리뷰 근거와 유사 체형 note가 원문에 비해 과장되지 않았는지 확인한다.
- 전체 실행 후: enriched 40개와 DB `enrichments=40`을 확인한다.
- Render 작업은 Phase 4 구현 중에는 없다. Phase 4 commit/push 후 Render가 committed enriched JSON으로 DB를 rebuild하므로 그때 배포 확인을 다시 안내한다.

### Blocker / 미해결

- Phase 4 blocker 없음.

### 다음 작업

1. Render가 committed enriched JSON으로 DB를 rebuild하는지 확인한다.
2. Phase 5 Search 시작 전 구현 범위와 사용자 작업을 안내한다.

## Phase 5 — Search

### 목표

- 구조화된 required/preferred 조건을 받아 SQLite hard filter와 lightweight retrieval을 수행한다.
- hard filter 결과가 15개를 넘을 때만 config 기반 score로 Agent 후보를 최대 15개로 줄인다.
- factual product data와 enrichment를 compact DTO로 결합하되 image/source URL·raw description/reviews는 Agent에 전달하지 않는다.
- 검색은 deterministic하게 구현하며 OpenAI API를 호출하지 않는다.

### 체크리스트

- [x] 최종 계획의 tool input·hard/preferred·retrieval score·compact DTO 계약 확인
- [x] 현재 color/size/size guide 데이터 coverage 확인
- [x] required color/size의 missing-data 처리 정책 확정
- [x] retrieval config와 입력 validation 구현
- [x] strict function-call input schema 구현
- [x] repository hard filter 및 enrichment join 구현
- [x] color/size normalization과 조건부 hard filter 구현
- [x] lightweight retrieval score·deterministic tie-break 구현
- [x] compact Product DTO 구현
- [x] 최대 15개 candidate 제한 구현
- [x] eval cases 작성
- [x] unit/integration test
- [x] 사용자 표본 검증

### 구현 및 검증 기록

| 시각 (KST) | 항목 | 결과 |
|---|---|---|
| 2026-09-02 | Phase 5 사전 상태 | local/remote `main` 동기화, working tree clean, Phase 4 DB build에서 products/enrichments 40개 확인 |
| 2026-09-02 | 확정 검색 계약 | category·가격 always-hard, color·size conditional-hard, config weights `keyword=1/color=2/size=2/style=2/occasion=2/fit=3/season=1/reviewSignal=2`, candidate limit 15 |
| 2026-09-02 | factual coverage | sizes 40/40, colors 28/40, text size guide 20/40; missing factual data를 생성하지 않음 |
| 2026-09-02 | 값 형태 | colors는 한국어 32종, sizes는 영문 label과 숫자 범위가 혼재하므로 영문/한국어 color alias와 size range-aware normalization 필요 |
| 2026-09-02 | Search input | required/preferred defaults·가격 범위·string arrays·controlled tags·review signal validation과 Responses function calling용 strict JSON schema 구현 |
| 2026-09-02 | Hard filter | category·가격은 SQLite에서 처리하고 color·size는 공통 normalization으로 known mismatch만 제외; missing factual value는 unknown 후보 유지 |
| 2026-09-02 | Color/size normalization | `black↔검정/블랙/흑청/블랙청`, 기타 색상 group과 복합 색상 처리; `M↔M(27~28)`, 숫자 단일값과 `26~28`, `55-66` 범위 교차 match 검증 |
| 2026-09-02 | Retrieval | hard match가 15개 초과일 때만 확정 weights 적용; score 내림차순·가격 오름차순·product ID 오름차순 tie-break, unknown review 무감점 |
| 2026-09-02 | Compact DTO | factual name/brand/category/price/colors/sizes/sizeGuide/material과 enrichment만 포함; image/source URL·raw description/reviews·내부 score 제외 |
| 2026-09-02 | 실제 DB office-black | SQL 40 → required color의 known mismatch 제외 후 34 → retrieval 15; 최종 15개 모두 실제 black alias 색상 보유 및 10만원 이하 확인 |
| 2026-09-02 | 실제 DB size-28 | hard match 20 → retrieval 15; 모든 후보의 실제 판매 숫자 범위에 28 포함 확인 |
| 2026-09-02 | 실제 DB appearance | hard match 40 → retrieval 15; `appearanceMatch=similar`인 2개가 선두에 배치됨 확인 |
| 2026-09-02 | no-result | 1천원 이하 조건에서 hard match 0, candidates 0 정상 반환 |
| 2026-09-02 | DTO 크기 표본 | 15 candidates 기준 JSON 약 19~22KB, raw review 406개 미포함, structured reviewer note 보존 |
| 2026-09-02 | inspect race 재검증 | local `db:build`와 inspect 병렬 실행 시 DB 교체 순간 0건을 읽은 뒤 build 완료 후 순차 재실행에서 40→34→15 정상; Render는 build 완료 후 start하므로 운영 경로 영향 없음 |
| 2026-09-02 | 최종 자동 검증 | `npm test` — 39 tests, 39 passed; `npm run build`, `npm run db:build`, `git diff --check` 통과 |
| 2026-09-02 | 사용자 표본 검증 | office-black·size-28·appearance-similar·no-result의 후보 수·순서·필수 조건·review signal에 이상 없음 확인 |
| 2026-09-02 | 구현 commit | `0c349d9 feat: add deterministic product search` — Search 코드·테스트·eval·inspection CLI와 완료 상태 로그 포함 |
| 2026-09-02 | GitHub push | Phase 5 구현 및 완료 상태 로그 commit을 `origin/main`에 push |

### 사용자 수동 작업

- 구현 전 계정·환경변수·Render 작업 없음.
- 구현 후 대표 required/preferred 조건에서 후보 순서·누락·최대 15개와 factual DTO를 표본 검증한다.
- Phase 5에서는 OpenAI API 호출과 비용이 없다.

### Blocker / 미해결

- Phase 5 blocker 없음.

### 다음 작업

1. push 후 Render build와 외부 health를 확인한다.
2. Phase 6 Agent 시작 전 OpenAI 호출 수·비용·사용자 작업과 구현 범위를 안내한다.

## Phase 6 — Agent

### 목표

- `gpt-5.6-sol`과 Responses API function calling으로 자연어 조건을 `search_products`에 연결한다.
- 최대 15개 실제 후보에서 1~3개를 선택하고 추천 이유·후기 evidence·concern·자동 comparison을 strict structured output으로 반환한다.
- 추천·comparison ID를 서버에서 검증하고 factual product 정보는 DB에서 결합한다.
- clarification·recommendation·no_result 응답과 `previous_response_id` 대화를 지원한다.
- 공개 `/api/chat`의 입력 크기와 IP별 요청 수를 제한한다.

### 체크리스트

- [x] Phase 6 구현 범위·호출 흐름·예상 비용 안내
- [x] 공개 `/api/chat` 보호 방식 결정
- [x] Render `OPENAI_API_KEY` 등록 — 값은 확인하거나 기록하지 않음
- [x] 요청 제한·OpenAI retry 운영 한도 확정
- [x] Agent instructions·AI runtime config 구현
- [x] `search_products` tool executor와 최대 3회 tool loop 구현
- [x] final structured output·response type parsing 구현
- [x] factual merge·candidate/recommendation/comparison 검증 구현
- [x] `POST /api/chat`·`previous_response_id` 구현
- [x] mock unit/integration tests
- [x] 실제 API 표본 평가와 사용자 검증
- [x] Render 배포 및 외부 Agent 검증

### 구현 및 검증 기록

| 시각 (KST) | 항목 | 결과 |
|---|---|---|
| 2026-09-02 | Phase 6 시작 | Phase 5 Search와 Render health 정상 상태에서 Agent 구현 시작 |
| 2026-09-02 | OpenAI 계약 확인 | 공식 문서 기준 `gpt-5.6-sol`의 Responses API·function calling·Structured Output·reasoning effort low 지원과 현재 가격 확인 |
| 2026-09-02 | 예상 API 사용 | 일반 검색은 tool call+final 응답 2회, 재검색 시 최대 3회; mock 테스트는 과금 없음, 실제 표본은 실행 전 별도 승인 |
| 2026-09-02 | 공개 API 보호 | 사용자 선택 A — Phase 6에서 IP 기반 rate limit과 입력 크기 제한을 포함하고 Render 실제 검증 진행 |
| 2026-09-02 | Render 준비 | 사용자가 Service 환경변수에 `OPENAI_API_KEY` 등록 완료; secret 값은 repository·로그에 저장하지 않음 |
| 2026-09-02 | 운영 한도 | IP당 10분 10회 + Service 전체 시간당 30회, OpenAI transient retry 최대 1회로 확정 |
| 2026-09-02 | 공개 요청 보호 구현 | `express-rate-limit`으로 IPv4/IPv6 IP당 10분 10회와 Service 전체 시간당 30회, JSON 16KB·message 1,000자 제한 구현; raw IP·query 영구 저장 없음 |
| 2026-09-02 | Agent runtime 구현 | `gpt-5.6-sol` low, strict `search_products`, 최대 3회 Responses loop, `previous_response_id`, clarification·recommendation·no_result output 구현 |
| 2026-09-02 | hallucination guard | 최신 candidate set의 recommendation/comparison ID, machine-checkable evidence, DB factual product merge 검증 구현 |
| 2026-09-02 | mock 자동 검증 | 실제 SQLite를 포함한 자연어→tool call→Search→candidate→추천→factual merge 통합 테스트와 API/rate limit·inspection CLI 테스트 포함 최종 62/62 통과 |
| 2026-09-02 | build·DB | `npm run build` 성공; `npm run db:build`에서 shops=2/products=40/reviews=406/enrichments=40 확인 |
| 2026-09-02 | local production | 실제 DB·환경변수로 서버 기동, `/api/health` 200 및 빈 chat 요청 400 확인; OpenAI 호출 없음 |
| 2026-09-02 | 실제 표본 준비 | `office-black` 고정 평가 CLI 준비; 예상 논리 호출 2회(최대 3회), 사용자 비용 승인 전 실행하지 않음 |
| 2026-09-02 | `office-black` 실제 표본 | 승인 후 `gpt-5.6-sol` 논리 호출 2회 성공, input=2,471/output=352/total=2,823 tokens·약 $0.017; Search SQL 0건으로 잘못된 no_result 반환 |
| 2026-09-02 | 실제 표본 실패 원인 | 저장 응답을 추가 생성 없이 조회해 tool 인자 확인: `required.category="바지"`, maxPrice=100000, colors=["검정"], office·relaxed/wide 해석; DB category `pants`와 불일치 |
| 2026-09-02 | category schema 결함 | strict schema가 category를 임의 문자열로 허용해 한국어→DB canonical value를 강제하지 못함; controlled category vocabulary 결정 후 schema·validation·instructions를 보강하고 재검증 필요 |
| 2026-09-02 | category 계약 결정 | 사용자 선택 A — `pants/top/dress/skirt/outerwear` canonical vocabulary와 한국어 mapping을 schema·validation·Agent instructions에 적용 |
| 2026-09-02 | category 보강 검증 | category enum·서버 validation·한국어 mapping 반영 후 59/59 테스트 통과; `office-black` 재실행에서 SQL 40건→hard filter 34건→candidate 15건으로 검색 정상화 |
| 2026-09-02 | 실제 표본 evidence 차단 | 최종 추천의 `graychic:13254`가 `review_appearance_match` value에 canonical signal이 아닌 값을 반환해 factual validation이 응답을 차단; DB의 실제 signal은 `unknown` |
| 2026-09-02 | evidence 계약 결함 | evidence `type`은 enum이나 `value`가 임의 문자열이어서 type별 canonical value를 Structured Output 단계에서 강제하지 못함; `unknown`을 추천 근거로 허용할지도 함께 결정 필요 |
| 2026-09-02 | evidence 계약 결정 | 사용자 선택 A — type별 nested `anyOf` canonical schema와 서버 이중 검증 적용, `unknown` review signal은 evidence 금지·관련 정보 부족은 `concerns`에 표현 |
| 2026-09-02 | evidence 계약 구현 | category·price·tag·review type은 canonical enum, color·size는 factual match 문자열로 분리; `unknown`은 schema·runtime validation·factual guard에서 차단하고 관련 정보 부족을 concerns로 지시 |
| 2026-09-02 | evidence 보강 자동 검증 | 관련 계약 테스트 14/14, sandbox 외부 전체 테스트 62/62, production build 성공 |
| 2026-09-02 | `office-black` 재검증 | 실제 `gpt-5.6-sol` 호출 2회 성공; SQL 40건→hard filter 34건→candidate 15건, 실제 상품 3개 추천, input=12,939/output=1,203/total=14,142 tokens |
| 2026-09-02 | `unknown` 정책 실제 확인 | 리뷰 0건 상품은 review evidence 없이 정보 부족을 concerns에 표시; 다른 상품의 혼재 사이즈·외관 비교 부재도 concerns에 유지하고 factual merge 검증 통과 |
| 2026-09-02 | `office-black` 사용자 검증 | 사용자가 상품 사실값·후기 근거·concerns·comparison 수동 검증을 완료하고 이상 없음 확인 |
| 2026-09-02 | 실제 eval 범위 결정 | 사용자 선택 A — `vague`와 `no-result`를 실행해 핵심 세 응답 분기만 Phase 6에서 확인하고 나머지는 Phase 8 최종 eval로 이관 |
| 2026-09-02 | `vague` 실제 표본 | 실제 `gpt-5.6-sol` 1회 호출로 검색 없이 clarification 반환: 의류 종류를 예시와 함께 한 문장으로 질문; input=1,644/output=60/total=1,704 tokens |
| 2026-09-02 | `no-result` 실제 표본 | 실제 `gpt-5.6-sol` 2회 호출; SQL·hard filter·candidate 모두 0건, 1천원 required 상한을 임의 완화하지 않고 no_result와 가격 상향 suggestion 반환; input=3,429/output=175/total=3,604 tokens |
| 2026-09-02 | 추가 실제 eval 비용 | 두 표본 합계 input=5,073/output=235/total=5,308 tokens; 공식 uncached 단가 상한 기준 약 $0.025, 실제 청구액은 cache 적용 여부에 따라 더 낮을 수 있음 |
| 2026-09-02 | 세 응답 분기 사용자 검증 | recommendation에 이어 clarification·no_result 실제 출력도 사용자가 수동 확인하고 이상 없음 승인; Phase 6 로컬·실제 API 검증 완료 |
| 2026-09-02 | Render 검증 방식 결정 | 사용자 선택 B — commit/push 후 외부 health와 `office-black`을 실행하며, 예상 논리 호출 2회·앞선 표본 기준 약 $0.076 승인 |
| 2026-09-02 | 배포 전 최종 검증 | 전체 테스트 62/62, production build 성공, deterministic DB rebuild shops=2/products=40/reviews=406/enrichments=40, `git diff --check` 통과; secret 값·raw query 저장 없음 확인 |
| 2026-09-02 | Phase 6 commit/push | `3a5a698 feat: add evidence-based shopping agent`를 GitHub `main`에 push하고 Render 자동 배포 시작 |
| 2026-09-02 | Render route 검증 | 외부 `/api/health` 200, 비용 없는 빈 `/api/chat` 요청 400 `invalid_request`; IP 10/10분·Service 30/시간 rate-limit header 확인 |
| 2026-09-02 | Render `office-black` 전체 경로 | 외부 `/api/chat` 200; required pants·10만원·검정 유지, 실제 후보 3개와 factual DB merge·canonical evidence·unknown concerns·3개 comparison 반환 |
| 2026-09-02 | External frontend | `https://levit-problem-solver.onrender.com/` 200 `text/html` 확인 |
| 2026-09-02 | Phase 6 완료 | Agent DoD, 전체 테스트, 로컬 실제 eval, 사용자 검증, Render 배포와 외부 end-to-end 검증 모두 충족 |

### 사용자 수동 작업

- 구현 전: Render `OPENAI_API_KEY` 등록 완료. 추가 계정 작업 없음.
- 실제 API 표본 실행 전: 호출 수와 예상 비용을 확인하고 실행 승인한다.
- 구현 후: `office-black` 결과의 추천 적합성, 상품 사실값, 후기 근거, concern과 comparison 사용자 검증 완료.
- Phase 6 완료 전: clarification·no_result 표본의 자연스러움과 안전성 사용자 검증 완료.
- 배포 후: 필수 사용자 작업 없음. Render Dashboard에서 implementation commit `3a5a698` 이상 최신 deploy가 Live인지 확인하는 것은 선택 사항.

### Blocker / 미해결

- Phase 6 blocker 없음.

### 다음 작업

1. Phase 7 시작 전 사용자 작업과 UI 구현 범위를 안내한다.
2. 의미 있는 UI·state·interaction 트레이드오프를 사용자에게 결정받는다.
3. 배포 URL에서 end-to-end shopping flow를 구현한다.

## Phase 7 — Frontend

### 목표

- 자연어와 optional 조건을 기존 `/api/chat`에 연결한다.
- clarification·recommendation·no_result와 loading·error 상태를 명확히 표시한다.
- 실제 상품 정보, 조건 적합 이유, 사이즈·핏, 후기 근거, 구매 위험과 자동 비교를 모바일 대응 카드로 제공한다.
- `previousResponseId` 기반 refinement와 `새로 찾기`를 지원한다.

### 체크리스트

- [x] Phase 7 범위와 사용자 작업 사전 안내
- [x] 조건 전달 방식·selector 범위·링크 범위·카드 정보 밀도 결정
- [x] `useReducer` 대화 상태와 `sessionStorage` conversation ID 구현
- [x] 자연어·바지·가격 상한·사이즈 입력 및 명시적 조건 조합
- [x] `/api/chat` client와 timeout·429·conversation error 처리
- [x] 단계형 non-streaming loading 상태
- [x] clarification·recommendation·no_result rendering
- [x] 조건 요약·자동 comparison·반응형 1~3개 Product Card
- [x] 실제 상품·사이즈표·후기 신호·정보 부족·구매 위험 표시
- [x] 이미지·상품명·CTA 외부 링크와 image fallback
- [x] refinement 입력과 conversation reset
- [x] frontend 단위 테스트 및 production build
- [x] 사용자 로컬 UI·모바일·interaction 검증
- [x] commit/push 및 Render frontend·health 검증
- [x] 배포 URL shopping flow readiness 검증

### 구현 및 검증 기록

| 시각 (KST) | 항목 | 결과 |
|---|---|---|
| 2026-09-02 | Phase 7 시작 | 사용자 사전 작업 없음; 실제 UI 평가 전 OpenAI 호출 범위를 별도 승인받기로 하고 mock 자동 검증부터 진행 |
| 2026-09-02 | UI 계약 | DEC-032~035에 따라 부분 외부 링크, 기존 message 계약 조합, pants-only selector, 핵심 정보 상시 노출·긴 사이즈표만 접기로 확정 |
| 2026-09-02 | 상태·API | `useReducer` actions, response ID session 유지, reset, request 취소·110초 timeout·429 retry 안내·오류 mapping 구현 |
| 2026-09-02 | 검색 UI | 자연어와 optional 바지·5/7/10만원 상한·자유 사이즈를 조합하고 선택 조건 우선순위를 Agent message에 명시 |
| 2026-09-02 | 결과 UI | 세 응답 분기, 해석 조건, 자동 비교, 추천 수별 1~3열 카드, factual 정보·후기 3축·unknown·concerns·외부 CTA 구현 |
| 2026-09-02 | 자동 검증 | 신규 frontend pure unit tests 6/6, 전체 회귀 tests 68/68, Vite production build 성공 |
| 2026-09-02 | local production | Express static root 200·health 200 확인; 시각 검증과 OpenAI 호출은 아직 수행하지 않음 |
| 2026-09-02 | 첫 화면 사용자 피드백 | 사용자가 초기 조건 필터를 검색어 입력 이후에 노출하도록 요청; 첫 화면 sidebar·예시 chip을 제거하고 centered search-first layout으로 변경 |
| 2026-09-02 | 실제 UI 요청 관찰 | 사용자의 실수 입력 요청은 server에서 search와 2-round recommendation을 정상 완료(input=10,954/output=1,306/total=12,260 tokens); non-streaming 대기 시간이 무한 로딩처럼 인식됨 |
| 2026-09-02 | loading 피드백 반영 | 단계 메시지와 함께 실제 경과 초·일반적인 20~60초 안내를 표시해 진행 상태를 명확히 함 |
| 2026-09-02 | 결과 밀도 피드백 | 결과 headline 축소·semibold와 비교 코멘트 전환은 즉시 반영; 후속 질문 시 이전 결과 collapse 및 모바일 3개 동시 조망 구조는 사용자 설계 결정 대기 |
| 2026-09-02 | 대화형 결과 표현 | 사용자 메시지를 우측, AI 요약·조건·clarification·no-result를 좌측 말풍선으로 통일하고 상세 상품 목록은 독립 영역으로 유지 |
| 2026-09-02 | 모바일 결과 구조 | DEC-039에 따라 3개 compact summary row와 단일 선택 상세 영역을 구현; refinement 요청 중 이전 결과 fold animation·요약 유지·실패 시 복구를 구현 |
| 2026-09-02 | 결과 accordion 개선 | AI 답변을 14px semibold로 축소하고 선택한 summary card 내부에서 상세를 펼치도록 변경; 상세 최하단에 `카드 접기` control 추가 |
| 2026-09-02 | surface tone 개선 | 검정 배경의 사용자 말풍선·주요 버튼·선택 상태·순위 배지·header mark를 연한 stone 회색과 진한 text 조합으로 변경 |
| 2026-09-02 | UI 회귀 검증 | accordion·14px AI 응답·light gray surface 변경 후 전체 tests 68/68 및 Vite production build 통과; `bg-stone-900/950` 잔존 없음 |
| 2026-09-02 | 상품 summary control 개선 | 세로 `상세`/화살표 표시를 작은 회색 pill 버튼의 가로 `상세보기 ↓`로 변경하고, 확장 시 `상세접기 ↑`로 상태를 명시 |
| 2026-09-02 | 상품 summary control 정렬 | 회전 glyph 대신 실제 `↓`/`↑` 문자를 고정 12px 영역에 중앙 정렬하고 label을 10px로 축소 |
| 2026-09-02 | 배경 gradient 수정 | 38rem 고정 높이 absolute layer로 생긴 절단선을 제거하고, page surface 전체에 고정 반경 radial gradient를 적용해 자연스럽게 투명해지도록 변경 |
| 2026-09-02 | 상품 summary typography 통일 | 사용자 최신 피드백에 따라 `상세보기` label을 제품명과 동일한 14px semibold·stone-950 스타일로 변경하고 중앙 정렬 유지 |
| 2026-09-02 | unknown card 제거 | unknown 후기 signal을 개별 제외하고 모두 unknown이면 후기 섹션 자체를 제외; size guide 부재 안내 box도 숨김 |
| 2026-09-02 | button typography override 수정 | 전역 `button, input { font: inherit; }` shorthand가 Tailwind `text-*`·font weight를 덮어쓰는 원인을 확인하고 `font-family: inherit`로 축소; `상세보기`의 `text-[5px]`를 포함한 component typography가 정상 적용되도록 수정 |
| 2026-09-02 | 외부 이동 CTA 색상 | `상품 보러가기`를 stone gray에서 orange-100 배경·orange-200 border·orange-900 text로 변경하고 hover를 orange-200으로 적용 |
| 2026-09-02 | header AI mark 통일 | header AI logo를 chat avatar와 동일한 orange-600 배경·white text로 변경 |
| 2026-09-02 | UI 피드백 회귀 검증 | 대화형 말풍선·compact summary row·선택 상세·response fold 반영 후 전체 test 68/68 및 Vite production build 통과; 실제 API 재호출 없음 |
| 2026-09-02 | 사용자 최종 UI 조정 | `상세보기` control을 최종 `text-xs`·medium으로 직접 조정한 상태를 확인하고 보존; 사용자가 추가 UI polish는 이후로 미루고 Phase 7 마감을 승인 |
| 2026-09-02 | Phase 7 배포 전 검증 | 전체 tests 68/68, Vite production build, `git diff --check`, `.env` ignore와 repository API key pattern 검사 통과; dependency·DB·Render 설정 변경 없음 |
| 2026-09-02 | Phase 7 구현 commit/push | `eacfeae feat: add conversational shopping frontend`를 GitHub `main`에 push하고 Render 자동 배포 시작 |
| 2026-09-02 | Render static 배포 검증 | 외부 root·`/api/health` 200, 배포 HTML이 local build와 동일한 JS/CSS asset hash를 참조하고 두 asset 200 확인; JS에서 Phase 7 핵심 UI 문구 확인 |
| 2026-09-02 | 배포 후 UI polish 재개 | 사용자 요청으로 Phase 7 완료를 보류; result/user surface white 전환, active CTA orange 전환과 mobile filter 구조 개선안을 결정한 뒤 추가 구현·배포 예정 |
| 2026-09-02 | mobile filter 재설계 | DEC-043~044에 따라 white result/user surface, active orange submit·condition control, implicit pants category, 2열 price select·size input 구조 구현 |
| 2026-09-02 | mobile filter 자동 검증 | 변경 후 전체 tests 68/68, Vite production build 및 `git diff --check` 통과; 실제 API 호출 없음 |
| 2026-09-02 | refinement search 밀도 개선 | 최초 hero search는 유지하고 이후 compact search만 max-w-2xl·단일 border·40px input/button·36px condition control·작은 padding으로 축소해 결과 왼쪽 정렬선에 배치 |
| 2026-09-02 | UI polish 재검증 | mobile filter·white surface·compact refinement 변경 후 frontend tests 6/6, Vite production build 및 `git diff --check` 통과; 실제 API 호출 없음 |
| 2026-09-02 | refinement flow 정리 | 조건 다듬기 heading·form 전체를 max-w-2xl 좌우 중앙 정렬; follow-up에서는 가격·사이즈 UI와 명시 조건 조합을 제거하고 입력 문장만 전송하며 submit 즉시 input clear·실패 시 복구하도록 변경 |
| 2026-09-02 | refinement flow 검증 | frontend tests 6/6, Vite production build 및 `git diff --check` 통과; 첫 검색 조건 계약은 유지하고 실제 API 호출 없음 |
| 2026-09-02 | refinement 노출 시점 수정 | `조건 다듬기` section을 Agent 응답이 준비된 `ready` 상태에서만 렌더링; 최초·후속 loading 및 error 중에는 숨기고 새 결과와 함께 다시 표시 |
| 2026-09-02 | 최종 UI 사용자 승인 | 사용자가 white surface·mobile initial filter·compact centered refinement와 ready-only 노출 상태를 확인하고 현 상태로 반영·마감 승인 |
| 2026-09-02 | UI polish 배포 전 최종 검증 | 전체 tests 68/68, Vite production build, `git diff --check`, `.env` ignore와 frontend/docs API key pattern 검사 통과; 실제 API 호출 없음 |
| 2026-09-02 | 최종 UI polish commit/push | `5cd6559 fix: polish responsive shopping flow`를 GitHub `main`에 push하고 Render 자동 배포 완료 |
| 2026-09-02 | 최종 Render 검증 | 외부 root·health·JS·CSS 모두 200; 배포 HTML이 최종 local build asset `index-Clo5HmW8.js`·`index-DiSw_hRj.css`를 참조하고 bundle에서 새 조건·refinement 문구 확인 |
| 2026-09-02 | Phase 7 완료 | 사용자 로컬 실제 flow·UI 승인, 68/68 tests, production build, frontend/API contract와 최종 Render asset 검증으로 DoD 충족; 중복 비용을 피하기 위해 배포 `/api/chat` 재호출은 생략하고 Phase 8의 7개 이상 external eval에 통합 |

### 사용자 수동 작업

- 구현 전: 필수 작업 없음. Render key와 Service는 준비 완료.
- 로컬 검증 전: 실제 UI API 호출 범위와 예상 비용을 확인하고 승인한다.
- 구현 후: desktop/mobile, 검색·clarification·refinement·reset, 상품 정보·이미지·링크·정보 부족 표시 사용자 검증 완료.
- Phase 7 완료 후 필수 사용자 작업 없음. 배포 화면 육안 재확인은 선택 사항.
- Phase 8 실제 eval 전: 평가 query 수·예상 OpenAI 비용을 확인하고 실행 승인 필요.

### Blocker / 미해결

- Phase 7 blocker 없음.

### 다음 작업

1. Phase 8 시작 전 사용자 작업·최종 검증 범위·실제 eval 비용을 안내한다.
2. 7개 이상 eval query 범위와 실행 방식을 사용자에게 결정받는다.
3. 링크·이미지·mobile·error·hallucination·README·secret·Git·Render 최종 검증을 수행한다.

## Phase 8 — Final Validation / Polish

### 목표

- 새 기능을 최소화하고 실제 상품·UI·Agent·배포·문서·repository를 최종 검증한다.
- 7개 이상 실제 eval로 recommendation·clarification·no-result·refinement와 hallucination 방지를 확인한다.
- README와 최종 제출 상태를 정리한다.

### 체크리스트

- [x] Phase 8 범위와 사용자 작업 사전 안내
- [x] 실제 eval query 수·실행 환경·비용 결정
- [x] 실제 상품 링크·이미지 전수 검사
- [ ] mobile·loading·error 최종 검사
- [x] 7개 이상 실제 Agent eval 및 hallucination/factual audit
- [x] README 완성
- [x] `.env`·secret·Git status·commit history 검사
- [ ] Render 최종 재검증
- [ ] 사용자 collaborator 초대
- [ ] 최종 commit/push 및 사용자 승인

### 구현 및 검증 기록

| 시각 (KST) | 항목 | 결과 |
|---|---|---|
| 2026-09-03 | Phase 8 시작 | 사용자 진행 승인; 즉시 필요한 사용자 작업 없음, 실제 eval 전 범위·비용 승인과 종료 전 collaborator 초대가 필요함을 사전 안내 |
| 2026-09-03 | 기존 eval 자산 점검 | `eval/cases.json` 4개 case, `scripts/inspectAgent.js` 6개 case 확인; 최종 DoD의 7개 이상과 refinement를 충족하려면 case 확대 필요 |
| 2026-09-03 | 실제 eval 범위 확정 | 사용자 A안 승인; Render에서 독립 case 7개와 conversation follow-up 1개를 순차 실행하고 client-side 재시도는 하지 않기로 결정 |
| 2026-09-03 | eval 자동화 사전 검증 | 정확히 8개 요청만 허용하는 guarded runner, response type·hard filter·URL·comparison·public factual evidence audit 구현; 관련 4/4 tests 및 전체 71/71 tests·build 통과 |
| 2026-09-03 | Render 실제 Agent eval | 논리 요청 8/8 실행, recommendation 6·clarification 1·no-result 1 및 conversation follow-up 1; 자동 audit 8/8, 수동 의미 audit 8/8 통과, HTTP 오류·timeout 0건 |
| 2026-09-03 | hallucination/factual audit | public response에서 독립 검증 가능한 evidence 53/53 일치; 전체 124개 evidence는 server candidate factual validation을 통과, case별 판정과 상품 ID를 `docs/EVAL_REPORT.md`에 기록 |
| 2026-09-03 | 상품 link·image 전수 검사 | `npm run catalog:validate` — raw 상품 40개 page 40/40, image 40/40이 HTTP 성공·HTTPS 최종 URL·expected content type 통과 |
| 2026-09-03 | README 보강 | live demo, 문제·설문 한계·MVP·flow·architecture·crawler/data/Agent·hallucination 방지·결정·평가·난점·한계·개선·setup 문서화 |
| 2026-09-03 | browser 자동 검증 시도 | 연결 가능한 browser backend가 없어 mobile 시각 검증을 자동 수행하지 못함; source/test 검증 후 사용자 수동 확인 항목으로 유지 |
| 2026-09-03 | secret·repository 검사 | local `.env` 존재·Git ignore 확인, tracked `.env`·DB·dist·checkpoint 0건, API key pattern이 있는 tracked file 0건, `.env.example`은 빈 placeholder 유지 |
| 2026-09-03 | Git 상태·history 검사 | Phase 0~7 문제 해결 순서가 commit history에 유지됨을 확인; Phase 8 변경 파일만 working tree에 있으며 `git diff --check` 통과 |
| 2026-09-03 | Phase 8 최종 local 회귀 | `npm test` 71/71, `npm run build` 성공, `git diff --check` 통과 |
| 2026-09-03 | catalog 확장 요청 | 사용자 요청으로 쇼핑몰을 총 10개로 늘리고 `pants` 외 대부분의 의류를 검색 가능하게 하는 후속 범위 검토 시작; mobile·세부 UI 최종 판단은 확장 이후로 보류 |
| 2026-09-03 | catalog 확장 범위 결정 | 사용자 `1A / 2A / 3A` 선택; 5개 category·Cafe24 10개 shop·약 500개 상품을 목표로 하며 Phase 8 local commit 후 별도 Phase 9에서 구현 |
| 2026-09-03 | Phase 8 local 기준선 | `0f19ef5 test: add final validation tooling and report` commit 완료; 사용자 선택에 따라 push하지 않아 Render 배포는 발생하지 않음 |

### 사용자 수동 작업

- 실제 eval 전: query 수·실행 환경·예상 OpenAI 비용 확인 및 A안 실행 승인 완료.
- 최종 검증 중: mobile·loading·error 결과는 사용자 지시에 따라 catalog 확장 이후로 보류한다.
- 종료 전: 지정 GitHub 계정을 repository collaborator로 초대한다.

### Blocker / 미해결

- 자동 browser backend가 없어 mobile·loading·error 시각 검증은 사용자 확인이 필요.
- collaborator로 초대할 지정 GitHub 계정 정보와 초대 완료 확인이 필요.
- catalog 확장 범위 결정 완료. 신규 8개 shop 후보와 category URL·공개 review 접근성을 실제 조사해야 함.

### 다음 작업

1. catalog 확장 범위를 사용자와 확정하고 후속 Phase의 DoD를 기록한다.
2. 현재 검증 완료분의 commit 기준선을 확정한다.
3. 10개 shop 후보 조사·parser 표본 검증 후 product/review/enrichment/DB/search/UI를 순서대로 확장한다.

## Phase 9 — Multi-shop / Multi-category Catalog Expansion

### 목표

- Cafe24 여성 의류몰을 기존 2개에서 총 10개로 확대한다.
- `pants`, `top`, `dress`, `skirt`, `outerwear`를 검색 가능한 canonical category로 제공한다.
- 쇼핑몰·category별 약 10개 상품을 수집해 기존 40개를 포함한 약 500개, 최대 예상 520개 catalog를 구성한다.
- 상품당 최근 review 최대 20개와 factual field·enrichment·SQLite 관계를 보존한다.
- category가 확장되어도 hard filter, 최대 15개 retrieval candidate, 최대 3개 factual recommendation 계약을 유지한다.
- mobile·세부 UI polish는 하지 않고 multi-category 검색에 필요한 최소 기능만 연결한다.

### 범위

- 포함: 여성용 바지, 상의, 원피스, 스커트, 아우터
- 제외: 신발, 가방, 액세서리, 주얼리, 속옷, 생활용품
- platform: Cafe24만 사용
- source 조건: 공개 HTTP로 상품과 review를 안정적으로 수집할 수 있는 shop만 채택
- 저장 구조: shop/category별 raw JSON, 전체 enrichment JSON, deterministic SQLite build
- 기존 그레이시크·아이팜므 바지 40개와 review/enrichment는 보존

### 실행 단계

#### 9A — Shop Discovery / Contract

- [x] 신규 Cafe24 여성 의류몰 후보 조사
- [x] 5개 category URL과 상품 수 확인
- [x] 상품 상세 public HTTP·robots 정책 확인
- [x] native Cafe24 또는 공개 review JSON 접근성 확인
- [x] 최종 신규 8개 shop 사용자 승인

### 9A 후보 조사 결과

| 신규 후보 | 공식 domain | category 번호 (`pants/top/dress/skirt/outerwear`) | 상품·option 표본 | review source | 판정 |
|---|---|---|---|---|---|
| 리리앤코 | `ririnco.com` | `57/55/53/62/56` | 5개 category 각 10개 discovery, 공통 상품 parser 성공 | Crema widget 68 공개 JSON; 리뷰 있는 상품 `23361`에서 HTTP 200·2건 확인 | 채택 제안 |
| 안나앤플러스 | `annanplus.co.kr` | `43/28/44/44/26` | 5개 category 각 10개 discovery, 공통 상품 parser 성공 | Crema widget 2 공개 JSON; 상품 `8004` HTTP 200·189건 | 채택 제안 |
| 시크라인 | `chic-line.com` | `78/69/26/77/28` | 5개 category 각 10개 discovery, 공통 상품 parser 성공 | 상품 상세의 native Cafe24 review HTML; 상품 `8721`에 5개 행·평점·날짜 노출 | 채택 제안 |
| 핫핑 | `hotping.co.kr` | `279/29/26/535/27` | 5개 category 각 10개 discovery; option selector override 필요 | Crema widget 162 공개 JSON; 상품 `33009` HTTP 200·339건 | 채택 제안 |
| 커먼유니크 | `common-unique.com` | `28/26/29/29/27` | 5개 category 각 10개 discovery, 공통 상품 parser 성공 | Crema widget 2 공개 JSON; 상품 `31948` HTTP 200·107건 | 채택 제안 |
| 도드리 | `dodry.net` | `70/29/34/168/93` | category-specific `a.prdImg`/`a.name` override로 수집 가능 | Crema widget 4 공개 JSON; 상품 `36402` HTTP 200·969건 | 채택 제안 |
| 메이빈스 | `maybins.com` | `12/4/7/224/55` | `anchorBoxName` selector와 category URL로 수집 가능 | Crema widget 6 공개 JSON; 상품 `31915` HTTP 200·1,029건 | 채택 제안 |
| 배드다이어리 | `baddiary.com` | `48/42/24/49/25` | 5개 category 각 10개 discovery; 상품 `24713` 필수 field·size·color 성공 | 상품 상세의 Snap/native static review HTML; 상품 `24457`에 38건·리뷰 행 노출 | 채택 제안 |

- 모든 제안 후보의 homepage에서 Cafe24 marker를 확인했고 `robots.txt`에 `/product` 차단 규칙이 없었다.
- 레미떼는 5개 category와 상품 parsing은 가능하지만 Crema endpoint가 HTTP 500이고 상품별 native 후기 게시판에도 실제 리뷰가 없어 제외했다.
- 시크라인·배드다이어리는 기존 그레이시크 전용 selector를 그대로 쓸 수 없으므로 9B에서 PII를 제외하는 범용 Cafe24 static review adapter로 일반화한다.
- 안나앤플러스와 커먼유니크는 원피스·스커트가 같은 상위 category URL을 공유하므로 9B에서 상품명 기반 category split을 적용한다.
- 이번 9A 조사는 공개 페이지와 review endpoint를 읽기 전용으로 확인했으며 OpenAI API 호출은 없었다.

#### 9B — Multi-category Crawler Pilot

- [x] shop config를 5개 canonical category로 일반화
- [x] category별 discovery와 오분류 방지 규칙 구현
- [x] review adapter 재사용·필요 최소 override 구현
- [x] 신규 shop/category별 소량 fixture·실페이지 parser 검증
- [x] PII 제외·상품당 review 최대 20개 회귀 테스트

### 9B 구현 및 검증 기록

| 시각 (KST) | 항목 | 결과 |
|---|---|---|
| 2026-09-03 | shop/category config | 기존 2개와 신규 8개, 총 10개 shop 모두 `pants/top/dress/skirt/outerwear` URL·category별 상품명 filter 구성 |
| 2026-09-03 | discovery 일반화 | shop 기본 selector에 category override를 병합하고 image-only anchor는 주변 상품 card text로 판별; category 밖 추천상품 오분류 방지 |
| 2026-09-03 | option parser | 본상품 option만 사용하고 Hotping·Dodry의 복합 `색상/사이즈` 표시값을 분리; add-product option 오염 방지 |
| 2026-09-03 | 상품명 fallback | `og:title`이 shop 이름뿐인 Dodry는 JSON-LD Product name으로 복구 |
| 2026-09-03 | review adapter | Graychic 전용 parser를 범용 Cafe24 table/Snap static HTML adapter로 일반화; Crema 7개 shop adapter 재사용 |
| 2026-09-03 | 첫 실페이지 pilot | 50개 category 상품·10개 review source 요청은 성공했으나 category 밖 추천상품과 Dodry generic name 문제 발견 |
| 2026-09-03 | 수정 후 실페이지 pilot | 10 shops × 5 categories = 50/50 상품 parse 성공, 10/10 review source 성공, PII key 0건 |
| 2026-09-03 | discovery coverage | 50/50 category에서 현재 filter 기준 상품 후보 각각 10개 확보, shortfall 0건 |
| 2026-09-03 | category 중복 사전 집계 | 500개 category slot 중 고유 상품 490개·중복 slot 10개(2%); Maybins 1, Baddiary 1, Ririnco 5, Hotping 3이며 나머지 6개 shop은 0 |
| 2026-09-03 | review contract | static/Crema 모두 최대 20개 제한, author identifier 제외, `reviewCount >= reviews.length` 검증 |
| 2026-09-03 | 전체 자동 테스트 | 권한 있는 localhost 환경에서 `npm test` — 81/81 passed |
| 2026-09-03 | production build | `npm run build` — Vite production build 성공 |

### 9B 변경 파일

- `crawler/config/shops.js`
- `crawler/lib/discover-product-urls.js`
- `crawler/lib/crawl-shop.js`
- `crawler/lib/parse-cafe24-product.js`
- `crawler/lib/parse-reviews.js`
- `crawler/lib/crawl-reviews.js`
- `crawler/test/discover-product-urls.test.js`
- `crawler/test/parse-cafe24-product.test.js`
- `crawler/test/parse-reviews.test.js`
- `crawler/test/crawl-reviews.test.js`
- `crawler/test/shop-config.test.js`

#### 9C — Full Crawl

- [x] shop/category별 약 10개 상품 수집
- [x] raw product/review schema와 중복·category 정합성 검증
- [x] 전체 상품 page/image 전수 검사
- [x] shop/category별 coverage 보고 및 사용자 검증 — 자동 보고 완료, DEC-051에 따라 별도 수동 검사 생략

### 9C 구현 및 검증 기록

| 시각 (KST) | 항목 | 결과 |
|---|---|---|
| 2026-09-03 | full crawl orchestration | shop 10곳을 domain별 병렬·shop 내부 category 순차 처리; `pants → top → dress → skirt → outerwear` 선점 순서, 중복 제외·후속 후보 보충, category별 원자적 저장과 `--resume` 구현 |
| 2026-09-03 | 기존 데이터 보존 | `graychic-pants.json`, `ifemme-pants.json` 각 20개는 재수집 없이 보존하고 나머지 48개 shop/category 파일 신규 생성 |
| 2026-09-03 | 전체 수집 결과 | 50 collections, 520 unique products, 3,798 reviews; category별 `pants 120`, 나머지 각 100개; review는 상품당 최대 20개 |
| 2026-09-03 | factual field coverage | review 보유 상품 318/520, size 426/520, color 481/520, text size guide 118/520; source에 없는 값은 DEC-025에 따라 추론하지 않고 빈 배열/null 유지 |
| 2026-09-03 | 도드리 image 결함 수정 | 도드리의 homepage `og:image`를 상품 이미지로 오인한 문제 발견; root URL을 제외하고 실제 `.keyImg`/`.BigImage`를 쓰도록 parser 수정 후 도드리 50개만 재수집 |
| 2026-09-03 | raw contract | 50/50 expected files, 520/520 globally unique `(shopId, sourceProductId)`, category·수량·review 최대치·PII 제외 계약 통과 |
| 2026-09-03 | 전체 page/image 검사 | `npm run catalog:validate` — product page 520/520, image 520/520이 HTTP 성공·HTTPS 최종 URL·expected content type 통과 |
| 2026-09-03 | 전체 자동 테스트 | 권한 있는 localhost 환경에서 `npm test` — 84/84 passed |
| 2026-09-03 | production build | `npm run build` — Vite production build 성공 |
| 2026-09-03 | whitespace 검사 | `git diff --check` 통과 |

### 9C shop별 coverage

| Shop | 상품 | 수집 review | review 보유 상품 | size 보유 | color 보유 | text size guide 보유 |
|---|---:|---:|---:|---:|---:|---:|
| 그레이시크 | 60 | 763 | 53 | 60 | 48 | 60 |
| 아이팜므 | 60 | 448 | 34 | 26 | 42 | 0 |
| 리리앤코 | 50 | 3 | 2 | 50 | 50 | 0 |
| 안나앤플러스 | 50 | 494 | 30 | 50 | 50 | 6 |
| 시크라인 | 50 | 125 | 30 | 50 | 50 | 0 |
| 핫핑 | 50 | 811 | 44 | 46 | 48 | 0 |
| 커먼유니크 | 50 | 225 | 23 | 20 | 50 | 0 |
| 도드리 | 50 | 451 | 40 | 43 | 43 | 0 |
| 메이빈스 | 50 | 320 | 39 | 50 | 50 | 2 |
| 배드다이어리 | 50 | 158 | 23 | 31 | 50 | 50 |
| **합계** | **520** | **3,798** | **318** | **426** | **481** | **118** |

### 9C 변경 파일

- `crawler/cli/crawl-catalog.js`
- `crawler/lib/crawl-catalog.js`
- `crawler/lib/crawl-shop.js`
- `crawler/lib/discover-product-urls.js`
- `crawler/lib/parse-cafe24-product.js`
- `crawler/test/crawl-catalog.test.js`
- `crawler/test/raw-products.test.js`
- `scripts/validateCatalogAssets.js`
- `scripts/buildDatabase.test.js`
- `server/products/searchProducts.integration.test.js`
- `package.json`
- `data/raw/*.json` — 총 50개 collection

#### 9D — Enrichment

- [x] 신규 10개 상품 표본 dry-run·실행 비용 승인
- [x] 10개 표본 GPT-5.6 Luna enrichment·사용량 측정
- [x] 전체 신규 상품 호출 수·예상 비용 재산정 및 사용자 승인
- [x] checkpoint/resume 기반 전체 enrichment
- [x] controlled vocabulary·review signal·unknown 계약 검증

### 9D 준비 및 dry-run 기록

| 시각 (KST) | 항목 | 결과 |
|---|---|---|
| 2026-09-03 | 표본 구성 | 10 shops를 각각 1개씩 포함하고 5 categories를 각각 2개씩 포함; review 0건·소량·20건, size/guide 유무를 섞은 신규 상품 10개 확정 후보 |
| 2026-09-03 | 표본 dry-run | 논리 API 호출 10회, 저장 review 133개, prompt 총 60,816 characters/88,226 UTF-8 bytes; API 호출·과금·파일 변경 없음 |
| 2026-09-03 | 전체 신규 입력 규모 | 기존 enrichment 40개를 제외한 신규 480개·저장 review 3,392개·prompt 약 2.08M characters/3.04M UTF-8 bytes |
| 2026-09-03 | 공식 가격 재확인 | OpenAI Docs 기준 `gpt-5.6-luna` 1M text tokens당 input $0.20, cached input $0.02, output $1.20 |
| 2026-09-03 | 표본 안전 실행 준비 | 기존 40개 `products.json`을 덮어쓰지 않는 `.preview` 출력, checkpoint별 누적 API token usage 집계와 회귀 테스트 9/9 구현; API key 존재만 확인하고 값은 출력하지 않음 |
| 2026-09-03 | 실제 표본 실행 | 승인된 `gpt-5.6-luna` 10회 모두 성공; input 29,898/output 4,519/total 34,417 tokens, 공식 단가 기준 약 $0.0114 |
| 2026-09-03 | 표본 계약 검증 | preview 10개·고유 ID 10개, model·prompt v2·review count·controlled vocabulary·structured profile·no-review unknown 계약 오류 0건 |
| 2026-09-03 | 전체 비용 재산정 | 사용자 승인대로 표본 10개를 재사용하므로 남은 logical call 470회; 표본 평균 단순 환산 약 $0.536, review 수가 표본보다 적은 전체 분포를 고려한 예상 $0.35~$0.55, 안전 여유 포함 $0.75 예산 제안 |
| 2026-09-03 | full merge 경로 검증 | 기존 output·표본 seed를 중복 없이 보존하고 missing product만 호출하는 atomic merge 구현; 관련 test 11/11, full dry-run에서 `preserved=50`에 해당하는 missing 470개·review 3,259개 확인 |
| 2026-09-03 | 전체 신규 실행 | 승인된 missing 470회 모두 성공; input 1,032,103/output 182,930/total 1,215,033 tokens, 약 $0.4259; 표본 포함 Phase 9D 총 약 $0.4373 |
| 2026-09-03 | atomic merge | 기존 40개+표본 10개+missing 470개를 `data/enriched/products.json` 520개로 원자적 교체하고 checkpoint 제거; raw와 missing/extra 0건 |
| 2026-09-03 | 전체 계약 검증 | enrichment 520개·고유 ID 520개, model·prompt·controlled vocabulary·review count·structured profile·no-review unknown 계약 통과 |
| 2026-09-03 | signal coverage | appearance `unknown 432/different 21/similar 49/mixed 18`; size `unknown 322/true_to_size 31/runs_small 9/runs_large 42/mixed 116`; material `unknown 277/positive 112/negative 11/mixed 120` |
| 2026-09-03 | no-review/profile | review 0개 상품 202개에서 세 signal 모두 `unknown`; structured evidence 기반 similar reviewer note 총 334개 |
| 2026-09-03 | 전체 회귀 | `npm test` 85/85, `npm run build`, secret pattern 0건, `git diff --check` 통과 |

#### 9E — DB / Search / Agent

- [x] deterministic DB rebuild와 shop/product/review/enrichment relation 검증
- [x] 5개 category별 hard filter·retrieval integration test
- [x] category별 no-result·recommendation factual audit
- [x] 확장 catalog 기준 eval case와 보고서 갱신

### 9E 구현 및 검증 기록

| 시각 (KST) | 항목 | 결과 |
|---|---|---|
| 2026-09-03 | 유사 조건 정책 | DEC-055 B안 반영; 일반 색상 표현은 soft preference, `꼭/무조건/정확히/~만`은 required로 구분하고 현재 허용 관계는 `white → ivory/cream` 하나로 제한 |
| 2026-09-03 | Agent 재검색 지침 | 정확한 white 후보가 3개 미만이면 required 조건을 보존한 채 `white+ivory+cream`으로 한 번 재검색하고, exact white 우선·대체 색상 사용 사실을 최종 한국어 message에 명시하도록 보강 |
| 2026-09-03 | 3-round mock 회귀 | 첫 white soft 검색 → ivory/cream 포함 재검색 → factual cream 상품 추천·완화 고지 흐름 통과; 최신 candidate 밖 추천과 허위 color evidence 차단 계약 유지 |
| 2026-09-03 | 5-category 실제 DB 검색 | `pants 120`, `top/dress/skirt/outerwear 각 100`; category별 10 shops 전체 coverage, hard-filter match count와 top 15 candidate category 정합성 통과 |
| 2026-09-03 | 전체 회귀 | 권한 허용 환경에서 `npm test` 86/86, `npm run build`, `git diff --check` 통과; 샌드박스 최초 실행의 4건 실패는 localhost bind `EPERM`이며 코드 실패가 아님 |
| 2026-09-03 | 실제 자연스러움 eval 비용 기준 | OpenAI Docs의 `gpt-5.6-sol` 공식 단가 input $4/1M·cached input $0.40/1M·output $20/1M 재확인; 첫 local batch의 규모·안전 예산 사용자 승인 대기, 아직 실제 호출 없음 |
| 2026-09-03 | 자연스러움 batch 1 승인 | 사용자 A안 선택; local 독립 case 20개, 예상 $1.30~$2.00·안전 예산 $2.50, 원문 임시 저장 조건으로 실행 승인 |
| 2026-09-03 | 자연스러움 batch 1 실행 | 20/20 요청, 19개 완료 응답; canonical alias audit 수정 후 19/19 통과, `평소 66` 1건은 허위 `all_season` evidence를 서버가 차단 |
| 2026-09-03 | batch 1 사용량·비용 | 완료 응답 input 223,504/output 19,744/total 243,248 tokens, 약 $1.2889; 실패 요청 $0.35 reserve 포함 보수적 상한 $1.6389로 승인 $2.50 이내 |
| 2026-09-03 | batch 1 보정 | color audit를 canonical alias 기준으로 수정, exact tag evidence 자기검사·`all_season` 추론 금지·Markdown 금지 지침 추가, `agent.failed` usage와 무계측 오류 reserve 구현 |
| 2026-09-03 | 보정 후 전체 회귀 | `npm test` 93/93, `npm run build`, `git diff --check`, tracked source secret pattern 0건 통과; 추가 API 호출 없음 |
| 2026-09-03 | 실패 case targeted retry | 사용자 A안으로 `comfortable-size-66-pants` 1건을 안전 예산 $0.35로 재실행; recommendation·factual audit 통과, Markdown 0건, input 12,934/output 1,387 tokens, 약 $0.0795 |
| 2026-09-03 | batch 1 최종 | 최신 고유 case 20/20 통과; 성공 응답 누적 약 $1.3684, 최초 실패 $0.35 reserve 포함 보수적 상한 $1.7184로 승인 $2.50 이내 |
| 2026-09-03 | Phase 9E 최종 회귀 | 5개 category 각각 1천원 이하 검색 0건 계약 추가; `npm test` 94/94, production build와 `git diff --check` 통과, 9E 완료 |

#### 9F — Minimal Frontend Enablement

- [x] `pants` 자동 강제 제거
- [x] 자연어 category 해석과 최소 category 선택 UI 연결
- [x] desktop 중심 multi-category 검색 flow 검증
- [x] mobile·세부 visual polish는 Phase 9 이후 사용자 판단으로 유지

### 9F 구현 및 검증 기록

| 시각 (KST) | 항목 | 결과 |
|---|---|---|
| 2026-09-03 | Phase 9F 시작 | 사용자 진행 승인; 즉시 필요한 외부 작업 없음, 실제 API 호출·배포 없음; 첫 검색의 고정 `pants` condition과 바지 전용 copy 확인 |
| 2026-09-03 | 기존 follow-up 계약 | compact refinement는 category·price·size를 다시 붙이지 않고 대화 문장만 전송하므로 기존 동작 유지 가능 |
| 2026-09-03 | optional category UI | DEC-058에 따라 첫 문장 입력 후 `AI가 문장에서 판단` 기본값과 바지·상의·원피스·스커트·아우터 select 제공; mobile에서는 category 전체 폭, 가격·사이즈 2열 유지 |
| 2026-09-03 | query 계약 | 고정 `카테고리=바지` 제거; 직접 선택한 canonical category만 한국어 필수 조건으로 추가하고 미선택 시 원문만 Agent에 전달 |
| 2026-09-03 | 범용 copy·label | hero·badge·validation·hint를 여성 의류 전체 표현으로 변경하고 결과 criteria/evidence에서 5개 category 한국어 label 지원 |
| 2026-09-03 | frontend 자동 검증 | 관련 tests 7/7, 전체 `npm test` 95/95, `npm run build`, `git diff --check` 통과; 실제 API 호출 없음 |
| 2026-09-03 | browser 검증 시도 | Browser runtime에 연결 가능한 browser가 0개라 자동 desktop 시각 검증 불가; 제가 시작한 임시 dev process만 종료하고 기존 사용자 5173/3000 process는 보존, 사용자 화면 확인 대기 |
| 2026-09-03 | 사용자 desktop 검증 | 범용 첫 화면, 입력 후 optional category·가격·사이즈 노출, 5개 category 선택, multi-category 결과와 filter 없는 follow-up flow에 이상 없음 확인 |
| 2026-09-03 | Phase 9 완료 | 9A~9F DoD 충족; 10 shops·520 products·3,798 reviews·520 enrichments, 자연스러움 eval 20/20, optional multi-category UI와 전체 95/95 test 기준 완료 |

### 9F 변경 파일

- `client/src/features/shopping/SearchInput.jsx`
- `client/src/features/shopping/query.js`
- `client/src/features/shopping/query.test.js`
- `client/src/features/shopping/ShoppingAgent.jsx`
- `client/src/features/shopping/RecommendationResult.jsx`
- `client/src/components/ProductCard.jsx`

### 사용자 수동 작업

- 구현 전 즉시 필요한 작업 없음.
- 9A 후: 제안된 신규 8개 shop과 source 조사 결과를 검토·승인한다.
- 9C 후: DEC-051에 따라 별도 원본 수동 검사를 생략했다.
- 9D 전: 10개 표본 실제 호출과 재사용 정책, 이후 전체 enrichment의 호출 수·예상 비용을 각각 승인한다.
- 9F 후: local desktop에서 첫 화면·조건 노출·optional category와 follow-up UI를 확인한다. mobile 세부 평가는 보류한다.
- 종료 전: commit/push와 Render 배포 시점을 승인하고 배포 UI를 확인한다.

### Blocker / 미해결

- 9C blocker 없음. 초기 두 shop과 동일한 공통 수집·정규화 로직 및 자동 전수 검증 결과를 사용자가 승인해 완료 처리했다.
- 리리앤코는 현재 진열 상위 50개 중 review가 있는 상품이 원피스 2개뿐이며 총 3건이다. review source 호출 자체는 성공했고 없는 review를 생성하지 않는 정책을 유지했다.
- 일부 상품의 size/color/size guide는 source HTML에 factual text가 없어 빈 배열/null이다. 9D enrichment에서도 해당 값을 추론하지 않는다.
- 실제 local `data/products.db`는 10 shops·520 products·3,798 reviews·520 enrichments로 rebuild했고 integrity `ok`를 확인했다.
- Phase 9D blocker 없음. 승인 예산 $0.75 이내인 총 약 $0.4373로 신규 480개 enrichment를 완료했다.
- Phase 9F 자동 browser backend가 없어 desktop 시각 검증은 사용자 확인이 필요하다.
- Phase 9 blocker 없음. desktop은 사용자가 확인했고 mobile·세부 visual polish는 기능 결함이 아닌 후속 작업으로 Phase 10에 분리했다.

### 다음 작업

1. Phase 9 변경 전체의 commit/push 시점을 사용자에게 확인한다.
2. Render 배포 후 520개 catalog build와 외부 multi-category 검색을 검증한다.
3. Phase 10 시작 전 mobile·desktop UI/UX polish 범위와 우선순위를 사용자에게 결정받는다.

## Phase 10 — UI/UX Final Polish

### 목표

- 검색과 추천 결과의 정보 위계·간격·상호작용을 mobile과 desktop에서 최종 정리한다.
- factual recommendation과 상세 정보 계약은 유지하면서 비교와 판단에 드는 시각적 부담을 줄인다.

### 체크리스트

- [x] Phase 10 시작 및 첫 polish 범위 확정
- [x] 독립된 `후보 간 핵심 차이` 섹션 제거
- [x] 비교 내용을 해당 상품 카드 아래의 간단한 비카드 코멘트로 이동
- [x] 관련 자동 테스트와 production build 검증
- [x] 상품 표시명 정리 formatter와 적용 위치 구현
- [x] 상품 표시명 단위 테스트·전체 회귀·production build 검증
- [x] 상세보기 mouse click 후 잔류 focus highlight 제거
- [x] 상세보기 시 thumbnail 확대·접기 원복 animation 구현 및 build 검증
- [x] 짧은 화면에서 안내 footer를 viewport 바닥에 배치
- [x] 빈 첫 검색창 focus 시 조건 필터 노출·focus 이동 유지 구현 및 검증
- [x] 중복되는 첫 화면 header badge 제거
- [x] focus 상태별 검색 안내 정정·빈 오류 공간 제거
- [x] 상세보기 chip 축소·label fade animation 구현 및 검증
- [x] link·button·details의 focus-visible 표현 통일 및 검증
- [x] 첫 검색·후속 질문 action을 입력창 우측 원형 화살표로 통일
- [x] 36px black action·빈 query 숨김·오른쪽 등장 animation 적용 및 검증
- [x] 검색창 고정·우측 내부 action overlay 적용 및 검증
- [x] 검증된 실측 사이즈 원문을 반응형 HTML table로 렌더링
- [x] 오수집 `sizeGuideText` 정리·crawler 재수집 차단·DB rebuild
- [x] reviewer 식별정보가 포함된 Git 이력 정리와 Render 재배포 확인
- [ ] 사용자 화면 검증
- [ ] 남은 mobile·desktop polish 항목 우선순위 확정

### 구현 및 검증 기록

| 시각 (KST) | 항목 | 결과 |
|---|---|---|
| 2026-09-03 | Phase 10 시작 | 사용자 요청으로 비교 정보 배치를 첫 polish 항목으로 시작; 구현 전 외부 작업·API 호출 없음 |
| 2026-09-03 | 비교 코멘트 배치 | DEC-059에 따라 기존 독립 섹션과 제목을 제거하고 `productId`로 연결된 `bestFor`·`tradeoff`를 각 상품 카드 바로 아래의 비카드 한 줄 코멘트로 이동 |
| 2026-09-03 | 자동 검증 | 최초 sandbox 실행은 localhost bind 제한으로 서버 test 4건만 `EPERM`; 권한 허용 재실행에서 전체 `npm test` 95/95, `npm run build`, `git diff --check` 통과 |
| 2026-09-03 | 시각 검증 시도 | 연결 가능한 Browser가 0개라 자동 local 화면 검증은 수행하지 못했으며 사용자 화면 확인 대기 |
| 2026-09-03 | 상품명 사전 감사 | raw 520개 기준 길이 `min 9/p50 30/p75 56/p90 123/p95 190/max 253`; 선행 홍보 태그와 후행 괄호·쉼표 SEO keyword가 긴 이름의 주원인임을 확인 |
| 2026-09-03 | 표시 규칙 승인 | DEC-060의 표시 전용 정리와 28자 제한을 사용자 승인; source data·API 계약·AI 호출은 변경하지 않음 |
| 2026-09-03 | formatter 구현 | 모든 위치의 `[]`·`【】` tag와 짧은 `()` 부가 문구를 제거하고, 3개 이상 `-` 항목 또는 40자 이상인 긴 괄호 SEO block은 그 지점 이후를 제외; 정리 후 28자를 넘는 경우만 `…` 처리 |
| 2026-09-03 | 520개 전수 검사 | 변경 437개·28자 말줄임 20개; 빈 표시명·28자 초과·괄호 잔존 각 0건 |
| 2026-09-03 | 상품명 자동 검증 | 신규 formatter test 3/3, 전체 `npm test` 98/98, `npm run build`, `git diff --check` 통과 |
| 2026-09-03 | 상세 toggle focus 수정 | mouse로 `상세보기 → 상세접기` 후 `focus:ring`이 남는 현상을 `focus-visible:ring`으로 변경; keyboard focus ring은 유지 |
| 2026-09-03 | 비교 코멘트 장식 제거 | 사용자 피드백에 따라 카드 아래 코멘트의 `ㄴ` prefix를 제거하고 `bestFor · 다만 tradeoff` 본문만 유지 |
| 2026-09-03 | 이미지 확대 방식 승인 | DEC-061의 반응형 확대 크기와 300ms animation을 사용자 승인; 이미지 중복 추가 없이 기존 thumbnail과 grid column을 확대하는 방식 확정 |
| 2026-09-03 | 이미지 확대 구현·검증 | 펼침 상태에서 mobile `7rem`, desktop `9rem`, 접힘 상태에서 `4rem/4.5rem` grid column을 사용하고 300ms ease-out 적용; production build에서 양쪽 grid class·transition·reduced-motion CSS 생성 및 `git diff --check` 통과 |
| 2026-09-03 | footer 바닥 배치 | page root를 `min-h-screen` flex column으로 전환하고 footer에 `mt-auto`를 적용; 짧은 화면에서는 viewport 하단, 긴 결과에서는 콘텐츠 다음에 배치되며 fixed overlay는 사용하지 않음 |
| 2026-09-03 | flex 너비 회귀 수정 | root flex 전환 후 `mx-auto` header가 content width로 축소된 회귀를 확인; header·첫 화면·결과 영역에 `w-full`을 명시해 기존 max-width layout을 복원하고 footer 바닥 배치는 유지 |
| 2026-09-03 | hero 보조 문구 제거 | 사용자 피드백에 따라 첫 화면의 `Search less. Decide better.` 영문 eyebrow를 제거하고 한국어 질문 제목부터 바로 노출 |
| 2026-09-03 | hero 보조 문구 복원 | 사용자 최신 결정으로 `당신을 위한 쇼핑 도우미입니다`를 작은 orange·tight tracking 문구로 제목 위에 추가; 중간 제안 문구는 미반영 |
| 2026-09-03 | 조건 필터 노출 방식 확정 | DEC-063에 따라 첫 검색 form의 focus-within·query·선택값을 기준으로 optional filter visibility를 계산; 빈 query에서도 focus만으로 노출하며 compact follow-up은 제외 |
| 2026-09-03 | focus 필터 구현·검증 | form `onFocusCapture/onBlurCapture`로 내부 focus 이동 시 필터를 유지하고 외부 이동 시 빈 form만 접음; query test 4/4, 전체 `npm test` 99/99, production build와 `git diff --check` 통과 |
| 2026-09-03 | header badge 제거 | DEC-064에 따라 검색 전 우측 정보 badge를 제거하고 `hasConversation`일 때만 `새로 찾기` button을 렌더링 |
| 2026-09-03 | 검색 안내 개선안 | 사용자 위임에 따라 filter-only 제출은 허용하지 않고 자연어 필수를 유지; focus 전에는 filter 발견 방법, 빈 query로 filter가 열린 뒤에는 검색어 필요성을 안내하고 validation이 없을 때 빈 영역을 제거 |
| 2026-09-03 | 상세 toggle 축소안 | 사용자 지시에 따라 펼침 시 `상세보기` text를 fade-out/max-width 0으로 전환하고 button width를 `5.25rem→2rem`으로 축소; 접근성 이름은 `상세 접기`로 전환 |
| 2026-09-03 | 상세 toggle 방향 수정 | 사용자 피드백에 따라 접힘 상태는 `↓`, 펼침 상태의 축소 chip은 접기를 나타내는 `↑`로 표시 |
| 2026-09-03 | focus 표현 통일 | DEC-066에 따라 header actions·검색 submit·상품 image/name link·상세 toggle·외부 이동·카드 접기·size guide summary를 `focus-visible` ring으로 정리; input/select의 editing focus는 유지 |
| 2026-09-03 | 후속 polish 검증 | 관련 query test 4/4, 전체 `npm test` 99/99, production build와 `git diff --check` 통과; build CSS에서 width/padding transition·label max-width/opacity·focus-visible selector 생성 확인 |
| 2026-09-03 | commit/push 승인 | 사용자가 현재 Phase 10 UI 변경 전체의 commit과 `main` push를 요청; push 후 Render 자동 배포와 실제 mobile 확인 예정 |
| 2026-09-03 | 검색 action 재구성 | DEC-067에 따라 SearchInput의 query와 원형 action을 단일 flex row로 묶고 optional filter grid를 아래 row로 분리; main `48px`, compact `40px`, loading spinner·aria-label 구성 |
| 2026-09-03 | 검색 action 자동 검증 | query/filter 관련 test 4/4, production build와 `git diff --check` 통과; 실제 mobile 시각 검증과 새 변경 commit/push는 대기 |
| 2026-09-03 | action visual 재정의 | DEC-068에 따라 main/compact 공통 `size-9`, `bg-black`, borderless, white arrow로 통일; `hasQuery || loading`일 때만 렌더링하고 200ms translateX·scale·opacity entrance 적용 |
| 2026-09-03 | action visual 검증 | query 관련 test 4/4, production build와 `git diff --check` 통과; compiled CSS에서 36px size·black/white color·`submit-action-enter` keyframe 생성 확인 |
| 2026-09-03 | action 내부 배치 | DEC-069에 따라 query row를 relative container로 전환하고 input `w-full`·`pr-12`를 상시 적용; action은 `absolute right-1.5 inset-y-0 my-auto`로 중앙 배치해 등장 전후 검색창 크기를 고정 |
| 2026-09-03 | 내부 action build 검증 | production build와 `git diff --check` 통과; compiled CSS에서 absolute position·right 6px·right padding 48px·entrance keyframe 생성 확인 |
| 2026-09-03 | 최종 polish push 승인 | 사용자가 현재 UI 수준을 MVP 마감선으로 승인하고 화살표 검색 action 변경의 commit/push 요청; Render 배포 후 mobile smoke check만 대기 |
| 2026-09-03 | hero 영문 원복 | 한글 문구 확인 후 사용자 최신 지시로 최초 `Search less. Decide better.`와 uppercase·wide tracking style을 복원 |
| 2026-09-03 | 사이즈표 개선 시작 | raw 520개 감사 결과 non-null 118개 중 Graychic 실측표 60개, 무관한 아동 국제 사이즈표 50개, 상품 설명 6개, reviewer 식별정보가 섞인 후기 2개 확인; DEC-070 전체 범위를 사용자 승인받아 구현 시작 |
| 2026-09-03 | strict size guide parser | circled header·일반 HTML table·판매 option size·row별 치수 개수를 deterministic하게 교차 검증하고 front/back 총장 표기만 한 cell로 병합; 실제 raw 기준 Graychic 60/60 통과, 오수집 58/58 거부 |
| 2026-09-03 | 사이즈표 UI | 검증 성공 시에만 `details` 내부의 semantic `table`로 표시; `caption`·column/row scope·keyboard focus를 제공하고 mobile은 horizontal scroll과 sticky size column 적용, raw text fallback은 제거 |
| 2026-09-03 | crawler·raw 정리 | product parser가 strict 검증을 통과한 후보만 저장하도록 변경; 9개 raw file의 오수집 58개를 `null` 처리해 non-null 60개 전부 parseable 상태로 정리 |
| 2026-09-03 | DB rebuild | `npm run db:build` 후 10 shops·520 products·3,798 reviews·520 enrichments 유지, `npm run db:inspect` integrity `ok` 확인 |
| 2026-09-03 | 사이즈표 자동 검증 | parser/crawler 신규 test 포함 전체 `npm test` 103/103, `npm run build`, `git diff --check` 통과; 최초 sandbox 4건은 localhost bind `EPERM`이었고 권한 허용 재실행에서 통과 |
| 2026-09-03 | 사이즈표 시각 검증 시도 | Browser runtime에 연결 가능한 browser가 0개라 자동 시각 검증 불가; 제가 실행한 임시 dev process는 종료했으며 source/build 검증은 완료 |
| 2026-09-03 | Git history 개인정보 정리 | 구현 commit을 기준으로 `main` 23개 commit을 재작성해 Annanplus·Baddiary·Maybins의 과거 `sizeGuideText` 오수집 blob을 제거; tree 동일성과 정리 문구 부재를 검증한 뒤 `7c57cd0 → cad38b8` force-with-lease push 성공 |
| 2026-09-03 | 임시 history 정리 | 원격 갱신 성공 후 local backup branch·`refs/original`·reflog·unreachable object와 임시 sanitizer를 제거해 로컬에도 이전 reviewer 식별정보 blob을 남기지 않음 |
| 2026-09-03 | Render 배포 검증 | 외부 `/api/health` HTTP 200, local build와 일치하는 JS `index-D1betPbI.js`·CSS `index-DShAUZf1.css` 각각 HTTP 200 확인; 배포 JS에서 `실측 사이즈표` 코드 확인 |

### 변경 파일

- `client/src/features/shopping/RecommendationResult.jsx`
- `client/src/features/shopping/ShoppingAgent.jsx`
- `client/src/features/shopping/productName.js`
- `client/src/features/shopping/productName.test.js`
- `client/src/components/ProductCard.jsx`
- `client/src/components/SizeGuideTable.jsx`
- `shared/sizeGuide.js`
- `shared/sizeGuide.test.js`
- `crawler/lib/parse-cafe24-product.js`
- `crawler/test/parse-cafe24-product.test.js`
- `crawler/test/raw-products.test.js`
- `data/raw/annanplus-{dress,outerwear}.json`
- `data/raw/baddiary-{pants,top,dress,skirt,outerwear}.json`
- `data/raw/maybins-{pants,top}.json`
- `docs/levit_problem_solver_FINAL_PLAN.md`
- `docs/IMPLEMENTATION_STATUS.md`

### 사용자 수동 작업

- 구현 전 작업 없음.
- 사이즈표 구현·데이터 정리·DB rebuild에는 필수 사용자 작업 없음.
- Render 배포 후 사이즈표가 있는 Graychic 상품 상세에서 표 열기와 mobile 가로 스크롤을 선택적으로 확인한다.

### Blocker / 미해결

- 현재 blocker 없음.
- 자동 Browser backend가 없어 실제 위치·간격의 시각 검증은 사용자 확인이 필요하다.
- mobile·desktop의 나머지 visual polish 범위는 이후 사용자 판단으로 확정한다.
- Git history rewrite·GitHub `main` 갱신·Render 재배포 검증까지 완료됐으며 구현 blocker는 없다.

### 다음 작업

1. 사용자가 원하면 실제 Graychic 상품의 표와 mobile 가로 스크롤을 확인한다.
2. 남은 mobile·desktop polish는 사용자 우선순위에 따라 진행한다.

## Phase 0 — Skeleton / Deployment

### 목표

- Node.js 24 기반 단일 root package 구성
- React/Vite/Tailwind frontend 구성
- Express backend와 `GET /api/health` 구성
- production에서 Express가 React build를 static serving
- Render 배포 구성
- 외부 URL에서 화면과 health endpoint 검증

### 체크리스트

- [x] 기존 Git repository와 remote 확인
- [x] 로컬 Node.js 24 확인
- [x] root `package.json` 생성
- [x] React/Vite frontend skeleton 생성
- [x] Tailwind CSS 연결
- [x] Express server 및 health endpoint 생성
- [x] production static serving 구성
- [x] Render Blueprint 설정 추가
- [x] 의존성 설치 및 lockfile 생성
- [x] production build 검증
- [x] local health endpoint 검증
- [x] Render Blueprint Instance 생성 및 commit sync 기록 확인
- [x] Render Web Service 생성 및 deploy 성공 확인
- [x] 외부 Render URL 배포 및 검증

### 현재 결정

- 확정 계획에 따라 root package 하나를 사용한다.
- 개발 환경에서는 Vite가 `/api`를 Express `3000` 포트로 proxy한다.
- production build 결과는 `dist/client`에 생성하고 Express가 직접 제공한다.
- 서비스 이름이 최종 확정되기 전까지 화면에는 설명형 이름 `Shopping Decision Agent`를 사용한다.
- Render 배포는 repository의 `render.yaml`로 재현 가능하게 구성한다.

### 검증 기록

| 시각 (KST) | 항목 | 결과 |
|---|---|---|
| 2026-09-01 | 저장소 초기 상태 | 계획서와 README만 존재 |
| 2026-09-01 | Node runtime | `v24.18.0` 확인 |
| 2026-09-01 | Git remote | GitHub `origin` 연결 확인 |
| 2026-09-01 | npm install | 124 packages, 취약점 0개 |
| 2026-09-01 | production build | Vite `v8.2.2`, build 성공 |
| 2026-09-01 | production server | React HTML static serving 성공 |
| 2026-09-01 | health API | `200 {"status":"ok","service":"levit-problem-solver"}` |
| 2026-09-01 | development server | Vite `5173` + Express `3000` 동시 실행 성공 |
| 2026-09-01 | development proxy | `5173/api/health` 응답 성공 |
| 2026-09-01 | GitHub 인증 | `smilechild7`, HTTPS, `repo` scope 정상 확인 |
| 2026-09-01 | Render Blueprint | Blueprint `levit-ps`에서 commit `ba22d5d` sync 및 `Create web service levit-problem-solver` 작업 표시 확인; 실제 생성/배포 결과는 미확인 |
| 2026-09-01 | Render initial deploy | Service `srv-dabatkijnfac73a9efr0`, `ba22d5d`, build exit 127로 실패; build 환경의 `NODE_ENV=production`으로 Vite devDependency가 생략된 것이 원인으로 판단 |
| 2026-09-01 | Render build 수정 검증 | `NODE_ENV` 미지정 상태에서 clean `npm ci` 및 production build 성공 |
| 2026-09-01 | Render fix deploy | Commit `b6eb54a` 자동 배포 실패; Blueprint에서 제거한 기존 `NODE_ENV`가 Service 환경변수에 보존됐을 가능성 확인 필요 |
| 2026-09-01 | Render deploy | Service 환경변수 정리 후 `b6eb54a` 배포 성공 |
| 2026-09-01 | External frontend | `https://levit-problem-solver.onrender.com/` HTTP 200, React HTML 및 JS/CSS asset HTTP 200 |
| 2026-09-01 | External health API | `/api/health` HTTP 200, `{"status":"ok","service":"levit-problem-solver"}` 확인 |

### Blocker / 미해결

- Phase 0 blocker 없음.

### 다음 작업

1. Phase 1 사용자 사전 작업과 검증 항목 안내
2. Phase 1 대상 Cafe24 쇼핑몰 선정
3. 첫 상품 category 선정
4. Cafe24 Product Crawler 구현 시작

## 변경 이력

| 날짜 (KST) | 변경 |
|---|---|
| 2026-09-01 | 상태 로그 생성, Phase 0 시작 |
| 2026-09-01 | 로컬 skeleton, build, static serving, health API 검증 완료 |
| 2026-09-01 | GitHub 인증 및 Render 접근 상태를 외부 배포 blocker로 기록 |
| 2026-09-01 | `AGENT.md` 생성, 사용자 결정 및 상태 로그 관리 절차 확정 |
| 2026-09-01 | Phase 실행 전후 사용자 수동 작업 안내 규칙 추가 |
| 2026-09-01 | GitHub 인증 복구 확인, Phase 0 문서/구현 커밋 분리 결정 |
| 2026-09-01 | Render Blueprint Instance와 sync 기록 확인; Web Service 생성/배포 여부는 상세 결과 확인 대기 |
| 2026-09-01 | Render Web Service 생성 확인, initial deploy build exit 127 실패 기록 |
| 2026-09-01 | DEC-005에 따라 Blueprint의 `NODE_ENV` 제거, Render runtime 기본값 사용 결정 |
| 2026-09-01 | Render와 동일한 clean install/build 조건에서 수정사항 검증 성공 |
| 2026-09-01 | Commit `b6eb54a` Render 배포 실패, 기존 Service 환경변수 보존 가능성 기록 |
| 2026-09-01 | Render Service의 persisted `NODE_ENV` 제거 후 배포 성공 |
| 2026-09-01 | 외부 frontend, static assets, health API 검증 통과; Phase 0 완료 |
| 2026-09-01 | Phase 0 완료 로그는 Phase 1 첫 커밋에 포함하기로 결정 |
| 2026-09-01 | 남은 이틀은 DoD 우선 방식으로 실행하기로 결정, Phase 1 시작 전 대기 |
| 2026-09-02 | `.env` 준비·ignore 및 OpenAI model 사용 가능 확인, Phase 1 쇼핑몰 후보 조사 방식 확정 |
| 2026-09-02 | 첫 검증 데이터는 `pants` 10개로 통일하고 상의는 parser 안정화 후 추가하기로 결정 |
| 2026-09-02 | Cafe24 후보 사전 조사 완료: 그레이시크·아이팜므를 우선 후보로 선정하고 최종 사용자 승인 대기 |
| 2026-09-02 | Phase 1 대상 쇼핑몰을 그레이시크·아이팜므로 확정, HTML parser dependency 결정 대기 |
| 2026-09-02 | 설문 원본 22명·유효 응답 21명 기준으로 최종 계획서 갱신; 사이즈·핏 factual data와 자동 비교 요약을 MVP 계약에 반영 |
| 2026-09-02 | `cheerio` dependency 사용 승인, Phase 1 공통 parser 및 수집 pipeline 구현 시작 |
| 2026-09-02 | 갱신 계획 재검산 완료; Phase 1의 `sizes`·nullable `sizeGuideText` 수집 기준을 확인하고 dependency 설치 전 재개 대기 |
| 2026-09-02 | Cafe24 공통 crawler와 두 쇼핑몰 config 구현, 각 10개 실제 상품 raw JSON 생성 |
| 2026-09-02 | 리뷰 표의 치수표 오인 오류를 수정하고 fixture·raw schema test와 production build 통과; 사용자 표본 검증 대기 |
| 2026-09-02 | 사용자 표본 검증 이상 없음 확인; Phase 1 DoD 충족 및 완료 처리 |
| 2026-09-02 | 사용자 요청으로 Phase 1을 다시 열고 쇼핑몰별 바지 상품을 20개로 확대 시작 |
| 2026-09-02 | 쇼핑몰별 20개, 총 40개 수집과 자동 검증 완료; 추가 상품 사용자 표본 확인 대기 |
| 2026-09-02 | 확대 후 사용자 표본 검증 이상 없음 확인; 쇼핑몰별 20개 기준 Phase 1 완료 처리 |
| 2026-09-02 | Phase 2는 그레이시크와 아이팜므 모두 상품당 최대 20개 리뷰를 수집하기로 확정하고 구조 조사 시작 |
| 2026-09-02 | 그레이시크 서버 HTML과 아이팜므 Crema 공개 JSON API 구조 확인; Playwright 없이 두 source parser 및 PII 제외 테스트 구현 |
| 2026-09-02 | 두 쇼핑몰 40개 상품에서 실제 리뷰 406개 수집, raw schema·PII 제외·자동 테스트·production build 검증 완료; 사용자 표본 검증 대기 |
| 2026-09-02 | 사용자 실제 리뷰 표본 검증 완료; Phase 2 DoD 충족 및 완료 처리 |
| 2026-09-02 | DEC-016에 따라 raw JSON 기반 deterministic SQLite rebuild 방식으로 Phase 3 시작 |
| 2026-09-02 | migration·DB build·raw import·repository·Render build 연결 구현; 2 shops·40 products·406 reviews와 14/14 tests 검증, 사용자 반복 build 확인 대기 |
| 2026-09-02 | 사용자 DB build 검증 완료; Phase 3 DoD 충족 및 완료 처리 |
| 2026-09-02 | Phase 1~3의 4개 local commit을 GitHub main에 push하고 Render 새 build·external frontend·health 정상 확인 |
| 2026-09-03 | Phase 9 9A 조사 완료: 8개 신규 Cafe24 후보의 5개 category·상품 parser·robots·공개 review source를 확인하고, review 접근이 실패한 레미떼를 배드다이어리로 교체 제안 |
| 2026-09-03 | 사용자 선택 A로 신규 8개 shop을 확정하고 DEC-049 기록; Phase 9B multi-category crawler pilot 시작 |
| 2026-09-03 | Phase 9B 완료: 10개 shop/5개 category config, category-aware discovery, 복합 option parser, 범용 Cafe24 static review adapter 구현; 실페이지 50/50·review 10/10·전체 test 81/81·build 통과 |
| 2026-09-03 | 사용자 선택 A로 단일 category·고정 순서 중복 제거·후속 후보 보충 정책을 DEC-050으로 확정하고 Phase 9C 전체 crawl 시작 |
| 2026-09-03 | Phase 9C 전체 crawl 완료: 기존 바지 40개 보존, 48개 신규 collection 생성, 총 10 shops·50 collections·520 unique products·3,798 reviews 확보 |
| 2026-09-03 | 도드리 homepage `og:image` 오인 결함을 수정하고 50개 상품을 재수집; raw contract 520/520, page/image 전수 검사 520/520, 전체 test 84/84, production build 통과 |
| 2026-09-03 | 사용자 최신 지시로 Phase 9C 별도 수동 검사를 생략하고 자동 검증 결과를 승인해 9C 완료; actual local DB는 아직 기존 40 products 상태임을 확인 |
| 2026-09-03 | 사용자 선택 A로 신규 480개 enrichment 후 실제 DB를 한 번 rebuild하기로 DEC-052 확정; Phase 9D 10개 표본 dry-run 준비 시작 |
| 2026-09-03 | Phase 9D 신규 표본 10개 dry-run 완료: 10 shops·category별 2개, review 133개, 논리 호출 10회·prompt 60,816 characters; 실제 API 호출·비용 없음 |
| 2026-09-03 | 사용자 선택 A로 신규 표본 10개 실제 호출과 정상 결과 재사용 승인; 기존 enrichment를 보호하는 preview output·usage 집계 검증 후 실행 준비 완료 |
| 2026-09-03 | Phase 9D 표본 10개 실제 호출·계약 검증 완료: input 29,898/output 4,519 tokens, 약 $0.0114; 남은 470회 예상 $0.35~$0.55 및 $0.75 안전 예산 승인 대기 |
| 2026-09-03 | 사용자 선택 A로 남은 470회 전체 실행 승인; 기존 40+표본 10 보존·missing-only merge test와 dry-run 통과 후 순차 checkpoint 실행 시작 |
| 2026-09-03 | Phase 9D 전체 enrichment 완료: 남은 470/470회 성공, 표본 포함 총 약 $0.4373; enriched 520개 계약·전체 test 85/85·build 통과 후 DB를 10 shops·520 products·3,798 reviews·520 enrichments로 rebuild하고 integrity `ok` 확인 |
| 2026-09-03 | 사용자 선택 B로 Agent 주도 유사 조건 재검색을 DEC-055로 확정; `white → ivory/cream` 3-round mock, 5 category·10 shop 실제 DB 검색, 전체 test 86/86·build 통과 |
| 2026-09-03 | 사용자 선택 A로 자연스러움 batch 1의 20개 local 실제 eval 실행; 19개 완료 응답 audit 통과·1개 factual validation 차단, 보수적 비용 상한 $1.6389 후 prompt·audit·오류 비용 계측 보정 |
| 2026-09-03 | 사용자 선택 A로 실패 1건 targeted retry 실행·통과; 최신 고유 case 20/20과 누적 보수적 비용 상한 $1.7184 확인, Phase 9E 완료 |
| 2026-09-03 | DEC-058 A안 optional category UI 구현 후 전체 test 95/95·build 통과, 사용자 desktop 기능 검증 완료로 Phase 9F와 Phase 9 완료; visual polish는 Phase 10으로 분리 |
| 2026-09-03 | Phase 10 시작; 독립 비교 섹션을 각 추천 상품 아래의 `ㄴ` 핵심 차이 코멘트로 이동 |
| 2026-09-03 | Phase 10 첫 polish 전체 test 95/95·production build 통과; Browser 연결 대상 부재로 사용자 시각 검증 대기 |
| 2026-09-03 | DEC-060 상품 표시명 정리 구현; 520개 전수 검사와 전체 test 98/98·production build 통과, 사용자 시각 검증 대기 |
| 2026-09-03 | 상세보기 toggle의 mouse focus highlight 잔류 수정; keyboard focus-visible 접근성 유지 |
| 2026-09-03 | 상품 아래 핵심 차이 코멘트의 `ㄴ` 장식 제거 |
| 2026-09-03 | DEC-061 상세보기 thumbnail 반응형 확대 animation 구현 시작 |
| 2026-09-03 | 상세보기 thumbnail 확대·접기 원복 animation production build 검증 완료; 사용자 시각 확인 대기 |
| 2026-09-03 | 안내 footer sticky-footer 구조 적용; 짧은 페이지 viewport 하단·긴 페이지 콘텐츠 다음 배치 |
| 2026-09-03 | sticky-footer 적용으로 축소된 header·본문 폭에 `w-full`을 명시해 기존 layout 복원 |
| 2026-09-03 | 첫 화면의 불필요한 영문 hero 보조 문구 제거 |
| 2026-09-03 | DEC-062에 따라 한글 hero 보조 문구 `당신을 위한 쇼핑 도우미입니다`로 복원 |
| 2026-09-03 | 사용자 최신 피드백으로 hero 보조 문구와 typography를 최초 영문 상태로 원복 |
| 2026-09-03 | DEC-063 빈 첫 검색창 focus 기반 category·price·size 노출 구현 시작 |
| 2026-09-03 | focus 기반 조건 필터 노출 구현 완료; 관련 4/4·전체 99/99 tests와 production build 통과 |
| 2026-09-03 | DEC-064 첫 화면의 중복 `실제 여성 의류 상품 검색` header badge 제거 |
| 2026-09-03 | DEC-065 검색 안내·빈 validation 공간·상세보기 축소 animation polish 시작 |
| 2026-09-03 | DEC-066 mouse highlight 잔류 방지와 keyboard focus 보존을 위한 interactive focus-visible 통일 시작 |
| 2026-09-03 | DEC-065~066 검색 안내·빈 validation 공간·상세 toggle 축소·focus-visible 구현 완료; 전체 99/99 tests·build 통과, 사용자 시각 검증 대기 |
| 2026-09-03 | 사용자 요청으로 현재 Phase 10 UI 변경 commit/push 및 Render mobile 검증 단계 진입 |
| 2026-09-03 | DEC-067 mobile filter 아래 full-width submit 제거와 채팅형 우측 화살표 action 구현 시작 |
| 2026-09-03 | 첫 검색·후속 질문 우측 원형 화살표 action과 loading spinner 구현·build 검증 완료 |
| 2026-09-03 | DEC-068 36px black/white arrow action과 활성화 entrance animation 구현 시작 |
| 2026-09-03 | DEC-068 action visual 구현·관련 tests/build 검증 완료; local 사용자 시각 확인 대기 |
| 2026-09-03 | DEC-069 검색창 내부 absolute action과 고정 input 폭 적용 시작 |
| 2026-09-03 | 검색창 고정 폭·우측 내부 화살표 action 구현과 production build 검증 완료 |
| 2026-09-03 | 사용자 판단으로 추가 polish를 중단하고 현재 UI를 최종 후보로 push·mobile smoke check 진행 |
| 2026-09-03 | 펼친 상세 toggle의 화살표를 동작 의미에 맞게 `↓→↑`로 수정 |
