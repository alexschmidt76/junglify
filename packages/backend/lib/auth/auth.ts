import { betterAuth } from 'better-auth';
import { username } from 'better-auth/plugins';
import sql from '../db/sql.js';

const trustedOrigins: string[] = [];
if (process.env.EXTENSION_ID) trustedOrigins.push(process.env.EXTENSION_ID);
if (process.env.FRONTEND_URL) trustedOrigins.push(process.env.FRONTEND_URL);

const auth = betterAuth({
  database: sql,
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    username()
  ],
  trustedOrigins: trustedOrigins
});

export default auth;
