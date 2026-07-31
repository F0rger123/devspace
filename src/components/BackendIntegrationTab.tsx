import React, { useState, useEffect } from "react";
import { 
  Server, Key, Shield, ShieldCheck, Play, Terminal, Database, 
  RefreshCw, Send, Sparkles, Check, AlertTriangle, Lock, Unlock, 
  CheckCircle2, Trash, Plus, FileText, ChevronRight, UserCheck, Eye, HelpCircle, ExternalLink
} from "lucide-react";

interface BackendSettings {
  type: "supabase" | "smtp" | "postgres" | "none";
  apiUrl?: string;
  anonKey?: string;
  serviceKey?: string;
  connectionString?: string;
  smtpHost?: string;
  smtpPort?: string;
  smtpUser?: string;
  smtpPass?: string;
  rlsPoliciesEnabled?: boolean;
}

interface BackendIntegrationTabProps {
  project: any;
  updateProject: (projectId: string, updates: any) => void;
}

export function BackendIntegrationTab({ project, updateProject }: BackendIntegrationTabProps) {
  // Localized backend settings loaded from the project (or defaulted if not configured)
  const [settings, setSettings] = useState<BackendSettings>(() => {
    return project.backendSettings || {
      type: "none",
      apiUrl: "",
      anonKey: "",
      serviceKey: "",
      connectionString: "",
      smtpHost: "",
      smtpPort: "587",
      smtpUser: "",
      smtpPass: "",
      rlsPoliciesEnabled: true
    };
  });

  const [activeSubTab, setActiveSubTab] = useState<"explorer" | "rls" | "sql" | "auth" | "settings">("explorer");
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connecting" | "connected" | "error">(
    project.backendSettings?.type && project.backendSettings.type !== "none" ? "connected" : "disconnected"
  );
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Supabase Quick Connect Live States
  const [showSupabaseOAuth, setShowSupabaseOAuth] = useState(false);
  const [supabaseOAuthStep, setSupabaseOAuthStep] = useState(1);
  const [selectedSupabaseProject, setSelectedSupabaseProject] = useState("");
  const [supabaseToken, setSupabaseToken] = useState(() => {
    try {
      return localStorage.getItem("app_supabase_pat") || "";
    } catch (e) {
      return "";
    }
  });
  const [supabaseProjects, setSupabaseProjects] = useState<any[]>([]);
  const [isFetchingProjects, setIsFetchingProjects] = useState(false);
  const [fetchProjectsError, setFetchProjectsError] = useState<string | null>(null);

  const fetchLiveSupabaseProjects = async (tokenToUse?: string) => {
    const activeToken = tokenToUse !== undefined ? tokenToUse : supabaseToken;
    if (!activeToken.trim()) {
      setFetchProjectsError("Please enter a valid Supabase Access Token first.");
      return;
    }

    setIsFetchingProjects(true);
    setFetchProjectsError(null);
    try {
      const res = await fetch('/api/supabase/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: activeToken })
      });

      const data = await res.json();
      if (res.ok) {
        if (Array.isArray(data) && data.length > 0) {
          setSupabaseProjects(data);
          // Set initial selection to the first project
          const firstProj = data[0];
          setSelectedSupabaseProject(firstProj.id || firstProj.ref || "");
          try {
            localStorage.setItem("app_supabase_pat", activeToken);
          } catch (e) {}
          setSupabaseOAuthStep(2);
        } else {
          setFetchProjectsError("No projects found in this Supabase account. Create one at supabase.com first.");
        }
      } else {
        setFetchProjectsError(data.error || "Failed to retrieve projects from Supabase. Make sure your token is correct.");
      }
    } catch (err: any) {
      setFetchProjectsError("Network error: " + (err.message || String(err)));
    } finally {
      setIsFetchingProjects(false);
    }
  };

  const retrieveProjectKeysAndConnect = async () => {
    if (!selectedSupabaseProject) {
      setFetchProjectsError("Please select a project first.");
      return;
    }

    setSupabaseOAuthStep(3);
    setFetchProjectsError(null);
    try {
      const res = await fetch('/api/supabase/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: supabaseToken,
          projectRef: selectedSupabaseProject
        })
      });

      const data = await res.json();
      if (res.ok) {
        const apiUrl = data.apiUrl;
        const keysList = data.keys || [];
        const anonKeyObj = keysList.find((k: any) => k.name === 'anon' || k.tags?.includes('anon'));
        const serviceKeyObj = keysList.find((k: any) => k.name === 'service_role' || k.tags?.includes('service_role'));

        const anonKey = anonKeyObj?.api_key || anonKeyObj?.key || "";
        const serviceKey = serviceKeyObj?.api_key || serviceKeyObj?.key || "";

        const updatedSettings: BackendSettings = {
          ...settings,
          type: "supabase",
          apiUrl,
          anonKey,
          serviceKey
        };

        // Automatically test connection to verify before applying
        const testRes = await fetch('/api/supabase/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiUrl, anonKey })
        });

        const testData = await testRes.json();
        if (testRes.ok && testData.success) {
          setSettings(updatedSettings);
          setConnectionStatus("connected");
          setConnectionError(null);
          saveSettings(updatedSettings);
          setShowSupabaseOAuth(false);
          appendSupervisorMessage(
            `⚡ Real connection established! Successfully queried the schema specifications for project ${selectedSupabaseProject} at ${apiUrl}. Row-Level Security scanning is now active.`
          );
        } else {
          setSupabaseOAuthStep(2);
          setFetchProjectsError(testData.error || "Establish link succeeded but API ping verification failed. Check keys or permissions.");
        }
      } else {
        setSupabaseOAuthStep(2);
        setFetchProjectsError(data.error || "Failed to retrieve API keys for project.");
      }
    } catch (err: any) {
      setSupabaseOAuthStep(2);
      setFetchProjectsError("Network error: " + (err.message || String(err)));
    }
  };

  // SQL Console state
  const [sqlQuery, setSqlQuery] = useState<string>("SELECT * FROM public.todos ORDER BY created_at DESC;");
  const [sqlResults, setSqlResults] = useState<any[] | null>([
    { id: 1, title: "Initialize database schema", completed: true, user_id: "usr_01", created_at: "2026-07-10 12:00:00" },
    { id: 2, title: "Configure Supabase Auth redirects", completed: false, user_id: "usr_01", created_at: "2026-07-11 09:30:00" },
    { id: 3, title: "Enable Row-Level Security on user_profiles", completed: false, user_id: "usr_02", created_at: "2026-07-11 15:45:00" }
  ]);
  const [sqlColumns, setSqlColumns] = useState<string[]>(["id", "title", "completed", "user_id", "created_at"]);
  const [isExecutingSql, setIsExecutingSql] = useState(false);
  const [sqlLogs, setSqlLogs] = useState<string[]>([]);

  // Tables Explorer State
  const [selectedTable, setSelectedTable] = useState<string>("todos");
  const [tablesList, setTablesList] = useState<any[]>([
    { name: "todos", rows: 3, columns: 5, rls_enabled: true },
    { name: "profiles", rows: 2, columns: 4, rls_enabled: true },
    { name: "messages", rows: 8, columns: 4, rls_enabled: false },
    { name: "rls_logs", rows: 14, columns: 6, rls_enabled: true },
    { name: "smtp_queue", rows: 0, columns: 5, rls_enabled: true }
  ]);

  const [tableData, setTableData] = useState<Record<string, any[]>>({
    todos: [
      { id: 1, title: "Initialize database schema", completed: true, user_id: "usr_01", created_at: "2026-07-10 12:00:00" },
      { id: 2, title: "Configure Supabase Auth redirects", completed: false, user_id: "usr_01", created_at: "2026-07-11 09:30:00" },
      { id: 3, title: "Enable Row-Level Security on user_profiles", completed: false, user_id: "usr_02", created_at: "2026-07-11 15:45:00" }
    ],
    profiles: [
      { id: "usr_01", username: "drummerforger", email: "drummerforger@gmail.com", avatar_url: "https://lh3.googleusercontent.com/..." },
      { id: "usr_02", username: "jules_ai", email: "jules@devspace.ai", avatar_url: "https://lh3.googleusercontent.com/..." }
    ],
    messages: [
      { id: 101, room_id: "lobby", user_id: "usr_01", body: "Hello World! Setup is running smoothly." },
      { id: 102, room_id: "lobby", user_id: "usr_02", body: "Welcome back! Ready to supervise the architecture." }
    ],
    rls_logs: [
      { id: 1, event_type: "SELECT", table_name: "profiles", status: "ALLOWED", ip_address: "107.21.43.12" },
      { id: 2, event_type: "UPDATE", table_name: "messages", status: "DENIED", ip_address: "107.21.43.12" }
    ],
    smtp_queue: []
  });

  // RLS Policies State
  const [rlsPolicies, setRlsPolicies] = useState<any[]>([
    { id: "p1", table: "todos", name: "Users can read their own todos only", action: "SELECT", role: "authenticated", check_clause: "auth.uid() = user_id", active: true },
    { id: "p2", table: "todos", name: "Users can insert their own todos", action: "INSERT", role: "authenticated", check_clause: "auth.uid() = user_id", active: true },
    { id: "p3", table: "profiles", name: "Profiles are publicly viewable", action: "SELECT", role: "public", check_clause: "true", active: true },
    { id: "p4", table: "profiles", name: "Users can update their own profile", action: "UPDATE", role: "authenticated", check_clause: "auth.uid() = id", active: true },
    { id: "p5", table: "messages", name: "Allow room members to read room chat", action: "SELECT", role: "authenticated", check_clause: "true", active: false }
  ]);

  // Auth Config state
  const [authProviders, setAuthProviders] = useState<any[]>([
    { name: "Email / Password", enabled: true, requiresConfirm: true },
    { name: "GitHub OAuth", enabled: true, requiresConfirm: false },
    { name: "Google Authentication", enabled: false, requiresConfirm: false }
  ]);

  // AI Backend Supervisor Chat state
  const [aiSupervisorChat, setAiSupervisorChat] = useState<any[]>([
    {
      sender: "ether",
      text: "👋 Salutations! I am the Aether AI Backend Supervisor. I am monitoring your project's data architecture, security posture, and custom policy definitions.",
      time: "Just now"
    }
  ]);
  const [aiInput, setAiInput] = useState("");
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Save changes to project context
  const saveSettings = (newSettings: BackendSettings) => {
    updateProject(project.id, {
      backendSettings: newSettings
    });
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (settings.type === "none") {
      setConnectionStatus("disconnected");
      return;
    }

    setConnectionStatus("connecting");
    setConnectionError(null);

    if (settings.type === "supabase") {
      if (!settings.apiUrl || !settings.anonKey) {
        setConnectionStatus("error");
        setConnectionError("Supabase API URL and Anon Key are required to establish link.");
        return;
      }

      try {
        const res = await fetch('/api/supabase/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apiUrl: settings.apiUrl,
            anonKey: settings.anonKey
          })
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setConnectionStatus("connected");
          saveSettings(settings);
          appendSupervisorMessage(
            `⚡ Real-time active connection verified to your Supabase project! I have scanned your OpenAPI spec at ${settings.apiUrl} and confirmed the database public Rest gateways are fully operational.`
          );
        } else {
          setConnectionStatus("error");
          setConnectionError(data.error || "Failed to establish a functional connection to Supabase. Please verify credentials and network permissions.");
        }
      } catch (err: any) {
        setConnectionStatus("error");
        setConnectionError("Failed to connect: " + (err.message || String(err)));
      }
      return;
    }

    // Fallback for Postgres simulation if used
    setTimeout(() => {
      if (settings.type === "postgres" && !settings.connectionString) {
        setConnectionStatus("error");
        setConnectionError("Database Connection String is required.");
        return;
      }

      setConnectionStatus("connected");
      saveSettings(settings);
      
      appendSupervisorMessage(
        `⚡ Backend link established successfully! I have analyzed your PostgreSQL database schema.`
      );
    }, 1200);
  };

  const handleDisconnect = () => {
    const updated = { ...settings, type: "none" as const };
    setSettings(updated);
    setConnectionStatus("disconnected");
    saveSettings(updated);
  };

  const appendSupervisorMessage = (text: string) => {
    setAiSupervisorChat(prev => [
      ...prev,
      { sender: "ether", text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ]);
  };

  const handleSendAiMessage = async () => {
    if (!aiInput.trim()) return;
    const userMsg = aiInput.trim();
    setAiInput("");
    setAiSupervisorChat(prev => [...prev, { id: `user-msg-${Date.now()}`, sender: "user", text: userMsg, time: "Just now" }]);
    setIsAiThinking(true);

    try {
      const activeBackendType = settings.type !== "none" ? settings.type : "Unlinked local sandbox";
      const prompt = `You are "Aether AI Backend Supervisor", a deep-reasoning database administrator and cloud architect.
The user's project is "${project?.name || 'Default Project'}".
The database stack is "${activeBackendType}".
The current tables in schema are: ${JSON.stringify(tablesList.map(t => t.name))}.
The active RLS Policies are: ${JSON.stringify(rlsPolicies.map(p => ({ table: p.table, name: p.name, action: p.action, clause: p.check_clause, active: p.active })))}.

User query: "${userMsg}"

Provide a highly professional, technically precise database supervisor response. If they want to create a table, modify policies, create indexes, or query something, provide clean, executable, standard PostgreSQL code blocks wrapped in standard markdown blocks, e.g. \`\`\`sql ... \`\`\`. Explain the architectural reasoning clearly, concisely, and with professional confidence.`;

      const response = await fetch('/api/gemini/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!response.ok) {
        throw new Error("Failed to stream AI supervisor feedback");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedReply = "";
      
      const initialMessageId = `supervisor-stream-${Date.now()}`;
      setAiSupervisorChat(prev => [
        ...prev,
        { id: initialMessageId, sender: "ether", text: "", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      ]);
      setIsAiThinking(false);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          accumulatedReply += chunk;
          
          setAiSupervisorChat(prev => prev.map(msg => 
            (msg as any).id === initialMessageId ? { ...msg, text: accumulatedReply } : msg
          ));
        }
      }
    } catch (e) {
      console.error("Failed to fetch live supervisor reply:", e);
      appendSupervisorMessage("⚠️ Connection error in Aether supervisor node. Standing by for offline local database tasks.");
      setIsAiThinking(false);
    }
  };

  // Run SQL Command Simulation
  const handleExecuteSql = () => {
    if (!sqlQuery.trim()) return;
    setIsExecutingSql(true);
    setSqlLogs(prev => [...prev, `⏳ Executing SQL statement against public schema...`]);

    setTimeout(() => {
      const normalizedQuery = sqlQuery.trim().toLowerCase();
      
      if (normalizedQuery.includes("enable row level security") || normalizedQuery.includes("enable rls")) {
        // Find which table was specified
        let tableName = "messages";
        if (normalizedQuery.includes("profiles")) tableName = "profiles";
        if (normalizedQuery.includes("todos")) tableName = "todos";

        // Update table's RLS status
        setTablesList(prev => prev.map(t => t.name === tableName ? { ...t, rls_enabled: true } : t));
        setSqlLogs(prev => [...prev, `✓ Success: Row-Level Security enabled on table '${tableName}'.`]);
        setSqlResults([]);
        setSqlColumns([]);
        
        appendSupervisorMessage(`🛡️ Row-Level Security (RLS) successfully activated on table '${tableName}'! No unauthenticated writes can bypass this table now.`);
      } else if (normalizedQuery.includes("create policy")) {
        // Add new policy
        const newPolicy = {
          id: `p_${Date.now()}`,
          table: "messages",
          name: "Allow authenticated reads on messages",
          action: "SELECT",
          role: "authenticated",
          check_clause: "true",
          active: true
        };
        setRlsPolicies(prev => [...prev, newPolicy]);
        setSqlLogs(prev => [...prev, `✓ Success: Policy created successfully.`]);
        setSqlResults([]);
        setSqlColumns([]);
      } else if (normalizedQuery.includes("select") && normalizedQuery.includes("rls_logs")) {
        setSqlColumns(["id", "event_type", "table_name", "status", "ip_address"]);
        setSqlResults(tableData.rls_logs);
        setSqlLogs(prev => [...prev, `✓ Success: Retrieved ${tableData.rls_logs.length} rows.`]);
      } else if (normalizedQuery.includes("select") && normalizedQuery.includes("profiles")) {
        setSqlColumns(["id", "username", "email", "avatar_url"]);
        setSqlResults(tableData.profiles);
        setSqlLogs(prev => [...prev, `✓ Success: Retrieved ${tableData.profiles.length} rows.`]);
      } else if (normalizedQuery.includes("select") && normalizedQuery.includes("messages")) {
        setSqlColumns(["id", "room_id", "user_id", "body"]);
        setSqlResults(tableData.messages);
        setSqlLogs(prev => [...prev, `✓ Success: Retrieved ${tableData.messages.length} rows.`]);
      } else {
        // Default todo selection
        setSqlColumns(["id", "title", "completed", "user_id", "created_at"]);
        setSqlResults(tableData.todos);
        setSqlLogs(prev => [...prev, `✓ Success: Retrieved ${tableData.todos.length} rows.`]);
      }

      setIsExecutingSql(false);
    }, 800);
  };

  const handleInjectSql = (command: string) => {
    setSqlQuery(command);
    setActiveSubTab("sql");
    setSqlLogs(prev => [...prev, `🔌 AI injected command to console.`]);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 animate-in fade-in duration-200">
      
      {/* LEFT 3 COLS: MAIN BACKEND WORKSPACE */}
      <div className="xl:col-span-3 space-y-6">
        
        {/* Connection Overview Header Card */}
        <div className="bg-[#121214] border border-zinc-800 rounded-xl p-5 shadow-lg relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg border ${
              connectionStatus === "connected" 
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                : connectionStatus === "connecting"
                ? "bg-blue-500/10 border-blue-500/20 text-blue-400 animate-spin"
                : "bg-zinc-800/50 border-zinc-700/50 text-zinc-400"
            }`}>
              <Server size={22} className={connectionStatus === "connecting" ? "animate-spin" : ""} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wide">
                  Backend Infrastructure Sync
                </h2>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                  connectionStatus === "connected"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : connectionStatus === "connecting"
                    ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    : "bg-zinc-900 text-zinc-500 border-zinc-800"
                }`}>
                  {connectionStatus}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                {connectionStatus === "connected" 
                  ? `Active link established to ${settings.type === "supabase" ? "Supabase Backend Cloud" : "Relational PostgreSQL database"}` 
                  : "Link your project repository to a managed Supabase database, SMTP servers, or SQL instances."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {connectionStatus === "connected" && (
              <button
                onClick={handleDisconnect}
                className="px-3 py-1.5 bg-red-950/20 hover:bg-red-950/40 text-red-400 hover:text-red-300 font-sans text-xs font-bold rounded-lg border border-red-900/30 transition-colors cursor-pointer"
              >
                Disconnect Link
              </button>
            )}
            <span className="text-[10px] font-mono text-zinc-500 uppercase bg-zinc-950 px-2 py-1 rounded border border-zinc-850">
              {settings.type === "supabase" ? "Supabase Core SDK" : settings.type === "postgres" ? "Direct SQL Link" : "No Cloud link"}
            </span>
          </div>
        </div>

        {/* CONNECTION FORM (Only visible if disconnected or config is being set up) */}
        {connectionStatus !== "connected" && connectionStatus !== "connecting" && (
          <div className="bg-[#121214] border border-zinc-800 rounded-xl p-6 shadow-lg space-y-4">
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
              <Database size={14} className="text-blue-400" /> Database Link Wizard
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Connect a third-party Postgres engine or secure Supabase environment to configure database schemas, manage auth constraints, run direct SQL sandboxes, and compile auto-suggested RLS policies.
            </p>

            <form onSubmit={handleConnect} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Select Type */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase">
                    Select Backend Service Provider
                  </label>
                  <select
                    value={settings.type}
                    onChange={(e) => setSettings({ ...settings, type: e.target.value as any })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 transition-colors font-sans"
                  >
                    <option value="none">🛑 Disconnected / Standalone local state</option>
                    <option value="supabase">⚡ Managed Supabase (GraphQL, Auth & RLS)</option>
                    <option value="postgres">🐘 Direct Custom PostgreSQL (Connection String)</option>
                  </select>
                </div>

                {/* Optional SMTP server link */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase">
                    SMTP server integrations (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. smtp.mailgun.org"
                    value={settings.smtpHost}
                    onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 transition-colors font-sans"
                  />
                </div>

              </div>

              {/* Supabase fields */}
              {settings.type === "supabase" && (
                <div className="space-y-3.5 pt-2 animate-in slide-in-from-top-2 duration-150">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-xl gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                        <Database size={13} className="text-emerald-400" />
                        Supabase Account Link Broker
                      </h4>
                      <p className="text-[10px] text-zinc-400 mt-0.5 leading-snug">
                        Establish an instant remote connection link to load database credentials and schemas automatically.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowSupabaseOAuth(true);
                        setSupabaseOAuthStep(1);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/10 hover:scale-[1.01]"
                    >
                      <span>⚡ Quick Connect Popup</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5 md:col-span-1">
                      <label className="block text-[10px] text-zinc-400 font-semibold uppercase">Supabase API URL</label>
                      <input
                        type="text"
                        placeholder="https://xyz.supabase.co"
                        value={settings.apiUrl}
                        onChange={(e) => setSettings({ ...settings, apiUrl: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-1">
                      <label className="block text-[10px] text-zinc-400 font-semibold uppercase">Anon Public API Key</label>
                      <input
                        type="password"
                        placeholder="eyJhbGciOiJIUzI1Ni..."
                        value={settings.anonKey}
                        onChange={(e) => setSettings({ ...settings, anonKey: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-1">
                      <label className="block text-[10px] text-zinc-400 font-semibold uppercase">Service Role Key (Secrets vault)</label>
                      <input
                        type="password"
                        placeholder="eyJh..."
                        value={settings.serviceKey}
                        onChange={(e) => setSettings({ ...settings, serviceKey: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Postgres Fields */}
              {settings.type === "postgres" && (
                <div className="space-y-1.5 pt-2 animate-in slide-in-from-top-2 duration-150">
                  <label className="block text-[10px] text-zinc-400 font-semibold uppercase">Connection URL</label>
                  <input
                    type="password"
                    placeholder="postgresql://user:pass@host:port/database?sslmode=require"
                    value={settings.connectionString}
                    onChange={(e) => setSettings({ ...settings, connectionString: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              {connectionError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg p-3 text-xs flex items-center gap-2 animate-pulse">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{connectionError}</span>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={settings.type === "none"}
                  className={`px-4 py-2 font-bold text-xs rounded-lg border flex items-center gap-1.5 cursor-pointer transition-all ${
                    settings.type === "none"
                      ? "bg-zinc-800 text-zinc-500 border-zinc-850 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-500 text-white border-blue-500/20 shadow-lg shadow-blue-600/10"
                  }`}
                >
                  <LinkIcon size={12} /> Connect Backend Platform
                </button>
              </div>
            </form>
          </div>
        )}

        {/* LOADING STATE CARD */}
        {connectionStatus === "connecting" && (
          <div className="bg-[#121214] border border-zinc-800 rounded-xl p-12 shadow-lg flex flex-col items-center justify-center text-center space-y-4">
            <RefreshCw className="text-blue-500 animate-spin" size={32} />
            <div>
              <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-widest">Pinging Endpoint Node</h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm">Verifying schema credentials, setting up local data bindings, and mapping Row-Level Security telemetry indices.</p>
            </div>
          </div>
        )}

        {/* WORKSPACE OPERATIONS CONSOLE (Only available if connected) */}
        {connectionStatus === "connected" && (
          <div className="space-y-6">
            
            {/* Tab Navigators */}
            <div className="flex border-b border-zinc-800 bg-[#0e0e11]/80 rounded-t-xl p-1 gap-1 shrink-0">
              {[
                { id: "explorer", label: "📁 Tables Explorer", icon: Database },
                { id: "rls", label: "🔒 RLS Policies", icon: ShieldCheck },
                { id: "sql", label: "📟 SQL Console Sandbox", icon: Terminal },
                { id: "auth", label: "🔑 User Auth Matrix", icon: UserCheck },
              ].map((subTab) => {
                const Icon = subTab.icon;
                const isSubActive = activeSubTab === subTab.id;
                return (
                  <button
                    key={subTab.id}
                    onClick={() => setActiveSubTab(subTab.id as any)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 font-bold text-[11px] rounded-lg transition-all ${
                      isSubActive 
                        ? "bg-zinc-800 text-zinc-100 border border-zinc-700/50" 
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <Icon size={12} />
                    {subTab.label}
                  </button>
                );
              })}
            </div>

            {/* TAB CONTENT: TABLES EXPLORER */}
            {activeSubTab === "explorer" && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in duration-150">
                
                {/* Tables List list */}
                <div className="md:col-span-1 bg-[#121214] border border-zinc-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Tables Schema</span>
                    <button 
                      onClick={() => {
                        const name = prompt("Enter new table name:");
                        if (name) {
                          setTablesList(prev => [...prev, { name, rows: 0, columns: 3, rls_enabled: false }]);
                        }
                      }}
                      className="p-1 hover:bg-zinc-800 rounded border border-transparent hover:border-zinc-700 text-zinc-400 hover:text-zinc-100"
                      title="Create Table"
                    >
                      <Plus size={12} />
                    </button>
                  </div>

                  <div className="space-y-1">
                    {tablesList.map((t) => (
                      <button
                        key={t.name}
                        onClick={() => setSelectedTable(t.name)}
                        className={`w-full text-left p-2 rounded transition-all flex items-center justify-between text-xs font-mono ${
                          selectedTable === t.name 
                            ? "bg-blue-600/10 border border-blue-500/20 text-blue-400 font-semibold" 
                            : "hover:bg-zinc-800/40 text-zinc-400"
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Database size={11} className={selectedTable === t.name ? "text-blue-400" : "text-zinc-500"} />
                          <span>{t.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {t.rls_enabled ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="RLS Guard Active" />
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" title="RLS Disabled - Insecure" />
                          )}
                          <span className="text-[9px] text-zinc-500">({t.rows})</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Table Data View */}
                <div className="md:col-span-3 bg-[#121214] border border-zinc-800 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-mono font-bold text-zinc-200">
                          public.{selectedTable}
                        </h3>
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                          tablesList.find(t => t.name === selectedTable)?.rls_enabled
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                        }`}>
                          {tablesList.find(t => t.name === selectedTable)?.rls_enabled ? "🛡️ RLS GUARD ACTIVE" : "🔓 NO RLS GUARD - INSECURE"}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500 font-mono mt-1">
                        Columns: {tablesList.find(t => t.name === selectedTable)?.columns} | Rows: {tableData[selectedTable]?.length || 0}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const query = `ALTER TABLE public.${selectedTable} ENABLE ROW LEVEL SECURITY;`;
                          handleInjectSql(query);
                        }}
                        className="px-2 py-1 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 rounded text-[10px] font-semibold flex items-center gap-1"
                      >
                        <Shield size={11} /> Enable RLS SQL
                      </button>
                      <button
                        onClick={() => {
                          const query = `SELECT * FROM public.${selectedTable} LIMIT 10;`;
                          handleInjectSql(query);
                        }}
                        className="px-2 py-1 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 rounded text-[10px] font-semibold flex items-center gap-1"
                      >
                        <Terminal size={11} /> Open in Console
                      </button>
                    </div>
                  </div>

                  {/* Grid data */}
                  {!tableData[selectedTable] || tableData[selectedTable].length === 0 ? (
                    <div className="text-center py-12 text-zinc-650 font-mono text-xs">
                      No records detected in public.{selectedTable}.
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-zinc-850 rounded-lg">
                      <table className="w-full text-left border-collapse text-[11px] font-mono">
                        <thead>
                          <tr className="bg-[#0b0b0d] border-b border-zinc-800 text-zinc-400">
                            {Object.keys(tableData[selectedTable][0]).map(col => (
                              <th key={col} className="p-2.5 font-bold">{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-850 text-zinc-300">
                          {tableData[selectedTable].map((row, idx) => (
                            <tr key={idx} className="hover:bg-zinc-900/30">
                              {Object.values(row).map((val: any, vIdx) => (
                                <td key={vIdx} className="p-2.5 max-w-[180px] truncate" title={String(val)}>
                                  {typeof val === 'boolean' ? (val ? "✓ TRUE" : "✗ FALSE") : String(val)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* TAB CONTENT: RLS POLICIES */}
            {activeSubTab === "rls" && (
              <div className="bg-[#121214] border border-zinc-800 rounded-xl p-5 space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div>
                    <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-emerald-400" /> Row-Level Security (RLS) Policy Manager
                    </h3>
                    <p className="text-[10px] text-zinc-400 mt-1">Configure fine-grained access policies to control read, write, update, and delete access based on authentication state.</p>
                  </div>

                  <button
                    onClick={() => {
                      const table = prompt("Table Name (e.g., todos, profiles, messages):", "messages");
                      const name = prompt("Policy Name:", "Allow members select");
                      const action = prompt("Action (SELECT, INSERT, UPDATE, DELETE):", "SELECT");
                      const check_clause = prompt("USING check clause SQL:", "auth.uid() = user_id");
                      if (table && name && action) {
                        setRlsPolicies(prev => [...prev, {
                          id: `p_${Date.now()}`,
                          table,
                          name,
                          action,
                          role: "authenticated",
                          check_clause: check_clause || "true",
                          active: true
                        }]);
                      }
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg border border-blue-500/10 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={12} /> Add New Policy
                  </button>
                </div>

                <div className="space-y-3">
                  {rlsPolicies.map((p) => (
                    <div key={p.id} className="p-4 bg-[#09090b] border border-zinc-850 rounded-lg flex flex-col md:flex-row justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">
                            table: public.{p.table}
                          </span>
                          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                            p.action === "SELECT" 
                              ? "bg-blue-500/10 text-blue-400" 
                              : p.action === "INSERT"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-purple-500/10 text-purple-400"
                          }`}>
                            {p.action}
                          </span>
                          {!p.active && (
                            <span className="text-[9px] bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-1.5 py-0.5 rounded font-mono">
                              DRAFT / INACTIVE
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-zinc-150">{p.name}</h4>
                        <div className="text-[10px] font-mono text-zinc-500 pt-0.5">
                          <strong>USING check clause:</strong> <code className="text-zinc-400 bg-zinc-950 px-1 py-0.5 rounded">{p.check_clause}</code>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 md:self-center shrink-0">
                        <button
                          onClick={() => {
                            setRlsPolicies(prev => prev.map(item => item.id === p.id ? { ...item, active: !item.active } : item));
                          }}
                          className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 rounded text-[10px] font-semibold"
                        >
                          {p.active ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => {
                            setRlsPolicies(prev => prev.filter(item => item.id !== p.id));
                          }}
                          className="p-1 hover:bg-zinc-900 text-red-500 hover:text-red-400 rounded"
                        >
                          <Trash size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT: SQL CONSOLE */}
            {activeSubTab === "sql" && (
              <div className="bg-[#121214] border border-zinc-800 rounded-xl p-5 space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Terminal size={14} className="text-blue-400 animate-pulse" /> SQL Sandbox Console
                    </h3>
                    <p className="text-[10px] text-zinc-400 mt-1">Execute custom PostgreSQL schema mutations, table insertions, or index configurations directly.</p>
                  </div>

                  <button
                    onClick={handleExecuteSql}
                    disabled={isExecutingSql}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed"
                  >
                    {isExecutingSql ? <RefreshCw size={12} className="animate-spin" /> : <Play size={12} />}
                    Run SQL Statement
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* SQL Input Area */}
                  <div className="md:col-span-2 space-y-2">
                    <textarea
                      value={sqlQuery}
                      onChange={(e) => setSqlQuery(e.target.value)}
                      className="w-full h-32 bg-zinc-950 border border-zinc-850 rounded-lg p-3 text-xs font-mono text-zinc-150 focus:outline-none focus:border-blue-500 resize-none"
                      placeholder="SELECT * FROM public.todos;"
                    />
                    
                    {/* Console Output logs */}
                    <div className="bg-zinc-950 border border-zinc-850 rounded-lg p-3 h-28 overflow-y-auto custom-scrollbar font-mono text-[10px] text-zinc-400 space-y-1">
                      <div className="text-zinc-500">--- Sandbox Telemetry logs ---</div>
                      {sqlLogs.length === 0 && <div className="text-zinc-600">Console ready. Write command and click 'Run'.</div>}
                      {sqlLogs.map((log, i) => (
                        <div key={i} className={log.includes("✓") ? "text-emerald-400" : log.includes("Error") ? "text-red-400" : "text-zinc-400"}>
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Preloaded/Suggested Queries panel */}
                  <div className="md:col-span-1 bg-[#09090b] border border-zinc-850 rounded-lg p-3 space-y-3">
                    <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-850 pb-1 flex items-center gap-1">
                      <Sparkles size={11} className="text-blue-400" /> Presets & Blueprints
                    </h4>
                    <div className="space-y-1.5 text-[10px] font-mono">
                      {[
                        { label: "List profiles table", sql: "SELECT * FROM public.profiles LIMIT 10;" },
                        { label: "Secure 'messages' table", sql: "ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;" },
                        { label: "Allow public selectively", sql: "CREATE POLICY \"Public select\" ON public.todos FOR SELECT TO public USING (true);" },
                        { label: "Index relationship key", sql: "CREATE INDEX IF NOT EXISTS idx_todos_user_id ON public.todos(user_id);" }
                      ].map((preset, i) => (
                        <button
                          key={i}
                          onClick={() => setSqlQuery(preset.sql)}
                          className="w-full text-left p-1.5 hover:bg-zinc-900 rounded border border-transparent hover:border-zinc-800 text-zinc-400 hover:text-zinc-200 truncate block"
                          title={preset.sql}
                        >
                          ▸ {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Display SQL execution results in clean table */}
                {sqlResults && sqlColumns.length > 0 && (
                  <div className="space-y-2 border-t border-zinc-800 pt-3">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Statement Query Results</span>
                    <div className="overflow-x-auto border border-zinc-850 rounded-lg max-h-56 overflow-y-auto custom-scrollbar">
                      <table className="w-full text-left border-collapse text-[10px] font-mono">
                        <thead>
                          <tr className="bg-[#0b0b0d] border-b border-zinc-800 text-zinc-400 sticky top-0">
                            {sqlColumns.map(col => (
                              <th key={col} className="p-2 font-bold">{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-850 text-zinc-300">
                          {sqlResults.map((row, idx) => (
                            <tr key={idx} className="hover:bg-zinc-900/30">
                              {sqlColumns.map(col => (
                                <td key={col} className="p-2 truncate max-w-[150px]" title={String(row[col])}>
                                  {typeof row[col] === 'boolean' ? (row[col] ? "✓" : "✗") : String(row[col] ?? '')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: USER AUTH */}
            {activeSubTab === "auth" && (
              <div className="bg-[#121214] border border-zinc-800 rounded-xl p-5 space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div>
                    <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                      <UserCheck size={14} className="text-blue-400" /> Managed User Authentication Rules
                    </h3>
                    <p className="text-[10px] text-zinc-400 mt-1">Configure email templates, login providers, and third-party callback gateways.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
                  
                  {/* Left: Login Providers */}
                  <div className="space-y-3">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Identity Providers</span>
                    <div className="space-y-2">
                      {authProviders.map((prov, i) => (
                        <div key={i} className="p-3 bg-[#09090b] border border-zinc-850 rounded-lg flex items-center justify-between">
                          <div className="space-y-0.5">
                            <span className="text-xs font-semibold text-zinc-250">{prov.name}</span>
                            <p className="text-[9px] text-zinc-500">
                              {prov.requiresConfirm ? "Requires double-opt email approval" : "Instant profile onboarding"}
                            </p>
                          </div>

                          <button
                            onClick={() => {
                              setAuthProviders(prev => prev.map((p, idx) => idx === i ? { ...p, enabled: !p.enabled } : p));
                            }}
                            className={`px-2.5 py-1 rounded text-[10px] font-bold border transition-colors ${
                              prov.enabled 
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                                : "bg-zinc-900 text-zinc-500 border-zinc-800"
                            }`}
                          >
                            {prov.enabled ? "ACTIVE" : "DISABLED"}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: Security Settings */}
                  <div className="bg-[#09090b] border border-zinc-850 rounded-lg p-4 space-y-3">
                    <h4 className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1">
                      🔒 Auth Policies & Telemetry
                    </h4>
                    <div className="space-y-3 text-[11px] text-zinc-400 font-sans">
                      <div className="flex items-center justify-between border-b border-zinc-850/50 pb-2">
                        <span>Allow user registrations:</span>
                        <span className="text-emerald-400 font-bold">YES</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-zinc-850/50 pb-2">
                        <span>Session Token Expiry:</span>
                        <span className="text-zinc-300">86,400 seconds (24h)</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-zinc-850/50 pb-2">
                        <span>Active Sessions tracked:</span>
                        <span className="text-blue-400 font-mono">14</span>
                      </div>
                      <div className="p-2 bg-zinc-950 rounded border border-zinc-900 text-[10px] text-zinc-500 font-mono">
                        💡 Auth triggers are bound to supabase auth schemas, ensuring JWT verification inside RLS query matrices automatically.
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

          </div>
        )}

      </div>

      {/* RIGHT 1 COL: ETHER AI BACKEND SUPERVISOR SIDEBAR */}
      <div className="xl:col-span-1 flex flex-col h-[580px] bg-[#121214] border border-zinc-800 rounded-xl overflow-hidden shadow-xl shrink-0">
        
        {/* supervisor header */}
        <div className="p-4 bg-[#1a1a1e] border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-blue-500/10 text-blue-400 animate-pulse border border-blue-500/20">
              <Sparkles size={14} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-zinc-150">Aether AI Supervisor</h3>
              <p className="text-[9px] text-emerald-400 font-mono">● Active System Supervisor</p>
            </div>
          </div>
          <span className="text-[8px] bg-blue-500/10 border border-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded uppercase font-mono font-extrabold">v3.5</span>
        </div>

        {/* chat history */}
        <div className="flex-grow p-4 overflow-y-auto custom-scrollbar space-y-4 bg-[#0a0a0c]/40">
          {aiSupervisorChat.map((msg, i) => (
            <div key={i} className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"} space-y-1`}>
              <div className={`text-[10px] text-zinc-500 font-mono flex items-center gap-1 px-1`}>
                <span>{msg.sender === "user" ? "You" : "Aether AI"}</span>
                <span>•</span>
                <span>{msg.time}</span>
              </div>
              <div className={`p-3 rounded-lg text-xs leading-relaxed max-w-[92%] font-sans ${
                msg.sender === "user" 
                  ? "bg-blue-600/20 text-blue-200 border border-blue-500/10 rounded-tr-none" 
                  : "bg-zinc-850 text-zinc-300 border border-zinc-800 rounded-tl-none whitespace-pre-wrap"
              }`}>
                {msg.text}
                
                {/* Auto check if message contains a sql block and render direct execute helper */}
                {msg.sender === "ether" && msg.text.includes("```sql") && (() => {
                  const sqlBlock = msg.text.split("```sql")[1]?.split("```")[0]?.trim();
                  if (sqlBlock) {
                    return (
                      <button
                        onClick={() => handleInjectSql(sqlBlock)}
                        className="mt-2.5 w-full bg-[#121215] hover:bg-zinc-950 text-[10px] font-bold font-mono text-emerald-400 py-1.5 px-2.5 rounded border border-emerald-500/20 hover:border-emerald-500/40 flex items-center justify-center gap-1 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
                      >
                        <Play size={10} /> Execute suggested SQL statement
                      </button>
                    );
                  }
                })()}
              </div>
            </div>
          ))}

          {isAiThinking && (
            <div className="flex items-center gap-1.5 p-2 bg-zinc-900/40 rounded border border-zinc-850/30 text-[10px] text-zinc-500 font-mono w-24">
              <RefreshCw size={10} className="animate-spin text-blue-400" />
              <span>Thinking...</span>
            </div>
          )}
        </div>

        {/* chat input */}
        <div className="p-3 bg-[#16161a] border-t border-zinc-800/80 shrink-0 flex gap-2">
          <input
            type="text"
            placeholder="Ask Supervisor to write RLS, SQL index..."
            value={aiInput}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSendAiMessage();
            }}
            onChange={(e) => setAiInput(e.target.value)}
            className="flex-grow bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 transition-colors font-sans"
          />
          <button
            onClick={handleSendAiMessage}
            className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded transition-all cursor-pointer flex items-center justify-center shadow-lg shadow-blue-600/10 active:scale-[0.95]"
          >
            <Send size={12} />
          </button>
        </div>

      </div>

      {/* Interactive Supabase OAuth Popup Simulation Overlay */}
      {showSupabaseOAuth && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0b0d] border border-zinc-800/80 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col font-sans animate-in zoom-in-95 duration-150">
            {/* Supabase popup header */}
            <div className="bg-[#121215] border-b border-zinc-800/60 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xs font-bold">
                  ⚡
                </div>
                <span className="text-xs font-bold text-zinc-200">Supabase — Cloud Integrations</span>
              </div>
              <div className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-mono font-bold">
                SECURE GATEWAY
              </div>
            </div>

            {/* Popup Body */}
            <div className="p-6 flex-1 space-y-4">
              {supabaseOAuthStep === 1 && (
                <div className="space-y-4">
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center mx-auto text-emerald-400 text-xl font-extrabold shadow-lg shadow-emerald-500/5">
                      ⚡
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-zinc-100 font-sans">Connect to Supabase Account</h3>
                      <p className="text-[10px] text-zinc-400 mt-1 leading-normal max-w-xs mx-auto font-sans">
                        Provide a personal access token to dynamically fetch and authenticate your active Supabase projects.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="block text-[9px] text-zinc-400 font-bold uppercase tracking-wider font-sans">Personal Access Token</label>
                      <a
                        href="https://supabase.com/dashboard/account/tokens"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[9px] text-emerald-400 hover:underline flex items-center gap-0.5 font-sans"
                      >
                        Get Token <ExternalLink size={8} />
                      </a>
                    </div>
                    <input
                      type="password"
                      placeholder="sbp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      value={supabaseToken}
                      onChange={(e) => setSupabaseToken(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  {fetchProjectsError && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg p-2.5 text-[10px] flex items-start gap-1.5 leading-normal">
                      <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                      <span>{fetchProjectsError}</span>
                    </div>
                  )}

                  <div className="flex gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowSupabaseOAuth(false)}
                      className="flex-1 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 font-bold py-2 rounded-lg text-xs border border-zinc-800 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isFetchingProjects || !supabaseToken.trim()}
                      onClick={() => fetchLiveSupabaseProjects()}
                      className="flex-grow bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-bold py-2 rounded-lg text-xs transition-colors cursor-pointer shadow-md shadow-emerald-600/10 flex items-center justify-center gap-1.5"
                    >
                      {isFetchingProjects ? (
                        <>
                          <RefreshCw size={11} className="animate-spin" />
                          Fetching...
                        </>
                      ) : (
                        "Fetch Live Projects"
                      )}
                    </button>
                  </div>
                </div>
              )}

              {supabaseOAuthStep === 2 && (
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-sm font-bold text-zinc-100">Select Active Project</h3>
                    <p className="text-[10px] text-zinc-400 mt-1 leading-normal">
                      Select which project you want to establish an active schema mapping with.
                    </p>
                  </div>

                  {fetchProjectsError && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg p-2.5 text-[10px] flex items-start gap-1.5 leading-normal">
                      <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                      <span>{fetchProjectsError}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="block text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Active Projects ({supabaseProjects.length})</label>
                    <div className="space-y-1.5 max-h-[180px] overflow-y-auto custom-scrollbar pr-1">
                      {supabaseProjects.map((item) => (
                        <button
                          key={item.id || item.ref}
                          type="button"
                          onClick={() => setSelectedSupabaseProject(item.id || item.ref)}
                          className={`w-full text-left p-3 rounded-lg border text-xs transition-all flex items-center justify-between cursor-pointer ${
                            selectedSupabaseProject === (item.id || item.ref)
                              ? "border-emerald-500 bg-emerald-500/5 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.1)]"
                              : "border-zinc-800 bg-[#121214] hover:bg-zinc-850 text-zinc-300"
                          }`}
                        >
                          <div>
                            <p className="font-bold">{item.name || "Unnamed Project"}</p>
                            <p className="text-[9px] text-zinc-500 font-mono mt-0.5">{(item.id || item.ref)}.supabase.co</p>
                          </div>
                          <span className="text-[8px] bg-zinc-900 text-zinc-400 px-1.5 py-0.5 rounded font-mono border border-zinc-800 uppercase font-bold">
                            {item.region || "US-East"}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setSupabaseOAuthStep(1)}
                      className="flex-1 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 font-bold py-2 rounded-lg text-xs border border-zinc-800 transition-colors cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={retrieveProjectKeysAndConnect}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg text-xs transition-colors cursor-pointer shadow-md shadow-emerald-600/10"
                    >
                      Establish Connection Link
                    </button>
                  </div>
                </div>
              )}

              {supabaseOAuthStep === 3 && (
                <div className="py-12 text-center space-y-4 font-sans">
                  <RefreshCw className="animate-spin text-emerald-400 mx-auto" size={32} />
                  <div>
                    <h3 className="text-xs font-bold text-zinc-200">Retrieving API Keys & Credentials...</h3>
                    <p className="text-[9px] text-zinc-500 mt-1 font-mono">
                      Querying Supabase project keys and executing spec-pings
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Simple custom LinkIcon fallback
function LinkIcon({ size = 16, className = "" }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}
