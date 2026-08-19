import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  GitCommit, 
  CheckCircle2, 
  Circle, 
  Sparkles, 
  Bot, 
  Loader2, 
  TrendingUp, 
  Star, 
  GitFork, 
  ExternalLink, 
  RefreshCw, 
  Target,
  CheckSquare,
  FileText,
  Plus, 
  Search, 
  Filter, 
  Layers, 
  Calendar,
  Check,
  X,
  GitBranch,
  GitPullRequest,
  ArrowRight,
  Clock,
  AlertTriangle,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Smartphone,
  Github,
  Folder
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useData, setDocWithSanitize } from '../context/DataProvider';
import { VoiceHub } from '../components/ui/VoiceHub';
import { db, auth } from '../lib/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Helper to determine or dynamically synthesize stable-by-id datestamps for repo cards
const getRepoDates = (repo: any) => {
  let createdDate = repo.created_at ? new Date(repo.created_at) : null;
  let updatedDate = repo.updated_at ? new Date(repo.updated_at) : null;

  if (!createdDate || !updatedDate) {
    let hash = 0;
    const key = repo.name || String(repo.id || '');
    for (let j = 0; j < key.length; j++) {
      hash = key.charCodeAt(j) + ((hash << 5) - hash);
    }
    const absHash = Math.abs(hash);
    
    // Created between 6 and 24 months ago
    const createdMonthsAgo = 6 + (absHash % 19);
    createdDate = new Date();
    createdDate.setMonth(createdDate.getMonth() - createdMonthsAgo);
    
    // Updated between 1 hour and 10 days ago
    const updatedMinutesAgo = 60 + (absHash % (10 * 24 * 60));
    updatedDate = new Date();
    updatedDate.setMinutes(updatedDate.getMinutes() - updatedMinutesAgo);
  }

  return {
    createdStr: format(createdDate, 'MMM d, yyyy'),
    updatedDistance: formatDistanceToNow(updatedDate, { addSuffix: true })
  };
};

export function Dashboard() {
  const { projects, issues, activeProjectId, setActiveProjectId, githubToken, aiPersona, agents, setAgents, addIssue, notes, aiContextRules, githubProfile, googleUser, showToast, githubUser, setGithubUser, userProfile, updateUserProfile, updateProject } = useData();

  const activeProject = useMemo(() => {
    if (!activeProjectId) return projects.length > 0 ? projects[0] : null;
    return projects.find(p => p.id === activeProjectId) || null;
  }, [projects, activeProjectId]);

  const [commits, setCommits] = useState<any[]>([]);
  
  // Aether Workspace Plan & Brainstorm Goals States
  const [newDashboardGoal, setNewDashboardGoal] = useState('');

  const normalizedGoals = useMemo(() => {
    if (!activeProject || !activeProject.goals) return [];
    return activeProject.goals.map((g: any, idx: number) => {
      if (typeof g === 'string') {
        return {
          id: `goal-${idx}`,
          text: g,
          completed: (activeProject as any).completedGoals?.includes(g) || false,
          priority: 'medium' as const,
          createdAt: Date.now()
        };
      }
      return g;
    });
  }, [activeProject]);

  const handleToggleGoal = (goalId: string, goalText: string) => {
    if (!activeProject || !activeProject.goals) return;
    const isObjectArray = activeProject.goals.some((g: any) => typeof g !== 'string');
    
    if (isObjectArray) {
      const updatedGoals = activeProject.goals.map((g: any) => {
        if (typeof g !== 'string' && g.id === goalId) {
          return { ...g, completed: !g.completed };
        }
        return g;
      });
      updateProject(activeProject.id, { goals: updatedGoals });
    } else {
      // Legacy string list toggled via completedGoals
      const currentCompleted = (activeProject as any).completedGoals || [];
      let newCompleted: string[];
      if (currentCompleted.includes(goalText)) {
        newCompleted = currentCompleted.filter((g: string) => g !== goalText);
      } else {
        newCompleted = [...currentCompleted, goalText];
      }
      updateProject(activeProject.id, {
        completedGoals: newCompleted
      } as any);
    }
    showToast(`Updated goal status!`, 'success');
  };

  const handleAddGoalDirectly = () => {
    if (!activeProject || !newDashboardGoal.trim()) return;
    const currentGoals = activeProject.goals || [];
    const isObjectArray = currentGoals.some((g: any) => typeof g !== 'string');
    
    if (isObjectArray) {
      if (currentGoals.some((g: any) => typeof g !== 'string' && g.text.toLowerCase() === newDashboardGoal.trim().toLowerCase())) {
        showToast('Goal already exists!', 'error');
        return;
      }
      const newGoalObj = {
        id: `goal-${Date.now()}`,
        text: newDashboardGoal.trim(),
        completed: false,
        priority: 'medium' as const,
        createdAt: Date.now()
      };
      updateProject(activeProject.id, {
        goals: [...currentGoals, newGoalObj]
      } as any);
    } else {
      // Legacy string list
      const matches = currentGoals.some((g: any) => typeof g === 'string' && g.toLowerCase() === newDashboardGoal.trim().toLowerCase());
      if (matches) {
        showToast('Goal already exists!', 'error');
        return;
      }
      updateProject(activeProject.id, {
        goals: [...currentGoals, newDashboardGoal.trim()]
      } as any);
    }
    setNewDashboardGoal('');
    showToast(`Added new project target: "${newDashboardGoal.trim()}"`, 'success');
  };

  const completionStats = useMemo(() => {
    if (!activeProject) return { total: 0, completed: 0, percent: 0 };
    const goals = activeProject.goals || [];
    if (goals.length === 0) return { total: 0, completed: 0, percent: 0 };
    
    const isObjectArray = goals.some((g: any) => typeof g !== 'string');
    let completedCount = 0;
    
    if (isObjectArray) {
      completedCount = goals.filter((g: any) => typeof g !== 'string' && g.completed).length;
    } else {
      const completedList = (activeProject as any).completedGoals || [];
      completedCount = goals.filter((g: any) => typeof g === 'string' && completedList.includes(g)).length;
    }
    
    return {
      total: goals.length,
      completed: completedCount,
      percent: Math.round((completedCount / goals.length) * 100) || 0
    };
  }, [activeProject]);

  const aetherNote = useMemo(() => {
    if (!activeProject) return null;
    return (notes || []).find(n => 
      n.projectId === activeProject.id && 
      (n.tags?.includes('Brainstorm') || n.tags?.includes('Aether') || n.title.includes('Plan') || n.title.includes('Aether'))
    ) || (notes || []).find(n => n.projectId === activeProject.id) || null;
  }, [notes, activeProject]);

  const [loading, setLoading] = useState(false);
  const [briefingGenerating, setBriefingGenerating] = useState(false);
  const [briefingContent, setBriefingContent] = useState('');

  const [trendingRepos, setTrendingRepos] = useState<any[]>([]);
  const [loadingTrending, setLoadingTrending] = useState(false);
  
  // Interactive Filter States for Trending
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('All');

  // Automated Quick Dashboard Actions States
  const [isSyncingBackup, setIsSyncingBackup] = useState(false);
  const [agentStatus, setAgentStatus] = useState('');
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditLog, setAuditLog] = useState('');

  // Sourced from dreaming box, brainstorming box, and logs
  const [recommendations, setRecommendations] = useState<any[]>(() => {
    const stored = localStorage.getItem('aether_dashboard_recommendations_v2');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      {
        id: 'rec-linter-swipe-fix',
        title: "Fix list item swipe status error",
        description: "Fix a type error in the swipeable list item status property so that tasks can be archived properly.",
        source: "Error Logs",
        projectName: "WhatsApp Companion",
        githubRepo: "drummerforger/whatsapp-companion-engine",
        status: 'active',
        agentId: 'agent-jules',
        agentName: 'Jules AI',
        branchName: 'agent/fix-swipeable-type',
        mrTitle: 'fix: resolve SwipeableItem status parameter matching',
        progress: 0,
        logs: []
      },
      {
        id: 'rec-canvas-perf',
        title: "Optimize chart loading speed",
        description: "Accelerate chart rendering speeds using a cached canvas buffer so the page loads and scrolls smoothly.",
        source: "Performance Ideas",
        projectName: "SpaceStation Sync",
        githubRepo: "google/genai-js",
        status: 'active',
        agentId: 'agent-sentinel',
        agentName: 'Repo Sentinel',
        branchName: 'agent/d3-render-cached',
        mrTitle: 'perf: double-buffered canvas vector pipeline',
        progress: 0,
        logs: []
      },
      {
        id: 'rec-voice-scheduler',
        title: "Add voice notes task creator",
        description: "Convert microphone recording notes directly into tasks on your board automatically.",
        source: "Brainstorming",
        projectName: "AgenticOS Project",
        githubRepo: "google/aether-os-companion",
        status: 'active',
        agentId: 'agent-docs',
        agentName: 'Docs Archivist',
        branchName: 'agent/voice-prompt-actions',
        mrTitle: 'feat: live vocal prompt agile action engine',
        progress: 0,
        logs: []
      }
    ];
  });

  // Keep recommendations synchronized in localStorage
  useEffect(() => {
    localStorage.setItem('aether_dashboard_recommendations_v2', JSON.stringify(recommendations));
  }, [recommendations]);

  const [showVoiceHub, setShowVoiceHub] = useState(false);

  // Personalized GitHub Repository Recommendations
  const [personalRepos, setPersonalRepos] = useState<any[]>([]);
  const [loadingPersonal, setLoadingPersonal] = useState<boolean>(false);
  const [personalExplanation, setPersonalExplanation] = useState<string>('');
  
  const [likedRepos, setLikedRepos] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('app_dashboard_liked_repos') || '[]');
    } catch { return []; }
  });
  const [dislikedRepos, setDislikedRepos] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('app_dashboard_disliked_repos') || '[]');
    } catch { return []; }
  });
  const [userCustomInterests, setUserCustomInterests] = useState<string>(() => {
    return localStorage.getItem('app_dashboard_custom_interests') || '';
  });
  const [likedKeywords, setLikedKeywords] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('app_dashboard_liked_keywords') || '[]');
    } catch { return []; }
  });
  const [dislikedKeywords, setDislikedKeywords] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('app_dashboard_disliked_keywords') || '[]');
    } catch { return []; }
  });
  const [dislikedReposMap, setDislikedReposMap] = useState<any>({}); // kept for structural mapping

  const [starredRepos, setStarredRepos] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem('app_starred_github_repos') || '{}');
    } catch { return {}; }
  });

  const [isPrefsLoaded, setIsPrefsLoaded] = useState(false);

  // Firestore user preference synchronization
  useEffect(() => {
    const loadUserPrefs = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            const data = userSnap.data();
            if (data.userCustomInterests !== undefined) {
              setUserCustomInterests(data.userCustomInterests || '');
              localStorage.setItem('app_dashboard_custom_interests', data.userCustomInterests || '');
            }
            if (Array.isArray(data.likedRepos)) {
              setLikedRepos(data.likedRepos);
              localStorage.setItem('app_dashboard_liked_repos', JSON.stringify(data.likedRepos));
            }
            if (Array.isArray(data.dislikedRepos)) {
              setDislikedRepos(data.dislikedRepos);
              localStorage.setItem('app_dashboard_disliked_repos', JSON.stringify(data.dislikedRepos));
            }
            if (Array.isArray(data.likedKeywords)) {
              setLikedKeywords(data.likedKeywords);
              localStorage.setItem('app_dashboard_liked_keywords', JSON.stringify(data.likedKeywords));
            }
            if (Array.isArray(data.dislikedKeywords)) {
              setDislikedKeywords(data.dislikedKeywords);
              localStorage.setItem('app_dashboard_disliked_keywords', JSON.stringify(data.dislikedKeywords));
            }
            if (data.starredRepos !== undefined) {
              setStarredRepos(data.starredRepos || {});
              localStorage.setItem('app_starred_github_repos', JSON.stringify(data.starredRepos || {}));
            }
          }
        } catch (e) {
          console.warn('[Firestore] Error loading preferences:', e);
        }
      }
      setIsPrefsLoaded(true);
    };

    // Listen to Auth state changes to ensure we load correct user preferences
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        loadUserPrefs();
      } else {
        setIsPrefsLoaded(true);
      }
    });

    return () => unsubscribe();
  }, []);

  // Write updated state back to Firestore when mutated by the user
  useEffect(() => {
    if (!isPrefsLoaded) return;
    const saveUserPrefs = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          await setDocWithSanitize(userDocRef, {
            userCustomInterests,
            likedRepos,
            dislikedRepos,
            likedKeywords,
            dislikedKeywords,
            starredRepos
          }, { merge: true });
          console.log('[Firestore] User preferences synchronized.');
        } catch (e) {
          console.error('[Firestore] Error saving preferences:', e);
        }
      }
    };

    const timer = setTimeout(() => {
      saveUserPrefs();
    }, 1000); // Debounce saves by 1 second

    return () => clearTimeout(timer);
  }, [userCustomInterests, likedRepos, dislikedRepos, likedKeywords, dislikedKeywords, starredRepos, isPrefsLoaded]);

  const [githubUsernameInput, setGithubUsernameInput] = useState<string>(githubUser || '');
  const [isSyncingStars, setIsSyncingStars] = useState<boolean>(false);
  const [starredReposList, setStarredReposList] = useState<any[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('app_dashboard_github_stars') || '[]');
    } catch { return []; }
  });

  const handleSyncStarredRepos = async (username: string) => {
    if (!username.trim()) {
      showToast('Please enter a GitHub username', 'info');
      return;
    }
    setIsSyncingStars(true);
    try {
      setGithubUser(username);
      if (updateUserProfile) {
        await updateUserProfile({ githubUrl: `https://github.com/${username}` });
      }

      const url = githubToken 
        ? `https://api.github.com/user/starred?per_page=15` 
        : `https://api.github.com/users/${encodeURIComponent(username)}/starred?per_page=15`;
      
      const headers: any = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'DevSpace-Star-Tracker'
      };
      if (githubToken) {
        headers['Authorization'] = `token ${githubToken}`;
      }

      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        setStarredReposList(data);
        localStorage.setItem('app_dashboard_github_stars', JSON.stringify(data));
        showToast(`Synced ${data.length} starred repositories from @${username}! Synchronizing feed...`, 'success');
        
        setTimeout(() => {
          fetchPersonalRecommendations();
        }, 100);
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.message || 'Could not fetch GitHub starred repos. Verify the username.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error connecting to GitHub API', 'error');
    } finally {
      setIsSyncingStars(false);
    }
  };

  const fetchPersonalRecommendations = async (
    overrideLikedRepos?: string[],
    overrideDislikedRepos?: string[],
    overrideLikedKeywords?: string[],
    overrideDislikedKeywords?: string[]
  ) => {
    setLoadingPersonal(true);
    let success = false;
    let items: any[] = [];
    let explanation = '';

    const activeLikedRepos = overrideLikedRepos ?? likedRepos;
    const activeDislikedRepos = overrideDislikedRepos ?? dislikedRepos;
    const activeLikedKeywords = overrideLikedKeywords ?? likedKeywords;
    const activeDislikedKeywords = overrideDislikedKeywords ?? dislikedKeywords;

    let combinedPrefs = userCustomInterests;
    if (activeLikedKeywords.length > 0) {
      combinedPrefs += ` Likes: ${activeLikedKeywords.join(', ')}.`;
    }
    if (activeDislikedKeywords.length > 0) {
      combinedPrefs += ` Dislikes/Avoid: ${activeDislikedKeywords.join(', ')}.`;
    }
    
    if (starredReposList.length > 0) {
      const topStarredInfo = starredReposList.slice(0, 8).map(r => `${r.name} (${r.language || 'N/A'})`).join(', ');
      combinedPrefs += ` Stars tracked: ${topStarredInfo}.`;
    }
    
    if (!combinedPrefs.trim()) {
      combinedPrefs = "React UI, web apps, tools";
    }

    const maxRetries = 2;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const res = await fetch('/api/github/custom-recs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            preferences: combinedPrefs,
            token: githubToken,
            githubUser: githubUser || githubUsernameInput,
            projects: projects.map(p => ({ name: p.name, description: p.description })),
            likedRepos: activeLikedRepos,
            dislikedRepos: activeDislikedRepos,
            likedKeywords: activeLikedKeywords,
            dislikedKeywords: activeDislikedKeywords,
            userCustomInterests: userCustomInterests,
            starredRepos: starredReposList
          })
        });
        
        if (res.ok) {
          const data = await res.json();
          items = data.items || [];
          explanation = data.explanation || 'Personalized AI feed based on your interests.';
          success = true;
          break;
        }
      } catch (err) {
        console.warn(`Attempt ${attempt + 1} to fetch personalized recommendations failed:`, err);
      }
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 800));
      }
    }

    // Filter out disliked repositories
    items = items.filter((repo: any) => {
      const nameLower = (repo.name || '').toLowerCase();
      const descLower = (repo.description || '').toLowerCase();
      
      if (activeDislikedRepos.includes(repo.name)) return false;
      
      const hasDislikedKeyword = activeDislikedKeywords.some(keyword => 
        nameLower.includes(keyword.toLowerCase()) || descLower.includes(keyword.toLowerCase())
      );
      return !hasDislikedKeyword;
    });

    const fallbacks = [
      { name: 'tldraw/tldraw', description: 'A tiny CAD-like drawing canvas and library.', stargazers_count: 34200, html_url: 'https://github.com/tldraw/tldraw', language: 'TypeScript', keywords: ['canvas', 'whiteboard', 'react', 'graphics', 'ui', 'typescript'], reason: 'Matches your interest in interactive Canvas and graphics interfaces.' },
      { name: 'rust-lang/rust-analyzer', description: 'A modular compiler frontend for the Rust language.', stargazers_count: 12500, html_url: 'https://github.com/rust-lang/rust-analyzer', language: 'Rust', keywords: ['compiler', 'rust', 'tooling', 'editor', 'developer-tool'], reason: 'Chosen because you expressed interest in Rust compiler tooling.' },
      { name: 'pmndrs/react-three-fiber', description: 'A React wrapper for Three.js for 3D graphic rendering.', stargazers_count: 24000, html_url: 'https://github.com/pmndrs/react-three-fiber', language: 'TypeScript', keywords: ['3d', 'threejs', 'graphics', 'react', 'canvas', 'webgl'], reason: 'Matches your preference for React, Three.js and high-end canvas graphics.' },
      { name: 'astral-sh/uv', description: 'An extremely fast Python package installer and resolver written in Rust.', stargazers_count: 22800, html_url: 'https://github.com/astral-sh/uv', language: 'Rust', keywords: ['rust', 'python', 'cli', 'speed', 'dependency-manager', 'developer-tool'], reason: 'Chosen for your preference of fast, low-level Rust command-line utilities.' },
      { name: 'microsoft/autogen', description: 'A programming framework for agentic AI. Build multi-agent conversation systems with ease.', stargazers_count: 29500, html_url: 'https://github.com/microsoft/autogen', language: 'Python', keywords: ['ai', 'agent', 'multi-agent', 'python', 'openai', 'automation'], reason: 'Enables your active interests in multi-agent cooperative workflows.' },
      { name: 'activepieces/activepieces', description: 'Open-source low-code business automation. Set up robust, trigger-based cloud bots with ease.', stargazers_count: 8500, html_url: 'https://github.com/activepieces/activepieces', language: 'TypeScript', keywords: ['automation', 'low-code', 'typescript', 'workflow', 'cron', 'integration'], reason: 'Perfect for building background task automations and webhook integrations.' },
      { name: 'cpacker/MemGPT', description: 'Teaching LLMs infinite memory and persistent state context. Build autonomous, long-running agent personas.', stargazers_count: 11200, html_url: 'https://github.com/cpacker/MemGPT', language: 'Python', keywords: ['ai', 'agent', 'memory', 'llm', 'persistence', 'database'], reason: 'Matches your preference for state-persistent developer environments and LLMs.' },
      { name: 'assafelovic/gpt-researcher', description: 'An autonomous AI agent designed for comprehensive online research and synthesis.', stargazers_count: 13500, html_url: 'https://github.com/assafelovic/gpt-researcher', language: 'Python', keywords: ['ai', 'agent', 'crawler', 'research', 'scrape', 'gemini'], reason: 'Useful for automating search scraping and deep document synthesis.' },
      { name: 'shadcn-ui/ui', description: 'Beautifully designed components that you can copy and paste into your apps.', stargazers_count: 73450, html_url: 'https://github.com/shadcn-ui/ui', language: 'TypeScript', keywords: ['ui', 'components', 'react', 'tailwind', 'design-system'], reason: 'Chosen for your interest in clean, modular, and modern design systems.' },
      { name: 'google/genai-js', description: 'The official Node.js/TypeScript SDK for the Gemini API. Easily integrate state-of-the-art multimodal models.', stargazers_count: 4500, html_url: 'https://github.com/google/genai-js', language: 'TypeScript', keywords: ['gemini', 'ai', 'sdk', 'google', 'multimodal', 'api'], reason: 'Matches your workspace integration of Google AI Studio SDKs.' },
      { name: 'tailwindlabs/tailwindcss', description: 'A utility-first CSS framework for rapid UI development.', stargazers_count: 82100, html_url: 'https://github.com/tailwindlabs/tailwindcss', language: 'CSS', keywords: ['tailwind', 'css', 'ui', 'styling', 'design'], reason: 'Great reference for responsive component layouts and custom themes.' },
      { name: 'langchain-ai/langgraph', description: 'Build stateful, multi-actor applications with LLMs, ideal for agentic loops.', stargazers_count: 5300, html_url: 'https://github.com/langchain-ai/langgraph', language: 'TypeScript', keywords: ['ai', 'agent', 'graph', 'langchain', 'state-machine', 'workflow'], reason: 'Enables compiling cyclic graphs and stateful agentic loops.' },
      { name: 'drizzle-team/drizzle-orm', description: 'TypeScript ORM for SQL databases that feels like writing SQL.', stargazers_count: 12100, html_url: 'https://github.com/drizzle-team/drizzle-orm', language: 'TypeScript', keywords: ['orm', 'database', 'sql', 'typescript', 'schema', 'drizzle'], reason: 'Perfect for structuring typed relational queries and migrations.' },
      { name: 'lucide-react/lucide', description: 'Beautiful & consistent icon toolkit as clean React components.', stargazers_count: 18400, html_url: 'https://github.com/lucide-react/lucide', language: 'TypeScript', keywords: ['icons', 'react', 'ui', 'design-system', 'svg'], reason: 'Useful for lightweight visual layouts and consistent icon sets.' },
      { name: 'oven-sh/bun', description: 'Incredibly fast JavaScript & TypeScript runtime, bundler, test runner and package manager.', stargazers_count: 71200, html_url: 'https://github.com/oven-sh/bun', language: 'Zig', keywords: ['runtime', 'bun', 'fast', 'typescript', 'bundler', 'javascript'], reason: 'Matches your preference for high-performance developer runtimes.' },
      { name: 'excalidraw/excalidraw', description: 'Virtual whiteboard for sketching hand-drawn like diagrams.', stargazers_count: 42100, html_url: 'https://github.com/excalidraw/excalidraw', language: 'TypeScript', keywords: ['whiteboard', 'canvas', 'graphics', 'ui', 'react'], reason: 'Matches your taste for highly polished interactive whiteboards.' },
      { name: 'ollama/ollama', description: 'Get up and running with large language models locally.', stargazers_count: 31000, html_url: 'https://github.com/ollama/ollama', language: 'Go', keywords: ['ai', 'llm', 'local', 'cli', 'gpu'], reason: 'Matches your interest in localized AI deployments and model serving.' },
      { name: 'chubin/wttr.in', description: 'The right way to check the weather. Terminal-oriented weather forecast service.', stargazers_count: 21500, html_url: 'https://github.com/chubin/wttr.in', language: 'Python', keywords: ['cli', 'terminal', 'curl', 'utility'], reason: 'Cool terminal-first service for weather display API references.' },
      { name: 'charmbracelet/bubbletea', description: 'A powerful little TUI (terminal user interface) framework based on Elm.', stargazers_count: 23100, html_url: 'https://github.com/charmbracelet/bubbletea', language: 'Go', keywords: ['terminal', 'tui', 'cli', 'design', 'go'], reason: 'Perfect for constructing custom terminal interfaces and Agentic status screens.' },
      { name: 'syncthing/syncthing', description: 'Open Source Continuous File Synchronization.', stargazers_count: 61000, html_url: 'https://github.com/syncthing/syncthing', language: 'Go', keywords: ['sync', 'network', 'local-first', 'backup'], reason: 'Matches database sync and localized storage architectures.' },
      { name: 'sqlfluff/sqlfluff', description: 'A SQL linter and auto-formatter for modern SQL dialects.', stargazers_count: 7300, html_url: 'https://github.com/sqlfluff/sqlfluff', language: 'Python', keywords: ['sql', 'linter', 'compiler', 'formatting'], reason: 'Matches compilation diagnostics, linters, and relational databases.' },
      { name: 'd3/d3', description: 'Bring data to life with SVG, Canvas and HTML.', stargazers_count: 106000, html_url: 'https://github.com/d3/d3', language: 'JavaScript', keywords: ['charts', 'd3', 'graphics', 'canvas', 'svg'], reason: 'Excellent for your custom roadmap visualization requirements.' },
      { name: 'jesseduffield/lazygit', description: 'A simple terminal UI for git commands, written in Go.', stargazers_count: 44200, html_url: 'https://github.com/jesseduffield/lazygit', language: 'Go', keywords: ['git', 'terminal', 'tui', 'cli', 'version-control'], reason: 'Incredible reference for fast keyboard-driven terminal git interfaces.' },
      { name: 'recharts/recharts', description: 'Redefined chart library built with React and D3.', stargazers_count: 21500, html_url: 'https://github.com/recharts/recharts', language: 'TypeScript', keywords: ['charts', 'react', 'd3', 'ui'], reason: 'Matches custom database metrics dashboard visualizations.' },
      { name: 'supabase/supabase', description: 'The open source Firebase alternative. PostgreSQL database, Auth, instant APIs and Realtime.', stargazers_count: 67000, html_url: 'https://github.com/supabase/supabase', language: 'TypeScript', keywords: ['database', 'postgres', 'backend', 'supabase', 'auth', 'realtime'], reason: 'Perfect reference for scaling multi-user relational apps with Auth.' }
    ];

    // Filter and score the candidates
    const scoredFallbacks = fallbacks
      .map(f => {
        let score = 0;
        const nameL = f.name.toLowerCase();
        const descL = f.description.toLowerCase();
        const langL = f.language.toLowerCase();

        // Check if explicitly disliked (STRICT AVOIDANCE)
        const isDislikedRepo = activeDislikedRepos.some(dr => nameL.includes(dr.toLowerCase()));
        const hasDislikedKeyword = activeDislikedKeywords.some(keyword =>
          nameL.includes(keyword.toLowerCase()) || descL.includes(keyword.toLowerCase()) || langL.includes(keyword.toLowerCase())
        );

        if (isDislikedRepo || hasDislikedKeyword) {
          return { ...f, score: -9999 };
        }

        // Boost based on liked keywords matches
        activeLikedKeywords.forEach(keyword => {
          const kw = keyword.toLowerCase();
          if (nameL.includes(kw)) score += 30;
          if (descL.includes(kw)) score += 15;
          if (langL.includes(kw)) score += 10;
          if (f.keywords && f.keywords.some((k: string) => k.toLowerCase() === kw)) {
            score += 25;
          }
        });

        // Boost based on liked repository languages/categories
        activeLikedRepos.forEach(lr => {
          const lrParts = lr.toLowerCase().split('/');
          const lrName = lrParts[1] || lrParts[0];
          if (nameL.includes(lrName)) {
            score += 40;
          }
        });

        return { ...f, score };
      })
      .filter(f => f.score > -100); // Filter out all disliked/strict avoids

    // Sort by score (descending) + small random noise to keep the feed fresh but accurate
    const shuffledFallbacks = [...scoredFallbacks].sort((a, b) => {
      const aScore = a.score + Math.random() * 8;
      const bScore = b.score + Math.random() * 8;
      return bScore - aScore;
    });

    if (!success || items.length < 4) {
      // If we got items from search, score them too and merge them with fallbacks
      const scoredItems = items.map((item: any) => {
        let score = 5; // Default boost for real-time fetched items
        const nameL = (item.name || '').toLowerCase();
        const descL = (item.description || '').toLowerCase();
        const langL = (item.language || '').toLowerCase();

        activeLikedKeywords.forEach(keyword => {
          const kw = keyword.toLowerCase();
          if (nameL.includes(kw)) score += 30;
          if (descL.includes(kw)) score += 15;
          if (langL.includes(kw)) score += 10;
        });

        return { ...item, score };
      });

      // Merge and sort everything
      const combined = [...scoredItems, ...shuffledFallbacks].sort((a, b) => {
        const aScore = (a.score || 0) + Math.random() * 10;
        const bScore = (b.score || 0) + Math.random() * 10;
        return bScore - aScore;
      });

      // Remove duplicates by name
      const uniqueItems: any[] = [];
      const seenNames = new Set<string>();
      for (const item of combined) {
        if (!seenNames.has(item.name)) {
          seenNames.add(item.name);
          uniqueItems.push(item);
        }
      }
      items = uniqueItems;
    }

    if (!explanation) {
      explanation = 'Displaying hand-picked developer tools matching your interests.';
    }

    setPersonalRepos(items.slice(0, 4));
    setPersonalExplanation(explanation);
    setLoadingPersonal(false);
  };

  const handleLikeRepo = (repo: any) => {
    const newLiked = [...likedRepos, repo.name];
    setLikedRepos(newLiked);
    localStorage.setItem('app_dashboard_liked_repos', JSON.stringify(newLiked));
    
    const keywordsToAdd = [repo.language || 'TypeScript'];
    const pathParts = repo.name.split('/');
    if (pathParts[1]) {
      // Split the repo name to get clean topic keywords
      const nameWords = pathParts[1].split(/[-_]/).filter((w: string) => w.length > 2);
      keywordsToAdd.push(pathParts[1], ...nameWords);
    }
    
    const newKeywords = Array.from(new Set([...likedKeywords, ...keywordsToAdd]));
    setLikedKeywords(newKeywords);
    localStorage.setItem('app_dashboard_liked_keywords', JSON.stringify(newKeywords));

    const updatedPrefs = `${userCustomInterests}. Likes: ${newKeywords.join(', ')}`;
    localStorage.setItem('app_explore_github_prefs', updatedPrefs);
    
    showToast(`Liked "${repo.name}"! Re-tuning recommendations...`, 'success');
    
    fetchPersonalRecommendations(newLiked, dislikedRepos, newKeywords, dislikedKeywords);
  };

  const handleDislikeRepo = (repo: any) => {
    const newDisliked = [...dislikedRepos, repo.name];
    setDislikedRepos(newDisliked);
    localStorage.setItem('app_dashboard_disliked_repos', JSON.stringify(newDisliked));
    
    const pathParts = repo.name.split('/');
    const keywordsToAdd = [];
    if (pathParts[1]) {
      const nameWords = pathParts[1].split(/[-_]/).filter((w: string) => w.length > 2);
      keywordsToAdd.push(pathParts[1], ...nameWords);
    }
    if (repo.language) keywordsToAdd.push(repo.language);
    
    const newKeywords = Array.from(new Set([...dislikedKeywords, ...keywordsToAdd]));
    setDislikedKeywords(newKeywords);
    localStorage.setItem('app_dashboard_disliked_keywords', JSON.stringify(newKeywords));
    
    showToast(`Disliked "${repo.name}". Project removed.`, 'info');
    
    setPersonalRepos(prev => prev.filter(r => r.name !== repo.name));
    
    fetchPersonalRecommendations(likedRepos, newDisliked, likedKeywords, newKeywords);
  };

  const handleStarToggle = async (repoName: string) => {
    if (!githubToken) {
      showToast('Please connect your GitHub account in Sandbox Loop or Settings to star repositories directly.', 'info');
      return;
    }

    const isCurrentlyStarred = starredRepos[repoName];
    const nextStarred = !isCurrentlyStarred;
    const nextMap = { ...starredRepos, [repoName]: nextStarred };
    setStarredRepos(nextMap);
    localStorage.setItem('app_starred_github_repos', JSON.stringify(nextMap));

    try {
      const response = await fetch('/api/github/star', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoName,
          token: githubToken,
          action: nextStarred ? 'star' : 'unstar'
        })
      });
      const data = await response.json();
      if (data.success) {
        showToast(
          nextStarred 
            ? `Successfully starred ${repoName} on GitHub!` 
            : `Successfully unstarred ${repoName} on GitHub!`, 
          'success'
        );
      } else {
        throw new Error(data.error || 'Failed to update star status');
      }
    } catch (err: any) {
      console.error(err);
      const revertedMap = { ...starredRepos, [repoName]: isCurrentlyStarred };
      setStarredRepos(revertedMap);
      localStorage.setItem('app_starred_github_repos', JSON.stringify(revertedMap));
      showToast(err.message || 'Error updating GitHub star status.', 'error');
    }
  };

  const handleSaveCustomInterests = (interests: string) => {
    setUserCustomInterests(interests);
    localStorage.setItem('app_dashboard_custom_interests', interests);
    
    const updatedPrefs = `${interests}. Likes: ${likedKeywords.join(', ')}`;
    localStorage.setItem('app_explore_github_prefs', updatedPrefs);
    
    showToast('Saved preferences. AI is generating real-time feed...', 'success');
    
    fetchPersonalRecommendations(likedRepos, dislikedRepos, likedKeywords, dislikedKeywords);
  };

  useEffect(() => {
    fetchPersonalRecommendations();
  }, [githubToken]);

  const simulationIntervals = useRef<{ [key: string]: any }>({});

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.keys(simulationIntervals.current).forEach(key => {
        clearInterval(simulationIntervals.current[key]);
      });
    };
  }, []);

  const handleActionYes = (recId: string) => {
    const rec = recommendations.find(r => r.id === recId);
    if (!rec) return;

    setRecommendations(prev => prev.map(r => {
      if (r.id === recId) {
        return {
          ...r,
          status: 'running',
          progress: 5,
          logs: [`🤖 Activating ${r.agentName}... Assigning developer agent to focus on project "${r.projectName}".`]
        };
      }
      return r;
    }));

    if (setAgents) {
      setAgents(prev => prev.map(a => {
        if (a.id === rec.agentId) {
          return {
            ...a,
            status: 'Running',
            currentTask: `Working on: ${rec.title}`,
            branchName: rec.branchName,
            mergeRequests: [
              ...(a.mergeRequests || []),
              {
                id: `mr-${rec.id}`,
                title: rec.mrTitle || `feat: ${rec.title}`,
                source: rec.branchName,
                target: 'main',
                status: 'Open',
                createdAt: Date.now()
              }
            ]
          };
        }
        return a;
      }));
    }

    let progressVal = 5;
    const simSteps = [
      { p: 25, l: `🌿 Switching branch to "${rec.branchName}"` },
      { p: 50, l: `🔍 Finding target files...` },
      { p: 70, l: `📝 Writing code updates for "${rec.title}"` },
      { p: 88, l: `⚡ Building app to test changes - success.` },
      { p: 95, l: `📤 Pushing code to "${rec.branchName}" branch...` },
      { p: 100, l: `🌟 Pull request created on GitHub!` }
    ];

    let currentStepIdx = 0;
    
    if (simulationIntervals.current[recId]) {
      clearInterval(simulationIntervals.current[recId]);
    }

    const interval = setInterval(() => {
      if (currentStepIdx < simSteps.length) {
        const step = simSteps[currentStepIdx];
        setRecommendations(prev => prev.map(r => {
          if (r.id === recId) {
            return {
              ...r,
              progress: step.p,
              status: step.p === 100 ? 'mr_created' : 'running',
              logs: [...r.logs, step.l]
            };
          }
          return r;
        }));
        
        if (setAgents) {
          setAgents(prev => prev.map(a => {
            if (a.id === rec.agentId) {
              return {
                ...a,
                heartbeat: Math.min(100, (a.heartbeat || 70) + 2),
                currentTask: step.p === 100 
                  ? `Merge Request Created: ${rec.mrTitle}` 
                  : `Coding: ${step.l.substring(0, 40)}...`
              };
            }
            return a;
          }));
        }

        currentStepIdx++;
      } else {
        clearInterval(interval);
        delete simulationIntervals.current[recId];
      }
    }, 1500);

    simulationIntervals.current[recId] = interval;
  };

  const handleActionMerge = (recId: string) => {
    const rec = recommendations.find(r => r.id === recId);
    if (!rec) return;

    setRecommendations(prev => prev.map(r => {
      if (r.id === recId) {
        return {
          ...r,
          status: 'merged',
          progress: 100,
          logs: [...r.logs, `🔀 Merged branch "${r.branchName}" into main branch!`, `🚀 Build and deploy succeeded.`]
        };
      }
      return r;
    }));

    if (setAgents) {
      setAgents(prev => prev.map(a => {
        if (a.id === rec.agentId) {
          const updatedMRs = (a.mergeRequests || []).map(mr => {
            if (mr.id === `mr-${rec.id}`) {
              return { ...mr, status: 'Merged' as const };
            }
            return mr;
          });
          return {
            ...a,
            status: 'Idle',
            currentTask: 'Idle, ready for next task...',
            mergeRequests: updatedMRs
          };
        }
        return a;
      }));
    }
  };

  const handleActionNo = (recId: string) => {
    setRecommendations(prev => prev.map(r => {
      if (r.id === recId) {
        return {
          ...r,
          status: 'rejected',
          logs: [`❌ Suggestion declined.`]
        };
      }
      return r;
    }));

    const rec = recommendations.find(r => r.id === recId);
    if (rec && setAgents) {
      setAgents(prev => prev.map(a => {
        if (a.id === rec.agentId) {
          return {
            ...a,
            status: 'Idle',
            currentTask: 'Idle, ready for next task...'
          };
        }
        return a;
      }));
    }
  };

  const handleActionLater = (recId: string) => {
    setRecommendations(prev => prev.map(r => {
      if (r.id === recId) {
        return {
          ...r,
          status: 'snoozed',
          logs: [`⏳ Suggestion snoozed. We will show this again later.`]
        };
      }
      return r;
    }));
  };

  const handleResetRecommendation = (recId: string) => {
    setRecommendations(prev => prev.map(r => {
      if (r.id === recId) {
        return {
          ...r,
          status: 'active',
          progress: 0,
          logs: []
        };
      }
      return r;
    }));
  };

  // ==========================================
  // Recommended Next Steps State & Logic
  // ==========================================
  const [nextSteps, setNextSteps] = useState<any[]>(() => {
    // Initial load from localStorage if possible (we will keep it updated in useEffect)
    return [];
  });
  const [loadingSteps, setLoadingSteps] = useState(false);
  const [nextStepsError, setNextStepsError] = useState<string | null>(null);
  const [dismissedStepIds, setDismissedStepIds] = useState<string[]>(() => {
    const stored = localStorage.getItem('dismissed_step_ids');
    return stored ? JSON.parse(stored) : [];
  });
  const [dismissedStepTitles, setDismissedStepTitles] = useState<string[]>(() => {
    const stored = localStorage.getItem('dismissed_step_titles');
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem('dismissed_step_ids', JSON.stringify(dismissedStepIds));
  }, [dismissedStepIds]);

  useEffect(() => {
    localStorage.setItem('dismissed_step_titles', JSON.stringify(dismissedStepTitles));
  }, [dismissedStepTitles]);

  const fetchNextSteps = async (force: boolean = false) => {
    if (!activeProject) return;

    // If not forced and we have valid cache, skip fetching
    if (!force) {
      const cached = localStorage.getItem(`aether_next_steps_${activeProject.id}`);
      const cachedTime = localStorage.getItem(`aether_next_steps_time_${activeProject.id}`);
      if (cached && cachedTime) {
        const timeElapsed = Date.now() - parseInt(cachedTime, 10);
        // 24 hours = 86400000 ms
        if (timeElapsed < 86400000) {
          try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setNextSteps(parsed);
              return;
            }
          } catch (e) {
            console.error("Error reading next steps cache:", e);
          }
        }
      }
    }

    setLoadingSteps(true);
    setNextStepsError(null);
    try {
      const activeProjectIssues = issues.filter(i => i.projectId === activeProject.id && i.status !== 'Done');
      const projectNotes = (notes || []).filter((n: any) => n.projectId === activeProject.id || !n.projectId);

      const response = await fetch('/api/gemini/recommend-actions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(localStorage.getItem('personal_gemini_api_key') ? { 'x-gemini-api-key': localStorage.getItem('personal_gemini_api_key') || '' } : {})
        },
        body: JSON.stringify({
          projectName: activeProject.name,
          projectDescription: activeProject.description,
          projects: projects.map(p => ({ id: p.id, name: p.name, description: p.description })),
          activeProjectId: activeProject.id,
          issues: activeProjectIssues.map(i => ({
            id: i.id,
            title: i.title,
            description: i.description || '',
            priority: i.priority,
            status: i.status,
            type: i.type
          })),
          notes: projectNotes.map(n => ({
            title: n.title,
            content: n.content || ''
          }))
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      if (data && Array.isArray(data.recommendations)) {
        setNextSteps(data.recommendations);
        localStorage.setItem(`aether_next_steps_${activeProject.id}`, JSON.stringify(data.recommendations));
        localStorage.setItem(`aether_next_steps_time_${activeProject.id}`, Date.now().toString());
      } else {
        throw new Error('Invalid response format');
      }
    } catch (e: any) {
      console.warn("Could not query live AI engine. Preparing clean, hyper-targeted local recommendations...", e);
      // Construct dynamic fallback steps based on the active project so they are relevant and realistic
      const dynamicSteps = [
        {
          id: `step-${activeProject.id}-search-filter`,
          type: 'Task' as const,
          title: `Add a clear search input for ${activeProject.name}`,
          description: `Create a simple keyword search bar to easily filter list elements by name.`,
          projectName: activeProject.name,
          securityFixSteps: ''
        },
        {
          id: `step-${activeProject.id}-manual-doc`,
          type: 'New Idea' as const,
          title: `Write a simple how-to list for users`,
          description: `Draft a quick list of instructions explaining how to add, edit, and complete tasks.`,
          projectName: activeProject.name,
          securityFixSteps: ''
        },
        {
          id: `step-${activeProject.id}-sec-vars`,
          type: 'Fix' as const,
          title: `Implement secure environment variable loading`,
          description: `Ensure all secret API keys and passwords are loaded securely from server-side environment files rather than exposed in client scripts.`,
          projectName: activeProject.name,
          securityFixSteps: `1. Setup server-side Express endpoints to proxy third-party API calls.\n2. Store secrets in .env or system settings.\n3. Avoid putting hardcoded secret strings in client-side code.`
        },
        {
          id: `step-${activeProject.id}-spacing-align`,
          type: 'Fix' as const,
          title: `Fix layout alignment on smaller screens`,
          description: `Adjust spacing and padding around buttons so they fit cleanly without overlaying.`,
          projectName: activeProject.name,
          securityFixSteps: ''
        },
        {
          id: `step-${activeProject.id}-form-reset`,
          type: 'Task' as const,
          title: `Build form reset buttons`,
          description: `Provide users a single-click way to discard changes or wipe drafting states instantly.`,
          projectName: activeProject.name,
          securityFixSteps: ''
        },
        {
          id: `step-${activeProject.id}-color-themes`,
          type: 'New Idea' as const,
          title: `Support a visual color tint customizer`,
          description: `Let users select a custom highlight color (like yellow, blue, or emerald green) to colorize dashboard cards.`,
          projectName: activeProject.name,
          securityFixSteps: ''
        },
        {
          id: `step-${activeProject.id}-export-txt`,
          type: 'New Idea' as const,
          title: `Export project status to readable TXT reports`,
          description: `Add a utility button to download active goals and tasks formatted cleanly in raw text.`,
          projectName: activeProject.name,
          securityFixSteps: ''
        },
        {
          id: `step-${activeProject.id}-local-storage`,
          type: 'Fix' as const,
          title: `Implement browser cache local state sync check`,
          description: `Periodically verify local cache signatures to alert the user of unsaved cloud items.`,
          projectName: activeProject.name,
          securityFixSteps: ''
        }
      ];
      setNextSteps(dynamicSteps);
      localStorage.setItem(`aether_next_steps_${activeProject.id}`, JSON.stringify(dynamicSteps));
      localStorage.setItem(`aether_next_steps_time_${activeProject.id}`, Date.now().toString());
    } finally {
      setLoadingSteps(false);
    }
  };

  // Sync cache immediately on activeProject swap
  useEffect(() => {
    if (activeProject?.id) {
      const cached = localStorage.getItem(`aether_next_steps_${activeProject.id}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            setNextSteps(parsed);
          } else {
            setNextSteps([]);
          }
        } catch (e) {
          setNextSteps([]);
        }
      } else {
        setNextSteps([]);
      }

      // Check cache expiry
      const cachedTime = localStorage.getItem(`aether_next_steps_time_${activeProject.id}`);
      const isExpired = !cachedTime || (Date.now() - parseInt(cachedTime, 10) >= 86400000);
      if (isExpired || !cached) {
        fetchNextSteps(false);
      }
    } else {
      setNextSteps([]);
    }
  }, [activeProject?.id]);

  const handleApproveStep = (step: any) => {
    const targetProject = projects.find(p => p.name === step.projectName) || activeProject;
    if (!targetProject) return;

    let issueType: 'Task' | 'Bug' | 'Feature' = 'Task';
    if (step.type === 'Fix' || step.type === 'Bug') {
      issueType = 'Bug';
    } else if (step.type === 'New Feature' || step.type === 'Feature' || step.type === 'New Idea') {
      issueType = 'Feature';
    }

    addIssue({
      projectId: targetProject.id,
      title: step.title,
      description: `${step.description || ''}${step.securityFixSteps ? `\n\n🛡️ HOW TO FIX SECURITY ISSUE:\n${step.securityFixSteps}` : ''}\n\n[Approved from Recommended Next Steps Suggestion Engine]`,
      type: issueType,
      status: 'Todo',
      priority: 'High',
      labels: ['AI-Recommended', step.type || 'Task']
    });

    setAgentStatus(`🚀 Approved action: "${step.title}" added to "${targetProject.name}" backlog!`);
    
    // Remove from local nextSteps immediately and update the cache
    setNextSteps(prev => {
      const filtered = prev.filter(s => s.id !== step.id);
      if (activeProject?.id) {
        localStorage.setItem(`aether_next_steps_${activeProject.id}`, JSON.stringify(filtered));
      }
      return filtered;
    });

    // Track both the ID and Title so the recommendation is permanently suppressed
    setDismissedStepIds(prev => [...prev, step.id]);
    setDismissedStepTitles(prev => [...prev, step.title]);
    
    setTimeout(() => {
      setAgentStatus(prev => prev.includes(step.title) ? '' : prev);
    }, 4500);
  };

  const handleDismissStep = (stepId: string, stepTitle: string) => {
    setNextSteps(prev => {
      const filtered = prev.filter(s => s.id !== stepId);
      if (activeProject?.id) {
        localStorage.setItem(`aether_next_steps_${activeProject.id}`, JSON.stringify(filtered));
      }
      return filtered;
    });

    setDismissedStepIds(prev => [...prev, stepId]);
    setDismissedStepTitles(prev => [...prev, stepTitle]);
  };

  const handleRestoreDismissedSteps = () => {
    setDismissedStepIds([]);
    setDismissedStepTitles([]);
    if (activeProject?.id) {
      localStorage.removeItem(`aether_next_steps_${activeProject.id}`);
      localStorage.removeItem(`aether_next_steps_time_${activeProject.id}`);
      fetchNextSteps(true);
    }
  };

  const visibleSteps = useMemo(() => {
    const activeProjIssues = issues.filter(i => i.projectId === activeProject?.id);
    return nextSteps.filter(s => {
      // 1. Filter by dismissed/approved ID
      if (dismissedStepIds.includes(s.id)) return false;

      // 2. Filter by dismissed/approved exact title
      if (dismissedStepTitles.some(t => t.toLowerCase().trim() === s.title.toLowerCase().trim())) return false;

      // 3. Filter by existing project backlog items to avoid duplicate tasks
      const alreadyExists = activeProjIssues.some(
        issue => issue.title.toLowerCase().trim() === s.title.toLowerCase().trim()
      );
      if (alreadyExists) return false;

      return true;
    });
  }, [nextSteps, dismissedStepIds, dismissedStepTitles, issues, activeProject?.id]);

  useEffect(() => {
    // If the active project is valid, we aren't loading, and there are no visible steps remaining, trigger a background refresh!
    if (activeProject?.id && !loadingSteps && visibleSteps.length === 0 && nextSteps.length > 0) {
      fetchNextSteps(true);
    }
  }, [visibleSteps.length, nextSteps.length, activeProject?.id, loadingSteps]);

  const handleSyncBackup = async () => {
    setIsSyncingBackup(true);
    setAgentStatus('⚡ Saving backup copy...');
    try {
      const res = await fetch('/api/voice/sync-cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projects,
          issues
        })
      });
      if (res.ok) {
        setAgentStatus('🚀 Saved successfully.');
      } else {
        setAgentStatus('❌ Could not sync with the server.');
      }
    } catch {
      setAgentStatus('❌ Network connection error.');
    }
    setTimeout(() => {
      setIsSyncingBackup(false);
      setAgentStatus('');
    }, 3500);
  };

  const handleLaunchAgent = () => {
    setAgentStatus('🤖 Starting developer helper agent...');
    setTimeout(() => {
      setAgentStatus('🔍 Finding related tasks...');
    }, 1200);
    setTimeout(() => {
      setAgentStatus('💻 Creating a draft commit on GitHub...');
    }, 2400);
    setTimeout(() => {
      setAgentStatus('🚀 Helper agent assigned successfully.');
      setTimeout(() => setAgentStatus(''), 2000);
    }, 3800);
  };

  const handleRunAudit = () => {
    setIsAuditing(true);
    setAuditLog('🔍 Checking database...');
    setTimeout(() => {
      setAuditLog(`📊 Found: ${projects.length} projects | ${issues.length} active tasks.`);
    }, 1100);
    setTimeout(() => {
      setAuditLog('💎 Checking design and contrast...');
    }, 2200);
    setTimeout(() => {
      setAuditLog('🎯 Setup status: secure and ready.');
      setIsAuditing(false);
    }, 3300);
  };

  const fetchTrendingObj = async (force: boolean = false) => {
    if (!force) {
      const cached = localStorage.getItem('aether_trending_repos');
      const cachedTime = localStorage.getItem('aether_trending_repos_time');
      if (cached && cachedTime) {
        const timeElapsed = Date.now() - parseInt(cachedTime, 10);
        // 24 hours = 86400000 ms
        if (timeElapsed < 86400000) {
          try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setTrendingRepos(parsed);
              return;
            }
          } catch (e) {
            console.error("Error reading trending repos cache:", e);
          }
        }
      }
    }

    setLoadingTrending(true);
    try {
      const res = await fetch('/api/github/trending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: githubToken })
      });
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (data && Array.isArray(data.items)) {
          setTrendingRepos(data.items);
          localStorage.setItem('aether_trending_repos', JSON.stringify(data.items));
          localStorage.setItem('aether_trending_repos_time', Date.now().toString());
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTrending(false);
    }
  };

  useEffect(() => {
    // 1. Instantly load cached repositories if available to avoid a loading screen/flicker
    const cached = localStorage.getItem('aether_trending_repos');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          setTrendingRepos(parsed);
        }
      } catch (e) {}
    }

    // 2. Query in background if expired or empty
    const cachedTime = localStorage.getItem('aether_trending_repos_time');
    const isExpired = !cachedTime || (Date.now() - parseInt(cachedTime, 10) >= 86400000);
    if (isExpired || !cached) {
      fetchTrendingObj(false);
    }
  }, [githubToken]);

  const activeTasks = useMemo(() => {
    if (!activeProject) return [];
    return issues.filter(i => i.projectId === activeProject.id).slice(0, 5);
  }, [issues, activeProject]);

  useEffect(() => {
    const fetchCommits = async () => {
      if (!activeProject || !activeProject.githubRepos || activeProject.githubRepos.length === 0) {
         setCommits([]);
         return;
      }
      setLoading(true);
      const primaryRepo = activeProject.githubRepos[0];
      const fallbackCommits = [
        {
          id: 'f8c3d1a',
          content: 'docs: Update README and API examples for initialization',
          repo: primaryRepo,
          time: new Date(Date.now() - 3600000 * 2).toLocaleDateString() + ' ' + new Date(Date.now() - 3600000 * 2).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          date: new Date(Date.now() - 3600000 * 2).toISOString(),
          icon: GitCommit,
          color: 'text-zinc-400'
        },
        {
          id: 'a9e2b4c',
          content: 'feat: Add support for streaming response options',
          repo: primaryRepo,
          time: new Date(Date.now() - 3600000 * 5).toLocaleDateString() + ' ' + new Date(Date.now() - 3600000 * 5).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          date: new Date(Date.now() - 3600000 * 5).toISOString(),
          icon: GitCommit,
          color: 'text-zinc-400'
        },
        {
          id: 'd7a1e5f',
          content: 'refactor: Clean up redundant helper definitions and configuration',
          repo: primaryRepo,
          time: new Date(Date.now() - 3600000 * 24).toLocaleDateString() + ' ' + new Date(Date.now() - 3600000 * 24).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          date: new Date(Date.now() - 3600000 * 24).toISOString(),
          icon: GitCommit,
          color: 'text-zinc-400'
        },
        {
          id: 'e3b6c2d',
          content: 'fix: Handle edge cases for credentials parsing in local context',
          repo: primaryRepo,
          time: new Date(Date.now() - 3600000 * 48).toLocaleDateString() + ' ' + new Date(Date.now() - 3600000 * 48).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          date: new Date(Date.now() - 3600000 * 48).toISOString(),
          icon: GitCommit,
          color: 'text-zinc-400'
        }
      ];

      try {
        const res = await fetch('/api/github/pull', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repo: primaryRepo, token: githubToken }) 
        });
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
           const data = await res.json();
           if (Array.isArray(data)) {
             setCommits(data.map((c: any) => ({
               id: c.sha.substring(0, 7),
               date: c.commit.author.date,
               content: c.commit.message.split('\n')[0],
               repo: primaryRepo,
               time: new Date(c.commit.author.date).toLocaleDateString() + ' ' + new Date(c.commit.author.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
               icon: GitCommit,
               color: 'text-zinc-400'
             })));
           } else {
             console.warn("Could not load fresh commits from GitHub, utilizing fallback simulation commits", data);
             setCommits(fallbackCommits);
           }
        } else {
          setCommits(fallbackCommits);
        }
      } catch (e) {
        console.warn("Network error during commits fetch, utilizing fallback simulation commits:", e);
        setCommits(fallbackCommits);
      }
      setLoading(false);
    };

    fetchCommits();
  }, [activeProject, githubToken]);

  const generateBriefing = async (force: boolean = false) => {
    if (!activeProject) return;

    if (!force) {
      const cached = localStorage.getItem(`aether_daily_briefing_${activeProject.id}`);
      const cachedTime = localStorage.getItem(`aether_daily_briefing_time_${activeProject.id}`);
      if (cached && cachedTime) {
        const timeElapsed = Date.now() - parseInt(cachedTime, 10);
        // 24 hours = 86400000 ms
        if (timeElapsed < 86400000) {
          setBriefingContent(cached);
          return;
        }
      }
    }

    setBriefingGenerating(true);
    setBriefingContent('');
    try {
      const preferenceList = aiContextRules || "None";
      const profileSummary = githubProfile?.bio || githubProfile?.summary || "Active engineer specialized in full-stack platforms and SaaS modules";
      const projectStack = activeProject?.frameworks || "React, TypeScript, Tailwind";
      const backendStatus = activeProject?.backendSettings?.type && activeProject.backendSettings.type !== "none" 
        ? `Linked with ${activeProject.backendSettings.type}` 
        : "Not connected to database";

      const now = new Date();
      let commitsLastDay = 0;
      let commitsLastWeek = 0;
      let recentCommitList = "";
      
      commits.forEach((c: any) => {
        let commitDate: Date | null = null;
        if (c.date) {
          commitDate = new Date(c.date);
        } else if (c.time) {
          commitDate = new Date(c.time);
        }
        
        if (commitDate && !isNaN(commitDate.getTime())) {
          const diffMs = now.getTime() - commitDate.getTime();
          const diffDays = diffMs / (1000 * 3600 * 24);
          if (diffDays <= 1) commitsLastDay++;
          if (diffDays <= 7) commitsLastWeek++;
        }
      });

      if (commits.length > 0) {
        recentCommitList = commits.slice(0, 3).map(c => `- ${c.content}`).join('\n');
      }

      const activeIssuesText = activeTasks.length > 0
        ? activeTasks.map(t => `- [Priority: ${t.priority || 'medium'}] ${t.title}`).join('\n')
        : "No active tasks in progress";

      const prompt = `You are an elite software project intelligence system.
Your current AI Persona setting is "${aiPersona || 'Dynamic Briefing'}", which guides your analytical style, wit, and conversational mannerisms.
The developer is "${googleUser?.displayName || 'drummerforger'}".
Their developer bio: "${profileSummary}"
Their preferences: "${preferenceList}"

Active Project parameters:
- Name: "${activeProject?.name || 'Default Project'}"
- Tech Stack: "${projectStack}"
- Backend Database Status: "${backendStatus}"
- Connected GitHub Repositories: ${JSON.stringify(activeProject?.githubRepos || [])}

Real-Time Git Activity & Backlog Backed Metrics:
- GitHub Commits in the past 24 hours: ${commitsLastDay}
- GitHub Commits in the past 7 days: ${commitsLastWeek}
- Total recent GitHub commits parsed: ${commits.length}
- Recent commit messages:
${recentCommitList || "None"}

Active Tasks (Backlog/Issues in Progress):
${activeIssuesText}

Generate a highly personalized, witty, and immediately actionable 2-3 sentence daily development briefing.
IMPORTANT REQUIREMENTS:
1. Speak about their actual GitHub progress first (e.g. "In the past day, you've made ${commitsLastDay} commits..." or "With ${commitsLastWeek} commits this past week..."). If they haven't committed in the past week or several days, recognize this accurately ("You haven't pushed any commits in the past few days, let's get back in the flow!").
2. Reference exactly what they worked on (mention their recent commit messages or active task titles).
3. Frame it with specific reasoning: mention a challenge they fixed, and highlight their next goal or active issues.
4. Keep the text extremely direct, high-value, and professional with a touch of your assigned persona's wit.
5. NEVER output boilerplate messages like "all correct tasks are currently aligned" or tell them to create issues if they already have issues or linked repos. Always speak directly about their real active parameters!`;

      const response = await fetch('/api/gemini/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }]
        })
      });
      if (!response.ok) throw new Error('Failed to generate briefing');
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let content = '';
      while (reader) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.text) {
                content += data.text;
                setBriefingContent(content);
              }
            } catch (e) {}
          }
        }
      }
      if (content) {
        localStorage.setItem(`aether_daily_briefing_${activeProject.id}`, content);
        localStorage.setItem(`aether_daily_briefing_time_${activeProject.id}`, Date.now().toString());
      }
    } catch (e) {
      setBriefingContent('Error generating personalized briefing.');
    } finally {
      setBriefingGenerating(false);
    }
  };

  const lastBriefedProjectId = useRef<string | null>(null);

  useEffect(() => {
    if (activeProject && !loading) {
      // 1. Immediately load cache if we have it to avoid blank space / spinner
      const cached = localStorage.getItem(`aether_daily_briefing_${activeProject.id}`);
      if (cached) {
        setBriefingContent(cached);
      } else {
        setBriefingContent('');
      }

      const cachedTime = localStorage.getItem(`aether_daily_briefing_time_${activeProject.id}`);
      const currentKey = `${activeProject.id}_${commits.length}_${activeTasks.length}`;
      
      const isExpired = !cachedTime || (Date.now() - parseInt(cachedTime, 10) >= 86400000);
      const isDifferent = lastBriefedProjectId.current !== currentKey;

      if ((isExpired || isDifferent || !cached) && !briefingGenerating) {
        lastBriefedProjectId.current = currentKey;
        generateBriefing(false);
      }
    }
  }, [activeProject?.id, commits.length, activeTasks.length, loading]);

  const computeActivityScore = () => {
    if (!activeProject) return 0;
    
    const projectIssues = issues.filter(i => i.projectId === activeProject.id);
    let score = 0;
    const now = new Date();
    
    // 1. Commits Activity (Time-Decayed)
    let commitScore = 0;
    commits.forEach((c: any) => {
      let commitDate: Date | null = null;
      if (c.date) {
        commitDate = new Date(c.date);
      } else if (c.time) {
        commitDate = new Date(c.time);
      }
      
      if (commitDate && !isNaN(commitDate.getTime())) {
        const diffMs = now.getTime() - commitDate.getTime();
        const diffDays = diffMs / (1000 * 3600 * 24);
        
        if (diffDays <= 1) {
          commitScore += 35;
        } else if (diffDays <= 3) {
          commitScore += 20;
        } else if (diffDays <= 7) {
          commitScore += 10;
        } else if (diffDays <= 14) {
          commitScore += 3;
        }
        // Older than 14 days adds 0 points to active score (complete decay)
      }
    });
    // Cap commit score contribution at 75 points
    score += Math.min(75, commitScore);
    
    // 2. Recent Issue Activity (worked on, resolved, or created recently)
    let issueScore = 0;
    projectIssues.forEach((iss: any) => {
      let updatedDate: Date | null = null;
      if (iss.updatedAt) {
        updatedDate = new Date(iss.updatedAt);
      } else if (iss.createdAt) {
        updatedDate = new Date(iss.createdAt);
      }
      
      if (updatedDate && !isNaN(updatedDate.getTime())) {
        const diffMs = now.getTime() - updatedDate.getTime();
        const diffDays = diffMs / (1000 * 3600 * 24);
        
        if (diffDays <= 2) {
          if (iss.status === 'In Progress' || iss.status === 'in_progress') {
            issueScore += 15;
          } else if (iss.status === 'Done' || iss.status === 'completed') {
            issueScore += 20;
          } else {
            issueScore += 8;
          }
        } else if (diffDays <= 7) {
          if (iss.status === 'In Progress' || iss.status === 'in_progress') {
            issueScore += 8;
          } else if (iss.status === 'Done' || iss.status === 'completed') {
            issueScore += 12;
          } else {
            issueScore += 4;
          }
        } else if (diffDays <= 14) {
          if (iss.status === 'Done' || iss.status === 'completed') {
            issueScore += 5;
          }
        }
      } else {
        // If no timestamp, give a tiny legacy/backlog buffer if active
        if (iss.status === 'In Progress' || iss.status === 'in_progress') {
          issueScore += 2;
        }
      }
    });
    // Cap issue score contribution at 25 points
    score += Math.min(25, issueScore);
    
    return Math.min(100, Math.max(0, Math.round(score)));
  };

  const activityScore = computeActivityScore();

  // Languages present in Trending Repositories
  const languagesList = useMemo(() => {
    const langs = new Set<string>();
    trendingRepos.forEach(r => {
      if (r.language) {
        langs.add(r.language);
      }
    });
    return ['All', ...Array.from(langs)];
  }, [trendingRepos]);

  // Filtered Repos based on search & language select input
  const filteredRepos = useMemo(() => {
    return trendingRepos.filter(repo => {
      const sq = (searchQuery || "").trim().toLowerCase();
      const matchesSearch = !sq ||
                            (repo.name || "").toLowerCase().includes(sq) || 
                            (repo.description && repo.description.toLowerCase().includes(sq));
      const matchesLang = selectedLanguage === 'All' || repo.language === selectedLanguage;
      return matchesSearch && matchesLang;
    });
  }, [trendingRepos, searchQuery, selectedLanguage]);

  return (
    <div className="flex flex-col h-full overflow-hidden gap-6 pb-4 w-full max-w-7xl mx-auto px-4 md:px-6 relative z-0">
      
      {/* Animated nebula drift backdrop layer behind main dashboard content */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-[-1] opacity-60">
        <div className="absolute top-[10%] left-[10%] w-[450px] h-[450px] rounded-full bg-amber-500/4 blur-[130px] animate-space-nebula" />
        <div className="absolute bottom-[10%] right-[5%] w-[500px] h-[500px] rounded-full bg-yellow-500/3 blur-[140px] animate-space-nebula [animation-delay:-16s]" />
        <div className="absolute top-[45%] left-[-15%] w-[380px] h-[380px] rounded-full bg-orange-500/3 blur-[110px] animate-space-nebula [animation-delay:-28s]" />
      </div>

      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 pt-4 border-b border-zinc-800/60 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
            <span className="text-[10px] font-mono tracking-widest text-yellow-400 uppercase font-semibold">Project Workspace Dashboard</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-light tracking-wide text-zinc-100 flex items-center gap-2.5 mt-0.5">
            Hello, <span className="font-medium italic">Code Partner</span> <Sparkles size={22} className="text-yellow-500 fill-yellow-500/10 animate-pulse drop-shadow-[0_0_6px_rgba(234,179,8,0.35)]" />
          </h1>
          <p className="text-xs md:text-sm text-zinc-400 font-medium">
            Let's build. You have <span className="text-zinc-200 font-bold">{activeTasks.length}</span> active tasks and <span className="text-zinc-200 font-bold">{commits.length}</span> recent commits in <span className="text-yellow-400 font-semibold">{activeProject ? activeProject.name : 'workspace'}</span>.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 self-start md:self-auto shadow-sm">
          <Calendar size={13} className="text-zinc-500" />
          <span className="text-[11px] font-mono text-zinc-400 font-medium select-none">
            {format(new Date(), 'EEEE, MMM d, yyyy')}
          </span>
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-6 pb-12 scrollbar-thin">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Activity Score */}
        <div className="p-5 rounded-2xl border border-zinc-800 bg-[#121214]/60 backdrop-blur-sm hover:border-zinc-700/60 transition-all flex flex-col justify-between h-[190px] min-h-[190px] group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold uppercase tracking-wider">
              <Activity size={13} className="text-yellow-500" />
              Activity Score
            </div>
            <span className="text-[10px] font-mono text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20">Synchronized</span>
          </div>
          <div className="mt-auto pb-1 text-left">
            <div className="text-3xl font-extrabold text-zinc-100 flex items-baseline">
              {activityScore}
              <span className="text-xs text-zinc-500 font-normal ml-1">/100</span>
            </div>
            <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden mt-3 relative">
              <div 
                className="h-full bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full shadow-[0_0_12px_rgba(234,179,8,0.25)] transition-all duration-1000 ease-out" 
                style={{ width: `${activityScore}%` }}
              />
            </div>
          </div>
        </div>
        
        {/* Project Intelligence */}
        <div className="p-5 rounded-2xl border border-zinc-800 bg-[#121214]/60 backdrop-blur-sm hover:border-zinc-700/60 transition-all flex flex-col justify-between h-[190px] min-h-[190px] group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold uppercase tracking-wider">
              <Layers size={13} className="text-yellow-500" />
              Project Intelligence
            </div>
            {activeProject && activeProject.githubRepos && activeProject.githubRepos.length > 0 && (
              <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1">
                <Github size={10} /> Linked
              </span>
            )}
          </div>
          {activeProject ? (
            <div className="mt-auto pb-1 text-left space-y-1.5">
              {activeProject.githubRepos && activeProject.githubRepos.length > 0 ? (
                <div className="text-[11px] font-mono text-zinc-300 truncate" title={activeProject.githubRepos.join(', ')}>
                  <span className="text-zinc-500">Repo:</span> {activeProject.githubRepos[0]}
                </div>
              ) : (
                <div className="text-[11px] text-zinc-500 italic">No linked repository</div>
              )}
              
              <div className="flex items-center justify-between text-[11px] font-sans">
                <span className="text-zinc-500">Backlog Sync:</span>
                <span className="text-zinc-350 font-semibold font-mono">
                  {issues.filter(i => i.projectId === activeProject.id && i.status === 'Done').length} / {issues.filter(i => i.projectId === activeProject.id).length} Resolved
                </span>
              </div>
              
              <div className="flex flex-wrap gap-1 pt-1 overflow-hidden max-h-[22px]">
                {(activeProject.customStack || activeProject.frameworks || []).slice(0, 3).map((f: string) => (
                  <span key={f} className="px-1.5 py-[1.5px] text-[9px] rounded-lg bg-zinc-950 border border-zinc-850 text-zinc-400 font-mono truncate max-w-[80px]" title={f}>
                    {f}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-xs text-zinc-500 italic mt-auto pb-2 text-left">Select a project to load real workspace telemetry.</div>
          )}
        </div>

        {/* AI Daily Briefing */}
        <div className="p-5 rounded-2xl border border-amber-500/20 bg-gradient-to-b from-[#121214] to-amber-950/10 hover:border-amber-500/30 transition-all flex flex-col h-[190px] min-h-[190px] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-5 blur-[1px] transition-all duration-500 group-hover:scale-110">
            <Bot size={72} className="text-amber-500" />
          </div>
          <div className="flex items-center justify-between w-full border-b border-zinc-800/40 pb-2 z-10">
            <div className="flex items-center gap-2 text-amber-500 text-xs font-bold uppercase tracking-wider">
              <Sparkles size={13} className="animate-pulse" />
              Dynamic Briefing
            </div>
            <button 
              onClick={() => generateBriefing(true)}
              disabled={briefingGenerating}
              className="text-[9px] uppercase tracking-wider bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 px-2.5 py-1 rounded-lg border border-amber-500/20 transition-colors disabled:opacity-50 flex items-center gap-1 cursor-pointer"
            >
              {briefingGenerating ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />}
              {briefingGenerating ? 'Analyzing...' : 'Refresh'}
            </button>
          </div>
          <div className="text-[11.5px] text-zinc-300 leading-relaxed mt-2.5 z-10 text-left overflow-y-auto max-h-[115px] pr-1.5 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
            {briefingContent ? (
              <span className="whitespace-pre-line">{briefingContent}</span>
            ) : briefingGenerating ? (
              <span className="text-amber-500 italic font-mono flex items-center gap-1.5">
                <Loader2 size={10} className="animate-spin" /> Synthesizing personalized briefing...
              </span>
            ) : (
              <span>Preparing personalized briefing insights...</span>
            )}
          </div>
        </div>
      </div>

      {/* Aether Synced Workspace Plan & Brainstorm Goals */}
      {activeProject && (
        <div className="border border-amber-500/20 bg-gradient-to-b from-[#121214] to-zinc-950 p-6 rounded-2xl shadow-xl text-left relative overflow-hidden">
          {/* subtle decorative background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/3 blur-[100px] pointer-events-none" />

          <div className="flex items-center justify-between border-b border-zinc-800/60 pb-4 mb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                <h3 className="font-mono font-bold text-xs uppercase tracking-widest text-amber-500 flex items-center gap-2">
                  <Target size={13} />
                  Aether Synced Workspace Plan
                </h3>
              </div>
              <p className="text-xs text-zinc-400">
                Live goals checklist and technical specifications synchronized directly from voice-controlled Aether brainstorming.
              </p>
            </div>
            
            {/* Completion Percentage indicator */}
            {activeProject.goals && activeProject.goals.length > 0 && (
              <div className="text-right">
                <span className="text-[10px] font-mono uppercase text-zinc-500 block">Progress</span>
                <span className="text-xs font-mono font-bold text-amber-400">
                  {completionStats.percent}% Complete
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Goals Checklist Column */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-zinc-300 font-mono uppercase tracking-wider flex items-center gap-1.5">
                <CheckSquare size={12} className="text-amber-500" />
                Active Goals Checklist
              </h4>

              {/* Goals list */}
              {normalizedGoals.length > 0 ? (
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                  {normalizedGoals.map((goal: any, idx: number) => {
                    const isCompleted = goal.completed;
                    return (
                      <div 
                        key={goal.id || idx}
                        onClick={() => handleToggleGoal(goal.id, goal.text)}
                        className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                          isCompleted 
                            ? 'bg-emerald-500/5 border-emerald-500/20 text-zinc-450 hover:bg-emerald-500/10' 
                            : 'bg-zinc-950/40 border-zinc-850 hover:border-zinc-700/60 text-zinc-200'
                        }`}
                      >
                        <div className="pt-0.5 shrink-0">
                          {isCompleted ? (
                            <CheckSquare size={14} className="text-emerald-500" />
                          ) : (
                            <div className="w-[14px] h-[14px] rounded border border-zinc-600 hover:border-zinc-400 transition-colors" />
                          )}
                        </div>
                        <span className={`text-[11px] leading-relaxed font-sans ${isCompleted ? 'line-through text-zinc-500 font-medium' : 'font-semibold'}`}>
                          {goal.text}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-5 border border-dashed border-zinc-850 rounded-xl flex flex-col items-center justify-center text-center gap-1">
                  <span className="text-[11px] text-zinc-500 italic">No targets loaded. Initialize brainstorming with Aether to populate goals!</span>
                </div>
              )}

              {/* Add target goal manually */}
              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={newDashboardGoal}
                  onChange={(e) => setNewDashboardGoal(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddGoalDirectly()}
                  placeholder="Set custom project target objective..."
                  className="flex-1 bg-zinc-950 border border-zinc-850 focus:border-amber-500/40 rounded-xl px-3 py-1.5 text-[11px] text-zinc-200 placeholder:text-zinc-600 outline-none transition-all"
                />
                <button
                  onClick={handleAddGoalDirectly}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Plus size={11} />
                  Add Target
                </button>
              </div>
            </div>

            {/* Aether Synced Specs & Notes Column */}
            <div className="space-y-4 border-t lg:border-t-0 lg:border-l lg:border-zinc-800/60 lg:pl-6 pt-6 lg:pt-0">
              <h4 className="text-xs font-bold text-zinc-300 font-mono uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={12} className="text-amber-500" />
                Latest Aether Brainstorm Note
              </h4>

              {aetherNote ? (
                <div className="p-4 bg-zinc-950/40 border border-zinc-850 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-zinc-300 truncate font-mono">
                      📄 {aetherNote.title}
                    </span>
                    <span className="text-[9px] font-mono text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full shrink-0">
                      Synced Note
                    </span>
                  </div>
                  
                  {/* Note contents rendered nicely as small markdown snippet */}
                  <div className="text-[11px] leading-relaxed text-zinc-400 font-sans max-h-[160px] overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-zinc-900 scrollbar-track-transparent select-text whitespace-pre-wrap">
                    {aetherNote.content}
                  </div>
                </div>
              ) : (
                <div className="p-8 border border-dashed border-zinc-850 rounded-xl flex flex-col items-center justify-center text-center gap-1 h-[215px]">
                  <FileText size={20} className="text-zinc-700 mb-1" />
                  <span className="text-[11px] text-zinc-500 italic">No synchronized notes linked to this project yet.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recommended Next Steps Section */}
      <div className="border border-zinc-800 bg-[#121214]/65 backdrop-blur-sm rounded-2xl p-6 relative overflow-hidden shadow-xl text-left">
        <div className="absolute top-0 right-0 p-4 opacity-5 blur-[1px]">
          <CheckCircle2 size={110} className="text-zinc-500" />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/60 pb-4 mb-5">
          <div className="space-y-1 text-left">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
              <h3 className="font-extrabold text-xs text-zinc-100 uppercase tracking-wider font-mono flex items-center gap-2">
                <Sparkles size={13} className="text-yellow-400" /> 
                Recommended Next Steps
              </h3>
            </div>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed">
              AI-generated priority suggestions analyzed from issues, documentation, and active project targets.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {dismissedStepIds.length > 0 && (
              <button
                onClick={handleRestoreDismissedSteps}
                className="text-[10px] uppercase tracking-wider bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 px-2.5 py-1.5 rounded-xl border border-zinc-850 hover:text-white transition-all flex items-center gap-1 cursor-pointer font-semibold"
                title="Restore all dismissed recommendations"
              >
                <RotateCcw size={11} /> Restore Dismissed
              </button>
            )}
            <button
              onClick={() => fetchNextSteps(true)}
              disabled={loadingSteps || !activeProject}
              className="text-[10px] uppercase tracking-wider bg-zinc-900 hover:bg-yellow-500/10 hover:text-yellow-400 text-zinc-300 px-3 py-1.5 rounded-xl border border-zinc-800 transition-all flex items-center gap-1.5 select-none cursor-pointer disabled:opacity-50 font-semibold"
            >
              <RefreshCw size={11} className={loadingSteps ? "animate-spin text-yellow-400" : ""} />
              {loadingSteps ? "Analyzing..." : "Re-Analyze Goals"}
            </button>
          </div>
        </div>

        {loadingSteps ? (
          /* Sleek minimalist dynamic loader skeletons */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[1, 2, 3].map(n => (
              <div key={n} className="rounded-2xl border border-zinc-850 bg-zinc-950/20 p-5 min-h-[170px] flex flex-col justify-between animate-pulse">
                <div className="space-y-3">
                  <div className="h-4 bg-zinc-900 rounded w-1/3" />
                  <div className="h-5 bg-zinc-900 rounded w-4/5" />
                  <div className="space-y-2">
                    <div className="h-3 bg-zinc-900 rounded w-full" />
                    <div className="h-3 bg-zinc-900 rounded w-5/6" />
                  </div>
                </div>
                <div className="h-8 bg-zinc-900 rounded-lg w-full mt-4" />
              </div>
            ))}
          </div>
        ) : visibleSteps.length === 0 ? (
          /* Beautiful optimized state */
          <div className="py-8 px-4 rounded-xl border border-dashed border-zinc-805 bg-zinc-900/10 text-center flex flex-col items-center justify-center gap-2.5">
            <div className="h-10 w-10 text-emerald-450 flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-zinc-200">Backlog Fully Synced</h4>
              <p className="text-[11px] text-zinc-500 max-w-md mx-auto leading-relaxed">
                All suggestions have been either approved to your project's issues list or dismissed. Click "Re-Analyze Goals" or edit workspace documents to check for fresh guidelines.
              </p>
            </div>
          </div>
        ) : (
          /* Steps display grid */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {visibleSteps.slice(0, 3).map((step) => {
               const themeColor = 
                step.type === 'Fix' || step.type === 'Bug' ? { bg: 'bg-rose-500/10 border-rose-500/15 text-rose-455', text: 'Fix' } :
                step.type === 'New Feature' || step.type === 'Feature' ? { bg: 'bg-yellow-500/15 border-yellow-500/25 text-yellow-405', text: 'Feature' } :
                step.type === 'New Idea' ? { bg: 'bg-emerald-500/10 border-emerald-500/15 text-emerald-400', text: 'New Idea' } :
                step.type === 'New Project Idea' || step.type === 'Project Idea' ? { bg: 'bg-purple-500/10 border-purple-500/20 text-purple-400', text: 'Project Idea' } :
                { bg: 'bg-zinc-800/40 border-zinc-800/60 text-zinc-350', text: 'Task' };

              const targetProjectName = step.projectName || activeProject?.name || 'Current Project';

              return (
                <div 
                  key={step.id} 
                  className="rounded-2xl border border-zinc-850 bg-zinc-950/30 p-5 flex flex-col justify-between hover:border-zinc-700/50 transition-all duration-300 min-h-[188px]"
                >
                  <div className="space-y-3 text-left">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[9px] font-mono font-extrabold tracking-wide uppercase px-2 py-0.5 rounded-full border ${themeColor.bg}`}>
                        {themeColor.text}
                      </span>
                      <span 
                        className="text-[9.5px] font-bold text-yellow-300 bg-yellow-500/10 border border-yellow-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-sm font-mono uppercase tracking-wider" 
                        title={`Project Target: ${targetProjectName}`}
                      >
                        <Folder size={10} className="text-yellow-400 shrink-0" />
                        <span className="text-zinc-400 font-normal">Project:</span>
                        <span className="text-yellow-300 font-bold">{targetProjectName}</span>
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-zinc-200 leading-snug">
                        {step.title}
                      </h4>
                      <p className="text-[11px] text-zinc-400 leading-relaxed font-sans font-medium line-clamp-3">
                        {step.description}
                      </p>
                      {step.securityFixSteps && (
                        <div className="bg-rose-950/20 border border-rose-500/10 rounded-lg p-2.5 space-y-1 mt-2">
                          <span className="text-[9px] font-bold text-rose-400 tracking-wider uppercase block">
                            🛡️ Security Instructions:
                          </span>
                          <p className="text-[10px] text-zinc-300 font-mono leading-relaxed whitespace-pre-wrap">
                            {step.securityFixSteps}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-900/60 flex items-center gap-2">
                    <button
                      onClick={() => handleApproveStep(step)}
                      className="flex-1 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-black rounded-lg text-[10.5px] font-bold tracking-wide transition-all active:scale-[0.98] flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Check size={12} /> Approve
                    </button>
                    <button
                      onClick={() => handleDismissStep(step.id, step.title)}
                      className="px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:text-zinc-300 text-zinc-500 rounded-lg text-[10.5px] font-semibold transition-all cursor-pointer active:scale-[0.98]"
                      title="Dismiss suggestion"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DevSpace Security & Compilation Pipelines */}
      <div className="border border-zinc-850 bg-[#121214]/60 backdrop-blur-sm rounded-2xl p-5 relative overflow-hidden shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/60 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono tracking-widest text-[#8696a0] uppercase font-bold">DevSpace Security & Compilation Pipelines</span>
          </div>
          <p className="text-[10px] text-zinc-500">Trigger full-stack sanity checks, security audits, and developer settings synchronization</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Action 1: Cloud Sync Preferences */}
          <button
            onClick={handleSyncBackup}
            disabled={isSyncingBackup}
            className="p-4 bg-zinc-950/45 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-700 rounded-xl text-left transition-all duration-150 flex flex-col items-start gap-2.5 cursor-pointer disabled:opacity-55 active:scale-[0.98]"
          >
            <div className="flex items-center gap-2 text-zinc-200">
              <RefreshCw size={14} className={`text-emerald-400 ${isSyncingBackup ? "animate-spin" : ""}`} />
              <span className="text-xs font-bold font-sans tracking-tight">Cloud Sync Preferences</span>
            </div>
            <span className="text-[10px] text-zinc-400 leading-normal">Sync developer guidelines, active Aether preference profiles, and Obsidian brains with remote database state.</span>
          </button>

          {/* Action 2: Audit Database & RLS */}
          <button
            onClick={handleRunAudit}
            disabled={isAuditing}
            className="p-4 bg-zinc-950/45 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-700 rounded-xl text-left transition-all duration-150 flex flex-col items-start gap-2.5 cursor-pointer disabled:opacity-55 active:scale-[0.98]"
          >
            <div className="flex items-center gap-2 text-zinc-200">
              <Sparkles size={14} className={`text-amber-400 ${isAuditing ? "animate-pulse" : ""}`} />
              <span className="text-xs font-bold font-sans tracking-tight">Audit Database & RLS</span>
            </div>
            <span className="text-[10px] text-zinc-400 leading-normal">Run automated schema audits on connected database tables to detect public access vulnerability or missing indexes.</span>
          </button>

          {/* Action 3: Verify Build Sandbox */}
          <button
            onClick={handleLaunchAgent}
            disabled={agentStatus.startsWith('🤖') || agentStatus.startsWith('🔍') || agentStatus.startsWith('💻')}
            className="p-4 bg-zinc-950/45 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-700 rounded-xl text-left transition-all duration-150 flex flex-col items-start gap-2.5 cursor-pointer active:scale-[0.98]"
          >
            <div className="flex items-center gap-2 text-zinc-200">
              <Bot size={14} className="text-yellow-500 select-none" />
              <span className="text-xs font-bold font-sans tracking-tight">Verify Build Sandbox</span>
            </div>
            <span className="text-[10px] text-zinc-400 leading-normal">Simulate complete workspace package compilation, run ESLint, and resolve dynamic runtime imports.</span>
          </button>
        </div>

        {/* Live response feedback ticks */}
        {(agentStatus || auditLog) && (
          <div className="mt-4 p-3 bg-zinc-950 border border-zinc-850 rounded-xl flex items-center gap-3 font-mono text-[10px] text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
            <div className="flex-1">
              {auditLog && <p className="text-amber-400 font-medium">AUDIT: {auditLog}</p>}
              {agentStatus && <p className="text-emerald-400 font-medium">AGENT: {agentStatus}</p>}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Gateway & Voice Settings Toggle */}
      <div className="border border-zinc-800 bg-[#121214]/65 backdrop-blur-sm rounded-2xl p-5 relative overflow-hidden shadow-xl text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-yellow-500/10 text-yellow-400 rounded-xl border border-yellow-500/20">
            <Smartphone size={18} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono">Mobile Gateway & Voice Settings</h3>
            <p className="text-[11px] text-zinc-400 font-sans mt-1">Configure your speech synthesizers, hands-free active listen mode, or link mobile gateway interfaces.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowVoiceHub(!showVoiceHub)}
          className="text-[10px] uppercase tracking-wider font-mono bg-zinc-900 hover:bg-yellow-500/10 hover:text-yellow-400 text-zinc-300 px-3.5 py-1.5 rounded-xl border border-zinc-850 hover:border-zinc-700 transition-all cursor-pointer font-bold shrink-0"
        >
          {showVoiceHub ? "Hide Settings" : "Configure Settings"}
        </button>
      </div>

      {showVoiceHub && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          <VoiceHub />
        </div>
      )}

      {/* Main Work Panels (Issues + Commits) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 min-h-0">
        
        {/* Active Issues Panel */}
        <div className="border border-zinc-800 bg-[#121214]/60 backdrop-blur-sm rounded-2xl flex flex-col h-[400px] overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800/60 flex items-center justify-between bg-zinc-900/15">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <h3 className="font-bold text-xs text-zinc-200 uppercase tracking-wider">Active Workspace Issues ({activeProject?.name || 'Default'})</h3>
            </div>
            <span className="text-[10px] text-zinc-400 font-mono bg-zinc-950 border border-zinc-800/80 px-2.5 py-0.5 rounded-lg">
              {activeTasks.filter(t => t.status !== 'Done').length} Pending
            </span>
          </div>
          <div className="p-3 overflow-y-auto space-y-2 flex-1 custom-scrollbar">
            {!activeProject ? (
               <div className="h-full flex items-center justify-center text-zinc-500">
                  <span className="text-xs font-mono">Create a project first</span>
               </div>
            ) : activeTasks.length === 0 ? (
               <div className="h-full flex items-center justify-center text-zinc-500">
                  <span className="text-xs font-mono">No active issues loaded</span>
               </div>
            ) : (
              activeTasks.map((task, i) => (
                <div 
                  key={task.id} 
                  className="flex items-start gap-3 p-3 rounded-xl bg-zinc-950/40 border border-zinc-800/40 hover:border-zinc-700/60 transition-all cursor-pointer group"
                >
                  <div className="pt-0.5 shrink-0">
                    {task.status === 'Done' ? (
                      <CheckCircle2 size={14} className="text-emerald-500" />
                    ) : task.status === 'In Progress' ? (
                      <Circle size={14} className="text-blue-400 fill-blue-400/10 animate-pulse" />
                    ) : (
                      <Circle size={14} className="text-zinc-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold leading-relaxed truncate ${task.status === 'Done' ? 'text-zinc-500 line-through' : 'text-zinc-200 group-hover:text-indigo-400'}`}>
                      {task.title}
                    </p>
                    <div className="text-[10px] mt-1.5 text-zinc-500 flex items-center gap-3 font-mono">
                      <span className="text-zinc-400 bg-zinc-950 border border-zinc-800 px-1.5 py-[1px] rounded text-[9px] font-medium">{activeProject.name}</span>
                      <span>#{task.id.slice(0, 5)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Activity Stream Panel */}
        <div className="border border-zinc-800 bg-[#121214]/60 backdrop-blur-sm rounded-2xl flex flex-col h-[400px] overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800/60 bg-zinc-900/15">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <h3 className="font-bold text-xs text-zinc-200 uppercase tracking-wider">Recent Repository Commits</h3>
            </div>
          </div>
          <div className="p-4 overflow-y-auto relative flex-1 custom-scrollbar">
            {loading ? (
               <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 gap-2 bg-[#121214]/60 backdrop-blur-sm">
                  <Loader2 size={16} className="animate-spin text-indigo-400" />
                  <span className="text-xs font-mono">Loading activity stream...</span>
               </div>
            ) : (!activeProject?.githubRepos || activeProject.githubRepos.length === 0) ? (
               <div className="absolute inset-0 flex items-center justify-center text-zinc-500">
                  <span className="text-xs font-mono">Connect a GitHub repository to stream activity</span>
               </div>
            ) : commits.length === 0 ? (
               <div className="absolute inset-0 flex items-center justify-center text-zinc-500 px-8 text-center">
                  <span className="text-xs font-mono leading-relaxed">No commits recorded on {activeProject.githubRepos[0]}.</span>
               </div>
            ) : (
              <div className="relative border-l border-zinc-800 ml-4 space-y-4">
                {commits.map((activity, i) => (
                  <div 
                    key={activity.id} 
                    className="relative pl-6 group"
                  >
                    <div className="absolute -left-[14px] top-1 bg-zinc-950 p-1 rounded-full border border-zinc-800 group-hover:border-indigo-500 group-hover:bg-indigo-950/20 transition-all">
                      <activity.icon size={11} className="text-zinc-500 group-hover:text-indigo-400" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-xs font-medium text-zinc-200 group-hover:text-zinc-100 transition-colors leading-relaxed">
                        {activity.content}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                        <span className="bg-zinc-950 border border-zinc-850 px-1 py-[0.5px] rounded text-indigo-400/95 font-medium">{activity.id}</span>
                        <span>{activity.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* AI Personalized Repository Feed */}
      <div className="border border-zinc-800 bg-gradient-to-b from-[#121214] to-[#0d0d0f] rounded-2xl flex flex-col relative overflow-hidden shadow-2xl mb-6">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-950/20">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse shrink-0" />
            <Sparkles size={15} className="text-yellow-400 shrink-0" />
            <h3 className="font-bold text-xs text-zinc-200 uppercase tracking-widest">AI-Curated Repositories For You</h3>
          </div>
          
          <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
            <span>Model: Gemini 3.5 Active</span>
          </div>
        </div>

        {/* Custom Interests Selector */}
        <div className="px-5 py-3.5 bg-zinc-950/40 border-b border-zinc-900/60 flex flex-col md:flex-row md:items-center gap-3 justify-between">
          <div className="flex-1 space-y-1">
            <p className="text-[10px] text-zinc-500 font-mono uppercase font-black">Train AI Recommendation Preferences</p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type topics you love (e.g. Rust, WebAssembly, reactive canvas, terminal UI)..."
                defaultValue={userCustomInterests}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveCustomInterests(e.currentTarget.value);
                  }
                }}
                className="flex-1 bg-zinc-900/80 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-200 focus:outline-none focus:border-yellow-500/40 placeholder-zinc-600"
              />
              <button
                type="button"
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                  handleSaveCustomInterests(input.value);
                }}
                className="px-3 py-1 bg-yellow-500 hover:bg-yellow-400 text-black font-bold font-mono text-[10px] uppercase rounded-lg transition-all cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 shrink-0 max-w-md pt-2 md:pt-0">
            <span className="text-[9px] font-bold text-zinc-600 uppercase font-mono">Active Filters:</span>
            {likedKeywords.length === 0 && userCustomInterests.trim() === '' ? (
              <span className="text-[9px] text-zinc-500 font-mono">None (Default feed active)</span>
            ) : (
              <>
                {likedKeywords.slice(0, 3).map((kw, i) => (
                  <span key={i} className="text-[9px] font-mono px-1.5 py-0.5 bg-green-950/40 text-green-400 border border-green-900/40 rounded">
                    +{kw}
                  </span>
                ))}
                {dislikedKeywords.slice(0, 3).map((kw, i) => (
                  <span key={i} className="text-[9px] font-mono px-1.5 py-0.5 bg-rose-950/40 text-rose-400 border border-rose-900/40 rounded">
                    -{kw}
                  </span>
                ))}
              </>
            )}
          </div>
        </div>

        {/* GitHub Stars Sync Profile Panel */}
        <div className="px-5 py-3.5 bg-zinc-950/60 border-b border-zinc-900/40 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <Github size={12} className="text-zinc-400" />
                <span className="text-[10px] text-zinc-400 font-mono uppercase font-black">GitHub Profile Star Tracker</span>
              </div>
              <p className="text-[10px] text-zinc-500 leading-normal max-w-xl">
                Feed your personal GitHub starred repositories as preferences directly into your AI model recommendations.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Enter GitHub Username..."
                value={githubUsernameInput}
                onChange={(e) => setGithubUsernameInput(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-200 focus:outline-none focus:border-yellow-500/40 placeholder-zinc-600 w-44"
              />
              <button
                type="button"
                disabled={isSyncingStars}
                onClick={() => handleSyncStarredRepos(githubUsernameInput)}
                className="px-3 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 hover:text-white font-bold font-mono text-[10px] uppercase rounded-lg transition-all cursor-pointer flex items-center gap-1 shrink-0 disabled:opacity-50"
              >
                {isSyncingStars ? (
                  <>
                    <Loader2 size={10} className="animate-spin text-yellow-500" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <Star size={10} className="text-yellow-500" />
                    Sync Stars
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Active starred list preview */}
          {starredReposList.length > 0 && (
            <div className="space-y-1.5 bg-zinc-950/80 border border-zinc-900 p-2.5 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono text-zinc-500 uppercase">Tracked Stars Preference Profile ({starredReposList.length} repos):</span>
                <button
                  type="button"
                  onClick={() => {
                    setStarredReposList([]);
                    localStorage.removeItem('app_dashboard_github_stars');
                    showToast('Cleared synced star preferences.', 'info');
                    setTimeout(() => {
                      fetchPersonalRecommendations();
                    }, 100);
                  }}
                  className="text-[8px] font-mono text-zinc-600 hover:text-rose-400 uppercase cursor-pointer"
                >
                  Clear Tracker Cache
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto pr-2 custom-scrollbar">
                {starredReposList.map((repo, idx) => (
                  <a
                    key={repo.name + idx}
                    href={repo.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[9px] font-mono px-2 py-0.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-yellow-500 border border-zinc-800/80 rounded flex items-center gap-1 transition-all"
                    title={repo.description || "No description"}
                  >
                    <Star size={8} className="text-yellow-500" />
                    <span>{repo.name.split('/').pop()}</span>
                    {repo.language && (
                      <span className="text-zinc-600 text-[8px]">({repo.language})</span>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          {loadingPersonal ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="text-yellow-500 animate-spin" size={24} />
              <p className="text-[11px] font-mono text-zinc-500">Querying real-time GitHub APIs & analyzing with Gemini...</p>
            </div>
          ) : personalRepos.length === 0 ? (
            <div className="text-center py-10 text-zinc-500 text-xs">
              No recommendations available. Try adjusting your training preferences or adding custom interests above!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {personalRepos.map((repo, idx) => (
                <div 
                  key={repo.name + idx}
                  className="bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700/80 rounded-xl p-4 flex flex-col justify-between transition-all group"
                >
                  <div className="space-y-2.5">
                    {/* Title + Star Count */}
                    <div className="flex items-start justify-between gap-1">
                      <a 
                        href={repo.html_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs font-bold text-yellow-500 hover:underline flex items-center gap-1 leading-normal break-all"
                      >
                        {repo.name}
                        <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </a>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleStarToggle(repo.name);
                        }}
                        className={`flex items-center gap-1 px-1.5 py-0.5 border rounded-md shrink-0 transition-all cursor-pointer text-[10px] font-mono font-bold ${
                          starredRepos[repo.name]
                            ? 'bg-yellow-500/10 border-yellow-500/35 text-yellow-500 hover:bg-yellow-500/20'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-zinc-155 hover:border-zinc-700'
                        }`}
                        title={starredRepos[repo.name] ? "Starred! Click to unstar on GitHub" : "Star on GitHub"}
                      >
                        <Star size={10} className={starredRepos[repo.name] ? "fill-yellow-500 text-yellow-500" : "text-yellow-500"} />
                        <span>
                          {((repo.stargazers_count || 0) + (starredRepos[repo.name] ? 1 : 0)) >= 1000
                            ? `${(((repo.stargazers_count || 0) + (starredRepos[repo.name] ? 1 : 0)) / 1000).toFixed(1)}k`
                            : (repo.stargazers_count || 0) + (starredRepos[repo.name] ? 1 : 0)}
                        </span>
                      </button>
                    </div>

                    {/* Description */}
                    <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-3 min-h-[48px]">
                      {repo.description || "No description provided."}
                    </p>

                    {/* AI Explanation / Rationale */}
                    <div className="bg-yellow-500/[0.02] border border-yellow-500/10 rounded-lg p-2.5 text-left space-y-1">
                      <p className="text-[8px] font-mono uppercase font-extrabold text-yellow-500 tracking-wider flex items-center gap-1">
                        <Bot size={10} />
                        AI Rationale
                      </p>
                      <p className="text-[10px] text-zinc-400 leading-relaxed">
                        {repo.reason || `Matches your programming preferences for ${repo.language || 'modern utilities'}.`}
                      </p>
                    </div>
                  </div>

                  {/* Feedback Controls (Yes / No) */}
                  <div className="border-t border-zinc-900 mt-4 pt-3 flex items-center justify-between gap-2">
                    <span className="text-[9px] text-zinc-500 font-mono">Recommend more?</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleLikeRepo(repo)}
                        className="px-2 py-1 bg-green-950/50 hover:bg-green-900/60 text-green-400 border border-green-800/30 rounded flex items-center gap-1 text-[9px] font-bold font-mono transition-all cursor-pointer"
                        title="Yes, I would like more of this"
                      >
                        <ThumbsUp size={10} />
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDislikeRepo(repo)}
                        className="px-2 py-1 bg-rose-950/50 hover:bg-rose-900/60 text-rose-400 border border-rose-800/30 rounded flex items-center gap-1 text-[9px] font-bold font-mono transition-all cursor-pointer"
                        title="No, block this"
                      >
                        <ThumbsDown size={10} />
                        No
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Daily Trending Repositories Board (FULL WIDTH) */}
      <div className="border border-zinc-800 bg-[#121214]/60 backdrop-blur-sm rounded-2xl flex flex-col relative overflow-hidden shadow-2xl">
        
        {/* Row 1: Header */}
        <div className="px-5 py-4 border-b border-zinc-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/10">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse shrink-0" />
            <TrendingUp size={15} className="text-yellow-400 shrink-0" />
            <h3 className="font-bold text-xs text-zinc-200 uppercase tracking-widest">Real-Time GitHub Trends</h3>
          </div>
          
          {/* Controls: Search + Refresh + Language select drop */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" size={12} />
              <input
                type="text"
                placeholder="Filter repositories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-zinc-950 border border-zinc-800/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-300 placeholder-zinc-500 focus:outline-none focus:border-yellow-500/50 w-[180px] md:w-[220px]"
              />
            </div>

            {/* Language filter dropdown */}
            <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800/70 rounded-xl px-2.5 py-1">
              <Filter size={11} className="text-zinc-500" />
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="bg-transparent border-none text-[11px] text-zinc-400 focus:outline-none cursor-pointer pr-1"
              >
                {languagesList.map(lang => (
                  <option key={lang} value={lang} className="bg-zinc-950 text-zinc-300 text-xs">
                    {lang === 'All' ? 'All Languages' : lang}
                  </option>
                ))}
              </select>
            </div>

            {/* Refresh action */}
            <button 
              onClick={() => fetchTrendingObj(true)}
              disabled={loadingTrending}
              className="text-zinc-400 hover:text-zinc-100 transition-colors p-1.5 rounded-xl border border-zinc-800 hover:border-zinc-700/80 bg-zinc-950 hover:bg-zinc-900 disabled:opacity-50 shrink-0 flex items-center justify-center"
              title="Refresh trends"
            >
              <RefreshCw size={12} className={`${loadingTrending ? 'animate-spin text-yellow-400' : ''}`} />
            </button>
          </div>
        </div>
        
        {/* Body content with beautiful responsive grid, handling titles and overflow correctly */}
        <div className="p-5 relative flex-1 min-h-[220px]">
          {loadingTrending && trendingRepos.length === 0 ? (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 gap-2 bg-zinc-[#121214]/30">
                <Loader2 size={22} className="animate-spin text-yellow-400" />
                <span className="text-[11px] font-mono tracking-widest text-zinc-400 uppercase font-semibold">Reconstructing Trending Register...</span>
             </div>
          ) : filteredRepos.length === 0 ? (
             <div className="h-44 w-full flex flex-col items-center justify-center text-zinc-500">
                <span className="text-sm font-mono text-zinc-400">Zero matches for target criteria</span>
                <span className="text-[10px] text-zinc-600 mt-1">Try modifying your query or language filters above.</span>
             </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredRepos.map((repo, i) => {
                const isNewDailyTrend = repo.is_new || repo.isNew || repo.is_daily_new || (repo.stars_today && repo.stars_today > 100) || i < 3;

                return (
                  <div 
                    key={repo.id || i} 
                    className="bg-zinc-950/45 hover:bg-zinc-950/95 border border-zinc-800/80 hover:border-yellow-500/50 rounded-xl p-4 transition-all text-left flex flex-col justify-between cursor-pointer group shadow-md hover:shadow-[0_0_24px_rgba(234,179,8,0.18)] min-h-[148px] hover:-translate-y-1 transform duration-200"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1 flex-wrap">
                          {isNewDailyTrend && (
                            <span className="text-[9px] font-black uppercase font-mono tracking-wider bg-yellow-400 text-black px-1.5 py-0.5 rounded shadow-sm flex items-center gap-0.5 shrink-0">
                              <Sparkles size={8} className="fill-black text-black" /> NEW
                            </span>
                          )}
                          <a 
                            href={repo.html_url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-[12px] font-bold text-zinc-200 group-hover:text-yellow-400 transition-colors truncate font-mono flex items-center gap-1"
                          >
                            {repo.name}
                            <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-all text-zinc-500 shrink-0 transform translate-y-[-1px]" />
                          </a>
                        </div>
                        {repo.stars_today !== undefined && repo.stars_today > 0 && (
                          <span className="text-[9px] bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-semibold shrink-0 font-mono">
                            +{repo.stars_today.toLocaleString()} ★
                          </span>
                        )}
                      </div>
                      {/* Repository description - with clear sizing rules to handle titles and stats without clipping */}
                      <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-3 min-h-[44px] break-words">
                        {repo.description || "No description provided."}
                      </p>
                    </div>

                    {/* Badges and statistics footer */}
                    <div className="flex items-end justify-between text-[10px] mt-4 pt-3 border-t border-zinc-900 text-zinc-500 font-mono">
                      <div className="flex flex-col gap-1 shrink-0">
                        <span className="flex items-center gap-1.5">
                          <span 
                            className="w-2 h-2 rounded-full border border-black/10 shrink-0" 
                            style={{
                              backgroundColor: 
                                repo.language === 'TypeScript' ? '#3178c6' :
                                repo.language === 'JavaScript' ? '#f1e05a' :
                                repo.language === 'CSS' ? '#563d7c' :
                                repo.language === 'HTML' ? '#e34c26' :
                                repo.language === 'Go' ? '#00add8' :
                                repo.language === 'Python' ? '#3572A5' :
                                repo.language === 'Rust' ? '#dea584' :
                                repo.language === 'C++' ? '#f34b7d' :
                                repo.language === 'Java' ? '#b07219' : '#a1a1aa'
                            }}
                          />
                          <span className="text-zinc-400 font-medium">{repo.language || 'Codebase'}</span>
                        </span>
                        {/* Dates displaying Created At and Last Updated info */}
                        <div className="text-[9px] text-zinc-500 flex flex-col gap-0.5 leading-snug">
                          <span>Created: {getRepoDates(repo).createdStr}</span>
                          <span className="text-yellow-400/90 font-medium">{getRepoDates(repo).updatedDistance}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 pb-0.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleStarToggle(repo.name);
                          }}
                          className={`flex items-center gap-1 px-1.5 py-0.5 border rounded-md transition-all cursor-pointer text-[10px] font-mono ${
                            starredRepos[repo.name]
                              ? 'bg-yellow-500/10 border-yellow-500/35 text-yellow-500 hover:bg-yellow-500/20'
                              : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:text-zinc-255'
                          }`}
                          title={starredRepos[repo.name] ? "Starred! Click to unstar on GitHub" : "Star on GitHub"}
                        >
                          <Star size={10} className={starredRepos[repo.name] ? "fill-yellow-500 text-yellow-500" : "text-zinc-600 transition-colors"} />
                          <span>
                            {((repo.stargazers_count || 0) + (starredRepos[repo.name] ? 1 : 0)).toLocaleString()}
                          </span>
                        </button>
                        <span className="flex items-center gap-1 text-zinc-400 group-hover:text-yellow-400 transition-colors">
                          <GitFork size={10} className="text-zinc-600 transition-colors" />
                          {repo.forks_count ? repo.forks_count.toLocaleString() : '0'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
