import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { ArrowLeft, MessageCircle, Clock, CheckCircle, XCircle, Package, User, Phone, Mail, MapPin, X } from "lucide-react";
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
      setSelectedEnquiry((prev) => prev?.id === enquiryId ? { ...prev, status } : prev);
      toast.success(`Enquiry ${status === "accepted" ? "accepted" : status === "rejected" ? "rejected" : "marked as pending"}`);
    } catch (err) {
      toast.error("Failed to update enquiry status");
    }
  };

  const filteredEnquiries = filter === "all" ? enquiries : enquiries.filter((e) => e.status === filter);
  const getStatusCount = (s: string) => s === "all" ? enquiries.length : enquiries.filter((e) => e.status === s).length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "accepted": return <span className="flex items-center gap-1 px-3 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400"><CheckCircle className="w-3.5 h-3.5" /> Accepted</span>;
      case "rejected": return <span className="flex items-center gap-1 px-3 py-1 text-xs rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400"><XCircle className="w-3.5 h-3.5" /> Rejected</span>;
      case "pending": return <span className="flex items-center gap-1 px-3 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400"><Clock className="w-3.5 h-3.5" /> New</span>;
      default: return null;
    }
  };

  const formatDate = (ts: any) => {
    if (!ts) return "";
    const date = ts?.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

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
    <>
      <style>{`
        @keyframes sellerEnquiryFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes sellerEnquiryFloat {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(0, -12px, 0); }
        }
        @keyframes sellerEnquiryPulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.82; transform: scale(1.08); }
        }
        @keyframes sellerEnquiryShimmer {
          0% { transform: translateX(-120%); opacity: 0; }
          30% { opacity: 0.45; }
          100% { transform: translateX(120%); opacity: 0; }
        }
        .seller-enquiry-animate { animation: sellerEnquiryFadeUp 0.55s ease both; }
        .seller-enquiry-card { position: relative; overflow: hidden; isolation: isolate; }
        .seller-enquiry-card::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(59,130,246,0.08), transparent 45%, rgba(14,165,233,0.08));
          pointer-events: none;
        }
        .seller-enquiry-card::after {
          content: "";
          position: absolute;
          top: 0; left: -40%; width: 34%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.38), transparent);
          transform: skewX(-18deg); opacity: 0; pointer-events: none;
        }
        .seller-enquiry-card:hover::after { opacity: 1; animation: sellerEnquiryShimmer 1.05s ease; }
      `}</style>

      <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_28%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.12),transparent_30%),linear-gradient(180deg,#f8fbff_0%,#eef6ff_22%,#ffffff_56%,#f4f9ff_100%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_24%),radial-gradient(circle_at_top_right,rgba(6,182,212,0.12),transparent_28%),linear-gradient(180deg,#020617_0%,#0b1220_34%,#0f172a_100%)]">
      <div className="seller-enquiry-animate border-b border-white/70 bg-white/80 px-4 py-5 shadow-xl shadow-sky-100/80 backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/85 dark:shadow-cyan-950/25 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/seller/dashboard")} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-gray-900 dark:text-gray-100">Customer Enquiries</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Manage incoming enquiries from buyers</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {([{ v: "all", l: "All" }, { v: "pending", l: "New" }, { v: "accepted", l: "Accepted" }, { v: "rejected", l: "Rejected" }] as const).map(({ v, l }) => (
              <button key={v} onClick={() => setFilter(v)}
                className={`rounded-xl px-3 py-1.5 text-sm transition-all ${filter === v ? "bg-blue-500 text-white shadow-lg shadow-blue-200/70 dark:shadow-blue-950/40" : "bg-white/85 dark:bg-slate-900/80 border border-white/80 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-300 hover:-translate-y-0.5"}`}
              >
                {l}
                {v === "pending" && getStatusCount("pending") > 0 && (
                  <span className="ml-1.5 w-5 h-5 bg-blue-500 text-white text-xs rounded-full inline-flex items-center justify-center">{getStatusCount("pending")}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredEnquiries.length === 0 ? (
          <div className="seller-enquiry-card seller-enquiry-animate rounded-[30px] border border-white/80 bg-white/90 p-12 text-center shadow-2xl shadow-sky-100/70 backdrop-blur-xl ring-1 ring-white/60 dark:border-slate-700/60 dark:bg-slate-900/88 dark:ring-slate-700/40 dark:shadow-cyan-950/20">
            <MessageCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-gray-900 dark:text-gray-100 mb-2">No Enquiries</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">No enquiries matching your filter.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEnquiries.map((enquiry) => (
              <div key={enquiry.id} className={`seller-enquiry-card seller-enquiry-animate rounded-[30px] border p-6 shadow-xl shadow-sky-100/60 backdrop-blur-xl ring-1 ring-white/60 transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-100/70 dark:ring-slate-700/40 dark:shadow-cyan-950/20 ${enquiry.status === "pending" ? "border-blue-200 dark:border-blue-800/60 bg-white/95 dark:bg-slate-900/90" : "border-white/80 dark:border-slate-700/60 bg-white/92 dark:bg-slate-900/88"}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {enquiry.buyerName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-gray-900 dark:text-gray-100">{enquiry.buyerName}</h3>
                        {enquiry.status === "pending" && <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-xs rounded-full">New</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{enquiry.buyerPhone}</span>
                        <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{enquiry.buyerEmail}</span>
                      </div>
                      {enquiry.buyerAddress && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {enquiry.buyerAddress}</p>}
                    </div>
                  </div>
                  {getStatusBadge(enquiry.status)}
                </div>

                {enquiry.materialName && (
                  <div className="mb-3 flex items-center gap-2 text-sm flex-wrap">
                    <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg flex items-center gap-1">
                      <Package className="w-3.5 h-3.5" /> {enquiry.materialName}
                    </span>
                    {enquiry.quantity && <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg text-xs">Qty: {enquiry.quantity}</span>}
                  </div>
                )}

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

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {formatDate(enquiry.createdAt)}
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => setSelectedEnquiry(enquiry)} className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-lg text-xs hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">View Details</button>
                    {enquiry.status === "pending" && (
                      <>
                        <button onClick={() => handleStatusUpdate(enquiry.id, "rejected")} className="px-4 py-2 border border-red-200 dark:border-red-800/60 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl text-sm hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">Reject</button>
                        <button onClick={() => handleStatusUpdate(enquiry.id, "accepted")} className="px-4 py-2 bg-green-500 text-white rounded-xl text-sm hover:bg-green-600 transition-colors">Accept</button>
                      </>
                    )}
                    {enquiry.status !== "pending" && (
                      <button onClick={() => handleStatusUpdate(enquiry.id, "pending")} className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 rounded-lg text-xs hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Reset to Pending</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Buyer Details Modal */}
      {selectedEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" onClick={() => setSelectedEnquiry(null)}>
          <div className="seller-enquiry-animate w-full max-w-lg rounded-[30px] border border-white/80 bg-white/95 p-6 shadow-2xl shadow-sky-100/80 backdrop-blur-xl ring-1 ring-white/70 dark:border-slate-700 dark:bg-slate-900/95 dark:ring-slate-700/50 dark:shadow-black/50" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-gray-900 dark:text-gray-100">Enquiry Details</h3>
              <button onClick={() => setSelectedEnquiry(null)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Buyer Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2"><User className="w-4 h-4 text-gray-400" /><span className="text-gray-700 dark:text-gray-300">{selectedEnquiry.buyerName}</span></div>
                  <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" /><span className="text-gray-700 dark:text-gray-300">{selectedEnquiry.buyerPhone}</span></div>
                  <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-400" /><span className="text-gray-700 dark:text-gray-300">{selectedEnquiry.buyerEmail}</span></div>
                  {selectedEnquiry.buyerAddress && <div className="flex items-start gap-2"><MapPin className="w-4 h-4 text-gray-400 mt-0.5" /><span className="text-gray-700 dark:text-gray-300">{selectedEnquiry.buyerAddress}</span></div>}
                </div>
              </div>

              {selectedEnquiry.materialName && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Material Requested</h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="px-3 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-sm">{selectedEnquiry.materialName}</div>
                    {selectedEnquiry.quantity && <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg text-sm">Qty: {selectedEnquiry.quantity}</div>}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Message</h4>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300">{selectedEnquiry.message}</p>
                  {selectedEnquiry.paymentMethod && (
                    <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                      Payment Method:{" "}
                      <strong className="text-gray-800 dark:text-gray-200">
                        Cash on Delivery (COD)
                      </strong>
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <Clock className="w-3.5 h-3.5" /> Sent on {formatDate(selectedEnquiry.createdAt)}
              </div>

              {selectedEnquiry.status === "pending" && (
                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button onClick={() => handleStatusUpdate(selectedEnquiry.id, "rejected")} className="flex-1 py-2.5 border border-red-200 dark:border-red-800/60 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl text-sm hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">Reject</button>
                  <button onClick={() => handleStatusUpdate(selectedEnquiry.id, "accepted")} className="flex-1 py-2.5 bg-green-500 text-white rounded-xl text-sm hover:bg-green-600 transition-colors">Accept Enquiry</button>
                </div>
              )}
              {selectedEnquiry.status !== "pending" && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${selectedEnquiry.status === "accepted" ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/60" : "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-700"}`}>
                    {selectedEnquiry.status === "accepted" ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    Enquiry {selectedEnquiry.status}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -left-16 top-24 h-72 w-72 rounded-full bg-blue-200/60 blur-3xl dark:bg-blue-900/20" style={{ animation: "sellerEnquiryFloat 12s ease-in-out infinite" }} />
          <div className="absolute right-0 top-64 h-80 w-80 rounded-full bg-cyan-200/50 blur-3xl dark:bg-cyan-900/20" style={{ animation: "sellerEnquiryPulse 10s ease-in-out infinite" }} />
          <div className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-violet-200/40 blur-3xl dark:bg-violet-900/20" style={{ animation: "sellerEnquiryFloat 16s ease-in-out infinite reverse" }} />
        </div>
      </div>
    </>
  );
}
