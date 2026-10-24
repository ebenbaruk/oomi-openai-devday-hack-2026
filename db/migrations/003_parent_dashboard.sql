-- Complements 002_journal.sql from the shared foundation.
-- Parent notes are private classifications and summaries; raw child audio and
-- utterances are never persisted here.
CREATE TABLE IF NOT EXISTS parent_care_topics (
  id uuid PRIMARY KEY,
  child_id uuid NOT NULL REFERENCES child(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('family_change', 'adoption', 'grief', 'other')),
  private_note text CHECK (private_note IS NULL OR char_length(private_note) <= 1000),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(child_id, kind)
);

CREATE TABLE IF NOT EXISTS parent_alerts (
  id uuid PRIMARY KEY,
  child_id uuid NOT NULL REFERENCES child(id) ON DELETE CASCADE,
  turn_audit_id uuid REFERENCES turn_audits(id) ON DELETE SET NULL,
  care_topic_id uuid REFERENCES parent_care_topics(id) ON DELETE SET NULL,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 160),
  summary text NOT NULL CHECK (char_length(summary) BETWEEN 1 AND 500),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'dismissed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);
CREATE INDEX IF NOT EXISTS parent_alerts_child_status_created_idx ON parent_alerts(child_id, status, created_at DESC);
