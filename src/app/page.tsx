'use client'

import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { getSupabase, Participant } from '@/lib/supabase'

export default function Home() {
  const [roomNumber, setRoomNumber] = useState('')
  const [showQR, setShowQR] = useState(false)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [gameStarted, setGameStarted] = useState(false)

  const roomUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/room/${roomNumber}`
    : `/room/${roomNumber}`

  // 실시간 참여자 구독
  useEffect(() => {
    if (!showQR || !roomNumber) return

    const supabase = getSupabase()
    if (!supabase) return

    // 초기 데이터 로드
    const fetchParticipants = async () => {
      const { data } = await supabase
        .from('participants')
        .select('*')
        .eq('room_id', roomNumber)
        .order('created_at', { ascending: true })

      if (data) setParticipants(data)
    }

    fetchParticipants()

    // 실시간 구독
    const channel = supabase
      .channel(`room-${roomNumber}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'participants',
          filter: `room_id=eq.${roomNumber}`
        },
        () => {
          fetchParticipants()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [showQR, roomNumber])

  const handleCreateRoom = () => {
    if (roomNumber.trim()) {
      setShowQR(true)
    }
  }

  const handleStartGame = async () => {
    const supabase = getSupabase()
    if (!supabase) return

    // rooms 테이블에 시작 상태 저장
    const { error } = await supabase
      .from('rooms')
      .upsert([
        {
          room_id: roomNumber,
          started: true,
          started_at: new Date().toISOString()
        }
      ], { onConflict: 'room_id' })

    if (!error) {
      setGameStarted(true)
    }
  }

  // 과팅 시작 후 화면
  if (gameStarted) {
    return (
      <main className="min-h-screen p-4">
        {/* QR 코드 우측 상단 고정 */}
        <div className="fixed top-4 right-4 bg-white rounded-2xl shadow-lg p-3 z-50">
          <QRCodeSVG
            value={roomUrl}
            size={80}
            level="H"
            includeMargin={false}
          />
          <p className="text-xs text-center text-gray-500 mt-1">{roomNumber}번 방</p>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="max-w-2xl mx-auto pt-8">
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <h1 className="text-3xl font-bold text-center mb-2 text-purple-600">
              🎊 과팅 시작!
            </h1>
            <p className="text-gray-500 text-center mb-8">
              {roomNumber}번 방 - 자기소개 시간
            </p>

            {/* 참여자 목록 */}
            <div className="bg-purple-50 rounded-2xl p-6 mb-6">
              <p className="text-sm text-purple-600 font-medium mb-4 text-center">
                참여자 ({participants.length}명)
              </p>
              <div className="grid grid-cols-3 gap-3">
                {participants.map((p, i) => (
                  <div
                    key={i}
                    className="bg-purple-500 text-white p-4 rounded-xl text-center font-medium"
                  >
                    {p.name}
                  </div>
                ))}
              </div>
            </div>

            {/* 타이머 영역 (추후 구현) */}
            <div className="text-center">
              <p className="text-gray-400 text-sm">
                자유롭게 자기소개를 해주세요!
              </p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-4xl font-bold text-center mb-2 text-purple-600">
          🎉 GGWATING
        </h1>
        <p className="text-gray-500 text-center mb-8">
          과팅을 더 즐겁게!
        </p>

        {!showQR ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                방 번호를 입력하세요
              </label>
              <input
                type="text"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                placeholder="예: 101"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-lg text-center text-gray-800"
              />
            </div>
            <button
              onClick={handleCreateRoom}
              disabled={!roomNumber.trim()}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold text-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              QR 코드 생성
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-gray-600 mb-2">
                <span className="font-bold text-purple-600">{roomNumber}번</span> 방
              </p>
              <p className="text-sm text-gray-500">
                아래 QR 코드를 스캔하여 참여하세요!
              </p>
            </div>

            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-2xl shadow-lg">
                <QRCodeSVG
                  value={roomUrl}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
            </div>

            {/* 참여자 현황 */}
            <div className="bg-purple-50 rounded-2xl p-4">
              <p className="text-sm text-purple-600 font-medium mb-3 text-center">
                현재 참여자 ({participants.length}/6)
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-xl text-center text-sm ${
                      participants[i]
                        ? 'bg-purple-500 text-white font-medium'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {participants[i]?.name || '대기중'}
                  </div>
                ))}
              </div>
            </div>

            {/* 과팅 시작 버튼 (6명 모였을 때만 활성화) */}
            {participants.length >= 6 ? (
              <button
                onClick={handleStartGame}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-xl font-bold text-xl hover:opacity-90 transition animate-pulse"
              >
                🚀 과팅 시작하기!
              </button>
            ) : (
              <div className="text-center">
                <div className="inline-flex items-center gap-2 text-gray-500">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                  {6 - participants.length}명 더 필요합니다
                </div>
              </div>
            )}

            <div className="text-center">
              <p className="text-xs text-gray-400 break-all">
                {roomUrl}
              </p>
            </div>
          </div>
        )}
      </div>

      <p className="text-white/70 text-sm mt-8">
        오프라인 과팅 도우미 서비스
      </p>
    </main>
  )
}
