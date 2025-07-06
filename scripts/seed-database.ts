import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
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
  eventRSVPs,
  activityLog,
  likes,
  comments,
} from "../src/db/schema.js";

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
  {
    name: "Customer Support System",
    description:
      "Implement new customer support ticketing and knowledge base system",
    status: "completed",
    progress: 100,
    totalTasks: 15,
    completedTasks: 15,
    deadline: new Date("2024-02-28"),
    priority: "medium",
  },
  {
    name: "Data Migration Project",
    description: "Migrate legacy data to new cloud-based infrastructure",
    status: "active",
    progress: 45,
    totalTasks: 10,
    completedTasks: 4,
    deadline: new Date("2024-05-15"),
    priority: "low",
  },
];

const sampleTasks = [
  // Website Redesign tasks
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
    title: "Set up analytics tracking",
    description: "Configure Google Analytics and conversion tracking",
    status: "pending",
    priority: "medium",
    projectId: 1,
    assigneeId: 5,
  },
  {
    title: "Content migration",
    description: "Migrate existing content to new CMS structure",
    status: "pending",
    priority: "low",
    projectId: 1,
    assigneeId: 6,
  },
  {
    title: "SEO optimization",
    description: "Implement SEO best practices and meta tags",
    status: "pending",
    priority: "medium",
    projectId: 1,
    assigneeId: 7,
  },
  {
    title: "User testing",
    description: "Conduct usability testing with target audience",
    status: "pending",
    priority: "high",
    projectId: 1,
    assigneeId: 8,
  },
  {
    title: "Final review and launch",
    description: "Final testing and deployment to production",
    status: "pending",
    priority: "high",
    projectId: 1,
    assigneeId: 1,
  },

  // Mobile App Development tasks
  {
    title: "App architecture planning",
    description: "Design app architecture and technical specifications",
    status: "completed",
    priority: "high",
    projectId: 2,
    assigneeId: 3,
  },
  {
    title: "UI/UX design",
    description: "Create app interface designs and user flows",
    status: "completed",
    priority: "high",
    projectId: 2,
    assigneeId: 2,
  },
  {
    title: "Backend API development",
    description: "Develop RESTful APIs for app functionality",
    status: "in-progress",
    priority: "high",
    projectId: 2,
    assigneeId: 4,
  },
  {
    title: "iOS app development",
    description: "Build native iOS app using Swift",
    status: "pending",
    priority: "high",
    projectId: 2,
    assigneeId: 5,
  },
  {
    title: "Android app development",
    description: "Build native Android app using Kotlin",
    status: "pending",
    priority: "high",
    projectId: 2,
    assigneeId: 6,
  },
  {
    title: "Testing and QA",
    description: "Comprehensive testing across devices and platforms",
    status: "pending",
    priority: "medium",
    projectId: 2,
    assigneeId: 7,
  },
  {
    title: "App store submission",
    description: "Prepare and submit apps to App Store and Play Store",
    status: "pending",
    priority: "medium",
    projectId: 2,
    assigneeId: 8,
  },
  {
    title: "Marketing materials",
    description: "Create app store screenshots and promotional content",
    status: "pending",
    priority: "low",
    projectId: 2,
    assigneeId: 1,
  },
  {
    title: "Beta testing program",
    description: "Organize beta testing with selected users",
    status: "pending",
    priority: "medium",
    projectId: 2,
    assigneeId: 2,
  },
  {
    title: "Launch preparation",
    description: "Final preparations for app launch",
    status: "pending",
    priority: "high",
    projectId: 2,
    assigneeId: 3,
  },

  // Marketing Campaign tasks
  {
    title: "Campaign strategy",
    description: "Develop comprehensive marketing strategy",
    status: "completed",
    priority: "high",
    projectId: 3,
    assigneeId: 1,
  },
  {
    title: "Content creation",
    description: "Create marketing materials and copy",
    status: "completed",
    priority: "high",
    projectId: 3,
    assigneeId: 2,
  },
  {
    title: "Social media setup",
    description: "Set up social media campaigns and scheduling",
    status: "completed",
    priority: "medium",
    projectId: 3,
    assigneeId: 3,
  },
  {
    title: "Email marketing",
    description: "Design and send email campaigns",
    status: "in-progress",
    priority: "medium",
    projectId: 3,
    assigneeId: 4,
  },
  {
    title: "Paid advertising",
    description: "Set up and manage paid advertising campaigns",
    status: "in-progress",
    priority: "high",
    projectId: 3,
    assigneeId: 5,
  },
  {
    title: "Analytics tracking",
    description: "Track campaign performance and metrics",
    status: "pending",
    priority: "medium",
    projectId: 3,
    assigneeId: 6,
  },
  {
    title: "A/B testing",
    description: "Conduct A/B tests for campaign optimization",
    status: "pending",
    priority: "low",
    projectId: 3,
    assigneeId: 7,
  },
  {
    title: "Campaign review",
    description: "Review results and plan next quarter",
    status: "pending",
    priority: "medium",
    projectId: 3,
    assigneeId: 8,
  },

  // Customer Support System tasks
  {
    title: "Requirements gathering",
    description: "Gather requirements from support team",
    status: "completed",
    priority: "high",
    projectId: 4,
    assigneeId: 1,
  },
  {
    title: "Vendor selection",
    description: "Evaluate and select support system vendor",
    status: "completed",
    priority: "high",
    projectId: 4,
    assigneeId: 2,
  },
  {
    title: "System configuration",
    description: "Configure support system settings",
    status: "completed",
    priority: "medium",
    projectId: 4,
    assigneeId: 3,
  },
  {
    title: "Integration setup",
    description: "Integrate with existing systems",
    status: "completed",
    priority: "medium",
    projectId: 4,
    assigneeId: 4,
  },
  {
    title: "Team training",
    description: "Train support team on new system",
    status: "completed",
    priority: "high",
    projectId: 4,
    assigneeId: 5,
  },
  {
    title: "Knowledge base creation",
    description: "Create initial knowledge base articles",
    status: "completed",
    priority: "medium",
    projectId: 4,
    assigneeId: 6,
  },
  {
    title: "Testing and validation",
    description: "Test system functionality",
    status: "completed",
    priority: "medium",
    projectId: 4,
    assigneeId: 7,
  },
  {
    title: "Go-live preparation",
    description: "Final preparations for system launch",
    status: "completed",
    priority: "high",
    projectId: 4,
    assigneeId: 8,
  },
  {
    title: "Launch and monitoring",
    description: "Launch system and monitor performance",
    status: "completed",
    priority: "high",
    projectId: 4,
    assigneeId: 1,
  },
  {
    title: "User feedback collection",
    description: "Collect feedback from support team",
    status: "completed",
    priority: "medium",
    projectId: 4,
    assigneeId: 2,
  },
  {
    title: "System optimization",
    description: "Optimize based on user feedback",
    status: "completed",
    priority: "medium",
    projectId: 4,
    assigneeId: 3,
  },
  {
    title: "Documentation update",
    description: "Update system documentation",
    status: "completed",
    priority: "low",
    projectId: 4,
    assigneeId: 4,
  },
  {
    title: "Training materials",
    description: "Create training materials for new hires",
    status: "completed",
    priority: "low",
    projectId: 4,
    assigneeId: 5,
  },
  {
    title: "Performance review",
    description: "Review system performance metrics",
    status: "completed",
    priority: "medium",
    projectId: 4,
    assigneeId: 6,
  },
  {
    title: "Project closure",
    description: "Final project review and closure",
    status: "completed",
    priority: "low",
    projectId: 4,
    assigneeId: 7,
  },

  // Data Migration tasks
  {
    title: "Data audit",
    description: "Audit existing data structure and quality",
    status: "completed",
    priority: "high",
    projectId: 5,
    assigneeId: 4,
  },
  {
    title: "Migration planning",
    description: "Plan migration strategy and timeline",
    status: "completed",
    priority: "high",
    projectId: 5,
    assigneeId: 5,
  },
  {
    title: "Infrastructure setup",
    description: "Set up new cloud infrastructure",
    status: "in-progress",
    priority: "high",
    projectId: 5,
    assigneeId: 6,
  },
  {
    title: "Data mapping",
    description: "Map old data structure to new format",
    status: "in-progress",
    priority: "medium",
    projectId: 5,
    assigneeId: 7,
  },
  {
    title: "Migration scripts",
    description: "Develop data migration scripts",
    status: "pending",
    priority: "high",
    projectId: 5,
    assigneeId: 8,
  },
  {
    title: "Test migration",
    description: "Perform test migration with sample data",
    status: "pending",
    priority: "medium",
    projectId: 5,
    assigneeId: 1,
  },
  {
    title: "Data validation",
    description: "Validate migrated data integrity",
    status: "pending",
    priority: "high",
    projectId: 5,
    assigneeId: 2,
  },
  {
    title: "Performance testing",
    description: "Test system performance with new data",
    status: "pending",
    priority: "medium",
    projectId: 5,
    assigneeId: 3,
  },
  {
    title: "Rollback plan",
    description: "Create rollback plan in case of issues",
    status: "pending",
    priority: "low",
    projectId: 5,
    assigneeId: 4,
  },
  {
    title: "Go-live",
    description: "Execute final migration to production",
    status: "pending",
    priority: "high",
    projectId: 5,
    assigneeId: 5,
  },
];

const sampleResources = [
  // Website Redesign resources
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
  {
    title: "Content Inventory",
    type: "spreadsheet",
    url: "https://docs.google.com/spreadsheets/d/456",
    description: "Complete inventory of existing content",
    projectId: 1,
  },
  {
    title: "SEO Audit Report",
    type: "document",
    url: "https://docs.google.com/document/d/789",
    description: "Comprehensive SEO audit and recommendations",
    projectId: 1,
  },
  {
    title: "Analytics Dashboard",
    type: "tool",
    url: "https://analytics.google.com",
    description: "Google Analytics dashboard for tracking",
    projectId: 1,
  },

  // Mobile App Development resources
  {
    title: "App Architecture Document",
    type: "document",
    url: "https://docs.google.com/document/d/def456",
    description: "Technical architecture and specifications",
    projectId: 2,
  },
  {
    title: "API Documentation",
    type: "document",
    url: "https://docs.api.com",
    description: "Complete API documentation and endpoints",
    projectId: 2,
  },
  {
    title: "App Store Guidelines",
    type: "document",
    url: "https://developer.apple.com/guidelines",
    description: "Apple App Store submission guidelines",
    projectId: 2,
  },
  {
    title: "Play Store Guidelines",
    type: "document",
    url: "https://developer.android.com/guidelines",
    description: "Google Play Store submission guidelines",
    projectId: 2,
  },
  {
    title: "Testing Checklist",
    type: "document",
    url: "https://docs.google.com/document/d/ghi789",
    description: "Comprehensive testing checklist",
    projectId: 2,
  },
  {
    title: "Beta Testing Platform",
    type: "tool",
    url: "https://testflight.apple.com",
    description: "TestFlight for iOS beta testing",
    projectId: 2,
  },
  {
    title: "Android Beta Platform",
    type: "tool",
    url: "https://play.google.com/console",
    description: "Google Play Console for Android beta",
    projectId: 2,
  },

  // Marketing Campaign resources
  {
    title: "Campaign Brief",
    type: "document",
    url: "https://docs.google.com/document/d/jkl012",
    description: "Complete campaign brief and objectives",
    projectId: 3,
  },
  {
    title: "Content Calendar",
    type: "spreadsheet",
    url: "https://docs.google.com/spreadsheets/d/mno345",
    description: "Content calendar and publishing schedule",
    projectId: 3,
  },
  {
    title: "Social Media Assets",
    type: "design",
    url: "https://drive.google.com/folder/678",
    description: "All social media graphics and assets",
    projectId: 3,
  },
  {
    title: "Email Templates",
    type: "design",
    url: "https://mailchimp.com/templates",
    description: "Email marketing templates",
    projectId: 3,
  },
  {
    title: "Ad Account Access",
    type: "tool",
    url: "https://ads.google.com",
    description: "Google Ads account for paid campaigns",
    projectId: 3,
  },
  {
    title: "Analytics Dashboard",
    type: "tool",
    url: "https://analytics.google.com",
    description: "Campaign performance dashboard",
    projectId: 3,
  },

  // Customer Support System resources
  {
    title: "Requirements Document",
    type: "document",
    url: "https://docs.google.com/document/d/pqr678",
    description: "Detailed requirements specification",
    projectId: 4,
  },
  {
    title: "Vendor Comparison",
    type: "spreadsheet",
    url: "https://docs.google.com/spreadsheets/d/stu901",
    description: "Vendor comparison and evaluation",
    projectId: 4,
  },
  {
    title: "System Configuration Guide",
    type: "document",
    url: "https://docs.support-system.com",
    description: "System configuration documentation",
    projectId: 4,
  },
  {
    title: "Training Materials",
    type: "document",
    url: "https://docs.google.com/document/d/vwx234",
    description: "Team training materials and guides",
    projectId: 4,
  },
  {
    title: "Knowledge Base Template",
    type: "document",
    url: "https://docs.google.com/document/d/yzab567",
    description: "Knowledge base article templates",
    projectId: 4,
  },
  {
    title: "Support System Access",
    type: "tool",
    url: "https://support.company.com",
    description: "Access to the support system",
    projectId: 4,
  },

  // Data Migration resources
  {
    title: "Data Audit Report",
    type: "document",
    url: "https://docs.google.com/document/d/cdef890",
    description: "Complete data audit findings",
    projectId: 5,
  },
  {
    title: "Migration Plan",
    type: "document",
    url: "https://docs.google.com/document/d/ghij123",
    description: "Detailed migration plan and timeline",
    projectId: 5,
  },
  {
    title: "Data Mapping Document",
    type: "spreadsheet",
    url: "https://docs.google.com/spreadsheets/d/klmn456",
    description: "Data field mapping from old to new",
    projectId: 5,
  },
  {
    title: "Migration Scripts",
    type: "code",
    url: "https://github.com/company/migration-scripts",
    description: "All migration scripts and tools",
    projectId: 5,
  },
  {
    title: "Cloud Infrastructure Docs",
    type: "document",
    url: "https://docs.aws.amazon.com",
    description: "AWS infrastructure documentation",
    projectId: 5,
  },
  {
    title: "Validation Tools",
    type: "tool",
    url: "https://validation.company.com",
    description: "Data validation and testing tools",
    projectId: 5,
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
  {
    title: "Team Building Workshop",
    description:
      "Interactive workshop to improve team collaboration and communication",
    location: "Training Room B",
    startDateTime: new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 10,
      14,
      0,
    ),
    endDateTime: new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 10,
      17,
      0,
    ),
    allDay: false,
    createdById: 3,
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
  {
    title: "Work From Home Policy",
    content: "How many days per week would you prefer to work from home?",
    createdById: 3,
  },
];

const samplePollOptions = [
  // Office Lunch Preference options
  { pollId: 1, text: "Pizza", votes: 8 },
  { pollId: 1, text: "Sandwiches", votes: 5 },
  { pollId: 1, text: "Salad Bar", votes: 3 },
  { pollId: 1, text: "Taco Bar", votes: 7 },

  // Next Team Building Activity options
  { pollId: 2, text: "Escape Room", votes: 12 },
  { pollId: 2, text: "Cooking Class", votes: 6 },
  { pollId: 2, text: "Outdoor Adventure", votes: 8 },
  { pollId: 2, text: "Board Game Night", votes: 4 },

  // Work From Home Policy options
  { pollId: 3, text: "1 day per week", votes: 3 },
  { pollId: 3, text: "2 days per week", votes: 8 },
  { pollId: 3, text: "3 days per week", votes: 12 },
  { pollId: 3, text: "Fully remote", votes: 2 },
];

async function seedDatabase(db) {
  console.log("🌱 Starting database seeding...");

  try {
    // Clear existing data
    console.log("🗑️ Clearing existing data...");
    await db.delete(projectActivities);
    await db.delete(pollVotes);
    await db.delete(pollOptions);
    await db.delete(polls);
    await db.delete(eventRSVPs);
    await db.delete(events);
    await db.delete(activityLog);
    await db.delete(likes);
    await db.delete(comments);
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
    const insertedTeamMembers = await db
      .insert(teamMembers)
      .values(sampleTeamMembers)
      .returning();
    console.log(`✅ Inserted ${insertedTeamMembers.length} team members`);

    // Insert projects
    console.log("📋 Inserting projects...");
    const insertedProjects = await db
      .insert(projects)
      .values(sampleProjects)
      .returning();
    console.log(`✅ Inserted ${insertedProjects.length} projects`);

    // Insert project team members
    console.log("👥 Assigning team members to projects...");
    const projectTeamData: any[] = [];
    for (let i = 0; i < insertedProjects.length; i++) {
      const project = insertedProjects[i];
      // Assign 3-6 team members to each project
      const numMembers = Math.floor(Math.random() * 4) + 3;
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
          ), // Random date within last 30 days
        });
      }
    }
    await db.insert(projectTeamMembers).values(projectTeamData);
    console.log(`✅ Assigned team members to projects`);

    // Insert tasks
    console.log("📝 Inserting tasks...");
    const insertedTasks = await db
      .insert(tasks)
      .values(sampleTasks)
      .returning();
    console.log(`✅ Inserted ${insertedTasks.length} tasks`);

    // Insert resources
    console.log("📚 Inserting resources...");
    const insertedResources = await db
      .insert(resources)
      .values(sampleResources)
      .returning();
    console.log(`✅ Inserted ${insertedResources.length} resources`);

    // Insert events
    console.log("📅 Inserting events...");
    const insertedEvents = await db
      .insert(events)
      .values(sampleEvents)
      .returning();
    console.log(`✅ Inserted ${insertedEvents.length} events`);

    // Insert polls
    console.log("🗳️ Inserting polls...");
    const insertedPolls = await db
      .insert(polls)
      .values(samplePolls)
      .returning();
    console.log(`✅ Inserted ${insertedPolls.length} polls`);

    // Insert poll options
    console.log("📊 Inserting poll options...");
    const insertedPollOptions = await db
      .insert(pollOptions)
      .values(samplePollOptions)
      .returning();
    console.log(`✅ Inserted ${insertedPollOptions.length} poll options`);

    // Insert some poll votes
    console.log("🗳️ Adding poll votes...");
    const pollVotesData: any[] = [];
    for (let i = 0; i < 20; i++) {
      pollVotesData.push({
        pollId: Math.floor(Math.random() * 3) + 1,
        optionId: Math.floor(Math.random() * 12) + 1,
        userId: Math.floor(Math.random() * 8) + 1,
      });
    }
    await db.insert(pollVotes).values(pollVotesData);
    console.log(`✅ Added poll votes`);

    // Insert project activities
    console.log("📈 Creating project activities...");
    const activitiesData: any[] = [];

    // Generate activities for each project
    for (const project of insertedProjects) {
      const projectTasks = insertedTasks.filter(
        (task) => task.projectId === project.id,
      );
      const projectResources = insertedResources.filter(
        (resource) => resource.projectId === project.id,
      );

      // Project creation activity
      activitiesData.push({
        projectId: project.id,
        type: "project_updated",
        description: `Project "${project.name}" was created`,
        userId: 1,
        timestamp: new Date(
          Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
        ),
      });

      // Task activities
      for (const task of projectTasks) {
        activitiesData.push({
          projectId: project.id,
          type: "task_created",
          description: `Task "${task.title}" was created`,
          taskId: task.id,
          userId: Math.floor(Math.random() * 8) + 1,
          timestamp: new Date(
            Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
          ),
        });

        if (task.status === "completed") {
          activitiesData.push({
            projectId: project.id,
            type: "task_completed",
            description: `Task "${task.title}" was completed`,
            taskId: task.id,
            userId: task.assigneeId || Math.floor(Math.random() * 8) + 1,
            timestamp: new Date(
              Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000,
            ),
          });
        }

        if (task.assigneeId) {
          activitiesData.push({
            projectId: project.id,
            type: "task_assigned",
            description: `Task "${task.title}" was assigned to team member`,
            taskId: task.id,
            userId: Math.floor(Math.random() * 8) + 1,
            timestamp: new Date(
              Date.now() - Math.random() * 25 * 24 * 60 * 60 * 1000,
            ),
          });
        }
      }

      // Resource activities
      for (const resource of projectResources) {
        activitiesData.push({
          projectId: project.id,
          type: "resource_added",
          description: `Resource "${resource.title}" was added`,
          resourceId: resource.id,
          userId: Math.floor(Math.random() * 8) + 1,
          timestamp: new Date(
            Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
          ),
        });
      }
    }

    await db.insert(projectActivities).values(activitiesData);
    console.log(`✅ Created ${activitiesData.length} project activities`);

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
    console.log(`- ${activitiesData.length} project activities`);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

export { seedDatabase };
