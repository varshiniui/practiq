"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { questions, companyQuestions } from "@/lib/questions";
import { getTimerDuration } from "@/lib/timerConfig";
import QuestionCard from "@/components/QuestionCard";
import AnswerInput from "@/components/AnswerInput";
import FeedbackSection from "@/components/FeedbackSection";
import DifficultySelector from "@/components/DifficultySelector";
import type { Feedback } from "@/components/FeedbackCard";

type RoleKey = keyof typeof questions;

function InterviewContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) router.push("/auth");
        };
        checkUser();
    }, [router]);

    const role = searchParams.get("role") || "sde";
    const mode = searchParams.get("mode"); // "company" or null
    // Modes and data stores
    const isCompanyMode = mode === "company";
    const isTargetedMode = mode === "targeted";
    const isResumeMode = mode === "resume";
    const dataStore = isCompanyMode ? companyQuestions : questions;

    // State hooks
    const [difficulty, setDifficulty] = useState(searchParams.get("difficulty") || "medium");
    const [feedback, setFeedback] = useState<{
        groq: Feedback;
        gemini: Feedback;
    } | null>(null);
    const [lastAnswer, setLastAnswer] = useState("");
    const [roleQuestions, setRoleQuestions] = useState<string[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [round, setRound] = useState(Number(searchParams.get("round")) || 1);
    const [loading, setLoading] = useState(false);
    const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(isTargetedMode);
    const [error, setError] = useState<string | null>(null);
    const [hintsGiven, setHintsGiven] = useState<string[]>([]);
    const [isFetchingHint, setIsFetchingHint] = useState(false);
    const [skipsUsed, setSkipsUsed] = useState(0);
    const [isSkipping, setIsSkipping] = useState(false);

    // Derived variables
    const company = searchParams.get("company") || "Target Company";
    const currentRoleData = isResumeMode 
        ? { label: "Resume Analysis Interview" }
        : isTargetedMode 
            ? { label: `${company} - ${role.toUpperCase()}` } 
            : ((dataStore as Record<string, any>)[role] || (isCompanyMode ? companyQuestions.tcs : questions.sde));

    const currentQuestion = roleQuestions[currentIndex];
    const currentDuration = getTimerDuration(role, mode);

    // Initialize session metadata when questions are ready
    useEffect(() => {
        if (roleQuestions.length > 0) {
            const sessionMeta = {
                mode: isResumeMode ? "Resume" : isTargetedMode ? "Targeted" : "Practice",
                role: currentRoleData.label,
                roleKey: role,
                originalMode: mode,
                company: isTargetedMode ? (searchParams.get("company") || "Target Company") : null,
                difficulty,
                round,
                totalQuestions: roleQuestions.length,
                date: new Date().toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                }),
            };
            sessionStorage.setItem("practiq-session-meta", JSON.stringify(sessionMeta));
            sessionStorage.setItem("practiq-session", JSON.stringify([]));
        }
    }, [roleQuestions.length, isResumeMode, isTargetedMode, currentRoleData.label, difficulty, searchParams]);

    // Save feedback to session storage when received
    useEffect(() => {
        if (feedback && lastAnswer) {
            try {
                const session = JSON.parse(sessionStorage.getItem("practiq-session") || "[]");
                const entry = {
                    question: currentQuestion,
                    answer: lastAnswer,
                    groqScore: feedback.groq.score,
                    geminiScore: feedback.gemini.score,
                    groqFeedback: feedback.groq,
                    geminiFeedback: feedback.gemini,
                };
                session.push(entry);
                sessionStorage.setItem("practiq-session", JSON.stringify(session));
            } catch (err) {
                console.error("Failed to save session data:", err);
            }
        }
    }, [feedback, lastAnswer, currentQuestion]);

    // Fetch targeted questions or resume questions
    useEffect(() => {
        if (isResumeMode) {
            const stored = sessionStorage.getItem("resume_questions");
            if (stored) {
                setRoleQuestions(JSON.parse(stored));
            } else {
                setError("No resume questions found. Please upload your resume again.");
            }
            setIsGeneratingQuestions(false);
            return;
        }

        if (!isTargetedMode) {
            const roleData = (dataStore as Record<string, any>)[role];
            console.log('questions for role:', roleData);
            
            let list = [...(roleData?.list || [])];
            
            // For Practice Mode (standard roles), shuffle for variety each round
            if (mode === null || mode === "standard") {
                // Fisher-Yates shuffle algorithm
                for (let i = list.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [list[i], list[j]] = [list[j], list[i]];
                }
            }

            // Use 7 questions for a standard round as requested by the user
            list = list.slice(0, 7);
            
            setRoleQuestions(list);
            setIsGeneratingQuestions(false);
            return;
        }

        const fetchTargetedQuestions = async () => {
            setIsGeneratingQuestions(true);
            setError(null);
            try {
                const company = searchParams.get("company") || "a major tech company";
                const res = await fetch("/api/generate-questions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ company, role, round, difficulty }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Failed to generate questions");
                setRoleQuestions(data.questions);
            } catch (err: any) {
                console.error("Targeted questions error:", err);
                setError(err.message || "Failed to generate targeted questions.");
            } finally {
                setIsGeneratingQuestions(false);
            }
        };

        fetchTargetedQuestions();
    }, [role, isTargetedMode, mode, searchParams, isCompanyMode, dataStore, round, difficulty, currentRoleData?.list]);

    // Reset state when role changes or round changes
    useEffect(() => {
        setCurrentIndex(0);
        setFeedback(null);
        setError(null);
        setHintsGiven([]);
        setSkipsUsed(0);
    }, [role, round]);

    const handleSubmit = async (answer: string) => {
        if (!answer.trim()) return;
        setLastAnswer(answer);
        setLoading(true);
        setFeedback(null);
        setError(null);

        try {
            const res = await fetch("/api/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question: currentQuestion, answer, difficulty }),
            });
            const data = await res.json();

            if (!res.ok || data.error) {
                setError(data.error || "Something went wrong. Please try again.");
                return;
            }

            setFeedback({ groq: data.groq, gemini: data.gemini });
        } catch (err) {
            console.error("Failed to get feedback:", err);
            setError("Network error — check your connection and try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleGetHint = async () => {
        if (hintsGiven.length >= 1 || isFetchingHint) return;
        setIsFetchingHint(true);
        setError(null);

        try {
            const res = await fetch("/api/hint", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question: currentQuestion, hintNumber: 1, difficulty }),
            });
            const data = await res.json();

            if (!res.ok || data.error) {
                setError(data.error || "Failed to get hint.");
                return;
            }

            setHintsGiven((prev) => [...prev, data.hint]);
        } catch (err) {
            console.error("Failed to fetch hint:", err);
            setError("Network error — check your connection.");
        } finally {
            setIsFetchingHint(false);
        }
    };

    const handleSkip = () => {
        if (skipsUsed >= 3) return;
        
        try {
            const session = JSON.parse(sessionStorage.getItem("practiq-session") || "[]");
            const entry = {
                question: currentQuestion,
                answer: "Question skipped",
                groqScore: 0,
                geminiScore: 0,
                groqFeedback: { score: 0, whatWasMissed: "Question was skipped" },
                geminiFeedback: { score: 0, whatWasMissed: "Question was skipped" },
                skipped: true,
            };
            session.push(entry);
            sessionStorage.setItem("practiq-session", JSON.stringify(session));
            setSkipsUsed((prev) => prev + 1);
            setIsSkipping(false);

            if (currentIndex < roleQuestions.length - 1) {
                setCurrentIndex((prev) => prev + 1);
                setFeedback(null);
                setHintsGiven([]);
            } else {
                router.push("/report");
            }
        } catch (err) {
            console.error("Failed to save skip data:", err);
        }
    };

    const handleNext = () => {
        if (currentIndex < roleQuestions.length - 1) {
            setCurrentIndex((prev) => prev + 1);
            setFeedback(null);
            setHintsGiven([]);
        }
    };

    return (
        <div className="flex flex-col flex-1 min-h-screen bg-black overflow-x-hidden">
            {/* Progress Bar */}
            <div className="fixed top-0 left-0 w-full h-1 bg-zinc-900 z-[60] no-print">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(currentIndex / roleQuestions.length) * 100}%` }}
                    className="h-full bg-gradient-to-r from-purple-600 to-pink-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                />
            </div>

            {/* Nav bar */}
            <motion.nav 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/60 sticky top-0 bg-black/80 backdrop-blur-xl z-50"
            >
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => router.push("/home")}
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-all duration-200 cursor-pointer group"
                    >
                        <motion.svg
                            whileHover={{ x: -2 }}
                            className="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15 19l-7-7 7-7"
                            />
                        </motion.svg>
                        Back
                    </button>
                    <Link href="/" className="hidden sm:block text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500 tracking-tighter hover:opacity-80 transition-all duration-200">
                        Practiq
                    </Link>
                    <Link href="/history" className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-xl border border-white/5 bg-zinc-900/60 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white hover:border-purple-500/50 transition-all duration-200">
                        History
                    </Link>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">
                        {currentRoleData?.label}
                    </span>
                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all duration-200 ${
                        difficulty === "easy" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                        difficulty === "medium" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                        "bg-rose-500/10 text-rose-400 border-rose-500/20"
                    }`}>
                        {difficulty}
                    </span>
                </div>
                <div className="w-16" /> {/* spacer for centering */}
            </motion.nav>

            {/* Main content */}
            <main className="flex flex-col items-center gap-8 px-6 py-10 flex-1 max-w-4xl mx-auto w-full relative">
                {isGeneratingQuestions ? (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center gap-6 py-20"
                    >
                        <div className="relative w-24 h-24">
                            <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                className="absolute inset-0 rounded-full border-4 border-purple-500/20 border-t-purple-500" 
                            />
                            <motion.div 
                                animate={{ rotate: -360 }}
                                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                className="absolute inset-4 rounded-full border-4 border-pink-500/20 border-b-pink-500" 
                            />
                        </div>
                        <div className="text-center space-y-2">
                            <h2 className="text-xl font-bold text-white tracking-tight">Generating Targeted Questions</h2>
                            <p className="text-zinc-500 text-sm max-w-xs mx-auto leading-relaxed">
                                Our AI is crafting custom questions specifically for {searchParams.get("company") || "your target company"}...
                            </p>
                        </div>
                    </motion.div>
                ) : (
                    <>
                        {difficulty === "hard" && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-rose-500/20 bg-rose-500/5 text-rose-400 text-xs mb-2"
                            >
                                <span className="text-sm">⚠️</span>
                                <p>Hard Mode: These questions are designed to test deep technical understanding and edge cases.</p>
                            </motion.div>
                        )}
                        
                        <AnimatePresence mode="wait">
                            <motion.div 
                                key={currentIndex}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.4, ease: "easeOut" }}
                                className="w-full flex flex-col gap-6"
                            >
                                {/* Question */}
                                <QuestionCard
                                    question={currentQuestion}
                                    questionNumber={currentIndex + 1}
                                    totalQuestions={roleQuestions.length}
                                    round={round}
                                />
                                
                                {/* Hints Section */}
                                <div className="w-full flex flex-col gap-4">
                                    <AnimatePresence>
                                        {hintsGiven.length > 0 && (
                                            <motion.div 
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                className="flex flex-col gap-3"
                                            >
                                                {hintsGiven.map((hint, idx) => (
                                                    <motion.div 
                                                        key={idx}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="flex gap-3 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-100 shadow-sm shadow-amber-500/5"
                                                    >
                                                        <span className="text-xl">💡</span>
                                                        <div>
                                                            <h4 className="text-amber-500 font-semibold text-sm mb-1">Hint</h4>
                                                            <p className="text-sm leading-relaxed">{hint}</p>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Get Hint & Skip Buttons */}
                                    {!feedback && (
                                        <div className="flex flex-col items-end gap-3">
                                            {isSkipping ? (
                                                <motion.div 
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="flex flex-col items-end gap-2 p-3 rounded-xl border border-zinc-800 bg-zinc-900 shadow-xl"
                                                >
                                                    <p className="text-xs text-zinc-400 mb-1">Skipping will give you a score of 0. Continue?</p>
                                                    <div className="flex gap-2">
                                                        <button 
                                                            onClick={() => setIsSkipping(false)}
                                                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-500 hover:text-white transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button 
                                                            onClick={handleSkip}
                                                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all"
                                                        >
                                                            Yes, Skip
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            ) : (
                                                <div className="flex items-center gap-3">
                                                    <motion.button
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => setIsSkipping(true)}
                                                        disabled={skipsUsed >= 3 || loading}
                                                        title={skipsUsed >= 3 ? "Skip limit reached (3/3)" : ""}
                                                        className="group flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/5 bg-zinc-900/40 text-zinc-600 hover:text-zinc-300 hover:border-zinc-700 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                                                    >
                                                        Skip Question
                                                        <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                                                    </motion.button>

                                                    <motion.button
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={handleGetHint}
                                                        disabled={hintsGiven.length >= 1 || isFetchingHint || loading}
                                                        className="group flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-amber-400 hover:border-amber-500/40 hover:bg-amber-500/5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                                    >
                                                        <span className="text-sm">{isFetchingHint ? "⏳" : "💡"}</span>
                                                        {isFetchingHint 
                                                            ? "Thinking..." 
                                                            : hintsGiven.length >= 1 
                                                                ? "No more hints" 
                                                                : `Get Hint (${1 - hintsGiven.length})`}
                                                    </motion.button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Answer input */}
                                <div className="w-full">
                                    <AnswerInput 
                                        key={currentIndex} 
                                        onSubmit={handleSubmit} 
                                        disabled={loading || !!feedback} 
                                        duration={currentDuration}
                                    />
                                </div>
                            </motion.div>
                        </AnimatePresence>

                        {/* Loading state */}
                        {loading && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col items-center gap-4 py-12"
                            >
                                <div className="relative w-12 h-12">
                                    <motion.div 
                                        animate={{ rotate: 360 }}
                                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                        className="absolute inset-0 rounded-full border-2 border-zinc-800 border-t-purple-500" 
                                    />
                                </div>
                                <p className="text-sm text-zinc-500 animate-pulse font-medium">
                                    Analyzing your answer with AI…
                                </p>
                            </motion.div>
                        )}

                        {/* Error state */}
                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="w-full max-w-2xl mx-auto px-5 py-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm text-center"
                            >
                                <p>{error}</p>
                            </motion.div>
                        )}

                        {/* Feedback */}
                        {feedback && (
                            <motion.div 
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="w-full space-y-8 flex flex-col items-center"
                            >
                                <FeedbackSection
                                    groqFeedback={feedback.groq}
                                    geminiFeedback={feedback.gemini}
                                />

                                {/* Next question or View Report button */}
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={currentIndex < roleQuestions.length - 1 ? handleNext : () => router.push("/report")}
                                    className="group flex items-center justify-center gap-3 w-full sm:w-auto px-10 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-black text-sm
                                        shadow-xl shadow-purple-500/25 transition-all duration-200 cursor-pointer"
                                >
                                    {currentIndex < roleQuestions.length - 1 ? "Next Question" : "View Report Card"}
                                    <svg
                                        className="w-4 h-4 transition-transform group-hover:translate-x-1"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M9 5l7 7-7 7"
                                        />
                                    </svg>
                                </motion.button>

                                    {currentIndex === roleQuestions.length - 1 && (isTargetedMode || mode === null || mode === "standard") && (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-center py-8 w-full"
                                    >
                                        <div className="space-y-8">
                                            <div className="space-y-2">
                                                <h3 className="text-3xl font-bold text-white">Round {round} Complete!</h3>
                                                <p className="text-zinc-500 text-sm">Select difficulty for the next round of 7 questions.</p>
                                            </div>
                                            
                                            <div className="max-w-3xl mx-auto">
                                                <DifficultySelector 
                                                    onSelect={(newDiff) => {
                                                        setDifficulty(newDiff);
                                                        setRound((prev) => prev + 1);
                                                        setCurrentIndex(0);
                                                        setFeedback(null);
                                                        setHintsGiven([]);
                                                    }}
                                                    onBack={() => router.push("/home")}
                                                    title="Choose Next Difficulty"
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}

export default function InterviewPage() {
    return (
        <Suspense
            fallback={
                <div className="flex flex-1 items-center justify-center min-h-screen bg-black">
                    <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        className="w-10 h-10 rounded-full border-4 border-zinc-800 border-t-purple-500" 
                    />
                </div>
            }
        >
            <InterviewContent />
        </Suspense>
    );
}
