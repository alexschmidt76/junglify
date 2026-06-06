import { ExpressAuth } from "@auth/express";
import PostgresAdapter from "@auth/pg-adapter";
import { Pool } from "pg";
 
const pool = new Pool({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
 
const auth = ExpressAuth({
    providers: [],
    adapter: PostgresAdapter(pool)
});

export default auth;