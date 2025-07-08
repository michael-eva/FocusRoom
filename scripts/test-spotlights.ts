import { db } from "../src/db";
import { spotlights } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function testSpotlights() {
  try {
    console.log("🔍 Checking spotlights in database...");

    // Get all spotlights
    const allSpotlights = await db.select().from(spotlights);
    console.log(`Total spotlights: ${allSpotlights.length}`);

    // Get current spotlight
    const currentSpotlight = await db
      .select()
      .from(spotlights)
      .where(eq(spotlights.isCurrent, true));
    console.log(
      `Current spotlight: ${currentSpotlight.length > 0 ? currentSpotlight[0]?.name : "none"}`,
    );

    // Get previous spotlights
    const previousSpotlights = await db
      .select()
      .from(spotlights)
      .where(eq(spotlights.isCurrent, false));
    console.log(`Previous spotlights: ${previousSpotlights.length}`);

    previousSpotlights.forEach((spotlight, index) => {
      console.log(
        `  ${index + 1}. ${spotlight.name} (${spotlight.type}) - Updated: ${spotlight.updatedAt}`,
      );
    });
  } catch (error) {
    console.error("❌ Error testing spotlights:", error);
  } finally {
    process.exit(0);
  }
}

testSpotlights();
