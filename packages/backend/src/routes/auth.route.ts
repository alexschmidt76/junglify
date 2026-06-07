import { ExpressAuth } from "@auth/express";
import PostgresAdapter from "@auth/pg-adapter";
import { Pool } from "pg";
 
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
 
const auth = ExpressAuth({
    providers: [],
    adapter: PostgresAdapter(pool)
});

export default auth;