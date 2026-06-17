CREATE INDEX ON "session" ("userId");
CREATE INDEX ON "account" ("userId");

CREATE INDEX ON "jungles" (owner_user_id);
CREATE INDEX ON "jungles" (planted_by_user_id);

CREATE INDEX ON "jungle_connections" (jungle1_id);
CREATE INDEX ON "jungle_connections" (jungle2_id);

ALTER TABLE "jungle_connections" ADD CONSTRAINT unique_jungle_pair UNIQUE (jungle1_id, jungle2_id);

CREATE INDEX ON "stashes" (user_id);
CREATE INDEX ON "stashes" (jungle_id);