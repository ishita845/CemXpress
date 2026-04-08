import React, { useState } from "react";
import {
  X,
  ShoppingCart,
  Package,
  AlertTriangle,
  CheckCircle,
  Wallet,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  Material,
  Shop,
  getAllShops,
  updateMaterial,
  createEnquiry,
} from "../services/firebaseService";
import { toast } from "sonner";

interface PurchaseModalProps {
  material: Material;
  onClose: () => void;
  onSuccess: () => void;
}

export function PurchaseModal({ material, onClose, onSuccess }: PurchaseModalProps) {
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(material.minOrder);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "online">("cod");
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loadingShop, setLoadingShop] = useState(true);

  React.useEffect(() => {
    getAllShops().then((shops) => {
      const found = shops.find((s) => s.id === material.shopId) || null;
      setShop(found);
      setLoadingShop(false);
    });
  }, [material.shopId]);

  if (!user || loadingShop || !shop) return null;

  const discountedPrice = material.discount
    ? material.price * (1 - material.discount / 100)
    : material.price;

  const totalAmount = discountedPrice * quantity;
  const canPurchase =
    quantity >= material.minOrder && quantity <= material.stockQty && material.inStock;

  const handlePurchase = async () => {
    if (!canPurchase) return;
    setIsProcessing(true);

    try {
      await createEnquiry({
        buyerId: user.id,
        buyerName: user.name,
        buyerPhone: user.phone || "",
        buyerEmail: user.email,
        shopId: shop.id,
        shopName: shop.name,
        sellerId: shop.sellerId,
        materialId: material.id,
        materialName: material.name,
        quantity: `${quantity} ${material.unit}`,
        paymentMethod,
        message: `Quick purchase request for ${quantity} ${material.unit} of ${material.name}. Total: INR ${totalAmount.toFixed(
          2,
        )}. Payment method: ${paymentMethod === "cod" ? "Cash on Delivery (COD)" : "Online Payment"}.`,
      });

      const newStockQty = material.stockQty - quantity;
      await updateMaterial(material.id, {
        stockQty: newStockQty,
        inStock: newStockQty > 0,
      });

      setSuccess(true);
      toast.success("Order placed successfully!");

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      toast.error("Failed to place order. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/60 rounded-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {success ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-gray-900 dark:text-gray-100 mb-2">Purchase Successful!</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Your order has been placed with {paymentMethod === "cod" ? "Cash on Delivery (COD)" : "Online Payment"}. The seller will contact you shortly.
            </p>
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/60 rounded-xl p-4">
              <p className="text-xs text-green-700 dark:text-green-400">
                <strong>Note:</strong> You can review this product once the seller accepts your enquiry.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-gray-900 dark:text-gray-100">Quick Purchase</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <img
                  src={material.image}
                  alt={material.name}
                  className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1 line-clamp-2">
                    {material.name}
                  </h4>
                  {material.brand && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{material.brand}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600 font-semibold">INR {discountedPrice.toFixed(0)}</span>
                    <span className="text-xs text-gray-400">/{material.unit}</span>
                    {material.discount && (
                      <span className="text-xs text-gray-400 line-through">INR {material.price}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/60 rounded-xl">
                <p className="text-xs text-blue-700 dark:text-blue-400 mb-1">Seller</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{shop.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{shop.phone}</p>
              </div>

              <div className="mb-6">
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                  Quantity <span className="text-gray-400">(Min: {material.minOrder})</span>
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(material.minOrder, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                    disabled={quantity <= material.minOrder}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || material.minOrder;
                      setQuantity(Math.max(material.minOrder, Math.min(material.stockQty, val)));
                    }}
                    className="flex-1 text-center border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    min={material.minOrder}
                    max={material.stockQty}
                  />
                  <button
                    onClick={() => setQuantity(Math.min(material.stockQty, quantity + 1))}
                    className="w-10 h-10 flex items-center justify-center border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                    disabled={quantity >= material.stockQty}
                  >
                    +
                  </button>
                  <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {material.unit.split(" ")[0]}s
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2 text-xs">
                  <Package className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-gray-500 dark:text-gray-400">
                    Available: <strong className="text-gray-700 dark:text-gray-300">{material.stockQty}</strong> units
                  </span>
                </div>
                {quantity > material.stockQty && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-red-600">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Quantity exceeds available stock</span>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Price per unit</span>
                  <span className="text-gray-900 dark:text-gray-100">INR {discountedPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Quantity</span>
                  <span className="text-gray-900 dark:text-gray-100">
                    {quantity} {material.unit.split(" ")[0]}s
                  </span>
                </div>
                {material.discount && (
                  <div className="flex justify-between text-sm mb-2 text-green-600">
                    <span>Discount ({material.discount}%)</span>
                    <span>-INR {(material.price * quantity - totalAmount).toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-900 dark:text-gray-100">Total Amount</span>
                  <span className="text-xl font-bold text-blue-600">INR {totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                  Payment Method
                </label>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cod")}
                  className={`w-full flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${
                    paymentMethod === "cod"
                      ? "border-blue-400 bg-blue-50 dark:bg-blue-900/30"
                      : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <span className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100">
                    <Wallet className="w-4 h-4 text-blue-500" />
                    Cash on Delivery (COD)
                  </span>
                  {paymentMethod === "cod" && (
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-500 text-white">Selected</span>
                  )}
                </button>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/60 rounded-xl p-3 mb-6">
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  <strong>Note:</strong> COD is currently enabled for quick purchase orders. The seller can confirm delivery and final payable amount with you.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePurchase}
                  disabled={!canPurchase || isProcessing}
                  className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl text-sm hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4" />
                      Place Order
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
