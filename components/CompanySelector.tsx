"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { companyQuestions } from "@/lib/questions";
import DifficultySelector from "./DifficultySelector";

import { Building2 } from "lucide-react";

const textFallbacks: Record<string, { text: string; bg: string }> = {
  tcs: { text: 'TC', bg: '#003366' },
  hcl: { text: 'HC', bg: '#007B5E' },
  startupGeneral: { text: 'SG', bg: '#6C63FF' },
  bigbasket: { text: 'BB', bg: '#84C225' },
};

function CompanyLogo({ domain, label, companyKey }: { domain: string, label: string, companyKey: string }) {
  const [error, setError] = useState(false);

  // Check branded text fallback first (exact key match)
  const textFallback = textFallbacks[companyKey];
  if (textFallback) {
    return (
      <div
        className="flex items-center justify-center w-10 h-10 rounded-full text-white font-bold text-sm relative z-10 shadow-lg"
        style={{ backgroundColor: textFallback.bg }}
      >
        {textFallback.text}
      </div>
    );
  }

  // Generic text fallback for known-broken logos or on error
  const needsTextFallback = ["ISRO", "DRDO", "HAL", "Rapido", "Ola", "Namma Yatri"].includes(label);

  if (error || needsTextFallback) {
    const initials = label.substring(0, 2).toUpperCase();
    return (
      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-900 text-white font-bold text-xs border border-purple-500/30 relative z-10 shadow-lg">
        {initials}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center w-10 h-10 relative z-10 overflow-hidden">
      <img
        src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
        alt={label}
        className="w-10 h-10 object-contain"
        onError={() => setError(true)}
      />
    </div>
  );
}

export default function CompanySelector() {
  const router = useRouter();
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);

  const handleCompanySelect = (companyKey: string) => {
    setSelectedCompany(companyKey);
  };

  const handleDifficultySelect = (difficulty: string) => {
    if (!selectedCompany) return;
    router.push(`/interview?role=${selectedCompany}&mode=company&difficulty=${difficulty}`);
  };

  if (selectedCompany) {
    const companyData = (companyQuestions as any)[selectedCompany];
    return (
      <DifficultySelector 
        title={`${companyData.label} Interview`}
        onSelect={handleDifficultySelect}
        onBack={() => setSelectedCompany(null)}
      />
    );
  }

  return (
    <div className="w-full max-w-4xl mt-8 mb-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(companyQuestions).map(([key, company]) => (
          <motion.button
            key={key}
            onClick={() => handleCompanySelect(key)}
            whileHover={{ 
              scale: 1.05,
              transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.95 }}
            className="group relative flex items-center gap-3 p-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm transition-all duration-200 hover:border-zinc-600 hover:shadow-lg hover:shadow-purple-500/10 cursor-pointer"
          >
            <CompanyLogo domain={company.domain} label={company.label} companyKey={key} />
            <span className="font-semibold text-sm text-zinc-300 group-hover:text-white transition-colors duration-200 relative z-10">
              {company.label}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
