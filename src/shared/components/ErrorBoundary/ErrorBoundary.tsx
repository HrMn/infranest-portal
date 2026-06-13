import React from 'react'
import { Button } from '@/components/ui/button'

interface Props  { children: React.ReactNode }
interface State  { hasError: boolean; error: Error | null }

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  handleReset = () => this.setState({ hasError: false, error: null })

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-4xl mb-4">⚠️</p>
          <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">{this.state.error?.message}</p>
          <Button onClick={this.handleReset}>Try Again</Button>
        </div>
      )
    }
    return this.props.children
  }
}
