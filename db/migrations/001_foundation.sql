CREATE TABLE IF NOT EXISTS demo_profiles (
  id uuid PRIMARY KEY,
  age integer NOT NULL CHECK (age BETWEEN 6 AND 10),
  language text NOT NULL CHECK (language IN ('en', 'fr')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS voice_sessions (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES demo_profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  closed_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS one_active_session_per_owner
  ON voice_sessions(owner_id) WHERE closed_at IS NULL;

-- Operational metadata only. No microphone audio or conversation transcript.
CREATE TABLE IF NOT EXISTS turn_audits (
  id uuid PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES voice_sessions(id) ON DELETE CASCADE,
  verdict text CHECK (verdict IN ('answer', 'grown_up', 'decline')),
  status text NOT NULL CHECK (status IN ('approved', 'blocked', 'fallback', 'ignored', 'cancelled')),
  elapsed_ms integer NOT NULL CHECK (elapsed_ms >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rate_limits (
  bucket text PRIMARY KEY,
  attempts integer NOT NULL DEFAULT 1,
  expires_at timestamptz NOT NULL
);
