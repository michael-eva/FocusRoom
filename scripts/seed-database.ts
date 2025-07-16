import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import dotenv from "dotenv";
import { sql } from "drizzle-orm";

// Import your schema
import {
  users,
  teamMembers,
  projects,
  projectTeamMembers,
  tasks,
  resources,
  projectActivities,
  events,
  polls,
  pollOptions,
  pollVotes,
  eventRsvps,
  activityLog,
  likes,
  comments,
  spotlights,
} from "~/db/schema";

// Load environment variables
dotenv.config();

// Sample data
const sampleUsers = [
  { name: "John Smith", email: "john.smith@company.com", role: "admin" },
  { name: "Sarah Johnson", email: "sarah.johnson@company.com", role: "member" },
  { name: "Mike Chen", email: "mike.chen@company.com", role: "member" },
  { name: "Emily Davis", email: "emily.davis@company.com", role: "member" },
  {
    name: "Alex Rodriguez",
    email: "alex.rodriguez@company.com",
    role: "member",
  },
  { name: "Lisa Wang", email: "lisa.wang@company.com", role: "member" },
  { name: "David Brown", email: "david.brown@company.com", role: "member" },
  { name: "Maria Garcia", email: "maria.garcia@company.com", role: "member" },
];

const sampleTeamMembers = [
  {
    name: "John Smith",
    email: "john.smith@company.com",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
  },
  {
    name: "Sarah Johnson",
    email: "sarah.johnson@company.com",
    avatar:
      "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
  },
  {
    name: "Mike Chen",
    email: "mike.chen@company.com",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
  },
  {
    name: "Emily Davis",
    email: "emily.davis@company.com",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
  },
  {
    name: "Alex Rodriguez",
    email: "alex.rodriguez@company.com",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
  },
  {
    name: "Lisa Wang",
    email: "lisa.wang@company.com",
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
  },
  {
    name: "David Brown",
    email: "david.brown@company.com",
    avatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face",
  },
  {
    name: "Maria Garcia",
    email: "maria.garcia@company.com",
    avatar:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face",
  },
];

const sampleProjects = [
  {
    name: "Website Redesign",
    description:
      "Complete overhaul of the company website with modern design and improved user experience",
    status: "active",
    progress: 65,
    totalTasks: 12,
    completedTasks: 8,
    deadline: new Date("2024-03-15"),
    priority: "high",
  },
  {
    name: "Mobile App Development",
    description:
      "Develop a new mobile application for iOS and Android platforms",
    status: "planning",
    progress: 25,
    totalTasks: 18,
    completedTasks: 4,
    deadline: new Date("2024-06-30"),
    priority: "high",
  },
  {
    name: "Marketing Campaign Q1",
    description:
      "Launch comprehensive marketing campaign for Q1 product releases",
    status: "active",
    progress: 80,
    totalTasks: 8,
    completedTasks: 6,
    deadline: new Date("2024-03-31"),
    priority: "medium",
  },
];

const sampleTasks = [
  {
    title: "Design homepage mockups",
    description: "Create wireframes and mockups for the new homepage",
    status: "completed",
    priority: "high",
    projectId: 1,
    assigneeId: 2,
  },
  {
    title: "Implement responsive navigation",
    description: "Build responsive navigation menu with mobile support",
    status: "completed",
    priority: "high",
    projectId: 1,
    assigneeId: 3,
  },
  {
    title: "Optimize page load speed",
    description: "Improve website performance and loading times",
    status: "in-progress",
    priority: "medium",
    projectId: 1,
    assigneeId: 4,
  },
  {
    title: "App architecture planning",
    description: "Design app architecture and technical specifications",
    status: "completed",
    priority: "high",
    projectId: 2,
    assigneeId: 3,
  },
];

const sampleResources = [
  {
    title: "Design System Guide",
    type: "document",
    url: "https://docs.google.com/document/d/123",
    description: "Complete design system and style guide",
    projectId: 1,
  },
  {
    title: "Figma Design Files",
    type: "design",
    url: "https://figma.com/file/abc123",
    description: "All design mockups and prototypes",
    projectId: 1,
  },
];

const now = new Date();

const sampleEvents = [
  {
    title: "Q3 All-Hands Meeting",
    description:
      "Quarterly all-hands meeting to discuss company updates and Q4 goals",
    location: "Conference Room A",
    startDateTime: new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 2,
      10,
      0,
    ),
    endDateTime: new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 2,
      11,
      30,
    ),
    allDay: false,
    createdById: 1,
  },
  {
    title: "Product Launch Party",
    description: "Celebration for the successful launch of our new mobile app",
    location: "Office Lounge",
    startDateTime: new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 5,
      18,
      0,
    ),
    endDateTime: new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 5,
      21,
      0,
    ),
    allDay: false,
    createdById: 2,
  },
];

const samplePolls = [
  {
    title: "Office Lunch Preference",
    content: "What type of lunch would you prefer for the next team meeting?",
    createdById: 1,
  },
  {
    title: "Next Team Building Activity",
    content:
      "Which activity would you like to do for our next team building event?",
    createdById: 2,
  },
];

const samplePollOptions = [
  { pollId: 1, text: "Pizza", votes: 8 },
  { pollId: 1, text: "Sandwiches", votes: 5 },
  { pollId: 1, text: "Salad Bar", votes: 3 },
  { pollId: 1, text: "Taco Bar", votes: 7 },
  { pollId: 2, text: "Escape Room", votes: 12 },
  { pollId: 2, text: "Cooking Class", votes: 6 },
  { pollId: 2, text: "Outdoor Adventure", votes: 8 },
  { pollId: 2, text: "Board Game Night", votes: 4 },
];

const sampleSpotlights = [
  {
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
  },
  {
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
  },
];

async function seedDatabase(db: any) {
  console.log("🌱 Starting database seeding...");

  try {
    // Clear existing data (in correct order to handle foreign key constraints)
    console.log("🗑️ Clearing existing data...");
    await db.delete(projectActivities);
    await db.delete(pollVotes);
    await db.delete(pollOptions);
    await db.delete(polls);
    // Reset poll ID sequences (PostgreSQL)
    await db.execute(sql`ALTER SEQUENCE polls_id_seq RESTART WITH 1`);
    await db.execute(sql`ALTER SEQUENCE poll_options_id_seq RESTART WITH 1`);
    await db.execute(sql`ALTER SEQUENCE poll_votes_id_seq RESTART WITH 1`);
    await db.delete(eventRsvps);
    await db.delete(events);
    await db.delete(activityLog);
    await db.delete(likes);
    await db.delete(comments);
    await db.delete(spotlights);
    await db.delete(projectTeamMembers);
    await db.delete(tasks);
    await db.delete(resources);
    await db.delete(teamMembers);
    await db.delete(projects);
    await db.delete(users);

    // Insert users
    console.log("👥 Inserting users...");
    const insertedUsers = await db
      .insert(users)
      .values(sampleUsers)
      .returning();
    console.log(`✅ Inserted ${insertedUsers.length} users`);

    // Insert team members
    console.log("👥 Inserting team members...");

    // Create team members using the actual returned user IDs
    const sampleTeamMembersData = [
      {
        name: "John Smith",
        email: "john.smith@company.com",
        avatar:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
        userId: insertedUsers[0].id,
      },
      {
        name: "Sarah Johnson",
        email: "sarah.johnson@company.com",
        avatar:
          "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
        userId: insertedUsers[1].id,
      },
      {
        name: "Mike Chen",
        email: "mike.chen@company.com",
        avatar:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
        userId: insertedUsers[2].id,
      },
      {
        name: "Emily Davis",
        email: "emily.davis@company.com",
        avatar:
          "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
        userId: insertedUsers[3].id,
      },
      {
        name: "Alex Rodriguez",
        email: "alex.rodriguez@company.com",
        avatar:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
        userId: insertedUsers[4].id,
      },
      {
        name: "Lisa Wang",
        email: "lisa.wang@company.com",
        avatar:
          "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
        userId: insertedUsers[5].id,
      },
      {
        name: "David Brown",
        email: "david.brown@company.com",
        avatar:
          "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face",
        userId: insertedUsers[6].id,
      },
      {
        name: "Maria Garcia",
        email: "maria.garcia@company.com",
        avatar:
          "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face",
        userId: insertedUsers[7].id,
      },
    ];

    const insertedTeamMembers = await db
      .insert(teamMembers)
      .values(sampleTeamMembersData)
      .returning();
    console.log(`✅ Inserted ${insertedTeamMembers.length} team members`);

    // Insert projects
    console.log("📋 Inserting projects...");
    const sampleProjectsWithCreator = sampleProjects.map((project, index) => ({
      ...project,
      createdBy: insertedUsers[index % insertedUsers.length].id, // Assign creators in round-robin fashion
    }));
    const insertedProjects = await db
      .insert(projects)
      .values(sampleProjectsWithCreator)
      .returning();
    console.log(`✅ Inserted ${insertedProjects.length} projects`);

    // Insert project team members
    console.log("👥 Assigning team members to projects...");
    const projectTeamData: any[] = [];
    for (let i = 0; i < insertedProjects.length; i++) {
      const project = insertedProjects[i];
      const numMembers = Math.floor(Math.random() * 2) + 3; // 3 or 4 members
      const shuffledMembers = [...insertedTeamMembers].sort(
        () => 0.5 - Math.random(),
      );

      for (let j = 0; j < numMembers; j++) {
        projectTeamData.push({
          projectId: project.id,
          teamMemberId: shuffledMembers[j].id,
          role: j === 0 ? "admin" : "member",
          joinedAt: new Date(
            Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
          ),
          invitedBy: j === 0 ? null : shuffledMembers[0].id,
        });
      }
    }
    await db.insert(projectTeamMembers).values(projectTeamData);
    console.log(`✅ Assigned team members to projects`);

    // Insert tasks
    console.log("📝 Inserting tasks...");

    // Create tasks using actual project and team member IDs
    const sampleTasksData = [
      {
        title: "Design homepage mockups",
        description: "Create wireframes and mockups for the new homepage",
        status: "completed",
        priority: "high",
        projectId: insertedProjects[0].id, // Website Redesign
        assigneeId: insertedTeamMembers[1].id, // Sarah
      },
      {
        title: "Implement responsive navigation",
        description: "Build responsive navigation menu with mobile support",
        status: "completed",
        priority: "high",
        projectId: insertedProjects[0].id, // Website Redesign
        assigneeId: insertedTeamMembers[2].id, // Mike
      },
      {
        title: "Optimize page load speed",
        description: "Improve website performance and loading times",
        status: "in-progress",
        priority: "medium",
        projectId: insertedProjects[0].id, // Website Redesign
        assigneeId: insertedTeamMembers[3].id, // Emily
      },
      {
        title: "App architecture planning",
        description: "Design app architecture and technical specifications",
        status: "completed",
        priority: "high",
        projectId: insertedProjects[1].id, // Mobile App Development
        assigneeId: insertedTeamMembers[2].id, // Mike
      },
    ];

    const insertedTasks = await db
      .insert(tasks)
      .values(sampleTasksData)
      .returning();
    console.log(`✅ Inserted ${insertedTasks.length} tasks`);

    // Insert resources
    console.log("📚 Inserting resources...");

    // Create resources using actual project IDs
    const sampleResourcesData = [
      {
        title: "Design System Guide",
        type: "document",
        url: "https://docs.google.com/document/d/123",
        description: "Complete design system and style guide",
        projectId: insertedProjects[0].id, // Website Redesign
      },
      {
        title: "Figma Design Files",
        type: "design",
        url: "https://figma.com/file/abc123",
        description: "All design mockups and prototypes",
        projectId: insertedProjects[0].id, // Website Redesign
      },
    ];

    const insertedResources = await db
      .insert(resources)
      .values(sampleResourcesData)
      .returning();
    console.log(`✅ Inserted ${insertedResources.length} resources`);

    // Insert events
    console.log("📅 Inserting events...");
    const sampleEventsData = [
      {
        title: "Q3 All-Hands Meeting",
        description:
          "Quarterly all-hands meeting to discuss company updates and Q4 goals",
        location: "Conference Room A",
        startDateTime: new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() + 2,
          10,
          0,
        ),
        endDateTime: new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() + 2,
          11,
          30,
        ),
        allDay: false,
        createdById: insertedUsers[0].id,
      },
      {
        title: "Product Launch Party",
        description:
          "Celebration for the successful launch of our new mobile app",
        location: "Office Lounge",
        startDateTime: new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() + 5,
          18,
          0,
        ),
        endDateTime: new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() + 5,
          21,
          0,
        ),
        allDay: false,
        createdById: insertedUsers[1].id,
      },
    ];
    const insertedEvents = await db
      .insert(events)
      .values(sampleEventsData)
      .returning();
    console.log(`✅ Inserted ${insertedEvents.length} events`);

    // Insert polls
    console.log("🗳️ Inserting polls...");
    const samplePollsData = [
      {
        title: "Office Lunch Preference",
        content:
          "What type of lunch would you prefer for the next team meeting?",
        createdById: insertedUsers[0].id,
      },
      {
        title: "Next Team Building Activity",
        content:
          "Which activity would you like to do for our next team building event?",
        createdById: insertedUsers[1].id,
      },
    ];
    const insertedPolls = await db
      .insert(polls)
      .values(samplePollsData)
      .returning();
    console.log(`✅ Inserted ${insertedPolls.length} polls`);

    // Insert poll options
    console.log("📊 Inserting poll options...");
    const samplePollOptionsData = [
      { pollId: insertedPolls[0].id, text: "Pizza", votes: 8 },
      { pollId: insertedPolls[0].id, text: "Sandwiches", votes: 5 },
      { pollId: insertedPolls[0].id, text: "Salad Bar", votes: 3 },
      { pollId: insertedPolls[0].id, text: "Taco Bar", votes: 7 },
      { pollId: insertedPolls[1].id, text: "Escape Room", votes: 12 },
      { pollId: insertedPolls[1].id, text: "Cooking Class", votes: 6 },
      { pollId: insertedPolls[1].id, text: "Outdoor Adventure", votes: 8 },
      { pollId: insertedPolls[1].id, text: "Board Game Night", votes: 4 },
    ];
    const insertedPollOptions = await db
      .insert(pollOptions)
      .values(samplePollOptionsData)
      .returning();
    console.log(`✅ Inserted ${insertedPollOptions.length} poll options`);

    // Insert spotlights
    console.log("⭐ Inserting spotlights...");
    const sampleSpotlightsData = [
      {
        type: "musician",
        name: "Sarah Chen",
        title: "Indie Folk Singer-Songwriter",
        description:
          "Sarah's ethereal voice and introspective lyrics have been captivating Melbourne audiences for over 5 years.",
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
        ]),
        stats: JSON.stringify({
          monthlyListeners: "12.5K",
          followers: "8.2K",
          upcomingShows: "3",
        }),
        isCurrent: true,
        createdById: insertedUsers[0].id,
      },
    ];
    const insertedSpotlights = await db
      .insert(spotlights)
      .values(sampleSpotlightsData)
      .returning();
    console.log(`✅ Inserted ${insertedSpotlights.length} spotlights`);

    // Insert some poll votes
    console.log("🗳️ Adding poll votes...");
    const pollVotesData: any[] = [];
    for (let i = 0; i < 15; i++) {
      pollVotesData.push({
        pollId:
          insertedPolls[Math.floor(Math.random() * insertedPolls.length)].id,
        optionId:
          insertedPollOptions[
            Math.floor(Math.random() * insertedPollOptions.length)
          ].id,
        userId:
          insertedUsers[Math.floor(Math.random() * insertedUsers.length)].id,
      });
    }
    await db.insert(pollVotes).values(pollVotesData);
    console.log(`✅ Added poll votes`);

    // Add some sample likes and comments for spotlights
    console.log("❤️ Adding spotlight likes and comments...");
    const currentSpotlight = insertedSpotlights.find((s: any) => s.isCurrent);
    if (currentSpotlight) {
      // Add likes for current spotlight
      const spotlightLikes = [
        {
          userId: insertedUsers[0].id,
          targetId: currentSpotlight.id,
          targetType: "spotlight",
        },
        {
          userId: insertedUsers[1].id,
          targetId: currentSpotlight.id,
          targetType: "spotlight",
        },
        {
          userId: insertedUsers[2].id,
          targetId: currentSpotlight.id,
          targetType: "spotlight",
        },
        {
          userId: insertedUsers[3].id,
          targetId: currentSpotlight.id,
          targetType: "spotlight",
        },
        {
          userId: insertedUsers[4].id,
          targetId: currentSpotlight.id,
          targetType: "spotlight",
        },
      ];
      await db.insert(likes).values(spotlightLikes);

      // Add comments for current spotlight
      const spotlightComments = [
        {
          userId: insertedUsers[0].id,
          targetId: currentSpotlight.id,
          targetType: "spotlight",
          content:
            "Amazing artist! Love the folk vibes. Can't wait to see them live!",
        },
        {
          userId: insertedUsers[1].id,
          targetId: currentSpotlight.id,
          targetType: "spotlight",
          content:
            "The new EP is incredible. Such beautiful lyrics and melodies.",
        },
        {
          userId: insertedUsers[2].id,
          targetId: currentSpotlight.id,
          targetType: "spotlight",
          content:
            "Definitely checking out their Spotify now. Thanks for the recommendation!",
        },
      ];
      await db.insert(comments).values(spotlightComments);
    }
    console.log(`✅ Added spotlight likes and comments`);

    console.log("🎉 Database seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`- ${insertedUsers.length} users`);
    console.log(`- ${insertedTeamMembers.length} team members`);
    console.log(`- ${insertedProjects.length} projects`);
    console.log(`- ${insertedTasks.length} tasks`);
    console.log(`- ${insertedResources.length} resources`);
    console.log(`- ${insertedEvents.length} events`);
    console.log(`- ${insertedPolls.length} polls`);
    console.log(`- ${insertedPollOptions.length} poll options`);
    console.log(`- ${insertedSpotlights.length} spotlights`);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

export { seedDatabase };

// Main execution for direct running
async function main() {
  console.log("🚀 Starting main seed function...");

  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL environment variable is required");
    throw new Error("DATABASE_URL environment variable is required");
  }

  console.log("✅ DATABASE_URL found, creating connection...");

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
  });

  const db = drizzle(pool);

  try {
    console.log("🌱 Starting database seeding...");
    await seedDatabase(db);
    console.log("✅ Seeding completed successfully!");
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    await pool.end();
    process.exit(1);
  }
}

// Run the main function
main().catch(console.error);
