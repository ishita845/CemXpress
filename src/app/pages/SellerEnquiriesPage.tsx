import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import {
  ArrowLeft, MessageCircle, Clock, CheckCircle, XCircle,
  Package, User, Phone, Mail, MapPin, X, Banknote,
  Truck, FileText, ChevronDown, ChevronUp, Store,
} from "lucide-react";
import { toast } from "sonner";
import {
  getEnquiriesForSeller,
  updateEnquiryStatus,
  Enquiry,
} from "../services/firebaseService";

export default function SellerEnquiriesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "accepted" | "rejected">("all");
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    const loadData = async () => {
      try {
        const data = await getEnquiriesForSeller(user.id);
        setEnquiries(data);
      } catch (err) {
        console.error("Failed to load enquiries:", err);
        toast.error("Failed to load enquiries");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user?.id]);

  const handleStatusUpdate = async (enquiryId: string, status: "accepted" | "rejected" | "pending") => {
    try {
      await updateEnquiryStatus(enquiryId, status);
      setEnquiries((prev) =>
        prev.map((e) => (e.id === enquiryId ? { ...e, status } : e))
      );
      setSelectedEnquiry((prev) => (prev?.id === enquiryId ? { ...prev, status } : prev));
      const msgs = {
        accepted: "Order accepted! Buyer will be notified.",
        rejected: "Enquiry rejected.",
        pending: "Moved back to pending.",
      };
      toast.success(msgs[status]);
    } catch (err) {
      toast.error("Failed to update enquiry status");
    }
  };

  const filteredEnquiries = filter === "all" ? enquiries : enquiries.filter((e) => e.status === filter);
  const getStatusCount = (s: string) =>
    s === "all" ? enquiries.length : enquiries.filter((e) => e.status === s).length;

  const formatDate = (ts: any) => {
    if (!ts) return "";
    const date = ts?.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    return date.toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const isCODOrder = (message: string) => message.startsWith("COD Order:");

  const extractCODAmount = (message: string): string | null => {
    const match = message.match(/Total Payable on Delivery: ₹([\d,]+\.?\d*)/);
    return match ? match[1] : null;
  };

  const extractDeliveryAddress = (message: string): string | null => {
    const match = message.match(/Delivery Address: ([^\n]+)/);
    return match ? match[1] : null;
  };

  const extractDeliveryNote = (message: string): string | null => {
    const match = message.match(/Delivery Note: ([^\n]+)/);
    return match ? match[1] : null;
  };

  const pendingCount = enquiries.filter((e) => e.status === "pending").length;
  const codTotal = enquiries
    .filter((e) => e.status === "accepted" && isCODOrder(e.message))
    .reduce((sum, e) => {
      const amt = extractCODAmount(e.message);
      return sum + (amt ? parseFloat(amt.replace(/,/g, "")) : 0);
    }, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">Loading enquiries…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* ── HEADER ── */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700/60 px-4 sm:px-6 lg:px-8 py-5 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/seller/dashboard")}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-gray-900 dark:text-gray-100 font-bold">Customer Orders</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage COD orders and enquiries</p>
              </div>
            </div>
            {/* New orders badge */}
            {pendingCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white rounded-full text-sm font-semibold animate-pulse">
                <span className="w-2 h-2 bg-white rounded-full" />
                {pendingCount} New
              </div>
            )}
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 flex-wrap">
            {([
              { v: "all",      l: "All Orders" },
              { v: "pending",  l: "New" },
              { v: "accepted", l: "Accepted" },
              { v: "rejected", l: "Rejected" },
            ] as const).map(({ v, l }) => (
              <button
                key={v}
                onClick={() => setFilter(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  filter === v
                    ? "bg-blue-500 text-white"
                    : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-300"
                }`}
              >
                {l}
                {getStatusCount(v) > 0 && (
                  <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold ${
                    filter === v ? "bg-white/25 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                  }`}>
                    {getStatusCount(v)}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* ── COD earnings banner ── */}
        {codTotal > 0 && (
          <div className="mb-5 flex items-center gap-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-xl">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center flex-shrink-0">
              <Banknote className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-green-900 dark:text-green-200">
                ₹{codTotal.toLocaleString("en-IN")} pending COD collection
              </p>
              <p className="text-xs text-green-700 dark:text-green-400">
                Collect cash from buyer upon delivery of accepted orders.
              </p>
            </div>
          </div>
        )}

        {filteredEnquiries.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/60 rounded-2xl p-12 text-center">
            <MessageCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-gray-900 dark:text-gray-100 font-bold mb-2">No Orders</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">No orders matching this filter yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEnquiries.map((enquiry) => {
              const isCOD = isCODOrder(enquiry.message);
              const codAmount = extractCODAmount(enquiry.message);
              const deliveryAddr = extractDeliveryAddress(enquiry.message);
              const deliveryNote = extractDeliveryNote(enquiry.message);
              const isExpanded = expandedId === enquiry.id;
              const isNew = enquiry.status === "pending";

              return (
                <div
                  key={enquiry.id}
                  className={`bg-white dark:bg-gray-900 border rounded-2xl overflow-hidden transition-colors ${
                    isNew
                      ? "border-blue-200 dark:border-blue-800/60"
                      : enquiry.status === "accepted"
                      ? "border-green-200 dark:border-green-800/40"
                      : "border-gray-200 dark:border-gray-700/60"
                  }`}
                >
                  {/* Top accent */}
                  {(isNew || isCOD) && (
                    <div className={`h-1 w-full ${
                      isNew
                        ? "bg-gradient-to-r from-blue-400 to-blue-500"
                        : "bg-gradient-to-r from-green-400 to-emerald-400"
                    }`} />
                  )}

                  <div className="p-5 sm:p-6">
                    {/* Top row: buyer info + status */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-11 h-11 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                          {enquiry.buyerName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <h3 className="font-bold text-gray-900 dark:text-gray-100">{enquiry.buyerName}</h3>
                            {isNew && (
                              <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-[11px] font-bold rounded-full">
                                NEW
                              </span>
                            )}
                          </div>
                          <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />{enquiry.buyerPhone}
                            </span>
                            <span className="flex items-center gap-1 truncate">
                              <Mail className="w-3 h-3" />
                              <span className="truncate">{enquiry.buyerEmail}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      {/* Status badge */}
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        {enquiry.status === "accepted" && (
                          <span className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 font-semibold">
                            <CheckCircle className="w-3.5 h-3.5" /> Accepted
                          </span>
                        )}
                        {enquiry.status === "rejected" && (
                          <span className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-semibold">
                            <XCircle className="w-3.5 h-3.5" /> Rejected
                          </span>
                        )}
                        {enquiry.status === "pending" && (
                          <span className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-semibold">
                            <Clock className="w-3.5 h-3.5" /> New
                          </span>
                        )}
                        {isCOD && (
                          <span className="flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-full bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-semibold border border-green-200 dark:border-green-800/50">
                            <Banknote className="w-3 h-3" /> COD
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Material + COD amount */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {enquiry.materialName && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-medium">
                          <Package className="w-3.5 h-3.5" /> {enquiry.materialName}
                        </div>
                      )}
                      {enquiry.quantity && (
                        <div className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium">
                          Qty: {enquiry.quantity}
                        </div>
                      )}
                      {isCOD && codAmount && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-sm font-bold border border-green-200 dark:border-green-800/50">
                          <Banknote className="w-3.5 h-3.5" /> Collect ₹{codAmount} cash
                        </div>
                      )}
                    </div>

                    {/* Delivery address */}
                    {deliveryAddr && (
                      <div className="flex items-start gap-2 mb-3 px-3.5 py-2.5 bg-amber-50 dark:bg-amber-900/15 border border-amber-100 dark:border-amber-800/40 rounded-xl">
                        <MapPin className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-0.5">Delivery Address</p>
                          <p className="text-sm text-amber-900 dark:text-amber-200">{deliveryAddr}</p>
                          {deliveryNote && (
                            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">📝 {deliveryNote}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Buyer address from profile */}
                    {!deliveryAddr && enquiry.buyerAddress && (
                      <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="text-xs text-gray-600 dark:text-gray-400">{enquiry.buyerAddress}</span>
                      </div>
                    )}

                    {/* Message (collapsible) */}
                    <div className="mb-4">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : enquiry.id)}
                        className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors mb-2"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        {isExpanded ? "Hide" : "View"} full message
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                      {isExpanded && (
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3.5 border border-gray-100 dark:border-gray-700/50">
                          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{enquiry.message}</p>
                        </div>
                      )}
                    </div>

                    {/* Footer: timestamp + actions */}
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> {formatDate(enquiry.createdAt)}
                      </span>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => setSelectedEnquiry(enquiry)}
                          className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-lg text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          Full Details
                        </button>
                        {enquiry.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(enquiry.id, "rejected")}
                              className="px-4 py-2 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl text-sm font-semibold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(enquiry.id, "accepted")}
                              className="px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-bold hover:bg-green-600 transition-colors shadow-sm shadow-green-500/30"
                            >
                              Accept Order
                            </button>
                          </>
                        )}
                        {enquiry.status !== "pending" && (
                          <button
                            onClick={() => handleStatusUpdate(enquiry.id, "pending")}
                            className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 rounded-lg text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Accepted COD reminder for seller */}
                    {enquiry.status === "accepted" && isCOD && codAmount && (
                      <div className="mt-4 flex items-start gap-3 p-3.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-xl">
                        <Banknote className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <p className="font-bold text-green-800 dark:text-green-200">Collect ₹{codAmount} in cash on delivery</p>
                          <p className="text-green-700 dark:text-green-400 text-xs mt-0.5">
                            Buyer will pay after inspecting materials. Call{" "}
                            <strong>{enquiry.buyerPhone}</strong> to arrange delivery.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── FULL DETAILS MODAL ── */}
      {selectedEnquiry && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedEnquiry(null)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100">Order Details</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {formatDate(selectedEnquiry.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setSelectedEnquiry(null)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">

              {/* COD highlight */}
              {isCODOrder(selectedEnquiry.message) && extractCODAmount(selectedEnquiry.message) && (
                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Banknote className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="text-sm font-bold text-green-800 dark:text-green-200">Cash on Delivery</p>
                      <p className="text-xs text-green-700 dark:text-green-400">Collect from buyer at doorstep</p>
                    </div>
                  </div>
                  <p className="text-2xl font-black text-green-700 dark:text-green-300">
                    ₹{extractCODAmount(selectedEnquiry.message)}
                  </p>
                </div>
              )}

              {/* Buyer info */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Buyer Info</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2.5">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900 dark:text-gray-100">{selectedEnquiry.buyerName}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <a href={`tel:${selectedEnquiry.buyerPhone}`} className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
                      {selectedEnquiry.buyerPhone}
                    </a>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300 truncate">{selectedEnquiry.buyerEmail}</span>
                  </div>
                </div>
              </div>

              {/* Delivery address */}
              {(extractDeliveryAddress(selectedEnquiry.message) || selectedEnquiry.buyerAddress) && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-2">
                    <MapPin className="w-3.5 h-3.5 inline mr-1" />Delivery Address
                  </h4>
                  <p className="text-sm text-amber-900 dark:text-amber-200 font-medium">
                    {extractDeliveryAddress(selectedEnquiry.message) || selectedEnquiry.buyerAddress}
                  </p>
                  {extractDeliveryNote(selectedEnquiry.message) && (
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-2">
                      Note: {extractDeliveryNote(selectedEnquiry.message)}
                    </p>
                  )}
                </div>
              )}

              {/* Material */}
              {selectedEnquiry.materialName && (
                <div>
                  <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Material Ordered</h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="px-3 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-medium">
                      {selectedEnquiry.materialName}
                    </div>
                    {selectedEnquiry.quantity && (
                      <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm">
                        Qty: {selectedEnquiry.quantity}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Message */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Order Message</h4>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{selectedEnquiry.message}</p>
                </div>
              </div>

              {/* Actions */}
              {selectedEnquiry.status === "pending" && (
                <div className="flex gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <button
                    onClick={() => handleStatusUpdate(selectedEnquiry.id, "rejected")}
                    className="flex-1 py-3 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl text-sm font-semibold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(selectedEnquiry.id, "accepted")}
                    className="flex-1 py-3 bg-green-500 text-white rounded-xl text-sm font-bold hover:bg-green-600 transition-colors shadow-md shadow-green-500/25"
                  >
                    Accept Order
                  </button>
                </div>
              )}
              {selectedEnquiry.status !== "pending" && (
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                  <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
                    selectedEnquiry.status === "accepted"
                      ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/50"
                      : "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-700"
                  }`}>
                    {selectedEnquiry.status === "accepted"
                      ? <CheckCircle className="w-4.5 h-4.5" />
                      : <XCircle className="w-4.5 h-4.5" />}
                    Order {selectedEnquiry.status}
                  </div>
                  <button
                    onClick={() => handleStatusUpdate(selectedEnquiry.id, "pending")}
                    className="w-full mt-2 py-2 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 rounded-xl text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Reset to Pending
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}