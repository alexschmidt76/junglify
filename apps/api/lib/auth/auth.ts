import { betterAuth } from 'better-auth';
import { bearer, username } from 'better-auth/plugins';
import { PostgresJSDialect } from 'kysely-postgres-js';
import sql from '../db/sql.js';
import getTrustedOrigins from '../utils/trustedOrigins.js';
import isDev from '../utils/isDev.js';

const trustedOrigins = getTrustedOrigins();

if (!process.env.BETTER_AUTH_URL) throw new Error('BETTER_AUTH_URL env var is required')

const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  database: {
    dialect: new PostgresJSDialect({ postgres: sql }),
    type: 'postgres',
  },
  user: {
    deleteUser: {
      enabled: true
    }
  },
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
      enabled: !isDev(),
      domain: '.junglify.org'
    }
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // slide expiry if >1 day has passed
  }
});

export default auth;
