import {
  CheckCircle2,
  Circle,
  AlertCircle,
  Disc,
  LayoutList,
  Columns,
  X,
  Trash,
  Square,
  CheckSquare,
  AlignLeft,
  Calendar,
  User,
  Hash,
  Calendar as CalendarIcon,
  Tag,
  Bug as BugIcon,
  Zap,
  Link as LinkIcon,
  Mic,
  StopCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  FileUp,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useData } from "../context/DataProvider";
import { Plus } from "lucide-react";
import Markdown from "react-markdown";

const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case "Critical":
      return (
        <span className="shrink-0 text-[9px] font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded flex items-center gap-1 font-mono uppercase tracking-wider select-none animate-pulse">
          <AlertCircle size={10} className="text-rose-400" />
          <span>Critical</span>
        </span>
      );
    case "High":
      return (
        <span className="shrink-0 text-[9px] font-semibold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded flex items-center gap-1 font-mono uppercase tracking-wider select-none">
          <ArrowUp size={10} className="text-amber-500" />
          <span>High</span>
        </span>
      );
    case "Medium":
      return (
        <span className="shrink-0 text-[9px] font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded flex items-center gap-1 font-mono uppercase tracking-wider select-none">
          <Minus size={10} className="text-blue-400" />
          <span>Medium</span>
        </span>
      );
    case "Low":
      return (
        <span className="shrink-0 text-[9px] font-semibold text-zinc-400 bg-zinc-500/10 border border-zinc-800 px-1.5 py-0.5 rounded flex items-center gap-1 font-mono uppercase tracking-wider select-none">
          <ArrowDown size={10} className="text-zinc-500" />
          <span>Low</span>
        </span>
      );
    default:
      return null;
  }
};

function getDescendantIds(issueId: string, allIssues: any[]): string[] {
  const children = allIssues.filter((i) => i.parentId === issueId);
  let descendants = children.map((c) => c.id);
  for (const child of children) {
    descendants = [...descendants, ...getDescendantIds(child.id, allIssues)];
  }
  return descendants;
}

export function Issues() {
  const {
    projects,
    issues,
    phases,
    addIssue,
    updateIssue,
    deleteIssue,
    activeProjectId,
    setActiveProjectId,
    agents,
  } = useData();
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [showModal, setShowModal] = useState(false);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [selectedIssueIds, setSelectedIssueIds] = useState<Set<string>>(
    new Set(),
  );
  const [activeIssueId, setActiveIssueId] = useState<string | null>(
    searchParams.get("issueId") || null,
  );
  const [newSubTaskTitle, setNewSubTaskTitle] = useState("");

  const [showAICommander, setShowAICommander] = useState(false);
  const [aiCommanderInput, setAiCommanderInput] = useState("");
  const [aiCommanderRecording, setAiCommanderRecording] = useState(false);
  const [aiCommanderLoading, setAiCommanderLoading] = useState(false);
  const [aiCommanderParsedIssues, setAiCommanderParsedIssues] = useState<any[]>(
    [],
  );
  const [aiCommanderDragActive, setAiCommanderDragActive] = useState(false);

  const [isRecordingTitle, setIsRecordingTitle] = useState(false);
  const [isRecordingDesc, setIsRecordingDesc] = useState(false);
  const [isRecordingSlideOverDesc, setIsRecordingSlideOverDesc] =
    useState(false);

  const toggleVoice = (field: "title" | "description" | "slideoverDesc") => {
    const isRecording =
      field === "title"
        ? isRecordingTitle
        : field === "description"
          ? isRecordingDesc
          : isRecordingSlideOverDesc;
    const setRecording =
      field === "title"
        ? setIsRecordingTitle
        : field === "description"
          ? setIsRecordingDesc
          : setIsRecordingSlideOverDesc;

    if (isRecording) {
      if ((window as any).issuesSpeechRecognitionRef) {
        (window as any).issuesSpeechRecognitionRef.stop();
      }
      setRecording(false);
    } else {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
          setRecording(true);
        };

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            if (field === "slideoverDesc") {
              if (activeIssueId) {
                const currentVal =
                  issues.find((i) => i.id === activeIssueId)?.description || "";
                updateIssue(activeIssueId, {
                  description: currentVal
                    ? currentVal + " " + transcript
                    : transcript,
                });
              }
            } else {
              setFormData((prev) => ({
                ...prev,
                [field]: prev[field]
                  ? prev[field] + " " + transcript
                  : transcript,
              }));
            }
            if ("speechSynthesis" in window) {
              window.speechSynthesis.speak(
                new SpeechSynthesisUtterance(
                  "Added: " + transcript.slice(0, 30),
                ),
              );
            }
          }
        };

        recognition.onerror = (e: any) => {
          console.error(e);
          setRecording(false);
        };

        recognition.onend = () => {
          setRecording(false);
        };

        (window as any).issuesSpeechRecognitionRef = recognition;
        recognition.start();
      } else {
        alert("Speech recognition is not supported in this browser.");
      }
    }
  };

  const activeIssue = useMemo(
    () => issues.find((i) => i.id === activeIssueId),
    [issues, activeIssueId],
  );

  const toggleAICommanderVoice = () => {
    if (aiCommanderRecording) {
      if ((window as any).aiCommanderSpeechRecognitionRef) {
        (window as any).aiCommanderSpeechRecognitionRef.stop();
      }
      setAiCommanderRecording(false);
    } else {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onstart = () => {
          setAiCommanderRecording(true);
        };

        recognition.onresult = (event: any) => {
          const transcript =
            event.results[event.results.length - 1][0].transcript;
          if (transcript) {
            setAiCommanderInput((prev) =>
              prev ? prev.trim() + " " + transcript.trim() : transcript.trim(),
            );
            if ("speechSynthesis" in window) {
              window.speechSynthesis.speak(
                new SpeechSynthesisUtterance(
                  "Heard: " + transcript.slice(0, 30),
                ),
              );
            }
          }
        };

        recognition.onerror = (e: any) => {
          console.error(e);
          setAiCommanderRecording(false);
        };

        recognition.onend = () => {
          setAiCommanderRecording(false);
        };

        (window as any).aiCommanderSpeechRecognitionRef = recognition;
        recognition.start();
      } else {
        alert("Speech recognition is not supported in this browser.");
      }
    }
  };

  const handleAICommanderDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setAiCommanderDragActive(true);
    } else if (e.type === "dragleave") {
      setAiCommanderDragActive(false);
    }
  };

  const handleAICommanderDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAiCommanderDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          setAiCommanderInput(text);
          if ("speechSynthesis" in window) {
            window.speechSynthesis.speak(
              new SpeechSynthesisUtterance("Loaded " + file.name),
            );
          }
        }
      };
      reader.readAsText(file);
    }
  };

  const handleAICommanderFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          setAiCommanderInput(text);
          if ("speechSynthesis" in window) {
            window.speechSynthesis.speak(
              new SpeechSynthesisUtterance("Loaded " + file.name),
            );
          }
        }
      };
      reader.readAsText(file);
    }
  };

  const processAICommander = async () => {
    if (!aiCommanderInput.trim() || !activeProjectId) return;
    setAiCommanderLoading(true);
    setAiCommanderParsedIssues([]);

    const promptText = `You are a professional project manager. Classify the following voice notes feedback, status text updates, or master list of software requirements into a well-structured list of issues.
Each issue must contain:
1. Title: Short, descriptive name of the work item
2. Description: Detail of what was done, what needs doing, or what the bug is
3. Type: Either 'Task', 'Bug', or 'Feature'
4. Priority: Either 'Low', 'Medium', 'High', or 'Critical' (Colloquial words like "terrible" or "break" implies Bug/Task; "completely terrible" -> Critical; "new idea" or "suggest" -> Feature, priority Medium/High; "built fully" -> Task with status 'Done')
5. Status: 'Todo', 'In Progress', or 'Done' based on status update context (e.g. "currently building this but haven't fully finished" -> 'In Progress'; "built this fully" or "fully built" -> 'Done'; "not finished" or "haven't finished" -> 'In Progress'; "have an issue/would like to fix/new idea" -> 'Todo')

Source Data:
"${aiCommanderInput}"

Respond EXACTLY inside '<PARSE_JSON>' and '</PARSE_JSON>' tags with a valid JSON array of objects. Do not wrap the JSON with markdown backticks of any kind.
Example:
<PARSE_JSON>
[
  {
    "title": "Fix date picker crash",
    "description": "DatePicker crashes on mobile viewports",
    "type": "Bug",
    "priority": "High",
    "status": "Todo"
  }
]
</PARSE_JSON>`;

    try {
      const response = await fetch("/api/gemini/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: promptText }],
          context:
            "You are ScrumMaster AI assistant parsing files or continuous recordings.",
        }),
      });

      let fullText = "";
      if (response.ok) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        if (reader) {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            const lines = chunk.split("\n");
            for (const line of lines) {
              if (line.startsWith("data: ") && line !== "data: [DONE]") {
                try {
                  const parsed = JSON.parse(line.slice(6));
                  if (parsed.text) fullText += parsed.text;
                } catch (e) {}
              }
            }
          }
        }
      }

      const startTag = "<PARSE_JSON>";
      const endTag = "</PARSE_JSON>";
      const startIdx = fullText.indexOf(startTag);
      const endIdx = fullText.indexOf(endTag);

      let jsonText = "";
      if (startIdx !== -1 && endIdx !== -1) {
        jsonText = fullText.slice(startIdx + startTag.length, endIdx).trim();
      } else {
        const backupStart = fullText.indexOf("[");
        const backupEnd = fullText.lastIndexOf("]");
        if (backupStart !== -1 && backupEnd !== -1) {
          jsonText = fullText.slice(backupStart, backupEnd + 1).trim();
        }
      }

      if (jsonText) {
        const list = JSON.parse(jsonText);
        if (Array.isArray(list)) {
          setAiCommanderParsedIssues(
            list.map((item, index) => ({
              id: `parsed-${index}-${Date.now()}`,
              title: item.title || "Untitled Action Item",
              description: item.description || "",
              type: ["Task", "Bug", "Feature"].includes(item.type)
                ? item.type
                : "Task",
              status: ["Todo", "In Progress", "Done"].includes(item.status)
                ? item.status
                : "Todo",
              priority: ["Low", "Medium", "High", "Critical"].includes(
                item.priority,
              )
                ? item.priority
                : "Medium",
            })),
          );
          if ("speechSynthesis" in window) {
            window.speechSynthesis.speak(
              new SpeechSynthesisUtterance(
                `Parsed ${list.length} items from input.`,
              ),
            );
          }
        }
      } else {
        alert(
          "Could not parse structured classification from AI output. Raw suggestion:\n" +
            fullText.slice(0, 200),
        );
      }
    } catch (e) {
      console.error("Failed to parse AI response", e);
      alert(
        "Verification/Parsing error: Ensure your API key is configured or simplify the request.",
      );
    }
    setAiCommanderLoading(false);
  };

  const importAICommanderParsedIssues = () => {
    if (aiCommanderParsedIssues.length === 0 || !activeProjectId) return;
    aiCommanderParsedIssues.forEach((item) => {
      addIssue({
        projectId: activeProjectId,
        title: item.title,
        description: item.description,
        type: item.type,
        status: item.status,
        priority: item.priority,
      });
    });
    alert(
      `Successfully compiled and imported ${aiCommanderParsedIssues.length} issues into your active project board!`,
    );
    setAiCommanderParsedIssues([]);
    setAiCommanderInput("");
    setShowAICommander(false);
  };

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "Task" as "Task" | "Bug" | "Feature",
    status: "Todo" as "Todo" | "In Progress" | "Done",
    priority: "Medium" as "Low" | "Medium" | "High" | "Critical",
    phaseId: "",
    sprintId: "",
    assignee: "",
    storyPoints: "",
    dueDate: "",
    recurrenceRule: "" as "" | "Daily" | "Weekly" | "Monthly",
    dependencyIds: "",
    labels: "",
    bugEnvironment: "",
    crashLogs: "",
    parentId: "",
  });

  const urlSearch = searchParams.get("search") || "";
  const urlPriority = searchParams.get("priority") || "All";
  const urlPhaseId = searchParams.get("phaseId") || "All";

  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [filterType, setFilterType] = useState<string>("All");
  const [filterPriority, setFilterPriority] = useState<string>(urlPriority);
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [filterSprint, setFilterSprint] = useState<string>("All");
  const [filterPhase, setFilterPhase] = useState<string>(urlPhaseId);

  useEffect(() => {
    const search = searchParams.get("search");
    const priority = searchParams.get("priority");
    const phaseId = searchParams.get("phaseId");
    const issueId = searchParams.get("issueId");

    if (search !== null) setSearchQuery(search);
    if (priority !== null) setFilterPriority(priority);
    if (phaseId !== null) setFilterPhase(phaseId);
    if (issueId !== null) setActiveIssueId(issueId);
  }, [searchParams]);

  const activeSprints = useMemo(() => {
    return projects.find((p) => p.id === activeProjectId)?.sprints || [];
  }, [projects, activeProjectId]);

  const activeIssues = useMemo(() => {
    let result = issues.filter((i) => i.projectId === activeProjectId);

    if (searchQuery) {
      result = result.filter(
        (i) =>
          i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          i.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    if (filterType !== "All") {
      result = result.filter((i) => i.type === filterType);
    }

    if (filterPriority !== "All") {
      result = result.filter((i) => i.priority === filterPriority);
    }

    if (filterStatus !== "All") {
      result = result.filter((i) => i.status === filterStatus);
    }

    if (filterSprint !== "All") {
      if (filterSprint === "Backlog") {
        result = result.filter((i) => !i.sprintId);
      } else {
        result = result.filter((i) => i.sprintId === filterSprint);
      }
    }

    if (filterPhase !== "All") {
      result = result.filter((i) => i.phaseId === filterPhase);
    }

    return result;
  }, [
    issues,
    activeProjectId,
    searchQuery,
    filterType,
    filterPriority,
    filterStatus,
    filterSprint,
    filterPhase,
  ]);

  const roots = useMemo(() => {
    return activeIssues.filter(
      (i) => !i.parentId || !activeIssues.some((p) => p.id === i.parentId)
    );
  }, [activeIssues]);

  const visibleIssuesWithDepth = useMemo(() => {
    const list: { issue: any; depth: number }[] = [];

    function traverse(issueId: string, depth: number) {
      const issue = activeIssues.find((i) => i.id === issueId);
      if (!issue) return;

      list.push({ issue, depth });

      const isExpanded = expandedIds[issue.id] !== false;
      if (isExpanded) {
        const children = activeIssues.filter((i) => i.parentId === issue.id);
        children.forEach((child) => {
          traverse(child.id, depth + 1);
        });
      }
    }

    roots.forEach((root) => {
      traverse(root.id, 0);
    });

    return list;
  }, [activeIssues, roots, expandedIds]);

  const activePhases = useMemo(() => {
    return phases.filter((p) => p.projectId === activeProjectId);
  }, [phases, activeProjectId]);

  const toggleSelectAll = () => {
    if (
      selectedIssueIds.size === activeIssues.length &&
      activeIssues.length > 0
    ) {
      setSelectedIssueIds(new Set());
    } else {
      setSelectedIssueIds(new Set(activeIssues.map((i) => i.id)));
    }
  };

  const toggleSelect = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const next = new Set(selectedIssueIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIssueIds(next);
  };

  const handleBulkUpdateStatus = (status: "Todo" | "In Progress" | "Done") => {
    selectedIssueIds.forEach((id) => updateIssue(id, { status }));
    setSelectedIssueIds(new Set());
  };

  const handleBulkDelete = () => {
    selectedIssueIds.forEach((id) => deleteIssue(id));
    setSelectedIssueIds(new Set());
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !activeProjectId) return;
    addIssue({
      projectId: activeProjectId,
      title: formData.title,
      description: formData.description,
      type: formData.type,
      status: formData.status,
      priority: formData.priority,
      phaseId: formData.phaseId || undefined,
      sprintId: formData.sprintId || undefined,
      assignee: formData.assignee || undefined,
      storyPoints: formData.storyPoints
        ? Number(formData.storyPoints)
        : undefined,
      dueDate: formData.dueDate || undefined,
      recurrenceRule:
        (formData.recurrenceRule as "Daily" | "Weekly" | "Monthly") ||
        undefined,
      dependencyIds: formData.dependencyIds
        ? formData.dependencyIds
            .split(",")
            .map((d) => d.trim())
            .filter((d) => d)
        : undefined,
      bugEnvironment: formData.bugEnvironment || undefined,
      crashLogs: formData.crashLogs || undefined,
      labels: formData.labels
        ? formData.labels
            .split(",")
            .map((l) => l.trim())
            .filter((l) => l)
        : undefined,
      parentId: formData.parentId || undefined,
    });
    setShowModal(false);
    setFormData({
      title: "",
      description: "",
      type: "Task",
      status: "Todo",
      priority: "Medium",
      phaseId: "",
      sprintId: "",
      assignee: "",
      storyPoints: "",
      dueDate: "",
      recurrenceRule: "",
      dependencyIds: "",
      labels: "",
      bugEnvironment: "",
      crashLogs: "",
      parentId: "",
    });
  };

  const columns = ["Todo", "In Progress", "Done"];

  return (
    <div className="flex flex-col h-full overflow-hidden pb-4 relative">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100 flex items-center gap-2">
            Issues <Disc size={18} className="text-purple-400" />
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Track tasks and problems for your projects.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-[#121214] border border-zinc-800 rounded-md p-1">
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-sm transition-colors ${viewMode === "list" ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"}`}
              title="List View"
            >
              <LayoutList size={14} />
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`p-1.5 rounded-sm transition-colors ${viewMode === "kanban" ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"}`}
              title="Kanban View"
            >
              <Columns size={14} />
            </button>
          </div>
          <div className="flex items-center bg-[#121214] border border-zinc-800 rounded-md">
            <span className="text-zinc-500 pl-3 text-xs">Project:</span>
            <select
              value={activeProjectId || ""}
              onChange={(e) => setActiveProjectId(e.target.value)}
              className="bg-transparent border-none text-xs text-zinc-200 py-1.5 px-2 focus:ring-0 outline-none w-36"
            >
              {projects.length === 0 && <option value="">No projects</option>}
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setShowAICommander(!showAICommander)}
            disabled={!activeProjectId}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium text-xs transition-colors border ${
              showAICommander
                ? "bg-purple-600/25 border-purple-500/50 text-purple-300"
                : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title="Upload master list, speak voice updates, and let AI auto-sort tasks"
          >
            <Mic
              size={13}
              className={
                aiCommanderRecording
                  ? "text-red-500 animate-pulse"
                  : "text-purple-400"
              }
            />
            <span>AI Commander Importer</span>
          </button>
          <button
            onClick={() => {
              if (activeProjectId) setShowModal(true);
            }}
            disabled={!activeProjectId}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-md font-medium text-xs transition-colors shadow-lg shadow-blue-500/10 border border-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={14} /> New Issue
          </button>
        </div>
      </div>

      {/* COLLAPSED AI COMMANDER CONSOLE */}
      <AnimatePresence>
        {showAICommander && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="bg-[#121214] border border-zinc-800 rounded-xl p-5 space-y-4 shadow-xl">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest flex items-center gap-2 mb-1">
                    <Sparkles
                      size={14}
                      className="text-purple-400 animate-pulse"
                    />{" "}
                    Workspace commander & automated bulk indexer
                  </h3>
                  <p className="text-[11px] text-zinc-400 max-w-2xl leading-relaxed">
                    Colloquially dictate progress, give voice feedback, or drag
                    and drop a master requirements list. Thomas AI will
                    automatically categorize status (Todo, In Progress, Done)
                    and construct high-fidelity project issues.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowAICommander(false);
                    setAiCommanderParsedIssues([]);
                  }}
                  className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 hover:bg-zinc-800 rounded-md"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* INPUT & CAPTURE CONTROLS */}
                <div className="space-y-3">
                  <div
                    onDragEnter={handleAICommanderDrag}
                    onDragOver={handleAICommanderDrag}
                    onDragLeave={handleAICommanderDrag}
                    onDrop={handleAICommanderDrop}
                    className={`border rounded-lg p-4 relative flex flex-col justify-between h-48 transition-all ${
                      aiCommanderDragActive
                        ? "border-purple-500 bg-purple-500/5 shadow-[0_0_15px_rgba(168,85,247,0.15)] animate-pulse"
                        : "border-zinc-800 bg-[#09090b]/60"
                    }`}
                  >
                    <textarea
                      value={aiCommanderInput}
                      onChange={(e) => setAiCommanderInput(e.target.value)}
                      placeholder="Speak progress, paste raw tasks, or drag a master text/CSV file here... E.g., 'We've built the login screen fully, currently building the dashboard graph but haven't fully finished yet, and we have an issue with speed in the database.'"
                      className="flex-1 bg-transparent border-none outline-none resize-none text-xs text-zinc-200 placeholder-zinc-600 leading-relaxed custom-scrollbar focus:ring-0 p-0"
                    />
                    <div className="flex items-center justify-between border-t border-zinc-900 pt-3 shrink-0">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={toggleAICommanderVoice}
                          className={`flex items-center gap-1.5 text-[10px] font-bold py-1 px-2.5 rounded border transition-all ${
                            aiCommanderRecording
                              ? "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                              : "bg-zinc-800 border-zinc-700 text-zinc-350 hover:bg-zinc-700"
                          }`}
                        >
                          <Mic
                            size={11}
                            className={
                              aiCommanderRecording ? "animate-pulse" : ""
                            }
                          />
                          {aiCommanderRecording
                            ? "Listening..."
                            : "Speak Feedback"}
                        </button>
                        <label className="flex items-center gap-1.5 text-[10px] bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 hover:text-zinc-200 text-zinc-350 font-bold py-1 px-2.5 rounded cursor-pointer transition-all">
                          <FileUp size={11} />
                          <span>Upload Master File</span>
                          <input
                            type="file"
                            accept=".txt,.csv,.json"
                            onChange={handleAICommanderFileUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                      {aiCommanderInput && (
                        <button
                          onClick={() => setAiCommanderInput("")}
                          className="text-[9px] text-zinc-500 hover:text-zinc-300 font-semibold uppercase tracking-wider transition-colors"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={processAICommander}
                    disabled={aiCommanderLoading || !aiCommanderInput.trim()}
                    className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800/50 disabled:text-zinc-600 disabled:border-zinc-800 text-white font-bold py-2 rounded-lg text-xs transition-all border border-purple-500/20 shadow-lg flex items-center justify-center gap-2"
                  >
                    {aiCommanderLoading ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        <span>Sorting & Classifying with Gemini AI...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={13} />
                        <span>
                          Process Feedback and Automatically Sort List
                        </span>
                      </>
                    )}
                  </button>
                </div>

                {/* PARSED & CLASSIFIED ITEMS PREVIEW */}
                <div className="border border-zinc-800 bg-[#09090b]/80 rounded-lg p-4 flex flex-col justify-between h-[236px]">
                  {aiCommanderParsedIssues.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 py-6">
                      {aiCommanderLoading ? (
                        <div className="flex flex-col items-center gap-3">
                          <div className="relative">
                            <div className="w-8 h-8 rounded-full border-2 border-purple-500/10 border-t-purple-500 animate-spin"></div>
                            <div className="absolute inset-2 bg-purple-500/10 rounded-full animate-ping"></div>
                          </div>
                          <p className="text-[10px] font-mono animate-pulse text-purple-400">
                            Classifying semantic feedback vectors...
                          </p>
                        </div>
                      ) : (
                        <>
                          <Sparkles size={18} className="text-zinc-700 mb-2" />
                          <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                            Classification Output Area
                          </p>
                          <p className="text-[9px] text-zinc-600 text-center max-w-[240px] mt-1">
                            Pending items will stream here with automated
                            priority, phase, and status tags.
                          </p>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col overflow-hidden">
                      <div className="flex items-center justify-between mb-2 shrink-0 border-b border-zinc-900 pb-1.5">
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          Auto-Classified {aiCommanderParsedIssues.length} Items
                        </span>
                        <button
                          onClick={() => setAiCommanderParsedIssues([])}
                          className="text-[9px] text-zinc-500 hover:text-red-400 font-semibold uppercase tracking-wider transition-colors"
                        >
                          Reset List
                        </button>
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar text-[11px] py-1">
                        {aiCommanderParsedIssues.map((item, idx) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between gap-3 p-2 bg-[#121214] border border-zinc-800/80 rounded-md hover:border-zinc-700 transition-colors"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-zinc-200 truncate leading-tight flex items-center gap-1.5">
                                <span
                                  className={`w-1 rounded-full h-3 inline-block shrink-0 ${
                                    item.type === "Bug"
                                      ? "bg-rose-500"
                                      : item.type === "Feature"
                                        ? "bg-blue-500"
                                        : "bg-purple-500"
                                  }`}
                                />
                                <span className="truncate">{item.title}</span>
                              </div>
                              {item.description && (
                                <div className="text-[9px] text-zinc-500 truncate mt-0.5">
                                  {item.description}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 select-none">
                              <span
                                className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded border ${
                                  item.status === "Done"
                                    ? "text-zinc-400 bg-zinc-950 border-zinc-800 line-through"
                                    : item.status === "In Progress"
                                      ? "text-blue-400 bg-blue-500/5 border-blue-500/20"
                                      : "text-purple-400 bg-purple-500/5 border-purple-500/20"
                                }`}
                              >
                                {item.status}
                              </span>
                              <span
                                className={`text-[8px] font-mono px-1 py-0.5 rounded font-bold ${
                                  item.priority === "Critical"
                                    ? "bg-rose-950 text-rose-400"
                                    : item.priority === "High"
                                      ? "bg-amber-950 text-amber-400"
                                      : item.priority === "Medium"
                                        ? "bg-blue-950 text-blue-400"
                                        : "bg-zinc-900 text-zinc-500"
                                }`}
                              >
                                {item.priority}
                              </span>
                              <button
                                onClick={() =>
                                  setAiCommanderParsedIssues((prev) =>
                                    prev.filter((p) => p.id !== item.id),
                                  )
                                }
                                className="text-zinc-600 hover:text-red-400 p-0.5 rounded hover:bg-zinc-800 transition-colors"
                              >
                                <Trash size={11} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="pt-2 border-t border-zinc-900 mt-2 shrink-0">
                        <button
                          onClick={importAICommanderParsedIssues}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 rounded text-[11px] transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/10 border border-emerald-500/20"
                        >
                          <CheckCircle2 size={12} /> Compile & Import Sorted
                          List
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-3 mb-6 bg-[#121214] p-2 rounded-lg border border-zinc-800">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search issues by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#09090b] border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>
        <span className="text-zinc-600 text-xs px-1 select-none">|</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-semibold tracking-wider text-zinc-500">
            Type
          </span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-[#09090b] border border-zinc-800 text-zinc-300 text-xs rounded outline-none py-1.5 px-2 focus:border-blue-500/50 w-24"
          >
            <option value="All">All Types</option>
            <option value="Task">Task</option>
            <option value="Bug">Bug</option>
            <option value="Feature">Feature</option>
          </select>
        </div>
        <span className="text-zinc-600 text-xs px-1 select-none">|</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-semibold tracking-wider text-zinc-500">
            Status
          </span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#09090b] border border-zinc-800 text-zinc-300 text-xs rounded outline-none py-1.5 px-2 focus:border-blue-500/50 w-28"
          >
            <option value="All">All Status</option>
            <option value="Todo">Todo</option>
            <option value="In Progress">In Progress</option>
            <option value="Done">Done</option>
          </select>
        </div>
        <span className="text-zinc-600 text-xs px-1 select-none">|</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-semibold tracking-wider text-zinc-500">
            Priority
          </span>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-[#09090b] border border-zinc-800 text-zinc-300 text-xs rounded outline-none py-1.5 px-2 focus:border-blue-500/50 w-28"
          >
            <option value="All">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
        <span className="text-zinc-600 text-xs px-1 select-none">|</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-semibold tracking-wider text-zinc-500">
            Sprint
          </span>
          <select
            value={filterSprint}
            onChange={(e) => setFilterSprint(e.target.value)}
            className="bg-[#09090b] border border-zinc-800 text-zinc-300 text-xs rounded outline-none py-1.5 px-2 focus:border-blue-500/50 w-32"
          >
            <option value="All">All Sprints</option>
            <option value="Backlog">Backlog</option>
            {activeSprints.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <span className="text-zinc-600 text-xs px-1 select-none">|</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-semibold tracking-wider text-zinc-500">
            Phase
          </span>
          <select
            value={filterPhase}
            onChange={(e) => setFilterPhase(e.target.value)}
            className="bg-[#09090b] border border-zinc-800 text-zinc-300 text-xs rounded outline-none py-1.5 px-2 focus:border-blue-500/50 w-32"
          >
            <option value="All">All Phases</option>
            {activePhases.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div
        className={`flex flex-col flex-1 ${viewMode === "list" ? "border border-zinc-800 bg-[#121214] rounded-xl overflow-hidden min-h-0" : "min-h-0"}`}
      >
        {/* Content */}
        <div
          className={`flex-1 relative ${viewMode === "list" ? "overflow-y-auto" : "flex gap-4 overflow-x-auto overflow-y-hidden"}`}
        >
          {!activeProjectId ? (
            <div className="absolute inset-0 flex items-center justify-center text-zinc-500 flex-col">
              <Disc size={32} className="opacity-20 mb-3" />
              <span className="text-xs">
                Create a project first to manage issues.
              </span>
            </div>
          ) : activeIssues.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500">
              <Disc size={32} className="opacity-20 mb-3" />
              <span className="text-xs">No issues found.</span>
            </div>
          ) : viewMode === "list" ? (
            <div className="flex flex-col h-full w-full">
              <div className="flex items-center px-4 py-2 border-b border-zinc-800 bg-[#121214] text-xs sticky top-0 z-10 min-h-[40px]">
                <button
                  onClick={toggleSelectAll}
                  className="mr-4 group flex items-center"
                >
                  {selectedIssueIds.size > 0 &&
                  selectedIssueIds.size === activeIssues.length ? (
                    <CheckSquare size={14} className="text-blue-500" />
                  ) : (
                    <Square
                      size={14}
                      className="text-zinc-600 group-hover:text-zinc-400 transition-colors"
                    />
                  )}
                </button>
                {selectedIssueIds.size > 0 ? (
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-300 font-medium">
                      {selectedIssueIds.size} selected
                    </span>
                    <div className="h-3 w-px bg-zinc-800"></div>
                    <button
                      onClick={() => handleBulkUpdateStatus("Todo")}
                      className="text-zinc-400 hover:text-zinc-200 transition-colors"
                    >
                      Set Todo
                    </button>
                    <button
                      onClick={() => handleBulkUpdateStatus("In Progress")}
                      className="text-blue-400/80 hover:text-blue-400 transition-colors"
                    >
                      Set In Progress
                    </button>
                    <button
                      onClick={() => handleBulkUpdateStatus("Done")}
                      className="text-emerald-500/80 hover:text-emerald-400 transition-colors"
                    >
                      Set Done
                    </button>
                    <div className="h-3 w-px bg-zinc-800"></div>
                    <button
                      onClick={handleBulkDelete}
                      className="text-rose-500/80 hover:text-rose-400 flex items-center gap-1 transition-colors"
                    >
                      <Trash size={12} /> Delete
                    </button>
                  </div>
                ) : (
                  <div className="flex text-[10px] text-zinc-500 font-semibold tracking-wide uppercase gap-4 flex-1">
                    <div className="w-16 ml-8">ID</div>
                    <div className="flex-1">Title</div>
                    <div className="w-32 text-right pr-6">Priority</div>
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-y-auto">
                {visibleIssuesWithDepth.map(({ issue, depth }, i) => {
                  const children = activeIssues.filter((c) => c.parentId === issue.id);
                  const hasChildren = children.length > 0;
                  const isExpanded = expandedIds[issue.id] !== false;

                  const basePaddingLeft = activeIssueId === issue.id ? 14 : 16;
                  const pl = basePaddingLeft + depth * 20;

                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      key={issue.id}
                      onClick={() => setActiveIssueId(issue.id)}
                      className={`relative flex items-center py-2.5 border-b border-zinc-800/80 hover:bg-[#18181b] transition-all group cursor-pointer ${selectedIssueIds.has(issue.id) ? "bg-[#18181b]" : ""} ${activeIssueId === issue.id ? "bg-[#1c1c1f] border-l-2 border-l-blue-500 pl-[14px]" : ""}`}
                      style={{ paddingLeft: `${pl}px`, paddingRight: "16px" }}
                    >
                      {/* Visual tree guide lines */}
                      {depth > 0 && Array.from({ length: depth }).map((_, dIdx) => (
                        <div
                          key={dIdx}
                          className="absolute top-0 bottom-0 border-l border-zinc-800/40"
                          style={{ left: `${16 + dIdx * 20 + 8}px` }}
                        />
                      ))}

                      {/* Expand/Collapse Chevron */}
                      <div className="w-5 h-5 flex items-center justify-center shrink-0 mr-1">
                        {hasChildren ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedIds((prev) => ({
                                ...prev,
                                [issue.id]: !isExpanded,
                              }));
                            }}
                            className="p-0.5 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors cursor-pointer"
                          >
                            {isExpanded ? (
                              <ChevronDown size={11} />
                            ) : (
                              <ChevronRight size={11} />
                            )}
                          </button>
                        ) : depth > 0 ? (
                          <div className="w-1.5 h-1.5 rounded-full bg-zinc-700/50" />
                        ) : null}
                      </div>

                      <button
                        onClick={(e) => toggleSelect(issue.id, e)}
                        className="mr-3 group/box shrink-0"
                      >
                        {selectedIssueIds.has(issue.id) ? (
                          <CheckSquare size={14} className="text-blue-500" />
                        ) : (
                          <Square
                            size={14}
                            className="text-zinc-600 group-hover/box:text-zinc-400 transition-colors"
                          />
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateIssue(issue.id, {
                            status: issue.status === "Done" ? "Todo" : "Done",
                          });
                        }}
                        className="shrink-0 mr-3 cursor-pointer"
                      >
                        {issue.status === "Done" ? (
                          <CheckCircle2 size={14} className="text-emerald-500" />
                        ) : issue.status === "In Progress" ? (
                          <Circle
                            size={14}
                            className="text-blue-400 fill-blue-400/20"
                          />
                        ) : (
                          <Circle
                            size={14}
                            className="text-zinc-600 hover:text-zinc-400 transition-colors"
                          />
                        )}
                      </button>
                      <div className="w-16 text-[10px] font-mono text-zinc-500 group-hover:text-blue-400/70 transition-colors shrink-0">
                        #{issue.id.slice(0, 5)}
                      </div>
                      <div className="flex-1 min-w-0 pr-4 flex items-center gap-2">
                        <span
                          className={`text-xs font-medium truncate flex items-center gap-1.5 ${issue.status === "Done" ? "text-zinc-500 line-through" : "text-zinc-200"}`}
                        >
                          {issue.type === "Bug" && (
                            <BugIcon
                              size={12}
                              className="text-rose-400 shrink-0"
                            />
                          )}
                          {issue.type === "Feature" && (
                            <Zap size={12} className="text-blue-400 shrink-0" />
                          )}
                          {issue.title}
                        </span>
                        {hasChildren && (
                          <span className="shrink-0 text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1 py-0.5 rounded">
                            {children.filter(c => c.status === "Done").length}/{children.length} sub-tasks
                          </span>
                        )}
                        {issue.phaseId && (
                          <span className="shrink-0 text-[10px] bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 rounded text-zinc-400">
                            {phases.find((p) => p.id === issue.phaseId)?.name ||
                              "Unknown Phase"}
                          </span>
                        )}
                        {issue.sprintId && (
                          <span className="shrink-0 text-[10px] bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 rounded text-zinc-300 flex items-center gap-1 truncate max-w-[100px]">
                            <Disc size={10} />{" "}
                            {activeSprints.find((s) => s.id === issue.sprintId)
                              ?.name || "Unknown Sprint"}
                          </span>
                        )}
                        {issue.assignee && (
                          <span
                            className="shrink-0 text-[10px] bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded text-zinc-500 flex items-center gap-1"
                            title="Assignee"
                          >
                            <User size={10} /> {issue.assignee}
                          </span>
                        )}
                        {issue.storyPoints !== undefined && (
                          <span
                            className="shrink-0 text-[10px] text-amber-500/80 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full flex items-center gap-0.5"
                            title="Estimate"
                          >
                            <Hash size={10} /> {issue.storyPoints}
                          </span>
                        )}
                        {issue.dueDate && (
                          <span
                            className="shrink-0 text-[10px] text-pink-500/80 bg-pink-500/10 border border-pink-500/20 px-1.5 py-0.5 rounded-full flex items-center gap-0.5"
                            title="Due Date"
                          >
                            <CalendarIcon size={10} /> {issue.dueDate}
                          </span>
                        )}
                        {issue.recurrenceRule && (
                          <span
                            className="shrink-0 text-[10px] text-indigo-400/80 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded-full flex items-center gap-0.5"
                            title="Recurring"
                          >
                            <Columns size={10} /> {issue.recurrenceRule}
                          </span>
                        )}
                        {issue.dependencyIds &&
                          issue.dependencyIds.length > 0 && (
                            <span
                              className="shrink-0 text-[10px] text-rose-500/80 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded-full flex items-center gap-0.5"
                              title="Blocked By"
                            >
                              <LinkIcon size={10} /> {issue.dependencyIds.length}
                            </span>
                          )}
                        {issue.labels?.map((lbl) => (
                          <span
                            key={lbl}
                            className="shrink-0 text-[9px] text-blue-400/80 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded-full"
                          >
                            {lbl}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-4 w-32 shrink-0 justify-end">
                        {getPriorityBadge(issue.priority)}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteIssue(issue.id);
                          }}
                          className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ) : (
            // Kanban View
            columns.map((col) => {
              const colIssues = activeIssues.filter((i) => i.status === col);
              return (
                <div
                  key={col}
                  className={`w-80 shrink-0 flex flex-col bg-[#121214] border rounded-xl max-h-full transition-colors ${dragOverCol === col ? "border-blue-500/50 bg-[#121214]/80" : "border-zinc-800"}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dragOverCol !== col) setDragOverCol(col);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    if (e.currentTarget === e.target) setDragOverCol(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverCol(null);
                    const issueId = e.dataTransfer.getData("text/plain");
                    if (issueId) {
                      updateIssue(issueId, { status: col as any });
                    }
                  }}
                >
                  <div className="p-3 border-b border-zinc-800/50 flex items-center justify-between pointer-events-none">
                    <h3 className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
                      {col === "Done" ? (
                        <CheckCircle2 size={14} className="text-emerald-500" />
                      ) : col === "In Progress" ? (
                        <Circle
                          size={14}
                          className="text-blue-400 fill-blue-400/20"
                        />
                      ) : (
                        <Circle size={14} className="text-zinc-600" />
                      )}
                      {col}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-500">
                      {colIssues.length}
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                    {colIssues.map((issue) => {
                      const cardChildren = activeIssues.filter((i) => i.parentId === issue.id);
                      const cardParent = issue.parentId ? activeIssues.find((i) => i.id === issue.parentId) : null;
                      return (
                        <div
                          key={issue.id}
                          draggable
                          onDragStart={(e) => {
                            e.stopPropagation();
                            e.dataTransfer.setData("text/plain", issue.id);
                            // Setting ghost image offset
                            e.dataTransfer.effectAllowed = "move";
                          }}
                          onClick={() => setActiveIssueId(issue.id)}
                          className={`bg-[#09090b] border border-zinc-800/80 rounded-lg p-3 hover:border-zinc-700 transition-colors cursor-grab active:cursor-grabbing group shadow-sm flex flex-col ${activeIssueId === issue.id ? "border-blue-500/50 hover:border-blue-500/70" : ""}`}
                        >
                        <div className="flex items-start justify-between mb-2">
                          <div className="text-[10px] font-mono text-zinc-500 group-hover:text-blue-400/70 transition-colors">
                            #{issue.id.slice(0, 5)}
                          </div>
                          <div className="flex items-center gap-2">
                            {getPriorityBadge(issue.priority)}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteIssue(issue.id);
                              }}
                              className="text-zinc-655 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1 shrink-0"
                            >
                              <Trash size={12} />
                            </button>
                          </div>
                        </div>
                        <h4
                          className={`text-xs font-medium leading-relaxed mb-1 flex items-center gap-1.5 ${issue.status === "Done" ? "text-zinc-500 line-through" : "text-zinc-200"}`}
                        >
                          {issue.type === "Bug" && (
                            <BugIcon
                              size={12}
                              className="text-rose-400 shrink-0"
                            />
                          )}
                          {issue.type === "Feature" && (
                            <Zap size={12} className="text-blue-400 shrink-0" />
                          )}
                          {issue.title}
                        </h4>
                        {issue.description && (
                          <p className="text-[10px] text-zinc-500 line-clamp-2 leading-relaxed mb-3">
                            {issue.description}
                          </p>
                        )}

                        {/* Meta tags inline */}
                        {issue.labels?.length ||
                        issue.assignee ||
                        issue.storyPoints ||
                        issue.recurrenceRule ||
                        issue.dueDate ||
                        cardChildren.length > 0 ||
                        cardParent ? (
                          <div className="flex flex-wrap items-center gap-1.5 mt-2 mb-1">
                            {cardChildren.length > 0 && (
                              <span
                                className="flex items-center gap-1 text-[9px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded-full"
                                title="Sub-tasks progress"
                              >
                                <ChevronRight size={9} /> {cardChildren.filter(c => c.status === "Done").length}/{cardChildren.length} sub-tasks
                              </span>
                            )}
                            {cardParent && (
                              <span
                                className="flex items-center gap-1 text-[9px] text-zinc-400 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded-full"
                                title={`Sub-task of ${cardParent.title}`}
                              >
                                <ChevronRight size={9} className="rotate-180 text-zinc-500" /> Sub-task
                              </span>
                            )}
                            {issue.assignee && (
                              <span
                                className="flex items-center gap-1 text-[9px] text-zinc-400 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded-full"
                                title="Assignee"
                              >
                                <User size={9} /> {issue.assignee}
                              </span>
                            )}
                            {issue.storyPoints !== undefined && (
                              <span
                                className="flex items-center gap-0.5 text-[9px] text-amber-500/80 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full"
                                title="Estimate"
                              >
                                <Hash size={9} /> {issue.storyPoints}
                              </span>
                            )}
                            {issue.dueDate && (
                              <span
                                className="flex items-center gap-0.5 text-[9px] text-pink-500/80 bg-pink-500/10 border border-pink-500/20 px-1.5 py-0.5 rounded-full"
                                title="Due Date"
                              >
                                <CalendarIcon size={9} /> {issue.dueDate}
                              </span>
                            )}
                            {issue.recurrenceRule && (
                              <span
                                className="flex items-center gap-0.5 text-[9px] text-indigo-400/80 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded-full"
                                title="Recurring"
                              >
                                <Columns size={9} /> {issue.recurrenceRule}
                              </span>
                            )}
                            {issue.dependencyIds &&
                              issue.dependencyIds.length > 0 && (
                                <span
                                  className="flex items-center gap-0.5 text-[9px] text-rose-500/80 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded-full"
                                  title="Blocked By"
                                >
                                  <LinkIcon size={9} />{" "}
                                  {issue.dependencyIds.length}
                                </span>
                              )}
                            {issue.labels?.map((lbl) => (
                              <span
                                key={lbl}
                                className="text-[9px] text-blue-400/80 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded-full"
                              >
                                {lbl}
                              </span>
                            ))}
                          </div>
                        ) : null}

                        {(issue.phaseId || issue.sprintId) && (
                          <div className="flex items-center gap-2 mt-auto pt-2 border-t border-zinc-800/50">
                            {issue.phaseId && (
                              <span className="text-[9px] bg-zinc-800/50 text-zinc-400 px-1.5 py-0.5 rounded truncate max-w-[100px]">
                                Phase:{" "}
                                {phases.find((p) => p.id === issue.phaseId)
                                  ?.name || "Unknown Phase"}
                              </span>
                            )}
                            {issue.sprintId && (
                              <span className="text-[9px] bg-zinc-800 border border-zinc-700 text-zinc-300 px-1.5 py-0.5 rounded flex items-center gap-1 truncate max-w-[100px]">
                                <Disc size={9} />{" "}
                                {activeSprints.find(
                                  (s) => s.id === issue.sprintId,
                                )?.name || "Unknown Sprint"}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  </div>
                  {activeProjectId && (
                    <div className="p-2 pt-0 mt-auto">
                      <button
                        onClick={() => {
                          setFormData({
                            title: "",
                            description: "",
                            type: "Task",
                            status: col as any,
                            priority: "Medium",
                            phaseId: "",
                            sprintId: "",
                            assignee: "",
                            storyPoints: "",
                            dueDate: "",
                            recurrenceRule: "",
                            dependencyIds: "",
                            labels: "",
                            bugEnvironment: "",
                            crashLogs: "",
                            parentId: "",
                          });
                          setShowModal(true);
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-2 mt-1 text-xs text-zinc-500 hover:text-zinc-300 hover:bg-[#18181b] border border-dashed border-zinc-800 rounded-lg transition-all"
                      >
                        <Plus size={14} /> Quick Add
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121214] border border-zinc-800 rounded-xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-zinc-800/50 shrink-0">
              <h2 className="text-lg font-semibold text-zinc-100">
                Create New Issue
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleCreate}
              className="flex flex-col flex-1 min-h-0 overflow-hidden"
            >
              <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-zinc-400">
                      Issue Title
                    </label>
                    <button
                      type="button"
                      onClick={() => toggleVoice("title")}
                      className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded transition ${isRecordingTitle ? "bg-red-500/10 text-red-400 animate-pulse border border-red-500/30" : "text-zinc-500 hover:text-zinc-300"}`}
                      title="Voice Type Title"
                    >
                      {isRecordingTitle ? (
                        <StopCircle size={11} className="text-red-500" />
                      ) : (
                        <Mic size={11} />
                      )}
                      <span>
                        {isRecordingTitle ? "Listening..." : "Voice Type"}
                      </span>
                    </button>
                  </div>
                  <input
                    autoFocus
                    required
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 outline-none focus:border-blue-500 transition-colors"
                    placeholder="What needs to be done?"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-zinc-400">
                      Description / Notes (Optional)
                    </label>
                    <button
                      type="button"
                      onClick={() => toggleVoice("description")}
                      className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded transition ${isRecordingDesc ? "bg-red-500/10 text-red-400 animate-pulse border border-red-500/30" : "text-zinc-500 hover:text-zinc-300"}`}
                      title="Voice Type Description"
                    >
                      {isRecordingDesc ? (
                        <StopCircle size={11} className="text-red-500" />
                      ) : (
                        <Mic size={11} />
                      )}
                      <span>
                        {isRecordingDesc ? "Listening..." : "Voice Type"}
                      </span>
                    </button>
                  </div>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 outline-none focus:border-blue-500 transition-colors resize-none h-20"
                    placeholder="Add context, links, or notes..."
                  />
                </div>

                {formData.type === "Bug" && (
                  <div className="bg-rose-500/5 border border-rose-500/10 rounded-lg p-3 space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 mb-1">
                      <BugIcon size={12} /> Bug Details
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-zinc-400 mb-1">
                        Environment / Version
                      </label>
                      <input
                        value={formData.bugEnvironment || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            bugEnvironment: e.target.value,
                          })
                        }
                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-200 outline-none focus:border-rose-500/50 transition-colors"
                        placeholder="e.g. Production - iOS 15.1"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-zinc-400 mb-1">
                        Crash Logs / Stacktrace
                      </label>
                      <textarea
                        value={formData.crashLogs || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            crashLogs: e.target.value,
                          })
                        }
                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded px-3 py-1.5 text-xs font-mono text-zinc-300 outline-none focus:border-rose-500/50 transition-colors resize-none h-16"
                        placeholder="Paste error output here..."
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                      Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e: any) =>
                        setFormData({ ...formData, type: e.target.value })
                      }
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="Task">Task</option>
                      <option value="Bug">Bug</option>
                      <option value="Feature">Feature</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e: any) =>
                        setFormData({ ...formData, priority: e.target.value })
                      }
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e: any) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="Todo">Todo</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Done">Done</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                      Assign to Phase (Optional)
                    </label>
                    <select
                      value={formData.phaseId}
                      onChange={(e) =>
                        setFormData({ ...formData, phaseId: e.target.value })
                      }
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="">No phase</option>
                      {activePhases.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                      Sprint (Optional)
                    </label>
                    <select
                      value={formData.sprintId}
                      onChange={(e) =>
                        setFormData({ ...formData, sprintId: e.target.value })
                      }
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="">Backlog</option>
                      {activeSprints.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                      Assignee (Optional)
                    </label>
                    <select
                      value={formData.assignee}
                      onChange={(e) =>
                        setFormData({ ...formData, assignee: e.target.value })
                      }
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="">Unassigned</option>
                      <optgroup label="AI Agents">
                        {agents?.map((ag) => (
                          <option key={ag.id} value={ag.name}>
                            {ag.name} ({ag.role})
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Workspace Core">
                        <option value="Google J-Suite">Google J-Suite (AI Assistant)</option>
                        <option value="drummerforger@gmail.com">drummerforger@gmail.com (You)</option>
                      </optgroup>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Parent Task (Optional)
                  </label>
                  <select
                    value={formData.parentId || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, parentId: e.target.value })
                    }
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="">None (Top-level Task)</option>
                    {activeIssues.map((iss) => (
                      <option key={iss.id} value={iss.id}>
                        {iss.title} (#{iss.id.slice(0, 5)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-4 bg-[#09090b]/50 flex justify-end gap-3 border-t border-zinc-800/80 shrink-0 rounded-b-xl">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium transition-colors"
                >
                  Create Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Active Issue Slide-over */}
      <AnimatePresence>
        {activeIssue && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-0 right-0 bottom-0 w-96 bg-[#121214] border-l border-zinc-800 shadow-2xl flex flex-col z-20"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-[#09090b]">
              <div className="flex items-center gap-2 text-zinc-400">
                <span className="font-mono text-xs uppercase">
                  Issue #{activeIssue.id.slice(0, 5)}
                </span>
              </div>
              <button
                onClick={() => setActiveIssueId(null)}
                className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded hover:bg-zinc-800"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              <div>
                <textarea
                  value={activeIssue.title}
                  onChange={(e) =>
                    updateIssue(activeIssue.id, { title: e.target.value })
                  }
                  className="w-full bg-transparent border-none text-lg font-semibold text-zinc-100 outline-none resize-none px-0 py-0 leading-tight focus:ring-0 placeholder-zinc-700"
                  rows={2}
                />
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center text-xs">
                  <div className="w-24 text-zinc-500 shrink-0 flex items-center gap-1.5">
                    <BugIcon size={14} /> Type
                  </div>
                  <select
                    value={activeIssue.type}
                    onChange={(e) =>
                      updateIssue(activeIssue.id, {
                        type: e.target.value as any,
                      })
                    }
                    className="flex-1 bg-transparent border-none text-zinc-200 outline-none py-1 px-0 hover:bg-zinc-800/50 cursor-pointer rounded"
                  >
                    <option value="Task">Task</option>
                    <option value="Bug">Bug</option>
                    <option value="Feature">Feature</option>
                  </select>
                </div>

                <div className="flex items-center text-xs">
                  <div className="w-24 text-zinc-500 shrink-0 flex items-center gap-1.5">
                    <Circle size={14} /> Status
                  </div>
                  <select
                    value={activeIssue.status}
                    onChange={(e) =>
                      updateIssue(activeIssue.id, {
                        status: e.target.value as any,
                      })
                    }
                    className="flex-1 bg-transparent border-none text-zinc-200 outline-none py-1 px-0 hover:bg-zinc-800/50 cursor-pointer rounded"
                  >
                    <option value="Todo">Todo</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </div>

                <div className="flex items-center text-xs">
                  <div className="w-24 text-zinc-500 shrink-0 flex items-center gap-1.5">
                    <AlertCircle size={14} /> Priority
                  </div>
                  <select
                    value={activeIssue.priority}
                    onChange={(e) =>
                      updateIssue(activeIssue.id, {
                        priority: e.target.value as any,
                      })
                    }
                    className="flex-1 bg-transparent border-none text-zinc-200 outline-none py-1 px-0 hover:bg-zinc-800/50 cursor-pointer rounded"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div className="flex items-center text-xs">
                  <div className="w-24 text-zinc-500 shrink-0 flex items-center gap-1.5">
                    <Calendar size={14} /> Phase
                  </div>
                  <select
                    value={activeIssue.phaseId || ""}
                    onChange={(e) =>
                      updateIssue(activeIssue.id, {
                        phaseId: e.target.value || undefined,
                      })
                    }
                    className="flex-1 bg-transparent border-none text-zinc-200 outline-none py-1 px-0 hover:bg-zinc-800/50 cursor-pointer rounded truncate pr-4"
                  >
                    <option value="">No phase</option>
                    {activePhases.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center text-xs">
                  <div className="w-24 text-zinc-500 shrink-0 flex items-center gap-1.5">
                    <Disc size={14} /> Sprint
                  </div>
                  <select
                    value={activeIssue.sprintId || ""}
                    onChange={(e) =>
                      updateIssue(activeIssue.id, {
                        sprintId: e.target.value || undefined,
                      })
                    }
                    className="flex-1 bg-transparent border-none text-zinc-200 outline-none py-1 px-0 hover:bg-zinc-800/50 cursor-pointer rounded truncate pr-4"
                  >
                    <option value="">Backlog</option>
                    {activeSprints.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center text-xs">
                  <div className="w-24 text-zinc-500 shrink-0 flex items-center gap-1.5">
                    <User size={14} /> Assignee
                  </div>
                  <select
                    value={activeIssue.assignee || ""}
                    onChange={(e) =>
                      updateIssue(activeIssue.id, { assignee: e.target.value })
                    }
                    className="flex-1 bg-transparent border-none text-zinc-200 outline-none py-1 px-0 focus:ring-0 placeholder-zinc-600 cursor-pointer font-medium"
                  >
                    <option value="">Unassigned</option>
                    <optgroup label="AI Agents">
                      {agents?.map((ag) => (
                        <option key={ag.id} value={ag.name}>
                          {ag.name} ({ag.role})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Workspace Core">
                      <option value="Google J-Suite">Google J-Suite (AI Assistant)</option>
                      <option value="drummerforger@gmail.com">drummerforger@gmail.com (You)</option>
                    </optgroup>
                  </select>
                </div>

                <div className="flex items-center text-xs">
                  <div className="w-24 text-zinc-500 shrink-0 flex items-center gap-1.5">
                    <Hash size={14} /> Estimate
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={activeIssue.storyPoints || ""}
                    onChange={(e) =>
                      updateIssue(activeIssue.id, {
                        storyPoints: Number(e.target.value) || undefined,
                      })
                    }
                    placeholder="Story points..."
                    className="flex-1 bg-transparent border-none text-zinc-200 outline-none py-1 px-0 focus:ring-0 placeholder-zinc-600"
                  />
                </div>

                <div className="flex items-center text-xs">
                  <div className="w-24 text-zinc-500 shrink-0 flex items-center gap-1.5">
                    <CalendarIcon size={14} /> Due Date
                  </div>
                  <input
                    type="date"
                    value={activeIssue.dueDate || ""}
                    onChange={(e) =>
                      updateIssue(activeIssue.id, { dueDate: e.target.value })
                    }
                    className="flex-1 bg-transparent border-none text-zinc-200 outline-none py-1 px-0 focus:ring-0 cursor-pointer"
                    style={{ colorScheme: "dark" }}
                  />
                </div>

                <div className="flex items-center text-xs">
                  <div className="w-24 text-zinc-500 shrink-0 flex items-center gap-1.5">
                    <Columns size={14} /> Recurrence
                  </div>
                  <select
                    value={activeIssue.recurrenceRule || ""}
                    onChange={(e) =>
                      updateIssue(activeIssue.id, {
                        recurrenceRule:
                          (e.target.value as "Daily" | "Weekly" | "Monthly") ||
                          undefined,
                      })
                    }
                    className="flex-1 bg-transparent border-none text-zinc-200 outline-none py-1 px-0 hover:bg-zinc-800/50 cursor-pointer rounded"
                  >
                    <option value="">None (One-time)</option>
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                </div>

                <div className="flex items-center text-xs">
                  <div className="w-24 text-zinc-500 shrink-0 flex items-center gap-1.5">
                    <ChevronRight size={14} /> Parent Task
                  </div>
                  <select
                    value={activeIssue.parentId || ""}
                    onChange={(e) =>
                      updateIssue(activeIssue.id, {
                        parentId: e.target.value || undefined,
                      })
                    }
                    className="flex-1 bg-transparent border-none text-zinc-200 outline-none py-1 px-0 hover:bg-zinc-800/50 cursor-pointer rounded"
                  >
                    <option value="">None (Top-level)</option>
                    {activeIssues
                      .filter(
                        (iss) =>
                          iss.id !== activeIssue.id &&
                          !getDescendantIds(activeIssue.id, issues).includes(iss.id)
                      )
                      .map((iss) => (
                        <option key={iss.id} value={iss.id}>
                          {iss.title} (#{iss.id.slice(0, 5)})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="flex items-start text-xs pt-1">
                  <div className="w-24 text-zinc-500 shrink-0 flex items-center gap-1.5 pt-1.5">
                    <LinkIcon size={14} /> Blocked By
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={
                        activeIssue.dependencyIds
                          ? activeIssue.dependencyIds.join(", ")
                          : ""
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        updateIssue(activeIssue.id, {
                          dependencyIds: val
                            .split(",")
                            .map((l) => l.trim())
                            .filter((l) => l),
                        });
                      }}
                      placeholder="Comma-separated IDs e.g. #abcde"
                      className="w-full bg-transparent border-none text-zinc-200 outline-none py-1 px-0 focus:ring-0 placeholder-zinc-600 block mb-2"
                    />
                    <div className="flex flex-wrap gap-1">
                      {activeIssue.dependencyIds?.map((dep) => {
                        const matchedIssue = issues.find(
                          (i) =>
                            i.id === dep ||
                            i.id.startsWith(dep) ||
                            i.title.toLowerCase().includes(dep.toLowerCase()),
                        );
                        return (
                          <span
                            key={dep}
                            className="bg-rose-500/10 text-rose-400 text-[10px] px-1.5 py-0.5 rounded border border-rose-500/20 flex items-center gap-1"
                            title={
                              matchedIssue
                                ? `${matchedIssue.title} (${matchedIssue.status})`
                                : "Dependency"
                            }
                          >
                            <LinkIcon size={10} className="shrink-0" />{" "}
                            {matchedIssue ? matchedIssue.title : dep}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-start text-xs pt-1">
                  <div className="w-24 text-zinc-500 shrink-0 flex items-center gap-1.5 pt-1.5">
                    <Tag size={14} /> Labels
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={
                        activeIssue.labels ? activeIssue.labels.join(", ") : ""
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        updateIssue(activeIssue.id, {
                          labels: val
                            .split(",")
                            .map((l) => l.trim())
                            .filter((l) => l),
                        });
                      }}
                      placeholder="bug, feature, docs..."
                      className="w-full bg-transparent border-none text-zinc-200 outline-none py-1 px-0 focus:ring-0 placeholder-zinc-600 block mb-2"
                    />
                    <div className="flex flex-wrap gap-1">
                      {activeIssue.labels?.map((lbl) => (
                        <span
                          key={lbl}
                          className="bg-zinc-800 text-zinc-300 text-[10px] px-1.5 py-0.5 rounded border border-zinc-700/50"
                        >
                          {lbl}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-800/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
                    <AlignLeft size={14} /> Description
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleVoice("slideoverDesc")}
                    className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded transition ${isRecordingSlideOverDesc ? "bg-red-500/10 text-red-400 animate-pulse border border-red-500/30" : "text-zinc-500 hover:text-zinc-300"}`}
                    title="Voice Type Description"
                  >
                    {isRecordingSlideOverDesc ? (
                      <StopCircle size={11} className="text-red-500" />
                    ) : (
                      <Mic size={11} />
                    )}
                    <span>
                      {isRecordingSlideOverDesc ? "Listening..." : "Voice Type"}
                    </span>
                  </button>
                </div>
                <textarea
                  value={activeIssue.description || ""}
                  onChange={(e) =>
                    updateIssue(activeIssue.id, { description: e.target.value })
                  }
                  className="w-full h-32 bg-[#09090b] border border-zinc-800/80 rounded block px-3 py-2 text-xs text-zinc-300 outline-none focus:border-blue-500/50 transition-colors resize-y font-mono"
                  placeholder="Add issue markdown details here..."
                />
              </div>

              {activeIssue.type === "Bug" && (
                <div className="pt-4 border-t border-zinc-800/50 space-y-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-medium text-rose-400 mb-2">
                      <BugIcon size={14} /> Bug Environment
                    </div>
                    <input
                      value={activeIssue.bugEnvironment || ""}
                      onChange={(e) =>
                        updateIssue(activeIssue.id, {
                          bugEnvironment: e.target.value,
                        })
                      }
                      className="w-full bg-[#09090b] border border-rose-500/20 rounded px-3 py-1.5 text-xs text-zinc-300 outline-none focus:border-rose-500/50"
                      placeholder="Device, browser, OS, version..."
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-[10px] font-medium text-zinc-400 mb-2">
                      Crash Logs & Stacktrace
                    </div>
                    <textarea
                      value={activeIssue.crashLogs || ""}
                      onChange={(e) =>
                        updateIssue(activeIssue.id, {
                          crashLogs: e.target.value,
                        })
                      }
                      className="w-full h-24 bg-zinc-950 border border-zinc-800/80 rounded block px-3 py-2 text-[10px] text-rose-200/70 outline-none focus:border-rose-500/50 transition-colors resize-y font-mono"
                      placeholder="Paste application logs..."
                    />
                  </div>
                </div>
              )}

              {/* Sub-tasks Section */}
              <div className="pt-4 border-t border-zinc-800/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
                    <ChevronRight size={14} className="text-zinc-500" /> Sub-tasks
                  </div>
                  <span className="text-[10px] text-zinc-500 bg-zinc-900 border border-zinc-800/60 px-1.5 py-0.5 rounded font-mono font-medium">
                    {issues.filter((i) => i.parentId === activeIssue.id).filter((i) => i.status === "Done").length}/
                    {issues.filter((i) => i.parentId === activeIssue.id).length} Done
                  </span>
                </div>

                {/* Sub-tasks List */}
                <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                  {issues
                    .filter((i) => i.parentId === activeIssue.id)
                    .map((subTask) => (
                      <div
                        key={subTask.id}
                        className="flex items-center justify-between p-2 rounded bg-[#09090b] border border-zinc-800/60 hover:border-zinc-700/60 transition-colors group/sub"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() =>
                              updateIssue(subTask.id, {
                                status: subTask.status === "Done" ? "Todo" : "Done",
                              })
                            }
                            className="shrink-0 cursor-pointer"
                          >
                            {subTask.status === "Done" ? (
                              <CheckCircle2 size={13} className="text-emerald-500" />
                            ) : (
                              <Circle size={13} className="text-zinc-600 hover:text-zinc-400 transition-colors" />
                            )}
                          </button>
                          <span
                            onClick={() => setActiveIssueId(subTask.id)}
                            className={`text-xs truncate cursor-pointer hover:text-blue-400 transition-colors ${subTask.status === "Done" ? "text-zinc-500 line-through" : "text-zinc-300"}`}
                          >
                            {subTask.title}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => deleteIssue(subTask.id)}
                          className="text-zinc-655 hover:text-rose-400 p-1 opacity-0 group-hover/sub:opacity-100 transition-opacity"
                        >
                          <Trash size={12} />
                        </button>
                      </div>
                    ))}
                  {issues.filter((i) => i.parentId === activeIssue.id).length === 0 && (
                    <div className="text-[11px] text-zinc-600 italic py-1">
                      No sub-tasks defined.
                    </div>
                  )}
                </div>

                {/* Inline Rapid Sub-task Add Form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newSubTaskTitle.trim() || !activeProjectId) return;
                    addIssue({
                      projectId: activeProjectId,
                      title: newSubTaskTitle.trim(),
                      parentId: activeIssue.id,
                      type: "Task",
                      status: "Todo",
                      priority: "Medium",
                    });
                    setNewSubTaskTitle("");
                  }}
                  className="flex items-center gap-2 bg-[#09090b] border border-zinc-800 rounded px-2 py-1"
                >
                  <Plus size={12} className="text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Add a sub-task..."
                    value={newSubTaskTitle}
                    onChange={(e) => setNewSubTaskTitle(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-xs text-zinc-200 placeholder-zinc-600 p-0 focus:ring-0 focus:outline-none"
                  />
                  {newSubTaskTitle.trim() && (
                    <button
                      type="submit"
                      className="text-[10px] bg-blue-600 hover:bg-blue-500 text-white px-2 py-0.5 rounded font-medium transition-colors"
                    >
                      Add
                    </button>
                  )}
                </form>
              </div>

              {activeIssue.description && (
                <div className="pt-2">
                  <div className="text-xs text-zinc-500 mb-2 font-medium uppercase tracking-wider">
                    Preview
                  </div>
                  <div className="prose prose-invert prose-p:text-xs prose-p:text-zinc-300 prose-headings:text-zinc-200 prose-sm prose-a:text-blue-400 max-w-none bg-[#09090b] p-4 rounded border border-zinc-800/50">
                    <Markdown>{activeIssue.description}</Markdown>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-zinc-800 bg-[#09090b] flex justify-end">
              <button
                onClick={() => {
                  deleteIssue(activeIssue.id);
                  setActiveIssueId(null);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
              >
                <Trash size={12} /> Delete Issue
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
