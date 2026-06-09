import postgres from 'postgres';

export const getSql = () => {
    if (!process.env.DB_POOLER_URL) {
        throw new Error('DB_POOLER_URL environment variable is not set');
    }
    return postgres(process.env.DB_POOLER_URL);
};