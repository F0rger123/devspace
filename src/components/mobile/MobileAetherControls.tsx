import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, 
  MicOff, 
  Sparkles, 
  Layers, 
  Plus, 
  Send, 
  X, 
  CheckSquare, 
  FileText, 
  BrainCircuit, 
  Smartphone,
  Bell,
  Fingerprint
} from 'lucide-react';
import { haptic } from '../../utils/haptics';
import { isMobile, requestMicrophonePermission, requestAndroidNotificationPermission } from '../../lib/androidBridge';
import { useStore } from '../../store';
import { useData } from '../../context/DataProvider';
import { useNavigate } from 'react-router-dom';

export function MobileAetherControls() {
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [quickInput, setQuickInput] = useState('');
  const [activeTab, setActiveTab] = useState<'voice' | 'dream' | 'task'>('voice');
  
  const { toggleRightSidebar } = useStore();
  const { addIssue, addNote, showToast, userProfile, googleUser, projects } = useData();
  const navigate = useNavigate();
  const activeProjectId = projects[0]?.id || 'workspace-main';

  useEffect(() => {
    const check = () => setIsMobileDevice(isMobile());
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (!isMobileDevice) {
    return null;
  }

  const handleVoiceToggle = async () => {
    haptic.light();
    if (!isRecording) {
      const perm = await requestMicrophonePermission();
      if (!perm.granted) {
        showToast('⚠️ Microphone permission required for Aether mobile voice.', 'info');
        return;
      }
      setIsRecording(true);
      haptic.medium();
      showToast('🎙️ Aether mobile listening...', 'info', 2000);
    } else {
      setIsRecording(false);
      haptic.success();
      showToast('⚡ Processing voice directive...', 'success', 2000);
    }
  };

  const handleQuickTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;

    haptic.success();
    if (activeTab === 'task') {
      addIssue({
        projectId: activeProjectId,
        title: quickInput.trim(),
        description: 'Captured via Android Mobile Aether dock',
        priority: 'Medium',
        status: 'Todo',
        type: 'Task'
      });
      showToast('✅ Mobile task added to your workspace board!', 'success');
    } else {
      addNote({
        projectId: activeProjectId,
        title: quickInput.trim().slice(0, 30),
        content: quickInput.trim(),
        tags: ['Mobile-Capture']
      });
      showToast('📝 Mobile note saved!', 'success');
    }

    setQuickInput('');
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Floating Action Pill at Bottom Right */}
      <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-2 pointer-events-auto select-none sm:hidden">
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => {
            haptic.light();
            setIsOpen(!isOpen);
          }}
          className="w-13 h-13 rounded-full bg-gradient-to-tr from-yellow-500 to-amber-400 text-black flex items-center justify-center shadow-[0_4px_20px_rgba(234,179,8,0.4)] border-2 border-yellow-300 font-bold cursor-pointer"
          aria-label="Open Mobile Aether Quick Controls"
        >
          {isOpen ? <X size={22} /> : <Sparkles size={22} />}
        </motion.button>
      </div>

      {/* Mobile Bottom Sheet Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:hidden select-none">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full bg-[#0d0d12] border-t border-yellow-500/40 rounded-t-3xl p-5 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] max-h-[80vh] overflow-y-auto"
            >
              {/* Drag Handle Indicator */}
              <div className="w-12 h-1.5 bg-zinc-700 rounded-full mx-auto mb-4" />

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center text-yellow-400">
                    <Smartphone size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white font-mono">Mobile Aether</h3>
                    <span className="text-[10px] text-zinc-400">Native Android Quick Controls</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    haptic.light();
                    setIsOpen(false);
                  }}
                  className="p-1.5 text-zinc-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Mode Selector Tabs */}
              <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 mb-4">
                {[
                  { id: 'voice', label: 'Voice Control', icon: <Mic size={14} /> },
                  { id: 'dream', label: 'Dreams', icon: <Sparkles size={14} /> },
                  { id: 'task', label: 'Quick Capture', icon: <Plus size={14} /> }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      haptic.light();
                      setActiveTab(tab.id as any);
                    }}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                      activeTab === tab.id
                        ? 'bg-yellow-500 text-black font-bold shadow'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Tab 1: Mobile Voice */}
              {activeTab === 'voice' && (
                <div className="flex flex-col items-center justify-center py-4 space-y-4 text-center">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleVoiceToggle}
                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                      isRecording
                        ? 'bg-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.6)] animate-pulse'
                        : 'bg-yellow-500 text-black shadow-[0_0_20px_rgba(234,179,8,0.3)]'
                    }`}
                  >
                    {isRecording ? <MicOff size={32} /> : <Mic size={32} />}
                  </motion.button>
                  <div>
                    <p className="text-xs font-bold text-zinc-200">
                      {isRecording ? 'Listening... Tap to Complete' : 'Tap to Speak to Aether'}
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Commands: "Add task", "Review dreams", "Open notes", "Summarize daily hub"
                    </p>
                  </div>
                </div>
              )}

              {/* Tab 2: Dream Review Jump */}
              {activeTab === 'dream' && (
                <div className="space-y-3 py-2">
                  <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
                    <span className="text-xs font-bold text-yellow-400 flex items-center gap-1.5">
                      <Sparkles size={14} /> Touch-Optimized Dream Swipe
                    </span>
                    <p className="text-xs text-zinc-300">
                      Swipe left or right through AI code optimization proposals with native tactile feedback.
                    </p>
                    <button
                      onClick={() => {
                        haptic.medium();
                        setIsOpen(false);
                        navigate('/dashboard');
                      }}
                      className="w-full py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Layers size={14} />
                      <span>Launch Dream Swipe Deck</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 3: Quick Capture Task / Note */}
              {activeTab === 'task' && (
                <form onSubmit={handleQuickTaskSubmit} className="space-y-3 py-2">
                  <input
                    type="text"
                    required
                    placeholder="Enter quick task or note..."
                    value={quickInput}
                    onChange={(e) => setQuickInput(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-3 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-yellow-500"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="submit"
                      className="py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
                    >
                      <CheckSquare size={14} /> Add as Task
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!quickInput.trim()) return;
                        haptic.success();
                        addNote({
                          projectId: activeProjectId,
                          title: quickInput.trim().slice(0, 30),
                          content: quickInput.trim(),
                          tags: ['Mobile-Capture']
                        });
                        showToast('📝 Saved as Note!', 'success');
                        setQuickInput('');
                        setIsOpen(false);
                      }}
                      className="py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
                    >
                      <FileText size={14} /> Add as Note
                    </button>
                  </div>
                </form>
              )}

              {/* Proactive Notification Permission Button if not yet granted */}
              {typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted' && (
                <div className="mt-4 pt-3 border-t border-zinc-850 flex items-center justify-between">
                  <span className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                    <Bell size={13} className="text-yellow-400" /> Enable Android Push Notifications
                  </span>
                  <button
                    onClick={async () => {
                      haptic.light();
                      const perm = await requestAndroidNotificationPermission();
                      if (perm === 'granted') {
                        showToast('🔔 Android notifications enabled!', 'success');
                      }
                    }}
                    className="px-2.5 py-1 bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 rounded text-[10px] font-bold"
                  >
                    Enable
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
