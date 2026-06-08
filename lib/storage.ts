export interface Participant {
  id: string
  name: string
  createdAt: string
  supabaseId?: string
}

export interface StampRecord {
  locationId: string
  acquiredAt: string
  inputValue?: string
}

export interface ParticipantState {
  participant: Participant
  stamps: StampRecord[]
}

const STORAGE_KEY = 'stamptour_state'

export function getState(): ParticipantState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveParticipant(name: string, supabaseId?: string): Participant {
  const participant: Participant = {
    id: crypto.randomUUID(),
    name,
    createdAt: new Date().toISOString(),
    supabaseId,
  }
  const state: ParticipantState = { participant, stamps: [] }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  return participant
}

export function addStamp(locationId: string, inputValue?: string): StampRecord {
  const state = getState()
  if (!state) throw new Error('No participant')

  const existing = state.stamps.find((s) => s.locationId === locationId)
  if (existing) return existing

  const stamp: StampRecord = {
    locationId,
    acquiredAt: new Date().toISOString(),
    inputValue,
  }
  state.stamps.push(stamp)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  return stamp
}

export function hasStamp(locationId: string): boolean {
  const state = getState()
  return state?.stamps.some((s) => s.locationId === locationId) ?? false
}

export function getStamps(): StampRecord[] {
  return getState()?.stamps ?? []
}

export function isCompleted(): boolean {
  return getStamps().length >= 7
}

export function clearState(): void {
  localStorage.removeItem(STORAGE_KEY)
}
