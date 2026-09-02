export function toCompactProductDto({ product, enrichment }) {
  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    category: product.category,
    price: product.price,
    colors: product.colors,
    sizes: product.sizes,
    sizeGuideText: product.sizeGuideText,
    material: product.material,
    summary: enrichment?.summary ?? null,
    styleTags: enrichment?.styleTags ?? [],
    occasionTags: enrichment?.occasionTags ?? [],
    fitTags: enrichment?.fitTags ?? [],
    seasonTags: enrichment?.seasonTags ?? [],
    extraTags: enrichment?.extraTags ?? [],
    reviewSummary: enrichment?.reviewSummary ?? null,
  };
}
