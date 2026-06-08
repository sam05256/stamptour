'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { getState, hasStamp } from '@/lib/storage'
import { getLocationBySecret, LOCATIONS } from '@/lib/data'

export default function ScanPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [scanning, setScanning] = useState(false)
  const [showTestMode, setShowTestMode] = useState(false)
  const html5QrRef = useRef<unknown>(null)

  useEffect(() => {
    const state = getState()
    if (!state) { router.replace('/'); return }
    startScanner()
    return () => { stopScanner() }
  }, [])

  const startScanner = async () => {
    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      const scanner = new Html5Qrcode('qr-reader')
      html5QrRef.current = scanner
      setScanning(true)
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => { handleScan(decodedText) },
        () => {}
      )
    } catch {
      setScanning(false)
    }
  }

  const stopScanner = async () => {
    try {
      const scanner = html5QrRef.current as { stop: () => Promise<void>; clear: () => void } | null
      if (scanner) { await scanner.stop(); scanner.clear() }
    } catch {}
  }

  const handleScan = async (text: string) => {
    await stopScanner()
    setScanning(false)
    const location = getLocationBySecret(text)
    if (!location) {
      setError('올바른 스탬프 QR 코드가 아니에요!')
      setTimeout(() => { setError(''); startScanner(); setScanning(true) }, 2000)
      return
    }
    if (hasStamp(location.id)) {
      setError(`${location.name} 스탬프는 이미 획득했어요! ✓`)
      setTimeout(() => router.push('/main'), 1500)
      return
    }
    router.push(`/location/${location.id}`)
  }

  const handleTestSelect = async (locationId: string) => {
    await stopScanner()
    if (hasStamp(locationId)) {
      setError('이미 획득한 스탬프예요! ✓')
      setTimeout(() => setError(''), 1500)
      return
    }
    router.push(`/location/${locationId}`)
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: '#0a0a14' }}>
      {/* ── 상단 바 ── */}
      <div
        className="flex items-center justify-between px-3 pt-3 pb-3 z-20"
        style={{
          background: '#3c3c3c',
          borderBottom: '3px solid #000',
          boxShadow: 'inset -2px -2px 0 #1a1a1a, inset 2px 2px 0 #5c5c5c',
        }}
      >
        <div className="flex items-center gap-2">
          <motion.button
            onClick={() => router.push('/main')}
            className="mc-btn py-2 px-3"
            style={{ fontSize: '10px' }}
            whileTap={{ scale: 0.9 }}
          >
            ←
          </motion.button>
          <p className="pixel text-white" style={{ fontSize: '15px', textShadow: '2px 2px #000' }}>
            📷 QR 스캔
          </p>
        </div>
        <motion.button
          onClick={() => setShowTestMode(!showTestMode)}
          className="mc-btn"
          style={{ fontSize: '13px', padding: '6px 10px' }}
          whileTap={{ scale: 0.9 }}
        >
          🧪 테스트
        </motion.button>
      </div>

      {/* ── 테스트 모드 패널 ── */}
      <AnimatePresence>
        {showTestMode && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden z-10"
            style={{
              background: '#2a2a3a',
              borderBottom: '3px solid #000',
              boxShadow: 'inset -2px -2px 0 #111, inset 3px 3px 0 #3c3c5c',
            }}
          >
            <div className="px-4 py-3">
              <p className="pixel text-yellow-400 mb-3" style={{ fontSize: '13px', textShadow: '1px 1px #7a6000', lineHeight: '1.8' }}>
                🧪 테스트 모드 — 장소를 선택하세요
              </p>
              <div className="grid grid-cols-2 gap-2">
                {LOCATIONS.map((loc) => {
                  const done = hasStamp(loc.id)
                  return (
                    <motion.button
                      key={loc.id}
                      onClick={() => handleTestSelect(loc.id)}
                      className="flex items-center gap-2 px-3 py-2 text-left"
                      style={{
                        background: done ? '#333' : '#3c3c3c',
                        border: `3px solid ${done ? '#555' : '#000'}`,
                        boxShadow: done
                          ? 'inset -2px -2px 0 #1a1a1a, inset 2px 2px 0 #444'
                          : 'inset -2px -2px 0 #1a1a1a, inset 2px 2px 0 #5c5c5c',
                        opacity: done ? 0.6 : 1,
                      }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="text-xl" style={{ filter: done ? 'grayscale(1)' : 'none' }}>
                        {loc.emoji}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div
                          className="pixel leading-tight truncate"
                          style={{ fontSize: '13px', color: done ? '#666' : '#ddd', textShadow: done ? 'none' : '1px 1px #000' }}
                        >
                          {loc.name}
                        </div>
                        <div className="pixel" style={{ fontSize: '12px', color: '#666' }}>{loc.floor}</div>
                      </div>
                      {done && (
                        <span className="pixel text-green-500" style={{ fontSize: '14px' }}>✓</span>
                      )}
                    </motion.button>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 카메라 뷰 ── */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        <div id="qr-reader" className="w-full" />

        {/* 마인크래프트 스타일 오버레이 */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-64 h-64">
            {[
              { top: 0, left: 0, borderTop: '4px solid #7ec832', borderLeft: '4px solid #7ec832' },
              { top: 0, right: 0, borderTop: '4px solid #7ec832', borderRight: '4px solid #7ec832' },
              { bottom: 0, left: 0, borderBottom: '4px solid #7ec832', borderLeft: '4px solid #7ec832' },
              { bottom: 0, right: 0, borderBottom: '4px solid #7ec832', borderRight: '4px solid #7ec832' },
            ].map((style, i) => (
              <div key={i} className="absolute w-10 h-10" style={style} />
            ))}
            {scanning && (
              <motion.div
                className="absolute left-2 right-2 h-0.5"
                style={{ background: '#7ec832', boxShadow: '0 0 6px #7ec832' }}
                animate={{ top: ['10%', '90%', '10%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
          </div>
        </div>

        <motion.div
          className="absolute bottom-24 left-0 right-0 text-center px-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="pixel text-white" style={{ fontSize: '14px', lineHeight: '2.2', textShadow: '2px 2px #000' }}>
            {scanning ? '📷 QR 코드를 사각형 안에' : '⏳ 카메라 준비 중...'}
          </p>
          {scanning && (
            <p className="pixel text-gray-400" style={{ fontSize: '13px', lineHeight: '2' }}>
              넣으면 자동으로 인식돼요
            </p>
          )}
        </motion.div>
      </div>

      {/* ── 에러 ── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            className="absolute bottom-10 left-4 right-4 px-5 py-4 text-center"
            style={{
              background: '#7a1a1a',
              border: '3px solid #000',
              boxShadow: 'inset -3px -3px 0 #3d0d0d, inset 3px 3px 0 #b03030',
            }}
          >
            <p className="pixel text-red-300" style={{ fontSize: '14px', lineHeight: '1.8', textShadow: '1px 1px #3d0d0d' }}>
              ⚠️ {error}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
