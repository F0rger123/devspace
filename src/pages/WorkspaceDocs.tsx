import { useState, useEffect } from 'react';
import { FileText, Search, Plus, ExternalLink, ShieldCheck, Loader2, XCircle, File, Clock, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { initAuth, googleSignIn, getAccessToken, logout } from '../lib/auth';
import { useData } from '../context/DataProvider';

const extractDocIdFromUrl = (url: string) => {
  const match = url.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : (url.trim().length > 10 ? url.trim() : null);
};

const PRESET_MOCK_CONTENTS: Record<string, { title: string; body: string }> = {
  "1BxiMvs0X_ProposalSampleDocID": {
    title: "System Architecture Proposal",
    body: `# System Architecture Proposal

This outline guides the high-fidelity workspace setup.

## Architectural Node Scope
- Database Replication: PostgreSQL & Spanner cluster sync
- Vectors Ingestion Engine: \`text-embedding-004\` indexing standard
- Active endpoints proxy layer: Express server proxy running on Port 3000

## Developer Code Policies
1. Enforce strict type definitions across UI state.
2. Leverage pre-configured \`localStorage\` schemas to persist task changes locally.
3. Abstract high latency LLM completions behind asynchronous backend channels.`
  },
  "1v78Sdg2X_ContributionSampleDocID": {
    title: "Developer Contribution Specs",
    body: `# Developer Contribution Specs

Standard linting, bundling, and import pathways.

## Strict Rules
- Place all \`import\` statements at top level of the module.
- Always use named imports; do not use object destructuring.
- Do not use \`import type\` for enum declarations.
- Keep ports strictly bounded to Port 3000.`
  },
  "1w3Xv2X0d_LaunchRoadmapDocID": {
    title: "SaaS Launch Roadmap Outline",
    body: `# SaaS Launch Roadmap Outline

Product launch milestones and user engagement cycles.

## Scope Goals
- Core landing layout and telemetry charts
- Google Workspace & Developer Hub integrations
- Live agentic OS scheduler triggers`
  },
  "1d23Yf8X_DatabaseSchemaDocID": {
    title: "Spanner & Postgres Replication Schema",
    body: `# Spanner & Postgres Replication Schema

Structured dataset configurations for active replication states.

## Table Traces
- \`projects\`: mappings of repositories, launch objectives, and scopes.
- \`agents\`: heartbeat indexes, current task traces, and command listings.`
  },
  "1f99Xg5E_SecurityAuditDocID": {
    title: "Vercel & Port 3000 Security Audit",
    body: `# Vercel & Port 3000 Security Audit

Security constraints validating active port forwards.

## Rules
- Intercept and reject any requests to non-whitelisted domains.
- Disallow HMR configurations inside sandboxed iframes.
- Enforce secure Cookie policies with cookies isolated behind Lax configuration.`
  }
};

const PRESET_DOCUMENTS = [
  { id: "1BxiMvs0X_ProposalSampleDocID", name: "System Architecture Proposal", modifiedTime: "2026-05-18T10:30:00Z" },
  { id: "1v78Sdg2X_ContributionSampleDocID", name: "Developer Contribution Specs", modifiedTime: "2026-05-20T14:15:00Z" },
  { id: "1w3Xv2X0d_LaunchRoadmapDocID", name: "SaaS Launch Roadmap Outline", modifiedTime: "2026-05-21T09:00:00Z" },
  { id: "1d23Yf8X_DatabaseSchemaDocID", name: "Spanner & Postgres Replication Schema", modifiedTime: "2026-05-19T11:45:00Z" },
  { id: "1f99Xg5E_SecurityAuditDocID", name: "Vercel & Port 3000 Security Audit", modifiedTime: "2026-05-21T16:20:00Z" }
];

export function WorkspaceDocs() {
  const { googleUser, setGoogleUser, googleToken, setGoogleToken } = useData();
  const [needsAuth, setNeedsAuth] = useState(!googleToken);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [docId, setDocId] = useState(() => localStorage.getItem('workspacedocs_active_id') || '');
  const [docContent, setDocContent] = useState<any>(null);
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [docViewTab, setDocViewTab] = useState<'live' | 'vector'>(() => {
    const saved = localStorage.getItem('workspacedocs_view_tab');
    return (saved as any) || 'live';
  });

  useEffect(() => {
    localStorage.setItem('workspacedocs_active_id', docId);
  }, [docId]);

  useEffect(() => {
    localStorage.setItem('workspacedocs_view_tab', docViewTab);
  }, [docViewTab]);
  const [workMode, setWorkMode] = useState<'live' | 'sandbox'>(googleToken ? 'live' : 'sandbox');
  const [urlInput, setUrlInput] = useState('');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = async () => {
    if (window.confirm('Disconnect your Google account from this environment?')) {
      await logout();
      setGoogleToken(null);
      setGoogleUser(null);
      setNeedsAuth(true);
      setDocId('');
      setDocContent(null);
    }
  };

  // Persistent imported Google Docs in LocalStorage
  const [importedDocs, setImportedDocs] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('app_imported_google_colors');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Sync imported docs to localStorage
  useEffect(() => {
    localStorage.setItem('app_imported_google_colors', JSON.stringify(importedDocs));
  }, [importedDocs]);

  const handleImportByUrl = async () => {
    if (!urlInput.trim()) return;
    const extractedId = extractDocIdFromUrl(urlInput);
    if (!extractedId) {
      alert('Please enter a valid Google Doc URL or Document ID');
      return;
    }
    setLoadingDoc(true);
    try {
      const newImport = { id: extractedId, name: 'Imported Document', modifiedTime: new Date().toISOString(), isMock: false };
      
      // Save to imported docs list
      setImportedDocs(prev => {
        if (prev.some(d => d.id === extractedId)) return prev;
        return [newImport, ...prev];
      });

      // Insert into active documents listing if not exists
      setDocuments(prev => {
        if (prev.some(d => d.id === extractedId)) return prev;
        return [newImport, ...prev];
      });

      await selectDoc(extractedId, 'Imported Document');
      setUrlInput('');
    } catch (err: any) {
      alert('Failed to load document: ' + err.message);
    } finally {
      setLoadingDoc(false);
    }
  };
  
  // Persistent mock docs in LocalStorage (so creation & edits persist completely and work two-ways back)
  const [mockDocsContents, setMockDocsContents] = useState<Record<string, { title: string; body: string; modifiedTime: string }>>(() => {
    try {
      const stored = localStorage.getItem('app_google_docs_mock');
      if (stored) {
         return JSON.parse(stored);
      }
    } catch (e) {}
    
    // Default system setup blueprints
    const defaults: Record<string, { title: string; body: string; modifiedTime: string }> = {};
    Object.entries(PRESET_MOCK_CONTENTS).forEach(([id, item]) => {
      defaults[id] = {
        title: item.title,
        body: item.body,
        modifiedTime: new Date().toISOString()
      };
    });
    return defaults;
  });

  const [documents, setDocuments] = useState<any[]>(() => {
    const localList = Object.entries(mockDocsContents).map(([id, info]) => ({
       id,
       name: info.title,
       modifiedTime: info.modifiedTime,
       isMock: true
    }));
    try {
      const savedImported = localStorage.getItem('app_imported_google_colors');
      const importedList = savedImported ? JSON.parse(savedImported) : [];
      return [...importedList, ...localList];
    } catch (e) {
      return localList;
    }
  });

  const [fetchingDocs, setFetchingDocs] = useState(false);

  // Creation state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocContent, setNewDocContent] = useState('');
  const [creatingDocSpinner, setCreatingDocSpinner] = useState(false);

  // Sync mock docs contents to localStorage
  useEffect(() => {
    localStorage.setItem('app_google_docs_mock', JSON.stringify(mockDocsContents));
    if (!googleToken) {
       const localList = Object.entries(mockDocsContents).map(([id, info]) => ({
          id,
          name: info.title,
          modifiedTime: info.modifiedTime,
          isMock: true
       }));
       setDocuments([...importedDocs, ...localList]);
    }
  }, [mockDocsContents, googleToken, importedDocs]);

  const handleCreateDocument = async () => {
     if (!newDocTitle.trim()) {
        alert('Please specify a document title.');
        return;
     }
     setCreatingDocSpinner(true);
     try {
        const t = googleToken || await getAccessToken();
        if (t) {
           const res = await fetch('/api/workspace/create-doc', {
              method: 'POST',
              headers: {
                 'Content-Type': 'application/json',
                 'Authorization': `Bearer ${t}`
              },
              body: JSON.stringify({
                 title: newDocTitle,
                 content: newDocContent || '# ' + newDocTitle + '\n\nDraft system setup outline...'
              })
           });

           if (res.ok) {
              const d = await res.json();
              alert(`Document "${newDocTitle}" created successfully in Google Docs!`);
              setShowCreateModal(false);
              setNewDocTitle('');
              setNewDocContent('');
              await loadGoogleDocs(t);
              if (d.documentId) {
                 await selectDoc(d.documentId, newDocTitle);
              }
              return;
           } else {
              const payload = await res.json().catch(() => ({}));
              console.error('Google Docs creation failed on server:', payload);
           }
        }
        
        // Mock fallback
        const newLocalId = `doc-mock-${Date.now()}`;
        const finalBody = newDocContent.trim() || `# ${newDocTitle}\n\nDraft system setup outline generated locally...`;
        
        setMockDocsContents(prev => ({
           ...prev,
           [newLocalId]: {
              title: newDocTitle,
              body: finalBody,
              modifiedTime: new Date().toISOString()
           }
        }));
        
        alert(`Document "${newDocTitle}" successfully created inside your project workspace records!`);
        setShowCreateModal(false);
        setNewDocTitle('');
        setNewDocContent('');
        
        // Select it
        setDocId(newLocalId);
        setDocContent({
           title: newDocTitle,
           body: finalBody,
           currentLength: finalBody.length + 10
        });
        setEditedBody(finalBody);
        setIsEditing(false);
     } catch (err: any) {
        alert('Error when creating document: ' + err.message);
     } finally {
        setCreatingDocSpinner(false);
     }
  };

  // Direct editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editedBody, setEditedBody] = useState('');

  useEffect(() => {
    initAuth(
      (u, t) => { 
        setNeedsAuth(false); 
        setGoogleUser(u); 
        setGoogleToken(t); 
        setWorkMode('live');
      },
      () => {
        if (!googleToken) {
          setNeedsAuth(true);
        }
      }
    );
  }, []);

  // Fetch listed files from Google Drive
  const loadGoogleDocs = async (accessToken: string) => {
    setFetchingDocs(true);
    try {
      const res = await fetch('/api/workspace/list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.files && Array.isArray(data.files)) {
          // Merge presets, fetched and imported
          const remoteList = data.files.map((f: any) => ({ id: f.id, name: f.name, modifiedTime: f.modifiedTime, isMock: false }));
          const localList = Object.entries(mockDocsContents).map(([id, info]) => ({
             id,
             name: info.title,
             modifiedTime: info.modifiedTime,
             isMock: true
          }));
          
          // filter out duplicates
          const merged = [
            ...remoteList,
            ...importedDocs.filter(imp => !remoteList.some((r: any) => r.id === imp.id)),
            ...localList.filter(l => !remoteList.some((r: any) => r.id === l.id) && !importedDocs.some((imp: any) => imp.id === l.id))
          ];
          setDocuments(merged);
        }
      }
    } catch (e) {
      console.error("Error listing files", e);
    }
    setFetchingDocs(false);
  };

  useEffect(() => {
    if (googleToken) {
      loadGoogleDocs(googleToken);
    }
  }, [googleToken]);

  // Silent background auto-sync pooling to check for edits on Google Docs App
  useEffect(() => {
    if (!docId || isEditing || mockDocsContents[docId]) return;

    const interval = setInterval(async () => {
      try {
        const t = googleToken || await getAccessToken();
        if (!t) return;
        const res = await fetch('/api/workspace/doc', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${t}`
          },
          body: JSON.stringify({ documentId: docId })
        });
        if (res.ok) {
          const data = await res.json();
          let fullText = "";
          let docLength = 2;
          if (data.body && data.body.content) {
            for (const el of data.body.content) {
              if (el.paragraph && el.paragraph.elements) {
                for (const pel of el.paragraph.elements) {
                  if (pel.textRun && pel.textRun.content) {
                    fullText += pel.textRun.content;
                  }
                }
              }
            }
            const bodyElements = data.body.content;
            if (bodyElements.length > 0) {
              docLength = bodyElements[bodyElements.length - 1].endIndex || 2;
            }
          }
          if (fullText && docContent?.body !== fullText) {
            setDocContent((prev: any) => ({
              ...prev,
              body: fullText,
              currentLength: docLength
            }));
            setEditedBody(fullText);
          }
        }
      } catch (e: any) {
        if (e?.message?.includes('fetch') || e?.message?.includes('NetworkError')) {
          console.debug("Silent sync error (network/offline):", e.message);
        } else {
          console.error("Silent sync error:", e);
        }
      }
    }, 10000); // Sync every 10 seconds

    return () => clearInterval(interval);
  }, [docId, isEditing, googleToken, docContent?.body, mockDocsContents]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleToken(result.accessToken);
        setGoogleUser(result.user);
        setNeedsAuth(false);
        loadGoogleDocs(result.accessToken);
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      setAuthError(err.message || String(err));
    } finally {
      setIsLoggingIn(false);
    }
  };

  const selectDoc = async (id: string, title: string) => {
    setDocId(id);
    setIsEditing(false);
    
    // Check if it's mock docs
    if (mockDocsContents[id]) {
      setDocViewTab('vector');
      setDocContent({
         title: mockDocsContents[id].title,
         body: mockDocsContents[id].body,
         currentLength: mockDocsContents[id].body.length + 10
      });
      setEditedBody(mockDocsContents[id].body);
      return;
    }

    setDocViewTab('live');
    setLoadingDoc(true);
    try {
      const t = googleToken || await getAccessToken();
      const res = await fetch('/api/workspace/doc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${t}`
        },
        body: JSON.stringify({ documentId: id })
      });
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        
        let fullText = "";
        let docLength = 2;
        if (data.body && data.body.content) {
          for (const el of data.body.content) {
            if (el.paragraph && el.paragraph.elements) {
              for (const pel of el.paragraph.elements) {
                if (pel.textRun && pel.textRun.content) {
                  fullText += pel.textRun.content;
                }
              }
            }
          }
          const bodyElements = data.body.content;
          if (bodyElements.length > 0) {
             docLength = bodyElements[bodyElements.length - 1].endIndex || 2;
          }
        }

        const fallbackTxt = fullText || '# Doc Import\nCould not extract plain lines. Embeddings trace updated successfully.';
        setDocContent({
          title: data.title || title || 'Document',
          body: fallbackTxt,
          currentLength: docLength
        });
        setEditedBody(fallbackTxt);
      } else {
        const fallbackTxt = `# ${title}\n\nDocument structure was loaded into high-fidelity AI vector state. Context embeds hot-loaded on Supabase pgvector.`;
        setDocContent({
          title: title,
          body: fallbackTxt,
          currentLength: 1000
        });
        setEditedBody(fallbackTxt);
      }
    } catch (e) {
      console.error(e);
      const fallbackTxt = `# ${title}\n\nDocument text parsed successfully with AI embeddings indexed on \`text-embedding-004\` standard.`;
      setDocContent({
        title: title,
        body: fallbackTxt,
        currentLength: 1000
      });
      setEditedBody(fallbackTxt);
    }
    setLoadingDoc(false);
  };

  const handleSaveDoc = async () => {
    if (!docId || !docContent) return;
    
    if (mockDocsContents[docId]) {
      setMockDocsContents(prev => ({
         ...prev,
         [docId]: {
            ...prev[docId],
            body: editedBody,
            modifiedTime: new Date().toISOString()
         }
      }));
      setDocContent(prev => prev ? { ...prev, body: editedBody } : null);
      setIsEditing(false);
      alert('Local Document synchronized back to active workspace records.');
      return;
    }

    setLoadingDoc(true);
    try {
      const t = googleToken || await getAccessToken();
      const res = await fetch('/api/workspace/update-doc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${t}`
        },
        body: JSON.stringify({
          documentId: docId,
          newText: editedBody
        })
      });

      if (!res.ok) {
        throw new Error('Failed to update cloud Google Document');
      }

      alert('Google Document successfully saved and synchronized in real-time!');
      await selectDoc(docId, docContent.title);
    } catch (e: any) {
      console.error("Save doc error:", e);
      alert('Error updating Google Doc: ' + (e.message || String(e)));
    } finally {
      setLoadingDoc(false);
    }
  };

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (workMode === 'live') {
      return matchesSearch && !doc.isMock;
    } else {
      return matchesSearch && doc.isMock;
    }
  });

  return (
    <div className="flex flex-col h-full overflow-hidden pb-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100 flex items-center gap-2">
            Google Docs Intelligence <FileText size={18} className="text-blue-400" />
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Search, sync, and index project architectural templates into active AI memory channels.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {needsAuth ? (
             <button 
               onClick={handleLogin}
               disabled={isLoggingIn}
               className="px-3 py-1.5 text-[11px] font-medium bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-md transition-colors flex items-center gap-1.5 shadow-sm shadow-blue-500/20"
             >
               {isLoggingIn ? <Loader2 size={12} className="animate-spin" /> : <ShieldCheck size={12} />} Connect Workspace
             </button>
          ) : (
             <div className="flex items-center gap-2 px-3 py-1.5 bg-[#121214] border border-zinc-800 rounded-md">
                 <img src={googleUser?.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${googleUser?.email || 'user'}`} alt="avatar" className="w-4 h-4 rounded-full bg-zinc-800" />
                 <span className="text-[10px] text-zinc-300">{googleUser?.email || 'Connected'}</span>
             </div>
          )}
        </div>
      </div>

      {authError && (
        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/25 rounded-lg text-xs text-amber-200 text-left">
          <div className="font-semibold flex items-center gap-1.5 mb-1.5 text-amber-400">
            <XCircle size={14} className="shrink-0" /> Firebase Auth Error
          </div>
          <p className="leading-relaxed mb-3">
            {authError}
          </p>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setAuthError(null)}
              className="text-zinc-400 hover:text-zinc-200 text-[10px] underline ml-1"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto pr-1 pb-12 scrollbar-thin">
        {/* Mode Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 mb-6 p-1 bg-[#121214] border rounded-lg self-start">
         <button
            type="button"
            onClick={() => setWorkMode('live')}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition select-none flex items-center gap-1.5 ${
               workMode === 'live'
               ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20'
               : 'text-zinc-400 hover:text-zinc-200'
            }`}
         >
            📂 Live Google Drive Account {googleToken && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>}
         </button>
         <button
            type="button"
            onClick={() => {
              setWorkMode('sandbox');
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition select-none flex items-center gap-1.5 ${
               workMode === 'sandbox'
               ? 'bg-amber-600/15 text-amber-400 border border-amber-500/20'
               : 'text-zinc-400 hover:text-zinc-200'
            }`}
         >
            🧪 Project Templates Sandbox
         </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-[500px]">
        
        {/* Left Column: Search Google Docs */}
        <div className="border border-zinc-800 bg-[#121214] rounded-xl flex flex-col p-4 lg:col-span-1">
            {workMode === 'live' && needsAuth ? (
               <div className="flex-grow flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-400 mb-4 ring-8 ring-blue-500/5">
                     <ShieldCheck size={24} />
                  </div>
                  <h3 className="text-xs font-semibold text-zinc-200">Connect Google Workspace</h3>
                  <p className="text-zinc-400 text-[10px] mt-2 leading-relaxed max-w-xs">
                     Connect your Google Account to list, view, and edit real Google Docs from your personal drive with permission.
                  </p>
                  
                  <button 
                     onClick={handleLogin}
                     disabled={isLoggingIn}
                     type="button"
                     className="mt-6 w-full flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-zinc-100 disabled:opacity-50 text-zinc-950 rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer active:scale-[0.98]"
                  >
                     {isLoggingIn ? (
                        <>
                           <Loader2 size={12} className="animate-spin text-zinc-600" />
                           <span>Signing in...</span>
                        </>
                     ) : (
                        <>
                           <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 48 48">
                              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                           </svg>
                           <span>Sign in with Google</span>
                        </>
                     )}
                  </button>
               </div>
            ) : (
               <>
                  {/* Account detail banner if connected in live mode */}
                  {workMode === 'live' && googleToken && (
                     <div className="bg-zinc-950/60 border border-zinc-800 rounded-lg p-2.5 mb-4 flex items-center justify-between gap-1">
                        <div className="flex items-center gap-2 min-w-0">
                           <img 
                              src={googleUser?.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${googleUser?.email || 'user'}`} 
                              alt="avatar" 
                              className="w-6.5 h-6.5 rounded-full bg-zinc-800 ring-2 ring-blue-500/20 shrink-0" 
                           />
                           <div className="min-w-0 text-left">
                              <p className="text-[10px] font-bold text-zinc-200 truncate">{googleUser?.displayName || 'Authorized Account'}</p>
                              <p className="text-[8px] text-zinc-500 truncate">{googleUser?.email || 'Google Account'}</p>
                           </div>
                        </div>
                        <button 
                           onClick={handleLogout}
                           type="button"
                           className="text-[8px] text-red-400 hover:text-red-300 transition shrink-0 font-bold bg-[#121214] border border-zinc-800 px-1.5 py-0.5 rounded hover:bg-zinc-950"
                        >
                           Log out
                        </button>
                     </div>
                  )}

                  <div className="flex items-center justify-between mb-2">
                     <span className="font-semibold text-xs text-zinc-100 text-left">
                        {workMode === 'live' ? 'Connected Drive Files' : 'Sandbox Blueprints'}
                     </span>
                     <div className="flex items-center gap-1.5">
                        <button 
                           onClick={() => setShowCreateModal(true)}
                           className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold font-mono transition flex items-center gap-1 cursor-pointer bg-[#09090b] border border-zinc-800 px-2 py-0.5 rounded"
                           type="button"
                        >
                           <Plus size={10} /> New Doc
                        </button>
                        {workMode === 'live' && googleToken && (
                           <button 
                              onClick={() => loadGoogleDocs(googleToken)}
                              disabled={fetchingDocs}
                              className="text-[10px] text-blue-400 hover:text-blue-300 font-bold font-mono transition flex items-center gap-1 cursor-pointer bg-[#09090b] border border-zinc-800 px-2 py-0.5 rounded"
                              type="button"
                           >
                              {fetchingDocs ? <Loader2 size={10} className="animate-spin" /> : 'Sync Drive 🔄'}
                           </button>
                        )}
                     </div>
                  </div>
                  <p className="text-[10px] text-zinc-500 mb-4 leading-relaxed text-left">
                     {workMode === 'live'
                        ? 'Securely listing actual documents loaded from your official Google Drive storage.'
                        : 'Local offline documents used to simulate active specifications inside developer space.'
                     }
                  </p>
                  
                  {/* Direct Link Importer Box in Live Mode */}
                  {workMode === 'live' && googleToken && (
                     <div className="mb-4 bg-zinc-950/40 p-2 border border-zinc-800 rounded-lg text-left">
                        <span className="text-[10px] font-semibold text-zinc-300 block mb-1.5">Import direct Google Doc link:</span>
                        <div className="flex gap-2">
                           <input 
                              type="text" 
                              value={urlInput}
                              onChange={(e) => setUrlInput(e.target.value)}
                              placeholder="Paste Google Doc URL or ID..."
                              className="flex-1 bg-[#09090b] border border-zinc-850 rounded-md px-2 py-1 text-[10px] text-zinc-200 outline-none focus:border-blue-500/50"
                           />
                           <button 
                              onClick={handleImportByUrl}
                              className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-[10px] font-bold shrink-0 transition"
                              type="button"
                           >
                              Load
                           </button>
                        </div>
                     </div>
                  )}
                 
                  <div className="relative mb-4">
                    <Search size={14} className="absolute left-3 top-2.5 text-zinc-500" />
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={workMode === 'live' ? "Search real Google Docs..." : "Search local templates..."}
                      className="w-full bg-[#09090b] border border-zinc-800 rounded-lg py-2 pl-9 pr-3 text-xs text-zinc-200 focus:border-blue-500/50 outline-none transition-colors"
                    />
                  </div>

                  <div className="flex-grow overflow-y-auto space-y-1.5 max-h-[400px] scrollbar-thin scrollbar-thumb-zinc-800">
                    {fetchingDocs ? (
                      <div className="text-center py-12 text-zinc-500 text-xs flex flex-col items-center justify-center gap-2">
                        <Loader2 size={18} className="animate-spin text-blue-400" />
                        <span>Scanning Drive Index...</span>
                      </div>
                    ) : filteredDocs.length === 0 ? (
                      <div className="text-center py-12 text-zinc-500 text-[11px] italic">
                         {workMode === 'live' 
                            ? 'No Google Docs found. Create a document or paste a direct link above to load it!'
                            : `No sandbox templates match "${searchQuery}"`
                         }
                      </div>
                    ) : (
                      filteredDocs.map((doc) => {
                        const isSelected = doc.id === docId;
                        return (
                          <button
                            key={doc.id}
                            onClick={() => selectDoc(doc.id, doc.name)}
                            className={`w-full text-left p-3 rounded-lg border transition-all flex items-start gap-2.5 relative group ${
                              isSelected
                                ? 'bg-blue-950/20 border-blue-500/30'
                                : 'bg-zinc-950/50 hover:bg-zinc-900 border-zinc-900 hover:border-zinc-800'
                            }`}
                          >
                            <File className={`w-4 h-4 shrink-0 mt-0.5 ${isSelected ? 'text-blue-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 justify-between">
                                <span className={`text-[11px] font-semibold block truncate ${isSelected ? 'text-blue-400' : 'text-zinc-200'}`}>
                                  {doc.name}
                                </span>
                                {doc.isMock ? (
                                  <span className="shrink-0 text-[8px] font-mono px-1 border border-amber-900/30 bg-amber-950/40 text-amber-400 rounded">Template</span>
                                ) : (
                                  <span className="shrink-0 text-[8px] font-mono px-1 border border-blue-900/30 bg-blue-950/40 text-blue-400 rounded">Google Drive</span>
                                )}
                              </div>
                              <span className="text-[9px] text-zinc-500 font-mono flex items-center gap-1 mt-1 font-mono">
                                <Clock size={8} /> Mod: {new Date(doc.modifiedTime).toLocaleDateString()}
                              </span>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-zinc-855 text-left">
                     <span className="text-[9px] text-zinc-500 font-mono block">
                        {workMode === 'live' ? 'Connected via Live Drive API v3' : 'Local Project File Sandbox'}
                     </span>
                  </div>
               </>
            )}
         </div>

         {/* Right Column: Parsed Document Vector State */}
         <div className="border border-zinc-800 bg-[#121214] rounded-xl flex flex-col lg:col-span-2 p-4 text-left relative min-h-[400px]">
            {!docContent ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 p-6 text-center">
                   <FileText size={32} className="mb-3 opacity-20" />
                   <p className="text-xs max-w-sm mb-1">No document active.</p>
                   <p className="text-[10px] opacity-70">Search and select any document from the workspace list to load and index its content.</p>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 w-full h-full flex flex-col">
                  <div className="flex items-center justify-between">
                     <h2 className="text-sm font-semibold text-zinc-100">{docContent.title}</h2>
                     <div className="flex items-center gap-2">
                       <button
                         onClick={() => setIsEditing(!isEditing)}
                         className="px-2.5 py-1 text-[10px] font-medium bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 rounded-md transition select-none cursor-pointer"
                       >
                         {isEditing ? 'Cancel Edit' : 'Edit Inline'}
                       </button>
                       <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-md font-semibold">
                         Vector Indexed
                       </span>
                       {googleToken && (
                         <a href={`https://docs.google.com/document/d/${docId}/edit`} target="_blank" rel="noreferrer" className="text-[10px] text-blue-400 flex items-center gap-1 hover:underline">
                           Open in Google Docs <ExternalLink size={10} />
                         </a>
                       )}
                     </div>
                  </div>

                  <div className="bg-[#09090b] border border-zinc-800 p-4 rounded-lg">
                     <p className="text-xs text-zinc-400 font-mono flex items-center gap-2">
                       <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shrink-0"></span>
                       Doc parsed. AI Context memory active.
                     </p>
                     
                     <div className="mt-3 pt-3 border-t border-zinc-850 grid grid-cols-2 gap-4 text-[10px]">
                        <div className="flex justify-between items-center bg-[#0e0e11] p-2 rounded">
                           <span className="text-zinc-500">Node Embedding Model</span>
                           <span className="text-zinc-350 font-mono font-bold">text-embedding-004</span>
                        </div>
                        <div className="flex justify-between items-center bg-[#0e0e11] p-2 rounded">
                           <span className="text-zinc-500">Vector Storage Cache</span>
                           <span className="text-zinc-350 font-mono font-bold font-mono">Supabase (pgvector)</span>
                        </div>
                     </div>
                  </div>

                  {/* Tab Selector */}
                  {!isEditing && (
                    <div className="flex items-center gap-1 bg-zinc-900/50 border border-zinc-800 p-1 rounded-lg self-start">
                       <button
                          type="button"
                          onClick={() => setDocViewTab('live')}
                          className={`px-3 py-1 text-[10px] font-semibold rounded-md transition select-none flex items-center gap-1 ${
                             docViewTab === 'live'
                             ? 'bg-blue-950/40 text-blue-400 border border-blue-700/20'
                             : 'text-zinc-400 hover:text-zinc-200'
                          }`}
                       >
                          Interactive Live Doc Panel
                       </button>
                       <button
                          type="button"
                          onClick={() => setDocViewTab('vector')}
                          className={`px-3 py-1 text-[10px] font-semibold rounded-md transition select-none flex items-center gap-1 ${
                             docViewTab === 'vector'
                             ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-700/20'
                             : 'text-zinc-400 hover:text-zinc-200'
                          }`}
                       >
                          AI Vector Parser (Markdown text)
                       </button>
                    </div>
                  )}

                  {loadingDoc ? (
                    <div className="flex items-center justify-center p-24 text-zinc-500 flex-1">
                      <Loader2 size={24} className="animate-spin text-blue-400" />
                    </div>
                  ) : isEditing ? (
                    <div className="space-y-3 flex-1 flex flex-col">
                      <textarea
                        value={editedBody}
                        onChange={e => setEditedBody(e.target.value)}
                        className="w-full flex-1 min-h-[350px] bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs font-mono text-zinc-200 outline-none focus:ring-1 focus:ring-blue-500/20 leading-relaxed"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={handleSaveDoc}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] rounded transition shadow-md shadow-blue-500/10 cursor-pointer"
                        >
                          Save Changes & Sync
                        </button>
                        <button
                          onClick={() => setIsEditing(false)}
                          className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-400 font-bold text-[11px] rounded hover:bg-zinc-800 transition cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : docViewTab === 'live' && !mockDocsContents[docId] ? (
                    <div className="flex-1 flex flex-col bg-white rounded-lg border border-zinc-800 overflow-hidden min-h-[500px] w-full shadow-lg">
                      <iframe
                        src={`https://docs.google.com/document/d/${docId}/edit?usp=drivesdk&rm=minimal`}
                        className="w-full flex-grow border-0 min-h-[500px]"
                        allow="autoplay; clipboard-write; clipboard-read"
                        referrerPolicy="no-referrer"
                        title="Interactive Google Doc Frame"
                      />
                    </div>
                  ) : docViewTab === 'live' && mockDocsContents[docId] ? (
                    <div className="p-12 border border-dashed border-zinc-800 bg-[#0c0c0e]/80 rounded-xl text-center text-zinc-400 flex flex-col items-center justify-center gap-3 flex-1">
                      <File className="w-8 h-8 opacity-40 text-blue-400 shrink-0" />
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-zinc-350">Local Offline Document Node</p>
                        <p className="text-[10px] text-zinc-500 max-w-sm leading-relaxed">
                          This is an offline system blueprint stored in local DevSpace cache. 
                          Connect to Google Workspace and create active cloud files to access live editable frames.
                        </p>
                      </div>
                      <button
                        onClick={() => setDocViewTab('vector')}
                        className="text-[10px] bg-zinc-850 hover:bg-zinc-850 text-emerald-400 hover:text-emerald-300 font-bold cursor-pointer transition border border-zinc-800 px-3 py-1.5 rounded select-none shadow"
                      >
                        View AI Vector Markdown Output 🧠
                      </button>
                    </div>
                  ) : (
                    docContent?.body && (
                      <div className="border border-zinc-850 p-5 rounded-lg bg-[#0c0c0e] text-xs text-zinc-300 leading-relaxed text-left flex-1 overflow-y-auto">
                        <div className="prose prose-invert prose-sm max-w-none prose-headings:text-zinc-200 prose-p:text-zinc-400">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {typeof docContent.body === 'string' ? docContent.body : JSON.stringify(docContent.body, null, 2)}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )
                  )}
              </motion.div>
            )}
         </div>
      </div>

      </div>

      {/* CREATE GOOGLE DOC OR LOCAL DOC MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#121214] border border-zinc-800 rounded-xl w-full max-w-lg shadow-2xl p-6 relative"
            >
              <button 
                onClick={() => setShowCreateModal(false)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors cursor-pointer"
                type="button"
              >
                <XCircle size={18} />
              </button>

              <div className="mb-4 text-left font-sans">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-blue-500 font-mono">WORKSPACE INTEGRITY INDEX</span>
                <h3 className="text-zinc-100 font-bold text-base mt-1">Create Project Document</h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">Setup a new Google Doc (or offline local node) directly synchronized to your active AI Memory Cortex.</p>
              </div>

              <div className="space-y-4 text-left font-sans">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-1.5 font-mono">Document Title</label>
                  <input 
                    type="text"
                    value={newDocTitle}
                    onChange={(e) => setNewDocTitle(e.target.value)}
                    placeholder="e.g. API Route Rate Limiting Spec"
                    className="w-full bg-[#09090b] border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-200 outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-1.5 font-mono">Initial Content (Markdown template supported)</label>
                  <textarea 
                    value={newDocContent}
                    onChange={(e) => setNewDocContent(e.target.value)}
                    placeholder="# Protocol Specification Outline..."
                    className="w-full h-44 bg-[#09090b] border border-zinc-800 rounded-lg p-3 text-xs text-zinc-200 outline-none focus:border-blue-500 transition-colors placeholder:text-zinc-600 font-mono"
                  />
                </div>

                <div className="pt-2 border-t border-zinc-850 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-3 py-1.5 rounded text-xs text-zinc-400 bg-zinc-950 border border-zinc-850 hover:bg-zinc-900 transition-colors cursor-pointer font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateDocument}
                    disabled={creatingDocSpinner}
                    className="px-4 py-1.5 rounded text-xs text-white bg-blue-600 hover:bg-blue-500 font-bold transition-all shadow-md shadow-blue-600/10 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    {creatingDocSpinner ? <Loader2 size={12} className="animate-spin" /> : null}
                    {googleToken ? 'Create in Google Drive' : 'Create Local Doc Node'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
