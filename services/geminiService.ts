
import { GoogleGenAI } from "@google/genai";

// Initialize the Google GenAI client with safety check
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

/**
 * Generates an intelligent logistics report based on provided statistics.
 */
export const getIntelligentReport = async (stats: any) => {
  try {
    const ai = getAiClient();
    if (!ai) return "Sistema de IA no configurado. Configure su API_KEY para obtener reportes.";

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analiza los siguientes datos de una empresa de paquetería en Guinea Ecuatorial: ${JSON.stringify(stats)}. 
      Proporciona un resumen ejecutivo breve (máximo 150 palabras) sobre el rendimiento actual y una recomendación estratégica para mejorar la eficiencia logística local.`,
      config: {
        temperature: 0.7,
      }
    });
    return response.text || "No se pudo generar el reporte.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error al generar insights inteligentes.";
  }
};

/**
 * Suggests a price for a shipment based on weight, locations, and parcel type.
 */
export const suggestPrice = async (weight: number, origin: string, destination: string, type: string) => {
  try {
    const ai = getAiClient();
    if (!ai) return 5000;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Calcula un precio estimado sugerido en FCFA (Francos CFA) para un envío de ${weight}kg desde ${origin} hasta ${destination} (paquete tipo: ${type}) dentro de Guinea Ecuatorial. Ten en cuenta que los envíos entre Bata y Malabo suelen incluir transporte aéreo o marítimo. Solo devuelve el número sugerido sin texto adicional.`,
    });
    const text = response.text || "5000";
    return parseInt(text.trim().replace(/[^0-9]/g, '')) || 5000;
  } catch (error) {
    console.error("Gemini Price Suggestion Error:", error);
    return 5000;
  }
};
