import { Component, type ErrorInfo, type ReactNode } from 'react'
import ErrorState from './ErrorState'

type AppErrorBoundaryProps = {
  children: ReactNode
}

type AppErrorBoundaryState = {
  hasError: boolean
  errorMessage: string
  retryKey: number
}

export default class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false,
    errorMessage: 'An unexpected error occurred while rendering this view.',
    retryKey: 0,
  }

  static getDerivedStateFromError(error: Error): Pick<AppErrorBoundaryState, 'hasError' | 'errorMessage'> {
    return {
      hasError: true,
      errorMessage: error.message || 'An unexpected error occurred while rendering this view.',
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AppErrorBoundary caught an error:', error, errorInfo)
  }

  private handleRetry = () => {
    this.setState((currentState) => ({
      hasError: false,
      errorMessage: 'An unexpected error occurred while rendering this view.',
      retryKey: currentState.retryKey + 1,
    }))
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center p-4 sm:p-6 lg:p-8">
          <ErrorState
            title="App crashed while rendering"
            message={this.state.errorMessage}
            actionLabel="Try again"
            onAction={this.handleRetry}
          />
        </main>
      )
    }

    return <div key={this.state.retryKey}>{this.props.children}</div>
  }
}
