interface ClockProps {
  remainingMs: number
  untimed: boolean
}

function formatClock(remainingMs: number): string {
  const seconds = Math.ceil(Math.max(0, remainingMs) / 1_000)
  const minutes = Math.floor(seconds / 60)
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

export function Clock({ remainingMs, untimed }: ClockProps) {
  const urgent = !untimed && remainingMs > 0 && remainingMs <= 60_000
  const className = untimed
    ? 'clock clock--untimed'
    : urgent ? 'clock clock--urgent' : 'clock'

  return (
    <div role="timer" aria-live="off" className={className}>
      {untimed ? 'UNTIL END' : formatClock(remainingMs)}
    </div>
  )
}
