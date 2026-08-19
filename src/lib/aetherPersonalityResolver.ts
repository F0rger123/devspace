// Aether Canonical Personality Resolver (Enhanced with AetherIdentityProfileSystem)
// Authoritative, single source of truth for user identity, Synaptic Directives, and personality settings across all output paths.

import { aetherPersonalitySystem, AetherIdentityProfile } from './aetherIdentityProfileSystem';

export interface ResolvedAetherPersonality {
  preferredUserName: string;
  assistantName: string;
  tone: string;
  humor: number; // Scale 0-10
  verbosity: 'concise' | 'balanced' | 'detailed';
  formality: 'casual' | 'balanced' | 'formal';
  profanityPreference: boolean;
  greetingStyle: string;
  proactivity: string;
  customPersonality: string;
  synapticDirectives: string[];
  autonomy: { autoExecute: boolean };
  profile?: AetherIdentityProfile;
}

export function getResolvedAetherPersonality(
  passedRules?: string[],
  passedName?: string,
  passedFreeText?: string
): ResolvedAetherPersonality {
  const profile = aetherPersonalitySystem.getActiveProfile();

  // 1. Resolve Preferred User Name
  let preferredUserName = (passedName || profile.preferredUserName || '').trim();

  if (!preferredUserName && typeof window !== 'undefined') {
    const directName = localStorage.getItem('aether_user_preferred_name');
    if (directName && directName.trim()) {
      preferredUserName = directName.trim();
    }
  }

  // 2. Resolve Free-text Custom Personality
  let customFreeText = (passedFreeText || profile.customPersonalityPrompt || '').trim();

  // 3. Resolve Synaptic Directives
  let directives: string[] = [];
  if (Array.isArray(passedRules) && passedRules.length > 0) {
    directives = [...passedRules];
  } else {
    directives = profile.synapticDirectives.filter(d => d.enabled).map(d => d.text);
  }

  // Map 0-100 to legacy thresholds
  const verbosity: 'concise' | 'balanced' | 'detailed' = 
    profile.verbosity <= 30 ? 'concise' : profile.verbosity >= 70 ? 'detailed' : 'balanced';

  const formality: 'casual' | 'balanced' | 'formal' = 
    profile.formality <= 30 ? 'casual' : profile.formality >= 70 ? 'formal' : 'balanced';

  const humor = Math.round(profile.humorLevel / 10);

  if (!preferredUserName) {
    preferredUserName = 'Developer';
  }

  return {
    preferredUserName,
    assistantName: profile.assistantDisplayName || 'Aether',
    tone: profile.tone,
    humor,
    verbosity,
    formality,
    profanityPreference: profile.profanityPreference,
    greetingStyle: profile.greetingStyle,
    proactivity: profile.proactivity > 60 ? 'high' : 'standard',
    customPersonality: customFreeText,
    synapticDirectives: directives,
    autonomy: { autoExecute: profile.autonomy.autoExecute },
    profile
  };
}

/**
 * Generates the personality instructions to inject directly into the system prompt
 * BEFORE Gemini model generation, ensuring the AI speaks in character immediately.
 */
export function generatePersonalityPromptInjection(personality: ResolvedAetherPersonality): string {
  return aetherPersonalitySystem.generateFullSystemPromptInjection();
}

export function formatResponseWithPersonality(
  rawText: string,
  personality: ResolvedAetherPersonality
): string {
  return aetherPersonalitySystem.formatTextThroughPersonality(rawText);
}
