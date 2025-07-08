import { spotlights, likes, comments } from "~/db/schema";
import { db } from "~/index";

async function seedSpotlight() {
  try {
    // Create a sample spotlight
    const sampleSpotlight = await db
      .insert(spotlights)
      .values({
        type: "musician",
        name: "Sarah Chen",
        title: "Indie Folk Singer-Songwriter",
        description:
          "Sarah's ethereal voice and introspective lyrics have been captivating Melbourne audiences for over 5 years. Her latest EP 'Midnight Reflections' showcases her evolution as an artist, blending traditional folk with modern indie sensibilities.",
        image: "/placeholder.svg?height=300&width=300",
        location: "Melbourne, VIC",
        genre: "Indie Folk",
        established: "2019",
        links: JSON.stringify([
          {
            type: "spotify",
            url: "https://open.spotify.com/artist/example",
            label: "Listen on Spotify",
          },
          {
            type: "youtube",
            url: "https://youtube.com/c/sarahchenmusic",
            label: "YouTube Channel",
          },
          {
            type: "instagram",
            url: "https://instagram.com/sarahchenmusic",
            label: "@sarahchenmusic",
          },
          {
            type: "website",
            url: "https://sarahchenmusic.com",
            label: "Official Website",
          },
        ]),
        stats: JSON.stringify({
          monthlyListeners: "12.5K",
          followers: "8.2K",
          upcomingShows: "3",
        }),
        isCurrent: true,
        createdById: 1,
      })
      .returning();

    console.log("✅ Sample spotlight created:", sampleSpotlight[0]);

    // Create a previous spotlight
    const previousSpotlight = await db
      .insert(spotlights)
      .values({
        type: "venue",
        name: "The Corner Hotel",
        title: "Iconic Live Music Venue",
        description:
          "Richmond's legendary music venue, The Corner Hotel has been a cornerstone of Melbourne's live music scene for decades. Known for its intimate atmosphere and stellar sound system, it's the go-to venue for both emerging artists and established acts.",
        image: "/placeholder.svg?height=200&width=200",
        location: "Richmond, VIC",
        genre: "Live Music Venue",
        established: "1996",
        links: JSON.stringify([
          {
            type: "website",
            url: "https://cornerhotel.com",
            label: "Official Website",
          },
          {
            type: "instagram",
            url: "https://instagram.com/cornerhotel",
            label: "@cornerhotel",
          },
        ]),
        isCurrent: false,
        createdById: 1,
      })
      .returning();

    console.log("✅ Previous spotlight created:", previousSpotlight[0]);

    // Add some sample likes
    if (sampleSpotlight[0]) {
      const sampleLikes = await db
        .insert(likes)
        .values([
          {
            userId: 1,
            targetId: sampleSpotlight[0].id,
            targetType: "spotlight",
          },
          {
            userId: 2,
            targetId: sampleSpotlight[0].id,
            targetType: "spotlight",
          },
        ])
        .returning();

      console.log("✅ Sample likes created:", sampleLikes.length);

      // Add some sample comments
      const sampleComments = await db
        .insert(comments)
        .values([
          {
            userId: 1,
            targetId: sampleSpotlight[0].id,
            targetType: "spotlight",
            content:
              "Amazing artist! Love the folk vibes. Can't wait to see them live!",
          },
          {
            userId: 2,
            targetId: sampleSpotlight[0].id,
            targetType: "spotlight",
            content:
              "The new EP is incredible. Such beautiful lyrics and melodies.",
          },
          {
            userId: 3,
            targetId: sampleSpotlight[0].id,
            targetType: "spotlight",
            content:
              "Definitely checking out their Spotify now. Thanks for the recommendation!",
          },
        ])
        .returning();

      console.log("✅ Sample comments created:", sampleComments.length);
    }
  } catch (error) {
    console.error("❌ Error seeding spotlight:", error);
  } finally {
    process.exit(0);
  }
}

seedSpotlight();
