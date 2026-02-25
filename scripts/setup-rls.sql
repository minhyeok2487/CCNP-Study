-- ============================================================
-- Supabase RLS (Row Level Security) Setup for CCNP Study
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable RLS on all user tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_topic_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_checklist_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE spaced_repetition ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_tags ENABLE ROW LEVEL SECURITY;

-- Public read tables (no RLS needed but enable for safety)
ALTER TABLE exam_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- ── Public read policies ──────────────────────────────────
CREATE POLICY "Everyone can read domains" ON exam_domains
  FOR SELECT USING (true);

CREATE POLICY "Everyone can read topics" ON topics
  FOR SELECT USING (true);

CREATE POLICY "Everyone can read checklist items" ON checklist_items
  FOR SELECT USING (true);

CREATE POLICY "Everyone can read questions" ON questions
  FOR SELECT USING (true);

-- ── Profiles ──────────────────────────────────────────────
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- ── User Topic Progress ───────────────────────────────────
CREATE POLICY "Users can view own topic progress" ON user_topic_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own topic progress" ON user_topic_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own topic progress" ON user_topic_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- ── User Checklist Progress ───────────────────────────────
CREATE POLICY "Users can view own checklist progress" ON user_checklist_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own checklist progress" ON user_checklist_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own checklist progress" ON user_checklist_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- ── Study Schedule ────────────────────────────────────────
CREATE POLICY "Users can view own schedule" ON study_schedule
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own schedule" ON study_schedule
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own schedule" ON study_schedule
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own schedule" ON study_schedule
  FOR DELETE USING (auth.uid() = user_id);

-- ── Study Sessions ────────────────────────────────────────
CREATE POLICY "Users can view own sessions" ON study_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON study_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ── Quiz Attempts ─────────────────────────────────────────
CREATE POLICY "Users can view own attempts" ON quiz_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attempts" ON quiz_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ── Quiz Answers ──────────────────────────────────────────
CREATE POLICY "Users can view own answers" ON quiz_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quiz_attempts
      WHERE quiz_attempts.id = quiz_answers.attempt_id
      AND quiz_attempts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own answers" ON quiz_answers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM quiz_attempts
      WHERE quiz_attempts.id = quiz_answers.attempt_id
      AND quiz_attempts.user_id = auth.uid()
    )
  );

-- ── Spaced Repetition ─────────────────────────────────────
CREATE POLICY "Users can view own SR" ON spaced_repetition
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own SR" ON spaced_repetition
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own SR" ON spaced_repetition
  FOR UPDATE USING (auth.uid() = user_id);

-- ── Notes ─────────────────────────────────────────────────
CREATE POLICY "Users can view own notes" ON notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes" ON notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes" ON notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes" ON notes
  FOR DELETE USING (auth.uid() = user_id);

-- ── Tags ──────────────────────────────────────────────────
CREATE POLICY "Users can view own tags" ON tags
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tags" ON tags
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tags" ON tags
  FOR DELETE USING (auth.uid() = user_id);

-- ── Note Tags ─────────────────────────────────────────────
CREATE POLICY "Users can view own note tags" ON note_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM notes
      WHERE notes.id = note_tags.note_id
      AND notes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own note tags" ON note_tags
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM notes
      WHERE notes.id = note_tags.note_id
      AND notes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own note tags" ON note_tags
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM notes
      WHERE notes.id = note_tags.note_id
      AND notes.user_id = auth.uid()
    )
  );

-- ── Questions (user-created) ──────────────────────────────
CREATE POLICY "Users can insert questions" ON questions
  FOR INSERT WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

-- ── Auto-create profile on signup ─────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
