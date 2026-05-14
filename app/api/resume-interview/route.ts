export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { extractText } from 'unpdf';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

const extractTextFromPDF = async (buffer: Buffer): Promise<string> => {
    const uint8Array = new Uint8Array(buffer);
    const { text } = await extractText(uint8Array, { mergePages: true });
    return text;
};

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("resume") as File;

        if (!file) {
            return NextResponse.json({ error: "No resume file provided" }, { status: 400 });
        }

        // Convert File to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Extract text from PDF using unpdf
        const resumeText = await extractTextFromPDF(buffer);
        console.log('Extracted resume text:', resumeText.substring(0, 500));

        if (!resumeText || resumeText.trim().length < 100) {
            return NextResponse.json({ error: "Could not extract text from PDF, please try a text-based PDF not a scanned image." }, { status: 400 });
        }

        const prompt = `You are a strict technical interviewer who has carefully read this candidate's resume. Here is the full resume text: [RESUME TEXT STARTS] ${resumeText} [RESUME TEXT ENDS]. 

Based ONLY on what is written in this resume, generate 10 highly specific interview questions. 
Rules: 
1) Reference actual project names from the resume by name. 
2) Ask about specific technologies they listed. 
3) Ask about their actual internship companies and what they built there. 
4) Do not ask generic questions that could apply to anyone. 

Every question must be answerable only by someone who actually built what is in this resume. 
Return only a JSON array of 10 strings, no markdown, no extra text.`;

        const res = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "user",
                    content: prompt,
                },
            ],
            response_format: { type: "json_object" },
        });

        const content = res.choices[0].message.content;
        if (!content) throw new Error("AI failed to generate questions.");

        const parsed = JSON.parse(content);
        const questionsArray = Array.isArray(parsed) ? parsed : (parsed.questions || parsed.interview_questions);

        if (!questionsArray || !Array.isArray(questionsArray)) {
            throw new Error("Invalid response format from AI.");
        }

        return NextResponse.json({ questions: questionsArray });
    } catch (error: any) {
        console.error("Resume analysis error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to analyze resume." },
            { status: 500 }
        );
    }
}
