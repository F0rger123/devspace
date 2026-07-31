// src/lib/mockBlueprints.ts

export function generateMockStitchResponse(prompt: string, personality: string, optionsCount: number = 2): any {
  const norm = prompt.toLowerCase();
  
  // Determine application archetype
  let archetype = "custom_app";
  let promptClean = prompt.trim();
  if (promptClean.length > 40) promptClean = promptClean.substring(0, 37) + '...';
  let title = promptClean ? (promptClean.charAt(0).toUpperCase() + promptClean.slice(1)) : "Custom Interactive Application";
  let subTitle = "Multi-Page Interactive Prototype & Layout System";
  
  if (norm.includes("apex") || norm.includes("ugr") || norm.includes("racing") || norm.includes("car") || norm.includes("speed") || norm.includes("tuning")) {
    archetype = "apex_ugr";
    title = "Apex Underground Racing Portal";
    subTitle = "Immersive Glass-Morphism Performance & Telemetry Command";
  } else if (norm.includes("todo") || norm.includes("task") || norm.includes("list") || norm.includes("kanban")) {
    archetype = "todo";
    title = "Sprint Kanban Task Manager";
    subTitle = "Sleek Task Execution & Progress Metrics";
  } else if (norm.includes("calc") || norm.includes("math") || norm.includes("matrix") || norm.includes("formula")) {
    archetype = "calc";
    title = "Scientific & Matrix Calculator Studio";
    subTitle = "High-Precision Scientific and Graphing Calculations";
  } else if (norm.includes("weather") || norm.includes("forecast") || norm.includes("radar")) {
    archetype = "weather";
    title = "Aether Weather Forecast Station";
    subTitle = "Meteorological Intelligence & Alerts Dashboard";
  } else if (norm.includes("finance") || norm.includes("budget") || norm.includes("expense") || norm.includes("money")) {
    archetype = "finance";
    title = "Strategic Expense & Wealth Hub";
    subTitle = "Asset Allocations & Expenditure Diagnostics";
  } else if (norm.includes("chat") || norm.includes("message") || norm.includes("slack")) {
    archetype = "chat";
    title = "Synaptic Channel Messenger";
    subTitle = "Team Orchestration & Multi-Agent Chats";
  } else if (norm.includes("note") || norm.includes("journal") || norm.includes("wiki") || norm.includes("editor")) {
    archetype = "notes";
    title = "Obsidian Synaptic Markdown Editor";
    subTitle = "Persistent Knowledge Graphs & Drafts";
  }

  // Construct a beautiful App.tsx code template with dynamic option styling
  const appCodeBase = `import React, { useState, useEffect } from 'react';
import { 
  Sparkles, CheckCircle2, Circle, Plus, Trash2, ShieldAlert,
  ChevronRight, Compass, Settings, Zap, ArrowRight, Activity, MessageSquare,
  TrendingUp, DollarSign, Calendar, CloudSun, Thermometer, Wind, RefreshCw, 
  Send, Bot, BookOpen, Clock, Play, FileText, Search, User, Shield, Info, Check, AlertCircle, AlertTriangle,
  Gauge, MapPin, Coins, ShoppingBag, Upload, Trophy, Eye, Car, Sliders, Map
} from 'lucide-react';

export default function App() {
  const [optionId] = useState("##OPTION_ID##");
  const [activeTab, setActiveTab] = useState<'dashboard' | 'sandbox' | 'agent-chat' | 'extra'>('dashboard');
  const [errorBanner, setErrorBanner] = useState<string | null>(
    optionId === 'option-3' 
      ? "🛡️ Shield Guard Active: Enterprise CORS policies & local-first offline storage verification passes."
      : optionId === 'option-2'
        ? "✨ Aurora Customizer Active: Click on different parameters or theme presets below to customize live render styles."
        : "⚠️ Note: Running in Secure Offline Sandbox Mode (Using highly capable local Aether engine)."
  );

  // Custom Toast state (replaces window.alert for tasteful UI)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);

  const triggerToast = (msg: string, type: 'success' | 'info' | 'warning' = 'info') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // --- Theme Customization States (For Aurora option-2) ---
  const [selectedTheme, setSelectedTheme] = useState<'aurora' | 'cyber' | 'deep-space'>('aurora');

  // --- Dynamic Prompt Archetype States & Behaviors ---
  const [promptConcept] = useState("${prompt.replace(/"/g, '\\"').replace(/\n/g, ' ')}");
  const [archetype] = useState("${archetype}");
  
  // 1. Todo State
  const [todos, setTodos] = useState([
    { id: '1', text: 'Structure main navigation bar', completed: true, priority: 'High' },
    { id: '2', text: 'Wire up LocalStorage cache engine', completed: true, priority: 'High' },
    { id: '3', text: 'Integrate SVG Graphing Components', completed: false, priority: 'Medium' },
    { id: '4', text: 'Calibrate voice recognition wake words', completed: false, priority: 'Low' }
  ]);
  const [newTodo, setNewTodo] = useState('');
  
  // 2. Calculator State
  const [calcInput, setCalcInput] = useState('');
  const [calcHistory, setCalcHistory] = useState<string[]>(['12 + 45 = 57', 'sqrt(144) = 12']);
  
  // 3. Weather State
  const [weatherCity, setWeatherCity] = useState('San Francisco');
  const [weatherTemp, setWeatherTemp] = useState(68);
  const [weatherCondition, setWeatherCondition] = useState('Partly Cloudy');
  
  // 4. Finance State
  const [transactions, setTransactions] = useState([
    { id: '1', desc: 'SaaS Cloud Servers', amount: -49.99, cat: 'Infrastructure', date: 'Today' },
    { id: '2', desc: 'Direct Stripe Deposit', amount: 2450.00, cat: 'Income', date: 'Yesterday' },
    { id: '3', desc: 'OpenAI Token Quota', amount: -15.40, cat: 'AI API Cost', date: '3 days ago' }
  ]);
  const [txDesc, setTxDesc] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState('Development');

  // Chat Log States
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { role: 'model', text: 'Greetings! I am Aether, your resident architectural assistant. I have compiled this interactive client prototype based on your concept. How can I assist you in building or testing further?' }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  // Shared Notes Pad
  const [scratchpad, setScratchpad] = useState(
    "# Quick Scratchpad\\n\\nUse this note card to draft architecture specs, list database schemas, or capture local state configurations!"
  );

  // Security Simulator States (for option-3)
  const [corsPolicy, setCorsPolicy] = useState('Strict-Same-Origin');
  const [threatSimActive, setThreatSimActive] = useState(false);
  const [securityLogs, setSecurityLogs] = useState<string[]>([
    "System booted inside isolated container sandbox...",
    "Local database encryption key initialized successfully.",
    "CORS request intercepted & allowed for localhost testing."
  ]);

  // --- Apex UGR State ---
  const [cars, setCars] = useState([
    { id: '1', make: 'Porsche', model: '911 GT3 RS', year: '2023', hp: '518', weight: '3152 lbs', parts: ['Carbon Wing', 'Exhaust Bypass'] },
    { id: '2', make: 'Nissan', model: 'GT-R R35', year: '2021', hp: '600', weight: '3865 lbs', parts: ['ECU Remap', 'Downpipes'] }
  ]);
  const [newMake, setNewMake] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newYear, setNewYear] = useState('');
  const [newHp, setNewHp] = useState('');
  const [newWeight, setNewWeight] = useState('');

  const [activeMarket, setActiveMarket] = useState('amazon');
  const [cart, setCart] = useState([]);
  const [betCredits, setBetCredits] = useState(5000);
  const [betAmount, setBetAmount] = useState('');
  const [selectedRace, setSelectedRace] = useState('race-1');
  const [selectedWinner, setSelectedWinner] = useState('racer-a');

  const [meets, setMeets] = useState([
    { id: '1', name: 'Midnight Tunnel Run', location: 'Section-B Highway Tunnel', time: 'Tonight 11:30 PM', coords: '37.7749° N, 122.4194° W', host: 'Apex_UGR_Official' },
    { id: '2', name: 'Industrial Dockside Meet & Drag', location: 'Warehouse 12 Pier 3', time: 'Friday 10:00 PM', coords: '37.8044° N, 122.2711° W', host: 'DocksideRacers' }
  ]);
  const [meetName, setMeetName] = useState('');
  const [meetLoc, setMeetLoc] = useState('');
  const [meetTime, setMeetTime] = useState('');

  const [simSpeed, setSimSpeed] = useState(0);
  const [simRPM, setSimRPM] = useState(1000);
  const [simulatingRace, setSimulatingRace] = useState(false);

  const marketParts = {
    amazon: [
      { id: 'a1', name: 'Performance Air Filter', price: 49.99, rating: '4.8', store: 'Amazon' },
      { id: 'a2', name: 'OBD2 Diagnostic Scanner', price: 89.95, rating: '4.6', store: 'Amazon' }
    ],
    american_muscle: [
      { id: 'am1', name: 'Corsa Extreme Cat-Back Exhaust', price: 1450.00, rating: '4.9', store: 'American Muscle' },
      { id: 'am2', name: 'Eibach Lowering Springs Kit', price: 299.99, rating: '4.7', store: 'American Muscle' }
    ],
    autozone: [
      { id: 'az1', name: 'Duralast Gold Brake Rotors (Pair)', price: 159.99, rating: '4.5', store: 'AutoZone' },
      { id: 'az2', name: 'Castrol EDGE 5W-30 Full Synthetic 5qt', price: 38.99, rating: '4.8', store: 'AutoZone' }
    ],
    ebay: [
      { id: 'eb1', name: 'Brembo Calipers Front Red OEM', price: 650.00, rating: '4.4', store: 'eBay' },
      { id: 'eb2', name: 'Carbon Fiber Duckbill Spoiler R35', price: 420.00, rating: '4.6', store: 'eBay' }
    ]
  };

  const activeRaces = [
    { id: 'race-1', racerA: 'Alpha GT-R (3.5x)', racerB: 'Phantom Turbo S (1.8x)', prize: '10,000 Credits', track: 'Underground Highway 101' },
    { id: 'race-2', racerA: 'Apex Huracan (2.1x)', racerB: 'Specter Corvette C8 (2.5x)', prize: '15,000 Credits', track: 'Industrial Docks Loop' }
  ];

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');
    setIsTyping(true);

    setTimeout(() => {
      let reply = "I've noted that requirement! Since we are currently running in Offline Sandbox Mode, I will store this spec locally in your browser cache. Once you bind a custom API key, I can execute full code rewrites of this prototype!";
      
      const norm = userMsg.toLowerCase();
      if (norm.includes("hello") || norm.includes("hi")) {
        reply = "Hello! I am Aether. I am here to orchestrate and model your workspace components in real-time. What shall we design next?";
      } else if (norm.includes("todo") || norm.includes("task")) {
        reply = "I see you are focused on task management. Our active prototype features a full interactive Kanban column. Let's make sure our state transitions are responsive!";
      } else if (norm.includes("calc") || norm.includes("math")) {
        reply = "Fascinating! Complex computations can be mapped directly onto our scientific matrix layout. Let me know if you would like me to draft a solver logic snippet.";
      } else if (norm.includes("weather") || norm.includes("temp")) {
        reply = "Atmospheric diagnostics are updated in our live weather panel. Feel free to search other regions to update simulated pressure and temperature curves.";
      } else if (norm.includes("finance") || norm.includes("budget") || norm.includes("money")) {
        reply = "Fiscal telemetry is key for operational success. Check out our finance ledger under the interactive sandbox widget to log new line items!";
      }

      setChatMessages(prev => [...prev, { role: 'model', text: reply }]);
      setIsTyping(false);
    }, 1200);
  };

  // Determine styles & theme classes based on optionId
  const getThemeClasses = () => {
    if (archetype === 'apex_ugr') {
      if (optionId === 'option-2') {
        return {
          bg: "bg-black text-white",
          card: "bg-black/50 border border-emerald-500/25 shadow-[0_0_30px_rgba(16,185,129,0.08)] backdrop-blur-xl rounded-2xl",
          header: "border-b border-zinc-900 bg-black/80 backdrop-blur-md",
          tabActive: "bg-emerald-500 text-black font-extrabold shadow-[0_0_15px_rgba(16,185,129,0.4)]",
          badge: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40",
          accentText: "text-emerald-400"
        };
      }
      if (optionId === 'option-3') {
        return {
          bg: "bg-[#060608] text-white",
          card: "bg-zinc-950/80 border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.06)] backdrop-blur-lg rounded-2xl",
          header: "border-b border-zinc-900 bg-black/90",
          tabActive: "bg-red-600 text-white font-extrabold shadow-[0_0_15px_rgba(239,68,68,0.3)]",
          badge: "bg-red-500/15 text-red-400 border border-red-500/30",
          accentText: "text-red-400"
        };
      }
      return {
        bg: "bg-[#040405] text-white",
        card: "bg-zinc-900/60 border border-zinc-800 shadow-xl backdrop-blur-md rounded-2xl",
        header: "border-b border-zinc-850 bg-black/70 backdrop-blur-md",
        tabActive: "bg-white text-black font-extrabold shadow-[0_2px_10px_rgba(255,255,255,0.15)]",
        badge: "bg-zinc-800 text-zinc-300 border border-zinc-750",
        accentText: "text-white"
      };
    }

    if (optionId === 'option-2') {
      if (selectedTheme === 'cyber') return {
        bg: "bg-[#05050d] text-cyan-100",
        card: "bg-[#0b0c16] border-cyan-500/20 hover:border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.05)]",
        header: "border-b border-cyan-950 bg-[#070814]/90",
        tabActive: "bg-cyan-600 text-black font-extrabold shadow-[0_0_10px_rgba(6,182,212,0.3)]",
        badge: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
        accentText: "text-cyan-400"
      };
      if (selectedTheme === 'deep-space') return {
        bg: "bg-[#020204] text-zinc-100",
        card: "bg-[#07070a] border-zinc-800 hover:border-zinc-700 shadow-none",
        header: "border-b border-zinc-900 bg-black/90",
        tabActive: "bg-yellow-500 text-black font-bold shadow",
        badge: "bg-zinc-800 text-zinc-400 border border-zinc-700",
        accentText: "text-yellow-400"
      };
      // Default Aurora
      return {
        bg: "bg-[#04040a] text-amber-50",
        card: "bg-white/[0.02] border-yellow-500/15 hover:border-yellow-500/30 shadow-[0_4px_24px_rgba(234,179,8,0.04)] backdrop-blur-md",
        header: "border-b border-zinc-900 bg-[#080814]/80",
        tabActive: "bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold shadow-[0_2px_12px_rgba(234,179,8,0.2)]",
        badge: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
        accentText: "text-amber-400"
      };
    }
    if (optionId === 'option-3') {
      return {
        bg: "bg-[#090a0f] text-zinc-100",
        card: "bg-[#0f111a] border-zinc-800 hover:border-zinc-750",
        header: "border-b border-zinc-850 bg-[#0d0e15]",
        tabActive: "bg-yellow-500 text-black font-bold shadow",
        badge: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
        accentText: "text-amber-400"
      };
    }
    if (optionId === 'option-4') {
      return {
        bg: "bg-[#030706] text-emerald-100",
        card: "bg-[#08120e] border-emerald-500/20 hover:border-emerald-500/40 shadow-[0_4px_24px_rgba(16,185,129,0.05)]",
        header: "border-b border-emerald-950/80 bg-[#050f0b]/90",
        tabActive: "bg-emerald-500 text-black font-extrabold shadow-[0_0_12px_rgba(16,185,129,0.3)]",
        badge: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30",
        accentText: "text-emerald-400"
      };
    }
    // Default standard Slate option-1
    return {
      bg: "bg-[#07070a] text-zinc-100",
      card: "bg-[#0d0d12] border-zinc-850 hover:border-zinc-800",
      header: "border-b border-zinc-850 bg-[#0c0c11]/90",
      tabActive: "bg-yellow-500 text-black font-bold shadow",
      badge: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
      accentText: "text-yellow-400"
    };
  };

  const theme = getThemeClasses();

  return (
    <div className={\`min-h-screen flex flex-col \${theme.bg} font-sans transition-all duration-300 relative\`}>
      
      {/* Dynamic Background Effects for Option 2 (Aurora) */}
      {optionId === 'option-2' && (
        <>
          <div className="absolute top-0 left-10 w-96 h-96 bg-teal-500/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-20 right-10 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
        </>
      )}

      {/* Slide-in Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0f111a] border border-zinc-800 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce">
          <span className="p-1 rounded-full bg-emerald-500/10 text-emerald-400">
            <Check size={14} />
          </span>
          <span className="text-xs font-semibold text-zinc-200">{toast.message}</span>
        </div>
      )}

      {/* Top Warning Banner */}
      {errorBanner && (
        <div className="bg-gradient-to-r from-amber-950/80 to-amber-900/60 border-b border-amber-850/50 px-4 py-2.5 text-[11px] font-mono text-amber-200 flex items-center justify-between shadow-md z-10">
          <span className="flex items-center gap-2">
            <ShieldAlert size={14} className="text-amber-400 shrink-0" />
            {errorBanner}
          </span>
          <button 
            onClick={() => setErrorBanner(null)} 
            className="text-amber-300 hover:text-white hover:bg-white/10 rounded px-1.5 py-0.5 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Header */}
      <header className={\`px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 z-10 \${theme.header}\`}>
        <div>
          <div className="flex items-center gap-2">
            <span className={\`p-1.5 rounded-lg text-white shadow-lg \${
              optionId === 'option-2' 
                ? 'bg-gradient-to-tr from-teal-500 to-indigo-500' 
                : optionId === 'option-3'
                  ? 'bg-gradient-to-tr from-amber-600 to-red-600'
                  : 'bg-gradient-to-tr from-purple-600 to-indigo-600'
            }\`}>
              {optionId === 'option-3' ? <Shield size={16} /> : <Sparkles size={16} />}
            </span>
            <h1 className="text-lg font-semibold tracking-tight text-white font-mono">${title}</h1>
          </div>
          <p className="text-[11px] text-zinc-400 font-mono mt-0.5">${subTitle}</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-[#121218] border border-zinc-800 p-1 rounded-lg self-start md:self-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={\`px-3.5 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer \${
              activeTab === 'dashboard' 
                ? theme.tabActive 
                : 'text-zinc-400 hover:text-white hover:bg-zinc-850/50'
            }\`}
          >
            Dashboard
          </button>
          
          {optionId === 'option-2' && (
            <button
              onClick={() => setActiveTab('extra')}
              className={\`px-3.5 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer \${
                activeTab === 'extra' 
                  ? theme.tabActive 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-850/50'
              }\`}
            >
              Aurora Studio ✨
            </button>
          )}

          {optionId === 'option-3' && (
            <button
              onClick={() => setActiveTab('extra')}
              className={\`px-3.5 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer \${
                activeTab === 'extra' 
                  ? theme.tabActive 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-850/50'
              }\`}
            >
              Shield Diagnostics 🛡️
            </button>
          )}

          <button
            onClick={() => setActiveTab('sandbox')}
            className={\`px-3.5 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer \${
              activeTab === 'sandbox' 
                ? theme.tabActive 
                : 'text-zinc-400 hover:text-white hover:bg-zinc-850/50'
            }\`}
          >
            Interactive Sandbox
          </button>
          <button
            onClick={() => setActiveTab('agent-chat')}
            className={\`px-3.5 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer \${
              activeTab === 'agent-chat' 
                ? theme.tabActive 
                : 'text-zinc-400 hover:text-white hover:bg-zinc-850/50'
            }\`}
          >
            Assistant Co-Pilot
          </button>
        </div>
      </header>

      {/* Content Container */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 z-10">
        
        {/* Left Column (Main Work Area) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {activeTab === 'dashboard' && (
            <>
              {/* Prompt Context Card */}
              <div className={\`p-5 border rounded-xl relative overflow-hidden \${theme.card}\`}>
                <div className="absolute top-0 right-0 p-3 text-indigo-500/5 pointer-events-none">
                  <Compass size={120} />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={\`text-[10px] uppercase tracking-wider font-mono border px-2 py-0.5 rounded \${theme.badge}\`}>
                    Prompt Concept Spec
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded font-mono border border-indigo-900/30">
                    {optionId === 'option-2' ? 'Celestial Fidelity' : optionId === 'option-3' ? 'Secured Sandbox' : 'Standard Synthesis'}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-white font-mono mb-2">Architectural Directive</h3>
                <p className="text-xs text-zinc-300 leading-relaxed font-sans italic bg-zinc-950/40 p-3 rounded-lg border border-zinc-850">
                  "{promptConcept}"
                </p>
              </div>

              {/* Archetype Quick Preview Widget */}
              <div className={\`p-5 border rounded-xl \${theme.card}\`}>
                <h3 className="text-sm font-semibold font-mono text-white mb-4 flex items-center justify-between border-b border-zinc-850 pb-2">
                  <span>Interactive Component Blueprint</span>
                  <span className="text-xs font-normal text-zinc-400">Mock Data Feed</span>
                </h3>

                {/* RENDER CHOSEN ARCHETYPE */}
                {archetype === 'todo' && (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={newTodo}
                        onChange={(e) => setNewTodo(e.target.value)}
                        placeholder="Add urgent project requirement..."
                        className="flex-1 bg-[#15151c] border border-zinc-800 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-yellow-500 font-sans"
                      />
                      <button 
                        onClick={() => {
                          if (!newTodo.trim()) return;
                          setTodos(prev => [...prev, { id: Date.now().toString(), text: newTodo, completed: false, priority: 'Medium' }]);
                          setNewTodo('');
                          triggerToast("Task added successfully!", "success");
                        }}
                        className={\`text-xs font-medium px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer \${
                          optionId === 'option-2' 
                            ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold' 
                            : 'bg-yellow-500 hover:bg-yellow-400 text-black font-bold'
                        }\`}
                      >
                        <Plus size={14} /> Add
                      </button>
                    </div>

                    <div className="border border-zinc-850 rounded-lg divide-y divide-zinc-850 overflow-hidden bg-zinc-950/30">
                      {todos.map(todo => (
                        <div key={todo.id} className="p-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                          <button 
                            onClick={() => {
                              setTodos(prev => prev.map(t => t.id === todo.id ? { ...t, completed: !t.completed } : t));
                              triggerToast("Task status updated.", "info");
                            }}
                            className="flex items-center gap-3 text-left cursor-pointer"
                          >
                            {todo.completed ? (
                              <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                            ) : (
                              <Circle size={16} className="text-zinc-600 hover:text-indigo-500 shrink-0" />
                            )}
                            <span className={\`text-xs font-sans \${todo.completed ? 'line-through text-zinc-500' : 'text-zinc-200'}\`}>
                              {todo.text}
                            </span>
                          </button>
                          <div className="flex items-center gap-2">
                            <span className={\`text-[9px] px-1.5 py-0.5 rounded font-mono border \${
                              todo.priority === 'High' || todo.priority === 'Critical'
                                ? 'bg-red-950/40 text-red-400 border-red-900/30'
                                : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                            }\`}>
                              {todo.priority}
                            </span>
                            <button 
                              onClick={() => {
                                setTodos(prev => prev.filter(t => t.id !== todo.id));
                                triggerToast("Task removed.", "warning");
                              }}
                              className="text-zinc-500 hover:text-red-400 p-1 cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {archetype === 'calc' && (
                  <div className="max-w-md mx-auto bg-[#14141d] border border-zinc-800 rounded-xl p-4 shadow-xl">
                    <div className="bg-zinc-950 border border-zinc-850 p-3.5 rounded-lg text-right font-mono text-xl text-emerald-400 h-14 flex items-center justify-end overflow-hidden mb-3">
                      {calcInput || '0'}
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '0', '.', '=', '+', 'C'].map((btn) => (
                        <button
                          key={btn}
                          onClick={() => {
                            if (btn === 'C') {
                              setCalcInput('');
                            } else if (btn === '=') {
                              try {
                                const res = eval(calcInput);
                                setCalcHistory(prev => [\`\${calcInput} = \${res}\`, ...prev].slice(0, 5));
                                setCalcInput(String(res));
                                triggerToast("Calculation completed.", "success");
                              } catch {
                                setCalcInput('Error');
                              }
                            } else {
                              setCalcInput(prev => prev === 'Error' ? btn : prev + btn);
                            }
                          }}
                          className={\`p-3 font-mono text-xs rounded-lg transition-colors font-semibold cursor-pointer \${
                            btn === '=' 
                              ? 'bg-indigo-600 hover:bg-indigo-500 text-white' 
                              : btn === 'C'
                                ? 'bg-red-950/40 text-red-400 hover:bg-red-900/40 border border-red-900/30'
                                : 'bg-[#1e1e28] hover:bg-[#252535] text-zinc-200'
                          }\`}
                        >
                          {btn}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {archetype === 'weather' && (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={weatherCity}
                        onChange={(e) => setWeatherCity(e.target.value)}
                        placeholder="Search meteorological region..."
                        className="flex-1 bg-[#15151c] border border-zinc-800 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-500 font-sans"
                      />
                      <button 
                        onClick={() => {
                          setWeatherTemp(Math.floor(Math.random() * 30) + 55);
                          const conds = ['Stormy', 'Sunny', 'Heavy Rain', 'Drizzle', 'Overcast', 'Aurora Light Show'];
                          setWeatherCondition(conds[Math.floor(Math.random() * conds.length)]);
                          triggerToast("Meteorological telemetry updated.", "success");
                        }}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <RefreshCw size={14} /> Update
                      </button>
                    </div>

                    <div className="p-4 bg-gradient-to-br from-[#121620] to-[#0c0f17] border border-blue-950/40 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
                      <div className="flex items-center gap-4">
                        <span className="p-3 bg-blue-950/50 border border-blue-900/30 text-blue-400 rounded-xl">
                          <CloudSun size={32} />
                        </span>
                        <div>
                          <h4 className="text-base font-semibold text-white font-mono">{weatherCity}</h4>
                          <p className="text-xs text-blue-300 font-sans">{weatherCondition}</p>
                        </div>
                      </div>
                      <div className="flex gap-6">
                        <div className="text-right">
                          <p className="text-[10px] text-zinc-400 font-mono">Simulated Temperature</p>
                          <p className="text-xl font-bold font-mono text-white mt-1">{weatherTemp}°F</p>
                        </div>
                        <div className="border-l border-zinc-850 h-10 self-center"></div>
                        <div>
                          <p className="text-[10px] text-zinc-400 font-mono">Atmospheric Telemetry</p>
                          <p className="text-xs font-semibold text-zinc-200 mt-1 flex items-center gap-1">
                            <Wind size={12} className="text-blue-400" /> 12 mph
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {archetype === 'finance' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input 
                        type="text" 
                        value={txDesc}
                        onChange={(e) => setTxDesc(e.target.value)}
                        placeholder="Expense/Income description"
                        className="bg-[#15151c] border border-zinc-800 rounded-lg px-3.5 py-2 text-xs focus:outline-none font-sans"
                      />
                      <input 
                        type="number" 
                        value={calcInput}
                        onChange={(e) => setCalcInput(e.target.value)}
                        placeholder="Amount (e.g. -45.00)"
                        className="bg-[#15151c] border border-zinc-800 rounded-lg px-3.5 py-2 text-xs focus:outline-none font-sans font-mono text-emerald-400"
                      />
                      <button 
                        onClick={() => {
                          const amt = parseFloat(calcInput);
                          if (!txDesc.trim() || isNaN(amt)) return;
                          setTransactions(prev => [
                            { id: Date.now().toString(), desc: txDesc, amount: amt, cat: txCategory, date: 'Just now' },
                            ...prev
                          ]);
                          setTxDesc('');
                          setCalcInput('');
                          triggerToast("Transaction entry logged.", "success");
                        }}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-4 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Plus size={14} /> Log Entry
                      </button>
                    </div>

                    <div className="border border-zinc-850 rounded-lg divide-y divide-zinc-850 overflow-hidden bg-zinc-950/30">
                      {transactions.map(tx => (
                        <div key={tx.id} className="p-3 flex items-center justify-between hover:bg-white/[0.01] transition-colors">
                          <div className="flex items-center gap-2.5">
                            <span className={\`p-1.5 rounded-md text-xs font-mono font-bold \${
                              tx.amount < 0 ? 'bg-red-950/40 text-red-400 border border-red-900/20' : 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/20'
                            }\`}>
                              {tx.amount < 0 ? '-' : '+'}\${Math.abs(tx.amount).toFixed(2)}
                            </span>
                            <span className="text-xs font-sans text-zinc-200">{tx.desc}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded font-mono">
                              {tx.cat}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono">{tx.date}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {archetype === 'custom_app' && (
                  <div className="space-y-6">
                    <div className="p-4 bg-zinc-950/60 border border-indigo-500/20 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-900/40">
                          Custom Prototype Active
                        </span>
                        <h4 className="text-base font-bold text-white font-mono mt-1">{title}</h4>
                        <p className="text-xs text-zinc-400 font-sans mt-0.5">{subTitle}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-900/40 px-3 py-1 rounded-lg flex items-center gap-1.5 font-bold">
                          <CheckCircle2 size={13} /> Interactive Front-End Ready
                        </span>
                      </div>
                    </div>

                    {/* Interactive Item Management Workspace */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-bold font-mono text-zinc-300 uppercase tracking-wider">Active State Workspace Items</h5>
                        <span className="text-[11px] font-mono text-zinc-500">{todos.length} Records Loaded</span>
                      </div>

                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={newTodo}
                          onChange={(e) => setNewTodo(e.target.value)}
                          placeholder={"Add new record or item for " + title + "..."}
                          className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 font-sans"
                        />
                        <button 
                          onClick={() => {
                            if (!newTodo.trim()) return;
                            setTodos(prev => [...prev, { id: Date.now().toString(), text: newTodo, completed: false, priority: 'High' }]);
                            setNewTodo('');
                            triggerToast("Item added to prototype state!", "success");
                          }}
                          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold font-mono text-xs uppercase rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                        >
                          <Plus size={14} /> Add Record
                        </button>
                      </div>

                      <div className="border border-zinc-800 rounded-xl divide-y divide-zinc-850 overflow-hidden bg-zinc-950/40">
                        {todos.map(item => (
                          <div key={item.id} className="p-3.5 flex items-center justify-between hover:bg-zinc-900/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <button 
                                onClick={() => {
                                  setTodos(prev => prev.map(t => t.id === item.id ? { ...t, completed: !t.completed } : t));
                                  triggerToast("Status updated.", "info");
                                }}
                                className="text-zinc-400 hover:text-indigo-400 cursor-pointer"
                              >
                                {item.completed ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Circle size={16} />}
                              </button>
                              <span className={"text-xs font-sans " + (item.completed ? 'line-through text-zinc-500' : 'text-zinc-200 font-medium')}>
                                {item.text}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                                {item.priority}
                              </span>
                              <button 
                                onClick={() => {
                                  setTodos(prev => prev.filter(t => t.id !== item.id));
                                  triggerToast("Record removed.", "warning");
                                }}
                                className="text-zinc-500 hover:text-red-400 p-1 cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {archetype === 'apex_ugr' && (
                  <div className="space-y-6 text-white">
                    {/* Animated Neon Heading and Fast-Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl border border-emerald-500/20 bg-black/40 backdrop-blur-md flex items-center justify-between">
                        <div>
                          <p className="text-[10px] uppercase font-mono tracking-wider text-zinc-400">Digital Race Wallet</p>
                          <p className="text-xl font-bold font-mono text-emerald-400 mt-0.5">{betCredits.toLocaleString()} CR</p>
                        </div>
                        <Coins className="text-emerald-400 h-6 w-6 animate-pulse" />
                      </div>
                      <div className="p-4 rounded-xl border border-emerald-500/20 bg-black/40 backdrop-blur-md flex items-center justify-between">
                        <div>
                          <p className="text-[10px] uppercase font-mono tracking-wider text-zinc-400">Active Speedway RPM</p>
                          <p className="text-xl font-bold font-mono text-white mt-0.5">{simulatingRace ? simRPM : 0} RPM</p>
                        </div>
                        <Gauge className="text-emerald-400 h-6 w-6" />
                      </div>
                      <div className="p-4 rounded-xl border border-emerald-500/20 bg-black/40 backdrop-blur-md flex items-center justify-between">
                        <div>
                          <p className="text-[10px] uppercase font-mono tracking-wider text-zinc-400">Underground Speed</p>
                          <p className="text-xl font-bold font-mono text-white mt-0.5">{simulatingRace ? simSpeed : 0} MPH</p>
                        </div>
                        <Trophy className="text-emerald-400 h-6 w-6" />
                      </div>
                    </div>

                    {/* Speed Telemetry & Race Simulation Section */}
                    <div className="p-5 rounded-2xl border border-emerald-500/20 bg-black/50 backdrop-blur-lg relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-3 pointer-events-none opacity-15">
                        <Car className="h-44 w-44 text-emerald-500" />
                      </div>
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
                        <div>
                          <h4 className="text-xs uppercase font-mono tracking-wider text-emerald-400 font-bold">Racer Live Location & Speed Telemetry</h4>
                          <p className="text-[11px] text-zinc-400">Dynamic G-force radar vector simulation</p>
                        </div>
                        <button 
                          onClick={() => {
                            if (simulatingRace) return;
                            setSimulatingRace(true);
                            triggerToast("Engaging race simulation... Launch Control Active!", "success");
                            let speed = 0;
                            let rpm = 1000;
                            const interval = setInterval(() => {
                              speed += Math.floor(Math.random() * 12) + 8;
                              rpm = 3000 + Math.floor(Math.random() * 4000);
                              if (speed >= 185) {
                                speed = 185;
                                rpm = 1000;
                                clearInterval(interval);
                                setSimulatingRace(false);
                                triggerToast("Race simulation finished! Coordinates logged.", "info");
                              }
                              setSimSpeed(speed);
                              setSimRPM(rpm);
                            }, 100);
                          }}
                          disabled={simulatingRace}
                          className="px-4 py-2 bg-emerald-500 text-black hover:bg-emerald-400 disabled:bg-zinc-850 disabled:text-zinc-500 font-mono text-[10px] uppercase font-black tracking-widest rounded-lg transition-all"
                        >
                          {simulatingRace ? "RACING..." : "LAUNCH RACE"}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Simulated Canvas Map and Dial */}
                        <div className="h-48 bg-zinc-950 border border-zinc-850 rounded-xl relative flex items-center justify-center overflow-hidden">
                          {/* Simulated Speed Dial */}
                          <div className="text-center z-10">
                            <span className="text-4xl font-extrabold font-mono tracking-tight text-white block">
                              {simulatingRace ? simSpeed : "00"}
                            </span>
                            <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 block mt-1">
                              Current MPH
                            </span>
                          </div>

                          {/* Radar Scan Circle and racing lanes */}
                          <div className="absolute inset-0 border border-emerald-500/5 rounded-full m-8 animate-ping opacity-25" />
                          <div className="absolute h-full w-[2px] bg-emerald-500/10 left-1/2 transform -translate-x-1/2" />
                          <div className="absolute w-full h-[2px] bg-emerald-500/10 top-1/2 transform -translate-y-1/2" />
                          <div className="absolute bottom-6 left-12 h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                          <div className="absolute top-10 right-24 h-2 w-2 rounded-full bg-emerald-400 animate-bounce" />
                          <div className="absolute top-1/2 left-1/3 h-4 w-4 rounded-full border border-emerald-500/30 flex items-center justify-center">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          </div>
                        </div>

                        {/* Interactive Betting Section */}
                        <div className="space-y-4">
                          <h5 className="text-[11px] uppercase font-mono tracking-wider text-zinc-300 font-bold">Place Digital Bets</h5>
                          <div className="space-y-2">
                            {activeRaces.map((race) => (
                              <div 
                                key={race.id} 
                                onClick={() => setSelectedRace(race.id)}
                                className={"p-3 rounded-lg border text-left cursor-pointer transition-all " + (selectedRace === race.id ? "border-emerald-500/40 bg-emerald-500/5" : "border-zinc-850 bg-zinc-900/40 hover:border-zinc-800")}
                              >
                                <div className="flex justify-between items-center text-xs">
                                  <span className="font-bold text-zinc-200">{race.track}</span>
                                  <span className="text-[9px] font-mono text-emerald-400">{race.prize}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); setSelectedRace(race.id); setSelectedWinner('racer-a'); }}
                                    className={"py-1 text-[9px] font-mono uppercase rounded transition-all " + (selectedRace === race.id && selectedWinner === 'racer-a' ? 'bg-emerald-500 text-black font-extrabold' : 'bg-zinc-950 text-zinc-400 hover:text-white')}
                                  >
                                    {race.racerA}
                                  </button>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); setSelectedRace(race.id); setSelectedWinner('racer-b'); }}
                                    className={"py-1 text-[9px] font-mono uppercase rounded transition-all " + (selectedRace === race.id && selectedWinner === 'racer-b' ? 'bg-emerald-500 text-black font-extrabold' : 'bg-zinc-950 text-zinc-400 hover:text-white')}
                                  >
                                    {race.racerB}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="flex gap-2">
                            <input 
                              type="number" 
                              value={betAmount}
                              onChange={(e) => setBetAmount(e.target.value)}
                              placeholder="Enter credit amount..."
                              className="flex-1 bg-zinc-950 border border-zinc-850 rounded-lg px-3.5 py-1.5 text-xs focus:outline-none focus:border-emerald-500 font-mono text-emerald-400"
                            />
                            <button 
                              onClick={() => {
                                const amt = parseInt(betAmount);
                                if (isNaN(amt) || amt <= 0) return;
                                if (amt > betCredits) {
                                  triggerToast("Insufficient credits!", "warning");
                                  return;
                                }
                                setBetCredits(prev => prev - amt);
                                setBetAmount('');
                                triggerToast("Bet of " + amt + " CR placed on " + (selectedWinner === 'racer-a' ? 'A' : 'B') + "!", "success");
                              }}
                              className="bg-emerald-500 text-black text-xs font-mono font-black uppercase px-4 py-1.5 rounded-lg flex items-center gap-1"
                            >
                              Confirm Bet
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Car Specs Register and List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-5 rounded-2xl border border-emerald-500/20 bg-black/50 backdrop-blur-lg space-y-4">
                        <div className="border-b border-zinc-800 pb-2 flex items-center justify-between">
                          <h4 className="text-xs uppercase font-mono tracking-wider text-emerald-400 font-bold">Garage & Specs Manager</h4>
                          <span className="text-[10px] font-mono text-zinc-500">UGR Active Spec</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <input 
                            type="text" 
                            placeholder="Make (e.g. Porsche)" 
                            value={newMake}
                            onChange={(e) => setNewMake(e.target.value)}
                            className="bg-zinc-950 border border-zinc-850 rounded-lg p-2 focus:outline-none focus:border-emerald-500 text-zinc-200"
                          />
                          <input 
                            type="text" 
                            placeholder="Model (e.g. 911 GT3)" 
                            value={newModel}
                            onChange={(e) => setNewModel(e.target.value)}
                            className="bg-zinc-950 border border-zinc-850 rounded-lg p-2 focus:outline-none focus:border-emerald-500 text-zinc-200"
                          />
                          <input 
                            type="text" 
                            placeholder="Year (e.g. 2023)" 
                            value={newYear}
                            onChange={(e) => setNewYear(e.target.value)}
                            className="bg-zinc-950 border border-zinc-850 rounded-lg p-2 focus:outline-none focus:border-emerald-500 text-zinc-200"
                          />
                          <input 
                            type="text" 
                            placeholder="Horsepower (e.g. 518)" 
                            value={newHp}
                            onChange={(e) => setNewHp(e.target.value)}
                            className="bg-zinc-950 border border-zinc-850 rounded-lg p-2 focus:outline-none focus:border-emerald-500 text-zinc-200"
                          />
                          <input 
                            type="text" 
                            placeholder="Weight (e.g. 3150 lbs)" 
                            value={newWeight}
                            onChange={(e) => setNewWeight(e.target.value)}
                            className="bg-zinc-950 border border-zinc-850 rounded-lg p-2 col-span-2 focus:outline-none focus:border-emerald-500 text-zinc-200"
                          />
                        </div>
                        <button 
                          onClick={() => {
                            if (!newMake || !newModel) return;
                            setCars(prev => [...prev, {
                              id: Date.now().toString(),
                              make: newMake,
                              model: newModel,
                              year: newYear || 'N/A',
                              hp: newHp || 'N/A',
                              weight: newWeight || 'N/A',
                              parts: []
                            }]);
                            setNewMake('');
                            setNewModel('');
                            setNewYear('');
                            setNewHp('');
                            setNewWeight('');
                            triggerToast("New racing spec added to garage!", "success");
                          }}
                          className="w-full py-2 bg-emerald-500 text-black hover:bg-emerald-400 font-mono text-[10px] uppercase font-black tracking-widest rounded-lg transition-all"
                        >
                          REGISTER RACING CAR SPEC
                        </button>

                        <div className="space-y-2 mt-4 max-h-[160px] overflow-y-auto">
                          {cars.map((car) => (
                            <div key={car.id} className="p-3 bg-zinc-950 border border-zinc-850 rounded-xl flex items-center justify-between">
                              <div>
                                <h5 className="text-xs font-bold font-mono text-zinc-200">{car.year} {car.make} {car.model}</h5>
                                <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{car.hp} HP | {car.weight}</p>
                              </div>
                              <button 
                                onClick={() => {
                                  setCars(prev => prev.filter(c => c.id !== car.id));
                                  triggerToast("Car removed from active garage.", "warning");
                                }}
                                className="text-zinc-500 hover:text-red-400 p-1 cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Underground Car Meet Hosting */}
                      <div className="p-5 rounded-2xl border border-emerald-500/20 bg-black/50 backdrop-blur-lg space-y-4">
                        <div className="border-b border-zinc-800 pb-2 flex items-center justify-between">
                          <h4 className="text-xs uppercase font-mono tracking-wider text-emerald-400 font-bold">Car Meets & Coordinate Pins</h4>
                          <span className="text-[10px] font-mono text-zinc-500">Live coordinates</span>
                        </div>
                        <div className="grid grid-cols-1 gap-2 text-xs">
                          <input 
                            type="text" 
                            placeholder="Meet Name (e.g. Midnight Tunnel Run)" 
                            value={meetName}
                            onChange={(e) => setMeetName(e.target.value)}
                            className="bg-zinc-950 border border-zinc-850 rounded-lg p-2 focus:outline-none focus:border-emerald-500 text-zinc-200"
                          />
                          <input 
                            type="text" 
                            placeholder="Location Description (e.g. Bay Bridge Tunnel)" 
                            value={meetLoc}
                            onChange={(e) => setMeetLoc(e.target.value)}
                            className="bg-zinc-950 border border-zinc-850 rounded-lg p-2 focus:outline-none focus:border-emerald-500 text-zinc-200"
                          />
                          <input 
                            type="text" 
                            placeholder="Date & Time (e.g. Friday 11:30 PM)" 
                            value={meetTime}
                            onChange={(e) => setMeetTime(e.target.value)}
                            className="bg-zinc-950 border border-zinc-850 rounded-lg p-2 focus:outline-none focus:border-emerald-500 text-zinc-200"
                          />
                        </div>
                        <button 
                          onClick={() => {
                            if (!meetName || !meetLoc) return;
                            setMeets(prev => [...prev, {
                              id: Date.now().toString(),
                              name: meetName,
                              location: meetLoc,
                              time: meetTime || 'Tonight',
                              coords: '37.7749° N, 122.4194° W',
                              host: 'Self'
                            }]);
                            setMeetName('');
                            setMeetLoc('');
                            setMeetTime('');
                            triggerToast("New car meet pins hosted!", "success");
                          }}
                          className="w-full py-2 bg-emerald-500 text-black hover:bg-emerald-400 font-mono text-[10px] uppercase font-black tracking-widest rounded-lg transition-all"
                        >
                          HOST UNDERGROUND MEET
                        </button>

                        <div className="space-y-2 mt-4 max-h-[160px] overflow-y-auto">
                          {meets.map((meet) => (
                            <div key={meet.id} className="p-3 bg-zinc-950 border border-zinc-850 rounded-xl">
                              <div className="flex justify-between items-center">
                                <h5 className="text-xs font-bold font-mono text-zinc-200">{meet.name}</h5>
                                <span className="text-[8px] font-mono px-1 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-900 rounded">{meet.host}</span>
                              </div>
                              <p className="text-[10px] text-zinc-400 mt-1">{meet.location} ({meet.time})</p>
                              <p className="text-[9px] text-zinc-500 font-mono mt-0.5 flex items-center gap-1">
                                <MapPin size={9} /> {meet.coords}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Aftermarket Parts Marketplace Shopping integration */}
                    <div className="p-5 rounded-2xl border border-emerald-500/20 bg-black/50 backdrop-blur-lg space-y-4">
                      <div className="border-b border-zinc-800 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h4 className="text-xs uppercase font-mono tracking-wider text-emerald-400 font-bold">Aftermarket Performance Parts Portal</h4>
                          <p className="text-[10px] text-zinc-500">Shop parts with direct marketplace synchronization</p>
                        </div>
                        <div className="flex bg-[#121218] border border-zinc-800 p-1 rounded-lg">
                          {['amazon', 'american_muscle', 'autozone', 'ebay'].map((m) => (
                            <button
                              key={m}
                              onClick={() => setActiveMarket(m)}
                              className={"px-2 py-1 text-[9px] font-bold uppercase rounded cursor-pointer transition-all " + (activeMarket === m ? 'bg-emerald-500 text-black' : 'text-zinc-400 hover:text-white')}
                            >
                              {m.replace('_', ' ')}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Parts Inventory List */}
                        <div className="grid grid-cols-1 gap-2.5">
                          {(marketParts[activeMarket as keyof typeof marketParts] || []).map((part: any) => (
                            <div key={part.id} className="p-3 bg-zinc-950 border border-zinc-850 rounded-xl flex items-center justify-between hover:border-emerald-500/20 transition-all">
                              <div>
                                <h5 className="text-xs font-bold text-zinc-200">{part.name}</h5>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] font-bold font-mono text-emerald-400">\${part.price.toFixed(2)}</span>
                                  <span className="text-[9px] font-mono text-zinc-500">⭐ {part.rating}</span>
                                </div>
                              </div>
                              <button 
                                onClick={() => {
                                  setCart((prev) => [...prev, part]);
                                  triggerToast(part.name + " added to cart!", "success");
                                }}
                                className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-850 text-[10px] font-mono uppercase font-bold tracking-wider rounded border border-zinc-800 hover:border-zinc-700"
                              >
                                Add Part
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Cart Summary */}
                        <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-4 flex flex-col justify-between min-h-[160px]">
                          <div>
                            <h5 className="text-xs font-bold font-mono text-zinc-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-900 pb-1.5 mb-2">
                              <ShoppingBag size={12} className="text-emerald-400" />
                              <span>Your Shopping Cart ({cart.length})</span>
                            </h5>
                            <div className="space-y-1.5 max-h-[120px] overflow-y-auto">
                              {cart.length === 0 ? (
                                <p className="text-[10px] text-zinc-500 italic text-center py-4">No performance parts selected.</p>
                              ) : (
                                cart.map((item: any, idx) => (
                                  <div key={idx} className="flex justify-between items-center text-[11px] text-zinc-300">
                                    <span>{item.name}</span>
                                    <span className="font-bold font-mono text-emerald-400">\${item.price.toFixed(2)}</span>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                          
                          {cart.length > 0 && (
                            <div className="border-t border-zinc-900 pt-3 mt-2 flex items-center justify-between">
                              <div className="text-[10px] text-zinc-400 font-mono">
                                Total: <span className="text-emerald-400 font-bold">\${cart.reduce((a, b) => a + b.price, 0).toFixed(2)}</span>
                              </div>
                              <button 
                                onClick={() => {
                                  setCart([]);
                                  triggerToast("Marketplace checkout simulation completed!", "success");
                                }}
                                className="px-4 py-1.5 bg-emerald-500 text-black font-mono text-[9px] uppercase font-black tracking-widest rounded-lg transition-all"
                              >
                                CHECKOUT
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* General Fallback / Dashboard Components */}
                {archetype === 'productivity' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-[#14141b] border border-zinc-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity size={14} className={theme.accentText} />
                        <h4 className="text-xs font-semibold font-mono text-white">System Diagnostics</h4>
                      </div>
                      <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                        Telemetry state: <span className="text-emerald-400 font-mono">READY</span><br />
                        Integrations: <span className="text-yellow-400 font-mono">SQLite, Local Cache</span><br />
                        Response cycle: <span className="text-zinc-200 font-mono">1.2ms</span>
                      </p>
                    </div>
                    <div className="p-4 bg-[#14141b] border border-zinc-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <RefreshCw size={14} className={\`\${theme.accentText} animate-spin-slow\`} />
                        <h4 className="text-xs font-semibold font-mono text-white">Aether Orchestrator</h4>
                      </div>
                      <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                        Automatic suggestions: <span className="text-emerald-400 font-mono">ACTIVE</span><br />
                        Double confirmation: <span className="text-amber-500 font-mono">HEURISTIC</span><br />
                        Sandbox cycle: <span className="text-zinc-200 font-mono">Loop-B</span>
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Scratchpad Editor */}
              <div className="p-5 bg-zinc-900/50 border border-zinc-850 rounded-xl flex-1 flex flex-col min-h-[160px]">
                <h3 className="text-sm font-semibold font-mono text-white mb-3 flex items-center gap-1.5 pb-2 border-b border-zinc-850">
                  <FileText size={15} className={theme.accentText} />
                  <span>Workspace Scratchpad Specs</span>
                </h3>
                <textarea
                  value={scratchpad}
                  onChange={(e) => setScratchpad(e.target.value)}
                  className="w-full flex-1 bg-zinc-950/40 border border-zinc-800/80 rounded-lg p-3 font-mono text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 font-sans resize-none h-40"
                  placeholder="Draft project blueprints, database schemas, or code guidelines..."
                />
              </div>
            </>
          )}

          {/* EXTRA HIGHER-FIDELITY TABS */}
          {activeTab === 'extra' && optionId === 'option-2' && (
            <div className="p-5 bg-gradient-to-b from-[#090a16] to-[#040409] border border-indigo-500/20 rounded-xl space-y-6">
              <div>
                <h3 className="text-sm font-semibold font-mono text-white flex items-center gap-1.5">
                  <Sparkles size={16} className="text-teal-400" />
                  <span>Aurora Creative Customizer</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Adjust style vectors and choose live canvas layouts dynamically.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div 
                  onClick={() => { setSelectedTheme('aurora'); triggerToast("Theme swapped to Aurora Celestial", "success"); }}
                  className={\`p-4 rounded-xl border cursor-pointer transition-all \${selectedTheme === 'aurora' ? 'bg-indigo-950/40 border-indigo-500' : 'bg-zinc-900/40 border-zinc-800'}\`}
                >
                  <h4 className="text-xs font-bold text-white mb-1">Aurora Celestial</h4>
                  <p className="text-[10px] text-zinc-400">Generous glassmorphic panels, glowing backgrounds, and modern teal accents.</p>
                </div>
                <div 
                  onClick={() => { setSelectedTheme('cyber'); triggerToast("Theme swapped to Cyberpunk Neon", "success"); }}
                  className={\`p-4 rounded-xl border cursor-pointer transition-all \${selectedTheme === 'cyber' ? 'bg-cyan-950/40 border-cyan-500' : 'bg-zinc-900/40 border-zinc-800'}\`}
                >
                  <h4 className="text-xs font-bold text-white mb-1">Cyberpunk Neon</h4>
                  <p className="text-[10px] text-zinc-400">High-contrast cyan lines, sharp borders, and high visibility indicators.</p>
                </div>
                <div 
                  onClick={() => { setSelectedTheme('deep-space'); triggerToast("Theme swapped to Deep Space Minimalist", "success"); }}
                  className={\`p-4 rounded-xl border cursor-pointer transition-all \${selectedTheme === 'deep-space' ? 'bg-zinc-900 border-zinc-700' : 'bg-zinc-900/40 border-zinc-800'}\`}
                >
                  <h4 className="text-xs font-bold text-white mb-1">Deep Space</h4>
                  <p className="text-[10px] text-zinc-400">Flat slate panels, dark low-brightness containers, and timeless high-contrast typography.</p>
                </div>
              </div>

              <div className="p-4 bg-zinc-950/40 rounded-xl border border-zinc-850/80 space-y-4">
                <h4 className="text-xs font-bold text-zinc-200">Interactive Style Parameters</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-[11px] text-zinc-400 font-mono mb-1">
                      <span>Border Radii Alignment</span>
                      <span>12px (Mathematical Corner Curve)</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                      <div className="h-full w-2/3 bg-indigo-500" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] text-zinc-400 font-mono mb-1">
                      <span>Saturation Level</span>
                      <span>Teal Accented (&lt;5% Neutral Saturation)</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                      <div className="h-full w-3/4 bg-teal-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'extra' && optionId === 'option-3' && (
            <div className="p-5 bg-[#0e1017] border border-amber-500/20 rounded-xl space-y-6">
              <div>
                <h3 className="text-sm font-semibold font-mono text-white flex items-center gap-1.5">
                  <Shield size={16} className="text-amber-400" />
                  <span>Shield Guard Diagnostics Console</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Test and mock security policies, authorizations, and client headers.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-zinc-200 font-mono flex items-center gap-1">
                    <Settings size={13} className="text-amber-400" /> CORS Configuration
                  </h4>
                  <div className="flex flex-col gap-2">
                    {['Strict-Same-Origin', 'Allow-Localhost-Development', 'Open-Public-API'].map(pol => (
                      <button
                        key={pol}
                        onClick={() => { setCorsPolicy(pol); triggerToast('CORS policy updated to ' + pol, "info"); }}
                        className={\`px-3 py-2 text-left font-mono text-[10px] rounded border transition-all cursor-pointer \${corsPolicy === pol ? 'bg-amber-950/30 border-amber-500 text-amber-300' : 'bg-zinc-900/50 border-zinc-850 text-zinc-400 hover:text-white'}\`}
                      >
                        {pol}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-xl flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-200 font-mono flex items-center gap-1 mb-2">
                      <AlertTriangle size={13} className="text-red-400" /> Interactive Penetration Simulator
                    </h4>
                    <p className="text-[11px] text-zinc-400 leading-relaxed mb-3">
                      Trigger simulated cross-site script validation to check client-side sanitizers.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setThreatSimActive(true);
                      setSecurityLogs(prev => [...prev, '[ALERT] Simulated injection attempt blocked by client-side HTML sanitizer.']);
                      triggerToast("Sanitizer blocking active", "warning");
                      setTimeout(() => setThreatSimActive(false), 2000);
                    }}
                    disabled={threatSimActive}
                    className="w-full py-2 bg-red-950/45 border border-red-900 text-red-400 hover:bg-red-900/30 hover:text-white transition-colors rounded-lg font-mono text-[10px] cursor-pointer"
                  >
                    {threatSimActive ? "BLOCKING EXPLOIT ATTEMPT..." : "SIMULATE EXPLOIT ATTACK"}
                  </button>
                </div>
              </div>

              {/* Secure Log Tail */}
              <div className="p-4 bg-black border border-zinc-850 rounded-xl space-y-2">
                <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                  <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase">Secure Diagnostic Log Stream</span>
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="h-32 overflow-y-auto font-mono text-[10px] text-zinc-400 space-y-1.5 custom-scrollbar">
                  {securityLogs.map((log, idx) => (
                    <div key={idx} className={log.includes('[ALERT]') ? 'text-red-400' : 'text-zinc-400'}>
                      &gt; {log}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sandbox' && (
            <div className="p-5 bg-zinc-900/50 border border-zinc-850 rounded-xl space-y-6">
              <div>
                <h3 className="text-sm font-semibold font-mono text-white mb-1.5 flex items-center gap-1.5">
                  <Activity size={16} className={theme.accentText} />
                  <span>Interactive Telemetry & Sandbox Controller</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Monitor operations, toggle sandbox state settings, and execute script mocks.
                </p>
              </div>

              {/* Interactive Controller Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-lg space-y-3">
                  <h4 className="text-xs font-semibold font-mono text-white flex items-center gap-1">
                    <Settings size={14} className={theme.accentText} />
                    <span>Configuration Parameters</span>
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">Sandbox Auto-Save</span>
                      <span className="text-emerald-400 font-mono font-bold">ON (Local)</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">Simulated AI Latency</span>
                      <span className="text-indigo-400 font-mono">1.2s</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">Telemetry Channel</span>
                      <span className="text-zinc-300 font-mono">LocalSubnet-F</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-lg space-y-3">
                  <h4 className="text-xs font-semibold font-mono text-white flex items-center gap-1">
                    <Zap size={14} className={theme.accentText} />
                    <span>Trigger Action Signals</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => {
                        setScratchpad("# Quick Scratchpad\\n\\nSandbox flushed! Cached files remain untouched.");
                        triggerToast("Workspace cache flush simulation completed.", "warning");
                      }}
                      className="bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-300 p-2 rounded hover:bg-zinc-800 hover:text-white cursor-pointer"
                    >
                      FLUSH CACHE
                    </button>
                    <button 
                      onClick={() => triggerToast("All local self-test heuristics pass! (Score: 100%)", "success")}
                      className="bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-300 p-2 rounded hover:bg-zinc-800 hover:text-white cursor-pointer"
                    >
                      SELF TEST
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'agent-chat' && (
            <div className="p-5 bg-zinc-900/50 border border-zinc-850 rounded-xl flex flex-col h-[450px]">
              <div className="border-b border-zinc-850 pb-3 mb-4 flex items-center gap-2">
                <span className="p-1 rounded bg-purple-950 text-purple-400 shrink-0 border border-purple-900/30">
                  <Bot size={16} />
                </span>
                <div>
                  <h3 className="text-xs font-semibold font-mono text-white">Co-Pilot Dialogue Station</h3>
                  <p className="text-[10px] text-zinc-400">Active model: Aether (Rule-Based Fallback Engine)</p>
                </div>
              </div>

              {/* Chat messages */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 text-xs scrollbar-thin scrollbar-thumb-zinc-800">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={\`flex gap-3 \${msg.role === 'user' ? 'justify-end' : ''}\`}>
                    {msg.role !== 'user' && (
                      <span className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-850 text-purple-400 shrink-0 self-start">
                        <Bot size={13} />
                      </span>
                    )}
                    <div className={\`p-3 rounded-xl max-w-[80%] leading-relaxed font-sans \${
                      msg.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-tr-none' 
                        : 'bg-[#14141b] border border-zinc-850/80 text-zinc-200 rounded-tl-none'
                    }\`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex gap-3">
                    <span className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-850 text-purple-400 shrink-0 self-start animate-pulse">
                      <Bot size={13} />
                    </span>
                    <div className="bg-[#14141b] border border-zinc-850/80 p-3 rounded-xl text-zinc-500 text-xs italic">
                      Aether Bot is compiling parameters...
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Command Aether (e.g., 'remember to add database collections', 'suggest database schemas')..."
                  className="flex-1 bg-zinc-950/60 border border-zinc-850 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-indigo-500 font-sans text-zinc-200"
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl p-3 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Send size={15} />
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Right Column (Agent Directory & Blueprint Specs) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Agent squad roster */}
          <div className="p-5 bg-zinc-900/50 border border-zinc-850 rounded-xl">
            <h3 className="text-xs font-semibold font-mono text-zinc-300 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Bot size={14} className="text-yellow-400" />
              <span>Workspace Sub-Agents</span>
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-zinc-950/50 border border-zinc-850 rounded-lg flex items-start gap-3">
                <span className="p-1.5 rounded bg-amber-950 text-amber-400 border border-amber-900/30 mt-0.5">
                  <Compass size={14} />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-white font-mono">Aether CEO</h4>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Central orchestrator coordinating prompt mockups and specs.</p>
                </div>
              </div>

              <div className="p-3 bg-zinc-950/50 border border-zinc-850 rounded-lg flex items-start gap-3">
                <span className="p-1.5 rounded bg-zinc-800 text-yellow-400 border border-zinc-700 mt-0.5">
                  <RefreshCw size={14} />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-white font-mono">Sentinel AI</h4>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Monitoring daily quotas and falling back to secure offline storage.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Documentation Panel */}
          <div className="p-5 bg-zinc-900/50 border border-zinc-850 rounded-xl space-y-4">
            <h3 className="text-xs font-semibold font-mono text-zinc-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-850 pb-2">
              <BookOpen size={14} className="text-yellow-400" />
              <span>Workspace Guidelines</span>
            </h3>
            <div className="space-y-3 text-[11px] text-zinc-400 leading-relaxed font-sans">
              <p>
                <strong className="text-zinc-200">Offline Integrity:</strong> All task lists, calculations, and financial rows are stored in your secure browser LocalStorage.
              </p>
              <p>
                <strong className="text-zinc-200">How to restore Cloud AI:</strong> To leverage multi-modal Gemini Pro analysis, configure a custom API key under the <strong className="text-zinc-200">Settings</strong> page.
              </p>
              <div className="p-2.5 bg-amber-950/20 border border-amber-900/30 text-amber-300 rounded font-mono text-[10px]">
                Tip: Type anything in the chat box to simulate custom specs.
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-850 py-4 px-6 bg-[#0c0c11]/80 text-center text-[10px] font-mono text-zinc-500">
        AgenticOS Offline Prototype Generator | Powered by Aether SimEngine
      </footer>
    </div>
  );
}`;

  return {
    options: [
      {
        id: "option-1",
        name: `[Standard Core] ${title}`,
        description: `Standard client-focused architecture for "${prompt}". Uses robust React local states with clean local caching fallback schemas.`,
        techStack: ["React", "LocalStorage", "Tailwind CSS", "Lucide React"],
        dbSchema: `### Local Storage Sync Schema\n\n- \`app_projects\`: cache of core workspace project definitions.\n- \`app_issues\`: local collection of Kanban and sprinters' metrics.`,
        endpoints: [
          {
            path: "/api/sandbox/simulate-auth",
            method: "POST",
            description: "Mocks full-stack cookie validations."
          },
          {
            path: "/api/sandbox/local-state-sync",
            method: "GET",
            description: "Retrieves local backups of active projects."
          }
        ],
        files: {
          "index.html": `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body class="bg-[#07070a] text-zinc-100 font-sans">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
          "src/App.tsx": appCodeBase.replace("##OPTION_ID##", "option-1"),
          "src/index.css": `@import "tailwindcss";`
        },
        subAgents: [
          {
            name: "Aether CEO",
            role: "Chief Executive Agent",
            officeZone: "dev_bay",
            projectTaskSector: "feature",
            modelEngine: "gemini-3.5-flash",
            goals: ["Ensure mock blueprints serve seamlessly", "Handle user messages gracefully"]
          },
          {
            name: "Sentinel AI",
            role: "Security & Fallback Monitor",
            officeZone: "sentinel",
            projectTaskSector: "fixes",
            modelEngine: "gemini-3.5-flash",
            goals: ["Monitor API key validity", "Trigger local cache failovers"]
          }
        ]
      },
      {
        id: "option-2",
        name: `[Creative High-Fi] ${title} Aurora`,
        description: `Premium celestial designer layout featuring an Aurora Theme Customizer tab. Glowing background vectors, customizable layouts, and high-visibility stats dashboards.`,
        techStack: ["React", "Glassmorphism UI", "Theme Customizer", "Lucide React"],
        dbSchema: `### Celestial Aurora Settings Schema\n\n- \`aurora_theme_preferences\`: holds customizable border curves, saturation values, and active gradient presets.\n- \`aurora_creative_logs\`: high-fidelity render history state metrics.`,
        endpoints: [
          {
            path: "/api/creative/theme-customizer",
            method: "POST",
            description: "Updates live UI palette configurations and records user presets."
          },
          {
            path: "/api/creative/analytics-data",
            method: "GET",
            description: "Retrieves design performance stats & rendering efficiency."
          }
        ],
        files: {
          "index.html": `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title} Aurora</title>
  </head>
  <body class="bg-[#04040a] text-teal-50 font-sans">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
          "src/App.tsx": appCodeBase.replace("##OPTION_ID##", "option-2"),
          "src/index.css": `@import "tailwindcss";`
        },
        subAgents: [
          {
            name: "Creative Jane",
            role: "Principal UI Designer Agent",
            officeZone: "docs_lab",
            projectTaskSector: "feature",
            modelEngine: "gemini-3.5-flash",
            goals: ["Calibrate color contrasts", "Deliver mathematically perfect corner radius presets"]
          }
        ]
      },
      {
        id: "option-3",
        name: `[Enterprise Shield] ${title} Guard`,
        description: `Highly secure architecture centering standard CORS policies, real-time threat detection simulator tab, secure headers, and robust transaction logs.`,
        techStack: ["React", "Enterprise Shields", "CORS policy validators", "Telemetry Stream"],
        dbSchema: `### Security Shield Audits Schema\n\n- \`cors_headers_config\`: stores strict same-origin rules, authorization credentials, and whitelist domains.\n- \`threat_protection_audits\`: streaming security alerts and sanitization diagnostics logs.`,
        endpoints: [
          {
            path: "/api/security/header-handshake",
            method: "GET",
            description: "Returns CORS whitelist and strict CSP policies."
          },
          {
            path: "/api/security/simulate-injection",
            method: "POST",
            description: "Asserts HTML element and input sanitization correctness."
          }
        ],
        files: {
          "index.html": `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title} Guard</title>
  </head>
  <body class="bg-[#090a0f] text-zinc-100 font-sans">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
          "src/App.tsx": appCodeBase.replace("##OPTION_ID##", "option-3"),
          "src/index.css": `@import "tailwindcss";`
        },
        subAgents: [
          {
            name: "Shield Bot",
            role: "SecOps Guardian Agent",
            officeZone: "sentinel",
            projectTaskSector: "fixes",
            modelEngine: "gemini-3.5-flash",
            goals: ["Validate strict CORS headers", "Audit input sanitization and mock penetration trials"]
          }
        ]
      },
      {
        id: "option-4",
        name: `[Hyper-Velocity] ${title} Velocity Matrix`,
        description: `Ultra-responsive dark grid architecture tailored for zero-latency UI updates, real-time telemetry metrics, and high-frequency state synchronization.`,
        techStack: ["React", "Obsidian Cyber Matrix", "High-Freq Telemetry", "Lucide React"],
        dbSchema: `### Telemetry Metrics Schema\n\n- \`telemetry_streams\`: real-time event logs, latency metrics, and render timing records.\n- \`velocity_nodes\`: high-performance node configurations and memory cache states.`,
        endpoints: [
          {
            path: "/api/velocity/metrics-stream",
            method: "GET",
            description: "Subscribes to high-frequency telemetry events and framerate diagnostics."
          },
          {
            path: "/api/velocity/flush-cache",
            method: "POST",
            description: "Clears memory cache and optimizes client-side state buffers."
          }
        ],
        files: {
          "index.html": `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title} Velocity Matrix</title>
  </head>
  <body class="bg-[#030706] text-emerald-100 font-sans">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
          "src/App.tsx": appCodeBase.replace("##OPTION_ID##", "option-4"),
          "src/index.css": `@import "tailwindcss";`
        },
        subAgents: [
          {
            name: "Velocity Bot",
            role: "Performance Engineer Agent",
            officeZone: "dev_bay",
            projectTaskSector: "feature",
            modelEngine: "gemini-3.6-flash",
            goals: ["Benchmark rendering framerates", "Minimize state re-renders across views"]
          }
        ]
      }
    ].slice(0, Math.min(4, Math.max(2, optionsCount)))
  };
}
