"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { questions } from "@/lib/questions";
import DifficultySelector from "./DifficultySelector";

import * as LucideIcons from "lucide-react";
import { Briefcase } from "lucide-react";

export default function RoleSelector() {
  const router = useRouter();
  const [hoveredRole, setHoveredRole] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const handleRoleSelect = (roleKey: string) => {
    setSelectedRole(roleKey);
  };

  const handleDifficultySelect = (difficulty: string) => {
    if (!selectedRole) return;
    router.push(`/interview?role=${selectedRole}&difficulty=${difficulty}`);
  };

  if (selectedRole) {
    const roleData = (questions as any)[selectedRole];
    return (
      <DifficultySelector 
        title={`Practice as ${roleData.label}`}
        onSelect={handleDifficultySelect}
        onBack={() => setSelectedRole(null)}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 w-full max-w-5xl">
      {Object.entries(questions).map(([key, role]) => {
        const IconComponent = (LucideIcons as any)[role.icon] ?? Briefcase;
        
        return (
          <motion.button
            key={key}
            onClick={() => handleRoleSelect(key)}
            onMouseEnter={() => setHoveredRole(key)}
            onMouseLeave={() => setHoveredRole(null)}
            whileHover={{ 
              scale: 1.05,
              transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.95 }}
            className={`
              group relative flex flex-col items-center gap-4 p-6 rounded-2xl
              border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm
              transition-all duration-200
              hover:border-zinc-600 hover:shadow-lg hover:shadow-purple-500/10 ${role.hoverGlow}
              cursor-pointer
            `}
          >
            {/* Gradient top bar */}
            <div
              className={`
                absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r ${role.gradient}
                transition-opacity duration-200
                ${hoveredRole === key ? "opacity-100" : "opacity-0"}
              `}
            />

            <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-purple-500/5 group-hover:bg-purple-500/10 transition-colors duration-200">
              <IconComponent size={28} className="text-purple-400" />
            </div>
            <h3 className="text-base font-semibold text-white group-hover:text-purple-300 transition-colors duration-200">{role.label}</h3>
            <p className="text-xs text-zinc-500 text-center leading-relaxed">
              {role.description}
            </p>
          </motion.button>
        );
      })}
    </div>
  );
}
