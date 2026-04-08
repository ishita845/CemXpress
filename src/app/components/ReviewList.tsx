import React from "react";
import { Star, User } from "lucide-react";
import { Review } from "../types";

interface ReviewListProps {
  reviews: Review[];
  showMaterialName?: boolean;
}

export default function ReviewList({ reviews, showMaterialName = false }: ReviewListProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300 dark:text-gray-600"
            }`}
          />
        ))}
      </div>
    );
  };

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 px-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
          <Star className="w-6 h-6 text-gray-400 dark:text-gray-500" />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">No reviews yet</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Be the first to leave a review!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div
          key={review.id}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/60 rounded-xl p-5"
        >
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {review.buyerName}
                  </p>
                  {showMaterialName && review.materialName && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {review.materialName}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {renderStars(review.rating)}
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {review.rating}.0
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatDate(review.createdAt)}
                {review.updatedAt && review.updatedAt !== review.createdAt && (
                  <span className="ml-1">(edited)</span>
                )}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {review.comment}
          </p>
        </div>
      ))}
    </div>
  );
}
