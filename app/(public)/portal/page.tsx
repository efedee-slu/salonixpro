"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Scissors, Mail, KeyRound, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

type Step = "email" | "verify";

export default function PortalLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [codeSent, setCodeSent] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/portal/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to send code");
        return;
      }

      setCodeSent(true);
      setStep("verify");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/portal/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: code.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Invalid code");
        return;
      }

      router.push("/portal/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setCode("");
    setError("");
    setLoading(true);

    try {
      await fetch("/api/portal/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      setError("");
      setCodeSent(true);
    } catch {
      setError("Failed to resend code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-600 to-teal-500 rounded-xl flex items-center justify-center">
              <Scissors className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">SalonixPro</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-800">Client Portal</h1>
          <p className="text-sm text-gray-500 mt-1">
            View your appointments, orders, and more
          </p>
        </div>

        {step === "email" && (
          <div>
              <Card>
                <CardContent className="p-6">
                  <form onSubmit={handleSendCode} className="space-y-4">
                    <div className="text-center mb-4">
                      <div className="w-14 h-14 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Mail className="w-7 h-7 text-teal-600" />
                      </div>
                      <p className="text-sm text-gray-600">
                        Enter the email address associated with your salon visits.
                        We&apos;ll send you a verification code.
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="email">Email address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoFocus
                      />
                    </div>

                    {error && (
                      <p className="text-sm text-red-600 text-center">{error}</p>
                    )}

                    <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700" disabled={loading}>
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Mail className="w-4 h-4 mr-2" />
                      )}
                      Send Verification Code
                    </Button>
                  </form>
                </CardContent>
              </Card>
          </div>
        )}

        {step === "verify" && (
          <div>
              <Card>
                <CardContent className="p-6">
                  <form onSubmit={handleVerifyCode} className="space-y-4">
                    <div className="text-center mb-4">
                      <div className="w-14 h-14 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <KeyRound className="w-7 h-7 text-teal-600" />
                      </div>
                      <p className="text-sm text-gray-600">
                        We sent a 6-digit code to <strong>{email}</strong>
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="code">Verification code</Label>
                      <Input
                        id="code"
                        type="text"
                        placeholder="123456"
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        maxLength={6}
                        className="text-center text-2xl tracking-widest font-mono"
                        required
                        autoFocus
                      />
                    </div>

                    {error && (
                      <p className="text-sm text-red-600 text-center">{error}</p>
                    )}

                    <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700" disabled={loading || code.length < 6}>
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <KeyRound className="w-4 h-4 mr-2" />
                      )}
                      Verify & Sign In
                    </Button>

                    <div className="flex items-center justify-between text-sm">
                      <button
                        type="button"
                        onClick={() => { setStep("email"); setError(""); setCode(""); }}
                        className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
                      >
                        <ArrowLeft className="w-3 h-3" />
                        Different email
                      </button>
                      <button
                        type="button"
                        onClick={handleResend}
                        className="text-teal-600 hover:text-teal-700 font-medium"
                        disabled={loading}
                      >
                        Resend code
                      </button>
                    </div>
                  </form>
                </CardContent>
              </Card>
          </div>
        )}
      </div>
    </div>
  );
}
