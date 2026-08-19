// Aether Canonical Intent Resolver
// The single authoritative intent & entity parsing engine across DevSpace / Aether.
// Strictly enforces the State-Creating Action Firewall, Hard Search Precedence, and Entity Separation.

export type AetherCanonicalIntentType =
  | 'casual_greeting'
  | 'search_web'
  | 'search_youtube'
  | 'open_search_result'
  | 'search_result_query'
  | 'search_recommendation'
  | 'search_comparison'
  | 'recent_work_intelligence'
  | 'current_project_query'
  | 'conversation_topic_query'
  | 'blockers_query'
  | 'issues_summary'
  | 'get_weather'
  | 'what_do_you_think'
  | 'why_query'
  | 'tell_me_more'
  | 'brainstorm_ideas'
  | 'save_brainstorm_idea'
  | 'convert_idea_to_issue'
  | 'convert_issue_to_idea'
  | 'update_issue_priority'
  | 'update_issue_status'
  | 'create_sub_issue'
  | 'delete_issue'
  | 'github_merge_safety'
  | 'github_open_repo'
  | 'github_inspect_pr'
  | 'github_repo_changes'
  | 'github_attention_query'
  | 'github_destructive_action'
  | 'save_to_note'
  | 'save_to_idea'
  | 'navigate_to'
  | 'create_project'
  | 'create_issue'
  | 'add_note'
  | 'add_brainstorm_idea'
  | 'add_cortex_synapse'
  | 'update_user_name'
  | 'add_personality_rule'
  | 'devspace_customization'
  | 'launch_app'
  | 'desktop_list_apps'
  | 'desktop_alias_app'
  | 'desktop_search_files'
  | 'desktop_open_file'
  | 'desktop_open_terminal'
  | 'desktop_open_vscode'
  | 'open_workspace'
  | 'cancel_task'
  | 'chat_query'
  | 'user_tired_query'
  | 'light_work_suggestions'
  | 'what_should_i_work_on'
  | 'what_else_options'
  | 'liked_first_idea'
  | 'what_was_first_idea'
  | 'lets_do_that'
  | 'lets_do_other_idea'
  | 'temporal_main_thing'
  | 'temporal_why'
  | 'temporal_top_project'
  | 'temporal_accomplish_goal'
  | 'which_issue_matters_most'
  | 'create_mentioned_issue'
  | 'give_three_ideas'
  | 'which_idea_best'
  | 'save_second_idea'
  | 'make_third_issue'
  | 'search_important_part'
  | 'search_which_source'
  | 'youtube_which_first'
  | 'youtube_first_summary'
  | 'pre_search_context'
  | 'take_me_back'
  | 'take_me_to_project';

export interface CanonicalResolvedIntent {
  intent: AetherCanonicalIntentType;
  confidence: number;
  entities: Record<string, any>;
  requestedTool: string;
  riskLevel: 'safe' | 'state_creating' | 'destructive';
  reasoning: string;
  rawInput: string;
  normalizedInput: string;
  timestamp: number;
}

export interface ResolverConversationalContext {
  activeProjectId?: string;
  activeProjectName?: string;
  currentTopic?: string;
  availableProjects?: { id: string; name: string }[];
  previousProjectIds?: string[];
  lastSearchType?: 'web' | 'youtube';
  lastSearchQuery?: string;
  lastSearchResults?: any[];
  lastYouTubeResults?: any[];
  lastPresentedResultSet?: any[];
  lastSelectedResult?: any;
  lastCreatedIssue?: { id: string; title: string; priority?: string; projectId?: string };
  lastMentionedIdea?: { id?: string; number?: number; title: string; details?: string };
  workingMemory?: any[];
  awaitingInputFor?: 'project_name' | 'issue_title' | 'confirmation' | null;
}

export let lastCanonicalIntentTrace: CanonicalResolvedIntent | null = null;

// Parse ordinal words / numbers specifically for selection phrases like "first", "second", "option 2", "open 3", etc.
// Does NOT misinterpret quantifiers like "find three videos" or "give me 5 ideas".
export function parseOrdinalIndex(text: string): number | null {
  const norm = (text || '').toLowerCase().trim();
  if (!norm) return null;

  // 1. Standalone single digit or standalone index indicator: "1", "2", "#2", "option 2", "number 2", "result 2", "video 2"
  const standalone = norm.match(/^(?:option|number|result|video|source|article|link|entry|idea|item|#)?\s*#?\s*(\d+)$/i);
  if (standalone) {
    const val = parseInt(standalone[1], 10);
    if (val >= 1 && val <= 10) return val;
  }

  const ordinalWords = 'first|1st|second|2nd|third|3rd|fourth|4th|fifth|5th|sixth|6th|seventh|7th|eighth|8th|ninth|9th|tenth|10th';

  // 2. Explicit selection commands with an ordinal word or number:
  // "open 2", "open number 2", "open option 2", "open #2", "open the second one", "open the 2nd video"
  // "play 2", "play video 2", "watch 2", "watch the second one", "pull up option 2", "select 3", "choose 2"
  const actionTargetMatch = norm.match(
    new RegExp(`\\b(?:open|launch|play|watch|view|show|choose|select|pick|pull\\s+up|summarize|explain|about|save|star|discard)\\s+(?:the\\s+)?(?:video|option|number|result|source|item|idea|entry)?\\s*#?\\s*(\\d+|${ordinalWords})(?:\\s+(?:one|video|result|option|item|source|link))?\\b`, 'i')
  );

  if (actionTargetMatch && actionTargetMatch[1]) {
    const raw = actionTargetMatch[1].toLowerCase();
    const map: Record<string, number> = {
      '1': 1, '1st': 1, 'first': 1,
      '2': 2, '2nd': 2, 'second': 2,
      '3': 3, '3rd': 3, 'third': 3,
      '4': 4, '4th': 4, 'fourth': 4,
      '5': 5, '5th': 5, 'fifth': 5,
      '6': 6, '6th': 6, 'sixth': 6,
      '7': 7, '7th': 7, 'seventh': 7,
      '8': 8, '8th': 8, 'eighth': 8,
      '9': 9, '9th': 9, 'ninth': 9,
      '10': 10, '10th': 10, 'tenth': 10
    };
    if (map[raw] !== undefined) return map[raw];
  }

  // 3. Matched with prefix noun: "option 2", "number 3", "video 1", "#2", "the second one", "the 3rd video"
  const explicitOrdinalMatch = norm.match(
    new RegExp(`\\b(?:option|number|result|video|source|article|link|entry|idea|item)\\s*#?\\s*(\\d+|${ordinalWords}|one|two|three|four|five)\\b`, 'i')
  );

  if (explicitOrdinalMatch && explicitOrdinalMatch[1]) {
    const raw = explicitOrdinalMatch[1].toLowerCase();
    const map: Record<string, number> = {
      '1': 1, '1st': 1, 'first': 1, 'one': 1,
      '2': 2, '2nd': 2, 'second': 2, 'two': 2,
      '3': 3, '3rd': 3, 'third': 3, 'three': 3,
      '4': 4, '4th': 4, 'fourth': 4, 'four': 4,
      '5': 5, '5th': 5, 'fifth': 5, 'five': 5
    };
    if (map[raw] !== undefined) return map[raw];
  }

  // 4. Isolated ordinal phrases: "the second one", "the first one", "the 3rd one", "second one"
  const isolatedOrdinal = norm.match(
    new RegExp(`^(?:the\\s+)?(${ordinalWords})(?:\\s+one)?$`, 'i')
  );
  if (isolatedOrdinal && isolatedOrdinal[1]) {
    const raw = isolatedOrdinal[1].toLowerCase();
    const map: Record<string, number> = {
      '1st': 1, 'first': 1,
      '2nd': 2, 'second': 2,
      '3rd': 3, 'third': 3,
      '4th': 4, 'fourth': 4,
      '5th': 5, 'fifth': 5
    };
    if (map[raw] !== undefined) return map[raw];
  }

  return null;
}

// Clean search query from natural conversational wrappers
export function extractCleanSearchQuery(text: string): string {
  let q = text.replace(/[\.\,\!\?]+$/g, '').trim();

  q = q
    .replace(/^(?:can\s+you\s+)?(?:please\s+)?(?:google|search\s+google|google\s+search|search\s+for|search\s+the\s+web\s+for|search\s+the\s+web|search\s+online\s+for|search\s+online|search\s+up\s+information\s+about|search\s+up|look\s+up\s+on\s+google|look\s+up|find\s+information\s+about|find\s+me\s+information\s+on|find\s+me\s+information\s+about|research|find\s+current\s+information\s+about|what'?s\s+the\s+latest\s+on)\s*/i, '')
    .replace(/\s+(?:for\s+me|please|online|on\s+google)$/i, '')
    .trim();

  return q || text;
}

// Extract YouTube query and requested count with contextual fallback
export function extractCleanYouTubeQuery(text: string, contextTopic?: string): { query: string; count: number } {
  const norm = text.toLowerCase().trim();
  let count = 3;

  const countMatch = norm.match(/\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten|a few|a couple)\s+(?:youtube\s+)?(?:videos?|tutorials?|vids?|screencasts?)\b/i);
  if (countMatch) {
    const word = countMatch[1].toLowerCase();
    if (word === 'one' || word === '1') count = 1;
    else if (word === 'two' || word === '2' || word === 'a couple') count = 2;
    else if (word === 'three' || word === '3' || word === 'a few') count = 3;
    else if (word === 'four' || word === '4') count = 4;
    else if (word === 'five' || word === '5') count = 5;
    else {
      const p = parseInt(word, 10);
      if (!isNaN(p)) count = Math.min(10, Math.max(1, p));
    }
  }

  let q = text.replace(/[\.\,\!\?]+$/g, '').trim();

  // Strip natural leading search phrases:
  // e.g. "Find me three YouTube videos about React Server Components" -> "React Server Components"
  // "Search YouTube for React Server Components" -> "React Server Components"
  // "Find me a video called React Server Components Explained" -> "React Server Components Explained"
  // "Show me some YouTube tutorials about this" -> "this"
  q = q
    .replace(/^(?:can\s+you\s+)?(?:please\s+)?(?:search\s*up|search|find|look\s*up|get|show|bring\s*up|play|watch)\s+(?:me\s+)?(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|a few|a couple|some|a)?\s*(?:youtube\s+)?(?:videos?|tutorials?|vids?|screencasts?)\s*(?:called|named|about|on|for)?\s*/i, '')
    .replace(/^(?:can\s+you\s+)?(?:please\s+)?(?:search\s*up|search|find|look\s*up|get|show|bring\s*up)\s+(?:me\s+)?(?:on\s+)?youtube\s+(?:for|about|on|called|named)?\s*/i, '')
    .replace(/^youtube\s+(?:search|find|video|tutorials?|videos?)\s+(?:for|about|on|called|named)?\s*/i, '')
    .replace(/^(?:a\s+)?youtube\s+video\s+(?:called|named|about|on|for)?\s*/i, '')
    .replace(/^(?:a\s+)?video\s+(?:called|named|about|on|for)?\s*/i, '')
    .replace(/^(?:some\s+)?tutorials?\s+(?:on|about|for)?\s*/i, '')
    .replace(/\b(?:about|for|on)\s+(?:three|3|two|2|four|4|five|5|a few)\s+videos?\b/i, '')
    .replace(/\s+(?:on\s+youtube|on\s+the\s+web|online|please)$/i, '')
    .trim();

  // Resolve pronoun / demonstrative references ("about this", "about that", "this")
  if (
    (!q || q.toLowerCase() === 'this' || q.toLowerCase() === 'that' || q.toLowerCase() === 'it' || q.toLowerCase() === 'about this' || q.toLowerCase() === 'about that') &&
    contextTopic
  ) {
    q = contextTopic.replace(/^YouTube:\s*/i, '').replace(/^Research:\s*/i, '').trim();
  }

  return { query: q || contextTopic || 'React Web Development', count };
}

/**
 * Single Canonical Intent Resolver
 */
export function resolveCanonicalAetherIntent(
  rawInput: string,
  context: ResolverConversationalContext = {}
): CanonicalResolvedIntent {
  const norm = (rawInput || '')
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .trim();
  const strippedNorm = norm.replace(/[.,?!]+$/g, '').trim();
  const original = (rawInput || '').trim();

  // 1. CANCEL / STOP Directives
  if (
    strippedNorm === 'cancel' ||
    strippedNorm === 'stop' ||
    strippedNorm === 'never mind' ||
    strippedNorm === 'nevermind' ||
    strippedNorm === 'cancel task' ||
    strippedNorm === 'stop talking'
  ) {
    const result: CanonicalResolvedIntent = {
      intent: 'cancel_task',
      confidence: 1.0,
      entities: {},
      requestedTool: 'aetherCore.cancelPlayback',
      riskLevel: 'safe',
      reasoning: 'User explicitly commanded stop/cancel.',
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  // 2. USER PREFERRED NAME & PERSONALITY DIRECTIVES
  const callMeMatch =
    original.match(/(?:from now on\s+)?call me\s+([a-zA-Z0-9\s_\-]+)/i) ||
    original.match(/my name is\s+([a-zA-Z0-9\s_\-]+)/i);
  if (
    callMeMatch &&
    callMeMatch[1] &&
    !norm.startsWith('call it') &&
    !norm.includes('call this') &&
    !norm.includes('call visual studio') &&
    !norm.includes('call spotify')
  ) {
    let name = callMeMatch[1].trim();
    name = name.replace(/\s+from\s+now\s+on.*$/i, '');
    name = name.replace(/\s+please.*$/i, '');
    name = name.replace(/[.\,!]/g, '').trim();

    if (name.length > 0) {
      name = name.charAt(0).toUpperCase() + name.slice(1);
    }

    const result: CanonicalResolvedIntent = {
      intent: 'update_user_name',
      confidence: 0.99,
      entities: { preferredName: name },
      requestedTool: 'aetherVoiceRegistry.setPreferredName',
      riskLevel: 'safe',
      reasoning: 'Explicit user preferred name declaration.',
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  // 2.5 CASUAL GREETINGS & CHECK-INS (e.g. "Hey, what's going on?", "What's up?", "Hey Aether", "Good morning")
  const isCasualGreeting =
    /^(?:hey|hi|hello|yo|sup|hiya|howdy|greetings|good\s+morning|good\s+afternoon|good\s+evening)(?:\s+there)?(?:\s+aether)?[\s,\.!\?]*$/i.test(norm) ||
    /^(?:hey\s+)?(?:what(?:'s|s)\s+up|whats\s+up|sup)(?:\s+aether)?[\s,\.!\?]*$/i.test(norm) ||
    /^(?:hey\s+)?(?:what(?:'s|s)\s+going\s+on|whats\s+going\s+on)(?:\s+aether)?(?:\s+today)?[\s,\.!\?]*$/i.test(norm) ||
    /^(?:hey\s+)?(?:how(?:'s|s)\s+it\s+going|how\s+are\s+you(?:\s+doing)?|how\s+are\s+things)(?:\s+today)?(?:\s+aether)?[\s,\.!\?]*$/i.test(norm) ||
    /^(?:hey\s+)?(?:what(?:'s|s)\s+new|whats\s+new)(?:\s+aether)?[\s,\.!\?]*$/i.test(norm);

  if (isCasualGreeting) {
    const result: CanonicalResolvedIntent = {
      intent: 'casual_greeting',
      confidence: 0.99,
      entities: {},
      requestedTool: 'aetherConversationalEngine.getGreeting',
      riskLevel: 'safe',
      reasoning: 'Casual conversational greeting or status inquiry.',
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  // =========================================================================
  // 3. HARD SEARCH & SELECTION PRECEDENCE (YouTube, Google, Options, Recommendations)
  // Prevents YouTube and Web searches from EVER falling into project context or memory notes!
  // =========================================================================
  const ordinalIndex = parseOrdinalIndex(norm);
  const hasActiveResults = Boolean(
    (context.lastPresentedResultSet && context.lastPresentedResultSet.length > 0) ||
    (context.lastSearchResults && context.lastSearchResults.length > 0) ||
    (context.lastYouTubeResults && context.lastYouTubeResults.length > 0)
  );

  // A. OPEN SPECIFIC SEARCH / YOUTUBE RESULT ("Open number 2", "Open option 2", "Play 2", "Watch 2", "Open the second one", "Pull that up")
  const isPullOrOpenPhrasing =
    norm.includes('pull that up') ||
    norm.includes('pull it up') ||
    norm.includes('pull up') ||
    norm.includes('open that article') ||
    norm.includes('open the article') ||
    norm.includes('open that video') ||
    norm.includes('open the video') ||
    norm.includes('open that source') ||
    norm.includes('open the source') ||
    norm.includes('open the link') ||
    norm.includes('open that up') ||
    norm === 'open that' ||
    norm === 'open it' ||
    norm === 'pull that' ||
    norm === 'play it' ||
    norm === 'watch it';

  if (
    (ordinalIndex !== null &&
      (norm.startsWith('open') ||
        norm.startsWith('play') ||
        norm.startsWith('watch') ||
        norm.startsWith('launch') ||
        norm.startsWith('view') ||
        norm.startsWith('show') ||
        norm.startsWith('pull') ||
        norm.includes('pull up') ||
        norm.startsWith('choose') ||
        norm.startsWith('select') ||
        norm.startsWith('pick') ||
        norm === `option ${ordinalIndex}` ||
        norm === `number ${ordinalIndex}` ||
        norm === `video ${ordinalIndex}` ||
        norm === `result ${ordinalIndex}` ||
        norm === `#${ordinalIndex}` ||
        norm === `${ordinalIndex}`)) ||
    (isPullOrOpenPhrasing && (hasActiveResults || context.lastSelectedResult))
  ) {
    const targetIdx = ordinalIndex !== null ? ordinalIndex - 1 : 0;
    const result: CanonicalResolvedIntent = {
      intent: 'open_search_result',
      confidence: 0.99,
      entities: { index: targetIdx, ordinalNumber: targetIdx + 1 },
      requestedTool: 'aetherDesktopIntelligence.openResultOption',
      riskLevel: 'safe',
      reasoning: `User requested opening search result option #${targetIdx + 1}.`,
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  // B. SEARCH RECOMMENDATION / "Which one is best?", "Which video should I watch?", "What do you recommend?"
  if (
    norm.includes('which is best') ||
    norm.includes('which one is best') ||
    norm.includes('which video is best') ||
    norm.includes('which one should i watch') ||
    norm.includes('which should i watch') ||
    norm.includes('which video should i watch') ||
    norm.includes('which one would you pick') ||
    norm.includes('which one would you watch') ||
    norm.includes('which one do you think is best') ||
    norm.includes('which one do you recommend') ||
    norm.includes('what do you recommend') ||
    norm.includes('which do you recommend') ||
    norm.includes('which tutorial is best') ||
    norm.includes('what is the best') ||
    norm.includes("what's the best") ||
    norm.includes('best option') ||
    norm.includes('best video') ||
    norm.includes('best tutorial') ||
    norm.includes('best one') ||
    norm.includes('pick one for me')
  ) {
    const isYT = context.lastSearchType === 'youtube' || (context.lastYouTubeResults && context.lastYouTubeResults.length > 0);
    const result: CanonicalResolvedIntent = {
      intent: isYT ? 'youtube_which_first' : 'search_recommendation',
      confidence: 0.99,
      entities: { searchType: context.lastSearchType || (isYT ? 'youtube' : 'web') },
      requestedTool: 'aetherConversationalEngine.recommendTopResult',
      riskLevel: 'safe',
      reasoning: 'User asked for best option/video recommendation.',
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  // C. SEARCH RESULT QUERY / SUMMARY ("What's the second one about?", "Summarize number 1", "Tell me about option 2")
  if (
    (ordinalIndex !== null || norm.includes('explain it simply') || norm.includes("what's the important part") || norm.includes('whats the important part')) &&
    (norm.includes('what is') ||
      norm.includes("what's") ||
      norm.includes('tell me about') ||
      norm.includes('summarize') ||
      norm.includes('explain') ||
      norm.includes('what does it say') ||
      norm.includes('important part') ||
      norm.includes('read'))
  ) {
    const idx = ordinalIndex !== null ? ordinalIndex - 1 : 0;
    const isYT = context.lastSearchType === 'youtube' || (context.lastYouTubeResults && context.lastYouTubeResults.length > 0);
    const result: CanonicalResolvedIntent = {
      intent: (isYT && idx === 0) ? 'youtube_first_summary' : 'search_result_query',
      confidence: 0.98,
      entities: { index: idx, ordinalNumber: idx + 1 },
      requestedTool: 'aetherConversationalEngine.summarizeResultOption',
      riskLevel: 'safe',
      reasoning: `User requested details/summary for search result option #${idx + 1}.`,
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  // D. SEARCH RESULT COMPARISON ("Compare the first two", "Compare option 1 and 2")
  if (
    hasActiveResults &&
    (norm.includes('compare the first two') ||
      norm.includes('compare the two') ||
      norm.includes('compare option 1 and') ||
      norm.includes('compare both'))
  ) {
    const result: CanonicalResolvedIntent = {
      intent: 'search_comparison',
      confidence: 0.98,
      entities: {},
      requestedTool: 'aetherConversationalEngine.compareSearchResults',
      riskLevel: 'safe',
      reasoning: 'User requested comparison between top search results.',
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  // E. HARD SEARCH PRECEDENCE: YOUTUBE & MEDIA SEARCH
  // Triggered whenever the user says YouTube, video(s), tutorial(s), screencast(s), watch, etc.
  const hasYouTubeKeywords =
    norm.includes('youtube') ||
    norm.includes('video') ||
    norm.includes('videos') ||
    norm.includes('tutorial') ||
    norm.includes('tutorials') ||
    norm.includes('screencast') ||
    norm.includes('screencasts') ||
    norm.includes('vids') ||
    norm.startsWith('watch ') ||
    norm.startsWith('play video') ||
    norm.startsWith('play youtube') ||
    norm.startsWith('find video') ||
    norm.startsWith('search video');

  if (hasYouTubeKeywords && (ordinalIndex === null || norm.includes('youtube') || norm.includes('videos about') || norm.includes('video called') || norm.includes('tutorials about'))) {
    const { query, count } = extractCleanYouTubeQuery(original, context.currentTopic || context.lastSearchQuery || context.activeProjectName);
    const result: CanonicalResolvedIntent = {
      intent: 'search_youtube',
      confidence: 0.99,
      entities: { query, count },
      requestedTool: 'aetherDesktopIntelligence.searchYouTube',
      riskLevel: 'safe',
      reasoning: 'YouTube/Video search intent identified with hard search precedence.',
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  // F. HARD SEARCH PRECEDENCE: GOOGLE & GENERAL WEB SEARCH
  const isGoogleOrWebSearch =
    norm.startsWith('google ') ||
    norm.includes('search google') ||
    norm.includes('google search') ||
    norm.includes('search on google') ||
    norm.includes('look up on google') ||
    norm.startsWith('search the web') ||
    norm.startsWith('search online') ||
    norm.startsWith('look up ') ||
    norm.startsWith('research ') ||
    norm.includes('find information about') ||
    norm.includes('find me information') ||
    norm.includes('search up information') ||
    norm.includes('search up ') ||
    norm.startsWith('what is the latest on') ||
    norm.startsWith("what's the latest on") ||
    norm.startsWith('search for ');

  if (isGoogleOrWebSearch && ordinalIndex === null) {
    const query = extractCleanSearchQuery(original);
    const result: CanonicalResolvedIntent = {
      intent: 'search_web',
      confidence: 0.98,
      entities: { query },
      requestedTool: 'aetherDesktopIntelligence.searchWeb',
      riskLevel: 'safe',
      reasoning: 'Google / Web Search intent identified with hard search precedence.',
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  // 3. RECENT WORK & WORKSPACE INTELLIGENCE
  const isRecentWorkQuery =
    norm.includes('what am i doing') ||
    norm.includes('what am i working on') ||
    norm.includes('what have i been working on') ||
    norm.includes('what have i been doing') ||
    norm.includes('what have we been working on') ||
    norm.includes('what was i working on') ||
    norm.includes('what did i work on') ||
    norm.includes('what was i doing') ||
    norm.includes('what did i do') ||
    norm.includes('what about yesterday') ||
    norm.includes('what did i do yesterday') ||
    norm.includes('what was i doing yesterday') ||
    norm.includes('what did i work on today') ||
    norm.includes('what was i doing today') ||
    norm.includes('what did i work on yesterday') ||
    norm.includes('what did i do this week') ||
    norm.includes('what have i been doing this week') ||
    norm.includes('what was i working on last month') ||
    norm.includes('what changed in that repo') ||
    norm.includes('what changed recently') ||
    norm.includes("what's changed since") ||
    norm.includes('whats changed since') ||
    norm.includes("what's going on with") ||
    norm.includes('whats going on with') ||
    norm.includes('what should i work on') ||
    norm.includes('what should we work on') ||
    norm.includes('what should i do next') ||
    norm.includes('recent activity') ||
    norm.includes('recent work') ||
    norm.includes('catch me up') ||
    norm.includes('workspace status') ||
    norm.includes('project status');

  if (isRecentWorkQuery) {
    let targetProjectName: string | undefined = undefined;
    let timeFilter: 'today' | 'yesterday' | 'this_week' | 'last_month' | 'recent' = 'recent';

    if (norm.includes('today')) {
      timeFilter = 'today';
    } else if (norm.includes('yesterday')) {
      timeFilter = 'yesterday';
    } else if (norm.includes('this week') || norm.includes('past week')) {
      timeFilter = 'this_week';
    } else if (norm.includes('last month') || norm.includes('past month')) {
      timeFilter = 'last_month';
    }

    const matchGoingOn = original.match(/what(?:'s|s)?\s+going\s+on\s+with\s+(.+)/i);
    const matchDoingIn = original.match(/what\s+(?:was\s+i\s+doing|did\s+i\s+do|have\s+i\s+been\s+doing)\s+in\s+(.+)/i);
    if (matchGoingOn && matchGoingOn[1]) {
      targetProjectName = matchGoingOn[1].replace(/[\.\,\!\?]/g, '').trim();
    } else if (matchDoingIn && matchDoingIn[1]) {
      targetProjectName = matchDoingIn[1].replace(/[\.\,\!\?]/g, '').trim();
    }

    const result: CanonicalResolvedIntent = {
      intent: 'recent_work_intelligence',
      confidence: 0.98,
      entities: { targetProjectName, timeFilter },
      requestedTool: 'aetherActiveProjectContext.getRecentWorkReport',
      riskLevel: 'safe',
      reasoning: 'User requested recent work intelligence or project status.',
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  // 3.2 WEATHER QUERIES & WEATHER FOLLOW-UPS
  if (norm.includes('weather') || norm.includes('temperature in') || norm.includes('forecast for') || norm.includes('is it supposed to rain') || norm.includes('will it rain') || norm.includes('what about tomorrow') || norm.includes('rain later')) {
    const locMatch = original.match(/weather\s+(?:in|for|at|like\s+in)?\s*([a-zA-Z\s]+)/i);
    let loc = locMatch ? locMatch[1].trim() : 'Miami';
    loc = loc.replace(/\b(today|tomorrow|right now|currently|this week|later|forecast)\b/gi, '').trim();
    if (!loc || loc.length < 2) loc = 'Miami';

    const isRain = norm.includes('rain') || norm.includes('precipitation');
    const isTomorrow = norm.includes('tomorrow');

    const result: CanonicalResolvedIntent = {
      intent: 'get_weather',
      confidence: 0.99,
      entities: { location: loc, isRain, isTomorrow },
      requestedTool: 'aetherDesktopIntelligence.getWeather',
      riskLevel: 'safe',
      reasoning: `User asked for weather in ${loc}.`,
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  // 3.25 MULTI-TURN DIALOGUE FLOW: TIREDNESS & BRAINSTORMING
  if (
    strippedNorm === "i'm kind of tired" ||
    strippedNorm === 'im kind of tired' ||
    strippedNorm === 'i am tired' ||
    strippedNorm === "i'm tired" ||
    strippedNorm === 'im tired' ||
    strippedNorm === 'feeling tired' ||
    strippedNorm === 'tired' ||
    strippedNorm.startsWith("i'm tired") ||
    strippedNorm.startsWith("im tired")
  ) {
    const result: CanonicalResolvedIntent = {
      intent: 'user_tired_query',
      confidence: 0.98,
      entities: {},
      requestedTool: 'aetherConversationalEngine.handleTiredQuery',
      riskLevel: 'safe',
      reasoning: 'User expressed tiredness during session.',
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  if (
    strippedNorm.includes('still want to work on something') ||
    strippedNorm.includes('still want to build something') ||
    strippedNorm.includes('want to work on something') ||
    strippedNorm.includes('still want to code')
  ) {
    const result: CanonicalResolvedIntent = {
      intent: 'light_work_suggestions',
      confidence: 0.98,
      entities: {},
      requestedTool: 'aetherConversationalEngine.handleLightWorkSuggestions',
      riskLevel: 'safe',
      reasoning: 'User requested light low-friction work suggestions.',
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  if (
    strippedNorm === 'what do you think i should work on' ||
    strippedNorm === 'what should i work on' ||
    strippedNorm === 'what do you suggest' ||
    strippedNorm === 'what do you think' ||
    strippedNorm === 'what do you think?' ||
    strippedNorm.startsWith('what do you think')
  ) {
    const result: CanonicalResolvedIntent = {
      intent: 'what_should_i_work_on',
      confidence: 0.98,
      entities: {},
      requestedTool: 'aetherConversationalEngine.handleWorkRecommendations',
      riskLevel: 'safe',
      reasoning: 'User asked for work recommendations or suggestions.',
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  if (
    strippedNorm === 'why' ||
    strippedNorm === 'why?' ||
    strippedNorm.startsWith('why ') ||
    strippedNorm.startsWith('why do you think')
  ) {
    const result: CanonicalResolvedIntent = {
      intent: 'why_query',
      confidence: 0.98,
      entities: {},
      requestedTool: 'aetherConversationalEngine.handleWhyQuery',
      riskLevel: 'safe',
      reasoning: 'User asked for reasoning or justification.',
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  if (
    strippedNorm === 'what else could i do' ||
    strippedNorm === 'what else can i do' ||
    strippedNorm === 'what else' ||
    strippedNorm === 'what else?' ||
    strippedNorm === 'what other ideas' ||
    strippedNorm.startsWith('what else')
  ) {
    const result: CanonicalResolvedIntent = {
      intent: 'what_else_options',
      confidence: 0.98,
      entities: {},
      requestedTool: 'aetherConversationalEngine.handleWhatElseOptions',
      riskLevel: 'safe',
      reasoning: 'User asked for alternate options.',
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  if (
    strippedNorm.includes('first idea sounded better') ||
    strippedNorm.includes('first thing sounded better') ||
    strippedNorm.includes('first one sounded better') ||
    strippedNorm.includes('liked the first idea better') ||
    strippedNorm.includes('like the first idea better') ||
    strippedNorm.includes('first idea was better') ||
    strippedNorm.includes('first thing was better')
  ) {
    const result: CanonicalResolvedIntent = {
      intent: 'liked_first_idea',
      confidence: 0.98,
      entities: {},
      requestedTool: 'aetherConversationalEngine.handleLikedFirstIdea',
      riskLevel: 'safe',
      reasoning: 'User preferred the first brainstormed idea.',
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  if (
    strippedNorm === 'what was the first idea' ||
    strippedNorm === 'what was the first thing' ||
    strippedNorm === 'what was the first one' ||
    strippedNorm.includes('what was the first idea') ||
    strippedNorm.includes('what was the first thing') ||
    strippedNorm.includes('remind me what the first idea was') ||
    strippedNorm.includes('remind me what the first thing was')
  ) {
    const result: CanonicalResolvedIntent = {
      intent: 'what_was_first_idea',
      confidence: 0.98,
      entities: {},
      requestedTool: 'aetherConversationalEngine.handleRecallFirstIdea',
      riskLevel: 'safe',
      reasoning: 'User asked to recall the first idea.',
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  if (
    strippedNorm === "okay, let's do that" ||
    strippedNorm === 'okay lets do that' ||
    strippedNorm === "let's do that" ||
    strippedNorm === 'lets do that' ||
    strippedNorm === "let's do it" ||
    strippedNorm === 'lets do it' ||
    strippedNorm === "lets do that one"
  ) {
    const result: CanonicalResolvedIntent = {
      intent: 'lets_do_that',
      confidence: 0.98,
      entities: {},
      requestedTool: 'aetherConversationalEngine.handleActivateSelectedIdea',
      riskLevel: 'safe',
      reasoning: 'User confirmed selection of the active idea.',
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  if (
    strippedNorm.includes("let's do the other idea instead") ||
    strippedNorm.includes('lets do the other idea instead') ||
    strippedNorm.includes('other idea instead')
  ) {
    const result: CanonicalResolvedIntent = {
      intent: 'lets_do_other_idea',
      confidence: 0.98,
      entities: {},
      requestedTool: 'aetherConversationalEngine.handleSwitchToOtherIdea',
      riskLevel: 'safe',
      reasoning: 'User requested switching to alternate idea.',
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  // 3.26 TEMPORAL MEMORY FOLLOW-UPS
  if (norm.includes('what was the main thing') || norm.includes('what was the primary thing') || norm.includes('main focus')) {
    const result: CanonicalResolvedIntent = {
      intent: 'temporal_main_thing',
      confidence: 0.98,
      entities: {},
      requestedTool: 'aetherConversationalEngine.handleTemporalMainThing',
      riskLevel: 'safe',
      reasoning: 'User asked for the main focus of the period.',
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  if (norm.includes('why was i working on that') || norm.includes('why were we working on that') || norm.includes('why was i doing that')) {
    const result: CanonicalResolvedIntent = {
      intent: 'temporal_why',
      confidence: 0.98,
      entities: {},
      requestedTool: 'aetherConversationalEngine.handleTemporalWhy',
      riskLevel: 'safe',
      reasoning: 'User asked why they worked on the main topic.',
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  if (norm.includes('which project did i spend the most time on') || norm.includes('what project did i spend the most time on') || norm.includes('most time on')) {
    const result: CanonicalResolvedIntent = {
      intent: 'temporal_top_project',
      confidence: 0.98,
      entities: {},
      requestedTool: 'aetherConversationalEngine.handleTemporalTopProject',
      riskLevel: 'safe',
      reasoning: 'User asked which project took the most time.',
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  if (norm.includes('what was i trying to accomplish') || norm.includes('what was the goal') || norm.includes('what were we trying to accomplish')) {
    const result: CanonicalResolvedIntent = {
      intent: 'temporal_accomplish_goal',
      confidence: 0.98,
      entities: {},
      requestedTool: 'aetherConversationalEngine.handleTemporalGoal',
      riskLevel: 'safe',
      reasoning: 'User asked for the high-level goal of past work.',
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  // 3.27 PROJECT ISSUES & PRIORITIZATION FOLLOW-UPS
  if (norm.includes('which one matters most') || norm.includes('which issue matters most') || norm.includes('what matters most')) {
    const result: CanonicalResolvedIntent = {
      intent: 'which_issue_matters_most',
      confidence: 0.98,
      entities: {},
      requestedTool: 'aetherConversationalEngine.handleTopIssueMattersMost',
      riskLevel: 'safe',
      reasoning: 'User asked which open issue is highest priority.',
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  if (norm.includes('create a new issue for the thing you just mentioned') || norm.includes('create an issue for the thing you just mentioned') || norm.includes('create issue for the thing you just mentioned')) {
    const result: CanonicalResolvedIntent = {
      intent: 'create_mentioned_issue',
      confidence: 0.98,
      entities: {},
      requestedTool: 'aetherConversationalEngine.handleCreateMentionedIssue',
      riskLevel: 'safe',
      reasoning: 'User asked to create an issue for recently mentioned topic.',
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  // 3.28 BRAINSTORMING FOLLOW-UPS: IDEAS FOR FIXING
  if (norm.includes('three ideas for fixing it') || norm.includes('3 ideas for fixing it') || norm.includes('ideas for fixing it')) {
    const result: CanonicalResolvedIntent = {
      intent: 'give_three_ideas',
      confidence: 0.98,
      entities: { count: 3 },
      requestedTool: 'aetherConversationalEngine.handleGiveThreeIdeas',
      riskLevel: 'safe',
      reasoning: 'User requested 3 ideas for fixing the issue.',
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  if (norm.includes('which one do you like best') || norm.includes('which one do you prefer')) {
    const result: CanonicalResolvedIntent = {
      intent: 'which_idea_best',
      confidence: 0.98,
      entities: {},
      requestedTool: 'aetherConversationalEngine.handleWhichIdeaBest',
      riskLevel: 'safe',
      reasoning: 'User asked which idea is best.',
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  if (norm.includes('save the second one as an idea') || norm.includes('save the second idea') || norm.includes('save idea 2')) {
    const result: CanonicalResolvedIntent = {
      intent: 'save_second_idea',
      confidence: 0.98,
      entities: { ideaIndex: 2 },
      requestedTool: 'aetherConversationalEngine.handleSaveSecondIdea',
      riskLevel: 'safe',
      reasoning: 'User asked to save the second idea.',
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  if (norm.includes('make the third one an issue too') || norm.includes('make the third idea an issue') || norm.includes('turn the third one into an issue')) {
    const result: CanonicalResolvedIntent = {
      intent: 'make_third_issue',
      confidence: 0.98,
      entities: { ideaIndex: 3 },
      requestedTool: 'aetherConversationalEngine.handleMakeThirdIssue',
      riskLevel: 'safe',
      reasoning: 'User asked to create an issue from idea 3.',
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  // 3.29 SEARCH / MEDIA RESULT FOLLOW-UPS
  if (norm.includes("what's the important part") || norm.includes('whats the important part') || norm.includes('what is the important part')) {
    const result: CanonicalResolvedIntent = {
      intent: 'search_important_part',
      confidence: 0.98,
      entities: {},
      requestedTool: 'aetherConversationalEngine.handleSearchImportantPart',
      riskLevel: 'safe',
      reasoning: 'User asked for the key takeaway of the search result.',
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  if (norm.includes('which source should i read') || norm.includes('which one would you read')) {
    const result: CanonicalResolvedIntent = {
      intent: 'search_which_source',
      confidence: 0.98,
      entities: {},
      requestedTool: 'aetherConversationalEngine.handleSearchWhichSource',
      riskLevel: 'safe',
      reasoning: 'User asked which search source to read.',
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  if (norm.includes('which one would you watch first') || norm.includes('which video would you watch')) {
    const result: CanonicalResolvedIntent = {
      intent: 'youtube_which_first',
      confidence: 0.98,
      entities: {},
      requestedTool: 'aetherConversationalEngine.handleYoutubeWhichFirst',
      riskLevel: 'safe',
      reasoning: 'User asked which YouTube video to watch first.',
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  if (norm.includes('what was the first one about') || norm.includes('what was video 1 about') || norm.includes('what was option 1 about')) {
    const result: CanonicalResolvedIntent = {
      intent: 'youtube_first_summary',
      confidence: 0.98,
      entities: {},
      requestedTool: 'aetherConversationalEngine.handleYoutubeFirstSummary',
      riskLevel: 'safe',
      reasoning: 'User asked for summary of the first video/result.',
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  // 3.30 CONTEXT RESTORATION
  if (norm.includes('what were we doing before the search') || norm.includes('what were we doing before search') || norm.includes('before the search')) {
    const result: CanonicalResolvedIntent = {
      intent: 'pre_search_context',
      confidence: 0.98,
      entities: {},
      requestedTool: 'aetherConversationalEngine.handlePreSearchContext',
      riskLevel: 'safe',
      reasoning: 'User asked what context existed before the search.',
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  if (norm === 'take me back there' || norm === 'take me back' || norm === 'go back') {
    const result: CanonicalResolvedIntent = {
      intent: 'take_me_back',
      confidence: 0.98,
      entities: {},
      requestedTool: 'aetherConversationalEngine.handleTakeMeBack',
      riskLevel: 'safe',
      reasoning: 'User asked to navigate back to pre-search context.',
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  if (norm === 'take me to that project' || norm === 'open that project' || norm === 'take me there') {
    const result: CanonicalResolvedIntent = {
      intent: 'take_me_to_project',
      confidence: 0.98,
      entities: {},
      requestedTool: 'aetherConversationalEngine.handleTakeMeToProject',
      riskLevel: 'safe',
      reasoning: 'User requested navigation to the discussed project.',
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  // 3.3 CONVERSATIONAL FOLLOW-UPS ("What do you think?", "Why?", "Tell me more")
  if (
    norm === 'what do you think?' ||
    norm === 'what do you think' ||
    norm === 'what are your thoughts' ||
    norm === 'what are your thoughts?' ||
    norm === 'give me your opinion'
  ) {
    const result: CanonicalResolvedIntent = {
      intent: 'what_do_you_think',
      confidence: 0.98,
      entities: {},
      requestedTool: 'aetherConversationalEngine.handleFollowUpOpinion',
      riskLevel: 'safe',
      reasoning: 'User asked for opinion or architectural assessment.',
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  if (norm === 'why?' || norm === 'why' || norm === 'why is that?' || norm === 'why is that') {
    const result: CanonicalResolvedIntent = {
      intent: 'why_query',
      confidence: 0.98,
      entities: {},
      requestedTool: 'aetherConversationalEngine.handleFollowUpWhy',
      riskLevel: 'safe',
      reasoning: 'User asked for architectural justification.',
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  if (
    norm === 'tell me more' ||
    norm === 'tell me more.' ||
    norm === 'elaborate' ||
    norm === 'can you elaborate?' ||
    norm === 'can you elaborate'
  ) {
    const result: CanonicalResolvedIntent = {
      intent: 'tell_me_more',
      confidence: 0.98,
      entities: {},
      requestedTool: 'aetherConversationalEngine.handleFollowUpElaborate',
      riskLevel: 'safe',
      reasoning: 'User requested elaboration on active context.',
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  // 3.5 CURRENT PROJECT QUERY
  if (
    norm.includes('what project am i in') ||
    norm.includes('what is my project') ||
    norm.includes("what's my project") ||
    norm.includes('whats my project') ||
    norm.includes('which project am i in') ||
    norm.includes('what is the current project') ||
    norm.includes("what's the current project") ||
    norm.includes('whats the current project') ||
    norm.includes('what is my active project') ||
    norm.includes("what's my active project") ||
    norm.includes('whats my active project') ||
    norm.includes('active project') ||
    norm.includes('current project')
  ) {
    const result: CanonicalResolvedIntent = {
      intent: 'current_project_query',
      confidence: 0.98,
      entities: {},
      requestedTool: 'aetherConversationalEngine.getCurrentProjectInfo',
      riskLevel: 'safe',
      reasoning: 'User asked for current active project.',
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  // 3.6 CONVERSATION TOPIC QUERY
  if (
    norm.includes('what were we talking about') ||
    norm.includes('what were we just talking about') ||
    norm.includes('what did we talk about') ||
    norm.includes('what was our topic') ||
    norm.includes('what was the topic') ||
    norm.includes('what are we talking about') ||
    norm.includes('remind me what we were discussing')
  ) {
    const result: CanonicalResolvedIntent = {
      intent: 'conversation_topic_query',
      confidence: 0.98,
      entities: {},
      requestedTool: 'aetherConversationalEngine.getConversationTopic',
      riskLevel: 'safe',
      reasoning: 'User asked about the active conversation topic.',
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  // 4. BLOCKERS & OPEN ISSUES SUMMARY
  if (norm.includes('blocking') || norm.includes('blockers') || norm.includes('what is blocking') || norm.includes("what's blocking")) {
    const result: CanonicalResolvedIntent = {
      intent: 'blockers_query',
      confidence: 0.98,
      entities: {},
      requestedTool: 'aetherActiveProjectContext.getBlockers',
      riskLevel: 'safe',
      reasoning: 'User requested blocker identification for active project.',
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  if (norm.includes('summarize open issues') || norm.includes('summarize issues') || norm.includes('show open issues') || norm.includes('list open issues') || norm.includes('open issues')) {
    const result: CanonicalResolvedIntent = {
      intent: 'issues_summary',
      confidence: 0.97,
      entities: {},
      requestedTool: 'aetherActiveProjectContext.summarizeOpenIssues',
      riskLevel: 'safe',
      reasoning: 'User requested summary of open issues.',
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  // 5. GITHUB MERGE SAFETY & PR INSPECTION
  const prNumberMatch = norm.match(/(?:pr|pull\s*request)\s*#?(\d+)/i);
  const pullNumber = prNumberMatch ? parseInt(prNumberMatch[1], 10) : undefined;

  if (
    (norm.includes('safe to merge') ||
      norm.includes('check merge') ||
      norm.includes('prepare it for merge') ||
      norm.includes('can we merge') ||
      norm.includes('prepare for merge') ||
      norm.includes('merge safety')) &&
    (pullNumber || context.activeProjectId)
  ) {
    const result: CanonicalResolvedIntent = {
      intent: 'github_merge_safety',
      confidence: 0.99,
      entities: { pullNumber: pullNumber || 1 },
      requestedTool: 'aetherActiveProjectContext.evaluatePRMergeSafety',
      riskLevel: 'safe',
      reasoning: 'User requested PR merge safety evaluation.',
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  if (
    norm.includes('open the repo') ||
    norm.includes('open repo') ||
    norm.includes('show the repo') ||
    norm.includes('go to repo') ||
    norm.includes('take me to repo')
  ) {
    const result: CanonicalResolvedIntent = {
      intent: 'github_open_repo',
      confidence: 0.98,
      entities: {},
      requestedTool: 'aetherActiveProjectContext.openConnectedRepository',
      riskLevel: 'safe',
      reasoning: 'User requested opening connected GitHub repository.',
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  // 5.1 GITHUB REPO CHANGES & PUSH HISTORY
  if (
    norm.includes('what changed in this repo') ||
    norm.includes('what changed in that repo') ||
    norm.includes('what changed in the repo') ||
    norm.includes('what did i push') ||
    norm.includes('what was pushed') ||
    norm.includes('summarize what changed since') ||
    norm.includes('changes in this repo') ||
    norm.includes('recent commits in repo') ||
    norm.includes('git commits today') ||
    norm.includes('commits today') ||
    norm.includes('commits yesterday')
  ) {
    let timeWindow: 'today' | 'yesterday' | 'this_week' | 'recent' = 'recent';
    if (norm.includes('today')) timeWindow = 'today';
    else if (norm.includes('yesterday')) timeWindow = 'yesterday';
    else if (norm.includes('this week') || norm.includes('last week')) timeWindow = 'this_week';

    const result: CanonicalResolvedIntent = {
      intent: 'github_repo_changes',
      confidence: 0.99,
      entities: { timeWindow },
      requestedTool: 'aetherActiveProjectContext.getGitHubRepoChanges',
      riskLevel: 'safe',
      reasoning: 'User requested repository commit/change history.',
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  // 5.2 GITHUB ATTENTION & BLOCKED REVIEWS QUERY
  if (
    norm.includes('does anything need my attention') ||
    norm.includes('anything need my attention') ||
    norm.includes('needs my attention') ||
    norm.includes('pending reviews') ||
    norm.includes('what needs attention') ||
    norm.includes('what requires attention')
  ) {
    const result: CanonicalResolvedIntent = {
      intent: 'github_attention_query',
      confidence: 0.98,
      entities: {},
      requestedTool: 'aetherActiveProjectContext.getAttentionItems',
      riskLevel: 'safe',
      reasoning: 'User asked if anything in repo or workspace needs attention.',
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  // 5.3 GITHUB INSPECT PULL REQUEST
  if (
    (norm.includes('what is going on with this pull request') ||
      norm.includes('what is going on with the pull request') ||
      norm.includes('whats going on with this pr') ||
      norm.includes('whats going on with the pr') ||
      norm.includes('status of pr') ||
      norm.includes('status of this pr') ||
      norm.includes('inspect pr') ||
      norm.includes('inspect pull request')) &&
    !norm.includes('merge')
  ) {
    const result: CanonicalResolvedIntent = {
      intent: 'github_inspect_pr',
      confidence: 0.98,
      entities: { pullNumber: pullNumber || 1 },
      requestedTool: 'aetherActiveProjectContext.inspectPullRequest',
      riskLevel: 'safe',
      reasoning: 'User requested status inspection of pull request.',
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  // 5.4 GITHUB DESTRUCTIVE ACTION SAFETY BARRIER (Merge, Delete Branch, Force Push)
  if (
    norm.startsWith('merge pr') ||
    norm.startsWith('merge pull request') ||
    norm.startsWith('delete branch') ||
    norm.startsWith('force push') ||
    norm.includes('force push to') ||
    norm.includes('delete the branch')
  ) {
    const actionType = norm.includes('delete') ? 'delete_branch' : norm.includes('force') ? 'force_push' : 'merge_pr';
    const result: CanonicalResolvedIntent = {
      intent: 'github_destructive_action',
      confidence: 0.99,
      entities: { actionType, pullNumber: pullNumber || 1, raw: original },
      requestedTool: 'aetherActiveProjectContext.requestDestructiveConfirmation',
      riskLevel: 'destructive',
      reasoning: 'Potentially destructive GitHub operation detected; requires explicit confirmation.',
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  // 6. WORKSPACE OPENER MACRO
  if (
    norm === 'open my workspace' ||
    norm === 'open workspace' ||
    norm === 'launch workspace' ||
    norm.includes('open my dev workspace')
  ) {
    const result: CanonicalResolvedIntent = {
      intent: 'open_workspace',
      confidence: 0.99,
      entities: {},
      requestedTool: 'aetherConversationalEngine.handleOpenWorkspace',
      riskLevel: 'safe',
      reasoning: 'User triggered Open Workspace multi-step macro.',
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }



  // 7. CONVERT / MUTATE ISSUE & IDEA (Contextual)
  // Convert Issue to Idea ("Actually make it an idea instead", "Turn that into an idea", "Make it an idea")
  if (
    norm.includes('make it an idea') ||
    norm.includes('make it an idea instead') ||
    norm.includes('actually make it an idea') ||
    norm.includes('turn that into an idea') ||
    norm.includes('turn the issue into an idea') ||
    norm.includes('convert to idea')
  ) {
    const result: CanonicalResolvedIntent = {
      intent: 'convert_issue_to_idea',
      confidence: 0.99,
      entities: {},
      requestedTool: 'aetherConversationalEngine.convertIssueToIdea',
      riskLevel: 'state_creating',
      reasoning: 'User converted active/last created issue into an idea.',
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  // Convert Idea to Issue ("Turn the second idea into an issue", "Turn that into an issue", "Save as an issue")
  if (
    norm.includes('turn the second idea into an issue') ||
    norm.includes('turn that idea into an issue') ||
    norm.includes('turn that into an issue') ||
    norm.includes('turn the idea into an issue') ||
    norm.includes('convert that idea to an issue') ||
    norm.includes('convert idea to issue') ||
    norm.includes('make that idea an issue') ||
    (norm.startsWith('turn ') && norm.includes('into an issue'))
  ) {
    const idx = ordinalIndex !== null ? ordinalIndex : 2;
    const result: CanonicalResolvedIntent = {
      intent: 'convert_idea_to_issue',
      confidence: 0.99,
      entities: { ideaIndex: idx },
      requestedTool: 'aetherConversationalEngine.convertIdeaToIssue',
      riskLevel: 'state_creating',
      reasoning: 'User converted working memory idea into a tracked project issue.',
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  // Update Issue Priority ("Make it high priority", "Make it critical", "Set priority to High")
  if (
    norm.includes('make it high priority') ||
    norm.includes('make that issue high priority') ||
    norm.includes('make it critical') ||
    norm.includes('set priority to') ||
    norm.includes('change priority to') ||
    norm.includes('make that high priority')
  ) {
    let priority = 'High';
    if (norm.includes('critical')) priority = 'Critical';
    else if (norm.includes('low')) priority = 'Low';
    else if (norm.includes('medium')) priority = 'Medium';

    const result: CanonicalResolvedIntent = {
      intent: 'update_issue_priority',
      confidence: 0.98,
      entities: { priority },
      requestedTool: 'aetherConversationalEngine.updateIssuePriority',
      riskLevel: 'state_creating',
      reasoning: `User updated issue priority to ${priority}.`,
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  // Update Issue Status ("Move that to In Progress", "Mark it as done", "Close that issue")
  if (
    norm.includes('move that to in progress') ||
    norm.includes('move to in progress') ||
    norm.includes('mark it as done') ||
    norm.includes('mark as done') ||
    norm.includes('close that issue') ||
    norm.includes('close issue') ||
    norm.includes('mark completed')
  ) {
    let status = 'In Progress';
    if (norm.includes('done') || norm.includes('close') || norm.includes('completed')) {
      status = 'Done';
    }

    const result: CanonicalResolvedIntent = {
      intent: 'update_issue_status',
      confidence: 0.98,
      entities: { status },
      requestedTool: 'aetherConversationalEngine.updateIssueStatus',
      riskLevel: 'state_creating',
      reasoning: `User updated issue status to ${status}.`,
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  // Sub-issue creation ("Add a sub-issue for token refresh", "Create subtask for X")
  if (norm.includes('sub-issue') || norm.includes('subissue') || norm.includes('subtask') || norm.includes('sub task') || norm.includes('child issue')) {
    let subTitle = original
      .replace(/^(?:can\s+you\s+)?(?:please\s+)?(?:add|create|make)\s+(?:a\s+)?(?:sub-issue|subissue|subtask|sub task|child issue)(?:\s+for|\s+called|\s+titled)?\s*/i, '')
      .replace(/[\.\,\!]/g, '')
      .trim();

    const result: CanonicalResolvedIntent = {
      intent: 'create_sub_issue',
      confidence: 0.98,
      entities: { title: subTitle || 'Subtask' },
      requestedTool: 'aetherConversationalEngine.createSubIssue',
      riskLevel: 'state_creating',
      reasoning: 'User requested sub-issue creation linked to parent task.',
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  // Delete Issue
  if (norm.includes('delete that issue') || norm.includes('delete the issue') || norm.includes('remove that issue')) {
    const result: CanonicalResolvedIntent = {
      intent: 'delete_issue',
      confidence: 0.98,
      entities: {},
      requestedTool: 'aetherConversationalEngine.deleteIssue',
      riskLevel: 'destructive',
      reasoning: 'User requested issue deletion.',
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  // 8. SAVE NOTE / SAVE IDEA FROM SEARCH OR CONTEXT
  // "Save this as a note", "Save that summary as a note in Local Landscape", "Create a note about this"
  if (
    norm.includes('save this as a note') ||
    norm.includes('save that as a note') ||
    norm.includes('save as a note') ||
    norm.includes('create a note') ||
    norm.includes('add a note')
  ) {
    let targetProjectName: string | undefined = undefined;
    const matchProj = original.match(/(?:in|to|for)\s+(?:project\s+)?([a-zA-Z0-9\s_\-]+)/i);
    if (matchProj && matchProj[1]) {
      const candidate = matchProj[1].trim();
      if (!['note', 'a note', 'my project', 'this'].includes(candidate.toLowerCase())) {
        targetProjectName = candidate;
      }
    }

    const result: CanonicalResolvedIntent = {
      intent: 'save_to_note',
      confidence: 0.98,
      entities: { targetProjectName },
      requestedTool: 'aetherConversationalEngine.saveToNote',
      riskLevel: 'state_creating',
      reasoning: 'User requested saving conversation/search insight as a persistent project note.',
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  // "Save the second one", "Save idea #2", "Save the second idea"
  if (
    (norm.startsWith('save the second') ||
      norm.startsWith('save number 2') ||
      norm.startsWith('save idea 2') ||
      norm.startsWith('save the first') ||
      norm.startsWith('save option 2') ||
      (norm.startsWith('save ') && ordinalIndex !== null))
  ) {
    const idx = ordinalIndex !== null ? ordinalIndex : 2;
    const result: CanonicalResolvedIntent = {
      intent: 'save_brainstorm_idea',
      confidence: 0.98,
      entities: { ideaIndex: idx },
      requestedTool: 'aetherConversationalEngine.saveBrainstormIdea',
      riskLevel: 'state_creating',
      reasoning: `User requested saving brainstorm idea #${idx} into project ideas.`,
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  // 9. BRAINSTORMING IDEAS & IDEA CREATION
  // "Brainstorm a few ways we could solve it", "Give me five ideas for this problem", "Brainstorm ideas for X"
  if (
    norm.includes('brainstorm a few ways') ||
    norm.includes('brainstorm ways') ||
    norm.includes('brainstorm ideas') ||
    norm.includes('give me five ideas') ||
    norm.includes('give me 5 ideas') ||
    norm.includes('brainstorm a few') ||
    norm.includes('brainstorm')
  ) {
    let count = 4;
    const numMatch = norm.match(/\b(\d+|five|5|four|4|three|3|six|6)\s+ideas\b/i);
    if (numMatch && numMatch[1]) {
      const p = parseInt(numMatch[1], 10);
      if (!isNaN(p)) count = p;
      else if (numMatch[1].toLowerCase() === 'five') count = 5;
      else if (numMatch[1].toLowerCase() === 'four') count = 4;
      else if (numMatch[1].toLowerCase() === 'three') count = 3;
    }

    const topic = original
      .replace(/^(?:can\s+you\s+)?(?:please\s+)?(?:brainstorm|give\s+me)\s+(?:a\s+few\s+ways\s+we\s+could\s+solve\s+it|a\s+few\s+ideas|five\s+ideas|5\s+ideas|ideas)?(?:\s+for|\s+about)?\s*/i, '')
      .replace(/[\.\,\!]/g, '')
      .trim();

    const result: CanonicalResolvedIntent = {
      intent: 'brainstorm_ideas',
      confidence: 0.98,
      entities: { count, topic: topic || context.currentTopic || 'Architecture Solutions' },
      requestedTool: 'aetherConversationalEngine.generateBrainstormIdeas',
      riskLevel: 'safe',
      reasoning: 'User requested structured brainstorming in working memory.',
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  // Explicit Idea Creation ("Add an idea for a lightweight mobile companion", "Create an idea for X")
  if (
    norm.includes('create an idea') ||
    norm.includes('create idea') ||
    norm.includes('add an idea') ||
    norm.includes('add idea')
  ) {
    let title = original
      .replace(/^(?:can\s+you\s+)?(?:please\s+)?(?:create|add|make)\s+(?:an?\s+)?idea(?:\s+for|\s+called|\s+titled|\s+named|\s+about)?\s*/i, '')
      .replace(/[\.\,\!]/g, '')
      .trim();

    let targetProjectName: string | undefined = undefined;
    const matchProj = title.match(/(?:in|for)\s+([a-zA-Z0-9\s_\-]+)$/i);
    if (matchProj && matchProj[1]) {
      const candidate = matchProj[1].trim();
      if (!['my project', 'this'].includes(candidate.toLowerCase())) {
        targetProjectName = candidate;
        title = title.replace(new RegExp(`(?:in|for)\\s+${candidate}$`, 'i'), '').trim();
      }
    }

    const result: CanonicalResolvedIntent = {
      intent: 'add_brainstorm_idea',
      confidence: 0.98,
      entities: { title: title || 'New Innovation Concept', targetProjectName },
      requestedTool: 'aetherConversationalEngine.addIdea',
      riskLevel: 'state_creating',
      reasoning: 'Explicit idea creation requested.',
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }



  // 12. GENERAL NAVIGATION: PROJECTS LIST, ROADMAP, SETTINGS, MASTER IDEAS
  const isProjectsNavigation =
    norm === 'take me to my projects' ||
    norm === 'take me to projects' ||
    norm === 'show my projects' ||
    norm === 'show projects' ||
    norm === 'go to my projects' ||
    norm === 'go to projects' ||
    norm === 'open my projects' ||
    norm === 'open projects' ||
    norm === 'projects' ||
    norm === 'my projects';

  if (isProjectsNavigation) {
    const result: CanonicalResolvedIntent = {
      intent: 'navigate_to',
      confidence: 0.99,
      entities: { path: '/projects' },
      requestedTool: 'callbacks.onNavigate(/projects)',
      riskLevel: 'safe',
      reasoning: 'General projects list navigation requested.',
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  if (norm.includes('show me the roadmap') || norm.includes('show the roadmap') || norm.includes('take me to the roadmap') || norm.includes('open roadmap') || norm.includes('go to roadmap')) {
    const result: CanonicalResolvedIntent = {
      intent: 'navigate_to',
      confidence: 0.99,
      entities: { path: '/roadmap' },
      requestedTool: 'callbacks.onNavigate(/roadmap)',
      riskLevel: 'safe',
      reasoning: 'Roadmap navigation requested.',
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  // "Take me back to the project from earlier" / "Take me back to the other project"
  if (
    norm.includes('take me back to the project from earlier') ||
    norm.includes('take me back to the previous project') ||
    norm.includes('take me back to the other project') ||
    norm.includes('switch back to the other project') ||
    norm.includes('open the other project') ||
    norm.includes('open previous project')
  ) {
    const result: CanonicalResolvedIntent = {
      intent: 'navigate_to',
      confidence: 0.99,
      entities: { path: '/projects', usePreviousProject: true },
      requestedTool: 'aetherConversationalEngine.resumePreviousProject',
      riskLevel: 'safe',
      reasoning: 'Resume previous project context.',
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  // Specific Named Project Navigation ("Take me to Local Landscape", "Open project DevSpace")
  const isSpecificProjectNav =
    (norm.startsWith('take me to ') ||
      norm.startsWith('go to ') ||
      norm.startsWith('switch to ') ||
      norm.startsWith('open project ') ||
      norm.startsWith("let's work on ") ||
      norm.startsWith('lets work on ') ||
      norm.startsWith('bring up ')) &&
    !norm.includes('issues') &&
    !norm.includes('notes') &&
    !norm.includes('ideas') &&
    !norm.includes('roadmap') &&
    !norm.includes('settings') &&
    !norm.includes('repo');

  if (isSpecificProjectNav) {
    let projName = original
      .replace(/^(take me to|go to|switch to|open project|let's work on|lets work on|bring up)\s+(?:my\s+)?(?:project\s+)?/i, '')
      .replace(/\s+project$/i, '')
      .replace(/[\.\,\!]/g, '')
      .trim();

    if (projName && projName.toLowerCase() !== 'projects') {
      const result: CanonicalResolvedIntent = {
        intent: 'navigate_to',
        confidence: 0.95,
        entities: { path: '/projects', projectNameMentioned: projName },
        requestedTool: 'callbacks.onNavigate(/projects, projectName)',
        riskLevel: 'safe',
        reasoning: `Navigation to specific project "${projName}".`,
        rawInput: original,
        normalizedInput: norm,
        timestamp: Date.now()
      };
      lastCanonicalIntentTrace = result;
      return result;
    }
  }

  // 13. STATE-CREATING ACTION FIREWALL: EXPLICIT PROJECT CREATION ONLY
  const hasExplicitProjectCreationSemantics =
    norm.includes('create a project') ||
    norm.includes('create project') ||
    norm.includes('make a new project') ||
    norm.includes('make a project') ||
    norm.includes('make project') ||
    norm.includes('start a new project') ||
    norm.includes('start a project') ||
    norm.includes('start project') ||
    norm.includes('create a workspace') ||
    norm.includes('create workspace') ||
    norm.includes('set up a project') ||
    norm.includes('bootstrap project') ||
    norm.includes('bootstrap a project');

  if (hasExplicitProjectCreationSemantics) {
    let rawName = original
      .replace(/^(?:can\s+you\s+)?(?:please\s+)?(?:create|make|start|set\s+up|bootstrap)\s+(?:a\s+)?(?:new\s+)?(?:project|workspace)(?:\s+called|\s+named|\s+for|\s+titled)?\s*/i, '')
      .replace(/[\.\,\!]/g, '')
      .trim();

    if (!rawName || ['called', 'named', 'project', 'workspace', 'a', 'new'].includes(rawName.toLowerCase())) {
      rawName = '';
    }

    const result: CanonicalResolvedIntent = {
      intent: 'create_project',
      confidence: 0.99,
      entities: { name: rawName, projectName: rawName },
      requestedTool: 'callbacks.onProjectCreate',
      riskLevel: 'state_creating',
      reasoning: 'Explicit project creation semantics validated through State-Creating Action Firewall.',
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  // 14. ISSUE CREATION & TASK MANAGEMENT
  const hasIssueCreationSemantics =
    norm.includes('create an issue') ||
    norm.includes('create issue') ||
    norm.includes('create a task') ||
    norm.includes('create task') ||
    norm.includes('add a bug') ||
    norm.includes('add bug') ||
    norm.includes('add a task') ||
    norm.includes('add task') ||
    norm.includes('add issue');

  if (hasIssueCreationSemantics) {
    let title = original
      .replace(/^(?:can\s+you\s+)?(?:please\s+)?(?:create|add|make)\s+(?:an?\s+)?(?:issue|task|bug)(?:\s+called|\s+titled|\s+named|\s+for)?\s*/i, '')
      .replace(/[\.\,\!]/g, '')
      .trim();

    // Handle "for the thing you just mentioned"
    if (title.toLowerCase().includes('the thing you just mentioned') || title.toLowerCase().includes('what you just said')) {
      title = context.lastMentionedIdea?.title || context.currentTopic || 'Follow-up Task';
    }

    const result: CanonicalResolvedIntent = {
      intent: 'create_issue',
      confidence: 0.95,
      entities: { title: title || 'New Task', priority: 'Medium' },
      requestedTool: 'callbacks.onIssueCreate',
      riskLevel: 'state_creating',
      reasoning: 'Explicit issue creation request.',
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  // 15. DEVSPACE CUSTOMIZATION (Desktop / UI layout edits)
  const isDevSpaceCustomization =
    norm.includes('make this button') ||
    norm.includes('make the button') ||
    norm.includes('sidebar wider') ||
    norm.includes('make this yellow') ||
    norm.includes('move this panel') ||
    norm.includes('hide the sidebar') ||
    norm.includes('hide sidebar') ||
    norm.includes('resize this panel') ||
    norm.includes('recolor devspace') ||
    norm.includes('customize devspace') ||
    norm.includes('customize layout');

  if (isDevSpaceCustomization) {
    const result: CanonicalResolvedIntent = {
      intent: 'devspace_customization',
      confidence: 0.95,
      entities: { prompt: original },
      requestedTool: 'aetherDesktopCustomization.applyProposal',
      riskLevel: 'safe',
      reasoning: 'Explicit DevSpace UI customization directive.',
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  // 15.5 DESKTOP & NATIVE AUTOMATION DIRECTIVES
  // A. List installed applications & app directory
  if (
    norm.includes('installed apps') ||
    norm.includes('list applications') ||
    norm.includes('list apps') ||
    norm.includes('show apps') ||
    norm.includes('app directory') ||
    norm.includes('searchable directory of installed apps') ||
    norm.includes('what apps are installed')
  ) {
    const result: CanonicalResolvedIntent = {
      intent: 'desktop_list_apps',
      confidence: 0.99,
      entities: {},
      requestedTool: 'aetherDesktopIntelligence.getInstalledApps',
      riskLevel: 'safe',
      reasoning: 'User requested searchable directory of installed applications.',
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  // B. Rename / Alias an app or website ("Call Spotify my music", "Alias vscode as my editor", "Rename app chrome to my browser")
  if (
    norm.startsWith('call ') ||
    norm.startsWith('alias ') ||
    norm.startsWith('rename app ') ||
    norm.includes(' as my ') ||
    norm.includes(' to my ')
  ) {
    const aliasMatch = original.match(/(?:call|alias|rename\s+app|rename)\s+([a-zA-Z0-9\s_\-\.:\/]+)\s+(?:as|to|called)\s+([a-zA-Z0-9\s_\-]+)/i);
    if (aliasMatch && aliasMatch[1] && aliasMatch[2]) {
      const target = aliasMatch[1].trim();
      let aliasName = aliasMatch[2].trim();
      if (!aliasName.toLowerCase().startsWith('my ')) {
        aliasName = `my ${aliasName}`;
      }
      const isWebsite = target.includes('http') || target.includes('www.') || target.includes('.com') || target.includes('.dev');
      const result: CanonicalResolvedIntent = {
        intent: 'desktop_alias_app',
        confidence: 0.99,
        entities: {
          target,
          alias: aliasName,
          type: isWebsite ? 'website' : 'desktop_app'
        },
        requestedTool: 'aetherAliasRegistry.saveAlias',
        riskLevel: 'state_creating',
        reasoning: `User defined alias "${aliasName}" for "${target}".`,
        rawInput: original,
        normalizedInput: norm,
        timestamp: Date.now()
      };
      lastCanonicalIntentTrace = result;
      return result;
    }
  }

  // C. Open Terminal in project / current root
  if (
    norm.includes('open terminal') ||
    norm.includes('launch terminal') ||
    norm.includes('start terminal') ||
    norm.includes('open command prompt') ||
    norm.includes('open shell')
  ) {
    const result: CanonicalResolvedIntent = {
      intent: 'desktop_open_terminal',
      confidence: 0.98,
      entities: { projectPath: context.activeProjectId },
      requestedTool: 'aetherDesktopIntelligence.openTerminalInProject',
      riskLevel: 'safe',
      reasoning: 'User requested opening Terminal in project workspace.',
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  // D. Open VS Code in project
  if (
    norm.includes('open in vs code') ||
    norm.includes('open in vscode') ||
    norm.includes('open vscode') ||
    norm.includes('open vs code') ||
    norm.includes('launch vs code') ||
    norm.includes('launch vscode')
  ) {
    const result: CanonicalResolvedIntent = {
      intent: 'desktop_open_vscode',
      confidence: 0.98,
      entities: { projectPath: context.activeProjectId },
      requestedTool: 'aetherDesktopIntelligence.openVSCodeInProject',
      riskLevel: 'safe',
      reasoning: 'User requested opening Visual Studio Code at project path.',
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  // E. Open arbitrary File or Folder on computer
  if (
    (norm.startsWith('open file ') ||
      norm.startsWith('open folder ') ||
      norm.startsWith('open directory ') ||
      norm.startsWith('reveal file ') ||
      norm.startsWith('show file in folder')) &&
    !norm.includes('issue') &&
    !norm.includes('project')
  ) {
    const targetPath = original.replace(/^(?:open\s+file|open\s+folder|open\s+directory|reveal\s+file|show\s+file\s+in\s+folder)\s+/i, '').trim();
    const result: CanonicalResolvedIntent = {
      intent: 'desktop_open_file',
      confidence: 0.98,
      entities: { path: targetPath },
      requestedTool: 'aetherDesktopIntelligence.openFileOrFolder',
      riskLevel: 'safe',
      reasoning: `User requested opening file/folder "${targetPath}".`,
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  // F. Search files by natural language ("find files for...", "search files matching...", "locate pdf files...")
  if (
    (norm.startsWith('find files') ||
      norm.startsWith('search files') ||
      norm.startsWith('find file') ||
      norm.startsWith('search file') ||
      norm.startsWith('locate file') ||
      norm.startsWith('locate files') ||
      norm.includes('search desktop files') ||
      norm.includes('find document')) &&
    !norm.includes('youtube') &&
    !norm.includes('google') &&
    !norm.includes('web')
  ) {
    const cleanQuery = original
      .replace(/^(?:can\s+you\s+)?(?:please\s+)?(?:find|search|locate)\s+(?:desktop\s+)?(?:files|file|documents|document)?(?:\s+for|\s+matching|\s+named|\s+called|\s+about)?\s*/i, '')
      .replace(/[\.\,\!]/g, '')
      .trim();

    const result: CanonicalResolvedIntent = {
      intent: 'desktop_search_files',
      confidence: 0.98,
      entities: { query: cleanQuery || 'source' },
      requestedTool: 'aetherDesktopIntelligence.searchFiles',
      riskLevel: 'safe',
      reasoning: `Natural language filesystem search for "${cleanQuery}".`,
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  // G. Multi-step actions & workflows ("open my workspace", "run morning setup", "open workspace")
  if (
    norm === 'open my workspace' ||
    norm === 'open workspace' ||
    norm === 'start workspace' ||
    norm === 'run workspace workflow' ||
    norm === 'open daily setup'
  ) {
    const result: CanonicalResolvedIntent = {
      intent: 'open_workspace',
      confidence: 0.99,
      entities: { workflowName: 'OPEN MY WORKSPACE' },
      requestedTool: 'aetherConversationalEngine.handleOpenWorkspaceAction',
      riskLevel: 'safe',
      reasoning: 'Multi-step action workflow requested.',
      rawInput: original,
      normalizedInput: norm,
      timestamp: Date.now()
    };
    lastCanonicalIntentTrace = result;
    return result;
  }

  // H. Launch arbitrary installed app / alias ("Open Spotify", "Launch Discord", "Open my editor", "Open Chrome", "Launch Postman")
  const launchAppMatch = norm.match(/^(?:open|launch|start|run)\s+(?:app\s+)?([a-zA-Z0-9\s_\-\.]+)/i);
  if (
    launchAppMatch &&
    launchAppMatch[1] &&
    !norm.startsWith('open project') &&
    !norm.startsWith('open repo') &&
    !norm.startsWith('open issue') &&
    !norm.startsWith('open roadmap') &&
    !norm.startsWith('open settings') &&
    !norm.startsWith('open terminal') &&
    !norm.startsWith('open in vs') &&
    !norm.startsWith('open file') &&
    !norm.startsWith('open folder') &&
    !norm.startsWith('open option') &&
    !norm.startsWith('open number') &&
    !norm.startsWith('open video') &&
    !norm.startsWith('open result') &&
    !norm.startsWith('open search') &&
    !norm.startsWith('open website') &&
    !norm.startsWith('open that') &&
    !norm.startsWith('open it') &&
    !norm.startsWith('open my workspace')
  ) {
    const appTarget = launchAppMatch[1].trim();
    if (appTarget.length > 1 && !['a', 'the', 'my', 'new', 'this', 'that'].includes(appTarget)) {
      const result: CanonicalResolvedIntent = {
        intent: 'launch_app',
        confidence: 0.95,
        entities: { appName: appTarget },
        requestedTool: 'aetherDesktopIntelligence.launchApp',
        riskLevel: 'safe',
        reasoning: `User requested launching application or alias "${appTarget}".`,
        rawInput: original,
        normalizedInput: norm,
        timestamp: Date.now()
      };
      lastCanonicalIntentTrace = result;
      return result;
    }
  }

  // 16. DEFAULT CONVERSATIONAL / CHAT QUERY
  const result: CanonicalResolvedIntent = {
    intent: 'chat_query',
    confidence: 0.9,
    entities: { query: original },
    requestedTool: 'aetherConversationalEngine.chatQuery',
    riskLevel: 'safe',
    reasoning: 'General conversational turn or Q&A.',
    rawInput: original,
    normalizedInput: norm,
    timestamp: Date.now()
  };
  lastCanonicalIntentTrace = result;
  return result;
}
