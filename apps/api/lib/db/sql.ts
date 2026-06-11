import postgres from 'postgres';

const devEnv = process.env.NODE_ENV === 'DEVELOPMENT';
const url = process.env[devEnv ? 'DEV_' : '' + 'DATABASE_URL'];

if (!url) {
  throw new Error('DB_POOLER_URL environment variable is not set');
}

const sql = postgres(url, { max: 1});

export default sql;