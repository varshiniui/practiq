"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Globe, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";

export default function AuthPage() {
  const router = useRouter();
  const [isSignIn, setIsSignIn] = useState(true);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isSignIn) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push("/home");
      } else {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName,
            },
            emailRedirectTo: window.location.origin + '/home',
          }
        });
        if (error) throw error;
        setMessage({ type: 'success', text: "Check your email to confirm your account!" });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/',
        },
      });
      if (error) throw error;
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute top-1/4 -left-48 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-3xl pointer-events-none animate-[blob_7s_infinite]" />
      <div className="absolute bottom-1/4 -right-48 w-[500px] h-[500px] bg-pink-600/15 rounded-full blur-3xl pointer-events-none animate-[blob_7s_infinite_2s]" />
      <div className="absolute top-3/4 left-1/3 w-72 h-72 bg-violet-600/10 rounded-full blur-3xl pointer-events-none animate-[blob_7s_infinite_4s]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo Image */}
        <div className="flex flex-col items-center mb-10">
          <img src="/practiq-logo.png" alt="Practiq Logo" className="h-16 w-auto" />
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/50 ring-1 ring-white/5">
          {/* Tab Switcher */}
          <div className="flex bg-black/30 p-1 rounded-xl mb-8 border border-white/5">
            <button
              onClick={() => { setIsSignIn(true); setMessage(null); }}
              className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all duration-200 ${isSignIn ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg shadow-purple-500/20' : 'text-gray-400 hover:text-gray-200'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsSignIn(false); setMessage(null); }}
              className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all duration-200 ${!isSignIn ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg shadow-purple-500/20' : 'text-gray-400 hover:text-gray-200'}`}
            >
              Sign Up
            </button>
          </div>

          {/* Google Sign-In Button - Prominent at Top */}
          <button
            onClick={handleGoogleSignIn}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold py-5 rounded-xl shadow-xl shadow-purple-500/25 hover:opacity-90 hover:shadow-purple-500/40 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3 mb-8"
          >
            <Globe size={24} />
            <span className="text-lg">Sign in with Google</span>
          </button>

          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-black"><span className="bg-black px-4 text-gray-600">Or</span></div>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            {!isSignIn && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-2"
              >
                <label className="text-xs uppercase tracking-wider font-semibold text-gray-400 ml-1">What should we call you?</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 transition-all duration-200 hover:border-white/20"
                  required={!isSignIn}
                />
              </motion.div>
            )}

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider font-semibold text-gray-400 ml-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 transition-all duration-200 hover:border-white/20"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider font-semibold text-gray-400 ml-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 transition-all duration-200 hover:border-white/20"
                required
              />
            </div>

            {!isSignIn && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-2"
              >
                <label className="text-xs uppercase tracking-wider font-semibold text-gray-400 ml-1">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/40 transition-all"
                  required
                />
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {message && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`p-4 rounded-xl flex items-start gap-3 ${message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'}`}
                >
                  {message.type === 'success' ? <CheckCircle2 size={18} className="mt-0.5 shrink-0" /> : <AlertCircle size={18} className="mt-0.5 shrink-0" />}
                  <p className="text-sm font-medium">{message.text}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold py-4 rounded-xl shadow-xl shadow-purple-500/25 hover:opacity-90 hover:shadow-purple-500/40 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isSignIn ? "Sign In" : "Create Account"}
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            {!isSignIn && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-xs text-gray-500 mt-4 px-2"
              >
                <p>Having trouble signing up? Use Google sign in above.</p>
              </motion.div>
            )}
          </form>

        </div>

        <p className="text-center text-gray-600 text-[10px] uppercase tracking-[0.2em] mt-10">
          Practiq Authentication Protocol v2.4
        </p>
      </motion.div>
    </div>
  );
}
