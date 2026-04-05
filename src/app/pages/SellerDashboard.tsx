import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Package, Plus, CheckCircle, AlertTriangle, Settings, MapPin, Star, Clock,
  MessageCircle, Phone, Mail, X, UserIcon, Activity, TrendingUp, ShoppingBag,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  getShopBySellerId, getMaterialsByShopId, getEnquiriesForSeller,
  updateEnquiryStatus, getReviewsForShop,
  Shop, Material, Enquiry,
} from "../services/firebaseService";
import { toast } from "sonner";
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";

export default function SellerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [shop, setShop] = useState<Shop | undefined>(undefined);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    const loadData = async () => {
      try {
        const [userShop, sellerEnquiries] = await Promise.all([
          getShopBySellerId(user.id),
          getEnquiriesForSeller(user.id).catch(() => []),
        ]);
        setShop(userShop || undefined);
        setEnquiries(sellerEnquiries);
        if (userShop) {
          const [mats, revs] = await Promise.all([
            getMaterialsByShopId(userShop.id),
            getReviewsForShop(userShop.id).catch(() => []),
          ]);
          setMaterials(mats);
          setReviews(revs);
        }
      } catch (err) {
        console.error("Dashboard load error:", err);
      }
    };
    loadData();
  }, [user?.id]);

  const handleStatusUpdate = async (enquiryId: string, status: "accepted" | "rejected") => {
    try {
      await updateEnquiryStatus(enquiryId, status);
      setEnquiries((prev) => prev.map((e) => e.id === enquiryId ? { ...e, status } : e));
      setSelectedEnquiry(null);
      toast.success(`Enquiry ${status === "accepted" ? "accepted" : "rejected"}`);
    } catch (err) {
      toast.error("Failed to update enquiry status");
    }
  };

  const inStockCount = materials.filter((m) => m.inStock).length;
  const lowStockCount = materials.filter((m) => m.inStock && m.stockQty < 100).length;
  
  // Get enquiries from current month
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyEnquiries = enquiries.filter((e) => {
    const ts = e.createdAt as any;
    const enquiryDate = ts?.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    return enquiryDate.getMonth() === currentMonth && enquiryDate.getFullYear() === currentYear;
  });
  
  // Get recent enquiries (last 4)
  const recentEnquiries = enquiries.slice(0, 4);

  // Analytics data
  const enquiryStatusData = [
    { name: "Pending", value: enquiries.filter(e => e.status === "pending").length, color: "#f97316" },
    { name: "Accepted", value: enquiries.filter(e => e.status === "accepted").length, color: "#10b981" },
    { name: "Rejected", value: enquiries.filter(e => e.status === "rejected").length, color: "#6b7280" },
  ].filter(item => item.value > 0);

  const inventoryData = [
    { name: "Total Materials", value: materials.length },
    { name: "Total Enquiries", value: enquiries.length },
    { name: "Accepted", value: enquiries.filter(e => e.status === "accepted").length },
    { name: "Rejected", value: enquiries.filter(e => e.status === "rejected").length },
    { name: "Pending", value: enquiries.filter(e => e.status === "pending").length },
  ];

  const statusColors: Record<string, string> = {
    pending: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400",
    accepted: "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400",
    rejected: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
  };
  
  const getStatusLabel = (status: string) => {
    if (!status) return "Unknown";
    return status === "pending" ? "New" : status.charAt(0).toUpperCase() + status.slice(1);
  };
  
  const getTimeAgo = (dateString: any) => {
    const now = new Date();
    const date = dateString?.seconds ? new Date(dateString.seconds * 1000) : new Date(dateString);
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Page header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700/60 px-4 sm:px-6 lg:px-8 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-gray-900 dark:text-gray-100">Seller Dashboard</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Welcome back, {user?.name?.split(" ")[0]}!</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/seller/inventory")}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Package className="w-4 h-4" /> Manage Inventory
            </button>
            <button
              onClick={() => navigate("/seller/add-material")}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl text-sm hover:bg-blue-600 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Material
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Total Products",
              value: materials.length,
              icon: <Package className="w-5 h-5" />,
              color: "text-blue-500",
              bg: "bg-blue-50 dark:bg-blue-900/30",
            },
            {
              label: "In Stock",
              value: inStockCount,
              icon: <CheckCircle className="w-5 h-5" />,
              color: "text-green-500",
              bg: "bg-green-50 dark:bg-green-900/30",
            },
            {
              label: "Out of Stock",
              value: materials.length - inStockCount,
              icon: <AlertTriangle className="w-5 h-5" />,
              color: "text-red-500",
              bg: "bg-red-50 dark:bg-red-900/30",
            },
            {
              label: "Enquiries (Month)",
              value: monthlyEnquiries.length,
              icon: <ShoppingBag className="w-5 h-5" />,
              color: "text-blue-500",
              bg: "bg-blue-50 dark:bg-blue-900/30",
            },
          ].map((stat) => (
            <div key={stat.label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/60 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center ${stat.color}`}>
                  {stat.icon}
                </div>
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
                <button onClick={() => navigate("/seller/enquiries")} className="text-sm text-blue-500 hover:text-blue-600">View All</button>
              </div>
              {recentEnquiries.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No enquiries yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentEnquiries.map((enq) => (
                    <button
                      key={enq.id}
                      onClick={() => setSelectedEnquiry(enq)}
                      className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
                          {enq.buyerName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{enq.buyerName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{enq.materialName || "General Enquiry"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-gray-400 dark:text-gray-500">{getTimeAgo(enq.createdAt)}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[enq.status]}`}>
                          {getStatusLabel(enq.status)}
                        </span>
                      </div>
                    </button>
                  ))}</div>
              )}
            </div>
              {/* Customer Reviews */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/60 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <h3 className="text-gray-900 dark:text-gray-100">Customer Reviews</h3>
                </div>
                {reviews.length > 0 && (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                  </span>
                )}
              </div>
              {reviews.length === 0 ? (
                <div className="text-center py-8">
                  <Star className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No reviews yet</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Buyers can leave reviews after you accept their enquiries
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                  {reviews.slice(0, 5).map((review) => (
                    <div key={review.id} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/60">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs">
                            {review.buyerName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {review.buyerName}
                            </p>
                            {review.materialName && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {review.materialName}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3.5 h-3.5 ${
                                star <= review.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300 dark:text-gray-600"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                        {review.comment}
                      </p>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(review.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                        {review.updatedAt && review.updatedAt !== review.createdAt && (
                          <span className="ml-1">(edited)</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Analytics Charts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Enquiry Status Chart */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/60 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-5 h-5 text-blue-500" />
                  <h3 className="text-gray-900 dark:text-gray-100">Enquiry Status</h3>
                </div>
                {enquiryStatusData.length > 0 ? (
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={enquiryStatusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={70}
                          fill="#43bbc1"
                          dataKey="value"
                        >
                          {enquiryStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[200px] flex items-center justify-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">No enquiry data available</p>
                  </div>
                )}
              </div>

              {/* Business Overview Chart */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/60 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  <h3 className="text-gray-900 dark:text-gray-100">Business Overview</h3>
                </div>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={inventoryData}>
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={60} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#b916f9" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
          

          {/* Right sidebar */}
          <div className="space-y-5">
            {/* Shop card */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/60 rounded-2xl overflow-hidden">
              {shop ? (
                <>
                  <img src={shop.image} alt={shop.name} className="w-full h-32 object-cover" />
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-gray-900 dark:text-gray-100 font-medium">{shop.name}</h4>
                      <button
                        onClick={() => navigate("/seller/shop-settings")}
                        className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <MapPin className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                        <span className="truncate">{shop.area}, {shop.city}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 flex-shrink-0" />
                        <span>{shop.rating} ({shop.reviewCount} reviews)</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <Clock className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                        <span>{shop.openHours}</span>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${shop.isOpen ? "bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400" : "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400"}`}>
                        {shop.isOpen ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        {shop.isOpen ? "Open Now" : "Closed"}
                      </span>
                      <button
                        onClick={() => navigate("/seller/shop-settings")}
                        className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded-full border border-blue-200 dark:border-blue-800/60 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                      >
                        Edit Shop
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-5 text-center">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Package className="w-6 h-6 text-blue-500" />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Loading shop details...</p>
                  <button
                    onClick={() => navigate("/seller/shop-settings")}
                    className="mt-3 w-full py-2 bg-blue-500 text-white text-sm rounded-xl hover:bg-blue-600 transition-colors"
                  >
                    Set Up Shop
                  </button>
                </div>
              )}
            </div>

            {/* Low Stock Alert */}
            {lowStockCount > 0 && (
              <div className="bg-blue-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/60 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <h4 className="text-red-700 dark:text-red-400 font-medium">Low Stock Alert</h4>
                </div>
                <p className="text-sm text-red-600 dark:text-red-500 mb-3">{lowStockCount} materials are running low on stock.</p>
                <button onClick={() => navigate("/seller/inventory")} className="w-full py-2 bg-red-500 text-white text-sm rounded-xl hover:bg-red-600 transition-colors">Update Stock</button>
              </div>
            )}

            {/* Inventory Quick View */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/60 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-gray-900 dark:text-gray-100 font-medium">Top Materials</h4>
                <button onClick={() => navigate("/seller/inventory")} className="text-xs text-blue-500 hover:text-blue-600">View All</button>
              </div>
              <div className="space-y-2">
                {materials.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No materials yet</p>
                ) : (
                  materials.slice(0, 4).map((mat) => (
                    <div key={mat.id} className="flex items-center justify-between text-sm py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
                      <div>
                        <p className="text-gray-800 dark:text-gray-200 text-xs font-medium truncate max-w-[140px]">{mat.name}</p>
                        <p className="text-gray-400 dark:text-gray-500 text-xs">₹{mat.price}/{mat.unit.split(" ")[0]}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs font-medium ${mat.inStock ? "text-green-600" : "text-red-500"}`}>
                          {mat.inStock ? `${mat.stockQty.toLocaleString()}` : "Out of Stock"}
                        </p>
                        {mat.inStock && <p className="text-gray-400 dark:text-gray-500 text-xs">{mat.unit.split(" ")[0]}s left</p>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            
            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/60 rounded-2xl p-5">
              <h4 className="text-gray-900 dark:text-gray-100 font-medium mb-3">Quick Actions</h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: <Plus className="w-4 h-4" />, label: "Add Material", action: () => navigate("/seller/add-material"), color: "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50" },
                  { icon: <Package className="w-4 h-4" />, label: "Update Stock", action: () => navigate("/seller/inventory"), color: "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50" },
                  { icon: <Settings className="w-4 h-4" />, label: "Shop Settings", action: () => navigate("/seller/shop-settings"), color: "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700" },
                  { icon: <MessageCircle className="w-4 h-4" />, label: "Enquiries", action: () => navigate("/seller/enquiries"), color: "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/50" },
                ].map((action) => (
                  <button
                    key={action.label}
                    onClick={action.action}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl text-xs font-medium transition-colors ${action.color}`}
                  >
                    {action.icon}
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
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
              {/* Buyer Info */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Buyer Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300">{selectedEnquiry.buyerName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300">{selectedEnquiry.buyerPhone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300">{selectedEnquiry.buyerEmail}</span>
                  </div>
                </div>
              </div>

              {/* Material Info */}
              {selectedEnquiry.materialName && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Material</h4>
                  <div className="px-3 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-sm">
                    {selectedEnquiry.materialName}
                  </div>
                </div>
              )}

              {/* Message */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Message</h4>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300">{selectedEnquiry.message}</p>
                </div>
              </div>

              {/* Timestamp */}
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <Clock className="w-3.5 h-3.5" />
                Sent {getTimeAgo(selectedEnquiry.createdAt)}
              </div>

              {/* Actions */}
              {selectedEnquiry.status === "pending" && (
                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleStatusUpdate(selectedEnquiry.id, "rejected")}
                    className="flex-1 py-2.5 border border-red-200 dark:border-red-800/60 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl text-sm hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(selectedEnquiry.id, "accepted")}
                    className="flex-1 py-2.5 bg-green-500 text-white rounded-xl text-sm hover:bg-green-600 transition-colors"
                  >
                    Accept Enquiry
                  </button>
                </div>
              )}
              {selectedEnquiry.status !== "pending" && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${
                    selectedEnquiry.status === "accepted" 
                      ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/60"
                      : "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-700"
                  }`}>
                    {selectedEnquiry.status === "accepted" ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
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