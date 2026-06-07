import postgres from 'postgres';

const url = process.env.DB_POOLER_URL;

if (!url) {
    throw new Error('Database URL is not defined in environment variables');
}

const sql = postgres(url, {
    max: 1,
    connect_timeout: 10,
    ssl: 'require',
});

export default sql;