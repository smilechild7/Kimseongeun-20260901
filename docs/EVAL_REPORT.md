# Phase 8 Final Agent Evaluation

> 실행일: 2026-09-03 (KST)  
> 대상: `https://levit-problem-solver.onrender.com/api/chat`  
> 평가 데이터: 실제 배포 DB의 40개 상품·406개 리뷰  
> 원문 보존 정책: 전체 응답은 실행 중 시스템 임시 디렉터리에만 저장하고 Git에는 포함하지 않는다.

## 결과 요약

- 논리 요청: 8/8 실행
- 자동 계약·factual audit: 8/8 통과
- 수동 의미 적합성 audit: 8/8 통과
- 응답 분기: recommendation 6, clarification 1, no-result 1
- conversation follow-up: 1/1 통과
- 공개 응답에서 독립 재검증 가능한 evidence: 53/53 일치
- 추천 상품 수: 모든 recommendation이 1~3개 범위 준수
- 중복·HTTP 오류·timeout: 0건
- 전체 순차 실행 시간: 약 127초

승인 당시 비용 추정은 약 $0.45~$0.70이었다. API 응답에는 실제 청구액이 포함되지 않으므로 이 문서는 추정치를 실제 비용처럼 기록하지 않는다. 가격 기준은 [GPT-5.6 Sol 공식 문서](https://developers.openai.com/api/docs/models/gpt-5.6-sol)를 사용했다.

## Case 결과

| Case | 기대 / 실제 | 상품 ID | 자동 | 수동 의미 판정 |
|---|---|---|---|---|
| `office-black-under-100k` | recommendation / recommendation | `graychic:13254`, `graychic:13168`, `graychic:14546` | 통과 | 10만원 이하·검정·출근용·여유핏 반영, 상반된 사이즈 후기도 위험으로 표시 |
| `casual-event` | recommendation / recommendation | `ifemme:33134`, `ifemme:29474`, `graychic:9876` | 통과 | 과하게 포멀하지 않은 casual/minimal 후보와 상품별 소재·외관 위험 제시 |
| `appearance-similar` | recommendation / recommendation | `graychic:14955`, `graychic:14375` | 통과 | `similar` 실제 후기 신호가 있는 2개만 추천하고 근거가 각 1건임을 명시 |
| `relaxed-size-66` | recommendation / recommendation | `graychic:14546`, `graychic:13254`, `graychic:12325` | 통과 | 66을 임의의 판매 사이즈로 확정하지 않고 여유핏·실측·review signal로 비교 |
| `summer-size-28-under-50k` | recommendation / recommendation | `ifemme:29474`, `ifemme:33134`, `ifemme:33169` | 통과 | 5만원·28 포함 판매 옵션·여름 조건 준수; 기장 근거가 약한 후보는 불확실성 명시 |
| `vague-needs-clarification` | clarification / clarification | 없음 | 통과 | 모호한 요청에 상품을 생성하지 않고 의류 종류를 질문 |
| `impossible-budget-no-result` | no-result / no-result | 없음 | 통과 | 1천원 이하 결과가 없음을 알리고 가격 상한 완화 제안 |
| `office-black-evidence-follow-up` | recommendation / recommendation | `graychic:13168`, `graychic:13254` | 통과 | 첫 응답의 조건과 후보를 이어받아 review 근거·여유핏 기준으로 2개 재선정 |

## 자동 판정 범위

모든 case에서 다음을 검사했다.

- HTTP JSON 응답과 기대 response type
- conversation에 필요한 `responseId`
- recommendation의 상품 수 1~3개와 ID 중복 없음
- 상품·이미지 URL의 HTTPS 형식
- category·maximum price hard constraint
- 2개 이상 추천 시 comparison이 모든 추천 상품과 정확히 대응하는지
- public response에 factual 원천이 함께 있는 category·price·color·size·review evidence의 일치

style·occasion·fit·season tag는 public 상품 객체에 중복 노출하지 않으므로 외부 runner에서 2차 재검증할 수 없다. 대신 서버가 DB candidate와 맞지 않는 evidence를 응답 직전에 거부하는 기존 factual validation과 그 회귀 테스트로 전체 124개 evidence를 보호한다.

## 수동 판정 기준과 한계

- 실제 상품 정보가 없는 내용을 확정적으로 말하지 않는가
- review가 없거나 `unknown`이면 추론 대신 정보 부족을 알리는가
- mixed/negative signal을 장점으로 바꾸지 않고 위험으로 보여주는가
- 모호한 요청·0개 결과·후속 대화가 자연스럽게 분기되는가
- 조건의 충족 이유와 후보 간 tradeoff가 읽을 수 있게 구분되는가

이번 평가는 고정된 40개 바지 catalog와 한 번의 비결정적 LLM 실행을 대상으로 한다. 따라서 전체 패션 category나 장기간의 model 변동을 대표하지 않는다. 재실행은 비용과 rate limit을 사용하므로 case 변경과 비용 승인을 먼저 받아야 한다.
