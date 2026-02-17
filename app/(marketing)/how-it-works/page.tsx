"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Sparkles,
  ShoppingBag,
  Globe,
  Check,
  ArrowRight,
  Star,
  Zap,
  Scissors,
  Menu,
  X,
  ChevronDown,
  HelpCircle,
  Mail,
  Camera,
  Repeat,
  Timer,
  CalendarCheck,
  Twitter,
  Facebook,
  Instagram,
  Linkedin,
  Store,
  UserPlus,
  Clock,
  Share2,
  CalendarPlus,
  Wallet,
  ClipboardList,
  Smartphone,
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

/* ──────────────────── data ──────────────────── */
const navLinks = [
  { label: "Features", href: "/#features" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Why Us", href: "/#why-us" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

const betaSteps = [
  { number: "1", title: "Visit the Beta Page", description: "Head to our beta signup page and fill in your salon details." },
  { number: "2", title: "Check Your Email", description: "Once approved, you'll receive a welcome email with your login credentials." },
  { number: "3", title: "Change Your Password", description: "Log in and set a new password to secure your account." },
  { number: "4", title: "Enjoy 30 Days Free", description: "Explore every feature at no cost for a full month. No credit card required." },
];

const trialSteps = [
  { number: "1", title: "Click Start Free Trial", description: "Hit the button below and you'll be on your way in seconds." },
  { number: "2", title: "Fill In Business Details", description: "Tell us about your salon — name, location, and the services you offer." },
  { number: "3", title: "14 Days Free Access", description: "Get full access to every feature for 14 days. No strings attached." },
  { number: "4", title: "Subscribe via PayPal", description: "When you're ready, pick a plan and subscribe securely through PayPal." },
];

const setupSteps = [
  { icon: Store, title: "Complete Your Profile", description: "Add your business name, address, phone, logo, and hours." },
  { icon: Sparkles, title: "Add Your Services", description: "Choose from 122+ pre-loaded Caribbean salon services or create your own." },
  { icon: UserPlus, title: "Add Your Staff", description: "Create staff accounts with role-based permissions and individual schedules." },
  { icon: Share2, title: "Share Your Booking Link", description: "Get your unique booking page URL and share it with clients via WhatsApp or social media." },
  { icon: CalendarPlus, title: "Start Receiving Appointments", description: "Clients book online 24/7. You manage everything from one dashboard." },
];

const includedFeatures = [
  { icon: Globe, label: "Online Booking with AI Chatbot" },
  { icon: Users, label: "Client Management (CRM)" },
  { icon: Clock, label: "Staff Scheduling" },
  { icon: ShoppingBag, label: "Point of Sale (POS)" },
  { icon: Store, label: "Product Store" },
  { icon: Wallet, label: "Expense Tracking" },
  { icon: ClipboardList, label: "Payroll Management" },
  { icon: Star, label: "Client Reviews" },
  { icon: Camera, label: "Before & After Gallery" },
  { icon: Repeat, label: "Recurring Appointments" },
  { icon: Timer, label: "Smart Waitlist" },
  { icon: CalendarCheck, label: "Google Calendar Sync" },
  { icon: Mail, label: "Email Notifications" },
  { icon: Smartphone, label: "Mobile Responsive" },
];

const faqs = [
  { q: "How long does the beta last?", a: "Beta testers get 30 days of completely free access to every feature. After that, you can subscribe to continue using SalonixPro at our regular pricing." },
  { q: "Do I need a credit card to start?", a: "No! Both the beta and the free trial are completely free to start. No credit card is required upfront." },
  { q: "Can I cancel anytime?", a: "Yes. There are no long-term contracts or cancellation fees. You can cancel your subscription at any time from your Settings page." },
  { q: "How do clients book appointments?", a: "You'll get a unique booking page at salonixpro.com/book/your-salon-name. Share this link with clients via WhatsApp, Instagram, or your website. Clients can browse your services and book 24/7." },
  { q: "Is my data private and secure?", a: "Absolutely. We use industry-standard encryption and secure servers. Your client data is private and never shared with third parties. Role-based access control ensures your team only sees what they need." },
];

/* ──────────────────── component ──────────────────── */
export default function HowItWorksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (status === "authenticated") router.push("/dashboard");
  }, [status, router]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (status === "authenticated") return null;

  return (
    <div className="min-h-screen bg-white">
      {/* ─── Global style for scroll animation ─── */}
      <style jsx global>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up {
          animation: fadeUp 0.7s ease-out forwards;
        }
        html { scroll-behavior: smooth; }
      `}</style>

      {/* ══════════════ NAVBAR ══════════════ */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/92 backdrop-blur-xl shadow-sm border-b border-gray-200/60"
          : "bg-transparent"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-18">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/25">
                <Scissors className="w-5 h-5 text-white" />
              </div>
              <span className={`text-xl font-bold transition-colors ${scrolled ? "text-gray-900" : "text-white"}`}>
                SalonixPro
              </span>
            </Link>

            <div className="hidden lg:flex items-center gap-8">
              {navLinks.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  className={`text-sm font-medium transition-colors hover:text-teal-500 ${
                    scrolled ? "text-gray-600" : "text-white/80 hover:text-white"
                  }`}
                >
                  {l.label}
                </a>
              ))}
            </div>

            <div className="hidden lg:flex items-center gap-3">
              <Link href="/login">
                <Button
                  variant="ghost"
                  className={`font-medium ${scrolled ? "text-gray-700 hover:text-gray-900" : "text-white/90 hover:text-white hover:bg-white/10"}`}
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-600/25">
                  Start Free Trial
                  <ArrowRight className="ml-1.5 w-4 h-4" />
                </Button>
              </Link>
            </div>

            <button
              className="lg:hidden p-2 rounded-lg"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen
                ? <X className={`w-6 h-6 ${scrolled ? "text-gray-900" : "text-white"}`} />
                : <Menu className={`w-6 h-6 ${scrolled ? "text-gray-900" : "text-white"}`} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b shadow-lg px-4 py-5 space-y-3">
            {navLinks.map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-gray-700 font-medium"
              >
                {l.label}
              </a>
            ))}
            <div className="pt-4 border-t space-y-2">
              <Link href="/login" className="block">
                <Button variant="outline" className="w-full">Sign In</Button>
              </Link>
              <Link href="/signup" className="block">
                <Button className="w-full bg-teal-600 hover:bg-teal-700">Start Free Trial</Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ══════════════ HERO ══════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-teal-950 pt-32 pb-24 lg:pt-40 lg:pb-32">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-teal-500/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-teal-600/5 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 mb-8">
            <Zap className="w-4 h-4 text-teal-400" />
            <span className="text-sm font-medium text-teal-300">Get started in under 5 minutes</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white tracking-tight mb-6 max-w-5xl mx-auto leading-[1.1]">
            How{" "}
            <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
              SalonixPro
            </span>{" "}
            Works
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            From signup to your first appointment — here&rsquo;s everything you need to know to get your salon running on SalonixPro.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="bg-teal-500 hover:bg-teal-600 text-white h-14 px-8 text-lg shadow-xl shadow-teal-500/25 w-full sm:w-auto">
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/beta">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-teal-500/50 text-teal-300 hover:bg-teal-500/10 hover:text-teal-200 w-full sm:w-auto">
                Join the Beta
                <Sparkles className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════ JOIN THE BETA ══════════════ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-16">
            <p className="text-sm font-semibold text-teal-600 uppercase tracking-wider mb-3">Option 1</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Join the Beta
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Get 30 days free — no credit card, no commitment.
            </p>
          </FadeIn>

          <div className="relative">
            <div className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-teal-200 via-teal-300 to-teal-200" />

            <div className="grid md:grid-cols-4 gap-10 md:gap-6">
              {betaSteps.map((s, i) => (
                <FadeIn key={s.number} delay={i * 150} className="text-center">
                  <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-white text-2xl font-bold mb-6 shadow-xl shadow-teal-500/25">
                    {s.number}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{s.title}</h3>
                  <p className="text-gray-600 leading-relaxed text-sm">{s.description}</p>
                </FadeIn>
              ))}
            </div>
          </div>

          <FadeIn className="text-center mt-12">
            <Link href="/beta">
              <Button size="lg" className="bg-teal-600 hover:bg-teal-700 text-white h-12 px-8 shadow-lg shadow-teal-600/25">
                Join the Beta
                <Sparkles className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* ══════════════ START A FREE TRIAL ══════════════ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-teal-50/30">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-16">
            <p className="text-sm font-semibold text-teal-600 uppercase tracking-wider mb-3">Option 2</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Start a Free Trial
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Sign up yourself and explore every feature for 14 days.
            </p>
          </FadeIn>

          <div className="relative">
            <div className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-teal-200 via-teal-300 to-teal-200" />

            <div className="grid md:grid-cols-4 gap-10 md:gap-6">
              {trialSteps.map((s, i) => (
                <FadeIn key={s.number} delay={i * 150} className="text-center">
                  <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-2xl font-bold mb-6 shadow-xl shadow-blue-500/25">
                    {s.number}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{s.title}</h3>
                  <p className="text-gray-600 leading-relaxed text-sm">{s.description}</p>
                </FadeIn>
              ))}
            </div>
          </div>

          <FadeIn className="text-center mt-12">
            <Link href="/signup">
              <Button size="lg" className="bg-teal-500 hover:bg-teal-600 text-white h-12 px-8 shadow-lg shadow-teal-500/25">
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* ══════════════ SET UP YOUR SALON ══════════════ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-16">
            <p className="text-sm font-semibold text-teal-600 uppercase tracking-wider mb-3">Getting Started</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Set Up Your Salon
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Five simple steps to get your salon running on SalonixPro.
            </p>
          </FadeIn>

          <div className="space-y-6 max-w-3xl mx-auto">
            {setupSteps.map((s, i) => (
              <FadeIn key={s.title} delay={i * 100}>
                <div className="group flex items-start gap-6 p-6 rounded-2xl border border-gray-100 bg-white hover:shadow-lg hover:shadow-gray-100/50 hover:-translate-y-0.5 transition-all duration-300">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/20 shrink-0 group-hover:scale-110 transition-transform">
                    <s.icon className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2.5 py-0.5 rounded-full">Step {i + 1}</span>
                      <h3 className="text-lg font-semibold text-gray-900">{s.title}</h3>
                    </div>
                    <p className="text-gray-600 leading-relaxed">{s.description}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ WHAT'S INCLUDED ══════════════ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="max-w-7xl mx-auto">
          <FadeIn className="text-center mb-16">
            <p className="text-sm font-semibold text-teal-400 uppercase tracking-wider mb-3">All-Inclusive</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              What&rsquo;s Included
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Every plan includes every feature. No hidden fees, no feature tiers.
            </p>
          </FadeIn>

          <FadeIn>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-5xl mx-auto">
              {includedFeatures.map((f, i) => (
                <div key={f.label} className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 hover:border-slate-600 transition-all duration-200">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shrink-0">
                    <f.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-medium text-slate-200">{f.label}</span>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ══════════════ PRICING ══════════════ */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <FadeIn className="text-center mb-16">
            <p className="text-sm font-semibold text-teal-600 uppercase tracking-wider mb-3">Pricing</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-gray-600">Every plan includes every feature. Pick what works for you.</p>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Monthly */}
            <FadeIn delay={0}>
              <div className="relative p-8 rounded-3xl border border-gray-200 bg-white hover:shadow-xl transition-shadow duration-300 h-full flex flex-col">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Monthly</h3>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-5xl font-bold text-gray-900">$12</span>
                  <span className="text-gray-500">USD/mo</span>
                </div>
                <p className="text-sm text-gray-500 mb-6">Billed monthly</p>
                <ul className="space-y-3 mb-8 flex-1">
                  {["All features included", "Unlimited clients & staff", "Online booking page", "Email notifications", "Cancel anytime"].map((f) => (
                    <li key={f} className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-teal-600" />
                      </div>
                      <span className="text-sm text-gray-700">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className="block">
                  <Button variant="outline" className="w-full h-12 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold">
                    Start Free Trial
                  </Button>
                </Link>
              </div>
            </FadeIn>

            {/* Yearly — highlighted */}
            <FadeIn delay={100}>
              <div className="relative p-8 rounded-3xl bg-gradient-to-b from-teal-600 to-emerald-700 text-white shadow-2xl shadow-teal-600/20 h-full flex flex-col">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold shadow-lg">
                    <Zap className="w-3.5 h-3.5" />
                    Save $44/year
                  </span>
                </div>
                <h3 className="text-lg font-bold mb-2 pt-2">Yearly</h3>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-5xl font-bold">$100</span>
                  <span className="text-teal-200">USD/yr</span>
                </div>
                <p className="text-sm text-teal-200 mb-6">~$8.33/month</p>
                <ul className="space-y-3 mb-8 flex-1">
                  {["All features included", "Unlimited clients & staff", "Online booking page", "Email notifications", "Best value — save $44"].map((f) => (
                    <li key={f} className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm text-teal-50">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className="block">
                  <Button className="w-full h-12 bg-white text-teal-700 hover:bg-white/90 font-bold shadow-lg">
                    Start Free Trial
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </FadeIn>

            {/* Beta */}
            <FadeIn delay={200}>
              <div className="relative p-8 rounded-3xl border border-gray-200 bg-white hover:shadow-xl transition-shadow duration-300 h-full flex flex-col">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-semibold shadow-lg">
                    <Sparkles className="w-3.5 h-3.5" />
                    Limited Time
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 pt-2">Beta</h3>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-5xl font-bold text-gray-900">Free</span>
                </div>
                <p className="text-sm text-gray-500 mb-6">1 month, no card required</p>
                <ul className="space-y-3 mb-8 flex-1">
                  {["All features included", "Unlimited clients & staff", "Online booking page", "Email notifications", "30 days free access"].map((f) => (
                    <li key={f} className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-teal-600" />
                      </div>
                      <span className="text-sm text-gray-700">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/beta" className="block">
                  <Button variant="outline" className="w-full h-12 border-violet-300 text-violet-700 hover:bg-violet-50 font-semibold">
                    Join the Beta
                    <Sparkles className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ══════════════ FAQ ══════════════ */}
      <section id="faq" className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <FadeIn className="text-center mb-14">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-100 mb-4">
              <HelpCircle className="w-7 h-7 text-teal-600" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600">Everything you need to know about getting started</p>
          </FadeIn>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <FadeIn key={i} delay={i * 50}>
                <div className={`rounded-2xl border overflow-hidden transition-all duration-200 ${
                  openFaq === i ? "border-teal-300 shadow-md shadow-teal-100/50 bg-white" : "border-gray-200 bg-white"
                }`}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50/50 transition-colors"
                  >
                    <span className="font-medium text-gray-900 pr-4">{faq.q}</span>
                    <ChevronDown className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${
                      openFaq === i ? "rotate-180 text-teal-600" : ""
                    }`} />
                  </button>
                  <div className={`overflow-hidden transition-all duration-200 ${
                    openFaq === i ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
                  }`}>
                    <div className="px-5 pb-5">
                      <p className="text-gray-600 leading-relaxed">{faq.a}</p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ FINAL CTA ══════════════ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-950 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-[400px] h-[400px] rounded-full bg-teal-500/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-[300px] h-[300px] rounded-full bg-emerald-500/10 blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <FadeIn>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
              Ready to get started?
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10">
              Join salon owners across the Caribbean who&rsquo;ve simplified their business with SalonixPro.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="bg-teal-500 hover:bg-teal-600 text-white h-14 px-8 text-lg shadow-xl shadow-teal-500/25">
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/beta">
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-teal-500/50 text-teal-300 hover:bg-teal-500/10 hover:text-teal-200">
                  Join the Beta
                  <Sparkles className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ══════════════ FOOTER ══════════════ */}
      <footer className="bg-slate-950 border-t border-slate-800 pt-16 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
                  <Scissors className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">SalonixPro</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xs mb-6">
                Professional salon management software built for Caribbean beauty businesses.
              </p>
              <div className="flex items-center gap-3">
                {[Twitter, Facebook, Instagram, Linkedin].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
                  >
                    <Icon className="w-4 h-4 text-slate-400" />
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Product</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="/#features" className="text-slate-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-slate-400 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">System Status</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Resources</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#faq" className="text-slate-400 hover:text-white transition-colors">FAQ</a></li>
                <li><a href="mailto:support@salonixpro.com" className="text-slate-400 hover:text-white transition-colors">Contact</a></li>
                <li><span className="text-slate-500">support@salonixpro.com</span></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Legal</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 text-center">
            <p className="text-sm text-slate-500">
              &copy; {new Date().getFullYear()} SalonixPro. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
