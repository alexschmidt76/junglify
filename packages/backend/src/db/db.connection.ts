import postgres from 'postgres';

// public url will only exist in development
const url = process.env.DB_URL || process.env.DB_PUBLIC_URL;

if (!url) {
    throw new Error('Database URL is not defined in environment variables');
}

const sql = postgres(url, {
    max: 20,
    idle_timeout: 30000,
    connect_timeout: 2000
});

export default sql;