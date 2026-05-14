import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { question, hintNumber, difficulty = "medium" } = body;

        if (!question) {
            return NextResponse.json(
                { error: "Question is required for hint generation." },
                { status: 400 }
            );
        }

        // Logic Enforcement: Only support hint number 1
        if (hintNumber && Number(hintNumber) !== 1) {
            console.warn(`[Backend Debugger] Received hintNumber ${hintNumber}, enforcing 1.`);
        }

        const res = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            temperature: 0.9,
            max_tokens: 200,
            messages: [
                {
                    role: "system",
                    content: `You give vague thinking nudges only. 
You are FORBIDDEN from mentioning any technical terms, keywords, or concepts from the answer.
Never say what the answer is. Never name any term. Only guide HOW to think.
2 sentences max. No exceptions.`,
                },
                {
                    role: "user",
                    content: `Give a vague thinking nudge for: "${question}". No keywords allowed.`,
                },
            ],
        });

        const raw = res.choices[0]?.message?.content ?? "";
        const hint = raw
            .replace(/<think>[\s\S]*?<\/think>/gi, "")
            .replace(/<think>[\s\S]*/gi, "")
            .trim();

        if (!hint) throw new Error("AI provider returned an empty response.");

        return NextResponse.json({ hint, hintNumber: 1 });
    } catch (err: any) {
        console.error("[Backend Debugger] Hint route error:", err?.message || err);
        return NextResponse.json(
            { error: "Failed to generate hint. Please try again." },
            { status: 500 }
        );
    }
}