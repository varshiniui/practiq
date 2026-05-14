"use client";

import { motion } from "framer-motion";

const difficulties = [
  {
    key: "easy",
    label: "Easy",
    description: "Fresher friendly, concept-based questions",
    color: "bg-purple-500",
    border: "hover:border-purple-500/50",
    text: "text-purple-400",
    bg: "bg-purple-500/10",
  },
  {
    key: "medium",
    label: "Medium",
    description: "Internship level, applied thinking",
    color: "bg-amber-500",
    border: "hover:border-amber-500/50",
    text: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  {
    key: "hard",
    label: "Hard",
    description: "Placement ready, deep technical + problem solving",
    color: "bg-rose-500",
    border: "hover:border-rose-500/50",
    text: "text-rose-400",
    bg: "bg-rose-500/10",
  },
];

interface DifficultySelectorProps {
  onSelect: (difficulty: string) => void;
  onBack: () => void;
  title?: string;
}

export default function DifficultySelector({ onSelect, onBack, title }: DifficultySelectorProps) {
  return (
    <div className="w-full max-w-4xl">
      <div className="flex flex-col items-center gap-6 mb-10 text-center">
        <button 
            onClick={onBack}
            className="text-xs text-zinc-500 hover:text-white transition-colors flex items-center gap-1 active:scale-95 transition-transform"
        >
            ← Change Selection
        </button>
        <div className="space-y-2">
            <h2 className="text-3xl font-bold text-white tracking-tight">{title || "Select Difficulty"}</h2>
            <p className="text-zinc-500 text-sm">Choose a level that matches your preparation</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {difficulties.map((diff) => (
          <motion.button
            key={diff.key}
            onClick={() => onSelect(diff.key)}
            whileHover={{ 
              scale: 1.05,
              transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.95 }}
            className={`
              group relative flex flex-col items-center gap-6 p-10 rounded-2xl
              border border-zinc-800 bg-zinc-900/60 backdrop-blur-md
              transition-all duration-200
              ${diff.border} hover:shadow-lg hover:shadow-purple-500/10 cursor-pointer
            `}
          >
            <div className={`w-16 h-16 rounded-full ${diff.bg} flex items-center justify-center`}>
                <motion.div 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className={`w-4 h-4 rounded-full ${diff.color} shadow-[0_0_15px_rgba(0,0,0,0.5)] shadow-current`} 
                />
            </div>
            <div className="text-center">
                <h3 className={`text-2xl font-black ${diff.text} mb-2 tracking-tight`}>{diff.label}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed max-w-[180px] mx-auto">
                    {diff.description}
                </p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
