import React, { useState, useEffect } from "react";
import { Star, CheckCircle, AlertTriangle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  getReviewsForShop,
  saveReview,
  getEnquiriesForBuyer,
  Review,
} from "../services/firebaseService";
import { toast } from "sonner";

interface ReviewSectionProps {
  materialId: string;
  materialName: string;
  shopId: string;
}

export function ReviewSection({ materialId, materialName, shopId }: ReviewSectionProps) {
  const { user } = useAuth();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [acceptedEnquiryId, setAcceptedEnquiryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    const loadData = async () => {
      const [shopReviews, buyerEnquiries] = await Promise.all([
        getReviewsForShop(shopId),
        getEnquiriesForBuyer(user.id),
      ]);
      // Only show reviews for this material
      setReviews(shopReviews.filter((r) => !materialId || r.enquiryId));
      // Gate: buyer must have an accepted enquiry for this shop/material
      const eligible = buyerEnquiries.find(
        (e) =>
          e.shopId === shopId &&
          (e.materialId === materialId || !e.materialId) &&
          e.status === "accepted"
      );
      setAcceptedEnquiryId(eligible?.id || null);
      setLoading(false);
    };
    loadData();
  }, [user?.id, shopId, materialId]);

  const hasPurchased = !!acceptedEnquiryId;
  const userHasReviewed = reviews.some((r) => r.buyerId === user?.id);

  const handleSubmitReview = async () => {
    if (!hasPurchased || !acceptedEnquiryId) {
      toast.error("You can only review after the seller accepts your enquiry");
      return;
    }
    if (userHasReviewed) {
      toast.error("You have already reviewed this product");
      return;
    }
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    if (!comment.trim()) {
      toast.error("Please write a review comment");
      return;
    }

    setIsSubmitting(true);
    try {
      const newReview = await saveReview({
        buyerId: user?.id || "",
        buyerName: user?.name || "",
        shopId,
        enquiryId: acceptedEnquiryId,
        rating,
        comment: comment.trim(),
      });
      toast.success("Review submitted successfully!");
      setReviews((prev) => [newReview, ...prev]);
      setShowReviewForm(false);
      setRating(0);
      setComment("");
    } catch (error) {
      toast.error("Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700/60 p-6">
        <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700/60 p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-gray-900 dark:text-gray-100 mb-1">Reviews & Ratings</h3>
          {reviews.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.round(averageRating)
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300 dark:text-gray-600"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {averageRating.toFixed(1)} ({reviews.length}{" "}
                {reviews.length === 1 ? "review" : "reviews"})
              </span>
            </div>
          )}
        </div>
        {!userHasReviewed && (
          <button
            onClick={() => setShowReviewForm(!showReviewForm)}
            className={`px-4 py-2 text-sm rounded-xl transition-colors ${
              hasPurchased
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed"
            }`}
            disabled={!hasPurchased}
          >
            Write Review
          </button>
        )}
      </div>

      {!hasPurchased && (
        <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
              Enquiry acceptance required to review
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
              You can leave a review once the seller accepts your enquiry.
            </p>
          </div>
        </div>
      )}

      {userHasReviewed && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/60 rounded-xl flex items-start gap-2">
          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-green-700 dark:text-green-400">
            You have already reviewed this product.
          </p>
        </div>
      )}

      {showReviewForm && hasPurchased && !userHasReviewed && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
            Write Your Review
          </h4>
          <div className="mb-3">
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
              Rating *
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`w-6 h-6 transition-colors ${
                      star <= rating
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300 dark:text-gray-600 hover:text-yellow-200"
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                  {rating === 1 ? "Poor" : rating === 2 ? "Fair" : rating === 3 ? "Good" : rating === 4 ? "Very Good" : "Excellent"}
                </span>
              )}
            </div>
          </div>
          <div className="mb-3">
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
              Your Review *
            </label>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this product..."
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSubmitReview}
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Submit Review"}
            </button>
            <button
              onClick={() => {
                setShowReviewForm(false);
                setRating(0);
                setComment("");
              }}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="text-center py-8">
          <Star className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No reviews yet. Be the first to review!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="pb-4 border-b border-gray-100 dark:border-gray-800 last:border-0"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                    {review.buyerName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {review.buyerName}
                    </p>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < review.rating
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-gray-300 dark:text-gray-600"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {review.createdAt
                    ? new Date((review.createdAt as any).seconds * 1000).toLocaleDateString()
                    : ""}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 ml-10">{review.comment}</p>
              <div className="ml-10 mt-2 flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                <CheckCircle className="w-3 h-3" />
                <span>Verified Enquiry</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}