// Comprehensive list of music genres for the platform
export const musicGenres = [
  // Popular Genres
  { value: "Pop", label: "Pop" },
  { value: "Rock", label: "Rock" },
  { value: "Hip-Hop/Rap", label: "Hip-Hop/Rap" },
  { value: "R&B/Soul", label: "R&B/Soul" },
  { value: "Country", label: "Country" },
  { value: "Jazz", label: "Jazz" },
  { value: "Classical", label: "Classical" },
  { value: "Blues", label: "Blues" },
  { value: "Folk", label: "Folk" },
  { value: "Gospel/Christian", label: "Gospel/Christian" },
  
  // Electronic Genres
  { value: "Electronic", label: "Electronic" },
  { value: "Dance", label: "Dance" },
  { value: "House", label: "House" },
  { value: "Techno", label: "Techno" },
  { value: "Trance", label: "Trance" },
  { value: "Dubstep", label: "Dubstep" },
  { value: "Drum & Bass", label: "Drum & Bass" },
  { value: "EDM", label: "EDM" },
  { value: "Ambient", label: "Ambient" },
  { value: "Lo-fi", label: "Lo-fi" },
  
  // Rock Subgenres
  { value: "Alternative Rock", label: "Alternative Rock" },
  { value: "Indie Rock", label: "Indie Rock" },
  { value: "Hard Rock", label: "Hard Rock" },
  { value: "Progressive Rock", label: "Progressive Rock" },
  { value: "Punk Rock", label: "Punk Rock" },
  
  // Metal Genres
  { value: "Heavy Metal", label: "Heavy Metal" },
  { value: "Death Metal", label: "Death Metal" },
  { value: "Black Metal", label: "Black Metal" },
  { value: "Thrash Metal", label: "Thrash Metal" },
  { value: "Metalcore", label: "Metalcore" },
  
  // Indian Genres & Subgenres
  { value: "Indian", label: "Indian" },
  { value: "Bollywood", label: "Bollywood" },
  { value: "Classical Indian", label: "Classical Indian" },
  { value: "Carnatic", label: "Carnatic" },
  { value: "Hindustani", label: "Hindustani" },
  { value: "Ghazal", label: "Ghazal" },
  { value: "Qawwali", label: "Qawwali" },
  { value: "Bhangra", label: "Bhangra" },
  { value: "Filmi", label: "Filmi" },
  { value: "Devotional", label: "Devotional" },
  { value: "Indian Folk", label: "Indian Folk" },
  { value: "Indian Pop", label: "Indian Pop" },
  { value: "Sufi", label: "Sufi" },
  { value: "Tamil", label: "Tamil" },
  { value: "Telugu", label: "Telugu" },
  { value: "Malayalam", label: "Malayalam" },
  { value: "Bengali", label: "Bengali" },
  { value: "Punjabi", label: "Punjabi" },
  { value: "Rajasthani", label: "Rajasthani" },
  { value: "Fusion Indian", label: "Fusion Indian" },
  
  // Latin & World Genres
  { value: "Latin", label: "Latin" },
  { value: "Salsa", label: "Salsa" },
  { value: "Reggaeton", label: "Reggaeton" },
  { value: "World", label: "World" },
  { value: "Afrobeat", label: "Afrobeat" },
  { value: "K-Pop", label: "K-Pop" },
  { value: "J-Pop", label: "J-Pop" },
  { value: "African", label: "African" },
  { value: "Caribbean", label: "Caribbean" },
  
  // Other Popular Genres
  { value: "Reggae", label: "Reggae" },
  { value: "Ska", label: "Ska" },
  { value: "Funk", label: "Funk" },
  { value: "Disco", label: "Disco" },
  { value: "New Age", label: "New Age" },
  { value: "Soundtrack", label: "Soundtrack" },
  { value: "Opera", label: "Opera" },
  { value: "Musical Theatre", label: "Musical Theatre" },
  { value: "Children's", label: "Children's" },
  { value: "Comedy", label: "Comedy" },
  { value: "Spoken Word", label: "Spoken Word" },
  { value: "Holiday", label: "Holiday" },
  
  // Contemporary & Fusion Genres
  { value: "Trap", label: "Trap" },
  { value: "Indie Pop", label: "Indie Pop" },
  { value: "Neo Soul", label: "Neo Soul" },
  { value: "Post Rock", label: "Post Rock" },
  { value: "Math Rock", label: "Math Rock" },
  { value: "Dream Pop", label: "Dream Pop" },
  { value: "Synthwave", label: "Synthwave" },
  { value: "Vaporwave", label: "Vaporwave" },
  { value: "Chillwave", label: "Chillwave" },
  { value: "Hyperpop", label: "Hyperpop" },
  { value: "Experimental", label: "Experimental" },
  
  // Catch-all
  { value: "Other", label: "Other" }
];

// Define indices for genre slicing
const GENRE_INDICES = {
  POPULAR_END: 10,             // 0-9
  ELECTRONIC_END: 25,          // 10-24
  ROCK_END: 30,                // 25-29
  METAL_END: 35,               // 30-34
  INDIAN_END: 55,              // 35-54
  LATIN_WORLD_END: 65,         // 55-64
  OTHER_POPULAR_END: 77,       // 65-76
  CONTEMPORARY_END: 88,        // 77-87
  ALL: 89                      // Everything up to Other
};

// Group genres by category for UI display if needed
export const genreCategories = {
  popular: musicGenres.slice(0, GENRE_INDICES.POPULAR_END),
  electronic: musicGenres.slice(GENRE_INDICES.POPULAR_END, GENRE_INDICES.ELECTRONIC_END),
  rockSubgenres: musicGenres.slice(GENRE_INDICES.ELECTRONIC_END, GENRE_INDICES.ROCK_END),
  metal: musicGenres.slice(GENRE_INDICES.ROCK_END, GENRE_INDICES.METAL_END),
  indian: musicGenres.slice(GENRE_INDICES.METAL_END, GENRE_INDICES.INDIAN_END),
  latinAndWorld: musicGenres.slice(GENRE_INDICES.INDIAN_END, GENRE_INDICES.LATIN_WORLD_END),
  otherPopular: musicGenres.slice(GENRE_INDICES.LATIN_WORLD_END, GENRE_INDICES.OTHER_POPULAR_END),
  contemporary: musicGenres.slice(GENRE_INDICES.OTHER_POPULAR_END, GENRE_INDICES.CONTEMPORARY_END)
};

// Simple array of genre values for basic select inputs
export const genreValues = musicGenres.map(genre => genre.value);

// Indian music subgenres organized by categories for better navigation
export const indianSubgenreCategories = {
  classical: [
    { value: "classical-hindustani", label: "Classical Hindustani" },
    { value: "classical-carnatic", label: "Classical Carnatic" },
    { value: "classical-fusion", label: "Classical Fusion" },
    { value: "dhrupad", label: "Dhrupad" },
    { value: "khayal", label: "Khayal" },
    { value: "thumri", label: "Thumri" },
  ],
  folk: [
    { value: "folk-rajasthani", label: "Folk - Rajasthani" },
    { value: "folk-punjabi", label: "Folk - Punjabi" },
    { value: "folk-gujarati", label: "Folk - Gujarati" },
    { value: "folk-bengali", label: "Folk - Bengali" },
    { value: "folk-south-indian", label: "Folk - South Indian" },
    { value: "baul", label: "Baul" },
    { value: "lavani", label: "Lavani" },
    { value: "bhangra", label: "Bhangra" },
  ],
  bollywood: [
    { value: "bollywood-classical", label: "Bollywood Classical" },
    { value: "bollywood-contemporary", label: "Bollywood Contemporary" },
    { value: "filmi-retro", label: "Filmi - Retro (1950s-1990s)" },
    { value: "filmi-modern", label: "Filmi - Modern (2000s onwards)" },
  ],
  devotional: [
    { value: "bhajan", label: "Bhajan" },
    { value: "qawwali", label: "Qawwali" },
    { value: "sufi", label: "Sufi" },
    { value: "kirtan", label: "Kirtan" },
    { value: "shabad", label: "Shabad" },
  ],
  regional: [
    { value: "tamil-film", label: "Tamil Film Music" },
    { value: "telugu-film", label: "Telugu Film Music" },
    { value: "malayalam-film", label: "Malayalam Film Music" },
    { value: "kannada-film", label: "Kannada Film Music" },
    { value: "bengali-film", label: "Bengali Film Music" },
    { value: "punjabi-film", label: "Punjabi Film Music" },
    { value: "rabindra-sangeet", label: "Rabindra Sangeet" },
    { value: "nazrul-geeti", label: "Nazrul Geeti" },
    { value: "adhunik", label: "Adhunik (Modern Bengali)" },
  ],
  contemporary: [
    { value: "contemporary-fusion", label: "Contemporary Fusion" },
    { value: "indie-indian", label: "Indie Indian" },
    { value: "ghazal", label: "Ghazal" },
    { value: "indian-pop", label: "Indian Pop" },
    { value: "indian-hip-hop", label: "Indian Hip-Hop" },
    { value: "indian-rock", label: "Indian Rock" },
  ],
};

// Flatten the categories for simple list view when needed
export const indianSubgenres = Object.values(indianSubgenreCategories).flat();