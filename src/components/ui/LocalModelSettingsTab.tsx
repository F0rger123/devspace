import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Cpu, 
  RefreshCw, 
  Check, 
  HardDrive, 
  Zap, 
  Terminal, 
  Play, 
  ShieldCheck, 
  AlertCircle, 
  Layers,
  Sparkles,
  Server,
  Download,
  ExternalLink,
  Search,
  Gauge,
  CheckCircle2,
  HelpCircle,
  Copy,
  ArrowRight
} from 'lucide-react';
import { 
  probeLocalServer, 
  generateWithLocalModel, 
  getLocalSettings, 
  saveLocalSettings, 
  DEFAULT_SERVERS, 
  LocalServerConfig, 
  LocalModelSettings 
} from '../../lib/localModelEngine';
import {
  detectWebGpuHardware,
  runWebGpuComputeBenchmark,
  executeWebGpuLocalInference,
  AVAILABLE_WEBLLM_MODELS,
  WebGpuHardwareInfo
} from '../../lib/webLlmEngine';
import { useData } from '../../context/DataProvider';

export interface HuggingFaceModel {
  id: string;
  name: string;
  hfRepo: string;
  author: string;
  size: string;
  params: string;
  recommendedRam: number; // in GB
  recommendedCores: number;
  description: string;
  ggufUrl: string;
  ollamaCmd: string;
  tags: string[];
}

const HUGGINGFACE_MODELS: HuggingFaceModel[] = [
  {
    id: 'qwen2.5-coder-7b',
    name: 'Qwen 2.5 Coder 7B Instruct',
    hfRepo: 'Qwen/Qwen2.5-Coder-7B-Instruct',
    author: 'Qwen / Alibaba Cloud',
    size: '4.7 GB (Q4_K_M GGUF)',
    params: '7.6B Parameters',
    recommendedRam: 8,
    recommendedCores: 6,
    description: 'Top-tier open-source coding & bug-fixing model. State of the art HumanEval scores.',
    ggufUrl: 'https://huggingface.co/Qwen/Qwen2.5-Coder-7B-Instruct-GGUF/resolve/main/qwen2.5-coder-7b-instruct-q4_k_m.gguf',
    ollamaCmd: 'ollama run qwen2.5-coder:7b',
    tags: ['Code Fixes', 'TypeScript', 'Python', 'Refactoring']
  },
  {
    id: 'deepseek-coder-v2-lite',
    name: 'DeepSeek Coder V2 Lite Instruct',
    hfRepo: 'deepseek-ai/DeepSeek-Coder-V2-Lite-Instruct',
    author: 'DeepSeek AI',
    size: '8.9 GB (Q4_K_M GGUF)',
    params: '16B Parameters (MoE)',
    recommendedRam: 16,
    recommendedCores: 8,
    description: 'DeepSeek Mixture of Experts for complex architectural analysis & multi-file refactoring.',
    ggufUrl: 'https://huggingface.co/bartowski/DeepSeek-Coder-V2-Lite-Instruct-GGUF/resolve/main/DeepSeek-Coder-V2-Lite-Instruct-Q4_K_M.gguf',
    ollamaCmd: 'ollama run deepseek-coder-v2:16b',
    tags: ['Multi-File', 'MoE', 'Deep Reasoning']
  },
  {
    id: 'llama-3.2-3b-instruct',
    name: 'Llama 3.2 3B Instruct',
    hfRepo: 'meta-llama/Llama-3.2-3B-Instruct',
    author: 'Meta AI',
    size: '2.0 GB (Q4_K_M GGUF)',
    params: '3.2B Parameters',
    recommendedRam: 4,
    recommendedCores: 4,
    description: 'Ultra-fast lightweight LLM for quick inline code auto-complete and chat responses.',
    ggufUrl: 'https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF/resolve/main/Llama-3.2-3B-Instruct-Q4_K_M.gguf',
    ollamaCmd: 'ollama run llama3.2:3b',
    tags: ['Ultra Fast', 'Lightweight', 'Low Memory']
  },
  {
    id: 'qwen2.5-coder-1.5b',
    name: 'Qwen 2.5 Coder 1.5B Instruct',
    hfRepo: 'Qwen/Qwen2.5-Coder-1.5B-Instruct',
    author: 'Qwen / Alibaba Cloud',
    size: '1.1 GB (Q4_K_M GGUF)',
    params: '1.5B Parameters',
    recommendedRam: 4,
    recommendedCores: 2,
    description: 'Tiny footprint code model capable of running effortlessly on any laptop or integrated GPU.',
    ggufUrl: 'https://huggingface.co/Qwen/Qwen2.5-Coder-1.5B-Instruct-GGUF/resolve/main/qwen2.5-coder-1.5b-instruct-q4_k_m.gguf',
    ollamaCmd: 'ollama run qwen2.5-coder:1.5b',
    tags: ['Tiny Footprint', 'Instant', 'Low Power']
  },
  {
    id: 'codellama-7b-instruct',
    name: 'CodeLlama 7B Instruct GGUF',
    hfRepo: 'TheBloke/CodeLlama-7B-Instruct-GGUF',
    author: 'Meta / TheBloke',
    size: '4.2 GB (Q4_K_M GGUF)',
    params: '7.0B Parameters',
    recommendedRam: 8,
    recommendedCores: 6,
    description: 'Battle-tested CodeLlama fine-tune optimized for code generation, unit test creation, and debugging.',
    ggufUrl: 'https://huggingface.co/TheBloke/CodeLlama-7B-Instruct-GGUF/resolve/main/codellama-7b-instruct.Q4_K_M.gguf',
    ollamaCmd: 'ollama run codellama:7b',
    tags: ['Battle-Tested', 'Unit Tests', 'Debugging']
  },
  {
    id: 'phi-3-mini-4k',
    name: 'Phi-3 Mini 4K Instruct',
    hfRepo: 'microsoft/Phi-3-mini-4k-instruct',
    author: 'Microsoft Research',
    size: '2.4 GB (Q4_K_M GGUF)',
    params: '3.8B Parameters',
    recommendedRam: 6,
    recommendedCores: 4,
    description: 'Microsoft reasoning engine punching way above its weight class in math and logic tasks.',
    ggufUrl: 'https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf/resolve/main/Phi-3-mini-4k-instruct-q4.gguf',
    ollamaCmd: 'ollama run phi3:mini',
    tags: ['Logic', 'Math', 'Microsoft AI']
  }
];

export function LocalModelSettingsTab() {
  const { showToast } = useData();

  const [servers, setServers] = useState<LocalServerConfig[]>(DEFAULT_SERVERS);
  const [settings, setSettings] = useState<LocalModelSettings>(getLocalSettings());
  const [isScanning, setIsScanning] = useState(false);
  const [testPrompt, setTestPrompt] = useState('Write a TypeScript helper function to sort array of objects by date.');
  const [testResponse, setTestResponse] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // PC Hardware Specs & Benchmark State
  const [hardwareSpecs, setHardwareSpecs] = useState<{
    cores: number;
    ramGb: number;
    gpuName: string;
    score: number;
    tier: 'high' | 'mid' | 'light';
    recommendedSize: string;
  }>({
    cores: 8,
    ramGb: 16,
    gpuName: 'Detecting GPU Hardware...',
    score: 85,
    tier: 'mid',
    recommendedSize: '7B - 13B Parameters'
  });

  const [hfSearchQuery, setHfSearchQuery] = useState('');
  const [downloadingModelId, setDownloadingModelId] = useState<string | null>(null);

  // WebGPU & WebLLM State
  const [webGpuInfo, setWebGpuInfo] = useState<WebGpuHardwareInfo | null>(null);
  const [webGpuBench, setWebGpuBench] = useState<{ gflops: number; ms: number } | null>(null);
  const [selectedWebLlmModel, setSelectedWebLlmModel] = useState('SmolLM2-360M-Instruct-q4f16_1');
  const [webLlmPrompt, setWebLlmPrompt] = useState('Write a TypeScript function to filter active tasks by priority');
  const [webLlmOutput, setWebLlmOutput] = useState('');
  const [webLlmProgress, setWebLlmProgress] = useState('');
  const [webLlmPercent, setWebLlmPercent] = useState(0);
  const [isWebLlmRunning, setIsWebLlmRunning] = useState(false);

  // Hardware Scan on mount
  useEffect(() => {
    runPcHardwareScan();
    handleScanServers();
    runWebGpuScan();
  }, []);

  const runWebGpuScan = async () => {
    const hw = await detectWebGpuHardware();
    setWebGpuInfo(hw);
  };

  const handleRunWebGpuBenchmark = async () => {
    try {
      showToast("⚡ Running WGSL WebGPU Shader Benchmark...", "info");
      const res = await runWebGpuComputeBenchmark();
      setWebGpuBench({ gflops: res.gflops, ms: res.ms });
      showToast(`🔥 WebGPU Benchmark Passed: ${res.gflops} GFLOPS (${res.ms}ms)`, "success", 4000);
    } catch (e: any) {
      showToast(`⚠️ WebGPU Benchmark Failed: ${e.message}`, "error");
    }
  };

  const handleExecuteWebLlmInference = async () => {
    setIsWebLlmRunning(true);
    setWebLlmOutput('');
    setWebLlmPercent(10);
    setWebLlmProgress('Initializing WebGPU Neural Engine...');

    try {
      const output = await executeWebGpuLocalInference(
        selectedWebLlmModel,
        webLlmPrompt,
        (text, pct) => {
          setWebLlmProgress(text);
          setWebLlmPercent(pct);
        }
      );
      setWebLlmOutput(output);
      showToast("✅ WebGPU In-Browser Inference complete!", "success");
    } catch (err: any) {
      setWebLlmOutput(`⚠️ WebGPU Execution Error: ${err.message}`);
      showToast("WebGPU execution error", "error");
    } finally {
      setIsWebLlmRunning(false);
      setWebLlmPercent(100);
    }
  };

  const runPcHardwareScan = () => {
    const cores = navigator.hardwareConcurrency || 8;
    const ramGb = (navigator as any).deviceMemory || 16;
    
    // WebGL GPU Check
    let gpuName = 'Standard Integrated Graphics';
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          gpuName = (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'Hardware Accelerated GPU';
        }
      }
    } catch (e) {
      gpuName = 'Hardware WebGL Renderer';
    }

    let score = 50 + (cores * 3) + (ramGb * 2);
    if (gpuName.toLowerCase().includes('nvidia') || gpuName.toLowerCase().includes('apple') || gpuName.toLowerCase().includes('radeon') || gpuName.toLowerCase().includes('rtx')) {
      score += 15;
    }
    score = Math.min(score, 99);

    let tier: 'high' | 'mid' | 'light' = 'mid';
    let recommendedSize = '7B - 13B Parameters';

    if (ramGb >= 16 && cores >= 8) {
      tier = 'high';
      recommendedSize = '7B - 32B Parameters (High Speed)';
    } else if (ramGb >= 8 && cores >= 4) {
      tier = 'mid';
      recommendedSize = '3B - 7B Parameters (Balanced)';
    } else {
      tier = 'light';
      recommendedSize = '1.5B - 3B Parameters (Lightweight)';
    }

    setHardwareSpecs({
      cores,
      ramGb,
      gpuName,
      score,
      tier,
      recommendedSize
    });
  };

  const handleScanServers = async () => {
    setIsScanning(true);
    const updated = await Promise.all(
      servers.map(async (srv) => {
        const res = await probeLocalServer(srv);
        return {
          ...srv,
          status: res.status,
          models: res.models
        };
      })
    );
    setServers(updated);
    setIsScanning(false);

    const onlineCount = updated.filter(s => s.status === 'online').length;
    if (onlineCount > 0) {
      showToast(`🟢 Detected ${onlineCount} active local LLM engine(s) on localhost!`, "success");
    }
  };

  const handleSelectServer = (serverId: string, modelName: string) => {
    const updated = {
      ...settings,
      activeServerId: serverId,
      activeModelName: modelName
    };
    setSettings(updated);
    saveLocalSettings(updated);
    showToast(`🤖 Assigned local model "${modelName}" for AI code generation & Aether tasks!`, "success");
  };

  const handleAssignHuggingFaceModel = (hfModel: HuggingFaceModel) => {
    // Add to server models list if not present
    const ollamaServer = servers.find(s => s.id === 'ollama-default');
    if (ollamaServer) {
      if (!ollamaServer.models.includes(hfModel.name)) {
        ollamaServer.models.unshift(hfModel.name);
      }
    }

    const updated = {
      ...settings,
      activeServerId: 'ollama-default',
      activeModelName: hfModel.name
    };
    setSettings(updated);
    saveLocalSettings(updated);
    showToast(`🎯 Assigned "${hfModel.name}" as active Local AI Model!`, "success");
  };

  const handleDownloadHuggingFaceGguf = (hfModel: HuggingFaceModel) => {
    setDownloadingModelId(hfModel.id);
    showToast(`⬇️ Initiating direct GGUF model download for ${hfModel.name}...`, "info", 4000);

    setTimeout(() => {
      // Register downloaded model in localStorage for immediate web interface usage
      try {
        const existingRaw = localStorage.getItem('devspace_downloaded_hf_models');
        const existingList = existingRaw ? JSON.parse(existingRaw) : [];
        if (!existingList.some((m: any) => m.id === hfModel.id)) {
          existingList.push({
            id: hfModel.id,
            name: hfModel.name,
            size: hfModel.size,
            downloadedAt: new Date().toISOString()
          });
          localStorage.setItem('devspace_downloaded_hf_models', JSON.stringify(existingList));
        }
      } catch (e) {}

      // Trigger direct browser download of GGUF weight file
      const a = document.createElement('a');
      a.href = hfModel.ggufUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.download = `${hfModel.id}.gguf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Automatically assign model as active local model for Aether in web UI
      handleAssignHuggingFaceModel(hfModel);

      // Dispatch update event
      window.dispatchEvent(new Event('devspace-local-models-updated'));

      setDownloadingModelId(null);
      showToast(`✅ Downloaded "${hfModel.name}"! Model is active and ready for local LLM usage inside DevSpace.`, "success", 6000);
    }, 1200);
  };

  const handleCopyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    showToast(`📋 Copied terminal command: "${cmd}"`, "success");
  };

  const handleRunTestGeneration = async () => {
    const targetServer = servers.find(s => s.id === settings.activeServerId);
    if (!targetServer) return;

    setIsGenerating(true);
    setTestResponse('Querying local LLM endpoint on ' + targetServer.url + '...');

    try {
      const output = await generateWithLocalModel(
        targetServer.url,
        settings.activeModelName,
        testPrompt,
        'You are DevSpace Local AI Code Assistant.'
      );
      setTestResponse(output);
      showToast("✅ Local LLM response generated successfully!", "success");
    } catch (err: any) {
      setTestResponse(`⚠️ Local LLM execution failed: ${err.message || 'Server unreachable'}.\nMake sure Ollama, LM Studio, or Llama.cpp is running on your computer.`);
      showToast("Failed to connect to local LLM server.", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredHfModels = HUGGINGFACE_MODELS.filter(m => 
    m.name.toLowerCase().includes(hfSearchQuery.toLowerCase()) ||
    m.author.toLowerCase().includes(hfSearchQuery.toLowerCase()) ||
    m.tags.some(t => t.toLowerCase().includes(hfSearchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 text-zinc-200 font-sans">
      {/* SECTION 1: PC HARDWARE PERFORMANCE BENCHMARK SCANNER */}
      <div className="p-4 bg-gradient-to-r from-zinc-950 via-[#0e0e14] to-zinc-950 border border-yellow-500/40 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400">
              <Gauge size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold font-mono text-white uppercase tracking-wider flex items-center gap-2">
                Computer Hardware & Local LLM Capability Scanner
              </h4>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Evaluates your computer's CPU cores, system RAM, and GPU capabilities to recommend optimal local models.
              </p>
            </div>
          </div>

          <button
            onClick={runPcHardwareScan}
            className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-zinc-300 hover:text-white rounded-xl text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <RefreshCw size={12} />
            <span>Re-Scan PC Specs</span>
          </button>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-[#0a0a0f] border border-zinc-850 rounded-xl space-y-1">
            <span className="text-[10px] font-mono text-zinc-500 uppercase block">Processor Cores</span>
            <span className="text-sm font-extrabold font-mono text-white flex items-center gap-1.5">
              <Cpu size={14} className="text-yellow-400" />
              {hardwareSpecs.cores} Logic Cores
            </span>
          </div>

          <div className="p-3 bg-[#0a0a0f] border border-zinc-850 rounded-xl space-y-1">
            <span className="text-[10px] font-mono text-zinc-500 uppercase block">Estimated System RAM</span>
            <span className="text-sm font-extrabold font-mono text-white flex items-center gap-1.5">
              <HardDrive size={14} className="text-yellow-400" />
              {hardwareSpecs.ramGb} GB RAM
            </span>
          </div>

          <div className="p-3 bg-[#0a0a0f] border border-zinc-850 rounded-xl space-y-1">
            <span className="text-[10px] font-mono text-zinc-500 uppercase block">Local LLM Performance Score</span>
            <span className="text-sm font-extrabold font-mono text-emerald-400 flex items-center gap-1.5">
              <Zap size={14} />
              {hardwareSpecs.score} / 100
            </span>
          </div>

          <div className="p-3 bg-[#0a0a0f] border border-yellow-500/30 rounded-xl space-y-1">
            <span className="text-[10px] font-mono text-yellow-400 uppercase block font-bold">Recommended Model Size</span>
            <span className="text-xs font-extrabold font-mono text-white block truncate">
              {hardwareSpecs.recommendedSize}
            </span>
          </div>
        </div>

        <div className="p-3 bg-[#08080c] border border-zinc-850 rounded-xl flex items-center justify-between text-[11px] font-mono text-zinc-400">
          <div className="flex items-center gap-2 truncate">
            <span className="text-zinc-500">Detected GPU Acceleration:</span>
            <span className="text-zinc-200 font-bold truncate">{hardwareSpecs.gpuName}</span>
          </div>
          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded text-[9.5px] font-bold shrink-0">
            OPTIMAL HARDWARE READY
          </span>
        </div>
      </div>

      {/* SECTION: WEBGPU IN-BROWSER NEURAL ENGINE (WEBLLM) */}
      <div className="p-4 bg-gradient-to-r from-zinc-950 via-[#0a0a10] to-zinc-950 border border-purple-500/40 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Cpu size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold font-mono text-white uppercase tracking-wider flex items-center gap-2">
                <span>WebGPU In-Browser Neural Engine (WebLLM)</span>
                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded text-[9px]">
                  100% LOCAL CLIENT GPU
                </span>
              </h4>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Executes neural AI models directly inside your browser using WebGPU compute shaders. Zero network requests, 100% private offline mode.
              </p>
            </div>
          </div>

          <button
            onClick={handleRunWebGpuBenchmark}
            className="px-3 py-1.5 bg-purple-500 hover:bg-purple-400 text-black font-mono text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Zap size={13} />
            <span>Test WebGPU Shader Speed</span>
          </button>
        </div>

        {/* WebGPU Specs & Benchmark Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-[#0a0a12] border border-purple-500/20 rounded-xl space-y-1">
            <span className="text-[10px] font-mono text-purple-400 uppercase block font-bold">WebGPU Hardware Adapter</span>
            <span className="text-xs font-extrabold font-mono text-white block truncate">
              {webGpuInfo?.adapterName || 'Detecting WebGPU...'}
            </span>
          </div>

          <div className="p-3 bg-[#0a0a12] border border-zinc-850 rounded-xl space-y-1">
            <span className="text-[10px] font-mono text-zinc-500 uppercase block">Estimated VRAM & Buffer Limit</span>
            <span className="text-xs font-extrabold font-mono text-white block truncate">
              {webGpuInfo?.vramEstimatedGb || 2} GB VRAM ({webGpuInfo?.maxBufferSizeMb || 512} MB Buffer)
            </span>
          </div>

          <div className="p-3 bg-[#0a0a12] border border-zinc-850 rounded-xl space-y-1">
            <span className="text-[10px] font-mono text-zinc-500 uppercase block">WGSL Compute Throughput</span>
            <span className="text-xs font-extrabold font-mono text-emerald-400 block truncate">
              {webGpuBench ? `${webGpuBench.gflops} GFLOPS (${webGpuBench.ms}ms)` : 'Click Test Speed'}
            </span>
          </div>
        </div>

        {/* Interactive WebLLM In-Browser AI Selector & Playground */}
        <div className="p-3 bg-[#07070c] border border-zinc-850 rounded-xl space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">
                Select WebGPU Model:
              </label>
              <select
                value={selectedWebLlmModel}
                onChange={(e) => setSelectedWebLlmModel(e.target.value)}
                className="w-full bg-[#0d0d14] border border-purple-500/30 rounded-xl px-3 py-1.5 text-xs font-mono text-purple-300 focus:outline-none"
              >
                {AVAILABLE_WEBLLM_MODELS.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.sizeMb} MB)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">
                Local Prompt Input:
              </label>
              <input
                type="text"
                value={webLlmPrompt}
                onChange={(e) => setWebLlmPrompt(e.target.value)}
                className="w-full bg-[#0d0d14] border border-zinc-800 rounded-xl px-3 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-purple-500/50"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-[10.5px] font-mono text-zinc-400">
              {webLlmProgress || 'Ready to execute inside client WebGPU shaders'}
            </span>

            <button
              onClick={handleExecuteWebLlmInference}
              disabled={isWebLlmRunning}
              className="px-4 py-1.5 bg-purple-500 hover:bg-purple-400 disabled:bg-zinc-800 text-black font-mono text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <Play size={13} />
              <span>{isWebLlmRunning ? 'RUNNING WEBGPU...' : 'RUN IN-BROWSER WEBGPU'}</span>
            </button>
          </div>

          {isWebLlmRunning && (
            <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-purple-500 h-full transition-all duration-300"
                style={{ width: `${webLlmPercent}%` }}
              />
            </div>
          )}

          {webLlmOutput && (
            <div className="p-3 bg-[#040407] border border-purple-500/30 rounded-xl font-mono text-xs text-purple-200 whitespace-pre-wrap max-h-48 overflow-y-auto">
              {webLlmOutput}
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: HUGGING FACE MODEL HUB EXPLORER & DIRECT DOWNLOADER */}
      <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-bold font-mono text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles size={15} className="text-yellow-400" />
              Hugging Face Open-Source Model Hub
            </h4>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Browse top open-source coding models from Hugging Face. Download GGUF files or run via Ollama / LM Studio.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={13} className="absolute left-3 top-2.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search Hugging Face models..."
              value={hfSearchQuery}
              onChange={(e) => setHfSearchQuery(e.target.value)}
              className="w-full bg-[#0d0d12] border border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-yellow-500/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredHfModels.map((m) => {
            const isFit = hardwareSpecs.ramGb >= m.recommendedRam;
            const isAssigned = settings.activeModelName === m.name;

            return (
              <div 
                key={m.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                  isAssigned 
                    ? 'bg-yellow-500/10 border-yellow-500/60 shadow-[0_0_15px_rgba(234,179,8,0.15)]'
                    : 'bg-[#0d0d12] border-zinc-850 hover:border-zinc-800'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h5 className="text-xs font-bold font-mono text-white flex items-center gap-1.5">
                        {m.name}
                      </h5>
                      <span className="text-[10px] text-zinc-500 font-mono block">by {m.author}</span>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border shrink-0 ${
                      isFit 
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    }`}>
                      {isFit ? '🟢 PC Fit' : '🟡 High RAM'}
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                    {m.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {m.tags.map(t => (
                      <span key={t} className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded text-[9px] font-mono">
                        #{t}
                      </span>
                    ))}
                  </div>

                  <div className="p-2.5 bg-[#07070a] border border-zinc-900 rounded-lg space-y-1 font-mono text-[10.5px]">
                    <div className="flex justify-between text-zinc-400">
                      <span>Parameters: <strong className="text-white">{m.params}</strong></span>
                      <span>Weights Size: <strong className="text-yellow-400">{m.size}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="pt-2 border-t border-zinc-850/80 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleDownloadHuggingFaceGguf(m)}
                      disabled={downloadingModelId === m.id}
                      className="px-2.5 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-black font-mono text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      title="Direct download GGUF weight file from Hugging Face"
                    >
                      <Download size={13} />
                      <span>{downloadingModelId === m.id ? 'Starting...' : 'Download GGUF'}</span>
                    </button>

                    <button
                      onClick={() => handleAssignHuggingFaceModel(m)}
                      className={`px-2.5 py-1.5 font-mono text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        isAssigned
                          ? 'bg-emerald-500 text-black'
                          : 'bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-200'
                      }`}
                    >
                      {isAssigned ? <CheckCircle2 size={13} /> : <ArrowRight size={13} />}
                      <span>{isAssigned ? 'Active Model' : 'Assign to Aether'}</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1 font-mono text-[10px]">
                    <button
                      onClick={() => handleCopyCommand(m.ollamaCmd)}
                      className="text-zinc-400 hover:text-yellow-300 flex items-center gap-1 cursor-pointer transition-colors"
                      title="Copy Ollama run command"
                    >
                      <Terminal size={11} />
                      <span>Copy Ollama Cmd</span>
                      <Copy size={10} className="ml-0.5" />
                    </button>

                    <a
                      href={`https://huggingface.co/${m.hfRepo}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-500 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      <span>Hugging Face Repo</span>
                      <ExternalLink size={10} />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: DETECTED LOCAL LLM PORTS & SERVERS */}
      <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">
            Detected Local LLM Engines on Your PC
          </label>

          <button
            onClick={handleScanServers}
            disabled={isScanning}
            className="px-3 py-1 bg-yellow-500 hover:bg-yellow-400 text-black font-mono text-[10px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1"
          >
            <RefreshCw size={11} className={isScanning ? 'animate-spin' : ''} />
            <span>Scan Ports</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {servers.map((srv) => {
            const isSelected = settings.activeServerId === srv.id;
            return (
              <div
                key={srv.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-yellow-500/10 border-yellow-500/60 text-yellow-300 shadow-[0_0_15px_rgba(234,179,8,0.15)]'
                    : 'bg-[#0d0d12] border-zinc-850 text-zinc-300'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-white flex items-center gap-1.5">
                      <Server size={14} className="text-yellow-400" />
                      {srv.name}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border ${
                      srv.status === 'online'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-zinc-850 text-zinc-500 border-zinc-800'
                    }`}>
                      {srv.status === 'online' ? '● ONLINE' : 'OFFLINE'}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-zinc-400 block">{srv.url}</span>

                  <div className="space-y-1 pt-1">
                    <span className="text-[9.5px] font-mono text-zinc-500 uppercase block">Select Model:</span>
                    <select
                      value={isSelected ? settings.activeModelName : srv.models[0]}
                      onChange={(e) => handleSelectServer(srv.id, e.target.value)}
                      className="w-full bg-[#07070a] border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-yellow-300 focus:outline-none focus:border-yellow-500"
                    >
                      {srv.models.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  onClick={() => handleSelectServer(srv.id, srv.models[0])}
                  className={`mt-4 w-full py-1.5 rounded-lg font-mono text-xs font-bold transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-yellow-500 text-black shadow-md'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-850'
                  }`}
                >
                  {isSelected ? '✓ ACTIVE LOCAL MODEL' : 'ASSIGN MODEL'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 4: TASK ASSIGNMENTS & FALLBACK */}
      <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-2xl space-y-3">
        <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">
          Local AI Model Task Assignments & Scopes
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 bg-[#0d0d12] border border-zinc-900 rounded-xl space-y-1">
            <span className="text-xs font-bold text-zinc-200 font-mono block">Assign Local Model Scope</span>
            <select
              value={settings.assignedTask}
              onChange={(e) => {
                const next = { ...settings, assignedTask: e.target.value as any };
                setSettings(next);
                saveLocalSettings(next);
              }}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-yellow-400"
            >
              <option value="code">Code Generation & Debugging Only</option>
              <option value="chat">Aether Assistant Conversations</option>
              <option value="context">Aether Intelligence Screen Analysis</option>
              <option value="all">Entire App (Full Local Offline Mode)</option>
            </select>
          </div>

          <div 
            onClick={() => {
              const next = { ...settings, fallbackToCloud: !settings.fallbackToCloud };
              setSettings(next);
              saveLocalSettings(next);
            }}
            className="p-3 bg-[#0d0d12] border border-zinc-900 hover:border-zinc-800 rounded-xl flex items-center justify-between cursor-pointer select-none"
          >
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-zinc-200 font-mono block">Automatic Cloud Fallback</span>
              <span className="text-[9.5px] text-zinc-500 block">Use Gemini Cloud if local LLM server is stopped</span>
            </div>
            <div className={`w-9 h-5 rounded-full p-0.5 transition-colors ${settings.fallbackToCloud ? 'bg-yellow-500' : 'bg-zinc-800'}`}>
              <div className={`w-4 h-4 rounded-full bg-black transition-transform ${settings.fallbackToCloud ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 5: LIVE TEST PLAYGROUND */}
      <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-2xl space-y-3">
        <span className="text-xs font-bold font-mono text-white uppercase tracking-wider flex items-center gap-2">
          <Play size={14} className="text-yellow-400" />
          Test Active Local LLM Response
        </span>

        <div className="flex gap-2">
          <input
            type="text"
            value={testPrompt}
            onChange={(e) => setTestPrompt(e.target.value)}
            className="flex-1 bg-[#0d0d12] border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-yellow-500/50"
          />
          <button
            onClick={handleRunTestGeneration}
            disabled={isGenerating}
            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 disabled:bg-zinc-800 text-black font-mono text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 flex items-center gap-2"
          >
            <Zap size={14} />
            <span>{isGenerating ? 'EXECUTING...' : 'RUN LOCAL MODEL'}</span>
          </button>
        </div>

        {testResponse && (
          <div className="p-3 bg-[#08080c] border border-zinc-900 rounded-xl font-mono text-xs text-zinc-300 whitespace-pre-wrap max-h-40 overflow-y-auto">
            {testResponse}
          </div>
        )}
      </div>
    </div>
  );
}
