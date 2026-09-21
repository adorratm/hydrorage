import fs from 'fs';
import path from 'path';
import pg from 'pg';

/** Avoid leading-underscore names — PG array types use `_tablename` and collide (23505 on pg_type). */
const MIGRATIONS_TABLE = 'hydrorage_migrations';
const LEGACY_TABLE = '_sql_migrations';

async function ensureMigrationsTable(client: pg.Client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS "${MIGRATIONS_TABLE}" (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function adoptLegacyTracking(client: pg.Client) {
  const legacy = await client.query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = $1
     ) AS exists`,
    [LEGACY_TABLE],
  );
  if (!legacy.rows[0]?.exists) return;

  console.log(`Adopting legacy ${LEGACY_TABLE} → ${MIGRATIONS_TABLE}`);
  // Column shapes may differ; copy id if present
  const cols = await client.query<{ column_name: string }>(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1`,
    [LEGACY_TABLE],
  );
  const names = new Set(cols.rows.map((r) => r.column_name));
  if (names.has('id')) {
    if (names.has('applied_at')) {
      await client.query(`
        INSERT INTO "${MIGRATIONS_TABLE}"(id, applied_at)
        SELECT id, applied_at FROM "${LEGACY_TABLE}"
        ON CONFLICT (id) DO NOTHING
      `);
    } else {
      await client.query(`
        INSERT INTO "${MIGRATIONS_TABLE}"(id)
        SELECT id FROM "${LEGACY_TABLE}"
        ON CONFLICT (id) DO NOTHING
      `);
    }
  }

  await client.query(`DROP TABLE IF EXISTS "${LEGACY_TABLE}" CASCADE`);
  await client.query(`DROP TYPE IF EXISTS "${LEGACY_TABLE}" CASCADE`);
  await client.query(`DROP TYPE IF EXISTS "__sql_migrations" CASCADE`);
}

/** Schema already present but tracking wiped (e.g. after DROP of legacy table). */
async function baselineIfSchemaPresent(client: pg.Client) {
  const markers: { id: string; probe: string }[] = [
    {
      id: '20260917100000_init',
      probe: `SELECT 1 FROM pg_type WHERE typname = 'DrinkType'`,
    },
    {
      id: '20260918000000_oauth_providers',
      probe: `SELECT 1 FROM pg_type WHERE typname = 'AuthProvider'`,
    },
    {
      id: '20260918010000_landing_page',
      probe: `SELECT 1 FROM information_schema.tables
              WHERE table_schema = 'public' AND table_name = 'LandingPage'`,
    },
  ];

  for (const { id, probe } of markers) {
    const recorded = await client.query(
      `SELECT 1 FROM "${MIGRATIONS_TABLE}" WHERE id = $1`,
      [id],
    );
    if (recorded.rowCount) continue;

    const present = await client.query(probe);
    if (!present.rowCount) continue;

    console.log(`Baselining ${id} (already in database)`);
    await client.query(
      `INSERT INTO "${MIGRATIONS_TABLE}"(id) VALUES ($1) ON CONFLICT DO NOTHING`,
      [id],
    );
  }
}

async function main() {
  const url =
    process.env.DIRECT_URL ||
    process.env.DATABASE_URL ||
    'postgresql://hydrorage:hydrorage@localhost:5434/hydrorage';

  const client = new pg.Client({ connectionString: url });
  await client.connect();

  await ensureMigrationsTable(client);
  await adoptLegacyTracking(client);
  // Cleanup leftover underscore types from earlier failed creates
  await client.query(`DROP TYPE IF EXISTS "_sql_migrations" CASCADE`);
  await client.query(`DROP TYPE IF EXISTS "__sql_migrations" CASCADE`);
  await baselineIfSchemaPresent(client);

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
