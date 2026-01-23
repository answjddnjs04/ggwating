'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'

export default function RoomPage() {
  const params = useParams()
  const roomId = params.roomId as string

  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [joined, setJoined] = useState(false)
  const [participants, setParticipants] = useState<string[]>([])

  const handleJoin = () => {
    if (name.trim() && password.length === 4) {
      // TODO: 실제 서버 연동 시 API 호출
      setParticipants(prev => [...prev, name])
      setJoined(true)
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
            참여 완료! 다른 참여자를 기다리는 중...
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
                      ? 'bg-purple-500 text-white font-medium'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {participants[i] || '대기중'}
                </div>
              ))}
            </div>
          </div>

          {participants.length >= 6 && (
            <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold text-lg">
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
        <p className="text-gray-500 text-center mb-8">
          정보를 입력하고 과팅에 참여하세요!
        </p>

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
            disabled={!name.trim() || password.length !== 4}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold text-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            참여하기
          </button>
        </div>
      </div>
    </main>
  )
}
