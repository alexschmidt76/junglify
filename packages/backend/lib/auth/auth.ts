import { betterAuth } from 'better-auth';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DB_POOLER_URL,
  max: 1,
  ssl: { rejectUnauthorized: false },
});

export const auth = betterAuth({
  database: pool,
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: process.env.EXTENSION_ID
    ? [`chrome-extension://${process.env.EXTENSION_ID}`]
    : [],
});
