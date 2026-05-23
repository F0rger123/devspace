import { useState } from 'react';
import { Settings as SettingsIcon, Key, CreditCard, Mail, Database, Github, ShieldAlert, CheckCircle2, Bot } from 'lucide-react';
import { motion } from 'motion/react';
import { useData } from '../context/DataProvider';

export function Settings() {
  const { aiContextRules, setAiContextRules, aiPersona, setAiPersona } = useData();
  const [activeTab, setActiveTab] = useState('integrations');

  const integrations = [
    { id: 'github', name: 'GitHub', icon: Github, description: 'Sync repositories, issues, and PR status.', connected: true, color: 'text-zinc-100' },
    { id: 'vercel', name: 'Vercel', icon: Database, description: 'Deployments, preview links, and environment variables.', connected: false, color: 'text-zinc-100' },
    { id: 'stripe', name: 'Stripe', icon: CreditCard, description: 'Payment processing and subscription webhooks.', connected: false, color: 'text-indigo-400' },
    { id: 'openai', name: 'OpenAI', icon: Key, description: 'Language models for AI agent assistance.', connected: true, color: 'text-emerald-400' },
    { id: 'resend', name: 'Resend', icon: Mail, description: 'Transactional emails and marketing campaigns.', connected: false, color: 'text-rose-400' },
    { id: 'supabase', name: 'Supabase', icon: Database, description: 'Postgres database, auth, and edge functions.', connected: true, color: 'text-emerald-500' },
  ];

  return (
    <div className="flex-1 flex flex-col pb-8 min-h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100 flex items-center gap-2">
            System Settings <SettingsIcon size={18} className="text-zinc-400" />
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Manage infrastructure, API keys, and workspace intelligence.
          </p>
        </div>
      </div>

      <div className="flex gap-6 h-full">
        {/* Settings Navigation */}
        <div className="w-48 shrink-0 flex flex-col gap-1">
          {['profile', 'integrations', 'api-keys', 'billing', 'security', 'advanced'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-left px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-zinc-800/80 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1).replace('-', ' ')}
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="flex-1 border border-zinc-800 bg-[#121214] rounded-xl p-6 overflow-y-auto">
          {activeTab === 'integrations' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-zinc-100 mb-1">Connected Services</h3>
                <p className="text-xs text-zinc-400">Link external platforms to enrich project context and agent capabilities.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {integrations.map((integration, idx) => (
                  <motion.div
                    key={integration.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="border border-zinc-800 bg-[#09090b] rounded-lg p-4 flex flex-col hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-2 rounded-md bg-[#18181b] border border-zinc-800 ${integration.color}`}>
                        <integration.icon size={16} />
                      </div>
                      {integration.connected ? (
                        <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          <CheckCircle2 size={10} /> Connected
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-zinc-500 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
                          Not Connected
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-zinc-200 mb-1">{integration.name}</h4>
                      <p className="text-xs text-zinc-500 leading-relaxed">{integration.description}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-zinc-800/50 flex justify-end">
                      <button className={`text-xs font-medium transition-colors ${integration.connected ? 'text-zinc-500 hover:text-zinc-300' : 'text-blue-400 hover:text-blue-300'}`}>
                        {integration.connected ? 'Manage' : 'Connect'}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'api-keys' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-zinc-100 mb-1">API Tokens</h3>
                <p className="text-xs text-zinc-400">Manage access tokens for programmatic API access.</p>
              </div>
              
              <div className="bg-[#09090b] border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
                <ShieldAlert size={16} className="text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-medium text-zinc-200 mb-1">Secret Key Warning</h4>
                  <p className="text-[10px] text-zinc-400">Do not hardcode these keys in client-side applications. Always relay them securely through a server-side route.</p>
                </div>
              </div>

              <div className="border border-zinc-800 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-900/50 border-b border-zinc-800">
                      <th className="px-4 py-3 font-medium text-zinc-400">Name</th>
                      <th className="px-4 py-3 font-medium text-zinc-400">Token</th>
                      <th className="px-4 py-3 font-medium text-zinc-400">Created</th>
                      <th className="px-4 py-3 font-medium text-zinc-400 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-zinc-800 bg-[#09090b]">
                      <td className="px-4 py-3 text-zinc-300 font-medium">Production Scraper</td>
                      <td className="px-4 py-3 font-mono text-zinc-500">sk_live_...4f9a</td>
                      <td className="px-4 py-3 text-zinc-500">Oct 24, 2025</td>
                      <td className="px-4 py-3 text-right">
                        <button className="text-red-400 hover:text-red-300 transition-colors">Revoke</button>
                      </td>
                    </tr>
                    <tr className="bg-[#09090b]">
                      <td className="px-4 py-3 text-zinc-300 font-medium">DevAgent V2</td>
                      <td className="px-4 py-3 font-mono text-zinc-500">sk_test_...8b2c</td>
                      <td className="px-4 py-3 text-zinc-500">Nov 12, 2025</td>
                      <td className="px-4 py-3 text-right">
                        <button className="text-red-400 hover:text-red-300 transition-colors">Revoke</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="flex justify-end">
                <button className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-md transition-colors border border-zinc-700">
                   Generate New Token
                </button>
              </div>
            </div>
          )}
          
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-zinc-100 mb-1">Global Developer Profile & AI Memory</h3>
                <p className="text-xs text-zinc-400">Define context, tech stack rules, and persistent memories that the AI brain should know across all projects.</p>
              </div>

              <div className="bg-[#09090b] border border-zinc-800 rounded-lg p-5">
                <div className="mb-4 flex items-center justify-between">
                   <label className="text-xs font-semibold text-blue-400 flex items-center gap-2">
                      <Bot size={14} /> Persistent AI Context Block
                   </label>
                   <span className="text-[10px] text-zinc-500 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded">Auto-saves</span>
                </div>
                
                <textarea 
                  value={aiContextRules}
                  onChange={(e) => setAiContextRules(e.target.value)}
                  className="w-full h-64 bg-[#121214] border border-zinc-800/80 rounded-md p-4 text-[13px] text-emerald-400 font-mono outline-none focus:border-blue-500/50 resize-y leading-relaxed"
                  placeholder={`<role>\nYou are a Senior Full-Stack Next.js Engineer.\n</role>\n\n<tech-stack>\n- Next.js 14 App Router\n- Tailwind CSS\n- Supabase\n</tech-stack>\n\n<rules>\n- Always use server components by default.\n- No class components.\n</rules>`}
                />
                
                <p className="mt-3 text-[10px] text-zinc-500">
                  This exact block will be injected into the RightSidebar Context Engine when it generates ideas, resolves bugs, or reviews code.
                </p>
              </div>

              <div className="bg-[#09090b] border border-zinc-800 rounded-lg p-5">
                <div className="mb-4 flex items-center justify-between">
                   <label className="text-xs font-semibold text-purple-400 flex items-center gap-2">
                      <Bot size={14} /> Active Agent Persona
                   </label>
                   <span className="text-[10px] text-zinc-500 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded">Saved to storage</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { name: 'Scrum Master', description: 'Strict, highly task-oriented, pushes for speed and sprint deliverables.' },
                    { name: 'Architect Sage', description: 'Philosophical, focusing on elegant code architecture, design systems, and decoupling.' },
                    { name: 'Cynical Security Auditor', description: 'Extremely security-conscious, skeptical, hunts for edge-cases and visual flaws.' },
                    { name: 'Optimistic Copilot', description: 'Encouraging, helpful, celebrates milestones and focuses on developers emotional well-being.' }
                  ].map((p) => (
                    <div 
                      key={p.name}
                      onClick={() => setAiPersona(p.name)}
                      className={`p-3.5 border rounded-lg cursor-pointer transition-all ${aiPersona === p.name ? 'border-purple-500 bg-purple-950/5 shadow-md' : 'border-zinc-850 bg-zinc-950/30 hover:bg-[#121214]'}`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className={`w-2 h-2 rounded-full ${aiPersona === p.name ? 'bg-purple-500' : 'bg-zinc-600'}`}></div>
                        <span className="text-xs font-bold text-zinc-250">{p.name}</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 leading-relaxed font-sans">{p.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-sm font-semibold text-zinc-100 mb-1">Billing & Sandbox Quotas</h3>
                <p className="text-xs text-zinc-400">View sandboxed compute limits and active developer subscriptions.</p>
              </div>

              {/* Plans Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-blue-500/30 bg-[#1e3a8a]/10 rounded-lg p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-widest">Active Plan</span>
                      <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20 font-mono">DEV CREDIT ACTIVE</span>
                    </div>
                    <h4 className="text-sm font-bold text-zinc-100">DevSpace Ultimate Premium</h4>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">Boundless model streaming, workspace integrations, and full indexing permissions enabled for developer: <code className="text-zinc-200">drummerforger@gmail.com</code>.</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-zinc-800/50 flex justify-between items-center">
                    <span className="text-xs text-zinc-500">Valued at $49/mo</span>
                    <span className="text-xs text-emerald-400 font-semibold">Free Sandbox Tier</span>
                  </div>
                </div>

                <div className="border border-zinc-800 bg-[#09090b] rounded-lg p-4 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">Workspace Compute Quotas</h4>
                    <div className="space-y-3 font-sans">
                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-zinc-300 font-medium">Gemini LLM Tokens</span>
                          <span className="text-zinc-400 font-mono text-[10px]">148,220 / 1,000,000</span>
                        </div>
                        <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden border border-zinc-900">
                          <div className="bg-amber-500 h-full rounded-full" style={{ width: '14.8%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-zinc-300 font-medium">Index Vectors Memory</span>
                          <span className="text-zinc-400 font-mono text-[10px]">512 / 2,048 files</span>
                        </div>
                        <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden border border-zinc-900">
                          <div className="bg-blue-500 h-full rounded-full" style={{ width: '25%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-zinc-800/50 flex justify-end">
                    <span className="text-[10px] text-zinc-500 font-mono">Quotas renew monthly</span>
                  </div>
                </div>
              </div>

              {/* Transactions/Invoices */}
              <div className="border border-zinc-800 rounded-lg overflow-hidden bg-[#09090b]">
                <div className="px-4 py-3 bg-[#121214] border-b border-zinc-800">
                  <h4 className="text-xs font-semibold text-zinc-200">Sandbox Invoices (Pre-paid / Academic)</h4>
                </div>
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-900/10 border-b border-zinc-800 text-[11px]">
                      <th className="px-4 py-3 font-medium text-zinc-400">Invoice ID</th>
                      <th className="px-4 py-3 font-medium text-zinc-400">Billing Date</th>
                      <th className="px-4 py-3 font-medium text-zinc-400 text-right">Credit Utilized</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-zinc-800/50">
                      <td className="px-4 py-3 text-zinc-300 font-medium">INV-2026-004</td>
                      <td className="px-4 py-3 text-zinc-500">May 15, 2026</td>
                      <td className="px-4 py-3 text-right font-medium text-emerald-400 font-mono">-$49.00 (100% Credit)</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-zinc-300 font-medium">INV-2026-003</td>
                      <td className="px-4 py-3 text-zinc-500 font-medium text-zinc-500">Apr 15, 2026</td>
                      <td className="px-4 py-3 text-right font-medium text-emerald-400 font-mono">-$49.00 (100% Credit)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-sm font-semibold text-zinc-100 mb-1">Security & Access Management</h3>
                <p className="text-xs text-zinc-400">Control platform session parameters, configure SSH keys, and enforce sandboxing firewalls.</p>
              </div>

              {/* Multi Factor Block */}
              <div className="bg-[#09090b] border border-zinc-800 rounded-lg p-4 flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-semibold text-zinc-200 mb-1">Two-Factor Authenticated Gateways (MFA)</h4>
                  <p className="text-[10px] text-zinc-400 max-w-md leading-relaxed">Request biometric or authenticator app challenge protocols when accessing connected API gateways and scrapers.</p>
                </div>
                <div className="relative shrink-0 flex items-center">
                   <button 
                     onClick={() => alert("MFA simulation toggle updated!")}
                     className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded border border-zinc-700 transition-colors"
                   >
                     Enable 2FA
                   </button>
                </div>
              </div>

              {/* SSH Authorized Keys */}
              <div>
                <label className="text-xs font-semibold text-zinc-300 mb-1 block">Authorized Workspace SSH Keys</label>
                <p className="text-[10px] text-zinc-500 mb-2 leading-relaxed">Add public keys to let your IDE or pipeline deploy commits securely to DevSpace runners.</p>
                <textarea 
                  className="w-full h-24 bg-[#121214] border border-zinc-800 rounded-md p-3 text-[11px] text-zinc-400 font-mono outline-none focus:border-blue-500/50 resize-y"
                  placeholder="ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQD..."
                  defaultValue="ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDfA3m8d2fja"
                />
                <div className="flex justify-end mt-2">
                  <button 
                    onClick={() => alert('SSH Key indexed into trusted memory!')}
                    className="px-2.5 py-1 bg-zinc-100 hover:bg-white text-zinc-900 text-xs font-semibold rounded font-sans transition-colors"
                  >
                    Index Key
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-sm font-semibold text-zinc-100 mb-1">Advanced Controls</h3>
                <p className="text-xs text-zinc-400">Manage low-level environment directives, custom triggers, and clear workspace caches.</p>
              </div>

              {/* Sync Configuration / Cleardown */}
              <div className="border border-zinc-800 rounded-lg bg-[#09090b]">
                <div className="px-4 py-3 border-b border-zinc-800">
                  <h4 className="text-xs font-semibold text-zinc-200">Local Cache Purge Engine</h4>
                </div>
                <div className="p-4 space-y-4">
                  <p className="text-xs text-zinc-400 leading-relaxed text-zinc-400">Reset all indexed metadata in standard memory buckets. This will wipe any scratch projects, tracked commits, and local notes, resetting DevSpace back to system default. Proceed with caution.</p>
                  
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => {
                        if (confirm("Are you absolutely sure you want to hard reset all DevSpace memory? This cannot be undone.")) {
                          localStorage.clear();
                          alert("Workspace hard purge completed! Please reload the applet.");
                          window.location.reload();
                        }
                      }}
                      className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 rounded text-xs font-semibold transition-colors animate-pulse"
                    >
                      Hard Purge All Databases
                    </button>
                    <button 
                      onClick={() => {
                        localStorage.removeItem('devspace_notes');
                        alert("Notes index wiped!");
                      }}
                      className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded text-xs font-semibold transition-colors"
                    >
                      Purge Notes Only
                    </button>
                  </div>
                </div>
              </div>

              {/* Dev toggles */}
              <div className="border border-zinc-800 rounded-lg bg-[#09090b] p-4">
                 <h4 className="text-xs font-semibold text-zinc-200 mb-3">Live Experimental Toggles</h4>
                 <div className="space-y-3">
                    <label className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-300 cursor-pointer">
                      <input type="checkbox" defaultChecked className="rounded border-zinc-800 bg-zinc-950 text-blue-500" />
                      Low latency SSE token output streams
                    </label>
                    <label className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-300 cursor-pointer">
                      <input type="checkbox" className="rounded border-zinc-800 bg-zinc-950 text-blue-500" />
                      Acoustic prompt reading via System SpeechSynthesis
                    </label>
                    <label className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-300 cursor-pointer">
                      <input type="checkbox" defaultChecked className="rounded border-zinc-800 bg-zinc-950 text-blue-500" />
                      Automatic pull requests diff diagnostics
                    </label>
                 </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
