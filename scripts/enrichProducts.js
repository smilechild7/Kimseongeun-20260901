import { mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import OpenAI from 'openai';

import { enrichProduct } from '../crawler/pipeline/enrich.js';
import { AI_CONFIG } from '../server/config/ai.js';

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

export const SAMPLE_PRODUCT_IDS = Object.freeze([
  'graychic:11284',
  'graychic:11135',
  'graychic:15143',
  'ifemme:29474',
  'ifemme:31358',
]);

async function readRawProducts(rawDataDirectory) {
  const fileNames = (await readdir(rawDataDirectory))
    .filter((fileName) => fileName.endsWith('.json'))
    .sort((left, right) => left.localeCompare(right));
  const products = [];

  for (const fileName of fileNames) {
    const value = JSON.parse(
      await readFile(path.join(rawDataDirectory, fileName), 'utf8'),
    );
    if (!Array.isArray(value)) {
      throw new Error(`Expected an array in raw data file: ${fileName}`);
    }
    products.push(...value);
  }

  return products;
}

function productId(product) {
  return `${product.source.shopId}:${product.source.sourceProductId}`;
}

export function parseArguments(argumentsList) {
  const options = {
    dryRun: false,
    limit: null,
    missingOnly: false,
    outputPath: null,
    productIds: null,
    seedPaths: [],
  };

  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];

    if (argument === '--dry-run') {
      options.dryRun = true;
      continue;
    }
    if (argument === '--missing-only') {
      options.missingOnly = true;
      continue;
    }

    const [name, inlineValue] = argument.split('=', 2);
    if (
      name === '--limit' ||
      name === '--product-ids' ||
      name === '--output' ||
      name === '--seed'
    ) {
      const value = inlineValue ?? argumentsList[++index];
      if (!value || value.startsWith('--')) {
        throw new Error(`${name} requires a value`);
      }

      if (name === '--limit') {
        options.limit = Number(value);
        if (!Number.isSafeInteger(options.limit) || options.limit <= 0) {
          throw new Error('--limit must be a positive integer');
        }
      } else if (name === '--product-ids') {
        options.productIds = value.split(',').filter(Boolean);
        if (options.productIds.length === 0) {
          throw new Error('--product-ids requires at least one product ID');
        }
      } else if (name === '--output') {
        options.outputPath = value;
      } else {
        options.seedPaths.push(value);
      }
      continue;
    }

    throw new Error(`Unknown argument: ${argument}`);
  }

  return options;
}

export function selectProducts(products, { productIds, limit }) {
  let selectedProducts = products;

  if (productIds) {
    const productsById = new Map(products.map((product) => [productId(product), product]));
    const missingIds = productIds.filter((id) => !productsById.has(id));
    if (missingIds.length > 0) {
      throw new Error(`Unknown product IDs: ${missingIds.join(', ')}`);
    }
    selectedProducts = productIds.map((id) => productsById.get(id));
  }

  return limit ? selectedProducts.slice(0, limit) : selectedProducts;
}

async function writeJsonAtomically(outputPath, value) {
  await mkdir(path.dirname(outputPath), { recursive: true });
  const temporaryPath = `${outputPath}.${process.pid}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  await rename(temporaryPath, outputPath);
}

async function readEnrichments(filePath, { optional = false } = {}) {
  let value;
  try {
    value = JSON.parse(await readFile(filePath, 'utf8'));
  } catch (error) {
    if (optional && error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }

  if (!Array.isArray(value)) {
    throw new Error(`Expected an enrichment array in ${filePath}`);
  }

  return value;
}

function mergeExistingEnrichments(collections, rawProductIds) {
  const merged = [];
  const seenProductIds = new Set();

  for (const collection of collections) {
    for (const enrichment of collection) {
      const id = enrichment?.productId;

      if (typeof id !== 'string' || !rawProductIds.has(id)) {
        throw new Error(`Enrichment does not match a raw product: ${id ?? 'null'}`);
      }
      if (seenProductIds.has(id)) {
        throw new Error(`Duplicate existing enrichment: ${id}`);
      }

      seenProductIds.add(id);
      merged.push(enrichment);
    }
  }

  return merged;
}

async function readCheckpoint(checkpointPath, selectedProductIds) {
  let checkpoint;
  try {
    checkpoint = JSON.parse(await readFile(checkpointPath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {
        enrichments: [],
        usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      };
    }
    throw error;
  }

  if (
    checkpoint.promptVersion !== AI_CONFIG.enrichment.promptVersion ||
    JSON.stringify(checkpoint.selectedProductIds) !== JSON.stringify(selectedProductIds) ||
    !Array.isArray(checkpoint.enrichments)
  ) {
    throw new Error('Enrichment checkpoint does not match the current run');
  }

  const completedIds = checkpoint.enrichments.map((enrichment) => enrichment.productId);
  if (
    JSON.stringify(completedIds) !==
    JSON.stringify(selectedProductIds.slice(0, completedIds.length))
  ) {
    throw new Error('Enrichment checkpoint is not a valid completed prefix');
  }

  return {
    enrichments: checkpoint.enrichments,
    usage: {
      inputTokens: checkpoint.usage?.inputTokens ?? 0,
      outputTokens: checkpoint.usage?.outputTokens ?? 0,
      totalTokens: checkpoint.usage?.totalTokens ?? 0,
    },
  };
}

function addUsage(total, usage) {
  total.inputTokens += usage.inputTokens;
  total.outputTokens += usage.outputTokens;
  total.totalTokens += usage.totalTokens;
}

export async function runEnrichment({
  options,
  client,
  rawDataDirectory = path.join(repositoryRoot, 'data/raw'),
  outputPath = path.join(repositoryRoot, 'data/enriched/products.json'),
  checkpointPath = `${outputPath}.checkpoint`,
  seedPaths = options.seedPaths ?? [],
  enrich = enrichProduct,
}) {
  const products = await readRawProducts(rawDataDirectory);
  const rawProductIds = new Set(products.map(productId));
  const existingEnrichments = options.missingOnly
    ? mergeExistingEnrichments(
        [
          await readEnrichments(outputPath, { optional: true }),
          ...(await Promise.all(seedPaths.map((seedPath) => readEnrichments(seedPath)))),
        ],
        rawProductIds,
      )
    : [];
  const existingProductIds = new Set(
    existingEnrichments.map((enrichment) => enrichment.productId),
  );
  const selectedProducts = selectProducts(products, options).filter(
    (product) => !existingProductIds.has(productId(product)),
  );
  const summary = {
    selectedProductIds: selectedProducts.map(productId),
    logicalApiCalls: selectedProducts.length,
    savedReviews: selectedProducts.reduce(
      (total, product) => total + (product.reviews?.length ?? 0),
      0,
    ),
  };

  if (options.dryRun) {
    return { dryRun: true, ...summary };
  }
  if (!client) {
    throw new Error('An OpenAI client is required unless --dry-run is used');
  }

  const checkpoint = await readCheckpoint(
    checkpointPath,
    summary.selectedProductIds,
  );
  const enrichments = checkpoint.enrichments;
  const usage = checkpoint.usage;
  const resumedCount = enrichments.length;
  if (resumedCount > 0) {
    console.log(
      JSON.stringify({
        event: 'enrichment.resumed',
        completed: resumedCount,
        total: selectedProducts.length,
      }),
    );
  }

  for (let index = enrichments.length; index < selectedProducts.length; index += 1) {
    const product = selectedProducts[index];
    console.log(
      JSON.stringify({
        event: 'enrichment.product.started',
        productId: productId(product),
        current: index + 1,
        total: selectedProducts.length,
      }),
    );
    enrichments.push(
      await enrich({
        client,
        product,
        onUsage: (productUsage) => addUsage(usage, productUsage),
      }),
    );
    await writeJsonAtomically(checkpointPath, {
      promptVersion: AI_CONFIG.enrichment.promptVersion,
      selectedProductIds: summary.selectedProductIds,
      enrichments,
      usage,
    });
  }

  await writeJsonAtomically(outputPath, [
    ...existingEnrichments,
    ...enrichments,
  ]);
  await rm(checkpointPath, { force: true });

  return {
    dryRun: false,
    ...summary,
    resumed: resumedCount,
    executedLogicalApiCalls: selectedProducts.length - resumedCount,
    usage,
    preserved: existingEnrichments.length,
    written: existingEnrichments.length + enrichments.length,
    outputPath: path.relative(repositoryRoot, outputPath),
  };
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const client = options.dryRun
    ? null
    : new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        maxRetries: AI_CONFIG.enrichment.maxRetries,
        timeout: AI_CONFIG.enrichment.timeoutMs,
      });
  const outputPath = options.outputPath
    ? path.resolve(options.outputPath)
    : path.join(repositoryRoot, 'data/enriched/products.json');
  if (options.seedPaths.length > 0 && !options.missingOnly) {
    throw new Error('--seed requires --missing-only');
  }
  const seedPaths = options.seedPaths.map((seedPath) => path.resolve(seedPath));
  const result = await runEnrichment({ options, client, outputPath, seedPaths });
  console.log(JSON.stringify({ event: 'enrichment.complete', ...result }));
}

const entryPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (entryPath === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(
      JSON.stringify({
        event: 'enrichment.failed',
        message: error.message,
      }),
    );
    process.exitCode = 1;
  });
}
