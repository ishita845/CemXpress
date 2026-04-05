import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft, MapPin, Star, Phone, Mail, Clock, Package,
  CheckCircle, AlertTriangle, Tag, MessageCircle, Share2,
  ChevronRight, Building2,
} from "lucide-react";
import ReviewList from "../components/ReviewList";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { getShopById, getMaterialsByShopId, getReviewsForShop, createEnquiry } from "../services/firebaseService";
import type { Shop, Material } from "../types";

export default function ShopDetailPage() {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [contactModal, setContactModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [enquiryMessage, setEnquiryMessage] = useState("");
  const [enquirySent, setEnquirySent] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);
  const [shop, setShop] = useState<Shop | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    if (!shopId) return;
    const loadData = async () => {
      try {
        const [foundShop, shopMaterials, shopReviews] = await Promise.all([
          getShopById(shopId),
          getMaterialsByShopId(shopId),
          getReviewsForShop(shopId).catch(() => []),
        ]);
        setShop(foundShop || undefined);
        setMaterials(shopMaterials);
        setReviews(shopReviews);
      } catch (err) {
        console.error("Failed to load shop:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [shopId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">Loading shop…</p>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🏗️</div>
          <h2 className="text-gray-700 mb-2">Shop not found</h2>
          <button onClick={() => navigate("/buyer/browse")} className="text-blue-500 hover:underline">
            Back to Browse
          </button>
        </div>
      </div>
    );
  }

  const categories = ["All", ...Array.from(new Set(materials.map((m) => m.category)))];
  const filteredMaterials = selectedCategory === "All"
    ? materials
    : materials.filter((m) => m.category === selectedCategory);

  const handleEnquiry = async () => {
    if (!user) {
      toast.error("Please log in to send enquiries");
      return;
    }
    if (!enquiryMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }
    try {
      await createEnquiry({
        buyerId: user.id,
        buyerName: user.name,
        buyerPhone: user.phone || "",
        buyerEmail: user.email,
        shopId: shop.id,
        shopName: shop.name,
        sellerId: shop.sellerId,
        materialId: selectedMaterial || undefined,
        materialName: selectedMaterial
          ? materials.find((m) => m.id === selectedMaterial)?.name
          : undefined,
        message: enquiryMessage,
        status: "not_viewed",
      });
      toast.success("Enquiry sent successfully!");
      setEnquirySent(true);
      setTimeout(() => {
        setContactModal(false);
        setEnquirySent(false);
        setEnquiryMessage("");
        setSelectedMaterial(null);
      }, 2000);
    } catch (err) {
      toast.error("Failed to send enquiry. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Hero Banner */}
      <div className="relative h-72 bg-gray-900 overflow-hidden">
        <img src={shop.image} alt={shop.name} className="w-full h-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-8 lg:px-12 pb-6">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={() => navigate("/buyer/browse")}
              className="flex items-center gap-2 text-white/80 hover:text-white text-sm mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Browse
            </button>
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${shop.isOpen ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
                    {shop.isOpen ? "Open Now" : "Closed"}
                  </span>
                </div>
                <h1 className="text-3xl text-white mb-1">{shop.name}</h1>
                <div className="flex items-center gap-3 text-gray-300 text-sm">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-blue-400" />{shop.address}</span>
                  <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />{shop.rating} ({shop.reviewCount} reviews)</span>
                  <span className="text-blue-300">{shop.distance} km away</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setContactModal(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                >
                  <Phone className="w-4 h-4" /> Contact Seller
                </button>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-white/10 text-white border border-white/20 rounded-xl hover:bg-white/20 transition-colors backdrop-blur-sm">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main - Materials */}
          <div className="lg:col-span-2">
            {/* Category tabs */}
            <div className="flex gap-2 flex-wrap mb-6">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === cat
                      ? "bg-blue-500 text-white"
                      : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-blue-300"
                  }`}
                >
                  {cat} {cat === "All" ? `(${materials.length})` : `(${materials.filter((m) => m.category === cat).length})`}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredMaterials.map((material) => {
                const discountedPrice = material.discount ? material.price * (1 - material.discount / 100) : material.price;
                return (
                  <div key={material.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/60 rounded-2xl overflow-hidden hover:shadow-md dark:hover:shadow-gray-900/50 transition-all">
                    <div className="relative h-36 overflow-hidden">
                      <img src={material.image} alt={material.name} className="w-full h-full object-cover" />
                      <div className="absolute top-2 left-2 flex gap-1.5">
                        {material.inStock ? (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-green-500 text-white text-xs rounded-full"><CheckCircle className="w-3 h-3" /> In Stock</span>
                        ) : (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full"><AlertTriangle className="w-3 h-3" /> Out of Stock</span>
                        )}
                        {material.discount && <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">-{material.discount}%</span>}
                      </div>
                    </div>
                    <div className="p-4">
                      <h4 className="text-gray-900 dark:text-gray-100 text-sm font-medium mb-1 line-clamp-2">{material.name}</h4>
                      {material.brand && <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{material.brand}</p>}
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-blue-600 font-semibold">₹{discountedPrice.toFixed(0)}</span>
                        <span className="text-gray-400 text-xs">/{material.unit}</span>
                        {material.discount && <span className="text-gray-400 text-xs line-through">₹{material.price}</span>}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3">
                        <span className="flex items-center gap-1"><Package className="w-3 h-3 text-blue-400" />{material.stockQty.toLocaleString()} units</span>
                        <span>Min: {material.minOrder}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {material.tags.slice(0, 3).map((t) => (<span key={t} className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs rounded">#{t}</span>))}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => { setContactModal(true); setEnquiryMessage(`I am interested in ${material.name}. Please share the bulk pricing.`); setSelectedMaterial(material.id); }}
                          className="py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 text-xs rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                        >
                          Enquire
                        </button>
                        <button
                          onClick={() => setSelectedMaterial(material.id)}
                          className="py-2 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 text-xs rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-1"
                        >
                          <Star className="w-3 h-3" /> Reviews
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sidebar - Shop Info */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/60 rounded-2xl p-6">
              <h3 className="text-gray-900 dark:text-gray-100 mb-4">Shop Details</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-700 dark:text-gray-300 font-medium">Address</p>
                    <p className="text-gray-500 dark:text-gray-400">{shop.address}, {shop.city}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <Phone className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-700 dark:text-gray-300 font-medium">Phone</p>
                    <a href={`tel:${shop.phone}`} className="text-blue-500 hover:text-blue-600">{shop.phone}</a>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <Mail className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-700 dark:text-gray-300 font-medium">Email</p>
                    <a href={`mailto:${shop.email}`} className="text-blue-500 hover:text-blue-600 break-all">{shop.email}</a>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <Clock className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-700 dark:text-gray-300 font-medium">Hours</p>
                    <p className="text-gray-500 dark:text-gray-400">{shop.openHours}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setContactModal(true)}
                className="mt-5 w-full py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors text-sm"
              >
                Send Enquiry
              </button>
            </div>

            {/* Tags */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/60 rounded-2xl p-6">
              <h3 className="text-gray-900 dark:text-gray-100 mb-3">Available Materials</h3>
              <div className="flex flex-wrap gap-2">
                {shop.tags.map((tag) => (
                  <span key={tag} className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded-full border border-blue-100 dark:border-blue-800/60">
                    <Tag className="w-3 h-3" />{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/60 rounded-2xl p-6">
              <h3 className="text-gray-900 dark:text-gray-100 mb-4">Shop Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <div className="text-2xl font-bold text-blue-500">{materials.length}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Products Listed</div>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <div className="text-2xl font-bold text-green-500">{materials.filter((m) => m.inStock).length}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">In Stock Now</div>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <div className="text-2xl font-bold text-yellow-500">{shop.rating}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Rating</div>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <div className="text-2xl font-bold text-blue-500">{shop.reviewCount}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Reviews</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/60 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-gray-900 dark:text-gray-100 mb-1">Customer Reviews</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                See what our customers are saying about us
              </p>
            </div>
            {reviews.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= Math.round(shop.rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300 dark:text-gray-600"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {shop.rating}
                </span>
              </div>
            )}
          </div>
          <ReviewList reviews={reviews} showMaterialName={true} />
        </div>
      </div>

      {/* Contact Modal */}
      {contactModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4" onClick={() => setContactModal(false)}>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/60 rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            {enquirySent ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-gray-900 dark:text-gray-100 mb-2">Enquiry Sent!</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">The seller will contact you shortly.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-gray-900 dark:text-gray-100">Contact Seller</h3>
                  <button onClick={() => setContactModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl mb-4">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">{shop.name.charAt(0)}</div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{shop.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{shop.phone}</p>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">Your Message</label>
                  <textarea
                    rows={4}
                    value={enquiryMessage}
                    onChange={(e) => setEnquiryMessage(e.target.value)}
                    placeholder="Hi, I need a quote for…"
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <a href={`tel:${shop.phone}`} className="flex items-center justify-center gap-2 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <Phone className="w-4 h-4" /> Call Now
                  </a>
                  <button onClick={handleEnquiry} className="flex items-center justify-center gap-2 py-2.5 bg-blue-500 text-white rounded-xl text-sm hover:bg-blue-600 transition-colors">
                    <MessageCircle className="w-4 h-4" /> Send Message
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Review Modal */}
      {selectedMaterial && (() => {
        const materialReviews = reviews.filter(r => r.materialId === selectedMaterial);
        return (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4" onClick={() => setSelectedMaterial(null)}>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/60 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6 flex items-center justify-between">
                <div>
                  <h3 className="text-gray-900 dark:text-gray-100">Product Reviews</h3>
                  {materials.find((m) => m.id === selectedMaterial) && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {materials.find((m) => m.id === selectedMaterial)!.name}
                    </p>
                  )}
                </div>
                <button onClick={() => setSelectedMaterial(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button>
              </div>
              <div className="p-6">
                <ReviewList reviews={materialReviews} showMaterialName={false} />
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}