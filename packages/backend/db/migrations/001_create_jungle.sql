CREATE TABLE jungles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    planted_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    owner_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    url TEXT NOT NULL UNIQUE,
    jungle_type TEXT NOT NULL,
    planted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_visited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    growth_stage INT NOT NULL DEFAULT 0
);

CREATE TABLE jungle_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jungle1_id UUID REFERENCES jungles(id) ON DELETE CASCADE,
    jungle2_id UUID REFERENCES jungles(id) ON DELETE CASCADE,
    connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);