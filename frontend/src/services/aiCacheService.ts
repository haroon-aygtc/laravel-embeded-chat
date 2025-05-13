import { getMySQLClient } from "./mysqlClient";
import logger from "@/utils/logger";
import crypto from "crypto";

interface CacheEntry {
  prompt: string;
  response: string;
  modelUsed: string;
  metadata?: Record<string, any>;
  createdAt: string;
  expiresAt: string;
}

/**
 * Service for caching AI responses to reduce API calls and improve performance
 */
const aiCacheService = {
  /**
   * Get a cached response if available
   * @param prompt The prompt to look up in the cache
   * @param model Optional model name to filter by
   * @returns The cached entry or null if not found
   */
  getCachedResponse: async (
    prompt: string,
    model?: string,
  ): Promise<CacheEntry | null> => {
    if (!prompt) {
      logger.warn("getCachedResponse called with empty prompt");
      return null;
    }

    try {
      // Create a hash of the prompt for efficient lookup
      const promptHash = await createHash(prompt);

      const now = new Date();
      const sequelize = await getMySQLClient();

      // Find cache entry in database with proper error handling
      const [cacheEntries] = await sequelize.query(
        `SELECT * FROM ai_response_cache 
         WHERE prompt_hash = ? AND model_used = ? AND expires_at > ?`,
        {
          replacements: [promptHash, model || "default", now],
          type: sequelize.QueryTypes.SELECT,
        },
      );

      // Handle array result properly
      const cacheEntry = Array.isArray(cacheEntries)
        ? cacheEntries[0]
        : cacheEntries;

      if (!cacheEntry) {
        return null;
      }

      // Safely parse metadata with error handling
      let parsedMetadata = {};
      if (cacheEntry.metadata) {
        try {
          parsedMetadata =
            typeof cacheEntry.metadata === "string"
              ? JSON.parse(cacheEntry.metadata)
              : cacheEntry.metadata;
        } catch (parseError) {
          logger.warn("Failed to parse cache entry metadata", parseError);
        }
      }

      return {
        prompt: cacheEntry.prompt,
        response: cacheEntry.response,
        modelUsed: cacheEntry.model_used,
        metadata: parsedMetadata,
        createdAt: new Date(cacheEntry.created_at).toISOString(),
        expiresAt: new Date(cacheEntry.expires_at).toISOString(),
      };
    } catch (error) {
      logger.error(
        "Error getting cached response",
        error instanceof Error ? error : new Error(String(error)),
      );
      return null;
    }
  },

  /**
   * Cache an AI response for future use
   * @param prompt The prompt to cache
   * @param response The AI response to cache
   * @param model The model used to generate the response
   * @param metadata Optional metadata to store with the cache entry
   * @param ttlSeconds Time-to-live in seconds (default: 1 hour)
   * @returns Success status
   */
  cacheResponse: async (
    prompt: string,
    response: string,
    model: string,
    metadata?: Record<string, any>,
    ttlSeconds: number = 3600, // Default TTL: 1 hour
  ): Promise<boolean> => {
    if (!prompt || !response) {
      logger.warn("cacheResponse called with empty prompt or response");
      return false;
    }

    if (!model) {
      model = "default";
    }

    try {
      // Create a hash of the prompt for efficient lookup
      const promptHash = await createHash(prompt);

      const now = new Date();
      const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);
      const sequelize = await getMySQLClient();

      // Prepare metadata for storage with validation
      const metadataJson = JSON.stringify(metadata || {});

      // Use a transaction for data consistency
      const transaction = await sequelize.transaction();

      try {
        // Check if entry already exists
        const [existingEntries] = await sequelize.query(
          `SELECT id FROM ai_response_cache 
           WHERE prompt_hash = ? AND model_used = ?`,
          {
            replacements: [promptHash, model],
            type: sequelize.QueryTypes.SELECT,
            transaction,
          },
        );

        // Handle array result properly
        const existingEntry = Array.isArray(existingEntries)
          ? existingEntries[0]
          : existingEntries;

        if (existingEntry) {
          // Update existing cache entry
          await sequelize.query(
            `UPDATE ai_response_cache 
             SET response = ?, metadata = ?, updated_at = ?, expires_at = ? 
             WHERE id = ?`,
            {
              replacements: [
                response,
                metadataJson,
                now,
                expiresAt,
                existingEntry.id,
              ],
              type: sequelize.QueryTypes.UPDATE,
              transaction,
            },
          );
        } else {
          // Create new cache entry
          await sequelize.query(
            `INSERT INTO ai_response_cache 
             (id, prompt, prompt_hash, response, model_used, metadata, created_at, updated_at, expires_at) 
             VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?)`,
            {
              replacements: [
                prompt,
                promptHash,
                response,
                model,
                metadataJson,
                now,
                now,
                expiresAt,
              ],
              type: sequelize.QueryTypes.INSERT,
              transaction,
            },
          );
        }

        // Commit the transaction
        await transaction.commit();
        return true;
      } catch (error) {
        // Rollback on error
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      logger.error(
        "Error caching response",
        error instanceof Error ? error : new Error(String(error)),
      );
      return false;
    }
  },

  /**
   * Clear expired cache entries
   * @returns Number of entries cleared
   */
  clearExpiredCache: async (): Promise<number> => {
    try {
      const now = new Date();
      const sequelize = await getMySQLClient();

      // Delete expired cache entries
      const [result] = await sequelize.query(
        `DELETE FROM ai_response_cache WHERE expires_at < ?`,
        {
          replacements: [now],
          type: sequelize.QueryTypes.DELETE,
        },
      );

      const affectedRows = result?.affectedRows || 0;
      logger.info(`Cleared ${affectedRows} expired cache entries`);
      return affectedRows;
    } catch (error) {
      logger.error(
        "Error clearing expired cache",
        error instanceof Error ? error : new Error(String(error)),
      );
      return 0;
    }
  },

  /**
   * Invalidate cache entries for a specific prompt or pattern
   * @param promptPattern Pattern to match against prompts
   * @param model Optional model to filter by
   * @returns Number of entries invalidated
   */
  invalidateCache: async (
    promptPattern: string,
    model?: string,
  ): Promise<number> => {
    if (!promptPattern) {
      logger.warn("invalidateCache called with empty promptPattern");
      return 0;
    }

    // Validate promptPattern to prevent SQL injection
    if (
      promptPattern.includes(";") ||
      promptPattern.includes("--") ||
      promptPattern.includes("/*")
    ) {
      logger.error("Potential SQL injection attempt in invalidateCache");
      return 0;
    }

    try {
      const sequelize = await getMySQLClient();

      // Use parameterized queries to prevent SQL injection
      let query = `DELETE FROM ai_response_cache WHERE prompt LIKE ?`;
      const replacements = [`%${promptPattern}%`];

      if (model) {
        query += ` AND model_used = ?`;
        replacements.push(model);
      }

      // Delete matching cache entries
      const [result] = await sequelize.query(query, {
        replacements,
        type: sequelize.QueryTypes.DELETE,
      });

      const affectedRows = result?.affectedRows || 0;
      logger.info(
        `Invalidated ${affectedRows} cache entries matching pattern: ${promptPattern}`,
      );
      return affectedRows;
    } catch (error) {
      logger.error(
        "Error invalidating cache",
        error instanceof Error ? error : new Error(String(error)),
      );
      return 0;
    }
  },
};

/**
 * Create a cryptographic hash of the prompt for secure and efficient lookup
 * @param text Text to hash
 * @returns SHA-256 hash of the text
 */
async function createHash(text: string): Promise<string> {
  // Use SHA-256 for production-grade hashing
  return crypto.createHash("sha256").update(text).digest("hex");
}

export default aiCacheService;
