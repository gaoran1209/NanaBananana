import { GoogleGenAI, Modality } from "@google/genai";

// Centralized error handler for API calls
function handleApiError(error: unknown): never {
    console.error('Error with Gemini API:', error);
    if (error instanceof Error) {
        if (error.message.includes('API key not valid')) {
            throw new Error('API key is invalid. Please check it in Settings.');
        }
        if (error.message.includes('Rpc failed due to xhr error')) {
            throw new Error('A network error occurred. Please check your connection and try again.');
        }
        // Keep the original error message for other cases
        throw new Error(`Gemini API Error: ${error.message}`);
    }
    throw new Error('An unknown error occurred during image generation.');
}


export async function generateImage(prompt: string, apiKey: string): Promise<string> {
    if (!apiKey) {
        throw new Error("API key is missing.");
    }
    const ai = new GoogleGenAI({ apiKey });
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '1:1',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64ImageBytes}`;
        } else {
            throw new Error('No images were generated.');
        }
    } catch (error) {
        handleApiError(error);
    }
}

export async function generateFromImageAndText(originalImageBase64s: string[], prompt: string, apiKey: string): Promise<string> {
    if (!apiKey) {
        throw new Error("API key is missing.");
    }
    const ai = new GoogleGenAI({ apiKey });

    const imageParts = originalImageBase64s.map(base64string => {
        const match = base64string.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
        if (!match) {
            throw new Error('Invalid image data URL format.');
        }
        const mimeType = match[1];
        const imageData = match[2];
        return { inlineData: { data: imageData, mimeType: mimeType } };
    });


    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: {
                parts: [
                    ...imageParts,
                    { text: prompt },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (imagePart && imagePart.inlineData) {
            const base64ImageBytes: string = imagePart.inlineData.data;
            const responseMimeType = imagePart.inlineData.mimeType;
            return `data:${responseMimeType};base64,${base64ImageBytes}`;
        }

        throw new Error('No image was generated in the response.');

    } catch (error) {
        handleApiError(error);
    }
}
