<?php

declare(strict_types=1);

namespace App\Services\KnowledgeBase\VectorSearch;

use App\Models\AI\KnowledgeBase;
use App\Models\AI\KnowledgeEntry;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ContentChunkingService
{
    /**
     * Create chunks from a knowledge entry based on knowledge base settings.
     *
     * @param KnowledgeEntry $entry The entry to chunk
     * @param KnowledgeBase|null $knowledgeBase The knowledge base (if not provided, will use entry's KB)
     * @return Collection Collection of created chunk entries
     */
    public function chunkEntry(KnowledgeEntry $entry, ?KnowledgeBase $knowledgeBase = null): Collection
    {
        try {
            // Get knowledge base if not provided
            $knowledgeBase = $knowledgeBase ?? $entry->knowledgeBase;
            
            if (!$knowledgeBase) {
                Log::error('Knowledge base not found for entry', ['entry_id' => $entry->id]);
                return collect([]);
            }
            
            // Skip if auto chunking is disabled for this knowledge base
            if (!$knowledgeBase->auto_chunk_content) {
                return collect([]);
            }
            
            // Get content to chunk
            $content = $entry->content;
            
            // Skip if content is too small to chunk
            if (strlen(strip_tags($content)) < ($knowledgeBase->chunk_size * 5)) {
                return collect([]);
            }
            
            // Generate chunks based on configuration
            $chunks = $this->generateChunks(
                $content,
                $knowledgeBase->chunk_size ?? 512,
                $knowledgeBase->chunk_overlap ?? 50
            );
            
            if (empty($chunks)) {
                return collect([]);
            }
            
            // Create KnowledgeEntry for each chunk
            $chunkEntries = collect([]);
            $chunkId = Str::uuid()->toString();
            
            foreach ($chunks as $index => $chunkText) {
                // Create a new entry for this chunk
                $chunkEntry = new KnowledgeEntry();
                $chunkEntry->id = (string) Str::uuid();
                $chunkEntry->knowledge_base_id = $knowledgeBase->id;
                $chunkEntry->title = $entry->title . ' (Chunk ' . ($index + 1) . ')';
                $chunkEntry->content = $chunkText;
                $chunkEntry->source_url = $entry->source_url;
                $chunkEntry->source_type = $entry->source_type;
                $chunkEntry->summary = Str::limit(strip_tags($chunkText), 150);
                $chunkEntry->tags = $entry->tags;
                $chunkEntry->metadata = $entry->metadata ?? [];
                
                // Add chunking metadata
                $chunkEntry->chunk_id = $chunkId;
                $chunkEntry->chunk_index = $index;
                $chunkEntry->parent_entry_id = $entry->id;
                
                // Set active status
                $chunkEntry->is_active = $entry->is_active;
                
                // Save the chunk
                $chunkEntry->save();
                
                $chunkEntries->push($chunkEntry);
            }
            
            // Update the parent entry to indicate it has chunks
            $entry->metadata = array_merge($entry->metadata ?? [], [
                'has_chunks' => true,
                'chunk_id' => $chunkId,
                'chunk_count' => $chunks->count()
            ]);
            $entry->save();
            
            return $chunkEntries;
        } catch (\Exception $e) {
            Log::error('Error chunking entry', [
                'entry_id' => $entry->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return collect([]);
        }
    }
    
    /**
     * Generate chunks from content based on specified size and overlap.
     *
     * @param string $content The content to chunk
     * @param int $chunkSize The size of each chunk in tokens
     * @param int $chunkOverlap The overlap between chunks in tokens
     * @param string $strategy The chunking strategy (tokens, sentences, paragraphs)
     * @return Collection Collection of chunk texts
     */
    public function generateChunks(
        string $content,
        int $chunkSize = 512,
        int $chunkOverlap = 50,
        string $strategy = 'smart'
    ): Collection {
        // Clean content - remove excess whitespace and convert HTML to text if needed
        $content = $this->cleanContent($content);
        
        // Generate chunks based on strategy
        return match ($strategy) {
            'tokens' => $this->chunkByTokens($content, $chunkSize, $chunkOverlap),
            'sentences' => $this->chunkBySentences($content, $chunkSize, $chunkOverlap),
            'paragraphs' => $this->chunkByParagraphs($content, $chunkSize, $chunkOverlap),
            'smart', 'auto' => $this->chunkSmart($content, $chunkSize, $chunkOverlap),
            default => $this->chunkSmart($content, $chunkSize, $chunkOverlap)
        };
    }
    
    /**
     * Clean and normalize content for chunking.
     *
     * @param string $content The content to clean
     * @return string Cleaned content
     */
    protected function cleanContent(string $content): string
    {
        // If content is HTML, convert to text
        if (Str::contains($content, ['<p>', '<div>', '<span>', '<h1>', '<h2>', '<h3>'])) {
            $content = strip_tags($content);
        }
        
        // Replace multiple newlines with a single newline
        $content = preg_replace('/\n\s*\n/', "\n", $content);
        
        // Replace tabs with spaces
        $content = str_replace("\t", ' ', $content);
        
        // Replace multiple spaces with a single space
        $content = preg_replace('/\s+/', ' ', $content);
        
        return trim($content);
    }
    
    /**
     * Chunk content by approximate token count.
     *
     * @param string $content The content to chunk
     * @param int $chunkSize The size of each chunk in tokens
     * @param int $chunkOverlap The overlap between chunks in tokens
     * @return Collection Collection of chunk texts
     */
    protected function chunkByTokens(string $content, int $chunkSize, int $chunkOverlap): Collection
    {
        // A very simple tokenization approach - split by whitespace
        // In a production environment, use a proper tokenizer for the specific model
        $words = preg_split('/\s+/', $content);
        
        // Approximate tokens per word (most tokenizers will split long words)
        // Average ratio is ~1.3 tokens per word for English text
        $tokenToWordRatio = 1.3;
        
        // Convert token sizes to word sizes
        $wordsPerChunk = intval($chunkSize / $tokenToWordRatio);
        $overlapWords = intval($chunkOverlap / $tokenToWordRatio);
        
        // Generate chunks
        $chunks = collect([]);
        $wordCount = count($words);
        $step = $wordsPerChunk - $overlapWords;
        
        for ($i = 0; $i < $wordCount; $i += $step) {
            // Get words for this chunk
            $chunkWords = array_slice($words, $i, $wordsPerChunk);
            
            // Skip if too small
            if (count($chunkWords) < ($wordsPerChunk / 4) && $i > 0) {
                continue;
            }
            
            // Create chunk text
            $chunkText = implode(' ', $chunkWords);
            $chunks->push($chunkText);
            
            // Break if we've processed all words
            if ($i + $wordsPerChunk >= $wordCount) {
                break;
            }
        }
        
        return $chunks;
    }
    
    /**
     * Chunk content by sentences.
     *
     * @param string $content The content to chunk
     * @param int $chunkSize The size of each chunk in tokens
     * @param int $chunkOverlap The overlap between chunks in tokens
     * @return Collection Collection of chunk texts
     */
    protected function chunkBySentences(string $content, int $chunkSize, int $chunkOverlap): Collection
    {
        // Split content into sentences
        $sentences = $this->splitIntoSentences($content);
        
        // Approximate tokens per character (typical for English text)
        // Most tokenizers generate roughly 1 token per 4-5 characters
        $tokenToCharRatio = 0.25;
        
        // Convert token sizes to character sizes
        $charsPerChunk = intval($chunkSize / $tokenToCharRatio);
        
        // Generate chunks
        $chunks = collect([]);
        $currentChunk = '';
        
        foreach ($sentences as $sentence) {
            // If adding this sentence would exceed chunk size and we already have content
            if (strlen($currentChunk) + strlen($sentence) > $charsPerChunk && !empty($currentChunk)) {
                // Store current chunk
                $chunks->push($currentChunk);
                
                // Start new chunk with overlap
                // Get the last few sentences from the previous chunk for overlap
                $currentChunk = $this->getOverlapText($currentChunk, $chunkOverlap, $tokenToCharRatio);
            }
            
            // Add sentence to current chunk
            $currentChunk .= $sentence;
        }
        
        // Add final chunk if not empty
        if (!empty($currentChunk)) {
            $chunks->push($currentChunk);
        }
        
        return $chunks;
    }
    
    /**
     * Chunk content by paragraphs.
     *
     * @param string $content The content to chunk
     * @param int $chunkSize The size of each chunk in tokens
     * @param int $chunkOverlap The overlap between chunks in tokens
     * @return Collection Collection of chunk texts
     */
    protected function chunkByParagraphs(string $content, int $chunkSize, int $chunkOverlap): Collection
    {
        // Split content into paragraphs
        $paragraphs = preg_split('/\n+/', $content);
        
        // Approximate tokens per character
        $tokenToCharRatio = 0.25;
        
        // Convert token sizes to character sizes
        $charsPerChunk = intval($chunkSize / $tokenToCharRatio);
        
        // Generate chunks
        $chunks = collect([]);
        $currentChunk = '';
        
        foreach ($paragraphs as $paragraph) {
            $paragraph = trim($paragraph);
            
            // Skip empty paragraphs
            if (empty($paragraph)) {
                continue;
            }
            
            // If adding this paragraph would exceed chunk size and we already have content
            if (strlen($currentChunk) + strlen($paragraph) > $charsPerChunk && !empty($currentChunk)) {
                // Store current chunk
                $chunks->push($currentChunk);
                
                // Start new chunk with overlap
                $currentChunk = $this->getOverlapText($currentChunk, $chunkOverlap, $tokenToCharRatio);
            }
            
            // Add paragraph to current chunk
            $currentChunk .= (!empty($currentChunk) ? "\n\n" : '') . $paragraph;
        }
        
        // Add final chunk if not empty
        if (!empty($currentChunk)) {
            $chunks->push($currentChunk);
        }
        
        return $chunks;
    }
    
    /**
     * Smart chunking - combines sentence and paragraph approaches
     * based on content structure and chunk size.
     *
     * @param string $content The content to chunk
     * @param int $chunkSize The size of each chunk in tokens
     * @param int $chunkOverlap The overlap between chunks in tokens
     * @return Collection Collection of chunk texts
     */
    protected function chunkSmart(string $content, int $chunkSize, int $chunkOverlap): Collection
    {
        // Detect if content is paragraph-heavy or sentence-heavy
        $paragraphCount = preg_match_all('/\n\s*\n/', $content);
        
        // If content has many paragraphs, use paragraph chunking
        if ($paragraphCount > 10 && strlen($content) > 10000) {
            return $this->chunkByParagraphs($content, $chunkSize, $chunkOverlap);
        }
        
        // For shorter content or content without clear paragraphs, use sentence chunking
        return $this->chunkBySentences($content, $chunkSize, $chunkOverlap);
    }
    
    /**
     * Split text into sentences.
     *
     * @param string $text The text to split
     * @return array Array of sentences
     */
    protected function splitIntoSentences(string $text): array
    {
        // Common sentence-ending punctuation patterns
        $pattern = '/(?<=[.!?])\s+(?=[A-Z])/';
        
        // Split by pattern
        $sentences = preg_split($pattern, $text);
        
        // Ensure each sentence ends with proper punctuation
        $formattedSentences = [];
        foreach ($sentences as $sentence) {
            $sentence = trim($sentence);
            
            // Skip empty sentences
            if (empty($sentence)) {
                continue;
            }
            
            // Add sentence ending if missing
            if (!preg_match('/[.!?]$/', $sentence)) {
                $sentence .= '.';
            }
            
            $formattedSentences[] = $sentence . ' ';
        }
        
        return $formattedSentences;
    }
    
    /**
     * Get overlap text from the end of a chunk.
     *
     * @param string $text The text to get overlap from
     * @param int $overlapTokens The overlap size in tokens
     * @param float $tokenToCharRatio The token to character ratio
     * @return string Overlap text
     */
    protected function getOverlapText(string $text, int $overlapTokens, float $tokenToCharRatio): string
    {
        // Convert tokens to characters
        $overlapChars = intval($overlapTokens / $tokenToCharRatio);
        
        // If text is shorter than overlap, return the entire text
        if (strlen($text) <= $overlapChars) {
            return $text;
        }
        
        // Extract the last part of the text for overlap
        $overlap = substr($text, -$overlapChars);
        
        // Try to start at a sentence boundary
        $matches = [];
        if (preg_match('/[.!?]\s+[A-Z][^.!?]*$/', $overlap, $matches, PREG_OFFSET_CAPTURE)) {
            $sentenceStart = $matches[0][1];
            $overlap = substr($overlap, $sentenceStart + 2); // +2 to skip the punctuation and space
        }
        
        return $overlap;
    }
    
    /**
     * Process all entries in a knowledge base for chunking.
     *
     * @param KnowledgeBase|string $knowledgeBase The knowledge base or its ID
     * @param bool $force Whether to force rechunking even if entries have chunks
     * @return array Results with entry IDs as keys and success status as values
     */
    public function processKnowledgeBase(KnowledgeBase|string $knowledgeBase, bool $force = false): array
    {
        try {
            // Get knowledge base if string ID is provided
            if (is_string($knowledgeBase)) {
                $knowledgeBase = KnowledgeBase::find($knowledgeBase);
            }
            
            if (!$knowledgeBase) {
                Log::error('Knowledge base not found');
                return ['success' => false, 'message' => 'Knowledge base not found'];
            }
            
            // Skip if auto chunking is disabled
            if (!$knowledgeBase->auto_chunk_content) {
                return [
                    'success' => true,
                    'message' => 'Auto chunking is disabled for this knowledge base',
                    'processed' => 0
                ];
            }
            
            // Get all active entries
            $query = KnowledgeEntry::where('knowledge_base_id', $knowledgeBase->id)
                ->where('is_active', true)
                ->whereNull('parent_entry_id'); // Skip existing chunks
            
            // Skip entries that already have chunks unless forced
            if (!$force) {
                $query->whereDoesntHave('metadata', function ($q) {
                    $q->where('has_chunks', true);
                });
            } else {
                // If forcing rechunking, delete existing chunks
                $chunkIds = KnowledgeEntry::where('knowledge_base_id', $knowledgeBase->id)
                    ->whereNotNull('parent_entry_id')
                    ->pluck('id');
                
                if ($chunkIds->isNotEmpty()) {
                    KnowledgeEntry::whereIn('id', $chunkIds)->delete();
                }
            }
            
            $entries = $query->get();
            
            // Process each entry
            $results = [];
            $processedCount = 0;
            
            foreach ($entries as $entry) {
                $chunks = $this->chunkEntry($entry, $knowledgeBase);
                $results[$entry->id] = $chunks->isNotEmpty();
                
                if ($chunks->isNotEmpty()) {
                    $processedCount++;
                }
            }
            
            return [
                'success' => true,
                'processed' => $processedCount,
                'total' => $entries->count(),
                'results' => $results
            ];
        } catch (\Exception $e) {
            Log::error('Error processing knowledge base for chunking', [
                'knowledge_base_id' => $knowledgeBase->id ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return [
                'success' => false,
                'message' => 'Error processing knowledge base: ' . $e->getMessage()
            ];
        }
    }
} 