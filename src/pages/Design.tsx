import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  ShieldAlert,
  Sparkles,
  PencilRuler,
  ArrowRight,
  Bot,
  Send,
  Check,
  RefreshCw,
  Cpu,
  Layers,
  Key,
  ChevronRight,
  ChevronLeft,
  FileText,
  AlertCircle,
  Info,
  Wand2,
  BookmarkCheck,
  CodeXml,
  Globe,
  ShoppingBag,
  Clock,
  Smartphone,
  Laptop,
  BarChart3,
  Search,
  Eye,
  Columns,
  Monitor,
  Maximize2,
  Minimize2,
  Trash2,
  X,
  Sliders,
  Terminal,
  Layers3,
  CheckCircle2,
  AlertTriangle,
  Activity,
  ChevronDown,
} from "lucide-react";

import { useData, setDocWithSanitize } from "../context/DataProvider";
import { db, auth } from "../lib/auth";
import { doc, getDoc } from "firebase/firestore";
import { generateMockStitchResponse } from "../lib/mockBlueprints";

interface TemplateItem {
  id: string;
  title: string;
  name?: string;
  category:
    | "MOBILE"
    | "WEBSITE"
    | "ECOMMERCE"
    | "SOFTWARE"
    | "ANALYTICS"
    | "PRODUCTIVITY";
  badge: string;
  icon: any;
  description: string;
  prompt: string;
}

const DESIGN_TEMPLATES: TemplateItem[] = [
  // Mobile Apps
  {
    id: "fitpulse-mobile",
    title: "FitPulse Workout Tracker",
    category: "MOBILE",
    badge: "Mobile App",
    icon: Smartphone,
    description:
      "Activity rings, workout timers, exercise logs, and daily streak analytics.",
    prompt:
      "Build a mobile-first FitPulse Health & Workout Tracker app. Features: Circular goal rings for calories, steps, and active time; workout logger with exercise timers; daily streak counter; social activity feed; dark glassmorphic design optimized for mobile viewports.",
  },
  {
    id: "foodie-mobile",
    title: "BiteExpress Food Delivery",
    category: "MOBILE",
    badge: "Mobile App",
    icon: Smartphone,
    description:
      "Category filters, restaurant cards, customization modal, and order tracking.",
    prompt:
      "Build a mobile-first BiteExpress Food & Dining Delivery app. Features: Category filter pill bar (Pizza, Sushi, Burgers, Vegan); restaurant cards with ratings and delivery times; item modal with topping customizations; interactive cart drawer with promo code apply; real-time order status step progress tracker.",
  },
  {
    id: "chatter-mobile",
    title: "Whisper Social & Chat",
    category: "MOBILE",
    badge: "Mobile App",
    icon: Smartphone,
    description:
      "Real-time social feeds, story avatars, direct messaging, and voice notes.",
    prompt:
      "Build a mobile-first Whisper Social & Chat app. Features: Story avatars at the top; interactive social post feed with heart reactions and comment modal; direct messaging tab with typing indicator simulation and voice note playback; customizable avatar user profile page.",
  },

  // Websites
  {
    id: "saas-landing",
    title: "Aura SaaS Product Landing",
    category: "WEBSITE",
    badge: "Marketing",
    icon: Globe,
    description:
      "Conversion-focused SaaS landing page with hero banner, pricing toggle, and testimonials.",
    prompt:
      "Build a high-conversion Aura SaaS Marketing Homepage website. Features: Widescreen hero banner with gradient display title and CTA buttons; interactive monthly vs annual pricing toggle cards with savings pill; feature grid with hover card animations; customer logo marquee and testimonial carousel; reactive FAQ accordion and newsletter subscription.",
  },
  {
    id: "creative-portfolio",
    title: "Vanguard Agency Portfolio",
    category: "WEBSITE",
    badge: "Portfolio",
    icon: Globe,
    description:
      "Minimalist agency showcase grid, case study breakdown, and interactive contact form.",
    prompt:
      "Build a Vanguard Creative Agency Portfolio website. Features: Dark luxury aesthetic with high-contrast typography; filterable project showcase grid (Web, Branding, Motion, AI); project detail modal with case study breakdown; client ratings & press badges; interactive contact form with budget selector.",
  },

  // E-Commerce
  {
    id: "luxe-storefront",
    title: "Luxe Apparel Storefront",
    category: "ECOMMERCE",
    badge: "E-Commerce",
    icon: ShoppingBag,
    description:
      "Product showcase, hover zoom, sliding cart drawer, and instant checkout flow.",
    prompt:
      "Build a Luxe Minimalist E-Commerce Fashion Storefront. Features: Grid product cards with image hover zoom; category filtering (Outerwear, Essentials, Accessories); persistent sliding cart drawer with quantity modifiers and promo discount calculator; instant checkout modal with shipping address form.",
  },
  {
    id: "digital-marketplace",
    title: "PixelCraft Asset Store",
    category: "ECOMMERCE",
    badge: "Marketplace",
    icon: ShoppingBag,
    description:
      "Digital asset search, live preview tags, license tier selector, and inventory manager.",
    prompt:
      "Build a PixelCraft Digital Asset Marketplace. Features: Search bar with instant auto-filter; product cards with live preview tags and rating badges; license selector (Personal, Commercial, Enterprise); sliding cart checkout; downloadable asset library inventory manager.",
  },

  // Software & SaaS
  {
    id: "cloud-k8s",
    title: "Kubernetes Command Hub",
    category: "SOFTWARE",
    badge: "DevOps",
    icon: Laptop,
    description:
      "Infrastructure health map, pod scaling sliders, live container logs, and telemetry.",
    prompt:
      "Build a Cloud Kubernetes Operations Command Center software. Features: Node cluster health status grid; live container log stream console; pod auto-scaling slider controls; alert notification drawer; container deployment timeline graph.",
  },
  {
    id: "crm-sales",
    title: "Velocity Sales CRM",
    category: "SOFTWARE",
    badge: "SaaS CRM",
    icon: Laptop,
    description:
      "Pipeline Kanban board, revenue forecast charts, activity timeline, and client search.",
    prompt:
      "Build a Velocity Sales CRM Software application. Features: Interactive deal stage Kanban board (Lead, Contacted, Proposal, Closed Won); revenue forecast chart; deal value calculator; activity timeline logger; client search and filter bar.",
  },

  // Analytics & Dashboards
  {
    id: "apex-telemetry",
    title: "Apex Telemetry Dashboard",
    category: "ANALYTICS",
    badge: "Dashboard",
    icon: BarChart3,
    description:
      "Real-time CPU latency, memory sparklines, node logs stream, and health alerts.",
    prompt:
      "Build an Apex Performance & Telemetry Dashboard for developers. Features: Realtime latency & CPU metric cards with sparkline charts; log streaming console with search/filter; active worker node status list; system health alert triggers; state export controls.",
  },
  {
    id: "fintech-trading",
    title: "Fintech Wealth Terminal",
    category: "ANALYTICS",
    badge: "Fintech",
    icon: BarChart3,
    description:
      "Price charts with timeframes, order book DOM viewer, portfolio breakdown, and order entry.",
    prompt:
      "Build a Fintech Wealth & Algo-Trading Terminal. Features: Live price charts with interactive timeframes (1D, 1W, 1M); order book DOM viewer; portfolio balance breakdown pie chart; instant buy/sell order modal; trade execution history log.",
  },

  // Productivity
  {
    id: "taskflow-kanban",
    title: "TaskFlow Agile Kanban",
    category: "PRODUCTIVITY",
    badge: "Agile Kanban",
    icon: Layers,
    description:
      "Agile sprint board with interactive drag columns, subtasks checklist, issue drawer, and burndown chart.",
    prompt:
      "Build a TaskFlow Agile Project & Kanban Board app. Features: Drag-and-drop workflow columns (Backlog, In Progress, Code Review, Done); subtask checklist with instant completion toggles; detailed task drawer with priority tags and assignee avatars; sprint burndown progress tracker.",
  },
  {
    id: "cryptopulse-trading",
    title: "CryptoPulse DeFi Terminal",
    category: "ANALYTICS",
    badge: "Algo Trading",
    icon: BarChart3,
    description:
      "High-density DeFi trading terminal with interactive price charts, 1x-20x leverage orders, and live positions.",
    prompt:
      "Build a CryptoPulse DeFi & Algo-Trading Terminal app. Features: High-density interactive crypto price chart with timeframe buttons (1H, 24H, 1W, 1M); live watchlist ticker; margin leverage order slider (1x-20x); open positions table with real-time P&L calculations.",
  },
  {
    id: "focus-hub",
    title: "Focus Flow Pomodoro Suite",
    category: "PRODUCTIVITY",
    badge: "Productivity",
    icon: Clock,
    description:
      "Interactive ring focus timer, ambient soundscapes, task checklist, and streak stats.",
    prompt:
      "Build a Focus Flow & Pomodoro Hub. Features: Interactive ring timer with start/pause/reset controls and short/long break toggles; ambient audio soundscape selector (Rain, Waves, White Noise); task checklist with completion checkboxes; daily focus streak & time analytics.",
  },
];

interface Endpoint {
  path: string;
  method: string;
  description: string;
}

interface SubAgent {
  name: string;
  role: string;
  officeZone: "sentinel" | "scrum" | "docs_lab" | "dev_bay";
  projectTaskSector: "fixes" | "feature" | "docs" | "qa";
  modelEngine: string;
  goals: string[];
}

interface StitchOption {
  id: string;
  name: string;
  title: string;
  category:
    | "MOBILE"
    | "WEBSITE"
    | "ECOMMERCE"
    | "SOFTWARE"
    | "ANALYTICS"
    | "PRODUCTIVITY";
  badge: string;
  icon?: any;
  prompt: string;
  description: string;
  techStack: string[];
  dbSchema: string;
  endpoints: Endpoint[];
  files: {
    "index.html": string;
    "src/App.tsx": string;
    "src/index.css": string;
  };
  subAgents: SubAgent[];
}

export function normalizeTemplate(tmpl: any): TemplateItem {
  const titleVal = String(tmpl?.title || tmpl?.name || "Untitled Template");
  const descVal = String(tmpl?.description || "");
  const promptVal = String(tmpl?.prompt || descVal || titleVal);
  const badgeVal = String(tmpl?.badge || "Template");
  const catVal = (tmpl?.category || "WEBSITE") as any;

  return {
    id: String(tmpl?.id || `tmpl-${Math.random().toString(36).substring(2, 9)}`),
    title: titleVal,
    name: titleVal,
    category: catVal,
    badge: badgeVal,
    icon: tmpl?.icon || Globe,
    description: descVal,
    prompt: promptVal,
  };
}

export function normalizeOption(opt: any): StitchOption {
  const defaultFiles = {
    "index.html": "<div id='root'></div>",
    "src/App.tsx": "export default function App() { return <div className='p-4 text-white'>Template Content</div> }",
    "src/index.css": "@import 'tailwindcss';",
  };

  const rawFiles = opt?.files && typeof opt.files === "object" ? opt.files : {};
  const normalizedFiles = {
    "index.html": String(rawFiles["index.html"] || defaultFiles["index.html"]),
    "src/App.tsx": String(rawFiles["src/App.tsx"] || rawFiles["App.tsx"] || rawFiles["App.jsx"] || defaultFiles["src/App.tsx"]),
    "src/index.css": String(rawFiles["src/index.css"] || rawFiles["index.css"] || defaultFiles["src/index.css"]),
  };

  const nameVal = String(opt?.name || opt?.title || "Blueprint Variant");
  const descVal = String(opt?.description || "");
  const promptVal = String(opt?.prompt || descVal || nameVal);
  const badgeVal = String(opt?.badge || "Custom Variant");
  const catVal = (opt?.category || "SOFTWARE") as any;

  return {
    id: String(opt?.id || `opt-${Math.random().toString(36).substring(2, 9)}`),
    name: nameVal,
    title: nameVal,
    category: catVal,
    badge: badgeVal,
    icon: opt?.icon || Sparkles,
    prompt: promptVal,
    description: descVal,
    techStack: Array.isArray(opt?.techStack) ? opt.techStack.map(String) : ["React 18", "Tailwind CSS"],
    dbSchema: String(opt?.dbSchema || "collection('data')"),
    endpoints: Array.isArray(opt?.endpoints) ? opt.endpoints : [],
    files: normalizedFiles,
    subAgents: Array.isArray(opt?.subAgents) ? opt.subAgents : [],
  };
}


interface PreviewLogItem {
  stage: string;
  progress: number;
  details: string;
  time: string;
  isError?: boolean;
}

interface PreviewState {
  status: 'IDLE' | 'STARTING' | 'LOADING' | 'READY' | 'FAILED';
  progress: number;
  currentStage: string;
  logs: PreviewLogItem[];
  lastError: string | null;
  startTime: number | null;
  elapsedSeconds: number;
  iframeKey: number;
  isMinimalTest: boolean;
  sessionId: string;
}

const MINIMAL_TEST_OPTION: StitchOption = {
  id: "minimal-runtime-test",
  name: "Design Studio Runtime Test",
  title: "Design Studio Runtime Test",
  category: "SOFTWARE",
  badge: "Runtime Test",
  prompt: "Minimal verification layout to test iframe sandbox, Babel transpilation, and React state counter.",
  description: "Minimal verification layout to test iframe sandbox, Babel transpilation, and React state counter.",
  techStack: ["React 18", "Tailwind CSS"],
  dbSchema: "collection('test_logs')",
  endpoints: [{ path: "/api/health", method: "GET", description: "Health check" }],
  subAgents: [],
  files: {
    "index.html": "<div id='root'></div>",
    "src/index.css": "@import 'tailwindcss';",
    "src/App.tsx": `import React, { useState } from 'react';
export default function App() {
  const [count, setCount] = useState(0);
  const [step, setStep] = useState(1);

  return (
    <div style={{ padding: '32px', fontFamily: 'sans-serif', color: '#f4f4f5', background: '#09090b', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#18181b', border: '1px solid #27272a', padding: '28px', borderRadius: '16px', maxWidth: '520px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <span style={{ background: '#22c55e', color: '#000', fontSize: '10px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '6px', textTransform: 'uppercase' }}>Runtime Test Passed</span>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff', margin: 0 }}>DESIGN STUDIO SANDBOX OPERATIONAL</h2>
        </div>
        <p style={{ fontSize: '13px', color: '#a1a1aa', margin: '0 0 20px 0', lineHeight: 1.5 }}>
          The Interactive Preview sandbox engine, Babel standalone compiler, and React state management are all working properly inside this iframe.
        </p>

        <div style={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '8px' }}>Interactive React State Verification:</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button 
              onClick={() => setCount(c => c + step)}
              style={{ background: '#eab308', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
            >
              Click Counter: {count}
            </button>
            <button 
              onClick={() => setStep(s => s === 1 ? 5 : 1)}
              style={{ background: '#27272a', color: '#e4e4e7', border: '1px solid #3f3f46', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}
            >
              Step Size: +{step}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#22c55e', borderTop: '1px solid #27272a', paddingTop: '12px' }}>
          <span>✓ HTML Rendered</span>
          <span>✓ Babel Transpiled</span>
          <span>✓ React Mounted</span>
          <span>✓ State Reactive</span>
        </div>
      </div>
    </div>
  );
}`
  }
};

export class DesignStudioErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    // If quota error occurred, clear the offending draft key immediately
    if (error?.message?.includes("quota") || error?.name === "QuotaExceededError") {
      try {
        localStorage.removeItem("stitch_design_draft");
      } catch (_) {}
    }
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[Design Studio Error Boundary Caught]", error, errorInfo);
    if (error?.message?.includes("quota") || error?.name === "QuotaExceededError") {
      try {
        localStorage.removeItem("stitch_design_draft");
      } catch (_) {}
    }
  }

  handleReset = () => {
    try {
      localStorage.removeItem("stitch_design_draft");
      localStorage.removeItem("stitch_saved_designs");
    } catch (_) {}
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="max-w-md bg-zinc-900/90 border border-red-500/30 rounded-2xl p-6 shadow-2xl backdrop-blur-md space-y-4">
            <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center justify-center mx-auto">
              <ShieldAlert size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-red-400">Design Studio Encountered an Error</h3>
              <p className="text-xs text-zinc-400 mt-1">
                {this.state.error?.message || "An unexpected template state exception occurred."}
              </p>
            </div>
            <pre className="text-[10px] font-mono text-zinc-500 bg-zinc-950 p-3 rounded-lg border border-zinc-800 text-left overflow-x-auto max-h-32">
              {this.state.error?.stack || String(this.state.error)}
            </pre>
            <button
              onClick={this.handleReset}
              className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-2.5 px-4 rounded-xl text-xs transition-all cursor-pointer shadow-lg shadow-yellow-500/10"
            >
              Reset Design Studio Draft & Restore Defaults
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function DesignInner() {
  const navigate = useNavigate();
  const { addProject, setActiveProjectId } = useData();

  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [appIdea, setAppIdea] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("System Architect");
  const [optionsCount, setOptionsCount] = useState(2);
  const [selectedModel, setSelectedModel] = useState("gemini-3.7-flash");

  // Category and Template Filter states
  const [selectedCategory, setSelectedCategory] = useState<
    | "ALL"
    | "MOBILE"
    | "WEBSITE"
    | "ECOMMERCE"
    | "SOFTWARE"
    | "ANALYTICS"
    | "PRODUCTIVITY"
  >("ALL");
  const [templateSearch, setTemplateSearch] = useState("");
  const [selectedTemplateTitle, setSelectedTemplateTitle] = useState<
    string | null
  >(null);

  // A/B View Controls
  const [abViewMode, setAbViewMode] = useState<"single" | "side-by-side">(
    "single",
  );
  const [deviceFrame, setDeviceFrame] = useState<
    "desktop" | "tablet" | "mobile"
  >("desktop");
  const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);

  // Api Key Modal
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [customApiKey, setCustomApiKey] = useState(() => {
    return localStorage.getItem("personal_gemini_api_key") || "";
  });
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [useSandboxKey, setUseSandboxKey] = useState(() => {
    return !localStorage.getItem("personal_gemini_api_key");
  });

  // Brainstorm result states
  const [isBrainstorming, setIsBrainstorming] = useState(false);
  const [options, setOptions] = useState<StitchOption[]>([]);
  
  const [selectedOptionId, setSelectedOptionId] = useState<string>("");
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  const [envDiagnostics, setEnvDiagnostics] = useState<Array<{
    resource: string;
    url: string;
    status: number | string;
    timeMs: number;
    success: boolean;
    details: string;
  }>>([]);

  const runEnvironmentDiagnostics = async () => {
    setIsRunningDiagnostics(true);
    const tests = [
      { resource: "Local Vendor API Status", url: "/api/vendor/status" },
      { resource: "Local Babel Standalone JS", url: "/api/vendor/babel.min.js" },
      { resource: "Local Lucide React UMD JS", url: "/api/vendor/lucide-react.min.js" },
      { resource: "React 18 Production CDN", url: "https://cdn.jsdelivr.net/npm/react@18/umd/react.production.min.js" },
      { resource: "ReactDOM 18 Production CDN", url: "https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.production.min.js" },
      { resource: "Tailwind CSS CDN", url: "https://cdn.tailwindcss.com" }
    ];

    const results = [];
    for (const test of tests) {
      const startTime = performance.now();
      try {
        let res: Response | null = null;
        try {
          res = await fetch(test.url, { method: 'HEAD' });
        } catch {
          try {
            res = await fetch(test.url, { method: 'GET' });
          } catch {
            res = null;
          }
        }
        const duration = Math.round(performance.now() - startTime);
        if (res) {
          results.push({
            resource: test.resource,
            url: test.url,
            status: res.status,
            timeMs: duration,
            success: res.ok,
            details: res.ok ? `HTTP ${res.status} OK (${duration}ms)` : `HTTP ${res.status}`
          });
        } else {
          results.push({
            resource: test.resource,
            url: test.url,
            status: 'NETWORK_ERROR',
            timeMs: duration,
            success: false,
            details: 'Could not connect or fetch resource'
          });
        }
      } catch (err: any) {
        results.push({
          resource: test.resource,
          url: test.url,
          status: 'NETWORK_ERROR',
          timeMs: Math.round(performance.now() - startTime),
          success: false,
          details: err?.message || 'Network request failed'
        });
      }
    }

    setEnvDiagnostics(results);
    setIsRunningDiagnostics(false);
  };

  const getIframeDOMDiagnostics = () => {
    const el = iframeRef.current;
    if (!el) {
      return {
        exists: false,
        attached: false,
        width: 0,
        height: 0,
        visible: false,
        sandbox: 'none',
        srcDocKB: '0 KB'
      };
    }
    const width = el.offsetWidth || 0;
    const height = el.offsetHeight || 0;
    const style = window.getComputedStyle(el);
    const visible = width > 0 && height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
    const srcDoc = el.getAttribute('srcDoc') || '';
    return {
      exists: true,
      attached: document.body.contains(el),
      width,
      height,
      visible,
      sandbox: el.getAttribute('sandbox') || 'none',
      srcDocKB: `${Math.round(srcDoc.length / 1024)} KB`
    };
  };

  const [previewState, setPreviewState] = useState<PreviewState>({
    status: 'STARTING',
    progress: 0,
    currentStage: 'Starting preview',
    logs: [],
    lastError: null,
    startTime: Date.now(),
    elapsedSeconds: 0,
    iframeKey: 1,
    isMinimalTest: false,
    sessionId: `session-${Date.now()}`
  });

  // Reset preview state when selectedOptionId changes to show 0-100% progress indicator for new option
  useEffect(() => {
    if (selectedOptionId) {
      setPreviewState({
        status: 'STARTING',
        progress: 0,
        currentStage: 'Starting preview',
        logs: [
          {
            stage: 'OPTION_SELECTED',
            progress: 0,
            details: `Initialized sandbox preview for option ${selectedOptionId}`,
            time: new Date().toLocaleTimeString()
          }
        ],
        lastError: null,
        startTime: Date.now(),
        elapsedSeconds: 0,
        iframeKey: Date.now(),
        isMinimalTest: false,
        sessionId: `session-${Date.now()}`
      });
    }
  }, [selectedOptionId]);

  // Handle stage progress messaging from preview iframe
  useEffect(() => {
    const handleWindowMessage = (event: MessageEvent) => {
      if (event.data?.type === 'RETRY_PREVIEW') {
        handleRetryPreview();
        return;
      }
      if (!event.data || event.data.type !== 'DESIGN_STUDIO_PREVIEW_STAGE') return;
      const { stage, progress, details, isError, error } = event.data;

      setPreviewState((prev) => {
        const newLogs = [
          ...prev.logs,
          {
            stage: stage || 'STAGE_UPDATE',
            progress: progress || 0,
            details: details || '',
            time: new Date().toLocaleTimeString(),
            isError: !!isError
          }
        ];

        const nextProgress = isError ? prev.progress : Math.max(prev.progress, progress || 0);
        const isReady = stage === 'PREVIEW_READY' || nextProgress === 100;
        const isFailed = isError || stage === 'PREVIEW_FAILED';

        return {
          ...prev,
          progress: isReady ? 100 : nextProgress,
          currentStage: stage || prev.currentStage,
          status: isFailed ? 'FAILED' : isReady ? 'READY' : 'LOADING',
          lastError: isFailed ? (error || details || 'Runtime initialization exception') : prev.lastError,
          logs: newLogs
        };
      });
    };

    window.addEventListener('message', handleWindowMessage);
    return () => window.removeEventListener('message', handleWindowMessage);
  }, []);

  // Stage timeout timer
  useEffect(() => {
    if (previewState.status === 'READY' || previewState.status === 'FAILED') return;

    const timer = setInterval(() => {
      setPreviewState((prev) => {
        if ((prev.status as string) === 'READY' || (prev.status as string) === 'FAILED') return prev;
        const elapsed = Math.floor((Date.now() - (prev.startTime || Date.now())) / 1000);

        if (elapsed >= 30 && (prev.status as string) !== 'READY') {
          return {
            ...prev,
            elapsedSeconds: elapsed,
            status: 'FAILED',
            lastError: `Initialization Timeout: Stage "${prev.currentStage}" exceeded 30s limit. Check network connectivity or code syntax.`,
            logs: [
              ...prev.logs,
              {
                stage: 'TIMEOUT_EXCEEDED',
                progress: prev.progress,
                details: 'Initialization exceeded 30s timeout limit.',
                time: new Date().toLocaleTimeString(),
                isError: true
              }
            ]
          };
        }

        return { ...prev, elapsedSeconds: elapsed };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [previewState.status]);

  const handleRetryPreview = () => {
    const newSession = `session-${Date.now()}`;
    setPreviewState({
      status: 'STARTING',
      progress: 0,
      currentStage: 'Starting preview',
      logs: [
        {
          stage: 'RETRY_INITIATED',
          progress: 0,
          details: 'Tearing down old iframe and re-initializing sandbox engine',
          time: new Date().toLocaleTimeString()
        }
      ],
      lastError: null,
      startTime: Date.now(),
      elapsedSeconds: 0,
      iframeKey: Date.now(),
      isMinimalTest: previewState.isMinimalTest,
      sessionId: newSession
    });
  };

  const handleToggleMinimalTest = () => {
    const nextIsMinimal = !previewState.isMinimalTest;
    const newSession = `session-${Date.now()}`;
    setPreviewState({
      status: 'STARTING',
      progress: 0,
      currentStage: nextIsMinimal ? 'Loading Minimal Runtime Test' : 'Loading Template Preview',
      logs: [
        {
          stage: nextIsMinimal ? 'MINIMAL_TEST_START' : 'TEMPLATE_PREVIEW_START',
          progress: 0,
          details: nextIsMinimal ? 'Running Minimal Runtime Test' : 'Restoring Template Preview',
          time: new Date().toLocaleTimeString()
        }
      ],
      lastError: null,
      startTime: Date.now(),
      elapsedSeconds: 0,
      iframeKey: Date.now(),
      isMinimalTest: nextIsMinimal,
      sessionId: newSession
    });
  };

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // A/B Split Testing & Feedback States
  const [optionRatings, setOptionRatings] = useState<Record<string, number>>(
    {},
  );
  const [optionVerdicts, setOptionVerdicts] = useState<
    Record<string, "yes" | "no" | null>
  >({});

  // Iteration chat feedback state
  const [feedbackText, setFeedbackText] = useState("");
  const [isIterating, setIsIterating] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "preview" | "stack" | "db" | "endpoints" | "code"
  >("preview");

  // Restore active draft state from localStorage on initial mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem("stitch_design_draft");
      let restored = false;
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed.currentStep) setCurrentStep(parsed.currentStep);
        if (parsed.appIdea && typeof parsed.appIdea === "string") setAppIdea(parsed.appIdea);
        if (parsed.selectedAgent) setSelectedAgent(parsed.selectedAgent);
        if (parsed.optionsCount) setOptionsCount(parsed.optionsCount);
        if (parsed.selectedModel) setSelectedModel(parsed.selectedModel);
        if (
          parsed.options &&
          Array.isArray(parsed.options) &&
          parsed.options.length > 0
        ) {
          // Hydrate options with real renderable code if empty or placeholder
          const normalizedOpts = parsed.options.map((opt: any) => {
            const norm = normalizeOption(opt);
            const appCode = norm.files?.["src/App.tsx"] || "";
            if (!appCode || appCode.includes("Template Content")) {
              const mockData = generateMockStitchResponse(
                norm.prompt || parsed.appIdea || "",
                parsed.selectedAgent || "scrum",
                parsed.optionsCount || 2,
              );
              const matched =
                mockData?.options?.find((o: any) => o.id === norm.id || o.name === norm.name) ||
                mockData?.options?.[0];
              if (matched?.files?.["src/App.tsx"]) {
                norm.files = { ...matched.files };
              }
            }
            return norm;
          });
          setOptions(normalizedOpts);
          restored = true;
        }
        if (parsed.selectedOptionId && typeof parsed.selectedOptionId === "string")
          setSelectedOptionId(parsed.selectedOptionId);
        if (parsed.optionRatings && typeof parsed.optionRatings === "object") setOptionRatings(parsed.optionRatings);
        if (parsed.optionVerdicts && typeof parsed.optionVerdicts === "object") setOptionVerdicts(parsed.optionVerdicts);
        if (parsed.selectedTemplateTitle && typeof parsed.selectedTemplateTitle === "string")
          setSelectedTemplateTitle(parsed.selectedTemplateTitle);
      }

      // If no valid draft was loaded, initialize with default template preview
      if (!restored) {
        const defaultTmpl = normalizeTemplate(DESIGN_TEMPLATES[0]);
        setAppIdea(defaultTmpl.prompt);
        setSelectedTemplateTitle(defaultTmpl.title);
        const mockData = generateMockStitchResponse(
          defaultTmpl.prompt,
          selectedAgent,
          optionsCount,
        );
        if (
          mockData &&
          Array.isArray(mockData.options) &&
          mockData.options.length > 0
        ) {
          const normalized = mockData.options.map(normalizeOption);
          setOptions(normalized);
          setSelectedOptionId(normalized[0].id);
        }
      }
    } catch (e) {
      console.error("Failed to load draft design state, resetting to defaults", e);
      try {
        localStorage.removeItem("stitch_design_draft");
      } catch (_) {}
      const defaultTmpl = normalizeTemplate(DESIGN_TEMPLATES[0]);
      setAppIdea(defaultTmpl.prompt);
      setSelectedTemplateTitle(defaultTmpl.title);
      const mockData = generateMockStitchResponse(
        defaultTmpl.prompt,
        "scrum",
        2,
      );
      if (mockData?.options?.length > 0) {
        const normalized = mockData.options.map(normalizeOption);
        setOptions(normalized);
        setSelectedOptionId(normalized[0].id);
      }
    }
  }, []);

  // Save active draft state to localStorage (with quota guard & lightweight file handling)
  useEffect(() => {
    if (appIdea || options.length > 0) {
      try {
        // Strip full source files from options for localStorage persistence to avoid 5MB quota errors
        // Files are automatically hydrated by normalizeOption & mockBlueprints on restore
        const lightweightOptions = options.map((opt) => ({
          ...opt,
          files: {
            "index.html": "<div id='root'></div>",
            "src/App.tsx": "",
            "src/index.css": "@import 'tailwindcss';",
          },
        }));

        const draft = {
          currentStep,
          appIdea,
          selectedAgent,
          optionsCount,
          selectedModel,
          options: lightweightOptions,
          selectedOptionId,
          optionRatings,
          optionVerdicts,
          selectedTemplateTitle,
        };

        localStorage.setItem("stitch_design_draft", JSON.stringify(draft));
      } catch (err) {
        console.warn("[Design Studio] Could not save draft to localStorage (quota exceeded or disabled):", err);
        try {
          localStorage.removeItem("stitch_design_draft");
        } catch (_) {}
      }
    }
  }, [
    currentStep,
    appIdea,
    selectedAgent,
    optionsCount,
    selectedModel,
    options,
    selectedOptionId,
    optionRatings,
    optionVerdicts,
    selectedTemplateTitle,
  ]);

  const handleResetDesign = () => {
    localStorage.removeItem("stitch_design_draft");
    setCurrentStep(1);
    const defaultTmpl = DESIGN_TEMPLATES[0];
    setAppIdea(defaultTmpl.prompt);
    setSelectedTemplateTitle(defaultTmpl.title);
    const mockData = generateMockStitchResponse(
      defaultTmpl.prompt,
      selectedAgent,
      optionsCount,
    );
    if (
      mockData &&
      Array.isArray(mockData.options) &&
      mockData.options.length > 0
    ) {
      const normalizedOpts = mockData.options.map(normalizeOption);
      setOptions(normalizedOpts);
      setSelectedOptionId(normalizedOpts[0].id);
    }
    setOptionRatings({});
    setOptionVerdicts({});
    setFeedbackText("");
    setErrorMsg(null);
  };

  const selectTemplateAndPreview = (tmpl: TemplateItem) => {
    setAppIdea(tmpl.prompt);
    setSelectedTemplateTitle(tmpl.title);
    setErrorMsg(null);

    try {
      const mockData = generateMockStitchResponse(
        tmpl.prompt,
        selectedAgent,
        optionsCount,
      );
      if (
        mockData &&
        Array.isArray(mockData.options) &&
        mockData.options.length > 0
      ) {
        const normalizedOpts = mockData.options.map(normalizeOption);
        setOptions(normalizedOpts);
        setSelectedOptionId(normalizedOpts[0].id);

        const newSession = `session-${Date.now()}`;
        setPreviewState({
          status: "STARTING",
          progress: 0,
          currentStage: "Starting preview",
          logs: [
            {
              stage: "TEMPLATE_SELECTED",
              progress: 0,
              details: `Selected template: ${tmpl.title}`,
              time: new Date().toLocaleTimeString(),
            },
          ],
          lastError: null,
          startTime: Date.now(),
          elapsedSeconds: 0,
          iframeKey: Date.now(),
          isMinimalTest: false,
          sessionId: newSession,
        });
      }
    } catch (err) {
      console.error("Template selection preview error:", err);
    }
  };

  // Launch transition state
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentLogs, setDeploymentLogs] = useState<string[]>([]);

  // Live building and compiler simulation states
  const [buildProgress, setBuildProgress] = useState(0);
  const [buildLogs, setBuildLogs] = useState<string[]>([]);
  const [activeCodeSnippet, setActiveCodeSnippet] = useState("");

  // Compiler animation simulation
  useEffect(() => {
    if (!isBrainstorming) {
      setBuildProgress(0);
      setBuildLogs([]);
      setActiveCodeSnippet("");
      return;
    }

    const logsList = [
      "Initializing Design Studio Engine...",
      "Analyzing requirements & layout constraints...",
      `Invoking Gemini reasoning model (${selectedModel})...`,
      "Architecting side-by-side design variants...",
      "Drafting component hierarchy and file nodes...",
      "Constructing responsive React view states (src/App.tsx)...",
      "Applying Tailwind CSS styling & layout rules...",
      "Compiling Babel transformation presets...",
      "Assembling live interactive sandbox previews...",
    ];

    const codeLines = [
      "import React, { useState } from 'react';",
      "import { Sparkles, Activity, Shield } from 'lucide-react';",
      "",
      "export default function DesignSandbox() {",
      "  const [activeTab, setActiveTab] = useState('overview');",
      "  const [items, setItems] = useState([]);",
      "",
      "  return (",
      "    <div className='min-h-screen bg-[#09090b] text-zinc-100 p-6'>",
      "      <header className='flex justify-between items-center pb-4 border-b border-zinc-800'>",
      "        <h1 className='text-lg font-bold tracking-tight'>Interactive App Sandbox</h1>",
      "        <span className='px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-mono rounded-full'>Active</span>",
      "      </header>",
      "      <main className='py-6'>",
      "        <p className='text-xs text-zinc-400'>Reactive sandbox component compiled successfully.</p>",
      "      </main>",
      "    </div>",
      "  );",
      "}",
    ];

    let logIdx = 0;
    let codeLineIdx = 0;
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsedMs = Date.now() - startTime;
      let calcProgress = 0;
      if (elapsedMs < 1200) {
        calcProgress = Math.floor((elapsedMs / 1200) * 22);
      } else if (elapsedMs < 3800) {
        calcProgress = 22 + Math.floor(((elapsedMs - 1200) / 2600) * 28);
      } else if (elapsedMs < 7500) {
        calcProgress = 50 + Math.floor(((elapsedMs - 3800) / 3700) * 25);
      } else if (elapsedMs < 13000) {
        calcProgress = 75 + Math.floor(((elapsedMs - 7500) / 5500) * 15);
      } else {
        const extraSecs = Math.floor((elapsedMs - 13000) / 2000);
        calcProgress = Math.min(99, 90 + extraSecs);
      }

      setBuildProgress(Math.min(99, Math.max(1, calcProgress)));

      if (elapsedMs > logIdx * 1200 && logIdx < logsList.length) {
        if (logsList[logIdx]) {
          setBuildLogs((prev) => [...prev, logsList[logIdx]]);
        }
        logIdx++;
      }

      if (codeLineIdx < codeLines.length) {
        setActiveCodeSnippet(
          (prev) => prev + (prev ? "\n" : "") + codeLines[codeLineIdx],
        );
        codeLineIdx++;
      }
    }, 150);

    return () => clearInterval(interval);
  }, [isBrainstorming, selectedModel]);

  // Load preferences from Firestore on mount
  useEffect(() => {
    const loadProfileApiKey = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            const data = userSnap.data();
            if (data.geminiApiKey) {
              setCustomApiKey(data.geminiApiKey);
              localStorage.setItem(
                "personal_gemini_api_key",
                data.geminiApiKey,
              );
              setUseSandboxKey(false);
            }
          }
        } catch (e) {
          console.warn("Could not load user's Gemini API key:", e);
        }
      }
    };
    loadProfileApiKey();
  }, []);

  const handleSaveApiKey = async (key: string) => {
    setIsSavingKey(true);
    try {
      const cleanKey = key.trim();
      localStorage.setItem("personal_gemini_api_key", cleanKey);
      setCustomApiKey(cleanKey);

      const currentUser = auth.currentUser;
      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid);
        await setDocWithSanitize(
          userDocRef,
          { geminiApiKey: cleanKey },
          { merge: true },
        );
      }

      setUseSandboxKey(!cleanKey);
      setIsApiKeyModalOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleBrainstorm = async () => {
    let effectiveIdea = appIdea.trim();
    if (!effectiveIdea) {
      const fallbackPrompt = (selectedOption as any)?.prompt || selectedTemplateTitle || "Modern interactive web application layout system";
      setAppIdea(fallbackPrompt);
      effectiveIdea = fallbackPrompt;
    }

    if (!effectiveIdea) {
      setErrorMsg(
        "Please describe your application or select a starter template.",
      );
      return;
    }

    setIsBrainstorming(true);
    setErrorMsg(null);
    setOptions([]);

    const headers: any = {
      "Content-Type": "application/json",
    };

    if (!useSandboxKey && customApiKey) {
      headers["x-gemini-api-key"] = customApiKey;
    }

    try {
      const res = await fetch("/api/gemini/stitch-brainstorm", {
        method: "POST",
        headers,
        body: JSON.stringify({
          prompt: effectiveIdea,
          personality: selectedAgent,
          optionsCount,
          model: selectedModel,
        }),
      });

      if (!res.ok) {
        const errPayload = await res.json().catch(() => ({}));
        throw new Error(
          errPayload.error || `Server responded with status ${res.status}`,
        );
      }

      const data = await res.json();
      if (data && Array.isArray(data.options) && data.options.length > 0) {
        setBuildProgress(100);
        await new Promise((resolve) => setTimeout(resolve, 300));
        const normalizedOpts = data.options.map(normalizeOption);
        setOptions(normalizedOpts);
        setSelectedOptionId(normalizedOpts[0].id);
        setCurrentStep(2);
      } else {
        throw new Error("Design engine did not return any blueprint options.");
      }
    } catch (e: any) {
      console.warn(
        "Stitch API request notice, applying fallback blueprint engine:",
        e,
      );
      try {
        const mockData = generateMockStitchResponse(
          effectiveIdea,
          selectedAgent,
          optionsCount,
        );
        if (
          mockData &&
          Array.isArray(mockData.options) &&
          mockData.options.length > 0
        ) {
          setBuildProgress(100);
          await new Promise((resolve) => setTimeout(resolve, 300));
          const normalizedOpts = mockData.options.map(normalizeOption);
          setOptions(normalizedOpts);
          setSelectedOptionId(normalizedOpts[0].id);
          setCurrentStep(2);
        } else {
          setErrorMsg(
            e.message || "An error occurred during layout generation.",
          );
        }
      } catch (mockErr) {
        setErrorMsg(e.message || "An error occurred during layout generation.");
      }
    } finally {
      setIsBrainstorming(false);
    }
  };

  const handleIterateFeedback = async () => {
    if (!feedbackText.trim() || !selectedOptionId) return;

    setIsIterating(true);
    setErrorMsg(null);

    const headers: any = {
      "Content-Type": "application/json",
    };

    if (!useSandboxKey && customApiKey) {
      headers["x-gemini-api-key"] = customApiKey;
    }

    try {
      const res = await fetch("/api/gemini/stitch-brainstorm", {
        method: "POST",
        headers,
        body: JSON.stringify({
          prompt: appIdea,
          personality: selectedAgent,
          optionsCount,
          feedback: feedbackText,
          previousOptions: options,
          selectedOptionId,
          model: selectedModel,
        }),
      });

      if (!res.ok) {
        const errPayload = await res.json().catch(() => ({}));
        throw new Error(
          errPayload.error || `Server responded with status ${res.status}`,
        );
      }

      const data = await res.json();
      if (data && Array.isArray(data.options) && data.options.length > 0) {
        const normalizedOpts = data.options.map(normalizeOption);
        setOptions(normalizedOpts);
        setFeedbackText("");
      } else {
        throw new Error("Failed to update design based on your feedback.");
      }
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || "An error occurred during design revision.");
    } finally {
      setIsIterating(false);
    }
  };

  // Modal & Notification states for explicit Project Creation vs Saving Design
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [projectNameInput, setProjectNameInput] = useState("");
  const [projectDescInput, setProjectDescInput] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  
  const getPreviewSourceDoc = (option: any, sessionId?: string) => {
    if (!option) {
      return `<!DOCTYPE html><html><body style="background:#09090b;color:#a1a1aa;padding:24px;font-family:sans-serif;text-align:center;">
        <div style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:24px;max-width:400px;margin:40px auto;">
          <h3 style="color:#e4e4e7;margin:0 0 8px 0;font-size:16px;">No Design Layout Selected</h3>
          <p style="color:#a1a1aa;font-size:12px;margin:0;">Select a design template option to render the interactive sandbox preview.</p>
        </div>
      </body></html>`;
    }

    const appCode =
      option.files?.["src/App.tsx"] ||
      option.files?.["App.tsx"] ||
      option.files?.["App.jsx"] ||
      "";
    const cssCode =
      option.files?.["src/index.css"] ||
      option.files?.["index.css"] ||
      option.files?.["styles.css"] ||
      "";

    if (!appCode.trim()) {
      return `<!DOCTYPE html><html><body style="background:#09090b;color:#f87171;padding:24px;font-family:sans-serif;text-align:center;">
        <div style="background:#18181b;border:1px solid #dc2626;border-radius:12px;padding:24px;max-width:480px;margin:40px auto;">
          <h3 style="color:#ef4444;margin:0 0 8px 0;font-size:16px;">Empty Application Source</h3>
          <p style="color:#fca5a5;font-size:12px;margin:0;">The selected option "${option.name || option.id}" has no App.tsx file content.</p>
        </div>
      </body></html>`;
    }

    let processedCode = appCode
      .replace(/import\s+type\s+[\s\S]*?from\s*['"][^'"]+['"];?/g, "")
      .replace(
        /import\s+\*?\s*as?\s*React\s*,\s*\{([\s\S]*?)\}\s*from\s*['"]react['"];?/g,
        (m, p1) => {
          const cleanProps = p1
            .replace(/[\{\}]/g, "")
            .replace(/\s+/g, " ")
            .trim()
            .replace(/\b([A-Za-z0-9_$]+)\s+as\s+([A-Za-z0-9_$]+)\b/g, "$1: $2");
          return `const { ${cleanProps} } = window.React;`;
        },
      )
      .replace(/import\s+\{([\s\S]*?)\}\s*from\s*['"]react['"];?/g, (m, p1) => {
        const cleanProps = p1
          .replace(/[\{\}]/g, "")
          .replace(/\s+/g, " ")
          .trim()
          .replace(/\b([A-Za-z0-9_$]+)\s+as\s+([A-Za-z0-9_$]+)\b/g, "$1: $2");
        return `const { ${cleanProps} } = window.React;`;
      })
      .replace(
        /import\s+React\s*,\s*\{([\s\S]*?)\}\s*from\s*['"]react['"];?/g,
        (m, p1) => {
          const cleanProps = p1
            .replace(/[\{\}]/g, "")
            .replace(/\s+/g, " ")
            .trim()
            .replace(/\b([A-Za-z0-9_$]+)\s+as\s+([A-Za-z0-9_$]+)\b/g, "$1: $2");
          return `const { ${cleanProps} } = window.React;`;
        },
      )
      .replace(/import\s+React\s+from\s*['"]react['"];?/g, "")
      .replace(/import\s+\*\s+as\s+React\s+from\s*['"]react['"];?/g, "")
      .replace(
        /import\s+\{([\s\S]*?)\}\s*from\s*['"]lucide-react['"];?/g,
        (m, p1) => {
          const cleanProps = p1
            .replace(/[\{\}]/g, "")
            .replace(/\s+/g, " ")
            .trim()
            .replace(/\b([A-Za-z0-9_$]+)\s+as\s+([A-Za-z0-9_$]+)\b/g, "$1: $2");
          return `const _iconsSource = window.LucideReact || window.lucideReact || window.lucide || {};\nconst { ${cleanProps} } = _iconsSource;`;
        },
      )
      .replace(
        /import\s+\{([\s\S]*?)\}\s*from\s*['"]recharts['"];?/g,
        (m, p1) => {
          const cleanProps = p1
            .replace(/[\{\}]/g, "")
            .replace(/\s+/g, " ")
            .trim()
            .replace(/\b([A-Za-z0-9_$]+)\s+as\s+([A-Za-z0-9_$]+)\b/g, "$1: $2");
          return `const { ${cleanProps} } = window.Recharts || {};`;
        },
      )
      .replace(
        /import\s+\{([\s\S]*?)\}\s*from\s*['"](?:framer-motion|motion\/react)['"];?/g,
        (m, p1) => {
          const cleanProps = p1
            .replace(/[\{\}]/g, "")
            .replace(/\s+/g, " ")
            .trim()
            .replace(/\b([A-Za-z0-9_$]+)\s+as\s+([A-Za-z0-9_$]+)\b/g, "$1: $2");
          return `const { ${cleanProps} } = window.motion || {};`;
        },
      )
      .replace(
        /import\s+\*\s+as\s+d3\s+from\s*['"]d3['"];?/g,
        "const d3 = window.d3;",
      )
      .replace(/import\s+\{([\s\S]*?)\}\s*from\s*['"]d3['"];?/g, (m, p1) => {
        const cleanProps = p1
          .replace(/[\{\}]/g, "")
          .replace(/\s+/g, " ")
          .trim()
          .replace(/\b([A-Za-z0-9_$]+)\s+as\s+([A-Za-z0-9_$]+)\b/g, "$1: $2");
        return `const { ${cleanProps} } = window.d3 || {};`;
      })
      .replace(/import[\s\S]*?from\s*['"][^'"]+['"];?/g, "")
      .replace(/import\s+['"][^'"]+['"];?/g, "")
      .replace(
        /export\s+default\s+function(?:\s+([A-Za-z0-9_]+))?\s*\(/g,
        "function App(",
      )
      .replace(
        /export\s+default\s+class(?:\s+([A-Za-z0-9_]+))?\b/g,
        "class App",
      )
      .replace(
        /export\s+default\s+(?:const|let|var)\s+([A-Za-z0-9_]+)\b/g,
        "const App =",
      )
      .replace(
        /export\s+default\s+\(?\s*([A-Za-z0-9_\s,]*)\)?\s*=>/g,
        "const App = ($1) =>",
      )
      .replace(/export\s+default\s+([A-Za-z0-9_]+)\s*;?/g, (m, id) =>
        id === "App" ? "" : `const App = ${id};`,
      )
      .replace(/export\s+(const|let|var|function|class)\b/g, "$1")
      .replace(/export\s*\{\s*[^}]*\}\s*;?/g, "");

    processedCode = `const React = window.React;\nconst ReactDOM = window.ReactDOM;\n` + processedCode + `\ntry { if (typeof App !== 'undefined') { window.App = App; if (typeof module !== 'undefined' && module.exports) module.exports.default = App; } } catch(e){}`;

    const encodedAppCode = encodeURIComponent(processedCode).replace(
      /'/g,
      "%27",
    );

    const optionNameEscaped = (option.name || option.id || "Design Option").replace(/"/g, '&quot;');
    const currentSession = sessionId || 'session-default';
    const originBase = typeof window !== 'undefined' && window.location ? window.location.origin : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <base href="${originBase}/">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Design Sandbox Preview - ${optionNameEscaped}</title>
  <script>
    window.sandboxMetrics = { startTime: Date.now(), deps: {} };

    function postStage(stage, progress, details, isError, errorObj) {
      try {
        console.log("[Preview Sandbox Event]", stage, progress + '%', details);
        if (window.parent) {
          window.parent.postMessage({
            type: 'DESIGN_STUDIO_PREVIEW_STAGE',
            sessionId: '${currentSession}',
            stage: stage,
            progress: progress,
            details: details || '',
            isError: !!isError,
            error: errorObj ? (errorObj.stack || errorObj.message || String(errorObj)) : null,
            timestamp: Date.now()
          }, '*');
        }
      } catch (e) {
        console.error("postStage failed", e);
      }
    }
    window.postStage = postStage;

    function reportSandboxError(stage, err, depDetails) {
      console.error("[Sandbox Failure]", stage, err, depDetails);
      var errStr = err ? (err.stack || err.message || String(err)) : 'Runtime error';
      if (depDetails) errStr = "DEPENDENCY TIMEOUT\\nName: " + depDetails.name + "\\nSource: " + depDetails.source + "\\nElapsed: " + depDetails.elapsed + "ms\\nStage: " + depDetails.stage + "\\nError: " + errStr;
      postStage('PREVIEW_FAILED', 70, stage + ': ' + errStr, true, err);
      var rootDiv = document.getElementById('root');
      if (rootDiv) {
        rootDiv.innerHTML = '<div style="padding:20px;background:#18181b;color:#f87171;border:1px solid #dc2626;border-radius:12px;margin:16px;font-family:sans-serif;">' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">' +
          '<span style="background:#dc2626;color:#ffffff;font-size:10px;font-weight:bold;padding:2px 6px;border-radius:4px;text-transform:uppercase;">' + String(stage || 'Runtime Error') + '</span>' +
          '<h4 style="margin:0;color:#ef4444;font-size:14px;font-weight:700;">Design Sandbox Error</h4></div>' +
          '<pre style="margin:8px 0;font-size:11px;color:#fca5a5;font-family:monospace;white-space:pre-wrap;word-break:break-all;background:#09090b;padding:10px;border-radius:6px;border:1px solid #27272a;">' + String(errStr) + '</pre>' +
          '<p style="margin:0;font-size:11px;color:#a1a1aa;">Inspect Design Studio code editor to fix syntax or missing variables.</p>' +
          '<div style="margin-top:12px;"><button onclick="window.parent.postMessage({type:\\'RETRY_PREVIEW\\'}, \\'*\\')" style="background:#27272a;color:#e4e4e7;border:1px solid #3f3f46;padding:6px 12px;border-radius:6px;font-size:11px;font-weight:bold;cursor:pointer;">Retry Sandbox Engine</button></div></div>';
      }
    }
    window.reportSandboxError = reportSandboxError;

    window.onerror = function(msg, url, lineNo, columnNo, error) {
      reportSandboxError("Window Script Error", error || msg);
      return false;
    };

    window.addEventListener('unhandledrejection', function(event) {
      reportSandboxError("Unhandled Promise Rejection", event.reason || "Async promise failed");
    });

    postStage('PREVIEW_START', 0, 'Starting sandbox preview initialization');
    postStage('IFRAME_ELEMENT_CREATED', 5, 'Sandbox iframe element verified');
    postStage('IFRAME_CREATED', 10, 'Preview iframe initialized');
    postStage('IFRAME_DOCUMENT_READY', 15, 'Iframe HTML document parsing started');
  </script>

  <style>
    ${cssCode}
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    body {
      margin: 0;
      background-color: #09090b;
      color: #fafafa;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    ::-webkit-scrollbar-track {
      background: #09090b;
    }
    ::-webkit-scrollbar-thumb {
      background: #27272a;
      border-radius: 3px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #3f3f46;
    }
  </style>
</head>
<body class="bg-[#09090b] text-zinc-50 min-h-screen">
  <div id="root" class="min-h-screen"></div>
  <script type="text/javascript">
    const getIconProxy = (targetObj) => {
      const svgMap = {
        Plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
        Trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
        Trash2: '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>',
        Check: '<polyline points="20 6 9 17 4 12"/>',
        CheckCircle2: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
        Circle: '<circle cx="12" cy="12" r="10"/>',
        X: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
        Search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
        Home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
        Settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
        User: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
        ChevronRight: '<polyline points="9 18 15 12 9 6"/>',
        ChevronLeft: '<polyline points="15 18 9 12 15 6"/>',
        ChevronDown: '<polyline points="6 9 12 15 18 9"/>',
        Sparkles: '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>',
        Star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
        Heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
        Filter: '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>'
      };

      return new Proxy(targetObj || {}, {
        has: () => true,
        get: (target, prop) => {
          if (typeof prop === "string" && prop in target && typeof target[prop] === "function") {
            return target[prop];
          }
          if (typeof prop === "string" && prop) {
            const propLower = prop.toLowerCase();
            const key = Object.keys(target || {}).find(k => typeof k === "string" && k.toLowerCase() === propLower);
            if (key && typeof target[key] === "function") return target[key];
          }
          return (props) => {
            const size = props?.size || props?.height || 16;
            const className = props?.className || "";
            const color = props?.color || "currentColor";
            const propName = String(prop);
            const pathContent = svgMap[propName] || '<circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>';

            return window.React ? window.React.createElement("svg", {
              xmlns: "http://www.w3.org/2000/svg",
              width: size,
              height: size,
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: color,
              strokeWidth: "2",
              strokeLinecap: "round",
              strokeLinejoin: "round",
              className: className,
              style: props?.style,
              onClick: props?.onClick,
              dangerouslySetInnerHTML: { __html: pathContent }
            }) : null;
          };
        }
      });
    };

    function loadScript(src) {
      return new Promise(function(resolve, reject) {
        var s = document.createElement('script');
        s.src = src;
        s.async = false;
        s.onload = function() { resolve(src); };
        s.onerror = function() { reject(new Error("Failed to load script: " + src)); };
        document.head.appendChild(s);
      });
    }

    function loadScriptWithFallbacks(name, urls) {
      return new Promise(function(resolve, reject) {
        var index = 0;
        function tryNext() {
          if (index >= urls.length) {
            reject(new Error("All fallback sources failed for " + name));
            return;
          }
          var url = urls[index++];
          loadScript(url).then(resolve).catch(function(err) {
            console.warn("Script source failed for " + name + ": " + url + ", trying fallback...");
            tryNext();
          });
        }
        tryNext();
      });
    }

    function startSandboxEngine() {
      postStage('DEPENDENCY_INIT_STARTED', 41, 'dependency initialization started');

      try {
        window.LucideReact = getIconProxy(window.LucideReact || window.lucideReact || window.lucide);
        window.lucide = window.LucideReact;
        postStage('ICON_RUNTIME_READY', 43, 'icon runtime initialized');

        window.AnimatePresence = ({ children }) => window.React ? window.React.createElement(window.React.Fragment, null, children) : children;
        window.motion = new Proxy({
          AnimatePresence: window.AnimatePresence
        }, {
          get: (target, prop) => {
            if (prop === "motion") return window.motion;
            if (prop === "AnimatePresence") return window.AnimatePresence;
            if (prop in target) return target[prop];
            return window.React.forwardRef((props, ref) => {
              const { children, whileHover, whileTap, transition, animate, initial, exit, variants, layout, layoutId, ...rest } = props;
              const tag = (typeof prop === "string" && /^[a-z][a-z0-9]*$/.test(prop)) ? prop : "div";
              return window.React.createElement(tag, { ...rest, ref }, children);
            });
          }
        });
        postStage('MOTION_RUNTIME_READY', 45, 'motion runtime initialized');

        if (typeof window.d3 === "undefined") {
          window.d3 = new Proxy({}, {
            get: () => () => ({
              attr: function() { return this; },
              style: function() { return this; },
              text: function() { return this; },
              append: function() { return this; },
              data: function() { return this; },
              enter: function() { return this; }
            })
          });
        }

        if (typeof window.Recharts === "undefined") {
          window.Recharts = new Proxy({}, {
            get: (target, prop) => (props) => window.React.createElement("div", {
              style: {
                padding: "12px",
                border: "1px solid #27272a",
                borderRadius: "8px",
                color: "#a1a1aa",
                fontSize: "11px",
                background: "#18181b",
                textAlign: "center"
              }
            }, "[Chart Component: " + String(prop) + "]")
          });
        }
        postStage('CHART_RUNTIME_READY', 47, 'chart runtime initialized');

        postStage('TEMPLATE_VALIDATED', 49, 'template dependency validation');
        postStage('DEPENDENCIES_READY', 50, 'dependency initialization complete');
        postStage('TEMPLATE_LOADED', 60, 'template source code ready');

        var rawCode = decodeURIComponent("${encodedAppCode}");
        postStage('COMPILATION_STARTED', 65, 'Babel compiling TSX');

        var compiled = "";
        try {
          compiled = window.Babel.transform(rawCode, {
            presets: [
              ["env", { modules: "commonjs" }],
              ["react", { runtime: "classic" }],
              "typescript"
            ],
            filename: "App.tsx"
          }).code;
          postStage('COMPILATION_COMPLETE', 70, 'Babel transpilation completed');
        } catch (bErr) {
          console.warn("Babel transform first pass notice, applying fallback:", bErr);
          try {
            var sanitized = rawCode.replace(/(['"])([^'"\\n]*)$/gm, "$1$2$1");
            compiled = window.Babel.transform(sanitized, {
              presets: [
                ["env", { modules: "commonjs" }],
                ["react", { runtime: "classic" }],
                "typescript"
              ],
              filename: "App.tsx"
            }).code;
            postStage('COMPILATION_COMPLETE', 70, 'Babel fallback transpilation completed');
          } catch (fallbackErr) {
            reportSandboxError("Babel Transpilation Error", fallbackErr || bErr);
            return;
          }
        }

        postStage('SCRIPT_EXECUTED', 80, 'Transpiled component execution starting');
        var moduleObj = { exports: {} };
        var requireMock = function(mod) {
          if (mod === "react") return window.React;
          if (mod === "react-dom" || mod === "react-dom/client") return window.ReactDOM;
          if (mod === "lucide-react") return window.LucideReact || window.lucide;
          if (mod === "motion" || mod === "motion/react" || mod === "framer-motion") return window.motion;
          if (mod === "d3") return window.d3;
          if (mod === "recharts") return window.Recharts;
          return {};
        };

        var runner = new Function("require", "module", "exports", "React", "ReactDOM", compiled);
        runner(requireMock, moduleObj, moduleObj.exports, window.React, window.ReactDOM);

        var AppComponent = (typeof window.App === 'function' ? window.App : null) || 
                           moduleObj.exports.default || 
                           moduleObj.exports.App || 
                           (typeof moduleObj.exports === 'function' ? moduleObj.exports : null);

        if (!AppComponent || typeof AppComponent !== "function") {
          throw new Error("Transpiled App component is not a valid React component function.");
        }

        postStage('REACT_ROOT_CREATED', 90, 'Mounting React Root to DOM');
        var rootEl = document.getElementById("root");
        if (!rootEl) {
          throw new Error("Root container element #root missing from sandbox DOM.");
        }

        class ErrorBoundary extends window.React.Component {
          constructor(props) {
            super(props);
            this.state = { hasError: false, error: null };
          }
          static getDerivedStateFromError(error) {
            return { hasError: true, error: error };
          }
          componentDidCatch(error, errorInfo) {
            console.error("Design Studio Sandbox Mount Error:", error, errorInfo);
            if (window.reportSandboxError) {
              window.reportSandboxError("Component Lifecycle Exception", error);
            }
          }
          render() {
            if (this.state.hasError) {
              return window.React.createElement('div', {
                style: {
                  padding: '20px',
                  background: '#18181b',
                  color: '#f87171',
                  border: '1px solid #dc2626',
                  borderRadius: '12px',
                  margin: '16px',
                  fontFamily: 'sans-serif'
                }
              },
                window.React.createElement('h4', { style: { margin: 0, color: '#ef4444', fontSize: '14px', fontWeight: 'bold' } }, 'Design Studio Render Error'),
                window.React.createElement('pre', { style: { fontSize: '11px', color: '#fca5a5', whiteSpace: 'pre-wrap', wordBreak: 'break-all', background: '#09090b', padding: '10px', borderRadius: '6px', border: '1px solid #27272a' } }, String(this.state.error?.stack || this.state.error?.message || this.state.error))
              );
            }
            return this.props.children;
          }
        }

        if (window.ReactDOM.createRoot) {
          var root = window.ReactDOM.createRoot(rootEl);
          root.render(window.React.createElement(ErrorBoundary, null, window.React.createElement(AppComponent)));
        } else if (window.ReactDOM.render) {
          window.ReactDOM.render(window.React.createElement(ErrorBoundary, null, window.React.createElement(AppComponent)), rootEl);
        }

        postStage('REACT_MOUNT_STARTED', 95, 'React element tree dispatched');

        setTimeout(function() {
          postStage('PREVIEW_READY', 100, 'App component mounted and active');
        }, 80);

      } catch (engineErr) {
        reportSandboxError("Engine Execution Exception", engineErr);
      }
    }

    async function loadAllDependencies() {
      try {
        // 1. React
        if (typeof window.React === 'undefined') {
          await loadScriptWithFallbacks('React', [
            '/api/vendor/react.min.js',
            '/vendor/react.production.min.js',
            'https://cdn.jsdelivr.net/npm/react@18/umd/react.production.min.js',
            'https://unpkg.com/react@18/umd/react.production.min.js'
          ]);
        }
        window.react = window.React;
        if (typeof globalThis !== 'undefined') {
          globalThis.react = window.React;
          globalThis.React = window.React;
        }
        postStage('REACT_READY', 20, 'React 18 loaded');

        // 2. ReactDOM
        if (typeof window.ReactDOM === 'undefined') {
          await loadScriptWithFallbacks('ReactDOM', [
            '/api/vendor/react-dom.min.js',
            '/vendor/react-dom.production.min.js',
            'https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.production.min.js',
            'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js'
          ]);
        }
        window.ReactDOM = window.ReactDOM || window.ReactDom;
        window.ReactDom = window.ReactDOM;
        window.reactDom = window.ReactDOM;
        if (typeof globalThis !== 'undefined') {
          globalThis.ReactDOM = window.ReactDOM;
        }
        postStage('REACTDOM_READY', 25, 'ReactDOM 18 loaded');

        // 3. Lucide React
        try {
          if (typeof window.LucideReact === 'undefined' && typeof window.lucide === 'undefined') {
            await loadScriptWithFallbacks('LucideReact', [
              '/api/vendor/lucide-react.min.js',
              '/vendor/lucide-react.min.js',
              'https://cdn.jsdelivr.net/npm/lucide-react@0.400.0/dist/umd/lucide-react.js'
            ]);
          }
          postStage('LUCIDE_READY', 30, 'Lucide React loaded');
        } catch (lucideErr) {
          console.warn("Lucide library load fallback active:", lucideErr);
          postStage('LUCIDE_READY', 30, 'Lucide SVG proxy active');
        }

        // 4. Babel Standalone
        if (typeof window.Babel === 'undefined') {
          await loadScriptWithFallbacks('Babel', [
            '/api/vendor/babel.min.js',
            '/vendor/babel.min.js',
            'https://cdn.jsdelivr.net/npm/@babel/standalone@7.24.0/babel.min.js',
            'https://unpkg.com/@babel/standalone@7.24.0/babel.min.js'
          ]);
        }
        postStage('BABEL_READY', 35, 'Babel Standalone loaded');

        // 5. Tailwind CSS
        try {
          var tw = document.createElement('script');
          tw.src = 'https://cdn.tailwindcss.com';
          tw.async = true;
          document.head.appendChild(tw);
        } catch (_) {}
        postStage('TAILWIND_READY', 40, 'Tailwind CSS ready');

        // 6. Start Sandbox Engine
        startSandboxEngine();
      } catch (depErr) {
        reportSandboxError("Dependency Initialization Failed", depErr);
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', loadAllDependencies);
    } else {
      loadAllDependencies();
    }
  </script>
</body>
</html>`;
  };

  const renderInteractiveSandboxContainer = (targetOption: any, customHeightClass: string = "h-[480px]") => {
    const activeOption = previewState.isMinimalTest ? MINIMAL_TEST_OPTION : targetOption;

    return (
      <div className="space-y-2">
        <div className={`w-full ${customHeightClass} rounded-2xl overflow-hidden border border-zinc-800 bg-[#09090b] relative shadow-2xl`}>
          <iframe
            ref={iframeRef}
            key={`preview-${previewState.iframeKey}-${activeOption?.id || "none"}-${previewState.sessionId}`}
            title="Design Studio Sandbox Preview"
            srcDoc={getPreviewSourceDoc(activeOption, previewState.sessionId)}
            onLoad={() => {
              setPreviewState(prev => {
                if (prev.status === 'STARTING') {
                  return {
                    ...prev,
                    progress: Math.max(prev.progress, 15),
                    currentStage: 'Iframe DOM ready, mounting sandbox...'
                  };
                }
                return prev;
              });
            }}
            className="w-full h-full border-none bg-[#09090b]"
            sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
          />

          {/* Real 0-100% Progress Indicator Overlay */}
          {previewState.status !== 'READY' && previewState.status !== 'FAILED' && (
            <div className="absolute inset-0 bg-[#09090b]/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400">
                <RefreshCw size={22} className="animate-spin" />
              </div>

              <div className="space-y-1.5 max-w-sm w-full">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-300 font-bold">{previewState.currentStage}</span>
                  <span className="text-yellow-400 font-bold">{previewState.progress}%</span>
                </div>

                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700/50">
                  <div 
                    className="h-full bg-gradient-to-r from-yellow-500 to-amber-400 transition-all duration-300 ease-out"
                    style={{ width: `${previewState.progress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono pt-1">
                  <span>Elapsed: {previewState.elapsedSeconds}s</span>
                  <span>Option: {activeOption?.name || activeOption?.id}</span>
                </div>
              </div>

              <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
                Compiling TSX components & initializing live React 18 sandbox environment...
              </p>
            </div>
          )}

          {/* Failed State Overlay */}
          {previewState.status === 'FAILED' && (
            <div className="absolute inset-0 bg-[#09090b]/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                <AlertTriangle size={24} />
              </div>

              <div className="space-y-1 max-w-md">
                <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider">
                  DESIGN PREVIEW FAILED
                </h3>
                <p className="text-xs font-mono text-zinc-300">
                  Stage: <strong className="text-amber-400">{previewState.currentStage}</strong> ({previewState.progress}%)
                </p>
                <p className="text-[11px] font-mono text-zinc-500">
                  Elapsed Time: {previewState.elapsedSeconds}s
                </p>
                <pre className="text-[11px] font-mono text-red-300 bg-red-950/40 border border-red-900/50 p-3 rounded-xl text-left overflow-auto max-h-32 whitespace-pre-wrap select-all mt-2">
                  {previewState.lastError || "Runtime sandbox exception"}
                </pre>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleRetryPreview}
                  className="px-3.5 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-yellow-500/20"
                >
                  <RefreshCw size={13} /> Retry Preview
                </button>

                <button
                  type="button"
                  onClick={handleToggleMinimalTest}
                  className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-xl border border-zinc-700 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles size={13} className="text-yellow-400" /> Run Minimal Test
                </button>

                <button
                  type="button"
                  onClick={() => setShowDiagnostics(prev => !prev)}
                  className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium rounded-xl border border-zinc-800 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Info size={13} /> View Diagnostics
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Diagnostics & Health Accordion Panel */}
        <div className="bg-[#0c0c0f] border border-zinc-800/80 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowDiagnostics(prev => !prev)}
            className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-mono text-zinc-300 bg-zinc-900/50 hover:bg-zinc-900 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Activity size={14} className={previewState.status === 'READY' ? "text-emerald-400" : previewState.status === 'FAILED' ? "text-red-400" : "text-yellow-400"} />
              <span className="font-bold">Preview Health & Diagnostic Panel</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                previewState.status === 'READY' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                previewState.status === 'FAILED' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
              }`}>
                {previewState.status} ({previewState.progress}%)
              </span>
            </div>

            <div className="flex items-center gap-2 text-zinc-400 text-[11px]">
              <span>Stage: {previewState.currentStage}</span>
              <ChevronDown size={14} className={`transition-transform duration-200 ${showDiagnostics ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {showDiagnostics && (
            <div className="p-4 border-t border-zinc-800 space-y-3 bg-[#08080a] text-xs font-mono">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-2.5 bg-zinc-900/60 rounded-lg border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block">Iframe Sandbox:</span>
                  <span className="font-bold text-zinc-200">{previewState.progress >= 10 ? "CONNECTED" : "CREATING"}</span>
                </div>
                <div className="p-2.5 bg-zinc-900/60 rounded-lg border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block">Babel Transpiler:</span>
                  <span className="font-bold text-zinc-200">{previewState.progress >= 20 ? "READY" : "LOADING"}</span>
                </div>
                <div className="p-2.5 bg-zinc-900/60 rounded-lg border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block">React 18 Engine:</span>
                  <span className="font-bold text-zinc-200">{previewState.progress >= 40 ? "READY" : "LOADING"}</span>
                </div>
                <div className="p-2.5 bg-zinc-900/60 rounded-lg border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block">React Component Mount:</span>
                  <span className={previewState.status === 'READY' ? "font-bold text-emerald-400" : "font-bold text-yellow-400"}>
                    {previewState.status === 'READY' ? "MOUNTED (100%)" : `${previewState.progress}%`}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-800/60">
                <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                  <span>Template: <strong>{activeOption?.name || activeOption?.id}</strong></span>
                  {previewState.isMinimalTest && <span className="bg-yellow-500/20 text-yellow-300 px-1.5 py-0.5 rounded text-[10px]">Minimal Test Mode</span>}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={runEnvironmentDiagnostics}
                    disabled={isRunningDiagnostics}
                    className="px-2.5 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 rounded text-[11px] border border-cyan-500/30 transition-all cursor-pointer flex items-center gap-1 disabled:opacity-50"
                  >
                    <Activity size={11} className={isRunningDiagnostics ? "animate-spin" : ""} /> {isRunningDiagnostics ? "Testing..." : "Test Preview Environment"}
                  </button>

                  <button
                    type="button"
                    onClick={handleRetryPreview}
                    className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-[11px] border border-zinc-700 transition-all cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw size={11} /> Reset Sandbox
                  </button>

                  <button
                    type="button"
                    onClick={handleToggleMinimalTest}
                    className="px-2.5 py-1 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-300 rounded text-[11px] border border-yellow-500/30 transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Sparkles size={11} /> {previewState.isMinimalTest ? "Exit Test Mode" : "Run Minimal Test"}
                  </button>
                </div>
              </div>

              {/* Iframe DOM Inspector Card */}
              {(() => {
                const domInfo = getIframeDOMDiagnostics();
                return (
                  <div className="p-3 bg-zinc-900/40 rounded-lg border border-zinc-800/80 space-y-1">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold block">Iframe DOM Element Inspector:</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-zinc-300 pt-1">
                      <div>DOM Element: <span className={domInfo.exists ? "text-emerald-400 font-bold" : "text-red-400"}>{domInfo.exists ? "Attached" : "Missing"}</span></div>
                      <div>Dimensions: <span className="text-zinc-200 font-bold">{domInfo.width}px × {domInfo.height}px</span></div>
                      <div>Visibility: <span className={domInfo.visible ? "text-emerald-400 font-bold" : "text-yellow-400"}>{domInfo.visible ? "Visible" : "Hidden"}</span></div>
                      <div>Payload Size: <span className="text-zinc-200 font-bold">{domInfo.srcDocKB}</span></div>
                    </div>
                  </div>
                );
              })()}

              {/* Network Diagnostic Suite Table */}
              {envDiagnostics.length > 0 && (
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-cyan-400 uppercase font-bold">Network & CDN Diagnostic Suite Results:</span>
                    <span className="text-[10px] text-zinc-500">{envDiagnostics.filter(d => d.success).length}/{envDiagnostics.length} Passed</span>
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950/80">
                    <table className="w-full text-left text-[11px] font-mono">
                      <thead className="bg-zinc-900/80 text-zinc-400 border-b border-zinc-800">
                        <tr>
                          <th className="p-2">Resource</th>
                          <th className="p-2">URL / Source</th>
                          <th className="p-2">Latency</th>
                          <th className="p-2 text-right">Result</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/50">
                        {envDiagnostics.map((diag, idx) => (
                          <tr key={idx} className="hover:bg-zinc-900/40">
                            <td className="p-2 font-semibold text-zinc-200">{diag.resource}</td>
                            <td className="p-2 text-zinc-400 max-w-[200px] truncate">{diag.url}</td>
                            <td className="p-2 text-zinc-300">{diag.timeMs}ms</td>
                            <td className="p-2 text-right">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${diag.success ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                                {diag.success ? "✓ PASS" : "✗ FAIL"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {previewState.logs.length > 0 && (
                <div className="space-y-1 pt-2">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold">Stage Transition Log:</span>
                  <div className="max-h-28 overflow-auto space-y-1 p-2 bg-zinc-950 rounded-lg border border-zinc-800/80">
                    {previewState.logs.map((log, idx) => (
                      <div key={idx} className={`flex items-center justify-between text-[11px] ${log.isError ? 'text-red-400' : 'text-zinc-400'}`}>
                        <span>[{log.time}] {log.stage} ({log.progress}%): {log.details}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleSaveDesign = () => {
    const selectedOption = options.find((o) => o.id === selectedOptionId);
    if (!selectedOption) return;
    try {
      const savedList = JSON.parse(
        localStorage.getItem("stitch_saved_designs") || "[]",
      );
      const newDesign = {
        id: `design-${Date.now()}`,
        name: selectedOption.name,
        title: selectedOption.title || selectedOption.name,
        category: selectedOption.category || "SOFTWARE",
        badge: selectedOption.badge || "Saved Design",
        description: selectedOption.description,
        techStack: selectedOption.techStack,
        prompt: appIdea || selectedOption.prompt || "",
        files: selectedOption.files,
        savedAt: new Date().toISOString(),
      };
      const trimmedList = [newDesign, ...(Array.isArray(savedList) ? savedList.slice(0, 7) : [])];
      try {
        localStorage.setItem("stitch_saved_designs", JSON.stringify(trimmedList));
      } catch (quotaErr) {
        console.warn("[Design Studio] LocalStorage quota exceeded when saving design:", quotaErr);
        const lightList = trimmedList.map((item) => ({
          ...item,
          files: {
            "index.html": "<div id='root'></div>",
            "src/App.tsx": "",
            "src/index.css": "@import 'tailwindcss';",
          },
        }));
        try {
          localStorage.setItem("stitch_saved_designs", JSON.stringify(lightList));
        } catch (_) {}
      }
      setToastMsg("✓ Design layout saved to Design Studio library!");
      setTimeout(() => setToastMsg(null), 3500);
    } catch (e) {
      console.error("Failed to save design layout:", e);
    }
  };

  const handleOpenCreateProjectModal = () => {
    const selectedOption = options.find((o) => o.id === selectedOptionId);
    if (selectedOption) {
      setProjectNameInput(selectedOption.name);
      setProjectDescInput(selectedOption.description);
    } else {
      setProjectNameInput("My New Project");
      setProjectDescInput("");
    }
    setIsCreateModalOpen(true);
  };

  const handleConfirmCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const chosenOption = options.find((o) => o.id === selectedOptionId);
    if (!chosenOption || !projectNameInput.trim()) return;

    setIsCreateModalOpen(false);
    setIsDeploying(true);
    setDeploymentLogs([]);

    const logs = [
      "Creating new project entry from design...",
      "Bundling design code (App.tsx, index.css)...",
      "Registering project context in workspace...",
      "Navigating to active project space...",
    ];

    for (let i = 0; i < logs.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 350));
      setDeploymentLogs((prev) => [...prev, logs[i]]);
    }

    try {
      const newProjectId = addProject({
        name: projectNameInput.trim(),
        description: projectDescInput.trim() || chosenOption.description,
        frameworks: ["React", "Vite", "Tailwind CSS"],
        customStack: chosenOption.techStack,
        status: "Planning",
        virtualFiles: chosenOption.files,
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: 2048,
        backendSettings: { type: "none" },
        goals: [
          "Review generated App.tsx file and test interactive UI triggers.",
          "Connect endpoints to realistic cloud persistence tables.",
        ],
      } as any);

      if (newProjectId) {
        setActiveProjectId(newProjectId);
        setTimeout(() => {
          setIsDeploying(false);
          navigate(`/create?projectId=${newProjectId}`);
        }, 500);
      }
    } catch (err) {
      console.error(err);
      setIsDeploying(false);
    }
  };

  const selectedOption =
    options.find((o) => o.id === selectedOptionId) || options[0] || null;

  

  return (
    <div className="min-h-full bg-[#09090b] text-zinc-100 flex flex-col relative overflow-hidden font-sans">
      {/* Top Header Navigation */}
      <header className="border-b border-zinc-800/80 bg-[#0c0c0e] px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400">
            <PencilRuler size={19} />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              Design Studio
              <span className="text-[10px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700/60 px-2 py-0.5 rounded-md font-medium">
                Layout & Architecture
              </span>
            </h1>
            <p className="text-xs text-zinc-400">
              Model, compare, and test interactive React application designs
              before deploying into active workspace code.
            </p>
          </div>
        </div>

        {/* API Key / Config Control */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 font-mono">
            <CheckCircle2 size={13} className="text-emerald-400" />
            <span>
              Google Auth:{" "}
              {auth.currentUser?.email || "drummerforger@gmail.com"}
            </span>
          </div>
          <button
            onClick={() => setIsApiKeyModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-300 hover:text-white transition-all cursor-pointer font-mono"
          >
            <Key
              size={13}
              className={useSandboxKey ? "text-zinc-400" : "text-amber-400"}
            />
            <span>
              {useSandboxKey ? "Configure Custom Key" : "Custom Key Active"}
            </span>
          </button>
        </div>
      </header>

      {/* Progress Wizard Header */}
      <div className="px-6 py-3 bg-[#0a0a0c] border-b border-zinc-800/60 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setCurrentStep(1)}
            className={`flex items-center gap-2 text-xs font-medium transition-colors cursor-pointer ${
              currentStep === 1
                ? "text-white"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentStep === 1
                  ? "bg-yellow-500 text-black"
                  : "bg-zinc-800 text-zinc-400"
              }`}
            >
              1
            </span>
            <span>Design Brief & Archetype</span>
          </button>

          <ChevronRight size={14} className="text-zinc-700" />

          <button
            onClick={() => {
              if (options.length > 0) setCurrentStep(2);
            }}
            disabled={options.length === 0}
            className={`flex items-center gap-2 text-xs font-medium transition-colors ${
              currentStep === 2
                ? "text-white"
                : options.length > 0
                  ? "text-zinc-500 hover:text-zinc-300 cursor-pointer"
                  : "text-zinc-700 cursor-not-allowed"
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentStep === 2
                  ? "bg-yellow-500 text-black"
                  : "bg-zinc-800 text-zinc-400"
              }`}
            >
              2
            </span>
            <span>Variant Sandbox & Evaluation</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          {(appIdea || options.length > 0) && (
            <button
              onClick={handleResetDesign}
              className="px-2.5 py-1 text-xs text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-all cursor-pointer flex items-center gap-1.5"
              title="Reset current draft"
            >
              <Trash2 size={13} />
              <span>Reset Draft</span>
            </button>
          )}

          {currentStep > 1 && (
            <button
              onClick={() => setCurrentStep(1)}
              className="px-3 py-1 text-xs text-zinc-300 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded-md transition-all cursor-pointer flex items-center gap-1 font-mono"
            >
              <ChevronLeft size={13} /> Back
            </button>
          )}
        </div>
      </div>

      {/* Main Content Body */}
      <div className="flex-1 p-6 overflow-y-auto max-w-7xl w-full mx-auto space-y-6 z-10">
        <AnimatePresence mode="wait">
          {/* STEP 1: DESIGN BRIEF & ARCHETYPE SELECTION */}
          {currentStep === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full space-y-6"
            >
              {isBrainstorming ? (
                /* Sleek Loading Compiler View */
                <div className="w-full max-w-3xl mx-auto bg-[#0d0d10] border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-6">
                  <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <RefreshCw
                          size={15}
                          className="text-yellow-400 animate-spin"
                        />
                        <h2 className="text-sm font-bold text-white tracking-tight">
                          Compiling UI Blueprint Variants
                        </h2>
                      </div>
                      <p className="text-xs text-zinc-400">
                        Generating multi-view React components for: &ldquo;
                        {appIdea}&rdquo;
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold font-mono text-yellow-400">
                        {buildProgress}%
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden border border-zinc-800">
                    <div
                      className="bg-yellow-500 h-full transition-all duration-200"
                      style={{ width: `${buildProgress}%` }}
                    />
                  </div>

                  {/* Code & Terminal Log Box */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-60">
                    <div className="bg-[#050507] border border-zinc-800/80 rounded-xl p-3 font-mono text-[11px] text-zinc-400 overflow-y-auto space-y-1.5">
                      <div className="text-xs font-semibold text-zinc-500 border-b border-zinc-800/60 pb-1 mb-2 flex items-center gap-1.5">
                        <Terminal size={12} className="text-yellow-400" />{" "}
                        Execution Log
                      </div>
                      {buildLogs.map((log, idx) => (
                        <div key={idx} className="flex items-start gap-1.5">
                          <span className="text-yellow-400 select-none">
                            &gt;
                          </span>
                          <span>{log}</span>
                        </div>
                      ))}
                    </div>

                    <div className="bg-[#050507] border border-zinc-800/80 rounded-xl p-3 font-mono text-[11px] text-zinc-300 overflow-y-auto whitespace-pre">
                      <div className="text-xs font-semibold text-zinc-500 border-b border-zinc-800/60 pb-1 mb-2 flex items-center justify-between">
                        <span>src/App.tsx</span>
                        <span className="text-[9px] text-yellow-400">
                          VIRTUAL FS
                        </span>
                      </div>
                      {activeCodeSnippet}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full space-y-6">
                  {errorMsg && (
                    <div className="bg-rose-950/30 border border-rose-800/40 p-4 rounded-xl flex items-start gap-2.5 text-xs text-rose-300">
                      <AlertCircle
                        className="shrink-0 mt-0.5 text-rose-400"
                        size={15}
                      />
                      <div>
                        <span className="font-semibold block text-rose-200 mb-0.5">
                          Generation Error
                        </span>
                        <span>{errorMsg}</span>
                      </div>
                    </div>
                  )}

                  {/* Full-width Brief & Archetype Container */}
                  <div className="w-full space-y-6 bg-[#0c0c0f] border border-zinc-800 p-6 rounded-2xl shadow-xl">
                    <div className="space-y-1">
                      <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                        <Sparkles size={16} className="text-yellow-400" />
                        Application Requirements & Design Brief
                      </h2>
                      <p className="text-xs text-zinc-400">
                        Describe what you are building or select a starter
                        archetype below to prefill details.
                      </p>
                    </div>

                    {/* Template Archetype Selector */}
                    <div className="space-y-3 bg-[#08080a] p-4 rounded-xl border border-zinc-800/80">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                          <Wand2 size={13} className="text-yellow-400" />
                          Curated Starter Archetypes
                        </span>

                        <div className="relative">
                          <Search
                            size={12}
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500"
                          />
                          <input
                            type="text"
                            placeholder="Filter templates..."
                            value={templateSearch}
                            onChange={(e) => setTemplateSearch(e.target.value)}
                            className="bg-zinc-900 border border-zinc-800 rounded-lg pl-7 pr-2.5 py-1 text-xs text-zinc-300 focus:outline-none focus:border-yellow-500/50 w-40"
                          />
                        </div>
                      </div>

                      {/* Category Filter Pills */}
                      <div className="flex flex-wrap gap-1.5 pb-2 border-b border-zinc-800/60">
                        {[
                          { key: "ALL", label: "All" },
                          { key: "MOBILE", label: "📱 Mobile" },
                          { key: "WEBSITE", label: "🌐 Websites" },
                          { key: "ECOMMERCE", label: "🛍️ E-Commerce" },
                          { key: "SOFTWARE", label: "💻 Software" },
                          { key: "ANALYTICS", label: "📊 Analytics" },
                          { key: "PRODUCTIVITY", label: "⏱️ Productivity" },
                        ].map((cat) => (
                          <button
                            key={cat.key}
                            type="button"
                            onClick={() => setSelectedCategory(cat.key as any)}
                            className={`px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer border ${
                              selectedCategory === cat.key
                                ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/40 font-medium"
                                : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200"
                            }`}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>

                      {/* Archetype Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[220px] overflow-y-auto pr-1">
                        {DESIGN_TEMPLATES.map(normalizeTemplate).filter((tmpl) => {
                          const matchesCategory =
                            selectedCategory === "ALL" ||
                            tmpl.category === selectedCategory;
                          const sq = (templateSearch || "").trim().toLowerCase();
                          const matchesQuery =
                            !sq ||
                            (tmpl.title || "")
                              .toLowerCase()
                              .includes(sq) ||
                            (tmpl.description || "")
                              .toLowerCase()
                              .includes(sq) ||
                            (tmpl.badge || "")
                              .toLowerCase()
                              .includes(sq) ||
                            (tmpl.prompt || "")
                              .toLowerCase()
                              .includes(sq);
                          return matchesCategory && matchesQuery;
                        }).map((tmpl) => {
                          const IconComp = tmpl.icon;
                          const isSelected =
                            selectedTemplateTitle === tmpl.title;
                          return (
                            <button
                              key={tmpl.id}
                              type="button"
                              onClick={() => selectTemplateAndPreview(tmpl)}
                              className={`p-3 rounded-xl text-left transition-all cursor-pointer flex flex-col justify-between gap-2 border ${
                                isSelected
                                  ? "bg-yellow-950/30 border-yellow-500 shadow-sm"
                                  : "bg-zinc-900/60 hover:bg-zinc-900 border-zinc-800/80 hover:border-zinc-700"
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <div className="flex items-center gap-1.5">
                                    <IconComp
                                      size={13}
                                      className="text-yellow-400 shrink-0"
                                    />
                                    <span className="text-xs font-semibold text-zinc-200 truncate">
                                      {tmpl.title}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-2">
                                  {tmpl.description}
                                </p>
                              </div>
                              <div className="text-[10px] text-yellow-400 font-medium flex items-center justify-between pt-1 border-t border-zinc-800/40">
                                <span>
                                  {isSelected ? "✓ Active" : "Use Archetype"}
                                </span>
                                <ArrowRight size={10} />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Brief Textarea & Enhancer Chips */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-zinc-300">
                          Detailed App Prompt
                        </label>
                        <span className="text-[10px] font-mono text-zinc-500">
                          {appIdea.length} characters
                        </span>
                      </div>

                      <textarea
                        rows={5}
                        placeholder="E.g., A minimalist developer todo list with local-first offline storage, interactive status metrics using charts, dark mode toggle, and category tags..."
                        value={appIdea}
                        onChange={(e) => setAppIdea(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 text-xs text-zinc-200 focus:outline-none focus:border-yellow-500/60 placeholder-zinc-600 leading-relaxed resize-none"
                      />

                      {/* Quick Enhancers */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] text-zinc-500 font-mono mr-1">
                          Quick Additions:
                        </span>
                        {[
                          "+ Dark Mode Toggle",
                          "+ Search & Filter Bar",
                          "+ Interactive Chart Metrics",
                          "+ Modal Dialog Views",
                          "+ Local Storage Sync",
                        ].map((chip, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setAppIdea((prev) =>
                                prev
                                  ? `${prev} Include ${chip.replace("+ ", "")}.`
                                  : `Include ${chip.replace("+ ", "")}.`,
                              );
                            }}
                            className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-[10px] text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer font-mono"
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Parameters Config Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-zinc-800/60">
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-zinc-400">
                          Architect Persona
                        </label>
                        <select
                          value={selectedAgent}
                          onChange={(e) => setSelectedAgent(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 focus:outline-none focus:border-yellow-500"
                        >
                          <option value="System Architect">
                            System Architect (Pragmatic)
                          </option>
                          <option value="Creative Designer">
                            UI Designer (Polished Visuals)
                          </option>
                          <option value="Security Expert">
                            Security Lead (Enterprise)
                          </option>
                          <option value="Product Owner">
                            Product Lead (Feature Rich)
                          </option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-zinc-400">
                          Variant Options
                        </label>
                        <select
                          value={optionsCount}
                          onChange={(e) =>
                            setOptionsCount(parseInt(e.target.value, 10))
                          }
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 focus:outline-none focus:border-yellow-500"
                        >
                          <option value={2}>2 Options (Compare)</option>
                          <option value={3}>3 Options (Deep Compare)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-zinc-400">
                          AI Model Engine
                        </label>
                        <select
                          value={selectedModel}
                          onChange={(e) => setSelectedModel(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 focus:outline-none focus:border-yellow-500"
                        >
                          <option value="gemini-3.7-flash">
                            Gemini 3.7 Flash (Fast & Sharp)
                          </option>
                          <option value="gemini-3.1-pro-preview">
                            Gemini 3.1 Pro (Deep Reasoning)
                          </option>
                          <option value="gemini-3.1-flash-lite">
                            Gemini 3.1 Flash Lite (Ultra Fast)
                          </option>
                        </select>
                      </div>
                    </div>

                    {/* Step 1 Actions */}
                    <div className="pt-4 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="text-xs text-zinc-400 font-mono">
                        {selectedTemplateTitle ? (
                          <span className="flex items-center gap-1.5 text-zinc-300">
                            <span className="w-2 h-2 rounded-full bg-yellow-500" />
                            Archetype Selected: <strong className="text-yellow-400">{selectedTemplateTitle}</strong>
                          </span>
                        ) : (
                          <span>Configure your prompt and archetype, then generate or proceed to comparison.</span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            if (!options || options.length === 0) {
                              const effectiveIdea = appIdea.trim() || selectedTemplateTitle || "Modern interactive web application layout system";
                              const mockData = generateMockStitchResponse(effectiveIdea, selectedAgent, optionsCount);
                              if (mockData?.options?.length > 0) {
                                const normalizedOpts = mockData.options.map(normalizeOption);
                                setOptions(normalizedOpts);
                                setSelectedOptionId(normalizedOpts[0].id);
                              }
                            }
                            setCurrentStep(2);
                          }}
                          className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-200 border border-zinc-800 hover:border-zinc-700 font-medium text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 font-mono"
                        >
                          <span>Next: Test & Compare Variants</span>
                          <ArrowRight size={13} />
                        </button>

                        <button
                          type="button"
                          onClick={handleBrainstorm}
                          disabled={isBrainstorming}
                          className="px-6 py-2.5 bg-yellow-500 hover:bg-yellow-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-md shadow-yellow-500/20"
                        >
                          {isBrainstorming ? (
                            <>
                              <RefreshCw size={14} className="animate-spin" /> Compiling Layouts...
                            </>
                          ) : (
                            <>
                              <Sparkles size={14} /> Generate Custom UI Variants
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 2: VARIANT SANDBOX & EVALUATION */}
          {currentStep === 2 && selectedOption && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Toolbar & View Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0c0c0f] p-3 rounded-xl border border-zinc-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Columns size={14} className="text-yellow-400" />
                    Generated Variants ({options.length})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* View Mode Switcher */}
                  <div className="flex items-center bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setAbViewMode("single")}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                        abViewMode === "single"
                          ? "bg-yellow-500 text-black font-bold"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      <Eye size={12} /> Single View
                    </button>
                    <button
                      type="button"
                      onClick={() => setAbViewMode("side-by-side")}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                        abViewMode === "side-by-side"
                          ? "bg-yellow-500 text-black font-bold"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      <Columns size={12} /> Side-by-Side
                    </button>
                  </div>

                  {/* Device Frame Switcher */}
                  <div className="flex items-center bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setDeviceFrame("desktop")}
                      className={`p-1.5 rounded-md transition-all cursor-pointer ${
                        deviceFrame === "desktop"
                          ? "bg-zinc-800 text-yellow-400"
                          : "text-zinc-500 hover:text-zinc-300"
                      }`}
                      title="Desktop Viewport"
                    >
                      <Monitor size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeviceFrame("tablet")}
                      className={`p-1.5 rounded-md transition-all cursor-pointer ${
                        deviceFrame === "tablet"
                          ? "bg-zinc-800 text-yellow-400"
                          : "text-zinc-500 hover:text-zinc-300"
                      }`}
                      title="Tablet Viewport"
                    >
                      <Laptop size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeviceFrame("mobile")}
                      className={`p-1.5 rounded-md transition-all cursor-pointer ${
                        deviceFrame === "mobile"
                          ? "bg-zinc-800 text-yellow-400"
                          : "text-zinc-500 hover:text-zinc-300"
                      }`}
                      title="Mobile Viewport"
                    >
                      <Smartphone size={14} />
                    </button>
                  </div>

                  {/* Fullscreen Button */}
                  <button
                    type="button"
                    onClick={() => setIsFullscreenPreview(true)}
                    className="px-2.5 py-1 text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-lg transition-all flex items-center gap-1 cursor-pointer border border-zinc-700"
                  >
                    <Maximize2 size={12} /> Fullscreen
                  </button>
                </div>
              </div>

              {/* Variant Cards Summary Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {options.map((option) => {
                  const rating = optionRatings[option.id] || 0;
                  const verdict = optionVerdicts[option.id] || null;
                  const isSelected = selectedOptionId === option.id;
                  return (
                    <div
                      key={option.id}
                      onClick={() => setSelectedOptionId(option.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                        isSelected
                          ? "bg-yellow-950/20 border-yellow-500 shadow-md shadow-yellow-500/10"
                          : "bg-[#0c0c0f] border-zinc-800 hover:border-zinc-700"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-3 right-3 w-4 h-4 bg-yellow-500 text-black font-bold rounded-full flex items-center justify-center">
                          <Check size={10} />
                        </div>
                      )}

                      <div className="space-y-1 pr-6 mb-2">
                        <h4 className="text-xs font-bold text-zinc-200 truncate">
                          {option.name}
                        </h4>
                        <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-2">
                          {option.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60">
                        <div className="flex flex-wrap gap-1">
                          {option.techStack.slice(0, 2).map((tag, idx) => (
                            <span
                              key={idx}
                              className="text-[9px] font-mono bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded text-zinc-400"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* Stars */}
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOptionRatings((prev) => ({
                                  ...prev,
                                  [option.id]: s,
                                }));
                              }}
                              className={`text-xs cursor-pointer ${
                                rating >= s
                                  ? "text-amber-400"
                                  : "text-zinc-700 hover:text-amber-400/50"
                              }`}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Main Sandbox & Details Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Specs & Sandbox Column (2 cols) */}
                <div className="lg:col-span-2 bg-[#0c0c0f] border border-zinc-800 rounded-2xl overflow-hidden flex flex-col min-h-[560px]">
                  {/* Tabs Bar */}
                  <div className="bg-[#08080a] px-4 border-b border-zinc-800 flex items-center justify-between">
                    <div className="flex gap-1 overflow-x-auto">
                      {[
                        { id: "preview", label: "Interactive Preview 🖥️" },
                        { id: "stack", label: "Architecture Summary" },
                        { id: "db", label: "Firestore Schemas" },
                        {
                          id: "endpoints",
                          label: `API Routes (${selectedOption.endpoints.length})`,
                        },
                        { id: "code", label: "App.tsx Skeleton" },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as any)}
                          className={`px-3 py-3 text-xs font-medium cursor-pointer border-b-2 transition-all whitespace-nowrap ${
                            activeTab === tab.id
                              ? "border-yellow-500 text-yellow-400 font-semibold"
                              : "border-transparent text-zinc-400 hover:text-zinc-200"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsFullscreenPreview(true)}
                      className="px-2 py-1 text-[10px] font-mono text-zinc-400 hover:text-zinc-200 bg-zinc-900 border border-zinc-800 rounded transition-all shrink-0 cursor-pointer"
                    >
                      Expand View
                    </button>
                  </div>

                  {/* Tab Body */}
                  <div className="flex-1 p-4 overflow-y-auto">
                    {activeTab === "preview" && (
                      <div className="flex flex-col gap-3 h-full">
                        {abViewMode === "side-by-side" &&
                        options.length >= 2 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[480px]">
                            {options.slice(0, 2).map((opt, idx) => {
                              const isOptSelected = selectedOptionId === opt.id;
                              return (
                                <div
                                  key={opt.id}
                                  className={`flex flex-col gap-2 bg-[#050507] p-3 rounded-xl border transition-all ${
                                    isOptSelected
                                      ? "border-yellow-500/80 ring-2 ring-yellow-500/20 shadow-lg shadow-yellow-500/10"
                                      : "border-zinc-800"
                                  }`}
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-zinc-100">
                                        Variant {idx + 1}: {opt.name}
                                      </span>
                                      {isOptSelected && (
                                        <span className="text-[10px] font-mono bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded border border-yellow-500/30 font-semibold">
                                          Active
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setSelectedOptionId(opt.id)
                                        }
                                        className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                          isOptSelected
                                            ? "bg-yellow-500 text-black shadow-md shadow-yellow-500/20"
                                            : "bg-zinc-900 text-zinc-300 border border-zinc-700 hover:border-yellow-500/60 hover:text-white"
                                        }`}
                                      >
                                        {isOptSelected ? (
                                          <>
                                            <Check size={12} /> Selected
                                          </>
                                        ) : (
                                          "Select Variant"
                                        )}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedOptionId(opt.id);
                                          setAbViewMode("single");
                                        }}
                                        className="px-2.5 py-1 text-[11px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg transition-all flex items-center gap-1 cursor-pointer border border-zinc-700"
                                        title="Focus single interactive view"
                                      >
                                        <Eye size={12} /> Focus
                                      </button>
                                    </div>
                                  </div>
                                  <div className="w-full flex-1 min-h-[360px] rounded-lg overflow-hidden border border-zinc-800/80 bg-[#09090b]">
                                    <iframe
                                      key={`ab-side-${opt.id}-${opt.files?.["src/App.tsx"]?.length || 0}`}
                                      title={`Side Test ${opt.name}`}
                                      srcDoc={getPreviewSourceDoc(opt)}
                                      className="w-full h-full min-h-[360px] border-none bg-[#09090b]"
                                      sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="w-full flex-1 min-h-[420px] bg-[#050507] rounded-xl overflow-hidden border border-zinc-800/80 flex justify-center items-center p-2 relative">
                            {isIterating && (
                              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-40 flex flex-col items-center justify-center space-y-2 p-6 text-center">
                                <RefreshCw
                                  size={20}
                                  className="text-yellow-400 animate-spin"
                                />
                                <span className="text-xs font-semibold text-zinc-200">
                                  Re-compiling UI Layout...
                                </span>
                              </div>
                            )}
                            <div
                              className={`h-full transition-all duration-300 w-full ${
                                deviceFrame === "mobile"
                                  ? "w-[375px] max-w-full h-[500px] border-4 border-zinc-800 rounded-[28px] overflow-hidden shadow-2xl my-2 mx-auto"
                                  : deviceFrame === "tablet"
                                    ? "w-[768px] max-w-full h-full border-2 border-zinc-800 rounded-xl overflow-hidden shadow-xl mx-auto"
                                    : "w-full h-full"
                              }`}
                            >
                              {renderInteractiveSandboxContainer(selectedOption, "h-[500px]")}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === "stack" && (
                      <div className="space-y-4 text-xs text-zinc-300">
                        <div className="space-y-1">
                          <span className="font-semibold text-zinc-200">
                            Architectural Summary
                          </span>
                          <p className="text-zinc-400 leading-relaxed bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800">
                            {selectedOption.description}
                          </p>
                        </div>

                        <div className="space-y-1.5">
                          <span className="font-semibold text-zinc-200">
                            Recommended Stack
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedOption.techStack.map((tag, idx) => (
                              <span
                                key={idx}
                                className="font-mono bg-yellow-500/10 border border-yellow-500/20 px-2.5 py-1 rounded-md text-yellow-300"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1.5 pt-2">
                          <span className="font-semibold text-zinc-200">
                            Assigned AI Sub-Agents
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {selectedOption.subAgents.map((agent, idx) => (
                              <div
                                key={idx}
                                className="p-3 bg-zinc-900/40 border border-zinc-800 rounded-xl space-y-1"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-zinc-200">
                                    {agent.name}
                                  </span>
                                  <span className="text-[9px] font-mono px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded">
                                    {agent.officeZone}
                                  </span>
                                </div>
                                <p className="text-[11px] text-zinc-400 leading-relaxed">
                                  {agent.role}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === "db" && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-zinc-200 text-xs font-semibold">
                          <BookmarkCheck size={14} className="text-amber-400" />
                          <span>Firestore Collection Schemas</span>
                        </div>
                        <pre className="p-4 bg-[#050507] border border-zinc-800 rounded-xl font-mono text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap select-all">
                          {selectedOption.dbSchema}
                        </pre>
                      </div>
                    )}

                    {activeTab === "endpoints" && (
                      <div className="space-y-2">
                        <span className="text-xs font-semibold text-zinc-200 block mb-2">
                          REST & GraphQL Specifications
                        </span>
                        {selectedOption.endpoints.map((route, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between gap-3 p-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                                  route.method === "GET"
                                    ? "bg-emerald-950 text-emerald-400 border border-emerald-900"
                                    : route.method === "POST"
                                      ? "bg-amber-950 text-amber-400 border border-amber-900"
                                      : "bg-orange-950 text-orange-400 border border-orange-900"
                                }`}
                              >
                                {route.method}
                              </span>
                              <span className="font-mono text-zinc-200">
                                {route.path}
                              </span>
                            </div>
                            <span className="text-[11px] text-zinc-400">
                              {route.description}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {activeTab === "code" && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
                          <span>src/App.tsx</span>
                          <span>React TSX</span>
                        </div>
                        <pre className="p-4 bg-[#050507] border border-zinc-800 rounded-xl font-mono text-xs text-amber-300 leading-relaxed overflow-auto max-h-[380px] select-all">
                          {selectedOption.files["src/App.tsx"]}
                        </pre>
                      </div>
                    )}
                  </div>

                  {/* Design Action Bar */}
                  <div className="bg-[#08080a] border-t border-zinc-800 p-4 flex flex-wrap justify-between items-center gap-3 shrink-0">
                    <span className="text-xs text-zinc-400 font-mono">
                      Selected Layout:{" "}
                      <strong className="text-white">
                        {selectedOption.name}
                      </strong>
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSaveDesign}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-medium text-xs rounded-xl border border-zinc-700 transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <BookmarkCheck size={14} className="text-yellow-400" />{" "}
                        Save Design
                      </button>

                      <button
                        type="button"
                        onClick={handleOpenCreateProjectModal}
                        className="px-5 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-md shadow-yellow-500/20"
                      >
                        <Sparkles size={14} /> Create Project from Design
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Column (1 col): Refinement & Revision Panel */}
                <div className="bg-[#0c0c0f] border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between min-h-[560px] space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h3 className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                        <Sliders size={14} className="text-yellow-400" />
                        Design Revision Assistant
                      </h3>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        Request real-time component modifications or layout
                        adjustments from Gemini.
                      </p>
                    </div>

                    {/* Quick Revision Chips */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono text-zinc-500">
                        Quick Adjustments:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          "Darker glass aesthetic",
                          "Roomier spacing & padding",
                          "Add search filter bar",
                          "Simpler typography",
                          "Add interactive chart",
                        ].map((chip, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setFeedbackText((prev) =>
                                prev
                                  ? `${prev} ${chip}.`
                                  : `Please update the layout: ${chip}.`,
                              );
                            }}
                            className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-[10px] text-zinc-300 hover:text-white transition-all cursor-pointer"
                          >
                            + {chip}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Feedback Input */}
                    <div className="space-y-2 pt-2">
                      <textarea
                        rows={3}
                        placeholder="E.g., Increase padding between cards, make the header sticky, and add a quick action button..."
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none focus:border-yellow-500 placeholder-zinc-600 leading-relaxed resize-none"
                      />

                      <button
                        onClick={handleIterateFeedback}
                        disabled={isIterating || !feedbackText.trim()}
                        className="w-full py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/40 disabled:opacity-40 font-medium text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Send size={12} /> Apply Design Revisions
                      </button>
                    </div>
                  </div>

                  {/* Verdict & Approval Suite */}
                  <div className="space-y-2 pt-4 border-t border-zinc-800/80">
                    <span className="text-xs font-semibold text-zinc-300 block">
                      Variant Verdict
                    </span>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setOptionVerdicts((prev) => ({
                            ...prev,
                            [selectedOptionId]: "yes",
                          }));
                        }}
                        className={`py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          optionVerdicts[selectedOptionId] === "yes"
                            ? "bg-emerald-600 text-white border-emerald-500"
                            : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200"
                        }`}
                      >
                        <CheckCircle2 size={13} /> Approve
                      </button>

                      <button
                        onClick={() => {
                          setOptionVerdicts((prev) => ({
                            ...prev,
                            [selectedOptionId]: "no",
                          }));
                          if (!feedbackText) {
                            setFeedbackText(
                              "Revisions needed for this option: ",
                            );
                          }
                        }}
                        className={`py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          optionVerdicts[selectedOptionId] === "no"
                            ? "bg-rose-900/40 text-rose-300 border-rose-800"
                            : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200"
                        }`}
                      >
                        <AlertCircle size={13} /> Revisions
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Deployment Modal Overlay */}
      <AnimatePresence>
        {isDeploying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6"
          >
            <div className="max-w-md w-full bg-[#0c0c0f] border border-zinc-800 p-6 rounded-2xl space-y-5 text-center shadow-2xl">
              <div className="w-12 h-12 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 flex items-center justify-center mx-auto">
                <RefreshCw size={20} className="animate-spin" />
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">
                  Deploying Design Blueprint
                </h3>
                <p className="text-xs text-zinc-400">
                  Initializing project container in active workspace...
                </p>
              </div>

              <div className="bg-[#050507] border border-zinc-800 p-3.5 rounded-xl font-mono text-[11px] text-yellow-300 text-left h-36 overflow-y-auto space-y-1">
                {deploymentLogs.map((log, index) => (
                  <div key={index} className="flex items-center gap-1.5">
                    <span>&gt; {log}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Preview Modal */}
      <AnimatePresence>
        {isFullscreenPreview && selectedOption && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex flex-col p-4"
          >
            <div className="flex items-center justify-between bg-[#0c0c0f] border border-zinc-800 p-3 rounded-xl mb-3 shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-white">
                  {selectedOption.name}
                </span>
                <span className="text-[10px] bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 px-2 py-0.5 rounded font-mono">
                  Fullscreen Sandbox
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setDeviceFrame("desktop")}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                      deviceFrame === "desktop"
                        ? "bg-yellow-500 text-black font-bold"
                        : "text-zinc-400"
                    }`}
                  >
                    Desktop
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeviceFrame("tablet")}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                      deviceFrame === "tablet"
                        ? "bg-yellow-500 text-black font-bold"
                        : "text-zinc-400"
                    }`}
                  >
                    Tablet
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeviceFrame("mobile")}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                      deviceFrame === "mobile"
                        ? "bg-yellow-500 text-black font-bold"
                        : "text-zinc-400"
                    }`}
                  >
                    Mobile
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsFullscreenPreview(false)}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-medium transition-all"
                >
                  <Minimize2 size={13} />
                </button>
              </div>
            </div>

            <div className="flex-1 w-full bg-[#050507] rounded-xl border border-zinc-800 overflow-hidden relative flex justify-center items-center p-2">
              <div
                className={`h-full transition-all duration-300 ${
                  deviceFrame === "mobile"
                    ? "w-[390px] h-[720px] max-h-full border-4 border-zinc-800 rounded-[32px] overflow-hidden shadow-2xl my-auto"
                    : deviceFrame === "tablet"
                      ? "w-[840px] max-w-full h-full border-2 border-zinc-800 rounded-2xl overflow-hidden shadow-xl"
                      : "w-full h-full rounded-xl overflow-hidden"
                }`}
              >
                <iframe
                  key={`fullscreen-${selectedOption?.id || "none"}-${selectedOption?.files?.["src/App.tsx"]?.length || 0}`}
                  title="Design Fullscreen Sandbox"
                  srcDoc={getPreviewSourceDoc(selectedOption)}
                  className="w-full h-full border-none bg-[#09090b]"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
                />
              </div>
            </div>

            <div className="flex items-center justify-between bg-[#0c0c0f] border border-zinc-800 p-3 rounded-xl mt-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400 font-mono">
                  Variants:
                </span>
                {options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedOptionId(opt.id)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                      selectedOptionId === opt.id
                        ? "bg-yellow-500 text-black font-bold"
                        : "bg-zinc-900 text-zinc-400 hover:text-white"
                    }`}
                  >
                    {opt.name}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveDesign}
                  className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-medium border border-zinc-700 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <BookmarkCheck size={13} className="text-yellow-400" /> Save
                  Design
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsFullscreenPreview(false);
                    handleOpenCreateProjectModal();
                  }}
                  className="px-4 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Sparkles size={13} /> Create Project from Design
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Explicit Create Project from Design Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans select-none"
          >
            <div className="max-w-md w-full bg-[#0c0c0f] border border-zinc-800 p-6 rounded-2xl space-y-4 text-left shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Sparkles size={16} className="text-yellow-400" />
                  <span>Create Project from Design</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-zinc-500 hover:text-white p-1 rounded hover:bg-zinc-900 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">
                Provide a project name and description to convert this design
                layout into an active workspace project in{" "}
                <strong className="text-zinc-200">My Projects</strong>.
              </p>

              <form onSubmit={handleConfirmCreateProject} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300 block uppercase tracking-wider text-[10px]">
                    Project Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. FitPulse Tracker App"
                    value={projectNameInput}
                    onChange={(e) => setProjectNameInput(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-yellow-500 font-sans"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300 block uppercase tracking-wider text-[10px]">
                    Project Description (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Brief description of the workspace goals..."
                    value={projectDescInput}
                    onChange={(e) => setProjectDescInput(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-yellow-500 resize-none font-sans"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800/80">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 font-medium text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-yellow-500/20"
                  >
                    <Sparkles size={13} /> Confirm & Create Project
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Save Toast Banner */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-[100] bg-yellow-500 text-black font-bold text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-yellow-400"
          >
            <CheckCircle2 size={16} />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Personal API Key Modal */}
      <AnimatePresence>
        {isApiKeyModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <div className="max-w-md w-full bg-[#0c0c0f] border border-zinc-800 p-6 rounded-2xl space-y-4 text-left shadow-2xl">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Key size={16} className="text-yellow-400" />
                  <span>Gemini API Key Configuration</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsApiKeyModalOpen(false)}
                  className="text-zinc-500 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">
                By default, Design Studio uses shared workspace rate limits.
                Optionally add your own personal Google Gemini API key to run
                uninterrupted high-speed design generations.
              </p>

              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-300">
                  API Key
                </label>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={customApiKey}
                  onChange={(e) => setCustomApiKey(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-yellow-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem("personal_gemini_api_key");
                    setCustomApiKey("");
                    setUseSandboxKey(true);
                    setIsApiKeyModalOpen(false);
                  }}
                  className="text-xs text-zinc-500 hover:text-zinc-300 font-mono"
                >
                  Use Shared Quota
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveApiKey(customApiKey)}
                  disabled={isSavingKey}
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {isSavingKey ? (
                    <RefreshCw size={13} className="animate-spin" />
                  ) : (
                    "Save API Key"
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Design() {
  return (
    <DesignStudioErrorBoundary>
      <DesignInner />
    </DesignStudioErrorBoundary>
  );
}

export default Design;
