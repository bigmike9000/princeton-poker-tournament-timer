import { Component, type ErrorInfo, type ReactNode } from 'react'
import { SNAPSHOT_KEY } from '../persistence/snapshot'

interface ErrorBoundaryProps {
  children: ReactNode
  reload?: () => void
  confirmReset?: (message: string) => boolean
}

interface ErrorBoundaryState {
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Tournament display error', error, info.componentStack)
  }

  private reload = () => {
    if (this.props.reload) this.props.reload()
    else window.location.reload()
  }

  private startSafe = () => {
    const confirmReset = this.props.confirmReset ?? window.confirm
    const confirmed = confirmReset(
      'Discard the saved tournament progress on this device and start with safe defaults? Saved structure presets will be kept.',
    )
    if (!confirmed) return
    localStorage.removeItem(SNAPSHOT_KEY)
    this.reload()
  }

  render() {
    if (this.state.error === null) return this.props.children

    return (
      <main className="recovery-screen">
        <div className="recovery-panel">
          <span className="recovery-mark" aria-hidden="true">!</span>
          <p className="section-kicker">Tournament recovery</p>
          <h1>The display encountered an error</h1>
          <p>Your last saved tournament remains in this browser. Reload first; use safe defaults only if the error returns.</p>
          <div className="recovery-actions">
            <button className="primary-action" onClick={this.reload}>Reload application</button>
            <button className="danger-action" onClick={this.startSafe}>Start with safe defaults</button>
          </div>
        </div>
      </main>
    )
  }
}
