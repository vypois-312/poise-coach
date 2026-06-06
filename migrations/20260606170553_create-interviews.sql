-- Interview performance metric snapshots (one row per save)
CREATE TABLE interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  face_detected BOOLEAN NOT NULL DEFAULT false,
  head_yaw DOUBLE PRECISION NOT NULL DEFAULT 0,
  head_pitch DOUBLE PRECISION NOT NULL DEFAULT 0,
  head_roll DOUBLE PRECISION NOT NULL DEFAULT 0,
  eye_contact_score DOUBLE PRECISION NOT NULL
    CHECK (eye_contact_score >= 0 AND eye_contact_score <= 1),
  mouth_open_score DOUBLE PRECISION NOT NULL
    CHECK (mouth_open_score >= 0 AND mouth_open_score <= 1),
  smile_score DOUBLE PRECISION NOT NULL DEFAULT 0
    CHECK (smile_score >= 0 AND smile_score <= 1),
  confidence_score DOUBLE PRECISION
    CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1)),
  emotion TEXT NOT NULL
    CHECK (emotion IN ('Happy', 'Neutral', 'Focused', 'Distracted', 'Surprised', 'Confident')),
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX interviews_session_id_idx ON interviews (session_id);
CREATE INDEX interviews_created_at_idx ON interviews (created_at DESC);

ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_interviews" ON interviews
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "users_insert_own_interviews" ON interviews
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON interviews TO authenticated;
GRANT INSERT ON interviews TO authenticated;
