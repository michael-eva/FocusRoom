import { createClient } from '@libsql/client';

const client = createClient({
  url: 'file:sqlite.db'
});

async function insertDefaultUser() {
  try {
    console.log('Inserting default user...');
    
    await client.execute(`
      INSERT OR IGNORE INTO users (id, name, email) 
      VALUES (1, 'Default User', 'user@example.com');
    `);
    
    console.log('✅ Default user inserted successfully!');
    
    // Verify the user exists
    const result = await client.execute(`
      SELECT * FROM users WHERE id = 1;
    `);
    
    console.log('User verification:', result.rows);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

insertDefaultUser();
