import postgres from 'postgres';

if (!process.env.DB_POOLER_URL) {
  throw new Error('DB_POOLER_URL environment variable is not set');
}

const sql = postgres(process.env.DB_POOLER_URL, { max: 1});

export default sql;