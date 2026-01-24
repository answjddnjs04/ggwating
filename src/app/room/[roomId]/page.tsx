'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { getSupabase, Participant } from '@/lib/supabase'

export default function RoomPage() {
  const params = useParams()
  const roomId = params.roomId as string

  const [name, setName] = useState('')
  const [gender, setGender] = useState<'male' | 'female' | ''>('')
  const [joined, setJoined] = useState(false)
  const [myName, setMyName] = useState('')
  const [myGender, setMyGender] = useState<'male' | 'female'>('male')
  const [participants, setParticipants] = useState<Participant[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [showVotePopup, setShowVotePopup] = useState(false)
  const [isVoting, setIsVoting] = useState(false)
  const [selectedPeople, setSelectedPeople] = useState<string[]>([])
  const [hasVoted, setHasVoted] = useState(false)
  const [voteSubmitting, setVoteSubmitting] = useState(false)

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
          const newData = payload.new as { started?: boolean; voting?: boolean }
          if (newData?.started) {
            setGameStarted(true)
          }
          if (newData?.voting) {
            setShowVotePopup(true)
          }
        }
      )
      .subscribe()

    // 초기 게임 상태 확인
    const checkGameStatus = async () => {
      const { data } = await supabase
        .from('rooms')
        .select('started, voting')
        .eq('room_id', roomId)
        .single()

      if (data?.started) {
        setGameStarted(true)
      }
      if (data?.voting) {
        setShowVotePopup(true)
      }
    }
    checkGameStatus()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(roomChannel)
    }
  }, [roomId])

  const handleJoin = async () => {
    if (!name.trim() || !gender) return

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
        // 기존 참여자 - 성별 확인
        if (existingParticipant.gender !== gender) {
          setError('이름과 성별이 일치하지 않습니다.')
          setLoading(false)
          return
        }

        // 성별 일치 - 바로 입장
        setMyName(name.trim())
        setMyGender(existingParticipant.gender)
        setJoined(true)

        // 이미 투표했는지 확인
        const { data: voteData } = await supabase
          .from('votes')
          .select('id')
          .eq('room_id', roomId)
          .eq('voter_name', name.trim())
          .limit(1)

        if (voteData && voteData.length > 0) {
          setHasVoted(true)
          setIsVoting(true) // 투표 화면으로 이동 (완료 상태로)
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
            gender: gender
          }
        ])

      if (insertError) {
        console.error('Insert error:', insertError)
        setError('참여에 실패했습니다. 다시 시도해주세요.')
        setLoading(false)
        return
      }

      setMyName(name.trim())
      setMyGender(gender)
      setJoined(true)
    } catch (err) {
      console.error('Error:', err)
      setError('오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 이성 참여자 필터
  const oppositeGenderParticipants = participants.filter(p => p.gender !== myGender)

  // 투표 제출 함수
  const handleSubmitVote = async () => {
    if (selectedPeople.length === 0 || voteSubmitting) return

    setVoteSubmitting(true)

    const supabase = getSupabase()
    if (!supabase) {
      setVoteSubmitting(false)
      return
    }

    try {
      // votes 테이블에 투표 저장
      const voteData = selectedPeople.map(targetName => ({
        room_id: roomId,
        voter_name: myName,
        target_name: targetName
      }))

      const { error } = await supabase
        .from('votes')
        .insert(voteData)

      if (error) {
        console.error('Vote error:', error)
        alert('투표 저장에 실패했습니다.')
        setVoteSubmitting(false)
        return
      }

      setHasVoted(true)
    } catch (err) {
      console.error('Vote error:', err)
    } finally {
      setVoteSubmitting(false)
    }
  }

  if (joined) {
    // 투표 완료 화면
    if (hasVoted) {
      return (
        <main className="min-h-screen flex flex-col items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-2xl font-bold mb-2 text-purple-600">
              투표 완료!
            </h1>
            <p className="text-gray-600 mb-4">
              <span className="font-bold text-pink-500">{selectedPeople[0]}</span>님에게 투표했습니다
            </p>
            <div className="bg-purple-50 rounded-xl p-4">
              <p className="text-sm text-purple-600">
                다른 참여자들의 투표를 기다리는 중...
              </p>
              <div className="flex justify-center mt-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </main>
      )
    }

    // 투표 화면
    if (isVoting) {
      const selectPerson = (name: string) => {
        // 한 명만 선택 가능 - 같은 사람 클릭하면 해제, 다른 사람 클릭하면 변경
        setSelectedPeople(prev =>
          prev.includes(name) ? [] : [name]
        )
      }

      return (
        <main className="min-h-screen flex flex-col items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
            <h1 className="text-2xl font-bold text-center mb-2 text-purple-600">
              ❤️ 첫인상 투표
            </h1>
            <p className="text-gray-500 text-center mb-6">
              가장 마음에 드는 이성 한 명을 선택해주세요
            </p>

            <div className="space-y-3 mb-6">
              {oppositeGenderParticipants.map((p) => (
                <button
                  key={p.id}
                  onClick={() => selectPerson(p.name)}
                  className={`w-full p-4 rounded-xl text-left transition flex items-center justify-between ${
                    selectedPeople.includes(p.name)
                      ? 'bg-pink-500 text-white ring-2 ring-pink-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="font-medium">{p.name}</span>
                  {selectedPeople.includes(p.name) && (
                    <span className="text-xl">💕</span>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={handleSubmitVote}
              disabled={selectedPeople.length === 0 || voteSubmitting}
              className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-4 rounded-xl font-bold text-lg hover:opacity-90 transition disabled:opacity-50"
            >
              {voteSubmitting ? '제출 중...' : '투표 완료'}
            </button>
          </div>
        </main>
      )
    }

    // 투표 팝업
    if (showVotePopup) {
      return (
        <main className="min-h-screen flex flex-col items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
            <div className="text-5xl mb-4">❤️</div>
            <h1 className="text-2xl font-bold mb-2 text-purple-600">
              첫인상
            </h1>
            <p className="text-gray-600 mb-6">
              첫인상 투표 시간이 되었습니다.<br/>
              준비가 되었다면 진행버튼을 눌러주세요
            </p>
            <button
              onClick={() => {
                setShowVotePopup(false)
                setIsVoting(true)
              }}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl font-bold text-lg hover:opacity-90 transition"
            >
              진행하기
            </button>
          </div>
        </main>
      )
    }

    // 게임 시작 후 화면
    if (gameStarted) {
      return (
        <main className="min-h-screen flex flex-col items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
            <h1 className="text-3xl font-bold text-center mb-2 text-purple-600">
              🎊 과팅 시작!
            </h1>
            <p className="text-gray-500 text-center mb-6">
              {roomId}번 방 - ❤️ 첫인상
            </p>

            {/* 알림 스타일 메시지 */}
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-2xl p-4">
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
          </div>
        </main>
      )
    }

    // 대기 중 화면
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-center mb-2 text-purple-600">
            🎉 {roomId}번 방
          </h1>
          <p className="text-gray-500 text-center mb-6">
            <span className="font-bold text-purple-600">{myName}</span>님, 환영합니다!
          </p>

          <div className="bg-gray-50 rounded-2xl p-4 mb-6">
            <p className="text-sm text-purple-600 font-medium mb-3">
              현재 참여자 ({participants.length}/6)
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[...Array(6)].map((_, i) => {
                const participant = participants[i]
                let blockClass = 'bg-gray-200 text-gray-400'

                if (participant) {
                  const isMe = participant.name === myName
                  if (participant.gender === 'male') {
                    blockClass = isMe
                      ? 'bg-blue-500 text-white font-medium ring-2 ring-blue-300 ring-offset-1'
                      : 'bg-blue-400 text-white font-medium'
                  } else {
                    blockClass = isMe
                      ? 'bg-pink-500 text-white font-medium ring-2 ring-pink-300 ring-offset-1'
                      : 'bg-pink-400 text-white font-medium'
                  }
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

          {participants.length < 6 ? (
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
            <p className="text-xs text-gray-400 mt-1 text-center">
              재입장 시 같은 이름을 입력하세요
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              성별
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setGender('male')}
                className={`py-3 rounded-xl font-medium transition ${
                  gender === 'male'
                    ? 'bg-blue-500 text-white ring-2 ring-blue-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                🙋‍♂️ 남성
              </button>
              <button
                type="button"
                onClick={() => setGender('female')}
                className={`py-3 rounded-xl font-medium transition ${
                  gender === 'female'
                    ? 'bg-pink-500 text-white ring-2 ring-pink-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                🙋‍♀️ 여성
              </button>
            </div>
          </div>

          <button
            onClick={handleJoin}
            disabled={!name.trim() || !gender || loading}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold text-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '참여 중...' : '참여하기'}
          </button>
          {participants.length >= 6 && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              기존 참여자는 같은 이름으로 재입장 가능
            </p>
          )}
        </div>
      </div>
    </main>
  )
}
