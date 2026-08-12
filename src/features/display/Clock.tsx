interface ClockProps {
  remainingMs: number
}

export function formatClock(remainingMs: number): string {
  const seconds = Math.ceil(Math.max(0, remainingMs) / 1_000)
  const minutes = Math.floor(seconds / 60)
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

export function Clock({ remainingMs }: ClockProps) {
  const urgent = remainingMs > 0 && remainingMs <= 60_000

  return (
    <div role="timer" aria-live="off" className={urgent ? 'clock clock--urgent' : 'clock'}>
      {formatClock(remainingMs)}
    </div>
  )
}
