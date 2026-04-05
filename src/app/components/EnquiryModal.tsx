import React, { useState } from "react";
import { X, Send, Package, Store } from "lucide-react";
import { Material, Shop, createEnquiry } from "../services/firebaseService";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

interface EnquiryModalProps {
  material: Material;
  shop: Shop;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EnquiryModal({ material, shop, onClose, onSuccess }: EnquiryModalProps) {
  const { user } = useAuth();
  const [quantity, setQuantity] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please login to send enquiry");
      return;
    }

    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    setIsSubmitting(true);

    try {
      const buyerAddress = user.location
        ? `${user.location}${user.address?.state ? `, ${user.address.state}` : ""}${user.address?.pincode ? ` - ${user.address.pincode}` : ""}`
        : undefined;

      await createEnquiry({
        buyerId: user.id,
        buyerName: user.name,
        buyerPhone: user.phone || "",
        buyerEmail: user.email,
        buyerAddress,
        shopId: shop.id,
        shopName: shop.name,
        sellerId: shop.sellerId,
        materialId: material.id,
        materialName: material.name,
        quantity: quantity.trim() || undefined,
        message: message.trim(),
      });

      toast.success("Enquiry sent successfully!");
      if (onSuccess) {
        onSuccess();
      } else {
        onClose();
      }
    } catch (error) {
      toast.error("Failed to send enquiry");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full border border-gray-200 dark:border-gray-700 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-gray-900 dark:text-gray-100">Send Enquiry</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Material Info */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/40 rounded-lg">
                <Package className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">Material</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{material.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                <Store className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">Seller</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{shop.name}</p>
              </div>
            </div>
          </div>

          {/* Quantity Field */}
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
              Quantity <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={`e.g., 50 ${material.unit}`}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Min. order: {material.minOrder} {material.unit}
            </p>
          </div>

          {/* Message Field */}
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your requirements, delivery location, or any specific questions..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 resize-none"
            />
          </div>

          {/* Price Info */}
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/60 rounded-xl p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700 dark:text-gray-300">Price per {material.unit}</span>
              <span className="font-bold text-gray-900 dark:text-gray-100">₹{material.price.toLocaleString()}</span>
            </div>
            {material.discount && (
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                {material.discount}% discount available
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !message.trim()}
              className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                "Sending..."
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Enquiry
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}