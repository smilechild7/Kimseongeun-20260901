import assert from 'node:assert/strict';
import test from 'node:test';

import { formatProductDisplayName } from './productName.js';

test('removes leading promotional tags and trailing SEO keyword blocks', () => {
  assert.equal(
    formatProductDisplayName(
      '[무료배송] [단정깔끔] [44-120] 베이무아 카라넥 반팔 롱 스커트 (여름-신상-데일리룩) 리리앤코,빅사이즈,하객룩',
    ),
    '베이무아 카라넥 반팔 롱 스커트',
  );
  assert.equal(
    formatProductDisplayName('(2PACK) A. 나엘 투웨이 모달 나시[세트DWE24]'),
    'A. 나엘 투웨이 모달 나시',
  );
  assert.equal(
    formatProductDisplayName(
      '지그재그 하객룩1위🤍 [made] (트위드) 블랙 아모르 퍼프 원피스(S~L)(벨트증정)',
    ),
    '지그재그 하객룩1위🤍 블랙 아모르 퍼프 원피스',
  );
});

test('keeps a short core name and truncates a long one at 28 characters', () => {
  assert.equal(formatProductDisplayName('루시드 와이드 슬랙스'), '루시드 와이드 슬랙스');

  const displayName = formatProductDisplayName(
    '[이벤트] 베이무아 카라넥 반팔 뒷밴딩 롱 스커트 투피스 세트 특별 구성 상품',
  );

  assert.equal([...displayName.slice(0, -1)].length, 28);
  assert.equal(displayName.endsWith('…'), true);
  assert.equal(displayName.includes('[이벤트]'), false);
});

test('uses the original name when cleanup would remove every character', () => {
  assert.equal(formatProductDisplayName('[이벤트]'), '[이벤트]');
  assert.equal(formatProductDisplayName(null), '');
});
