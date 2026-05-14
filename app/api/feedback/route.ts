import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const fallbackFeedback = {
    score: 0,
    whatWasGood: "Unable to generate feedback — the AI service did not respond.",
    whatWasMissed: "Please try again in a moment.",
    betterAnswer: "N/A",
};

function extractJSON(raw: string) {
    // Strip markdown code fences and any surrounding text
    const cleaned = raw.replace(/```json\s*/gi, "").replace(/```/g, "").trim();

    // Try parsing directly
    try {
        return JSON.parse(cleaned);
    } catch {
        // Try to find the first '{' and the last '}'
        const firstBracket = cleaned.indexOf("{");
        const lastBracket = cleaned.lastIndexOf("}");
        
        if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
            try {
                return JSON.parse(cleaned.substring(firstBracket, lastBracket + 1));
            } catch (innerErr) {
                console.error("Inner JSON parse failed:", innerErr);
            }
        }
        throw new Error("No valid JSON found in response");
    }
}

async function getGroqFeedback(prompt: string) {
    try {
        const res = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
        });
        const content = res.choices[0]?.message?.content;
        if (!content) throw new Error("Empty Groq response");
        return extractJSON(content);
    } catch (err) {
        console.error("Groq error:", err);
        return { ...fallbackFeedback };
    }
}

async function getGeminiFeedback(prompt: string) {
    try {
        const res = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant", // Alternative stable model hosted on Groq
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
        });
        const content = res.choices[0]?.message?.content;
        if (!content) throw new Error("Empty Groq/Llama response");
        return extractJSON(content);
    } catch (err: any) {
        console.error("Llama error:", err?.message || err);
        return { 
            ...fallbackFeedback, 
            whatWasGood: `AI Service Error: ${err?.message || "Unknown error"}` 
        };
    }
}

export async function POST(req: NextRequest) {
    try {
        const { question, answer, difficulty = "medium" } = await req.json();

        const prompt = `
You are a strict technical interviewer evaluating a candidate's answer. 
Difficulty Level: ${difficulty}

Score honestly based on these exact criteria:
- 1 to 3: Wrong, irrelevant, or blank answer
- 4 to 5: Partially correct but missing key concepts
- 6 to 7: Decent answer, covers basics but lacks depth or examples
- 8 to 9: Strong answer with good explanation and relevant examples
- 10: Perfect — complete, clear, with examples and edge cases covered

If the answer is copied or too generic, score it 5 or below. If the answer is blank or just one word, score it 1. 
Do not default to 7. Be honest and vary your scores based on actual quality.

Interview Question: "${question}"
Candidate's Answer: "${answer}"

Return only this JSON with no extra text:
{ "score": number, "whatWasGood": "string", "whatWasMissed": "string", "betterAnswer": "string" }
`;

        // Run both in parallel
        const [groqFeedback, geminiFeedback] = await Promise.all([
            getGroqFeedback(prompt),
            getGeminiFeedback(prompt),
        ]);

        return NextResponse.json({ groq: groqFeedback, gemini: geminiFeedback });
    } catch (err) {
        console.error("Feedback route error:", err);
        return NextResponse.json(
            { error: "Failed to generate feedback" },
            { status: 500 }
        );
    }
}