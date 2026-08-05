import React from 'react';
import { X } from 'lucide-react';
import { ActivityNotification } from '../../../lib/activityCenterService';

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
  return (
    <div className="space-y-2 font-mono">
      <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
        <span>Persistent Desktop Notifications</span>
        <button onClick={onMarkAllRead} className="hover:text-white underline cursor-pointer font-medium">
          Mark All Read
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className="p-6 text-center text-slate-400 text-xs font-mono bg-slate-900/40 border border-white/10 rounded-2xl leading-relaxed">
          No unread desktop notifications.
        </div>
      ) : (
        notifications.map((n) => (
          <div
            key={n.id}
            className={`p-3 rounded-2xl border text-xs space-y-1 ${
              n.type === 'error'
                ? 'bg-red-950/30 border-red-500/40 text-red-200'
                : n.type === 'warning'
                ? 'bg-cyan-950/30 border-cyan-400/40 text-cyan-200'
                : 'bg-slate-900/60 border-white/15 text-slate-200 backdrop-blur-xl'
            }`}
          >
            <div className="flex items-center justify-between font-bold">
              <span>{n.title}</span>
              <button onClick={() => onDismiss(n.id)} className="text-slate-400 hover:text-white p-0.5 cursor-pointer">
                <X size={11} />
              </button>
            </div>
            <p className="text-[10.5px] text-slate-300">{n.message}</p>
          </div>
        ))
      )}
    </div>
  );
};
