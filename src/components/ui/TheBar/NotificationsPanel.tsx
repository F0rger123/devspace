import React, { useState, useEffect } from 'react';
import {
  X,
  ExternalLink,
  Bell,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Brain,
  Sliders
} from 'lucide-react';
import { ActivityNotification } from '../../../lib/activityCenterService';
import { useSafeOverlayNavigate } from '../../../hooks/useSafeOverlayNavigate';
import {
  aetherProactiveIntelligence,
  ProactiveAlertItem,
  ProactivityLevel
} from '../../../lib/aetherProactiveIntelligenceService';
import { AetherProactiveAlertCard } from '../AetherProactiveAlertCard';

interface NotificationsPanelProps {
  notifications: ActivityNotification[];
  onMarkAllRead: () => void;
  onDismiss: (id: string) => void;
}

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
  notifications,
  onMarkAllRead,
  onDismiss,
}) => {
  const navigateMain = useSafeOverlayNavigate();
  const [activeTab, setActiveTab] = useState<'proactive' | 'system'>('proactive');
  const [proactiveAlerts, setProactiveAlerts] = useState<ProactiveAlertItem[]>(() =>
    aetherProactiveIntelligence.getAlerts()
  );
  const [proactivityLevel, setProactivityLevel] = useState<ProactivityLevel>(() =>
    aetherProactiveIntelligence.getProactivityLevel()
  );

  useEffect(() => {
    const unsub = aetherProactiveIntelligence.subscribe((alerts) => {
      setProactiveAlerts(alerts);
      setProactivityLevel(aetherProactiveIntelligence.getProactivityLevel());
    });
    return () => unsub();
  }, []);

  const handleNotificationClick = (n: ActivityNotification) => {
    let targetRoute = '/dashboard';
    if (n.category === 'dream') targetRoute = '/projects';
    else if (n.category === 'sync') targetRoute = '/cloud-sync';
    else if (n.category === 'git') targetRoute = '/github';
    else if (n.category === 'voice') targetRoute = '/voice-assistant';
    else if (n.actionUrl) targetRoute = n.actionUrl;

    navigateMain(targetRoute);
    onDismiss(n.id);
  };

  const getNotificationIcon = (n: ActivityNotification) => {
    if (n.category === 'dream') return <Sparkles size={13} className="text-amber-400 shrink-0" />;
    if (n.category === 'sync') return <RefreshCw size={13} className="text-amber-400 shrink-0" />;
    if (n.type === 'error') return <AlertCircle size={13} className="text-rose-400 shrink-0" />;
    if (n.type === 'warning') return <AlertTriangle size={13} className="text-amber-400 shrink-0" />;
    return <Bell size={13} className="text-zinc-400 shrink-0" />;
  };

  return (
    <div className="space-y-3 font-mono">
      {/* Surface Header & Mode Tabs */}
      <div className="flex items-center justify-between text-[10px] text-zinc-400 px-1 border-b border-white/10 pb-2">
        <div className="flex items-center gap-1.5 bg-black/40 p-0.5 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveTab('proactive')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer font-bold flex items-center gap-1 ${
              activeTab === 'proactive'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Brain size={11} className="text-amber-400" />
            <span>Proactive Intelligence ({proactiveAlerts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('system')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer font-bold flex items-center gap-1 ${
              activeTab === 'system'
                ? 'bg-white/15 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Bell size={11} />
            <span>System ({notifications.length})</span>
          </button>
        </div>

        {activeTab === 'system' && notifications.length > 0 && (
          <button onClick={onMarkAllRead} className="hover:text-amber-300 text-zinc-400 cursor-pointer font-medium transition-colors">
            Clear All
          </button>
        )}
      </div>

      {/* Proactive Intelligence Tab */}
      {activeTab === 'proactive' && (
        <div className="space-y-2.5">
          {/* Level Switcher Quick Bar */}
          <div className="flex items-center justify-between text-[9.5px] p-2 bg-white/5 border border-white/10 rounded-xl">
            <span className="text-zinc-400 flex items-center gap-1">
              <Sliders size={10} className="text-amber-400" /> Level:
            </span>
            <div className="flex items-center gap-1">
              {(['off', 'important_only', 'balanced', 'proactive'] as ProactivityLevel[]).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => {
                    aetherProactiveIntelligence.setProactivityLevel(lvl);
                    setProactivityLevel(lvl);
                  }}
                  className={`px-1.5 py-0.5 rounded uppercase font-bold transition-all cursor-pointer ${
                    proactivityLevel === lvl
                      ? 'bg-amber-500 text-black shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                  }`}
                >
                  {lvl === 'important_only' ? 'Important' : lvl}
                </button>
              ))}
            </div>
          </div>

          {proactiveAlerts.length === 0 ? (
            <div className="p-6 text-center text-zinc-400 text-xs font-mono bg-zinc-900/60 border border-white/10 rounded-2xl leading-relaxed flex flex-col items-center gap-2">
              <CheckCircle2 size={20} className="text-emerald-400/80" />
              <span>
                {proactivityLevel === 'off'
                  ? 'Proactivity is turned off.'
                  : 'No active proactive alerts right now. DevSpace is clean and up to date.'}
              </span>
            </div>
          ) : (
            proactiveAlerts.map((alert) => (
              <AetherProactiveAlertCard
                key={alert.id}
                alert={alert}
                compact
                onActionComplete={() => setProactiveAlerts(aetherProactiveIntelligence.getAlerts())}
              />
            ))
          )}
        </div>
      )}

      {/* System Notifications Tab */}
      {activeTab === 'system' && (
        <div className="space-y-2">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-zinc-400 text-xs font-mono bg-zinc-900/60 border border-white/10 rounded-2xl leading-relaxed flex flex-col items-center gap-2">
              <CheckCircle2 size={20} className="text-emerald-400/80" />
              <span>No unread system notifications. Everything is in sync.</span>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`group p-3 rounded-2xl border text-xs space-y-1 transition-all cursor-pointer hover:border-amber-400/50 ${
                  n.type === 'error'
                    ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                    : n.type === 'warning'
                    ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                    : 'bg-zinc-900/80 border-white/15 text-zinc-200 backdrop-blur-xl'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <div className="flex items-center gap-2">
                    {getNotificationIcon(n)}
                    <span className="group-hover:text-amber-200 transition-colors">{n.title}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-zinc-500 group-hover:text-amber-400 flex items-center gap-0.5">
                      <ExternalLink size={10} /> Open
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDismiss(n.id);
                      }}
                      className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer ml-1"
                    >
                      <X size={11} />
                    </button>
                  </div>
                </div>
                <p className="text-[10.5px] text-zinc-300 pl-5 leading-snug">{n.message}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
