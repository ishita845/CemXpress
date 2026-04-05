import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Package, TrendingUp, ShoppingBag, Star, MapPin, Phone,
  CheckCircle, AlertTriangle, BarChart3, ArrowUp, MessageCircle, User, Edit,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  getAllShops, getAllMaterials, getAllReviews, getEnquiriesForBuyer,
  Enquiry,
} from "../services/firebaseService";

// Haversine distance (km) — used for "Nearby Shops" stat
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function BuyerDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [shops, setShops] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [shopData, materialData, reviewData] = await Promise.all([
          getAllShops(),
          getAllMaterials(),
          getAllReviews().catch(() => []),
        ]);
        setShops(shopData);
        setMaterials(materialData);
        setReviews(reviewData);
      } catch (err) {
        console.error("Dashboard load error:", err);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    getEnquiriesForBuyer(user.id)
      .then(setEnquiries)
      .catch((err) => console.error("Enquiries load error:", err));
  }, [user?.id]);
  const myReviews = reviews.filter((r) => r.buyerId === user?.id);

  const recentEnquiries = enquiries.slice(0, 5);

  const statusColors: Record<string, string> = {
    not_viewed: "bg-blue-100 text-blue-600",
    accepted: "bg-green-100 text-green-600",
    rejected: "bg-red-100 text-red-500",
  };

  const purchaseStatusColors: Record<string, string> = {
    completed: "bg-green-100 text-green-600",
    pending: "bg-yellow-100 text-yellow-600",
    cancelled: "bg-red-100 text-red-500",
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Page header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700/60 px-4 sm:px-6 lg:px-8 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-gray-900 dark:text-gray-100">Buyer Dashboard</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Welcome back, {user?.name?.split(" ")[0]}!</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/buyer/browse")}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Package className="w-4 h-4" /> Browse Materials
            </button>
            <button
              onClick={() => navigate("/buyer/shops")}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl text-sm hover:bg-blue-600 transition-colors"
            >
              <MapPin className="w-4 h-4" /> Find Shops
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Enquiries", value: enquiries.length, icon: <MessageCircle className="w-5 h-5" />, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/30", change: `${enquiries.filter((e) => e.status === "accepted").length} accepted`, up: true },
            { label: "Reviews", value: myReviews.length, icon: <ShoppingBag className="w-5 h-5" />, color: "text-green-500", bg: "bg-green-50 dark:bg-green-900/30", change: `${reviews.filter((p) => p.status === "pending").length} pending`, up: true },
            { label: "Nearby Shops", value: (() => {
                if (!user?.latitude || !user?.longitude) return shops.length;
                return shops.filter((s) =>
                  s.latitude && s.longitude &&
                  haversine(user.latitude!, user.longitude!, s.latitude, s.longitude) <= 10
                ).length;
              })(), icon: <MapPin className="w-5 h-5" />, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/30", change: user?.latitude ? "Within 10 km" : "All shops", up: true },
            { label: "Available Materials", value: materials.filter((m) => m.inStock).length, icon: <Package className="w-5 h-5" />, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/30", change: "In stock now", up: true },
          ].map((stat) => (
            <div key={stat.label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/60 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center ${stat.color}`}>{stat.icon}</div>
                <span className="text-xs text-gray-500 dark:text-gray-400">{stat.change}</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-0.5">{stat.value}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Enquiries */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/60 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-gray-900 dark:text-gray-100">Recent Enquiries</h3>
                <button onClick={() => navigate("/buyer/enquiries")} className="text-sm text-blue-500 hover:text-blue-600">View All</button>
              </div>
              {recentEnquiries.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No enquiries yet</p>
                  <button onClick={() => navigate("/buyer/browse")} className="mt-3 text-blue-500 text-sm hover:underline">Browse materials</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentEnquiries.map((enq) => (
                    <div key={enq.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">{enq.shopName.charAt(0)}</div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{enq.shopName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{enq.materialName || "General enquiry"}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[enq.status]}`}>
                        {enq.status === "not_viewed" ? "Pending" : enq.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* My Reviews */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/60 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <h3 className="text-gray-900 dark:text-gray-100">My Reviews</h3>
                </div>
                <button onClick={() => navigate("/buyer/enquiries")} className="text-sm text-blue-500 hover:text-blue-600">View All Enquiries</button>
              </div>
              {myReviews.length === 0 ? (
                <div className="text-center py-12">
                  <Star className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No reviews yet</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Submit reviews after sellers accept your enquiries</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myReviews.slice(0, 5).map((review) => {
                    const shop = shops.find(s => s.id === review.shopId);
                    return (
                      <div key={review.id} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/60">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                              {shop?.name || "Shop"}
                            </p>
                            {review.materialName && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                {review.materialName}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= review.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300 dark:text-gray-600"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 line-clamp-2">
                          {review.comment}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(review.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric"
                            })}
                            {review.updatedAt && review.updatedAt !== review.createdAt && (
                              <span className="ml-1">(edited)</span>
                            )}
                          </span>
                          <button
                            onClick={() => navigate("/buyer/enquiries")}
                            className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1"
                          >
                            <Edit className="w-3 h-3" />
                            Edit
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-5">
            {/* Buyer Info */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/60 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {user?.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-gray-900 dark:text-gray-100 font-medium">{user?.name}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                {user?.location && (
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <MapPin className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                    <span className="truncate">{user.location}</span>
                  </div>
                )}
                {user?.phone && (
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <Phone className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                    <span>{user.phone}</span>
                  </div>
                )}
              </div>
              <button onClick={() => navigate("/buyer/profile")} className="mt-4 w-full py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 text-sm rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                Edit Profile
              </button>
            </div>

            {/* Quick Stats */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/60 rounded-2xl p-5">
              <h4 className="text-gray-900 dark:text-gray-100 font-medium mb-4">Quick Stats</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Active Enquiries</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{enquiries.filter((e) => e.status === "pending").length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Accepted Enquiries</span>
                  <span className="text-sm font-semibold text-green-600">{enquiries.filter((e) => e.status === "accepted").length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">My Reviews</span>
                  <span className="text-sm font-semibold text-yellow-600">{myReviews.length}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/60 rounded-2xl p-5">
              <h4 className="text-gray-900 dark:text-gray-100 font-medium mb-3">Quick Actions</h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: <Package className="w-4 h-4" />, label: "Browse", action: () => navigate("/buyer/browse"), color: "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50" },
                  { icon: <MapPin className="w-4 h-4" />, label: "Find Shops", action: () => navigate("/buyer/shops"), color: "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50" },
                  { icon: <MessageCircle className="w-4 h-4" />, label: "Enquiries", action: () => navigate("/buyer/enquiries"), color: "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/50" },
                  { icon: <Star className="w-4 h-4" />, label: "Reviews", action: () => navigate("/buyer/browse"), color: "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/50" },
                ].map((action) => (
                  <button key={action.label} onClick={action.action} className={`flex flex-col items-center gap-2 p-3 rounded-xl text-xs font-medium transition-colors ${action.color}`}>
                    {action.icon}
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}