"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import RoleSelector from "@/components/RoleSelector";
import CompanySelector from "@/components/CompanySelector";
import TargetedMode from "@/components/TargetedMode";
import ResumeMode from "@/components/ResumeMode";
import { supabase } from "@/lib/supabase";

import { BarChart2, LogOut } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<"standard" | "targeted" | "resume">("resume");
  const [user, setUser] = useState<any>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const userDisplayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || "User";

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/auth");
      } else {
        setUser(session.user);
      }
    };
    checkUser();
  }, [router]);

  const tabs = [
    { id: "resume", label: "Resume Mode" },
    { id: "targeted", label: "Targeted Mode" },
    { id: "standard", label: "Practice Modes" },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="flex flex-col flex-1 items-center justify-center min-h-screen px-6 relative overflow-hidden bg-black"
    >
      {/* Brand Link & Nav */}
      <div className="absolute top-8 left-8 right-8 z-50 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500 tracking-tight hover:opacity-80 transition-opacity">
          Practiq
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/history" className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-white/10 bg-zinc-900/60 text-xs font-black text-zinc-400 hover:text-white hover:border-purple-500/50 hover:bg-zinc-800 transition-all duration-200 uppercase tracking-widest">
            <BarChart2 size={14} className="text-purple-400" />
            History
          </Link>
          
          {user && (
            <div className="relative">
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white font-black text-sm border border-white/10 hover:border-purple-500 hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg shadow-purple-500/20"
              >
                {userDisplayName[0].toUpperCase()}
              </button>
              
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full right-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden py-2"
                  >
                    <div className="px-4 py-2 border-b border-zinc-800 mb-2">
                      <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Account</p>
                      <p className="text-xs text-zinc-300 truncate font-medium">{userDisplayName}</p>
                    </div>
                    <button 
                      onClick={async () => {
                        await supabase.auth.signOut();
                        router.push("/auth");
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-rose-400 hover:bg-rose-500/10 transition-colors font-bold flex items-center gap-2"
                    >
                      <LogOut size={14} />
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
      {/* Background glow effects */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />

      <main className="flex flex-col items-center gap-10 z-10 w-full max-w-5xl">
        {/* Heading */}
        <div className="text-center space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 text-xs text-zinc-400 mb-4"
          >
            <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
            AI-Powered Interview Practice
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="flex justify-center mb-6"
          >
            <img 
              src="/practiq-logo.png" 
              alt="Practiq Logo" 
              className="h-8 sm:h-11 w-auto object-contain"
            />
          </motion.div>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-zinc-400 text-lg max-w-md mx-auto leading-relaxed"
          >
            Master your next interview with tailored AI-generated questions and instant feedback.
          </motion.p>
        </div>

        {/* Mode Switcher */}
        <div className="flex p-1 bg-zinc-900/80 border border-white/5 rounded-2xl relative w-full sm:w-auto overflow-x-auto no-scrollbar shadow-2xl backdrop-blur-xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setMode(tab.id as any)}
              className={`relative flex-1 sm:flex-none px-6 py-3 sm:px-8 sm:py-3 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] transition-colors duration-200 z-10 whitespace-nowrap ${
                mode === tab.id ? "text-white" : "text-zinc-500 hover:text-purple-300"
              }`}
            >
              {tab.label}
              {mode === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-500 rounded-xl -z-10 shadow-lg shadow-purple-500/30"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="w-full flex flex-col items-center"
          >
            {mode === "resume" ? (
              <ResumeMode />
            ) : mode === "targeted" ? (
              <TargetedMode />
            ) : (
              <div className="w-full flex flex-col items-center">
                <div className="flex items-center gap-4 w-full max-w-4xl mb-10">
                    <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-700 font-black whitespace-nowrap">Standard Practice Modes</p>
                    <div className="h-px w-full bg-zinc-900" />
                </div>
                
                <div className="w-full flex flex-col items-center gap-12">
                    <div className="w-full flex flex-col items-center">
                        <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-500 font-black mb-6">Explore Roles</p>
                        <RoleSelector />
                    </div>
                    
                    <div className="w-full max-w-2xl h-px bg-zinc-900" />
                    
                    <div className="w-full flex flex-col items-center">
                        <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-500 font-black mb-6">Company Specific</p>
                        <CompanySelector />
                    </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </motion.div>
  );
}
