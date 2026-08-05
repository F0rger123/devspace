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
      <div className="flex items-center justify-between text-[10px] text-zinc-400 px-1">
        <span>Persistent Desktop Notifications</span>
        <button onClick={onMarkAllRead} className="hover:text-white underline cursor-pointer">
          Mark All Read
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className="p-6 text-center text-zinc-500 text-xs font-mono bg-white/3 border border-white/10 rounded-2xl">
          No unread desktop notifications.
        </div>
      ) : (
        notifications.map((n) => (
          <div
            key={n.id}
            className={`p-3 rounded-2xl border text-xs space-y-1 ${
              n.type === 'error'
                ? 'bg-red-950/20 border-red-500/40 text-red-200'
                : n.type === 'warning'
                ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                : 'bg-white/5 border-white/10 text-zinc-200'
            }`}
          >
            <div className="flex items-center justify-between font-bold">
              <span>{n.title}</span>
              <button onClick={() => onDismiss(n.id)} className="text-zinc-500 hover:text-white p-0.5 cursor-pointer">
                <X size={11} />
              </button>
            </div>
            <p className="text-[10.5px] text-zinc-400">{n.message}</p>
          </div>
        ))
      )}
    </div>
  );
};
