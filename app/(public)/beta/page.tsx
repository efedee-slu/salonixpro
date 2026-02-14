"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Scissors,
  ArrowRight,
  Check,
  Sparkles,
  Users,
  Calendar,
  BarChart3,
  Globe,
  ShoppingBag,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* ──────────────────── scroll-fade hook ──────────────────── */
function useScrollFade(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.unobserve(el); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, className: visible ? "animate-fade-up" : "opacity-0 translate-y-6" };
}

function FadeIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, className: fadeClass } = useScrollFade();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${fadeClass} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

const perks = [
  { icon: Calendar, text: "Smart appointment scheduling" },
  { icon: Users, text: "Complete client management" },
  { icon: Sparkles, text: "130+ pre-loaded Caribbean services" },
  { icon: ShoppingBag, text: "Inventory & point of sale" },
  { icon: BarChart3, text: "Financial reports & analytics" },
  { icon: Globe, text: "Online booking page" },
];

const salonSizes = [
  { value: "1-3", label: "1-3 staff" },
  { value: "4-10", label: "4-10 staff" },
  { value: "11+", label: "11+ staff" },
];

export default function BetaSignupPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    salonName: "",
    phone: "",
    country: "",
    salonSize: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/beta-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <style jsx global>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up {
          animation: fadeUp 0.7s ease-out forwards;
        }
      `}</style>

      {/* ─── Navbar ─── */}
      <nav className="bg-white/92 backdrop-blur-xl shadow-sm border-b border-gray-200/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/25">
                <Scissors className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">SalonixPro</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" className="font-medium text-gray-700">
                  Sign In
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="font-medium">
                  Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ─── Hero Section ─── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-teal-950 pt-20 pb-16 lg:pt-28 lg:pb-24">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-teal-500/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 mb-8">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span className="text-sm font-medium text-teal-300">Limited Beta Access</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-6 max-w-4xl mx-auto leading-[1.1]">
              Be the first to try{" "}
              <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
                SalonixPro
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Join our exclusive beta program and help shape the future of salon management
              in the Caribbean. Early adopters get priority access and special pricing.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Main Content ─── */}
      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-start">

            {/* Left: Benefits */}
            <div>
              <FadeIn>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                  What you get as a beta tester
                </h2>
                <p className="text-lg text-gray-600 mb-10 leading-relaxed">
                  As a beta tester, you&rsquo;ll get early access to the full SalonixPro platform
                  before it launches publicly. Help us build the perfect tool for your salon.
                </p>
              </FadeIn>

              <div className="space-y-4 mb-10">
                {perks.map((p, i) => (
                  <FadeIn key={p.text} delay={i * 80}>
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100 flex items-center justify-center flex-shrink-0">
                        <p.icon className="w-5 h-5 text-teal-600" />
                      </div>
                      <span className="text-gray-800 font-medium">{p.text}</span>
                    </div>
                  </FadeIn>
                ))}
              </div>

              <FadeIn delay={500}>
                <div className="p-6 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Beta tester benefits</h3>
                  <ul className="space-y-2">
                    {[
                      "Free access during the entire beta period",
                      "Discounted pricing when we launch",
                      "Direct input on features and improvements",
                      "Priority customer support",
                    ].map((b) => (
                      <li key={b} className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-teal-600" />
                        </div>
                        <span className="text-gray-700 text-sm">{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </FadeIn>
            </div>

            {/* Right: Form */}
            <FadeIn delay={200}>
              <div className="sticky top-24">
                {submitted ? (
                  <div className="p-10 rounded-2xl bg-white border border-gray-200 shadow-xl text-center">
                    <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-6">
                      <Check className="w-8 h-8 text-teal-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      You&rsquo;re on the list!
                    </h3>
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      Thank you for signing up for the SalonixPro beta program.
                      We&rsquo;ll review your application and be in touch soon with next steps.
                    </p>
                    <p className="text-sm text-gray-500">
                      Check your email for a confirmation message.
                    </p>
                    <Link href="/" className="block mt-8">
                      <Button variant="outline" className="w-full">
                        Back to Home
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="p-8 rounded-2xl bg-white border border-gray-200 shadow-xl">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Request beta access
                    </h3>
                    <p className="text-gray-500 mb-8">
                      Fill out the form below and we&rsquo;ll get back to you.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                      {/* Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Your name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-sm"
                          placeholder="John Smith"
                        />
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Email address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-sm"
                          placeholder="john@mysalon.com"
                        />
                      </div>

                      {/* Salon Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Salon name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={form.salonName}
                          onChange={(e) => setForm({ ...form, salonName: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-sm"
                          placeholder="Caribbean Cuts"
                        />
                      </div>

                      {/* Phone & Country row */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Phone
                          </label>
                          <input
                            type="tel"
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-sm"
                            placeholder="+1 (767) 000-0000"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Country
                          </label>
                          <input
                            type="text"
                            value={form.country}
                            onChange={(e) => setForm({ ...form, country: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-sm"
                            placeholder="Dominica"
                          />
                        </div>
                      </div>

                      {/* Salon Size */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Salon size
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                          {salonSizes.map((s) => (
                            <button
                              key={s.value}
                              type="button"
                              onClick={() => setForm({ ...form, salonSize: s.value })}
                              className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                                form.salonSize === s.value
                                  ? "border-teal-500 bg-teal-50 text-teal-700 ring-2 ring-teal-500/20"
                                  : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300"
                              }`}
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Message */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Anything else you&rsquo;d like us to know?
                        </label>
                        <textarea
                          value={form.message}
                          onChange={(e) => setForm({ ...form, message: e.target.value })}
                          rows={3}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-sm resize-none"
                          placeholder="Tell us about your salon, what tools you currently use, etc."
                        />
                      </div>

                      {error && (
                        <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                          <p className="text-sm text-red-600">{error}</p>
                        </div>
                      )}

                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-14 bg-teal-600 hover:bg-teal-700 text-white text-lg shadow-lg shadow-teal-600/25 disabled:opacity-60"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            Request Beta Access
                            <ArrowRight className="ml-2 w-5 h-5" />
                          </>
                        )}
                      </Button>

                      <p className="text-xs text-gray-400 text-center">
                        By signing up, you agree to receive emails about SalonixPro.
                        We&rsquo;ll never spam you.
                      </p>
                    </form>
                  </div>
                )}
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-slate-950 border-t border-slate-800 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
              <Scissors className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">SalonixPro</span>
          </div>
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} SalonixPro. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
