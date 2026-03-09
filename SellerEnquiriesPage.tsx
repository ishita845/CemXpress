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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700/60 px-4 sm:px-6 lg:px-8 py-5">
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
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filter === v ? "bg-blue-500 text-white" : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-300"}`}
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
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/60 rounded-2xl p-12 text-center">
            <MessageCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-gray-900 dark:text-gray-100 mb-2">No Enquiries</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">No enquiries matching your filter.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEnquiries.map((enquiry) => (
              <div key={enquiry.id} className={`bg-white dark:bg-gray-900 border rounded-2xl p-6 transition-colors ${enquiry.status === "pending" ? "border-blue-200 dark:border-blue-800/60 bg-blue-50/20 dark:bg-blue-900/5" : "border-gray-200 dark:border-gray-700/60"}`}>
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

                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 mb-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300">{enquiry.message}</p>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedEnquiry(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-lg w-full border border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
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
    </div>
  );
}