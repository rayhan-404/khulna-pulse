-- Khulna Pulse API Keys Table
-- Stores Google Maps API keys for admin management

CREATE TABLE IF NOT EXISTS api_keys (
  id BIGSERIAL PRIMARY KEY,
  key_name TEXT NOT NULL DEFAULT 'Google Maps API',
  api_key TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);

-- Enable RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Allow public read (map needs to fetch active key)
CREATE POLICY "Allow public read api_keys" ON api_keys FOR SELECT USING (true);

-- Allow public insert (admin adds keys)
CREATE POLICY "Allow public insert api_keys" ON api_keys FOR INSERT WITH CHECK (true);

-- Allow public update (admin toggles active key)
CREATE POLICY "Allow public update api_keys" ON api_keys FOR UPDATE USING (true);

-- Allow public delete (admin removes keys)
CREATE POLICY "Allow public delete api_keys" ON api_keys FOR DELETE USING (true);

-- Insert initial Google Maps API key
INSERT INTO api_keys (key_name, api_key, is_active)
VALUES ('Google Maps API', 'AIzaSyAeMW2Ko4SqaY42gKNMAMYSFgnEuuFSeDQ', true)
ON CONFLICT DO NOTHING;
