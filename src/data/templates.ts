export const DEFAULT_TEMPLATES = {
  vanilla: {
    'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DevSpace Interactive Sandbox</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#0b0c10] text-[#c5c6c7] min-h-screen flex flex-col items-center justify-center p-6">
  <div class="max-w-md w-full bg-[#1f2833] border border-[#45f3ff]/20 rounded-2xl p-8 shadow-2xl text-center space-y-6">
    <div class="inline-flex p-4 bg-[#45f3ff]/10 rounded-full text-[#45f3ff]">
      <svg class="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
      </svg>
    </div>
    <div class="space-y-2">
      <h1 class="text-2xl font-bold tracking-tight text-white">Dynamic Sandbox App</h1>
      <p class="text-xs text-[#66fcf1]">Powered by Google AI Studio & DevSpace</p>
    </div>
    <div class="p-4 bg-[#0b0c10]/50 rounded-lg border border-[#45f3ff]/10 text-left">
      <p class="text-[11px] font-mono leading-relaxed">
        Click the buttons below to interact, or edit <span class="text-[#45f3ff]">app.js</span> in the Code tab.
      </p>
    </div>
    <div class="flex gap-3 justify-center">
      <button id="actionBtn" class="px-5 py-2.5 bg-[#66fcf1] hover:bg-[#45f3ff] text-[#0b0c10] font-semibold text-xs rounded-lg transition-all shadow-lg shadow-[#66fcf1]/20 active:scale-95 cursor-pointer">
        Click Me
      </button>
      <button id="logBtn" class="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 font-semibold text-xs rounded-lg transition-all active:scale-95 cursor-pointer">
        Emit Test Log
      </button>
    </div>
    <div id="statusText" class="text-xs text-zinc-500 italic h-4">Waiting for user interaction...</div>
  </div>

  <script src="app.js"></script>
</body>
</html>`,
    'app.js': `// Developer Sandbox Interactive Script
console.log('✨ Live virtual sandbox container initialized successfully.');

const actionBtn = document.getElementById('actionBtn');
const logBtn = document.getElementById('logBtn');
const statusText = document.getElementById('statusText');

let clickCount = 0;

if (actionBtn) {
  actionBtn.addEventListener('click', () => {
    clickCount++;
    console.log(\`[User UI Action] Action Button clicked \${clickCount} times\`);
    statusText.textContent = \`Button clicked \${clickCount} times!\`;
    
    // Play subtle animation
    actionBtn.classList.add('scale-110');
    setTimeout(() => actionBtn.classList.remove('scale-110'), 150);
  });
}

if (logBtn) {
  logBtn.addEventListener('click', () => {
    console.warn('[Logger Widget] Warning emitted manually from the sandbox!');
    console.error('[Error Matrix] Simulated warning logs compiled successfully.');
    console.log('[Info Channel] Hello from the virtual iframe terminal!');
  });
}`,
    'styles.css': `/* Interactive Sandbox Styles */
body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  overflow: hidden;
}`
  },
  dashboard: {
    'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Metrics Dashboard</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#0e0e12] text-zinc-100 p-8 min-h-screen">
  <div class="max-w-6xl mx-auto space-y-6">
    <div class="flex justify-between items-center border-b border-zinc-800 pb-4">
      <div>
        <h1 class="text-2xl font-bold tracking-wider text-white">SYSTEM METRICS RADAR</h1>
        <p class="text-xs text-zinc-500">Google Cloud Platform & Node Host Sandbox</p>
      </div>
      <div class="flex items-center gap-3">
        <span class="inline-block w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
        <span class="text-xs font-mono text-emerald-400">Sandbox Core: Live</span>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-1">
        <div class="text-zinc-500 text-[10px] uppercase font-mono">CPU Load</div>
        <div class="text-2xl font-bold font-mono text-yellow-400" id="cpuVal">24.2%</div>
        <div class="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
          <div class="bg-yellow-400 h-full w-[24%]" id="cpuBar"></div>
        </div>
      </div>
      <div class="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-1">
        <div class="text-zinc-500 text-[10px] uppercase font-mono">Memory Usage</div>
        <div class="text-2xl font-bold font-mono text-blue-400" id="memVal">4.12 GB</div>
        <div class="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
          <div class="bg-blue-400 h-full w-[51%]" id="memBar"></div>
        </div>
      </div>
      <div class="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-1">
        <div class="text-zinc-500 text-[10px] uppercase font-mono">Ingress API Traffic</div>
        <div class="text-2xl font-bold font-mono text-green-400" id="trafficVal">1,245 rq/m</div>
        <div class="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
          <div class="bg-green-400 h-full w-[65%]" id="trafficBar"></div>
        </div>
      </div>
      <div class="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-1">
        <div class="text-zinc-500 text-[10px] uppercase font-mono">Active Subagents</div>
        <div class="text-2xl font-bold font-mono text-purple-400">4 Bots</div>
        <div class="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
          <div class="bg-purple-400 h-full w-[100%]"></div>
        </div>
      </div>
    </div>

    <!-- Active Swarms Chart Mock -->
    <div class="bg-zinc-900 border border-zinc-800 p-6 rounded-xl space-y-4">
      <h3 class="text-sm font-semibold tracking-wider">SWARM ENGINE LOAD TELEMETRY</h3>
      <div class="h-48 flex items-end gap-2 border-b border-l border-zinc-800 p-2 font-mono text-xs text-zinc-500" id="barsContainer">
        <!-- Bars generated dynamically -->
      </div>
      <div class="flex justify-between text-[10px] font-mono text-zinc-500">
        <span>10s ago</span>
        <span>5s ago</span>
        <span>Now</span>
      </div>
    </div>
  </div>

  <script src="app.js"></script>
</body>
</html>`,
    'app.js': `// System Metrics Dynamic Sandbox Code
console.log('📊 Swarm telemetry dashboard controller bound.');

// Update Mock telemetry
const cpuVal = document.getElementById('cpuVal');
const cpuBar = document.getElementById('cpuBar');
const memVal = document.getElementById('memVal');
const memBar = document.getElementById('memBar');
const trafficVal = document.getElementById('trafficVal');
const trafficBar = document.getElementById('trafficBar');
const barsContainer = document.getElementById('barsContainer');

// Render initial load bars
for (let i = 0; i < 30; i++) {
  const h = Math.floor(Math.random() * 80) + 15;
  const bar = document.createElement('div');
  bar.className = 'bg-indigo-500 hover:bg-[#66fcf1] transition-all flex-1 rounded-t';
  bar.style.height = \`\${h}%\`;
  if (barsContainer) barsContainer.appendChild(bar);
}

setInterval(() => {
  const nextCpu = (Math.random() * 35 + 10).toFixed(1);
  const nextMem = (Math.random() * 0.8 + 3.8).toFixed(2);
  const nextTraffic = Math.floor(Math.random() * 400 + 1000);

  if (cpuVal) cpuVal.textContent = \`\${nextCpu}%\`;
  if (cpuBar) cpuBar.style.width = \`\${nextCpu}%\`;
  
  if (memVal) memVal.textContent = \`\${nextMem} GB\`;
  if (memBar) memBar.style.width = \`\${(nextMem / 8) * 100}%\`;

  if (trafficVal) trafficVal.textContent = \`\${nextTraffic.toLocaleString()} rq/m\`;
  if (trafficBar) trafficBar.style.width = \`\${(nextTraffic / 2000) * 100}%\`;

  // Shift and inject a new telemetry bar
  if (barsContainer) {
    const first = barsContainer.firstElementChild;
    if (first) barsContainer.removeChild(first);
    
    const h = Math.floor(Math.random() * 80) + 15;
    const bar = document.createElement('div');
    bar.className = 'bg-indigo-500 hover:bg-[#66fcf1] transition-all flex-1 rounded-t';
    bar.style.height = \`\${h}%\`;
    barsContainer.appendChild(bar);
  }

  console.log(\`[System Stats] CPU: \${nextCpu}%, Mem: \${nextMem}GB, Traffic: \${nextTraffic}rq/m\`);
}, 3000);`
  },
  chatbot: {
    'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Aether AI Assistant Chatbot</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#0b0c10] text-[#c5c6c7] min-h-screen flex items-center justify-center p-6">
  <div class="max-w-md w-full bg-[#1f2833]/90 border border-[#45f3ff]/30 rounded-2xl p-6 shadow-2xl flex flex-col h-[500px]">
    <div class="flex items-center gap-3 border-b border-[#45f3ff]/20 pb-4 shrink-0">
      <div class="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></div>
      <div>
        <h1 class="text-sm font-bold text-white tracking-wider">AETHER INTEL CORE</h1>
        <p class="text-[10px] text-[#66fcf1]">Standard Gemini-Powered Sandbox Agent</p>
      </div>
    </div>

    <!-- Scrollable Chat area -->
    <div id="chatHistory" class="flex-1 overflow-y-auto my-4 space-y-3 pr-1 text-xs">
      <div class="bg-[#0b0c10]/60 p-3 rounded-xl border border-zinc-800">
        <p class="font-bold text-yellow-400 font-mono text-[10px]">AETHER AI [10:24 AM]</p>
        <p class="mt-1 leading-relaxed">Greetings, operator. I am initialized and awaiting your creative directives inside this sandbox window. Ask me to formulate responses or trigger mock status alerts!</p>
      </div>
    </div>

    <!-- Typing status -->
    <div id="typingIndicator" class="text-[10px] text-zinc-500 italic mb-2 hidden">Aether is calculating response vectors...</div>

    <!-- Input bar -->
    <div class="flex gap-2 shrink-0">
      <input 
        id="userInput" 
        type="text" 
        placeholder="Type a query and press Enter..." 
        class="flex-1 bg-[#0b0c10] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#45f3ff]/50"
      />
      <button 
        id="sendBtn" 
        class="bg-[#66fcf1] hover:bg-[#45f3ff] text-[#0b0c10] font-bold text-xs px-4 rounded-lg transition-all active:scale-95"
      >
        Send
      </button>
    </div>
  </div>

  <script src="app.js"></script>
</body>
</html>`,
    'app.js': `// Aether Chatbot Sandbox Controller
console.log('🤖 Aether Chatbot interface registered successfully.');

const chatHistory = document.getElementById('chatHistory');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const typingIndicator = document.getElementById('typingIndicator');

const addBubble = (sender, text, isAi = false) => {
  const div = document.createElement('div');
  div.className = \`p-3 rounded-xl border \${isAi ? 'bg-[#0b0c10]/60 border-zinc-800' : 'bg-zinc-800/60 border-zinc-700 ml-8'}\`;
  
  const header = document.createElement('p');
  header.className = \`font-bold font-mono text-[10px] \${isAi ? 'text-yellow-400' : 'text-blue-400'}\`;
  header.textContent = \`\${sender} [\${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}]\`;
  
  const content = document.createElement('p');
  content.className = 'mt-1 leading-relaxed';
  content.textContent = text;
  
  div.appendChild(header);
  div.appendChild(content);
  chatHistory.appendChild(div);
  
  // Auto scroll
  chatHistory.scrollTop = chatHistory.scrollHeight;
};

const handleSend = () => {
  const text = userInput.value.trim();
  if (!text) return;
  
  console.log(\`[User Chat Input] sending: "\${text}"\`);
  addBubble('OPERATOR', text, false);
  userInput.value = '';
  
  // Show typing
  typingIndicator.classList.remove('hidden');
  
  // Simulate AI Response
  setTimeout(() => {
    typingIndicator.classList.add('hidden');
    let aiText = '';
    
    if (text.toLowerCase().includes('hello') || text.toLowerCase().includes('hi')) {
      aiText = "Hello operator! I am executing fine. How can I assist in refining your sandbox today?";
    } else if (text.toLowerCase().includes('error') || text.toLowerCase().includes('bug')) {
      aiText = "Diagnostic warnings check out fine! No compile errors detected in our sandbox pipeline.";
      console.warn('[Aether Intercept] Simulated warning triggered.');
    } else {
      aiText = \`Aether node synced! I have evaluated: "\${text}" and confirmed stable throughput parameters.\`;
    }
    
    addBubble('AETHER AI', aiText, true);
    console.log(\`[Aether Response] generated successfully.\`);
  }, 1200);
};

if (sendBtn) sendBtn.addEventListener('click', handleSend);
if (userInput) {
  userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSend();
  });
}
`,
    'styles.css': `body {
  background: radial-gradient(circle at center, #141a29 0%, #080a10 100%);
}`
  },
  kanban: {
    'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Developer Task Kanban Board</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#0b0c10] text-[#c5c6c7] p-6 min-h-screen">
  <div class="max-w-4xl mx-auto space-y-6">
    <div class="flex justify-between items-center border-b border-zinc-800 pb-4">
      <div>
        <h1 class="text-xl font-extrabold tracking-wider text-white">WORKFLOW KANBAN</h1>
        <p class="text-[11px] text-[#66fcf1]">Sleek, responsive task visualizer</p>
      </div>
      <button 
        id="newTaskBtn" 
        class="bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs px-3.5 py-1.5 rounded-lg transition-all active:scale-95"
      >
        + Add Task
      </button>
    </div>

    <!-- Board Columns Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- TODO Column -->
      <div class="bg-[#1f2833]/60 border border-zinc-800/80 p-4 rounded-xl flex flex-col min-h-[350px]">
        <div class="flex justify-between items-center mb-3">
          <span class="text-xs font-bold text-yellow-500 font-mono">BACKLOG</span>
          <span id="todoCount" class="bg-zinc-800 text-white px-2 py-0.5 rounded-full text-[10px] font-mono">2</span>
        </div>
        <div id="todoList" class="flex-1 space-y-3"></div>
      </div>

      <!-- IN PROGRESS Column -->
      <div class="bg-[#1f2833]/60 border border-zinc-800/80 p-4 rounded-xl flex flex-col min-h-[350px]">
        <div class="flex justify-between items-center mb-3">
          <span class="text-xs font-bold text-blue-400 font-mono">IN PROGRESS</span>
          <span id="progressCount" class="bg-zinc-800 text-white px-2 py-0.5 rounded-full text-[10px] font-mono">1</span>
        </div>
        <div id="progressList" class="flex-1 space-y-3"></div>
      </div>

      <!-- DONE Column -->
      <div class="bg-[#1f2833]/60 border border-zinc-800/80 p-4 rounded-xl flex flex-col min-h-[350px]">
        <div class="flex justify-between items-center mb-3">
          <span class="text-xs font-bold text-emerald-400 font-mono">COMPLETED</span>
          <span id="doneCount" class="bg-zinc-800 text-white px-2 py-0.5 rounded-full text-[10px] font-mono">1</span>
        </div>
        <div id="doneList" class="flex-1 space-y-3"></div>
      </div>
    </div>
  </div>

  <script src="app.js"></script>
</body>
</html>`,
    'app.js': `// Kanban Board Controller Script
console.log('📋 Kanban sandbox state machine configured.');

let tasks = [
  { id: 1, title: 'Refactor telemetry chart coordinate arrays', status: 'todo', priority: 'high' },
  { id: 2, title: 'Configure Firebase rules endpoints', status: 'todo', priority: 'medium' },
  { id: 3, title: 'Design Stitch Warm Slate dashboard themes', status: 'progress', priority: 'high' },
  { id: 4, title: 'Align drag-to-resize panel layout ratios', status: 'done', priority: 'low' }
];

const todoList = document.getElementById('todoList');
const progressList = document.getElementById('progressList');
const doneList = document.getElementById('doneList');

const renderTasks = () => {
  todoList.innerHTML = '';
  progressList.innerHTML = '';
  doneList.innerHTML = '';
  
  let todoC = 0, progC = 0, doneC = 0;

  tasks.forEach(task => {
    const card = document.createElement('div');
    card.className = 'bg-[#0b0c10] border border-zinc-800/60 p-3 rounded-lg hover:border-yellow-500/40 transition-all space-y-2 relative group';
    
    const title = document.createElement('p');
    title.className = 'text-xs font-semibold text-white leading-relaxed';
    title.textContent = task.title;
    
    const footer = document.createElement('div');
    footer.className = 'flex justify-between items-center mt-2';
    
    const prio = document.createElement('span');
    prio.className = \`text-[9px] uppercase font-mono px-1.5 py-0.5 rounded \${
      task.priority === 'high' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
      task.priority === 'medium' ? 'bg-blue-500/10 text-blue-450 border border-blue-500/20' :
      'bg-zinc-800 text-zinc-400'
    }\`;
    prio.textContent = task.priority;
    
    const actions = document.createElement('div');
    actions.className = 'flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity';
    
    if (task.status !== 'done') {
      const nextBtn = document.createElement('button');
      nextBtn.className = 'text-[9px] bg-zinc-800 hover:bg-zinc-700 px-1.5 py-0.5 rounded text-yellow-400 cursor-pointer';
      nextBtn.textContent = '→';
      nextBtn.addEventListener('click', () => {
        task.status = task.status === 'todo' ? 'progress' : 'done';
        console.log(\`[Task Moved] "\${task.title}" to status \${task.status}\`);
        renderTasks();
      });
      actions.appendChild(nextBtn);
    }
    
    const delBtn = document.createElement('button');
    delBtn.className = 'text-[9px] hover:text-red-400 text-zinc-500 px-1 cursor-pointer';
    delBtn.textContent = '✕';
    delBtn.addEventListener('click', () => {
      tasks = tasks.filter(t => t.id !== task.id);
      console.log(\`[Task Deleted] "\${task.title}"\`);
      renderTasks();
    });
    actions.appendChild(delBtn);
    
    footer.appendChild(prio);
    footer.appendChild(actions);
    card.appendChild(title);
    card.appendChild(footer);
    
    if (task.status === 'todo') {
      todoList.appendChild(card);
      todoC++;
    } else if (task.status === 'progress') {
      progressList.appendChild(card);
      progC++;
    } else if (task.status === 'done') {
      doneList.appendChild(card);
      doneC++;
    }
  });

  document.getElementById('todoCount').textContent = todoC;
  document.getElementById('progressCount').textContent = progC;
  document.getElementById('doneCount').textContent = doneC;
};

document.getElementById('newTaskBtn').addEventListener('click', () => {
  const title = prompt('Enter task description:', 'Design neat subagents console');
  if (!title) return;
  const priority = prompt('Enter priority (low, medium, high):', 'medium') || 'medium';
  
  tasks.push({
    id: Date.now(),
    title,
    status: 'todo',
    priority: priority.toLowerCase()
  });
  
  console.log(\`[Task Added] "\${title}" successfully staged.\`);
  renderTasks();
});

renderTasks();
`,
    'styles.css': `body {
  font-family: system-ui, sans-serif;
}`
  },
  'saas-landing': {
    'index.html': `<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
  <meta charset="UTF-8">
  <title>AetherFlow SaaS Platform</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#0b0c10] text-[#c5c6c7] antialiased min-h-screen font-sans">
  <!-- Navigation Header -->
  <header class="sticky top-0 z-50 bg-[#0b0c10]/80 backdrop-blur-md border-b border-zinc-800">
    <div class="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-yellow-500 to-amber-400 flex items-center justify-center text-black font-extrabold font-mono text-sm shadow shadow-yellow-500/20">Æ</div>
        <span class="text-white font-bold tracking-wider text-sm font-mono uppercase">AETHERFLOW</span>
      </div>
      <nav class="hidden md:flex items-center gap-6 text-xs font-semibold text-zinc-400">
        <a href="#features" class="hover:text-white transition-colors">Features</a>
        <a href="#pricing" class="hover:text-white transition-colors">Pricing</a>
        <a href="#testimonials" class="hover:text-white transition-colors">Reviews</a>
        <a href="#faq" class="hover:text-white transition-colors">FAQ</a>
      </nav>
      <button onclick="window.location.href='#pricing'" class="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold rounded-lg transition-all shadow-md shadow-yellow-500/10 active:scale-95 cursor-pointer">
        Get Started
      </button>
    </div>
  </header>

  <!-- Hero Section -->
  <section class="max-w-4xl mx-auto px-6 pt-16 pb-12 text-center space-y-6">
    <div class="inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/10 rounded-full border border-yellow-500/20 text-yellow-400 text-[10px] font-semibold tracking-wider uppercase">
      ⚡ Introducing v4.2 Release Engine
    </div>
    <h1 class="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
      Automate Your Swarm Workflows <br/>
      <span class="bg-gradient-to-r from-yellow-500 to-amber-300 bg-clip-text text-transparent">With Absolute Zero Friction</span>
    </h1>
    <p class="text-zinc-400 text-sm max-w-lg mx-auto leading-relaxed">
      AetherFlow orchestrates parallel AI developers, local workspace sync, and row-level safety rules in real time. Deploy instantly on global CDN nodes.
    </p>
    <div class="flex gap-3 justify-center pt-2">
      <button onclick="window.location.href='#pricing'" class="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs rounded-xl transition-all shadow-lg shadow-yellow-500/10 active:scale-95 cursor-pointer">
        Deploy Free Cluster
      </button>
      <button onclick="window.location.href='#features'" class="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 font-bold text-xs rounded-xl transition-all active:scale-95 cursor-pointer">
        See How It Works
      </button>
    </div>
  </section>

  <!-- Features Grid -->
  <section id="features" class="max-w-6xl mx-auto px-6 py-12 border-t border-zinc-900 space-y-10">
    <div class="text-center space-y-2">
      <h2 class="text-2xl font-bold text-white tracking-wide uppercase font-mono text-yellow-500 text-xs">Features Hub</h2>
      <p class="text-xl font-bold text-white">Engineered For Ultra High Throughput</p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-zinc-900/60 border border-zinc-800 p-6 rounded-xl space-y-3 hover:border-yellow-500/30 transition-all">
        <div class="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-500">📡</div>
        <h3 class="text-sm font-bold text-white font-mono">Parallel Agent Swarm</h3>
        <p class="text-xs text-zinc-400 leading-relaxed">Spawn specialized lead architects, developers, and QA reviewers concurrently on workspace branches.</p>
      </div>
      <div class="bg-zinc-900/60 border border-zinc-800 p-6 rounded-xl space-y-3 hover:border-yellow-500/30 transition-all">
        <div class="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-500">🛡️</div>
        <h3 class="text-sm font-bold text-white font-mono">Dynamic RLS Policies</h3>
        <p class="text-xs text-zinc-400 leading-relaxed">Establish granular security constraints on virtual database tables via our interactive schema manager.</p>
      </div>
      <div class="bg-zinc-900/60 border border-zinc-800 p-6 rounded-xl space-y-3 hover:border-yellow-500/30 transition-all">
        <div class="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-500">🐙</div>
        <h3 class="text-sm font-bold text-white font-mono">Git Autopush Hook</h3>
        <p class="text-xs text-zinc-400 leading-relaxed">Every compilation triggers secure commit staging and sync directly to your personal GitHub repository.</p>
      </div>
    </div>
  </section>

  <!-- Interactive Pricing Section -->
  <section id="pricing" class="max-w-5xl mx-auto px-6 py-12 border-t border-zinc-900 space-y-8">
    <div class="text-center space-y-3">
      <h2 class="text-xl font-bold text-white">STABLE & TRANSPARENT CLUSTERS</h2>
      <p class="text-xs text-zinc-500">Choose a plan matching your scale. Toggle billing cycle to save 20% on annual terms.</p>
      
      <!-- Interactive Billing Toggle -->
      <div class="inline-flex items-center gap-3 bg-zinc-900 p-1 rounded-full border border-zinc-800">
        <button id="billingMonthly" class="px-4 py-1.5 bg-yellow-500 text-black font-bold text-[10px] rounded-full transition-all cursor-pointer">Monthly</button>
        <button id="billingYearly" class="px-4 py-1.5 text-zinc-400 hover:text-white font-bold text-[10px] rounded-full transition-all cursor-pointer">Yearly (Save 20%)</button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Hobby Plan -->
      <div class="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl flex flex-col justify-between space-y-6 hover:border-zinc-700 transition-all">
        <div class="space-y-4">
          <div class="space-y-1">
            <h3 class="text-xs font-bold font-mono text-zinc-400 uppercase">Hobby Sandbox</h3>
            <p class="text-[10px] text-zinc-500">Perfect for exploration & hacking</p>
          </div>
          <div class="text-3xl font-extrabold text-white font-mono">$0</div>
          <div class="h-px bg-zinc-800"></div>
          <ul class="text-[11px] space-y-2 text-zinc-400 font-mono">
            <li>✓ 1 Active Project Cluster</li>
            <li>✓ 1 Sub-Agent Swarm</li>
            <li>✓ Local IFrame Sandbox</li>
            <li class="text-zinc-600">✗ SQL Row-Level Security</li>
          </ul>
        </div>
        <button onclick="handleSubscribe('Hobby')" class="w-full py-2 bg-zinc-850 hover:bg-zinc-800 text-white font-bold text-[10px] rounded-lg cursor-pointer">Deploy Free</button>
      </div>

      <!-- Pro Plan -->
      <div class="bg-[#1c1d24]/60 border-2 border-yellow-500 p-6 rounded-2xl flex flex-col justify-between space-y-6 relative shadow-lg shadow-yellow-500/5">
        <div class="absolute -top-3 right-4 bg-yellow-500 text-black text-[9px] font-bold font-mono px-2 py-0.5 rounded-full uppercase tracking-wider">Most Popular</div>
        <div class="space-y-4">
          <div class="space-y-1">
            <h3 class="text-xs font-bold font-mono text-yellow-400 uppercase">Operator Cluster</h3>
            <p class="text-[10px] text-zinc-400">For dynamic full-stack builders</p>
          </div>
          <div class="text-3xl font-extrabold text-white font-mono" id="proPrice">$29<span class="text-xs text-zinc-500 font-normal">/mo</span></div>
          <div class="h-px bg-zinc-850"></div>
          <ul class="text-[11px] space-y-2 text-zinc-300 font-mono">
            <li>✓ Unlimited Workspace Projects</li>
            <li>✓ 3 Concurring Swarm Bots</li>
            <li>✓ Secure SQL DB Terminal</li>
            <li>✓ Automatic GitHub Syncing</li>
          </ul>
        </div>
        <button onclick="handleSubscribe('Operator')" class="w-full py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-[10px] rounded-lg shadow-md cursor-pointer">Activate Cluster</button>
      </div>

      <!-- Team Plan -->
      <div class="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl flex flex-col justify-between space-y-6 hover:border-zinc-700 transition-all">
        <div class="space-y-4">
          <div class="space-y-1">
            <h3 class="text-xs font-bold font-mono text-zinc-400 uppercase">Enterprise Node</h3>
            <p class="text-[10px] text-zinc-500">For agencies & collaborative networks</p>
          </div>
          <div class="text-3xl font-extrabold text-white font-mono" id="enterprisePrice">$89<span class="text-xs text-zinc-500 font-normal">/mo</span></div>
          <div class="h-px bg-zinc-800"></div>
          <ul class="text-[11px] space-y-2 text-zinc-400 font-mono">
            <li>✓ Multi-Operator Workspace Sync</li>
            <li>✓ Unlimited Agent Clusters</li>
            <li>✓ Priority Gemini 1.5 Pro Seats</li>
            <li>✓ Dedicated Postgres Instance</li>
          </ul>
        </div>
        <button onclick="handleSubscribe('Enterprise')" class="w-full py-2 bg-zinc-850 hover:bg-zinc-800 text-white font-bold text-[10px] rounded-lg cursor-pointer">Connect Node</button>
      </div>
    </div>
  </section>

  <!-- Interactive Testimonials -->
  <section id="testimonials" class="max-w-4xl mx-auto px-6 py-12 border-t border-zinc-900 space-y-6">
    <div class="text-center space-y-2">
      <h2 class="text-xs font-mono text-zinc-500 uppercase tracking-widest">Operator Stories</h2>
      <p class="text-lg font-bold text-white">Trust Across the Cluster Network</p>
    </div>
    
    <div class="bg-[#121319]/50 border border-zinc-850 p-6 rounded-2xl text-center relative max-w-xl mx-auto space-y-4">
      <p class="text-xs italic text-zinc-300 leading-relaxed font-mono" id="testimonialQuote">
        "AetherFlow dramatically decreased my development cycles. Integrating the virtual RLS engine lets me safely simulate production schemas inside standard developer models."
      </p>
      <div>
        <p class="text-xs font-bold text-white" id="testimonialAuthor">Jules Vance</p>
        <p class="text-[10px] text-yellow-500 font-mono" id="testimonialRole">Lead Platform Engineer, CloudStitch</p>
      </div>
      
      <!-- Slide controls -->
      <div class="flex justify-center gap-3 pt-2">
        <button id="testimonialPrev" class="w-6 h-6 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs flex items-center justify-center cursor-pointer transition-colors">◀</button>
        <button id="testimonialNext" class="w-6 h-6 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs flex items-center justify-center cursor-pointer transition-colors">▶</button>
      </div>
    </div>
  </section>

  <!-- Interactive FAQ -->
  <section id="faq" class="max-w-4xl mx-auto px-6 py-12 border-t border-zinc-900 space-y-6">
    <div class="text-center space-y-2">
      <h2 class="text-xs font-mono text-zinc-500 uppercase">Fequently Answered Questions</h2>
      <p class="text-lg font-bold text-white font-mono">System Boundaries Solved</p>
    </div>

    <div class="space-y-3 max-w-2xl mx-auto">
      <div class="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
        <button onclick="toggleFaq(1)" class="w-full text-left px-5 py-4 flex justify-between items-center text-xs font-bold font-mono text-white hover:bg-zinc-800/40 transition-colors">
          <span>Are files compiled server-side?</span>
          <span id="faqIcon-1" class="text-yellow-500">+</span>
        </button>
        <div id="faqAns-1" class="hidden px-5 pb-4 text-[11px] text-zinc-400 leading-relaxed">
          Yes! All workspace file saves are safely parsed and compiled inside a virtual container sandbox, generating clean browser outputs without client HMR lag.
        </div>
      </div>

      <div class="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden">
        <button onclick="toggleFaq(2)" class="w-full text-left px-5 py-4 flex justify-between items-center text-xs font-bold font-mono text-white hover:bg-zinc-800/40 transition-colors">
          <span>How does the Gemini integration work?</span>
          <span id="faqIcon-2" class="text-yellow-500">+</span>
        </button>
        <div id="faqAns-2" class="hidden px-5 pb-4 text-[11px] text-zinc-400 leading-relaxed">
          We proxy stream blocks using server endpoints. The compiler listens for annotated markdown blocks within messages and automatically translates them into workspace file entities.
        </div>
      </div>
    </div>
  </section>

  <!-- Footer newsletter -->
  <footer class="bg-zinc-950 border-t border-zinc-900 py-12 text-center space-y-6">
    <div class="max-w-md mx-auto px-6 space-y-3">
      <span class="text-xs font-mono text-zinc-500 uppercase tracking-wider block">Join the cluster stream</span>
      <p class="text-[11px] text-zinc-400">Receive system optimization reports and changelogs directly inside your inbox weekly.</p>
      <div class="flex gap-2">
        <input id="newsEmail" type="email" placeholder="operator@domain.com" class="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-yellow-500/50 font-mono" />
        <button id="newsBtn" class="bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold text-xs px-4 rounded-lg transition-all active:scale-95 cursor-pointer">Subscribe</button>
      </div>
      <div id="newsStatus" class="text-[10px] text-emerald-400 font-mono h-4 hidden">✓ Subscribed successfully! Diagnostic log dispatched.</div>
    </div>
    <div class="text-[10px] text-zinc-650 font-mono">
      © ${new Date().getFullYear()} AetherFlow. Crafted inside DevSpace. All rights compiled.
    </div>
  </footer>

  <script src="app.js"></script>
</body>
</html>`,
    'app.js': `// AetherFlow SaaS Landing Page Controller
console.log('⚡ SaaS Marketing Platform loaded successfully.');

// Monthly vs Yearly pricing state
const billingMonthly = document.getElementById('billingMonthly');
const billingYearly = document.getElementById('billingYearly');
const proPrice = document.getElementById('proPrice');
const enterprisePrice = document.getElementById('enterprisePrice');

billingMonthly.addEventListener('click', () => {
  billingMonthly.className = 'px-4 py-1.5 bg-yellow-500 text-black font-bold text-[10px] rounded-full transition-all cursor-pointer';
  billingYearly.className = 'px-4 py-1.5 text-zinc-400 hover:text-white font-bold text-[10px] rounded-full transition-all cursor-pointer';
  proPrice.innerHTML = '$29<span class="text-xs text-zinc-500 font-normal">/mo</span>';
  enterprisePrice.innerHTML = '$89<span class="text-xs text-zinc-500 font-normal">/mo</span>';
  console.log('[Pricing Controller] Subscription terms configured to monthly terms.');
});

billingYearly.addEventListener('click', () => {
  billingYearly.className = 'px-4 py-1.5 bg-yellow-500 text-black font-bold text-[10px] rounded-full transition-all cursor-pointer';
  billingMonthly.className = 'px-4 py-1.5 text-zinc-400 hover:text-white font-bold text-[10px] rounded-full transition-all cursor-pointer';
  proPrice.innerHTML = '$23<span class="text-xs text-zinc-500 font-normal">/mo</span>';
  enterprisePrice.innerHTML = '$71<span class="text-xs text-zinc-500 font-normal">/mo</span>';
  console.log('[Pricing Controller] Subscription terms configured to annual cycles (20% discount applied).');
});

// Interactive Subscribe Simulation
window.handleSubscribe = (tier) => {
  console.log(\`[Stripe Proxy] Initiated checkout redirection pipeline for: "\${tier}" tier\`);
  alert(\`Redirecting to checkout for the \${tier} Plan! This is simulated through sandbox endpoints.\`);
};

// Testimonials database and index tracking
const testimonials = [
  { text: '"AetherFlow dramatically decreased my development cycles. Integrating the virtual RLS engine lets me safely simulate production schemas inside standard developer models."', author: 'Jules Vance', role: 'Lead Platform Engineer, CloudStitch' },
  { text: '"Parallel sub-agent compiles are a absolute game changer. The ability to watch logs print in real time saves me hours of local docker orchestrating."', author: 'Samantha Grey', role: 'Staff Operations, DevScale' },
  { text: '"I was skeptical about AI sandboxing, but mapping custom API endpoints directly to Firestore rules convinced me. Absolute pure developer experience design!"', author: 'Markus Kael', role: 'Founder, StitchCore Studio' }
];

let activeTestimonialIdx = 0;
const testimonialQuote = document.getElementById('testimonialQuote');
const testimonialAuthor = document.getElementById('testimonialAuthor');
const testimonialRole = document.getElementById('testimonialRole');
const prevBtn = document.getElementById('testimonialPrev');
const nextBtn = document.getElementById('testimonialNext');

const renderTestimonial = () => {
  const current = testimonials[activeTestimonialIdx];
  testimonialQuote.textContent = current.text;
  testimonialAuthor.textContent = current.author;
  testimonialRole.textContent = current.role;
};

prevBtn.addEventListener('click', () => {
  activeTestimonialIdx = (activeTestimonialIdx - 1 + testimonials.length) % testimonials.length;
  console.log(\`[Carousel Widget] Testimonial shifted to index \${activeTestimonialIdx}\`);
  renderTestimonial();
});

nextBtn.addEventListener('click', () => {
  activeTestimonialIdx = (activeTestimonialIdx + 1) % testimonials.length;
  console.log(\`[Carousel Widget] Testimonial shifted to index \${activeTestimonialIdx}\`);
  renderTestimonial();
});

// Accordion Collapsible Panel
window.toggleFaq = (num) => {
  const ans = document.getElementById(\`faqAns-\${num}\`);
  const icon = document.getElementById(\`faqIcon-\${num}\`);
  if (ans.classList.contains('hidden')) {
    ans.classList.remove('hidden');
    icon.textContent = '-';
    console.log(\`[FAQ Panel] Expanded question #\${num}\`);
  } else {
    ans.classList.add('hidden');
    icon.textContent = '+';
    console.log(\`[FAQ Panel] Collapsed question #\${num}\`);
  }
};

// Newsletter Form validation & callback hook
const newsEmail = document.getElementById('newsEmail');
const newsBtn = document.getElementById('newsBtn');
const newsStatus = document.getElementById('newsStatus');

newsBtn.addEventListener('click', () => {
  const email = newsEmail.value.trim();
  if (!email || !email.includes('@')) {
    console.error('[Form Validation] Attempted newsletter registration with invalid email format.');
    alert('Please enter a valid developer email address!');
    return;
  }
  
  console.log(\`[Newsletter Action] Enqueued: "\${email}" into active subscriber pools.\`);
  newsEmail.value = '';
  newsStatus.classList.remove('hidden');
  setTimeout(() => newsStatus.classList.add('hidden'), 4000);
});
`,
    'styles.css': `body {
  font-family: system-ui, sans-serif;
}`
  },
  'developer-portfolio': {
    'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Developer Terminal Portfolio</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#090a0f] text-[#c5c6c7] p-6 md:p-12 min-h-screen font-mono text-xs">
  <div class="max-w-4xl mx-auto space-y-8">
    <!-- Header Block -->
    <header class="border border-zinc-800 bg-[#0d0e14] p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div class="space-y-1">
        <h1 class="text-xl font-extrabold text-white tracking-wider flex items-center gap-2">
          <span class="inline-block w-2.5 h-2.5 bg-yellow-500 rounded-full"></span>
          OPERATOR_CORE // ALEX_KANE
        </h1>
        <p class="text-zinc-500 text-[10px]">Full-Stack Sandbox Architect & Systems Developer</p>
      </div>
      <div class="flex gap-2">
        <span class="px-2 py-1 bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 text-[10px] rounded">STATUS: FOR_HIRE</span>
        <span class="px-2 py-1 bg-zinc-900 border border-zinc-800 text-zinc-400 text-[10px] rounded">LOC: SAN_FRANCISCO</span>
      </div>
    </header>

    <!-- Main Section: Bio & Filter Tabs Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="md:col-span-1 bg-[#0d0e14] border border-zinc-800 rounded-2xl p-5 space-y-4">
        <div class="space-y-1 border-b border-zinc-850 pb-3">
          <span class="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Diagnostics</span>
          <p class="text-xs text-white">System capabilities cataloged successfully.</p>
        </div>
        
        <div class="space-y-3 font-mono">
          <div class="space-y-1">
            <div class="flex justify-between text-[10px] text-zinc-400">
              <span>TypeScript Engine</span>
              <span>95%</span>
            </div>
            <div class="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
              <div class="bg-yellow-500 h-full w-[95%]"></div>
            </div>
          </div>

          <div class="space-y-1">
            <div class="flex justify-between text-[10px] text-zinc-400">
              <span>Postgres / SQL SQL</span>
              <span>88%</span>
            </div>
            <div class="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
              <div class="bg-yellow-500 h-full w-[88%]"></div>
            </div>
          </div>

          <div class="space-y-1">
            <div class="flex justify-between text-[10px] text-zinc-400">
              <span>Firebase Deployment</span>
              <span>80%</span>
            </div>
            <div class="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
              <div class="bg-yellow-500 h-full w-[80%]"></div>
            </div>
          </div>
        </div>

        <div class="h-px bg-zinc-850"></div>
        <p class="text-[11px] text-zinc-500 leading-relaxed font-sans">
          Alex builds low-latency data pipelines, designs row-level security structures, and compiles high-performance user interfaces.
        </p>
      </div>

      <!-- Filterable Projects Section -->
      <div class="md:col-span-2 bg-[#0d0e14] border border-zinc-800 rounded-2xl p-6 flex flex-col space-y-4">
        <div class="flex justify-between items-center border-b border-zinc-850 pb-3">
          <span class="text-xs font-bold text-white uppercase tracking-wider">Project Clusters</span>
          
          <!-- Category Filter Toggles -->
          <div class="flex gap-1.5 bg-zinc-950 p-1 rounded border border-zinc-850 text-[9px] font-bold">
            <button onclick="filterCategory('all')" id="tabAll" class="px-2 py-0.5 bg-yellow-500 text-black rounded transition-all cursor-pointer">ALL</button>
            <button onclick="filterCategory('web')" id="tabWeb" class="px-2 py-0.5 text-zinc-400 hover:text-white rounded transition-all cursor-pointer">WEB</button>
            <button onclick="filterCategory('database')" id="tabDatabase" class="px-2 py-0.5 text-zinc-400 hover:text-white rounded transition-all cursor-pointer">DB/SQL</button>
          </div>
        </div>

        <!-- Dynamic Projects Stack -->
        <div id="projectsGrid" class="space-y-3 flex-1">
          <!-- Items generated by app.js -->
        </div>
      </div>
    </div>

    <!-- Active Experience Timeline -->
    <section class="bg-[#0d0e14] border border-zinc-800 rounded-2xl p-6 space-y-4">
      <span class="text-xs font-bold text-white uppercase tracking-wider block">Operational Timeline</span>
      <div class="relative pl-6 border-l border-zinc-800 space-y-6">
        <div class="relative space-y-1">
          <div class="absolute -left-[29px] top-1 w-2.5 h-2.5 rounded-full bg-yellow-500 border-4 border-[#090a0f]"></div>
          <span class="text-[10px] text-yellow-500 font-bold">2024 - PRESENT</span>
          <h4 class="text-xs font-bold text-white">Lead Workspace Engineer // CloudSync</h4>
          <p class="text-[11px] text-zinc-400 font-sans leading-relaxed">Integrated parallel specialist LLM networks into high-volume client code workspaces.</p>
        </div>
        <div class="relative space-y-1">
          <div class="absolute -left-[29px] top-1 w-2.5 h-2.5 rounded-full bg-zinc-700 border-4 border-[#090a0f]"></div>
          <span class="text-[10px] text-zinc-500 font-bold">2022 - 2024</span>
          <h4 class="text-xs font-bold text-white">Full-Stack Developer // QuerySpace SQL</h4>
          <p class="text-[11px] text-zinc-400 font-sans leading-relaxed">Authored secure virtual database engines featuring row-level constraint filters.</p>
        </div>
      </div>
    </section>

    <!-- Message Board Interface -->
    <section class="bg-[#0d0e14] border border-zinc-800 rounded-2xl p-6 space-y-4">
      <div class="space-y-1">
        <h3 class="text-xs font-bold text-white uppercase tracking-wider">Staged Contact Pipeline</h3>
        <p class="text-[10px] text-zinc-500">Dispatch message packet directly to operator command lines</p>
      </div>

      <div class="space-y-3 font-mono">
        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1">
            <span class="text-[9px] text-zinc-500 uppercase block">Sender Identity</span>
            <input id="contactName" type="text" placeholder="e.g. Lead Dev" class="w-full bg-zinc-950 border border-zinc-850 rounded px-2.5 py-1.5 text-xs text-zinc-300 outline-none focus:border-yellow-500/50" />
          </div>
          <div class="space-y-1">
            <span class="text-[9px] text-zinc-500 uppercase block">Return Node IP/Email</span>
            <input id="contactEmail" type="text" placeholder="e.g. test@node.io" class="w-full bg-zinc-950 border border-zinc-850 rounded px-2.5 py-1.5 text-xs text-zinc-300 outline-none focus:border-yellow-500/50" />
          </div>
        </div>
        <div class="space-y-1">
          <span class="text-[9px] text-zinc-500 uppercase block">Message Payload</span>
          <textarea id="contactMessage" rows="3" placeholder="Define your project goals, timelines, and stack recommendations..." class="w-full bg-zinc-950 border border-zinc-850 rounded px-2.5 py-1.5 text-xs text-zinc-300 outline-none focus:border-yellow-500/50 resize-none leading-relaxed"></textarea>
        </div>
        <button id="sendContactBtn" class="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold text-[10px] rounded transition-all active:scale-95 cursor-pointer">
          DISPATCH MESSAGE PACKET
        </button>
      </div>
    </section>
  </div>

  <script src="app.js"></script>
</body>
</html>`,
    'app.js': `// Developer Terminal Portfolio Controller
console.log('💻 Alex Kane Developer Core bound successfully.');

const projectsList = [
  { id: 1, title: 'Secure SQL RLS Query Manager', category: 'database', desc: 'Virtual parser monitoring constraints and policy rules.', tech: 'PostgreSQL, Node' },
  { id: 2, title: 'Google Maps Route Radar', category: 'web', desc: 'Sleek geocoding interface featuring optimized route matrix endpoints.', tech: 'Vite, Maps API' },
  { id: 3, title: 'Subagents Workspace Swarm', category: 'web', desc: 'Parallel specialists automating checklists in real time.', tech: 'React, Gemini' },
  { id: 4, title: 'Serverless Real-time Logger', category: 'database', desc: 'Durable firestore event listener with low latency indices.', tech: 'Firebase, Go' }
];

const projectsGrid = document.getElementById('projectsGrid');
let activeCategory = 'all';

const renderProjects = () => {
  projectsGrid.innerHTML = '';
  
  const filtered = activeCategory === 'all' 
    ? projectsList 
    : projectsList.filter(p => p.category === activeCategory);
    
  filtered.forEach(p => {
    const item = document.createElement('div');
    item.className = 'p-3.5 bg-zinc-950 border border-zinc-850 rounded-lg hover:border-yellow-500/30 transition-all space-y-1 hover:translate-x-0.5 transition-transform duration-200';
    
    const titleRow = document.createElement('div');
    titleRow.className = 'flex justify-between items-center';
    
    const title = document.createElement('span');
    title.className = 'font-bold text-white text-xs font-mono';
    title.textContent = p.title;
    
    const badge = document.createElement('span');
    badge.className = 'bg-zinc-900 border border-zinc-800 text-zinc-500 text-[8px] px-1.5 rounded uppercase font-bold';
    badge.textContent = p.category;
    
    titleRow.appendChild(title);
    titleRow.appendChild(badge);
    
    const desc = document.createElement('p');
    desc.className = 'text-[10px] text-zinc-400 leading-relaxed font-sans';
    desc.textContent = p.desc;
    
    const footer = document.createElement('div');
    footer.className = 'text-[9px] text-yellow-500 font-mono pt-1';
    footer.textContent = \`STACK: \${p.tech}\`;
    
    item.appendChild(titleRow);
    item.appendChild(desc);
    item.appendChild(footer);
    projectsGrid.appendChild(item);
  });
};

window.filterCategory = (cat) => {
  activeCategory = cat;
  console.log(\`[Tab Filter] Shifted directory view context to category: "\${cat}"\`);
  
  // Toggle states of tab headers
  const tabs = ['all', 'web', 'database'];
  tabs.forEach(t => {
    const el = document.getElementById(\`tab\${t.charAt(0).toUpperCase() + t.slice(1)}\`);
    if (t === cat) {
      el.className = 'px-2 py-0.5 bg-yellow-500 text-black rounded transition-all cursor-pointer';
    } else {
      el.className = 'px-2 py-0.5 text-zinc-400 hover:text-white rounded transition-all cursor-pointer';
    }
  });
  
  renderProjects();
};

// Initial Projects render
renderProjects();

// Contact Dispatch Form Listener
const contactName = document.getElementById('contactName');
const contactEmail = document.getElementById('contactEmail');
const contactMessage = document.getElementById('contactMessage');
const sendContactBtn = document.getElementById('sendContactBtn');

sendContactBtn.addEventListener('click', () => {
  const name = contactName.value.trim();
  const email = contactEmail.value.trim();
  const msg = contactMessage.value.trim();
  
  if (!name || !email || !msg) {
    console.warn('[Contact Pipeline] Dispatch blocked due to missing values.');
    alert('Failed to route packet: All form input ports must be populated.');
    return;
  }
  
  console.log(\`[Contact Pipeline] Enqueued payload: Name="\${name}", IP/Email="\${email}", Message="\${msg.slice(0, 30)}..."\`);
  alert('Packet enqueued successfully! Diagnostic logs updated.');
  
  contactName.value = '';
  contactEmail.value = '';
  contactMessage.value = '';
});
`,
    'styles.css': `body {
  background-color: #090a0f;
}`
  },
  'e-commerce': {
    'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Operator Hardware Store</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#0b0c10] text-[#c5c6c7] p-6 min-h-screen font-sans">
  <div class="max-w-5xl mx-auto space-y-6">
    <!-- Store Header -->
    <div class="flex justify-between items-center border-b border-zinc-800 pb-4">
      <div>
        <h1 class="text-xl font-black text-white tracking-wider flex items-center gap-2">
          <span>🛒 OPERATOR_SUPPLY</span>
          <span class="text-[9px] bg-yellow-500 text-black font-mono font-extrabold px-1.5 py-0.5 rounded">V2.4</span>
        </h1>
        <p class="text-xs text-zinc-500">Premium system interfaces, chips, and subagent kits</p>
      </div>

      <!-- Interactive Shopping Cart Trigger -->
      <button id="cartBtn" class="relative px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-yellow-500/30 text-white rounded-lg flex items-center gap-2 transition-all cursor-pointer">
        <span>Cart View</span>
        <span id="cartCount" class="bg-yellow-500 text-black text-[9px] font-extrabold px-1.5 py-0.5 rounded-full font-mono">0</span>
      </button>
    </div>

    <!-- Live Search & Filtering Panel -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#12131a] border border-zinc-850 p-4 rounded-xl items-center">
      <div class="md:col-span-2 space-y-1">
        <label class="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block">Real-time Search Filter</label>
        <input id="searchQuery" type="text" placeholder="e.g. core, processor, module..." class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-yellow-500/50" />
      </div>

      <div class="space-y-1">
        <label class="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block">Product Category</label>
        <select id="categorySelect" class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-300 outline-none">
          <option value="all">All Modules</option>
          <option value="hardware">Hardware</option>
          <option value="software">AI Software</option>
          <option value="peripherals">Interface</option>
        </select>
      </div>

      <div class="space-y-1">
        <label class="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block">Max Budget ($)</label>
        <div class="flex items-center gap-2">
          <input id="budgetRange" type="range" min="20" max="600" value="600" class="flex-1 accent-yellow-500" />
          <span id="budgetValue" class="text-xs text-yellow-400 font-mono font-semibold">$600</span>
        </div>
      </div>
    </div>

    <!-- Main Grid Catalog & Cart Slider Drawer -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Product Catalog Cards -->
      <div class="md:col-span-2 space-y-4">
        <span class="text-xs font-bold font-mono text-zinc-400 uppercase tracking-widest block">Available Inventory</span>
        <div id="catalogGrid" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Populated dynamically -->
        </div>
      </div>

      <!-- Dynamic Cart Sidebar Summary -->
      <div class="bg-zinc-900/60 border border-zinc-800 p-5 rounded-xl h-fit space-y-4">
        <h3 class="text-xs font-bold font-mono text-white border-b border-zinc-850 pb-2 uppercase tracking-wider">Checkout Ledger</h3>
        <div id="cartItems" class="space-y-2 max-h-48 overflow-y-auto text-xs custom-scrollbar">
          <p class="text-zinc-500 italic text-[11px] text-center py-4">Checkout drawer is empty.</p>
        </div>

        <div class="border-t border-zinc-850 pt-3 space-y-2.5 font-mono">
          <!-- Discount Coupon code input -->
          <div class="space-y-1">
            <label class="text-[8px] text-zinc-500 uppercase">Discount Coupon Code</label>
            <div class="flex gap-1.5">
              <input id="couponInput" type="text" placeholder="e.g. STITCH50" class="flex-1 bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1 text-[10px] text-white outline-none font-mono uppercase" />
              <button id="applyCouponBtn" class="bg-zinc-800 hover:bg-zinc-750 text-yellow-500 border border-zinc-700 font-bold text-[9px] px-2.5 rounded cursor-pointer">Apply</button>
            </div>
          </div>

          <div class="h-px bg-zinc-850"></div>

          <div class="flex justify-between text-xs font-bold">
            <span class="text-zinc-400">LEDGER TOTAL:</span>
            <span id="ledgerTotal" class="text-yellow-400">$0.00</span>
          </div>
          
          <button id="checkoutBtn" class="w-full py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold text-[10px] rounded shadow-md cursor-pointer uppercase">
            AUTHORIZE SECURE PURCHASE
          </button>
        </div>
      </div>
    </div>
  </div>

  <script src="app.js"></script>
</body>
</html>`,
    'app.js': `// Operator Supply Catalog Controller
console.log('🛒 Operator Hardware Supply inventory bound.');

const products = [
  { id: 1, name: 'Gemini Core TPU Module v4', category: 'hardware', price: 420, desc: 'Local tensor processing array with high-throughput parameters.', status: 'in-stock' },
  { id: 2, name: 'Subagent Lead Developer Key', category: 'software', price: 89, desc: 'Secure verification token to unlock persistent agent roles.', status: 'in-stock' },
  { id: 3, name: 'Tactile Monospace Frameboard', category: 'peripherals', price: 150, desc: 'Full mechanical array styled with Stitch Slate keycaps.', status: 'low-stock' },
  { id: 4, name: 'Row-Level Policy SQL Sandbox', category: 'software', price: 45, desc: 'Granular SQL compiler supporting database mockups.', status: 'in-stock' },
  { id: 5, name: 'Google Maps Geocoding Shield', category: 'hardware', price: 29, desc: 'Embedded geolocation module optimized for Routes API.', status: 'out-of-stock' }
];

let cart = [];
let discountMultiplier = 1.0;

const catalogGrid = document.getElementById('catalogGrid');
const searchQuery = document.getElementById('searchQuery');
const categorySelect = document.getElementById('categorySelect');
const budgetRange = document.getElementById('budgetRange');
const budgetValue = document.getElementById('budgetValue');
const cartCount = document.getElementById('cartCount');
const cartItems = document.getElementById('cartItems');
const ledgerTotal = document.getElementById('ledgerTotal');

const renderCatalog = () => {
  catalogGrid.innerHTML = '';
  
  const query = searchQuery.value.toLowerCase();
  const cat = categorySelect.value;
  const maxPrice = Number(budgetRange.value);
  
  const filtered = products.filter(p => {
    const matchesQuery = (p.name || '').toLowerCase().includes(query) || (p.desc || '').toLowerCase().includes(query);
    const matchesCat = cat === 'all' || p.category === cat;
    const matchesBudget = p.price <= maxPrice;
    return matchesQuery && matchesCat && matchesBudget;
  });
  
  if (filtered.length === 0) {
    catalogGrid.innerHTML = '<p class="text-zinc-500 italic text-xs py-6 col-span-2 text-center">No matching inventory units found.</p>';
    return;
  }
  
  filtered.forEach(p => {
    const card = document.createElement('div');
    card.className = 'bg-[#121319]/45 border border-zinc-850 p-4 rounded-xl flex flex-col justify-between space-y-3 relative group hover:border-yellow-500/20 transition-all';
    
    if (p.status === 'out-of-stock') {
      card.className += ' opacity-55';
    }
    
    const details = document.createElement('div');
    details.className = 'space-y-1.5';
    
    const header = document.createElement('div');
    header.className = 'flex justify-between items-start';
    
    const categoryBadge = document.createElement('span');
    categoryBadge.className = 'text-[8px] font-mono uppercase bg-zinc-900 border border-zinc-800 text-zinc-500 px-1.5 rounded';
    categoryBadge.textContent = p.category;
    
    header.appendChild(categoryBadge);
    
    if (p.status === 'low-stock') {
      const lowBadge = document.createElement('span');
      lowBadge.className = 'text-[8px] font-mono bg-red-950 text-red-400 px-1.5 rounded border border-red-900/30 font-bold animate-pulse';
      lowBadge.textContent = 'LOW STOCK';
      header.appendChild(lowBadge);
    }
    
    const name = document.createElement('h3');
    name.className = 'text-xs font-bold text-white font-mono leading-snug pt-1';
    name.textContent = p.name;
    
    const desc = document.createElement('p');
    desc.className = 'text-[10px] text-zinc-400 leading-normal font-sans';
    desc.textContent = p.desc;
    
    details.appendChild(header);
    details.appendChild(name);
    details.appendChild(desc);
    
    const actions = document.createElement('div');
    actions.className = 'flex justify-between items-center pt-2 border-t border-zinc-900/50';
    
    const price = document.createElement('span');
    price.className = 'text-xs font-bold text-yellow-400 font-mono';
    price.textContent = \`$\${p.price}\`;
    
    const buyBtn = document.createElement('button');
    buyBtn.className = 'px-3 py-1 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 disabled:hover:bg-zinc-800 text-black font-extrabold text-[9px] rounded-lg transition-all active:scale-95 cursor-pointer';
    buyBtn.textContent = p.status === 'out-of-stock' ? 'OUT' : '+ Add Cart';
    buyBtn.disabled = p.status === 'out-of-stock';
    buyBtn.addEventListener('click', () => handleAddToCart(p.id));
    
    actions.appendChild(price);
    actions.appendChild(buyBtn);
    card.appendChild(details);
    card.appendChild(actions);
    catalogGrid.appendChild(card);
  });
};

const handleAddToCart = (id) => {
  const item = products.find(p => p.id === id);
  if (!item) return;
  
  cart.push(item);
  console.log(\`[Cart State] Added product: "\${item.name}". Cart units: \${cart.length}\`);
  updateCartUI();
};

const updateCartUI = () => {
  cartCount.textContent = cart.length;
  cartItems.innerHTML = '';
  
  if (cart.length === 0) {
    cartItems.innerHTML = '<p class="text-zinc-500 italic text-[11px] text-center py-4">Checkout drawer is empty.</p>';
    ledgerTotal.textContent = '$0.00';
    return;
  }
  
  let rawTotal = 0;
  
  // Group identical cart items
  const grouped = {};
  cart.forEach(item => {
    grouped[item.id] = grouped[item.id] ? { ...grouped[item.id], qty: grouped[item.id].qty + 1 } : { ...item, qty: 1 };
    rawTotal += item.price;
  });
  
  Object.values(grouped).forEach(item => {
    const row = document.createElement('div');
    row.className = 'flex justify-between items-center bg-zinc-950 p-2 rounded border border-zinc-850 font-mono text-[10px]';
    
    const left = document.createElement('div');
    left.className = 'truncate max-w-[120px]';
    left.innerHTML = \`<strong class="text-yellow-400">[\${item.qty}x]</strong> \${item.name}\`;
    
    const right = document.createElement('div');
    right.className = 'flex items-center gap-2';
    
    const cost = document.createElement('span');
    cost.className = 'text-white font-bold';
    cost.textContent = \`$\${item.price * item.qty}\`;
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'text-zinc-500 hover:text-red-400 font-extrabold cursor-pointer';
    removeBtn.textContent = '✕';
    removeBtn.addEventListener('click', () => handleRemoveFromCart(item.id));
    
    right.appendChild(cost);
    right.appendChild(removeBtn);
    row.appendChild(left);
    row.appendChild(right);
    cartItems.appendChild(row);
  });
  
  const finalTotal = (rawTotal * discountMultiplier).toFixed(2);
  ledgerTotal.textContent = \`$\${finalTotal}\`;
};

const handleRemoveFromCart = (id) => {
  // Remove first occurrence
  const idx = cart.findIndex(p => p.id === id);
  if (idx !== -1) {
    const removed = cart.splice(idx, 1)[0];
    console.log(\`[Cart State] Removed product: "\${removed.name}". Cart units: \${cart.length}\`);
    updateCartUI();
  }
};

// Coupon Logic (STITCH50 gives 50% discount)
const couponInput = document.getElementById('couponInput');
const applyCouponBtn = document.getElementById('applyCouponBtn');

applyCouponBtn.addEventListener('click', () => {
  const code = couponInput.value.trim().toUpperCase();
  if (code === 'STITCH50') {
    discountMultiplier = 0.50;
    console.log('[Discount Logic] Coupon STITCH50 matched successfully. 50% discount multiplier applied.');
    alert('Coupon matched! Applied 50% off of checkout ledger.');
  } else {
    console.warn(\`[Discount Logic] Invalid coupon code rejected: "\${code}"\`);
    alert('Code rejected. Try using STITCH50 inside coupon inputs.');
  }
  updateCartUI();
});

// Checkout action
const checkoutBtn = document.getElementById('checkoutBtn');
checkoutBtn.addEventListener('click', () => {
  if (cart.length === 0) {
    alert('Cannot checkout: Ledger is currently empty.');
    return;
  }
  console.log(\`[Ledger Checkout] Redirection triggered for: \${cart.length} units. Subtotal: \${ledgerTotal.textContent}\`);
  alert(\`Secure checkout initialized! Redirecting payment payload: \${ledgerTotal.textContent}\`);
  cart = [];
  updateCartUI();
});

// Watch filtering controls
searchQuery.addEventListener('input', renderCatalog);
categorySelect.addEventListener('change', renderCatalog);
budgetRange.addEventListener('input', () => {
  budgetValue.textContent = \`$\${budgetRange.value}\`;
  renderCatalog();
});

// Initialize
renderCatalog();
`,
    'styles.css': `body {
  background-color: #0b0c10;
}`
  },
  'blog-feed': {
    'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Aether Ledger Blog</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#0c0d12] text-[#c5c6c7] p-6 min-h-screen font-sans">
  <div class="max-w-4xl mx-auto space-y-8">
    <!-- Blog Header -->
    <header class="border-b border-zinc-800 pb-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div class="space-y-1">
        <h1 class="text-2xl font-black text-white tracking-wider flex items-center gap-2">
          <span>📓 AETHER_LEDGER</span>
        </h1>
        <p class="text-xs text-zinc-500">Changelogs, design paradigms, and agent development logs</p>
      </div>
      <div class="flex gap-2">
        <span class="px-2 py-1 bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 text-[10px] font-mono rounded">READING_PROGRESS: 0%</span>
      </div>
    </header>

    <!-- Reading Progress Bar -->
    <div class="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden shrink-0 border border-zinc-900">
      <div id="readProgress" class="h-full bg-yellow-500 w-0 transition-all duration-300"></div>
    </div>

    <!-- Layout Grid: Left feed, Right comments -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Article List Feed -->
      <div class="md:col-span-2 space-y-6">
        <div class="flex justify-between items-center text-xs font-bold font-mono text-zinc-400">
          <span>LATEST_COMMITS (CHANGELOGS)</span>
          <span id="articleCount">2 Articles</span>
        </div>

        <div id="feedStack" class="space-y-6">
          <!-- Article #1 -->
          <article class="bg-[#121319]/65 border border-zinc-850 rounded-2xl p-6 space-y-4 hover:border-yellow-500/20 transition-all">
            <div class="flex justify-between items-center text-[10px] font-mono">
              <span class="text-yellow-500 font-bold">SYSTEMS_ARCHITECTURE</span>
              <span class="text-zinc-500">5 min read // JUL-16-2026</span>
            </div>
            <div class="space-y-2">
              <h2 class="text-lg font-extrabold text-white leading-snug">The Evolution of Non-Blocking Sandbox IFrame Runtimes</h2>
              <p class="text-xs text-zinc-400 leading-relaxed font-sans">
                By routing standard terminal console log intercepts through postMessage channels, modern workspace frames establish seamless diagnostic feedback without sandbox escaping.
              </p>
            </div>
            <div class="flex justify-between items-center pt-3 border-t border-zinc-900/50">
              <button onclick="handleLikeArticle(1)" class="flex items-center gap-1.5 px-3 py-1 bg-zinc-900 hover:bg-zinc-800 text-xs rounded-lg transition-all cursor-pointer">
                <span>👍 Vote Up</span>
                <span id="likesCount-1" class="text-yellow-500 font-bold font-mono">14</span>
              </button>
              <button onclick="handleReadArticle(1, 'evolution')" class="text-xs font-mono text-yellow-500 hover:underline cursor-pointer">READ_FULL_BODY →</button>
            </div>
          </article>

          <!-- Article #2 -->
          <article class="bg-[#121319]/65 border border-zinc-850 rounded-2xl p-6 space-y-4 hover:border-yellow-500/20 transition-all">
            <div class="flex justify-between items-center text-[10px] font-mono">
              <span class="text-yellow-500 font-bold">FIREBASE_SECURITY</span>
              <span class="text-zinc-500">8 min read // JUL-14-2026</span>
            </div>
            <div class="space-y-2">
              <h2 class="text-lg font-extrabold text-white leading-snug">Hardening Firestore Schemas Against Token Manipulation</h2>
              <p class="text-xs text-zinc-400 leading-relaxed font-sans">
                Reviewing nested auth expressions inside database blueprints is critical to preventing malicious query executions. Implement custom operators inside firestore.rules.
              </p>
            </div>
            <div class="flex justify-between items-center pt-3 border-t border-zinc-900/50">
              <button onclick="handleLikeArticle(2)" class="flex items-center gap-1.5 px-3 py-1 bg-zinc-900 hover:bg-zinc-800 text-xs rounded-lg transition-all cursor-pointer">
                <span>👍 Vote Up</span>
                <span id="likesCount-2" class="text-yellow-500 font-bold font-mono">31</span>
              </button>
              <button onclick="handleReadArticle(2, 'hardening')" class="text-xs font-mono text-yellow-500 hover:underline cursor-pointer">READ_FULL_BODY →</button>
            </div>
          </article>
        </div>
      </div>

      <!-- Feed Comments Module -->
      <div class="bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl h-fit space-y-4">
        <h3 class="text-xs font-bold font-mono text-white border-b border-zinc-850 pb-2 uppercase tracking-wider">Feed Discussion</h3>
        
        <!-- Live Comments Feed -->
        <div id="commentsFeed" class="space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
          <!-- Appended dynamically -->
        </div>

        <div class="h-px bg-zinc-850"></div>

        <!-- Add Comment Form -->
        <div class="space-y-2 font-mono">
          <div class="space-y-1">
            <label class="text-[8px] text-zinc-500 uppercase">Operator Alias</label>
            <input id="commentAuthor" type="text" placeholder="e.g. Guest" class="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-300 outline-none" />
          </div>
          <div class="space-y-1">
            <label class="text-[8px] text-zinc-500 uppercase">Comment Body</label>
            <textarea id="commentBody" rows="2" placeholder="Write feedback..." class="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-300 outline-none resize-none leading-relaxed"></textarea>
          </div>
          <button id="addCommentBtn" class="w-full py-1.5 bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold text-[10px] rounded cursor-pointer uppercase">
            POST COMMENT
          </button>
        </div>
      </div>
    </div>
  </div>

  <script src="app.js"></script>
</body>
</html>`,
    'app.js': `// Aether Ledger Blog Controller
console.log('📓 Editorial content ledger bound.');

const likes = {
  1: 14,
  2: 31
};

const comments = [
  { author: 'Jules', text: 'This evolution study is exactly what we needed to fix iframe console lags!' },
  { author: 'OpsBot', text: 'Staged security models successfully. The hardening guide saved our deployments.' }
];

const commentsFeed = document.getElementById('commentsFeed');
const commentAuthor = document.getElementById('commentAuthor');
const commentBody = document.getElementById('commentBody');
const addCommentBtn = document.getElementById('addCommentBtn');
const readProgress = document.getElementById('readProgress');

const renderComments = () => {
  commentsFeed.innerHTML = '';
  comments.forEach(c => {
    const item = document.createElement('div');
    item.className = 'p-2 bg-zinc-950 border border-zinc-850 rounded text-[10px] font-mono leading-normal';
    
    const meta = document.createElement('div');
    meta.className = 'flex justify-between text-[8px] text-zinc-500 uppercase font-bold';
    meta.textContent = \`BY: \${c.author}\`;
    
    const text = document.createElement('p');
    text.className = 'text-zinc-300 mt-1';
    text.textContent = c.text;
    
    item.appendChild(meta);
    item.appendChild(text);
    commentsFeed.appendChild(item);
  });
  
  // Auto-scroll comments
  commentsFeed.scrollTop = commentsFeed.scrollHeight;
};

// Vote Up Articles
window.handleLikeArticle = (id) => {
  likes[id]++;
  document.getElementById(\`likesCount-\${id}\`).textContent = likes[id];
  console.log(\`[Upvote Handler] Article \${id} upvoted. Total: \${likes[id]}\`);
};

// Reading progress simulator
window.handleReadArticle = (id, titleSlug) => {
  console.log(\`[Ledger Reader] Loading detailed markdown tree for article slug: "\${titleSlug}"\`);
  
  // Update progress bar
  const nextPercent = id === 1 ? 55 : 100;
  readProgress.style.width = \`\${nextPercent}%\`;
  
  const progressBadge = document.querySelector('header span');
  if (progressBadge) progressBadge.textContent = \`READING_PROGRESS: \${nextPercent}%\`;
  
  alert(\`Simulated loading full-text context of "\${titleSlug}". progress level enqueued to: \${nextPercent}%\`);
};

// Comments enqueuer
addCommentBtn.addEventListener('click', () => {
  const author = commentAuthor.value.trim() || 'Anonymous';
  const text = commentBody.value.trim();
  
  if (!text) {
    alert('Please write comments body before submitting!');
    return;
  }
  
  comments.push({ author, text });
  console.log(\`[Discussion Ledger] Appended comment by operator: "\${author}"\`);
  
  commentAuthor.value = '';
  commentBody.value = '';
  renderComments();
});

// Initial load
renderComments();
`,
    'styles.css': `body {
  background-color: #0c0d12;
}`
  },
  "cli-tool": {
    "index.html": "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>Stitch CLI Terminal Emulator</title>\n  <script src=\"https://cdn.tailwindcss.com\"></script>\n</head>\n<body class=\"bg-[#050608] text-[#38ef7d] font-mono min-h-screen p-4 flex flex-col relative overflow-hidden\">\n  <!-- Glowing CRT Scanline Effect -->\n  <div class=\"absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(18,24,38,0.3)_0%,rgba(5,6,8,1)_100%)] pointer-events-none z-10\"></div>\n  <div class=\"absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none z-10\"></div>\n\n  <div class=\"max-w-5xl w-full mx-auto flex-1 flex flex-col border border-[#38ef7d]/30 bg-black/80 rounded-xl p-5 shadow-[0_0_20px_rgba(56,239,125,0.15)] overflow-hidden z-0\">\n    <!-- Header bar -->\n    <div class=\"flex justify-between items-center border-b border-[#38ef7d]/20 pb-3 mb-4 shrink-0\">\n      <div class=\"flex items-center gap-2\">\n        <span class=\"w-3 h-3 rounded-full bg-red-500/80 animate-pulse\"></span>\n        <span class=\"w-3 h-3 rounded-full bg-yellow-500/80\"></span>\n        <span class=\"w-3 h-3 rounded-full bg-green-500/80\"></span>\n        <span class=\"text-xs text-[#38ef7d]/70 ml-2\">STITCH_CORE_VM_v1.4.2 [ONLINE]</span>\n      </div>\n      <div class=\"text-xs text-[#38ef7d]/50\" id=\"timeDisplay\">UTC: 2026-07-16 22:40</div>\n    </div>\n\n    <!-- System Telemetry Grid -->\n    <div class=\"grid grid-cols-3 gap-3 mb-4 shrink-0 text-[11px] border border-[#38ef7d]/10 bg-zinc-950/60 p-3 rounded-lg\">\n      <div>\n        <span class=\"text-zinc-500 font-bold\">STATION:</span> <span class=\"text-white\">STITCH-TERMINAL-09</span>\n      </div>\n      <div>\n        <span class=\"text-zinc-500 font-bold\">SYS_LOAD:</span> <span class=\"text-[#38ef7d]\" id=\"sysLoad\">12.5%</span>\n      </div>\n      <div>\n        <span class=\"text-zinc-500 font-bold\">MEMORY:</span> <span class=\"text-blue-400\">4.18GB / 16GB</span>\n      </div>\n    </div>\n\n    <!-- Terminal Output Stream -->\n    <div id=\"terminalStream\" class=\"flex-1 overflow-y-auto text-xs space-y-2 mb-4 scrollbar-thin select-text pr-2 leading-relaxed\">\n      <div class=\"text-[#38ef7d]/60\">========================================================</div>\n      <div class=\"text-white font-bold text-sm\">Welcome to Stitch DevSpace Virtual OS v1.4.2</div>\n      <div class=\"text-zinc-400\">Type <span class=\"text-[#38ef7d] font-bold\">help</span> to view available system commands.</div>\n      <div class=\"text-zinc-400\">Virtual file system mounted on root path <span class=\"text-yellow-400\">/sys/bin</span>.</div>\n      <div class=\"text-[#38ef7d]/60\">========================================================</div>\n    </div>\n\n    <!-- Input prompt line -->\n    <div class=\"flex items-center gap-2 border-t border-[#38ef7d]/20 pt-3 shrink-0\">\n      <span class=\"text-yellow-400 font-bold\">operator@stitch:~$</span>\n      <input type=\"text\" id=\"cliInput\" autofocus class=\"flex-1 bg-transparent border-none text-white font-mono text-xs outline-none focus:ring-0 p-0\" placeholder=\"Type a command...\">\n    </div>\n  </div>\n\n  <script src=\"app.js\"></script>\n</body>\n</html>",
    "app.js": "// Developer Sandbox CLI Tool Emulator\nconsole.log('💻 CLI Tool terminal shell emulator enqueued.');\n\nconst stream = document.getElementById('terminalStream');\nconst input = document.getElementById('cliInput');\nconst sysLoad = document.getElementById('sysLoad');\nconst timeDisplay = document.getElementById('timeDisplay');\n\n// Simulated simple file system\nlet currentPath = '/';\nconst fileSystem = {\n  '/': ['bin', 'docs', 'readme.txt', 'system_report.json'],\n  '/bin': ['help', 'sysinfo', 'motd', 'cpu_boost'],\n  '/docs': ['goals.md', 'secret_codes.txt']\n};\nconst fileContents = {\n  'readme.txt': 'Stitch Virtual Terminal Emulator. Developed with Love by Google AI Studio.',\n  'system_report.json': '{\\n  \"status\": \"healthy\",\\n  \"database\": \"connected\",\\n  \"active_users\": 1024,\\n  \"cache_hits\": \"98.4%\"\\n}',\n  'goals.md': '# Project Goals\\n1. Deliver flawless user interfaces\\n2. Maintain extreme scope discipline\\n3. Leverage fast sandboxed previews',\n  'secret_codes.txt': 'ADMIN_KEY_PASS=STITCH_NEON_AURA_2026'\n};\n\nconst formatOutput = (text, type = 'default') => {\n  const line = document.createElement('div');\n  if (type === 'error') line.className = 'text-red-400';\n  else if (type === 'success') line.className = 'text-[#38ef7d] font-bold';\n  else if (type === 'info') line.className = 'text-blue-400';\n  else if (type === 'warning') line.className = 'text-yellow-400';\n  else if (type === 'command') line.className = 'text-yellow-400 font-bold';\n  else line.className = 'text-zinc-300';\n  line.innerHTML = text;\n  stream.appendChild(line);\n  stream.scrollTop = stream.scrollHeight;\n};\n\n// Periodic telemetry fluctuation\nsetInterval(() => {\n  const load = (10 + Math.random() * 30).toFixed(1);\n  if (sysLoad) sysLoad.textContent = load + '%';\n}, 3000);\n\n// Clock update\nconst updateClock = () => {\n  const now = new Date();\n  if (timeDisplay) timeDisplay.textContent = 'UTC: ' + now.toISOString().replace('T', ' ').substring(0, 16);\n};\nupdateClock();\nsetInterval(updateClock, 60000);\n\n// Command processor\nconst processCommand = (cmdText) => {\n  const trimmed = cmdText.trim();\n  if (!trimmed) return;\n  \n  formatOutput('operator@stitch:~$ ' + trimmed, 'command');\n  \n  const args = trimmed.split(' ');\n  const cmd = args[0].toLowerCase();\n  \n  switch (cmd) {\n    case 'help':\n      formatOutput('Available commands:', 'info');\n      formatOutput('  <span class=\"text-[#38ef7d] font-bold\">ls</span>          - List files in current directory');\n      formatOutput('  <span class=\"text-[#38ef7d] font-bold\">cat [file]</span>  - Display file contents');\n      formatOutput('  <span class=\"text-[#38ef7d] font-bold\">sysinfo</span>     - Print virtualization matrix diagnostics');\n      formatOutput('  <span class=\"text-[#38ef7d] font-bold\">motd</span>        - Display Message of the Day greeting card');\n      formatOutput('  <span class=\"text-[#38ef7d] font-bold\">clear</span>       - Clear terminal console screen');\n      formatOutput('  <span class=\"text-[#38ef7d] font-bold\">cpu_boost</span>   - Simulates core thread burst scheduling');\n      break;\n    case 'ls':\n      const files = fileSystem[currentPath] || [];\n      formatOutput('Directory list for <span class=\"text-yellow-400\">' + currentPath + '</span>:');\n      formatOutput(files.map(f => f.includes('.') ? `<span class=\"text-white\">${f}</span>` : `<span class=\"text-blue-400 font-bold\">${f}/</span>`).join('   '));\n      break;\n    case 'cat':\n      if (!args[1]) {\n        formatOutput('Error: Usage: cat [filename]', 'error');\n        break;\n      }\n      const filename = args[1];\n      if (fileContents[filename]) {\n        formatOutput('<pre class=\"text-zinc-400 leading-normal\">' + fileContents[filename] + '</pre>');\n      } else {\n        formatOutput(`Error: File \"${filename}\" not found.`, 'error');\n      }\n      break;\n    case 'sysinfo':\n      formatOutput('Virtual System Diagnostics:', 'info');\n      formatOutput('  HOST_OS: Linux 6.1-amd64-container-optimized');\n      formatOutput('  CPU_CORES: 8x Hyper-threaded Virtual Core');\n      formatOutput('  SANDBOX: DevSpace Sandboxed Browser VM Container');\n      formatOutput('  LATENCY: 4ms Response Latency via Reverse Proxy');\n      break;\n    case 'motd':\n      formatOutput('=== STITCH MESSAGE OF THE DAY ===', 'success');\n      formatOutput('\"True craftsmanship means executing with precision and style. Simple is always elegant.\"');\n      break;\n    case 'clear':\n      stream.innerHTML = '';\n      break;\n    case 'cpu_boost':\n      formatOutput('Initiating Core Scheduling Boost Sequence...', 'warning');\n      setTimeout(() => {\n        if (sysLoad) sysLoad.textContent = '98.7% [BURST]';\n        formatOutput('Scheduling boost successfully active. All hyper-threads prioritized.', 'success');\n        setTimeout(() => {\n          if (sysLoad) sysLoad.textContent = '14.2%';\n          formatOutput('CPU scheduling stabilized back to idle profiles.', 'info');\n        }, 3000);\n      }, 800);\n      break;\n    default:\n      formatOutput(`Command \"${cmd}\" unrecognized. Type <span class=\"text-[#38ef7d] font-bold\">help</span> for a list of valid commands.`, 'error');\n  }\n};\n\ninput.addEventListener('keydown', (e) => {\n  if (e.key === 'Enter') {\n    const val = input.value;\n    processCommand(val);\n    input.value = '';\n  }\n});",
    "styles.css": "body {\n  font-family: 'Fira Code', 'Courier New', monospace;\n}\n.scrollbar-thin::-webkit-scrollbar {\n  width: 4px;\n}\n.scrollbar-thin::-webkit-scrollbar-thumb {\n  background: rgba(56,239,125,0.3);\n  border-radius: 4px;\n}",
  },
  "ai-generator": {
    "index.html": "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>Aether AI CopyWriter SaaS</title>\n  <script src=\"https://cdn.tailwindcss.com\"></script>\n</head>\n<body class=\"bg-[#0b0c10] text-[#c5c6c7] min-h-screen flex flex-col font-sans\">\n  <header class=\"border-b border-zinc-800 bg-[#1f2833]/20 px-6 py-4 flex justify-between items-center shrink-0\">\n    <div class=\"flex items-center gap-2\">\n      <span class=\"text-yellow-500 font-black tracking-widest text-lg\">AETHER_AI</span>\n      <span class=\"bg-yellow-500/10 text-yellow-500 text-[10px] font-mono px-2 py-0.5 rounded font-bold\">SaaS Pro v2.0</span>\n    </div>\n    <div class=\"flex items-center gap-4 text-xs\">\n      <span class=\"text-zinc-500\">API quota: <span class=\"text-zinc-300 font-bold font-mono\">198 / 200</span></span>\n      <div class=\"h-2 w-24 bg-zinc-800 rounded-full overflow-hidden\">\n        <div class=\"bg-yellow-500 h-full w-[99%]\"></div>\n      </div>\n    </div>\n  </header>\n\n  <div class=\"flex-1 flex min-h-0\">\n    <!-- Config panel Left -->\n    <aside class=\"w-80 border-r border-zinc-800 p-5 bg-zinc-950/40 flex flex-col gap-5 shrink-0 overflow-y-auto\">\n      <div class=\"space-y-1.5\">\n        <label class=\"text-[10px] uppercase font-mono font-bold text-zinc-500\">Copy Template</label>\n        <select id=\"tplSelect\" class=\"w-full bg-[#0b0c10] border border-zinc-800 rounded-lg p-2 text-xs text-white focus:border-yellow-500/50 outline-none\">\n          <option value=\"blog\">Blog Outline Planner</option>\n          <option value=\"ad\">High-Converting Facebook Ad</option>\n          <option value=\"tweet\">Viral Product Announcement Tweet</option>\n          <option value=\"email\">Warm SaaS Outreach Email</option>\n        </select>\n      </div>\n\n      <div class=\"space-y-1.5\">\n        <label class=\"text-[10px] uppercase font-mono font-bold text-zinc-500\">Tone of Voice</label>\n        <div class=\"grid grid-cols-2 gap-2\">\n          <button class=\"tone-btn active px-3 py-1.5 bg-zinc-900 border border-yellow-500/30 text-yellow-500 text-xs rounded-lg cursor-pointer text-center\">Creative</button>\n          <button class=\"tone-btn px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs rounded-lg cursor-pointer text-center\">Professional</button>\n          <button class=\"tone-btn px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs rounded-lg cursor-pointer text-center\">Casual</button>\n          <button class=\"tone-btn px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs rounded-lg cursor-pointer text-center\">Witty</button>\n        </div>\n      </div>\n\n      <div class=\"space-y-1.5\">\n        <div class=\"flex justify-between items-center\">\n          <label class=\"text-[10px] uppercase font-mono font-bold text-zinc-500\">Word Count Limit</label>\n          <span class=\"text-xs text-yellow-500 font-mono font-bold\" id=\"wordCountLabel\">250 words</span>\n        </div>\n        <input type=\"range\" id=\"wordRange\" min=\"50\" max=\"1000\" step=\"50\" value=\"250\" class=\"w-full accent-yellow-500\">\n      </div>\n\n      <div class=\"space-y-1.5\">\n        <label class=\"text-[10px] uppercase font-mono font-bold text-zinc-500\">Topic Prompt</label>\n        <textarea id=\"promptInput\" rows=\"4\" class=\"w-full bg-[#0b0c10] border border-zinc-800 rounded-lg p-3 text-xs text-white focus:border-yellow-500/50 outline-none resize-none\" placeholder=\"Explain your core topic, project specs, or key benefits...\"></textarea>\n      </div>\n\n      <button id=\"generateBtn\" class=\"w-full bg-yellow-500 hover:bg-yellow-400 text-[#0b0c10] font-bold text-xs py-2.5 rounded-lg transition-all flex justify-center items-center gap-1.5 active:scale-95 cursor-pointer\">\n        <span>Generate Copy</span>\n        <svg class=\"w-3.5 h-3.5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2.5\" d=\"M13 10V3L4 14h7v7l9-11h-7z\"></path></svg>\n      </button>\n    </aside>\n\n    <!-- Main Workspace Center -->\n    <main class=\"flex-1 flex flex-col p-6 min-h-0 bg-[#0b0c10]\">\n      <div class=\"flex-1 border border-zinc-800 rounded-2xl bg-[#1f2833]/10 p-6 flex flex-col min-h-0 relative\">\n        <div class=\"flex justify-between items-center border-b border-zinc-800/80 pb-4 mb-4 shrink-0\">\n          <span class=\"text-xs uppercase font-mono text-zinc-500\">AI OUTPUT WORKSPACE</span>\n          <button id=\"copyBtn\" class=\"px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-[11px] text-zinc-400 hover:text-white transition-all hover:border-zinc-700 cursor-pointer\">Copy to Clipboard</button>\n        </div>\n\n        <!-- Generated copy block -->\n        <div class=\"flex-1 overflow-y-auto leading-relaxed text-sm select-text text-zinc-200\" id=\"outputConsole\">\n          <p class=\"text-zinc-500 italic\">Adjust options and click 'Generate Copy' to query the virtual AI pipeline...</p>\n        </div>\n      </div>\n    </main>\n\n    <!-- History list Right -->\n    <aside class=\"w-72 border-l border-zinc-800 p-5 bg-zinc-950/40 flex flex-col shrink-0 overflow-y-auto\">\n      <h3 class=\"text-[10px] uppercase font-mono font-bold text-zinc-500 mb-3\">Copy History</h3>\n      <div id=\"historyList\" class=\"space-y-2.5\">\n        <!-- History entries -->\n      </div>\n    </aside>\n  </div>\n\n  <script src=\"app.js\"></script>\n</body>\n</html>",
    "app.js": "// AI content generator controller\nconsole.log('🤖 AI Content Generator engine activated.');\n\nconst tplSelect = document.getElementById('tplSelect');\nconst wordRange = document.getElementById('wordRange');\nconst wordCountLabel = document.getElementById('wordCountLabel');\nconst promptInput = document.getElementById('promptInput');\nconst generateBtn = document.getElementById('generateBtn');\nconst outputConsole = document.getElementById('outputConsole');\nconst copyBtn = document.getElementById('copyBtn');\nconst historyList = document.getElementById('historyList');\n\nconst templates = {\n  blog: {\n    prompt: 'Create a comprehensive blog outline for: A developer guide to responsive HTML5 canvas scaling.',\n    response: '<h2>🚀 Title: Mastering High-DPI Responsive HTML5 Canvases</h2>\\\\n\\\\n<p><b>Introduction</b>\\\\n- The fundamental challenge: Why canvases look blurry on modern Retina displays.\\\\n- Device Pixel Ratio (DPR) explained.</p>\\\\n\\\\n<p><b>1. Setting Up the Base Canvas State</b>\\\\n- Logical sizing vs physical pixels width/height.\\\\n- Drawing context scaling: ctx.scale(dpr, dpr).</p>\\\\n\\\\n<p><b>2. Binding to ResizeObserver</b>\\\\n- Debouncing frame resizing updates safely.\\\\n- Storing container offset boundaries cleanly inside state.</p>'\n  },\n  ad: {\n    prompt: 'Facebook ad copy for: Stitch AI, a server-side developer tool prioritizing offline-first state.',\n    response: '<h3>🔥 STOP EXPOSING YOUR PRIVATE API KEYS!</h3>\\\\n\\\\n<p>Developer, let’s be completely honest: Client-side secrets are a critical security disaster waiting to happen.</p>\\\\n\\\\n<p>Meet <b>Stitch Developer SDK</b>: Your lightweight, secure, Express-integrated proxy engine. \\\\n\\\\n✅ Seamless lazy-initialization guards\\\\n✅ Automated token leak audits\\\\n✅ Gorgeous pre-configured dark telemetry panels</p>\\\\n\\\\n<p>👉 Join 10,000+ developers scaling safely today: <b>https://stitch.dev/build</b></p>'\n  },\n  tweet: {\n    prompt: 'Twitter announcement for: The launch of a high-contrast terminal theme for dark-mode IDEs.',\n    response: '<p>🚀 Say hello to <b>Stitch Neon Aura</b>! \\\\n\\\\nAn eye-safe, high-contrast terminal theme crafted specifically for developers who live inside the terminal until 3 AM. \\\\n\\\\n- JetBrains Mono typography pairing\\\\n- Subtle CRT scanline filter\\\\n- Responsive sidebar telemetry layouts\\\\n\\\\nTry it now for free 👇 #developer #coding #webdev</p>'\n  },\n  email: {\n    prompt: 'Outreach email targeting engineering managers about the Stitch automatic linter companion.',\n    response: '<p><b>Subject: Let’s eliminate syntax errors from your shared workspace</b></p>\\\\n\\\\n<p>Hi Engineering Leader,</p>\\\\n\\\\n<p>If your team spends more than 5 minutes debugging basic compile/lint errors per merge request, that is hours of lost developer velocity every week.</p>\\\\n\\\\n<p>The <b>Stitch Linter companion</b> automates syntax analysis directly in the sandboxed preview frame, warning creators about typos or missing imports BEFORE compiling.</p>\\\\n\\\\n<p>Would you be open to a quick 5-minute visual walkthrough next Tuesday?</p>'\n  }\n};\n\n// Set initial prompt based on selection\nconst updatePromptFromTpl = () => {\n  const activeTpl = tplSelect.value;\n  if (templates[activeTpl]) {\n    promptInput.value = templates[activeTpl].prompt;\n  }\n};\ntplSelect.addEventListener('change', updatePromptFromTpl);\nupdatePromptFromTpl();\n\nwordRange.addEventListener('input', () => {\n  wordCountLabel.textContent = wordRange.value + ' words';\n});\n\n// Mock tone switching\nconst toneButtons = document.querySelectorAll('.tone-btn');\ntoneButtons.forEach(btn => {\n  btn.addEventListener('click', () => {\n    toneButtons.forEach(b => b.classList.remove('active', 'border-yellow-500/30', 'text-yellow-500'));\n    toneButtons.forEach(b => b.classList.add('border-zinc-800', 'text-zinc-400'));\n    \n    btn.classList.add('active', 'border-yellow-500/30', 'text-yellow-500');\n    btn.classList.remove('border-zinc-800', 'text-zinc-400');\n  });\n});\n\nlet searchHistory = [\n  { id: 1, title: 'Blog Outline canvas', template: 'blog', date: '3 mins ago' },\n  { id: 2, title: 'Facebook Ad copy Stitch', template: 'ad', date: '1 hour ago' }\n];\n\nconst renderHistory = () => {\n  historyList.innerHTML = '';\n  searchHistory.forEach(h => {\n    const card = document.createElement('div');\n    card.className = 'p-3 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-all cursor-pointer';\n    card.innerHTML = `\n      <div class=\"flex justify-between items-center mb-1\">\n        <span class=\"text-[9px] uppercase font-mono text-zinc-500 font-bold\">\\${h.template}</span>\n        <span class=\"text-[8px] font-mono text-zinc-600\">\\${h.date}</span>\n      </div>\n      <p class=\"text-xs text-white font-semibold truncate\">\\${h.title}</p>\n    `;\n    card.addEventListener('click', () => {\n      tplSelect.value = h.template;\n      promptInput.value = templates[h.template].prompt;\n      outputConsole.html = templates[h.template].response;\n    });\n    historyList.appendChild(card);\n  });\n};\nrenderHistory();\n\ngenerateBtn.addEventListener('click', () => {\n  const prompt = promptInput.value.trim();\n  if (!prompt) {\n    alert('Please define your prompt topic!');\n    return;\n  }\n\n  generateBtn.disabled = true;\n  generateBtn.innerHTML = 'Streaming Tokens...';\n  outputConsole.innerHTML = '<span class=\"text-yellow-500/80 font-mono animate-pulse\">Initializing pipeline connection...</span>';\n\n  setTimeout(() => {\n    outputConsole.innerHTML = '';\n    const activeTpl = tplSelect.value;\n    const responseText = templates[activeTpl] ? templates[activeTpl].response : `<h2>📝 Custom Copy Generated</h2>\\\\n\\\\n<p>Prompt: \"\\${prompt}\"</p>\\\\n\\\\n<p>Simulating GPT/Gemini streaming endpoint results under high temperature configs...</p>`;\n\n    // Simulate streaming typing effect\n    let idx = 0;\n    const interval = setInterval(() => {\n      if (idx < responseText.length) {\n        outputConsole.innerHTML = responseText.substring(0, idx) + '▋';\n        idx += 4;\n      } else {\n        outputConsole.innerHTML = responseText;\n        clearInterval(interval);\n        generateBtn.disabled = false;\n        generateBtn.innerHTML = '<span>Generate Copy</span>';\n        \n        // Add to history\n        searchHistory.unshift({\n          id: Date.now(),\n          title: prompt.substring(0, 30) + '...',\n          template: activeTpl,\n          date: 'Just now'\n        });\n        renderHistory();\n      }\n    }, 15);\n  }, 1000);\n});\n\ncopyBtn.addEventListener('click', () => {\n  const text = outputConsole.innerText;\n  navigator.clipboard.writeText(text);\n  alert('Copied AI copy text to clipboard!');\n});",
  },
  "crypto-tracker": {
    "index.html": "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>Cosmic Crypto Tracker</title>\n  <script src=\"https://cdn.tailwindcss.com\"></script>\n</head>\n<body class=\"bg-[#0c0d12] text-zinc-100 min-h-screen p-6 font-sans\">\n  <div class=\"max-w-6xl mx-auto space-y-6\">\n    <!-- Header -->\n    <div class=\"flex justify-between items-center border-b border-zinc-800 pb-4\">\n      <div>\n        <h1 class=\"text-xl font-extrabold tracking-wider text-white uppercase\">COSMIC LEDGER INTEGRATION</h1>\n        <p class=\"text-[10px] text-zinc-500 uppercase font-mono\">Simulated Crypto & Stock trading terminal</p>\n      </div>\n      <div class=\"flex items-center gap-4\">\n        <div class=\"bg-zinc-900 border border-zinc-800 px-3.5 py-1.5 rounded-lg text-xs\">\n          <span class=\"text-zinc-500 font-mono\">CASH BALANCE:</span>\n          <span class=\"text-[#38ef7d] font-bold font-mono ml-1\" id=\"cashBalance\">$10,000.00</span>\n        </div>\n        <div class=\"bg-zinc-900 border border-zinc-800 px-3.5 py-1.5 rounded-lg text-xs\">\n          <span class=\"text-zinc-500 font-mono\">PORTFOLIO:</span>\n          <span class=\"text-white font-bold font-mono ml-1\" id=\"portfolioValue\">$10,000.00</span>\n        </div>\n      </div>\n    </div>\n\n    <!-- Stats summary grid -->\n    <div class=\"grid grid-cols-1 md:grid-cols-3 gap-4\">\n      <div class=\"bg-[#12131a] border border-zinc-800 p-4 rounded-xl flex justify-between items-center\">\n        <div>\n          <span class=\"text-zinc-500 text-[10px] uppercase font-mono block\">Bitcoin (BTC)</span>\n          <span class=\"text-xl font-bold font-mono text-white\" id=\"btcPrice\">$64,250.00</span>\n        </div>\n        <span class=\"text-xs bg-[#38ef7d]/10 text-[#38ef7d] px-2 py-0.5 rounded font-mono font-bold\" id=\"btcDiff\">+2.41%</span>\n      </div>\n      <div class=\"bg-[#12131a] border border-zinc-800 p-4 rounded-xl flex justify-between items-center\">\n        <div>\n          <span class=\"text-zinc-500 text-[10px] uppercase font-mono block\">Ethereum (ETH)</span>\n          <span class=\"text-xl font-bold font-mono text-white\" id=\"ethPrice\">$3,480.00</span>\n        </div>\n        <span class=\"text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded font-mono font-bold\" id=\"ethDiff\">-1.15%</span>\n      </div>\n      <div class=\"bg-[#12131a] border border-zinc-800 p-4 rounded-xl flex justify-between items-center\">\n        <div>\n          <span class=\"text-zinc-500 text-[10px] uppercase font-mono block\">Stitch Engine (STCH)</span>\n          <span class=\"text-xl font-bold font-mono text-white\" id=\"stchPrice\">$89.45</span>\n        </div>\n        <span class=\"text-xs bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded font-mono font-bold\" id=\"stchDiff\">+12.8%</span>\n      </div>\n    </div>\n\n    <!-- Chart & trading block -->\n    <div class=\"grid grid-cols-1 lg:grid-cols-3 gap-5\">\n      <!-- SVG Line Chart Left -->\n      <div class=\"lg:col-span-2 bg-[#12131a] border border-zinc-800 p-5 rounded-xl flex flex-col min-h-[320px]\">\n        <div class=\"flex justify-between items-center mb-4 shrink-0\">\n          <span class=\"text-xs font-bold font-mono uppercase text-zinc-500\">BTC/USD 1-Minute Live Chart</span>\n          <div class=\"flex gap-2\">\n            <button class=\"px-2 py-0.5 bg-zinc-800 text-[10px] rounded hover:text-white text-zinc-400 cursor-pointer\">1M</button>\n            <button class=\"px-2 py-0.5 bg-zinc-900 text-[10px] rounded text-zinc-500 cursor-pointer\">5M</button>\n            <button class=\"px-2 py-0.5 bg-zinc-900 text-[10px] rounded text-zinc-500 cursor-pointer\">1H</button>\n          </div>\n        </div>\n        <div class=\"flex-1 min-h-0 relative\">\n          <!-- SVG element for trend line -->\n          <svg id=\"chartSvg\" class=\"w-full h-full text-yellow-500\" viewBox=\"0 0 600 200\" preserveAspectRatio=\"none\">\n            <polyline id=\"chartLine\" fill=\"none\" stroke=\"#eab308\" stroke-width=\"2\" points=\"\"></polyline>\n          </svg>\n        </div>\n      </div>\n\n      <!-- Trading widget Right -->\n      <div class=\"bg-[#12131a] border border-zinc-800 p-5 rounded-xl flex flex-col\">\n        <h3 class=\"text-xs font-bold font-mono uppercase text-zinc-500 mb-4 border-b border-zinc-800 pb-2\">SIMULATOR ORDER BLOCKS</h3>\n        <div class=\"space-y-4 flex-1\">\n          <div class=\"space-y-1.5\">\n            <label class=\"text-[10px] uppercase font-mono text-zinc-500 font-bold block\">Select Asset</label>\n            <select id=\"assetSelect\" class=\"w-full bg-[#0c0d12] border border-zinc-800 rounded-lg p-2 text-xs text-white outline-none\">\n              <option value=\"BTC\" data-price=\"64250\">Bitcoin (BTC)</option>\n              <option value=\"ETH\" data-price=\"3480\">Ethereum (ETH)</option>\n              <option value=\"STCH\" data-price=\"89.45\">Stitch Engine (STCH)</option>\n            </select>\n          </div>\n\n          <div class=\"space-y-1.5\">\n            <label class=\"text-[10px] uppercase font-mono text-zinc-500 font-bold block\">Transaction Type</label>\n            <div class=\"grid grid-cols-2 gap-2\">\n              <button id=\"buyTab\" class=\"py-1.5 bg-green-500/10 text-[#38ef7d] border border-green-500/30 text-xs font-bold rounded-lg cursor-pointer text-center uppercase\">Buy</button>\n              <button id=\"sellTab\" class=\"py-1.5 bg-zinc-900 text-zinc-500 border border-zinc-800 text-xs rounded-lg cursor-pointer text-center uppercase\">Sell</button>\n            </div>\n          </div>\n\n          <div class=\"space-y-1.5\">\n            <label class=\"text-[10px] uppercase font-mono text-zinc-500 font-bold block\">Amount</label>\n            <input type=\"number\" id=\"tradeAmount\" min=\"0.01\" step=\"0.1\" value=\"1\" class=\"w-full bg-[#0c0d12] border border-zinc-800 rounded-lg p-2 text-xs text-white font-mono focus:border-yellow-500/50 outline-none\">\n          </div>\n        </div>\n\n        <button id=\"placeOrderBtn\" class=\"w-full bg-green-500 hover:bg-green-400 text-black font-black py-2.5 rounded-lg text-xs transition-all tracking-wider cursor-pointer uppercase mt-4\">Place Order</button>\n      </div>\n    </div>\n\n    <!-- Active positions ledger -->\n    <div class=\"bg-[#12131a] border border-zinc-800 p-5 rounded-xl\">\n      <h3 class=\"text-xs font-bold font-mono uppercase text-zinc-500 mb-3 border-b border-zinc-800 pb-2\">ACTIVE LEDGER HOLDINGS</h3>\n      <div class=\"overflow-x-auto\">\n        <table class=\"w-full text-left text-xs font-mono\">\n          <thead>\n            <tr class=\"text-zinc-500 border-b border-zinc-800\">\n              <th class=\"pb-2\">ASSET</th>\n              <th class=\"pb-2\">HOLDINGS</th>\n              <th class=\"pb-2\">AVG BUY PRICE</th>\n              <th class=\"pb-2\">TOTAL VALUE</th>\n            </tr>\n          </thead>\n          <tbody id=\"holdingsTable\">\n            <!-- Dynamic items -->\n          </tbody>\n        </table>\n      </div>\n    </div>\n  </div>\n\n  <script src=\"app.js\"></script>\n</body>\n</html>",
    "app.js": "// Stock & Crypto portfolio controller\nconsole.log('📈 Stock portfolio matrix initialized.');\n\nconst cashBalEl = document.getElementById('cashBalance');\nconst portfolioValEl = document.getElementById('portfolioValue');\nconst btcPriceEl = document.getElementById('btcPrice');\nconst ethPriceEl = document.getElementById('ethPrice');\nconst stchPriceEl = document.getElementById('stchPrice');\nconst btcDiffEl = document.getElementById('btcDiff');\nconst ethDiffEl = document.getElementById('ethDiff');\nconst stchDiffEl = document.getElementById('stchDiff');\n\nconst chartLine = document.getElementById('chartLine');\nconst chartSvg = document.getElementById('chartSvg');\n\nconst assetSelect = document.getElementById('assetSelect');\nconst buyTab = document.getElementById('buyTab');\nconst sellTab = document.getElementById('sellTab');\nconst tradeAmount = document.getElementById('tradeAmount');\nconst placeOrderBtn = document.getElementById('placeOrderBtn');\nconst holdingsTable = document.getElementById('holdingsTable');\n\n// State variables\nlet cashBalance = 10000.00;\nlet portfolio = {\n  'BTC': { quantity: 0.1, avgPrice: 63000.00 },\n  'ETH': { quantity: 1.5, avgPrice: 3400.00 },\n  'STCH': { quantity: 20, avgPrice: 85.00 }\n};\n\nlet prices = {\n  'BTC': 64250.00,\n  'ETH': 3480.00,\n  'STCH': 89.45\n};\n\nlet priceHistory = Array.from({ length: 40 }, (_, i) => 64000 + Math.sin(i * 0.4) * 800 + Math.random() * 200);\n\nlet activeTradeType = 'BUY'; // BUY or SELL\n\n// Switch tabs\nbuyTab.addEventListener('click', () => {\n  activeTradeType = 'BUY';\n  buyTab.className = 'py-1.5 bg-green-500/10 text-[#38ef7d] border border-green-500/30 text-xs font-bold rounded-lg cursor-pointer text-center uppercase';\n  sellTab.className = 'py-1.5 bg-zinc-900 text-zinc-500 border border-zinc-800 text-xs rounded-lg cursor-pointer text-center uppercase';\n  placeOrderBtn.className = 'w-full bg-green-500 hover:bg-green-400 text-black font-black py-2.5 rounded-lg text-xs transition-all tracking-wider cursor-pointer uppercase mt-4';\n  placeOrderBtn.textContent = 'Place BUY Order';\n});\n\nsellTab.addEventListener('click', () => {\n  activeTradeType = 'SELL';\n  sellTab.className = 'py-1.5 bg-red-500/10 text-red-400 border border-red-500/30 text-xs font-bold rounded-lg cursor-pointer text-center uppercase';\n  buyTab.className = 'py-1.5 bg-zinc-900 text-zinc-500 border border-zinc-800 text-xs rounded-lg cursor-pointer text-center uppercase';\n  placeOrderBtn.className = 'w-full bg-red-500 hover:bg-red-400 text-white font-black py-2.5 rounded-lg text-xs transition-all tracking-wider cursor-pointer uppercase mt-4';\n  placeOrderBtn.textContent = 'Place SELL Order';\n});\n\n// Real-time market tick simulator\nsetInterval(() => {\n  const btcChange = (Math.random() - 0.49) * 200;\n  const ethChange = (Math.random() - 0.51) * 15;\n  const stchChange = (Math.random() - 0.45) * 1.2;\n\n  prices.BTC = Math.max(1000, prices.BTC + btcChange);\n  prices.ETH = Math.max(100, prices.ETH + ethChange);\n  prices.STCH = Math.max(1, prices.STCH + stchChange);\n\n  btcPriceEl.textContent = '$' + prices.BTC.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });\n  ethPriceEl.textContent = '$' + prices.ETH.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });\n  stchPriceEl.textContent = '$' + prices.STCH.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });\n\n  // Add BTC history & redraw chart\n  priceHistory.push(prices.BTC);\n  if (priceHistory.length > 40) priceHistory.shift();\n  drawChart();\n  updateBalanceMetrics();\n  renderHoldings();\n}, 2000);\n\nconst drawChart = () => {\n  const points = [];\n  const min = Math.min(...priceHistory);\n  const max = Math.max(...priceHistory);\n  const range = max - min || 1;\n\n  for (let i = 0; i < priceHistory.length; i++) {\n    const x = (i / (priceHistory.length - 1)) * 580 + 10;\n    const y = 180 - ((priceHistory[i] - min) / range) * 160;\n    points.push(`${x},${y}`);\n  }\n  chartLine.setAttribute('points', points.join(' '));\n};\ndrawChart();\n\nconst updateBalanceMetrics = () => {\n  let holdingsValue = 0;\n  Object.keys(portfolio).forEach(key => {\n    holdingsValue += portfolio[key].quantity * prices[key];\n  });\n  \n  const totalValue = cashBalance + holdingsValue;\n  cashBalEl.textContent = '$' + cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });\n  portfolioValEl.textContent = '$' + totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });\n};\n\nconst renderHoldings = () => {\n  holdingsTable.innerHTML = '';\n  Object.keys(portfolio).forEach(key => {\n    const item = portfolio[key];\n    if (item.quantity <= 0) return;\n    const value = item.quantity * prices[key];\n    \n    const row = document.createElement('tr');\n    row.className = 'border-b border-zinc-800/50 py-2.5';\n    row.innerHTML = `\n      <td class=\"py-2.5 text-white font-bold\">${key}</td>\n      <td class=\"py-2.5\">${item.quantity.toFixed(4)}</td>\n      <td class=\"py-2.5 text-zinc-400\">$${item.avgPrice.toLocaleString('en-US', { maximumFractionDigits: 2 })}</td>\n      <td class=\"py-2.5 text-[#38ef7d] font-bold\">$${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}</td>\n    `;\n    holdingsTable.appendChild(row);\n  });\n};\nrenderHoldings();\n\nplaceOrderBtn.addEventListener('click', () => {\n  const asset = assetSelect.value;\n  const price = prices[asset];\n  const qty = parseFloat(tradeAmount.value);\n  \n  if (isNaN(qty) || qty <= 0) {\n    alert('Please enter a valid asset amount!');\n    return;\n  }\n\n  const cost = qty * price;\n\n  if (activeTradeType === 'BUY') {\n    if (cost > cashBalance) {\n      alert('Insufficient USD funds available to fulfill this order!');\n      return;\n    }\n    cashBalance -= cost;\n    \n    const existing = portfolio[asset] || { quantity: 0, avgPrice: 0 };\n    const newQty = existing.quantity + qty;\n    const newAvg = ((existing.quantity * existing.avgPrice) + cost) / newQty;\n    \n    portfolio[asset] = { quantity: newQty, avgPrice: newAvg };\n    console.log(`[Order Placed] Bought ${qty} ${asset} at $${price}`);\n  } else {\n    const existing = portfolio[asset];\n    if (!existing || existing.quantity < qty) {\n      alert('Insufficient asset holdings available to close this position!');\n      return;\n    }\n    cashBalance += cost;\n    existing.quantity -= qty;\n    console.log(`[Order Placed] Sold ${qty} ${asset} at $${price}`);\n  }\n\n  updateBalanceMetrics();\n  renderHoldings();\n});",
  },
  "pomodoro-hub": {
    "index.html": "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>Focus Pomodoro Hub</title>\n  <script src=\"https://cdn.tailwindcss.com\"></script>\n</head>\n<body class=\"bg-[#0f1115] text-[#d1d5db] min-h-screen p-6 font-sans flex flex-col justify-center items-center\">\n  <div class=\"max-w-4xl w-full grid grid-cols-1 md:grid-cols-3 gap-6 bg-zinc-950/80 border border-zinc-800 rounded-3xl p-6 shadow-2xl relative\">\n    \n    <!-- Timer Column Left -->\n    <div class=\"md:col-span-2 bg-zinc-900/50 border border-zinc-850 p-6 rounded-2xl flex flex-col items-center justify-center space-y-6\">\n      <div class=\"flex gap-2.5\">\n        <button id=\"workTab\" class=\"px-3.5 py-1.5 bg-yellow-500 text-black text-xs font-bold rounded-lg cursor-pointer\">Work Focus</button>\n        <button id=\"breakTab\" class=\"px-3.5 py-1.5 bg-zinc-850 text-zinc-400 text-xs rounded-lg hover:text-white cursor-pointer\">Short Break</button>\n      </div>\n\n      <!-- Large Clock display -->\n      <div class=\"relative w-48 h-48 flex items-center justify-center\">\n        <!-- SVG Radial Ring -->\n        <svg class=\"absolute inset-0 w-full h-full transform -rotate-90\">\n          <circle cx=\"96\" cy=\"96\" r=\"88\" fill=\"none\" stroke=\"#18181b\" stroke-width=\"6\"></circle>\n          <circle id=\"timerRing\" cx=\"96\" cy=\"96\" r=\"88\" fill=\"none\" stroke=\"#eab308\" stroke-width=\"6\" stroke-dasharray=\"552\" stroke-dashoffset=\"0\"></circle>\n        </svg>\n        <div class=\"text-4xl font-extrabold font-mono text-white tracking-wider\" id=\"timerLabel\">25:00</div>\n      </div>\n\n      <!-- Control triggers -->\n      <div class=\"flex gap-3\">\n        <button id=\"startBtn\" class=\"px-6 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-[#0f1115] font-black text-xs rounded-lg uppercase tracking-widest cursor-pointer\">Start Focus</button>\n        <button id=\"resetBtn\" class=\"px-6 py-2.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-400 hover:text-white text-xs font-bold rounded-lg uppercase cursor-pointer\">Reset</button>\n      </div>\n    </div>\n\n    <!-- Right Task Column -->\n    <div class=\"flex flex-col gap-4\">\n      <!-- Focus Sounds Ambiance -->\n      <div class=\"bg-zinc-900/40 border border-zinc-850 p-4 rounded-2xl\">\n        <h3 class=\"text-[10px] uppercase font-mono font-bold text-zinc-500 mb-3\">Focus Ambiance</h3>\n        <div class=\"space-y-2\">\n          <button class=\"sound-btn w-full p-2 bg-zinc-950/80 hover:bg-zinc-900 border border-yellow-500/20 text-yellow-500 rounded-lg text-xs font-bold text-left cursor-pointer\">🌧️ Cozy Rainforest Storm</button>\n          <button class=\"sound-btn w-full p-2 bg-[#0f1115] hover:bg-zinc-900 border border-zinc-850 text-zinc-400 rounded-lg text-xs text-left cursor-pointer\">☕ Lofi Cafe Coffee Shop</button>\n        </div>\n      </div>\n\n      <!-- Checklist Task board -->\n      <div class=\"bg-zinc-900/40 border border-zinc-850 p-4 rounded-2xl flex-1 flex flex-col min-h-0\">\n        <h3 class=\"text-[10px] uppercase font-mono font-bold text-zinc-500 mb-3\">Focus Checklist</h3>\n        \n        <div class=\"space-y-2 flex-1 overflow-y-auto mb-3\" id=\"todoList\">\n          <!-- tasks check list entries -->\n        </div>\n\n        <div class=\"flex gap-1.5 shrink-0\">\n          <input type=\"text\" id=\"newTaskInput\" placeholder=\"Add custom chore...\" class=\"flex-1 bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-xs text-zinc-200 outline-none\">\n          <button id=\"addTaskBtn\" class=\"p-2 bg-yellow-500 text-[#0f1115] hover:bg-yellow-400 rounded-lg text-xs font-bold cursor-pointer font-mono\">+</button>\n        </div>\n      </div>\n    </div>\n\n  </div>\n\n  <script src=\"app.js\"></script>\n</body>\n</html>",
    "app.js": "// Pomodoro timer and focus hub state controller\nconsole.log('⏳ Pomodoro ticking mechanism aligned.');\n\nconst startBtn = document.getElementById('startBtn');\nconst resetBtn = document.getElementById('resetBtn');\nconst workTab = document.getElementById('workTab');\nconst breakTab = document.getElementById('breakTab');\nconst timerLabel = document.getElementById('timerLabel');\nconst timerRing = document.getElementById('timerRing');\n\nconst soundButtons = document.querySelectorAll('.sound-btn');\nconst todoList = document.getElementById('todoList');\nconst newTaskInput = document.getElementById('newTaskInput');\nconst addTaskBtn = document.getElementById('addTaskBtn');\n\n// Timer State\nlet duration = 25 * 60; // 25 mins\nlet currentTimer = duration;\nlet intervalId = null;\nlet isRunning = false;\nlet currentMode = 'WORK'; // WORK or BREAK\n\nconst updateTimerDisplay = () => {\n  const min = Math.floor(currentTimer / 60);\n  const sec = currentTimer % 60;\n  timerLabel.textContent = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;\n\n  // Draw SVG circle progress dashoffset\n  const percent = currentTimer / duration;\n  const offset = 552 * (1 - percent);\n  timerRing.style.strokeDashoffset = offset;\n};\nupdateTimerDisplay();\n\nconst startTimer = () => {\n  if (isRunning) {\n    clearInterval(intervalId);\n    startBtn.textContent = 'Resume Focus';\n    isRunning = false;\n  } else {\n    startBtn.textContent = 'Pause Session';\n    isRunning = true;\n    intervalId = setInterval(() => {\n      if (currentTimer > 0) {\n        currentTimer--;\n        updateTimerDisplay();\n      } else {\n        clearInterval(intervalId);\n        alert(currentMode === 'WORK' ? 'Work session complete! Take a break.' : 'Break complete! Back to work.');\n        toggleMode();\n      }\n    }, 1000);\n  }\n};\n\nconst toggleMode = () => {\n  if (currentMode === 'WORK') {\n    currentMode = 'BREAK';\n    duration = 5 * 60; // 5 mins short break\n    workTab.className = 'px-3.5 py-1.5 bg-zinc-850 text-zinc-400 text-xs rounded-lg hover:text-white cursor-pointer';\n    breakTab.className = 'px-3.5 py-1.5 bg-yellow-500 text-black text-xs font-bold rounded-lg cursor-pointer';\n  } else {\n    currentMode = 'WORK';\n    duration = 25 * 60;\n    breakTab.className = 'px-3.5 py-1.5 bg-zinc-850 text-zinc-400 text-xs rounded-lg hover:text-white cursor-pointer';\n    workTab.className = 'px-3.5 py-1.5 bg-yellow-500 text-black text-xs font-bold rounded-lg cursor-pointer';\n  }\n  currentTimer = duration;\n  isRunning = false;\n  startBtn.textContent = 'Start Focus';\n  clearInterval(intervalId);\n  updateTimerDisplay();\n};\n\nworkTab.addEventListener('click', () => {\n  if (currentMode === 'BREAK') toggleMode();\n});\nbreakTab.addEventListener('click', () => {\n  if (currentMode === 'WORK') toggleMode();\n});\n\nstartBtn.addEventListener('click', startTimer);\nresetBtn.addEventListener('click', () => {\n  clearInterval(intervalId);\n  currentTimer = duration;\n  isRunning = false;\n  startBtn.textContent = 'Start Focus';\n  updateTimerDisplay();\n});\n\n// Ambiance sounds\nsoundButtons.forEach(btn => {\n  btn.addEventListener('click', () => {\n    soundButtons.forEach(b => b.className = 'sound-btn w-full p-2 bg-[#0f1115] hover:bg-zinc-900 border border-zinc-850 text-zinc-400 rounded-lg text-xs text-left cursor-pointer');\n    btn.className = 'sound-btn w-full p-2 bg-zinc-950/80 hover:bg-zinc-900 border border-yellow-500/20 text-yellow-500 rounded-lg text-xs font-bold text-left cursor-pointer';\n    console.log('[Media Player] Simulating audio stream loop for: ' + btn.textContent);\n  });\n});\n\n// Focus chores board\nlet tasks = [\n  { id: 1, title: 'Refactor Stitch telemetry layouts', done: true },\n  { id: 2, title: 'Establish liveness heartbeat script', done: false }\n];\n\nconst renderTasks = () => {\n  todoList.innerHTML = '';\n  tasks.forEach(task => {\n    const item = document.createElement('div');\n    item.className = 'flex items-center gap-2 bg-[#0f1115] border border-zinc-850 p-2 rounded-lg';\n    item.innerHTML = `\n      <input type=\"checkbox\" ${task.done ? 'checked' : ''} class=\"accent-yellow-500 w-3.5 h-3.5 cursor-pointer\">\n      <span class=\"text-xs flex-1 ${task.done ? 'line-through text-zinc-500' : 'text-zinc-300'}\">${task.title}</span>\n    `;\n    item.querySelector('input').addEventListener('change', () => {\n      task.done = !task.done;\n      renderTasks();\n    });\n    todoList.appendChild(item);\n  });\n};\nrenderTasks();\n\naddTaskBtn.addEventListener('click', () => {\n  const text = newTaskInput.value.trim();\n  if (!text) return;\n  tasks.push({ id: Date.now(), title: text, done: false });\n  newTaskInput.value = '';\n  renderTasks();\n});",
  },
  "api-playground": {
    "index.html": "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>Developer REST API Sandbox</title>\n  <script src=\"https://cdn.tailwindcss.com\"></script>\n</head>\n<body class=\"bg-[#0b0c10] text-[#c5c6c7] min-h-screen p-6 font-sans\">\n  <div class=\"max-w-6xl mx-auto space-y-5\">\n    \n    <!-- Title bar -->\n    <div class=\"border-b border-zinc-850 pb-4 flex justify-between items-center\">\n      <div>\n        <h1 class=\"text-lg font-black tracking-wider text-white uppercase\">STITCH API DESPATCH PLATFORM</h1>\n        <p class=\"text-[10px] text-zinc-500 font-mono uppercase\">Interactive local mock API query tester</p>\n      </div>\n      <div class=\"bg-zinc-900 border border-zinc-800 px-3.5 py-1.5 rounded-lg text-[11px] font-mono\">\n        <span class=\"text-zinc-500\">MOCK SERVER PATH:</span> <span class=\"text-yellow-500\">http://localhost:3000/api/v1/sandbox</span>\n      </div>\n    </div>\n\n    <!-- API Client Body -->\n    <div class=\"grid grid-cols-1 lg:grid-cols-5 gap-5\">\n      <!-- Request configuration panel Left -->\n      <div class=\"lg:col-span-3 bg-[#12131a] border border-zinc-800 p-5 rounded-2xl flex flex-col gap-4\">\n        <h3 class=\"text-xs font-bold font-mono uppercase text-zinc-500 mb-2 pb-1 border-b border-zinc-800/60\">Query Configuration</h3>\n        \n        <!-- Address Bar Row -->\n        <div class=\"flex gap-2.5\">\n          <select id=\"apiMethod\" class=\"bg-[#0b0c10] border border-zinc-800 text-[#38ef7d] text-xs font-bold font-mono rounded-lg px-3 py-2 outline-none\">\n            <option value=\"GET\">GET</option>\n            <option value=\"POST\">POST</option>\n            <option value=\"DELETE\">DELETE</option>\n          </select>\n          <select id=\"apiUrl\" class=\"flex-1 bg-[#0b0c10] border border-zinc-800 text-white text-xs font-mono rounded-lg px-3 py-2 outline-none\">\n            <option value=\"/api/v1/users\">/api/v1/users</option>\n            <option value=\"/api/v1/tasks\">/api/v1/tasks</option>\n            <option value=\"/api/v1/system\">/api/v1/system</option>\n          </select>\n          <button id=\"sendRequestBtn\" class=\"bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold text-xs px-6 rounded-lg transition-all active:scale-95 cursor-pointer uppercase\">Send</button>\n        </div>\n\n        <!-- Custom Request headers grids -->\n        <div class=\"space-y-2\">\n          <label class=\"text-[10px] uppercase font-mono text-zinc-500 font-bold block\">Request Headers</label>\n          <div class=\"grid grid-cols-2 gap-2 text-xs font-mono bg-[#0b0c10] border border-zinc-850 p-3 rounded-xl\">\n            <div><span class=\"text-zinc-500\">Content-Type:</span> <span class=\"text-zinc-300\">application/json</span></div>\n            <div><span class=\"text-zinc-500\">Authorization:</span> <span class=\"text-[#38ef7d]\">Bearer STITCH_MOCK_SECRET</span></div>\n          </div>\n        </div>\n\n        <!-- Request payload body -->\n        <div class=\"space-y-1.5\">\n          <label class=\"text-[10px] uppercase font-mono text-zinc-500 font-bold block\">JSON Request Body (For POST methods)</label>\n          <textarea id=\"requestBody\" rows=\"6\" class=\"w-full bg-[#0b0c10] border border-zinc-800 rounded-lg p-3 text-xs text-[#38ef7d] font-mono focus:border-yellow-500/50 outline-none resize-none leading-relaxed\">{\n  \"name\": \"Jane Doe\",\n  \"role\": \"Systems Lead\"\n}</textarea>\n        </div>\n      </div>\n\n      <!-- JSON Response panel Right -->\n      <div class=\"lg:col-span-2 bg-[#12131a] border border-zinc-800 p-5 rounded-2xl flex flex-col min-h-[380px]\">\n        <div class=\"flex justify-between items-center mb-4 border-b border-zinc-800/60 pb-2.5\">\n          <span class=\"text-xs font-bold font-mono uppercase text-zinc-500\">JSON response console</span>\n          <!-- Metric badge response code -->\n          <div class=\"flex gap-2 items-center text-[10px] font-mono\">\n            <span class=\"text-zinc-500\">Status:</span>\n            <span id=\"responseStatus\" class=\"text-[#38ef7d] font-bold\">200 OK</span>\n            <span class=\"text-zinc-500\">Time:</span>\n            <span id=\"responseTime\" class=\"text-zinc-300\">0ms</span>\n          </div>\n        </div>\n\n        <!-- Code JSON viewer -->\n        <div class=\"flex-1 overflow-auto bg-[#0b0c10] border border-zinc-850 rounded-xl p-4 select-text leading-relaxed text-xs\">\n          <pre id=\"responseBody\" class=\"text-zinc-300 font-mono\">Click 'Send' to dispatch api fetch event...</pre>\n        </div>\n      </div>\n    </div>\n  </div>\n\n  <script src=\"app.js\"></script>\n</body>\n</html>",
    "app.js": "// REST API client playground manager\nconsole.log('⚡ REST API dispatch sandbox configured.');\n\nconst sendRequestBtn = document.getElementById('sendRequestBtn');\nconst apiMethod = document.getElementById('apiMethod');\nconst apiUrl = document.getElementById('apiUrl');\nconst requestBody = document.getElementById('requestBody');\nconst responseStatus = document.getElementById('responseStatus');\nconst responseTime = document.getElementById('responseTime');\nconst responseBody = document.getElementById('responseBody');\n\n// Mock data responses map\nconst database = {\n  users: [\n    { id: 1, name: 'Alice Operator', role: 'Telemetry Specialist', email: 'alice@stitch.vm' },\n    { id: 2, name: 'Bob Constructor', role: 'Diagnostics Engineer', email: 'bob@stitch.vm' }\n  ],\n  tasks: [\n    { id: 101, title: 'Align coordinate telemetry matrices', done: false, severity: 'high' },\n    { id: 102, title: 'Fix CSS scanline positioning rules', done: true, severity: 'low' }\n  ],\n  system: {\n    status: 'healthy',\n    cpu_cores: 8,\n    memory_allocation: '4.18GB / 16GB',\n    region: 'us-west-2a',\n    virtual_network_layer: 'Express reverse-proxy 3000'\n  }\n};\n\nsendRequestBtn.addEventListener('click', () => {\n  const method = apiMethod.value;\n  const path = apiUrl.value;\n  \n  responseBody.textContent = 'Awaiting mock database transaction response...';\n  sendRequestBtn.disabled = true;\n  responseStatus.textContent = 'PENDING...';\n  responseStatus.className = 'text-yellow-400 font-bold font-mono';\n\n  const startTime = Date.now();\n\n  setTimeout(() => {\n    const elapsed = Date.now() - startTime;\n    responseTime.textContent = elapsed + 'ms';\n    sendRequestBtn.disabled = false;\n\n    // Route processor\n    if (path === '/api/v1/users') {\n      if (method === 'GET') {\n        responseStatus.textContent = '200 OK';\n        responseStatus.className = 'text-[#38ef7d] font-bold';\n        responseBody.textContent = JSON.stringify({ success: true, count: database.users.length, data: database.users }, null, 2);\n      } else if (method === 'POST') {\n        try {\n          const body = JSON.parse(requestBody.value);\n          const newUser = { id: database.users.length + 1, ...body };\n          database.users.push(newUser);\n          responseStatus.textContent = '201 Created';\n          responseStatus.className = 'text-blue-400 font-bold';\n          responseBody.textContent = JSON.stringify({ success: true, message: 'User enqueued to database', data: newUser }, null, 2);\n        } catch (e) {\n          responseStatus.textContent = '400 Bad Request';\n          responseStatus.className = 'text-red-400 font-bold';\n          responseBody.textContent = JSON.stringify({ success: false, error: 'Malformed JSON payload' }, null, 2);\n        }\n      } else {\n        responseStatus.textContent = '405 Method Not Allowed';\n        responseStatus.className = 'text-red-400 font-bold';\n        responseBody.textContent = JSON.stringify({ success: false, error: 'Cannot DELETE endpoint /users' }, null, 2);\n      }\n    } else if (path === '/api/v1/tasks') {\n      if (method === 'GET') {\n        responseStatus.textContent = '200 OK';\n        responseStatus.className = 'text-[#38ef7d] font-bold';\n        responseBody.textContent = JSON.stringify({ success: true, data: database.tasks }, null, 2);\n      } else if (method === 'POST') {\n        try {\n          const body = JSON.parse(requestBody.value);\n          const newTask = { id: database.tasks.length + 101, ...body };\n          database.tasks.push(newTask);\n          responseStatus.textContent = '201 Created';\n          responseStatus.className = 'text-blue-400 font-bold';\n          responseBody.textContent = JSON.stringify({ success: true, message: 'Task appended', data: newTask }, null, 2);\n        } catch (e) {\n          responseStatus.textContent = '400 Bad Request';\n          responseStatus.className = 'text-red-400 font-bold';\n          responseBody.textContent = JSON.stringify({ success: false, error: 'Malformed JSON payload' }, null, 2);\n        }\n      } else {\n        database.tasks.pop();\n        responseStatus.textContent = '200 OK';\n        responseStatus.className = 'text-[#38ef7d] font-bold';\n        responseBody.textContent = JSON.stringify({ success: true, message: 'Last task deleted from queue' }, null, 2);\n      }\n    } else { // system info\n      if (method === 'GET') {\n        responseStatus.textContent = '200 OK';\n        responseStatus.className = 'text-[#38ef7d] font-bold';\n        responseBody.textContent = JSON.stringify(database.system, null, 2);\n      } else {\n        responseStatus.textContent = '403 Forbidden';\n        responseStatus.className = 'text-red-400 font-bold';\n        responseBody.textContent = JSON.stringify({ error: 'System config parameters are read-only' }, null, 2);\n      }\n    }\n  }, 400 + Math.random() * 300);\n});",
  }
};
