"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { questions, companyQuestions } from "@/lib/questions";
import DifficultySelector from "./DifficultySelector";

import * as LucideIcons from "lucide-react";
import { ArrowLeft, Briefcase } from "lucide-react";

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
      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-900 text-white font-bold text-xs border border-purple-500/30 relative z-10 shadow-lg">
        {initials}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center w-10 h-10 relative z-10 overflow-hidden group-hover:scale-110 transition-transform">
      <img 
        src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`} 
        alt={label}
        className="w-10 h-10 object-contain"
        onError={() => setError(true)}
      />
    </div>
  );
}

export default function TargetedMode() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
    const [selectedRole, setSelectedRole] = useState<string | null>(null);

    const handleCompanySelect = (key: string) => {
        setSelectedCompany(key);
        setStep(2);
    };

    const handleRoleSelect = (key: string) => {
        setSelectedRole(key);
        setStep(3);
    };

    const handleDifficultySelect = (difficulty: string) => {
        if (!selectedCompany || !selectedRole) return;
        router.push(`/interview?mode=targeted&company=${selectedCompany}&role=${selectedRole}&difficulty=${difficulty}`);
    };

    if (step === 3) {
        const companyData = (companyQuestions as any)[selectedCompany!];
        const roleData = (questions as any)[selectedRole!];
        return (
            <DifficultySelector 
                title={`${companyData.label} - ${roleData.label}`}
                onSelect={handleDifficultySelect}
                onBack={() => setStep(2)}
            />
        );
    }

    return (
        <div className="w-full max-w-4xl mt-12 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col items-center gap-4 mb-10">
                <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-black text-white tracking-tight">Targeted Interview</h2>
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-pink-500/20 text-pink-400 border border-pink-500/30">
                        PREMIUM
                    </span>
                </div>
                <p className="text-zinc-500 text-sm font-medium">
                    {step === 1 ? "Select your target company" : "Select your target role"}
                </p>
                <div className="flex gap-2 mt-2">
                    <div className={`h-1.5 w-12 rounded-full transition-all duration-500 ${step >= 1 ? "bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" : "bg-zinc-800"}`} />
                    <div className={`h-1.5 w-12 rounded-full transition-all duration-500 ${step >= 2 ? "bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" : "bg-zinc-800"}`} />
                    <div className={`h-1.5 w-12 rounded-full transition-all duration-500 ${step >= 3 ? "bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" : "bg-zinc-800"}`} />
                </div>
            </div>

            {step === 1 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 animate-in fade-in zoom-in-95 duration-500">
                    {Object.entries(companyQuestions).map(([key, company]) => (
                        <button
                            key={key}
                            onClick={() => handleCompanySelect(key)}
                            className="group relative flex flex-col items-center gap-3 p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm transition-all duration-200 hover:border-purple-500/50 hover:bg-zinc-800/80 hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-1 cursor-pointer"
                        >
                            <CompanyLogo domain={company.domain} label={company.label} companyKey={key} />
                            <span className="font-bold text-sm text-zinc-300 group-hover:text-white transition-colors duration-200">
                                {company.label}
                            </span>
                        </button>
                    ))}
                </div>
            )}

            {step === 2 && (
                <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-8 duration-500">
                    <button 
                        onClick={() => setStep(1)}
                        className="text-xs text-zinc-500 hover:text-purple-400 flex items-center gap-2 transition-colors w-fit font-bold uppercase tracking-widest"
                    >
                        <ArrowLeft size={14} />
                        Change Company
                    </button>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {Object.entries(questions).map(([key, role]) => {
                            const IconComponent = (LucideIcons as any)[role.icon] ?? Briefcase;
                            return (
                                <button
                                    key={key}
                                    onClick={() => handleRoleSelect(key)}
                                    className="group relative flex flex-col items-center gap-3 p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm transition-all duration-200 hover:border-purple-500/50 hover:bg-zinc-800/80 hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-1 cursor-pointer"
                                >
                                    <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-110 group-hover:bg-purple-500/20 transition-all duration-200">
                                        <IconComponent size={32} />
                                    </div>
                                    <h3 className="text-sm font-black text-white group-hover:text-purple-300 transition-colors duration-200">{role.label}</h3>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
