// Centralized Aether Gemini Model Configuration & Resolver
// Provides verified model routing for fast conversation, coding/agentic tasks, and reasoning.
// Prevents unverified or obsolete model IDs and ensures clean fallbacks.

export interface AetherModelProfile {
  id: string;
  name: string;
  category: 'fast_conversation' | 'coding_agentic' | 'deep_reasoning' | 'embedding';
  description: string;
  contextWindow: string;
  isStable: boolean;
}

export const AETHER_MODELS = {
  // Verified stable models on Google Gemini API
  FAST_CONVERSATION: 'gemini-3.7-flash',
  CODING_AGENTIC: 'gemini-3.1-pro-preview',
  DEEP_REASONING: 'gemini-3.1-pro-preview',
  EMBEDDING: 'gemini-embedding-2-preview',
  FALLBACK_FAST: 'gemini-3.1-flash-lite',
  FALLBACK_PRO: 'gemini-3.7-flash',
} as const;

export type VerifiedModelId = (typeof AETHER_MODELS)[keyof typeof AETHER_MODELS];

export const AVAILABLE_AETHER_MODELS: AetherModelProfile[] = [
  {
    id: AETHER_MODELS.FAST_CONVERSATION,
    name: 'Gemini 3.7 Flash (Verified)',
    category: 'fast_conversation',
    description: 'High-speed conversational engine for voice memos, intent detection, and fast tool dispatch.',
    contextWindow: '1M tokens',
    isStable: true
  },
  {
    id: AETHER_MODELS.CODING_AGENTIC,
    name: 'Gemini 3.1 Pro (Verified)',
    category: 'coding_agentic',
    description: 'High-capability reasoning and coding model for complex architectural refactoring, agents, and multi-file code generation.',
    contextWindow: '2M tokens',
    isStable: true
  },
  {
    id: AETHER_MODELS.FALLBACK_FAST,
    name: 'Gemini 3.1 Flash Lite (Verified)',
    category: 'fast_conversation',
    description: 'Ultra-low latency lightweight model with high throughput and instant response times.',
    contextWindow: '1M tokens',
    isStable: true
  }
];

export interface ModelRoutingDecision {
  selectedModel: string;
  fallbackModel: string;
  workload: 'fast_conversation' | 'coding_agentic' | 'deep_reasoning';
  reason: string;
  timestamp: number;
}

let lastRoutingDecision: ModelRoutingDecision | null = null;

export function resolveAetherModel(
  workload: 'fast_conversation' | 'coding_agentic' | 'deep_reasoning' = 'fast_conversation',
  userRequestedModel?: string
): { model: string; fallback: string; reason: string } {
  // Normalize user-requested model or check known aliases
  let cleanRequested = (userRequestedModel || '').toLowerCase().trim();

  if (cleanRequested.includes('pro-preview') || cleanRequested.includes('3.1-pro') || cleanRequested.includes('2.5-pro') || cleanRequested.includes('1.5-pro')) {
    cleanRequested = AETHER_MODELS.CODING_AGENTIC;
  } else if (cleanRequested.includes('flash-lite') || cleanRequested.includes('lite')) {
    cleanRequested = AETHER_MODELS.FALLBACK_FAST;
  } else {
    cleanRequested = AETHER_MODELS.FAST_CONVERSATION;
  }

  let model: string = AETHER_MODELS.FAST_CONVERSATION;
  let fallback: string = AETHER_MODELS.FALLBACK_FAST;
  let reason = 'Default high-speed conversational model selected for optimal latency.';

  if (workload === 'coding_agentic') {
    model = AETHER_MODELS.CODING_AGENTIC;
    fallback = AETHER_MODELS.FAST_CONVERSATION;
    reason = 'Coding and agentic workload requires Gemini 3.1 Pro for deep multi-turn code synthesis.';
  } else if (workload === 'deep_reasoning') {
    model = AETHER_MODELS.DEEP_REASONING;
    fallback = AETHER_MODELS.FAST_CONVERSATION;
    reason = 'Deep reasoning workload routed to Gemini 3.1 Pro.';
  } else {
    model = cleanRequested || AETHER_MODELS.FAST_CONVERSATION;
    fallback = AETHER_MODELS.FALLBACK_FAST;
    reason = 'Low-latency conversational workload routed to Gemini 3.7 Flash.';
  }

  lastRoutingDecision = {
    selectedModel: model,
    fallbackModel: fallback,
    workload,
    reason,
    timestamp: Date.now()
  };

  return { model, fallback, reason };
}

export function getLastModelRoutingDecision(): ModelRoutingDecision | null {
  return lastRoutingDecision;
}
