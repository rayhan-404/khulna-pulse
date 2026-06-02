-- Khulna Pulse Reports Table
CREATE TABLE IF NOT EXISTS reports (
  id BIGSERIAL PRIMARY KEY,
  place TEXT NOT NULL,
  cause TEXT NOT NULL,
  sev TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  details TEXT DEFAULT '',
  upvotes INTEGER DEFAULT 0,
  reporter TEXT NOT NULL DEFAULT 'Anonymous',
  flagged BOOLEAN DEFAULT FALSE,
  deleted BOOLEAN DEFAULT FALSE,
  created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  duration_minutes INTEGER DEFAULT 60,
  expires_at BIGINT
);

-- Add columns if they don't exist (safe for re-runs)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'duration_minutes') THEN
    ALTER TABLE reports ADD COLUMN duration_minutes INTEGER DEFAULT 60;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'expires_at') THEN
    ALTER TABLE reports ADD COLUMN expires_at BIGINT;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Allow public read
CREATE POLICY "Allow public read" ON reports FOR SELECT USING (true);

-- Allow public insert
CREATE POLICY "Allow public insert" ON reports FOR INSERT WITH CHECK (true);

-- Allow public update
CREATE POLICY "Allow public update" ON reports FOR UPDATE USING (true);

-- RPC function for incrementing upvotes
CREATE OR REPLACE FUNCTION increment_upvotes(report_id BIGINT) RETURNS INTEGER AS $$
  UPDATE reports SET upvotes = COALESCE(upvotes, 0) + 1 WHERE id = report_id RETURNING upvotes;
$$ LANGUAGE sql SECURITY DEFINER;
