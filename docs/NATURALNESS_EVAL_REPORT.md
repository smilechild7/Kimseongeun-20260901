# Phase 9 Naturalness Evaluation — Batch 1

> 실행일: 2026-09-03 (KST)
> 환경: local `data/products.db`, `gpt-5.6-sol`, reasoning `low`
> 평가 데이터: 10 shops·520 products·3,798 reviews·520 enrichments
> 원문 보존: 전체 API 응답은 macOS 임시 디렉터리에만 저장하고 Git에는 포함하지 않는다.

## 결과 요약

- 고유 평가 case: 20개
- 실제 요청: 20/20, 예산으로 건너뛴 요청 0개
- 완료 응답: 19개
- 수정된 자동 audit: 19/19 통과
- 서버 factual validation 차단: 1개
- 응답 분기: recommendation 16, clarification 1, no-result 2, error 1
- 완료 응답 token: input 223,504 / output 19,744 / total 243,248
- 완료 응답 기준 추정 비용: $1.288896
- 계측되지 않은 실패 요청에 $0.35 안전 reserve를 적용한 보수적 상한: $1.638896
- 승인 안전 예산: $2.50 이내
- 전체 순차 실행 시간: 약 301초

비용은 OpenAI Docs의 `gpt-5.6-sol` 단가인 input $4/1M·output $20/1M을 사용해 계산했다. API 응답은 실제 청구액을 제공하지 않으므로 추정 비용으로만 기록한다.

## 평가 범위

- 5개 category 자연어 해석: 바지·상의·원피스·스커트·아우터
- 일반 화이트 선호와 엄격한 화이트-only 구분
- `white → ivory/cream` AI 주도 재검색과 사용자 고지
- 가격 상한, 숫자·평소 사이즈, 여유 핏, 계절, 출근·하객·캐주얼 문맥
- 사진/실물 유사 및 소재 품질 review evidence
- 불가능한 가격의 no-result와 유용한 완화 제안
- category가 없는 모호한 요청의 clarification
- `윗도리`, `꾸안꾸` 같은 구어체 해석

## 핵심 결과

| Case | 결과 | 판정 |
|---|---|---|
| 일반 `흰색 원피스` | 정확한 white 1개를 우선하고 ivory 2개로 보충, 완화 사실 명시 | 통과 |
| `정확한 화이트만`, ivory/cream 거부 | required white를 유지하고 exact white 1개만 추천 | 통과 |
| 5개 category 검색 | 각 요청의 canonical category와 가격 hard condition 유지 | 통과 |
| review 근거 요청 | 실제 candidate signal과 일치하는 evidence만 응답 | 통과 |
| 1천원 원피스·2천원 아우터 | 상품을 만들지 않고 no-result·가격 완화 제안 | 통과 |
| 모호한 `예쁜 옷` | 상품을 만들지 않고 category clarification | 통과 |
| `꾸안꾸 윗도리` | `top`으로 해석해 1개 추천 | 통과 |
| `평소 66, 편한 바지` | candidate에 없는 `all_season` evidence 생성 시도 | 서버 차단 |

첫 white case는 model이 tool input에 `흰색/아이보리/크림` 한국어 alias를 사용해 최초 audit가 실패했다. 실제 색상 의미와 결과는 정확했으므로 audit를 raw English 문자열이 아닌 기존 canonical color matcher로 수정했고 재판정에서 통과했다.

## 수동 의미 검토

완료된 19개 응답의 message와 추천 상품을 검토했다.

- 화이트 부족과 대체 색상 사용 이유가 자연스럽게 설명됐다.
- 엄격한 색상 요청에서는 unknown·ivory·cream 상품을 제외했다고 명시했다.
- `66`을 판매 사이즈와 무조건 동일시하지 않고 실측·후기 확인 필요성을 알렸다.
- 하객룩, 꾸안꾸, 과하게 포멀하지 않은 옷처럼 정성적 표현을 후보 태그와 정보 부족 범위 안에서 설명했다.
- no-result와 clarification 문장이 짧고 다음 행동을 제시했다.
- 한 응답이 상품명에 Markdown bold를 사용해 plain chat 표현과 어긋났으며, 이후 prompt에 Markdown 금지 지침을 추가했다.
- `white outerwear` 후보 중 상품명이 가디건 블라우스인 상품이 있었다. DB category는 `outerwear`여서 계약 오류는 아니지만 경계 상품의 catalog 분류 품질은 후속 개선 후보로 남긴다.

## 보정 사항

- 한·영 색상 alias를 canonical matcher로 평가하도록 naturalness audit 수정
- final evidence 제출 전 style·occasion·fit·season tag의 candidate 배열 exact 존재 여부를 재확인하도록 Agent 지침 강화
- candidate에 명시되지 않은 `all_season` evidence 사용 금지 명시
- 사용자 노출 텍스트의 Markdown marker 금지
- 성공 이전 factual validation 오류도 `agent.failed` usage event로 집계
- 사용량을 확인할 수 없는 오류는 $0.35 안전 reserve로 비용 처리

## 다음 검증

### Targeted retry

- 사용자 승인: 실패 case 1건, 안전 예산 $0.35
- 결과: recommendation·자동 factual audit 통과
- token: input 12,934 / output 1,387 / total 14,321
- 추정 비용: $0.079476
- Markdown marker: 0건
- 이전 실패 상품의 잘못된 `all_season` evidence: 재발하지 않음
- 다른 추천 상품의 `all_season` evidence는 실제 candidate `seasonTags`에 존재해 서버 검증 통과

Batch 1과 targeted retry를 합친 최신 고유 case 결과는 20/20 통과다. 성공 응답 기준 누적 token은 input 236,438/output 21,131/total 257,569, 누적 추정 비용은 $1.368372다. 최초 실패 요청의 안전 reserve $0.35를 더한 보수적 상한은 $1.718372로 전체 승인 예산 $2.50 이내다.

다음에는 경계 category 상품과 추가 유사 조건 관계를 별도 결정한 후 새 batch에 포함한다.
