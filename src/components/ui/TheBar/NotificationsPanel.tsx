import React from 'react';
import { X, ExternalLink, Bell, CheckCircle2, AlertTriangle, AlertCircle, Sparkles, RefreshCw } from 'lucide-react';
import { ActivityNotification } from '../../../lib/activityCenterService';
import { useSafeOverlayNavigate } from '../../../hooks/useSafeOverlayNavigate';

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
    <div className="space-y-2 font-mono">
      <div className="flex items-center justify-between text-[10px] text-zinc-400 px-1">
        <span className="flex items-center gap-1.5 font-bold text-zinc-300">
          <Bell size={11} className="text-amber-400" /> Desktop Smart Notifications ({notifications.length})
        </span>
        {notifications.length > 0 && (
          <button onClick={onMarkAllRead} className="hover:text-amber-300 text-zinc-400 cursor-pointer font-medium transition-colors">
            Clear All
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="p-6 text-center text-zinc-400 text-xs font-mono bg-zinc-900/60 border border-white/10 rounded-2xl leading-relaxed flex flex-col items-center gap-2">
          <CheckCircle2 size={20} className="text-emerald-400/80" />
          <span>No unread desktop notifications. Everything is up to date.</span>
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
            {n.reason && (
              <p className="text-[9.5px] text-amber-300/90 pl-5 italic font-sans">{n.reason}</p>
            )}
            {n.impact && (
              <div className="pl-5 pt-0.5 flex items-center gap-2 text-[9px] text-emerald-300 font-mono">
                <span>Impact: {n.impact.metric} ({n.impact.value})</span>
              </div>
            )}
            {n.suggestedAction && (
              <div className="pl-5 pt-0.5 text-[9px] text-cyan-300 font-mono">
                <span>Action: {n.suggestedAction}</span>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

