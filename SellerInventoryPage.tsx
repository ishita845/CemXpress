import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Plus, Edit3, Trash2, Search, Filter, Package,
  CheckCircle, AlertTriangle, Tag, ChevronDown, X,
  Save, ArrowLeft,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getShopBySellerId, getMaterialsByShopId, saveMaterial, updateMaterial, deleteMaterial } from "../services/firebaseService";


type ModalMode = "add" | "edit" | null;

const emptyMaterial: Omit<Material, "id" | "shopId"> = {
  name: "",
  category: "Cement",
  tags: [],
  description: "",
  price: 0,
  unit: "bag (50kg)",
  stockQty: 0,
  minOrder: 1,
  image: "https://images.unsplash.com/photo-1762380368593-a0d4c49af47f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjZW1lbnQlMjBiYWdzJTIwY29uc3RydWN0aW9uJTIwc2l0ZXxlbnwxfHx8fDE3NzI0MzQ5MTN8MA&ixlib=rb-4.1.0&q=80&w=1080",
  inStock: true,
  brand: "",
  discount: undefined,
};


const CATEGORIES = [
  { id: "cement",     name: "Cement & Concrete" },
  { id: "steel",      name: "Steel & Iron" },
  { id: "sand",       name: "Sand & Aggregates" },
  { id: "bricks",     name: "Bricks & Blocks" },
  { id: "tiles",      name: "Tiles & Flooring" },
  { id: "paint",      name: "Paint & Coatings" },
  { id: "plumbing",   name: "Plumbing" },
  { id: "electrical", name: "Electrical" },
  { id: "others",     name: "Others" },
];

export default function SellerInventoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [shop, setShop] = useState<any>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [formData, setFormData] = useState<Omit<Material, "id" | "shopId">>(emptyMaterial);
  const [editId, setEditId] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Load shop and materials from Firebase
  useEffect(() => {
    if (!user?.id) return;
    const loadData = async () => {
      const userShop = await getShopBySellerId(user.id);
      setShop(userShop || null);
      if (userShop) {
        const shopMaterials = await getMaterialsByShopId(userShop.id);
        setMaterials(shopMaterials);
      }
    };
    loadData();
  }, [user?.id]);

  const filtered = materials
    .filter((m) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q) || m.tags.some((t) => t.toLowerCase().includes(q));
      }
      return true;
    })
    .filter((m) => selectedCategory === "All" || m.category === selectedCategory);

  const openAdd = () => {
    setFormData(emptyMaterial);
    setEditId(null);
    setTagInput("");
    setModalMode("add");
  };

  const openEdit = (m: Material) => {
    setFormData({
      name: m.name,
      category: m.category,
      tags: [...m.tags],
      description: m.description,
      price: m.price,
      unit: m.unit,
      stockQty: m.stockQty,
      minOrder: m.minOrder,
      image: m.image,
      inStock: m.inStock,
      brand: m.brand || "",
      discount: m.discount,
    });
    setEditId(m.id);
    setTagInput("");
    setModalMode("edit");
  };

  const handleSave = async () => {
    if (!shop) return;

    if (modalMode === "add") {
      const newMat = { ...formData, shopId: shop.id, sellerId: user?.id || "" };
      const savedMat = await saveMaterial(newMat);
      if (savedMat) setMaterials((prev) => [...prev, savedMat]);
    } else if (modalMode === "edit" && editId) {
      await updateMaterial(editId, formData);
      setMaterials((prev) => prev.map((m) => m.id === editId ? { ...m, ...formData } : m));
    }
    setSaved(true);
    setTimeout(() => {
      setModalMode(null);
      setSaved(false);
    }, 800);
  };

  const handleDelete = async (id: string) => {
    await deleteMaterial(id);
    setMaterials((prev) => prev.filter((m) => m.id !== id));
    setDeleteConfirm(null);
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !formData.tags.includes(t)) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, t] }));
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setFormData((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  };

  const toggleStock = (id: string) => {
    const material = materials.find(m => m.id === id);
    if (material) {
      const newInStock = !material.inStock;
      updateMaterialInStorage(id, { inStock: newInStock });
      setMaterials((prev) => prev.map((m) => m.id === id ? { ...m, inStock: newInStock } : m));
    }
  };

  const updateQty = (id: string, qty: number) => {
    const newQty = Math.max(0, qty);
    const newInStock = newQty > 0;
    updateMaterialInStorage(id, { stockQty: newQty, inStock: newInStock });
    setMaterials((prev) => prev.map((m) => m.id === id ? { ...m, stockQty: newQty, inStock: newInStock } : m));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700/60 px-4 sm:px-6 lg:px-8 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/seller/dashboard")}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-gray-900 dark:text-gray-100">Inventory Management</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">{shop ? shop.name : "Loading..."} • {materials.length} products</p>
            </div>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl text-sm hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Material
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search materials..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none"
          >
            <option>All</option>
            {CATEGORIES.map((c) => <option key={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/60 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-left px-5 py-3.5 text-xs text-gray-500 dark:text-gray-400 font-medium">Material</th>
                  <th className="text-left px-4 py-3.5 text-xs text-gray-500 dark:text-gray-400 font-medium">Category</th>
                  <th className="text-left px-4 py-3.5 text-xs text-gray-500 dark:text-gray-400 font-medium">Price</th>
                  <th className="text-left px-4 py-3.5 text-xs text-gray-500 dark:text-gray-400 font-medium">Stock Qty</th>
                  <th className="text-left px-4 py-3.5 text-xs text-gray-500 dark:text-gray-400 font-medium">Status</th>
                  <th className="text-left px-4 py-3.5 text-xs text-gray-500 dark:text-gray-400 font-medium">Tags</th>
                  <th className="text-right px-5 py-3.5 text-xs text-gray-500 dark:text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-14 text-gray-400 dark:text-gray-500">
                      <Package className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                      <p className="text-sm">No materials found</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((m) => (
                    <tr key={m.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <img src={m.image} alt={m.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 max-w-[180px] truncate">{m.name}</p>
                            {m.brand && <p className="text-xs text-gray-400 dark:text-gray-500">{m.brand}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4"><span className="text-sm text-gray-600 dark:text-gray-400">{m.category}</span></td>
                      <td className="px-4 py-4">
                        <div>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">₹{m.price}</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">/{m.unit.split(" ")[0]}</span>
                          {m.discount && <div className="text-xs text-green-600">-{m.discount}% off</div>}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <input type="number" value={m.stockQty} onChange={(e) => updateQty(m.id, Number(e.target.value))}
                            className="w-20 px-2 py-1 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm text-center focus:outline-none focus:ring-1 focus:ring-blue-400"
                          />
                          <span className="text-xs text-gray-400 dark:text-gray-500">{m.unit.split(" ")[0]}s</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <button onClick={() => toggleStock(m.id)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${m.inStock ? "bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/60" : "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/60"}`}
                        >
                          {m.inStock ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                          {m.inStock ? "In Stock" : "Out of Stock"}
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                          {m.tags.slice(0, 2).map((tag) => (<span key={tag} className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs rounded">#{tag}</span>))}
                          {m.tags.length > 2 && <span className="text-xs text-gray-400 dark:text-gray-500">+{m.tags.length - 2}</span>}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEdit(m)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"><Edit3 className="w-4 h-4" /></button>
                          <button onClick={() => setDeleteConfirm(m.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {modalMode && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4 py-6 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/60 rounded-2xl w-full max-w-xl my-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-gray-900 dark:text-gray-100">{modalMode === "add" ? "Add New Material" : "Edit Material"}</h3>
              <button onClick={() => setModalMode(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">Material Name *</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. UltraTech OPC 53 Grade"
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">Category *</label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none"
                  >
                    {CATEGORIES.map((c) => <option key={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">Brand</label>
                  <input type="text" value={formData.brand || ""} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} placeholder="e.g. UltraTech"
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">Price (₹) *</label>
                  <input type="number" value={formData.price || ""} onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })} placeholder="0"
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">Unit *</label>
                  <input type="text" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} placeholder="e.g. bag (50kg)"
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">Stock Quantity *</label>
                  <input type="number" value={formData.stockQty || ""} onChange={(e) => setFormData({ ...formData, stockQty: Number(e.target.value), inStock: Number(e.target.value) > 0 })} placeholder="0"
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">Min. Order Qty</label>
                  <input type="number" value={formData.minOrder || ""} onChange={(e) => setFormData({ ...formData, minOrder: Number(e.target.value) })} placeholder="1"
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">Discount (%)</label>
                  <input type="number" value={formData.discount || ""} onChange={(e) => setFormData({ ...formData, discount: e.target.value ? Number(e.target.value) : undefined })} placeholder="0"
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                  <textarea rows={2} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Brief description..."
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">Tags</label>
                  <div className="flex gap-2 mb-2">
                    <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())} placeholder="Add tag (press Enter)"
                      className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                    <button onClick={addTag} className="px-3 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 text-sm">Add</button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {formData.tags.map((tag) => (
                      <span key={tag} className="flex items-center gap-1 px-2.5 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-xs rounded-full">
                        #{tag}<button onClick={() => removeTag(tag)} className="hover:text-blue-900 dark:hover:text-blue-200"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div onClick={() => setFormData({ ...formData, inStock: !formData.inStock })} className={`w-11 h-6 rounded-full transition-colors relative ${formData.inStock ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"}`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${formData.inStock ? "translate-x-6" : "translate-x-1"}`} />
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Mark as In Stock</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-gray-100 dark:border-gray-800">
              <button onClick={() => setModalMode(null)} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={!formData.name || !formData.price}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${saved ? "bg-green-500 text-white" : "bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"}`}
              >
                {saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> {modalMode === "add" ? "Add Material" : "Save Changes"}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/60 rounded-2xl p-6 max-w-sm w-full">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-gray-900 dark:text-gray-100 text-center mb-2">Delete Material?</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm text-center mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}