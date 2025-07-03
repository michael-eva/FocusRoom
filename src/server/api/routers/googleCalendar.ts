import { z } from "zod";
import { google } from "googleapis";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { env } from "~/env";

const oauth2Client = new google.auth.OAuth2(
  env.GOOGLE_CLIENT_ID,
  env.GOOGLE_CLIENT_SECRET,
  "http://localhost:3000/api/trpc/googleCalendar/oauthCallback", // This should match your Authorized redirect URI
);

export const googleCalendarRouter = createTRPCRouter({
  getAuthUrl: publicProcedure.query(() => {
    const scopes = ["https://www.googleapis.com/auth/calendar.events"];
    const authorizationUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      prompt: "consent", // Ensures refresh token is always returned
    });
    return { authorizationUrl };
  }),

  oauthCallback: publicProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ input }) => {
      const { tokens } = await oauth2Client.getToken(input.code);
      // In a real application, you would save these tokens (especially the refresh token)
      // to a secure database associated with the user.
      // For this example, we'll just return them.
      oauth2Client.setCredentials(tokens);
      return { message: "Authentication successful!", tokens };
    }),

  createEvent: publicProcedure
    .input(
      z.object({
        summary: z.string(),
        description: z.string().optional(),
        location: z.string().optional(),
        startDateTime: z.string(), // ISO string
        endDateTime: z.string(), // ISO string
        timeZone: z.string().default("America/Los_Angeles"), // Example default
        accessToken: z.string().optional(),
        refreshToken: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      // Set up OAuth client with tokens
      if (input.accessToken) {
        oauth2Client.setCredentials({
          access_token: input.accessToken,
          refresh_token: input.refreshToken,
        });
      }

      const calendar = google.calendar({ version: "v3", auth: oauth2Client });

      const event = {
        summary: input.summary,
        description: input.description,
        location: input.location,
        start: {
          dateTime: input.startDateTime,
          timeZone: input.timeZone,
        },
        end: {
          dateTime: input.endDateTime,
          timeZone: input.timeZone,
        },
      };

      try {
        const response = await calendar.events.insert({
          calendarId: "primary", // Use 'primary' for the user's default calendar
          requestBody: event,
        });
        return {
          message: "Event created successfully!",
          eventLink: response.data.htmlLink,
          eventId: response.data.id,
        };
      } catch (error: any) {
        console.error("Error creating calendar event:", error.message);
        throw new Error("Failed to create calendar event: " + error.message);
      }
    }),

  getEvents: publicProcedure
    .input(
      z.object({
        accessToken: z.string(),
        refreshToken: z.string().optional(),
        timeMin: z.string().optional(),
        timeMax: z.string().optional(),
        maxResults: z.number().default(50),
      }),
    )
    .query(async ({ input }) => {
      try {
        oauth2Client.setCredentials({
          access_token: input.accessToken,
          refresh_token: input.refreshToken,
        });

        const calendar = google.calendar({ version: "v3", auth: oauth2Client });
        const res = await calendar.events.list({
          calendarId: "primary",
          timeMin: input.timeMin || new Date().toISOString(),
          timeMax: input.timeMax,
          maxResults: input.maxResults,
          singleEvents: true,
          orderBy: "startTime",
        });

        return res.data.items || [];
      } catch (error: any) {
        console.error("Error fetching calendar events:", error.message);

        // If access token is expired, try to refresh it
        if (error.code === 401 && input.refreshToken) {
          try {
            console.log("Access token expired, refreshing...");
            oauth2Client.setCredentials({ refresh_token: input.refreshToken });
            const { credentials } = await oauth2Client.refreshAccessToken();
            oauth2Client.setCredentials(credentials);

            const calendar = google.calendar({
              version: "v3",
              auth: oauth2Client,
            });
            const res = await calendar.events.list({
              calendarId: "primary",
              timeMin: input.timeMin || new Date().toISOString(),
              timeMax: input.timeMax,
              maxResults: input.maxResults,
              singleEvents: true,
              orderBy: "startTime",
            });

            return {
              events: res.data.items || [],
              newAccessToken: credentials.access_token,
            };
          } catch (refreshError: any) {
            console.error("Error refreshing token:", refreshError.message);
            throw new Error(
              "Access token expired and refresh failed. Please reconnect Google Calendar.",
            );
          }
        }

        // If it's not a token issue, throw the original error
        if (error.code === 401) {
          throw new Error(
            "Google Calendar access denied. Please reconnect your account.",
          );
        }

        throw new Error("Failed to fetch calendar events: " + error.message);
      }
    }),

  revokeToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      try {
        await oauth2Client.revokeToken(input.token);
        return { message: "Token revoked successfully!" };
      } catch (error: any) {
        console.error("Error revoking token:", error.message);
        throw new Error("Failed to revoke token: " + error.message);
      }
    }),
});
