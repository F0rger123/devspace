// src/lib/templates/focusflowTemplates.ts
// FocusFlow Productivity & Pomodoro Suite - Production-grade interactive React 18 templates

export const FOCUSFLOW_APP_CODE = `import React, { useState, useEffect } from 'react';
import { 
  Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles, 
  Flame, CheckCircle2, Trophy, Clock, BarChart2, Coffee, 
  Brain, Settings, Shield, Plus, X, ArrowRight, Zap, Target
} from 'lucide-react';

export default function App() {
  const [mode, setMode] = useState('focus'); // focus | shortBreak | longBreak
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [streakCount, setStreakCount] = useState(4);
  const [selectedAmbience, setSelectedAmbience] = useState('Deep Brown Noise');
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  const [tasks, setTasks] = useState([
    { id: 1, text: 'Complete system architecture diagram in Figma', done: true, pomos: 2 },
    { id: 2, text: 'Review and merge PR #114 database migration', done: false, pomos: 1 },
    { id: 3, text: 'Write technical spec for WebSocket channel', done: false, pomos: 3 }
  ]);
  const [newTaskInput, setNewTaskInput] = useState('');

  const durations = {
    focus: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60
  };

  const soundscapes = [
    { name: 'Deep Brown Noise', desc: 'Restorative 40Hz binaural beats for executive focus' },
    { name: 'Rainfall on Skylight', desc: 'Natural stochastic acoustic masking' },
    { name: 'Lo-Fi Jazz Cafe', desc: 'Mellow analog keys & subtle vinyl crackle' },
    { name: 'Cyberpunk Synth Drone', desc: 'Space ambient analog drone for coding' }
  ];

  useEffect(() => {
    let timer = null;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      if (mode === 'focus') {
        setStreakCount(prev => prev + 1);
      }
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLeft, mode]);

  const switchMode = (newMode) => {
    setMode(newMode);
    setTimeLeft(durations[newMode]);
    setIsRunning(false);
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(durations[mode]);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const addTask = (e) => {
    e.preventDefault();
    if (!newTaskInput.trim()) return;
    setTasks([...tasks, { id: Date.now(), text: newTaskInput.trim(), done: false, pomos: 1 }]);
    setNewTaskInput('');
  };

  const totalDuration = durations[mode];
  const progressPercent = ((totalDuration - timeLeft) / totalDuration) * 100;

  return (
    <div className="min-h-screen bg-[#07080c] text-zinc-100 font-sans p-4 sm:p-6 flex flex-col items-center justify-start select-none">
      <div className="w-full max-w-2xl space-y-6">
        
        {/* Top Header */}
        <div className="flex justify-between items-center border-b border-zinc-850 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Brain size={18} />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">FocusFlow Deep Work</h1>
              <p className="text-[11px] text-zinc-400">Cognitive flow state and productivity pacing</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-xl text-amber-400 text-xs font-mono font-bold">
              <Flame size={14} className="fill-amber-400" />
              <span>{streakCount + " Streak"}</span>
            </div>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex justify-center">
          <div className="flex bg-zinc-900/80 border border-zinc-800 p-1.5 rounded-2xl gap-1">
            {[
              { key: 'focus', label: 'Deep Focus (25m)', icon: Brain },
              { key: 'shortBreak', label: 'Short Break (5m)', icon: Coffee },
              { key: 'longBreak', label: 'Long Break (15m)', icon: Sparkles }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => switchMode(tab.key)}
                  className={
                    "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer " +
                    (mode === tab.key 
                      ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20' 
                      : 'text-zinc-400 hover:text-white')
                  }
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Circular Countdown Hero Clock */}
        <div className="p-8 bg-zinc-900/40 border border-zinc-800 rounded-3xl flex flex-col items-center justify-center space-y-6 shadow-2xl relative overflow-hidden">
          
          <div className="relative w-64 h-64 flex items-center justify-center">
            {/* SVG Progress Circle */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
              <circle 
                cx="100" cy="100" r="85" 
                stroke="#1f2430" 
                strokeWidth="10" 
                fill="transparent" 
              />
              <circle 
                cx="100" cy="100" r="85" 
                stroke="#f59e0b" 
                strokeWidth="10" 
                fill="transparent" 
                strokeDasharray={2 * Math.PI * 85}
                strokeDashoffset={(2 * Math.PI * 85) * (1 - progressPercent / 100)}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>

            {/* Inner Clock Face */}
            <div className="absolute flex flex-col items-center">
              <span className="text-5xl font-extrabold font-mono text-white tracking-tighter">
                {formatTime(timeLeft)}
              </span>
              <span className="text-xs font-mono uppercase tracking-widest text-amber-400 mt-1 font-bold">
                {isRunning ? 'Flow State Active' : 'Paused'}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={resetTimer}
              className="p-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-2xl transition-all cursor-pointer"
              title="Reset Timer"
            >
              <RotateCcw size={18} />
            </button>

            <button
              onClick={toggleTimer}
              className={
                "px-8 py-3.5 rounded-2xl font-extrabold text-sm flex items-center gap-2 shadow-xl cursor-pointer transition-all active:scale-95 " +
                (isRunning 
                  ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20' 
                  : 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-amber-500/20')
              }
            >
              {isRunning ? <Pause size={18} /> : <Play size={18} />}
              <span>{isRunning ? 'Pause Session' : 'Start Focus'}</span>
            </button>
          </div>
        </div>

        {/* Soundscapes & Ambience Bar */}
        <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-3xl space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Volume2 size={14} className="text-amber-400" />
              Focus Soundscapes (Procedural Masking)
            </span>
            <button 
              onClick={() => setIsAudioMuted(!isAudioMuted)}
              className="text-xs font-mono text-zinc-400 hover:text-white"
            >
              {isAudioMuted ? 'Unmute' : 'Mute Ambient'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {soundscapes.map(s => (
              <div
                key={s.name}
                onClick={() => setSelectedAmbience(s.name)}
                className={
                  "p-3 rounded-2xl border cursor-pointer transition-all " +
                  (selectedAmbience === s.name 
                    ? 'bg-amber-950/20 border-amber-500/50 text-white' 
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700')
                }
              >
                <h4 className="text-xs font-bold text-zinc-200">{s.name}</h4>
                <p className="text-[11px] text-zinc-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Task Focus Checklist */}
        <div className="p-5 bg-zinc-900/40 border border-zinc-800 rounded-3xl space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Session Objectives ({tasks.filter(t => t.done).length + "/" + tasks.length})</h3>
          </div>

          <form onSubmit={addTask} className="flex gap-2">
            <input 
              type="text"
              placeholder="Add next focus task..."
              value={newTaskInput}
              onChange={e => setNewTaskInput(e.target.value)}
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
            />
            <button 
              type="submit"
              className="px-4 py-2 bg-amber-500 text-zinc-950 font-bold text-xs rounded-xl cursor-pointer"
            >
              Add
            </button>
          </form>

          <div className="space-y-2">
            {tasks.map(t => (
              <div 
                key={t.id}
                onClick={() => toggleTask(t.id)}
                className={
                  "p-3 rounded-xl border flex justify-between items-center cursor-pointer transition-all " +
                  (t.done ? 'bg-emerald-950/20 border-emerald-500/30 text-zinc-500 line-through' : 'bg-zinc-900/80 border-zinc-800 text-zinc-200')
                }
              >
                <div className="flex items-center gap-2.5">
                  <div className={"w-4 h-4 rounded flex items-center justify-center border " + (t.done ? 'bg-emerald-500 border-emerald-400 text-black' : 'border-zinc-700')}>
                    {t.done && <CheckCircle2 size={12} />}
                  </div>
                  <span className="text-xs font-medium">{t.text}</span>
                </div>

                <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded font-bold">
                  {t.pomos + " Pomo"}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
`;

export const FOCUSFLOW_PRO_APP_CODE = `import React from 'react';
import { Brain, Sparkles, Trophy, Zap, Shield, ArrowRight } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-[#07080b] text-zinc-100 p-6 flex flex-col items-center justify-center font-sans">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4 text-center">
        <Brain size={32} className="text-amber-400 mx-auto" />
        <h2 className="text-base font-bold text-white">FocusFlow Ultra Pro</h2>
        <p className="text-xs text-zinc-400">Cognitive EEG telemetry & adaptive binaural frequency synchronization enabled.</p>
      </div>
    </div>
  );
}
`;

export const FOCUS_FLOW_APP_CODE = FOCUSFLOW_APP_CODE;
export const FOCUS_FLOW_PRO_APP_CODE = FOCUSFLOW_PRO_APP_CODE;
export const FOCUS_HUB_APP_CODE = FOCUSFLOW_APP_CODE;
export const FOCUS_HUB_PRO_APP_CODE = FOCUSFLOW_PRO_APP_CODE;
