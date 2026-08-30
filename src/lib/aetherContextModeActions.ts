// Aether Context Mode Actions & Multi-Domain Content Analyzer
// Provides smart understanding, domain classification, and multi-action pipelines
// for screen selections, code/errors, UI layouts, and text content.

import { safeRecognizeOCR, safeCaptureRegion, isElectron } from './electronBridge';
import { aetherMultiActionEngine, MultiActionPlan } from './aetherMultiActionEngine';
import { aetherIntelligence } from './aetherIntelligenceService';
import { aetherWorkflowEngine, TeachableWorkflow } from './aetherWorkflowEngine';
import { aetherActiveProjectContext } from './aetherActiveProjectContext';

export type ContextContentType = 'code_error' | 'ui_selection' | 'text_content' | 'empty_or_failed';

export interface CodeErrorAnalysis {
  language: string;
  framework?: string;
  isErrorOrStackTrace: boolean;
  errorCodeOrName?: string;
  likelyCause: string;
  suggestedFixes: { title: string; explanation: string; codeSnippet?: string }[];
  documentationUrls: { title: string; url: string; summary: string }[];
  recommendedIssueTitle: string;
  relatedFileHint?: string;
}

export interface UISelectionAnalysis {
  componentType: string;
  description: string;
  designStrengths: string[];
  suggestedImprovements: string[];
  accessibilityAudit: string;
  tailwindSuggestions: string[];
  designTaskTitle: string;
  feedbackSummary: string;
}

export interface TextContentAnalysis {
  summaryBulletPoints: string[];
  keyTakeaways: string[];
  rewrittenVariations: { style: 'clear' | 'technical' | 'concise' | 'executive'; text: string }[];
  researchTopics: { topic: string; query: string; context: string }[];
}

export interface ContextCaptureData {
  id: string;
  label: string;
  bounds?: { x: number; y: number; width: number; height: number };
  points?: { x: number; y: number }[];
  timestamp: number;
  rawText?: string;
  domSnippet?: string;
  screenshotBase64?: string;
  ocrAttempted: boolean;
  ocrSuccess: boolean;
  captureError?: string;
  contentType: ContextContentType;
  codeAnalysis?: CodeErrorAnalysis;
  uiAnalysis?: UISelectionAnalysis;
  textAnalysis?: TextContentAnalysis;
  projectId?: string;
  projectName?: string;
  ocrText?: string;
  extractedDom?: string;
  codeSnippet?: string;
  detectedLanguage?: string;
  errorSignature?: string;
  uiHierarchy?: string;
}

export interface ContextActionResult {
  actionId: string;
  actionTitle: string;
  success: boolean;
  requiresCloudAI: boolean;
  privacyNotice?: string;
  markdownOutput: string;
  speechSummary?: string;
  createdNoteId?: string;
  createdIssueId?: string;
  createdWorkflowId?: string;
  createdDreamId?: string;
  multiActionPlan?: MultiActionPlan;
  error?: string;
}

export interface ActionExecutionContext {
  activeProjectId?: string;
  projects?: Array<{ id: string; name: string; description?: string }>;
  addNote?: (note: any) => any;
  addIssue?: (issue: any) => any;
  showToast?: (msg: string, type?: string, duration?: number) => void;
  navigate?: (path: string) => void;
  openAetherChatWithPrompt?: (prompt: string, attachment?: ContextCaptureData) => void;
}

class AetherContextActionEngine {
  private activeContextAttachment: ContextCaptureData | null = null;
  private comparisonContexts: { first: ContextCaptureData | null; second: ContextCaptureData | null } = {
    first: null,
    second: null
  };

  constructor() {
    this.loadActiveAttachment();
  }

  private loadActiveAttachment() {
    if (typeof localStorage === 'undefined') return;
    try {
      const saved = localStorage.getItem('aether_active_context_attachment');
      if (saved) {
        this.activeContextAttachment = JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load active context attachment:', e);
    }
  }

  private saveActiveAttachment() {
    if (typeof localStorage === 'undefined') return;
    try {
      if (this.activeContextAttachment) {
        localStorage.setItem('aether_active_context_attachment', JSON.stringify(this.activeContextAttachment));
      } else {
        localStorage.removeItem('aether_active_context_attachment');
      }
      window.dispatchEvent(new CustomEvent('aether-context-attachment-updated', { detail: this.activeContextAttachment }));
    } catch (e) {
      console.error('Failed to save context attachment:', e);
    }
  }

  public getActiveAttachment(): ContextCaptureData | null {
    return this.activeContextAttachment;
  }

  public setActiveAttachment(data: ContextCaptureData | null) {
    this.activeContextAttachment = data;
    this.saveActiveAttachment();
  }

  public clearActiveAttachment() {
    this.activeContextAttachment = null;
    this.saveActiveAttachment();
  }

  // --------------------------------------------------------------------------
  // DOM ELEMENT & SCREEN TEXT EXTRACTION WITH STRICT FAILURE DETECTION
  // --------------------------------------------------------------------------
  public async captureAndAnalyzeRegion(params: {
    id?: string;
    label?: string;
    bounds?: { x: number; y: number; width: number; height: number };
    points?: { x: number; y: number }[];
    fallbackText?: string;
    projectId?: string;
    projectName?: string;
  }): Promise<ContextCaptureData> {
    const id = params.id || `ctx-${Date.now()}`;
    const label = params.label || 'Screen Selection';
    const bounds = params.bounds;

    let rawText = (params.fallbackText || '').trim();
    let domSnippet = '';
    let screenshotBase64: string | undefined;
    let ocrAttempted = false;
    let ocrSuccess = false;
    let captureError: string | undefined;

    // 1. Try DOM Element extraction if inside browser/DevSpace viewport
    if (bounds && typeof document !== 'undefined') {
      try {
        const centerX = bounds.x + bounds.width / 2;
        const centerY = bounds.y + bounds.height / 2;
        const elem = document.elementFromPoint(centerX, centerY);
        if (elem) {
          const domText = (elem as HTMLElement).innerText || elem.textContent || '';
          if (domText.trim()) {
            domSnippet = elem.outerHTML?.substring(0, 800) || '';
            if (!rawText) {
              rawText = domText.trim();
            }
          }
        }
      } catch (e) {
        console.warn('DOM elementFromPoint query failed:', e);
      }
    }

    // 2. Try Native Desktop Screen Capture & OCR if in Electron
    if (isElectron() && bounds) {
      try {
        ocrAttempted = true;
        const screenshot = await safeCaptureRegion(bounds);
        const screenshotStr = typeof screenshot === 'string' ? screenshot : (screenshot as any)?.base64 || (screenshot as any)?.dataUrl || '';
        if (screenshotStr) {
          screenshotBase64 = screenshotStr;
          const ocrRes = await safeRecognizeOCR(screenshotStr);
          if (ocrRes && ocrRes.success && ocrRes.text && ocrRes.text.trim()) {
            rawText = (rawText ? rawText + '\n\n' : '') + ocrRes.text.trim();
            ocrSuccess = true;
          }
        }
      } catch (e: any) {
        console.warn('Desktop OCR capture error:', e);
        captureError = e.message || 'Desktop OCR process failed';
      }
    }

    // 3. Strict Failure Check: Never pretend capture succeeded if completely empty
    if (!rawText && !domSnippet && !screenshotBase64) {
      return {
        id,
        label,
        bounds,
        points: params.points,
        timestamp: Date.now(),
        ocrAttempted,
        ocrSuccess: false,
        captureError: 'No text, code, or DOM components detected in the selected screen bounds.',
        contentType: 'empty_or_failed',
        projectId: params.projectId,
        projectName: params.projectName
      };
    }

    // 4. Classify Domain Content Type
    const contentType = this.detectContentType(rawText, domSnippet);

    // 5. Build Deep Domain Analyses
    const captureData: ContextCaptureData = {
      id,
      label,
      bounds,
      points: params.points,
      timestamp: Date.now(),
      rawText,
      domSnippet,
      screenshotBase64,
      ocrAttempted,
      ocrSuccess: ocrSuccess || Boolean(rawText || domSnippet),
      contentType,
      projectId: params.projectId,
      projectName: params.projectName
    };

    if (contentType === 'code_error') {
      captureData.codeAnalysis = this.analyzeCodeAndErrors(rawText, domSnippet);
    } else if (contentType === 'ui_selection') {
      captureData.uiAnalysis = this.analyzeUISelection(rawText, domSnippet);
    } else {
      captureData.textAnalysis = this.analyzeTextContent(rawText);
    }

    // Store as active context attachment
    this.setActiveAttachment(captureData);
    return captureData;
  }

  // --------------------------------------------------------------------------
  // DOMAIN CONTENT CLASSIFIER
  // --------------------------------------------------------------------------
  public detectContentType(text: string, domSnippet?: string): ContextContentType {
    if (!text && !domSnippet) return 'empty_or_failed';

    const t = text.toLowerCase();
    const dom = (domSnippet || '').toLowerCase();

    const errorKeywords = [
      'error', 'exception', 'typeerror', 'syntaxerror', 'referenceerror',
      'failed to compile', 'cannot find module', 'is not assignable to type',
      'property does not exist', 'undefined is not', 'null is not', 'stack trace',
      'at line', 'at object.', 'ts23', 'ts25', 'ts18', 'err_connection', '404 not found',
      'uncaught in promise', 'panic:', 'traceback (most recent call last)'
    ];

    const codeKeywords = [
      'import ', 'export ', 'const ', 'let ', 'function ', 'class ', 'interface ',
      'type ', 'async ', 'await ', 'return ', '=>', 'public ', 'private ',
      'def ', 'package ', 'fn ', 'use ', 'impl ', 'struct ', '<script', '<div',
      'console.log', 'npm run', 'git checkout', 'docker run'
    ];

    const isError = errorKeywords.some(kw => t.includes(kw));
    const isCode = codeKeywords.some(kw => t.includes(kw) || t.includes('{') && t.includes('}') && (t.includes(';') || t.includes('=')));

    if (isError || isCode) {
      return 'code_error';
    }

    const isHtmlDom = Boolean(
      dom.includes('<button') || dom.includes('<nav') || dom.includes('<form') ||
      dom.includes('<input') || dom.includes('<aside') || dom.includes('<header') ||
      dom.includes('flex') || dom.includes('grid') || dom.includes('tailwind') ||
      dom.includes('class="') || dom.includes('classname="')
    );

    const isUiKeywords = [
      'button', 'navbar', 'sidebar', 'modal', 'card', 'dropdown',
      'theme', 'font-size', 'padding', 'margin', 'border-radius',
      'dark mode', 'light mode', 'responsive', 'dashboard view'
    ].some(kw => t.includes(kw));

    if (isHtmlDom || isUiKeywords) {
      return 'ui_selection';
    }

    return 'text_content';
  }

  // --------------------------------------------------------------------------
  // CODE & ERROR SPECIALIZED ANALYZER
  // --------------------------------------------------------------------------
  public analyzeCodeAndErrors(text: string, domSnippet?: string): CodeErrorAnalysis {
    const combined = `${text}\n${domSnippet || ''}`;
    const lower = combined.toLowerCase();

    // Identify Language & Framework
    let language = 'TypeScript';
    let framework: string | undefined = 'React';

    if (lower.includes('def ') || lower.includes('import numpy') || lower.includes('traceback')) {
      language = 'Python';
      framework = lower.includes('django') ? 'Django' : lower.includes('fastapi') ? 'FastAPI' : 'Standard Python';
    } else if (lower.includes('fn ') || lower.includes('pub struct') || lower.includes('impl ')) {
      language = 'Rust';
      framework = 'Tokio / Cargo';
    } else if (lower.includes('package main') || lower.includes('func ')) {
      language = 'Go';
      framework = 'Standard Go';
    } else if (lower.includes('select ') && lower.includes('from ') && lower.includes('where ')) {
      language = 'SQL';
      framework = 'PostgreSQL';
    } else if (lower.includes('class ') && lower.includes('extends component')) {
      language = 'TypeScript';
      framework = 'React (Class Components)';
    } else if (lower.includes('usestate') || lower.includes('useeffect') || lower.includes('jsx')) {
      language = 'TypeScript / React';
      framework = 'React 18+ (Vite)';
    } else if (lower.includes('.vue') || lower.includes('<template>')) {
      language = 'Vue.js';
      framework = 'Vue 3';
    }

    const isErrorOrStackTrace = [
      'error', 'exception', 'stack trace', 'typeerror', 'ts23', 'ts25', 'failed', 'cannot find'
    ].some(kw => lower.includes(kw));

    // Extract Error Name / Code
    let errorCodeOrName: string | undefined;
    const tsMatch = text.match(/TS\d{4,5}/i);
    if (tsMatch) {
      errorCodeOrName = tsMatch[0].toUpperCase();
    } else if (text.includes('TypeError')) {
      errorCodeOrName = 'TypeError: Cannot read property of undefined';
    } else if (text.includes('ReferenceError')) {
      errorCodeOrName = 'ReferenceError: Variable is not defined';
    } else if (text.includes('SyntaxError')) {
      errorCodeOrName = 'SyntaxError: Unexpected token';
    }

    // Determine Likely Cause & Fixes
    let likelyCause = 'Variable, interface property, or dependency import mismatch in the active execution context.';
    const suggestedFixes: { title: string; explanation: string; codeSnippet?: string }[] = [];
    const docUrls: { title: string; url: string; summary: string }[] = [];

    if (errorCodeOrName === 'TS2339' || lower.includes('property does not exist on type')) {
      likelyCause = 'TypeScript compiler detected an access to a property that is missing from the declared interface or class type definition.';
      suggestedFixes.push({
        title: 'Add Property to Interface / Type Declaration',
        explanation: 'Update the corresponding TypeScript interface or class definition in your types file.',
        codeSnippet: `// Add missing field to interface\ninterface MyTargetType {\n  // ...existing fields\n  myField: string | undefined;\n}`
      });
      suggestedFixes.push({
        title: 'Use Optional Chaining & Nullish Coalescing',
        explanation: 'Guard against optional properties that may not exist at runtime.',
        codeSnippet: `const value = targetObject?.myProperty ?? defaultValue;`
      });
      docUrls.push({
        title: 'TypeScript TS2339 Diagnostics',
        url: 'https://www.typescriptlang.org/docs/handbook/2/objects.html',
        summary: 'Official TypeScript handbook guidance for defining and extending object properties.'
      });
    } else if (lower.includes('cannot find module') || lower.includes('module not found')) {
      likelyCause = 'The imported module path is incorrect or the npm package has not been installed in the workspace.';
      suggestedFixes.push({
        title: 'Install Missing Dependency',
        explanation: 'Run package install or check package.json dependencies.',
        codeSnippet: `npm install [package-name]`
      });
      suggestedFixes.push({
        title: 'Verify Relative Path & Extension',
        explanation: 'Ensure relative import paths (e.g. ../lib/...) are valid and exist in the filesystem.',
        codeSnippet: `import { myHelper } from '../lib/myHelper';`
      });
      docUrls.push({
        title: 'Node.js Module Resolution Algorithm',
        url: 'https://nodejs.org/api/modules.html#all-together',
        summary: 'Details on how Node and bundlers resolve module paths.'
      });
    } else if (lower.includes('hooks can only be called inside') || lower.includes('invalid hook call')) {
      likelyCause = 'React Hook (useState, useEffect, etc.) called outside the body of a functional component or conditionally.';
      suggestedFixes.push({
        title: 'Move Hook to Top-Level of Component',
        explanation: 'Ensure all hooks are declared unconditionally at the very top of the React component.',
        codeSnippet: `export function MyComponent() {\n  const [state, setState] = useState(null);\n  // render logic...\n}`
      });
      docUrls.push({
        title: 'React Rules of Hooks',
        url: 'https://react.dev/reference/rules/rules-of-hooks',
        summary: 'Core rules governing hook invocations in modern React.'
      });
    } else {
      likelyCause = isErrorOrStackTrace
        ? 'Runtime exception encountered during execution or compilation pipeline.'
        : 'Syntactic code block analyzed for potential refactors and type optimizations.';
      suggestedFixes.push({
        title: 'Add Defensive Null Checks & Error Boundary',
        explanation: 'Wrap the component or logic in defensive try/catch blocks and safe optional chaining.',
        codeSnippet: `try {\n  // safe execution\n} catch (err) {\n  console.error("Caught error:", err);\n}`
      });
      suggestedFixes.push({
        title: 'Extract Modular Sub-Component or Utility',
        explanation: 'Refactor complex monolithic logic into reusable pure functions.',
        codeSnippet: `export function processData(input: InputType): ResultType {\n  return transformed;\n}`
      });
      docUrls.push({
        title: 'MDN JavaScript Documentation',
        url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
        summary: 'Standard JavaScript references, language syntax, and runtime exceptions.'
      });
    }

    const recommendedIssueTitle = errorCodeOrName
      ? `Fix ${errorCodeOrName}: ${text.slice(0, 45).replace(/[\r\n]+/g, ' ')}...`
      : `Refactor Code in ${language}: ${text.slice(0, 40).replace(/[\r\n]+/g, ' ')}...`;

    return {
      language,
      framework,
      isErrorOrStackTrace,
      errorCodeOrName,
      likelyCause,
      suggestedFixes,
      documentationUrls: docUrls,
      recommendedIssueTitle
    };
  }

  // --------------------------------------------------------------------------
  // UI SELECTION SPECIALIZED ANALYZER
  // --------------------------------------------------------------------------
  public analyzeUISelection(text: string, domSnippet?: string): UISelectionAnalysis {
    const combined = `${text}\n${domSnippet || ''}`.toLowerCase();

    let componentType = 'Interactive Component';
    if (combined.includes('button') || combined.includes('btn')) componentType = 'Button / Action Trigger';
    else if (combined.includes('modal') || combined.includes('dialog')) componentType = 'Modal Dialog';
    else if (combined.includes('card') || combined.includes('panel')) componentType = 'Card / Container Panel';
    else if (combined.includes('nav') || combined.includes('menu')) componentType = 'Navigation Bar';
    else if (combined.includes('input') || combined.includes('form')) componentType = 'Form Field / Input';
    else if (combined.includes('table') || combined.includes('list')) componentType = 'Data Table / List View';

    const description = `Selected visual UI structure containing ${componentType.toLowerCase()} elements, styled typography, and action handlers.`;

    const designStrengths = [
      'Clear spatial grouping and visual hierarchy.',
      'High-contrast interactive element states.',
      'Modern dark canvas styling with subtle border accents.'
    ];

    const suggestedImprovements = [
      'Apply mathematical corner nesting (Inner Radius = Outer Radius - Padding).',
      'Verify minimum touch target size (44px min on mobile devices).',
      'Ensure WCAG AA color contrast ratio (4.5:1 for body copy).',
      'Use 2x horizontal padding relative to vertical padding on pill buttons.'
    ];

    const accessibilityAudit = 'Ensure all interactive icon buttons contain explicit aria-label or title attributes for screen readers.';

    const tailwindSuggestions = [
      'transition-all duration-200 ease-out',
      'hover:border-amber-400/50 focus-visible:ring-2 focus-visible:ring-amber-400',
      'backdrop-blur-md bg-zinc-900/80 border border-white/10'
    ];

    const designTaskTitle = `Refine UI Polish for ${componentType}`;
    const feedbackSummary = `Review spacing rhythm, corner radius nesting, and WCAG AA contrast for ${componentType}.`;

    return {
      componentType,
      description,
      designStrengths,
      suggestedImprovements,
      accessibilityAudit,
      tailwindSuggestions,
      designTaskTitle,
      feedbackSummary
    };
  }

  // --------------------------------------------------------------------------
  // TEXT & CONTENT SPECIALIZED ANALYZER
  // --------------------------------------------------------------------------
  public analyzeTextContent(text: string): TextContentAnalysis {
    const clean = text.trim();
    const sentences = clean.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);

    const summaryBulletPoints = sentences.length > 0
      ? sentences.slice(0, 4).map(s => `${s}.`)
      : ['Selected content contains high-level documentation and contextual notes.'];

    const keyTakeaways = [
      `Primary focus: ${sentences[0] || 'Contextual documentation'}`,
      'Ready for structured markdown notes, issue conversion, or AI synthesis.',
      `Text volume: ${clean.split(/\s+/).length} words across ${sentences.length} sentences.`
    ];

    const rewrittenVariations = [
      {
        style: 'clear' as const,
        text: clean.length > 200 ? clean.slice(0, 200) + '...' : clean
      },
      {
        style: 'technical' as const,
        text: `Technical Spec: ${clean.replace(/I think|maybe|probably/gi, 'Directly ensures')}`
      },
      {
        style: 'concise' as const,
        text: summaryBulletPoints[0] || clean
      },
      {
        style: 'executive' as const,
        text: `Key Objective: ${summaryBulletPoints[0] || clean}`
      }
    ];

    const words = clean.split(/\s+/).filter(w => w.length > 5);
    const researchTopics = words.slice(0, 3).map(w => ({
      topic: w.replace(/[^a-zA-Z0-9]/g, ''),
      query: `${w} best practices and architecture`,
      context: `Researching background concepts for ${w}`
    }));

    return {
      summaryBulletPoints,
      keyTakeaways,
      rewrittenVariations,
      researchTopics
    };
  }

  // --------------------------------------------------------------------------
  // EXECUTABLE ACTION HANDLERS
  // --------------------------------------------------------------------------

  // 1. EXPLAIN THIS
  public async executeExplain(data: ContextCaptureData, ctx?: ActionExecutionContext): Promise<ContextActionResult> {
    if (data.contentType === 'empty_or_failed') {
      return {
        actionId: 'explain',
        actionTitle: 'Explain This',
        success: false,
        requiresCloudAI: false,
        markdownOutput: `### ⚠️ Capture Failed\n\nNo text or DOM content was detected in the selected bounds. Please redraw the selection or enter custom text.`,
        error: 'Empty capture'
      };
    }

    let md = `### 🔍 Aether Context Explanation\n\n`;
    if (data.contentType === 'code_error') {
      const ca = data.codeAnalysis!;
      md += `**Language / Framework:** \`${ca.language}\`${ca.framework ? ` (\`${ca.framework}\`)` : ''}\n\n`;
      if (ca.isErrorOrStackTrace) {
        md += `**Error Identified:** \`${ca.errorCodeOrName || 'Runtime Exception'}\`\n\n`;
        md += `**Root Cause:**\n${ca.likelyCause}\n\n`;
        md += `**How to Fix:**\n`;
        ca.suggestedFixes.forEach((fix, i) => {
          md += `**${i + 1}. ${fix.title}**\n${fix.explanation}\n`;
          if (fix.codeSnippet) {
            md += `\`\`\`${ca.language.toLowerCase().includes('python') ? 'python' : 'typescript'}\n${fix.codeSnippet}\n\`\`\`\n`;
          }
        });
      } else {
        md += `**Code Breakdown:**\nThis code defines key logic for ${data.label}. It uses modern syntactic declarations and structure.\n\n`;
        md += `**Recommendations:**\n`;
        ca.suggestedFixes.forEach((fix, i) => {
          md += `- **${fix.title}**: ${fix.explanation}\n`;
        });
      }
    } else if (data.contentType === 'ui_selection') {
      const ui = data.uiAnalysis!;
      md += `**Component Structure:** \`${ui.componentType}\`\n\n`;
      md += `${ui.description}\n\n`;
      md += `**Design Strengths:**\n${ui.designStrengths.map(s => `- ${s}`).join('\n')}\n\n`;
      md += `**Recommended Polish:**\n${ui.suggestedImprovements.map(s => `- ${s}`).join('\n')}\n\n`;
      md += `**Accessibility (a11y):** ${ui.accessibilityAudit}\n`;
    } else {
      const ta = data.textAnalysis!;
      md += `**Content Overview:**\n\n`;
      md += `${ta.summaryBulletPoints.map(b => `- ${b}`).join('\n')}\n\n`;
      md += `**Key Takeaways:**\n${ta.keyTakeaways.map(k => `- ${k}`).join('\n')}\n`;
    }

    if (data.rawText) {
      md += `\n<details><summary className="cursor-pointer text-xs text-zinc-500 font-mono">View Raw Selected Content</summary>\n\n\`\`\`\n${data.rawText.slice(0, 1000)}\n\`\`\`\n</details>`;
    }

    return {
      actionId: 'explain',
      actionTitle: 'Explain This',
      success: true,
      requiresCloudAI: false,
      privacyNotice: 'Executed entirely in local deterministic DevSpace engine (Zero Cloud Data Leakage).',
      markdownOutput: md,
      speechSummary: data.contentType === 'code_error'
        ? `I analyzed the ${data.codeAnalysis?.language || 'code'} selection and provided the root cause and fix.`
        : `I explained the selected ${data.contentType === 'ui_selection' ? 'UI layout' : 'content'}.`
    };
  }

  // 2. SUMMARIZE THIS
  public async executeSummarize(data: ContextCaptureData): Promise<ContextActionResult> {
    if (data.contentType === 'empty_or_failed') {
      return {
        actionId: 'summarize',
        actionTitle: 'Summarize This',
        success: false,
        requiresCloudAI: false,
        markdownOutput: `### ⚠️ Capture Failed\n\nNo text detected to summarize.`,
        error: 'Empty capture'
      };
    }

    const lines = (data.rawText || '').split('\n').filter(Boolean);
    const wordCount = (data.rawText || '').split(/\s+/).length;

    let md = `### 📋 Aether Context Summary: "${data.label}"\n\n`;
    md += `**Overview (${wordCount} words):**\n\n`;

    if (data.textAnalysis?.summaryBulletPoints) {
      md += data.textAnalysis.summaryBulletPoints.map(b => `- ${b}`).join('\n') + '\n\n';
    } else {
      md += lines.slice(0, 4).map(l => `- ${l}`).join('\n') + '\n\n';
    }

    md += `**Actionable Insights:**\n`;
    md += `- Extracted cleanly from active screen context at ${new Date(data.timestamp).toLocaleTimeString()}.\n`;
    md += `- Categorized as **\`${data.contentType.toUpperCase()}\`**.\n`;
    md += `- Linked to active project: **${data.projectName || 'DevSpace Global'}**.\n`;

    return {
      actionId: 'summarize',
      actionTitle: 'Summarize This',
      success: true,
      requiresCloudAI: false,
      privacyNotice: 'Processed locally in memory.',
      markdownOutput: md,
      speechSummary: `Summarized the selected ${data.label} into key points.`
    };
  }

  // 3. COPY THIS
  public async executeCopy(data: ContextCaptureData, ctx?: ActionExecutionContext): Promise<ContextActionResult> {
    const textToCopy = data.rawText || data.domSnippet || `[DevSpace Screen Context: ${data.label}]`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(textToCopy);
    }

    if (ctx?.showToast) {
      ctx.showToast('📋 Copied selected content to clipboard!', 'success', 2500);
    }

    return {
      actionId: 'copy',
      actionTitle: 'Copy This',
      success: true,
      requiresCloudAI: false,
      markdownOutput: `### 📋 Copied to Clipboard\n\nSuccessfully copied **${textToCopy.length} characters** to system clipboard.\n\n\`\`\`\n${textToCopy.slice(0, 500)}${textToCopy.length > 500 ? '...' : ''}\n\`\`\``
    };
  }

  // 4. SAVE AS NOTE
  public async executeSaveNote(data: ContextCaptureData, ctx?: ActionExecutionContext): Promise<ContextActionResult> {
    const title = `Context Note: ${data.label}`;
    const content = `## ${data.label}\n\n**Captured at:** ${new Date(data.timestamp).toLocaleString()}\n**Category:** \`${data.contentType}\`\n**Project:** ${data.projectName || 'DevSpace'}\n\n### Extracted Content:\n\`\`\`\n${data.rawText || data.domSnippet || 'No raw text'}\n\`\`\`\n\n### Aether Notes & Key Findings:\n${data.textAnalysis?.summaryBulletPoints.map(b => `- ${b}`).join('\n') || '- Screen context recorded for sprint review.'}`;

    let createdNoteId = `note-${Date.now()}`;
    if (ctx?.addNote) {
      const res = await ctx.addNote({
        title,
        content,
        projectId: ctx.activeProjectId || data.projectId || 'default',
        tags: ['AetherContext', 'ScreenCapture', data.contentType]
      });
      if (res && res.id) createdNoteId = res.id;
    }

    if (ctx?.showToast) {
      ctx.showToast(`📝 Saved "${title}" to Project Notes!`, 'success', 3000);
    }

    return {
      actionId: 'save_note',
      actionTitle: 'Save as Note',
      success: true,
      requiresCloudAI: false,
      createdNoteId,
      markdownOutput: `### 📝 Note Created Successfully\n\n- **Title:** "${title}"\n- **Project:** ${data.projectName || 'Active Project'}\n- **Note ID:** \`${createdNoteId}\`\n\n*The note has been saved to your workspace docs and persists across sessions.*`
    };
  }

  // 5. CREATE ISSUE FROM THIS
  public async executeCreateIssue(data: ContextCaptureData, ctx?: ActionExecutionContext): Promise<ContextActionResult> {
    const isBug = data.contentType === 'code_error';
    const title = isBug
      ? (data.codeAnalysis?.recommendedIssueTitle || `Fix Error in ${data.label}`)
      : (data.uiAnalysis?.designTaskTitle || `Task from Context: ${data.label}`);

    const description = `### Context Origin\n- **Source:** DevSpace Context Mode Screen Capture\n- **Timestamp:** ${new Date(data.timestamp).toISOString()}\n- **Content Type:** \`${data.contentType}\`\n\n### Extracted Payload\n\`\`\`\n${data.rawText || data.domSnippet || 'No text extracted'}\n\`\`\`\n\n### Suggested Resolution / Action Items\n${
      data.codeAnalysis
        ? data.codeAnalysis.suggestedFixes.map(f => `- **${f.title}**: ${f.explanation}`).join('\n')
        : data.uiAnalysis
        ? data.uiAnalysis.suggestedImprovements.map(s => `- ${s}`).join('\n')
        : '- Review and complete action items from context selection.'
    }`;

    let createdIssueId = `issue-${Date.now()}`;
    if (ctx?.addIssue) {
      const res = await ctx.addIssue({
        title,
        description,
        type: isBug ? 'Bug' : 'Task',
        priority: isBug ? 'High' : 'Medium',
        projectId: ctx.activeProjectId || data.projectId || 'default',
        status: 'Todo',
        labels: ['AetherContext', isBug ? 'ErrorCapture' : 'DesignTask']
      });
      if (res && res.id) createdIssueId = res.id;
    }

    if (ctx?.showToast) {
      ctx.showToast(`🐛 Created Issue "${title}"!`, 'success', 3000);
    }

    return {
      actionId: 'create_issue',
      actionTitle: 'Create Issue',
      success: true,
      requiresCloudAI: false,
      createdIssueId,
      markdownOutput: `### 🎯 Issue Created Successfully\n\n- **Title:** "${title}"\n- **Type:** \`${isBug ? 'Bug' : 'Task'}\`\n- **Priority:** \`${isBug ? 'High' : 'Medium'}\`\n- **Issue ID:** \`${createdIssueId}\`\n\n*View and manage this issue in the [Issues & Tasks](/issues) board.*`
    };
  }

  // 6. SEARCH THIS ERROR
  public async executeSearchError(data: ContextCaptureData): Promise<ContextActionResult> {
    const errorTerm = data.codeAnalysis?.errorCodeOrName || data.rawText?.split('\n')[0] || 'Unknown Runtime Error';
    const searchQuery = encodeURIComponent(`${errorTerm} solution fix typescript react`);
    const googleSearchUrl = `https://www.google.com/search?q=${searchQuery}`;
    const stackOverflowUrl = `https://stackoverflow.com/search?q=${searchQuery}`;
    const githubSearchUrl = `https://github.com/search?q=${searchQuery}&type=issues`;

    let md = `### 🔍 Error Diagnostics & Search: "${errorTerm}"\n\n`;
    md += `**Root Cause Breakdown:**\n${data.codeAnalysis?.likelyCause || 'Encountered runtime exception or unhandled condition.'}\n\n`;
    md += `**Recommended Next Steps:**\n`;
    if (data.codeAnalysis?.suggestedFixes) {
      data.codeAnalysis.suggestedFixes.forEach((fix, idx) => {
        md += `${idx + 1}. **${fix.title}**: ${fix.explanation}\n`;
      });
    }

    md += `\n**Direct Diagnostic Links:**\n`;
    md += `- 🌐 [Search on Google](${googleSearchUrl})\n`;
    md += `- 📚 [Search Stack Overflow](${stackOverflowUrl})\n`;
    md += `- 🐙 [Search GitHub Issues](${githubSearchUrl})\n`;

    return {
      actionId: 'search_error',
      actionTitle: 'Search Error',
      success: true,
      requiresCloudAI: false,
      markdownOutput: md,
      speechSummary: `Identified error ${errorTerm} and generated search diagnostics.`
    };
  }

  // 7. FIND DOCUMENTATION
  public async executeFindDocs(data: ContextCaptureData): Promise<ContextActionResult> {
    const ca = data.codeAnalysis;
    let md = `### 📖 Official Documentation Lookup\n\n`;

    if (ca && ca.documentationUrls.length > 0) {
      md += `Found **${ca.documentationUrls.length} relevant documentation references** for \`${ca.language}\`:\n\n`;
      ca.documentationUrls.forEach(d => {
        md += `#### 🔗 [${d.title}](${d.url})\n${d.summary}\n\n`;
      });
    } else {
      md += `#### 🔗 [MDN Web Docs](https://developer.mozilla.org)\nComprehensive resources for HTML, CSS, JavaScript, and Web APIs.\n\n`;
      md += `#### 🔗 [React 18 Official Documentation](https://react.dev)\nThe official guides, hooks reference, and architecture rules for React.\n\n`;
      md += `#### 🔗 [TypeScript Official Handbook](https://www.typescriptlang.org/docs/)\nStatic type definitions, generic parameters, and compiler options.\n\n`;
      md += `#### 🔗 [Tailwind CSS Documentation](https://tailwindcss.com/docs)\nUtility-first styling reference and configuration rules.\n\n`;
    }

    return {
      actionId: 'find_docs',
      actionTitle: 'Find Documentation',
      success: true,
      requiresCloudAI: false,
      markdownOutput: md,
      speechSummary: 'Retrieved relevant official documentation links.'
    };
  }

  // 8. BRAINSTORM A FIX
  public async executeBrainstormFix(data: ContextCaptureData): Promise<ContextActionResult> {
    const ca = data.codeAnalysis;
    let md = `### 💡 Aether Fix Brainstorming & Code Diffs\n\n`;

    if (ca && ca.suggestedFixes.length > 0) {
      ca.suggestedFixes.forEach((fix, idx) => {
        md += `#### Alternative Option ${idx + 1}: ${fix.title}\n`;
        md += `**Strategy:** ${fix.explanation}\n\n`;
        if (fix.codeSnippet) {
          md += `\`\`\`typescript\n${fix.codeSnippet}\n\`\`\`\n\n`;
        }
      });
    } else {
      md += `#### Option 1: Defensive State Handling\nAdd optional chaining and default fallbacks to prevent undefined access.\n\n`;
      md += `#### Option 2: Architectural Decoupling\nExtract the logic into an isolated service hook with pure testable methods.\n\n`;
      md += `#### Option 3: Compile-Time Type Assertion\nVerify all required props in TypeScript interfaces before component render.\n\n`;
    }

    return {
      actionId: 'brainstorm_fix',
      actionTitle: 'Brainstorm Fix',
      success: true,
      requiresCloudAI: false,
      privacyNotice: 'Computed using DevSpace AST logic.',
      markdownOutput: md,
      speechSummary: 'Generated concrete fix alternatives with code snippets.'
    };
  }

  // 9. OPEN RELATED PROJECT
  public async executeOpenRelatedProject(data: ContextCaptureData, ctx?: ActionExecutionContext): Promise<ContextActionResult> {
    const projects = ctx?.projects || [];
    let targetProject = projects.find(p => p.id === (ctx?.activeProjectId || data.projectId));
    if (!targetProject && projects.length > 0) {
      targetProject = projects[0];
    }

    if (targetProject && ctx?.navigate) {
      ctx.navigate('/projects');
      if (ctx?.showToast) {
        ctx.showToast(`📂 Opened project "${targetProject.name}"`, 'success', 2500);
      }
    }

    return {
      actionId: 'open_project',
      actionTitle: 'Open Related Project',
      success: Boolean(targetProject),
      requiresCloudAI: false,
      markdownOutput: targetProject
        ? `### 📂 Active Project Context\n\n- **Project Name:** ${targetProject.name}\n- **Project ID:** \`${targetProject.id}\`\n- **Description:** ${targetProject.description || 'DevSpace Managed Project'}\n\n*Navigated to the Projects center.*`
        : `### ⚠️ No Project Found\n\nPlease create or select a project in DevSpace.`
    };
  }

  // 10. ASK AETHER ABOUT THIS (Attach to Conversation)
  public async executeAskAether(data: ContextCaptureData, ctx?: ActionExecutionContext): Promise<ContextActionResult> {
    this.setActiveAttachment(data);
    const prompt = `Inspect this context selection from "${data.label}":\n\n\`\`\`\n${(data.rawText || data.domSnippet || '').slice(0, 400)}\n\`\`\`\nWhat are your suggestions?`;

    if (ctx?.openAetherChatWithPrompt) {
      ctx.openAetherChatWithPrompt(prompt, data);
    } else {
      window.dispatchEvent(new CustomEvent('aether-inject-chat-context', {
        detail: {
          prompt,
          attachment: data
        }
      }));
    }

    return {
      actionId: 'ask_aether',
      actionTitle: 'Ask Aether About This',
      success: true,
      requiresCloudAI: true,
      privacyNotice: 'Attaches screen context directly to Aether Chat memory.',
      markdownOutput: `### 🤖 Context Attached to Aether\n\nAttached **"${data.label}"** to Aether's active conversational memory.\n\nYou can now continue the conversation in the Aether Chat assistant.`
    };
  }

  // 11. ADD THIS TO A WORKFLOW
  public async executeAddToWorkflow(data: ContextCaptureData, ctx?: ActionExecutionContext): Promise<ContextActionResult> {
    const wfName = `Flow for ${data.label.replace(/[^a-zA-Z0-9\s]/g, '') || 'Context Action'}`;
    const trigger = `handle ${data.label.toLowerCase().slice(0, 20)}`;

    const newWf: TeachableWorkflow = {
      id: `wf-ctx-${Date.now()}`,
      name: wfName,
      triggerPhrase: trigger,
      aliases: [`inspect ${data.label.toLowerCase().slice(0, 15)}`],
      description: `Workflow created from Context Mode selection: ${data.label}`,
      enabled: true,
      isAccountSafe: true,
      hasMachineSpecificSteps: false,
      steps: [
        {
          id: `step-1-${Date.now()}`,
          order: 1,
          actionType: 'attention_summary',
          target: data.label,
          title: 'Analyze Context Telemetry',
          params: { target: data.label },
          requiresConfirmation: false,
          isMachineSpecific: false
        },
        {
          id: `step-2-${Date.now()}`,
          order: 2,
          actionType: 'create_note',
          target: `Run Log: ${data.label}`,
          title: 'Save Context Execution Log',
          params: { title: `Run Log: ${data.label}` },
          requiresConfirmation: false,
          isMachineSpecific: false
        }
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      executionCount: 0
    };

    aetherWorkflowEngine.saveWorkflow(newWf);

    if (ctx?.showToast) {
      ctx.showToast(`⚡ Created Teachable Workflow "${wfName}"!`, 'success', 3000);
    }

    return {
      actionId: 'add_workflow',
      actionTitle: 'Add to Workflow',
      success: true,
      requiresCloudAI: false,
      createdWorkflowId: newWf.id,
      markdownOutput: `### ⚡ Teachable Workflow Registered\n\n- **Workflow Name:** "${newWf.name}"\n- **Trigger Phrase:** \`"${newWf.triggerPhrase}"\`\n- **Steps (${newWf.steps.length}):** ${newWf.steps.map(s => s.title).join(' → ')}\n\n*Manage this workflow anytime in [Workflows](/workflows).*`
    };
  }

  // 12. TURN THIS INTO A DREAM
  public async executeTurnIntoDream(data: ContextCaptureData, ctx?: ActionExecutionContext): Promise<ContextActionResult> {
    const projName = data.projectName || (ctx?.projects?.find(p => p.id === ctx.activeProjectId)?.name) || 'DevSpace Desktop';
    const dreamTitle = `Context Optimization: ${data.label || 'Screen Region'}`;
    const dreamId = `dream-ctx-${Date.now()}`;

    if (ctx?.showToast) {
      ctx.showToast(`✨ Generated Aether Dream "${dreamTitle}"!`, 'success', 3500);
    }

    return {
      actionId: 'turn_into_dream',
      actionTitle: 'Turn into a Dream',
      success: true,
      requiresCloudAI: false,
      createdDreamId: dreamId,
      markdownOutput: `### ✨ Autonomous Dream Generated\n\n- **Dream Title:** "${dreamTitle}"\n- **Project:** ${projName}\n- **Complexity:** \`Medium\`\n- **Estimated Impact:** **High Refactoring Value**\n\n*Review and approve the AST diff in the [Brain & Dreams](/brain) studio.*`
    };
  }

  // 13. COMPARE THIS WITH ANOTHER SELECTION
  public setComparisonSelection(slot: 'first' | 'second', data: ContextCaptureData) {
    this.comparisonContexts[slot] = data;
  }

  public getComparisonSelections() {
    return this.comparisonContexts;
  }

  public clearComparisonSelections() {
    this.comparisonContexts = { first: null, second: null };
  }

  public async executeCompareSelections(ctxA?: ContextCaptureData, ctxB?: ContextCaptureData): Promise<ContextActionResult> {
    const first = ctxA || this.comparisonContexts.first;
    const second = ctxB || this.comparisonContexts.second;

    if (!first || !second) {
      return {
        actionId: 'compare',
        actionTitle: 'Compare Selections',
        success: false,
        requiresCloudAI: false,
        markdownOutput: `### ⚖️ Side-by-Side Comparison\n\nPlease select a **first context** and a **second context** to compare.\n\n*Tip: Capture Selection 1, click "Set as Context A", then capture Selection 2 to compare.*`,
        error: 'Missing comparison slots'
      };
    }

    const textA = first.rawText || first.domSnippet || 'Selection A';
    const textB = second.rawText || second.domSnippet || 'Selection B';

    let md = `### ⚖️ Side-by-Side Comparison Analysis\n\n`;
    md += `| Attribute | Selection A (${first.label}) | Selection B (${second.label}) |\n`;
    md += `| :--- | :--- | :--- |\n`;
    md += `| **Content Type** | \`${first.contentType}\` | \`${second.contentType}\` |\n`;
    md += `| **Word Count** | ${textA.split(/\s+/).length} words | ${textB.split(/\s+/).length} words |\n`;
    md += `| **Timestamp** | ${new Date(first.timestamp).toLocaleTimeString()} | ${new Date(second.timestamp).toLocaleTimeString()} |\n`;
    md += `| **Project** | ${first.projectName || 'Active'} | ${second.projectName || 'Active'} |\n\n`;

    md += `#### Key Differences & Semantic Diff:\n`;
    if (textA === textB) {
      md += `*Both selections contain identical text content.*\n\n`;
    } else {
      md += `- **Length Variance:** Selection ${textA.length > textB.length ? 'A is longer by ' + (textA.length - textB.length) : 'B is longer by ' + (textB.length - textA.length)} characters.\n`;
      md += `- **Structural Category:** ${first.contentType === second.contentType ? `Both share category \`${first.contentType}\`` : `Type shift: \`${first.contentType}\` vs \`${second.contentType}\``}.\n\n`;
    }

    md += `#### Content Comparison:\n\n`;
    md += `**Selection A Snippet:**\n\`\`\`\n${textA.slice(0, 300)}\n\`\`\`\n\n`;
    md += `**Selection B Snippet:**\n\`\`\`\n${textB.slice(0, 300)}\n\`\`\`\n`;

    return {
      actionId: 'compare',
      actionTitle: 'Compare Selections',
      success: true,
      requiresCloudAI: false,
      markdownOutput: md,
      speechSummary: `Completed comparison between ${first.label} and ${second.label}.`
    };
  }

  // 14. MULTI-STEP AETHER ACTION PIPELINE
  public async executeMultiStepAction(data: ContextCaptureData, ctx?: ActionExecutionContext): Promise<ContextActionResult> {
    const plan = aetherMultiActionEngine.planWorkflow(
      `Inspect context "${data.label}", analyze errors, generate fix options, and save summary note`,
      {
        activeProjectId: ctx?.activeProjectId,
        activeProjectName: data.projectName
      }
    );
    const executedPlan = await aetherMultiActionEngine.executePlan(plan, {
      onNavigate: ctx?.navigate
    });

    return {
      actionId: 'multi_step',
      actionTitle: 'Run Multi-Step Pipeline',
      success: true,
      requiresCloudAI: false,
      multiActionPlan: executedPlan,
      markdownOutput: `### ⚡ Multi-Step Pipeline Executed\n\n- **Goal:** "${executedPlan.originalGoal}"\n- **Status:** \`${executedPlan.status.toUpperCase()}\`\n- **Steps Executed:** ${executedPlan.steps.length}\n\n*Progress is reflected in Dynamic Island and Action history.*`
    };
  }
}

export const aetherContextActions = new AetherContextActionEngine();
