import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Project = {
  id: string;
  name: string;
  description: string;
  frameworks?: string[];
  githubRepos?: string[]; // Switched to array to support multiple linked repos
  apiConnections?: { name: string, keyPrefix?: string }[];
  launchTarget?: string; // YYYY-MM-DD
  sprints?: { id: string, name: string, startDate?: string, endDate?: string }[];
  status: 'Active' | 'Paused' | 'Completed' | 'Planning';
  createdAt: number;
  websiteUrl?: string;
  featuresCount?: number;         // e.g. 50
  totalFeaturesCount?: number;    // e.g. 76
  progressPercent?: number;       // e.g. 80
  daysUntilAddition?: number;    // e.g. 30 until a new release
  customStack?: string[];         // dynamic tech stack tags
  seenRecommendedIdeas?: string[]; // to prevent duplicating AI recommendations
  brainstormIdeas?: {             // child brainstorm ideas
    id: string;
    text: string;
    details?: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: number;
  }[];
};

export type Issue = {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  type: 'Task' | 'Bug' | 'Feature';
  status: 'Todo' | 'In Progress' | 'Done';
  phaseId?: string; // High-level Phase mapping
  sprintId?: string; // Sprint mapping
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  githubIssueNumber?: number;
  labels?: string[];
  assignee?: string;
  storyPoints?: number;
  dueDate?: string; // YYYY-MM-DD
  recurrenceRule?: 'Daily' | 'Weekly' | 'Monthly'; 
  dependencyIds?: string[]; // IDs of other issues blocking this one
  bugEnvironment?: string; // e.g. "Production - iOS 15.1"
  crashLogs?: string; // log stacktraces
  createdAt: number;
};

export type Phase = {
  id: string;
  projectId: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  color: string;
  goal?: string;
};

export type Note = {
  id: string;
  projectId: string;
  title: string;
  content: string; // Markdown
  tags?: string[];
  createdAt: number;
  updatedAt: number;
};

export type Asset = {
  id: string;
  projectId: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string; // Base64 data
  createdAt: number;
};

type DataContextType = {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  addProject: (p: Omit<Project, 'id' | 'createdAt'>) => string;
  updateProject: (id: string, p: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  issues: Issue[];
  setIssues: React.Dispatch<React.SetStateAction<Issue[]>>;
  addIssue: (i: Omit<Issue, 'id' | 'createdAt'>) => void;
  updateIssue: (id: string, i: Partial<Issue>) => void;
  deleteIssue: (id: string) => void;

  phases: Phase[];
  setPhases: React.Dispatch<React.SetStateAction<Phase[]>>;
  addPhase: (p: Omit<Phase, 'id'>) => void;
  updatePhase: (id: string, p: Partial<Phase>) => void;
  deletePhase: (id: string) => void;

  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  addNote: (n: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateNote: (id: string, n: Partial<Note>) => void;
  deleteNote: (id: string) => void;

  assets: Asset[];
  setAssets: React.Dispatch<React.SetStateAction<Asset[]>>;
  addAsset: (a: Omit<Asset, 'id' | 'createdAt'>) => void;
  deleteAsset: (id: string) => void;

  activeProjectId: string | null;
  setActiveProjectId: React.Dispatch<React.SetStateAction<string | null>>;

  aiContextRules: string;
  setAiContextRules: React.Dispatch<React.SetStateAction<string>>;

  githubUser: string;
  setGithubUser: React.Dispatch<React.SetStateAction<string>>;

  googleUser: any;
  setGoogleUser: React.Dispatch<React.SetStateAction<any>>;
  googleToken: string | null;
  setGoogleToken: React.Dispatch<React.SetStateAction<string | null>>;
  githubToken: string | null;
  setGithubToken: React.Dispatch<React.SetStateAction<string | null>>;
  githubProfile: any;
  setGithubProfile: React.Dispatch<React.SetStateAction<any>>;
  githubRepo: string | null;
  setGithubRepo: React.Dispatch<React.SetStateAction<string | null>>;
  aiPersona: string;
  setAiPersona: React.Dispatch<React.SetStateAction<string>>;
};

const DataContext = createContext<DataContextType | null>(null);

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}

const getStored = <T,>(key: string, defaultVal: T): T => {
  try {
    const item = window.localStorage.getItem(key);
    if (!item) return defaultVal;
    try {
      return JSON.parse(item) as T;
    } catch {
      return item as unknown as T;
    }
  } catch (error) {
    return defaultVal;
  }
};

const setStored = <T,>(key: string, val: T) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(val));
  } catch (error) {}
};

export function DataProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(() => {
    const list = getStored<Project[]>('app_projects', []);
    if (list.length === 0) {
      const defaultProjects: Project[] = [
        {
          id: 'spacestation-sync',
          name: 'Space Station Sync',
          description: 'A responsive administrative dashboard for lunar space coordinate telemetry.',
          status: 'Active',
          createdAt: Date.now() - 10 * 24 * 3600 * 1000,
          frameworks: ['React', 'TypeScript', 'Tailwind CSS'],
          githubRepos: ['google/genai-js'],
          websiteUrl: 'https://spacestation.example.com',
          featuresCount: 50,
          totalFeaturesCount: 76,
          progressPercent: 80,
          daysUntilAddition: 30,
          customStack: ['React', 'TypeScript', 'Tailwind', 'Recharts'],
          brainstormIdeas: [
            { id: '1', text: 'Integrate live solar flare warnings', details: 'Triggers mobile alerts when magnetic activity rises above baseline.', status: 'approved', createdAt: Date.now() },
            { id: '2', text: 'Dynamic telemetry charting', details: 'Use D3 to draw real-time interactive orbital vectors.', status: 'pending', createdAt: Date.now() }
          ],
          seenRecommendedIdeas: []
        },
        {
          id: 'brainstorm-sandbox',
          name: 'Brainstorm Sandbox',
          description: 'A creative sandbox for holding emerging app ideas, user pitches, and agent suggestions.',
          status: 'Planning',
          createdAt: Date.now() - 20 * 24 * 3600 * 1000,
          frameworks: ['Brainstorming'],
          websiteUrl: '',
          featuresCount: 5,
          totalFeaturesCount: 20,
          progressPercent: 25,
          daysUntilAddition: 10,
          customStack: ['Gemini LLM', 'Voice Dictation'],
          brainstormIdeas: [
            { id: 'idea-1', text: 'Infinite Writer Co-pilot', details: 'Text-editor that triggers mild haptics or red glows when you pause typing for 30 seconds.', status: 'approved', createdAt: Date.now() },
            { id: 'idea-2', text: 'SaaS Billing Tracker for Indie Hackers', details: 'A visual terminal dashboard showing micro-MRI subscriptions.', status: 'pending', createdAt: Date.now() }
          ],
          seenRecommendedIdeas: []
        }
      ];
      return defaultProjects;
    }
    return list;
  });
  const [issues, setIssues] = useState<Issue[]>(() => getStored('app_issues', []));
  const [phases, setPhases] = useState<Phase[]>(() => getStored('app_phases', []));
  const [notes, setNotes] = useState<Note[]>(() => getStored('app_notes', []));
  const [assets, setAssets] = useState<Asset[]>(() => getStored('app_assets', []));
  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => getStored('app_active_project', null));
  const [aiContextRules, setAiContextRules] = useState<string>(() => getStored('app_ai_context', ''));
  const [githubUser, setGithubUser] = useState<string>(() => getStored('app_github_user', 'google'));

  const [googleUser, setGoogleUser] = useState<any>(() => getStored('app_google_user', null));
  const [googleToken, setGoogleToken] = useState<string | null>(() => getStored('app_google_token', null));
  const [githubToken, setGithubToken] = useState<string | null>(() => getStored('app_github_token', null));
  const [githubProfile, setGithubProfile] = useState<any>(() => getStored('app_github_profile', null));
  const [githubRepo, setGithubRepo] = useState<string | null>(() => getStored('app_last_github_repo', null));
  const [aiPersona, setAiPersona] = useState<string>(() => getStored('app_ai_persona', 'Scrum Master'));

  useEffect(() => { setStored('app_projects', projects); }, [projects]);
  useEffect(() => { setStored('app_issues', issues); }, [issues]);
  useEffect(() => { setStored('app_phases', phases); }, [phases]);
  useEffect(() => { setStored('app_notes', notes); }, [notes]);
  useEffect(() => { setStored('app_assets', assets); }, [assets]);
  useEffect(() => { setStored('app_active_project', activeProjectId); }, [activeProjectId]);
  useEffect(() => { setStored('app_ai_context', aiContextRules); }, [aiContextRules]);
  useEffect(() => { setStored('app_github_user', githubUser); }, [githubUser]);

  useEffect(() => { setStored('app_google_user', googleUser); }, [googleUser]);
  useEffect(() => { setStored('app_google_token', googleToken); }, [googleToken]);
  useEffect(() => { setStored('app_github_token', githubToken); }, [githubToken]);
  useEffect(() => { setStored('app_github_profile', githubProfile); }, [githubProfile]);
  useEffect(() => { setStored('app_last_github_repo', githubRepo); }, [githubRepo]);
  useEffect(() => { setStored('app_ai_persona', aiPersona); }, [aiPersona]);

  const addProject = (p: Omit<Project, 'id' | 'createdAt'>): string => {
    const id = crypto.randomUUID();
    setProjects(prev => [...prev, { ...p, id, createdAt: Date.now() }]);
    return id;
  };
  const updateProject = (id: string, p: Partial<Project>) => {
    setProjects(prev => prev.map(proj => proj.id === id ? { ...proj, ...p } : proj));
  };
  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(proj => proj.id !== id));
    setIssues(prev => prev.filter(i => i.projectId !== id));
    setPhases(prev => prev.filter(p => p.projectId !== id));
    setNotes(prev => prev.filter(n => n.projectId !== id));
    setAssets(prev => prev.filter(a => a.projectId !== id));
    if (activeProjectId === id) setActiveProjectId(null);
  };

  const addIssue = (i: Omit<Issue, 'id' | 'createdAt'>) => {
    setIssues(prev => [...prev, { ...i, id: crypto.randomUUID(), createdAt: Date.now() }]);
  };
  const updateIssue = (id: string, i: Partial<Issue>) => {
    setIssues(prev => prev.map(iss => iss.id === id ? { ...iss, ...i } : iss));
  };
  const deleteIssue = (id: string) => {
    setIssues(prev => prev.filter(iss => iss.id !== id));
  };

  const addPhase = (p: Omit<Phase, 'id'>) => {
    setPhases(prev => [...prev, { ...p, id: crypto.randomUUID() }]);
  };
  const updatePhase = (id: string, p: Partial<Phase>) => {
    setPhases(prev => prev.map(ph => ph.id === id ? { ...ph, ...p } : ph));
  };
  const deletePhase = (id: string) => {
    setPhases(prev => prev.filter(ph => ph.id !== id));
  };

  const addNote = (n: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = Date.now();
    setNotes(prev => [...prev, { ...n, id: crypto.randomUUID(), createdAt: now, updatedAt: now }]);
  };
  const updateNote = (id: string, n: Partial<Note>) => {
    setNotes(prev => prev.map(note => note.id === id ? { ...note, ...n, updatedAt: Date.now() } : note));
  };
  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(note => note.id !== id));
  };

  const addAsset = (a: Omit<Asset, 'id' | 'createdAt'>) => {
    setAssets(prev => [...prev, { ...a, id: crypto.randomUUID(), createdAt: Date.now() }]);
  };
  const deleteAsset = (id: string) => {
    setAssets(prev => prev.filter(asset => asset.id !== id));
  };

  return (
    <DataContext.Provider value={{
      projects, setProjects, addProject, updateProject, deleteProject,
      issues, setIssues, addIssue, updateIssue, deleteIssue,
      phases, setPhases, addPhase, updatePhase, deletePhase,
      notes, setNotes, addNote, updateNote, deleteNote,
      assets, setAssets, addAsset, deleteAsset,
      activeProjectId, setActiveProjectId,
      aiContextRules, setAiContextRules,
      githubUser, setGithubUser,
      googleUser, setGoogleUser,
      googleToken, setGoogleToken,
      githubToken, setGithubToken,
      githubProfile, setGithubProfile,
      githubRepo, setGithubRepo,
      aiPersona, setAiPersona
    }}>
      {children}
    </DataContext.Provider>
  );
}
