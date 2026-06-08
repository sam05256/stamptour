import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dlrsrcfkyuolfnzxwfqa.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseAnonKey) {
  console.warn('⚠️ Supabase API Key not loaded! Check .env.local')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 참여자 관련
export async function createParticipant(name: string) {
  const { data, error } = await supabase
    .from('participants')
    .insert([{ name }])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getParticipant(id: string) {
  const { data, error } = await supabase
    .from('participants')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function getAllParticipants() {
  const { data, error } = await supabase
    .from('participants')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// 스탬프 관련
export async function addStamp(participantId: string, locationId: string) {
  const { data, error } = await supabase
    .from('stamps')
    .insert([{ participant_id: participantId, location_id: locationId }])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getParticipantStamps(participantId: string) {
  const { data, error } = await supabase
    .from('stamps')
    .select('location_id')
    .eq('participant_id', participantId)

  if (error) throw error
  return data?.map(s => s.location_id) || []
}

export async function completeParticipant(participantId: string) {
  const { data, error } = await supabase
    .from('participants')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', participantId)
    .select()
    .single()

  if (error) throw error
  return data
}

// 미션 입력값 관련
export async function saveMissionInput(participantId: string, locationId: string, inputValue: string) {
  const { data, error } = await supabase
    .from('mission_inputs')
    .insert([{ participant_id: participantId, location_id: locationId, input_value: inputValue }])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getMissionInputs(participantId: string) {
  const { data, error } = await supabase
    .from('mission_inputs')
    .select('*')
    .eq('participant_id', participantId)

  if (error) throw error
  return data || []
}
