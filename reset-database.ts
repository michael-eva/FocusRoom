import postgres from 'postgres';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);

async function resetDatabase() {
  try {
    console.log('Connecting to database...');
    
    // Drop all existing tables (this will remove the fitness app tables)
    const dropTables = await client`
      DROP SCHEMA public CASCADE;
      CREATE SCHEMA public;
      GRANT ALL ON SCHEMA public TO postgres;
      GRANT ALL ON SCHEMA public TO public;
    `;
    
    console.log('✅ Database reset complete');
    console.log('Now you can run your migrations to set up the FocusRoom schema');
    
  } catch (error) {
    console.error('Error resetting database:', error);
  } finally {
    await client.end();
  }
}

resetDatabase();
