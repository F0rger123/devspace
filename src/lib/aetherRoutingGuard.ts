// Aether Central Routing Firewall Guard & Diagnostic Engine
// Delegates to the Canonical Intent Resolver and ensures state-creating misroutes are strictly impossible.

import {
  resolveCanonicalAetherIntent,
  CanonicalResolvedIntent,
  ResolverConversationalContext
} from './aetherCanonicalIntentResolver';

export interface RoutingDiagnosticTrace {
  rawInput: string;
  normalizedInput: string;
  intent: string;
  confidence: number;
  entities: Record<string, any>;
  candidateIntents: string[];
  selectedTool: string;
  guardResult: string;
  finalAction: string;
  timestamp: number;
}

export let lastAetherRoutingTrace: RoutingDiagnosticTrace | null = null;

export function evaluateRoutingFirewall(
  rawInput: string,
  proposedIntent: string,
  parsedData: any = {},
  context: ResolverConversationalContext = {}
): {
  isAllowed: boolean;
  finalIntent: string;
  parsedData: any;
  guardResult: string;
  selectedTool: string;
  diagnosticTrace: RoutingDiagnosticTrace;
} {
  const canonical = resolveCanonicalAetherIntent(rawInput, context);
  const norm = (rawInput || '').toLowerCase().trim();
  const candidateIntents: string[] = [proposedIntent || 'unknown', canonical.intent];

  let isAllowed = true;
  let finalIntent = proposedIntent || canonical.intent;
  let updatedParsedData = { ...(parsedData || {}) };
  let guardResult = 'ALLOWED';

  // 1. HARD PRECEDENCE FIREWALL: If canonical resolved to a search intent (search_web or search_youtube),
  // it is STRICTLY FORBIDDEN to create a project or issue.
  if (
    (canonical.intent === 'search_web' || canonical.intent === 'search_youtube' || canonical.intent === 'open_search_result' || canonical.intent === 'search_result_query' || canonical.intent === 'search_recommendation') &&
    (proposedIntent === 'create_project' || proposedIntent === 'create_issue')
  ) {
    isAllowed = false;
    finalIntent = canonical.intent;
    updatedParsedData = canonical.entities;
    guardResult = `BLOCKED_STATE_CREATION: Search query cannot trigger ${proposedIntent}. Overridden to ${canonical.intent}.`;
  }
  // 2. If proposedIntent is create_project but canonical intent is NOT create_project
  else if (proposedIntent === 'create_project' && canonical.intent !== 'create_project') {
    isAllowed = false;
    finalIntent = canonical.intent;
    updatedParsedData = canonical.entities;
    guardResult = `BLOCKED_STATE_CREATION: Input lacks explicit project-creation semantics. Routed to ${canonical.intent}.`;
  }
  // 3. If proposedIntent is navigate_to or chat_query and canonical resolved specific action
  else if (canonical.intent === 'search_web' || canonical.intent === 'search_youtube' || canonical.intent === 'navigate_to' || canonical.intent === 'open_search_result') {
    finalIntent = canonical.intent;
    updatedParsedData = { ...updatedParsedData, ...canonical.entities };
    guardResult = `CANONICAL_MATCH: Matched ${canonical.intent}.`;
  }

  // Set user-friendly tool name
  let selectedTool = canonical.requestedTool || finalIntent;
  if (finalIntent === 'search_youtube') selectedTool = 'YouTube Search Tool';
  else if (finalIntent === 'search_web') selectedTool = 'Google Web Search Tool';
  else if (finalIntent === 'open_search_result') selectedTool = 'Open Search Result Tool';
  else if (finalIntent === 'create_project') selectedTool = 'Project Creation Tool';
  else if (finalIntent === 'navigate_to') selectedTool = 'Navigation Engine';
  else if (finalIntent === 'chat_query') selectedTool = 'Aether Conversational Engine';

  const trace: RoutingDiagnosticTrace = {
    rawInput: rawInput || '',
    normalizedInput: norm,
    intent: finalIntent,
    confidence: canonical.confidence,
    entities: updatedParsedData,
    candidateIntents,
    selectedTool,
    guardResult,
    finalAction: finalIntent,
    timestamp: Date.now()
  };

  lastAetherRoutingTrace = trace;

  return {
    isAllowed,
    finalIntent,
    parsedData: updatedParsedData,
    guardResult,
    selectedTool,
    diagnosticTrace: trace
  };
}
