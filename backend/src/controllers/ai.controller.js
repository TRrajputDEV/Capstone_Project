import { GoogleGenerativeAI } from "@google/generative-ai";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const generateAiCanvas = asyncHandler(async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) throw new ApiError(400, "Prompt is required");

  // Initialize Gemini (Ensure GEMINI_API_KEY is in your backend .env)
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // Flash is much faster for JSON generation

  const systemInstruction = `
    You are an expert JSON generator for a real-time React whiteboard. 
    You must return ONLY valid, raw JSON. Do NOT wrap it in markdown blockticks (\`\`\`json).
    Do NOT include any conversational text.
    
    The JSON MUST exactly match this schema:
    {
      "strokes": [],
      "stickyNotes": [
        { "id": "string", "text": "string", "color": "#hex", "x": number, "y": number, "userId": "ai", "username": "AI_Assistant" }
      ],
      "textNodes": [
        { "id": "string", "text": "string", "color": "#hex", "fontSize": number, "x": number, "y": number }
      ],
      "imageNodes": []
    }

    Rules:
    1. Act as a layout engine. Increment x and y coordinates mathematically (e.g., adding 250 to x for each new column) so elements NEVER overlap.
    2. Use vibrant colors for stickyNotes: "#fde047", "#86efac", "#f9a8d4", "#93c5fd", "#fdba74", "#c4b5fd".
    3. Start x and y coordinates around 100 to center them on the canvas.
    4. Provide highly detailed, structured content inside the text elements based on the user's request.
  `;

  try {
    const result = await model.generateContent(`${systemInstruction}\n\nUser Request: ${prompt}`);
    let aiText = result.response.text();
    
    // Failsafe: Strip markdown formatting if the AI disobeys instructions
    aiText = aiText.replace(/```json/gi, "").replace(/```/gi, "").trim();
    
    const parsedData = JSON.parse(aiText);
    
    return res.status(200).json(new ApiResponse(200, parsedData, "AI Canvas generated successfully"));
  } catch (error) {
    console.error("[AI Generation Error]:", error);
    throw new ApiError(500, "Failed to parse AI response into valid canvas data.");
  }
});