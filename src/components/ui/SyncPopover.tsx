import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Cloud, Check, RefreshCw, AlertCircle, Database, Server, User, FileText, CheckSquare, BrainCircuit } from 'lucide-react';
import { useData } from '../../context/DataProvider';

interface SyncPopoverProps {
  onClose: () => void;
}

export function SyncPopover({ onClose }: SyncPopoverProps) {
  const { syncStatus, lastSyncedTime, triggerFullSync } = useData();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleManualSync = async () => {
    setIsSyncing(true);
    await triggerFullSync();
    setIsSyncing(false);
  };

  const formatLastSynced = () => {
    if (!lastSyncedTime) return 'Never synced this session';
    const date = new Date(lastSyncedTime);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const getStatusDetails = () => {
    switch (syncStatus) {
      case 'saving':
        return {
          title: 'Syncing Workspace...',
          description: 'Uploading changes to Cloud Firestore...',
          colorClass: 'text-yellow-500',
          bgColor: 'bg-yellow-500/10',
          icon: <RefreshCw className="animate-spin text-yellow-500" size={16} />,
          dotColor: 'bg-yellow-500 animate-pulse'
        };
      case 'error':
        return {
          title: 'Sync Interrupted',
          description: 'Verify your Firestore credentials or internet link.',
          colorClass: 'text-red-400',
          bgColor: 'bg-red-400/10',
          icon: <AlertCircle className="text-red-400" size={16} />,
          dotColor: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)]'
        };
      case 'saved':
      case 'idle':
      default:
        return {
          title: 'Fully Synchronized',
          description: 'All local edits are fully committed to Cloud Firestore.',
          colorClass: 'text-emerald-400',
          bgColor: 'bg-emerald-500/10',
          icon: <Cloud className="text-emerald-400" size={16} />,
          dotColor: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]'
        };
    }
  };

  const status = getStatusDetails();

  const syncModules = [
    { name: 'Projects & Workspaces', icon: <Database size={13} className="text-zinc-400" />, key: 'projects' },
    { name: 'Issues & Task Boards', icon: <CheckSquare size={13} className="text-zinc-400" />, key: 'issues' },
    { name: 'Workspace Notes & Docs', icon: <FileText size={13} className="text-zinc-400" />, key: 'notes' },
    { name: 'Aether Cortex Memory', icon: <BrainCircuit size={13} className="text-zinc-400" />, key: 'cortex' },
    { name: 'User Profile & Settings', icon: <User size={13} className="text-zinc-400" />, key: 'profile' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95 }}
      transition={{ duration: 0.12 }}
      className="absolute left-0 mt-2 w-80 bg-[#070709] border border-zinc-850 rounded-xl shadow-2xl z-50 overflow-hidden font-sans"
    >
      {/* Header */}
      <div className="p-3.5 border-b border-zinc-850 bg-zinc-950 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Server size={13} className="text-yellow-500" />
          <span className="text-[10.5px] font-bold text-zinc-300 uppercase tracking-widest font-mono">Cloud Sync Center</span>
        </div>
        <span className="text-[9px] font-mono text-zinc-500">v1.2.0-SECURE</span>
      </div>

      {/* Connection Indicator card */}
      <div className="p-4 border-b border-zinc-900 bg-[#09090c]">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${status.bgColor} shrink-0`}>
            {status.icon}
          </div>
          <div className="space-y-1">
            <h4 className={`text-xs font-semibold ${status.colorClass} flex items-center gap-1.5`}>
              <span className={`w-1.5 h-1.5 rounded-full ${status.dotColor}`} />
              {status.title}
            </h4>
            <p className="text-[11px] text-zinc-400 font-medium leading-relaxed">
              {status.description}
            </p>
          </div>
        </div>
      </div>

      {/* Synced Modules */}
      <div className="p-3.5 space-y-2.5">
        <span className="text-[9px] font-bold text-zinc-500 tracking-wider uppercase font-mono block">Synchronized Modules</span>
        <div className="space-y-1.5">
          {syncModules.map((mod) => (
            <div key={mod.key} className="flex items-center justify-between px-2 py-1.5 bg-[#0a0a0c] border border-zinc-900 rounded-md">
              <div className="flex items-center gap-2">
                {mod.icon}
                <span className="text-[11px] text-zinc-300 font-medium font-mono">{mod.name}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[8.5px] text-emerald-500 font-mono font-bold uppercase">committed</span>
                <Check size={11} className="text-emerald-500" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer / Operations */}
      <div className="p-3 bg-zinc-950 border-t border-zinc-900 flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-[10px] text-zinc-500 px-1 font-mono">
          <span>Last Commited Sync:</span>
          <span className="text-zinc-300 font-bold">{formatLastSynced()}</span>
        </div>

        <button
          onClick={handleManualSync}
          disabled={isSyncing || syncStatus === 'saving'}
          className="w-full flex items-center justify-center gap-2 py-1.5 px-3 bg-yellow-500 hover:bg-yellow-400 disabled:bg-zinc-850 text-black font-semibold rounded text-xs font-mono transition-colors shadow-[0_0_12px_rgba(234,179,8,0.15)] disabled:shadow-none disabled:text-zinc-500 cursor-pointer"
        >
          {isSyncing || syncStatus === 'saving' ? (
            <>
              <RefreshCw size={12} className="animate-spin" />
              <span>SYNCING CLOUD...</span>
            </>
          ) : (
            <>
              <RefreshCw size={12} />
              <span>SYNC WORKSPACE NOW</span>
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
