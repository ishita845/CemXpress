import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { ArrowLeft, MessageCircle, Clock, CheckCircle, XCircle, Package, Store, Search, X, Star, Edit } from "lucide-react";
import ReviewModal from "../components/ReviewModal";
import {
  getEnquiriesForBuyer,
  getReviewByEnquiryId,
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
          })
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "accepted":
        return <span className="flex items-center gap-1 px-3 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400"><CheckCircle className="w-3.5 h-3.5" /> Accepted</span>;
      case "rejected":
        return <span className="flex items-center gap-1 px-3 py-1 text-xs rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400"><XCircle className="w-3.5 h-3.5" /> Rejected</span>;
      case "pending":
        return <span className="flex items-center gap-1 px-3 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400"><Clock className="w-3.5 h-3.5" /> Pending</span>;
      default: return null;
    }
  };

  const formatDate = (ts: any) => {
    if (!ts) return "";
    const date = ts?.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };
  const [showOrderModal, setShowOrderModal] = useState(false);
const [selectedOrder, setSelectedOrder] = useState<Enquiry | null>(null);
const [address, setAddress] = useState("");
const [notes, setNotes] = useState("");

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
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => navigate("/buyer/browse")} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex-1">
              <h1 className="text-gray-900 dark:text-gray-100">My Enquiries</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">View all your sent enquiries and their status</p>
            </div>
            <div className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 rounded-full text-sm font-medium">
              {filteredEnquiries.length} Total
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by material, shop, or status..."
              className="w-full pl-10 pr-10 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
            {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X className="w-4 h-4" /></button>}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredEnquiries.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/60 rounded-2xl p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-10 h-10 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-gray-900 dark:text-gray-100 mb-2">{searchQuery ? "No enquiries found" : "No Enquiries Yet"}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {searchQuery ? "Try adjusting your search query" : "You haven't sent any enquiries yet. Browse materials and contact sellers to get started."}
            </p>
            {!searchQuery && (
              <button onClick={() => navigate("/buyer/browse")} className="px-6 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors">Browse Materials</button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEnquiries.map((enquiry) => (
              <div key={enquiry.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/60 rounded-2xl p-6 hover:border-blue-200 dark:hover:border-blue-800/60 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2.5 bg-blue-100 dark:bg-blue-900/40 rounded-lg"><Store className="w-5 h-5 text-blue-600 dark:text-blue-400" /></div>
                    <div className="flex-1">
                      <h3 className="text-gray-900 dark:text-gray-100 mb-1">{enquiry.shopName}</h3>
                      {enquiry.materialName
                        ? <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1.5 mb-1"><Package className="w-3.5 h-3.5" /> {enquiry.materialName}</p>
                        : <p className="text-sm text-gray-600 dark:text-gray-400">General Enquiry</p>}
                      {enquiry.quantity && <p className="text-xs text-gray-500 dark:text-gray-400">Quantity: <strong className="text-gray-700 dark:text-gray-300">{enquiry.quantity}</strong></p>}
                    </div>
                  </div>
                  {getStatusBadge(enquiry.status)}
                </div>

                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 mb-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300">{enquiry.message}</p>
                </div>

                <div className="flex items-center justify-between flex-wrap gap-3">
                  <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                    <Clock className="w-4 h-4" /> {formatDate(enquiry.createdAt)}
                  </span>
                  <div className="flex items-center gap-2">
                    {enquiry.status === "accepted" && (
                      <>
                        <button onClick={() => navigate(`/buyer/shop/${enquiry.shopId}`)} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm">View Shop</button>
                        <button onClick={() => handleReviewClick(enquiry)} className="px-4 py-2 border border-green-200 dark:border-green-800/60 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors text-sm flex items-center gap-1.5">
                          {reviewMap[enquiry.id] ? <><Edit className="w-4 h-4" /> Edit Review</> : <><Star className="w-4 h-4" /> Leave Review</>}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {enquiry.status === "accepted" && (
                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/60 rounded-xl">
                    <p className="text-sm text-green-700 dark:text-green-400">✓ Your enquiry has been accepted! The seller will contact you at {enquiry.buyerPhone}</p>
                  </div>
                )}
                {enquiry.status === "rejected" && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/60 rounded-xl">
                    <p className="text-sm text-red-700 dark:text-red-400">This enquiry was rejected. Please try contacting other sellers.</p>
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
          onClose={() => { setShowReviewModal(false); setSelectedEnquiry(null); }}
          onSubmit={handleReviewSubmit}
        />
      )}
    </div>
  );
}