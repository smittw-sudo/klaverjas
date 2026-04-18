-- Klaverjas Score App — Initial Schema

-- Profiles (linked to Supabase Auth)
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Players (registered users + guests)
CREATE TABLE players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  display_name text NOT NULL,
  is_guest boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Sessions (e.g. "Ibiza april 2026")
CREATE TABLE sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid REFERENCES profiles(id) NOT NULL,
  name text NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date,
  is_private boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Fixed players in a session
CREATE TABLE session_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  player_id uuid REFERENCES players(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(session_id, player_id)
);

-- Games (a "boompje" = 16 hands)
CREATE TABLE games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid REFERENCES profiles(id),
  session_id uuid REFERENCES sessions(id) ON DELETE SET NULL,
  name text,
  played_at date DEFAULT CURRENT_DATE NOT NULL,
  variant text NOT NULL CHECK (variant IN ('amsterdams', 'rotterdams', 'kraken_amsterdams', 'kraken_rotterdams')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Players in a game with seat positions
CREATE TABLE game_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid REFERENCES games(id) ON DELETE CASCADE NOT NULL,
  player_id uuid REFERENCES players(id) ON DELETE CASCADE NOT NULL,
  seat_position integer NOT NULL CHECK (seat_position IN (1, 2, 3, 4)),
  UNIQUE(game_id, seat_position),
  UNIQUE(game_id, player_id)
);

-- Hands (a single hand within a game)
CREATE TABLE hands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid REFERENCES games(id) ON DELETE CASCADE NOT NULL,
  hand_number integer NOT NULL CHECK (hand_number BETWEEN 1 AND 16),
  dealer_seat integer NOT NULL CHECK (dealer_seat IN (1, 2, 3, 4)),
  trump_maker_seat integer NOT NULL CHECK (trump_maker_seat IN (1, 2, 3, 4)),
  trump_suit text NOT NULL CHECK (trump_suit IN ('harten', 'schoppen', 'klaveren', 'ruiten')),

  -- Kraak
  kraak_type text NOT NULL DEFAULT 'geen' CHECK (kraak_type IN ('geen', 'kraak', 'rekraak', 'superkraak')),
  kraak_multiplier integer NOT NULL DEFAULT 1 CHECK (kraak_multiplier IN (1, 2, 4, 8)),

  -- Card points (excluding roem, excluding multiplier)
  spelend_team_kaartpunten integer NOT NULL CHECK (spelend_team_kaartpunten BETWEEN 0 AND 162),
  -- spelend_team indicates which seat is trump-maker (1 or 3 = team A; 2 or 4 = team B)
  spelend_team_seat integer NOT NULL CHECK (spelend_team_seat IN (1, 2, 3, 4)),

  -- Roem
  spelend_team_roem integer NOT NULL DEFAULT 0,
  tegen_team_roem integer NOT NULL DEFAULT 0,
  spelend_team_roem_afgekeurd boolean DEFAULT false NOT NULL,

  -- Flags
  nat boolean NOT NULL DEFAULT false,
  pit boolean NOT NULL DEFAULT false,
  verzaakt boolean DEFAULT false NOT NULL,
  verzaakt_seat integer CHECK (verzaakt_seat IN (1, 2, 3, 4)),

  -- Final points after all rules applied
  team_a_eindpunten integer NOT NULL, -- seats 1&3
  team_b_eindpunten integer NOT NULL, -- seats 2&4

  created_at timestamptz DEFAULT now() NOT NULL,

  UNIQUE(game_id, hand_number)
);

-- Individual roem entries per hand
CREATE TABLE roem_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hand_id uuid REFERENCES hands(id) ON DELETE CASCADE NOT NULL,
  team text NOT NULL CHECK (team IN ('spelend', 'tegen')),
  roem_type text NOT NULL CHECK (roem_type IN ('stuk', 'drie_op_rij', 'vier_op_rij', 'vijf_plus', 'vier_boeren', 'vier_tienen', 'vier_azen', 'pit')),
  punten integer NOT NULL,
  afgekeurd boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);
