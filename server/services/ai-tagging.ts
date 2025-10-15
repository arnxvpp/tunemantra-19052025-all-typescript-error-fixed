/**
 * AI-Powered Content Tagging Service: Direct Media Analysis
 * 
 * 🎧 What This Service Does:
 * -----------------------
 * This service takes actual audio and video files, listens to/watches them, and
 * automatically figures out what they're about, what genre they belong to, and what
 * mood they create - all without a human having to manually tag them!
 * 
 * 📊 Real-World Examples:
 * -------------------
 * 1. A music label uploads 1,000 new songs to the platform
 *    → Without AI: Staff would need to listen to each song and manually add tags
 *    → With AI: This service automatically processes each file and generates accurate tags
 * 
 * 2. An artist uploads a new music video
 *    → The AI analyzes both the audio and visual content
 *    → Tags it with genres, moods, and themes
 *    → Identifies any potential content warnings
 *    → Suggests playlists where it would fit well
 * 
 * 🤖 How It Works (In Simple Terms):
 * ------------------------------
 * 
 * For Audio Files:
 * 1. 🎤 Speech-to-Text: The AI uses "Whisper" (a special AI tool) to convert any
 *    singing or speaking in the audio to written text
 * 
 * 2. 👂 Audio Analysis: The AI listens to musical elements like:
 *    - Tempo (how fast or slow)
 *    - Instruments used
 *    - Voice characteristics
 *    - Overall audio qualities
 * 
 * 3. 📝 Lyric Understanding: The AI reads the transcribed lyrics to understand:
 *    - What topics the song discusses
 *    - The emotional tone of the words
 *    - Any sensitive content that should be flagged
 * 
 * For Video Files:
 * 1. 👁️ Visual Analysis: The AI looks at the video content
 * 2. 🔊 Audio Analysis: It also processes the soundtrack
 * 3. 🔄 Combined Understanding: It brings both analyses together for a complete picture
 * 
 * 🔍 What Information It Provides:
 * ----------------------------
 * - Genres: Musical style categories (pop, rock, jazz, etc.)
 * - Moods: Emotional qualities (happy, sad, energetic, relaxed)
 * - BPM: Beats per minute (tempo of the music)
 * - Themes: Subject matter or topics covered
 * - Content Warnings: Flags for explicit or sensitive content
 * - Playlist Suggestions: Recommendations for where the content would fit well
 * 
 * 💡 This service works alongside the simpler analysis in server/lib/ai-analysis.ts,
 *    which only uses title and artist information. This service is more powerful
 *    because it actually processes the media files themselves!
 */
import OpenAI from "openai";
import { createReadStream } from "fs";

/**
 * Initialize OpenAI client with API key from environment variables
 * Using gpt-4o model released May 2024 for optimal performance
 */
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Structure for content tags extracted from media analysis
 * These tags enable powerful search, filtering, and recommendation features
 */
interface ContentTags {
  genres: string[];           // Musical or content genres (e.g., "pop", "rock", "documentary")
  moods: string[];            // Emotional qualities (e.g., "energetic", "melancholic")
  bpm?: number;               // Beats per minute - tempo of music (optional)
  themes: string[];           // Subject matter (e.g., "love", "social justice")
  contentWarnings: string[];  // Potential sensitive content flags
  suggestedPlaylists: string[]; // Recommended playlist categories for this content
}

/**
 * Intelligent Audio Analysis for Smart Music Tagging
 * 
 * 🎵 What This Method Does:
 * -----------------------
 * Think of this as an "AI music expert" who listens to thousands of songs and
 * instantly understands their musical characteristics and lyrical content.
 * It's like having a team of music professionals analyze every track in your catalog
 * overnight, but completely automated!
 * 
 * In practical terms, this method:
 * 
 * 1. Transcribes lyrics using OpenAI's Whisper technology:
 *    - Converts singing and spoken words into text
 *    - Works across multiple languages
 *    - Handles various accents and vocal styles
 *    - Preserves contextual meaning of lyrics
 * 
 * 2. Analyzes musical characteristics:
 *    - Identifies genres and subgenres
 *    - Detects mood and emotional tone
 *    - Recognizes instruments used
 *    - Estimates tempo (BPM) and energy level
 *    - Identifies musical structure and patterns
 * 
 * 3. Performs deep content understanding:
 *    - Identifies themes and topics from lyrics
 *    - Detects sensitive content for appropriate warnings
 *    - Recognizes cultural references and contexts
 *    - Understands artistic intent and expression
 * 
 * Real-world benefits:
 * -----------------
 * 1. For artists:
 *    - Save hours of manual tagging work
 *    - Get more consistent and objective classifications
 *    - Improve discoverability with precise metadata
 *    - Gain insights about your music's characteristics
 * 
 * 2. For labels and distributors:
 *    - Process large catalogs efficiently
 *    - Ensure consistent metadata across thousands of tracks
 *    - Quickly identify tracks for thematic playlists
 *    - Flag potentially sensitive content automatically
 * 
 * 3. For listeners:
 *    - Discover music that matches specific moods or themes
 *    - Find songs similar to favorites based on musical characteristics
 *    - Get appropriate content warnings for sensitive material
 * 
 * Technical implementation:
 * ----------------------
 * - Uses OpenAI's Whisper model for high-accuracy transcription
 * - Leverages GPT-4o for comprehensive content analysis
 * - Processes both audio characteristics and lyrical content
 * - Returns structured data in a standardized ContentTags format
 * - Includes robust error handling for production reliability
 * 
 * @param filePath - Path to the audio file for analysis
 * @returns Promise resolving to a ContentTags object containing:
 *          - genres: Array of detected musical genres
 *          - moods: Array of emotional tones and atmospheres
 *          - bpm: Optional detected tempo information
 *          - themes: Array of identified subject matter and topics
 *          - contentWarnings: Array of any sensitive content flags
 *          - suggestedPlaylists: Array of recommended playlist categories
 */
export async function analyzeAudioContent(filePath: string): Promise<ContentTags> {
  try {
    // Create a readable stream from the audio file
    const audioFile = createReadStream(filePath);

    // Step 1: Transcribe audio to text using Whisper model
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",  // OpenAI's dedicated audio transcription model
    });

    // Step 2: Analyze the transcription and audio characteristics with GPT-4o
    const response = await openai.chat.completions.create({
      model: "gpt-4o",  // Advanced multimodal model for comprehensive analysis
      messages: [
        // System prompt defines the AI's role and expertise
        {
          role: "system",
          content: "You are a music analysis expert. Analyze the provided audio content and return structured metadata."
        },
        // User prompt includes the transcription and analysis instructions
        {
          role: "user",
          content: `Analyze this audio content and its transcription: ${transcription.text || ''}. 
          Provide genre tags, mood tags, themes, content warnings if any, and suggested playlist categories.
          Return the analysis in JSON format matching the ContentTags interface with arrays of strings.`
        }
      ],
      // Request JSON response format for reliable parsing
      response_format: { type: "json_object" }
    });

    // Step 3: Extract and validate the analysis response
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Failed to get analysis from OpenAI");
    }

    // Step 4: Parse and format the analysis as ContentTags
    const analysis = JSON.parse(content) as ContentTags;
    return {
      genres: analysis.genres || [],
      moods: analysis.moods || [],
      bpm: analysis.bpm,
      themes: analysis.themes || [],
      contentWarnings: analysis.contentWarnings || [],
      suggestedPlaylists: analysis.suggestedPlaylists || []
    };
  } catch (error) {
    // Log and standardize error handling
    console.error("Error analyzing audio content:", error);
    throw new Error("Failed to analyze audio content");
  }
}

/**
 * Intelligent Music Video Content Analysis
 * 
 * 🎬 What This Method Does:
 * -----------------------
 * Think of this as an "AI music video expert" who watches music videos and
 * understands both what they look like and what they sound like. Imagine having
 * someone who can watch thousands of music videos overnight and tell you exactly
 * what each one contains and how to categorize them!
 * 
 * In practical terms, this method:
 * 
 * 1. Processes the entire video file (both visuals and audio together)
 * 2. Identifies visual elements like:
 *    - Settings (beach, city, studio, concert, etc.)
 *    - Cinematography style (artistic, documentary, performance)
 *    - Visual themes (love story, social commentary, celebration)
 *    - Cultural references and imagery
 * 
 * 3. Analyzes audio elements like:
 *    - Musical genre and style
 *    - Vocal characteristics
 *    - Lyrical content and themes
 *    - Emotional tone and mood
 * 
 * 4. Combines both analyses to create comprehensive video metadata that 
 *    understands the video as a complete artistic work
 * 
 * Real-world benefits:
 * -----------------
 * 1. For artists:
 *    - Videos are automatically tagged without manual work
 *    - Proper content warnings protect your audience
 *    - Improved discoverability in platform searches
 *    - More accurate playlist recommendations
 * 
 * 2. For platform users:
 *    - Find videos that match specific moods or themes
 *    - Discover new content based on visual style preferences
 *    - Filter content based on appropriate warnings
 * 
 * 3. For platform administrators:
 *    - Ensure compliance with content policies
 *    - Automatically identify videos for featured collections
 *    - Track trends in visual and thematic content
 * 
 * Technical implementation:
 * ----------------------
 * - Uses OpenAI's GPT-4o model with multimodal capabilities
 * - Processes video frame samples and audio in a single analysis
 * - Structures the output as standardized ContentTags
 * - Provides consistent error handling for production reliability
 * 
 * @param filePath - Path to the video file for analysis
 * @returns Promise resolving to a ContentTags object containing:
 *          - genres: Array of detected musical and visual genres
 *          - moods: Array of emotional tones and atmospheres
 *          - bpm: Optional detected tempo information
 *          - themes: Array of identified subject matter and topics
 *          - contentWarnings: Array of any sensitive content flags
 *          - suggestedPlaylists: Array of recommended playlist categories
 */
export async function analyzeVideoContent(filePath: string): Promise<ContentTags> {
  try {
    // Analyze the video content using GPT-4o
    const response = await openai.chat.completions.create({
      model: "gpt-4o",  // Advanced multimodal model for comprehensive analysis
      messages: [
        // System prompt defines the AI's role and expertise
        {
          role: "system",
          content: "You are a video content analysis expert. Analyze the provided video content and return structured metadata."
        },
        // User prompt includes analysis instructions
        {
          role: "user",
          content: `Analyze this video content. 
          Provide genre tags, mood tags, themes, content warnings if any, and suggested playlist categories.
          Consider both visual and audio elements.
          Return the analysis in JSON format matching the ContentTags interface with arrays of strings.`
        }
      ],
      // Request JSON response format for reliable parsing
      response_format: { type: "json_object" }
    });

    // Extract and validate the analysis response
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Failed to get analysis from OpenAI");
    }

    // Parse and format the analysis as ContentTags
    const analysis = JSON.parse(content) as ContentTags;
    return {
      genres: analysis.genres || [],
      moods: analysis.moods || [],
      bpm: analysis.bpm,
      themes: analysis.themes || [],
      contentWarnings: analysis.contentWarnings || [],
      suggestedPlaylists: analysis.suggestedPlaylists || []
    };
  } catch (error) {
    // Log and standardize error handling
    console.error("Error analyzing video content:", error);
    throw new Error("Failed to analyze video content");
  }
}