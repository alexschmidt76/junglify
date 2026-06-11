import { betterAuth } from 'better-auth';
import { username } from 'better-auth/plugins';
import sql from '../db/sql.js';
import getTrustedOrigins from '../utils/trustedOrigins.js';

const trustedOrigins = getTrustedOrigins();

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
