import { betterAuth } from 'better-auth';
import { bearer } from 'better-auth/plugins/bearer';
import { username } from 'better-auth/plugins/username';
import { admin } from 'better-auth/plugins/admin';
import { PostgresJSDialect } from 'kysely-postgres-js';
import sql from '../db/sql.js';
import getTrustedOrigins from '../utils/trustedOrigins.js';
import isDev from '../utils/isDev.js';

const trustedOrigins = getTrustedOrigins();
const adminIds = (isDev() ? process.env.DEV_ADMIN_USER_IDS : process.env.PROD_ADMIN_USER_IDS)?.split(',') || [];

if (!process.env.BETTER_AUTH_URL) throw new Error('BETTER_AUTH_URL env var is required');

const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  database: {
    dialect: new PostgresJSDialect({ postgres: sql }),
    type: 'postgres',
  },
  user: {
    deleteUser: {
      enabled: true
    },
    additionalFields: {
      seed_count: {
        type: "number",
        required: true,
        defaultValue: 5
      }
    }
  },
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    username(),
    bearer(),
    admin({ adminUserIds: adminIds })
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

export type AuthType = typeof auth;

export default auth;
