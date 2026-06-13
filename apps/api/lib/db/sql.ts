import postgres from 'postgres';
import isDev from '@repo/utils/isDev';

const url = process.env[isDev() ? 'DEV_DATABASE_URL' : 'DATABASE_URL'];

if (!url) {
  throw new Error('DB_POOLER_URL environment variable is not set');
}

const sql = postgres(url, { max: 1});

export default sql;