/**
 * Knowledge Base Core API Functions
 * 
 * This file contains the core CRUD operations for knowledge bases and entries.
 * For configuration, analytics, and context rules, use knowledgeBase.ts instead.
 * This separation helps prevent circular dependencies and keeps related functionality grouped.
 */

import { api } from "../../middleware/apiMiddleware";
import { knowledgeBaseEndpoints } from "../../endpoints/knowledgeBaseEndpoints";
import type {
    KnowledgeBase,
    KnowledgeEntry,
    PaginatedResponse,
    SearchKnowledgeParams,
    CreateKnowledgeBaseParams,
    UpdateKnowledgeBaseParams,
    CreateKnowledgeEntryParams,
    UpdateKnowledgeEntryParams,
    GetKnowledgeBasesParams,
    GetEntriesParams,
    FindSimilarParams,
    ImportOptions,
    ImportData,
    BulkDeleteEntriesParams
} from "../../../../types/knowledgeBase";

// Re-export types to maintain backward compatibility
export type {
    KnowledgeBase,
    KnowledgeEntry,
    PaginatedResponse,
    SearchKnowledgeParams,
    CreateKnowledgeBaseParams,
    UpdateKnowledgeBaseParams,
    CreateKnowledgeEntryParams,
    UpdateKnowledgeEntryParams,
    GetKnowledgeBasesParams,
    GetEntriesParams,
    FindSimilarParams,
    ImportOptions,
    ImportData,
    BulkDeleteEntriesParams
};

/**
 * Knowledge Base Core API client
 * 
 * Contains all the core CRUD operations for knowledge bases and entries.
 * For configuration, analytics, and context rules, use knowledgeBaseConfigApi from knowledgeBase.ts
 */
export const knowledgeBaseCoreApi = {
    /**
     * Get all knowledge bases accessible to the user
     */
    getAll: async (params?: GetKnowledgeBasesParams): Promise<PaginatedResponse<KnowledgeBase> | KnowledgeBase[]> => {
        const response = await api.get(knowledgeBaseEndpoints.knowledgeBase, { params });
        return response.data;
    },

    /**
     * Get a specific knowledge base by ID
     */
    getById: async (id: string): Promise<KnowledgeBase> => {
        const response = await api.get(knowledgeBaseEndpoints.knowledgeBaseById(id));
        return response.data;
    },

    /**
     * Create a new knowledge base
     */
    create: async (params: CreateKnowledgeBaseParams): Promise<KnowledgeBase> => {
        const response = await api.post(knowledgeBaseEndpoints.knowledgeBase, params);
        return response.data;
    },

    /**
     * Update an existing knowledge base
     */
    update: async (id: string, params: UpdateKnowledgeBaseParams): Promise<KnowledgeBase> => {
        const response = await api.put(knowledgeBaseEndpoints.knowledgeBaseById(id), params);
        return response.data;
    },

    /**
     * Delete a knowledge base
     */
    delete: async (id: string): Promise<{ message: string }> => {
        const response = await api.delete(knowledgeBaseEndpoints.knowledgeBaseById(id));
        return response.data;
    },

    /**
     * Export a knowledge base with all its entries
     */
    export: async (id: string): Promise<{ knowledge_base: KnowledgeBase; entries: KnowledgeEntry[] }> => {
        const response = await api.get(knowledgeBaseEndpoints.exportKnowledgeBase(id));
        return response.data;
    },

    /**
     * Import a knowledge base from exported data
     */
    import: async (data: ImportData, options?: ImportOptions): Promise<{ knowledge_base: KnowledgeBase; entries_imported: number }> => {
        const response = await api.post(knowledgeBaseEndpoints.importKnowledgeBase, { data, options });
        return response.data;
    },

    /**
     * Get entries from a knowledge base
     */
    getEntries: async (
        knowledgeBaseId: string,
        params?: GetEntriesParams
    ): Promise<PaginatedResponse<KnowledgeEntry> | KnowledgeEntry[]> => {
        const response = await api.get(knowledgeBaseEndpoints.knowledgeBaseEntries(knowledgeBaseId), { params });
        return response.data;
    },

    /**
     * Create a new entry in a knowledge base
     */
    createEntry: async (
        knowledgeBaseId: string,
        params: CreateKnowledgeEntryParams
    ): Promise<KnowledgeEntry> => {
        const response = await api.post(knowledgeBaseEndpoints.knowledgeBaseEntries(knowledgeBaseId), params);
        return response.data;
    },

    /**
     * Create multiple entries in a knowledge base
     */
    createBulkEntries: async (
        knowledgeBaseId: string,
        entries: CreateKnowledgeEntryParams[]
    ): Promise<KnowledgeEntry[]> => {
        const response = await api.post(knowledgeBaseEndpoints.bulkCreateEntries(knowledgeBaseId), { entries });
        return response.data;
    },

    /**
     * Update an existing knowledge entry
     */
    updateEntry: async (id: string, params: UpdateKnowledgeEntryParams): Promise<KnowledgeEntry> => {
        const response = await api.put(knowledgeBaseEndpoints.entriesById(id), params);
        return response.data;
    },

    /**
     * Delete a knowledge entry
     */
    deleteEntry: async (id: string): Promise<{ message: string }> => {
        const response = await api.delete(knowledgeBaseEndpoints.entriesById(id));
        return response.data;
    },

    /**
     * Delete multiple entries
     */
    bulkDeleteEntries: async (params: BulkDeleteEntriesParams): Promise<{ message: string; deleted_count: number }> => {
        const response = await api.post(knowledgeBaseEndpoints.bulkDeleteEntries, params);
        return response.data;
    },

    /**
     * Generate embeddings for all entries in a knowledge base
     */
    generateEmbeddings: async (
        knowledgeBaseId: string
    ): Promise<{ message: string; processed_entries: number }> => {
        const response = await api.post(knowledgeBaseEndpoints.generateEmbeddings(knowledgeBaseId));
        return response.data;
    },

    /**
     * Find entries similar to a specific entry
     */
    findSimilar: async (
        entryId: string,
        params: FindSimilarParams
    ): Promise<KnowledgeEntry[]> => {
        const response = await api.get(knowledgeBaseEndpoints.findSimilar(entryId), { params });
        return response.data;
    },

    /**
     * Search across knowledge bases
     */
    search: async (params: SearchKnowledgeParams): Promise<KnowledgeEntry[]> => {
        const response = await api.post(knowledgeBaseEndpoints.search, params);
        return response.data;
    }
};

// Legacy function exports for backward compatibility
// These will help maintain compatibility with existing code
export async function getAll(params?: GetKnowledgeBasesParams): Promise<PaginatedResponse<KnowledgeBase> | KnowledgeBase[]> {
    return knowledgeBaseCoreApi.getAll(params);
}

export async function getById(id: string): Promise<KnowledgeBase> {
    return knowledgeBaseCoreApi.getById(id);
}

export async function create(params: CreateKnowledgeBaseParams): Promise<KnowledgeBase> {
    return knowledgeBaseCoreApi.create(params);
}

export async function update(id: string, params: UpdateKnowledgeBaseParams): Promise<KnowledgeBase> {
    return knowledgeBaseCoreApi.update(id, params);
}

export async function deleteKnowledgeBase(id: string): Promise<{ message: string }> {
    return knowledgeBaseCoreApi.delete(id);
}

export async function exportKnowledgeBase(id: string): Promise<{ knowledge_base: KnowledgeBase; entries: KnowledgeEntry[] }> {
    return knowledgeBaseCoreApi.export(id);
}

export async function importKnowledgeBase(data: ImportData, options?: ImportOptions): Promise<{ knowledge_base: KnowledgeBase; entries_imported: number }> {
    return knowledgeBaseCoreApi.import(data, options);
}

export async function getEntries(knowledgeBaseId: string, params?: GetEntriesParams): Promise<PaginatedResponse<KnowledgeEntry> | KnowledgeEntry[]> {
    return knowledgeBaseCoreApi.getEntries(knowledgeBaseId, params);
}

export async function createEntry(knowledgeBaseId: string, params: CreateKnowledgeEntryParams): Promise<KnowledgeEntry> {
    return knowledgeBaseCoreApi.createEntry(knowledgeBaseId, params);
}

export async function createBulkEntries(knowledgeBaseId: string, entries: CreateKnowledgeEntryParams[]): Promise<KnowledgeEntry[]> {
    return knowledgeBaseCoreApi.createBulkEntries(knowledgeBaseId, entries);
}

export async function updateEntry(id: string, params: UpdateKnowledgeEntryParams): Promise<KnowledgeEntry> {
    return knowledgeBaseCoreApi.updateEntry(id, params);
}

export async function deleteEntry(id: string): Promise<{ message: string }> {
    return knowledgeBaseCoreApi.deleteEntry(id);
}

export async function bulkDeleteEntries(params: BulkDeleteEntriesParams): Promise<{ message: string; deleted_count: number }> {
    return knowledgeBaseCoreApi.bulkDeleteEntries(params);
}

export async function generateEmbeddings(knowledgeBaseId: string): Promise<{ message: string; processed_entries: number }> {
    return knowledgeBaseCoreApi.generateEmbeddings(knowledgeBaseId);
}

export async function findSimilar(entryId: string, params: FindSimilarParams): Promise<KnowledgeEntry[]> {
    return knowledgeBaseCoreApi.findSimilar(entryId, params);
}

export async function search(params: SearchKnowledgeParams): Promise<KnowledgeEntry[]> {
    return knowledgeBaseCoreApi.search(params);
} 