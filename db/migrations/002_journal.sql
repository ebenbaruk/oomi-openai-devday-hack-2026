-- Oomi journal schema (spec §7.8 / §7.9): children, settings, discoveries, memory, stories, background jobs.
-- Rule: no audio, no full transcript, no behavioural profile. Only the child's question, topics, activities and summaries.

CREATE TABLE IF NOT EXISTS child (
  id uuid PRIMARY KEY,
  first_name text NOT NULL,
  age integer NOT NULL CHECK (age BETWEEN 6 AND 10),
  language text NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'fr')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS settings (
  child_id uuid PRIMARY KEY REFERENCES child(id) ON DELETE CASCADE,
  max_session_minutes integer NOT NULL DEFAULT 4 CHECK (max_session_minutes BETWEEN 1 AND 30),
  allowed_hours jsonb NOT NULL DEFAULT '{"start":"08:00","end":"20:00","timezone":"Europe/Paris"}'::jsonb,
  story_enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- One card in the parent journal. `activity` follows the Discovery schema in src/lib/contracts.ts.
CREATE TABLE IF NOT EXISTS discovery (
  id uuid PRIMARY KEY,
  child_id uuid NOT NULL REFERENCES child(id) ON DELETE CASCADE,
  session_id uuid REFERENCES voice_sessions(id) ON DELETE SET NULL,
  verdict text NOT NULL CHECK (verdict IN ('answer', 'grown_up', 'decline')),
  question text NOT NULL,
  topic text,
  emoji text,
  summary text,
  spoken_text text,
  activity jsonb,
  image_url text,
  image_status text NOT NULL DEFAULT 'none' CHECK (image_status IN ('none', 'pending', 'ready', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS discovery_child_created ON discovery(child_id, created_at DESC);

-- Structured educational facts only. Parents can read and delete every row.
CREATE TABLE IF NOT EXISTS memory (
  id uuid PRIMARY KEY,
  child_id uuid NOT NULL REFERENCES child(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('interest', 'challenge', 'fact', 'preference')),
  content text NOT NULL,
  weight integer NOT NULL DEFAULT 1 CHECK (weight >= 0),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done', 'archived')),
  source_discovery_id uuid REFERENCES discovery(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS memory_child_kind ON memory(child_id, kind, status);

CREATE TABLE IF NOT EXISTS story (
  id uuid PRIMARY KEY,
  child_id uuid NOT NULL REFERENCES child(id) ON DELETE CASCADE,
  title text NOT NULL,
  text text NOT NULL,
  source_discovery_ids uuid[] NOT NULL DEFAULT '{}',
  image_urls text[] NOT NULL DEFAULT '{}',
  image_status text NOT NULL DEFAULT 'none' CHECK (image_status IN ('none', 'pending', 'ready', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS story_child_created ON story(child_id, created_at DESC);

-- Resumable background work (illustrations, story generation, memory consolidation).
CREATE TABLE IF NOT EXISTS job (
  id uuid PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('discovery_image', 'story_text', 'story_images', 'memory_consolidation')),
  idempotency_key text NOT NULL UNIQUE,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'done', 'failed')),
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS job_status ON job(status, created_at);

-- Link the existing demo profile and sessions to a real child row.
ALTER TABLE voice_sessions ADD COLUMN IF NOT EXISTS child_id uuid REFERENCES child(id) ON DELETE SET NULL;
ALTER TABLE turn_audits ADD COLUMN IF NOT EXISTS discovery_id uuid REFERENCES discovery(id) ON DELETE SET NULL;

-- Hackathon demo child (adult-operated). Same fixed id as DEMO_OWNER in src/server/db.ts.
INSERT INTO child(id, first_name, age, language)
VALUES ('00000000-0000-4000-8000-000000000001', 'Léo', 7, 'en')
ON CONFLICT (id) DO NOTHING;
INSERT INTO settings(child_id) VALUES ('00000000-0000-4000-8000-000000000001')
ON CONFLICT (child_id) DO NOTHING;
