import assert from 'node:assert/strict';
import test from 'node:test';

import {
  parseCafe24Reviews,
  parseCremaReviews,
  parseGraychicReviews,
} from '../lib/parse-reviews.js';

test('parses recent Graychic review rows without author information', () => {
  const html = `
    <div id="prdReview"><table>
      <tr class="xans-record-">
        <td>2</td>
        <td direction="left"><a class="xans-board--list-link">
          <span class="sp--mix displaynone">비밀글</span>
          <span class="sp--mix">바지 핏이 편하고 좋아요</span>
          <span class="sp--font">[1]</span>
        </a></td>
        <td class="xans-board--colgroup-point"><img alt="5점"></td>
        <td><span>작성자이름</span></td>
        <td class="xans-board--colgroup-date">2026-09-01 15:18:29</td>
      </tr>
    </table></div>
  `;

  const reviews = parseGraychicReviews(html);

  assert.deepEqual(reviews, [
    {
      rating: 5,
      text: '바지 핏이 편하고 좋아요',
      optionText: null,
      reviewerProfile: {
        heightCm: null,
        weightKg: null,
        usualSize: null,
        ageGroup: null,
      },
      imageUrls: [],
      createdAt: '2026-09-01T15:18:29+09:00',
    },
  ]);
  assert.doesNotMatch(JSON.stringify(reviews), /작성자이름|비밀글/u);
});

test('normalizes Crema review evidence and drops PII and reviews over the limit', () => {
  const sourceReview = (index) => ({
    id: 1000 + index,
    brand_user_id: 500 + index,
    user_display_name: `구매자${index}`,
    score: 4,
    filtered_message: `  실제 리뷰 ${index}\n두 번째 줄  `,
    created_at: '2026-08-10T08:05:54+09:00',
    product_options: [
      { name: 'color', value: '회색' },
      { name: 'size', value: 'M(28~29)' },
    ],
    customer_properties: [
      { name: '키', value: '165cm' },
      { name: '몸무게', value: '58kg' },
      { name: '평소사이즈-상의', value: '66' },
      { name: '평소사이즈-하의', value: '28' },
      { name: '연령대', value: '40대' },
    ],
    images: [
      { url: 'https://assets.example/review.webp' },
      { url: 'javascript:alert(1)' },
    ],
  });
  const payload = {
    reviews: Array.from({ length: 21 }, (_, index) => sourceReview(index + 1)),
  };

  const reviews = parseCremaReviews(payload, { limit: 20 });

  assert.equal(reviews.length, 20);
  assert.deepEqual(reviews[0], {
    rating: 4,
    text: '실제 리뷰 1\n두 번째 줄',
    optionText: 'color: 회색 / size: M(28~29)',
    reviewerProfile: {
      heightCm: 165,
      weightKg: 58,
      usualSize: '28',
      ageGroup: '40대',
    },
    imageUrls: ['https://assets.example/review.webp'],
    createdAt: '2026-08-10T08:05:54+09:00',
  });
  assert.doesNotMatch(
    JSON.stringify(reviews),
    /brand_user_id|user_display_name|구매자1/u,
  );
});

test('parses generic Cafe24 table reviews without author information', () => {
  const html = `
    <div id="prdReview"><table>
      <tr class="xans-record-">
        <td class="subject"><a href="/article/상품리뷰/4/1">사무실에서 잘 입고 있습니다</a></td>
        <td>구매자 이름</td>
        <td class="txtInfo">2026-08-27</td>
        <td><img alt="5점"></td>
      </tr>
    </table></div>
  `;

  const reviews = parseCafe24Reviews(html);

  assert.deepEqual(reviews, [
    {
      rating: 5,
      text: '사무실에서 잘 입고 있습니다',
      optionText: null,
      reviewerProfile: {
        heightCm: null,
        weightKg: null,
        usualSize: null,
        ageGroup: null,
      },
      imageUrls: [],
      createdAt: '2026-08-27T00:00:00+09:00',
    },
  ]);
  assert.doesNotMatch(JSON.stringify(reviews), /구매자 이름/u);
});

test('parses static Snap review summaries and enforces the limit', () => {
  const html = `
    <div id="prdReview"><ul>
      <li class="item xans-record-" data-author="작성자1"><strong class="os">핏이 단정해요</strong></li>
      <li class="item xans-record-" data-author="작성자2"><strong class="os">배송이 빨랐어요</strong></li>
    </ul></div>
  `;

  const reviews = parseCafe24Reviews(html, { limit: 1 });

  assert.equal(reviews.length, 1);
  assert.equal(reviews[0].text, '핏이 단정해요');
  assert.equal(reviews[0].rating, null);
  assert.equal(reviews[0].createdAt, null);
  assert.doesNotMatch(JSON.stringify(reviews), /작성자1/u);
});
