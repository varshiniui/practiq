"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

import { Home, Share2, ArrowRight, Settings, History } from "lucide-react";

export default function ReportPage() {
    const router = useRouter();
    const [sessionData, setSessionData] = useState<any[]>([]);
    const [sessionMeta, setSessionMeta] = useState<any>(null);
    const reportRef = useRef<HTMLDivElement>(null);
    const hasSaved = useRef(false);
    const [recentSessions, setRecentSessions] = useState<any[]>([]);

    const fetchRecentSessions = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const { data, error } = await supabase
                .from('practiq_history')
                .select('*')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false })
                .limit(5);
            
            if (error) {
                console.error('Error fetching recent sessions:', error);
            } else if (data) {
                setRecentSessions(data);
            }
        }
    };

    useEffect(() => {
        fetchRecentSessions();
    }, []);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) router.push("/auth");
        };
        checkUser();
    }, [router]);

    useEffect(() => {
        const dataStr = sessionStorage.getItem("practiq-session");
        const metaStr = sessionStorage.getItem("practiq-session-meta");
        const data = JSON.parse(dataStr || "[]");
        const metaData = JSON.parse(metaStr || "null");
        
        console.log('Session data from sessionStorage:', data);
        console.log('Meta data from sessionStorage:', metaData);
        
        setSessionData(data);
        setSessionMeta(metaData);
    }, []);

    const averageScore = sessionData.length > 0 
        ? sessionData.reduce((acc, curr) => {
            let score = (curr.groqScore + curr.geminiScore) / 2;
            // If the AI accidentally returned a 0-1 decimal instead of 0-10, scale it up
            if (score > 0 && score <= 1) score *= 10;
            return acc + score;
        }, 0) / sessionData.length
        : 0;

    useEffect(() => {
        if (sessionData && sessionData.length > 0 && averageScore > 0 && !hasSaved.current) {
            console.log('useEffect triggered saveToHistory. Conditions met:', {
                hasData: sessionData.length > 0,
                averageScore,
                hasSaved: hasSaved.current
            });
            saveToHistory();
            hasSaved.current = true;
        }
    }, [sessionData, averageScore]);

    const saveToHistory = async () => {
        // Explicitly get session to ensure we have the latest user_id for RLS
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
            console.error('Error fetching session:', sessionError);
            return;
        }

        console.log('Current user:', session?.user?.id || 'No session');
        
        if (!session || !session.user || !sessionMeta) {
            console.log('Save aborted: missing session or metaData', { 
                hasSession: !!session, 
                hasUser: !!session?.user,
                hasMeta: !!sessionMeta 
            });
            return;
        }
        
        // Unique ID to prevent duplicates
        const sessionId = `${sessionMeta.date}-${sessionMeta.mode}-${sessionMeta.role}-${averageScore.toFixed(2)}`;
        
        console.log('Checking for existing entry with sessionId:', sessionId);
        const { data: existing } = await supabase
            .from('practiq_history')
            .select('id')
            .eq('session_id', sessionId)
            .eq('user_id', session.user.id)
            .maybeSingle();
            
        if (existing) {
            console.log('Entry already exists, skipping save.');
            return;
        }

        // Ensure all keys match the database schema (snake_case)
        const displayRole = sessionMeta.role.includes(' - ') 
            ? sessionMeta.role.split(' - ')[1].toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase()) + " Developer"
            : sessionMeta.role;

        const newEntry = {
            user_id: session.user.id,
            session_id: sessionId,
            date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
            mode: sessionMeta.mode,
            role: displayRole,
            company: sessionMeta.company,
            difficulty: sessionMeta.difficulty,
            average_score: Number(averageScore.toFixed(1)),
            total_questions: Number(sessionMeta.totalQuestions || 0),
            grade: averageScore >= 9 ? 'Excellent' : averageScore >= 7 ? 'Good' : averageScore >= 5 ? 'Needs Work' : 'Keep Practicing',
        };

        console.log('Attempting to save to Supabase...');
        console.log('Insert payload:', newEntry);

        const { data, error } = await supabase
            .from('practiq_history')
            .insert([newEntry])
            .select();

        console.log('Insert result:', data, 'Error:', error);
        
        if (!error) {
            // Refresh recent sessions after successful save
            fetchRecentSessions();
        } else {
            if (error.code === '42P01') console.error('Table "practiq_history" does not exist.');
            else if (error.code === '42703') console.error('One or more columns do not exist in the database.');
            else if (error.message.includes('RLS')) console.error('RLS policy violation: Check if you have insert permissions.');
        }
    };

    if (!sessionMeta || sessionData.length === 0) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <p className="text-zinc-500">No session data found.</p>
            </div>
        );
    }

    const avgScore = averageScore;
    
    const getNextRoundUrl = () => {
        if (!sessionMeta) return "/home";
        const nextRound = (sessionMeta.round || 1) + 1;
        const role = sessionMeta.roleKey || "sde";
        const diff = sessionMeta.difficulty || "medium";
        const company = sessionMeta.company;
        const mode = sessionMeta.originalMode;
        
        let url = `/interview?role=${role}&difficulty=${diff}&round=${nextRound}`;
        if (mode) {
            url += `&mode=${mode}`;
        }
        if (company && (mode === "targeted" || mode === "company")) {
            url += `&company=${encodeURIComponent(company)}`;
        }
        return url;
    };

    const getGrade = (score: number) => {
        if (score >= 9) return { label: "Excellent", color: "text-emerald-400" };
        if (score >= 7) return { label: "Good", color: "text-purple-400" };
        if (score >= 5) return { label: "Needs Work", color: "text-amber-400" };
        return { label: "Keep Practicing", color: "text-rose-400" };
    };

    const grade = getGrade(avgScore);
    const skippedCount = sessionData.filter(item => item.skipped).length;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-black text-zinc-100 py-20 px-6 flex flex-col items-center selection:bg-purple-500/30">
            <style jsx global>{`
                @media print {
                    @page {
                        margin: 1cm;
                        size: auto;
                    }
                    body {
                        background: white !important;
                        color: black !important;
                    }
                    nav, .no-print {
                        display: none !important;
                    }
                    .print-card {
                        border: 2px solid #e5e7eb !important;
                        box-shadow: none !important;
                        background: white !important;
                        color: black !important;
                        width: 100% !important;
                        max-width: none !important;
                        padding: 2rem !important;
                        margin: 0 !important;
                        border-radius: 20px !important;
                    }
                    .print-card * {
                        color: black !important;
                        border-color: #e5e7eb !important;
                    }
                    .print-gradient-text {
                        background: none !important;
                        -webkit-text-fill-color: #7C3AED !important;
                        color: #7C3AED !important;
                    }
                    .print-bg-zinc-900 {
                        background: #f4f4f5 !important;
                    }
                    .print-badge {
                        background: #f3f4f6 !important;
                        border: 1px solid #d1d5db !important;
                        color: #374151 !important;
                    }
                    .progress-ring-bg {
                        stroke: #f3f4f6 !important;
                    }
                }
            `}</style>
            {/* Certificate Container */}
            <motion.div 
                ref={reportRef}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-[40px] p-12 relative overflow-hidden shadow-2xl print-card"
            >
                {/* Background Accents */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 blur-[120px] rounded-full -mr-48 -mt-48 no-print" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-600/10 blur-[120px] rounded-full -ml-48 -mb-48 no-print" />

                {/* Header */}
                <div className="flex flex-col items-center text-center mb-16 relative z-10">
                    <img src="/practiq-logo.png" alt="Practiq" className="h-12 mb-8" />
                    <h1 className="text-4xl font-bold tracking-tight text-white mb-3 print-text-dark">Interview Performance Report</h1>
                    <div className="flex flex-wrap justify-center items-center gap-3 mt-4">
                        <span className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-bold uppercase tracking-widest text-zinc-500 print-badge">
                            {sessionMeta.date}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] font-bold uppercase tracking-widest text-purple-400 print-badge">
                            {sessionMeta.mode} Mode
                        </span>
                        <span className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-bold uppercase tracking-widest text-zinc-500 print-badge">
                            {sessionMeta.difficulty}
                        </span>
                        {skippedCount > 0 && (
                            <span className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-[10px] font-bold uppercase tracking-widest text-rose-400 print-badge">
                                {skippedCount} skipped out of {sessionData.length}
                            </span>
                        )}
                    </div>
                    <div className="mt-8">
                        <h2 className="text-2xl font-bold text-white tracking-tight print-text-dark">{sessionMeta.role}</h2>
                        {sessionMeta.company && <p className="text-purple-400/80 font-medium mt-1 print-text-dark">Targeting {sessionMeta.company}</p>}
                    </div>
                </div>

                {/* Score Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20 relative z-10 py-10 px-6 rounded-[32px] bg-white/5 border border-white/5 shadow-2xl">
                    <div className="flex justify-center">
                        <div className="relative w-64 h-64 flex items-center justify-center">
                            <div className={`absolute inset-0 blur-[40px] rounded-full opacity-20 transition-all duration-1000 ${
                                avgScore >= 9 ? "bg-emerald-500 shadow-[0_0_60px_rgba(16,185,129,0.4)]" :
                                avgScore >= 7 ? "bg-purple-500 shadow-[0_0_60px_rgba(139,92,246,0.4)]" :
                                avgScore >= 5 ? "bg-amber-500 shadow-[0_0_60px_rgba(245,158,11,0.4)]" :
                                "bg-rose-500 shadow-[0_0_60px_rgba(244,63,94,0.4)]"
                            }`} />
                            <svg className="w-full h-full -rotate-90 relative z-10" viewBox="0 0 100 100">
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="44"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="6"
                                    className="text-zinc-900 progress-ring-bg"
                                />
                                <motion.circle
                                    initial={{ strokeDashoffset: 276 }}
                                    animate={{ strokeDashoffset: 276 - (avgScore / 10) * 276 }}
                                    transition={{ duration: 2, ease: "easeOut" }}
                                    cx="50"
                                    cy="50"
                                    r="44"
                                    fill="none"
                                    stroke="url(#reportGrad)"
                                    strokeWidth="6"
                                    strokeLinecap="round"
                                    strokeDasharray="276"
                                />
                                <defs>
                                    <linearGradient id="reportGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#7C3AED" />
                                        <stop offset="100%" stopColor="#EC4899" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                                <motion.span 
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 1, delay: 0.5 }}
                                    className="text-7xl font-black text-white"
                                >
                                    {avgScore.toFixed(1)}
                                </motion.span>
                                <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-black">AVG SCORE</span>
                            </div>
                        </div>
                    </div>
                    <div className="text-center md:text-left space-y-6">
                        <div className="space-y-1">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 print-text-dark">Overall Performance</h3>
                            <p className={`text-6xl sm:text-7xl font-black tracking-tighter ${grade.color} print-gradient-text drop-shadow-2xl`}>{grade.label}</p>
                        </div>
                        <p className="text-zinc-400 text-base leading-relaxed max-w-sm mx-auto md:mx-0 print-text-dark font-medium">
                            Your performance was verified across {sessionData.length} role-specific questions with comparative AI evaluation from Groq and Gemini.
                        </p>
                    </div>
                </div>
                {/* Breakdown */}
                <div className="space-y-6 relative z-10">
                    <div className="flex items-center gap-4 mb-8">
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 whitespace-nowrap">Detailed Analysis</h3>
                        <div className="h-px w-full bg-zinc-900" />
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                        {sessionData.map((item, idx) => {
                            const itemScore = (item.groqScore + item.geminiScore) / 2;
                            const scoreColor = itemScore >= 8 ? "border-l-emerald-500" : itemScore >= 5 ? "border-l-amber-500" : "border-l-rose-500";
                            
                            return (
                                <div key={idx} className={`group p-4 sm:p-6 rounded-2xl border border-zinc-900 bg-zinc-900/20 transition-all duration-200 hover:border-zinc-800 border-l-4 ${scoreColor} hover:shadow-lg hover:shadow-purple-500/5`}>
                                    <div className="flex justify-between items-start gap-6 mb-4">
                                        <div className="flex gap-4">
                                            <span className="text-zinc-700 font-mono text-sm mt-1">0{idx + 1}</span>
                                            <p className="text-zinc-200 font-bold text-base leading-snug">{item.question}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {item.skipped ? (
                                                <span className="px-3 py-1 rounded-lg bg-zinc-800 text-zinc-500 text-[10px] font-black uppercase tracking-widest border border-zinc-700/50 print-badge">
                                                    Skipped
                                                </span>
                                            ) : (
                                                <>
                                                    <div className="h-2 w-24 bg-zinc-900 rounded-full overflow-hidden hidden sm:block">
                                                        <div 
                                                            className="h-full bg-gradient-to-r from-purple-600 to-pink-500 shadow-[0_0_10px_rgba(168,85,247,0.3)]" 
                                                            style={{ width: `${itemScore * 10}%` }}
                                                        />
                                                    </div>
                                                    <span className={`text-lg font-black w-8 text-right ${
                                                        itemScore >= 8 ? "text-emerald-400" : itemScore >= 5 ? "text-amber-400" : "text-rose-400"
                                                    }`}>
                                                        {itemScore.toFixed(1)}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="pl-10 border-l border-zinc-800/50 mt-4 py-1">
                                        <p className="text-zinc-500 text-sm leading-relaxed">
                                            <span className={`${item.skipped ? 'text-zinc-600' : 'text-purple-400'} font-bold uppercase tracking-wider text-[10px] mr-2`}>
                                                {item.skipped ? 'Status:' : 'AI Insight:'}
                                            </span> {item.skipped ? 'Question was skipped' : item.groqFeedback.whatWasMissed.split('.')[0]}.
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                {/* Recent History Section */}
                {recentSessions.length > 0 && (
                    <div className="mt-20 pt-10 border-t border-zinc-900 relative z-10 no-print">
                        <div className="flex items-center gap-4 mb-8">
                            <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-500 whitespace-nowrap">Your Recent Sessions</h3>
                            <div className="h-px w-full bg-zinc-900" />
                        </div>
                        
                        <div className="space-y-3">
                            {recentSessions.map((session, idx) => (
                                <div key={idx} className="group flex flex-col sm:flex-row items-center justify-between p-4 rounded-2xl bg-zinc-900/20 border border-zinc-900 hover:border-zinc-800 transition-all gap-4">
                                    <div className="flex items-center gap-5">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-tight">{session.date}</span>
                                            <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[8px] font-black uppercase tracking-widest mt-1 w-fit">
                                                {session.mode}
                                            </span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-zinc-200 group-hover:text-white transition-colors">{session.role}</span>
                                            {session.company && <span className="text-[10px] text-zinc-500">{session.company}</span>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <span className={`px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-wider ${
                                            session.difficulty === 'easy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                            session.difficulty === 'medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                            'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                        }`}>
                                            {session.difficulty}
                                        </span>
                                        <span className={`text-xl font-black ${
                                            session.average_score >= 8 ? 'text-emerald-400' : 
                                            session.average_score >= 6 ? 'text-amber-400' : 'text-rose-400'
                                        }`}>
                                            {session.average_score.toFixed(1)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="mt-6 flex justify-center sm:justify-end">
                            <Link href="/history" className="group/link text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-purple-400 transition-all flex items-center gap-2">
                                View Full History
                                <ArrowRight size={12} className="group-hover/link:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>
                )}

                {/* Branding Footer inside certificate */}
                <div className="mt-20 pt-10 border-t border-zinc-900 flex flex-col sm:flex-row justify-between items-center gap-4 relative z-10">
                    <div className="flex flex-col gap-1">
                        <p className="text-zinc-700 text-[10px] uppercase tracking-widest font-black">Practiq Authentication Node</p>
                        <p className="text-zinc-800 text-[8px] font-mono tracking-tighter">HASH: {Math.random().toString(36).substring(2).toUpperCase()}{Math.random().toString(36).substring(2).toUpperCase()}</p>
                    </div>
                    <p className="text-zinc-700 text-[10px] uppercase tracking-[0.4em] font-black">practiq.ai</p>
                </div>
            </motion.div>

            {/* Global Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-4 mt-16 relative z-50 no-print">
                <Link 
                    href={getNextRoundUrl()}
                    className="w-full sm:w-auto group px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold shadow-xl shadow-purple-500/20 hover:scale-105 hover:opacity-90 active:scale-95 transition-all duration-200 flex items-center justify-center gap-3"
                >
                    Next Round
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-200" />
                </Link>
                
                <button 
                    onClick={handlePrint}
                    className="w-full sm:w-auto px-8 py-4 rounded-xl bg-transparent border border-white/20 text-white font-bold hover:border-purple-500/50 hover:bg-zinc-900 transition-all duration-200 flex items-center justify-center gap-3 active:scale-95"
                >
                    <Share2 size={18} />
                    Share Performance
                </button>

                <Link 
                    href="/history"
                    className="w-full sm:w-auto px-8 py-4 rounded-xl bg-transparent border border-white/20 text-white font-bold hover:border-purple-500/50 hover:bg-zinc-900 transition-all duration-200 flex items-center justify-center gap-3 active:scale-95"
                >
                    <History size={18} />
                    View History
                </Link>

                <Link 
                    href="/home"
                    className="px-6 py-3 text-zinc-500 hover:text-white font-bold transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 group"
                >
                    <Settings size={16} className="group-hover:rotate-90 transition-transform duration-300" />
                    Change Settings
                </Link>
            </div>
        </div>
    );
}
