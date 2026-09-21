import fs from 'fs';
import path from 'path';
import pg from 'pg';

/** Avoid leading-underscore names — PG array types use `_tablename` and collide (23505 on pg_type). */
const MIGRATIONS_TABLE = 'hydrorage_migrations';

async function ensureMigrationsTable(client: pg.Client) {
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS "${MIGRATIONS_TABLE}" (
        id TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
  } catch (e: unknown) {
    const err = e as { code?: string };
    // Concurrent create / leftover type from old "_sql_migrations" name
    if (err.code === '23505') {
      await client.query(`
        CREATE TABLE IF NOT EXISTS "${MIGRATIONS_TABLE}" (
          id TEXT PRIMARY KEY,
          applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
      return;
    }
    throw e;
  }
}

async function main() {
  const url =
    process.env.DIRECT_URL ||
    process.env.DATABASE_URL ||
    'postgresql://hydrorage:hydrorage@localhost:5434/hydrorage';

  const client = new pg.Client({ connectionString: url });
  await client.connect();

  // Clean up legacy name that breaks on PG 16+/18 (type/table underscore clash)
  await client.query(`DROP TABLE IF EXISTS "_sql_migrations" CASCADE`);
  await client.query(`DROP TYPE IF EXISTS "_sql_migrations" CASCADE`);
  await client.query(`DROP TYPE IF EXISTS "__sql_migrations" CASCADE`);

  await ensureMigrationsTable(client);

  const dir = path.join(__dirname, '../../migrations');
  const folders = fs
    .readdirSync(dir)
    .filter((f) => fs.statSync(path.join(dir, f)).isDirectory())
    .sort();

  for (const folder of folders) {
    const id = folder;
    const exists = await client.query(
      `SELECT 1 FROM "${MIGRATIONS_TABLE}" WHERE id = $1`,
      [id],
    );
    if (exists.rowCount) continue;
    const sqlPath = path.join(dir, folder, 'migration.sql');
    if (!fs.existsSync(sqlPath)) continue;
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('Applying', id);
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query(
        `INSERT INTO "${MIGRATIONS_TABLE}"(id) VALUES ($1)`,
        [id],
      );
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    }
  }

  console.log('SQL migrations up to date.');
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
