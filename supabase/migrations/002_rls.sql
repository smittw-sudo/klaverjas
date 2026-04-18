-- Row Level Security policies

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE hands ENABLE ROW LEVEL SECURITY;
ALTER TABLE roem_entries ENABLE ROW LEVEL SECURITY;

-- Profiles: users manage own profile; all authenticated can read
CREATE POLICY "profiles_read" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update" ON profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- Players: all authenticated users can read; authenticated can insert/update
CREATE POLICY "players_read" ON players FOR SELECT TO authenticated USING (true);
CREATE POLICY "players_insert" ON players FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "players_update" ON players FOR UPDATE TO authenticated USING (true);

-- Sessions: all authenticated can read non-private sessions + own private sessions
CREATE POLICY "sessions_read" ON sessions FOR SELECT TO authenticated
  USING (is_private = false OR created_by = auth.uid());
CREATE POLICY "sessions_insert" ON sessions FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "sessions_update" ON sessions FOR UPDATE TO authenticated
  USING (created_by = auth.uid());
CREATE POLICY "sessions_delete" ON sessions FOR DELETE TO authenticated
  USING (created_by = auth.uid());

-- Session players: read follows session visibility; anyone authenticated can manage
CREATE POLICY "session_players_read" ON session_players FOR SELECT TO authenticated USING (true);
CREATE POLICY "session_players_insert" ON session_players FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "session_players_delete" ON session_players FOR DELETE TO authenticated USING (true);

-- Games: all authenticated can read; anyone can create/update/delete
CREATE POLICY "games_read" ON games FOR SELECT TO authenticated USING (true);
CREATE POLICY "games_insert" ON games FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "games_update" ON games FOR UPDATE TO authenticated USING (true);
CREATE POLICY "games_delete" ON games FOR DELETE TO authenticated USING (true);

-- Game players: all authenticated can read/write
CREATE POLICY "game_players_read" ON game_players FOR SELECT TO authenticated USING (true);
CREATE POLICY "game_players_insert" ON game_players FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "game_players_update" ON game_players FOR UPDATE TO authenticated USING (true);
CREATE POLICY "game_players_delete" ON game_players FOR DELETE TO authenticated USING (true);

-- Hands: all authenticated can read/write
CREATE POLICY "hands_read" ON hands FOR SELECT TO authenticated USING (true);
CREATE POLICY "hands_insert" ON hands FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "hands_update" ON hands FOR UPDATE TO authenticated USING (true);
CREATE POLICY "hands_delete" ON hands FOR DELETE TO authenticated USING (true);

-- Roem entries: all authenticated can read/write
CREATE POLICY "roem_entries_read" ON roem_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "roem_entries_insert" ON roem_entries FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "roem_entries_update" ON roem_entries FOR UPDATE TO authenticated USING (true);
CREATE POLICY "roem_entries_delete" ON roem_entries FOR DELETE TO authenticated USING (true);

-- Auto-create profile on sign up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
