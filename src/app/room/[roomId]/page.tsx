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
  const [participants, setParticipants] = useState<Participant[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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

    return () => {
      supabase.removeChannel(channel)
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
      // 이미 6명이 참여했는지 확인
      if (participants.length >= 6) {
        setError('이미 방이 가득 찼습니다!')
        setLoading(false)
        return
      }

      // 같은 이름이 있는지 확인
      const exists = participants.some(p => p.name === name.trim())
      if (exists) {
        setError('이미 같은 이름이 있습니다!')
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
            <span className="font-bold text-purple-600">{name}</span>님, 환영합니다!
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
                      ? participants[i].name === name
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

          {participants.length < 6 ? (
            <div className="text-center">
              <div className="inline-flex items-center gap-2 text-gray-500">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                다른 참여자를 기다리는 중...
              </div>
            </div>
          ) : (
            <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold text-lg animate-pulse">
              과팅 시작하기! 🚀
            </button>
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
