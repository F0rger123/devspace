// src/lib/templates/saasDevOpsTemplates.ts
// Aura SaaS, Vanguard, K8s, Velocity CRM, Apex Telemetry, and Custom Dynamic Generator

export const AURA_SAAS_APP_CODE = `import React, { useState } from 'react';
import { 
  Sparkles, Check, ArrowRight, Shield, Zap, Globe, 
  BarChart, Users, Star, ChevronDown, Lock, Code2, Terminal
} from 'lucide-react';

export default function App() {
  const [billingCycle, setBillingCycle] = useState('annual');
  const [teamSeats, setTeamSeats] = useState(10);
  const [activeFaq, setActiveFaq] = useState(null);

  const basePricePerSeat = billingCycle === 'annual' ? 24 : 30;
  const totalPrice = teamSeats * basePricePerSeat;

  const faqs = [
    { q: 'How does Aura guarantee sub-50ms inference latency?', a: 'Our edge routing layer deploys GPU models across 38 global point-of-presence data centers with KV-cache streaming.' },
    { q: 'Can we self-host or run inside our own AWS/GCP VPC?', a: 'Yes! Our Enterprise tier provides Kubernetes Helm charts and automated Air-Gapped deployment support.' },
    { q: 'Is SOC2 Type II compliance verified?', a: 'All data is encrypted in transit (TLS 1.3) and at rest (AES-256) with zero data training retention.' }
  ];

  return (
    <div className="min-h-screen bg-[#07090e] text-zinc-100 font-sans">
      
      {/* Navbar */}
      <header className="border-b border-zinc-850/80 sticky top-0 bg-[#07090e]/90 backdrop-blur-md z-30 px-6 py-4 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Sparkles size={16} />
          </div>
          <span className="font-extrabold text-base tracking-tight text-white">Aura AI Cloud</span>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-xs text-zinc-400 font-medium">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          <a href="#benchmarks" className="hover:text-white transition-colors">Telemetry</a>
          <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
        </nav>

        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-zinc-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 cursor-pointer">
            Get Started Free
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-6 max-w-5xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono font-bold">
          <Sparkles size={13} />
          <span>AURA V4 ENGINE WITH 128K CONTEXT WINDOW</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
          Next-Generation AI Infrastructure for Autonomous Systems
        </h1>

        <p className="text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          Deploy production-ready LLM agents, streaming vector indexing, and low-latency embeddings with enterprise compliance.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
          <button className="px-6 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-extrabold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/20 cursor-pointer">
            <span>Start 14-Day Free Trial</span>
            <ArrowRight size={16} />
          </button>
          <button className="px-6 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-bold text-sm rounded-2xl border border-zinc-800 flex items-center justify-center gap-2 cursor-pointer">
            <Terminal size={16} />
            <span>Read API Specs</span>
          </button>
        </div>
      </section>

      {/* Interactive Pricing Calculator */}
      <section id="pricing" className="py-12 px-6 max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white">Transparent, Scalable Pricing</h2>
          <p className="text-xs text-zinc-400">Calculate real team costs based on active engineers</p>
        </div>

        <div className="p-8 bg-zinc-900/60 border border-zinc-800 rounded-3xl space-y-6 shadow-2xl">
          <div className="flex justify-center">
            <div className="flex bg-zinc-950 p-1 rounded-2xl border border-zinc-800 text-xs font-mono">
              <button 
                onClick={() => setBillingCycle('monthly')}
                className={"px-4 py-1.5 rounded-xl transition-all cursor-pointer " + (billingCycle === 'monthly' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400')}
              >
                Monthly Billing
              </button>
              <button 
                onClick={() => setBillingCycle('annual')}
                className={"px-4 py-1.5 rounded-xl transition-all cursor-pointer " + (billingCycle === 'annual' ? 'bg-cyan-500 text-zinc-950 font-bold' : 'text-zinc-400')}
              >
                Annual (Save 20%)
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-zinc-400">Team Seats: <strong className="text-white font-bold">{teamSeats} Seats</strong></span>
              <span className="text-cyan-400 font-bold">{"$" + basePricePerSeat + "/seat/mo"}</span>
            </div>
            <input 
              type="range" min="1" max="100" value={teamSeats}
              onChange={e => setTeamSeats(Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>

          <div className="p-6 bg-zinc-950 rounded-2xl border border-zinc-800 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <span className="text-xs font-mono text-zinc-400 uppercase">Estimated Total</span>
              <div className="text-3xl font-extrabold font-mono text-white">{"$" + totalPrice + "/mo"}</div>
              <span className="text-[11px] text-cyan-400 font-mono">Billed {billingCycle === 'annual' ? 'annually' : 'monthly'}</span>
            </div>

            <button className="px-6 py-3 bg-cyan-500 text-zinc-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 cursor-pointer">
              Continue to Checkout
            </button>
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section id="faq" className="py-12 px-6 max-w-3xl mx-auto space-y-4">
        <h2 className="text-xl font-bold text-white text-center">Frequently Answered Inquiries</h2>
        
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <div key={i} className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-2 cursor-pointer" onClick={() => setActiveFaq(activeFaq === i ? null : i)}>
              <div className="flex justify-between items-center text-xs font-bold text-white">
                <span>{f.q}</span>
                <ChevronDown size={14} className={"transition-transform " + (activeFaq === i ? 'rotate-180 text-cyan-400' : 'text-zinc-500')} />
              </div>
              {activeFaq === i && (
                <p className="text-xs text-zinc-400 leading-relaxed pt-2 border-t border-zinc-800/80">
                  {f.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
`;

export const AURA_SAAS_PRO_APP_CODE = AURA_SAAS_APP_CODE;

export const VANGUARD_APP_CODE = `import React from 'react';
import { Terminal, Shield, Cpu, Activity } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-[#07080b] text-zinc-100 p-6 flex flex-col items-center justify-center font-sans">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4 text-center">
        <Terminal size={32} className="text-cyan-400 mx-auto" />
        <h2 className="text-base font-bold text-white">Vanguard Cloud Observability</h2>
        <p className="text-xs text-zinc-400">Distributed eBPF kernel tracing and real-time microservice profiling.</p>
      </div>
    </div>
  );
}
`;

export const VANGUARD_PRO_APP_CODE = VANGUARD_APP_CODE;

export const K8S_HUB_APP_CODE = `import React, { useState } from 'react';
import { Server, Activity, AlertCircle, RefreshCw, Cpu, Database, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [pods] = useState([
    { name: 'auth-gateway-7b94c', status: 'Running', restarts: 0, cpu: '12m', mem: '142Mi' },
    { name: 'vector-indexer-4a11f', status: 'Running', restarts: 1, cpu: '480m', mem: '1.2Gi' },
    { name: 'inference-worker-9x88c', status: 'Running', restarts: 0, cpu: '1850m', mem: '4.8Gi' }
  ]);

  return (
    <div className="min-h-screen bg-[#08090d] text-zinc-100 font-sans p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2">
            <Server size={20} className="text-emerald-400" />
            <h1 className="text-base font-bold text-white">K8s Cluster Orchestrator</h1>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            Cluster Healthy (99.99%)
          </span>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-zinc-900 text-zinc-400 border-b border-zinc-800">
              <tr>
                <th className="p-3.5">Pod Name</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Restarts</th>
                <th className="p-3.5">CPU Usage</th>
                <th className="p-3.5">Memory</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {pods.map((p, i) => (
                <tr key={i} className="hover:bg-zinc-800/30">
                  <td className="p-3.5 text-white font-bold">{p.name}</td>
                  <td className="p-3.5 text-emerald-400">{p.status}</td>
                  <td className="p-3.5 text-zinc-400">{p.restarts}</td>
                  <td className="p-3.5 text-cyan-400">{p.cpu}</td>
                  <td className="p-3.5 text-amber-400">{p.mem}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
`;

export const K8S_HUB_PRO_APP_CODE = K8S_HUB_APP_CODE;

export const VELOCITY_CRM_APP_CODE = `import React from 'react';
import { Users, DollarSign, TrendingUp, Sparkles } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-[#08090d] text-zinc-100 p-6 flex flex-col items-center justify-center font-sans">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4 text-center">
        <Users size={32} className="text-indigo-400 mx-auto" />
        <h2 className="text-base font-bold text-white">Velocity Enterprise CRM</h2>
        <p className="text-xs text-zinc-400">High-velocity enterprise deal pipeline, AI enrichment, and account intelligence.</p>
      </div>
    </div>
  );
}
`;

export const VELOCITY_CRM_PRO_APP_CODE = VELOCITY_CRM_APP_CODE;

export const APEX_TELEMETRY_APP_CODE = `import React from 'react';
import { Activity, Shield, Cpu, Zap } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-[#08090d] text-zinc-100 p-6 flex flex-col items-center justify-center font-sans">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4 text-center">
        <Activity size={32} className="text-rose-400 mx-auto" />
        <h2 className="text-base font-bold text-white">Apex Observability Suite</h2>
        <p className="text-xs text-zinc-400">Zero-overhead real-time distributed telemetry and anomalous metric detection.</p>
      </div>
    </div>
  );
}
`;

export const APEX_TELEMETRY_PRO_APP_CODE = APEX_TELEMETRY_APP_CODE;

export function buildCustomAppCode(title: string = 'Custom Application', archetype: string = 'Interactive Experience', brief: string = ''): string {
  return `import React, { useState } from 'react';
import { Sparkles, Code2, Layers, CheckCircle2, ArrowRight, Shield } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-[#090a0f] text-zinc-100 p-6 flex flex-col items-center justify-center font-sans">
      <div className="max-w-lg w-full bg-zinc-900/90 border border-yellow-500/40 rounded-3xl p-8 space-y-5 text-center shadow-2xl">
        <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400 mx-auto">
          <Sparkles size={24} />
        </div>
        <h2 className="text-lg font-bold text-white">` + (title || 'Custom Application') + `</h2>
        <span className="text-xs font-mono text-yellow-400 bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20 uppercase font-bold">
          ` + (archetype || 'Interactive Experience') + `
        </span>
        <p className="text-xs text-zinc-300 leading-relaxed">
          ` + (brief || 'Custom multi-view React application generated from your brief.') + `
        </p>
      </div>
    </div>
  );
}`;
}

export function buildCustomAppVariantCode(title: string = 'Custom Application', archetype: string = 'Interactive Experience', brief: string = ''): string {
  return buildCustomAppCode(title, archetype, brief);
}
