// app/(public)/review/[token]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Scissors, Star, Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReviewData {
  businessName: string;
  businessLogo: string | null;
  stylistName: string;
  services: string[];
  date: string;
}

type PageState = "loading" | "active" | "expired" | "already_reviewed" | "success" | "error";

export default function PublicReviewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const token = params.token as string;
  const preselectedRating = Number(searchParams.get("rating")) || 0;

  const [state, setState] = useState<PageState>("loading");
  const [data, setData] = useState<ReviewData | null>(null);
  const [rating, setRating] = useState(preselectedRating >= 1 && preselectedRating <= 5 ? preselectedRating : 0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const validate = async () => {
      try {
        const res = await fetch(`/api/reviews/submit?token=${token}`);
        if (res.ok) {
          const reviewData = await res.json();
          setData(reviewData);
          setState("active");
        } else if (res.status === 410) {
          setState("expired");
        } else if (res.status === 409) {
          setState("already_reviewed");
        } else {
          setState("error");
        }
      } catch {
        setState("error");
      }
    };
    validate();
  }, [token]);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/reviews/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, rating, comment }),
      });
      if (res.ok) {
        setState("success");
      } else {
        const err = await res.json();
        if (res.status === 409) setState("already_reviewed");
        else if (res.status === 410) setState("expired");
        else alert(err.error || "Something went wrong");
      }
    } catch {
      alert("Failed to submit review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const ratingLabels = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <Scissors className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">SalonixPro</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          {state === "loading" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
              <p className="text-muted-foreground">Loading...</p>
            </div>
          )}

          {state === "expired" && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                <Clock className="w-8 h-8 text-amber-600" />
              </div>
              <h2 className="text-xl font-semibold">Link Expired</h2>
              <p className="text-muted-foreground">This review link has expired. Review links are valid for 7 days after your appointment.</p>
            </div>
          )}

          {state === "already_reviewed" && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-teal-600" />
              </div>
              <h2 className="text-xl font-semibold">Already Reviewed</h2>
              <p className="text-muted-foreground">You&apos;ve already submitted a review. Thank you for your feedback!</p>
            </div>
          )}

          {state === "error" && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold">Invalid Link</h2>
              <p className="text-muted-foreground">This review link is invalid or no longer available.</p>
            </div>
          )}

          {state === "success" && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-teal-600" />
              </div>
              <h2 className="text-xl font-semibold">Thank You!</h2>
              <p className="text-muted-foreground">Your review has been submitted. We appreciate your feedback!</p>
            </div>
          )}

          {state === "active" && data && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-1">How was your visit?</h2>
                <p className="text-muted-foreground text-sm">
                  at <strong>{data.businessName}</strong>
                </p>
              </div>

              {/* Appointment details */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Services</span>
                  <span className="font-medium text-right">{data.services.join(", ")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stylist</span>
                  <span className="font-medium">{data.stylistName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">
                    {new Date(data.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>

              {/* Star Rating */}
              <div className="text-center">
                <div className="flex justify-center gap-2 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      onClick={() => setRating(star)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-10 h-10 ${
                          star <= (hoveredStar || rating)
                            ? "fill-amber-400 text-amber-400"
                            : "text-gray-300"
                        } transition-colors`}
                      />
                    </button>
                  ))}
                </div>
                {(hoveredStar || rating) > 0 && (
                  <p className="text-sm font-medium text-amber-600">
                    {ratingLabels[hoveredStar || rating]}
                  </p>
                )}
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comments (optional)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us about your experience..."
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                />
                <p className="text-xs text-muted-foreground text-right mt-1">{comment.length}/500</p>
              </div>

              {/* Submit */}
              <Button
                onClick={handleSubmit}
                disabled={rating === 0 || isSubmitting}
                className="w-full bg-teal-600 hover:bg-teal-700 py-6 text-base"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Submit Review"
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
