import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { env } from '~/env';

const client = createClient({
  url: env.DB_FILE_NAME.startsWith('file:') ? env.DB_FILE_NAME : `file:${env.DB_FILE_NAME}`,
});

const db = drizzle(client);

async function createEventsTable() {
  console.log('Creating events table...');
  
  await client.execute(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      location TEXT,
      start_date_time INTEGER NOT NULL,
      end_date_time INTEGER NOT NULL,
      all_day INTEGER DEFAULT 0,
      rsvp_link TEXT,
      created_by_id INTEGER,
      created_at INTEGER,
      updated_at INTEGER,
      google_event_id TEXT,
      FOREIGN KEY (created_by_id) REFERENCES users(id) ON UPDATE no action ON DELETE no action
    );
  `);
  
  console.log('Events table created successfully!');
}

createEventsTable().catch(console.error);
