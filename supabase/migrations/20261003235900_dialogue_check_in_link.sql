-- Link a Catalyst's check-in acknowledgement to the check-in it reviews.
-- Ordinary goal replies keep check_in_id null, so only an explicit
-- acknowledgement marks a check-in as reviewed.
-- Runs after 20261003161514_planter_workspace, which creates check_ins.

ALTER TABLE dialogue_messages
  ADD COLUMN IF NOT EXISTS check_in_id uuid REFERENCES check_ins(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS dialogue_messages_check_in_id_idx
  ON dialogue_messages (check_in_id);
