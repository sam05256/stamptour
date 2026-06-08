'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { getState } from '@/lib/storage'
import { LOCATIONS } from '@/lib/data'
import { playSound } from '@/lib/sounds'
import { supabase } from '@/lib/supabase'

export default function CompletePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [confettiFired, setConfettiFired] = useState(false)
  const [exchangeClicked, setExchangeClicked] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('exchangeCompleted') === 'true'
    }
    return false
  })

  useEffect(() => {
    const state = getState()
    if (!state) { router.replace('/'); return }
    if (state.stamps.length < 7) { router.replace('/main'); return }
    setName(state.participant.name)

    if (!confettiFired) {
      setConfettiFired(true)

      // Supabase에 완료 시간 저장
      if (state.participant.supabaseId) {
        (supabase
          .from('participants')
          .update({ completed_at: new Date().toISOString() })
          .eq('id', state.participant.supabaseId) as any)
          .then(() => {
            fireConfetti()
            playSound('complete')
          })
          .catch((error: any) => {
            console.error('Failed to update completion:', error)
            fireConfetti()
            playSound('complete')
          })
      } else {
        fireConfetti()
        playSound('complete')
      }
    }
  }, [router, confettiFired])

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10 overflow-hidden relative"
      style={{ background: 'linear-gradient(180deg, #0a0a1e 0%, #1a1a3a 50%, #0d2a0d 100%)' }}
    >
      {/* 별 배경 */}
      {[...Array(16)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white"
          style={{
            left: `${(i * 41 + 5) % 100}%`,
            top: `${(i * 27 + 3) % 80}%`,
          }}
          animate={{ opacity: [0.1, 1, 0.1], scale: [1, 1.5, 1] }}
          transition={{ duration: 2 + (i % 4) * 0.5, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}

      <div className="relative z-10 w-full max-w-sm text-center">
        {/* 로봇 + 트로피 */}
        <div className="flex justify-center items-end gap-3 mb-4">
          {/* 로봇 */}
          <motion.img
            src="/robot.png"
            alt="코딩 로봇"
            style={{ width: 140, height: 140, imageRendering: 'pixelated', objectFit: 'contain' }}
            initial={{ opacity: 0, x: -40, rotate: -15 }}
            animate={{ opacity: 1, x: 0, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 180, damping: 14, delay: 0.1 }}
          />

          {/* 트로피 블록 */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 150, damping: 12, delay: 0.3 }}
          >
            <div
              className="w-28 h-28 flex items-center justify-center text-5xl relative"
              style={{
                background: '#8a6a00',
                border: '5px solid #000',
                boxShadow: 'inset -8px -8px 0 #4a3a00, inset 8px 8px 0 #c4a000',
              }}
            >
              🏆
              <motion.div
                className="absolute top-2 left-2 w-4 h-4"
                style={{ background: 'rgba(255,255,255,0.4)' }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
            </div>
          </motion.div>
        </div>

        {/* 로봇 말풍선 */}
        <motion.div
          className="flex justify-start pl-4 mb-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div
            className="inline-block px-3 py-2 relative"
            style={{
              background: '#fff',
              border: '3px solid #000',
              boxShadow: 'inset -2px -2px 0 #ccc, inset 2px 2px 0 #fff',
            }}
          >
            <p className="pixel text-gray-800" style={{ fontSize: '13px', lineHeight: '1.8' }}>
              축하해! 대단한걸! 🎉
            </p>
            <div style={{
              position: 'absolute', bottom: -10, left: 20,
              width: 0, height: 0,
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderTop: '10px solid #000',
            }} />
            <div style={{
              position: 'absolute', bottom: -7, left: 22,
              width: 0, height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '8px solid #fff',
            }} />
          </div>
        </motion.div>

        {/* 제목 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-5"
        >
          <div
            className="px-4 py-3 mb-3 inline-block"
            style={{
              background: '#2a6a3a',
              border: '3px solid #000',
              boxShadow: 'inset -3px -3px 0 #0d3320, inset 3px 3px 0 #3a9a52',
            }}
          >
            <p className="pixel text-green-300" style={{ fontSize: '16px', textShadow: '2px 2px #0d3320', lineHeight: '1.8' }}>
              🎉 미션 완료!
            </p>
          </div>
          <p className="pixel text-white mt-2" style={{ fontSize: '12px', textShadow: '2px 2px #000', lineHeight: '2' }}>
            {name}
          </p>
          <p className="pixel text-gray-400 mt-1" style={{ fontSize: '13px', lineHeight: '2' }}>
            스탬프 7개를 모두 모았어요!
          </p>
        </motion.div>

        {/* 스탬프 인벤토리 */}
        <motion.div
          className="mb-5 p-3"
          style={{
            background: '#3c3c3c',
            border: '3px solid #000',
            boxShadow: 'inset -3px -3px 0 #1a1a1a, inset 3px 3px 0 #5c5c5c',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <p className="pixel text-gray-400 mb-3 text-center" style={{ fontSize: '13px' }}>인벤토리</p>
          <div className="grid grid-cols-7 gap-1.5">
            {LOCATIONS.map((loc, i) => (
              <motion.div
                key={loc.id}
                className="aspect-square flex items-center justify-center"
                style={{
                  background: loc.color,
                  border: '3px solid #000',
                  boxShadow: `inset -2px -2px 0 ${loc.color}55, inset 2px 2px 0 ${loc.color}cc`,
                }}
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.8 + i * 0.08, type: 'spring', stiffness: 200 }}
              >
                <span style={{ fontSize: 22, lineHeight: 1 }}>{loc.emoji}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* 선물 교환권 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.3, type: 'spring', stiffness: 200 }}
          className="mb-5"
        >
          <div
            className="p-5"
            style={{
              background: '#8a6a00',
              border: '4px solid #000',
              boxShadow: 'inset -4px -4px 0 #4a3a00, inset 4px 4px 0 #c4a000',
            }}
          >
            <motion.p
              className="text-4xl mb-3"
              animate={{ rotate: [-5, 5, -5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🎁
            </motion.p>
            <p
              className="pixel text-yellow-300 mb-3"
              style={{ fontSize: '16px', textShadow: '2px 2px #4a3a00', lineHeight: '2' }}
            >
              선물 교환권
            </p>
            <div
              className="px-4 py-3"
              style={{
                background: '#3d3000',
                border: '2px solid #6a5000',
                boxShadow: 'inset -2px -2px 0 #1a1500, inset 2px 2px 0 #7a6000',
              }}
            >
              <p className="text-gray-200 text-sm font-bold leading-relaxed">
                1층 교환 데스크로 가서<br />
                선생님께 이 화면을 보여주세요! 🎁
              </p>
            </div>
            <button
              onClick={() => {
                setExchangeClicked(true)
                localStorage.setItem('exchangeCompleted', 'true')
              }}
              disabled={exchangeClicked}
              className="mt-3 px-3 py-1.5 inline-block pixel font-bold transition-all disabled:cursor-not-allowed"
              style={{
                fontSize: '13px',
                background: exchangeClicked ? '#888' : '#FFA500',
                color: exchangeClicked ? '#ccc' : '#000',
                border: '2px solid #000',
                boxShadow: exchangeClicked
                  ? 'inset -2px -2px 0 #555, inset 2px 2px 0 #aaa'
                  : 'inset -2px -2px 0 #cc7700, inset 2px 2px 0 #ffcc00',
              }}
            >
              {exchangeClicked ? '✅ 교환 완료!' : '🎁 교환 완료 (선생님 확인)'}
            </button>
          </div>
        </motion.div>

        <motion.button
          onClick={() => router.push('/main')}
          className="mc-btn"
          style={{ fontSize: '14px' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
          whileTap={{ scale: 0.95 }}
        >
          ← 스탬프 지도로 돌아가기
        </motion.button>
      </div>
    </div>
  )
}

async function fireConfetti() {
  const { default: confetti } = await import('canvas-confetti')
  const colors = ['#7ec832', '#f7c52b', '#42e3e3', '#c3a6ff', '#ff6b6b']
  confetti({ particleCount: 150, spread: 100, origin: { y: 0.3 }, colors })
  setTimeout(() => confetti({ particleCount: 80, angle: 60, spread: 60, origin: { x: 0 }, colors }), 400)
  setTimeout(() => confetti({ particleCount: 80, angle: 120, spread: 60, origin: { x: 1 }, colors }), 600)
}
