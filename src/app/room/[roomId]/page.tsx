'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { getSupabase, Participant } from '@/lib/supabase'

export default function RoomPage() {
  const params = useParams()
  const roomId = params.roomId as string

  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [joined, setJoined] = useState(false)
  const [myName, setMyName] = useState('')
  const [participants, setParticipants] = useState<Participant[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)

  // 실시간 참여자 구독
  useEffect(() => {
    const supabase = getSupabase()
    if (!supabase) return

    const fetchParticipants = async () => {
      const { data } = await supabase
        .from('participants')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })

      if (data) setParticipants(data)
    }

    fetchParticipants()

    // 실시간 구독
    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'participants',
          filter: `room_id=eq.${roomId}`
        },
        () => {
          fetchParticipants()
        }
      )
      .subscribe()

    // 게임 시작 여부 구독 (rooms 테이블)
    const roomChannel = supabase
      .channel(`room-status-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          if (payload.new && (payload.new as { started?: boolean }).started) {
            setGameStarted(true)
          }
        }
      )
      .subscribe()

    // 초기 게임 상태 확인
    const checkGameStatus = async () => {
      const { data } = await supabase
        .from('rooms')
        .select('started')
        .eq('room_id', roomId)
        .single()

      if (data?.started) {
        setGameStarted(true)
      }
    }
    checkGameStatus()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(roomChannel)
    }
  }, [roomId])

  const handleJoin = async () => {
    if (!name.trim() || password.length !== 4) return

    const supabase = getSupabase()
    if (!supabase) {
      setError('서버 연결에 실패했습니다.')
      return
    }

    setLoading(true)
    setError('')

    try {
      // 이미 같은 이름이 있는지 확인
      const existingParticipant = participants.find(p => p.name === name.trim())

      if (existingParticipant) {
        // 기존 참여자 - 비밀번호 확인
        const { data } = await supabase
          .from('participants')
          .select('*')
          .eq('room_id', roomId)
          .eq('name', name.trim())
          .eq('password', password)
          .single()

        if (data) {
          // 비밀번호 일치 - 재입장
          setMyName(name.trim())
          setJoined(true)
        } else {
          setError('비밀번호가 틀립니다!')
        }
        setLoading(false)
        return
      }

      // 새 참여자 - 6명 제한 확인
      if (participants.length >= 6) {
        setError('이미 방이 가득 찼습니다!')
        setLoading(false)
        return
      }

      // 참여자 추가
      const { error: insertError } = await supabase
        .from('participants')
        .insert([
          {
            room_id: roomId,
            name: name.trim(),
            password: password
          }
        ])

      if (insertError) {
        console.error('Insert error:', insertError)
        setError('참여에 실패했습니다. 다시 시도해주세요.')
        setLoading(false)
        return
      }

      setMyName(name.trim())
      setJoined(true)
    } catch (err) {
      console.error('Error:', err)
      setError('오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (joined) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-center mb-2 text-purple-600">
            🎉 {roomId}번 방
          </h1>
          <p className="text-gray-500 text-center mb-6">
            <span className="font-bold text-purple-600">{myName}</span>님, 환영합니다!
          </p>

          <div className="bg-purple-50 rounded-2xl p-4 mb-6">
            <p className="text-sm text-purple-600 font-medium mb-3">
              현재 참여자 ({participants.length}/6)
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl text-center text-sm ${
                    participants[i]
                      ? participants[i].name === myName
                        ? 'bg-pink-500 text-white font-medium ring-2 ring-pink-300'
                        : 'bg-purple-500 text-white font-medium'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {participants[i]?.name || '대기중'}
                </div>
              ))}
            </div>
          </div>

          {gameStarted ? (
            <div className="text-center">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 px-6 rounded-xl">
                <p className="text-lg font-bold">🎊 과팅이 시작되었습니다!</p>
                <p className="text-sm mt-1 opacity-90">자기소개 시간입니다</p>
              </div>
            </div>
          ) : participants.length < 6 ? (
            <div className="text-center">
              <div className="inline-flex items-center gap-2 text-gray-500">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                다른 참여자를 기다리는 중...
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="bg-yellow-100 text-yellow-800 py-3 px-4 rounded-xl">
                <p className="font-medium">📺 탭에서 시작하기를 눌러주세요</p>
                <p className="text-sm mt-1">진행자가 게임을 시작할 때까지 기다려주세요</p>
              </div>
            </div>
          )}
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-2 text-purple-600">
          🎉 {roomId}번 방 참여
        </h1>
        <p className="text-gray-500 text-center mb-2">
          정보를 입력하고 과팅에 참여하세요!
        </p>
        <p className="text-sm text-purple-500 text-center mb-6">
          현재 {participants.length}/6명 참여중
        </p>

        {error && (
          <div className="bg-red-100 text-red-600 p-3 rounded-xl mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이름
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름을 입력하세요"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-lg text-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              비밀번호 (4자리 숫자)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 4)
                setPassword(val)
              }}
              placeholder="****"
              maxLength={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-lg text-center tracking-widest text-gray-800"
            />
            <p className="text-xs text-gray-400 mt-1 text-center">
              재입장 시 같은 이름과 비밀번호를 입력하세요
            </p>
          </div>

          <button
            onClick={handleJoin}
            disabled={!name.trim() || password.length !== 4 || loading || participants.length >= 6}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold text-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '참여 중...' : participants.length >= 6 ? '방이 가득 찼습니다' : '참여하기'}
          </button>
        </div>
      </div>
    </main>
  )
}
