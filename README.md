# Laravel Embedded Chat

## Knowledge Base System

The application includes a powerful knowledge base system that enables semantic search and AI-augmented responses.

### Capabilities

- Create multiple knowledge bases to organize information
- Add text entries with automatic embedding generation
- Semantic search using vector similarity (finds related content, not just keyword matches)
- Tag-based filtering and categorization
- Export/import knowledge bases between systems
- Integration with AI chat for contextual, knowledge-grounded responses

### How It Works

1. **Embedding Generation**: When content is added to the knowledge base, the system generates vector embeddings that capture semantic meaning
2. **Vector Storage**: These embeddings are stored alongside the content
3. **Semantic Search**: When users search, the system finds semantically similar content using vector similarity
4. **Context Integration**: The AI uses relevant knowledge base entries as context for responses

## Context Rules System

The application includes a context rules system that dynamically controls AI behavior based on user queries.

### Integration with Knowledge Base

The context rules system can dynamically include relevant knowledge base information in AI prompts based on:

1. **Rule Matching**: When a user query matches keywords in a context rule
2. **Knowledge Base Selection**: Rules can specify which knowledge bases should be searched
3. **Contextual Grounding**: The AI response is grounded in the knowledge from selected bases

This integration provides more accurate, relevant responses without requiring users to explicitly search the knowledge base.

## Embedding Providers

The Knowledge Base functionality uses vector embeddings for semantic search. The application supports multiple embedding providers:

### HuggingFace (Default - Free)
- Uses `sentence-transformers/all-MiniLM-L6-v2` model by default
- Works without an API key for many models
- Configure in `.env`:
  ```
  DEFAULT_EMBEDDING_PROVIDER=huggingface
  HUGGINGFACE_EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
  HUGGINGFACE_USE_FREE_INFERENCE=true
  ```

### OpenAI (Optional - Paid)
- Use OpenAI's text-embedding-ada-002 model
- Requires an API key
- Configure in `.env`:
  ```
  DEFAULT_EMBEDDING_PROVIDER=openai
  OPENAI_API_KEY=your-key-here
  ```

If neither provider is available, the system will fall back to a simple embedding algorithm.
