import { db } from "../src/db";
import { spotlights } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function testSpotlightCreation() {
  try {
    console.log("🧪 Testing spotlight creation behavior...");

    // Get initial state
    console.log("\n📊 Initial database state:");
    const initialSpotlights = await db.select().from(spotlights);
    console.log(`Total spotlights: ${initialSpotlights.length}`);

    const initialCurrent = initialSpotlights.filter((s) => s.isCurrent);
    console.log(`Current spotlights: ${initialCurrent.length}`);
    if (initialCurrent.length > 0) {
      console.log(`Current spotlight: ${initialCurrent[0]?.name}`);
    }

    // Simulate the API logic for creating a new spotlight
    console.log("\n➕ Creating new spotlight (using API logic)...");

    // Step 1: Get the current spotlight before creating a new one
    const currentSpotlight = await db
      .select()
      .from(spotlights)
      .where(eq(spotlights.isCurrent, true))
      .limit(1);

    // Step 2: If there's a current spotlight, move it to previous spotlights
    if (currentSpotlight.length > 0) {
      console.log(
        `Moving current spotlight "${currentSpotlight[0]?.name}" to previous...`,
      );
      await db
        .update(spotlights)
        .set({
          isCurrent: false,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(spotlights.isCurrent, true));
    }

    // Step 3: Create the new spotlight
    const newSpotlight = await db
      .insert(spotlights)
      .values({
        type: "musician",
        name: "Test Artist",
        title: "Test Musician",
        description: "This is a test spotlight to verify the creation behavior",
        image: "/placeholder.svg?height=300&width=300",
        location: "Test City",
        genre: "Test Genre",
        established: "2024",
        links: JSON.stringify([
          {
            type: "spotify",
            url: "https://spotify.com/test",
            label: "Test Spotify",
          },
        ]),
        stats: JSON.stringify({
          monthlyListeners: "1K",
          followers: "500",
          upcomingShows: "1",
        }),
        isCurrent: true,
        createdById: 1,
      })
      .returning();

    console.log(`✅ Created spotlight: ${newSpotlight[0]?.name}`);

    // Check state after creation
    console.log("\n📊 State after creation:");
    const afterCreation = await db.select().from(spotlights);
    console.log(`Total spotlights: ${afterCreation.length}`);

    const currentAfterCreation = afterCreation.filter((s) => s.isCurrent);
    console.log(`Current spotlights: ${currentAfterCreation.length}`);
    if (currentAfterCreation.length > 0) {
      console.log(`Current spotlight: ${currentAfterCreation[0]?.name}`);
    }

    const previousAfterCreation = afterCreation.filter((s) => !s.isCurrent);
    console.log(`Previous spotlights: ${previousAfterCreation.length}`);
    previousAfterCreation.forEach((s, i) => {
      console.log(`  ${i + 1}. ${s.name} (${s.type})`);
    });

    // Create another spotlight to test the replacement behavior
    console.log("\n➕ Creating another spotlight...");

    // Step 1: Get the current spotlight before creating a new one
    const currentSpotlight2 = await db
      .select()
      .from(spotlights)
      .where(eq(spotlights.isCurrent, true))
      .limit(1);

    // Step 2: If there's a current spotlight, move it to previous spotlights
    if (currentSpotlight2.length > 0) {
      console.log(
        `Moving current spotlight "${currentSpotlight2[0]?.name}" to previous...`,
      );
      await db
        .update(spotlights)
        .set({
          isCurrent: false,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(spotlights.isCurrent, true));
    }

    // Step 3: Create the new spotlight
    const anotherSpotlight = await db
      .insert(spotlights)
      .values({
        type: "venue",
        name: "Test Venue",
        title: "Test Music Venue",
        description:
          "This is another test spotlight to verify replacement behavior",
        image: "/placeholder.svg?height=300&width=300",
        location: "Test Venue City",
        genre: "Live Music Venue",
        established: "2023",
        links: JSON.stringify([
          {
            type: "website",
            url: "https://testvenue.com",
            label: "Test Venue Website",
          },
        ]),
        isCurrent: true,
        createdById: 1,
      })
      .returning();

    console.log(`✅ Created spotlight: ${anotherSpotlight[0]?.name}`);

    // Check final state
    console.log("\n📊 Final state:");
    const finalSpotlights = await db.select().from(spotlights);
    console.log(`Total spotlights: ${finalSpotlights.length}`);

    const currentFinal = finalSpotlights.filter((s) => s.isCurrent);
    console.log(`Current spotlights: ${currentFinal.length}`);
    if (currentFinal.length > 0) {
      console.log(`Current spotlight: ${currentFinal[0]?.name}`);
    }

    const previousFinal = finalSpotlights.filter((s) => !s.isCurrent);
    console.log(`Previous spotlights: ${previousFinal.length}`);
    previousFinal.forEach((s, i) => {
      console.log(`  ${i + 1}. ${s.name} (${s.type})`);
    });

    console.log("\n✅ Test completed successfully!");
  } catch (error) {
    console.error("❌ Error testing spotlight creation:", error);
  } finally {
    process.exit(0);
  }
}

testSpotlightCreation();
