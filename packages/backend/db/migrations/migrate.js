import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = postgres(process.env.DB_URL);

async function migrate() {
    // create migrations table if one doesn't exist
    await db`
        CREATE TABLE IF NOT EXISTS _migrations (
            id       SERIAL PRIMARY KEY,
            filename TEXT NOT NULL UNIQUE,
            ran_at   TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    `;

    // get migrations that have already ran
    const ran = await db`SELECT filename FROM _migrations`;
    const ranSet = new Set(ran.map(r => r.filename));

    // get all migration files in order of number
    const dir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(dir)
        .filter(f => f.endsWith('.sql'))
        .sort();
    
    // run pending migrations
    for (const file of files) {
        // skip ran migrations
        if (ranSet.has(file)) {
            console.log(`skipping ${file}`);
            continue;
        }

        console.log(`running ${file}`);
        // get the file path and read its contents
        const filepath = path.join(dir, file);
        const fileContents = fs.readFileSync(filepath, 'utf8');

        // attempt the migration and log it if it's successful
        await db.begin(async db => {
            await db.unsafe(fileContents);
            await db`INSERT INTO _migrations (filename) VALUES (${file})`
        });

        console.log(`${file} complete`);
    };

    console.log('migrations complete');
    await db.end();
};

migrate().catch(err => {
    console.log(err);
    process.exit(1);
});