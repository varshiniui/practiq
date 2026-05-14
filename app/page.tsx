"use client";

import Link from "next/link";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

function CountUp({ end, duration = 2 }: { end: number; duration?: number }) {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const inView = useInView(ref, { once: true });

    useEffect(() => {
        if (inView) {
            let start = 0;
            const increment = end / (duration * 60);
            const timer = setInterval(() => {
                start += increment;
                if (start >= end) {
                    setCount(end);
                    clearInterval(timer);
                } else {
                    setCount(Math.floor(start));
                }
            }, 1000 / 60);
            return () => clearInterval(timer);
        }
    }, [inView, end, duration]);

    return <span ref={ref}>{count}</span>;
}

import { supabase } from "@/lib/supabase";

export default function LandingPage() {
    const [hasSession, setHasSession] = useState(false);

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setHasSession(!!session);
        };
        checkSession();
    }, []);

    const authLink = hasSession ? "/home" : "/auth";
    const buttonText = hasSession ? "Continue to App" : "Start Practicing";
    return (
        <div className="flex flex-col min-h-screen bg-black text-zinc-100 selection:bg-purple-500/30 selection:text-purple-200">
            {/* Animated Background Blobs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/5 rounded-full blur-[120px] animate-blob" />
                <div className="absolute top-[20%] right-[-10%] w-[35%] h-[35%] bg-pink-600/5 rounded-full blur-[120px] animate-blob animation-delay-2000" />
                <div className="absolute bottom-[-10%] left-[20%] w-[30%] h-[30%] bg-purple-600/5 rounded-full blur-[120px] animate-blob animation-delay-4000" />
            </div>

            {/* Navbar */}
            <motion.nav 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="sticky top-0 w-full z-50 border-b border-zinc-800/50 bg-black/80 backdrop-blur-xl py-4 px-6 h-20 md:h-24 flex items-center"
            >
                <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
                    <Link href="/" className="flex items-center bg-white/5 px-3 py-1.5 md:px-4 md:py-2 rounded-2xl hover:bg-white/10 transition-all duration-200 active:scale-95">
                        <img 
                            src="/practiq-logo.png" 
                            alt="Practiq Logo" 
                            className="h-[40px] md:h-[60px] w-auto object-contain object-left"
                        />
                    </Link>
                    
                    {/* Desktop Button */}
                    <Link 
                        href={authLink}
                        className="hidden md:block px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white text-sm font-bold hover:opacity-90 transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-purple-500/20"
                    >
                        {buttonText}
                    </Link>

                    {/* Mobile Hamburger */}
                    <button 
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 text-zinc-400 hover:text-white transition-all duration-200"
                    >
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {/* Mobile Dropdown */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="absolute top-full left-0 right-0 bg-black border-b border-zinc-800 p-6 md:hidden overflow-hidden"
                        >
                            <Link 
                                href={authLink}
                                className="block w-full text-center px-6 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white text-lg font-bold shadow-lg shadow-purple-500/20"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {buttonText}
                            </Link>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.nav>

            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden py-24">
                    <div className="relative z-10 text-center space-y-8 max-w-4xl mx-auto">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                            className="inline-flex items-center px-4 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 text-xs font-medium text-zinc-400"
                        >
                            Professional Mock Interview Platform
                        </motion.div>
                        
                        <h1 className="text-4xl md:text-7xl font-bold tracking-tighter text-white flex flex-wrap justify-center gap-x-4 gap-y-2 px-4 md:px-0">
                            {"Ace Your Next Interview with Practiq".split(" ").map((word, i) => (
                                <span key={i} className="overflow-hidden inline-block py-2">
                                    <motion.span
                                        initial={{ y: "100%" }}
                                        animate={{ y: 0 }}
                                        transition={{ 
                                            duration: 0.8, 
                                            delay: i * 0.1, 
                                            ease: [0.33, 1, 0.68, 1] 
                                        }}
                                        className="inline-block"
                                    >
                                        {word.includes("Practiq") || word.includes("Interview") ? (
                                            <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                                                {word}
                                            </span>
                                        ) : word}
                                    </motion.span>
                                </span>
                            ))}
                        </h1>

                        <motion.p 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 1.2 }}
                            className="text-zinc-400 text-xl sm:text-2xl max-w-2xl mx-auto leading-relaxed"
                        >
                            AI-powered mock interviews tailored to your role, your company, and your resume. Practice smarter, not harder.
                        </motion.p>

                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 1.5 }}
                            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 w-full px-6 sm:px-0"
                        >
                            <Link 
                                href={authLink}
                                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold text-lg hover:opacity-90 transition-all duration-200 hover:scale-105 active:scale-95 shadow-xl shadow-purple-500/20 flex items-center justify-center"
                            >
                                {buttonText}
                            </Link>
                            <button 
                                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-zinc-950 text-purple-300 font-bold text-lg border border-white/20 hover:border-purple-500/50 hover:bg-zinc-900 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
                            >
                                See How It Works
                            </button>
                        </motion.div>
                    </div>

                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.2 }}
                        transition={{ delay: 2, duration: 1 }}
                        className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                    </motion.div>
                </section>

                {/* Stats Bar */}
                <section className="border-y border-zinc-800/50 bg-zinc-900/20 py-24">
                    <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-3 gap-12 text-center">
                        <div className="space-y-2">
                            <div className="text-4xl font-bold text-purple-400 tracking-tight"><CountUp end={40} />+</div>
                            <div className="text-zinc-500 text-sm font-medium uppercase tracking-widest">Companies</div>
                        </div>
                        <div className="space-y-2">
                            <div className="text-4xl font-bold text-purple-400 tracking-tight"><CountUp end={20} />+</div>
                            <div className="text-zinc-500 text-sm font-medium uppercase tracking-widest">Roles</div>
                        </div>
                        <div className="space-y-2">
                            <div className="text-4xl font-bold text-purple-400 tracking-tight">Dual AI</div>
                            <div className="text-zinc-500 text-sm font-medium uppercase tracking-widest">Feedback</div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-24 px-6">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center space-y-4 mb-20">
                            <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight">Powerful Interview Modes</h2>
                            <p className="text-zinc-500 max-w-xl mx-auto">Everything you need to prepare for placements and job switches in one place.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                { title: "Targeted Mode", desc: "Pick a company and role. Get questions built specifically for that combination - not generic ones.", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
                                { title: "Resume Mode", desc: "Upload your resume. Get questions about your actual projects, skills, and internships.", icon: "M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
                                { title: "Dual AI Analysis", desc: "Every answer is evaluated by both Groq and Gemini side by side so you get a complete picture.", icon: "M9.663 17h4.674M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" }
                            ].map((feature, i) => (
                                <motion.div 
                                    key={i}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: i * 0.2 }}
                                    className="p-px bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-2xl transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/10"
                                >
                                    <div className="group h-full p-8 rounded-2xl bg-zinc-900 border border-zinc-800 transition-all duration-200 hover:bg-zinc-800/50 hover:border-purple-500/50">
                                        <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6 text-purple-500 group-hover:scale-110 transition-transform duration-200">
                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feature.icon} />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                                        <p className="text-zinc-500 leading-relaxed text-sm">{feature.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* How It Works Section */}
                <section className="py-24 px-6 bg-zinc-900/20">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center space-y-4 mb-20">
                            <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight">How It Works</h2>
                            <p className="text-zinc-500 max-w-xl mx-auto">Three simple steps to mastery.</p>
                        </div>

                        <div className="relative">
                            <div className="hidden md:block absolute top-12 left-0 w-full h-px bg-zinc-800 z-0" />
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
                                {[
                                    { step: 1, title: "Choose your mode", desc: "Select role, company, or upload your resume." },
                                    { step: 2, title: "Answer questions", desc: "Respond with text or voice to simulate a real interview." },
                                    { step: 3, title: "Improve with AI", desc: "Get instant detailed feedback from multiple AI models." }
                                ].map((item, i) => (
                                    <motion.div 
                                        key={i}
                                        initial={{ opacity: 0, x: -30 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.6, delay: i * 0.3 }}
                                        className="flex flex-col items-center text-center space-y-6"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold flex items-center justify-center shadow-lg shadow-purple-500/20 ring-4 ring-black">
                                            {item.step}
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="text-xl font-bold text-white">{item.title}</h4>
                                            <p className="text-zinc-500 text-sm">{item.desc}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-24 px-6">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="max-w-4xl mx-auto p-12 sm:p-20 rounded-3xl border border-white/5 bg-zinc-900/40 text-center space-y-8 relative overflow-hidden backdrop-blur-xl"
                    >
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 shadow-[0_0_20px_rgba(168,85,247,0.3)]" />
                        <h2 className="text-4xl sm:text-6xl font-bold text-white tracking-tight leading-tight">
                            Ready to practice?
                        </h2>
                        <p className="text-zinc-500 text-lg max-w-md mx-auto">
                            Don't wait until the day of your interview. Start preparing today with the world's most advanced mock interviewer.
                        </p>
                        <div className="pt-4">
                            <Link 
                                href={authLink}
                                className="inline-flex px-12 py-5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold text-xl hover:opacity-90 transition-all duration-200 hover:scale-105 active:scale-95 shadow-xl shadow-purple-500/20"
                            >
                                {hasSession ? "Go to Dashboard" : "Start Your Interview"}
                            </Link>
                        </div>
                    </motion.div>
                </section>
            </main>

            {/* Footer */}
            <footer className="py-12 border-t border-zinc-800/50">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <p className="text-zinc-600 text-sm font-medium tracking-wide">
                        Practiq - Built with Groq and Google Gemini. Made for placement season.
                    </p>
                </div>
            </footer>
        </div>
    );
}

