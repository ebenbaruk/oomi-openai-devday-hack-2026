-- The Watch owns no OpenAI credential. A six-digit pairing code is stored as a hash,
-- and binds a Watch turn to the existing child journal record.
CREATE TABLE IF NOT EXISTS watch_devices (
  id uuid PRIMARY KEY,
  child_id uuid NOT NULL REFERENCES child(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  pairing_code_hash text NOT NULL CHECK (char_length(pairing_code_hash) = 64),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paired', 'offline')),
  last_seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(child_id, name)
);
CREATE INDEX IF NOT EXISTS watch_devices_child_idx ON watch_devices(child_id, created_at DESC);
