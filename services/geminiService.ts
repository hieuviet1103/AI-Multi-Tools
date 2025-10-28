
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import type { AspectRatio, MapsSearchResponse, GroundingChunk, PlaceWithCoords, GroundingSearchResponse, VideoAspectRatio } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function analyzeImage(prompt: string, imageBase64: string, mimeType: string): Promise<string> {
  try {
    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType,
      },
    };
    const textPart = { text: prompt };

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [textPart, imagePart] },
    });

    return response.text;
  } catch (error) {
    console.error("Error analyzing image:", error);
    return "Sorry, I couldn't analyze the image. Please try again.";
  }
}

export async function quickChat(prompt: string): Promise<string> {
    try {
        // FIX: Updated model name to 'gemini-flash-lite-latest' as per coding guidelines.
        const response = await ai.models.generateContent({
            model: 'gemini-flash-lite-latest',
            contents: prompt
        });
        return response.text;
    } catch (error) {
        console.error("Error in quick chat:", error);
        return "An error occurred. Please try again.";
    }
}

export async function deepThought(prompt: string): Promise<string> {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                thinkingConfig: { thinkingBudget: 32768 }
            }
        });
        return response.text;
    } catch(error) {
        console.error("Error in deep thought:", error);
        return "An error occurred while processing the complex query.";
    }
}


export async function generateImage(prompt: string, aspectRatio: AspectRatio): Promise<string | null> {
    try {
        // Per guidelines, create a new instance for models that require a user-selected key.
        const imageAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await imageAI.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/png',
              aspectRatio: aspectRatio,
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return `data:image/png;base64,${base64ImageBytes}`;
        }
        return null;
    } catch(error) {
        console.error("Error generating image:", error);
        // Rethrow the error to be caught by the component
        if (error instanceof Error) {
            throw new Error(error.message);
        }
        throw new Error("An unknown error occurred during image generation.");
    }
}

export async function mapsSearch(prompt: string, location?: { latitude: number; longitude: number }): Promise<MapsSearchResponse> {
    try {
        // FIX: `toolConfig` must be a property of the `config` object.
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{ googleMaps: {} }],
                toolConfig: location ? {
                    retrievalConfig: {
                        latLng: location
                    }
                } : undefined,
            },
        });

        const text = response.text;
        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] || [];
        
        return { text, sources };

    } catch(error) {
        console.error("Error in Maps Search:", error);
        throw new Error("An error occurred during the Maps search. Please try again.");
    }
}

export async function groundingSearch(prompt: string): Promise<GroundingSearchResponse> {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        const text = response.text;
        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] || [];
        
        return { text, sources };

    } catch(error) {
        console.error("Error in Grounded Search:", error);
        throw new Error("An error occurred during the search. Please try again.");
    }
}


export async function getCoordinatesForPlaces(placeTitles: string[]): Promise<PlaceWithCoords[]> {
    if (placeTitles.length === 0) {
        return [];
    }
    try {
        const prompt = `Provide the latitude and longitude for the following places: ${placeTitles.join(', ')}.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            latitude: { type: Type.NUMBER },
                            longitude: { type: Type.NUMBER },
                        },
                        required: ["title", "latitude", "longitude"],
                    },
                },
            },
        });
        
        const jsonText = response.text.trim();
        const parsedJson = JSON.parse(jsonText);
        return parsedJson as PlaceWithCoords[];

    } catch (error) {
        console.error("Error getting coordinates:", error);
        return []; // Return empty array on failure to avoid crashing the UI
    }
}

export async function generateVideo(
    prompt: string, 
    aspectRatio: VideoAspectRatio, 
    imageBase64?: string, 
    mimeType?: string
) {
    // Per guidelines, create a new instance for Veo models to ensure the latest API key is used.
    const videoAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const image = imageBase64 && mimeType ? { imageBytes: imageBase64, mimeType } : undefined;

    return await videoAI.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt,
        image,
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: aspectRatio,
        },
    });
}

export async function checkVideoOperationStatus(operation: any) {
    // Per guidelines, create a new instance for Veo models.
    const videoAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
    return await videoAI.operations.getVideosOperation({ operation });
}