import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { env } from '~/env';

const client = createClient({
  url: env.DB_FILE_NAME.startsWith('file:') ? env.DB_FILE_NAME : `file:${env.DB_FILE_NAME}`,
});

export const db = drizzle(client);
