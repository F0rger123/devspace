import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw, Trash2, ArrowLeft, Terminal } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an exception:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetStorage = () => {
    if (confirm("Are you sure you want to reset local workspace state? This will clear local preferences to recover from potential state corruption.")) {
      try {
        window.localStorage.clear();
        window.sessionStorage.clear();
        window.location.href = '/';
      } catch (err) {
        console.error("Failed to clear storage:", err);
      }
    }
  };

  public render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || String(this.state.error);
      const errorStack = this.state.error?.stack || 'No stack trace available';
      const componentStack = this.state.errorInfo?.componentStack || '';

      return (
        <div id="error-boundary-root" className="min-h-screen h-screen w-full bg-[#030305] text-zinc-200 flex items-center justify-center p-4 relative overflow-hidden starry-background select-none">
          {/* Cosmic nebulas and stars bg layers */}
          <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-yellow-500/[0.03] blur-[140px] pointer-events-none animate-space-nebula" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-emerald-500/[0.02] blur-[160px] pointer-events-none animate-space-nebula" />

          <div id="error-card" className="w-full max-w-2xl bg-[#08080c] border border-zinc-900 rounded-2xl shadow-[0_0_80px_rgba(0,0,0,0.85)] overflow-hidden relative z-10 flex flex-col max-h-[90vh]">
            {/* Top decorative hazard ribbon */}
            <div className="h-1 bg-gradient-to-r from-red-500 via-amber-500 to-red-500 w-full" />

            <div className="p-6 sm:p-8 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
              {/* Header */}
              <div className="flex items-start gap-4">
                <div className="p-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl shrink-0">
                  <ShieldAlert size={26} className="animate-pulse" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-red-400 uppercase bg-red-950/30 border border-red-900/40 px-2.5 py-0.5 rounded-full">
                    SYNAPSE RUNTIME ERROR
                  </span>
                  <h1 className="text-xl font-bold tracking-tight text-zinc-100 font-sans mt-1">
                    Application Workspace Crashed
                  </h1>
                  <p className="text-xs text-zinc-500">
                    A severe render exception was caught by the DevSpace OS compiler boundary. Use the recovery options below.
                  </p>
                </div>
              </div>

              {/* Error Message Panel */}
              <div className="bg-red-950/15 border border-red-900/30 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-red-400 text-xs font-bold font-mono">
                  <Terminal size={14} /> EXCEPTION_MESSAGE
                </div>
                <p className="text-sm text-zinc-300 font-medium font-sans select-text">
                  {errorMessage}
                </p>
              </div>

              {/* Technical Diagnostics */}
              <div className="space-y-2 flex flex-col">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal size={12} /> Live Stack Trace (Diagnostics)
                </label>
                <div className="bg-[#030305] border border-zinc-900/80 rounded-xl p-3 max-h-[180px] overflow-auto custom-scrollbar text-[10px] font-mono text-zinc-400 leading-relaxed select-text whitespace-pre">
                  <span className="text-zinc-600 block mb-1 font-bold">// Original Error Call Stack:</span>
                  {errorStack}
                  {componentStack && (
                    <>
                      <span className="text-zinc-600 block mt-3 mb-1 font-bold">// React Component Hierarchy Tree:</span>
                      {componentStack}
                    </>
                  )}
                </div>
              </div>

              {/* Action Recovery Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-zinc-900/60 mt-2">
                <button
                  id="error-reload-btn"
                  onClick={this.handleReload}
                  className="w-full sm:w-auto px-5 py-2.5 bg-zinc-100 hover:bg-white text-black font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw size={14} /> Quick Reload
                </button>
                <button
                  id="error-reset-btn"
                  onClick={this.handleResetStorage}
                  className="w-full sm:w-auto px-4 py-2.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 text-zinc-400 hover:text-zinc-200 font-mono text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer sm:ml-auto"
                >
                  <Trash2 size={13} className="text-red-500" /> Factory Reset Workspace
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
