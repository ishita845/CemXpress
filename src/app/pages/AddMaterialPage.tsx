import React, { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Save, CheckCircle, X, Tag, Plus, Upload, Image as ImageIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { saveMaterial } from "../services/firebaseService";
import { toast } from "sonner";
import type { Material } from "../types";

const POPULAR_TAGS = [
  "OPC 53 Grade", "OPC 43 Grade", "PPC Cement", "ready mix",
  "TMT bars", "Fe 500", "river sand", "M-sand", "fly ash bricks",
  "AAC blocks", "red bricks", "vitrified tiles", "ceramic tiles",
  "waterproof paint", "emulsion paint", "CPVC pipes", "UPVC pipes",
  "LED lights", "MCB", "plywood", "MDF board", "gypsum board",
  "wire mesh", "binding wire", "stone chips", "granite", "marble",
];

const CATEGORIES = [
  { id: "cement",     name: "Cement & Concrete",  icon: "🏗️" },
  { id: "steel",      name: "Steel & Iron",        icon: "🔩" },
  { id: "sand",       name: "Sand & Aggregates",   icon: "⛏️" },
  { id: "bricks",     name: "Bricks & Blocks",     icon: "🧱" },
  { id: "tiles",      name: "Tiles & Flooring",    icon: "🪟" },
  { id: "paint",      name: "Paint & Coatings",    icon: "🎨" },
  { id: "plumbing",   name: "Plumbing",             icon: "🚿" },
  { id: "electrical", name: "Electrical",           icon: "⚡" },
  { id: "others",     name: "Others",               icon: "📦" },
];

export default function AddMaterialPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "Cement",
    customCategory: "", // For "Others" category
    brand: "",
    price: "",
    unit: "bag (50kg)",
    stockQty: "",
    minOrder: "1",
    discount: "",
    description: "",
    tags: [] as string[],
    inStock: true,
    image: "", // Image URL or base64
  });
  const [tagInput, setTagInput] = useState("");
  const [imagePreview, setImagePreview] = useState("");

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !form.tags.includes(t)) {
      setForm((p) => ({ ...p, tags: [...p.tags, t] }));
    }
    setTagInput("");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, you would upload to storage (Firebase, Supabase, etc.)
      // For demo, we'll use a data URL
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setForm({ ...form, image: result });
        setImagePreview(result);
        toast.success("Image uploaded successfully!");
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setForm({ ...form, image: "" });
    setImagePreview("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user is authenticated and is a seller
    if (!user || user.role !== "seller") {
      toast.error("You must be logged in as a seller to add materials");
      return;
    }
    
    // Check if seller has a shop
    if (!user.shopId) {
      toast.error("You need a shop to add materials");
      return;
    }
    
    // If no image is provided, use the default material image
    const finalImage = form.image || "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80";
    
    // Create the material object
    const newMaterial: Material = {
      id: `mat-${Date.now()}`,
      shopId: user.shopId,
      name: form.name,
      category: form.category === "Others" ? form.customCategory : form.category,
      tags: form.tags,
      description: form.description,
      price: Number(form.price),
      unit: form.unit,
      stockQty: Number(form.stockQty),
      minOrder: Number(form.minOrder),
      image: finalImage,
      inStock: form.inStock,
      brand: form.brand || undefined,
      discount: form.discount ? Number(form.discount) : undefined,
    };
    
    // Save material to localStorage
    await saveMaterial(newMaterial);
    
    toast.success("Material added successfully!");
    setSaved(true);
    setTimeout(() => navigate("/seller/inventory"), 1500);
  };

  const unitOptions = [
    "bag (50kg)", "kg", "cubic meter", "piece", "meter",
    "10L bucket", "20L drum", "ton", "sqft",
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700/60 px-4 sm:px-6 lg:px-8 py-5">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/seller/inventory")} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-gray-900 dark:text-gray-100">Add New Material</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Add a product to your shop inventory</p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">
        {/* Image Upload */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/60 rounded-2xl p-6">
          <h3 className="text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-blue-500" /> Product Image
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Upload a photo of the material (optional).</p>
          {imagePreview || form.image ? (
            <div className="relative w-full h-64 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden">
              <img src={imagePreview || form.image} alt="Material preview" className="w-full h-full object-cover" />
              <button type="button" onClick={removeImage} className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"><X className="w-4 h-4" /></button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all">
              <div className="flex flex-col items-center justify-center py-8">
                <Upload className="w-10 h-10 text-gray-400 dark:text-gray-500 mb-3" />
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Click to upload image</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">PNG, JPG up to 10MB</p>
              </div>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          )}
        </div>

        {/* Basic Info */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/60 rounded-2xl p-6">
          <h3 className="text-gray-900 dark:text-gray-100 mb-5">Product Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">Material Name *</label>
              <input required type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. UltraTech OPC 53 Grade Cement"
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">Category *</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl text-sm focus:outline-none"
              >
                {CATEGORIES.map((c) => <option key={c.id} value={c.name}>{c.icon} {c.name}</option>)}
                <option value="Others">Others</option>
              </select>
              {form.category === "Others" && (
                <input 
                  type="text" 
                  required
                  value={form.customCategory} 
                  onChange={(e) => setForm({ ...form, customCategory: e.target.value })} 
                  placeholder="Enter custom category name"
                  className="mt-2 w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              )}
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">Brand</label>
              <input type="text" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="e.g. UltraTech"
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
              <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description..."
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Pricing & Stock */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/60 rounded-2xl p-6">
          <h3 className="text-gray-900 dark:text-gray-100 mb-5">Pricing & Stock</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">Price (₹) *</label>
              <input required type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0"
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">Unit *</label>
              <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl text-sm focus:outline-none"
              >
                {unitOptions.map((u) => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">Stock Quantity *</label>
              <input required type="number" value={form.stockQty} onChange={(e) => setForm({ ...form, stockQty: e.target.value, inStock: Number(e.target.value) > 0 })} placeholder="0"
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">Min. Order Quantity</label>
              <input type="number" value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: e.target.value })} placeholder="1"
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">Discount (%) <span className="text-gray-400">optional</span></label>
              <input type="number" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} placeholder="e.g. 5"
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
            <div className="flex items-center">
              <label className="flex items-center gap-3 cursor-pointer mt-5">
                <div onClick={() => setForm({ ...form, inStock: !form.inStock })} className={`w-11 h-6 rounded-full transition-colors relative ${form.inStock ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.inStock ? "translate-x-6" : "translate-x-1"}`} />
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Mark as In Stock</span>
              </label>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/60 rounded-2xl p-6">
          <h3 className="text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2"><Tag className="w-5 h-5 text-blue-500" /> Search Tags</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Tags help buyers find your product when searching.</p>
          <div className="flex gap-2 mb-3">
            <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())} placeholder="Type a tag and press Enter..."
              className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
            <button type="button" onClick={addTag} className="px-4 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 text-sm"><Plus className="w-4 h-4" /></button>
          </div>
          {form.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {form.tags.map((tag) => (
                <span key={tag} className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-sm rounded-full">
                  #{tag}<button type="button" onClick={() => setForm((p) => ({ ...p, tags: p.tags.filter((t) => t !== tag) }))} className="hover:text-blue-900 dark:hover:text-blue-200"><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          )}
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">Suggested tags:</p>
            <div className="flex flex-wrap gap-2">
              {POPULAR_TAGS.filter((t) => !form.tags.includes(t)).map((tag) => (
                <button key={tag} type="button" onClick={() => setForm((p) => ({ ...p, tags: [...p.tags, tag] }))}
                  className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  + {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pb-8">
          <button type="button" onClick={() => navigate("/seller/inventory")} className="flex-1 py-3.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Cancel
          </button>
          <button type="submit" className={`flex-1 py-3.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${saved ? "bg-green-500 text-white" : "bg-blue-500 text-white hover:bg-blue-600"}`}>
            {saved ? <><CheckCircle className="w-4 h-4" /> Material Added!</> : <><Save className="w-4 h-4" /> Add to Inventory</>}
          </button>
        </div>
      </form>
    </div>
  );
}