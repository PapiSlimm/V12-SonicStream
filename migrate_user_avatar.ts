import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import pg from 'pg';

async function migrate() {
  const dbUrl = process.env.DATABASE_URL;

  if (dbUrl && (dbUrl.startsWith('postgres:') || dbUrl.startsWith('postgresql:'))) {
    console.log('Connecting to PostgreSQL database to migrate...');
    const { Pool } = pg;
    const pool = new Pool({
      connectionString: dbUrl,
      ssl: dbUrl.includes('localhost') ? false : { rejectUnauthorized: false }
    });

    try {
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;`);
      console.log('Column avatar_url check/addition successful in PostgreSQL.');
    } catch (err: any) {
      console.error('Failed to add column in PostgreSQL:', err.message);
    } finally {
      await pool.end();
    }
  } else {
    console.log('Connecting to SQLite database to migrate...');
    const dbPath = './sonicstream.db';
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    try {
      const tableInfo = await db.all(`PRAGMA table_info(users)`);
      const columnExists = tableInfo.some((col: any) => col.name === 'avatar_url');
      if (!columnExists) {
        await db.exec(`ALTER TABLE users ADD COLUMN avatar_url TEXT;`);
        console.log('Column avatar_url added successfully in SQLite.');
      } else {
        console.log('Column avatar_url already exists in SQLite.');
      }
    } catch (err: any) {
      console.error('Failed to add column in SQLite:', err);
    } finally {
      await db.close();
    }
  }
}

migrate().catch(console.error);
