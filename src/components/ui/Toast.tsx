import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, AlertCircle, Cloud, RefreshCw, X, Info } from 'lucide-react';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error' | 'sync';
  duration?: number;
}

interface ToastContainerProps {
  toasts: Toast[];
  removeToast: (id: string) => void;
}

export function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95, x: 50 }}
            animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: 100, transition: { duration: 0.15 } }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="pointer-events-auto w-full"
          >
            <ToastItem toast={toast} onClose={() => removeToast(toast.id)} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
  onClose: () => void;
}

function ToastItem({ toast, onClose }: ToastItemProps) {
  const getStyles = () => {
    switch (toast.type) {
      case 'success':
        return {
          icon: <Check size={14} className="text-emerald-400" />,
          borderColor: 'border-emerald-500/20',
          bgGlow: 'shadow-[0_0_15px_rgba(16,185,129,0.05)]',
          accentBg: 'bg-emerald-500/10',
          textColor: 'text-emerald-400'
        };
      case 'error':
        return {
          icon: <AlertCircle size={14} className="text-red-400" />,
          borderColor: 'border-red-500/20',
          bgGlow: 'shadow-[0_0_15px_rgba(239,68,68,0.05)]',
          accentBg: 'bg-red-500/10',
          textColor: 'text-red-400'
        };
      case 'sync':
        return {
          icon: <RefreshCw size={14} className="text-yellow-500 animate-spin" />,
          borderColor: 'border-yellow-500/20',
          bgGlow: 'shadow-[0_0_15px_rgba(234,179,8,0.05)]',
          accentBg: 'bg-yellow-500/10',
          textColor: 'text-yellow-500'
        };
      case 'info':
      default:
        return {
          icon: <Info size={14} className="text-blue-400" />,
          borderColor: 'border-blue-500/20',
          bgGlow: 'shadow-[0_0_15px_rgba(59,130,246,0.05)]',
          accentBg: 'bg-blue-500/10',
          textColor: 'text-blue-400'
        };
    }
  };

  const styles = getStyles();

  return (
    <div className={`flex items-start gap-3 bg-[#0a0a0c]/95 border ${styles.borderColor} ${styles.bgGlow} backdrop-blur-md rounded-xl p-3.5 pr-8 relative overflow-hidden transition-all duration-300`}>
      {/* Accent glow bar on the left */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${styles.accentBg}`} />

      <div className={`p-1.5 rounded-lg ${styles.accentBg} shrink-0`}>
        {styles.icon}
      </div>

      <div className="space-y-0.5 flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-bold tracking-wider uppercase font-mono ${styles.textColor}`}>
            {toast.type === 'sync' ? 'Firestore Sync' : toast.type === 'success' ? 'Saved' : toast.type === 'error' ? 'Sync Failed' : 'Info'}
          </span>
        </div>
        <p className="text-xs text-zinc-300 leading-relaxed font-sans font-medium break-words">
          {toast.message}
        </p>
      </div>

      <button
        onClick={onClose}
        className="absolute top-2 right-2 p-1 text-zinc-500 hover:text-zinc-300 rounded-lg hover:bg-zinc-900 transition-colors cursor-pointer"
      >
        <X size={12} />
      </button>
    </div>
  );
}
