import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, MessageSquarePlus, Trash2 } from 'lucide-react';
import { aetherThreadStorage } from '../../lib/aetherThreadStorage';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class AetherErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: ''
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error?.message || 'An unexpected conversational runtime issue occurred.'
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('[AetherErrorBoundary] Caught error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, errorMessage: '' });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleStartNewConversation = () => {
    try {
      const newId = `session-${Date.now()}`;
      localStorage.setItem('aether_current_session_id', newId);
      aetherThreadStorage.emergencyPruneLocalStorage();
      window.dispatchEvent(new CustomEvent('aether_sync_chat', { detail: { sender: 'ErrorBoundary' } }));
    } catch (e) {
      console.warn('Error resetting conversation:', e);
    }
    this.handleRetry();
  };

  private handleClearCache = () => {
    try {
      aetherThreadStorage.emergencyPruneLocalStorage();
      localStorage.removeItem('aether_convo_history');
    } catch (e) {}
    this.handleRetry();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[220px] bg-[#121114] border border-amber-500/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center select-none shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3.5">
            <AlertTriangle size={22} className="animate-pulse" />
          </div>

          <h3 className="text-zinc-100 font-bold text-sm mb-1.5 font-sans">
            Aether Conversation Recovery
          </h3>
          <p className="text-zinc-400 text-xs max-w-sm mb-5 font-sans leading-relaxed">
            Aether hit a conversation-storage problem. Your DevSpace workspace is still completely safe.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <button
              onClick={this.handleRetry}
              className="px-3.5 py-1.5 bg-yellow-500/15 hover:bg-yellow-500/25 text-yellow-400 border border-yellow-500/30 rounded-xl text-xs font-bold font-mono flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <RefreshCw size={13} /> Retry Session
            </button>

            <button
              onClick={this.handleStartNewConversation}
              className="px-3.5 py-1.5 bg-zinc-850 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/60 rounded-xl text-xs font-semibold font-sans flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <MessageSquarePlus size={13} /> New Conversation
            </button>

            <button
              onClick={this.handleClearCache}
              className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 rounded-xl text-[11px] font-medium font-sans flex items-center gap-1.5 transition-all cursor-pointer"
              title="Clear temporary cached convo buffers"
            >
              <Trash2 size={12} /> Clear Cache
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
