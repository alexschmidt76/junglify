import { ExpressAuth } from "@auth/express";
import PostgresAdapter from "@auth/pg-adapter";
import { Pool } from "pg";
 
const pool = new Pool({
  connectionString: process.env.DB_POOLER_URL,
  max: 1,
  ssl: { rejectUnauthorized: false },
});
 
const auth = ExpressAuth({
    providers: [],
    adapter: PostgresAdapter(pool)
});

export default auth;