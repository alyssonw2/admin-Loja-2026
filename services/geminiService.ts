
// FIX: Replaced mock implementation with a real call to the Gemini API.
import { GoogleGenAI } from "@google/genai";

export const generateDescription = async (productName: string, category: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
    const prompt = `Gere uma descrição de produto para um(a) "${productName}" da categoria "${category}". A descrição deve ser otimizada para e-commerce, destacando estilo, conforto, qualidade dos materiais e versatilidade. Use um tom vendedor e profissional, com aproximadamente 40-60 palavras. Não use markdown.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    // FIX: Accessing .text property directly as per guidelines.
    return response.text || "Ocorreu um erro ao gerar a descrição.";
  } catch (error) {
    console.error("Error generating description with Gemini:", error);
    return "Ocorreu um erro ao gerar a descrição com a IA. Por favor, tente novamente ou escreva manualmente.";
  }
};
