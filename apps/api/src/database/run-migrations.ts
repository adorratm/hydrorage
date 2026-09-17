import fs from 'fs';
import path from 'path';
import pg from 'pg';

async function main() {
  const url =
    process.env.DIRECT_URL ||
    process.env.DATABASE_URL ||
    'postgresql://hydrorage:hydrorage@localhost:5434/hydrorage';

  const client = new pg.Client({ connectionString: url });
  await client.connect();

  await client.query(`
    CREATE TABLE IF NOT EXISTS "_sql_migrations" (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  const dir = path.join(__dirname, '../../migrations');
  const folders = fs
    .readdirSync(dir)
    .filter((f) => fs.statSync(path.join(dir, f)).isDirectory())
    .sort();

  for (const folder of folders) {
    const id = folder;
    const exists = await client.query(
      'SELECT 1 FROM "_sql_migrations" WHERE id = $1',
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
      await client.query('INSERT INTO "_sql_migrations"(id) VALUES ($1)', [id]);
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
