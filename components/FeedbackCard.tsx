"use client";

import { motion } from "framer-motion";

export interface Feedback {
  score: number;
  whatWasGood: string;
  whatWasMissed: string;
  betterAnswer: string;
}

interface FeedbackCardProps {
  provider: "groq" | "gemini";
  feedback: Feedback;
}

const providerConfig = {
  groq: {
    label: "Groq",
    subtitle: "Llama 3.3 70B",
    gradient: "from-orange-500 to-amber-400",
    accentBg: "bg-orange-500/10",
    accentText: "text-orange-400",
    scoreTrack: "stroke-orange-900/30",
    scoreArc: "stroke-orange-400",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
  gemini: {
    label: "Gemini",
    subtitle: "Flash 1.5",
    gradient: "from-purple-600 to-pink-500",
    accentBg: "bg-purple-500/10",
    accentText: "text-purple-400",
    scoreTrack: "stroke-purple-900/30",
    scoreArc: "stroke-purple-400",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z" />
      </svg>
    ),
  },
};

function ScoreRing({
  score,
  trackClass,
  arcClass,
  glowColor,
}: {
  score: number;
  trackClass: string;
  arcClass: string;
  glowColor: string;
}) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 10) * circumference;

  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      <div className={`absolute inset-0 rounded-full blur-xl opacity-20 ${glowColor}`} />
      <svg className="w-full h-full -rotate-90 relative z-10" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="6"
          className={trackClass}
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          className={`${arcClass} transition-all duration-1000 ease-out`}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
        <span className="text-4xl font-black text-white">{score}</span>
        <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
          / 10
        </span>
      </div>
    </div>
  );
}

function SectionBlock({
  icon,
  title,
  content,
  accentBg,
  accentText,
}: {
  icon: React.ReactNode;
  title: string;
  content: string;
  accentBg: string;
  accentText: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`flex items-center justify-center w-6 h-6 rounded-md text-xs font-bold ${accentBg} ${accentText}`}
        >
          {icon}
        </span>
        <h4
          className={`text-xs font-semibold uppercase tracking-wider ${accentText}`}
        >
          {title}
        </h4>
      </div>
      <p className="text-sm leading-relaxed text-zinc-300 pl-8">{content}</p>
    </div>
  );
}

export default function FeedbackCard({ provider, feedback }: FeedbackCardProps) {
  const config = providerConfig[provider];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        relative flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/80
        backdrop-blur-xl overflow-hidden
        transition-all duration-200 hover:border-zinc-700 hover:shadow-lg hover:shadow-purple-500/10
      `}
    >
      {/* Top gradient accent line */}
      <div className={`h-1 w-full bg-gradient-to-r ${config.gradient}`} />

      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center justify-center w-9 h-9 rounded-xl ${config.accentBg} ${config.accentText}`}
          >
            {config.icon}
          </div>
          <div>
            <h3 className="text-base font-bold text-white">{config.label}</h3>
            <p className="text-[11px] text-zinc-500">{config.subtitle}</p>
          </div>
        </div>
        <div
          className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${config.accentBg} ${config.accentText}`}
        >
          AI Feedback
        </div>
      </div>

      {/* Score ring */}
      <div className="flex justify-center py-5">
        <ScoreRing
          score={feedback.score}
          trackClass={config.scoreTrack}
          arcClass={config.scoreArc}
          glowColor={provider === 'groq' ? 'bg-orange-500' : 'bg-purple-500'}
        />
      </div>

      {/* Divider */}
      <div className="mx-6 h-px bg-zinc-800" />

      {/* Feedback sections */}
      <div className="flex flex-col gap-5 px-6 py-5">
        <SectionBlock
          icon="✓"
          title="What Was Good"
          content={feedback.whatWasGood}
          accentBg="bg-emerald-500/10"
          accentText="text-emerald-400"
        />
        <SectionBlock
          icon="✗"
          title="What Was Missed"
          content={feedback.whatWasMissed}
          accentBg="bg-rose-500/10"
          accentText="text-rose-400"
        />
        <SectionBlock
          icon="★"
          title="Better Answer"
          content={feedback.betterAnswer}
          accentBg={config.accentBg}
          accentText={config.accentText}
        />
      </div>
    </motion.div>
  );
}
