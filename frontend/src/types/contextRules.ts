/**
 * Context Rules Type Definitions
 */

export interface ResponseFilter {
  type: 'keyword' | 'regex' | 'semantic';
  value: string;
  action: 'block' | 'flag' | 'modify';
}

export interface Pattern {
  regex?: string;
  keyword?: string;
  description?: string;
}

export interface ContextRuleContent {
  patterns: Pattern[];
  instructions?: string;
  useKnowledgeBase?: boolean;
  knowledgeBaseIds?: string[];
  responseFilters?: ResponseFilter[];
  tone?: string;
  preferredModelId?: string;
}

export interface ContextRule {
  id: string;
  name: string;
  description: string;
  is_public: boolean;
  is_active: boolean;
  isActive?: boolean; // For frontend compatibility
  tags: string[];
  content: string | ContextRuleContent; // Can be JSON string or parsed object
  contentParsed?: ContextRuleContent;
  metadata: {
    knowledge_base_ids?: string[];
    preferred_model_id?: string;
    response_format?: string;
    context_type?: string;
    [key: string]: any;
  };
  user_id: string;
  created_at: string;
  updated_at: string;
  createdAt?: string; // For frontend compatibility
  updatedAt?: string; // For frontend compatibility
  
  // Extended properties for frontend compatibility
  contextType?: 'business' | 'general';
  keywords?: string[];
  excludedTopics?: string[];
  promptTemplate?: string;
  useKnowledgeBases?: boolean;
  knowledgeBaseIds?: string[];
  preferredModel?: string;
  conditions?: Condition[];
  actions?: Action[];
  responseFilters?: ResponseFilter[];
}

export interface ContextRuleTestResult {
  result: string;
  rule_matches: boolean;
  matches: string[];
  would_apply_rule: boolean;
  knowledge_base_results: {
    id: string;
    title: string;
    content: string;
    summary?: string;
    source_url?: string;
    source_type?: string;
    similarity_score?: number;
    knowledge_base: {
      id: string;
      name: string;
      source_type: string;
    };
  }[];
  knowledge_base_would_be_searched: boolean;
  test_query: string;
}

export interface Condition {
  type: string;
  value: string;
  operator: string;
}

export interface Action {
  type: string;
  value: string;
  parameters?: {
    action?: string;
    [key: string]: any;
  };
}

export interface ContextRuleBase {
  name: string;
  description: string;
  isActive: boolean;
  priority?: number;
  contextType?: 'business' | 'general';
  keywords?: string[];
  excludedTopics?: string[];
  promptTemplate?: string;
  useKnowledgeBases?: boolean;
  knowledgeBaseIds?: string[];
  preferredModel?: string;
  conditions?: Condition[];
  actions?: Action[];
}

export interface ContextRulesResponse {
  rules: ContextRule[];
  total: number;
  page: number;
  pageSize: number;
} 

export interface ContextRuleCreateInput {
  name: string;
  description: string;
  isActive: boolean;
  priority?: number;
  contextType?: 'business' | 'general';
  keywords?: string[];
  excludedTopics?: string[];
  promptTemplate?: string;
  useKnowledgeBases?: boolean;
  knowledgeBaseIds?: string[];
  preferredModel?: string;
  conditions?: Condition[];
  actions?: Action[];
} 

export interface ContextRuleUpdateInput {
  name?: string;
  description?: string;
  isActive?: boolean;
  priority?: number;
  contextType?: 'business' | 'general';
  keywords?: string[];
  excludedTopics?: string[];
  promptTemplate?: string;
  useKnowledgeBases?: boolean;
  knowledgeBaseIds?: string[];
  preferredModel?: string;
  conditions?: Condition[];
  actions?: Action[];
}       






