import { useEffect, useRef, useState } from 'react'

interface PlayerCountControlProps {
  playersRemaining: number
  startingPlayers: number
  onSetPlayers: (players: number) => void
  onAdjustPlayers: (delta: number) => void
}

export function PlayerCountControl({
  playersRemaining,
  startingPlayers,
  onSetPlayers,
  onAdjustPlayers,
}: PlayerCountControlProps) {
  const [draft, setDraft] = useState(String(playersRemaining))
  const [editing, setEditing] = useState(false)
  const cancelBlurRef = useRef(false)

  useEffect(() => {
    if (editing) return

    let active = true
    queueMicrotask(() => {
      if (active) setDraft(String(playersRemaining))
    })

    return () => { active = false }
  }, [editing, playersRemaining])

  return (
    <div className="player-stepper" aria-label="Players remaining controls">
      <button
        type="button"
        onClick={() => onAdjustPlayers(-1)}
        disabled={playersRemaining <= 1}
        aria-label="Eliminate player"
      >−</button>
      <div>
        <span>Players</span>
        <input
          type="number"
          min="1"
          max={startingPlayers}
          value={draft}
          onFocus={() => setEditing(true)}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => {
            if (cancelBlurRef.current) {
              cancelBlurRef.current = false
              setEditing(false)
              return
            }

            setEditing(false)
            onSetPlayers(Number(draft))
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.currentTarget.blur()
            }

            if (event.key === 'Escape') {
              cancelBlurRef.current = true
              setDraft(String(playersRemaining))
              event.currentTarget.blur()
            }
          }}
          aria-label="Players remaining"
        />
      </div>
      <button
        type="button"
        onClick={() => onAdjustPlayers(1)}
        disabled={playersRemaining >= startingPlayers}
        aria-label="Restore player"
      >+</button>
    </div>
  )
}
