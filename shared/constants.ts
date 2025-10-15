/**
 * Constants for TuneMantra platform
 * 
 * This file defines constants used throughout the platform.
 * Having these in a single file makes it easier to maintain and update them.
 */

/**
 * Platform-specific royalty rates per stream
 * 
 * These rates represent the amount paid per stream on each platform.
 * They are used for royalty calculations and financial projections.
 * 
 * Note: These rates are approximate and may change over time. They should be
 * updated regularly to reflect current industry standards.
 */
export const PLATFORM_RATES = {
  // Major streaming platforms
  1: 0.004,  // Spotify
  2: 0.008,  // Apple Music
  3: 0.006,  // Amazon Music
  4: 0.002,  // YouTube Music
  5: 0.005,  // Deezer
  6: 0.0084, // Tidal
  7: 0.0014, // Pandora
  8: 0.003,  // SoundCloud
  9: 0.0013, // iHeartRadio
  
  // Social media platforms
  10: 0.0003, // TikTok
  11: 0.0004, // Instagram
  12: 0.0004, // Facebook
  13: 0.0003, // Triller
  14: 0.0003, // Snapchat
  15: 0.0002, // Twitter
  
  // Regional streaming platforms - Asia
  16: 0.0025, // JioSaavn
  17: 0.0020, // Gaana
  18: 0.0022, // Wynk Music
  19: 0.0035, // KKBox
  20: 0.0018, // Joox
  21: 0.0032, // Melon
  22: 0.0015, // NetEase Cloud Music
  23: 0.0018, // QQ Music
  24: 0.0026, // Bugs!
  25: 0.0030, // Genie Music
  26: 0.0028, // FLO
  27: 0.0024, // Line Music
  28: 0.0020, // Rakuten Music
  
  // Regional streaming platforms - Africa
  29: 0.0012, // Boomplay
  30: 0.0008, // Mdundo
  31: 0.0015, // Audiomack (Africa)
  32: 0.0010, // Spinlet
  33: 0.0009, // Mziiki
  
  // Regional streaming platforms - Middle East
  34: 0.0022, // Anghami
  35: 0.0018, // Yala Music
  
  // Regional streaming platforms - Latin America
  36: 0.0016, // Claro Música
  37: 0.0014, // Música Movistar
  38: 0.0017, // Napster (Latin America)
  
  // Regional streaming platforms - Europe
  39: 0.0018, // Yandex Music
  40: 0.0016, // Zvooq
  41: 0.0030, // WiMP
  42: 0.0040, // Qobuz
  43: 0.0025, // AWA
  
  // Download Stores
  44: 0.70,   // iTunes Store (per download, not per stream)
  45: 0.65,   // Amazon MP3 (per download, not per stream)
  46: 0.60,   // 7digital (per download, not per stream)
  47: 0.50,   // Beatport (per download, not per stream)
  48: 0.80,   // Bandcamp (per download, not per stream)
  
  // Niche and Genre-Specific Platforms
  49: 0.50,   // Beatport Streaming
  50: 0.0045, // Traxsource
  51: 0.0040, // Juno Download Streaming
  52: 0.0060, // Mixcloud
  
  // Fitness and Lifestyle Platforms
  53: 0.0050, // Peloton
  54: 0.0035, // RockMyRun
  55: 0.0035, // FitRadio
  
  // Radio Platforms
  56: 0.0020, // SiriusXM
  57: 0.0015, // TuneIn
  58: 0.0018, // Dash Radio
  
  // Blockchain and Decentralized Platforms
  59: 0.0080, // Audius
  60: 0.0065  // Resonate
};

/**
 * Platform names by ID
 * 
 * Maps platform IDs to their display names for consistency across the application.
 */
export const PLATFORM_NAMES = {
  // Major streaming platforms
  1: 'Spotify',
  2: 'Apple Music',
  3: 'Amazon Music',
  4: 'YouTube Music',
  5: 'Deezer',
  6: 'Tidal',
  7: 'Pandora',
  8: 'SoundCloud',
  9: 'iHeartRadio',
  
  // Social media platforms
  10: 'TikTok',
  11: 'Instagram',
  12: 'Facebook',
  13: 'Triller',
  14: 'Snapchat',
  15: 'Twitter',
  
  // Regional streaming platforms - Asia
  16: 'JioSaavn',
  17: 'Gaana',
  18: 'Wynk Music',
  19: 'KKBox',
  20: 'Joox',
  21: 'Melon',
  22: 'NetEase Cloud Music',
  23: 'QQ Music',
  24: 'Bugs!',
  25: 'Genie Music',
  26: 'FLO',
  27: 'Line Music',
  28: 'Rakuten Music',
  
  // Regional streaming platforms - Africa
  29: 'Boomplay',
  30: 'Mdundo',
  31: 'Audiomack Africa',
  32: 'Spinlet',
  33: 'Mziiki',
  
  // Regional streaming platforms - Middle East
  34: 'Anghami',
  35: 'Yala Music',
  
  // Regional streaming platforms - Latin America
  36: 'Claro Música',
  37: 'Música Movistar',
  38: 'Napster',
  
  // Regional streaming platforms - Europe
  39: 'Yandex Music',
  40: 'Zvooq',
  41: 'WiMP',
  42: 'Qobuz',
  43: 'AWA',
  
  // Download Stores
  44: 'iTunes Store',
  45: 'Amazon MP3',
  46: '7digital',
  47: 'Beatport Downloads',
  48: 'Bandcamp',
  
  // Niche and Genre-Specific Platforms
  49: 'Beatport Streaming',
  50: 'Traxsource',
  51: 'Juno Download',
  52: 'Mixcloud',
  
  // Fitness and Lifestyle Platforms
  53: 'Peloton',
  54: 'RockMyRun',
  55: 'FitRadio',
  
  // Radio Platforms
  56: 'SiriusXM',
  57: 'TuneIn',
  58: 'Dash Radio',
  
  // Blockchain and Decentralized Platforms
  59: 'Audius',
  60: 'Resonate'
};

/**
 * Royalty payment thresholds by platform
 * 
 * The minimum amount that must be accumulated before payment is issued.
 * Users can only withdraw earnings once they exceed these thresholds.
 */
export const PAYMENT_THRESHOLDS = {
  // Default threshold
  default: 50, // Default minimum payout amount in USD
  
  // Major streaming platforms
  spotify: 50,
  appleMusic: 50,
  amazonMusic: 50,
  youtubeMusic: 50,
  deezer: 50,
  tidal: 50,
  pandora: 50,
  soundcloud: 50,
  iHeartRadio: 50,
  
  // Social media platforms
  tiktok: 50,
  instagram: 50,
  facebook: 50,
  triller: 50,
  snapchat: 50,
  twitter: 50,
  
  // Regional streaming platforms - Asia
  jioSaavn: 50,
  gaana: 50,
  wynkMusic: 50,
  kkbox: 50,
  joox: 50,
  melon: 50,
  netEaseCloudMusic: 50,
  qqMusic: 50,
  bugs: 50,
  genieMusic: 50,
  flo: 50,
  lineMusic: 50,
  rakutenMusic: 50,
  
  // Regional streaming platforms - Africa
  boomplay: 25, // Lower threshold for African markets
  mdundo: 25,   // Lower threshold for African markets
  audiomackAfrica: 25, // Lower threshold for African markets
  spinlet: 25,  // Lower threshold for African markets
  mziiki: 25,   // Lower threshold for African markets
  
  // Regional streaming platforms - Middle East
  anghami: 50,
  yalaMusic: 50,
  
  // Regional streaming platforms - Latin America
  claroMusica: 40, // Slightly lower threshold for Latin American markets
  musicaMovistar: 40, // Slightly lower threshold for Latin American markets
  napster: 40, // Slightly lower threshold for Latin American markets
  
  // Regional streaming platforms - Europe
  yandexMusic: 50,
  zvooq: 50,
  wimp: 50,
  qobuz: 50,
  awa: 50,
  
  // Download Stores
  itunesStore: 50,
  amazonMP3: 50,
  sevendigital: 50,
  beatportDownloads: 50,
  bandcamp: 30, // Lower threshold for independent artist platform
  
  // Niche and Genre-Specific Platforms
  beatportStreaming: 50,
  traxsource: 50,
  junoDownload: 50,
  mixcloud: 40,
  
  // Fitness and Lifestyle Platforms
  peloton: 50,
  rockMyRun: 50,
  fitRadio: 50,
  
  // Radio Platforms
  siriusXM: 50,
  tuneIn: 50,
  dashRadio: 50,
  
  // Blockchain and Decentralized Platforms
  audius: 30, // Lower threshold for blockchain platforms
  resonate: 30  // Lower threshold for cooperative platform
};

/**
 * Payment processing fees by method
 * 
 * Different payment methods have different processing fees.
 * These are represented as percentages (0.01 = 1%).
 */
export const PAYMENT_PROCESSING_FEES = {
  bankTransfer: 0.005, // 0.5%
  paypal: 0.029, // 2.9%
  stripe: 0.029, // 2.9%
  payoneer: 0.01 // 1%
};

/**
 * Distribution status options
 * 
 * The possible statuses for a distribution record.
 */
export const DISTRIBUTION_STATUSES = [
  'pending',     // Awaiting processing
  'processing',  // Currently being processed
  'distributed', // Successfully distributed
  'failed',      // Distribution failed
  'scheduled',   // Scheduled for future distribution
  'canceled'     // Distribution was canceled
];

/**
 * Royalty calculation types
 * 
 * The different types of royalties that can be calculated.
 */
export const ROYALTY_TYPES = [
  'performance',    // For public performances of music
  'mechanical',     // For reproduction of music (physical or digital)
  'synchronization', // For use of music in video
  'print',          // For printed sheet music
  'digital'         // For digital streaming and downloads
];

/**
 * Ownership types for rights management
 * 
 * The different types of ownership that can be assigned to tracks and releases.
 */
export const OWNERSHIP_TYPES = [
  'original',        // Original composition
  'licensed',        // Licensed from another owner
  'public_domain',   // Material in the public domain
  'sample_cleared',  // Contains cleared samples
  'remix_authorized' // Authorized remix of another work
];

/**
 * Maximum file sizes for uploads (in bytes)
 */
export const MAX_FILE_SIZES = {
  audio: 100 * 1024 * 1024, // 100 MB
  image: 10 * 1024 * 1024,  // 10 MB
  document: 20 * 1024 * 1024 // 20 MB
};

/**
 * Supported audio formats
 */
export const SUPPORTED_AUDIO_FORMATS = [
  'mp3',
  'wav',
  'flac',
  'aac',
  'ogg',
  'alac',
  'aiff'
];

/**
 * Supported image formats
 */
export const SUPPORTED_IMAGE_FORMATS = [
  'jpeg',
  'jpg',
  'png',
  'gif',
  'webp'
];

/**
 * API rate limits
 * 
 * Number of requests allowed per time window
 */
export const API_RATE_LIMITS = {
  standard: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100 // 100 requests per window
  },
  authenticated: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 300 // 300 requests per window
  },
  admin: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000 // 1000 requests per window
  }
};

/**
 * Default pagination settings
 */
export const DEFAULT_PAGINATION = {
  limit: 20,
  offset: 0
};

/**
 * Service pricing tiers
 */
export const PRICING_TIERS = {
  free: {
    name: 'Free',
    price: 0,
    releases: 2,
    tracksPerRelease: 3,
    audioStorage: 500 * 1024 * 1024, // 500 MB
    platforms: 3
  },
  basic: {
    name: 'Basic',
    price: 9.99,
    releases: 10,
    tracksPerRelease: 20,
    audioStorage: 5 * 1024 * 1024 * 1024, // 5 GB
    platforms: 10
  },
  pro: {
    name: 'Professional',
    price: 29.99,
    releases: 100,
    tracksPerRelease: 100,
    audioStorage: 50 * 1024 * 1024 * 1024, // 50 GB
    platforms: 'unlimited'
  },
  label: {
    name: 'Label',
    price: 99.99,
    releases: 'unlimited',
    tracksPerRelease: 'unlimited',
    audioStorage: 500 * 1024 * 1024 * 1024, // 500 GB
    platforms: 'unlimited'
  }
};