'use client'

import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { getSupabase, Participant } from '@/lib/supabase'

export default function Home() {
  const [roomNumber, setRoomNumber] = useState('')
  const [showQR, setShowQR] = useState(false)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [gameStarted, setGameStarted] = useState(false)
  const [showTimer, setShowTimer] = useState(false)
  const [timeLeft, setTimeLeft] = useState(10 * 60) // 10분 = 600초
  const [gameStartTime, setGameStartTime] = useState<number | null>(null)
  const [showVotePopup, setShowVotePopup] = useState(false)
  const [votingStarted, setVotingStarted] = useState(false)
  const [voteCount, setVoteCount] = useState(0)
  const [coupleCount, setCoupleCount] = useState(0)
  const [votingComplete, setVotingComplete] = useState(false)

  const roomUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/room/${roomNumber}`
    : `/room/${roomNumber}`

  // 실시간 참여자 구독 + 방 상태 복원
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

    // 투표 수 가져오기 + 커플 매칭
    const fetchVoteCount = async () => {
      const { data } = await supabase
        .from('votes')
        .select('voter_name, target_name')
        .eq('room_id', roomNumber)

      if (data) {
        // 중복 제거 (한 사람당 하나의 투표)
        const uniqueVoters = new Set(data.map(v => v.voter_name))
        const count = uniqueVoters.size
        setVoteCount(count)

        // 6명 모두 투표 완료 시 커플 계산
        if (count >= 6) {
          setVotingComplete(true)
          // 서로 투표한 커플 찾기
          let couples = 0
          const votes = data as { voter_name: string; target_name: string }[]
          const checked = new Set<string>()

          for (const vote of votes) {
            const pair = `${vote.voter_name}-${vote.target_name}`
            const reversePair = `${vote.target_name}-${vote.voter_name}`

            if (!checked.has(pair) && !checked.has(reversePair)) {
              // 상대방도 나에게 투표했는지 확인
              const mutual = votes.find(
                v => v.voter_name === vote.target_name && v.target_name === vote.voter_name
              )
              if (mutual) {
                couples++
                checked.add(pair)
                checked.add(reversePair)
              }
            }
          }
          setCoupleCount(couples)
        }
      }
    }

    // 방 상태 복원
    const restoreRoomState = async () => {
      const { data } = await supabase
        .from('rooms')
        .select('started, voting, started_at')
        .eq('room_id', roomNumber)
        .single()

      if (data) {
        if (data.voting) {
          // 투표 진행 중
          setGameStarted(true)
          setVotingStarted(true)
          fetchVoteCount()
        } else if (data.started) {
          // 게임 시작됨, 타이머 복원
          setGameStarted(true)
          if (data.started_at) {
            const startedAt = new Date(data.started_at).getTime()
            setGameStartTime(startedAt)
            const elapsed = Math.floor((Date.now() - startedAt) / 1000)
            const remaining = Math.max(0, 10 * 60 - elapsed)
            setTimeLeft(remaining)
          }
        }
      }
    }

    fetchParticipants()
    restoreRoomState()

    // 실시간 참여자 구독
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

    // 실시간 투표 구독
    const voteChannel = supabase
      .channel(`votes-${roomNumber}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'votes',
          filter: `room_id=eq.${roomNumber}`
        },
        () => {
          fetchVoteCount()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(voteChannel)
    }
  }, [showQR, roomNumber])

  const handleCreateRoom = () => {
    if (roomNumber.trim()) {
      setShowQR(true)
    }
  }

  // 타이머 효과 + 10분 지나면 자동 팝업
  useEffect(() => {
    if (!gameStarted || !gameStartTime) return

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - gameStartTime) / 1000)
      const remaining = Math.max(0, 10 * 60 - elapsed)
      setTimeLeft(remaining)

      // 10분이 지나면 자동으로 투표 팝업
      if (remaining === 0 && !showVotePopup && !votingStarted) {
        setShowVotePopup(true)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [gameStarted, gameStartTime, showVotePopup, votingStarted])

  const handleStartGame = async () => {
    const supabase = getSupabase()
    if (!supabase) {
      console.error('Supabase not initialized')
      return
    }

    console.log('Starting game for room:', roomNumber)

    // rooms 테이블에 시작 상태 저장
    const { error } = await supabase
      .from('rooms')
      .upsert([
        {
          room_id: roomNumber,
          started: true,
          voting: false,
          started_at: new Date().toISOString()
        }
      ], { onConflict: 'room_id' })

    if (error) {
      console.error('Error starting game:', error)
      alert('게임 시작에 실패했습니다: ' + error.message)
      return
    }

    console.log('Game started successfully')
    setGameStartTime(Date.now())
    setGameStarted(true)
  }

  const handleStartVoting = async () => {
    const supabase = getSupabase()
    if (!supabase) return

    // rooms 테이블에 투표 상태 저장
    await supabase
      .from('rooms')
      .update({ voting: true })
      .eq('room_id', roomNumber)

    setShowVotePopup(false)
    setVotingStarted(true)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // 투표 팝업
  if (showVotePopup) {
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

        <div className="max-w-2xl mx-auto pt-8">
          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
            <div className="text-6xl mb-4">❤️</div>
            <h1 className="text-3xl font-bold mb-2 text-purple-600">
              첫인상
            </h1>
            <p className="text-gray-600 mb-8 text-lg">
              첫인상 투표 시간이 되었습니다.<br/>
              준비가 되었다면 진행버튼을 눌러주세요
            </p>
            <button
              onClick={handleStartVoting}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl font-bold text-xl hover:opacity-90 transition"
            >
              진행하기
            </button>
          </div>
        </div>
      </main>
    )
  }

  // 투표 시작됨 (참여자들이 투표 중)
  if (votingStarted) {
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

        <div className="max-w-2xl mx-auto pt-8">
          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
            {votingComplete ? (
              <>
                <div className="text-6xl mb-4">💑</div>
                <h1 className="text-3xl font-bold mb-2 text-purple-600">
                  투표 완료!
                </h1>
                <p className="text-gray-600 mb-6">
                  모든 참여자가 투표를 완료했습니다
                </p>

                {/* 커플 결과 */}
                <div className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-xl p-6 mb-4">
                  <p className="text-sm text-gray-500 mb-2">성사된 커플</p>
                  <p className="text-5xl font-bold text-pink-500 mb-2">
                    {coupleCount}
                  </p>
                  <p className="text-lg text-purple-600 font-medium">
                    {coupleCount > 0 ? '커플이 탄생했습니다! 🎉' : '아쉽게도 매칭된 커플이 없습니다'}
                  </p>
                </div>

                <p className="text-xs text-gray-400">
                  누가 매칭되었는지는 비밀입니다 🤫
                </p>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">💕</div>
                <h1 className="text-3xl font-bold mb-2 text-purple-600">
                  첫인상 투표 진행 중
                </h1>
                <p className="text-gray-600 mb-4">
                  참여자들이 투표하고 있습니다
                </p>

                {/* 투표 현황 */}
                <div className="bg-purple-50 rounded-xl p-4 mb-4">
                  <p className="text-lg font-bold text-purple-600">
                    {voteCount} / 6 명 투표 완료
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 text-purple-500">
                  <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                  <span>투표 대기 중...</span>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    )
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
            <p className="text-gray-500 text-center mb-6">
              {roomNumber}번 방 - ❤️ 첫인상
            </p>

            {/* 알림 스타일 메시지 */}
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-2xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="bg-pink-500 rounded-full p-2 flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed pt-1">
                  잠시후 있을 <span className="font-bold text-pink-600">첫인상 투표</span>까지 자유롭게 대화 해 주세요!
                </p>
              </div>
            </div>

            {/* 타이머 영역 */}
            <div className="mb-6">
              <div
                className={`text-center py-4 rounded-xl transition-all duration-300 ${
                  showTimer
                    ? 'bg-purple-100 text-purple-600'
                    : 'bg-gray-100 text-gray-100'
                }`}
              >
                <p className="text-3xl font-bold font-mono">
                  {formatTime(timeLeft)}
                </p>
              </div>
            </div>

            {/* 버튼들 */}
            <div className="space-y-3">
              <button
                onClick={() => setShowTimer(!showTimer)}
                className={`w-full py-3 rounded-xl font-medium transition ${
                  showTimer
                    ? 'bg-purple-100 text-purple-600 border-2 border-purple-300'
                    : 'bg-gray-100 text-gray-600 border-2 border-gray-200'
                }`}
              >
                {showTimer ? '⏱️ 남은 시간 숨기기' : '⏱️ 남은 시간 보기'}
              </button>

              <button
                onClick={() => setShowVotePopup(true)}
                className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-4 rounded-xl font-bold text-lg hover:opacity-90 transition"
              >
                💕 바로 투표하기
              </button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full relative">
        {showQR && (
          <button
            onClick={() => {
              setShowQR(false)
              setRoomNumber('')
              setParticipants([])
            }}
            className="absolute top-6 left-6 text-gray-400 hover:text-purple-600 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
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
            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-sm text-purple-600 font-medium mb-3 text-center">
                현재 참여자 ({participants.length}/6)
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[...Array(6)].map((_, i) => {
                  const participant = participants[i]
                  let blockClass = 'bg-gray-200 text-gray-400'

                  if (participant) {
                    blockClass = participant.gender === 'male'
                      ? 'bg-blue-500 text-white font-medium'
                      : 'bg-pink-500 text-white font-medium'
                  }

                  return (
                    <div
                      key={i}
                      className={`p-3 rounded-xl text-center text-sm ${blockClass}`}
                    >
                      {participant?.name || '대기중'}
                    </div>
                  )
                })}
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
