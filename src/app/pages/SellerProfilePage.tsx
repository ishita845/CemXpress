import React, { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { ArrowLeft, Edit2, Save, X, Camera, MapPin, Phone, Mail, Building2, User as UserIcon, FileText } from "lucide-react";
import { toast } from "sonner";

export default function SellerProfilePage() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    alternatePhone: user?.alternatePhone || "",
    location: user?.location || "",
    state: user?.address?.state || "",
    pincode: user?.address?.pincode || "",
    gstNumber: user?.gstNumber || "",
    panNumber: user?.panNumber || "",
    profilePicture: user?.profilePicture || "",
    password: user?.password || "",
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: form.name,
      email: form.email,
      phone: form.phone,
      alternatePhone: form.alternatePhone,
      location: form.location,
      address: {
        state: form.state,
        pincode: form.pincode,
      },
      gstNumber: form.gstNumber,
      panNumber: form.panNumber,
      profilePicture: form.profilePicture,
      password: form.password,
    });
    setIsEditing(false);
    toast.success("Profile updated successfully!");
  };

  const handleCancel = () => {
    setForm({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      alternatePhone: user?.alternatePhone || "",
      location: user?.location || "",
      state: user?.address?.state || "",
      pincode: user?.address?.pincode || "",
      gstNumber: user?.gstNumber || "",
      panNumber: user?.panNumber || "",
      profilePicture: user?.profilePicture || "",
      password: user?.password || "",
    });
    setIsEditing(false);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/seller/dashboard")}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-gray-900">My Profile</h1>
              <p className="text-sm text-gray-500">Manage your account information</p>
            </div>
          </div>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              <Edit2 className="w-4 h-4" /> Edit Profile
            </button>
          ) : null}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Profile Picture */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                {form.profilePicture ? (
                  <img
                    src={form.profilePicture}
                    alt={form.name}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-2xl font-semibold">
                    {form.name.charAt(0).toUpperCase()}
                  </div>
                )}
                {isEditing && (
                  <button
                    type="button"
                    className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div>
                <h3 className="text-gray-900">{form.name}</h3>
                <p className="text-sm text-gray-500">{form.email}</p>
                <span className="inline-flex items-center mt-2 px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-700 capitalize">
                  Seller
                </span>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-gray-900 mb-5 flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-blue-600" /> Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1.5">Shop Name *</label>
                <input
                  required
                  type="text"
                  disabled={!isEditing}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30 disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1.5">Email Address *</label>
                <input
                  required
                  type="email"
                  disabled={!isEditing}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30 disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1.5">Phone Number *</label>
                <input
                  required
                  type="tel"
                  disabled={!isEditing}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 9876543210"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30 disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1.5">Alternate Phone Number</label>
                <input
                  type="tel"
                  disabled={!isEditing}
                  value={form.alternatePhone}
                  onChange={(e) => setForm({ ...form, alternatePhone: e.target.value })}
                  placeholder="+91 9876543210"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30 disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1.5">Password *</label>
                <input
                  required
                  type="password"
                  disabled={!isEditing}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30 disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>
            </div>
          </div>

          {/* Business Information */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-gray-900 mb-5 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" /> Business Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1.5">GST Number</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={form.gstNumber}
                  onChange={(e) => setForm({ ...form, gstNumber: e.target.value })}
                  placeholder="e.g. 27AAACG1234A1Z5"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30 disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1.5">PAN Number *</label>
                <input
                  required
                  type="text"
                  disabled={!isEditing}
                  value={form.panNumber}
                  onChange={(e) => setForm({ ...form, panNumber: e.target.value })}
                  placeholder="e.g. AAACG1234A"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30 disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-gray-900 mb-5 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" /> Address
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-700 mb-1.5">Shop Location / Area *</label>
                <input
                  required
                  type="text"
                  disabled={!isEditing}
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g. Goregaon East, Mumbai"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30 disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1.5">State *</label>
                <input
                  required
                  type="text"
                  disabled={!isEditing}
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  placeholder="e.g. Maharashtra"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30 disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1.5">Pincode *</label>
                <input
                  required
                  type="text"
                  disabled={!isEditing}
                  value={form.pincode}
                  onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                  placeholder="e.g. 400063"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30 disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                <Save className="w-4 h-4" /> Save Changes
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
