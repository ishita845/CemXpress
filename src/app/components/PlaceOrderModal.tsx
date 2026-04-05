import React, { useState } from "react";
import {
  X, Package, MapPin, Banknote, FileText, ShoppingCart,
  ChevronRight, Loader2, Truck, IndianRupee,
} from "lucide-react";
import { Enquiry } from "../services/firebaseService";

interface PlaceOrderModalProps {
  enquiry: Enquiry;
  onClose: () => void;
  onOrderPlaced: (orderId: string) => void;
}

// ── Minimal Order type (extend as per your firebaseService) ────────────────
export interface OrderPayload {
  enquiryId: string;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string;
  sellerId: string;
  shopId: string;
  shopName: string;
  materialId?: string;
  materialName?: string;
  quantity?: string;
  unitPrice?: number;
  totalAmount: number;
  deliveryAddress: string;
  notes: string;
  paymentMethod: "cod";
  status: "pending"; // order lifecycle status (not enquiry status)
  createdAt: any;
}

export default function PlaceOrderModal({ enquiry, onClose, onOrderPlaced }: PlaceOrderModalProps) {
  const [deliveryAddress, setDeliveryAddress] = useState(
    enquiry.buyerAddress || ""
  );
  const [notes, setNotes] = useState("");
  const [unitPrice, setUnitPrice] = useState<string>(enquiry.unitPrice ? String(enquiry.unitPrice) : "");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"form" | "confirm">("form");

  const qty = parseFloat(enquiry.quantity || "1") || 1;
  const price = parseFloat(unitPrice) || 0;
  const total = qty * price;

  const isValid = deliveryAddress.trim().length > 5 && price > 0;

  const handleProceed = () => {
    if (!isValid) return;
    setStep("confirm");
  };

  const handlePlaceOrder = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      // Dynamic import so this file compiles without direct import of firebaseService
      const { createOrder } = await import("../services/firebaseService");
      const payload: Omit<OrderPayload, "createdAt"> = {
        enquiryId: enquiry.id,
        buyerId: enquiry.buyerId,
        buyerName: enquiry.buyerName,
        buyerPhone: enquiry.buyerPhone,
        buyerEmail: enquiry.buyerEmail,
        sellerId: enquiry.sellerId,
        shopId: enquiry.shopId,
        shopName: enquiry.shopName,
        materialId: enquiry.materialId,
        materialName: enquiry.materialName,
        quantity: enquiry.quantity,
        unitPrice: price,
        totalAmount: total,
        deliveryAddress,
        notes,
        paymentMethod: "cod",
        status: "pending",
      };
      const orderId = await createOrder(payload);
      onOrderPlaced(orderId);
    } catch (err) {
      console.error("Order placement failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl border border-gray-200 dark:border-gray-700/60 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/40 rounded-xl">
              <ShoppingCart className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 dark:text-gray-100 text-lg">
                {step === "form" ? "Place Order" : "Confirm Order"}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {step === "form" ? "Cash on Delivery • Fill details below" : "Review your order before placing"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {step === "form" ? (
            <div className="space-y-5">
              {/* ── Order Summary Card ── */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-2xl p-5">
                <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5" /> Order Summary
                </h3>
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Shop</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{enquiry.shopName}</span>
                  </div>
                  {enquiry.materialName && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Material</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{enquiry.materialName}</span>
                    </div>
                  )}
                  {enquiry.quantity && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Quantity</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{enquiry.quantity}</span>
                    </div>
                  )}

                  {/* Unit Price Input */}
                  <div className="pt-2 border-t border-blue-200 dark:border-blue-800/40">
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                      Unit Price (₹) *
                    </label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="number"
                        min="1"
                        value={unitPrice}
                        onChange={(e) => setUnitPrice(e.target.value)}
                        placeholder="Enter price per unit"
                        className="w-full pl-9 pr-4 py-2.5 border border-blue-200 dark:border-blue-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                      />
                    </div>
                  </div>

                  {/* Total */}
                  {price > 0 && (
                    <div className="flex justify-between items-center pt-2 border-t border-blue-200 dark:border-blue-800/40">
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Total Amount</span>
                      <span className="text-xl font-black text-blue-700 dark:text-blue-300">₹{total.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* ── COD Badge ── */}
              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-2xl">
                <div className="p-2 bg-green-100 dark:bg-green-900/60 rounded-xl">
                  <Banknote className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-green-800 dark:text-green-200">Cash on Delivery (COD)</p>
                  <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">
                    Pay in cash when your order arrives. No advance payment needed.
                  </p>
                </div>
              </div>

              {/* ── Delivery Address ── */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-gray-400" /> Delivery Address *
                </label>
                <textarea
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Enter your complete delivery address including area, city, pincode..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
                />
              </div>

              {/* ── Notes ── */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-gray-400" /> Delivery Notes
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Call before delivery, Leave at gate..."
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              {/* ── CTA ── */}
              <button
                onClick={handleProceed}
                disabled={!isValid}
                className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:text-gray-400 text-white font-bold rounded-2xl transition-colors shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 text-base"
              >
                Review Order <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          ) : (
            /* ── CONFIRMATION STEP ── */
            <div className="space-y-5">
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/50 rounded-2xl p-5 space-y-3">
                <h3 className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wide">Order Breakdown</h3>
                <Row label="Shop" value={enquiry.shopName} />
                {enquiry.materialName && <Row label="Material" value={enquiry.materialName} />}
                {enquiry.quantity && <Row label="Quantity" value={enquiry.quantity} />}
                <Row label="Unit Price" value={`₹${parseFloat(unitPrice).toLocaleString("en-IN")}`} />
                <div className="pt-2 border-t border-orange-200 dark:border-orange-800/40 flex justify-between items-center">
                  <span className="font-bold text-gray-900 dark:text-gray-100">Total Payable (COD)</span>
                  <span className="text-2xl font-black text-orange-600 dark:text-orange-400">
                    ₹{total.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 space-y-3">
                <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5" /> Delivery Details
                </h3>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Address</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{deliveryAddress}</p>
                </div>
                {notes && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Note</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{notes}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 p-3.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40 rounded-xl">
                <Banknote className="w-4.5 h-4.5 text-green-600 dark:text-green-400 flex-shrink-0" />
                <p className="text-xs text-green-700 dark:text-green-400">
                  <strong>Cash on Delivery</strong> — Pay ₹{total.toLocaleString("en-IN")} when the order arrives.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep("form")}
                  className="flex-1 py-3.5 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="flex-1 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl transition-colors shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Placing…</>
                  ) : (
                    <><ShoppingCart className="w-4 h-4" /> Place Order</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{value}</span>
    </div>
  );
}