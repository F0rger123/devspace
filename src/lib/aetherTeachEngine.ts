export interface ActionStep {
  id: string;
  order: number;
  type: 'click' | 'fill' | 'navigate' | 'command' | 'open_app';
  targetLabel: string;
  targetSelector?: string;
  value?: string;
  appOrRoute?: string;
  isRisky?: boolean;
}

export interface TaughtSequence {
  id: string;
  name: string;
  triggerPhrase: string;
  description: string;
  steps: ActionStep[];
  createdAt: number;
  lastExecutedAt?: number;
  executionCount: number;
}

class AetherTeachEngine {
  private STORAGE_KEY = 'aether_taught_sequences_v1';
  private isRecording: boolean = false;
  private currentRecordingName: string = '';
  private currentRecordingSteps: ActionStep[] = [];

  constructor() {
    this.seedDefaults();
  }

  private seedDefaults() {
    const existing = this.getSequences();
    if (existing.length === 0) {
      const defaultSeq: TaughtSequence = {
        id: 'seq-default-1',
        name: 'Submit Weekly Report',
        triggerPhrase: 'submit weekly report',
        description: 'Navigates to notes, compiles weekly metrics, and triggers export report.',
        steps: [
          { id: 's1', order: 1, type: 'navigate', targetLabel: 'Notes Page', appOrRoute: '/notes' },
          { id: 's2', order: 2, type: 'click', targetLabel: '+ New Note Button', targetSelector: '[data-action="new-note"]' },
          { id: 's3', order: 3, type: 'fill', targetLabel: 'Note Title', targetSelector: 'input[placeholder*="Title"]', value: 'Weekly Engineering Status Report' },
          { id: 's4', order: 4, type: 'command', targetLabel: 'Aether Summarize Action', value: 'Summarize recent sprint tasks' },
          { id: 's5', order: 5, type: 'click', targetLabel: 'Export PDF Report', targetSelector: 'button:contains("Export")', isRisky: true }
        ],
        createdAt: Date.now() - 86400000,
        executionCount: 3
      };
      this.saveSequence(defaultSeq);
    }
  }

  public getSequences(): TaughtSequence[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  public saveSequence(seq: TaughtSequence): void {
    const sequences = this.getSequences();
    const index = sequences.findIndex(s => s.id === seq.id);
    if (index >= 0) {
      sequences[index] = seq;
    } else {
      sequences.unshift(seq);
    }
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sequences));
  }

  public deleteSequence(id: string): void {
    const sequences = this.getSequences().filter(s => s.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sequences));
  }

  public startRecording(sequenceName: string = 'Custom Demonstrated Workflow'): void {
    this.isRecording = true;
    this.currentRecordingName = sequenceName;
    this.currentRecordingSteps = [];
  }

  public recordStep(step: Omit<ActionStep, 'id' | 'order'>): void {
    if (!this.isRecording) return;
    const isRisky = step.isRisky || /delete|send|purchase|publish|close|remove|drop/i.test(step.targetLabel + ' ' + (step.value || ''));
    const newStep: ActionStep = {
      ...step,
      id: `step-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      order: this.currentRecordingSteps.length + 1,
      isRisky
    };
    this.currentRecordingSteps.push(newStep);
  }

  public stopRecording(): { sequenceName: string; steps: ActionStep[]; summaryText: string } {
    this.isRecording = false;
    const steps = [...this.currentRecordingSteps];
    const sequenceName = this.currentRecordingName;

    const summaryText = `🎓 **Taught Action Sequence Recorded: "${sequenceName}"**\n\n` +
      `**Captured ${steps.length} Steps:**\n` +
      steps.map(s => ` ${s.order}. **${s.type.toUpperCase()}** ${s.targetLabel}${s.value ? ` (*"${s.value}"*)` : ''}${s.isRisky ? ' ⚠️ [Risky Action - Requires Confirmation]' : ''}`).join('\n') +
      `\n\n*Trigger Phrase:* "${sequenceName.toLowerCase()}"`;

    return { sequenceName, steps, summaryText };
  }

  public confirmAndSaveRecording(name: string, triggerPhrase: string, steps: ActionStep[]): TaughtSequence {
    const newSeq: TaughtSequence = {
      id: `seq-${Date.now()}`,
      name,
      triggerPhrase: triggerPhrase.toLowerCase().trim(),
      description: `User-demonstrated workflow sequence containing ${steps.length} steps.`,
      steps,
      createdAt: Date.now(),
      executionCount: 0
    };
    this.saveSequence(newSeq);
    return newSeq;
  }

  public findMatchingSequence(phrase: string): TaughtSequence | undefined {
    const lower = phrase.toLowerCase().trim();
    const sequences = this.getSequences();
    return sequences.find(s => 
      lower === s.triggerPhrase || 
      lower === s.name.toLowerCase() ||
      lower.includes(`run ${s.triggerPhrase}`) ||
      lower.includes(`execute ${s.triggerPhrase}`) ||
      lower.includes(`run ${s.name.toLowerCase()}`) ||
      lower.includes(`execute ${s.name.toLowerCase()}`)
    );
  }

  public isRecordingActive(): boolean {
    return this.isRecording;
  }

  public getRecordingState(): { name: string; count: number } {
    return {
      name: this.currentRecordingName,
      count: this.currentRecordingSteps.length
    };
  }
}

export const aetherTeachEngine = new AetherTeachEngine();
