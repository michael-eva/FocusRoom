# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev` - Start development server with Turbo
- `npm run build` - Build the application
- `npm run start` - Start production server
- `npm run preview` - Build and start production server

### Code Quality
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run typecheck` - Run TypeScript type checking
- `npm run check` - Run both linting and type checking
- `npm run format:check` - Check code formatting with Prettier
- `npm run format:write` - Format code with Prettier

### Database (Drizzle ORM with PostgreSQL)
- `npm run db:generate` - Generate database migrations
- `npm run db:migrate` - Run database migrations
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Drizzle Studio for database management
- `npm run db:seed` - Seed database with sample data
- `npm run db:seed-spotlight` - Seed spotlight data specifically

## Architecture

This is a T3 Stack application (Next.js + tRPC + Tailwind + Drizzle + Clerk) built as "FocusRoom" - a cooperative music platform and community workspace.

### Tech Stack
- **Frontend**: Next.js 15 with React 19, Tailwind CSS, Radix UI components
- **Backend**: tRPC for type-safe API routes
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Clerk
- **Styling**: Tailwind CSS with custom components
- **State Management**: TanStack Query (React Query) via tRPC

### Key Features
- **Projects**: Collaborative project management with tasks, resources, and team members
- **Community**: Events, polls, RSVP system, posts with likes/comments
- **Calendar**: Google Calendar integration for event management
- **Spotlight**: Featured content system (artists, venues, etc.)
- **Chat**: Real-time messaging system
- **UAT**: User acceptance testing feedback collection

### Database Schema
The schema includes tables for:
- Projects (tasks, resources, team members, activities)
- Community features (posts, comments, likes, polls, events, RSVPs)
- Spotlights (featured content with various types)
- Chat messages with threading support
- User activity logging
- UAT feedback collection

### API Structure
tRPC routers are organized by feature:
- `project` - Project management (tasks, resources, team members)
- `events` - Event management and calendar integration
- `polls` / `rsvp` - Community engagement features
- `spotlight` - Featured content management
- `chat` - Messaging system
- `googleCalendar` - Calendar integration
- `feed` / `post` / `likes` / `comments` - Social features
- `users` / `activity` - User management and tracking
- `uat` - User feedback collection

### File Structure
- `src/app/` - Next.js App Router pages and API routes
- `src/components/ui/` - Reusable UI components (Radix-based)
- `src/server/api/routers/` - tRPC API route handlers
- `src/db/` - Database schema and connection logic
- `src/hooks/` - Custom React hooks
- `drizzle/` - Database migrations and schema snapshots

### Authentication
Uses Clerk for authentication with user roles (admin, member, moderator). All database records use `clerkUserId` for user identification.

### Development Notes
- Uses TypeScript with strict type checking
- Follows T3 Stack conventions for folder structure and imports
- Database uses PostgreSQL with Drizzle ORM for type-safe database operations
- All API calls are type-safe through tRPC
- Components use Radix UI primitives with custom styling