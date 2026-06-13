import postgres from 'postgres';
import isDev from '@repo/utils/isDev';

const url = process.env[isDev() ? 'DEV_DATABASE_URL' : 'DATABASE_URL'];

if (!url) {
  throw new Error('DATABASE_URL env var is not set');
}

const sql = postgres(url, { max: 1});

export default sql;