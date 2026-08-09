export type NodeCategory = 'trigger' | 'ai' | 'action' | 'logic' | 'integration';

export type NodeStatus = 'idle' | 'running' | 'success' | 'failed';

export interface AutomationNode {
  id: string;
  type: string; // e.g. 'webhook-trigger', 'schedule-cron', 'gemini-ai', 'create-task', 'send-email', 'if-condition', 'github-sync'
  category: NodeCategory;
  label: string;
  description: string;
  position: { x: number; y: number };
  status?: NodeStatus;
  config: Record<string, any>;
  inputs?: string[];  // input handle IDs
  outputs?: string[]; // output handle IDs
}

export interface AutomationEdge {
  id: string;
  source: string;      // source node ID
  target: string;      // target node ID
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
}

export interface AutomationExecutionRecord {
  id: string;
  runAt: string;
  status: 'success' | 'failed';
  duration: string;
  output: string;
  error?: string;
}

export interface N8nWorkflow {
  id: string;
  name: string;
  description: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  lastRun?: string | null;
  nextRun?: string | null;
  lastResult?: string | null;
  error?: string | null;
  history?: AutomationExecutionRecord[];
  nodes: AutomationNode[];
  edges: AutomationEdge[];
}

export interface NodeTypeDefinition {
  type: string;
  category: NodeCategory;
  label: string;
  description: string;
  iconName: string; // Lucide icon identifier
  color: string;
  borderColor: string;
  bgColor: string;
  defaultConfig: Record<string, any>;
}
