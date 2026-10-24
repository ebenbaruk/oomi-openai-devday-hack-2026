-- Parent-facing records deliberately hold summaries and classifications, never audio
-- nor a child's raw spoken words. This migration is additive and safe after 001.
ALTER TABLE demo_profiles ADD COLUMN IF NOT EXISTS display_name text NOT NULL DEFAULT 'Léo'
  CHECK (char_length(display_name) BETWEEN 1 AND 60);

CREATE TABLE IF NOT EXISTS parent_settings (
  owner_id uuid PRIMARY KEY REFERENCES demo_profiles(id) ON DELETE CASCADE,
  daily_minutes integer NOT NULL DEFAULT 15 CHECK (daily_minutes BETWEEN 1 AND 60),
  quiet_start time,
  quiet_end time,
  bedtime_story_enabled boolean NOT NULL DEFAULT true,
  parent_notifications_enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS parent_care_topics (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES demo_profiles(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('family_change', 'adoption', 'grief', 'other')),
  private_note text CHECK (private_note IS NULL OR char_length(private_note) <= 1000),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(owner_id, kind)
);

CREATE TABLE IF NOT EXISTS discoveries (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES demo_profiles(id) ON DELETE CASCADE,
  session_id uuid REFERENCES voice_sessions(id) ON DELETE SET NULL,
  turn_audit_id uuid UNIQUE REFERENCES turn_audits(id) ON DELETE SET NULL,
  topic text NOT NULL CHECK (char_length(topic) BETWEEN 1 AND 120),
  summary text NOT NULL CHECK (char_length(summary) BETWEEN 1 AND 400),
  activity_title text CHECK (activity_title IS NULL OR char_length(activity_title) <= 120),
  activity_steps jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(activity_steps) = 'array'),
  parent_tip text CHECK (parent_tip IS NULL OR char_length(parent_tip) <= 400),
  status text NOT NULL DEFAULT 'suggested' CHECK (status IN ('suggested', 'completed', 'saved')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS discoveries_owner_created_idx ON discoveries(owner_id, created_at DESC);

CREATE TABLE IF NOT EXISTS memories (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES demo_profiles(id) ON DELETE CASCADE,
  discovery_id uuid REFERENCES discoveries(id) ON DELETE SET NULL,
  kind text NOT NULL CHECK (kind IN ('interest', 'challenge', 'fact', 'preference')),
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 400),
  weight integer NOT NULL DEFAULT 2 CHECK (weight BETWEEN 1 AND 5),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deleted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX IF NOT EXISTS memories_owner_active_idx ON memories(owner_id, created_at DESC) WHERE status = 'active';

CREATE TABLE IF NOT EXISTS stories (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES demo_profiles(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 160),
  summary text NOT NULL CHECK (char_length(summary) BETWEEN 1 AND 600),
  source_discovery_ids jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(source_discovery_ids) = 'array'),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS stories_owner_created_idx ON stories(owner_id, created_at DESC);

CREATE TABLE IF NOT EXISTS parent_alerts (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES demo_profiles(id) ON DELETE CASCADE,
  turn_audit_id uuid REFERENCES turn_audits(id) ON DELETE SET NULL,
  care_topic_id uuid REFERENCES parent_care_topics(id) ON DELETE SET NULL,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 160),
  summary text NOT NULL CHECK (char_length(summary) BETWEEN 1 AND 500),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'dismissed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);
CREATE INDEX IF NOT EXISTS parent_alerts_owner_status_created_idx ON parent_alerts(owner_id, status, created_at DESC);
