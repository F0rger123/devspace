import React, { useState, useEffect } from "react";
import { githubSignIn } from "../lib/auth";
import { useData } from "../context/DataProvider";
import {
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  Globe,
  Sparkles,
  Database,
  Code2,
  Shield,
  Server,
  Link,
  Plus,
  FolderGit2,
  Github,
  Sparkle,
  Loader2,
  Rocket,
  ArrowRight,
  Search
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ProjectStepperProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => void;
  githubToken: string | null;
  githubUser: string | null;
  githubReposList: any[];
  setGithubReposList: React.Dispatch<React.SetStateAction<any[]>>;
  loadingRepos: boolean;
  onFetchRepos?: () => void;
}

export function ProjectStepper({
  isOpen,
  onClose,
  onSubmit,
  githubToken,
  githubUser,
  githubReposList,
  setGithubReposList,
  loadingRepos,
  onFetchRepos
}: ProjectStepperProps) {
  const context = useData();
  const activeToken = githubToken || context.githubToken;
  const activeUser = githubUser || context.githubUser;
  
  const setGithubToken = context.setGithubToken;
  const setGithubUser = context.setGithubUser;
  const setGithubProfile = context.setGithubProfile;

  const [currentStep, setCurrentStep] = useState(1);
  
  // Form State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    frameworks: "React, Next.js, Tailwind", // default
    githubRepos: "",
    apiConnections: "",
    sprints: "Sprint 1, Sprint 2, Polish", // default to MVP
    launchTarget: "Vercel", // default
    status: "Active" as any,
  });

  // Repository states
  const [gitLinkOption, setGitLinkOption] = useState<"link" | "create" | "none">("none");
  const [repoCreationName, setRepoCreationName] = useState("");
  const [repoCreationDesc, setRepoCreationDesc] = useState("");
  const [repoIsPrivate, setRepoIsPrivate] = useState(false);
  const [creatingRepo, setCreatingRepo] = useState(false);
  const [repoCreatedSuccess, setRepoCreatedSuccess] = useState<string | null>(null);
  const [repoSearchQuery, setRepoSearchQuery] = useState("");

  // Auto-fetch repos when the modal opens or when currentStep is on linking step
  useEffect(() => {
    if (isOpen && currentStep === 2 && onFetchRepos) {
      onFetchRepos();
    }
  }, [isOpen, currentStep]);

  // Sync default repo creation name when project name changes
  useEffect(() => {
    if (formData.name && !repoCreationName) {
      const normalized = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      setRepoCreationName(normalized);
      setRepoCreationDesc(`DevSpace repo for ${formData.name}`);
    }
  }, [formData.name]);

  if (!isOpen) return null;

  // AI Semantic Match Recommendation Logic
  const getRecommendedRepo = (projectName: string, repos: any[]) => {
    if (!projectName || !repos || repos.length === 0) return null;
    const pNameClean = projectName.toLowerCase().replace(/[^a-z0-9]/g, "");
    let bestRepo = null;
    let highestScore = 0;

    repos.forEach((repo) => {
      let score = 0;
      const rNameClean = repo.name.toLowerCase().replace(/[^a-z0-9]/g, "");
      const rFullNameClean = repo.full_name.toLowerCase().replace(/[^a-z0-9]/g, "");
      const descLower = (repo.description || "").toLowerCase();

      // Overlap checks
      if (rNameClean === pNameClean) {
        score += 15;
      } else if (rNameClean.includes(pNameClean) || pNameClean.includes(rNameClean)) {
        score += 8;
      }

      if (rFullNameClean.includes(pNameClean)) {
        score += 5;
      }

      // Semantic keyword matches
      const keywords = pNameClean.split(/(?=[A-Z])|[-_\s]/);
      keywords.forEach((word) => {
        if (word && word.length > 2) {
          if (rNameClean.includes(word)) score += 3;
          if (descLower.includes(word)) score += 2;
        }
      });

      if (score > highestScore) {
        highestScore = score;
        bestRepo = repo;
      }
    });

    return highestScore >= 6 ? bestRepo : null;
  };

  const recommendedRepo = getRecommendedRepo(formData.name, githubReposList);

  // Handle repository creation submit
  const handleCreateRepoSubmit = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!repoCreationName.trim()) return;
    setCreatingRepo(true);
    setRepoCreatedSuccess(null);
    try {
      const res = await fetch("/api/github/create-repo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: repoCreationName,
          description: repoCreationDesc,
          isPrivate: repoIsPrivate,
          token: activeToken,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create remote repository on GitHub.");
      }

      const data = await res.json();
      if (data.success) {
        const newRepoItem = {
          id: `new-repo-${Date.now()}`,
          name: repoCreationName,
          full_name: data.fullName,
          description: repoCreationDesc || "Created by AgenticOS Devspace",
          private: repoIsPrivate,
          owner: { login: data.owner || activeUser || "github-user" },
        };
        // Prepend to parent synced list
        setGithubReposList((prev) => [newRepoItem, ...prev]);
        setFormData((prev) => ({ ...prev, githubRepos: data.fullName }));
        setRepoCreatedSuccess(`Repository "${data.fullName}" successfully created!`);
        // Switch to link mode automatically
        setTimeout(() => {
          setGitLinkOption("link");
        }, 1200);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
    setCreatingRepo(false);
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    
    // Construct finalized fields formatted for project model schema
    const submissionData = {
      name: formData.name,
      description: formData.description,
      frameworks: formData.frameworks
        ? formData.frameworks.split(",").map((f) => f.trim()).filter((f) => f)
        : undefined,
      githubRepos: formData.githubRepos
        ? formData.githubRepos.split(",").map((f) => f.trim()).filter((f) => f)
        : undefined,
      apiConnections: formData.apiConnections
        ? formData.apiConnections.split(",").map((f) => ({ name: f.trim() })).filter((f) => f.name)
        : undefined,
      sprints: formData.sprints
        ? formData.sprints.split(",").map((s) => ({
            id: s.trim().toLowerCase().replace(/\s+/g, "-"),
            name: s.trim(),
          })).filter((s) => s.name)
        : undefined,
      launchTarget: formData.launchTarget || undefined,
      status: formData.status || "Active",
    };

    onSubmit(submissionData);
    
    // Reset state
    setCurrentStep(1);
    setFormData({
      name: "",
      description: "",
      frameworks: "React, Next.js, Tailwind",
      githubRepos: "",
      apiConnections: "",
      sprints: "Sprint 1, Sprint 2, Polish",
      launchTarget: "Vercel",
      status: "Active",
    });
    setGitLinkOption("none");
    setRepoCreationName("");
    setRepoCreationDesc("");
    setRepoIsPrivate(false);
  };

  // Filter repos based on search query
  const filteredRepos = githubReposList.filter((repo) =>
    repo.full_name.toLowerCase().includes(repoSearchQuery.toLowerCase()) ||
    (repo.description && repo.description.toLowerCase().includes(repoSearchQuery.toLowerCase()))
  );

  const stepsList = [
    { num: 1, title: "Identity", subtitle: "Name & Blueprint Presets" },
    { num: 2, title: "GitHub Link", subtitle: "Optional Repo Sync" },
    { num: 3, title: "Setup Stack", subtitle: "Framework & Core APIs" },
    { num: 4, title: "Mechanics", subtitle: "Sprints & Target Launch" },
  ];

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#0b0b0d] border border-zinc-800/80 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-zinc-800/50 shrink-0">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-blue-400 font-extrabold bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
              Guided Wizard — Step {currentStep} of 4
            </span>
            <h2 className="text-lg font-bold text-zinc-100 mt-2 flex items-center gap-2">
              <Rocket className="text-blue-500" size={18} />
              {currentStep === 1 && "Define Project Identity & Concept"}
              {currentStep === 2 && "Optional Remote GitHub Integration"}
              {currentStep === 3 && "Configure Tech Stack & API Matrix"}
              {currentStep === 4 && "Set Sprint Mechanics & Goals"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-zinc-900 border border-transparent hover:border-zinc-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Visual Progress Stepper (Timeline) */}
        <div className="bg-[#121215]/50 px-6 py-4 border-b border-zinc-850 shrink-0 flex items-center justify-between gap-2 overflow-x-auto custom-scrollbar">
          {stepsList.map((st, idx) => {
            const isCompleted = currentStep > st.num;
            const isActive = currentStep === st.num;
            return (
              <React.Fragment key={st.num}>
                <div 
                  className="flex items-center gap-3 cursor-pointer min-w-[120px]"
                  onClick={() => {
                    // Only allow clicking already visited or next step if name is filled
                    if (formData.name || st.num === 1) {
                      setCurrentStep(st.num);
                    }
                  }}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition-all duration-300 ${
                      isCompleted
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                        : isActive
                        ? "bg-blue-600/20 border-blue-500 text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.3)]"
                        : "bg-zinc-900 border-zinc-800 text-zinc-500"
                    }`}
                  >
                    {isCompleted ? <Check size={12} /> : st.num}
                  </div>
                  <div className="text-left">
                    <p className={`text-[11px] font-bold tracking-wide ${isActive ? "text-zinc-200" : isCompleted ? "text-emerald-400" : "text-zinc-500"}`}>
                      {st.title}
                    </p>
                    <p className="text-[9px] text-zinc-500 font-medium line-clamp-1">
                      {st.subtitle}
                    </p>
                  </div>
                </div>
                {idx < stepsList.length - 1 && (
                  <div className={`h-[2px] flex-grow min-w-[20px] max-w-[40px] rounded ${isCompleted ? "bg-emerald-500/50" : "bg-zinc-800"}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Step Body Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1 min-h-0 bg-[#0e0e11]/30">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.18 }}
                className="space-y-4"
              >
                
                {/* STEP 1: IDENTITY & BLUEPRINT PRESETS */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-400 mb-2 uppercase tracking-widest flex items-center gap-1">
                        <Sparkles size={11} className="text-blue-400" /> Choose a Project Blueprint Concept (Optional Preset)
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {[
                          {
                            name: "SaaS Booster",
                            desc: "Comprehensive SaaS billing, database stack, and dashboard metrics.",
                            icon: Globe,
                            color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
                            pName: "SaaS Booster Platform",
                            pDesc: "Modern multi-tenant SaaS application featuring subscription frameworks, secure database schemas, and performance dashboards.",
                          },
                          {
                            name: "AI Companion",
                            desc: "Intelligent companion utilizing custom prompt setups and brainstorming rules.",
                            icon: Sparkles,
                            color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
                            pName: "AI Companion Engine",
                            pDesc: "Advanced Conversational Generative AI companion with custom agent loops, context buffers, and system rule sets.",
                          },
                          {
                            name: "E-Commerce",
                            desc: "Instant checkout-ready webstore powered by secure payment gateways.",
                            icon: Database,
                            color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
                            pName: "E-Commerce Storefront",
                            pDesc: "Ultra-fast digital storefront with interactive cart modules, secure Stripe payment pathways, and local inventory caching.",
                          },
                          {
                            name: "Dev Portfolio",
                            desc: "Premium personal showcase highlighting case files and blog nodes.",
                            icon: Code2,
                            color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
                            pName: "Developer Case Log Portfolio",
                            pDesc: "Highly interactive developer portfolio showcasing timeline case files, sandbox experiments, and system documentation nodes.",
                          },
                        ].map((preset) => {
                          const isSelected = formData.name === preset.pName;
                          return (
                            <button
                              key={preset.name}
                              type="button"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  name: preset.pName,
                                  description: preset.pDesc,
                                })
                              }
                              className={`text-left p-3.5 rounded-xl border transition-all duration-200 flex flex-col justify-between h-28 hover:scale-[1.01] active:scale-[0.99] cursor-pointer ${
                                isSelected
                                  ? "border-blue-500 bg-blue-500/10 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                                  : "border-zinc-800/80 bg-zinc-900/60 hover:bg-zinc-850 hover:border-zinc-750 text-zinc-300"
                              }`}
                            >
                              <div className="flex items-center gap-2 font-bold text-xs text-zinc-150">
                                <div className={`p-1.5 rounded-lg border ${preset.color}`}>
                                  <preset.icon size={13} />
                                </div>
                                {preset.name}
                              </div>
                              <p className="text-[10px] text-zinc-400 line-clamp-2 mt-2 leading-relaxed">
                                {preset.desc}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="border-t border-zinc-800/40 pt-4 space-y-4">
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">
                          Project Title <span className="text-red-500">*</span>
                        </label>
                        <input
                          autoFocus
                          required
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          className="w-full bg-zinc-900/80 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm text-zinc-200 outline-none focus:border-blue-500 transition-colors placeholder:text-zinc-600 focus:bg-zinc-900 font-sans"
                          placeholder="e.g. Hyperion Dashboard"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">
                          Objective / Description
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              description: e.target.value,
                            })
                          }
                          className="w-full bg-zinc-900/80 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm text-zinc-200 outline-none focus:border-blue-500 transition-colors resize-none h-24 placeholder:text-zinc-600 focus:bg-zinc-900 font-sans"
                          placeholder="Provide a clear high-level target goal or description..."
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: GITHUB CONNECTION */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div className="bg-zinc-900/40 border border-zinc-800/80 p-4 rounded-xl">
                      <h3 className="text-xs font-bold text-zinc-200 flex items-center gap-2 mb-1">
                        <Github size={14} className="text-blue-400" /> Optional Repository Integration
                      </h3>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        Linking a remote repository unlocks live files, sync capabilities, and developer pipelines.
                      </p>
                    </div>

                    {/* Choice cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* OPTION 1: LINK EXISTING */}
                      <button
                        type="button"
                        onClick={() => setGitLinkOption("link")}
                        className={`text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col gap-3 relative hover:scale-[1.01] ${
                          gitLinkOption === "link"
                            ? "border-blue-500 bg-blue-500/10"
                            : "border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-850"
                        }`}
                      >
                        <div className="flex justify-between items-center w-full">
                          <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                            <Link size={14} />
                          </div>
                          {gitLinkOption === "link" && (
                            <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px] font-bold">
                              ✓
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-zinc-150">Link Existing</h4>
                          <p className="text-[10px] text-zinc-500 mt-1 leading-normal">
                            Connect a fetched repository. Includes AI overlap matchmaking.
                          </p>
                        </div>
                      </button>

                      {/* OPTION 2: CREATE BRAND NEW */}
                      <button
                        type="button"
                        onClick={() => setGitLinkOption("create")}
                        className={`text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col gap-3 relative hover:scale-[1.01] ${
                          gitLinkOption === "create"
                            ? "border-blue-500 bg-blue-500/10"
                            : "border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-850"
                        }`}
                      >
                        <div className="flex justify-between items-center w-full">
                          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                            <Plus size={14} />
                          </div>
                          {gitLinkOption === "create" && (
                            <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px] font-bold">
                              ✓
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-zinc-150">Create New Repo</h4>
                          <p className="text-[10px] text-zinc-500 mt-1 leading-normal">
                            Spin up an all-new GitHub repository remotely.
                          </p>
                        </div>
                      </button>

                      {/* OPTION 3: KEEP LOCAL ONLY */}
                      <button
                        type="button"
                        onClick={() => {
                          setGitLinkOption("none");
                          setFormData({ ...formData, githubRepos: "" });
                        }}
                        className={`text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col gap-3 relative hover:scale-[1.01] ${
                          gitLinkOption === "none"
                            ? "border-blue-500 bg-blue-500/10"
                            : "border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-850"
                        }`}
                      >
                        <div className="flex justify-between items-center w-full">
                          <div className="p-2 rounded-lg bg-zinc-500/10 border border-zinc-850 text-zinc-400">
                            <FolderGit2 size={14} />
                          </div>
                          {gitLinkOption === "none" && (
                            <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px] font-bold">
                              ✓
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-zinc-150">Keep Local Only</h4>
                          <p className="text-[10px] text-zinc-500 mt-1 leading-normal">
                            Maintain in-browser cache. Connect to GitHub anytime later.
                          </p>
                        </div>
                      </button>
                    </div>

                    <div className="border-t border-zinc-800/40 pt-4">
                      {gitLinkOption === "none" && (
                        <div className="p-5 bg-zinc-900/20 border border-zinc-850 rounded-xl text-center space-y-2">
                          <div className="w-9 h-9 rounded-full bg-blue-500/5 text-blue-400 flex items-center justify-center mx-auto border border-blue-500/10">
                            ✓
                          </div>
                          <h4 className="text-xs font-bold text-zinc-200">Local Cache Target Selected</h4>
                          <p className="text-[11px] text-zinc-400 max-w-sm mx-auto leading-relaxed">
                            No remote repository link will be established during creation. Your files will be securely loaded inside the local browser context.
                          </p>
                        </div>
                      )}

                      {gitLinkOption === "link" && (
                        <div className="space-y-4">
                          {/* AI Recommended Recommendation */}
                          {recommendedRepo && (
                            <div className="p-3 bg-blue-500/5 border border-blue-500/30 rounded-xl relative overflow-hidden animate-in fade-in duration-200">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[9px] text-blue-400 font-extrabold tracking-wider uppercase flex items-center gap-1">
                                  <Sparkle size={10} className="text-cyan-400 animate-pulse" /> AI Semantic Alignment Match
                                </span>
                                <span className="text-[8px] bg-blue-500/10 text-blue-300 px-1.5 py-0.5 rounded font-mono border border-blue-500/20 font-bold">
                                  MATCH SCORE: 94%
                                </span>
                              </div>
                              <p className="text-xs font-bold text-zinc-200 flex items-center gap-1.5 font-mono">
                                <Github size={12} className="text-zinc-500" /> {recommendedRepo.full_name}
                              </p>
                              {recommendedRepo.description && (
                                <p className="text-[10px] text-zinc-400 mt-1 line-clamp-1 italic">
                                  "{recommendedRepo.description}"
                                </p>
                              )}
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, githubRepos: recommendedRepo.full_name })}
                                className={`mt-2.5 w-full text-center text-[10px] uppercase tracking-wider font-extrabold py-1.5 px-3 rounded-lg transition-all cursor-pointer ${
                                  formData.githubRepos === recommendedRepo.full_name
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                    : "bg-blue-600 hover:bg-blue-500 text-white"
                                }`}
                              >
                                {formData.githubRepos === recommendedRepo.full_name ? "✓ Semantic Repo Selected" : "Link This Match"}
                              </button>
                            </div>
                          )}

                          <div className="space-y-2">
                            {!activeToken ? (
                              <div className="p-4 bg-zinc-900/30 border border-zinc-800 rounded-xl text-center space-y-3">
                                <p className="text-[11px] text-zinc-400">
                                  GitHub account not connected. Authenticate to sync repositories automatically, or type the name manually below.
                                </p>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      const res = await githubSignIn();
                                      if (res && res.username) {
                                        setGithubUser?.(res.username);
                                        setGithubToken?.(res.accessToken);
                                        setGithubProfile?.(res.user);
                                        if (onFetchRepos) onFetchRepos();
                                      }
                                    } catch (err: any) {
                                      alert("GitHub Login Failed: " + err.message);
                                    }
                                  }}
                                  className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-750 text-white text-xs font-bold px-4 py-2 rounded-lg border border-zinc-700 transition-colors shadow cursor-pointer"
                                >
                                  <Github size={13} />
                                  Connect GitHub Account
                                </button>
                              </div>
                            ) : (
                              <>
                                <div className="flex justify-between items-center">
                                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                                    Select Synced Repository
                                  </label>
                                  <div className="relative w-44">
                                    <Search size={10} className="absolute left-2.5 top-2.5 text-zinc-550" />
                                    <input
                                      type="text"
                                      placeholder="Filter repos..."
                                      value={repoSearchQuery}
                                      onChange={(e) => setRepoSearchQuery(e.target.value)}
                                      className="w-full bg-zinc-950 border border-zinc-850 rounded px-2 py-1 pl-7 text-[10px] text-zinc-200 outline-none focus:border-blue-500 font-mono"
                                    />
                                  </div>
                                </div>

                                {loadingRepos ? (
                                  <div className="flex flex-col items-center justify-center py-8 text-zinc-500 text-xs gap-2 border border-zinc-800 rounded-lg bg-zinc-900/20">
                                    <Loader2 size={16} className="animate-spin text-blue-500" />
                                    Synchronizing user repositories...
                                  </div>
                                ) : (
                                  <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar pr-1 border border-zinc-850 bg-zinc-950/20 p-1 rounded-lg">
                                    {filteredRepos.length === 0 ? (
                                      <div className="text-center py-6 text-zinc-500 text-xs border border-dashed border-zinc-800 rounded-lg">
                                        No repositories match your search or account scope.
                                      </div>
                                    ) : (
                                      filteredRepos.map((r) => {
                                        const isChosen = formData.githubRepos === r.full_name;
                                        return (
                                          <label
                                            key={r.id}
                                            className={`flex items-center gap-3 p-2 rounded border text-xs cursor-pointer transition-colors ${
                                              isChosen
                                                ? "border-blue-500/80 bg-blue-500/10 text-blue-300"
                                                : "border-zinc-850 bg-zinc-900/40 hover:bg-zinc-800/80 text-zinc-300"
                                            }`}
                                          >
                                            <input
                                              type="radio"
                                              name="gitRepo"
                                              checked={isChosen}
                                              onChange={() => setFormData({ ...formData, githubRepos: r.full_name })}
                                              className="sr-only"
                                            />
                                            <div
                                              className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                                                isChosen ? "border-blue-500 bg-blue-500" : "border-zinc-700"
                                              }`}
                                            >
                                              {isChosen && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                            </div>
                                            <div className="flex-grow min-w-0">
                                              <div className="font-semibold text-zinc-200 truncate font-mono text-[11px] flex items-center gap-1.5">
                                                <Github size={11} className="text-zinc-500 shrink-0" />
                                                {r.full_name}
                                              </div>
                                              {r.description && (
                                                <p className="text-[9px] text-zinc-500 truncate mt-0.5">
                                                  {r.description}
                                                </p>
                                              )}
                                            </div>
                                          </label>
                                        );
                                      })
                                    )}
                                  </div>
                                )}
                              </>
                            )}

                            {/* Manual Entry Target */}
                            <div className="pt-3 border-t border-zinc-800/60">
                              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                                Manual Repository Link Target
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="owner/repo (e.g. facebook/react)"
                                  value={formData.githubRepos}
                                  onChange={(e) => setFormData({ ...formData, githubRepos: e.target.value })}
                                  className="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-zinc-200 outline-none focus:border-blue-500 font-mono"
                                />
                                {formData.githubRepos && (
                                  <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, githubRepos: "" })}
                                    className="px-2 text-zinc-500 hover:text-zinc-300 text-xs border border-zinc-850 rounded-lg bg-zinc-900/20 cursor-pointer"
                                  >
                                    Clear
                                  </button>
                                )}
                              </div>
                              <p className="text-[9px] text-zinc-500 mt-1 font-sans">
                                Type any existing repository target formatted as <code>username/repository-name</code>.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {gitLinkOption === "create" && (
                        <div className="p-4 bg-zinc-900/60 rounded-xl border border-zinc-800 space-y-3">
                          <h3 className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                            <Plus size={14} className="text-blue-400" /> Remote GitHub Creator
                          </h3>

                          {!activeToken ? (
                            <div className="p-4 bg-zinc-900/30 border border-zinc-800 rounded-xl text-center space-y-3">
                              <p className="text-[11px] text-zinc-400">
                                You need to authenticate with GitHub before we can automatically create remote repositories for you.
                              </p>
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await githubSignIn();
                                    if (res && res.username) {
                                      setGithubUser?.(res.username);
                                      setGithubToken?.(res.accessToken);
                                      setGithubProfile?.(res.user);
                                      if (onFetchRepos) onFetchRepos();
                                    }
                                  } catch (err: any) {
                                    alert("GitHub Login Failed: " + err.message);
                                  }
                                }}
                                className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-750 text-white text-xs font-bold px-4 py-2 rounded-lg border border-zinc-700 transition-colors shadow cursor-pointer"
                              >
                                <Github size={13} />
                                Connect GitHub Account
                              </button>
                            </div>
                          ) : (
                            <>
                              {repoCreatedSuccess && (
                                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-2.5 rounded-lg text-[10px] font-mono">
                                  ✓ {repoCreatedSuccess}
                                </div>
                              )}

                              <div className="space-y-3">
                                <div>
                                  <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                                    Repository Name
                                  </label>
                                  <input
                                    type="text"
                                    value={repoCreationName}
                                    onChange={(e) => setRepoCreationName(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '-'))}
                                    placeholder="e.g. core-analytics-dashboard"
                                    className="w-full bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 transition-all font-mono"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                                    Description
                                  </label>
                                  <textarea
                                    rows={2}
                                    value={repoCreationDesc}
                                    onChange={(e) => setRepoCreationDesc(e.target.value)}
                                    placeholder="Describe repo metrics or scopes..."
                                    className="w-full bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 rounded-lg px-3 py-1.5 outline-none focus:border-blue-500 transition-all resize-none h-14"
                                  />
                                </div>

                                <div className="flex items-center justify-between border-t border-zinc-800 pt-2.5">
                                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Visibility</span>
                                  <div className="flex bg-zinc-950 p-0.5 rounded-lg border border-zinc-800">
                                    <button
                                      type="button"
                                      onClick={() => setRepoIsPrivate(false)}
                                      className={`px-3 py-1 text-[10px] font-bold rounded-md ${
                                        !repoIsPrivate ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-400 cursor-pointer"
                                      }`}
                                    >
                                      Public
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setRepoIsPrivate(true)}
                                      className={`px-3 py-1 text-[10px] font-bold rounded-md ${
                                        repoIsPrivate ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-400 cursor-pointer"
                                      }`}
                                    >
                                      Private
                                    </button>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  disabled={creatingRepo || !repoCreationName}
                                  onClick={handleCreateRepoSubmit}
                                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                  {creatingRepo ? (
                                    <>
                                      <Loader2 size={13} className="animate-spin" /> Creating remote...
                                    </>
                                  ) : (
                                    <>
                                      <Sparkle size={13} /> Create & Select Remote Repo
                                    </>
                                  )}
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 3: TECH STACK PRESETS */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-400 mb-2 uppercase tracking-widest flex items-center gap-1">
                        <Code2 size={12} className="text-blue-400" /> Primary Runtime Stack Preset
                      </label>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          {
                            id: "React, Next.js, Tailwind",
                            title: "React / Next.js Framework Core",
                            details: "Comprehensive SaaS framework with hybrid layouts, custom server configurations, and Tailwind UI utility components.",
                          },
                          {
                            id: "Vue, Nuxt, Tailwind",
                            title: "Vue3 / Nuxt Composition Suite",
                            details: "Elegant, high-performance modular frontend stack utilizing Tailwind and light runtime footprints.",
                          },
                          {
                            id: "Node.js, Express, MongoDB",
                            title: "Express / Node REST API Hub",
                            details: "Scalable backend service architecture featuring robust routing, controllers, and environment parameters.",
                          },
                          {
                            id: "Python, Django",
                            title: "Python / Django Web Framework",
                            details: "Ideal for machine learning models, structured REST APIs, and database adapters.",
                          },
                        ].map((framework) => {
                          const isSelected = formData.frameworks === framework.id;
                          return (
                            <button
                              key={framework.id}
                              type="button"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  frameworks: framework.id,
                                })
                              }
                              className={`text-left p-3.5 rounded-xl border text-xs transition-all flex items-start gap-3 w-full cursor-pointer ${
                                isSelected
                                  ? "border-blue-500 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                                  : "border-zinc-800 bg-zinc-900/60 hover:bg-zinc-850"
                              }`}
                            >
                              <div
                                className={`mt-0.5 w-4.5 h-4.5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                                  isSelected
                                    ? "border-blue-500 bg-blue-500 text-white"
                                    : "border-zinc-700 bg-zinc-950"
                                }`}
                              >
                                {isSelected && <Check size={11} />}
                              </div>
                              <div>
                                <div className={`font-bold text-xs ${isSelected ? "text-blue-300" : "text-zinc-200"}`}>
                                  {framework.title}
                                </div>
                                <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                                  {framework.details}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="border-t border-zinc-800/40 pt-4">
                      <label className="block text-[11px] font-bold text-zinc-400 mb-2.5 uppercase tracking-widest flex items-center gap-1">
                        <Shield size={12} className="text-blue-400" /> Integrated API Middleware Services (Select Multiple)
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {[
                          {
                            id: "Stripe",
                            name: "Stripe Payment",
                            desc: "Invoices, billing portals, and recurring checkout models.",
                          },
                          {
                            id: "Supabase",
                            name: "Supabase Backend",
                            desc: "Real-time client database hubs and OAuth schemas.",
                          },
                          {
                            id: "Firebase",
                            name: "Firebase Cloud DB",
                            desc: "Persistent Firestore, standard auth triggers, and hosting.",
                          },
                          {
                            id: "OpenAI",
                            name: "OpenAI / LLM Node",
                            desc: "Conversational generative models and prompt tools.",
                          },
                        ].map((api) => {
                          const selectedList = formData.apiConnections
                            ? formData.apiConnections.split(",").map((s) => s.trim()).filter(Boolean)
                            : [];
                          const isSelected = selectedList.includes(api.id);

                          const handleToggle = () => {
                            let updatedList;
                            if (isSelected) {
                              updatedList = selectedList.filter((x) => x !== api.id);
                            } else {
                              updatedList = [...selectedList, api.id];
                            }
                            setFormData({
                              ...formData,
                              apiConnections: updatedList.join(", "),
                            });
                          };

                          return (
                            <button
                              key={api.id}
                              type="button"
                              onClick={handleToggle}
                              className={`text-left p-3 rounded-xl border text-xs transition-colors flex items-start gap-3 w-full cursor-pointer ${
                                isSelected
                                  ? "border-blue-500 bg-blue-500/10"
                                  : "border-zinc-800 bg-zinc-900/60 hover:bg-zinc-850"
                              }`}
                            >
                              <div
                                className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                  isSelected
                                    ? "border-blue-500 bg-blue-500 text-white"
                                    : "border-zinc-700 bg-zinc-950"
                                }`}
                              >
                                {isSelected && <Check size={10} />}
                              </div>
                              <div>
                                <div className={`font-bold text-[11px] ${isSelected ? "text-blue-300" : "text-zinc-200"}`}>
                                  {api.name}
                                </div>
                                <p className="text-[9px] text-zinc-400 mt-0.5 leading-relaxed">
                                  {api.desc}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: MECHANICS & DEPLOYMENT */}
                {currentStep === 4 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">
                          Sprint Delivery Cadence Preset
                        </label>
                        <select
                          value={formData.sprints}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              sprints: e.target.value,
                            })
                          }
                          className="w-full bg-zinc-900/80 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-blue-500 transition-colors cursor-pointer"
                        >
                          <option value="">Single Workspace Iteration</option>
                          <option value="Sprint 1, Sprint 2, Polish">Short MVP Phase (3 Sprints)</option>
                          <option value="Sprint 1, Sprint 2, Sprint 3, Beta, Launch">Standard Medium Phase (5 Sprints)</option>
                          <option value="Week 1, Week 2, Week 3, Week 4">Weekly Sprint Loops</option>
                        </select>
                        <p className="text-[10px] text-zinc-500 mt-1">
                          This establishes a standard sprint model block to coordinate feature delivery.
                        </p>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">
                          Primary Deployment Launch Target
                        </label>
                        <select
                          value={formData.launchTarget}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              launchTarget: e.target.value,
                            })
                          }
                          className="w-full bg-zinc-900/80 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-blue-500 transition-colors cursor-pointer"
                        >
                          <option value="Vercel">Vercel (Static Web Server)</option>
                          <option value="Google Cloud Run">Google Cloud Run (Docker Container)</option>
                          <option value="Firebase Hosting">Firebase Static CDN</option>
                          <option value="AWS">AWS Server Solutions (EC2/ECS)</option>
                          <option value="Cloudflare Pages">Cloudflare Pages Edge</option>
                          <option value="Netlify">Netlify Portal</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">
                          Baseline Workspace Phase Status
                        </label>
                        <select
                          value={formData.status}
                          onChange={(e: any) =>
                            setFormData({ ...formData, status: e.target.value })
                          }
                          className="w-full bg-zinc-900/80 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-blue-500 transition-colors cursor-pointer"
                        >
                          <option value="Active">Active Design Core</option>
                          <option value="Planning">Planning / Architectural Scope</option>
                          <option value="Paused">Paused / Archived Log</option>
                        </select>
                      </div>
                    </div>

                    <div className="bg-zinc-900/30 border border-zinc-850 p-4 rounded-xl space-y-2 mt-2">
                      <h4 className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                        <Check size={14} className="text-emerald-400" /> Complete Setup Configuration
                      </h4>
                      <p className="text-[10px] text-zinc-400 leading-relaxed">
                        By clicking <strong>Create Blueprint Project</strong>, you instantiate a new workspace complete with custom preset parameters, delivery roadmaps, and optional repository linkages.
                      </p>
                    </div>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer controls */}
          <div className="p-4 bg-[#09090b]/80 flex items-center justify-between border-t border-zinc-800/80 shrink-0 rounded-b-2xl">
            <button
              type="button"
              disabled={currentStep === 1}
              onClick={handleBack}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                currentStep === 1
                  ? "text-zinc-600 cursor-not-allowed opacity-40"
                  : "text-zinc-350 hover:text-white hover:bg-zinc-900 border border-zinc-800"
              }`}
            >
              <ChevronLeft size={14} /> Previous
            </button>

            <div className="hidden sm:flex items-center gap-1.5">
              {[1, 2, 3, 4].map((stepIndex) => (
                <div
                  key={stepIndex}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    currentStep === stepIndex
                      ? "bg-blue-500 w-5"
                      : currentStep > stepIndex
                      ? "bg-emerald-500 w-2.5"
                      : "bg-zinc-800 w-2.5"
                  }`}
                />
              ))}
            </div>

            <div>
              {currentStep < 4 ? (
                <button
                  type="button"
                  disabled={currentStep === 1 && !formData.name.trim()}
                  onClick={handleNext}
                  className={`flex items-center gap-1.5 px-5 py-2 bg-zinc-800 hover:bg-zinc-750 text-white rounded-lg text-xs font-bold transition-all border border-zinc-700/60 shadow-lg cursor-pointer ${
                    currentStep === 1 && !formData.name.trim()
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  Continue <ChevronRight size={14} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!formData.name.trim()}
                  className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all border border-blue-500/30 shadow-lg shadow-blue-500/15 cursor-pointer"
                >
                  Create Blueprint Project <Check size={14} />
                </button>
              )}
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}
