-- Hackathon account model: one adult can own several child demo profiles and devices.
CREATE TABLE IF NOT EXISTS parent_accounts (
  id uuid PRIMARY KEY,
  display_name text NOT NULL DEFAULT 'Parent Oomi' CHECK (char_length(display_name) BETWEEN 1 AND 80),
  created_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO parent_accounts(id, display_name) VALUES ('00000000-0000-4000-8000-000000000010', 'Parent Oomi') ON CONFLICT (id) DO NOTHING;

ALTER TABLE demo_profiles ADD COLUMN IF NOT EXISTS parent_id uuid;
UPDATE demo_profiles SET parent_id='00000000-0000-4000-8000-000000000010' WHERE parent_id IS NULL;
ALTER TABLE demo_profiles ALTER COLUMN parent_id SET NOT NULL;
ALTER TABLE demo_profiles DROP CONSTRAINT IF EXISTS demo_profiles_parent_id_fkey;
ALTER TABLE demo_profiles ADD CONSTRAINT demo_profiles_parent_id_fkey FOREIGN KEY(parent_id) REFERENCES parent_accounts(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS demo_profiles_parent_idx ON demo_profiles(parent_id);

CREATE TABLE IF NOT EXISTS devices (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES demo_profiles(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  pairing_code_hash text NOT NULL CHECK (char_length(pairing_code_hash) BETWEEN 16 AND 200),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paired','offline')),
  last_seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(owner_id, name)
);
CREATE INDEX IF NOT EXISTS devices_owner_idx ON devices(owner_id, created_at DESC);
