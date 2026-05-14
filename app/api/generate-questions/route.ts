import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
    try {
        const { company, role, round = 1, difficulty = "medium" } = await req.json();

        if (!company || !role) {
            return NextResponse.json(
                { error: "Company and Role are required." },
                { status: 400 }
            );
        }

        const prompt = `You are an expert technical interviewer. Generate 7 interview questions for a candidate applying to ${company} specifically for the ${role} position. 
Difficulty level is ${difficulty}. 
- Easy means basic conceptual questions suitable for freshers. 
- Medium means applied questions requiring understanding of how things work. 
- Hard means deep technical questions, edge cases, system design thinking, and problem solving — suitable for someone targeting a full time role.
This is round ${round} of the interview — do not repeat questions from previous rounds, generate completely different questions covering different concepts.
Mix technical questions relevant to the role with company-specific product thinking questions. 
Return only a JSON array of 7 strings, no extra text, no markdown.`;

        const res = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            response_format: { type: "json_object" }, // Llama 3.3 supports JSON mode
        });

        const content = res.choices[0]?.message?.content;
        if (!content) throw new Error("Empty response from AI");

        // Parse the JSON. The prompt asks for an array, but response_format: json_object might wrap it.
        let questions = JSON.parse(content);
        
        // If it's an object with a key, extract the array. Usually Llama might return {"questions": [...]}
        if (!Array.isArray(questions) && typeof questions === "object") {
            const keys = Object.keys(questions);
            if (keys.length > 0 && Array.isArray(questions[keys[0]])) {
                questions = questions[keys[0]];
            }
        }

        if (!Array.isArray(questions)) {
            throw new Error("AI did not return a valid array of questions");
        }

        return NextResponse.json({ questions: questions.slice(0, 7) });
    } catch (err: any) {
        console.error("Generate questions error:", err);
        return NextResponse.json(
            { error: `Failed to generate questions: ${err?.message}` },
            { status: 500 }
        );
    }
}
