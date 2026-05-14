"use client";

import FeedbackCard, { type Feedback } from "./FeedbackCard";

interface FeedbackSectionProps {
  groqFeedback: Feedback;
  geminiFeedback: Feedback;
}

export default function FeedbackSection({
  groqFeedback,
  geminiFeedback,
}: FeedbackSectionProps) {
  return (
    <section className="w-full max-w-6xl mx-auto px-4 py-8">
      {/* Section heading */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">
          AI Feedback Comparison
        </h2>
        <p className="text-sm text-zinc-500">
          Side-by-side analysis from two leading AI models
        </p>
      </div>

      {/* Side-by-side cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FeedbackCard provider="groq" feedback={groqFeedback} />
        <FeedbackCard provider="gemini" feedback={geminiFeedback} />
      </div>
    </section>
  );
}
