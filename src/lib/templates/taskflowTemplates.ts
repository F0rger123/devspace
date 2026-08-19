// src/lib/templates/taskflowTemplates.ts
// TaskFlow Agile Project & Kanban Suite - Production-grade interactive React 18 templates

export const TASKFLOW_APP_CODE = `import React, { useState } from 'react';
import { 
  Kanban, CheckSquare, Plus, Search, Filter, MoreHorizontal, 
  Calendar, User, Tag, ArrowRight, MessageSquare, Check, X, 
  ChevronDown, ChevronRight, AlertCircle, Clock, BarChart3, 
  Layers, Sparkles, CheckCircle2, Shield, Settings, Trash2, Send
} from 'lucide-react';

export default function App() {
  const [viewMode, setViewMode] = useState('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [selectedTask, setSelectedTask] = useState(null);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [commentInput, setCommentInput] = useState('');

  const [sprintInfo] = useState({
    name: 'Sprint 14: Core Engine Optimization',
    daysLeft: 4,
    completedPoints: 26,
    totalPoints: 38
  });

  const [tasks, setTasks] = useState([
    {
      id: 'TASK-101',
      title: 'Architect Real-time WebSocket Protocol',
      desc: 'Implement low-latency bi-directional sync channel for multi-tenant collaborative state sync and delta patching.',
      column: 'in_progress',
      priority: 'URGENT',
      points: 8,
      tags: ['Backend', 'WebSocket', 'Infra'],
      assignee: { name: 'Elena Rostova', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' },
      subtasks: [
        { id: 1, title: 'Draft binary framing specification', done: true },
        { id: 2, title: 'Stress test connection heartbeat timeouts', done: true },
        { id: 3, title: 'Implement backpressure queue buffer', done: false }
      ],
      comments: [
        { id: 1, author: 'Alex Rivera', time: '2h ago', text: 'Verified the heartbeat timeout fix on staging. Latency looks solid!' }
      ],
      activity: [
        { id: 1, text: 'Elena moved task from Backlog to In Progress', time: '4h ago' }
      ]
    },
    {
      id: 'TASK-102',
      title: 'Design Mobile Goal Ring Components',
      desc: 'Build high-contrast SVG circular progress gauge with fluid animations and responsive stroke-dasharray transitions.',
      column: 'review',
      priority: 'HIGH',
      points: 5,
      tags: ['Design', 'SVG', 'UI'],
      assignee: { name: 'Alex Rivera', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
      subtasks: [
        { id: 1, title: 'Calculate circumference math for viewBox 120x120', done: true },
        { id: 2, title: 'Add dark mode glow filter effects', done: true }
      ],
      comments: [
        { id: 1, author: 'Sophia Lin', time: '1h ago', text: 'Strokes render crisply on Retina screens.' }
      ],
      activity: [
        { id: 1, text: 'Alex submitted pull request #48', time: '1h ago' }
      ]
    },
    {
      id: 'TASK-103',
      title: 'PostgreSQL Schema Migration for Multi-Tenancy',
      desc: 'Add tenant_id foreign keys, composite indexes on (tenant_id, created_at), and audit triggers.',
      column: 'backlog',
      priority: 'MEDIUM',
      points: 5,
      tags: ['Database', 'SQL'],
      assignee: { name: 'Marcus Vance', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' },
      subtasks: [
        { id: 1, title: 'Write up and down migration scripts', done: false },
        { id: 2, title: 'Benchmark query plans on 100k test rows', done: false }
      ],
      comments: [],
      activity: []
    },
    {
      id: 'TASK-104',
      title: 'Refactor Auth Token Refresh Interceptor',
      desc: 'Handle 401 Unauthorized responses with silent mutex-locked token refresh queue before retrying requests.',
      column: 'done',
      priority: 'HIGH',
      points: 3,
      tags: ['Auth', 'Security'],
      assignee: { name: 'Elena Rostova', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' },
      subtasks: [
        { id: 1, title: 'Create Axios interceptor singleton', done: true },
        { id: 2, title: 'Test concurrent expired token requests', done: true }
      ],
      comments: [
        { id: 1, author: 'Alex Rivera', time: 'Yesterday', text: 'Merged to main branch.' }
      ],
      activity: [
        { id: 1, text: 'Task completed and verified in CI', time: 'Yesterday' }
      ]
    },
    {
      id: 'TASK-105',
      title: 'Automate Docker Multi-Stage Production Build',
      desc: 'Shrink final container image footprint to sub-80MB using Alpine Linux and non-root execution user.',
      column: 'done',
      priority: 'LOW',
      points: 2,
      tags: ['DevOps', 'Docker'],
      assignee: { name: 'Marcus Vance', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' },
      subtasks: [
        { id: 1, title: 'Optimize node_modules layer caching', done: true }
      ],
      comments: [],
      activity: []
    }
  ]);

  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState('HIGH');
  const [newPoints, setNewPoints] = useState(3);
  const [newTag, setNewTag] = useState('Feature');

  const columns = [
    { id: 'backlog', title: 'Backlog', color: 'border-zinc-700' },
    { id: 'in_progress', title: 'In Progress', color: 'border-amber-500/40' },
    { id: 'review', title: 'Code Review', color: 'border-purple-500/40' },
    { id: 'done', title: 'Done', color: 'border-emerald-500/40' }
  ];

  const moveTask = (taskId, targetCol) => {
    setTasks(tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          column: targetCol,
          activity: [
            { id: Date.now(), text: 'Moved to ' + targetCol.replace('_', ' ').toUpperCase(), time: 'Just now' },
            ...t.activity
          ]
        };
      }
      return t;
    }));
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask(prev => ({ ...prev, column: targetCol }));
    }
  };

  const toggleSubtask = (taskId, subtaskId) => {
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        const newSubtasks = t.subtasks.map(st => st.id === subtaskId ? { ...st, done: !st.done } : st);
        return { ...t, subtasks: newSubtasks };
      }
      return t;
    });
    setTasks(updated);
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask(updated.find(t => t.id === taskId));
    }
  };

  const addComment = () => {
    if (!commentInput.trim() || !selectedTask) return;
    const newComm = {
      id: Date.now(),
      author: 'Alex Rivera',
      time: 'Just now',
      text: commentInput.trim()
    };
    const updated = tasks.map(t => {
      if (t.id === selectedTask.id) {
        return { ...t, comments: [...t.comments, newComm] };
      }
      return t;
    });
    setTasks(updated);
    setSelectedTask(updated.find(t => t.id === selectedTask.id));
    setCommentInput('');
  };

  const createNewTask = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const newTask = {
      id: 'TASK-' + (100 + tasks.length + 1),
      title: newTitle.trim(),
      desc: newDesc.trim() || 'No description provided.',
      column: 'backlog',
      priority: newPriority,
      points: Number(newPoints) || 3,
      tags: [newTag],
      assignee: { name: 'Alex Rivera', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
      subtasks: [],
      comments: [],
      activity: [{ id: Date.now(), text: 'Task created', time: 'Just now' }]
    };
    setTasks([newTask, ...tasks]);
    setNewTitle('');
    setNewDesc('');
    setIsNewTaskModalOpen(false);
  };

  const filteredTasks = tasks.filter(t => {
    const matchesPriority = filterPriority === 'ALL' || t.priority === filterPriority;
    const matchesSearch = !searchQuery || 
      t.title.toLowerCase().indexOf(searchQuery.toLowerCase()) !== -1 || 
      t.id.toLowerCase().indexOf(searchQuery.toLowerCase()) !== -1 ||
      t.tags.some(tag => tag.toLowerCase().indexOf(searchQuery.toLowerCase()) !== -1);
    return matchesPriority && matchesSearch;
  });

  const getPriorityBadge = (p) => {
    switch (p) {
      case 'URGENT': return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'HIGH': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'MEDIUM': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      default: return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  return (
    <div className="min-h-screen bg-[#08090d] text-zinc-100 font-sans p-4 sm:p-6 flex flex-col justify-start">
      <div className="max-w-7xl w-full mx-auto space-y-6">
        
        {/* Top Navbar & Sprint Summary */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Kanban size={17} />
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight">TaskFlow Project Engine</h1>
              <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono rounded-full font-bold">
                Sprint 14
              </span>
            </div>
            <p className="text-xs text-zinc-400">{sprintInfo.name + " • " + sprintInfo.daysLeft + " days remaining"}</p>
          </div>

          <div className="flex items-center gap-3">
            {/* View switcher */}
            <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-xl text-xs font-medium">
              <button 
                onClick={() => setViewMode('kanban')}
                className={"px-3 py-1 rounded-lg transition-all " + (viewMode === 'kanban' ? 'bg-indigo-600 text-white font-bold' : 'text-zinc-400 hover:text-white')}
              >
                Kanban Board
              </button>
              <button 
                onClick={() => setViewMode('backlog')}
                className={"px-3 py-1 rounded-lg transition-all " + (viewMode === 'backlog' ? 'bg-indigo-600 text-white font-bold' : 'text-zinc-400 hover:text-white')}
              >
                Backlog Table
              </button>
            </div>

            <button 
              onClick={() => setIsNewTaskModalOpen(true)}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 cursor-pointer"
            >
              <Plus size={15} />
              <span>Create Issue</span>
            </button>
          </div>
        </div>

        {/* Filter Bar & Velocity Metric */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-2.5 text-zinc-500" />
              <input 
                type="text" 
                placeholder="Search issues, tags, keys..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded-xl text-xs">
              <span className="text-zinc-500 font-mono text-[11px]">Priority:</span>
              {['ALL', 'URGENT', 'HIGH', 'MEDIUM'].map(p => (
                <button 
                  key={p} 
                  onClick={() => setFilterPriority(p)}
                  className={"px-2 py-0.5 rounded text-[11px] font-bold font-mono " + (filterPriority === p ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200')}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono bg-zinc-900/60 border border-zinc-800 px-3 py-1.5 rounded-xl">
            <span className="text-zinc-400">Sprint Burndown:</span>
            <span className="text-emerald-400 font-bold">{sprintInfo.completedPoints + "/" + sprintInfo.totalPoints + " SP (" + Math.round((sprintInfo.completedPoints / sprintInfo.totalPoints) * 100) + "%)"}</span>
          </div>
        </div>

        {/* VIEW 1: KANBAN BOARD */}
        {viewMode === 'kanban' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
            {columns.map(col => {
              const colTasks = filteredTasks.filter(t => t.column === col.id);
              return (
                <div key={col.id} className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-3.5 space-y-3 min-h-[500px] flex flex-col">
                  <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider">{col.title}</span>
                      <span className="px-2 py-0.2 bg-zinc-800 text-zinc-300 text-[10px] font-mono font-bold rounded-full">
                        {colTasks.length}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 space-y-2.5 overflow-y-auto">
                    {colTasks.map(task => {
                      const completedSub = task.subtasks.filter(s => s.done).length;
                      return (
                        <div 
                          key={task.id}
                          onClick={() => setSelectedTask(task)}
                          className="p-3.5 bg-zinc-900/90 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 rounded-2xl space-y-2.5 cursor-pointer transition-all shadow-md group"
                        >
                          <div className="flex justify-between items-start">
                            <span className="text-[10px] font-mono text-zinc-400 font-bold">{task.id}</span>
                            <span className={"text-[9px] font-mono font-bold px-2 py-0.5 rounded border " + getPriorityBadge(task.priority)}>
                              {task.priority}
                            </span>
                          </div>

                          <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors leading-snug">
                            {task.title}
                          </h4>

                          {/* Subtask Progress bar */}
                          {task.subtasks.length > 0 && (
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                                <span>Subtasks</span>
                                <span>{completedSub + "/" + task.subtasks.length}</span>
                              </div>
                              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className="bg-emerald-500 h-full transition-all" 
                                  style={{ width: ((completedSub / task.subtasks.length) * 100) + "%" }}
                                ></div>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-1 border-t border-zinc-850 text-xs">
                            <div className="flex items-center gap-1.5">
                              <img src={task.assignee.avatar} alt="" className="w-5 h-5 rounded-full object-cover border border-zinc-700" />
                              <span className="text-[10px] text-zinc-400 truncate max-w-[80px]">{task.assignee.name}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              {task.comments.length > 0 && (
                                <span className="flex items-center gap-0.5 text-[10px] text-zinc-400">
                                  <MessageSquare size={11} /> {task.comments.length}
                                </span>
                              )}
                              <span className="px-1.5 py-0.5 bg-zinc-800 text-zinc-300 text-[10px] font-mono font-bold rounded">
                                {task.points + " SP"}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* VIEW 2: BACKLOG TABLE */}
        {viewMode === 'backlog' && (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900/90 text-zinc-400 font-mono border-b border-zinc-800">
                <tr>
                  <th className="p-3.5">Key</th>
                  <th className="p-3.5">Title</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Priority</th>
                  <th className="p-3.5">Assignee</th>
                  <th className="p-3.5 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredTasks.map(t => (
                  <tr 
                    key={t.id} 
                    onClick={() => setSelectedTask(t)}
                    className="hover:bg-zinc-800/40 cursor-pointer transition-colors"
                  >
                    <td className="p-3.5 font-mono text-zinc-400 font-bold">{t.id}</td>
                    <td className="p-3.5 font-semibold text-white">{t.title}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded text-[10px] font-mono font-bold uppercase">
                        {t.column.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className={"px-2 py-0.5 rounded text-[10px] font-mono font-bold border " + getPriorityBadge(t.priority)}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="p-3.5 text-zinc-300">{t.assignee.name}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-indigo-400">{t.points + " SP"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ISSUE DETAIL DRAWER MODAL */}
        {selectedTask && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-end">
            <div className="w-full max-w-xl bg-[#0c0d12] border-l border-zinc-800 h-full overflow-y-auto p-6 space-y-6 flex flex-col justify-between">
              <div className="space-y-5">
                {/* Header */}
                <div className="flex justify-between items-start border-b border-zinc-800 pb-4">
                  <div>
                    <span className="text-xs font-mono text-indigo-400 font-bold">{selectedTask.id}</span>
                    <h2 className="text-base font-bold text-white mt-1">{selectedTask.title}</h2>
                  </div>
                  <button onClick={() => setSelectedTask(null)} className="p-1 text-zinc-400 hover:text-white">
                    <X size={18} />
                  </button>
                </div>

                {/* Column State Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-zinc-400">Workflow Stage</label>
                  <div className="grid grid-cols-4 gap-2">
                    {columns.map(c => (
                      <button 
                        key={c.id} 
                        onClick={() => moveTask(selectedTask.id, c.id)}
                        className={"py-1.5 text-xs font-bold rounded-xl border transition-all " + (selectedTask.column === c.id ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white')}
                      >
                        {c.title}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-zinc-400">Description</label>
                  <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/50 p-3.5 rounded-2xl border border-zinc-800">
                    {selectedTask.desc}
                  </p>
                </div>

                {/* Subtasks Checklist */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-mono text-zinc-400">Subtask Acceptance Criteria</label>
                    <span className="text-[10px] font-mono text-emerald-400">
                      {selectedTask.subtasks.filter(s => s.done).length + "/" + selectedTask.subtasks.length + " Completed"}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {selectedTask.subtasks.map(st => (
                      <div 
                        key={st.id}
                        onClick={() => toggleSubtask(selectedTask.id, st.id)}
                        className={"p-3 rounded-xl border flex items-center gap-3 cursor-pointer text-xs transition-all " + (st.done ? 'bg-emerald-950/20 border-emerald-500/30 text-zinc-400 line-through' : 'bg-zinc-900 border-zinc-800 text-zinc-200')}
                      >
                        <div className={"w-4 h-4 rounded flex items-center justify-center border " + (st.done ? 'bg-emerald-500 border-emerald-400 text-black' : 'border-zinc-700')}>
                          {st.done && <Check size={12} strokeWidth={3} />}
                        </div>
                        <span>{st.title}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Comments Thread */}
                <div className="space-y-3 pt-2">
                  <label className="text-xs font-mono text-zinc-400">Team Discussion ({selectedTask.comments.length})</label>
                  
                  <div className="space-y-2 max-h-36 overflow-y-auto">
                    {selectedTask.comments.map(c => (
                      <div key={c.id} className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-1 text-xs">
                        <div className="flex justify-between font-mono text-[10px] text-zinc-400">
                          <strong className="text-white">{c.author}</strong>
                          <span>{c.time}</span>
                        </div>
                        <p className="text-zinc-300">{c.text}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Add a comment..."
                      value={commentInput}
                      onChange={e => setCommentInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addComment()}
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                    <button onClick={addComment} className="p-2 bg-indigo-600 text-white rounded-xl">
                      <Send size={15} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex justify-between items-center text-xs text-zinc-500 font-mono">
                <span>Assignee: {selectedTask.assignee.name}</span>
                <span>Story Points: {selectedTask.points}</span>
              </div>
            </div>
          </div>
        )}

        {/* CREATE ISSUE MODAL */}
        {isNewTaskModalOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-[#0e1017] border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-2xl">
              <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Plus size={16} className="text-indigo-400" /> Create New Issue
                </h3>
                <button onClick={() => setIsNewTaskModalOpen(false)} className="text-zinc-400 hover:text-white">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={createNewTask} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-zinc-400 font-mono">Issue Title</label>
                  <input 
                    type="text" 
                    placeholder="E.g., Implement OAuth callback flow..."
                    value={newTitle} 
                    onChange={e => setNewTitle(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-400 font-mono">Description</label>
                  <textarea 
                    rows={3}
                    placeholder="Details, steps, or acceptance criteria..."
                    value={newDesc} 
                    onChange={e => setNewDesc(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white resize-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-zinc-400 font-mono">Priority</label>
                    <select 
                      value={newPriority} 
                      onChange={e => setNewPriority(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2 text-white"
                    >
                      <option value="URGENT">URGENT</option>
                      <option value="HIGH">HIGH</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="LOW">LOW</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-zinc-400 font-mono">Story Points</label>
                    <input 
                      type="number" min="1" max="13" 
                      value={newPoints} 
                      onChange={e => setNewPoints(Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2 text-white font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-zinc-400 font-mono">Tag</label>
                    <input 
                      type="text" 
                      placeholder="Backend, UI, etc."
                      value={newTag} 
                      onChange={e => setNewTag(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2 text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                  <button 
                    type="button" 
                    onClick={() => setIsNewTaskModalOpen(false)}
                    className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl"
                  >
                    Create Issue
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
`;

export const TASKFLOW_PRO_APP_CODE = `import React, { useState } from 'react';
import { 
  Kanban, BarChart3, Users, Zap, TrendingUp, Calendar, 
  CheckCircle2, AlertTriangle, ArrowUpRight, Cpu, Layers, Sparkles
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('velocity');

  const teamCapacity = [
    { name: 'Elena Rostova (Lead Backend)', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', allocation: 90, assignedPts: 14, status: 'Optimal' },
    { name: 'Alex Rivera (Frontend UI/UX)', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', allocation: 80, assignedPts: 11, status: 'Optimal' },
    { name: 'Marcus Vance (Infra & DB)', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', allocation: 100, assignedPts: 17, status: 'Overallocated' }
  ];

  return (
    <div className="min-h-screen bg-[#07080b] text-zinc-100 p-4 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-850 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Zap size={18} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">TaskFlow Velocity & AI Allocation</h1>
              <p className="text-xs text-zinc-400">Engineering sprint capacity balancing & burndown modeling.</p>
            </div>
          </div>

          <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-2xl text-xs font-mono">
            <button 
              onClick={() => setActiveTab('velocity')}
              className={"px-3.5 py-1.5 rounded-xl transition-all " + (activeTab === 'velocity' ? 'bg-indigo-600 text-white font-bold' : 'text-zinc-400')}
            >
              Velocity Metrics
            </button>
            <button 
              onClick={() => setActiveTab('capacity')}
              className={"px-3.5 py-1.5 rounded-xl transition-all " + (activeTab === 'capacity' ? 'bg-indigo-600 text-white font-bold' : 'text-zinc-400')}
            >
              Team Allocation
            </button>
          </div>
        </div>

        {/* METRICS OVERVIEW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-3xl space-y-1">
            <span className="text-xs font-mono text-zinc-400">Rolling 3-Sprint Velocity</span>
            <div className="text-3xl font-extrabold font-mono text-white">39.4 SP</div>
            <span className="text-[11px] font-mono text-emerald-400">+12% vs last quarter</span>
          </div>

          <div className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-3xl space-y-1">
            <span className="text-xs font-mono text-zinc-400">Commitment Reliability</span>
            <div className="text-3xl font-extrabold font-mono text-indigo-400">94.2%</div>
            <span className="text-[11px] font-mono text-zinc-400">High predictability</span>
          </div>

          <div className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-3xl space-y-1">
            <span className="text-xs font-mono text-zinc-400">Defect Density</span>
            <div className="text-3xl font-extrabold font-mono text-emerald-400">0.08 / KLOC</div>
            <span className="text-[11px] font-mono text-emerald-400">Zero critical CVEs</span>
          </div>
        </div>

        {/* TEAM CAPACITY TABLE */}
        <div className="p-6 bg-zinc-900/40 border border-zinc-800 rounded-3xl space-y-4">
          <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Engineer Workload & Allocation Balancing</h3>
          
          <div className="space-y-3">
            {teamCapacity.map((member, idx) => (
              <div key={idx} className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-3">
                  <img src={member.avatar} alt="" className="w-10 h-10 rounded-full object-cover border border-zinc-700" />
                  <div>
                    <h4 className="text-xs font-bold text-white">{member.name}</h4>
                    <p className="text-[11px] text-zinc-400 font-mono">{"Assigned: " + member.assignedPts + " Story Points"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-64">
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                      <span>Capacity</span>
                      <span>{member.allocation + "%"}</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className={"h-full " + (member.allocation > 90 ? 'bg-amber-500' : 'bg-indigo-500')} 
                        style={{ width: member.allocation + "%" }}
                      ></div>
                    </div>
                  </div>

                  <span className={"px-2 py-0.5 rounded text-[10px] font-mono font-bold " + (
                    member.status === 'Optimal' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                  )}>
                    {member.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
`;
