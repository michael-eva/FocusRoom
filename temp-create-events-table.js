import { createClient } from '@libsql/client';

const client = createClient({
  url: 'file:sqlite.db'
});

async function createEventsTable() {
  try {
    console.log('Checking if events table exists...');
    
    const result = await client.execute(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='events';
    `);
    
    if (result.rows.length === 0) {
      console.log('Events table does not exist, creating it...');
      
      await client.execute(`
        CREATE TABLE events (
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
      
      console.log('✅ Events table created successfully!');
    } else {
      console.log('✅ Events table already exists');
    }
    
    // Show all tables
    const allTables = await client.execute(`
      SELECT name FROM sqlite_master WHERE type='table';
    `);
    
    console.log('All tables in database:', allTables.rows.map(row => row.name));
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createEventsTable();
