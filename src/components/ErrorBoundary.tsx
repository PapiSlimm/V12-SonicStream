import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null }, () => {
      if (typeof window !== 'undefined') {
        const reMount = (window as any).__reMountReactApp;
        if (typeof reMount === 'function') {
          try {
            reMount();
            return;
          } catch (e) {
            console.error("Failsafe: error calling __reMountReactApp, reloading", e);
          }
        }
        window.location.reload();
      }
    });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-12 bg-zinc-900/50 border border-red-500/20 rounded-[32px] text-center space-y-6">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
            <AlertCircle size={40} />
          </div>
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-white tracking-tighter">Something went wrong</h2>
            <p className="text-zinc-500 max-w-sm mx-auto text-xs leading-relaxed">
              {this.state.error?.message || 'An unexpected error occurred in this component.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="flex items-center gap-2 bg-zinc-800 text-white hover:bg-zinc-750 px-5 py-2.5 rounded-xl font-bold transition-all text-xs border border-white/5"
            >
              Reset State
            </button>
            <button
              onClick={this.handleRetry}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-6 py-2.5 rounded-xl font-black hover:scale-[1.02] active:scale-[0.98] transition-all text-xs shadow-lg shadow-black/10"
            >
              <RefreshCw size={14} className="animate-spin" />
              Re-mount React Root
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
