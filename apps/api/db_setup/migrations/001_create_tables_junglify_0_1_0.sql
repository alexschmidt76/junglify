-- Run this migration to populate the DB with the necessary tables for junglify 0.1.0
DROP TABLE IF EXISTS stashes CASCADE;
DROP TABLE IF EXISTS jungle_connections CASCADE;
DROP TABLE IF EXISTS jungles CASCADE;
DROP TABLE IF EXISTS verification_token CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Better Auth core tables
CREATE TABLE "user" (
  "id"            TEXT        PRIMARY KEY,
  "name"          TEXT        NOT NULL,
  "email"         TEXT        NOT NULL UNIQUE,
  "emailVerified" BOOLEAN     NOT NULL,
  "image"         TEXT,
  "createdAt"     TIMESTAMP   NOT NULL,
  "updatedAt"     TIMESTAMP   NOT NULL
);

CREATE TABLE "session" (
  "id"          TEXT        PRIMARY KEY,
  "expiresAt"   TIMESTAMP   NOT NULL,
  "token"       TEXT        NOT NULL UNIQUE,
  "createdAt"   TIMESTAMP   NOT NULL,
  "updatedAt"   TIMESTAMP   NOT NULL,
  "ipAddress"   TEXT,
  "userAgent"   TEXT,
  "userId"      TEXT        NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
);

CREATE TABLE "account" (
  "id"                     TEXT        PRIMARY KEY,
  "accountId"              TEXT        NOT NULL,
  "providerId"             TEXT        NOT NULL,
  "userId"                 TEXT        NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "accessToken"            TEXT,
  "refreshToken"           TEXT,
  "idToken"                TEXT,
  "accessTokenExpiresAt"   TIMESTAMP,
  "refreshTokenExpiresAt"  TIMESTAMP,
  "scope"                  TEXT,
  "password"               TEXT,
  "createdAt"              TIMESTAMP   NOT NULL,
  "updatedAt"              TIMESTAMP   NOT NULL
);

CREATE TABLE "verification" (
  "id"          TEXT        PRIMARY KEY,
  "identifier"  TEXT        NOT NULL,
  "value"       TEXT        NOT NULL,
  "expiresAt"   TIMESTAMP   NOT NULL,
  "createdAt"   TIMESTAMP,
  "updatedAt"   TIMESTAMP
);

-- Domain tables
CREATE TABLE jungles (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  planted_by_user_id  TEXT        REFERENCES "user"("id") ON DELETE SET NULL,
  owner_user_id       TEXT        REFERENCES "user"("id") ON DELETE SET NULL,
  url                 TEXT        NOT NULL UNIQUE,
  jungle_type         TEXT        NOT NULL,
  planted_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_visited_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  growth_stage        INT         NOT NULL DEFAULT 0
);

CREATE TABLE jungle_connections (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  jungle1_id    UUID        REFERENCES jungles(id) ON DELETE CASCADE,
  jungle2_id    UUID        REFERENCES jungles(id) ON DELETE CASCADE,
  connected_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE stashes (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT        REFERENCES "user"("id") ON DELETE CASCADE,
  jungle_id     UUID        REFERENCES jungles(id) ON DELETE SET NULL,
  banana_count  INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
