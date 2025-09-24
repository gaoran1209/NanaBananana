import { GoogleGenAI, Modality } from "@google/genai";

// Centralized error handler for API calls
function handleApiError(error: unknown): never {
    console.error('Error with Gemini API:', error);
    if (error instanceof Error) {
        if (error.message.includes('API key not valid')) {
            throw new Error('API key is invalid.');
        }
        if (error.message.includes('Rpc failed due to xhr error')) {
            throw new Error('A network error occurred. Please check your connection and try again.');
        }
        // Pass through any other specific errors thrown from the try blocks
        throw error;
    }
    throw new Error('An unknown error occurred during image generation.');
}

export async function generateImage(prompt: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: {
                parts: [{ text: prompt }],
            },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
                systemInstruction: "You are an expert image generation AI. Your sole purpose is to return an image based on the user's text prompt. Do not provide any conversational text, explanations, or apologies. Only output the final image.",
            },
        });

        if (response.promptFeedback?.blockReason) {
            throw new Error(`Request was blocked. Reason: ${response.promptFeedback.blockReason}.`);
        }
        
        const candidate = response.candidates?.[0];
        if (!candidate) {
            throw new Error('The model did not provide a valid response.');
        }

        if (candidate.finishReason && candidate.finishReason !== 'STOP' && candidate.finishReason !== 'UNSPECIFIED') {
             throw new Error(`Generation failed. Reason: ${candidate.finishReason}.`);
        }

        const imagePart = candidate.content?.parts?.find(p => p.inlineData);
        if (imagePart && imagePart.inlineData) {
            const base64ImageBytes: string = imagePart.inlineData.data;
            const responseMimeType = imagePart.inlineData.mimeType;
            return `data:${responseMimeType};base64,${base64ImageBytes}`;
        }

        const textPart = candidate.content?.parts?.find(p => p.text);
        if (textPart && textPart.text) {
            throw new Error(`The model provided a text response instead of an image: "${textPart.text}"`);
        }

        throw new Error('No image was generated in the response. The prompt may have violated safety policies.');

    } catch (error) {
        handleApiError(error);
    }
}

export async function generateFromImageAndText(originalImageBase64s: string[], prompt: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
                systemInstruction: "You are an expert image editing AI. Your sole purpose is to return a modified image based on the user's text prompt and input image(s). Do not provide any conversational text, explanations, or apologies. Only output the final image.",
            },
        });
        
        if (response.promptFeedback?.blockReason) {
            throw new Error(`Request was blocked. Reason: ${response.promptFeedback.blockReason}.`);
        }
        
        const candidate = response.candidates?.[0];
        if (!candidate) {
            throw new Error('The model did not provide a valid response.');
        }

        if (candidate.finishReason && candidate.finishReason !== 'STOP' && candidate.finishReason !== 'UNSPECIFIED') {
             throw new Error(`Generation failed. Reason: ${candidate.finishReason}.`);
        }

        const imagePart = candidate.content?.parts?.find(p => p.inlineData);
        if (imagePart && imagePart.inlineData) {
            const base64ImageBytes: string = imagePart.inlineData.data;
            const responseMimeType = imagePart.inlineData.mimeType;
            return `data:${responseMimeType};base64,${base64ImageBytes}`;
        }

        const textPart = candidate.content?.parts?.find(p => p.text);
        if (textPart && textPart.text) {
            throw new Error(`The model provided a text response instead of an image: "${textPart.text}"`);
        }

        throw new Error('No image was generated in the response. The prompt may have violated safety policies.');

    } catch (error) {
        handleApiError(error);
    }
}