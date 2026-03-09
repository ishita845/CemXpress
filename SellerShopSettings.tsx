import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft, Save, MapPin, Phone, Tag, X, CheckCircle, Building2,
  Crosshair, Loader2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useGeolocation } from "../hooks/useGeolocation";

export default function SellerShopSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { status: geoStatus, detect } = useGeolocation();

  const [originalShop, setOriginalShop] = useState<Shop | undefined>(undefined);
  const [form, setForm] = useState({
    name: "",
    description: "",
    address: "",
    city: "",
    area: "",
    phone: "",
    email: "",
    openHours: "",
    isOpen: true,
    tags: [] as string[],
    latitude: null as number | null,
    longitude: null as number | null,
  });
  const [tagInput, setTagInput] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user?.id) {
      const shop = getShopBySellerId(user.id);
      if (shop) {
        setOriginalShop(shop);
        setForm({
          name: shop.name,
          description: shop.description,
          address: shop.address,
          city: shop.city,
          area: shop.area,
          phone: shop.phone,
          email: shop.email,
          openHours: shop.openHours,
          isOpen: shop.isOpen,
          tags: [...shop.tags],
          latitude: shop.latitude ?? null,
          longitude: shop.longitude ?? null,
        });
      }
    }
  }, [user?.id]);

  // ── Detect shop location from GPS ─────────────────────────────────────────
  const handleDetectLocation = async () => {
    const geo = await detect();
    if (!geo) return;

    setForm((prev) => ({
      ...prev,
      // Auto-fill address fields from geocoded data
      area: geo.area || prev.area,
      city: geo.city || prev.city,
      address: prev.address || [geo.area, geo.city, geo.state].filter(Boolean).join(", "),
      latitude: geo.lat,
      longitude: geo.lon,
    }));
  };

  const handleSave = () => {
    if (originalShop) {
      updateShop(originalShop.id, {
        name: form.name,
        description: form.description,
        address: form.address,
        city: form.city,
        area: form.area,
        phone: form.phone,
        email: form.email,
        openHours: form.openHours,
        isOpen: form.isOpen,
        tags: form.tags,
        // Save coordinates so buyers can see distance to this shop
        latitude: form.latitude,
        longitude: form.longitude,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !form.tags.includes(t)) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, t] }));
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Top bar */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700/60 px-4 sm:px-6 lg:px-8 py-5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/seller/dashboard")}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-gray-900 dark:text-gray-100">Shop Settings</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage your shop profile and visibility
              </p>
            </div>
          </div>
          <button
            onClick={handleSave}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              saved ? "bg-green-500 text-white" : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            {saved ? (
              <><CheckCircle className="w-4 h-4" /> Saved!</>
            ) : (
              <><Save className="w-4 h-4" /> Save Changes</>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {/* Basic Info */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/60 rounded-2xl p-6">
              <h3 className="text-gray-900 dark:text-gray-100 mb-5 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-500" /> Basic Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">
                    Shop Name *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Location — with GPS button */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/60 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-500" /> Location
                </h3>
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={geoStatus === "loading"}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/60 text-blue-600 dark:text-blue-400 rounded-xl text-sm hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors disabled:opacity-60"
                >
                  {geoStatus === "loading" ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : geoStatus === "success" ? (
                    <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <Crosshair className="w-3.5 h-3.5" />
                  )}
                  {geoStatus === "loading" ? "Detecting…" : "Use my GPS location"}
                </button>
              </div>

              {/* GPS coordinates indicator */}
              {form.latitude && form.longitude && (
                <div className="mb-4 flex items-center gap-2 px-3 py-2.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-xl text-xs text-green-700 dark:text-green-400">
                  <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>
                    GPS coordinates saved — buyers will see accurate distance to your shop
                    ({form.latitude.toFixed(5)}, {form.longitude.toFixed(5)})
                  </span>
                </div>
              )}

              {!form.latitude && (
                <div className="mb-4 flex items-center gap-2 px-3 py-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl text-xs text-amber-700 dark:text-amber-400">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>
                    No GPS coordinates yet — click "Use my GPS location" so buyers can find your shop by distance
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">
                    Full Address *
                  </label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">Area</label>
                  <input
                    type="text"
                    value={form.area}
                    onChange={(e) => setForm({ ...form, area: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">City</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/60 rounded-2xl p-6">
              <h3 className="text-gray-900 dark:text-gray-100 mb-5 flex items-center gap-2">
                <Phone className="w-5 h-5 text-blue-500" /> Contact Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">
                    Business Hours
                  </label>
                  <input
                    type="text"
                    value={form.openHours}
                    onChange={(e) => setForm({ ...form, openHours: e.target.value })}
                    placeholder="e.g. Mon–Sat: 8AM–7PM"
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/60 rounded-2xl p-6">
              <h3 className="text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                <Tag className="w-5 h-5 text-blue-500" /> Material Tags
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Add tags for materials you sell. Buyers use these to discover your shop.
              </p>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  placeholder="Type a tag and press Enter…"
                  className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
                <button
                  onClick={addTag}
                  className="px-4 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 text-sm"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {form.tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-sm rounded-full"
                  >
                    #{tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="hover:text-blue-900 dark:hover:text-blue-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">Popular tags:</p>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_TAGS.filter((t) => !form.tags.includes(t))
                    .slice(0, 8)
                    .map((tag) => (
                      <button
                        key={tag}
                        onClick={() =>
                          setForm((prev) => ({ ...prev, tags: [...prev.tags, tag] }))
                        }
                        className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        + {tag}
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Right column ── */}
          <div className="space-y-5">
            {/* Shop Status */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/60 rounded-2xl p-5">
              <h4 className="text-gray-900 dark:text-gray-100 font-medium mb-4">Shop Status</h4>
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">Currently Open</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Toggle to show/hide from buyers
                  </p>
                </div>
                <div
                  onClick={() => setForm({ ...form, isOpen: !form.isOpen })}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    form.isOpen ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      form.isOpen ? "translate-x-7" : "translate-x-1"
                    }`}
                  />
                </div>
              </label>
              <div
                className={`mt-3 px-3 py-2 rounded-lg text-sm ${
                  form.isOpen
                    ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                    : "bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400"
                }`}
              >
                {form.isOpen
                  ? "✅ Your shop is visible to buyers"
                  : "🔴 Your shop is hidden from buyers"}
              </div>
            </div>

            {/* Preview Card */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/60 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Buyer Preview</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">How buyers see your shop</p>
              </div>
              {originalShop?.image ? (
                <img src={originalShop.image} alt="" className="w-full h-28 object-cover" />
              ) : (
                <div className="w-full h-28 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                </div>
              )}
              <div className="p-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                  {form.name}
                </h4>
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-2">
                  <MapPin className="w-3 h-3 text-blue-400" />
                  {form.area}, {form.city}
                </div>
                {form.latitude && (
                  <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 mb-2">
                    <Crosshair className="w-3 h-3" /> Location pinned
                  </div>
                )}
                <div className="flex flex-wrap gap-1">
                  {form.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}