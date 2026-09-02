import OpenAI from 'openai';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createShoppingAgent } from './agent/shoppingAgent.js';
import { AI_CONFIG } from './config/ai.js';
import { openDatabase } from './db/connection.js';
import { createProductRepository } from './products/productRepository.js';
import { searchProducts } from './products/searchProducts.js';

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

export function createRuntimeServices({
  apiKey = process.env.OPENAI_API_KEY,
  databasePath = path.join(repositoryRoot, 'data/products.db'),
  logger = console,
} = {}) {
  const database = openDatabase(databasePath, {
    readonly: true,
    fileMustExist: true,
  });
  const repository = createProductRepository(database);

  if (!apiKey) {
    logger.warn(JSON.stringify({ event: 'agent.unavailable', reason: 'missing_api_key' }));
    return {
      chat: null,
      close: () => database.close(),
    };
  }

  const client = new OpenAI({
    apiKey,
    maxRetries: AI_CONFIG.agent.maxRetries,
    timeout: AI_CONFIG.agent.timeoutMs,
  });
  const agent = createShoppingAgent({
    client,
    repository,
    search: (input) => searchProducts(input, { repository, logger }),
    logger,
  });

  return {
    chat: (input) => agent.chat(input),
    close: () => database.close(),
  };
}
