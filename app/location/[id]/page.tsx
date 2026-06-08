'use client'

import { use, useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { getLocationById } from '@/lib/data'
import { getState, hasStamp, addStamp } from '@/lib/storage'
import { playSound } from '@/lib/sounds'
import { supabase } from '@/lib/supabase'

type Step = 'intro' | 'mission' | 'stamp'

export default function LocationPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={null}>
      <LocationPageInner params={params} />
    </Suspense>
  )
}

function LocationPageInner({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const isHintMode = searchParams.get('hint') === 'true'
  const isViewMode = searchParams.get('view') === 'true'
  const startAtMission = searchParams.get('step') === 'mission'
  const backToMission = searchParams.get('back') === 'mission'

  const [step, setStep] = useState<Step>('intro')
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [isWrong, setIsWrong] = useState(false)
  const [alreadyHave, setAlreadyHave] = useState(false)

  const location = getLocationById(id)

  useEffect(() => {
    const state = getState()
    if (!state) { router.replace('/'); return }
    if (!location) { router.replace('/main'); return }
    if (isViewMode) { setStep('intro'); return }
    if (isHintMode) { setStep('intro'); return }
    if (hasStamp(id) && !isHintMode) {
      setAlreadyHave(true)
      setStep('stamp')
      return
    }
    if (startAtMission) { setStep('mission'); return }
  }, [id, location, router, isHintMode, isViewMode, startAtMission, backToMission])

  if (!location) return null

  const handleMissionSubmit = async () => {
    const m = location.mission
    if (m.type === 'quiz') {
      if (selectedOption === null) return
      if (selectedOption !== m.answer) {
        playSound('error')
        setIsWrong(true)
        setTimeout(() => setIsWrong(false), 800)
        return
      }
    }
    if (m.type === 'input' && !inputValue.trim()) return

    const state = getState()
    if (state?.participant.supabaseId) {
      try {
        await supabase.from('stamps').insert({
          participant_id: state.participant.supabaseId,
          location_id: id,
        })
        if (m.type === 'input') {
          await supabase.from('mission_inputs').insert({
            participant_id: state.participant.supabaseId,
            location_id: id,
            input_value: inputValue.trim(),
          })
        }
      } catch (error) {
        console.error('Failed to save to Supabase:', error)
      }
    }

    addStamp(id, m.type === 'input' ? inputValue.trim() : undefined)
    playSound('stamp')
    setStep('stamp')
  }

  const renderDescription = () => {
    const desc = location.description
    const hint = location.hintText

    if (!hint || !isHintMode) {
      return <p className="text-gray-300 text-sm leading-relaxed">{desc}</p>
    }

    const idx = desc.indexOf(hint)
    if (idx === -1) {
      return <p className="text-gray-300 text-sm leading-relaxed">{desc}</p>
    }

    const before = desc.slice(0, idx)
    const after = desc.slice(idx + hint.length)

    return (
      <p className="text-gray-300 text-sm leading-relaxed">
        {before}
        <motion.span
          className="font-black px-0.5"
          style={{ color: '#f7c52b' }}
          animate={{ backgroundColor: ['#7a6000aa', '#3d300055', '#7a6000aa'] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        >
          {hint}
        </motion.span>
        {after}
      </p>
    )
  }

  return (
    <div
      className="min-h-screen overflow-y-auto"
      style={{ background: 'linear-gradient(180deg, #1a1a2e 0%, #2d2d3e 100%)' }}
    >
      {/* ── 헤더 ── */}
      <div
        className="flex items-center px-3 pt-3 pb-2 sticky top-0 z-10"
        style={{
          background: '#3c3c3c',
          borderBottom: '3px solid #000',
          boxShadow: 'inset -2px -2px 0 #1a1a1a, inset 2px 2px 0 #5c5c5c',
        }}
      >
        <motion.button
          onClick={() => {
            if (isHintMode) {
              // 힌트에서 돌아올 때: 미션 스텝으로 복귀
              router.push(`/location/${id}?step=mission`)
            } else {
              router.push('/main')
            }
          }}
          className="mc-btn py-2 px-3"
          style={{ fontSize: '10px' }}
          whileTap={{ scale: 0.9 }}
        >
          ←
        </motion.button>
        <div className="ml-3">
          <p className="pixel text-gray-400" style={{ fontSize: '11px' }}>{location.floor}</p>
          <p className="pixel text-white mt-0.5" style={{ fontSize: '14px', textShadow: '1px 1px #000' }}>
            {location.name}
          </p>
        </div>
        {isHintMode && (
          <motion.div
            className="ml-auto px-3 py-1"
            style={{
              background: '#8a6a00',
              border: '2px solid #000',
              boxShadow: 'inset -2px -2px 0 #4a3a00, inset 2px 2px 0 #c4a000',
            }}
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <p className="pixel text-yellow-300" style={{ fontSize: '12px', textShadow: '1px 1px #4a3a00' }}>
              💡 힌트 모드
            </p>
          </motion.div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* ── 장소 소개 ── */}
        {step === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            className="px-4 py-5"
          >
            {/* 블록 아이콘 */}
            <motion.div
              className="flex justify-center mb-5"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div
                className="w-24 h-24 flex items-center justify-center relative"
                style={{
                  background: location.color,
                  border: '4px solid #000',
                  boxShadow: `inset -6px -6px 0 ${location.color}55, inset 6px 6px 0 ${location.color}cc`,
                }}
              >
                <span style={{ fontSize: 40, lineHeight: 1 }}>{location.emoji}</span>
                <div className="absolute top-1 left-1 w-3 h-3" style={{ background: 'rgba(255,255,255,0.3)' }} />
              </div>
            </motion.div>

            <div className="text-center mb-5">
              <p className="pixel text-white" style={{ fontSize: '11px', textShadow: '2px 2px #000' }}>
                {location.name}
              </p>
              <span
                className="inline-block mt-1 px-3 py-0.5 pixel text-gray-400"
                style={{ fontSize: '13px', background: '#333', border: '2px solid #555' }}
              >
                {location.floor}
              </span>
            </div>

            {/* 설명 패널 */}
            <div
              className="mb-5 p-4"
              style={{
                background: '#2a2a3a',
                border: '3px solid #000',
                boxShadow: 'inset -3px -3px 0 #111, inset 3px 3px 0 #3c3c5c',
              }}
            >
              {isHintMode && (
                <motion.div
                  className="flex items-center gap-2 mb-3 px-3 py-2"
                  style={{
                    background: '#3d3000',
                    border: '2px solid #6a5000',
                    boxShadow: 'inset -2px -2px 0 #1a1500, inset 2px 2px 0 #7a6000',
                  }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <p className="pixel text-yellow-400" style={{ fontSize: '13px', textShadow: '1px 1px #4a3a00', lineHeight: '1.8' }}>
                    💡 정답 힌트가 강조 표시됩니다!
                  </p>
                </motion.div>
              )}
              <p className="pixel text-yellow-400 mb-2" style={{ fontSize: '14px', textShadow: '1px 1px #7a6000' }}>
                📖 장소 설명
              </p>
              {renderDescription()}
            </div>

            {isViewMode ? (
              <button
                onClick={() => router.push('/main')}
                className="w-full mc-btn"
              >
                ← 지도로 돌아가기
              </button>
            ) : isHintMode ? (
              <button
                onClick={() => router.push(`/location/${id}?step=mission`)}
                className="w-full mc-btn mc-btn-green"
              >
                ← 미션으로 돌아가기 🎯
              </button>
            ) : (
              <motion.button
                onClick={() => setStep('mission')}
                className="w-full mc-btn mc-btn-green"
                style={{ fontSize: '12px', padding: '16px' }}
                whileTap={{ scale: 0.95 }}
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                ⚔️ 미션 도전하기!
              </motion.button>
            )}
          </motion.div>
        )}

        {/* ── 미션 ── */}
        {step === 'mission' && (
          <motion.div
            key="mission"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            className="px-4 py-5"
          >
            <motion.div
              className="text-center mb-5"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <p className="text-4xl mb-2">⚔️</p>
              <p className="pixel text-white" style={{ fontSize: '12px', textShadow: '2px 2px #000' }}>미션!</p>
            </motion.div>

            <motion.div
              className="mb-4 p-4"
              style={{
                background: '#2a2a3a',
                border: '3px solid #000',
                boxShadow: 'inset -3px -3px 0 #111, inset 3px 3px 0 #3c3c5c',
              }}
              animate={isWrong ? { x: [-6, 6, -6, 6, 0] } : {}}
              transition={{ duration: 0.4 }}
            >
              {/* 퀴즈 */}
              {location.mission.type === 'quiz' && (
                <>
                  <p className="font-bold text-white text-sm mb-4 leading-relaxed">
                    ❓ {location.mission.question}
                  </p>
                  <div className="space-y-2">
                    {location.mission.options.map((opt, i) => (
                      <motion.button
                        key={i}
                        onClick={() => { playSound('select'); setSelectedOption(i) }}
                        className="w-full text-left"
                        style={{
                          padding: '10px 14px',
                          background: selectedOption === i ? '#2a5a3a' : '#3c3c3c',
                          border: `3px solid ${selectedOption === i ? '#3a9a52' : '#000'}`,
                          boxShadow: selectedOption === i
                            ? 'inset -2px -2px 0 #0d3320, inset 2px 2px 0 #5ab870'
                            : 'inset -2px -2px 0 #1a1a1a, inset 2px 2px 0 #5c5c5c',
                        }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <span
                          className="pixel mr-2"
                          style={{
                            fontSize: '14px',
                            color: selectedOption === i ? '#7ec832' : '#888',
                            textShadow: selectedOption === i ? '1px 1px #1a3a0a' : 'none',
                          }}
                        >
                          {['①', '②', '③', '④'][i]}
                        </span>
                        <span
                          className="text-sm font-bold"
                          style={{ color: selectedOption === i ? '#fff' : '#ccc' }}
                        >
                          {opt}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                  {isWrong && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="pixel text-red-400 text-center mt-3"
                      style={{ fontSize: '14px', textShadow: '1px 1px #5a0000', lineHeight: '1.8' }}
                    >
                      😅 오답! 다시 골라봐요
                    </motion.p>
                  )}
                </>
              )}

              {/* 액션 */}
              {location.mission.type === 'action' && (
                <div className="text-center py-4">
                  <p className="text-4xl mb-4">💛</p>
                  <p className="font-bold text-gray-200 text-sm leading-relaxed whitespace-pre-line">
                    {location.mission.description}
                  </p>
                </div>
              )}

              {/* 입력 */}
              {location.mission.type === 'input' && (
                <>
                  <p className="font-bold text-gray-200 text-sm mb-4 leading-relaxed whitespace-pre-line">
                    {location.mission.description}
                  </p>
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={location.mission.placeholder}
                    maxLength={100}
                    rows={3}
                    className="w-full mc-input px-4 py-3 resize-none"
                    style={{ fontSize: '13px' }}
                  />
                  <p
                    className="pixel text-right text-gray-600 mt-1"
                    style={{ fontSize: '12px' }}
                  >
                    {inputValue.length}/100
                  </p>
                </>
              )}
            </motion.div>

            {/* 힌트 버튼 (퀴즈 전용) */}
            {location.mission.type === 'quiz' && location.hintText && (
              <motion.button
                onClick={() => { playSound('click'); router.push(`/location/${id}?hint=true&back=mission`) }}
                className="w-full mc-btn mb-3"
                style={{ fontSize: '10px' }}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                💡 힌트 보기
              </motion.button>
            )}

            <motion.button
              onClick={handleMissionSubmit}
              disabled={
                (location.mission.type === 'quiz' && selectedOption === null) ||
                (location.mission.type === 'input' && !inputValue.trim())
              }
              className={`w-full mc-btn ${
                (location.mission.type === 'quiz' && selectedOption === null) ||
                (location.mission.type === 'input' && !inputValue.trim())
                  ? 'mc-btn-disabled'
                  : 'mc-btn-green'
              }`}
              style={{ fontSize: '12px', padding: '16px' }}
              whileTap={{ scale: 0.95 }}
            >
              {location.mission.type === 'action'
                ? `✅ ${location.mission.buttonText}`
                : location.mission.type === 'input'
                ? `📝 ${location.mission.buttonText}`
                : '✅ 정답 제출!'}
            </motion.button>
          </motion.div>
        )}

        {/* ── 스탬프 획득 ── */}
        {step === 'stamp' && (
          <StampAcquiredView
            location={location}
            alreadyHave={alreadyHave}
            onNext={() => router.push(`/main?new=${id}`)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function StampAcquiredView({
  location,
  alreadyHave,
  onNext,
}: {
  location: ReturnType<typeof getLocationById>
  alreadyHave: boolean
  onNext: () => void
}) {
  useEffect(() => {
    if (!alreadyHave) triggerConfetti()
    const t = setTimeout(onNext, 3200)
    return () => clearTimeout(t)
  }, [alreadyHave, onNext])

  if (!location) return null

  return (
    <motion.div
      key="stamp"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: '#1a1a2e' }}
    >
      {!alreadyHave ? (
        <>
          <motion.div
            className="w-36 h-36 flex items-center justify-center relative mb-6"
            style={{
              background: location.color,
              border: '5px solid #000',
              boxShadow: `inset -8px -8px 0 ${location.color}55, inset 8px 8px 0 ${location.color}dd`,
            }}
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 12 }}
          >
            <span style={{ fontSize: 60, lineHeight: 1 }}>{location.emoji}</span>
            <motion.div
              className="absolute top-2 left-2 w-4 h-4"
              style={{ background: 'rgba(255,255,255,0.5)' }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div
              className="px-6 py-3 mb-4"
              style={{
                background: '#2a6a3a',
                border: '3px solid #000',
                boxShadow: 'inset -3px -3px 0 #0d3320, inset 3px 3px 0 #3a9a52',
              }}
            >
              <p className="pixel text-green-300" style={{ fontSize: '16px', textShadow: '2px 2px #0d3320', lineHeight: '1.8' }}>
                ✅ 스탬프 획득!
              </p>
            </div>
            <p className="pixel text-white mt-2" style={{ fontSize: '11px', textShadow: '2px 2px #000' }}>
              {location.name}
            </p>
            <p className="pixel text-gray-500 mt-3" style={{ fontSize: '13px', lineHeight: '2' }}>
              잠시 후 지도로 돌아가요...
            </p>
          </motion.div>

          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-xl pointer-events-none"
              initial={{ opacity: 1, x: 0, y: 0, scale: 0 }}
              animate={{
                opacity: [1, 1, 0],
                x: Math.cos((i / 8) * Math.PI * 2) * 110,
                y: Math.sin((i / 8) * Math.PI * 2) * 110,
                scale: [0, 1.4, 0],
              }}
              transition={{ delay: 0.3, duration: 1.2 }}
              style={{ left: '50%', top: '35%' }}
            >
              {['⭐', '💎', '✨', '🪙', '🎊', '🎉', '⭐', '💫'][i]}
            </motion.div>
          ))}
        </>
      ) : (
        <>
          <motion.div
            className="text-8xl mb-4"
            animate={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 0.5 }}
          >
            {location.emoji}
          </motion.div>
          <div
            className="px-6 py-3"
            style={{
              background: '#555',
              border: '3px solid #000',
              boxShadow: 'inset -3px -3px 0 #333, inset 3px 3px 0 #777',
            }}
          >
            <p className="pixel text-gray-300" style={{ fontSize: '14px', lineHeight: '1.8' }}>
              이미 완료했어요! ✓
            </p>
          </div>
          <p className="pixel text-gray-600 mt-2" style={{ fontSize: '13px', lineHeight: '2' }}>
            {location.name} 스탬프는 이미 있어요
          </p>
        </>
      )}
    </motion.div>
  )
}

async function triggerConfetti() {
  const { default: confetti } = await import('canvas-confetti')
  confetti({
    particleCount: 120,
    spread: 80,
    origin: { y: 0.5 },
    colors: ['#7ec832', '#f7c52b', '#42e3e3', '#c3a6ff', '#ff6b6b'],
  })
}
