// Vercel forces NODE_ENV to lowercase ("development"/"production") in its
// runtime, while local .env files use "DEVELOPMENT" — compare case-insensitively.
const isDev = process.env.NODE_ENV?.toUpperCase() === 'DEVELOPMENT';

export default isDev;
