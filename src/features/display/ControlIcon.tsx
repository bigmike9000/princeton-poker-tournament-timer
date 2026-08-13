export type ControlIconName =
  | 'info'
  | 'fullscreen-enter'
  | 'fullscreen-exit'
  | 'sound-on'
  | 'sound-off'
  | 'settings'

interface ControlIconProps {
  name: ControlIconName
}

export function ControlIcon({ name }: ControlIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={`control-icon control-icon--${name}`}
      focusable="false"
      viewBox="0 0 24 24"
    >
      {name === 'info' && (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 10.75v6" />
          <path d="M12 7.25h.01" />
        </>
      )}

      {name === 'fullscreen-enter' && (
        <>
          <path d="M8.5 3.5h-5v5" />
          <path d="M15.5 3.5h5v5" />
          <path d="M20.5 15.5v5h-5" />
          <path d="M8.5 20.5h-5v-5" />
        </>
      )}

      {name === 'fullscreen-exit' && (
        <>
          <path d="M3.5 8.5h5v-5" />
          <path d="M20.5 8.5h-5v-5" />
          <path d="M15.5 20.5v-5h5" />
          <path d="M8.5 20.5v-5h-5" />
        </>
      )}

      {(name === 'sound-on' || name === 'sound-off') && (
        <>
          <path d="M4 10v4h3l4 3.5v-11L7 10H4Z" />
          {name === 'sound-on' ? (
            <>
              <path d="M15 9a4 4 0 0 1 0 6" />
              <path d="M17.75 6.5a7.5 7.5 0 0 1 0 11" />
            </>
          ) : (
            <>
              <path d="m16 9 5 5" />
              <path d="m21 9-5 5" />
            </>
          )}
        </>
      )}

      {name === 'settings' && (
        <>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06-2.83 2.83-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21h-4v-.09a1.65 1.65 0 0 0-1.08-1.5 1.65 1.65 0 0 0-1.82.33l-.06.06-2.83-2.83.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3v-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06 2.83-2.83.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3h4v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06 2.83 2.83-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21v4h-.09A1.65 1.65 0 0 0 19.4 15Z" />
        </>
      )}
    </svg>
  )
}
