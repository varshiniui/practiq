"use client";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

export default function AnswerInput({
  onSubmit,
  disabled = false,
  duration = 120,
}: {
  onSubmit: (text: string) => void;
  disabled?: boolean;
  duration?: number;
}) {
  const [mode, setMode] = useState<"text" | "voice">("text");
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Timer state
  const [timeLeft, setTimeLeft] = useState(duration);
  const totalTime = duration;

  useEffect(() => {
    // Stop timer if disabled (loading/feedback showing) or time is up
    if (disabled || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto submit when time hits 0
          onSubmit(text);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [disabled, timeLeft, onSubmit, text]);

  // Derived timer values for UI
  const progress = (timeLeft / totalTime) * 100;
  const isWarning = timeLeft <= 30;
  const isDanger = timeLeft <= 10;
  
  // Circle SVG properties
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        setTranscribing(true);
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const fd = new FormData();
        fd.append("audio", blob, "answer.webm");
        try {
          const res = await fetch("/api/transcribe", {
            method: "POST",
            body: fd,
          });
          const data = await res.json();
          if (data.text) {
            setText(data.text);
          } else {
             console.error("Transcription error:", data.error);
          }
        } catch (err) {
          console.error("Transcription request failed", err);
        } finally {
          setTranscribing(false);
        }
      };
      recorder.start();
      mediaRef.current = recorder;
      setRecording(true);
      setText(""); // clear previous text when starting a new recording
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  const stopRecording = () => {
    mediaRef.current?.stop();
    setRecording(false);
  };

  return (
    <div className="flex flex-col gap-6 p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-md transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/5">
      {/* Top Header: Mode toggle & Timer */}
      <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4">
        <div className="flex p-1 bg-zinc-800/50 rounded-xl w-full sm:w-fit border border-zinc-800">
          <button
            onClick={() => setMode("text")}
            className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all duration-200 cursor-pointer ${
              mode === "text"
                ? "bg-zinc-700 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Text Input
          </button>
          <button
            onClick={() => setMode("voice")}
            className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all duration-200 cursor-pointer ${
              mode === "voice"
                ? "bg-zinc-700 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Voice Input
          </button>
        </div>

        {/* Timer UI */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-400 font-medium hidden sm:inline-block">Time Remaining</span>
          <div className="relative w-16 h-16 flex items-center justify-center">
            {/* Background ring */}
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="32"
                cy="32"
                r={radius}
                className="stroke-zinc-800"
                strokeWidth="4"
                fill="none"
              />
              {/* Progress ring */}
              <circle
                cx="32"
                cy="32"
                r={radius}
                className={`transition-all duration-1000 ease-linear ${
                  isDanger ? "stroke-rose-500" : isWarning ? "stroke-orange-500" : "stroke-purple-500"
                }`}
                strokeWidth="4"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <span 
              className={`relative text-lg font-bold tabular-nums ${
                isDanger ? "text-rose-500 animate-shake" : isWarning ? "text-orange-500" : "text-white"
              }`}
            >
              {timeLeft}
            </span>
          </div>
        </div>
      </div>

      {/* Input area */}
      <div className="min-h-[160px] flex flex-col justify-center">
        {mode === "text" ? (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-40 p-4 rounded-xl border border-zinc-700 bg-zinc-800/50 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all resize-none"
            placeholder="Type your answer here..."
          />
        ) : (
          <div className="flex flex-col items-center gap-6">
            {/* Mic button */}
            <div className="relative">
              {recording && (
                <>
                  <div className="absolute inset-0 rounded-full bg-rose-500/30 animate-ping" />
                  <div className="absolute -inset-4 rounded-full border border-rose-500/20 animate-pulse" />
                </>
              )}
              <button
                onClick={recording ? stopRecording : startRecording}
                className={`relative flex items-center justify-center w-20 h-20 rounded-full transition-all duration-300 shadow-lg cursor-pointer ${
                  recording
                    ? "bg-rose-500 hover:bg-rose-600 shadow-rose-500/25"
                    : "bg-zinc-700 hover:bg-zinc-600 border border-zinc-600"
                }`}
              >
                {recording ? (
                  <svg
                    className="w-8 h-8 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                ) : (
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                )}
              </button>
            </div>
            
            {/* Status / Output text */}
            <div className="text-center w-full max-w-xl min-h-[3rem]">
              {recording ? (
                <p className="text-rose-400 font-medium animate-pulse">
                  Recording... Click to stop
                </p>
              ) : transcribing ? (
                <div className="flex items-center justify-center gap-2 text-zinc-400">
                  <div className="w-4 h-4 border-2 border-zinc-500 border-t-purple-500 rounded-full animate-spin" />
                  <span>Transcribing audio...</span>
                </div>
              ) : text ? (
                <div className="relative">
                  <p className="text-lg text-zinc-300 italic">"{text}"</p>
                  <button 
                    onClick={() => setText("")}
                    className="text-xs text-zinc-500 hover:text-zinc-300 mt-2 cursor-pointer transition-colors"
                  >
                    Clear recording
                  </button>
                </div>
              ) : (
                <p className="text-zinc-500">
                  Click the microphone to start recording your answer
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Submit button */}
      <div className="flex justify-center mt-2 border-t border-zinc-800/60 pt-6">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSubmit(text)}
          disabled={!text.trim() || recording || transcribing || disabled}
          className="group flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-200 cursor-pointer"
        >
          <span>Get Feedback</span>
          <svg
            className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </motion.button>
      </div>
    </div>
  );
}