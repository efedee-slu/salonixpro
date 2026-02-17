"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Users,
  Sparkles,
  ShoppingBag,
  BarChart3,
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
  Cloud,
  HandHeart,
  Coins,
  Mail,
  UserCheck,
  Lock,
  MousePointerClick,
  Twitter,
  Facebook,
  Instagram,
  Linkedin,
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
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Why Us", href: "#why-us" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

const features = [
  { icon: Calendar, title: "Appointment Scheduling", description: "Smart calendar with stylist availability, conflict detection, and drag-and-drop rescheduling." },
  { icon: Users, title: "Client Management", description: "Complete client profiles with visit history, preferences, VIP status, and spending analytics." },
  { icon: Sparkles, title: "Service Catalog", description: "130+ pre-loaded Caribbean salon, barber, and nail services. Customize pricing and duration." },
  { icon: ShoppingBag, title: "Inventory & POS", description: "Stock tracking, low-stock alerts, product sales, and order management in one system." },
  { icon: BarChart3, title: "Financial Reports", description: "P&L statements, expense tracking, payroll management with commission calculations." },
  { icon: Globe, title: "Online Booking", description: "Your branded booking page where clients browse services and book appointments 24/7." },
];

const advancedFeatures = [
  { icon: UserCheck, title: "Customer Portal", description: "Clients view appointments and order history via secure email verification login." },
  { icon: Coins, title: "Multi-Currency", description: "XCD, TTD, BBD, JMD, USD, and more. Built for Caribbean businesses from day one." },
  { icon: Mail, title: "Email Notifications", description: "Automated booking confirmations, appointment reminders, and payment receipts." },
  { icon: Star, title: "Client Reviews & Ratings", description: "Build trust with verified client reviews displayed on your booking page." },
];

const steps = [
  { number: "1", title: "Create Your Account", description: "Sign up in under a minute. No credit card required to start your 14-day free trial." },
  { number: "2", title: "Set Up Your Salon", description: "Choose services from the catalog, add your team, set working hours. We guide every step." },
  { number: "3", title: "Start Booking", description: "Share your booking link. Accept appointments, manage clients, and track revenue instantly." },
];

const whyCards = [
  { icon: HandHeart, title: "Caribbean-Built", description: "Designed for our region — XCD currency, local services, Caribbean business workflows.", color: "from-teal-500 to-emerald-600" },
  { icon: Lock, title: "Secure & Private", description: "Role-based access control, encrypted data, and your business information stays protected.", color: "from-blue-500 to-indigo-600" },
  { icon: MousePointerClick, title: "Easy to Use", description: "Clean interface your staff can learn in minutes, not weeks. No training manual needed.", color: "from-amber-500 to-orange-600" },
  { icon: Cloud, title: "Cloud-Based", description: "Access your salon from anywhere — no installation, automatic updates, works on any device.", color: "from-purple-500 to-violet-600" },
];

const included = [
  "Unlimited Clients",
  "Unlimited Appointments",
  "Full Financial Suite",
  "Service Catalog (130+ services)",
  "Online Booking Page",
  "Reports & Analytics",
  "Team Management & Roles",
  "Customer Self-Service Portal",
  "Email Notifications",
  "Inventory Management",
];

const faqs = [
  { q: "How does the 14-day free trial work?", a: "You get full access to all features for 14 days. No credit card required to start. At the end of your trial, simply choose a plan to continue." },
  { q: "Can I cancel anytime?", a: "Yes! You can cancel your subscription at any time from your Settings page. No long-term contracts or cancellation fees." },
  { q: "How do I get my online booking link?", a: "Once you sign up, you'll get a unique booking page at salonixpro.com/book/your-salon-name. Share this link with clients via WhatsApp, Instagram, or your website." },
  { q: "Is my data secure?", a: "Absolutely. We use industry-standard encryption and secure servers. Your client data is private and never shared with third parties." },
  { q: "Can I add multiple staff members?", a: "Yes! Add unlimited staff accounts. Each stylist gets their own schedule, services, and login with role-based permissions." },
  { q: "Do I need to install anything?", a: "No installation needed. SalonixPro works in your web browser on any device — computer, tablet, or phone." },
  { q: "What currencies are supported?", a: "We support XCD, USD, TTD, BBD, JMD, GYD, and more. Currency is set during onboarding and displayed throughout the app." },
  { q: "What if I need help?", a: "We offer email support for all users. Just reach out and we'll help you get set up." },
];

/* ──────────────────── component ──────────────────── */
export default function LandingPage() {
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
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/25">
                <Scissors className="w-5 h-5 text-white" />
              </div>
              <span className={`text-xl font-bold transition-colors ${scrolled ? "text-gray-900" : "text-white"}`}>
                SalonixPro
              </span>
            </div>

            {/* Desktop Links */}
            <div className="hidden lg:flex items-center gap-8">
              {navLinks.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className={`text-sm font-medium transition-colors hover:text-teal-500 ${
                    scrolled ? "text-gray-600" : "text-white/80 hover:text-white"
                  }`}
                >
                  {l.label}
                </a>
              ))}
            </div>

            {/* Desktop CTA */}
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

            {/* Mobile Toggle */}
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

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b shadow-lg px-4 py-5 space-y-3">
            {navLinks.map((l) => (
              <a
                key={l.href}
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
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-teal-500/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-teal-600/5 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 mb-8">
            <Zap className="w-4 h-4 text-teal-400" />
            <span className="text-sm font-medium text-teal-300">14-day free trial &middot; No credit card required</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white tracking-tight mb-6 max-w-5xl mx-auto leading-[1.1]">
            Everything your salon needs.{" "}
            <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
              One platform.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            The all-in-one management system for Caribbean salons, barbershops, and nail studios.
            Appointments, clients, inventory, and finances — finally organised.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
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

          <p className="text-sm text-slate-500">
            Trusted by salon owners across the Caribbean
          </p>
        </div>
      </section>

      {/* ══════════════ FEATURES GRID ══════════════ */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <FadeIn className="text-center mb-16">
            <p className="text-sm font-semibold text-teal-600 uppercase tracking-wider mb-3">Core Features</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Everything your practice needs
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Built specifically for salons and barbershops. No bloat, no complexity, no learning curve.
            </p>
          </FadeIn>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <FadeIn key={f.title} delay={i * 100}>
                <div className="group relative p-8 rounded-2xl border border-gray-100 bg-white hover:shadow-xl hover:shadow-gray-100/50 hover:-translate-y-1 transition-all duration-300">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <f.icon className="w-7 h-7 text-teal-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{f.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ ADVANCED FEATURES ══════════════ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-teal-50/30">
        <div className="max-w-7xl mx-auto">
          <FadeIn className="text-center mb-16">
            <p className="text-sm font-semibold text-teal-600 uppercase tracking-wider mb-3">And More</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Built for the way you work
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Advanced features that set SalonixPro apart from generic booking tools.
            </p>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-8">
            {advancedFeatures.map((f, i) => (
              <FadeIn key={f.title} delay={i * 100}>
                <div className="relative p-8 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-teal-600 flex items-center justify-center mb-5">
                    <f.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{f.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ HOW IT WORKS ══════════════ */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-20">
            <p className="text-sm font-semibold text-teal-600 uppercase tracking-wider mb-3">Getting Started</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Up and running in minutes
            </h2>
            <p className="text-lg text-gray-600">No complicated setup. No training required.</p>
          </FadeIn>

          <div className="relative">
            {/* Connecting line (desktop) */}
            <div className="hidden md:block absolute top-10 left-[16.67%] right-[16.67%] h-0.5 bg-gradient-to-r from-teal-200 via-teal-300 to-teal-200" />

            <div className="grid md:grid-cols-3 gap-12 md:gap-8">
              {steps.map((s, i) => (
                <FadeIn key={s.number} delay={i * 200} className="text-center">
                  <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-white text-2xl font-bold mb-6 shadow-xl shadow-teal-500/25">
                    {s.number}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{s.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{s.description}</p>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ WHY US ══════════════ */}
      <section id="why-us" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="max-w-7xl mx-auto">
          <FadeIn className="text-center mb-16">
            <p className="text-sm font-semibold text-teal-400 uppercase tracking-wider mb-3">Why SalonixPro</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Why Caribbean salons choose us
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Purpose-built for the way beauty businesses operate in the Caribbean.
            </p>
          </FadeIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyCards.map((c, i) => (
              <FadeIn key={c.title} delay={i * 100}>
                <div className="group p-8 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 hover:border-slate-600 transition-all duration-300 h-full">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${c.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-lg`}>
                    <c.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{c.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{c.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ EVERYTHING INCLUDED ══════════════ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <FadeIn className="text-center mb-16">
            <p className="text-sm font-semibold text-teal-600 uppercase tracking-wider mb-3">All-Inclusive</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Everything included. One price.
            </h2>
            <p className="text-lg text-gray-600">
              No hidden fees, no feature tiers, no per-user charges.
            </p>
          </FadeIn>

          <FadeIn>
            <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {included.map((item) => (
                <div key={item} className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-teal-600" />
                  </div>
                  <span className="text-gray-800 font-medium">{item}</span>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ══════════════ PRICING ══════════════ */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-950 to-teal-950">
        <div className="max-w-7xl mx-auto">
          <FadeIn className="text-center mb-16">
            <p className="text-sm font-semibold text-teal-400 uppercase tracking-wider mb-3">Pricing</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-slate-400">One plan. All features. No surprises.</p>
          </FadeIn>

          <FadeIn className="max-w-lg mx-auto">
            <div className="relative p-10 rounded-3xl bg-white shadow-2xl">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold shadow-lg">
                  <Zap className="w-3.5 h-3.5" />
                  Introductory Price
                </span>
              </div>

              <div className="text-center mb-8 pt-4">
                <div className="flex items-baseline justify-center gap-1 mb-2">
                  <span className="text-6xl font-bold text-gray-900">$12</span>
                  <span className="text-xl text-gray-500">USD/mo</span>
                </div>
                <p className="text-sm text-gray-500">
                  Or <span className="font-semibold text-teal-600">$100/year</span> (save $44)
                </p>
              </div>

              <ul className="space-y-4 mb-8">
                {[
                  "Unlimited appointments",
                  "Unlimited clients & staff",
                  "Online booking page",
                  "Point of sale & inventory",
                  "Reports & analytics",
                  "Customer portal",
                  "Email notifications",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-teal-600" />
                    </div>
                    <span className="text-gray-700">{f}</span>
                  </li>
                ))}
              </ul>

              <Link href="/signup" className="block">
                <Button className="w-full h-14 bg-teal-600 hover:bg-teal-700 text-lg shadow-lg shadow-teal-600/25">
                  Start 14-Day Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>

              <p className="text-center text-sm text-gray-500 mt-4">
                No credit card required &middot; Cancel anytime
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ══════════════ TESTIMONIAL ══════════════ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <FadeIn className="text-center">
            <div className="flex justify-center gap-1 mb-8">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <blockquote className="text-2xl sm:text-3xl font-medium text-gray-900 leading-relaxed mb-8">
              &ldquo;SalonixPro transformed how we run our salon. Scheduling, inventory, reports &mdash;
              it&rsquo;s all in one place. My team picked it up in a day.&rdquo;
            </blockquote>
            <p className="text-gray-500 font-medium">&mdash; SalonixPro Beta User</p>
          </FadeIn>
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
            <p className="text-lg text-gray-600">Everything you need to know about SalonixPro</p>
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
              Ready to modernize your salon?
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10">
              Join salon owners across the Caribbean who&rsquo;ve simplified their business with SalonixPro.
              Start your 14-day free trial today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="bg-teal-500 hover:bg-teal-600 text-white h-14 px-8 text-lg shadow-xl shadow-teal-500/25">
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white">
                  Sign In
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
            {/* Brand */}
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

            {/* Product */}
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Product</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#features" className="text-slate-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-slate-400 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">System Status</a></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Resources</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#faq" className="text-slate-400 hover:text-white transition-colors">FAQ</a></li>
                <li><a href="mailto:support@salonixpro.com" className="text-slate-400 hover:text-white transition-colors">Contact</a></li>
                <li><span className="text-slate-500">support@salonixpro.com</span></li>
              </ul>
            </div>

            {/* Legal */}
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
