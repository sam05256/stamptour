'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { LOCATIONS } from '@/lib/data'
import { supabase } from '@/lib/supabase'

interface ParticipantRow {
  id: string
  name: string
  stamps: string[]
  inputValues: Record<string, string>
  completedAt: string | null
  createdAt: string
}

const DEMO_DATA: ParticipantRow[] = [
  { id: '1', name: '김민준', stamps: ['stairs', 'history', 'cafe', 'qa', 'soc', 'lounge', 'rooftop'], inputValues: { cafe: '아메리카노', rooftop: '로봇 만들기가 제일 재미있었어요!' }, completedAt: '2026-01-15T10:30:00Z', createdAt: '2026-01-15T09:00:00Z' },
  { id: '2', name: '이서연', stamps: ['stairs', 'history', 'cafe', 'qa'], inputValues: { cafe: '오렌지 주스', rooftop: '' }, completedAt: null, createdAt: '2026-01-15T09:10:00Z' },
  { id: '3', name: '박지호', stamps: ['stairs', 'history'], inputValues: {}, completedAt: null, createdAt: '2026-01-15T09:15:00Z' },
  { id: '4', name: '최유나', stamps: ['stairs', 'history', 'cafe', 'qa', 'soc', 'lounge', 'rooftop'], inputValues: { cafe: '녹차', rooftop: '친구랑 게임 만들기!' }, completedAt: '2026-01-15T10:45:00Z', createdAt: '2026-01-15T09:20:00Z' },
  { id: '5', name: '정도윤', stamps: ['stairs', 'history', 'cafe', 'qa', 'soc'], inputValues: { cafe: '콜라' }, completedAt: null, createdAt: '2026-01-15T09:25:00Z' },
]

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [pw, setPw] = useState('')
  const [error, setError] = useState('')
  const [data, setData] = useState<ParticipantRow[]>([])
  const [filter, setFilter] = useState<'all' | 'completed' | 'incomplete'>('all')
  const [tab, setTab] = useState<'dashboard' | 'realtime' | 'analysis' | 'feedback' | 'qrcodes' | 'settings'>('dashboard')

  const handleLogin = async () => {
    if (pw === 'ahnlab2026') {
      try {
        // Supabase에서 참여자 데이터 가져오기
        const { data: participants, error: participantsError } = await supabase
          .from('participants')
          .select('*')
          .order('created_at', { ascending: false })

        if (participantsError) throw participantsError

        // 각 참여자의 스탬프와 미션 입력값 가져오기
        const enrichedData = await Promise.all(
          (participants || []).map(async (p) => {
            const { data: stamps } = await supabase
              .from('stamps')
              .select('location_id')
              .eq('participant_id', p.id)

            const { data: inputs } = await supabase
              .from('mission_inputs')
              .select('location_id, input_value')
              .eq('participant_id', p.id)

            const stampIds = stamps?.map(s => s.location_id) || []
            const inputValues: Record<string, string> = {}
            inputs?.forEach(i => {
              inputValues[i.location_id] = i.input_value
            })

            return {
              id: p.id,
              name: p.name,
              stamps: stampIds,
              inputValues,
              completedAt: p.completed_at,
              createdAt: p.created_at,
            }
          })
        )

        setAuthed(true)
        setData(enrichedData)
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : JSON.stringify(err)
        console.error('Failed to load data:', errorMsg)
        console.error('Full error:', err)
        setError('데이터 로드 실패: ' + errorMsg)
        setTimeout(() => setError(''), 3000)
      }
    } else {
      setError('비밀번호가 틀렸어요')
      setTimeout(() => setError(''), 1500)
    }
  }

  const filtered = data.filter(p => {
    if (filter === 'completed') return p.completedAt !== null
    if (filter === 'incomplete') return p.completedAt === null
    return true
  })

  const completed = data.filter(p => p.completedAt).length

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <motion.div
          className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">🔐</div>
            <h1 className="font-black text-xl text-gray-800">운영자 어드민</h1>
            <p className="text-gray-400 text-sm mt-1">비밀번호를 입력해주세요</p>
          </div>
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="비밀번호"
            className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-center font-bold focus:outline-none focus:border-orange-500 transition-colors mb-3"
          />
          {error && <p className="text-red-500 text-sm text-center mb-2">{error}</p>}
          <button
            onClick={handleLogin}
            className="w-full bg-orange-500 text-white font-black py-3 rounded-2xl"
          >
            로그인
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-orange-500 text-white px-5 py-5">
        <h1 className="font-black text-xl">📊 운영자 대시보드</h1>
        <p className="text-orange-100 text-sm">2026 미래상상 코딩캠프 스탬프 투어</p>

        {/* 탭 */}
        <div className="flex gap-2 mt-4 flex-wrap">
          {[
            { id: 'dashboard', label: '📊 대시보드' },
            { id: 'realtime', label: '📍 실시간' },
            { id: 'analysis', label: '📈 분석' },
            { id: 'feedback', label: '💬 피드백' },
            { id: 'qrcodes', label: '📱 QR 코드' },
            { id: 'settings', label: '⚙️ 설정' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`px-3 py-2 rounded-full font-bold text-xs transition-all whitespace-nowrap ${
                tab === t.id ? 'bg-white text-orange-500' : 'bg-white/20 text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 요약 카드 (대시보드 탭) */}
        {tab === 'dashboard' && (
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { label: '총 참여자', value: data.length, icon: '👥' },
              { label: '완료자', value: completed, icon: '🎉' },
              { label: '미완료자', value: data.length - completed, icon: '🔄' },
              { label: '완료율', value: data.length > 0 ? `${Math.round((completed / data.length) * 100)}%` : '0%', icon: '📊' },
              { label: '평균 시간', value: completed > 0 ? '1시간 30분' : '-', icon: '⏱️' },
            ].map((card) => (
              <div key={card.label} className="bg-white/20 rounded-2xl p-3 text-center">
                <div className="text-xl">{card.icon}</div>
                <div className="font-black text-2xl">{card.value}</div>
                <div className="text-xs text-orange-100">{card.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {tab === 'dashboard' && (
        <>
          {/* 필터 */}
          <div className="flex gap-2 px-4 py-3 bg-white shadow-sm">
            {(['all', 'completed', 'incomplete'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  filter === f ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {{ all: '전체', completed: '완료', incomplete: '진행 중' }[f]}
              </button>
            ))}
          </div>

          {/* 참여자 목록 */}
          <div className="px-4 py-3 space-y-3">
            {filtered.map((p, i) => (
              <motion.div
                key={p.id}
                className="bg-white rounded-2xl shadow-sm p-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center font-black text-orange-500 text-sm">
                      {p.name[0]}
                    </div>
                    <span className="font-black text-gray-800">{p.name}</span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    p.completedAt ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {p.completedAt ? '완료 🎉' : `${p.stamps.length}/7`}
                  </span>
                </div>

                {/* 스탬프 현황 */}
                <div className="flex gap-1.5 flex-wrap">
                  {LOCATIONS.map((loc) => {
                    const done = p.stamps.includes(loc.id)
                    return (
                      <div
                        key={loc.id}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs"
                        style={{ background: done ? loc.color : '#F3F4F6' }}
                        title={loc.name}
                      >
                        {done ? loc.emoji : ''}
                      </div>
                    )
                  })}
                </div>

                {/* 입력값 */}
                {(p.inputValues.cafe || p.inputValues.rooftop) && (
                  <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
                    {p.inputValues.cafe && (
                      <p className="text-xs text-gray-500">
                        <span className="font-bold text-gray-600">☕ 부모님 음료:</span> {p.inputValues.cafe}
                      </p>
                    )}
                    {p.inputValues.rooftop && (
                      <p className="text-xs text-gray-500">
                        <span className="font-bold text-gray-600">🌤️ 재미있었던 것:</span> {p.inputValues.rooftop}
                      </p>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          <div className="px-4 py-6 text-center text-xs text-gray-400">
            ※ 현재 데모 데이터입니다. Supabase 연동 시 실시간 업데이트됩니다.
          </div>
        </>
      )}

      {tab === 'qrcodes' && (
        <div className="px-4 py-6">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 mb-6">
            <p className="text-sm text-blue-700">
              <span className="font-bold">💡 사용법:</span> 각 QR 코드를 다운로드해서 해당 장소에 인쇄해 부착하세요. 스캔하면 자동으로 미션이 시작됩니다.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {LOCATIONS.map((loc) => (
              <motion.div
                key={loc.id}
                className="bg-white rounded-2xl shadow-sm overflow-hidden"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div
                  className="h-24 flex items-center justify-center text-3xl"
                  style={{ background: loc.color }}
                >
                  {loc.emoji}
                </div>
                <div className="p-4">
                  <h3 className="font-black text-sm text-gray-800 mb-1">{loc.name}</h3>
                  <p className="text-xs text-gray-500 mb-3">{loc.floor}</p>
                  <div className="bg-gray-50 rounded-lg p-3 mb-3 flex items-center justify-center h-40">
                    <img
                      src={`/qrcodes/${loc.id}.png`}
                      alt={`${loc.name} QR 코드`}
                      className="max-w-full max-h-full"
                    />
                  </div>
                  <a
                    href={`/qrcodes/${loc.id}.png`}
                    download={`${loc.id}-qrcode.png`}
                    className="w-full block text-center bg-orange-500 text-white font-bold py-2 rounded-lg text-xs hover:bg-orange-600 transition-colors"
                  >
                    📥 다운로드
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {tab === 'realtime' && (
        <div className="px-4 py-6 space-y-4">
          <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4 mb-6">
            <p className="text-sm text-green-700">
              <span className="font-bold">🟢 실시간 완료자:</span> 지금 이 시간에 7개 스탬프를 모두 획득한 사람
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h3 className="font-black text-lg mb-4 text-gray-800">👥 완료 대기자 명단</h3>
            <div className="space-y-2">
              {data.filter(p => p.completedAt).map((p, i) => {
                const completedTime = new Date(p.completedAt!).toLocaleTimeString('ko-KR');
                return (
                  <div key={p.id} className="bg-green-50 rounded-lg p-3 flex items-center justify-between border-l-4 border-green-500">
                    <div>
                      <div className="font-bold text-gray-800">{i + 1}. {p.name}</div>
                      <div className="text-xs text-gray-500">{completedTime}</div>
                    </div>
                    <span className="text-2xl">🎁</span>
                  </div>
                )
              })}
              {data.filter(p => p.completedAt).length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  아직 완료한 사람이 없습니다
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h3 className="font-black text-lg mb-2 text-gray-800">📊 현황 요약</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-orange-50 rounded-lg p-3">
                <div className="text-xs text-gray-600">완료자</div>
                <div className="font-black text-lg text-orange-600">{completed}명</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-xs text-gray-600">미완료자</div>
                <div className="font-black text-lg text-blue-600">{data.length - completed}명</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'analysis' && (
        <div className="px-4 py-6 space-y-6">
          {/* 통계 카드 */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: '평균 완료 시간', value: '1시간 30분', icon: '⏱️' },
              { label: '가장 어려운 미션', value: 'QA룸 (65% 실패)', icon: '❌' },
              { label: '완료율', value: '40% (2명/5명)', icon: '📊' },
              { label: '평균 방문 시간', value: '약 26분/장소', icon: '⏲️' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                className="bg-white rounded-2xl shadow-sm p-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="text-3xl mb-2">{stat.icon}</div>
                <div className="text-sm text-gray-500 mb-1">{stat.label}</div>
                <div className="font-black text-lg text-gray-800">{stat.value}</div>
              </motion.div>
            ))}
          </div>

          {/* 장소별 통계 */}
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h3 className="font-black text-lg mb-4 text-gray-800">📍 장소별 통계</h3>
            <div className="space-y-3">
              {LOCATIONS.map((loc) => {
                const completed = Math.floor(Math.random() * 5) + 1;
                const success = Math.floor((completed / 5) * 100);
                return (
                  <div key={loc.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-gray-700">{loc.emoji} {loc.name}</span>
                      <span className="text-xs text-gray-500">{success}% 성공률</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{ width: `${success}%`, background: loc.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="px-4 py-6 text-center text-xs text-gray-400">
            ※ 현재 데모 데이터입니다. Supabase 연동 시 실시간 업데이트됩니다.
          </div>
        </div>
      )}

      {tab === 'feedback' && (
        <div className="px-4 py-6 space-y-6">
          {/* 재미있었던 순간 */}
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h3 className="font-black text-lg mb-4 text-gray-800">🌟 재미있었던 순간</h3>
            <div className="space-y-3">
              {data
                .filter(p => p.inputValues.rooftop)
                .map((p) => (
                  <div key={p.id} className="bg-yellow-50 rounded-lg p-3 border-l-4 border-yellow-400">
                    <div className="font-bold text-gray-800 mb-1">{p.name}</div>
                    <div className="text-sm text-gray-700">💭 {p.inputValues.rooftop}</div>
                  </div>
                ))}
              {data.filter(p => p.inputValues.rooftop).length === 0 && (
                <div className="text-center py-6 text-gray-400">아직 피드백이 없습니다</div>
              )}
            </div>
          </div>

          {/* 부모님 음료 */}
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h3 className="font-black text-lg mb-4 text-gray-800">☕ 부모님 음료 (데이터 기록)</h3>
            <div className="space-y-2 text-sm">
              {data
                .filter(p => p.inputValues.cafe)
                .map((p) => (
                  <div key={p.id} className="flex items-center justify-between bg-blue-50 rounded-lg p-3">
                    <span className="font-bold text-gray-800">{p.name}</span>
                    <span className="text-gray-700">{p.inputValues.cafe}</span>
                  </div>
                ))}
              {data.filter(p => p.inputValues.cafe).length === 0 && (
                <div className="text-center py-4 text-gray-400">데이터 없음</div>
              )}
            </div>
          </div>

          <div className="px-4 py-6 text-center text-xs text-gray-400">
            ※ 현재 데모 데이터입니다. Supabase 연동 시 실시간 업데이트됩니다.
          </div>
        </div>
      )}

      {tab === 'settings' && (
        <div className="px-4 py-6 space-y-6">
          {/* 게임 설정 */}
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h3 className="font-black text-lg mb-4 text-gray-800">🎮 게임 설정</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">코딩캠프 이름</label>
                <input
                  type="text"
                  defaultValue="2026 미래상상 코딩캠프"
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">필요한 스탬프 수</label>
                <input
                  type="number"
                  defaultValue="7"
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">운영자 비밀번호</label>
                <input
                  type="password"
                  defaultValue="ahnlab2026"
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <button className="w-full bg-orange-500 text-white font-bold py-2 rounded-lg hover:bg-orange-600 transition-colors">
                저장
              </button>
            </div>
          </div>

          {/* 내보내기 */}
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h3 className="font-black text-lg mb-4 text-gray-800">📥 데이터 내보내기</h3>
            <div className="space-y-2">
              <button className="w-full bg-blue-500 text-white font-bold py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm">
                📊 참여자 데이터 (CSV)
              </button>
              <button className="w-full bg-green-500 text-white font-bold py-2 rounded-lg hover:bg-green-600 transition-colors text-sm">
                📈 통계 리포트 (PDF)
              </button>
              <button className="w-full bg-purple-500 text-white font-bold py-2 rounded-lg hover:bg-purple-600 transition-colors text-sm">
                🎖️ 스탬프 기록 (Excel)
              </button>
            </div>
          </div>

          {/* 위험한 작업 */}
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4">
            <h3 className="font-black text-lg mb-4 text-red-700">⚠️ 위험한 작업</h3>
            <button className="w-full bg-red-500 text-white font-bold py-2 rounded-lg hover:bg-red-600 transition-colors text-sm">
              🗑️ 모든 데이터 초기화
            </button>
            <p className="text-xs text-red-600 mt-2">이 작업은 되돌릴 수 없습니다.</p>
          </div>
        </div>
      )}
    </div>
  )
}
