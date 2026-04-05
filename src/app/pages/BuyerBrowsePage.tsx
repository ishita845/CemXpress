/**
 * BuyerBrowsePage  –  src/app/pages/BuyerBrowsePage.tsx
 *
 * Blinkit/Rapido-style location-aware browse:
 * • LocationBar auto-detects GPS on first render
 * • Falls back to buyer's stored coordinates (from registration) if GPS denied
 * • Haversine distance calculated for every shop
 * • Radius filter: 10 / 20 / 30 / 40 / 50 km
 * • Nearest-first sort by default
 * • Manual location fallback when GPS is denied
 */

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  Search, X, SlidersHorizontal, Tag, MapPin, Package,
  Star, Phone, CheckCircle, AlertTriangle, Send, Navigation,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getAllShops, getAllMaterials } from "../services/firebaseService";
import { EnquiryModal } from "../components/EnquiryModal";
import { Material, Shop } from "../types";
import  LocationBar from "../components/LocationBar";
import { GeoAddress } from "../hooks/useGeolocation";
import { seedShopCoordinates } from "../utils/seedShopCoordinates";// ── Haversine distance (km) ─────────────────────────────────────────────────
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

type SortOption = "distance" | "price-asc" | "price-desc" | "rating" | "stock";
// Added 40 km radius option
type Radius = 10 | 20 | 30 | 40 | 50;

// ── Component ───────────────────────────────────────────────────────────────
const POPULAR_TAGS = [
  "OPC 53 Grade", "ready mix", "TMT bars", "river sand", "fly ash bricks",
  "vitrified tiles", "waterproof paint", "CPVC pipes", "LED lights",
  "AAC blocks", "cement board", "steel pipes", "granite", "marble",
  "plywood", "gypsum board", "PVC conduit", "wire mesh",
];

export default function BuyerBrowsePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const initialViewMode = location.pathname === "/buyer/shops" ? "shops" : "materials";

  // ── Core state ───────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery]     = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedTags, setSelectedTags]   = useState<string[]>([]);
  const [sortBy, setSortBy]               = useState<SortOption>("distance");
  const [radius, setRadius]               = useState<Radius>(10);
  const [showInStockOnly, setShowInStockOnly] = useState(false);
  const [filterOpen, setFilterOpen]       = useState(false);
  const [viewMode, setViewMode]           = useState<"materials" | "shops">(initialViewMode);
  const [enquiryModal, setEnquiryModal]   = useState<{ material: Material; shop: Shop } | null>(null);

  // ── Data ─────────────────────────────────────────────────────────────────
  const [materials, setMaterials] = useState<Material[]>([]);
  const [shops, setShops]         = useState<Shop[]>([]);

  // ── User location (set by LocationBar or from stored profile coords) ──────
  const [userGeo, setUserGeo] = useState<GeoAddress | null>(() => {
    // On mount, seed from user's stored registration coordinates if available
    if (user?.latitude && user?.longitude) {
      return {
        lat: user.latitude,
        lon: user.longitude,
        area: user.area || "",
        city: user.city || "",
        state: user.address?.state || "",
        pincode: user.address?.pincode || "",
        display: user.location || "Your registered location",
      };
    }
    return null;
  });

  const reloadData = async () => {
    const [mats, shops] = await Promise.all([getAllMaterials(), getAllShops()]);
    setMaterials(mats);
    setShops(shops);
  };

  useEffect(() => {
    reloadData();
  }, []);

  // Sync viewMode with route
  useEffect(() => {
    if (location.pathname === "/buyer/shops") setViewMode("shops");
    else setViewMode("materials");
  }, [location.pathname]);

  // ── Location callback from LocationBar ────────────────────────────────────
  const handleLocationChange = (geo: GeoAddress) => {
    setUserGeo(geo);
  };

  // ── Distance helper ───────────────────────────────────────────────────────
  const distanceTo = (shop: Shop): number | null => {
    if (!userGeo || !shop.latitude || !shop.longitude) return null;
    return parseFloat(
      haversine(userGeo.lat, userGeo.lon, shop.latitude, shop.longitude).toFixed(1)
    );
  };

  // ── Enriched shops (with distance attached) ───────────────────────────────
  const enrichedShops = useMemo(() => {
    return shops
      .map((s) => ({ ...s, distanceKm: distanceTo(s) }))
      .filter((s) => {
        // When GPS is active, only show shops within the chosen radius
        if (userGeo && s.distanceKm !== null) return s.distanceKm <= radius;
        return true; // no GPS → show all
      })
      .sort((a, b) => {
        // Always put shops with known distance first, nearest first
        if (a.distanceKm !== null && b.distanceKm !== null)
          return a.distanceKm - b.distanceKm;
        if (a.distanceKm !== null) return -1;
        if (b.distanceKm !== null) return 1;
        return 0;
      });
  }, [shops, userGeo, radius]);

  // ── Enriched materials ────────────────────────────────────────────────────
  const enrichedMaterials = useMemo(() => {
    return materials
      .map((m) => {
        const shop = shops.find((s) => s.id === m.shopId);
        if (!shop) return null;
        return { ...m, shop: { ...shop, distanceKm: distanceTo(shop) } };
      })
      .filter(Boolean) as (Material & { shop: Shop & { distanceKm: number | null } })[];
  }, [materials, shops, userGeo]);

  // ── Filtered + sorted materials ───────────────────────────────────────────
  const filteredMaterials = useMemo(() => {
    return enrichedMaterials
      .filter((m) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          m.name.toLowerCase().includes(q) ||
          m.tags.some((t) => t.toLowerCase().includes(q)) ||
          m.category.toLowerCase().includes(q) ||
          m.shop.name.toLowerCase().includes(q)
        );
      })
      .filter((m) => selectedCategory === "All" || m.category === selectedCategory)
      .filter((m) => selectedTags.length === 0 || selectedTags.some((t) => m.tags.includes(t)))
      .filter((m) => !showInStockOnly || m.inStock)
      .filter((m) => {
        // Radius filter on materials too
        if (userGeo && m.shop.distanceKm !== null) return m.shop.distanceKm <= radius;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "distance") {
          if (a.shop.distanceKm !== null && b.shop.distanceKm !== null)
            return a.shop.distanceKm - b.shop.distanceKm;
          if (a.shop.distanceKm !== null) return -1;
          if (b.shop.distanceKm !== null) return 1;
          return 0;
        }
        if (sortBy === "price-asc")  return a.price - b.price;
        if (sortBy === "price-desc") return b.price - a.price;
        if (sortBy === "rating")     return b.shop.rating - a.shop.rating;
        if (sortBy === "stock")      return b.stockQty - a.stockQty;
        return 0;
      });
  }, [enrichedMaterials, searchQuery, selectedCategory, selectedTags, showInStockOnly, sortBy, userGeo, radius]);

  const toggleTag = (tag: string) =>
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
    setSelectedTags([]);
    setShowInStockOnly(false);
    setRadius(10);
  };

  const activeFiltersCount = [
    selectedCategory !== "All",
    selectedTags.length > 0,
    showInStockOnly,
  ].filter(Boolean).length;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* ── Header ── */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700/60 px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-gray-900 dark:text-gray-100">Browse Materials</h1>
              {/* ── Blinkit-style location bar ── */}
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <LocationBar
                  onLocationChange={handleLocationChange}
                  initialDisplay={
                    userGeo?.display ||
                    user?.location ||
                    "Set your location"
                  }
                />
                {userGeo && (
                  <span className="hidden sm:flex items-center gap-1 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2.5 py-1.5 rounded-lg border border-green-200 dark:border-green-800/50">
                    <Navigation className="w-3 h-3" />
                    {userGeo.lat === user?.latitude && userGeo.lon === user?.longitude
                      ? "Using your registered location"
                      : "GPS active · sorted by distance"}
                  </span>
                )}
              </div>
            </div>

            {/* View mode toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setViewMode("materials"); navigate("/buyer/browse"); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === "materials" ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
              >
                <Package className="w-4 h-4 inline mr-1.5" />Materials
              </button>
              <button
                onClick={() => { setViewMode("shops"); navigate("/buyer/shops"); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === "shops" ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
              >
                <MapPin className="w-4 h-4 inline mr-1.5" />Shops
              </button>
            </div>
          </div>

          {/* No-location nudge */}
          {!userGeo && (
            <div className="flex items-center gap-2 px-3 py-2 mb-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/60 rounded-xl text-sm">
              <MapPin className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <p className="text-amber-700 dark:text-amber-400">
                <span className="font-medium">Set your location</span> to see nearby shops first and filter by distance
              </p>
            </div>
          )}

          {/* Search + Filter button */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cement, steel, sand, bricks…"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-colors ${filterOpen || activeFiltersCount > 0 ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-800 text-blue-600" : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300"}`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="text-sm">Filters</span>
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">{activeFiltersCount}</span>
              )}
            </button>
          </div>

          {/* Tag chips */}
          <div className="flex flex-wrap gap-2 mt-3">
            {POPULAR_TAGS.slice(0, 10).map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors border ${selectedTags.includes(tag) ? "bg-blue-500 text-white border-blue-500" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:text-blue-600"}`}
              >
                <Tag className="w-3 h-3" />{tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">

          {/* ── Sidebar filter ── */}
          {filterOpen && (
            <div className="hidden lg:block w-64 flex-shrink-0">
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/60 rounded-2xl p-5 sticky top-20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-900 dark:text-gray-100 text-base">Filters</h3>
                  <button onClick={clearFilters} className="text-xs text-blue-500 hover:text-blue-600">Clear all</button>
                </div>

                {/* Category */}
                <div className="mb-5">
                  <h4 className="text-gray-700 dark:text-gray-300 text-sm mb-2">Category</h4>
                  <div className="space-y-1">
                    {["All", ...CATEGORIES.map((c) => c.name)].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedCategory === cat ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 font-medium" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Radius filter — 10/20/30/40/50 km */}
                <div className="mb-5">
                  <h4 className="text-gray-700 dark:text-gray-300 text-sm mb-2 flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-blue-400" />
                    Distance Radius
                    {!userGeo && <span className="text-xs text-amber-500 ml-1">(set location first)</span>}
                  </h4>
                  <div className="grid grid-cols-5 gap-1">
                    {([10, 20, 30, 40, 50] as Radius[]).map((r) => (
                      <button
                        key={r}
                        onClick={() => setRadius(r)}
                        disabled={!userGeo}
                        className={`py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                          radius === r && userGeo
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                        }`}
                      >
                        {r}km
                      </button>
                    ))}
                  </div>
                </div>

                {/* In-stock toggle */}
                <div className="mb-5">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div
                      onClick={() => setShowInStockOnly(!showInStockOnly)}
                      className={`relative w-10 h-5 rounded-full transition-colors ${showInStockOnly ? "bg-blue-500" : "bg-gray-200 dark:bg-gray-700"}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${showInStockOnly ? "translate-x-5" : "translate-x-0.5"}`} />
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">In Stock Only</span>
                  </label>
                </div>

                {/* Sort */}
                <div>
                  <h4 className="text-gray-700 dark:text-gray-300 text-sm mb-2">Sort By</h4>
                  <div className="space-y-1">
                    {[
                      { v: "distance",   l: "Nearest First" },
                      { v: "price-asc",  l: "Price: Low to High" },
                      { v: "price-desc", l: "Price: High to Low" },
                      { v: "rating",     l: "Highest Rated" },
                      { v: "stock",      l: "Most Stock" },
                    ].map((opt) => (
                      <button
                        key={opt.v}
                        onClick={() => setSortBy(opt.v as SortOption)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${sortBy === opt.v ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 font-medium" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"}`}
                      >
                        {opt.l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Main results pane ── */}
          <div className="flex-1 min-w-0">
            {/* Mobile filter bar */}
            {filterOpen && (
              <div className="lg:hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-4">
                <div className="flex gap-3 flex-wrap items-center">
                  {/* Radius pills — now includes 40km */}
                  <div className="flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-blue-400" />
                    {([10, 20, 30, 40, 50] as Radius[]).map((r) => (
                      <button
                        key={r}
                        onClick={() => setRadius(r)}
                        disabled={!userGeo}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors disabled:opacity-40 ${radius === r && userGeo ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}
                      >
                        {r}km
                      </button>
                    ))}
                  </div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="flex-1 text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none"
                  >
                    <option value="All">All Categories</option>
                    {CATEGORIES.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="flex-1 text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none"
                  >
                    <option value="distance">Nearest</option>
                    <option value="price-asc">Price ↑</option>
                    <option value="price-desc">Price ↓</option>
                    <option value="rating">Rating</option>
                    <option value="stock">Stock</option>
                  </select>
                  <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <input type="checkbox" checked={showInStockOnly} onChange={(e) => setShowInStockOnly(e.target.checked)} />
                    In Stock Only
                  </label>
                </div>
              </div>
            )}

            {/* Results count */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {viewMode === "materials"
                  ? `${filteredMaterials.length} materials found`
                  : `${enrichedShops.length} shops found`}
                {viewMode === "materials" && materials.length > 0 && (
                  <span className="ml-2 text-xs">(from {shops.length} shops)</span>
                )}
                {userGeo && (
                  <span className="ml-2 text-xs text-blue-500">
                    · within {radius} km of {userGeo.area || userGeo.city || "your location"}
                  </span>
                )}
                {selectedTags.length > 0 && (
                  <span className="ml-2">
                    · tags:{" "}
                    {selectedTags.map((t) => (
                      <span key={t} className="inline-flex items-center gap-1 ml-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full text-xs">
                        {t} <button onClick={() => toggleTag(t)}><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </span>
                )}
              </p>
            </div>

            {/* ── Materials grid ── */}
            {viewMode === "materials" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredMaterials.length === 0 ? (
                  <div className="col-span-full py-20 text-center">
                    <div className="text-5xl mb-4">🔍</div>
                    <h3 className="text-gray-700 dark:text-gray-300 mb-2">No materials found</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                      {userGeo ? `Try increasing the radius beyond ${radius} km` : "Try adjusting your filters"}
                    </p>
                    <button onClick={clearFilters} className="text-blue-500 text-sm hover:underline">Clear all filters</button>
                  </div>
                ) : (
                  filteredMaterials.map((m) => (
                    <MaterialCard
                      key={m.id}
                      material={m}
                      shop={m.shop}
                      onViewShop={() => navigate(`/buyer/shop/${m.shopId}`)}
                      onQuickPurchase={() => setEnquiryModal({ material: m, shop: m.shop })}
                    />
                  ))
                )}
              </div>
            ) : (
              /* ── Shops grid ── */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {enrichedShops.length === 0 ? (
                  <div className="col-span-full py-20 text-center">
                    <div className="text-5xl mb-4">🏪</div>
                    <h3 className="text-gray-700 dark:text-gray-300 mb-2">No shops found nearby</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      {userGeo ? `No shops within ${radius} km. Try a larger radius.` : "Set your location to see nearby shops."}
                    </p>
                    {userGeo && (
                      <button onClick={() => setRadius(50)} className="mt-3 text-blue-500 text-sm hover:underline">Expand to 50 km</button>
                    )}
                  </div>
                ) : (
                  enrichedShops.map((shop) => {
                    const shopMaterials = materials.filter((m) => m.shopId === shop.id);
                    return (
                      <ShopCard
                        key={shop.id}
                        shop={shop}
                        materialCount={shopMaterials.length}
                        onView={() => navigate(`/buyer/shop/${shop.id}`)}
                      />
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enquiry modal */}
      {enquiryModal && (
        <EnquiryModal
          material={enquiryModal.material}
          shop={enquiryModal.shop}
          onClose={() => setEnquiryModal(null)}
          onSuccess={() => { reloadData(); setEnquiryModal(null); }}
        />
      )}
    </div>
  );
}

// ── MaterialCard ─────────────────────────────────────────────────────────────
function MaterialCard({
  material, shop, onViewShop, onQuickPurchase,
}: {
  material: Material;
  shop: Shop & { distanceKm?: number | null };
  onViewShop: () => void;
  onQuickPurchase: () => void;
}) {
  const discounted = material.discount
    ? material.price * (1 - material.discount / 100)
    : material.price;
  const DEFAULT_IMG = "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400";

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/60 rounded-2xl overflow-hidden hover:shadow-lg transition-all group">
      <div className="relative h-44 overflow-hidden">
        <img src={material.image || DEFAULT_IMG} alt={material.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        <div className="absolute top-3 left-3 flex gap-2">
          {material.inStock
            ? <span className="flex items-center gap-1 px-2 py-1 bg-green-500 text-white text-xs rounded-full"><CheckCircle className="w-3 h-3" /> In Stock</span>
            : <span className="flex items-center gap-1 px-2 py-1 bg-red-500 text-white text-xs rounded-full"><AlertTriangle className="w-3 h-3" /> Out of Stock</span>
          }
          {material.discount && <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">-{material.discount}%</span>}
        </div>
      </div>
      <div className="p-4">
        <h4 className="text-gray-900 dark:text-gray-100 text-sm font-medium line-clamp-2 mb-0.5">{material.name}</h4>
        {material.brand && <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{material.brand}</p>}
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-blue-600 font-semibold">₹{discounted.toFixed(0)}</span>
          <span className="text-gray-400 text-xs">/{material.unit}</span>
          {material.discount && <span className="text-gray-400 text-xs line-through">₹{material.price}</span>}
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-1">
          <Package className="w-3 h-3 text-blue-400" />
          <span>Stock: <strong className="text-gray-700 dark:text-gray-300">{material.stockQty.toLocaleString()} {material.unit.split(" ")[0]}s</strong></span>
        </div>
        <div className="text-xs text-gray-400 mb-3">Min order: {material.minOrder} {material.unit.split(" ")[0]}{material.minOrder > 1 ? "s" : ""}</div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800 cursor-pointer" onClick={onViewShop}>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center text-blue-600 text-xs font-bold">{shop.name.charAt(0)}</div>
            <div>
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate max-w-[120px]">{shop.name}</p>
              <div className="flex items-center gap-1">
                <MapPin className="w-2.5 h-2.5 text-blue-400" />
                {shop.distanceKm != null
                  ? <span className="text-xs text-blue-500 font-medium">{shop.distanceKm} km away</span>
                  : <span className="text-xs text-gray-400">{shop.area}</span>
                }
                <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400 ml-1" />
                <span className="text-xs text-gray-500">{shop.rating}</span>
              </div>
            </div>
          </div>
          <button
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors"
            onClick={(e) => { e.stopPropagation(); onViewShop(); }}
          >
            <Phone className="w-3 h-3" /> Contact
          </button>
        </div>

        <div className="flex flex-wrap gap-1 mt-2">
          {material.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 text-xs rounded">#{tag}</span>
          ))}
        </div>

        <button
          className="mt-3 w-full py-2 bg-blue-500 text-white text-sm rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          onClick={(e) => { e.stopPropagation(); onQuickPurchase(); }}
          disabled={!material.inStock}
        >
          <Send className="w-4 h-4" />
          {material.inStock ? "Quick Enquiry" : "Out of Stock"}
        </button>
      </div>
    </div>
  );
}

// ── ShopCard ──────────────────────────────────────────────────────────────────
function ShopCard({
  shop, materialCount, onView,
}: {
  shop: Shop & { distanceKm?: number | null };
  materialCount: number;
  onView: () => void;
}) {
  const DEFAULT_SHOP_IMG = "https://images.unsplash.com/photo-1510016290251-68aaad49723e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400";
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/60 rounded-2xl overflow-hidden hover:shadow-lg transition-all cursor-pointer group" onClick={onView}>
      <div className="relative h-40 overflow-hidden">
        <img src={shop.image || DEFAULT_SHOP_IMG} alt={shop.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        <div className="absolute top-3 left-3">
          <span className={`px-2 py-1 text-xs rounded-full font-medium ${shop.isOpen ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
            {shop.isOpen ? "Open Now" : "Closed"}
          </span>
        </div>
        {/* Distance badge */}
        {shop.distanceKm != null && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/95 dark:bg-gray-900/90 backdrop-blur px-2 py-1 rounded-full text-xs font-semibold text-blue-600 dark:text-blue-400 shadow">
            <Navigation className="w-3 h-3" />
            {shop.distanceKm} km
          </div>
        )}
        {shop.distanceKm == null && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur px-2 py-1 rounded-full text-xs">
            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
            <span className="font-medium">{shop.rating}</span>
            <span className="text-gray-400">({shop.reviewCount})</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-1">
          <h4 className="text-gray-900 dark:text-gray-100 font-medium">{shop.name}</h4>
          {shop.distanceKm != null && (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              {shop.rating}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-2">
          <MapPin className="w-3.5 h-3.5 text-blue-400" />
          <span>
            {shop.area}
            {shop.distanceKm != null ? ` · ${shop.distanceKm} km away` : ""}
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{shop.description}</p>
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <span className="flex items-center gap-1"><Package className="w-3 h-3" /> {materialCount} materials</span>
          <span>{shop.openHours}</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {shop.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded-full">{tag}</span>
          ))}
        </div>
        <button className="mt-3 w-full py-2 bg-blue-500 text-white text-sm rounded-xl hover:bg-blue-600 transition-colors">View Shop</button>
      </div>
    </div>
  );
}