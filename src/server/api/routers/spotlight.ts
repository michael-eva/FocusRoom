import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

const currentSpotlight = {
    id: 1,
    type: "musician",
    name: "Sarah Chen",
    title: "Indie Folk Singer-Songwriter",
    description:
        "Sarah's ethereal voice and introspective lyrics have been captivating Melbourne audiences for over 5 years. Her latest EP 'Midnight Reflections' showcases her evolution as an artist, blending traditional folk with modern indie sensibilities.",
    image: "/placeholder.svg?height=300&width=300",
    location: "Melbourne, VIC",
    genre: "Indie Folk",
    established: "2019",
    links: [
        { type: "spotify", url: "https://open.spotify.com/artist/example", label: "Listen on Spotify" },
        { type: "youtube", url: "https://youtube.com/c/sarahchenmusic", label: "YouTube Channel" },
        { type: "instagram", url: "https://instagram.com/sarahchenmusic", label: "@sarahchenmusic" },
        { type: "website", url: "https://sarahchenmusic.com", label: "Official Website" },
    ],
    stats: {
        monthlyListeners: "12.5K",
        followers: "8.2K",
        upcomingShows: 3,
    },
    featuredSince: "2025-01-15",
    likes: 47,
    comments: 12,
    userHasLiked: false,
};

const previousSpotlights = [
    {
        id: 2,
        type: "venue",
        name: "The Corner Hotel",
        title: "Iconic Live Music Venue",
        image: "/placeholder.svg?height=200&width=200",
        description: "Richmond's legendary music venue...",
        featuredDate: "2024-12-15",
    },
    {
        id: 3,
        type: "musician",
        name: "The Midnight Collective",
        title: "Electronic Duo",
        image: "/placeholder.svg?height=200&width=200",
        description: "Experimental electronic music...",
        featuredDate: "2024-11-15",
    },
];

export const spotlightRouter = createTRPCRouter({
  getCurrent: publicProcedure.query(() => {
    return currentSpotlight;
  }),
  getPrevious: publicProcedure.query(() => {
    return previousSpotlights;
  }),
});