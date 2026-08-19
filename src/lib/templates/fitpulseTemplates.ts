// src/lib/templates/fitpulseTemplates.ts
// FitPulse Mobile Health & Workout Tracker - Production-Grade React 18 Templates

export const FITPULSE_APP_CODE = `import React, { useState, useEffect } from 'react';
import { 
  Activity, Flame, Dumbbell, Heart, Trophy, User, Bell, ChevronRight,
  Play, Pause, RotateCcw, Plus, Check, Compass, Share2, MessageCircle,
  TrendingUp, Calendar, Zap, Droplet, Sparkles, ChevronLeft, BarChart2
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('today');
  const [streakDays, setStreakDays] = useState(14);
  const [calories, setCalories] = useState(640);
  const calorieGoal = 850;
  const [activeMinutes, setActiveMinutes] = useState(48);
  const activeGoal = 60;
  const [steps, setSteps] = useState(9420);
  const stepGoal = 10000;
  const [waterGlasses, setWaterGlasses] = useState(6);

  // Workout state
  const [selectedSport, setSelectedSport] = useState('Full Body HIIT');
  const [isWorkingOut, setIsWorkingOut] = useState(false);
  const [workoutSeconds, setWorkoutSeconds] = useState(0);
  const [currentHeartRate, setCurrentHeartRate] = useState(142);
  const [selectedWorkoutModal, setSelectedWorkoutModal] = useState(null);

  // Exercise log sets
  const [loggedSets, setLoggedSets] = useState([
    { id: 1, exercise: 'Barbell Back Squats', sets: '4 sets x 8 reps', weight: '225 lbs', done: true, bpm: 154 },
    { id: 2, exercise: 'Dumbbell Walking Lunges', sets: '3 sets x 12 reps', weight: '50 lbs DBs', done: true, bpm: 148 },
    { id: 3, exercise: 'Romanian Deadlifts', sets: '4 sets x 10 reps', weight: '185 lbs', done: false, bpm: 162 },
    { id: 4, exercise: 'Standing Calf Raises', sets: '3 sets x 15 reps', weight: 'Bodyweight + 45 lbs', done: false, bpm: 132 }
  ]);

  // Social feed state
  const [feedItems, setFeedItems] = useState([
    {
      id: 'f1',
      author: 'Sarah Chen',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: 'CrossFit Athlete',
      time: '18m ago',
      title: 'Crushed new 5K pace threshold! 🏃‍♀️💨',
      stats: '5.02 km • 22:14 min • 384 kcal • 168 avg BPM',
      likes: 24,
      isLiked: false,
      badge: 'New PR 🏆',
      commentCount: 4,
      comments: [
        { id: 'c1', user: 'Marcus', text: 'Insane split times Sarah!' },
        { id: 'c2', user: 'Coach Dave', text: 'Cadence looks rock solid.' }
      ]
    },
    {
      id: 'f2',
      author: 'Liam Vance',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      role: 'Hyrox Competitor',
      time: '1h ago',
      title: 'Heavy Sled Push & Sandbag Complex 💥',
      stats: '60 min • 680 kcal • 182 max BPM',
      likes: 42,
      isLiked: true,
      badge: 'Zone 5 Master 🔥',
      commentCount: 7,
      comments: [
        { id: 'c3', user: 'Elena', text: 'Beast mode activated!' }
      ]
    }
  ]);

  // Workout catalogue
  const workoutCatalogue = [
    {
      id: 'w1',
      title: 'Full Body HIIT Inferno',
      category: 'Cardio & Conditioning',
      level: 'Advanced',
      duration: '35 min',
      burn: '420 kcal',
      color: 'from-amber-500 to-rose-500',
      exercises: ['Burpee Box Jumps', 'Kettlebell Swings', 'Battle Ropes', 'Assault Bike Sprint']
    },
    {
      id: 'w2',
      title: 'Upper Body Hypertrophy',
      category: 'Strength Training',
      level: 'Intermediate',
      duration: '50 min',
      burn: '380 kcal',
      color: 'from-emerald-500 to-teal-600',
      exercises: ['Bench Press', 'Overhead Press', 'Pull-ups', 'Lateral Raises']
    },
    {
      id: 'w3',
      title: 'Tempo 5K Endurance',
      category: 'Running',
      level: 'All Levels',
      duration: '28 min',
      burn: '340 kcal',
      color: 'from-cyan-500 to-blue-600',
      exercises: ['Dynamic Warmup', '1K Warm Pace', '3K Threshold Tempo', '1K Cooldown']
    },
    {
      id: 'w4',
      title: 'Vinyasa Core & Mobility',
      category: 'Flexibility & Core',
      level: 'Beginner',
      duration: '40 min',
      burn: '190 kcal',
      color: 'from-purple-500 to-indigo-600',
      exercises: ['Sun Salutations A&B', 'Warrior II Flows', 'Crow Pose Drill', 'Deep Hip Stretch']
    }
  ];

  // Workout live timer
  useEffect(() => {
    let interval = null;
    if (isWorkingOut) {
      interval = setInterval(() => {
        setWorkoutSeconds(prev => prev + 1);
        setCurrentHeartRate(prev => Math.min(176, Math.max(124, prev + (Math.random() > 0.5 ? 1 : -1))));
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isWorkingOut]);

  const formatTimer = (totalSecs) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return mins.toString().padStart(2, '0') + ':' + secs.toString().padStart(2, '0');
  };

  const toggleLike = (id) => {
    setFeedItems(feedItems.map(item => {
      if (item.id === id) {
        return {
          ...item,
          likes: item.isLiked ? item.likes - 1 : item.likes + 1,
          isLiked: !item.isLiked
        };
      }
      return item;
    }));
  };

  const toggleSet = (id) => {
    setLoggedSets(loggedSets.map(s => s.id === id ? { ...s, done: !s.done } : s));
  };

  const addCustomSet = () => {
    const newId = loggedSets.length + 1;
    setLoggedSets([
      ...loggedSets, 
      { id: newId, exercise: 'Core Planks & Hollow Holds', sets: '3 sets x 60s', weight: 'Bodyweight', done: false, bpm: 128 }
    ]);
  };

  // Ring calculations
  const calPct = Math.min(100, Math.round((calories / calorieGoal) * 100));
  const stepPct = Math.min(100, Math.round((steps / stepGoal) * 100));
  const actPct = Math.min(100, Math.round((activeMinutes / activeGoal) * 100));

  return (
    <div className="min-h-screen bg-[#07090e] text-zinc-100 flex justify-center items-start p-2 sm:p-4 font-sans select-none">
      {/* Mobile Device Frame */}
      <div className="w-full max-w-[420px] bg-[#0c1017] border border-zinc-850 rounded-[40px] shadow-2xl overflow-hidden flex flex-col min-h-[820px] relative">
        
        {/* Mobile Status Bar Header */}
        <div className="pt-3 px-6 pb-2.5 flex justify-between items-center text-xs text-zinc-400 border-b border-zinc-850/80 bg-[#0c1017]/95 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-zinc-200 font-mono">9:41</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-bold">
              <Flame size={13} className="fill-amber-400 text-amber-400" />
              <span>{streakDays} DAYS</span>
            </div>
            <button className="p-1 text-zinc-400 hover:text-zinc-200 relative">
              <Bell size={15} />
              <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-rose-500"></span>
            </button>
          </div>
        </div>

        {/* Scrollable View Container */}
        <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-5">
          
          {/* TAB 1: TODAY DASHBOARD */}
          {activeTab === 'today' && (
            <div className="space-y-5">
              
              {/* Header Greeting */}
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-wider">Tuesday, Aug 18</span>
                  <h2 className="text-xl font-extrabold text-white tracking-tight">Welcome, Alex 👋</h2>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-500 uppercase font-mono">Readiness</span>
                  <p className="text-xs font-bold text-emerald-400 flex items-center gap-1"><Zap size={13} /> 94% Peak</p>
                </div>
              </div>

              {/* High-Resolution SVG Activity Rings */}
              <div className="p-5 bg-gradient-to-br from-zinc-900/90 via-[#0f141d] to-zinc-900 border border-zinc-800/90 rounded-3xl shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between gap-4">
                  {/* SVG Rings */}
                  <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                      {/* Outer Ring: Calories */}
                      <circle cx="60" cy="60" r="50" stroke="#27272a" strokeWidth="9" fill="none" />
                      <circle cx="60" cy="60" r="50" stroke="#f43f5e" strokeWidth="9" fill="none" strokeDasharray="314" strokeDashoffset={314 - (314 * calPct) / 100} strokeLinecap="round" />
                      
                      {/* Middle Ring: Active Min */}
                      <circle cx="60" cy="60" r="38" stroke="#27272a" strokeWidth="9" fill="none" />
                      <circle cx="60" cy="60" r="38" stroke="#10b981" strokeWidth="9" fill="none" strokeDasharray="238" strokeDashoffset={238 - (238 * actPct) / 100} strokeLinecap="round" />
                      
                      {/* Inner Ring: Steps */}
                      <circle cx="60" cy="60" r="26" stroke="#27272a" strokeWidth="9" fill="none" />
                      <circle cx="60" cy="60" r="26" stroke="#06b6d4" strokeWidth="9" fill="none" strokeDasharray="163" strokeDashoffset={163 - (163 * stepPct) / 100} strokeLinecap="round" />
                    </svg>

                    <div className="absolute flex flex-col items-center justify-center text-center">
                      <Flame size={16} className="text-rose-500 fill-rose-500 animate-pulse" />
                      <span className="text-xs font-mono font-extrabold text-white">{calPct}%</span>
                    </div>
                  </div>

                  {/* Ring Metric Details */}
                  <div className="flex-1 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                        <span className="text-zinc-300 font-medium">Move</span>
                      </div>
                      <span className="font-mono text-zinc-100 font-bold">{calories} <span className="text-zinc-500 text-[10px]">/{calorieGoal} kcal</span></span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        <span className="text-zinc-300 font-medium">Exercise</span>
                      </div>
                      <span className="font-mono text-zinc-100 font-bold">{activeMinutes} <span className="text-zinc-500 text-[10px]">/{activeGoal} min</span></span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
                        <span className="text-zinc-300 font-medium">Steps</span>
                      </div>
                      <span className="font-mono text-zinc-100 font-bold">{steps.toLocaleString()} <span className="text-zinc-500 text-[10px]">/{stepGoal.toLocaleString()}</span></span>
                    </div>
                  </div>
                </div>

                {/* Hydration Bar */}
                <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Droplet size={14} className="text-cyan-400 fill-cyan-400" />
                    <span className="text-xs text-zinc-300">Hydration ({waterGlasses * 250} ml)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => setWaterGlasses(prev => Math.max(0, prev - 1))}
                      className="w-5 h-5 rounded bg-zinc-800 text-zinc-300 flex items-center justify-center text-xs hover:bg-zinc-700 cursor-pointer"
                    >-</button>
                    <span className="text-xs font-mono font-bold text-cyan-400 px-1">{waterGlasses}/8</span>
                    <button 
                      onClick={() => setWaterGlasses(prev => Math.min(12, prev + 1))}
                      className="w-5 h-5 rounded bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-xs hover:bg-cyan-500/40 cursor-pointer"
                    >+</button>
                  </div>
                </div>
              </div>

              {/* Weekly Calorie Burn Chart */}
              <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-3xl space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                    <BarChart2 size={14} className="text-emerald-400" /> Weekly Calorie Burn
                  </h3>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">+14% vs last week</span>
                </div>

                <div className="flex items-end justify-between gap-2 h-28 pt-2">
                  {[
                    { day: 'Mon', kcal: 680, goal: true },
                    { day: 'Tue', kcal: 740, goal: true },
                    { day: 'Wed', kcal: 520, goal: false },
                    { day: 'Thu', kcal: 810, goal: true },
                    { day: 'Fri', kcal: 690, goal: true },
                    { day: 'Sat', kcal: 920, goal: true },
                    { day: 'Sun', kcal: 640, goal: true }
                  ].map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <div 
                        className={"w-full max-w-[20px] rounded-t-md transition-all " + (d.goal ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-sm shadow-emerald-500/20' : 'bg-zinc-700')}
                        style={{ height: ((d.kcal / 950) * 100) + '%' }}
                      ></div>
                      <span className="text-[10px] font-mono text-zinc-400">{d.day}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Today's Recommended Workout Banner */}
              <div className="p-4 bg-gradient-to-r from-emerald-950/70 via-zinc-900 to-zinc-900 border border-emerald-500/30 rounded-3xl space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">Suggested for Today</span>
                    <h3 className="text-sm font-bold text-white mt-1">Full Body Hypertrophy & Core</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">5 exercises • 45 min • 420 kcal</p>
                  </div>
                  <Dumbbell size={22} className="text-emerald-400" />
                </div>

                <button 
                  onClick={() => {
                    setSelectedSport('Full Body Hypertrophy');
                    setActiveTab('workouts');
                    setIsWorkingOut(true);
                  }}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
                >
                  <Play size={15} className="fill-zinc-950" />
                  <span>Start Session Now</span>
                </button>
              </div>

            </div>
          )}

          {/* TAB 2: WORKOUTS & LIVE LOGGER */}
          {activeTab === 'workouts' && (
            <div className="space-y-4">
              
              {/* Active Stopwatch Card */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-950/60 via-zinc-900 to-[#0c1017] border border-emerald-500/40 shadow-2xl space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className={"w-2.5 h-2.5 rounded-full " + (isWorkingOut ? 'bg-emerald-400 animate-ping' : 'bg-zinc-600')}></span>
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">
                      {isWorkingOut ? 'Session Active' : 'Session Ready'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-300 bg-zinc-800/80 px-2.5 py-1 rounded-full border border-zinc-700/60">
                    <Heart size={13} className="text-rose-500 fill-rose-500 animate-pulse" />
                    <span className="font-bold">{currentHeartRate} BPM</span>
                  </div>
                </div>

                {/* Big Timer Display */}
                <div className="text-center py-2">
                  <div className="text-5xl font-extrabold font-mono text-white tracking-tight">
                    {formatTimer(workoutSeconds)}
                  </div>
                  <p className="text-xs font-medium text-emerald-300 mt-1">{selectedSport}</p>
                </div>

                {/* Start / Pause / Reset Action Controls */}
                <div className="flex gap-2 justify-center">
                  <button 
                    onClick={() => setIsWorkingOut(!isWorkingOut)}
                    className={"flex-1 py-3 px-4 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer " + (
                      isWorkingOut 
                        ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950' 
                        : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950'
                    )}
                  >
                    {isWorkingOut ? <Pause size={15} /> : <Play size={15} className="fill-zinc-950" />}
                    <span>{isWorkingOut ? 'Pause Session' : 'Resume Workout'}</span>
                  </button>

                  <button 
                    onClick={() => { setIsWorkingOut(false); setWorkoutSeconds(0); }}
                    className="p-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl border border-zinc-700 transition-all cursor-pointer"
                    title="Reset Session"
                  >
                    <RotateCcw size={15} />
                  </button>
                </div>
              </div>

              {/* Workout Type Modality Selector */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-zinc-300">Workout Modality</label>
                  <span className="text-[10px] text-zinc-500 font-mono">6 modes</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {['Full Body HIIT', 'Strength PR', '5K Run', 'Zone 2 Cycling', 'Vinyasa Flow', 'CrossFit Metcon'].map((w) => (
                    <button
                      key={w}
                      onClick={() => setSelectedSport(w)}
                      className={"py-2 px-2 text-center text-[11px] font-semibold rounded-xl border transition-all cursor-pointer " + (
                        selectedSport === w 
                          ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400 font-bold shadow-sm' 
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      )}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>

              {/* Exercise Log & Checkable Sets */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Exercise Log & Sets</h4>
                  <button 
                    onClick={addCustomSet}
                    className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 cursor-pointer"
                  >
                    <Plus size={13} /> Add Set
                  </button>
                </div>

                <div className="space-y-2">
                  {loggedSets.map((s) => (
                    <div 
                      key={s.id} 
                      onClick={() => toggleSet(s.id)}
                      className={"p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all " + (
                        s.done 
                          ? 'bg-emerald-950/20 border-emerald-500/30 text-zinc-300' 
                          : 'bg-zinc-900/70 border-zinc-800 hover:border-zinc-700 text-white'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={"w-6 h-6 rounded-lg flex items-center justify-center border transition-colors " + (
                          s.done 
                            ? 'bg-emerald-500 border-emerald-400 text-zinc-950' 
                            : 'border-zinc-700 bg-zinc-800 text-zinc-400'
                        )}>
                          {s.done && <Check size={14} strokeWidth={3} />}
                        </div>
                        <div>
                          <p className={"text-xs font-bold " + (s.done ? 'line-through text-zinc-400' : 'text-zinc-100')}>
                            {s.exercise}
                          </p>
                          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                            {s.sets} • {s.weight} • <span className="text-rose-400 font-semibold">{s.bpm} BPM</span>
                          </p>
                        </div>
                      </div>
                      <span className={"text-[10px] font-mono font-bold px-2 py-0.5 rounded " + (
                        s.done ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-400'
                      )}>
                        {s.done ? 'COMPLETED' : 'PENDING'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Workout Catalogue Grid */}
              <div className="space-y-2.5 pt-3">
                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Explore Workout Library</h4>
                <div className="space-y-2">
                  {workoutCatalogue.map((w) => (
                    <div 
                      key={w.id}
                      onClick={() => setSelectedWorkoutModal(w)}
                      className="p-3.5 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-between cursor-pointer transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{w.title}</span>
                          <span className="text-[9px] font-mono px-2 py-0.2 bg-zinc-800 text-emerald-400 rounded-full">{w.level}</span>
                        </div>
                        <p className="text-[10px] text-zinc-400">{w.duration} • {w.burn} • {w.category}</p>
                      </div>
                      <ChevronRight size={16} className="text-zinc-500" />
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: SOCIAL COMMUNITY FEED */}
          {activeTab === 'feed' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Athlete Community Feed</h3>
                  <p className="text-[10px] text-zinc-500">Live activity from your training circle</p>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">3 Active Now</span>
              </div>

              {feedItems.map((post) => (
                <div key={post.id} className="p-4 bg-zinc-900/70 border border-zinc-800 rounded-3xl space-y-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img src={post.avatar} alt={post.author} className="w-9 h-9 rounded-full object-cover border-2 border-zinc-700" />
                      <div>
                        <h4 className="text-xs font-bold text-white">{post.author}</h4>
                        <span className="text-[10px] text-zinc-400 font-mono">{post.role} • {post.time}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                      {post.badge}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-zinc-200">{post.title}</p>
                    <p className="text-[11px] font-mono text-emerald-400 bg-zinc-950/60 p-2 rounded-xl border border-zinc-850">
                      {post.stats}
                    </p>
                  </div>

                  {/* Comments Preview */}
                  {post.comments.length > 0 && (
                    <div className="space-y-1 pt-1">
                      {post.comments.map(c => (
                        <div key={c.id} className="text-[11px] text-zinc-400 bg-zinc-950/40 p-1.5 rounded-lg">
                          <strong className="text-zinc-200">{c.user}:</strong> {c.text}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-zinc-400 text-xs">
                    <button 
                      onClick={() => toggleLike(post.id)}
                      className={"flex items-center gap-1.5 text-[11px] font-bold transition-colors cursor-pointer " + (
                        post.isLiked ? 'text-rose-500' : 'hover:text-zinc-200'
                      )}
                    >
                      <Heart size={14} className={post.isLiked ? 'fill-rose-500' : ''} />
                      <span>{post.likes} Kudos</span>
                    </button>

                    <button className="flex items-center gap-1 text-[11px] hover:text-zinc-200 cursor-pointer">
                      <MessageCircle size={14} />
                      <span>{post.commentCount} Comments</span>
                    </button>

                    <button className="text-[11px] hover:text-zinc-200 cursor-pointer p-1">
                      <Share2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: PROFILE & ACHIEVEMENTS */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              {/* Profile Card */}
              <div className="p-5 bg-gradient-to-br from-zinc-900 via-zinc-900 to-[#0e131b] border border-zinc-800 rounded-3xl text-center space-y-3">
                <div className="relative w-18 h-18 mx-auto">
                  <img 
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80" 
                    alt="Alex Avatar" 
                    className="w-18 h-18 rounded-full object-cover border-2 border-emerald-400 shadow-lg mx-auto"
                  />
                  <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-400 border-2 border-[#0c1017]"></span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white">Alex Rivera</h3>
                  <p className="text-xs text-zinc-400 font-mono">Calisthenics & Endurance Athlete • Level 14</p>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800 text-center">
                  <div className="p-2 bg-zinc-950/60 rounded-xl">
                    <span className="text-sm font-extrabold text-white font-mono">164</span>
                    <p className="text-[10px] text-zinc-500">Workouts</p>
                  </div>
                  <div className="p-2 bg-zinc-950/60 rounded-xl">
                    <span className="text-sm font-extrabold text-emerald-400 font-mono">14 Days</span>
                    <p className="text-[10px] text-zinc-500">Streak</p>
                  </div>
                  <div className="p-2 bg-zinc-950/60 rounded-xl">
                    <span className="text-sm font-extrabold text-white font-mono">28.4k</span>
                    <p className="text-[10px] text-zinc-500">Total Kcal</p>
                  </div>
                </div>
              </div>

              {/* Earned Milestone Badges */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Milestone Badges</h4>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 bg-zinc-900/70 border border-amber-500/20 rounded-2xl flex items-center gap-2.5">
                    <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl"><Trophy size={18} /></div>
                    <div>
                      <p className="text-xs font-bold text-white">10K Master</p>
                      <p className="text-[9px] text-zinc-500">Hit 10,000 steps 7x</p>
                    </div>
                  </div>

                  <div className="p-3 bg-zinc-900/70 border border-emerald-500/20 rounded-2xl flex items-center gap-2.5">
                    <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl"><Flame size={18} /></div>
                    <div>
                      <p className="text-xs font-bold text-white">14-Day Blaze</p>
                      <p className="text-[9px] text-zinc-500">Unbroken streak</p>
                    </div>
                  </div>

                  <div className="p-3 bg-zinc-900/70 border border-cyan-500/20 rounded-2xl flex items-center gap-2.5">
                    <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl"><Zap size={18} /></div>
                    <div>
                      <p className="text-xs font-bold text-white">VO2 Max Elite</p>
                      <p className="text-[9px] text-zinc-500">Top 5% endurance</p>
                    </div>
                  </div>

                  <div className="p-3 bg-zinc-900/70 border border-purple-500/20 rounded-2xl flex items-center gap-2.5">
                    <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl"><Heart size={18} /></div>
                    <div>
                      <p className="text-xs font-bold text-white">Cardio Beast</p>
                      <p className="text-[9px] text-zinc-500">500+ min monthly</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Health Device Sync Status */}
              <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <Activity size={16} className="text-emerald-400" />
                  <div>
                    <p className="font-bold text-white">Apple Watch Ultra 2</p>
                    <p className="text-[10px] text-zinc-500 font-mono">Synced 2m ago • Battery 82%</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-full font-mono">CONNECTED</span>
              </div>
            </div>
          )}

        </div>

        {/* Workout Detail Modal Drawer */}
        {selectedWorkoutModal && (
          <div className="absolute inset-0 bg-[#07090e]/95 backdrop-blur-md z-40 p-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                <button 
                  onClick={() => setSelectedWorkoutModal(null)}
                  className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white cursor-pointer"
                >
                  <ChevronLeft size={16} /> Back
                </button>
                <span className="text-xs font-mono text-emerald-400 font-bold">{selectedWorkoutModal.duration}</span>
              </div>

              <div>
                <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold">{selectedWorkoutModal.category}</span>
                <h3 className="text-xl font-extrabold text-white mt-0.5">{selectedWorkoutModal.title}</h3>
                <p className="text-xs text-zinc-400 mt-1">Estimated calorie expenditure: <strong className="text-white">{selectedWorkoutModal.burn}</strong></p>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-zinc-300">Exercise Circuit</h4>
                {selectedWorkoutModal.exercises.map((ex, idx) => (
                  <div key={idx} className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs flex items-center justify-between">
                    <span className="text-zinc-200">{idx + 1}. {ex}</span>
                    <span className="text-[10px] font-mono text-zinc-500">4 sets x 12</span>
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={() => {
                setSelectedSport(selectedWorkoutModal.title);
                setSelectedWorkoutModal(null);
                setActiveTab('workouts');
                setIsWorkingOut(true);
              }}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              <Play size={16} className="fill-zinc-950" />
              <span>Launch Live Workout Session</span>
            </button>
          </div>
        )}

        {/* Mobile Bottom Tab Navigation */}
        <div className="absolute bottom-0 inset-x-0 bg-[#0c1017]/95 backdrop-blur-md border-t border-zinc-850 px-4 py-3 flex justify-around items-center z-30">
          <button 
            onClick={() => setActiveTab('today')}
            className={"flex flex-col items-center gap-1 text-[10px] font-medium transition-colors cursor-pointer " + (
              activeTab === 'today' ? 'text-emerald-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'
            )}
          >
            <Activity size={18} />
            <span>Today</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('workouts')}
            className={"flex flex-col items-center gap-1 text-[10px] font-medium transition-colors cursor-pointer " + (
              activeTab === 'workouts' ? 'text-emerald-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'
            )}
          >
            <Dumbbell size={18} />
            <span>Workouts</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('feed')}
            className={"flex flex-col items-center gap-1 text-[10px] font-medium transition-colors cursor-pointer " + (
              activeTab === 'feed' ? 'text-emerald-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'
            )}
          >
            <Compass size={18} />
            <span>Community</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('profile')}
            className={"flex flex-col items-center gap-1 text-[10px] font-medium transition-colors cursor-pointer " + (
              activeTab === 'profile' ? 'text-emerald-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'
            )}
          >
            <User size={18} />
            <span>Profile</span>
          </button>
        </div>

      </div>
    </div>
  );
}
`;

export const FITPULSE_PRO_APP_CODE = `import React, { useState, useEffect } from 'react';
import { 
  Activity, Flame, Heart, Zap, Award, BarChart3, Sliders, Play, Pause, RotateCcw,
  Shield, Compass, ChevronRight, Moon, Sparkles, Battery, Droplet, ArrowUpRight,
  Clock, Target, User, Bell, ChevronLeft, Check, Plus, RefreshCw
} from 'lucide-react';

export default function App() {
  const [proTab, setProTab] = useState('telemetry');
  const [vo2Max] = useState(58.2);
  const [recoveryScore, setRecoveryScore] = useState(93);
  const [hrvRmsdd, setHrvRmsdd] = useState(74);
  const [restingHr, setRestingHr] = useState(48);
  const [currentBpm, setCurrentBpm] = useState(138);

  // Interval timer for zone 5 conditioning
  const [isIntervalRunning, setIsIntervalRunning] = useState(false);
  const [intervalTime, setIntervalTime] = useState(180);
  const [currentIntervalRound, setCurrentIntervalRound] = useState(1);
  const totalRounds = 6;

  useEffect(() => {
    let intv = null;
    if (isIntervalRunning && intervalTime > 0) {
      intv = setInterval(() => {
        setIntervalTime(prev => prev - 1);
        setCurrentBpm(prev => Math.min(184, Math.max(155, prev + (Math.random() > 0.4 ? 1 : -1))));
      }, 1000);
    } else if (intervalTime === 0 && isIntervalRunning) {
      if (currentIntervalRound < totalRounds) {
        setCurrentIntervalRound(r => r + 1);
        setIntervalTime(180);
      } else {
        setIsIntervalRunning(false);
      }
    }
    return () => clearInterval(intv);
  }, [isIntervalRunning, intervalTime, currentIntervalRound]);

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m.toString().padStart(2, '0') + ':' + s.toString().padStart(2, '0');
  };

  const hrZones = [
    { zone: 'Zone 5: Anaerobic Max (90-100%)', range: '172 - 190 BPM', time: '14 min', pct: 25, color: 'bg-rose-500' },
    { zone: 'Zone 4: Lactate Threshold (80-90%)', range: '154 - 171 BPM', time: '28 min', pct: 40, color: 'bg-amber-500' },
    { zone: 'Zone 3: Aerobic Tempo (70-80%)', range: '135 - 153 BPM', time: '35 min', pct: 25, color: 'bg-emerald-500' },
    { zone: 'Zone 2: Endurance Base (60-70%)', range: '115 - 134 BPM', time: '45 min', pct: 10, color: 'bg-cyan-500' }
  ];

  return (
    <div className="min-h-screen bg-[#06080d] text-zinc-100 flex justify-center items-start p-2 sm:p-4 font-sans select-none">
      <div className="w-full max-w-[420px] bg-[#0b0e15] border border-cyan-500/30 rounded-[40px] shadow-2xl overflow-hidden flex flex-col min-h-[820px] relative">
        
        {/* Pro Header */}
        <div className="pt-3 px-6 pb-3 flex justify-between items-center text-xs border-b border-zinc-850 bg-[#0b0e15]/95 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Zap size={15} />
            </div>
            <div>
              <span className="font-extrabold text-white font-mono text-xs">FitPulse PRO</span>
              <p className="text-[9px] text-cyan-400 font-mono uppercase">Biometrics Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[11px] font-mono rounded-full font-bold flex items-center gap-1">
              <Activity size={12} className="animate-pulse" /> VO2: {vo2Max}
            </span>
          </div>
        </div>

        {/* Scroll View */}
        <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-4">

          {/* TAB 1: TELEMETRY */}
          {proTab === 'telemetry' && (
            <div className="space-y-4">
              
              {/* Daily Recovery Gauge Card */}
              <div className="p-5 bg-gradient-to-br from-zinc-900 via-[#0e141f] to-cyan-950/40 border border-cyan-500/30 rounded-3xl space-y-3 relative overflow-hidden">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold tracking-wider">HRV Readiness Index</span>
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono rounded-full font-bold">OPTIMAL</span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-4xl font-extrabold font-mono text-white tracking-tight">{recoveryScore}%</div>
                    <p className="text-xs text-emerald-400 font-semibold mt-0.5 flex items-center gap-1">
                      <Zap size={13} /> High Aerobic Capacity
                    </p>
                  </div>

                  <div className="text-right space-y-1 font-mono text-xs">
                    <div className="text-zinc-400">HRV rMSSD: <strong className="text-cyan-300">{hrvRmsdd} ms</strong></div>
                    <div className="text-zinc-400">Resting HR: <strong className="text-white">{restingHr} BPM</strong></div>
                    <div className="text-zinc-400">Skin Temp: <strong className="text-white">98.2°F</strong></div>
                  </div>
                </div>

                <p className="text-[11px] text-zinc-400 leading-relaxed border-t border-zinc-800/80 pt-2.5">
                  Autonomic nervous system is primed for high glycolytic flux. Optimal for heavy squats or threshold intervals today.
                </p>
              </div>

              {/* Real-Time BPM Stream */}
              <div className="p-4 bg-zinc-900/70 border border-zinc-800 rounded-3xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Heart size={14} className="text-rose-500 fill-rose-500 animate-pulse" /> Live Cardio Telemetry
                  </span>
                  <span className="font-mono text-[11px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full font-bold">
                    {currentBpm} BPM
                  </span>
                </div>

                {/* Simulated EKG Line */}
                <div className="h-14 bg-zinc-950 rounded-2xl border border-zinc-800 p-2 flex items-center overflow-hidden">
                  <svg className="w-full h-full" viewBox="0 0 300 40">
                    <path 
                      d="M 0 20 L 40 20 L 50 5 L 60 35 L 70 15 L 80 20 L 120 20 L 130 5 L 140 35 L 150 15 L 160 20 L 200 20 L 210 5 L 220 35 L 230 15 L 240 20 L 300 20" 
                      fill="none" 
                      stroke="#06b6d4" 
                      strokeWidth="2" 
                      className="animate-pulse"
                    />
                  </svg>
                </div>
              </div>

              {/* Heart Rate Zones Breakdown */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Heart Rate Zone Target Breakdown</h4>
                  <span className="text-[10px] font-mono text-zinc-500">2h 02m Total</span>
                </div>

                <div className="space-y-2">
                  {hrZones.map((z, i) => (
                    <div key={i} className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-zinc-200">{z.zone}</span>
                        <span className="font-mono text-zinc-400 text-[11px]">{z.time}</span>
                      </div>
                      <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                        <div className={z.color + " h-full transition-all"} style={{ width: z.pct + '%' }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: INTERVAL PROTOCOLS */}
          {proTab === 'intervals' && (
            <div className="space-y-4">
              
              {/* Interval Active Stage */}
              <div className="p-6 bg-gradient-to-br from-rose-950/40 via-zinc-900 to-[#0c1017] border border-rose-500/30 rounded-3xl text-center space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono font-bold text-rose-400 uppercase">Round {currentIntervalRound} / {totalRounds}</span>
                  <span className="text-xs font-mono bg-rose-500/10 text-rose-300 px-2 py-0.5 rounded-full border border-rose-500/20 font-bold">
                    Zone 5 VO2 Max
                  </span>
                </div>

                <div className="text-6xl font-extrabold font-mono text-white tracking-tight">
                  {formatTimer(intervalTime)}
                </div>

                <p className="text-xs text-rose-300 font-semibold">95% Target Heart Rate • 176-184 BPM</p>

                <div className="flex gap-2 justify-center">
                  <button 
                    onClick={() => setIsIntervalRunning(!isIntervalRunning)}
                    className={"flex-1 py-3 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all " + (
                      isIntervalRunning ? 'bg-amber-500 text-zinc-950' : 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                    )}
                  >
                    {isIntervalRunning ? <Pause size={16} /> : <Play size={16} className="fill-white" />}
                    <span>{isIntervalRunning ? 'Pause Interval' : 'Start Round'}</span>
                  </button>

                  <button 
                    onClick={() => { setIsIntervalRunning(false); setIntervalTime(180); }}
                    className="p-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl border border-zinc-700 cursor-pointer"
                  >
                    <RotateCcw size={16} />
                  </button>
                </div>
              </div>

              {/* Protocol presets */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Interval Presets</h4>
                {[
                  { name: 'Norwegian 4x4 VO2 Max', desc: '4 x 4min intervals at 90-95% Max HR with 3min active recovery.', badge: 'Endurance PR' },
                  { name: 'Tabata Micro-Bursts', desc: '8 x (20s sprint / 10s rest) anaerobic power threshold.', badge: 'Fat Oxidation' },
                  { name: 'Zone 2 Metabolic Base', desc: '45min continuous fat oxidation threshold (125-135 BPM).', badge: 'Mitochondrial' }
                ].map((p, idx) => (
                  <div key={idx} className="p-3.5 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-white">{p.name}</span>
                      <span className="text-[9px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full">{p.badge}</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">{p.desc}</p>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* TAB 3: SLEEP & RECOVERY */}
          {proTab === 'sleep' && (
            <div className="space-y-4">
              <div className="p-5 bg-gradient-to-br from-indigo-950/50 via-zinc-900 to-zinc-900 border border-indigo-500/30 rounded-3xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono text-indigo-400 uppercase font-bold">Sleep Performance</span>
                  <span className="text-xs font-mono text-emerald-400 font-bold">8h 12m (96% Efficiency)</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-2">
                  <div className="p-2.5 bg-zinc-950/70 rounded-xl">
                    <span className="text-xs font-bold text-white font-mono">1h 48m</span>
                    <p className="text-[10px] text-indigo-400">Deep Sleep</p>
                  </div>
                  <div className="p-2.5 bg-zinc-950/70 rounded-xl">
                    <span className="text-xs font-bold text-white font-mono">2h 14m</span>
                    <p className="text-[10px] text-purple-400">REM Sleep</p>
                  </div>
                  <div className="p-2.5 bg-zinc-950/70 rounded-xl">
                    <span className="text-xs font-bold text-white font-mono">4h 10m</span>
                    <p className="text-[10px] text-zinc-400">Light Sleep</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Bottom Pro Nav */}
        <div className="absolute bottom-0 inset-x-0 bg-[#0b0e15]/95 backdrop-blur-md border-t border-zinc-850 px-4 py-3 flex justify-around items-center z-30">
          <button 
            onClick={() => setProTab('telemetry')}
            className={"flex flex-col items-center gap-1 text-[10px] font-medium transition-colors cursor-pointer " + (
              proTab === 'telemetry' ? 'text-cyan-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'
            )}
          >
            <Activity size={18} />
            <span>Telemetry</span>
          </button>

          <button 
            onClick={() => setProTab('intervals')}
            className={"flex flex-col items-center gap-1 text-[10px] font-medium transition-colors cursor-pointer " + (
              proTab === 'intervals' ? 'text-cyan-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'
            )}
          >
            <Flame size={18} />
            <span>Intervals</span>
          </button>

          <button 
            onClick={() => setProTab('sleep')}
            className={"flex flex-col items-center gap-1 text-[10px] font-medium transition-colors cursor-pointer " + (
              proTab === 'sleep' ? 'text-cyan-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'
            )}
          >
            <Moon size={18} />
            <span>Recovery</span>
          </button>
        </div>

      </div>
    </div>
  );
}
`;
