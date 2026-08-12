import { useEffect, useRef, type ReactNode } from 'react'

interface DialogProps {
  title: string
  description: ReactNode
  confirmLabel: string
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function Dialog({
  title,
  description,
  confirmLabel,
  destructive = false,
  onConfirm,
  onCancel,
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    confirmRef.current?.focus()
  }, [])

  const handleKeyDown = (event: React.KeyboardEvent) => {
    event.stopPropagation()
    if (event.key === 'Escape') {
      event.preventDefault()
      onCancel()
      return
    }
    if (event.key !== 'Tab') return
    const focusable = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled)') ?? [],
    )
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <div className="dialog-backdrop" onMouseDown={(event) => {
      if (event.currentTarget === event.target) onCancel()
    }}>
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmation-title"
        aria-describedby="confirmation-description"
        className="confirmation-dialog"
        onKeyDown={handleKeyDown}
      >
        <div className={destructive ? 'dialog-icon dialog-icon--danger' : 'dialog-icon'} aria-hidden="true">!</div>
        <h2 id="confirmation-title">{title}</h2>
        <div id="confirmation-description" className="dialog-description">{description}</div>
        <div className="dialog-actions">
          <button className="secondary-action" onClick={onCancel}>Cancel</button>
          <button
            ref={confirmRef}
            className={destructive ? 'danger-action' : 'primary-action'}
            onClick={onConfirm}
          >{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
