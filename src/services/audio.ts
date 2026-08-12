import type { TournamentSettings } from '../domain/types'

export type AlertSound =
  | 'five-minute'
  | 'one-minute'
  | 'level-complete'
  | 'break-beginning'
  | 'break-ending'

interface AudioWindow extends Window {
  webkitAudioContext?: typeof AudioContext
}

const alertThresholds = [
  { milliseconds: 300_000, enabled: (settings: TournamentSettings) => settings.alertAtFiveMinutes },
  { milliseconds: 60_000, enabled: (settings: TournamentSettings) => settings.alertAtOneMinute },
]

export function thresholdsCrossed(
  previousMs: number,
  currentMs: number,
  alertedThresholds: number[],
  settings: TournamentSettings,
): number[] {
  return alertThresholds
    .filter(({ milliseconds, enabled }) =>
      enabled(settings) &&
      previousMs > milliseconds &&
      currentMs <= milliseconds &&
      !alertedThresholds.includes(milliseconds))
    .map(({ milliseconds }) => milliseconds)
}

const patterns: Record<AlertSound, number[]> = {
  'five-minute': [659],
  'one-minute': [784, 988],
  'level-complete': [523, 659, 784],
  'break-beginning': [523, 659],
  'break-ending': [784, 659, 784],
}

class AudioAlerts {
  private context: AudioContext | null = null

  unlock(): void {
    const AudioContextClass = window.AudioContext ?? (window as AudioWindow).webkitAudioContext
    if (!AudioContextClass) return
    this.context ??= new AudioContextClass()
    if (this.context.state === 'suspended') void this.context.resume()
  }

  play(sound: AlertSound): void {
    this.unlock()
    const context = this.context
    if (!context) return

    const startAt = context.currentTime + 0.02
    patterns[sound].forEach((frequency, index) => {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      const noteStart = startAt + index * 0.2
      oscillator.type = 'sine'
      oscillator.frequency.value = frequency
      gain.gain.setValueAtTime(0.0001, noteStart)
      gain.gain.exponentialRampToValueAtTime(0.16, noteStart + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.16)
      oscillator.connect(gain)
      gain.connect(context.destination)
      oscillator.start(noteStart)
      oscillator.stop(noteStart + 0.18)
    })
  }
}

export const audioAlerts = new AudioAlerts()
