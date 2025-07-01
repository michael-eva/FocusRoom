import "dotenv/config";
import { drizzle } from "drizzle-orm/libsql";

import * as schema from "./db/schema";
import { createClient } from "@libsql/client";
const client = createClient({
  url: "file:sqlite.db",
});
export const db = drizzle(client, { schema });

// async function main() {
//   //   seedDatabase();
// }

// main();
