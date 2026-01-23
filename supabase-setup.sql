-- Supabase SQL Editor에서 실행하세요
-- https://supabase.com > 프로젝트 > SQL Editor

-- 1. participants 테이블 생성
CREATE TABLE IF NOT EXISTS participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id TEXT NOT NULL,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. rooms 테이블 생성 (게임 상태 관리)
CREATE TABLE IF NOT EXISTS rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id TEXT NOT NULL UNIQUE,
  started BOOLEAN DEFAULT FALSE,
  started_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_participants_room_id ON participants(room_id);
CREATE INDEX IF NOT EXISTS idx_rooms_room_id ON rooms(room_id);

-- 4. 같은 방에 같은 이름 중복 방지
CREATE UNIQUE INDEX IF NOT EXISTS idx_participants_room_name
ON participants(room_id, name);

-- 5. RLS (Row Level Security) 활성화
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- 6. 모든 사용자가 읽기/쓰기 가능하도록 정책 설정
CREATE POLICY "Allow all operations on participants" ON participants
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on rooms" ON rooms
  FOR ALL USING (true) WITH CHECK (true);

-- 7. Realtime 활성화 (Supabase Dashboard에서 수동 설정 필요)
-- Table Editor > participants > Realtime on 체크
-- Table Editor > rooms > Realtime on 체크
