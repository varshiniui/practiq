import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Practiq — AI Mock Interview Coach",
  description:
    "Practiq is an AI-powered mock interview coach. Practice with role-specific, company-specific, and resume-based questions with dual AI feedback from Groq and Gemini.",
  icons: {
    icon: "/practiq-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body 
        className="min-h-full flex flex-col bg-zinc-950 text-zinc-100 font-[family-name:var(--font-geist-sans)]"
        suppressHydrationWarning={true}
      >
        {children}
      </body>
    </html>
  );
}
