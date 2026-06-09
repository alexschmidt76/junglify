import { betterAuth } from 'better-auth';
import sql from '../db/sql.js';

export const auth = betterAuth({ database: sql });
