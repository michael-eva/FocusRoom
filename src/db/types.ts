import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { spotlights, likes, comments } from "./schema";

// Spotlight types
export type Spotlight = InferSelectModel<typeof spotlights>;

// Related types that reference spotlights
export type Like = InferSelectModel<typeof likes>;
export type NewLike = InferInsertModel<typeof likes>;

export type Comment = InferSelectModel<typeof comments>;
export type NewComment = InferInsertModel<typeof comments>;

// Spotlight-specific types
export type SpotlightType = "musician" | "venue";

export interface SpotlightLink {
  type: string;
  url: string;
  label: string;
}

export interface SpotlightStats {
  monthlyListeners: string;
  followers: string;
  upcomingShows: string;
}

// Form data type for the management dialog
