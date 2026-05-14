"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function ResumeMode() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile && selectedFile.type === "application/pdf") {
            setFile(selectedFile);
            setError(null);
        } else {
            setError("Please upload a valid PDF file.");
            setFile(null);
        }
    };

    const handleCardClick = () => {
        if (!loading) {
            fileInputRef.current?.click();
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append("resume", file);

        try {
            const res = await fetch("/api/resume-interview", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to analyze resume.");

            // Store questions in session storage
            sessionStorage.setItem("resume_questions", JSON.stringify(data.questions));
            
            // Navigate to interview page
            router.push("/interview?mode=resume");
        } catch (err: any) {
            console.error("Resume upload error:", err);
            setError(err.message || "Something went wrong. Please try again.");
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mt-12 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col items-center gap-4 mb-10 text-center">
                <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-black text-white tracking-tight">Resume Mode</h2>
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-purple-500/20 text-purple-400 border border-purple-500/30">
                        BETA
                    </span>
                </div>
                <p className="text-zinc-500 text-sm max-w-md font-medium">
                    Upload your resume and get interview questions based on your actual experience, projects, and skills.
                </p>
            </div>

            <div className="flex flex-col items-center gap-6">
                <div 
                    onClick={handleCardClick}
                    className={`
                        w-full group flex flex-col items-center gap-6 p-12 rounded-2xl
                        border-2 border-dashed transition-all duration-200 cursor-pointer
                        ${file ? "border-purple-500/50 bg-purple-500/10 shadow-lg shadow-purple-500/10" : "border-zinc-800 bg-zinc-900/40 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/5"}
                    `}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="hidden"
                    />

                    {loading ? (
                        <div className="flex flex-col items-center gap-4 py-6">
                            <div className="relative w-16 h-16">
                                <div className="absolute inset-0 rounded-full border-4 border-purple-500/20" />
                                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 animate-spin" />
                            </div>
                            <p className="text-purple-400 font-medium animate-pulse">Analyzing your resume...</p>
                        </div>
                    ) : (
                        <>
                            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${file ? "bg-purple-500 shadow-lg shadow-purple-500/20" : "bg-zinc-800"}`}>
                                {file ? "📄" : "📤"}
                            </div>

                            <div className="text-center space-y-2">
                                <h3 className="text-lg font-black text-white group-hover:text-purple-300 transition-colors">
                                    {file ? file.name : "Click to upload your resume"}
                                </h3>
                                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">{file ? "Click to change file" : "PDF files only (max 5MB)"}</p>
                            </div>
                        </>
                    )}
                </div>

                {file && !loading && (
                    <button
                        onClick={handleUpload}
                        className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-black text-base hover:opacity-90 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-purple-500/25 flex items-center justify-center gap-3 cursor-pointer"
                    >
                        <span>Start Interview</span>
                        <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </button>
                )}
            </div>

            {error && (
                <div className="mt-6 p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm text-center">
                    {error}
                </div>
            )}
        </div>
    );
}
