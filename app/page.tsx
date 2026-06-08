'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { saveParticipant, getState } from '@/lib/storage'
import { createParticipant } from '@/lib/supabase'

const FLOATING_ITEMS = ['⛏️', '🗡️', '🛡️', '🪄', '🏹', '💎', '🧱', '🪙']

export default function OnboardingPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const state = getState()
    if (state) {
      router.replace('/main')
    } else {
      setChecked(true)
    }
  }, [router])

  const handleStart = async () => {
    if (!name.trim()) return
    setLoading(true)
    try {
      const participant = await createParticipant(name.trim())
      saveParticipant(name.trim(), participant.id)
      setTimeout(() => router.push('/main'), 600)
    } catch (error) {
      console.error('Failed to create participant:', error)
      setLoading(false)
    }
  }

  if (!checked) return null

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #1a3a5c 0%, #2a5a8c 40%, #3d7ab8 70%, #5a8c2f 95%, #3d6b1e 100%)' }}
    >
      {/* 별 배경 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white"
            style={{
              left: `${(i * 37 + 5) % 100}%`,
              top: `${(i * 23 + 3) % 60}%`,
            }}
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 1.5 + (i % 5) * 0.4, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}

        {/* 떠다니는 아이템들 */}
        {FLOATING_ITEMS.map((item, i) => (
          <motion.div
            key={`item-${i}`}
            className="absolute text-2xl select-none"
            style={{
              left: `${8 + i * 12}%`,
              bottom: `${15 + (i % 3) * 8}%`,
            }}
            animate={{ y: [0, -10, 0], rotate: [-5, 5, -5] }}
            transition={{ duration: 2.5 + i * 0.3, repeat: Infinity, delay: i * 0.4 }}
          >
            {item}
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* 타이틀 */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* 마인크래프트 스타일 타이틀 */}
          <div className="mc-panel-dark mb-4 py-5 px-4 mx-0">
            <motion.p
              className="text-yellow-400 mb-3 leading-relaxed font-bold"
              style={{ fontSize: '13px', textShadow: '2px 2px #7a6000' }}
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              2026 미래상상 코딩캠프
            </motion.p>
            <h1
              className="text-white leading-relaxed mb-3 font-bold"
              style={{
                fontSize: '22px',
                textShadow: '3px 3px #333, -1px -1px #000',
              }}
            >
              안랩 <span style={{ color: '#7ec832', textShadow: '3px 3px #1a3a0a' }}>스탬프투어</span>
            </h1>
            <p className="text-gray-300 font-bold mt-1" style={{ fontSize: '15px' }}>
              도장 7개를 모아서 선물을 받아요! 🎁
            </p>
          </div>

          {/* 로봇 캐릭터 */}
          <motion.div
            className="flex justify-center mb-2"
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 14 }}
          >
            <motion.img
              src="/robot.png"
              alt="코딩 로봇"
              style={{ width: 200, height: 200, imageRendering: 'pixelated', objectFit: 'contain' }}
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>

          {/* 말풍선 */}
          <motion.div
            className="inline-block mb-3 px-4 py-2 relative"
            style={{
              background: '#fff',
              border: '3px solid #000',
              boxShadow: 'inset -2px -2px 0 #ccc, inset 2px 2px 0 #fff',
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <p className="pixel text-gray-800" style={{ fontSize: '13px', lineHeight: '1.8' }}>
              안녕! 같이 안랩 투어 떠나자! 🤖
            </p>
            {/* 말풍선 꼬리 */}
            <div style={{
              position: 'absolute', bottom: -10, left: '50%', transform: 'translateX(-50%)',
              width: 0, height: 0,
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderTop: '10px solid #000',
            }} />
            <div style={{
              position: 'absolute', bottom: -7, left: '50%', transform: 'translateX(-50%)',
              width: 0, height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '8px solid #fff',
            }} />
          </motion.div>
        </motion.div>

        {/* 이름 입력 패널 */}
        <motion.div
          className="mc-panel p-5 mb-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <p className="pixel text-center text-gray-800 mb-4" style={{ fontSize: '14px', lineHeight: '1.8' }}>
            플레이어 이름 입력
          </p>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleStart()}
            placeholder="내 이름을 입력해요"
            maxLength={10}
            className="mc-input w-full px-4 py-3 text-base text-center rounded-none"
          />
          <motion.button
            onClick={handleStart}
            disabled={!name.trim() || loading}
            className={`w-full mt-3 mc-btn ${name.trim() && !loading ? 'mc-btn-green' : 'mc-btn-disabled'}`}
            whileTap={name.trim() ? { scale: 0.97 } : {}}
          >
            {loading ? '⏳ 로딩 중...' : '🗺️ 투어 시작!'}
          </motion.button>
        </motion.div>

        {/* 참여 방법 */}
        <motion.div
          className="mc-panel-dark p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p className="pixel text-gray-400 text-center mb-3" style={{ fontSize: '13px' }}>
            ── 참여 방법 ──
          </p>
          {[
            { icon: '📍', text: '코스를 따라 안랩 사옥을 투어해요' },
            { icon: '📱', text: '각 장소의 QR 코드를 스캔해요' },
            { icon: '🎯', text: '미션을 완료하면 스탬프 획득!' },
            { icon: '🎁', text: '7개 완성하면 선물을 받아요!' },
          ].map((item, i) => (
            <motion.div
              key={i}
              className="flex items-center gap-3 py-1.5 border-b border-gray-600 last:border-0"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + i * 0.1 }}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-xs text-gray-300 font-bold">{item.text}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
