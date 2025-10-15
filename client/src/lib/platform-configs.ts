import { z } from "zod";

export const platformMetadataSchemas = {
  spotify: z.object({
    audioQuality: z.enum(["320kbps MP3", "WAV"]),
    isrc: z.string().regex(/^[A-Z]{2}-[A-Z0-9]{3}-\d{2}-\d{5}$/, "Invalid ISRC format"),
    explicit: z.boolean(),
    genres: z.array(z.string()).min(1, "At least one genre required"),
    territories: z.array(z.string()),
    releaseVersion: z.string().optional(),
  }),

  appleMusicSchema: z.object({
    audioQuality: z.enum(["WAV", "AIFF"]),
    bitDepth: z.enum(["16-bit", "24-bit"]),
    isrc: z.string().regex(/^[A-Z]{2}-[A-Z0-9]{3}-\d{2}-\d{5}$/, "Invalid ISRC format"),
    explicit: z.boolean(),
    genres: z.array(z.string()).min(1, "At least one genre required"),
    territories: z.array(z.string()),
    composerName: z.string().optional(),
  }),

  amazonMusicSchema: z.object({
    audioQuality: z.enum(["320kbps MP3", "WAV"]),
    isrc: z.string().regex(/^[A-Z]{2}-[A-Z0-9]{3}-\d{2}-\d{5}$/, "Invalid ISRC format"),
    explicit: z.boolean(),
    primaryGenre: z.string(),
    secondaryGenre: z.string().optional(),
    territories: z.array(z.string()),
  }),

  youtubeMusicSchema: z.object({
    audioQuality: z.enum(["WAV"]),
    isrc: z.string().regex(/^[A-Z]{2}-[A-Z0-9]{3}-\d{2}-\d{5}$/, "Invalid ISRC format"),
    contentId: z.string().optional(),
    assetId: z.string().optional(),
    territories: z.array(z.string()),
    contentCategory: z.enum(["Music", "Music Video"]),
  }),
};

export const platformRequirements = {
  spotify: {
    name: "Spotify",
    audioFormats: ["320kbps MP3", "WAV"],
    artworkSize: "3000x3000px",
    processingTime: {
      standard: "2-5 business days",
      priority: "24-48 hours"
    },
    qualityChecks: {
      audio: {
        minBitrate: 320,
        maxBitrate: 320,
        format: ["MP3", "WAV"],
        channels: 2,
        sampleRate: 44100
      },
      artwork: {
        minWidth: 3000,
        minHeight: 3000,
        format: ["JPG", "PNG"],
        maxFileSize: 10 * 1024 * 1024
      }
    },
    metadataFields: [
      { name: "ISRC", required: true },
      { name: "Explicit Rating", required: true },
      { name: "Primary Genre", required: true },
      { name: "Release Version", required: false },
    ]
  },
  appleMusic: {
    name: "Apple Music",
    audioFormats: ["WAV (16-bit or higher)", "AIFF"],
    artworkSize: "3000x3000px",
    processsingTime: {
      standard: "2-5 business days",
      priority: "24-48 hours"
    },
    qualityChecks: {
      audio: {
        minBitrate: 160, //Example value, adjust as needed
        maxBitrate: 320, //Example value, adjust as needed
        format: ["WAV", "AIFF"],
        channels: 2,
        sampleRate: 44100
      },
      artwork: {
        minWidth: 3000,
        minHeight: 3000,
        format: ["JPG", "PNG"],
        maxFileSize: 10 * 1024 * 1024
      }
    },
    metadataFields: [
      { name: "ISRC", required: true },
      { name: "Explicit Rating", required: true },
      { name: "Primary Genre", required: true },
      { name: "Composer Name", required: false },
    ]
  },
  amazonMusic: {
    name: "Amazon Music",
    audioFormats: ["MP3 (320kbps)", "WAV"],
    artworkSize: "3000x3000px",
    processsingTime: {
      standard: "3-5 business days",
      priority: "48 hours"
    },
    qualityChecks: {
      audio: {
        minBitrate: 320,
        maxBitrate: 320,
        format: ["MP3", "WAV"],
        channels: 2,
        sampleRate: 44100
      },
      artwork: {
        minWidth: 3000,
        minHeight: 3000,
        format: ["JPG", "PNG"],
        maxFileSize: 10 * 1024 * 1024
      }
    },
    metadataFields: [
      { name: "ISRC", required: true },
      { name: "Primary Genre", required: true },
      { name: "Secondary Genre", required: false },
    ]
  },
  youtubeMusic: {
    name: "YouTube Music",
    audioFormats: ["WAV"],
    artworkSize: "3000x3000px",
    processsingTime: {
      standard: "2-4 business days",
      priority: "24 hours"
    },
    qualityChecks: {
      audio: {
        minBitrate: 1411, // Example value, adjust as needed
        maxBitrate: 1411, // Example value, adjust as needed
        format: ["WAV"],
        channels: 2,
        sampleRate: 44100
      },
      artwork: {
        minWidth: 3000,
        minHeight: 3000,
        format: ["JPG", "PNG"],
        maxFileSize: 10 * 1024 * 1024
      }
    },
    metadataFields: [
      { name: "ISRC", required: true },
      { name: "Content ID", required: false },
      { name: "Asset ID", required: false },
      { name: "Content Category", required: true },
    ]
  }
};

export type PlatformName = keyof typeof platformRequirements;
export type PlatformRequirement = typeof platformRequirements[PlatformName];