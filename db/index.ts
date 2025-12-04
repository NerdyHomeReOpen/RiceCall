import Database from 'better-sqlite3';
import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import type { Database as DB } from 'better-sqlite3';


// init migrations version setting
const MIGRATION_TABLE = `
    CREATE TABLE IF NOT EXISTS migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    applied_at INTEGER NOT NULL
    );
`;

export function initDatabase() {
  console.log('[DataBase] init');

  const dbPath = path.join(app.getPath('userData'), 'app.db');

  const db = new Database(dbPath);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec(MIGRATION_TABLE);

  applyMigrations(db);

  return db;
}

function applyMigrations(db: DB) {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

  const result = db.prepare('SELECT name FROM migrations').all() as { name: string }[];
  const applied = result.map((row) => row.name);

  const apply = db.prepare(`
    INSERT INTO migrations (name, applied_at)
    VALUES (?, ?)
  `);

  for (const file of files) {
    if (applied.includes(file)) continue;

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

    console.log('[Migration] applying:', file);
    db.exec(sql);

    apply.run(file, Date.now());
  }
}