export interface LocalServerConfig {
  id: string;
  name: string;
  url: string;
  type: 'ollama' | 'lmstudio' | 'llamacpp' | 'custom';
  status: 'online' | 'offline' | 'checking';
  models: string[];
}

export interface LocalModelSettings {
  activeServerId: string;
  activeModelName: string;
  assignedTask: 'code' | 'chat' | 'context' | 'all';
  fallbackToCloud: boolean;
}

const DEFAULT_SERVERS: LocalServerConfig[] = [
  {
    id: 'ollama-default',
    name: 'Ollama Local LLM Engine',
    url: 'http://localhost:11434',
    type: 'ollama',
    status: 'offline',
    models: ['llama3:8b', 'codellama:13b', 'qwen2.5-coder:7b', 'deepseek-coder-v2', 'mistral:7b']
  },
  {
    id: 'lmstudio-default',
    name: 'LM Studio Local Server',
    url: 'http://localhost:1234',
    type: 'lmstudio',
    status: 'offline',
    models: ['local-model', 'qwen-2.5-coder-32b-instruct', 'deepseek-coder-6.7b']
  },
  {
    id: 'llamacpp-default',
    name: 'Llama.cpp HTTP API',
    url: 'http://localhost:8080',
    type: 'llamacpp',
    status: 'offline',
    models: ['ggml-model-q4_0']
  }
];

export async function probeLocalServer(server: LocalServerConfig): Promise<{ status: 'online' | 'offline'; models: string[] }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000);

  try {
    let endpoint = `${server.url}/v1/models`;
    if (server.type === 'ollama') {
      endpoint = `${server.url}/api/tags`;
    }

    const res = await fetch(endpoint, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      let detectedModels: string[] = [];

      if (server.type === 'ollama' && Array.isArray(data?.models)) {
        detectedModels = data.models.map((m: any) => m.name || m.model);
      } else if (Array.isArray(data?.data)) {
        detectedModels = data.data.map((m: any) => m.id || m.name);
      }

      if (detectedModels.length === 0) {
        detectedModels = server.models;
      }

      return { status: 'online', models: detectedModels };
    }
  } catch (err) {
    clearTimeout(timeoutId);
  }

  // Fallback: Try backend server proxy
  try {
    const proxyRes = await fetch(`/api/ollama/status?url=${encodeURIComponent(server.url)}`);
    if (proxyRes.ok) {
      const data = await proxyRes.json();
      if (data.online) {
        return { status: 'online', models: data.models && data.models.length > 0 ? data.models : server.models };
      }
    }
  } catch (proxyErr) {}

  return { status: 'offline', models: server.models };
}

export async function generateWithLocalModel(
  serverUrl: string,
  modelName: string,
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    // Attempt Ollama API endpoint directly first
    if (serverUrl.includes('11434')) {
      const res = await fetch(`${serverUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: modelName,
          prompt: `${systemPrompt ? `[System: ${systemPrompt}]\n` : ''}${prompt}`,
          stream: false
        })
      });

      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        return data.response || 'Local model returned empty response.';
      }
    }

    // OpenAI Compatible Endpoint (LM Studio / Llama.cpp)
    const res = await fetch(`${serverUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'system', content: systemPrompt || 'You are Aether Local AI Assistant for DevSpace.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2
      })
    });

    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      return data.choices?.[0]?.message?.content || 'Local model returned empty response.';
    }
  } catch (e: any) {
    clearTimeout(timeoutId);
  }

  // Fallback: Proxy request through backend endpoint /api/ollama/chat
  try {
    const proxyRes = await fetch('/api/ollama/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: serverUrl,
        model: modelName,
        prompt,
        systemPrompt
      })
    });

    if (proxyRes.ok) {
      const data = await proxyRes.json();
      if (data.response) return data.response;
    } else {
      const errData = await proxyRes.json().catch(() => ({}));
      if (errData.error) {
        throw new Error(`${errData.error}. ${errData.hint || ''}`);
      }
    }
  } catch (proxyErr: any) {
    throw new Error(`Local model execution failed: ${proxyErr.message || 'Server unreachable'}`);
  }

  throw new Error('Local server returned invalid response format.');
}

export function getLocalSettings(): LocalModelSettings {
  try {
    const raw = localStorage.getItem('devspace_local_model_settings');
    if (raw) return JSON.parse(raw);
  } catch (e) {}

  return {
    activeServerId: 'ollama-default',
    activeModelName: 'codellama:13b',
    assignedTask: 'code',
    fallbackToCloud: true
  };
}

export function saveLocalSettings(settings: LocalModelSettings) {
  localStorage.setItem('devspace_local_model_settings', JSON.stringify(settings));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('devspace-local-models-updated'));
  }
}

export interface AIModelChoice {
  id: string;
  name: string;
  isLocal?: boolean;
  category: 'cloud' | 'local';
  description?: string;
}

export function getAllAvailableModels(): AIModelChoice[] {
  const baseCloudModels: AIModelChoice[] = [
    { id: 'gemini-3.7-flash', name: 'Gemini 3.7 Flash (Balanced Orchestrator)', category: 'cloud', description: 'Google Standard Fast Multi-Modal LLM' },
    { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro (Cognitive Executive)', category: 'cloud', description: 'Google Deep Reasoning & Code Architecture' },
    { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite (Ultra Fast)', category: 'cloud', description: 'Low Latency High Throughput' },
    { id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (Anthropic)', category: 'cloud', description: 'Advanced System Refactoring' }
  ];

  const localModels: AIModelChoice[] = [
    { id: 'local:qwen2.5-coder:7b', name: '💻 Local: Qwen 2.5 Coder 7B (Ollama)', isLocal: true, category: 'local', description: 'Top Open-Source Coding Model' },
    { id: 'local:deepseek-coder-v2:16b', name: '💻 Local: DeepSeek Coder V2 16B (Ollama MoE)', isLocal: true, category: 'local', description: 'Mixture of Experts Refactoring' },
    { id: 'local:llama3.2:3b', name: '💻 Local: Llama 3.2 3B Instruct (Ollama)', isLocal: true, category: 'local', description: 'Meta Ultra-Fast Lightweight LLM' },
    { id: 'local:codellama:13b', name: '💻 Local: CodeLlama 13B (Ollama)', isLocal: true, category: 'local', description: 'Battle-Tested Code LLM' },
    { id: 'local:qwen-2.5-coder-32b-instruct', name: '💻 Local: Qwen 2.5 Coder 32B (LM Studio)', isLocal: true, category: 'local', description: '32B High-Precision Local Model' }
  ];

  // Include active custom settings model if user chose a specific model
  const activeLocal = getLocalSettings();
  if (activeLocal?.activeModelName) {
    const customId = `local:${activeLocal.activeModelName}`;
    if (!localModels.some(m => m.id === customId)) {
      localModels.unshift({
        id: customId,
        name: `💻 Local Active: ${activeLocal.activeModelName}`,
        isLocal: true,
        category: 'local',
        description: 'Active Local LLM Engine'
      });
    }
  }

  // Include downloaded Hugging Face models from localStorage
  try {
    const customLocalRaw = localStorage.getItem('devspace_downloaded_hf_models');
    if (customLocalRaw) {
      const customList = JSON.parse(customLocalRaw);
      if (Array.isArray(customList)) {
        customList.forEach((m: any) => {
          if (m?.id && !localModels.some(existing => existing.id === `local:${m.id}` || existing.id === `local:${m.name}`)) {
            localModels.push({
              id: `local:${m.id}`,
              name: `💻 Local HF: ${m.name || m.id}`,
              isLocal: true,
              category: 'local',
              description: `Hugging Face GGUF (${m.size || 'Local Model'})`
            });
          }
        });
      }
    }
  } catch (e) {}

  return [...baseCloudModels, ...localModels];
}

export { DEFAULT_SERVERS };
