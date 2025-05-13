# Knowledge Base API Structure

This documentation explains the knowledge base API structure after refactoring to eliminate duplication.

## API Structure

The knowledge base API is divided into two main parts:

1. **Knowledge Base Core API** (`knowledgeBaseCoreApi`)
   - Located in: `src/services/api/features/knowledgebase/knowledgebasefeatures.ts`
   - Handles all core CRUD operations for knowledge bases and entries
   - Includes functions for search, embeddings, import/export, etc.

2. **Knowledge Base Config API** (`knowledgeBaseConfigApi`)
   - Located in: `src/services/api/features/knowledgeBase.ts`
   - Handles configuration, analytics, context rules and query operations
   - Includes functions for analytics, testing connections, and schema operations

3. **Knowledge Base Endpoints** (`knowledgeBaseEndpoints`)
   - Located in: `src/services/api/endpoints/knowledgeBaseEndpoints.ts`
   - Central source of truth for all knowledge base API endpoints
   - Used by both core and config APIs to prevent endpoint duplication

4. **Knowledge Base Service** (`knowledgeBaseService`)
   - Located in: `src/services/knowledgeBaseService.ts`
   - Provides a higher-level interface with caching for application use
   - Uses the core API for all operations

5. **Shared Types** 
   - Located in: `src/types/knowledgeBase.ts`
   - Contains all shared interfaces used by both API modules
   - Prevents duplication of type definitions across files

## Integration with AI

The knowledge base is integrated with the AI system in two main ways:

1. **Knowledge Retrieval for AI Generation**
   - The AI service can use relevant knowledge base entries to enhance AI responses
   - When generating AI responses, the system can search knowledge bases for context
   - This integration is handled in the backend `AIService` class

2. **Semantic Search**
   - Knowledge base entries use embeddings for similarity search
   - The embeddings are generated using the same AI models used for responses
   - This allows for context-aware retrieval of knowledge

## Refactoring Changes

The refactoring addressed several issues:

1. **Eliminated Duplicate Type Definitions**:
   - Moved all interfaces to a shared types file
   - Both API modules import and use these shared types
   - Properly used `import type` and `export type` for type references

2. **Eliminated Endpoint Duplication**:
   - Consolidated all endpoints into the `knowledgeBaseEndpoints.ts` file
   - Ensured both API modules use the same endpoints

3. **Consistent API Pattern**:
   - Changed individual exported functions to exported API objects with methods
   - Used clear naming to separate core operations (`knowledgeBaseCoreApi`) from config/analytics operations (`knowledgeBaseConfigApi`)

4. **Backwards Compatibility**:
   - Maintained individual function exports for backwards compatibility
   - All existing code using the previous functions should continue to work

5. **Clear Separation of Concerns**:
   - Core CRUD operations are in the knowledgebasefeatures.ts file
   - Configuration and analytics are in the knowledgeBase.ts file
   - This prevents circular dependencies and makes the code easier to understand

6. **Improved Documentation**:
   - Added comprehensive JSDoc comments to all API methods
   - Added clear file headers explaining the purpose of each module

## Using the Knowledge Base APIs

### Core API Example

```typescript
import { knowledgeBaseCoreApi } from './api/features/knowledgebase/knowledgebasefeatures';

// Get all knowledge bases
const knowledgeBases = await knowledgeBaseCoreApi.getAll();

// Create a knowledge base
const newKB = await knowledgeBaseCoreApi.create({
  name: 'My Knowledge Base',
  description: 'Contains important information',
  source_type: 'manual'
});

// Search across knowledge bases
const results = await knowledgeBaseCoreApi.search({
  query: 'important topic',
  max_results: 10
});
```

### Config API Example

```typescript
import { knowledgeBaseConfigApi } from './api/features/knowledgeBase';

// Get analytics
const analytics = await knowledgeBaseConfigApi.getAnalytics('30d');

// Get context rules
const rules = await knowledgeBaseConfigApi.getAllContextRules();

// Query knowledge bases with context
const queryResults = await knowledgeBaseConfigApi.query({
  query: 'important topic',
  knowledgeBaseIds: ['kb1', 'kb2'],
  contextRuleId: 'rule1'
});
```

### Service Layer Example

```typescript
import { knowledgeBaseService } from './services/knowledgeBaseService';

// Uses caching and provides higher-level interface
const kbs = await knowledgeBaseService.getAllKnowledgeBases();
const entries = await knowledgeBaseService.getEntries('kb-id');
const searchResults = await knowledgeBaseService.search('query');
```

### Shared Types Usage

```typescript
import type { 
  KnowledgeBase, 
  KnowledgeEntry,
  SearchKnowledgeParams 
} from '../types/knowledgeBase';

// Use types for function parameters and return values
function processEntry(entry: KnowledgeEntry): void {
  // ...
}

// Type-safe parameter objects
const searchParams: SearchKnowledgeParams = {
  query: 'example',
  max_results: 5
};
``` 