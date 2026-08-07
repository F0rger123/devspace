import { NodeTypeDefinition, N8nWorkflow } from './types';

export const NODE_LIBRARY: NodeTypeDefinition[] = [
  // TRIGGERS
  {
    type: 'trigger-dream-approved',
    category: 'trigger',
    label: 'When Dream Approved',
    description: 'Triggers when a Code Dream is reviewed and approved in Review Studio',
    iconName: 'Sparkles',
    color: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    bgColor: 'bg-amber-500/10',
    defaultConfig: {
      autoQueue: true
    }
  },
  {
    type: 'trigger-github-pr',
    category: 'trigger',
    label: 'When GitHub PR Opens',
    description: 'Triggers when a Pull Request is opened or updated on GitHub',
    iconName: 'GitPullRequest',
    color: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    bgColor: 'bg-amber-500/10',
    defaultConfig: {
      event: 'pull_request.opened',
      targetBranch: 'main'
    }
  },
  {
    type: 'trigger-calendar-focus',
    category: 'trigger',
    label: 'Calendar Focus Time',
    description: 'Triggers when Google Calendar event indicates Focus Time',
    iconName: 'Calendar',
    color: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    bgColor: 'bg-amber-500/10',
    defaultConfig: {
      keyword: 'Focus Time',
      autoEnableFocusMode: true
    }
  },
  {
    type: 'trigger-webhook',
    category: 'trigger',
    label: 'Webhook Trigger',
    description: 'Triggers workflow on incoming HTTP POST payload',
    iconName: 'Webhook',
    color: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    bgColor: 'bg-amber-500/10',
    defaultConfig: {
      path: '/api/v1/webhooks/custom-event',
      method: 'POST',
      auth: 'None'
    }
  },
  {
    type: 'trigger-cron',
    category: 'trigger',
    label: 'Schedule / Cron',
    description: 'Executes automatically at recurring interval or set time',
    iconName: 'Clock',
    color: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    bgColor: 'bg-amber-500/10',
    defaultConfig: {
      cron: '0 8 * * *',
      intervalName: 'Every morning at 08:00 AM'
    }
  },
  {
    type: 'trigger-bug-created',
    category: 'trigger',
    label: 'On Critical Bug Created',
    description: 'Triggers whenever a High or Critical severity defect is reported',
    iconName: 'AlertTriangle',
    color: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    bgColor: 'bg-amber-500/10',
    defaultConfig: {
      severityThreshold: 'High',
      autoAssign: true
    }
  },
  {
    type: 'trigger-manual',
    category: 'trigger',
    label: 'Manual Trigger',
    description: 'Starts manually via UI click or API request',
    iconName: 'Play',
    color: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    bgColor: 'bg-amber-500/10',
    defaultConfig: {
      promptUserForInput: false
    }
  },

  // AI & LLM NODES
  {
    type: 'ai-gemini-prompt',
    category: 'ai',
    label: 'Gemini AI Prompt',
    description: 'Processes input prompt with Gemini 2.5/3 Flash model',
    iconName: 'Sparkles',
    color: 'text-yellow-400',
    borderColor: 'border-yellow-500/40',
    bgColor: 'bg-yellow-500/10',
    defaultConfig: {
      prompt: 'Analyze active workspace issues and generate concise summary.',
      model: 'gemini-3.5-flash',
      temperature: 0.3
    }
  },
  {
    type: 'ai-code-resolver',
    category: 'ai',
    label: 'AI Bug Code Resolver',
    description: 'Analyzes bug reports and drafts code fix blueprints',
    iconName: 'Cpu',
    color: 'text-yellow-400',
    borderColor: 'border-yellow-500/40',
    bgColor: 'bg-yellow-500/10',
    defaultConfig: {
      includeStackTrace: true,
      suggestSubtasks: true
    }
  },
  {
    type: 'ai-idea-incubator',
    category: 'ai',
    label: 'AI Idea Expander',
    description: 'Transforms raw feature ideas into detailed architecture & tasks',
    iconName: 'Lightbulb',
    color: 'text-yellow-400',
    borderColor: 'border-yellow-500/40',
    bgColor: 'bg-yellow-500/10',
    defaultConfig: {
      targetStack: ['React', 'TypeScript', 'Tailwind', 'Firebase']
    }
  },

  // ACTIONS
  {
    type: 'action-push-queue',
    category: 'action',
    label: 'Queue Push to Deployment',
    description: 'Enqueues code changes into the production push queue',
    iconName: 'Rocket',
    color: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    bgColor: 'bg-blue-500/10',
    defaultConfig: {
      targetBranch: 'main',
      autoDeploy: true
    }
  },
  {
    type: 'action-create-task',
    category: 'action',
    label: 'Create Workspace Task',
    description: 'Spawns a real issue or task ticket in workspace project',
    iconName: 'CheckSquare',
    color: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    bgColor: 'bg-blue-500/10',
    defaultConfig: {
      title: 'Automated AI Fix Subtask',
      priority: 'High',
      assignee: 'Cortex Developer Agent'
    }
  },
  {
    type: 'action-planner-item',
    category: 'action',
    label: 'Add Planner Task',
    description: 'Adds scheduled focus task or review item to Aether Planner',
    iconName: 'Calendar',
    color: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    bgColor: 'bg-blue-500/10',
    defaultConfig: {
      title: 'Review PR & Verify Build',
      priority: 'high'
    }
  },
  {
    type: 'action-send-email',
    category: 'action',
    label: 'Send Gmail Dispatch',
    description: 'Dispatches custom HTML/plain email briefing to recipients',
    iconName: 'Mail',
    color: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    bgColor: 'bg-blue-500/10',
    defaultConfig: {
      recipient: 'drummerforger@gmail.com',
      subject: '🚨 Aether Workspace Automation Alert',
      bodyTemplate: 'Daily briefing report generated by Cortex Agent.'
    }
  },
  {
    type: 'action-notification',
    category: 'action',
    label: 'Dynamic Island Notification',
    description: 'Triggers high-priority HUD notification in Dynamic Island & Activity Center',
    iconName: 'Bell',
    color: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    bgColor: 'bg-blue-500/10',
    defaultConfig: {
      title: 'Focus Mode Active',
      message: 'Muting unnecessary alerts for 2 hours.'
    }
  },
  {
    type: 'action-firestore-crud',
    category: 'action',
    label: 'Firestore Database Action',
    description: 'Creates, updates, or queries Firestore documents',
    iconName: 'Database',
    color: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    bgColor: 'bg-blue-500/10',
    defaultConfig: {
      collection: 'automations_logs',
      operation: 'setDoc'
    }
  },
  {
    type: 'action-http-request',
    category: 'action',
    label: 'HTTP / REST API Call',
    description: 'Makes HTTP GET/POST/PUT request to external URL',
    iconName: 'Globe',
    color: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    bgColor: 'bg-blue-500/10',
    defaultConfig: {
      url: 'https://api.github.com/repos/org/repo/dispatches',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }
  },

  // LOGIC & FLOW
  {
    type: 'logic-if-else',
    category: 'logic',
    label: 'If / Else Condition',
    description: 'Branches workflow path based on boolean comparison',
    iconName: 'GitMerge',
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    bgColor: 'bg-emerald-500/10',
    defaultConfig: {
      variable: 'issue.priority',
      operator: 'equals',
      value: 'Critical'
    }
  },
  {
    type: 'logic-loop',
    category: 'logic',
    label: 'For Each Loop',
    description: 'Iterates through array of items (e.g. issues, commits, dreams)',
    iconName: 'RefreshCw',
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    bgColor: 'bg-emerald-500/10',
    defaultConfig: {
      arrayPath: 'items',
      itemVar: 'item'
    }
  },
  {
    type: 'logic-approval',
    category: 'logic',
    label: 'Manual Approval Gate',
    description: 'Pauses workflow until developer explicitly confirms action',
    iconName: 'ShieldCheck',
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    bgColor: 'bg-emerald-500/10',
    defaultConfig: {
      prompt: 'Confirm production push queue execution?'
    }
  },
  {
    type: 'logic-delay',
    category: 'logic',
    label: 'Delay / Sleep Timer',
    description: 'Pauses workflow execution for specified duration',
    iconName: 'Hourglass',
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    bgColor: 'bg-emerald-500/10',
    defaultConfig: {
      seconds: 5
    }
  },

  // INTEGRATIONS
  {
    type: 'integration-github',
    category: 'integration',
    label: 'GitHub Repository Sync',
    description: 'Syncs commit events or opens PRs automatically',
    iconName: 'Github',
    color: 'text-purple-400',
    borderColor: 'border-purple-500/30',
    bgColor: 'bg-purple-500/10',
    defaultConfig: {
      event: 'push',
      branch: 'main'
    }
  },
  {
    type: 'integration-slack',
    category: 'integration',
    label: 'Slack / Discord Alert',
    description: 'Posts formatted notification message to channel webhook',
    iconName: 'MessageSquare',
    color: 'text-purple-400',
    borderColor: 'border-purple-500/30',
    bgColor: 'bg-purple-500/10',
    defaultConfig: {
      channel: '#engineering-alerts',
      message: '🚨 Critical Bug Detected in Production Workspace!'
    }
  }
];

export const PRESET_WORKFLOW_TEMPLATES: N8nWorkflow[] = [
  {
    id: 'tmpl_sre_fixer',
    name: 'SRE Critical Bug Auto-Triage & Code Repair',
    description: 'Detects critical bugs, analyzes root cause with Gemini, generates code fixes, and creates subtask tickets.',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodes: [
      {
        id: 'n1',
        type: 'trigger-bug-created',
        category: 'trigger',
        label: 'Critical Bug Listener',
        description: 'Triggers on High/Critical bug',
        position: { x: 80, y: 180 },
        status: 'idle',
        config: { severityThreshold: 'Critical' }
      },
      {
        id: 'n2',
        type: 'ai-code-resolver',
        category: 'ai',
        label: 'Gemini Root Cause Analyzer',
        description: 'Drafts code fix blueprint',
        position: { x: 380, y: 180 },
        status: 'idle',
        config: { includeStackTrace: true, suggestSubtasks: true }
      },
      {
        id: 'n3',
        type: 'action-create-task',
        category: 'action',
        label: 'Spawn AI Developer Task',
        description: 'Appends subtask to issue',
        position: { x: 680, y: 100 },
        status: 'idle',
        config: { title: 'Apply AI Code Repair', assignee: 'Cortex Developer Agent' }
      },
      {
        id: 'n4',
        type: 'action-send-email',
        category: 'action',
        label: 'Notify SRE Lead Email',
        description: 'Sends email alert with repair details',
        position: { x: 680, y: 280 },
        status: 'idle',
        config: { recipient: 'drummerforger@gmail.com', subject: '🚨 SRE Automated Repair Dispatched' }
      }
    ],
    edges: [
      { id: 'e1-2', source: 'n1', target: 'n2' },
      { id: 'e2-3', source: 'n2', target: 'n3' },
      { id: 'e2-4', source: 'n2', target: 'n4' }
    ]
  },
  {
    id: 'tmpl_daily_briefing',
    name: 'Daily Morning AI Briefing & Email Brief',
    description: 'Runs every morning at 8:00 AM, fetches workspace metrics, summarizes priorities, and emails briefing.',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodes: [
      {
        id: 'n1',
        type: 'trigger-cron',
        category: 'trigger',
        label: 'Daily 8 AM Schedule',
        description: 'Fires every day at 8:00 AM',
        position: { x: 80, y: 180 },
        status: 'idle',
        config: { cron: '0 8 * * *' }
      },
      {
        id: 'n2',
        type: 'ai-gemini-prompt',
        category: 'ai',
        label: 'Workspace AI Summarizer',
        description: 'Compiles open tasks & bugs',
        position: { x: 380, y: 180 },
        status: 'idle',
        config: { prompt: 'Summarize top 5 unresolved issues and project milestones.' }
      },
      {
        id: 'n3',
        type: 'action-send-email',
        category: 'action',
        label: 'Send Email Briefing',
        description: 'Sends daily HTML email report',
        position: { x: 680, y: 180 },
        status: 'idle',
        config: { recipient: 'drummerforger@gmail.com', subject: '☀️ Daily Workspace AI Briefing' }
      }
    ],
    edges: [
      { id: 'e1-2', source: 'n1', target: 'n2' },
      { id: 'e2-3', source: 'n2', target: 'n3' }
    ]
  },
  {
    id: 'tmpl_idea_incubator',
    name: 'New Project Idea Incubator & Stack Setup',
    description: 'Takes a brief concept note, uses Gemini AI to design tech stack & architecture, and creates project workspace.',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodes: [
      {
        id: 'n1',
        type: 'trigger-manual',
        category: 'trigger',
        label: 'Idea Submission Trigger',
        description: 'Manual trigger on new concept',
        position: { x: 80, y: 180 },
        status: 'idle',
        config: {}
      },
      {
        id: 'n2',
        type: 'ai-idea-incubator',
        category: 'ai',
        label: 'Gemini Architecture Designer',
        description: 'Generates stack & starter tasks',
        position: { x: 380, y: 180 },
        status: 'idle',
        config: { targetStack: ['React', 'TypeScript', 'Tailwind', 'Firebase'] }
      },
      {
        id: 'n3',
        type: 'action-create-task',
        category: 'action',
        label: 'Batch Create Project Tasks',
        description: 'Spawns initial dev tasks',
        position: { x: 680, y: 180 },
        status: 'idle',
        config: { title: 'Initialize Repository & Boilerplate' }
      }
    ],
    edges: [
      { id: 'e1-2', source: 'n1', target: 'n2' },
      { id: 'e2-3', source: 'n2', target: 'n3' }
    ]
  }
];
