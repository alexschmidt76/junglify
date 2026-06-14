// Evaluated at call time (not cached at import) so runtime env changes — and
// tests that mutate process.env — are reflected. Matches the local .env's exact
// "DEVELOPMENT" casing.
export default function isDev(): boolean {
    return process.env.NODE_ENV?.toUpperCase() === 'DEVELOPMENT';
}
