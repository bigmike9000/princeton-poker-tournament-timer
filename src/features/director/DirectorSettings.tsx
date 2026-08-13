import { useTournament } from '../../app/useTournament'
import type { TournamentSettings as Settings } from '../../domain/types'
import { audioAlerts } from '../../services/audio'

const alertOptions: { key: keyof Settings; label: string }[] = [
  { key: 'alertAtFiveMinutes', label: 'Five minutes remaining' },
  { key: 'alertAtOneMinute', label: 'One minute remaining' },
  { key: 'alertLevelComplete', label: 'Level complete' },
  { key: 'alertBreakBeginning', label: 'Break beginning' },
  { key: 'alertBreakEnding', label: 'Break ending' },
]

export function DirectorSettings() {
  const { state, dispatch } = useTournament()
  const settings = state.settings
  const update = (changes: Partial<Settings>) => {
    dispatch({ type: 'SET_SETTINGS', settings: { ...settings, ...changes } })
  }

  return (
    <section className="director-section">
      <div className="section-intro">
        <div><span className="section-kicker">Application</span><h2>Settings</h2></div>
      </div>

      <div className="settings-grid">
        <article className="director-card settings-card">
          <div className="director-card-heading"><div><span>Clock behavior</span><h3>Advancement & recovery</h3></div></div>
          <label className="setting-toggle">
            <input aria-label="Automatically advance levels" type="checkbox" checked={settings.autoAdvance} onChange={(event) => update({ autoAdvance: event.target.checked })} />
            <span><strong>Automatically advance levels</strong><small>Move to the next level or break when the clock reaches zero.</small></span>
          </label>
          <fieldset className="setting-fieldset">
            <legend>When the app closes</legend>
            <label><input aria-label="Pause tournament when app closes" type="radio" name="close-behavior" checked={settings.closeBehavior === 'pause'} onChange={() => update({ closeBehavior: 'pause' })} /><span><strong>Pause tournament when app closes</strong><small>Safest for a shared tournament computer.</small></span></label>
            <label><input aria-label="Keep tournament clock running" type="radio" name="close-behavior" checked={settings.closeBehavior === 'continue'} onChange={() => update({ closeBehavior: 'continue' })} /><span><strong>Keep tournament clock running</strong><small>Catch up using elapsed wall-clock time when the app returns.</small></span></label>
          </fieldset>
        </article>

        <article className="director-card settings-card">
          <div className="director-card-heading"><div><span>Audio</span><h3>Local chime alerts</h3></div></div>
          <label className="setting-toggle setting-toggle--featured">
            <input type="checkbox" checked={!settings.muted} onChange={(event) => { audioAlerts.unlock(); update({ muted: !event.target.checked }) }} />
            <span><strong>Sound alerts enabled</strong><small>Short chimes play only on this device.</small></span>
          </label>
          <div className="alert-options">
            {alertOptions.map((option) => (
              <label className="setting-toggle" key={option.key}>
                <input type="checkbox" checked={Boolean(settings[option.key])} onChange={(event) => update({ [option.key]: event.target.checked })} />
                <span><strong>{option.label}</strong></span>
              </label>
            ))}
          </div>
        </article>
      </div>

      <article className="director-card shortcut-card">
        <div className="director-card-heading"><div><span>Keyboard</span><h3>Room controls at a glance</h3></div></div>
        <dl className="shortcut-grid">
          <div><dt><kbd>Spacebar</kbd></dt><dd>Toggle tournament clock</dd></div>
          <div><dt><kbd>←</kbd> <kbd>→</kbd></dt><dd>Previous / Next</dd></div>
          <div><dt><kbd>M</kbd></dt><dd>Mute / Unmute</dd></div>
          <div><dt><kbd>F</kbd></dt><dd>Fullscreen</dd></div>
        </dl>
      </article>
    </section>
  )
}
