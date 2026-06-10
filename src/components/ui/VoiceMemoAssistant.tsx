import React from 'react';
import { Mic, Sparkles, X, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation } from 'react-router-dom';
import { useStore } from '../../store';

export function VoiceMemoAssistant() {
  const { isRightSidebarOpen, toggleRightSidebar } = useStore();
  const location = useLocation();
  const isAssistantRoute = location.pathname === '/assistant';

  if (isRightSidebarOpen || isAssistantRoute) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2">
      
      {/* Hover Status Info Badge */}
      <AnimatePresence>
        {!isRightSidebarOpen && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-800 backdrop-blur-md text-[10px] font-mono font-medium text-zinc-300 shadow-xl"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            <span>Click to expand Aether Workspace</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Activation Button */}
      <motion.button
        id="global-ais-voice-btn"
        onClick={toggleRightSidebar}
        className={`relative group p-4 rounded-full shadow-2xl flex items-center justify-center transition-all cursor-pointer ${
          isRightSidebarOpen 
            ? 'bg-zinc-800 text-zinc-300 border border-zinc-700/80 hover:bg-zinc-700 hover:text-white' 
            : 'bg-gradient-to-tr from-[#4f46e5] via-[#6366f1] to-[#a855f7] text-white hover:shadow-[#a855f7]/30 hover:-translate-y-0.5'
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="Toggle Aether Assistant Workspace"
      >
        <AnimatePresence mode="wait">
          {isRightSidebarOpen ? (
            <motion.div 
              key="close" 
              initial={{ rotate: -90, opacity: 0 }} 
              animate={{ rotate: 0, opacity: 1 }} 
              exit={{ rotate: 90, opacity: 0 }}
              className="flex items-center justify-center"
            >
              <X size={20} />
            </motion.div>
          ) : (
            <motion.div 
              key="mic" 
              initial={{ rotate: 90, opacity: 0 }} 
              animate={{ rotate: 0, opacity: 1 }} 
              exit={{ rotate: -90, opacity: 0 }}
              className="relative flex items-center justify-center"
            >
              <Bot size={20} />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10b981]"></span>
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
export default VoiceMemoAssistant;
