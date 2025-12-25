import * as z from "zod";

export const genres = [
  "Empty",
  "Rock",
  "Pop",
  "Jazz",
  "Blues",
  "Folk",
  "Country",
  "Classical",
  "Metal",
  "Punk",
  "Reggae",
  "Hip-Hop",
  "Electronic",
  "R&B",
  "Soul",
  "Funk",
  "Disco",
];

export const themes = [
  "Empty",
  "Love",
  "Life",
  "Nature",
  "Travel",
  "Friendship",
  "Family",
  "Work",
  "Party",
  "Sadness",
  "Joy",
  "Hope",
  "Dream",
  "Social",
  "Political",
  "Religious",
  "Philosophical",
];

export const createAlbumSchema = z.object({
  title: z
    .string()
    .min(1, "Album title is required")
    .max(200, "Album title cannot exceed 200 characters"),

  genre: z
    .string()
    .max(100, "Genre cannot exceed 100 characters")
    .optional()
    .or(z.literal("")),

  theme: z
    .string()
    .max(100, "Theme cannot exceed 100 characters")
    .optional()
    .or(z.literal("")),

  description: z
    .string()
    .max(2000, "Description cannot exceed 2000 characters")
    .optional()
    .or(z.literal("")),

  isPublic: z.boolean(),
});

export type CreateAlbumFormValues = z.infer<typeof createAlbumSchema>;
