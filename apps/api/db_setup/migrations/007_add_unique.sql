ALTER TABLE "stashes" ADD CONSTRAINT unique_user_id UNIQUE (user_id);
ALTER TABLE "stashes" ADD CONSTRAINT unique_jungle_id UNIQUE (jungle_id);