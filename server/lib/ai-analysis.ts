/**
 * AI Content Analysis Module: Music and Video Smart Tagging
 * 
 * 🎵 What This Module Does:
 * -----------------------
 * This module is like having a music expert who listens to your songs and tells you what 
 * genre they are, what mood they create, and what they're about - all automatically!
 * 
 * When artists upload a new song or video, this system:
 * 1. Looks at the title and artist name
 * 2. Uses artificial intelligence to figure out information about the content
 * 3. Creates tags and categories that help people find the content later
 * 
 * 🧠 How It Works For Beginners:
 * ----------------------------
 * 
 * 1. 🏷️ Automatic Content Tagging
 *    - Without AI: Artists would have to manually tag each song with genres, moods, etc.
 *    - With AI: The system automatically suggests these tags based on just the title and artist
 *    - Example: "Summer Nights" by "Beach Boys" might be tagged as [genre: "pop", mood: "happy", 
 *      theme: "summer", language: "english"]
 * 
 * 2. 🤖 AI Integration (Using OpenAI)
 *    - We connect to OpenAI's powerful AI models through their API (a way computers talk to each other)
 *    - We send them basic information about the song or video
 *    - They analyze it and send back detailed information about what it might contain
 *    - This happens in seconds, saving hours of manual work!
 * 
 * 3. 🛡️ Reliable Fallbacks
 *    - If the AI service is unavailable, the system has backup data to use
 *    - This ensures the application keeps working even if there's a problem with the AI
 *    - Users never see an error or broken experience
 * 
 * 4. 🔍 What Kind of Information It Provides:
 *    - Genres: What style of music (pop, rock, hip-hop, etc.)
 *    - Moods: How it makes listeners feel (happy, sad, energetic, etc.)
 *    - Themes: What topics it covers (love, friendship, social issues, etc.)
 *    - Languages: What languages are used in the content
 *    - Content Warnings: If there might be explicit or sensitive content
 *    - Quality Analysis: Suggestions for improving the content
 * 
 * 💡 Why This Matters:
 *    - Helps users discover content they'll love based on their preferences
 *    - Makes content searchable by specific attributes
 *    - Improves recommendations across the platform
 *    - Saves artists time in describing their own content
 */
import OpenAI from "openai";
import { Release } from "@shared/schema";

/**
 * Default analysis response when AI analysis is not available
 * 
 * This provides a fallback when the OpenAI API is not configured or returns an error,
 * ensuring the application continues to function without real AI analysis.
 */
const mockAnalysis = {
  tags: {
    genres: ["pop", "rock"],
    moods: ["energetic", "upbeat"],
    themes: ["love", "relationships"],
    explicit: false,
    languages: ["english"],
  },
  analysis: {
    summary: "Content analysis is currently disabled",
    qualityScore: 0,
    contentWarnings: [],
    suggestedImprovements: [],
  },
};

/**
 * Interface defining the structure of content tags
 * 
 * These tags help categorize and describe the content for search,
 * recommendation engines, and user discovery.
 */
interface ContentTags {
  genres: string[];     // Musical genres (e.g., "pop", "rock", "hip-hop")
  moods: string[];      // Emotional qualities (e.g., "energetic", "melancholic")
  themes: string[];     // Subject matter (e.g., "love", "social justice")
  explicit: boolean;    // Whether content contains explicit material
  languages: string[];  // Languages used in the content
}

/**
 * Interface defining the structure of AI analysis results
 * 
 * This provides qualitative assessment of the content beyond
 * simple categorization.
 */
interface AIAnalysis {
  summary: string;               // Brief description of the content
  qualityScore: number;          // Numerical assessment of content quality (0-100)
  contentWarnings: string[];     // Potential problematic content flags
  suggestedImprovements: string[]; // Recommendations to enhance the content
}

/**
 * Generate content tags and analysis using AI
 * 
 * This function:
 * 1. Takes basic information about a piece of content (title, artist, type)
 * 2. Sends this information to OpenAI's API for analysis
 * 3. Processes the response into structured metadata
 * 4. Returns standardized tags and analysis information
 * 
 * The function includes error handling and fallbacks to ensure it always
 * returns a valid response even if the AI service fails.
 * 
 * @param title - The title of the content to analyze
 * @param artistName - The name of the artist/creator
 * @param type - The type of content ("audio" or "video")
 * @returns A promise resolving to an object containing tags and analysis
 */
export async function generateContentTags(
  title: string,
  artistName: string,
  type: "audio" | "video"
): Promise<{ tags: ContentTags; analysis: AIAnalysis }> {
  // Return default data if OpenAI API key is not configured
  if (!process.env.OPENAI_API_KEY) {
    console.log("OpenAI API key not configured, returning default analysis data");
    return mockAnalysis;
  }

  try {
    // Initialize OpenAI client with API key from environment
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    // Request AI analysis from OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o",  // Using GPT-4o for enhanced media understanding
      messages: [
        // System prompt defines the AI's role and capabilities
        {
          role: "system",
          content: `You are an expert music and video content analyzer. Analyze the given ${type} content information and provide detailed tags and analysis. Consider the title and artist name to infer genre, mood, themes, and other relevant attributes.`,
        },
        // User prompt contains the content information to analyze
        {
          role: "user",
          content: `Please analyze this ${type} content:\nTitle: ${title}\nArtist: ${artistName}`,
        },
      ],
      // Request JSON response format for reliable parsing
      response_format: { type: "json_object" },
    });

    // Extract and parse the response content
    const content = response.choices[0].message.content || "{}";
    const result = JSON.parse(content);

    // Transform and validate the AI response into our expected format
    return {
      tags: {
        genres: result.genres || [],
        moods: result.moods || [],
        themes: result.themes || [],
        explicit: result.explicit || false,
        languages: result.languages || [],
      },
      analysis: {
        summary: result.summary || "",
        qualityScore: result.qualityScore || 0,
        contentWarnings: result.contentWarnings || [],
        suggestedImprovements: result.suggestedImprovements || [],
      },
    };
  } catch (error) {
    // Log the error for debugging purposes
    console.error("AI Analysis failed:", error);
    
    // Return default data when AI analysis fails, maintaining application stability
    return mockAnalysis;
  }
}