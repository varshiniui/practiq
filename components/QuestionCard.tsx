"use client";

import { motion } from "framer-motion";

interface QuestionCardProps {
  question: string;
  questionNumber: number;
  totalQuestions: number;
  round?: number;
}

export default function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  round,
}: QuestionCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative w-full rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-md overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/10"
    >
      {/* Top accent gradient border */}
      <div className="h-1 w-full bg-gradient-to-r from-purple-600 to-pink-500" />

      <div className="px-5 py-6 sm:px-8 sm:py-8">
        {/* Progress badge */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-purple-500/10 text-purple-400 border border-purple-500/20">
              {round ? `Round ${round}` : "Mock Interview"}
            </span>
            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
              Question {questionNumber} / {totalQuestions}
            </span>
          </div>
        </div>

        {/* Question text */}
        <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight tracking-tight">
          {question}
        </h2>
      </div>
    </motion.div>
  );
}
