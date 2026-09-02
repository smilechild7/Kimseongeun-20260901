import { RETRIEVAL_CONFIG } from '../config/retrieval.js';
import { toCompactProductDto } from './productDto.js';
import { scoreSearchCandidate } from './retrievalScore.js';
import { normalizeSearchInput } from './searchInput.js';
import {
  colorsMatch,
  passesConditionalRequired,
  sizesMatch,
} from './searchNormalization.js';

function passesRequiredProductValues(candidate, required) {
  return (
    passesConditionalRequired(
      candidate.product.colors ?? [],
      required.colors,
      colorsMatch,
    ) &&
    passesConditionalRequired(
      candidate.product.sizes ?? [],
      required.sizes,
      sizesMatch,
    )
  );
}

function retrievalOrder(left, right) {
  return (
    right.score.total - left.score.total ||
    left.candidate.product.price - right.candidate.product.price ||
    left.candidate.product.id.localeCompare(right.candidate.product.id)
  );
}

export function searchProducts(
  input,
  {
    repository,
    config = RETRIEVAL_CONFIG,
    logger = console,
  },
) {
  const normalizedInput = normalizeSearchInput(input);
  const sqlCandidates = repository.findSearchCandidates({
    category: normalizedInput.required.category,
    minPrice: normalizedInput.required.minPrice,
    maxPrice: normalizedInput.required.maxPrice,
  });
  const hardFilterCandidates = sqlCandidates.filter((candidate) =>
    passesRequiredProductValues(candidate, normalizedInput.required),
  );

  let selectedCandidates = hardFilterCandidates;
  if (hardFilterCandidates.length > config.candidateLimit) {
    selectedCandidates = hardFilterCandidates
      .map((candidate) => ({
        candidate,
        score: scoreSearchCandidate(candidate, normalizedInput.preferred, config),
      }))
      .sort(retrievalOrder)
      .slice(0, config.candidateLimit)
      .map(({ candidate }) => candidate);
  }

  logger.log(
    JSON.stringify({
      event: 'search.complete',
      sqlMatches: sqlCandidates.length,
      hardFilterMatches: hardFilterCandidates.length,
      candidates: selectedCandidates.length,
      retrievalApplied: hardFilterCandidates.length > config.candidateLimit,
    }),
  );

  return {
    hardFilterMatchCount: hardFilterCandidates.length,
    candidates: selectedCandidates.map(toCompactProductDto),
  };
}
