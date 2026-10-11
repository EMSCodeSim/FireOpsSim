-- FireOpsSim Live Crew — isolated Neon database schema
CREATE TABLE IF NOT EXISTS live_sessions (
  code varchar(6) PRIMARY KEY,
  instructor_key_hash text NOT NULL,
  status text NOT NULL DEFAULT 'lobby',
  phase integer NOT NULL DEFAULT 0,
  branch text NOT NULL DEFAULT 'initial',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS live_participants (
  id text PRIMARY KEY,
  session_code varchar(6) NOT NULL REFERENCES live_sessions(code) ON DELETE CASCADE,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('command','engine','truck','rit','engine2')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  last_action jsonb,
  UNIQUE(session_code, role)
);
CREATE TABLE IF NOT EXISTS live_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_code varchar(6) NOT NULL REFERENCES live_sessions(code) ON DELETE CASCADE,
  at timestamptz NOT NULL DEFAULT now(),
  type text NOT NULL,
  text text NOT NULL,
  role text
);
CREATE INDEX IF NOT EXISTS live_events_session_idx ON live_events(session_code, id);
