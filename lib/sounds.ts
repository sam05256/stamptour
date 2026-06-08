// 8비트 사운드 유틸리티 (kenney.nl Interface Sounds CC0)

type SoundName = 'click' | 'stamp' | 'error' | 'complete' | 'select' | 'transition'

const SOUND_MAP: Record<SoundName, string> = {
  click:      '/sounds/click_001.ogg',
  stamp:      '/sounds/confirmation_001.ogg',
  error:      '/sounds/error_001.ogg',
  complete:   '/sounds/bong_001.ogg',
  select:     '/sounds/drop_001.ogg',
  transition: '/sounds/glitch_001.ogg',
}

// 미리 로드된 Audio 객체 캐시
const cache: Partial<Record<SoundName, HTMLAudioElement>> = {}

function getAudio(name: SoundName): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null
  if (!cache[name]) {
    const audio = new Audio(SOUND_MAP[name])
    audio.volume = 0.4
    cache[name] = audio
  }
  return cache[name]!
}

export function playSound(name: SoundName) {
  try {
    const audio = getAudio(name)
    if (!audio) return
    // 재생 중이면 처음부터 다시
    audio.currentTime = 0
    audio.play().catch(() => {}) // 자동재생 정책 무시
  } catch {}
}

// 사운드 미리 로드 (앱 시작 시 호출)
export function preloadSounds() {
  if (typeof window === 'undefined') return
  Object.keys(SOUND_MAP).forEach(name => getAudio(name as SoundName))
}
