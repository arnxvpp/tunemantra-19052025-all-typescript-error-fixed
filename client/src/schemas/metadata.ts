import * as z from "zod";

// Track schema for individual tracks in a release
export const trackSchema = z.object({
  trackNumber: z.string().min(1, "Track number is required"),
  trackTitle: z.string().min(1, "Track title is required"),
  version: z.string().optional(),
  cdNumber: z.string().optional(),
  isrc: z.string().optional(),
  trackCatalogNumber: z.string().optional(),
  primaryArtists: z.array(z.string().min(1, "Artist name is required")).nonempty("At least one primary artist is required"),
  featuringArtists: z.array(z.string()).optional().default([]),
  composers: z.array(z.string().min(1, "Composer name is required")).nonempty("At least one composer is required"),
  lyricists: z.array(z.string().min(1, "Lyricist name is required")).nonempty("At least one lyricist is required"),
  producers: z.array(z.string()).optional().default([]),
  arrangers: z.array(z.string()).optional().default([]),
  remixer: z.string().optional(),
  publisher: z.string().optional(),
  duration: z.string().min(1, "Duration is required"),
  trackGenre: z.string().min(1, "Track genre is required"),
  languageOfPerformance: z.string().min(1, "Language of performance is required"),
  explicitLyrics: z.boolean().default(false),
  instrumentalOnly: z.boolean().default(false),
  lyricsLanguage: z.string().optional(),
  availableSeparately: z.boolean().default(false),
  preOrderOnly: z.boolean().default(false),
  streamingOnly: z.boolean().default(false),
  trackPriceTier: z.string().optional(),
  previewStart: z.string().optional(),
  spotifyId: z.string().optional(),
  appleMusicId: z.string().optional(),
  bpm: z.string().optional(),
  lyricsExcerpt: z.string().optional(),
});

// Metadata schema for full releases
export const metadataSchema = z.object({
  releaseTitle: z.string().min(1, "Release title is required"),
  subtitle: z.string().optional(),
  primaryArtists: z.array(z.string().min(1, "Artist name is required")).nonempty("At least one primary artist is required"),
  featuringArtists: z.array(z.string()).optional().default([]),
  composers: z.array(z.string().min(1, "Composer name is required")).nonempty("At least one composer is required"),
  lyricists: z.array(z.string().min(1, "Lyricist name is required")).nonempty("At least one lyricist is required"),
  label: z.string().min(1, "Label is required"),
  releaseType: z.enum(["Album", "Single", "EP", "Compilation"]),
  upc: z.string().optional(),
  ean: z.string().optional(),
  grid: z.string().optional(),
  releaseCatalogNumber: z.string().optional(),
  productionYear: z.string().min(1, "Production year is required"),
  pLine: z.string().min(1, "P line is required"),
  cLine: z.string().min(1, "C line is required"),
  copyrightYear: z.string().min(1, "Copyright year is required"),
  copyrightOwner: z.string().min(1, "Copyright owner is required"),
  masterRightsOwner: z.string().min(1, "Master rights owner is required"),
  publishingRights: z.string().min(1, "Publishing rights holder is required"),
  genre: z.string().min(1, "Genre is required"),
  subGenre: z.string().optional(),
  trackType: z.string().optional(), // e.g., "Audio", "Video"
  tags: z.string().optional().describe("Separate tags with commas"),
  moods: z.string().optional().describe("Separate moods with commas"),
  primaryGenre: z.string().min(1, "Primary genre is required"),
  secondaryGenre: z.string().optional(),
  titleLanguage: z.string().optional(),
  originalLanguage: z.string().optional(),
  parentalAdvisory: z.boolean().default(false),
  territories: z.string().default("Worldwide"),
  territoryExclusions: z.string().optional(),
  releasePriceTier: z.string().optional(),
  digitalReleaseDate: z.date({
    required_error: "Digital release date is required",
  }),
  originalReleaseDate: z.date({
    required_error: "Original release date is required",
  }),
  commercialDescription: z.string().optional(),
  commercialDescriptionOtherLang: z.string().optional(),
  artistBio: z.string().optional(),
  releaseDescription: z.string().optional(),
  marketingStatement: z.string().optional(),
  
  // Legal confirmations
  clearanceConfirmation: z.boolean().default(false),
  licensingConfirmation: z.boolean().default(false),
  agreementConfirmation: z.boolean().default(false),
});

export type MetadataFormValues = z.infer<typeof metadataSchema>;
export type TrackFormValues = z.infer<typeof trackSchema>;