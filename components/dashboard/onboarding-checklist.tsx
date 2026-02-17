"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  X,
  ArrowRight,
  Copy,
  CheckCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";

interface ChecklistItem {
  step: number;
  label: string;
  description: string;
  completed: boolean;
  link: string | null;
  bookingUrl?: string;
}

interface ChecklistData {
  items: ChecklistItem[];
  completedCount: number;
  totalCount: number;
  allComplete: boolean;
  dismissed: boolean;
  slug: string;
}

export function OnboardingChecklist() {
  const [data, setData] = useState<ChecklistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    fetch("/api/onboarding/checklist")
      .then((res) => res.json())
      .then((d: ChecklistData) => {
        setData(d);
        if (d.dismissed) setDismissed(true);
        if (d.allComplete && !d.dismissed) {
          setTimeout(() => setShowCelebration(true), 500);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDismiss = async () => {
    setDismissed(true);
    await fetch("/api/onboarding/dismiss", { method: "PATCH" });
  };

  const handleCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  if (loading || dismissed || !data) return null;

  const progressPercent = (data.completedCount / data.totalCount) * 100;

  return (
    <div className="relative animate-in stagger-1">
      {/* Celebration overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-gradient-to-br from-teal-600/95 to-emerald-700/95 backdrop-blur-sm"
          >
            <div className="text-center p-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
              </motion.div>
              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-2xl font-bold text-white mb-2"
              >
                You&rsquo;re all set!
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-teal-100 mb-6"
              >
                Your salon is ready to receive appointments.
              </motion.p>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <Button
                  onClick={handleDismiss}
                  className="bg-white text-teal-700 hover:bg-white/90 font-bold shadow-lg"
                >
                  Got it!
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
        {/* Gradient top accent */}
        <div className="h-[3px] bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500" />

        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <div>
            <h3 className="text-lg font-black text-gray-900 tracking-tight">Getting Started</h3>
            <p className="text-sm text-gray-500 mt-0.5 font-medium">
              {data.completedCount} of {data.totalCount} complete
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            title="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-6 pb-4">
          <Progress value={progressPercent} className="h-2 bg-gray-100" />
        </div>

        {/* Checklist items */}
        <div className="divide-y divide-gray-100/60">
          {data.items.map((item) => (
            <div
              key={item.step}
              className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors"
            >
              {/* Status icon */}
              <div className="pt-0.5 shrink-0">
                {item.completed ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                ) : (
                  <Circle className="w-6 h-6 text-gray-300" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${item.completed ? "text-gray-400 line-through" : "text-gray-900"}`}>
                  {item.label}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>

                {/* Step 6: Booking URL with copy button */}
                {item.bookingUrl && (
                  <div className="flex items-center gap-2 mt-2">
                    <code className="text-xs bg-gray-100 text-teal-700 px-2.5 py-1 rounded-lg font-mono">
                      {item.bookingUrl}
                    </code>
                    <button
                      onClick={() => handleCopy(item.bookingUrl!)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                      title="Copy to clipboard"
                    >
                      {copied ? (
                        <CheckCheck className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Action button */}
              {!item.completed && item.link && (
                <Link href={item.link} className="shrink-0">
                  <Button
                    size="sm"
                    className="h-8 px-4 text-xs font-bold rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
                  >
                    Go
                    <ArrowRight className="ml-1 w-3 h-3" />
                  </Button>
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* Dismiss footer */}
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={handleDismiss}
            className="text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors"
          >
            Dismiss checklist
          </button>
        </div>
      </div>
    </div>
  );
}
