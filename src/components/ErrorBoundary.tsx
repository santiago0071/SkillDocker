import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { logFrontendError } from '../core/diagnosticsBridge.ts';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('SkillDocker UI Uncaught Exception:', error, errorInfo);
    logFrontendError(error.message, errorInfo.componentStack || undefined);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-6 bg-gray-900/90 text-gray-200 rounded-xl border border-red-500/30 m-4">
          <div className="p-3 bg-red-500/10 rounded-full border border-red-500/20 text-red-400 mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-red-200 mb-2">
            {this.props.fallbackTitle || '界面渲染发生异常'}
          </h3>
          <p className="text-xs text-gray-400 max-w-md text-center mb-4 font-mono break-all">
            {this.state.error?.message || '未知前端渲染错误'}
          </p>
          <button
            onClick={this.handleReset}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-xs text-gray-200 font-medium rounded-lg border border-gray-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>重新加载应用</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
