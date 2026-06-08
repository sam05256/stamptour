'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { getState } from '@/lib/storage'
import { LOCATIONS } from '@/lib/data'
import { playSound, preloadSounds } from '@/lib/sounds'

/**
 * 뱀 경로 배치 (path 순서 = locIdx 0→6)
 *
 * row0 L→R:  [0]────[1]────[2]
 *                            │
 * row1 R→L:  [5]────[4]────[3]
 *   │
 * row2 L→R:        [6]  (가운데)
 */
const GRID: { locIdx: number; row: number; col: number }[] = [
  { locIdx: 0, row: 0, col: 0 },
  { locIdx: 1, row: 0, col: 1 },
  { locIdx: 2, row: 0, col: 2 },
  { locIdx: 3, row: 1, col: 2 },
  { locIdx: 4, row: 1, col: 1 },
  { locIdx: 5, row: 1, col: 0 },
  { locIdx: 6, row: 2, col: 1 },
]
const PATH_ORDER = [0, 1, 2, 3, 4, 5, 6]

const SHORT: Record<string, string> = {
  stairs: '안랩계단', history: '히스토리관', cafe: '카페',
  qa: 'QA룸', soc: 'SOC', lounge: '휴게실', rooftop: '옥상정원',
}

// Minecraft block style per location
const MC: Record<string, { block: string; highlight: string; shadow: string; label: string }> = {
  stairs:  { block: '#b84040', highlight: '#e06060', shadow: '#5a1a1a', label: '#ffaaaa' },
  history: { block: '#2a7a6a', highlight: '#3aaa90', shadow: '#0d3d35', label: '#aaffee' },
  cafe:    { block: '#8a7a10', highlight: '#c4ae18', shadow: '#3d360a', label: '#ffe96a' },
  qa:      { block: '#2a6a3a', highlight: '#3a9a52', shadow: '#0d3320', label: '#aaff99' },
  soc:     { block: '#5a3a8a', highlight: '#7a52b8', shadow: '#2a1a4a', label: '#ddaaff' },
  lounge:  { block: '#8a5a1a', highlight: '#c07a28', shadow: '#3d2a0a', label: '#ffd080' },
  rooftop: { block: '#1a5a8a', highlight: '#2a7ab8', shadow: '#0a2d45', label: '#aaddff' },
}

export default function MainPage() {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerW, setContainerW] = useState(0)
  const [participantName, setParticipantName] = useState('')
  const [collectedIds, setCollectedIds] = useState<string[]>([])
  const [showNewStamp, setShowNewStamp] = useState<string | null>(null)
  const [isFirstVisit, setIsFirstVisit] = useState(true)

  useEffect(() => {
    const state = getState()
    if (!state) { router.replace('/'); return }
    setParticipantName(state.participant.name)
    setCollectedIds(state.stamps.map(s => s.locationId))
    preloadSounds()

    // 첫 방문 확인
    const hasVisited = localStorage.getItem('mainPageFirstVisit')
    if (hasVisited) {
      setIsFirstVisit(false)
    } else {
      localStorage.setItem('mainPageFirstVisit', 'true')
      setIsFirstVisit(true)
    }

    const params = new URLSearchParams(window.location.search)
    const newStamp = params.get('new')
    if (newStamp) {
      setShowNewStamp(newStamp)
      window.history.replaceState({}, '', '/main')
      setTimeout(() => setShowNewStamp(null), 3000)
    }
  }, [router])

  useEffect(() => {
    const measure = () => {
      if (containerRef.current) setContainerW(containerRef.current.offsetWidth)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  if (containerW === 0) {
    return (
      <div className="min-h-screen" style={{ background: '#2d4a1e' }}>
        <div ref={containerRef} className="w-full" />
      </div>
    )
  }

  const COLS = 3
  const CELL = containerW / COLS
  const BLOCK = Math.round(CELL * 0.66)
  const HALF = BLOCK / 2
  const ROW_GAP = BLOCK + 68
  const cx = (col: number) => CELL * col + CELL / 2
  const cy = (row: number) => row * ROW_GAP + HALF + 8
  const containerH = 2 * ROW_GAP + BLOCK + 60

  const gridPos = Object.fromEntries(GRID.map(g => [g.locIdx, { row: g.row, col: g.col }]))

  const buildPath = () => {
    const pts = PATH_ORDER.map(idx => ({
      x: cx(gridPos[idx].col),
      y: cy(gridPos[idx].row),
    }))
    const CURVE = HALF * 0.9
    let d = `M ${pts[0].x} ${pts[0].y}`
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1]
      const curr = pts[i]
      const sameRow = prev.y === curr.y
      if (sameRow) {
        d += ` L ${curr.x} ${curr.y}`
      } else {
        const goingDown = curr.y > prev.y
        const goingRight = curr.x > prev.x
        const vEndY = curr.y + (goingDown ? -CURVE : CURVE)
        const hStartX = prev.x + (goingRight ? CURVE : -CURVE)
        d += ` L ${prev.x} ${vEndY}`
        d += ` Q ${prev.x} ${curr.y} ${hStartX} ${curr.y}`
        d += ` L ${curr.x} ${curr.y}`
      }
    }
    return d
  }

  const svgPath = buildPath()
  const collected = collectedIds.length
  const total = LOCATIONS.length
  const progressPct = (collected / total) * 100

  // 앞에서부터 연속으로 모은 구간 수 계산
  // 예: 1번·6번 모았으면 consecutiveCount = 1 (2번이 없으므로 1번까지만)
  const consecutiveCount = (() => {
    let count = 0
    for (let i = 0; i < PATH_ORDER.length; i++) {
      const loc = LOCATIONS[PATH_ORDER[i]]
      if (collectedIds.includes(loc.id)) {
        count = i + 1
      } else {
        break
      }
    }
    return count
  })()

  // 연속 구간까지의 부분 경로 생성
  const buildProgressPath = (numPoints: number) => {
    if (numPoints <= 1) {
      const idx = PATH_ORDER[0]
      const x = cx(gridPos[idx].col)
      const y = cy(gridPos[idx].row)
      return `M ${x} ${y}`
    }
    const pts = PATH_ORDER.slice(0, numPoints).map(idx => ({
      x: cx(gridPos[idx].col),
      y: cy(gridPos[idx].row),
    }))
    const CURVE = HALF * 0.9
    let d = `M ${pts[0].x} ${pts[0].y}`
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1]
      const curr = pts[i]
      const sameRow = prev.y === curr.y
      if (sameRow) {
        d += ` L ${curr.x} ${curr.y}`
      } else {
        const goingDown = curr.y > prev.y
        const goingRight = curr.x > prev.x
        const vEndY = curr.y + (goingDown ? -CURVE : CURVE)
        const hStartX = prev.x + (goingRight ? CURVE : -CURVE)
        d += ` L ${prev.x} ${vEndY}`
        d += ` Q ${prev.x} ${curr.y} ${hStartX} ${curr.y}`
        d += ` L ${curr.x} ${curr.y}`
      }
    }
    return d
  }

  const progressPath = buildProgressPath(consecutiveCount)

  const handleBlockClick = (locIdx: number) => {
    const loc = LOCATIONS[locIdx]
    if (collectedIds.includes(loc.id)) {
      playSound('click')
      router.push(`/location/${loc.id}?view=true`)
    }
  }

  return (
    <div
      className="min-h-screen pb-32"
      style={{
        background: 'linear-gradient(180deg, #1e3a5c 0%, #2d5a8e 8%, #2d4a1e 22%, #1e3414 100%)',
      }}
    >
      {/* ── HUD Header ── */}
      <div
        className="sticky top-0 z-20 px-3 py-3"
        style={{
          background: '#3c3c3c',
          borderBottom: '3px solid #000',
          boxShadow: 'inset -2px -2px 0 #1a1a1a, inset 2px 2px 0 #5c5c5c',
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="pixel text-yellow-400" style={{ fontSize: '11px', textShadow: '1px 1px #7a6000' }}>
              2026 코딩캠프
            </p>
            <p className="pixel text-white mt-1" style={{ fontSize: '15px', textShadow: '2px 2px #000' }}>
              📮 스탬프투어
            </p>
          </div>
          <div
            className="text-right px-3 py-2"
            style={{
              background: '#555',
              border: '2px solid #000',
              boxShadow: 'inset -2px -2px 0 #333, inset 2px 2px 0 #777',
            }}
          >
            <p className="pixel text-gray-400" style={{ fontSize: '10px' }}>플레이어</p>
            <p className="pixel text-green-400 mt-1" style={{ fontSize: '13px', textShadow: '1px 1px #1a3a0a' }}>
              {participantName}
            </p>
          </div>
        </div>

        {/* XP 바 */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="pixel text-gray-400" style={{ fontSize: '11px' }}>진행 현황</span>
            <span className="pixel text-yellow-400" style={{ fontSize: '11px', textShadow: '1px 1px #7a6000' }}>
              {collected} / {total}
            </span>
          </div>
          <div className="mc-xp-bg h-4 w-full">
            <motion.div
              className="mc-xp-fill h-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* ── 완료 배너 ── */}
      <AnimatePresence>
        {collected === total && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-3 mt-3"
          >
            <div
              className="p-4 text-center"
              style={{
                background: '#8a6a00',
                border: '3px solid #000',
                boxShadow: 'inset -3px -3px 0 #4a3a00, inset 3px 3px 0 #c4a000',
              }}
            >
              <p className="pixel text-yellow-300 mb-3" style={{ fontSize: '16px', textShadow: '2px 2px #4a3a00' }}>
                🏆 모든 스탬프 완성!
              </p>
              <motion.button
                onClick={() => router.push('/complete')}
                className="mc-btn mc-btn-green"
                whileTap={{ scale: 0.95 }}
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                🎁 선물 받으러 가기
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 새 스탬프 토스트 ── */}
      <AnimatePresence>
        {showNewStamp && (
          <motion.div
            initial={{ opacity: 0, y: -60, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.8 }}
            className="fixed top-4 left-1/2 z-50 -translate-x-1/2 px-5 py-3"
            style={{
              background: '#2a6a3a',
              border: '3px solid #000',
              boxShadow: 'inset -3px -3px 0 #0d3320, inset 3px 3px 0 #3a9a52',
              minWidth: 220,
              textAlign: 'center',
            }}
          >
            <p className="pixel text-green-300" style={{ fontSize: '14px', textShadow: '1px 1px #0d3320' }}>
              ✅ {LOCATIONS.find(l => l.id === showNewStamp)?.name} 획득!
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 코스 지도 ── */}
      <div ref={containerRef} className="w-full pt-4 px-0 relative" style={{ height: containerH + 60 }}>
        {containerW > 0 && (
          <>
            {/* SVG 경로 (dirt path) */}
            <svg
              className="absolute inset-0 pointer-events-none"
              width={containerW}
              height={containerH + 60}
              style={{ top: 30 }}
            >
              {/* 흙 길 테두리 */}
              <path
                d={svgPath}
                fill="none"
                stroke="#3a1a00"
                strokeWidth={HALF * 0.58}
                strokeLinecap="square"
                strokeLinejoin="miter"
              />
              {/* 흙 길 */}
              <path
                d={svgPath}
                fill="none"
                stroke="#866043"
                strokeWidth={HALF * 0.44}
                strokeLinecap="square"
                strokeLinejoin="miter"
              />
              {/* 진행 구간 - 잔디 */}
              {consecutiveCount > 0 && (
                <motion.path
                  key={progressPath}
                  d={progressPath}
                  fill="none"
                  stroke="#5a8c2f"
                  strokeWidth={HALF * 0.28}
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                  pathLength={1}
                  strokeDasharray="1"
                  initial={{ strokeDashoffset: 1 }}
                  animate={{ strokeDashoffset: 0 }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                />
              )}
            </svg>

            {/* 블록 스탬프들 */}
            {GRID.map(({ locIdx, row, col }) => {
              const loc = LOCATIONS[locIdx]
              const done = collectedIds.includes(loc.id)
              const stepNum = PATH_ORDER.indexOf(locIdx) + 1
              const x = cx(col)
              const y = cy(row) + 30
              const mc = MC[loc.id] ?? { block: '#555', highlight: '#888', shadow: '#222', label: '#fff' }

              return (
                <motion.div
                  key={loc.id}
                  className="absolute flex flex-col items-center"
                  style={{ left: x - HALF, top: y - HALF, width: BLOCK }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: locIdx * 0.08, type: 'spring', stiffness: 200 }}
                >
                  <motion.button
                    onClick={() => handleBlockClick(locIdx)}
                    className="relative"
                    whileTap={done ? { scale: 0.88 } : {}}
                    style={{ cursor: done ? 'pointer' : 'default', width: BLOCK, height: BLOCK }}
                    animate={done ? { y: [0, -5, 0] } : {}}
                    transition={{ duration: 2.5, repeat: Infinity, delay: locIdx * 0.3, ease: 'easeInOut' }}
                  >
                    {/* 블록 */}
                    <div
                      className="w-full h-full flex items-center justify-center relative"
                      style={{
                        background: done ? mc.block : '#6b6b6b',
                        border: '3px solid #000',
                        boxShadow: done
                          ? `inset -4px -4px 0 ${mc.shadow}, inset 4px 4px 0 ${mc.highlight}`
                          : 'inset -4px -4px 0 #444, inset 4px 4px 0 #999',
                      }}
                    >
                      {done ? (
                        <motion.span
                          style={{ fontSize: HALF * 0.88, lineHeight: 1 }}
                          initial={{ scale: 0, rotate: -20 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: 'spring', stiffness: 300 }}
                        >{loc.emoji}</motion.span>
                      ) : (
                        <span
                          className="pixel text-gray-400"
                          style={{ fontSize: Math.max(10, HALF * 0.52), textShadow: '1px 1px #222' }}
                        >
                          {stepNum}
                        </span>
                      )}

                      {/* ✓ 뱃지 */}
                      {done && (
                        <motion.div
                          className="absolute flex items-center justify-center"
                          style={{
                            width: HALF * 0.62, height: HALF * 0.62,
                            top: -4, right: -4,
                            background: '#2a6a3a',
                            border: '2px solid #000',
                            boxShadow: 'inset -1px -1px 0 #0d3320, inset 1px 1px 0 #3a9a52',
                          }}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 400, delay: 0.2 }}
                        >
                          <span
                            className="pixel text-green-300"
                            style={{ fontSize: Math.max(6, HALF * 0.22), textShadow: '1px 1px #0d3320' }}
                          >✓</span>
                        </motion.div>
                      )}
                    </div>
                  </motion.button>

                  {/* 장소명 */}
                  <div
                    className="mt-1 px-1 py-0.5 text-center"
                    style={{
                      background: '#111',
                      border: '2px solid #000',
                      boxShadow: 'inset -1px -1px 0 #000, inset 1px 1px 0 #333',
                      maxWidth: CELL - 4,
                    }}
                  >
                    <p
                      className="pixel leading-tight"
                      style={{
                        fontSize: Math.max(6, HALF * 0.27),
                        color: done ? mc.label : '#666',
                        textShadow: done ? `1px 1px ${mc.shadow}` : 'none',
                      }}
                    >
                      {SHORT[loc.id] ?? loc.name}
                    </p>
                    <p
                      className="pixel"
                      style={{
                        fontSize: Math.max(5, HALF * 0.22),
                        color: done ? '#7ec832' : '#444',
                        textShadow: done ? '1px 1px #1a3a0a' : 'none',
                      }}
                    >
                      {loc.floor}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </>
        )}
      </div>

      {/* ── 안내 ── */}
      <div className="text-center px-4 mt-1">
        {collected === 0 && (
          <motion.p
            className="pixel text-gray-400"
            style={{ fontSize: '13px', lineHeight: '2.2' }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            QR 스캔 버튼을 눌러 시작! 📷
          </motion.p>
        )}
        {collected > 0 && collected < total && (
          <p className="pixel text-green-400" style={{ fontSize: '13px', lineHeight: '2.2', textShadow: '1px 1px #1a3a0a' }}>
            {total - collected}개 남았어요! 블록 탭 = 설명 보기 🔥
          </p>
        )}
      </div>

      {/* ── QR 스캔 버튼 ── */}
      <div className="fixed bottom-4 left-0 right-0 max-w-md mx-auto px-4 z-30">
        {isFirstVisit && (
          <motion.p
            className="pixel text-center text-green-400 mb-2"
            style={{ fontSize: '12px', textShadow: '1px 1px #0d3320' }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            🎯 QR 코드를 스캔해주세요!
          </motion.p>
        )}
        <motion.button
          onClick={() => {
            setIsFirstVisit(false)
            playSound('transition')
            router.push('/scan')
          }}
          className={`w-full mc-btn mc-btn-green ${isFirstVisit ? 'animate-pulse' : ''}`}
          style={{ fontSize: '12px', padding: '16px' }}
          whileTap={{ scale: 0.95 }}
          animate={isFirstVisit ? { y: [0, -4, 0], boxShadow: ['0 0 0 0 rgba(122, 200, 50, 0.7)', '0 0 0 10px rgba(122, 200, 50, 0)'] } : { y: [0, -4, 0] }}
          transition={isFirstVisit ? { duration: 1.5, repeat: Infinity } : { duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          📷  QR 스캔하기
        </motion.button>
      </div>
    </div>
  )
}
