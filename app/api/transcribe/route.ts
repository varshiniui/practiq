import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const audio = formData.get("audio") as File;

        const transcription = await groq.audio.transcriptions.create({
            file: audio,
            model: "whisper-large-v3",
            prompt: "Technical interview for software engineering, data structures, and UI. Common words: stack, queue, LIFO, FIFO, React, HTML, CSS, DevOps, database, API, microservices, array, list, tuple.",
            response_format: "json",
            language: "en",
        });

        return NextResponse.json({ text: transcription.text });
    } catch (err: any) {
        console.error("Transcription error:", err?.message || err);
        return NextResponse.json(
            { text: "", error: `Transcription failed: ${err?.message || "Unknown error"}` },
            { status: 500 }
        );
    }
}