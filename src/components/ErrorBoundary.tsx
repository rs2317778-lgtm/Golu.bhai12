import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2, ShieldAlert } from 'lucide-react';

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
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Shadow AI ErrorBoundary] Uncaught runtime exception:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetStorage = () => {
    try {
      localStorage.removeItem('shadow_ai_messages');
      localStorage.removeItem('shadow_ai_settings');
    } catch (e) {
      console.warn('Could not clear storage:', e);
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#030712] text-slate-100 flex items-center justify-center p-4 font-sans selection:bg-purple-600 selection:text-white">
          <div className="w-full max-w-lg bg-[#070b19] border border-red-500/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(239,68,68,0.25)] text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-red-950/80 border border-red-500/60 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(239,68,68,0.4)] animate-pulse">
              <ShieldAlert className="w-8 h-8 text-red-400" />
            </div>

            <div>
              <h2 className="text-lg sm:text-xl font-bold font-display text-white tracking-wide">
                SHADOW AI • Runtime Recovery System
              </h2>
              <p className="text-xs text-red-300 font-mono mt-1">
                एप्लिकेशन रिकवरी मोड (Application Recovery Mode)
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-red-950/30 border border-red-900/50 text-left space-y-2">
              <p className="text-xs text-slate-300 leading-relaxed">
                A client-side initialization issue was intercepted safely. Your saved notes and project configurations remain intact.
              </p>
              {this.state.error && (
                <div className="p-2.5 rounded-xl bg-black/60 border border-red-900/60 text-[11px] font-mono text-red-300 overflow-x-auto max-h-32">
                  {this.state.error.toString()}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Application</span>
              </button>

              <button
                onClick={this.handleResetStorage}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-mono text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
                title="Clears corrupted chat state cache and restarts"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                <span>Reset Chat Cache</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
