// app/(marketing)/page.tsx
"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Calendar,
  Users,
  Sparkles,
  ShoppingBag,
  BarChart3,
  Clock,
  Shield,
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

const features = [
  {
    icon: Calendar,
    title: "Online Booking",
    description: "Clients book 24/7 via your custom booking link. No more phone tag.",
  },
  {
    icon: Clock,
    title: "Appointment Calendar",
    description: "See your day, week, or month at a glance. Never double-book again.",
  },
  {
    icon: Users,
    title: "Client Management",
    description: "Track visit history, preferences, and contact info in one place.",
  },
  {
    icon: Sparkles,
    title: "Service Menu",
    description: "Organize services by category with pricing. Easy to update anytime.",
  },
  {
    icon: Shield,
    title: "Staff Scheduling",
    description: "Manage stylist availability, schedules, and workloads effortlessly.",
  },
  {
    icon: ShoppingBag,
    title: "Point of Sale",
    description: "Sell products, track inventory, process orders, print receipts.",
  },
  {
    icon: BarChart3,
    title: "Reports & Analytics",
    description: "Revenue trends, top services, busiest days. Know your numbers.",
  },
  {
    icon: Globe,
    title: "Your Booking Page",
    description: "A beautiful public page where clients can book appointments online.",
  },
];

const steps = [
  {
    number: "01",
    title: "Sign Up",
    description: "Create your account in under 2 minutes. No credit card required.",
  },
  {
    number: "02",
    title: "Set Up Your Salon",
    description: "Add your services, staff, and business hours. We guide you through it.",
  },
  {
    number: "03",
    title: "Start Booking",
    description: "Share your booking link. Clients book online. You stay in control.",
  },
];

const testimonials = [
  {
    quote: "Finally, software that understands how salons actually work. Simple, clean, and everything I need.",
    author: "Michelle T.",
    role: "Owner, Luxe Hair Studio",
    rating: 5,
  },
  {
    quote: "My clients love booking online. I love not answering the phone 50 times a day.",
    author: "Karen P.",
    role: "Owner, Glow Beauty Bar",
    rating: 5,
  },
  {
    quote: "The reports alone are worth it. I finally know which services make me money.",
    author: "David R.",
    role: "Owner, The Gentlemen's Room",
    rating: 5,
  },
];

const faqs = [
  {
    question: "How does the 14-day free trial work?",
    answer: "You get full access to all features for 14 days. No credit card required to start. At the end of your trial, simply choose a plan to continue.",
  },
  {
    question: "Can I cancel anytime?",
    answer: "Yes! You can cancel your subscription at any time from your Settings page. No long-term contracts or cancellation fees.",
  },
  {
    question: "How do I get my online booking link?",
    answer: "Once you sign up, you'll get a unique booking page at salonixpro.com/book/your-salon-name. Share this link with clients via WhatsApp, Instagram, or your website.",
  },
  {
    question: "Is my data secure?",
    answer: "Absolutely. We use industry-standard encryption and secure servers. Your client data is private and never shared with third parties.",
  },
  {
    question: "Can I add multiple staff members?",
    answer: "Yes! Add unlimited staff accounts. Each stylist can have their own schedule, services, and login.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit/debit cards and PayPal for your subscription payments.",
  },
  {
    question: "Do I need to install anything?",
    answer: "No installation needed. SalonixPro works in your web browser on any device - computer, tablet, or phone.",
  },
  {
    question: "Can I import my existing clients?",
    answer: "Yes, you can add clients manually or contact us for help importing from a spreadsheet.",
  },
  {
    question: "What if I need help?",
    answer: "We offer email support for all users. Just reach out and we'll help you get set up.",
  },
  {
    question: "Is there a contract or setup fee?",
    answer: "No contracts, no setup fees. Just simple monthly or yearly pricing. Cancel anytime.",
  },
];

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Redirect logged-in users to dashboard
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  // Show loading while checking auth
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Don't render if authenticated (will redirect)
  if (status === "authenticated") {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center">
                <Scissors className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">SalonixPro</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-gray-600 hover:text-gray-900">Features</a>
              <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900">Pricing</a>
              <a href="#testimonials" className="text-sm text-gray-600 hover:text-gray-900">Testimonials</a>
              <a href="#faq" className="text-sm text-gray-600 hover:text-gray-900">FAQ</a>
            </div>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-teal-600 hover:bg-teal-700">
                  Start Free Trial
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-white border-b px-4 py-4 space-y-4"
          >
            <a href="#features" className="block text-gray-600">Features</a>
            <a href="#pricing" className="block text-gray-600">Pricing</a>
            <a href="#testimonials" className="block text-gray-600">Testimonials</a>
            <a href="#faq" className="block text-gray-600">FAQ</a>
            <div className="pt-4 border-t space-y-2">
              <Link href="/login" className="block">
                <Button variant="outline" className="w-full">Sign In</Button>
              </Link>
              <Link href="/signup" className="block">
                <Button className="w-full bg-teal-600 hover:bg-teal-700">Start Free Trial</Button>
              </Link>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-4xl mx-auto"
          >
            <Badge className="mb-6 bg-teal-50 text-teal-700 hover:bg-teal-100">
              14-day free trial • No credit card required
            </Badge>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 tracking-tight mb-6">
              SalonixPro
            </h1>
            
            <p className="text-2xl sm:text-3xl text-gray-600 font-medium mb-8">
              One system. One salon. Total control.
            </p>
            
            <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-10">
              Appointments, clients, inventory, and operations — organised properly. 
              The salon management system built for owners who want simplicity without compromise.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="bg-teal-600 hover:bg-teal-700 h-14 px-8 text-lg">
                  Start Your Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg">
                  See Demo
                </Button>
              </Link>
            </div>

            <p className="mt-6 text-sm text-gray-400">
              Demo: username <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">admin</span> / password <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">Admin@123</span>
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Still managing your salon with paper, WhatsApp, and spreadsheets?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Missed appointments. Lost client info. No idea which services actually make you money. 
              There's a better way.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything you need. Nothing you don't.
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Built specifically for salons and barbershops. No bloat, no complexity, no learning curve.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center mb-4">
                      <feature.icon className="w-6 h-6 text-teal-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Up and running in minutes
            </h2>
            <p className="text-lg text-gray-600">
              No complicated setup. No training required.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="text-center"
              >
                <div className="text-6xl font-bold text-teal-100 mb-4">{step.number}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-gray-600">
              One plan. All features. No surprises.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-lg mx-auto"
          >
            <Card className="border-2 border-teal-600 shadow-xl">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <Badge className="mb-4 bg-amber-100 text-amber-700">
                    <Zap className="w-3 h-3 mr-1" />
                    Special Introductory Price
                  </Badge>
                  <div className="flex items-baseline justify-center gap-2 mb-2">
                    <span className="text-5xl font-bold text-gray-900">$12</span>
                    <span className="text-gray-600">USD/month</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Or <span className="font-semibold text-teal-600">$100/year</span> (save $44)
                  </p>
                </div>

                <ul className="space-y-4 mb-8">
                  {[
                    "Unlimited appointments",
                    "Unlimited clients",
                    "Unlimited staff accounts",
                    "Online booking page",
                    "Point of sale & inventory",
                    "Reports & analytics",
                    "Email support",
                  ].map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center">
                        <Check className="w-3 h-3 text-teal-600" />
                      </div>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href="/signup">
                  <Button className="w-full h-12 bg-teal-600 hover:bg-teal-700 text-lg">
                    Start 14-Day Free Trial
                  </Button>
                </Link>
                
                <p className="text-center text-sm text-gray-500 mt-4">
                  No credit card required • Cancel anytime
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Trusted by salon owners
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.author}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full border-0 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-gray-700 mb-6">"{testimonial.quote}"</p>
                    <div>
                      <p className="font-semibold text-gray-900">{testimonial.author}</p>
                      <p className="text-sm text-gray-500">{testimonial.role}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-teal-100 mb-4">
              <HelpCircle className="w-6 h-6 text-teal-600" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600">
              Everything you need to know about SalonixPro
            </p>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <div
                  className={`border rounded-xl overflow-hidden transition-all ${
                    openFaq === index ? "border-teal-300 shadow-md" : "border-gray-200"
                  }`}
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full flex items-center justify-between p-5 text-left bg-white hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-medium text-gray-900">{faq.question}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-gray-500 transition-transform ${
                        openFaq === index ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {openFaq === index && (
                    <div className="px-5 pb-5 bg-white">
                      <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-3xl p-12 text-center text-white"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to take control of your salon?
            </h2>
            <p className="text-teal-100 text-lg mb-8 max-w-2xl mx-auto">
              Join salon owners who've simplified their business with SalonixPro.
              Start your free trial today.
            </p>
            <Link href="/signup">
              <Button size="lg" className="bg-white text-teal-700 hover:bg-teal-50 h-14 px-8 text-lg">
                Start Your Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Logo & Tagline */}
            <div className="text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
                  <Scissors className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold text-white">SalonixPro</span>
              </div>
              <p className="text-sm">One system. One salon. Total control.</p>
            </div>

            {/* Links */}
            <div className="flex items-center gap-8 text-sm">
              <a href="#features" className="hover:text-white transition">Features</a>
              <a href="#pricing" className="hover:text-white transition">Pricing</a>
              <Link href="/login" className="hover:text-white transition">Sign In</Link>
              <Link href="/signup" className="hover:text-white transition">Sign Up</Link>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>© {new Date().getFullYear()} SalonixPro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
