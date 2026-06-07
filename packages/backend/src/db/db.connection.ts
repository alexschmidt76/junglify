import postgres from 'postgres';

// public url will only exist in development
const url = process.env.DB_URL || process.env.DB_PUBLIC_URL;

if (!url) {
    throw new Error('Database URL is not defined in environment variables');
}

const sql = postgres(url, {
    max: 1,
    connect_timeout: 10,
    ssl: 'require',
});

export default sql;