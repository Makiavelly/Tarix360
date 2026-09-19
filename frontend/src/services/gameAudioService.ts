import type { EventType } from '../domain/game'

const themes: Record<EventType, string> = {
  history: '/audio/suspended-atmosphere.mp3',
  legend: '/audio/kurai-forest-whispers.mp3',
  culture: '/audio/tynychlyk-zhyry.mp3',
}

const musicVolume = 0.28
const duckedMusicVolume = 0.08
const effectVolume = 0.72

export class GameAudioService {
  private readonly music = new Audio()
  private readonly revealEffect = new Audio('/audio/after-guess.mp3')
  private active = false
  private muted = false
  private revealPlaying = false
  private currentTheme?: EventType

  constructor() {
    this.music.loop = true
    this.music.preload = 'auto'
    this.revealEffect.preload = 'auto'
    this.revealEffect.volume = effectVolume
    this.revealEffect.addEventListener('ended', this.onRevealEnded)
    document.addEventListener('pointerdown', this.resumeAfterInteraction, { capture: true })
    document.addEventListener('keydown', this.resumeAfterInteraction, { capture: true })
  }

  activate() {
    this.active = true
    if (!this.currentTheme) this.setTheme('history')
    else this.playMusic()
  }

  setTheme(type: EventType) {
    if (this.currentTheme === type) {
      this.playMusic()
      return
    }

    this.currentTheme = type
    this.music.pause()
    this.music.src = themes[type]
    this.music.currentTime = 0
    this.syncMusicVolume()
    this.music.load()
    this.playMusic()
  }

  playRevealEffect() {
    if (!this.active || this.muted) return

    this.revealEffect.pause()
    this.revealEffect.currentTime = 0
    this.revealPlaying = true
    this.syncMusicVolume()
    void this.revealEffect.play().catch(() => {
      this.revealPlaying = false
      this.syncMusicVolume()
    })
  }

  setMuted(muted: boolean) {
    this.muted = muted
    this.music.muted = muted
    this.revealEffect.muted = muted
    if (!muted) this.playMusic()
  }

  stop() {
    this.active = false
    this.revealPlaying = false
    this.music.pause()
    this.revealEffect.pause()
    this.music.currentTime = 0
    this.revealEffect.currentTime = 0
    this.currentTheme = undefined
    this.syncMusicVolume()
  }

  destroy() {
    this.stop()
    this.revealEffect.removeEventListener('ended', this.onRevealEnded)
    document.removeEventListener('pointerdown', this.resumeAfterInteraction, { capture: true })
    document.removeEventListener('keydown', this.resumeAfterInteraction, { capture: true })
  }

  private readonly onRevealEnded = () => {
    this.revealPlaying = false
    this.syncMusicVolume()
  }

  private readonly resumeAfterInteraction = () => {
    this.playMusic()
  }

  private playMusic() {
    if (!this.active || this.muted || !this.music.src) return
    void this.music.play().catch(() => undefined)
  }

  private syncMusicVolume() {
    this.music.volume = this.revealPlaying ? duckedMusicVolume : musicVolume
  }
}
