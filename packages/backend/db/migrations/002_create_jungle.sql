CREATE TABLE IF NOT EXISTS jungle (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url TEXT NOT NULL,
    connected_jungle_urls TEXT[] NOT NULL,
    jungle_type TEXT NOT NULL,
    planted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_visited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    growth_stage INT NOT NULL DEFAULT 0
)