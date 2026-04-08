import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import {
  ArrowLeft,
  MessageCircle,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  Store,
  Search,
  X,
  Star,
  Edit,
} from "lucide-react";
import ReviewModal from "../components/ReviewModal";
import {
  getEnquiriesForBuyer,
  getReviewByEnquiryId,
  updateEnquiryPaymentMethod,
  Enquiry,
  Review,
} from "../services/firebaseService";

export default function BuyerEnquiriesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [reviewMap, setReviewMap] = useState<Record<string, Review | null>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [paymentLoadingId, setPaymentLoadingId] = useState<string | null>(null);
  const [codEnquiry, setCodEnquiry] = useState<Enquiry | null>(null);
  const [codAddress, setCodAddress] = useState("");
  const [codLandmark, setCodLandmark] = useState("");
  const [codTime, setCodTime] = useState("");
  const [codNote, setCodNote] = useState("");

  useEffect(() => {
    if (!user?.id) return;
    const loadData = async () => {
      try {
        const data = await getEnquiriesForBuyer(user.id);
        setEnquiries(data);
        const accepted = data.filter((e) => e.status === "accepted");
        const entries = await Promise.all(
          accepted.map(async (e) => {
            const review = await getReviewByEnquiryId(e.id).catch(() => null);
            return [e.id, review] as [string, Review | null];
          }),
        );
        setReviewMap(Object.fromEntries(entries));
      } catch (err) {
        console.error("Failed to load enquiries:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user?.id]);

  const filteredEnquiries = enquiries.filter((e) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.materialName?.toLowerCase().includes(q) ||
      e.shopName.toLowerCase().includes(q) ||
      e.message.toLowerCase().includes(q) ||
      e.status.toLowerCase().includes(q)
    );
  });

  const handleReviewClick = (enquiry: Enquiry) => {
    setSelectedEnquiry(enquiry);
    setShowReviewModal(true);
  };

  const handleReviewSubmit = async () => {
    if (!selectedEnquiry) return;
    const updated = await getReviewByEnquiryId(selectedEnquiry.id).catch(() => null);
    setReviewMap((prev) => ({ ...prev, [selectedEnquiry.id]: updated }));
  };

  const handlePaymentSelect = async (enquiryId: string) => {
    try {
      setPaymentLoadingId(enquiryId);
      await updateEnquiryPaymentMethod(enquiryId, "cod");
      setEnquiries((prev) =>
        prev.map((e) => (e.id === enquiryId ? { ...e, paymentMethod: "cod" } : e)),
      );
    } catch (err) {
      console.error("Failed to update payment method:", err);
    } finally {
      setPaymentLoadingId(null);
    }
  };

  const openCodLayer = (enquiry: Enquiry) => {
    const defaultAddress = user?.location
      ? `${user.location}${user.address?.state ? `, ${user.address.state}` : ""}${user.address?.pincode ? ` - ${user.address.pincode}` : ""}`
      : "";
    setCodEnquiry(enquiry);
    setCodAddress(defaultAddress);
    setCodLandmark("");
    setCodTime("");
    setCodNote("");
  };

  const confirmCodSelection = async () => {
    if (!codEnquiry) return;
    await handlePaymentSelect(codEnquiry.id);
    setCodEnquiry(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "accepted":
        return (
          <span className="flex items-center gap-1 px-3 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400">
            <CheckCircle className="w-3.5 h-3.5" /> Accepted
          </span>
        );
      case "rejected":
        return (
          <span className="flex items-center gap-1 px-3 py-1 text-xs rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400">
            <XCircle className="w-3.5 h-3.5" /> Rejected
          </span>
        );
      case "pending":
        return (
          <span className="flex items-center gap-1 px-3 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400">
            <Clock className="w-3.5 h-3.5" /> Pending
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (ts: any) => {
    if (!ts) return "";
    const date = ts?.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };


  const acceptedCount = enquiries.filter((e) => e.status === "accepted").length;
  const rejectedCount = enquiries.filter((e) => e.status === "rejected").length;
  const pendingCount = enquiries.filter((e) => e.status === "pending").length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">Loading enquiries...</p>
        </div>
      </div>
    );
  }

  return (

    <>
      <style>{`
        @keyframes buyerEnquiryFloat {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(0, -10px, 0); }
        }
        @keyframes buyerEnquiryFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes buyerEnquiryPulse {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.06); }
        }
        @keyframes buyerEnquiryGlow {
          0%, 100% { box-shadow: 0 0 0 rgba(59,130,246,0); }
          50% { box-shadow: 0 20px 60px rgba(59,130,246,0.16); }
        }
        @keyframes buyerEnquiryShimmer {
          0% { transform: translateX(-120%); opacity: 0; }
          30% { opacity: 0.55; }
          100% { transform: translateX(120%); opacity: 0; }
        }
        .buyer-enquiry-animate {
          animation: buyerEnquiryFadeUp 0.55s ease both;
        }
        .buyer-enquiry-card {
          position: relative;
          overflow: hidden;
          isolation: isolate;
        }
        .buyer-enquiry-card::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(59,130,246,0.08), transparent 45%, rgba(16,185,129,0.08));
          pointer-events: none;
        }
        .buyer-enquiry-card::after {
          content: "";
          position: absolute;
          top: 0;
          left: -40%;
          width: 38%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.42), transparent);
          transform: skewX(-18deg);
          opacity: 0;
          pointer-events: none;
        }
        .buyer-enquiry-card:hover::after {
          opacity: 1;
          animation: buyerEnquiryShimmer 1.15s ease;
        }
        .buyer-enquiry-glow {
          animation: buyerEnquiryGlow 7s ease-in-out infinite;
        }
      `}</style>

      <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_28%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.14),transparent_30%),linear-gradient(180deg,#f8fbff_0%,#eef6ff_24%,#ffffff_58%,#f5faff_100%)] text-slate-900 dark:bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_24%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.12),transparent_26%),linear-gradient(180deg,#020617_0%,#0b1220_34%,#0f172a_100%)] dark:text-slate-100">
      <div className="buyer-enquiry-animate buyer-enquiry-glow border-b border-white/70 bg-white/80 px-4 py-5 shadow-xl shadow-sky-100/90 backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/85 dark:shadow-cyan-950/30 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate("/buyer/browse")}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex-1">
              <h1 className="text-gray-900 dark:text-gray-100">My Enquiries</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                View all your sent enquiries and their status
              </p>
            </div>
            <div className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 rounded-full text-sm font-medium">
              {filteredEnquiries.length} Total
            </div>
          </div>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Total", value: filteredEnquiries.length, tone: "from-blue-500 to-cyan-500" },
              { label: "Pending", value: pendingCount, tone: "from-amber-500 to-orange-500" },
              { label: "Accepted", value: acceptedCount, tone: "from-emerald-500 to-green-500" },
              { label: "Rejected", value: rejectedCount, tone: "from-rose-500 to-red-500" },
            ].map((item, index) => (
              <div
                key={item.label}
                className="buyer-enquiry-animate rounded-3xl border border-white/80 bg-gradient-to-br from-white via-sky-50 to-blue-50/90 p-4 shadow-lg shadow-blue-100/70 ring-1 ring-white/60 dark:border-slate-700/60 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/90 dark:ring-slate-700/50 dark:shadow-cyan-950/20"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className={`mb-2 inline-flex rounded-full bg-gradient-to-r ${item.tone} px-3 py-1 text-xs font-semibold text-white shadow-lg`}>{item.label}</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-gray-100">{item.value}</div>
              </div>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by material, shop, or status..."
              className="w-full rounded-2xl border border-white/80 bg-white/90 py-3 pl-10 pr-10 text-slate-900 shadow-lg shadow-sky-100/70 backdrop-blur placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-300 dark:border-slate-700 dark:bg-slate-900/85 dark:text-slate-100 dark:shadow-cyan-950/20 dark:placeholder-slate-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredEnquiries.length === 0 ? (
          <div className="buyer-enquiry-card buyer-enquiry-animate rounded-[30px] border border-white/80 bg-white/90 p-12 text-center shadow-2xl shadow-sky-100/80 backdrop-blur-xl ring-1 ring-white/60 dark:border-slate-700/60 dark:bg-slate-900/88 dark:ring-slate-700/40 dark:shadow-cyan-950/20">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-10 h-10 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-gray-900 dark:text-gray-100 mb-2">
              {searchQuery ? "No enquiries found" : "No Enquiries Yet"}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {searchQuery
                ? "Try adjusting your search query"
                : "You haven't sent any enquiries yet. Browse materials and contact sellers to get started."}
            </p>
            {!searchQuery && (
              <button
                onClick={() => navigate("/buyer/browse")}
                className="px-6 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
              >
                Browse Materials
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEnquiries.map((enquiry) => (
              <div
                key={enquiry.id}
                className="buyer-enquiry-card buyer-enquiry-animate rounded-[30px] border border-white/80 bg-white/92 p-6 shadow-xl shadow-sky-100/70 backdrop-blur-xl ring-1 ring-white/60 transition duration-300 hover:-translate-y-1.5 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-100/80 dark:border-slate-700/60 dark:bg-slate-900/88 dark:hover:border-cyan-700/60 dark:ring-slate-700/40 dark:shadow-cyan-950/20"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2.5 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                      <Store className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-gray-900 dark:text-gray-100 mb-1">{enquiry.shopName}</h3>
                      {enquiry.materialName ? (
                        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1.5 mb-1">
                          <Package className="w-3.5 h-3.5" /> {enquiry.materialName}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-600 dark:text-gray-400">General Enquiry</p>
                      )}
                      {enquiry.quantity && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Quantity: <strong className="text-gray-700 dark:text-gray-300">{enquiry.quantity}</strong>
                        </p>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(enquiry.status)}
                </div>

                <div className="mb-4 rounded-2xl border border-sky-100/70 bg-gradient-to-r from-slate-50 via-white to-sky-50 p-4 dark:border-slate-700/60 dark:bg-gradient-to-r dark:from-slate-800/90 dark:via-slate-900 dark:to-slate-800/80">
                  <p className="text-sm text-gray-700 dark:text-gray-300">{enquiry.message}</p>
                  {enquiry.paymentMethod && (
                    <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                      Payment Method:{" "}
                      <strong className="text-gray-800 dark:text-gray-200">
                        Cash on Delivery (COD)
                      </strong>
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between flex-wrap gap-3">
                  <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                    <Clock className="w-4 h-4" /> {formatDate(enquiry.createdAt)}
                  </span>
                  <div className="flex items-center gap-2">
                    {enquiry.status === "accepted" && (
                      <>
                        <button
                          onClick={() => navigate(`/buyer/shop/${enquiry.shopId}`)}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                        >
                          View Shop
                        </button>
                        <button
                          onClick={() => handleReviewClick(enquiry)}
                          className="px-4 py-2 border border-green-200 dark:border-green-800/60 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors text-sm flex items-center gap-1.5"
                        >
                          {reviewMap[enquiry.id] ? (
                            <>
                              <Edit className="w-4 h-4" /> Edit Review
                            </>
                          ) : (
                            <>
                              <Star className="w-4 h-4" /> Leave Review
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {enquiry.status === "accepted" && (
                  <div className="mt-4 rounded-2xl border border-green-200 bg-gradient-to-r from-green-50 via-white to-emerald-50 p-3 shadow-sm dark:border-green-800/60 dark:bg-gradient-to-r dark:from-green-950/40 dark:via-slate-900 dark:to-emerald-950/30">
                    <p className="text-sm text-green-700 dark:text-green-400">
                      Your enquiry has been accepted! The seller will contact you at {enquiry.buyerPhone}
                    </p>
                    <div className="mt-3">
                      {!enquiry.paymentMethod ? (
                        <>
                          <p className="text-xs text-green-700 dark:text-green-400 mb-2">
                            Select a payment option:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => openCodLayer(enquiry)}
                              disabled={paymentLoadingId === enquiry.id}
                              className="px-3 py-1.5 rounded-lg text-xs border border-green-300 dark:border-green-800/60 bg-white dark:bg-gray-900 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 disabled:opacity-60"
                            >
                              Cash on Delivery (COD)
                            </button>
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-green-700 dark:text-green-400">
                          Payment selected:{" "}
                          <strong>
                            Cash on Delivery (COD)
                          </strong>
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {enquiry.status === "rejected" && (
                  <div className="mt-4 rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 via-white to-rose-50 p-3 shadow-sm dark:border-red-800/60 dark:bg-gradient-to-r dark:from-red-950/40 dark:via-slate-900 dark:to-rose-950/30">
                    <p className="text-sm text-red-700 dark:text-red-400">
                      This enquiry was rejected. Please try contacting other sellers.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showReviewModal && selectedEnquiry && (
        <ReviewModal
          enquiry={selectedEnquiry}
          existingReview={reviewMap[selectedEnquiry.id] || undefined}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedEnquiry(null);
          }}
          onSubmit={handleReviewSubmit}
        />
      )}

      {codEnquiry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
          onClick={() => setCodEnquiry(null)}
        >
          <div
            className="buyer-enquiry-animate w-full max-w-lg rounded-[30px] border border-white/80 bg-white/95 p-6 shadow-2xl shadow-sky-100/80 backdrop-blur-xl ring-1 ring-white/70 dark:border-slate-700 dark:bg-slate-900/95 dark:ring-slate-700/50 dark:shadow-black/50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900 dark:text-gray-100">COD Details</h3>
              <button
                onClick={() => setCodEnquiry(null)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Delivery Address
                </label>
                <textarea
                  value={codAddress}
                  onChange={(e) => setCodAddress(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  placeholder="Enter delivery address"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Landmark
                  </label>
                  <input
                    value={codLandmark}
                    onChange={(e) => setCodLandmark(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Preferred Time
                  </label>
                  <input
                    value={codTime}
                    onChange={(e) => setCodTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    placeholder="e.g. 10 AM - 1 PM"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Note to Seller
                </label>
                <textarea
                  value={codNote}
                  onChange={(e) => setCodNote(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  placeholder="Optional delivery note"
                />
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setCodEnquiry(null)}
                className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={confirmCodSelection}
                disabled={paymentLoadingId === codEnquiry.id}
                className="flex-1 py-2.5 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-60"
              >
                {paymentLoadingId === codEnquiry.id ? "Saving..." : "Confirm COD"}
              </button>
            </div>
          </div>
        </div>
      )}
            <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -left-16 top-24 h-72 w-72 rounded-full bg-blue-200/60 blur-3xl dark:bg-blue-900/20" style={{ animation: "buyerEnquiryFloat 12s ease-in-out infinite" }} />
          <div className="absolute right-0 top-64 h-80 w-80 rounded-full bg-cyan-200/50 blur-3xl dark:bg-cyan-900/20" style={{ animation: "buyerEnquiryPulse 10s ease-in-out infinite" }} />
          <div className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-violet-200/40 blur-3xl dark:bg-violet-900/20" style={{ animation: "buyerEnquiryFloat 16s ease-in-out infinite reverse" }} />
        </div>
      </div>
    </>
  );
}
