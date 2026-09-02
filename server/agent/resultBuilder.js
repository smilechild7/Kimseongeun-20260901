import { colorsMatch, sizesMatch } from '../products/searchNormalization.js';

function evidenceMatches(candidate, evidence, criteria) {
  switch (evidence.type) {
    case 'category':
      return candidate.category === evidence.value;
    case 'price': {
      const { minPrice, maxPrice } = criteria.required;
      return (
        evidence.value === 'within_required_range' &&
        (minPrice !== null || maxPrice !== null) &&
        (minPrice === null || candidate.price >= minPrice) &&
        (maxPrice === null || candidate.price <= maxPrice)
      );
    }
    case 'color':
      return candidate.colors.some((color) => colorsMatch(color, evidence.value));
    case 'size':
      return candidate.sizes.some((size) => sizesMatch(size, evidence.value));
    case 'style':
      return candidate.styleTags.includes(evidence.value);
    case 'occasion':
      return candidate.occasionTags.includes(evidence.value);
    case 'fit':
      return candidate.fitTags.includes(evidence.value);
    case 'season':
      return candidate.seasonTags.includes(evidence.value);
    case 'review_appearance_match':
      return (
        evidence.value !== 'unknown' &&
        candidate.reviewSummary?.appearanceMatch?.signal === evidence.value
      );
    case 'review_size_fit':
      return (
        evidence.value !== 'unknown' &&
        candidate.reviewSummary?.sizeFit?.signal === evidence.value
      );
    case 'review_material_quality':
      return (
        evidence.value !== 'unknown' &&
        candidate.reviewSummary?.materialQuality?.signal === evidence.value
      );
    default:
      return false;
  }
}

function mergeProduct(candidate, factualProduct, recommendation) {
  return {
    id: factualProduct.id,
    name: factualProduct.name,
    brand: factualProduct.brand,
    shopName: factualProduct.source.shopName,
    category: factualProduct.category,
    price: factualProduct.price,
    imageUrl: factualProduct.imageUrl,
    productUrl: factualProduct.source.productUrl,
    colors: factualProduct.colors,
    sizes: factualProduct.sizes,
    sizeGuideText: factualProduct.sizeGuideText,
    material: factualProduct.material,
    rating: factualProduct.rating,
    reviewCount: factualProduct.reviewCount,
    summary: candidate.summary,
    reviewSummary: candidate.reviewSummary,
    reason: recommendation.reason,
    evidence: recommendation.evidence,
    strengths: recommendation.strengths,
    concerns: recommendation.concerns,
  };
}

export function buildAgentResult({
  output,
  responseId,
  latestSearch,
  repository,
}) {
  if (output.type === 'clarification') {
    return {
      type: 'clarification',
      responseId,
      message: output.message,
    };
  }

  if (!latestSearch) {
    throw new Error(`${output.type} response requires a completed search`);
  }

  if (output.type === 'no_result') {
    return {
      type: 'no_result',
      responseId,
      message: output.message,
      suggestion: output.suggestion,
    };
  }

  const candidatesById = new Map(
    latestSearch.result.candidates.map((candidate) => [candidate.id, candidate]),
  );
  for (const recommendation of output.recommendations) {
    const candidate = candidatesById.get(recommendation.productId);
    if (!candidate) {
      throw new Error(
        `recommended product is outside the latest candidate set: ${recommendation.productId}`,
      );
    }
    for (const evidence of recommendation.evidence) {
      if (!evidenceMatches(candidate, evidence, latestSearch.input)) {
        throw new Error(
          `recommendation evidence does not match candidate: ${recommendation.productId} ${evidence.type}=${evidence.value}`,
        );
      }
    }
  }

  const recommendationIds = output.recommendations.map(({ productId }) => productId);
  for (const comparison of output.comparison) {
    if (!recommendationIds.includes(comparison.productId)) {
      throw new Error(
        `comparison product is outside recommendations: ${comparison.productId}`,
      );
    }
  }

  const factualProducts = repository.getProductsByIds(recommendationIds);
  const factualById = new Map(factualProducts.map((product) => [product.id, product]));
  if (factualById.size !== recommendationIds.length) {
    throw new Error('one or more recommended products are missing from the database');
  }

  return {
    type: 'recommendation',
    responseId,
    message: output.message,
    criteria: {
      required: latestSearch.input.required,
      preferred: latestSearch.input.preferred,
    },
    products: output.recommendations.map((recommendation) =>
      mergeProduct(
        candidatesById.get(recommendation.productId),
        factualById.get(recommendation.productId),
        recommendation,
      ),
    ),
    comparison: output.comparison,
  };
}
