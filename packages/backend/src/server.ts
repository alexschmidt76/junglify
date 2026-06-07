import app from './app.js';
import sql from './db/db.connection.js';

let server: ReturnType<typeof app.listen> | null = null;

// Test database connection before starting the server
sql`SELECT 1`
    .then(() => {
        console.log('Database connection successful');
        const PORT = process.env.PORT || 3000;
        server = app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch(_err => {
        console.error('Failed to connect to the database');
        process.exit(1);
    });

process.on('SIGTERM', async () => {
    if (server) {
        console.log('SIGTERM received, shutting down server...');
        server.close();
        await sql.end();
    }
});