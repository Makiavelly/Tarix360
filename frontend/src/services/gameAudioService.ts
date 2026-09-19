import type { EventType } from '../domain/game'

const themes: Record<EventType, string> = {
  history: '/audio/suspended-atmosphere.mp3',
  legend: '/audio/kurai-forest-whispers.mp3',
  culture: '/audio/tynychlyk-zhyry.mp3',
}
const musicVolume = 0.28

export class GameAudioService {
  private readonly music = new Audio()
  private active = false
  private muted = false
  private volume = 0.7
  private currentTheme?: EventType
  private musicFrame = 0
  private context?: AudioContext
  private chimeGain?: GainNode

  constructor() {
    this.music.loop = true
    this.music.preload = 'auto'
    document.addEventListener('pointerdown', this.resumeAfterInteraction, { capture: true })
    document.addEventListener('keydown', this.resumeAfterInteraction, { capture: true })
  }

  activate() {
    this.active = true
    this.context ??= new AudioContext()
    this.chimeGain ??= this.context.createGain()
    this.chimeGain.connect(this.context.destination)
    this.chimeGain.gain.value = this.muted ? 0 : this.volume
    void this.context.resume().catch(() => undefined)
    if (!this.currentTheme) this.setTheme('history')
    else this.playMusic()
  }

  setTheme(type: EventType) {
    if (this.currentTheme === type) { this.playMusic(); return }
    this.currentTheme = type
    this.music.pause()
    this.music.src = themes[type]
    this.music.currentTime = 0
    this.music.volume = 0
    this.music.load()
    this.playMusic()
    this.syncMusicVolume(900)
  }

  playRevealEffect() {
    if (!this.active || this.muted || this.volume === 0) return
    this.playRevealChime()
  }

  playTimeUp() {
    if (!this.active || this.muted || this.volume === 0 || !this.context || !this.chimeGain) return
    const start = this.context.currentTime
    for (const [index, frequency] of [659.25, 523.25, 392].entries()) {
      const tone = this.context.createOscillator()
      const gain = this.context.createGain()
      tone.type = 'sine'
      tone.frequency.value = frequency
      const at = start + index * 0.22
      gain.gain.setValueAtTime(0, at)
      gain.gain.linearRampToValueAtTime(.22, at + .025)
      gain.gain.exponentialRampToValueAtTime(.001, at + .55)
      tone.connect(gain)
      gain.connect(this.chimeGain)
      tone.start(at)
      tone.stop(at + .6)
      tone.onended = () => { tone.disconnect(); gain.disconnect() }
    }
  }

  playTimeWarning(seconds: number) {
    if (!this.active || this.muted || this.volume === 0 || !this.context || !this.chimeGain) return
    const tone = this.context.createOscillator()
    const gain = this.context.createGain()
    const now = this.context.currentTime
    tone.type = 'sine'
    tone.frequency.value = seconds <= 3 ? 880 : 660
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(seconds <= 3 ? .16 : .1, now + .012)
    gain.gain.exponentialRampToValueAtTime(.001, now + .13)
    tone.connect(gain)
    gain.connect(this.chimeGain)
    tone.start(now)
    tone.stop(now + .14)
    tone.onended = () => { tone.disconnect(); gain.disconnect() }
  }

  playHintUsed() {
    if (!this.active || this.muted || this.volume === 0 || !this.context || !this.chimeGain) return
    const start = this.context.currentTime
    for (const [index, frequency] of [587.33, 440].entries()) {
      const tone = this.context.createOscillator()
      const gain = this.context.createGain()
      const at = start + index * .09
      tone.type = 'triangle'
      tone.frequency.value = frequency
      gain.gain.setValueAtTime(0, at)
      gain.gain.linearRampToValueAtTime(.1, at + .012)
      gain.gain.exponentialRampToValueAtTime(.001, at + .22)
      tone.connect(gain)
      gain.connect(this.chimeGain)
      tone.start(at)
      tone.stop(at + .24)
      tone.onended = () => { tone.disconnect(); gain.disconnect() }
    }
  }

  setVolume(volume: number) {
    this.volume = Math.min(1, Math.max(0, volume))
    if (this.chimeGain && this.context) this.chimeGain.gain.setTargetAtTime(this.muted ? 0 : this.volume, this.context.currentTime, .04)
    this.syncMusicVolume(180)
  }

  setMuted(muted: boolean) {
    this.muted = muted
    this.music.muted = muted
    if (this.chimeGain && this.context) this.chimeGain.gain.setTargetAtTime(muted ? 0 : this.volume, this.context.currentTime, .04)
    if (!muted) this.playMusic()
  }

  stop() {
    this.active = false
    cancelAnimationFrame(this.musicFrame)
    this.music.pause()
    this.music.currentTime = 0
    this.currentTheme = undefined
    if (this.chimeGain && this.context) this.chimeGain.gain.setTargetAtTime(0, this.context.currentTime, .04)
  }

  destroy() {
    this.stop()
    void this.context?.close()
    document.removeEventListener('pointerdown', this.resumeAfterInteraction, { capture: true })
    document.removeEventListener('keydown', this.resumeAfterInteraction, { capture: true })
  }

  private readonly resumeAfterInteraction = () => {
    if (this.active && this.context?.state === 'suspended') void this.context.resume().catch(() => undefined)
    this.playMusic()
  }
  private playRevealChime() {
    if (!this.context || !this.chimeGain) return
    void this.context.resume().catch(() => undefined)
    const start = this.context.currentTime + .015
    for (const [index, frequency] of [523.25, 659.25, 783.99].entries()) {
      const tone = this.context.createOscillator()
      const gain = this.context.createGain()
      const at = start + index * .075
      tone.type = 'sine'
      tone.frequency.value = frequency
      gain.gain.setValueAtTime(.001, at)
      gain.gain.exponentialRampToValueAtTime(.11, at + .018)
      gain.gain.exponentialRampToValueAtTime(.001, at + .32)
      tone.connect(gain)
      gain.connect(this.chimeGain)
      tone.start(at)
      tone.stop(at + .34)
      tone.onended = () => { tone.disconnect(); gain.disconnect() }
    }
  }
  private playMusic() {
    if (!this.active || this.muted || !this.music.src) return
    void this.music.play().catch(() => undefined)
  }
  private syncMusicVolume(duration = 700) {
    cancelAnimationFrame(this.musicFrame)
    const from = this.music.volume
    const to = musicVolume * this.volume
    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      const ease = progress * progress * (3 - 2 * progress)
      this.music.volume = from + (to - from) * ease
      if (progress < 1) this.musicFrame = requestAnimationFrame(tick)
    }
    this.musicFrame = requestAnimationFrame(tick)
  }
}
