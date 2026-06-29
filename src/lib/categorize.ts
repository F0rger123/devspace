export interface ExtractedIssue {
  title: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
}

export interface ExtractedIdea {
  title: string;
  description: string;
}

export interface ExtractedTask {
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
}

export interface ExtractedEntities {
  issues: ExtractedIssue[];
  ideas: ExtractedIdea[];
  tasks: ExtractedTask[];
}

export interface CategorizationResult {
  category: 'Issues' | 'Ideas' | 'Tasks';
  confidence: number;
  summary: string;
  suggestedTitle: string;
  suggestedTags: string[];
  extractedEntities: ExtractedEntities;
  explanation: string;
}

/**
 * Client-side utility function to automatically categorize raw conversation notes,
 * transcripts or brainstorm logs into semantic buckets ('Issues', 'Ideas', or 'Tasks')
 * with fully extracted child items.
 *
 * @param title The current title of the note
 * @param content The raw string content/transcript of the note
 * @returns A structured CategorizationResult analysis
 */
export async function analyzeAndCategorizeNote(title: string, content: string): Promise<CategorizationResult> {
  const response = await fetch('/api/notes/categorize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title, content }),
  });

  if (!response.ok) {
    throw new Error(`Failed to perform semantic note categorization: ${response.statusText}`);
  }

  const result: CategorizationResult = await response.json();
  return result;
}
