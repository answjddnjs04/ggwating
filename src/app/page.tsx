'use client'

import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

export default function Home() {
  const [roomNumber, setRoomNumber] = useState('')
  const [showQR, setShowQR] = useState(false)

  const handleCreateRoom = () => {
    if (roomNumber.trim()) {
      setShowQR(true)
    }
  }

  const roomUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/room/${roomNumber}`
    : `/room/${roomNumber}`

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

            <div className="text-center">
              <p className="text-xs text-gray-400 break-all">
                {roomUrl}
              </p>
            </div>

            <button
              onClick={() => setShowQR(false)}
              className="w-full bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition"
            >
              다른 방 만들기
            </button>
          </div>
        )}
      </div>

      <p className="text-white/70 text-sm mt-8">
        오프라인 과팅 도우미 서비스
      </p>
    </main>
  )
}
