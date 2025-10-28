
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import type { AspectRatio } from '../types';

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
        const response = await ai.models.generateImages({
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
        return null;
    }
}
