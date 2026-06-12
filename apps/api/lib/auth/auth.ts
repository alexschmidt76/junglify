import { betterAuth } from 'better-auth';
import { bearer, username } from 'better-auth/plugins';
import sql from '../db/sql.js';
import getTrustedOrigins from '../utils/trustedOrigins.js';

const trustedOrigins = getTrustedOrigins();

const auth = betterAuth({
  database: sql,
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    username(),
    bearer()
  ],
  trustedOrigins: trustedOrigins,
  advanced: {
    crossSubDomainCookies: {
      enabled: process.env.NODE_ENV !== 'DEVELOPMENT',
      domain: '.junglify.org'
    }
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // slide expiry if >1 day has passed
  }
});

export default auth;
