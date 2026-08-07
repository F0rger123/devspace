import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Target,
  Sparkles,
  Calendar,
  Layers,
  Calendar as CalendarIcon,
  Zap,
  TrendingUp,
} from 'lucide-react';
import { aetherReminders, AetherReminder } from '../lib/aetherRemindersService';
import { aetherGoals, AetherGoal, GoalCategory } from '../lib/aetherGoalsService';

export function AetherRemindersGoalsTab() {
  const [reminders, setReminders] = useState<AetherReminder[]>(() => aetherReminders.getReminders());
  const [goals, setGoals] = useState<AetherGoal[]>(() => aetherGoals.getGoals());

  // NL Reminder Input State
  const [nlInput, setNlInput] = useState('');
  const [reminderFilter, setReminderFilter] = useState<'pending' | 'completed' | 'all'>('pending');

  // New Goal Input State
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalCategory, setGoalCategory] = useState<GoalCategory>('coding');
  const [goalTargetDate, setGoalTargetDate] = useState('');
  const [milestonesInput, setMilestonesInput] = useState('');

  const refreshReminders = () => {
    setReminders(aetherReminders.getReminders());
  };

  const refreshGoals = () => {
    setGoals(aetherGoals.getGoals());
  };

  const handleAddNlReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlInput.trim()) return;
    aetherReminders.parseAndCreateReminder(nlInput);
    setNlInput('');
    refreshReminders();
  };

  const handleToggleReminder = (id: string) => {
    aetherReminders.toggleReminderCompleted(id);
    refreshReminders();
  };

  const handleDeleteReminder = (id: string) => {
    aetherReminders.deleteReminder(id);
    refreshReminders();
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;
    const ms = milestonesInput
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);
    aetherGoals.createGoal(goalTitle, goalCategory, goalTargetDate || undefined, ms);
    setGoalTitle('');
    setGoalTargetDate('');
    setMilestonesInput('');
    setShowGoalModal(false);
    refreshGoals();
  };

  const handleToggleMilestone = (goalId: string, milestoneId: string) => {
    aetherGoals.toggleMilestone(goalId, milestoneId);
    refreshGoals();
  };

  const handleDeleteGoal = (goalId: string) => {
    aetherGoals.deleteGoal(goalId);
    refreshGoals();
  };

  const filteredReminders = reminders.filter(r => {
    if (reminderFilter === 'pending') return !r.completed;
    if (reminderFilter === 'completed') return r.completed;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-400" />
            Reminders & Long-Term Goals
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Natural language reminders, recurring schedules, and long-term goal tracking integrated into Aether Operating System.
          </p>
        </div>
        <button
          onClick={() => setShowGoalModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          Define Goal
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN: NATURAL LANGUAGE REMINDERS */}
        <div className="p-5 rounded-xl bg-slate-900/50 border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              Real Reminders
            </h3>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              {(['pending', 'completed', 'all'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setReminderFilter(f)}
                  className={`px-2.5 py-1 rounded-md capitalize font-medium transition-colors ${
                    reminderFilter === f ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* NL Input Form */}
          <form onSubmit={handleAddNlReminder} className="relative">
            <input
              type="text"
              value={nlInput}
              onChange={e => setNlInput(e.target.value)}
              placeholder='e.g., "Remind me in 45 mins to test build" or "Remind me every Friday"'
              className="w-full bg-slate-950 text-slate-100 text-sm placeholder-slate-500 border border-slate-800 rounded-lg pl-3 pr-24 py-2.5 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/80"
            />
            <button
              type="submit"
              disabled={!nlInput.trim()}
              className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold rounded-md transition-all flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Set
            </button>
          </form>

          {/* Reminders List */}
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {filteredReminders.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-800 rounded-lg">
                <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No {reminderFilter} reminders found.</p>
                <p className="text-xs text-slate-500 mt-1">Type in natural language above to schedule one.</p>
              </div>
            ) : (
              filteredReminders.map(rem => (
                <div
                  key={rem.id}
                  className={`p-3.5 rounded-lg border transition-all flex items-start justify-between gap-3 ${
                    rem.completed
                      ? 'bg-slate-950/40 border-slate-900 opacity-60'
                      : 'bg-slate-950/80 border-slate-800/90 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => handleToggleReminder(rem.id)}
                      className={`mt-0.5 p-1 rounded-md transition-colors ${
                        rem.completed
                          ? 'text-emerald-400 bg-emerald-500/10'
                          : 'text-slate-500 hover:text-slate-300 bg-slate-900'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium ${rem.completed ? 'line-through text-slate-400' : 'text-slate-200'}`}>
                        {rem.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-400">
                        <span className="flex items-center gap-1 text-slate-400">
                          <CalendarIcon className="w-3 h-3 text-indigo-400" />
                          {rem.formattedTime}
                        </span>
                        {rem.recurrence !== 'none' && (
                          <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono text-[10px]">
                            {rem.recurrence}
                          </span>
                        )}
                        <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 text-[10px] uppercase font-semibold">
                          {rem.category}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteReminder(rem.id)}
                    className="p-1 text-slate-600 hover:text-rose-400 transition-colors"
                    title="Delete reminder"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: LONG-TERM GOALS */}
        <div className="p-5 rounded-xl bg-slate-900/50 border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-400" />
              Long-Term Goals
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {goals.filter(g => g.status === 'active').length} Active Targets
            </span>
          </div>

          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
            {goals.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-800 rounded-lg">
                <Target className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No long-term goals established yet.</p>
                <button
                  onClick={() => setShowGoalModal(true)}
                  className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 font-medium underline"
                >
                  Define your first target goal
                </button>
              </div>
            ) : (
              goals.map(goal => (
                <div
                  key={goal.id}
                  className="p-4 rounded-lg bg-slate-950/80 border border-slate-800/90 space-y-3 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-wider">
                          {goal.category}
                        </span>
                        {goal.targetDate && (
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            Target: {goal.targetDate}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-semibold text-slate-100 mt-1">{goal.title}</h4>
                    </div>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="text-slate-600 hover:text-rose-400 transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Progress</span>
                      <span className="font-semibold text-indigo-400">{goal.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-300 rounded-full"
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Milestones List */}
                  {goal.milestones.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Milestones</p>
                      {goal.milestones.map(m => (
                        <div
                          key={m.id}
                          onClick={() => handleToggleMilestone(goal.id, m.id)}
                          className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer group hover:text-white"
                        >
                          <div
                            className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                              m.completed
                                ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                                : 'border-slate-700 bg-slate-900 group-hover:border-slate-500'
                            }`}
                          >
                            {m.completed && <CheckCircle2 className="w-3 h-3" />}
                          </div>
                          <span className={m.completed ? 'line-through text-slate-500' : ''}>{m.title}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* DEFINE GOAL MODAL */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-lg space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-400" />
              Define New Long-Term Goal
            </h3>

            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Goal Title</label>
                <input
                  type="text"
                  required
                  value={goalTitle}
                  onChange={e => setGoalTitle(e.target.value)}
                  placeholder="e.g., Save $25,000 in treasury, or Complete 4 workouts weekly"
                  className="w-full bg-slate-950 text-slate-100 text-sm border border-slate-800 rounded-lg p-2.5 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={goalCategory}
                    onChange={e => setGoalCategory(e.target.value as GoalCategory)}
                    className="w-full bg-slate-950 text-slate-100 text-sm border border-slate-800 rounded-lg p-2.5 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="coding">Coding & Software</option>
                    <option value="career">Career & Work</option>
                    <option value="financial">Financial</option>
                    <option value="health">Health & Fitness</option>
                    <option value="learning">Learning & Education</option>
                    <option value="personal">Personal</option>
                    <option value="business">Business</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Target Completion Date</label>
                  <input
                    type="date"
                    value={goalTargetDate}
                    onChange={e => setGoalTargetDate(e.target.value)}
                    className="w-full bg-slate-950 text-slate-100 text-sm border border-slate-800 rounded-lg p-2.5 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Key Milestones (One per line)
                </label>
                <textarea
                  rows={3}
                  value={milestonesInput}
                  onChange={e => setMilestonesInput(e.target.value)}
                  placeholder="Milestone 1&#10;Milestone 2&#10;Milestone 3"
                  className="w-full bg-slate-950 text-slate-100 text-sm border border-slate-800 rounded-lg p-2.5 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGoalModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors shadow-lg shadow-indigo-600/20"
                >
                  Create Target Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
