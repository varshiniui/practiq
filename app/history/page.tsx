"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    ReferenceLine
} from "recharts";

interface HistoryEntry {
    id: number;
    sessionId: string;
    date: string;
    mode: string;
    role: string;
    company?: string;
    difficulty: string;
    averageScore: number;
    totalQuestions: number;
    grade: string;
}

import { 
    Target, 
    TrendingUp, 
    Trophy, 
    Briefcase, 
    BarChart2,
    Calendar,
    ArrowLeft
} from "lucide-react";

export default function HistoryPage() {
    const router = useRouter();
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const fetchHistory = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push("/auth");
                return;
            }

            const { data, error } = await supabase
                .from('practiq_history')
                .select('*')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false });
            
            if (!error && data) {
                const mappedData = data.map(item => ({
                    id: item.id,
                    sessionId: item.session_id,
                    date: item.date,
                    mode: item.mode,
                    role: item.role,
                    company: item.company,
                    difficulty: item.difficulty,
                    averageScore: item.average_score,
                    totalQuestions: item.total_questions,
                    grade: item.grade
                }));
                setHistory(mappedData);
            }
            setIsLoaded(true);
        };
        fetchHistory();
    }, [router]);

    const clearHistory = () => {
        if (confirm("Are you sure you want to clear your entire practice history?")) {
            localStorage.removeItem("practiq-history");
            setHistory([]);
        }
    };

    if (!isLoaded) return null;

    if (history.length === 0) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center space-y-8 relative z-10"
                >
                    <div className="w-24 h-24 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-2xl flex items-center justify-center mx-auto border border-purple-500/20 shadow-lg shadow-purple-500/10">
                        <BarChart2 size={44} className="text-purple-400" />
                    </div>
                    <div className="space-y-3">
                        <h1 className="text-3xl font-black text-white tracking-tight">No sessions yet</h1>
                        <p className="text-zinc-500 max-w-xs mx-auto leading-relaxed">Start practicing to see your progress history and performance insights here.</p>
                    </div>
                    <Link 
                        href="/home"
                        className="inline-flex px-8 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold text-sm shadow-lg shadow-purple-500/20 active:scale-95 transition-all duration-200 hover:opacity-90 hover:scale-105"
                    >
                        Start Practicing
                    </Link>
                </motion.div>
            </div>
        );
    }

    // Stats calculations
    const totalSessions = history.length;
    const avgScore = history.reduce((acc, curr) => acc + curr.averageScore, 0) / totalSessions;
    const bestScore = Math.max(...history.map(h => h.averageScore));
    
    // Most practiced role - clean up display
    const roleCounts = history.reduce((acc: any, curr) => {
        acc[curr.role] = (acc[curr.role] || 0) + 1;
        return acc;
    }, {});
    
    const rawTopRole = Object.entries(roleCounts).length > 0 
        ? Object.entries(roleCounts).sort((a: any, b: any) => b[1] - a[1])[0][0] 
        : "N/A";
        
    const cleanTopRole = rawTopRole.includes(' - ')
        ? rawTopRole.split(' - ')[1].toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) + " Developer"
        : rawTopRole;

    // Chart data - last 10 sessions
    const chartData = history.slice(-10).map(h => ({
        date: h.date.split(',')[0], // Just the day/month
        score: h.averageScore
    }));

    return (
        <div className="min-h-screen bg-black text-zinc-100 py-12 px-6 lg:px-20 selection:bg-purple-500/30">
            <div className="max-w-6xl mx-auto space-y-12">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <Link href="/home" className="flex items-center gap-2 text-xs font-bold text-purple-500 uppercase tracking-[0.2em] hover:text-purple-400 transition-colors mb-4 inline-block">
                            <ArrowLeft size={14} />
                            Back to Dashboard
                        </Link>
                        <h1 className="text-4xl font-black text-white tracking-tight">Your Progress</h1>
                        <p className="text-zinc-500 text-lg">Track your improvement over time across all roles.</p>
                    </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: "Total Sessions", value: totalSessions, Icon: Target },
                        { label: "Average Score", value: avgScore.toFixed(1), Icon: TrendingUp },
                        { label: "Best Score", value: bestScore.toFixed(1), Icon: Trophy },
                        { label: "Top Role", value: cleanTopRole, Icon: Briefcase },
                    ].map((stat, i) => (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-200"
                        >
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4">
                                <stat.Icon size={20} className="text-purple-400" />
                            </div>
                            <h3 className="text-[10px] uppercase tracking-widest text-zinc-500 font-black mb-1">{stat.label}</h3>
                            <p className="text-2xl font-black text-white">{stat.value}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Chart Section */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="rounded-2xl bg-zinc-900/30 border border-zinc-800 overflow-hidden"
                >
                    <div className="h-1 w-full bg-gradient-to-r from-purple-600 to-pink-500" />
                    <div className="p-8">
                    <div className="flex items-center justify-between mb-10">
                        <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-400">Score Trend (Last 10 Sessions)</h3>
                        <div className="flex items-center gap-4 text-[10px] font-bold">
                            <div className="flex items-center gap-1.5 text-purple-500">
                                <div className="w-2 h-2 rounded-full bg-purple-500" />
                                <span>Score</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-zinc-700">
                                <div className="w-2 h-2 rounded-full bg-zinc-700" />
                                <span>Target (7.0)</span>
                            </div>
                        </div>
                    </div>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <defs>
                                    <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#EC4899" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                                <XAxis 
                                    dataKey="date" 
                                    stroke="#52525b" 
                                    fontSize={10} 
                                    tickLine={false} 
                                    axisLine={false}
                                    dy={10}
                                />
                                <YAxis 
                                    domain={[0, 10]} 
                                    stroke="#52525b" 
                                    fontSize={10} 
                                    tickLine={false} 
                                    axisLine={false}
                                    dx={-10}
                                />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: '#09090b', 
                                        borderColor: '#27272a',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        color: '#fff'
                                    }}
                                    itemStyle={{ color: '#8b5cf6' }}
                                />
                                <ReferenceLine y={7} stroke="#27272a" strokeDasharray="5 5" label={{ value: 'Target', position: 'right', fill: '#3f3f46', fontSize: 8 }} />
                                <Line 
                                    type="monotone" 
                                    dataKey="score" 
                                    stroke="url(#lineGradMain)" 
                                    strokeWidth={4}
                                    dot={{ r: 6, fill: '#09090b', stroke: '#8b5cf6', strokeWidth: 2 }}
                                    activeDot={{ r: 8, strokeWidth: 0 }}
                                    animationDuration={2000}
                                />
                                <defs>
                                    <linearGradient id="lineGradMain" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#8B5CF6" />
                                        <stop offset="100%" stopColor="#EC4899" />
                                    </linearGradient>
                                </defs>
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    </div>
                </motion.div>

                {/* Session List */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4 mb-4">
                        <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-500 whitespace-nowrap">Session History</h3>
                        <div className="h-px w-full bg-zinc-900" />
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {history.slice().reverse().map((entry, idx) => {
                            const scoreColor = entry.averageScore >= 7 ? 'border-l-emerald-500' : entry.averageScore >= 5 ? 'border-l-amber-500' : 'border-l-rose-500';
                            return (
                                <motion.div 
                                    key={entry.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: Math.min(0.05 * idx, 0.5) }}
                                    className={`group flex flex-col md:flex-row md:items-center justify-between p-5 rounded-2xl border border-zinc-900 bg-zinc-900/20 hover:border-zinc-800 hover:shadow-lg hover:shadow-purple-500/5 transition-all duration-200 gap-4 border-l-4 ${scoreColor}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-col min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Calendar size={10} className="text-zinc-600 shrink-0" />
                                                <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider truncate">{entry.date}</span>
                                            </div>
                                            <h4 className="text-white font-bold group-hover:text-purple-300 transition-colors duration-200">{entry.role}</h4>
                                            {entry.company && <p className="text-zinc-500 text-xs mt-0.5">→ {entry.company}</p>}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                                            {entry.mode}
                                        </span>
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                                            entry.difficulty === 'easy' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' :
                                            entry.difficulty === 'medium' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                                            'bg-rose-500/10 border-rose-500/20 text-rose-400'
                                        }`}>
                                            {entry.difficulty}
                                        </span>
                                        <div className="flex flex-col items-end ml-2 pl-2 border-l border-zinc-800">
                                            <span className={`text-2xl font-black leading-none ${
                                                entry.averageScore >= 7 ? 'text-emerald-400' : 
                                                entry.averageScore >= 5 ? 'text-amber-400' : 'text-rose-400'
                                            }`}>
                                                {entry.averageScore.toFixed(1)}
                                            </span>
                                            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{entry.grade}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex justify-center pt-12">
                    <button 
                        onClick={clearHistory}
                        className="px-6 py-3 rounded-xl border border-zinc-800 text-zinc-600 hover:text-rose-400 hover:border-rose-500/30 hover:bg-rose-500/5 transition-all duration-200 text-xs font-black uppercase tracking-widest"
                    >
                        Clear History
                    </button>
                </div>

            </div>
        </div>
    );
}
