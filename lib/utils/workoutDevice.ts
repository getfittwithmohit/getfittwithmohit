// Small browser helpers for the workout screen: keep the screen awake and
// play a beep. Both fail quietly — a workout must never break because a
// phone doesn't support them.

type WakeLockSentinelLike = { release: () => Promise<void> }

export function keepScreenAwake(): () => void {
  let sentinel: WakeLockSentinelLike | null = null
  let stopped = false

  const request = async () => {
    try {
      const nav = navigator as Navigator & { wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinelLike> } }
      if (!nav.wakeLock || stopped) return
      sentinel = await nav.wakeLock.request('screen')
    } catch {
      // Not supported, or denied (e.g. low battery mode)
    }
  }

  // The lock is dropped whenever the page is hidden; take it again on return
  const onVisible = () => {
    if (document.visibilityState === 'visible') request()
  }

  request()
  document.addEventListener('visibilitychange', onVisible)
  return () => {
    stopped = true
    document.removeEventListener('visibilitychange', onVisible)
    sentinel?.release().catch(() => {})
  }
}

let audioContext: AudioContext | null = null

// Call from a tap (Start, Set done) so phones allow sound later on
export function unlockAudio() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return
    if (!audioContext) audioContext = new Ctx()
    if (audioContext.state === 'suspended') audioContext.resume().catch(() => {})
  } catch {
    // ignore
  }
}

export function beep(times = 1, frequency = 880) {
  try {
    if (!audioContext) return
    for (let i = 0; i < times; i++) {
      const start = audioContext.currentTime + i * 0.25
      const osc = audioContext.createOscillator()
      const gain = audioContext.createGain()
      osc.frequency.value = frequency
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(0.4, start + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.18)
      osc.connect(gain).connect(audioContext.destination)
      osc.start(start)
      osc.stop(start + 0.2)
    }
    // Android buzzes; iPhone browsers ignore this
    navigator.vibrate?.(times > 1 ? [150, 100, 150] : 150)
  } catch {
    // ignore
  }
}
