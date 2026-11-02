import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { orm } from '../db/drizzle.js';
import * as schema from '../db/schema.drizzle.js';

/**
 * Standard Better-Auth instance backed by Drizzle ORM and SQLite.
 * Provides battle-tested authentication, session management, and standard endpoints.
 */
export const auth = betterAuth({
  database: drizzleAdapter(orm, {
    provider: 'sqlite',
    schema: {
      user: schema.authUsers,
      session: schema.authSessions,
      account: schema.authAccounts,
      verification: schema.authVerifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  advanced: {
    defaultCookieAttributes: {
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
  },
});
