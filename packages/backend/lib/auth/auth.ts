import { betterAuth } from 'better-auth';
import { username } from 'better-auth/plugins';
import sql from '../db/sql.js';

const trustedOrigins: string[] = [];
if (process.env.EXTENSION_ID) trustedOrigins.push(process.env.EXTENSION_ID);
if (process.env.FRONTEND_URL) trustedOrigins.push(process.env.FRONTEND_URL);

export const auth = betterAuth({
  database: {
    db: sql,
    type: 'postgresql'
  },
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    username()
  ],
  trustedOrigins: trustedOrigins
});
