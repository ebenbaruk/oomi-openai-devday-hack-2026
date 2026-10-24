-- Oomi app schema. Idempotent: safe to run on every deploy.
-- Lives in its own schema so it never collides with other experiments in the same database.
-- No audio and no full transcripts are ever stored: only questions, topics and summaries.

CREATE SCHEMA IF NOT EXISTS oomi_app;

CREATE TABLE IF NOT EXISTS oomi_app.child (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  age integer NOT NULL CHECK (age BETWEEN 4 AND 12),
  language text NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'fr')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS oomi_app.settings (
  child_id uuid PRIMARY KEY REFERENCES oomi_app.child(id) ON DELETE CASCADE,
  max_session_minutes integer NOT NULL DEFAULT 20 CHECK (max_session_minutes BETWEEN 5 AND 120),
  allowed_start time NOT NULL DEFAULT '07:00',
  allowed_end time NOT NULL DEFAULT '20:30',
  story_enabled boolean NOT NULL DEFAULT true,
  timezone text NOT NULL DEFAULT 'Europe/Paris',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS oomi_app.discovery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES oomi_app.child(id) ON DELETE CASCADE,
  verdict text NOT NULL CHECK (verdict IN ('answer', 'grown_up', 'decline')),
  question text NOT NULL,
  topic text,
  emoji text,
  summary text,
  activity jsonb,
  image_id uuid,
  status text NOT NULL DEFAULT 'ready' CHECK (status IN ('pending', 'ready')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE oomi_app.discovery ADD COLUMN IF NOT EXISTS intent text NOT NULL DEFAULT 'question'
  CHECK (intent IN ('question', 'challenge_report'));
CREATE INDEX IF NOT EXISTS discovery_child_created ON oomi_app.discovery (child_id, created_at DESC);

CREATE TABLE IF NOT EXISTS oomi_app.memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES oomi_app.child(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('interest', 'challenge', 'fact', 'preference')),
  content text NOT NULL,
  weight integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done')),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS memory_unique_content ON oomi_app.memory (child_id, kind, lower(content));

CREATE TABLE IF NOT EXISTS oomi_app.story (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES oomi_app.child(id) ON DELETE CASCADE,
  title text NOT NULL,
  pages jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS oomi_app.safety_alert (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES oomi_app.child(id) ON DELETE CASCADE,
  question text NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Generated illustrations. Stored in Postgres to keep the stack to a single managed service.
CREATE TABLE IF NOT EXISTS oomi_app.image (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mime text NOT NULL,
  data bytea NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- One row per voice session, used to enforce the parent's max session length.
CREATE TABLE IF NOT EXISTS oomi_app.voice_session (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES oomi_app.child(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_turn_at timestamptz NOT NULL DEFAULT now()
);

-- Seed the single demo child.
INSERT INTO oomi_app.child (id, first_name, age, language)
VALUES ('00000000-0000-4000-8000-000000000001', 'Leo', 7, 'en')
ON CONFLICT (id) DO NOTHING;
INSERT INTO oomi_app.settings (child_id)
VALUES ('00000000-0000-4000-8000-000000000001')
ON CONFLICT (child_id) DO NOTHING;

-- v2: languages, activities done together, Oomi TV explainers, cached narration.
ALTER TABLE oomi_app.discovery ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'en';
ALTER TABLE oomi_app.discovery ADD COLUMN IF NOT EXISTS done_at timestamptz;
ALTER TABLE oomi_app.settings ADD COLUMN IF NOT EXISTS videos_enabled boolean NOT NULL DEFAULT true;
ALTER TABLE oomi_app.story ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'en';
ALTER TABLE oomi_app.story ADD COLUMN IF NOT EXISTS audio_id uuid;

-- Narration audio and other generated media that are not pictures.
CREATE TABLE IF NOT EXISTS oomi_app.media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mime text NOT NULL,
  data bytea NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Oomi TV: a short motion-design explainer of one discovery, replayable on the family tablet.
CREATE TABLE IF NOT EXISTS oomi_app.explainer (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES oomi_app.child(id) ON DELETE CASCADE,
  discovery_id uuid NOT NULL UNIQUE REFERENCES oomi_app.discovery(id) ON DELETE CASCADE,
  language text NOT NULL DEFAULT 'en',
  title text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ready', 'failed')),
  scenes jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Demo content is upserted by key, so re-seeding before a demo only refreshes dates (no new images).
ALTER TABLE oomi_app.discovery ADD COLUMN IF NOT EXISTS seed_key text UNIQUE;
ALTER TABLE oomi_app.story ADD COLUMN IF NOT EXISTS seed_key text UNIQUE;

-- v3: the family's own mascot (look, name, voice, personality) and its generated portraits.
ALTER TABLE oomi_app.settings ADD COLUMN IF NOT EXISTS mascot jsonb;
CREATE TABLE IF NOT EXISTS oomi_app.mascot_portrait (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES oomi_app.child(id) ON DELETE CASCADE,
  image_id uuid NOT NULL,
  species text NOT NULL,
  config jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
