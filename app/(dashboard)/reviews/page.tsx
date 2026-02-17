// app/(dashboard)/reviews/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Star,
  MessageSquare,
  Calendar,
  Reply,
  Flag,
  FlagOff,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Info,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  ownerReply: string | null;
  ownerRepliedAt: string | null;
  isPublic: boolean;
  isFlagged: boolean;
  createdAt: string;
  clientName: string;
  stylistName: string;
  services: string[];
}

interface Stats {
  averageRating: number;
  totalReviews: number;
  thisMonth: number;
  responseRate: number;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<Stats>({ averageRating: 0, totalReviews: 0, thisMonth: 0, responseRate: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { toast } = useToast();

  // Filters
  const [filterRating, setFilterRating] = useState("");
  const [filterResponded, setFilterResponded] = useState("");

  // Reply dialog
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [replyReviewId, setReplyReviewId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (filterRating) params.set("rating", filterRating);
      if (filterResponded) params.set("responded", filterResponded);

      const res = await fetch(`/api/reviews?${params}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews);
        setStats(data.stats);
        setTotalPages(data.pagination.totalPages);
      }
    } catch {
      toast({ title: "Error", description: "Failed to load reviews", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [page, filterRating, filterResponded]);

  const handleReply = async () => {
    if (!replyReviewId || !replyText.trim()) return;
    setIsReplying(true);
    try {
      const res = await fetch(`/api/reviews/${replyReviewId}/reply`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply: replyText }),
      });
      if (res.ok) {
        toast({ title: "Reply sent", description: "Your reply has been saved." });
        setReplyDialogOpen(false);
        setReplyText("");
        fetchReviews();
      } else {
        throw new Error();
      }
    } catch {
      toast({ title: "Error", description: "Failed to save reply", variant: "destructive" });
    } finally {
      setIsReplying(false);
    }
  };

  const handleFlag = async (reviewId: string) => {
    try {
      const res = await fetch(`/api/reviews/${reviewId}/flag`, { method: "PATCH" });
      if (res.ok) {
        const data = await res.json();
        setReviews((prev) =>
          prev.map((r) => (r.id === reviewId ? { ...r, isFlagged: data.isFlagged } : r))
        );
        toast({ title: data.isFlagged ? "Review flagged" : "Review unflagged" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to update flag", variant: "destructive" });
    }
  };

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-4 h-4 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
        <p className="text-muted-foreground">Manage client reviews and feedback</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <TooltipProvider>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Average Rating</span>
                <Tooltip>
                  <TooltipTrigger><Info className="w-4 h-4 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent><p className="text-xs">Average of all submitted ratings</p></TooltipContent>
                </Tooltip>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                <span className="text-2xl font-bold">{stats.averageRating || "—"}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Total Reviews</span>
                <MessageSquare className="w-4 h-4 text-muted-foreground" />
              </div>
              <span className="text-2xl font-bold">{stats.totalReviews}</span>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">This Month</span>
                <Calendar className="w-4 h-4 text-muted-foreground" />
              </div>
              <span className="text-2xl font-bold">{stats.thisMonth}</span>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Response Rate</span>
                <Tooltip>
                  <TooltipTrigger><Info className="w-4 h-4 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent><p className="text-xs">Percentage of reviews you&apos;ve replied to</p></TooltipContent>
                </Tooltip>
              </div>
              <span className="text-2xl font-bold">{stats.responseRate}%</span>
            </CardContent>
          </Card>
        </TooltipProvider>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterRating}
          onChange={(e) => { setFilterRating(e.target.value); setPage(1); }}
          className="px-3 py-2 border rounded-lg text-sm bg-white"
        >
          <option value="">All Ratings</option>
          {[5, 4, 3, 2, 1].map((r) => (
            <option key={r} value={r}>{r} Star{r !== 1 ? "s" : ""}</option>
          ))}
        </select>

        <select
          value={filterResponded}
          onChange={(e) => { setFilterResponded(e.target.value); setPage(1); }}
          className="px-3 py-2 border rounded-lg text-sm bg-white"
        >
          <option value="">All Reviews</option>
          <option value="true">Responded</option>
          <option value="false">Unresponded</option>
        </select>
      </div>

      {/* Reviews List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      ) : reviews.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-1">No reviews yet</h3>
            <p className="text-sm text-muted-foreground">Reviews will appear here after clients rate their appointments.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className={review.isFlagged ? "border-red-200 bg-red-50/30" : ""}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-gray-900">{review.clientName}</span>
                        {renderStars(review.rating)}
                        {review.isFlagged && <Badge variant="destructive" className="text-xs">Flagged</Badge>}
                        {!review.isPublic && <Badge variant="secondary" className="text-xs">Hidden</Badge>}
                      </div>

                      {review.comment && (
                        <p className="text-sm text-gray-700 mb-2">{review.comment}</p>
                      )}

                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{review.services.join(", ")}</span>
                        <span>&middot;</span>
                        <span>{review.stylistName}</span>
                        <span>&middot;</span>
                        <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                      </div>

                      {/* Owner Reply */}
                      {review.ownerReply && (
                        <div className="mt-3 pl-4 border-l-2 border-teal-200">
                          <p className="text-sm text-gray-700">{review.ownerReply}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Owner reply &middot; {new Date(review.ownerRepliedAt!).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setReplyReviewId(review.id);
                          setReplyText(review.ownerReply || "");
                          setReplyDialogOpen(true);
                        }}
                        title={review.ownerReply ? "Edit reply" : "Reply"}
                      >
                        <Reply className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFlag(review.id)}
                        title={review.isFlagged ? "Unflag" : "Flag"}
                      >
                        {review.isFlagged ? (
                          <FlagOff className="w-4 h-4 text-red-500" />
                        ) : (
                          <Flag className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reply to Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write your reply..."
              rows={4}
              maxLength={500}
              className="w-full px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setReplyDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={handleReply}
                disabled={!replyText.trim() || isReplying}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {isReplying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Reply"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
