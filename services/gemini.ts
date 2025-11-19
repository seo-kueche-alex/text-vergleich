import { GoogleGenerativeAI } from "@google/generative-ai";

const getAIClient = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn("API_KEY is not set in the environment variables.");
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
};

export const improveTextWithGemini = async (text: string): Promise<string> => {
  const ai = getAIClient();
  if (!ai) {
    throw new Error("API Key is missing. Please add VITE_GEMINI_API_KEY to your .env.local file.");
  }

  try {
    const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    const prompt = `Please improve the following Markdown text. 
Correct any grammar or spelling errors, improve clarity and flow, and ensure consistent formatting. 
Do not change the core meaning. 
Return ONLY the corrected Markdown text, no preamble or explanation.

Original Text:
${text}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text() || text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to improve text with AI. Please check your API key and try again.");
  }
};
