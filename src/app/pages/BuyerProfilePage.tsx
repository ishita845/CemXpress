import React, { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import {
  ArrowLeft, Edit2, Save, X, Camera, MapPin, User as UserIcon,
  Crosshair, Loader2, CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useGeolocation } from "../hooks/useGeolocation";

export default function BuyerProfilePage() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const { status: geoStatus, detect } = useGeolocation();

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    alternatePhone: user?.alternatePhone || "",
    location: user?.location || "",
    state: user?.address?.state || "",
    pincode: user?.address?.pincode || "",
    companyName: user?.companyName || "",
    profilePicture: user?.profilePicture || "",
    password: user?.password || "",
  });

  // ── Auto-fill address from GPS ────────────────────────────────────────────
  const handleAutoFill = async () => {
    const geo = await detect();
    if (!geo) return; // error shown by hook; user sees no change

    setForm((prev) => ({
      ...prev,
      location: [geo.area, geo.city].filter(Boolean).join(", ") || prev.location,
      state: geo.state || prev.state,
      pincode: geo.pincode || prev.pincode,
    }));

    toast.success("Address auto-filled from GPS!");
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: form.name,
      email: form.email,
      phone: form.phone,
      alternatePhone: form.alternatePhone,
      location: form.location,
      address: { state: form.state, pincode: form.pincode },
      companyName: form.companyName,
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
      companyName: user?.companyName || "",
      profilePicture: user?.profilePicture || "",
      password: user?.password || "",
    });
    setIsEditing(false);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/buyer/browse")}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-gray-900">My Profile</h1>
              <p className="text-sm text-gray-500">Manage your account information</p>
            </div>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
            >
              <Edit2 className="w-4 h-4" /> Edit Profile
            </button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Avatar */}
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
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-2xl font-semibold">
                    {form.name.charAt(0).toUpperCase()}
                  </div>
                )}
                {isEditing && (
                  <button
                    type="button"
                    className="absolute bottom-0 right-0 p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div>
                <h3 className="text-gray-900">{form.name}</h3>
                <p className="text-sm text-gray-500">{form.email}</p>
                <span className="inline-flex items-center mt-2 px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                  Buyer
                </span>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-gray-900 mb-5 flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-blue-500" /> Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Full Name *" required disabled={!isEditing} value={form.name} onChange={(v) => setForm({ ...form, name: v }) } />
              <Field label="Email Address *" type="email" required disabled={!isEditing} value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
              <Field label="Phone Number *" type="tel" required disabled={!isEditing} value={form.phone} placeholder="+91 9876543210" onChange={(v) => setForm({ ...form, phone: v })} />
              <Field label="Alternate Phone" type="tel" disabled={!isEditing} value={form.alternatePhone} placeholder="+91 9876543210" onChange={(v) => setForm({ ...form, alternatePhone: v })} />
              <Field label="Password *" type="password" required disabled={!isEditing} value={form.password} onChange={(v) => setForm({ ...form, password: v })} />
              <Field label="Company Name" disabled={!isEditing} value={form.companyName} placeholder="e.g. ABC Construction Co." onChange={(v) => setForm({ ...form, companyName: v })} />
            </div>
          </div>

          {/* Address */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-gray-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-500" /> Address
              </h3>
              {isEditing && (
                <button
                  type="button"
                  onClick={handleAutoFill}
                  disabled={geoStatus === "loading"}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 text-blue-600 rounded-xl text-sm hover:bg-blue-100 transition-colors disabled:opacity-60"
                >
                  {geoStatus === "loading" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : geoStatus === "success" ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Crosshair className="w-4 h-4" />
                  )}
                  {geoStatus === "loading" ? "Detecting…" : "Auto-fill from GPS"}
                </button>
              )}
            </div>

            {/* Info banner when not editing */}
            {!isEditing && (
              <div className="mb-4 flex items-center gap-2 px-3 py-2.5 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-600">
                <Crosshair className="w-3.5 h-3.5 flex-shrink-0" />
                Click "Edit Profile" → "Auto-fill from GPS" to populate your address automatically
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Field
                  label="Location / Area *"
                  required
                  disabled={!isEditing}
                  value={form.location}
                  placeholder="e.g. Andheri West, Mumbai"
                  onChange={(v) => setForm({ ...form, location: v })}
                />
              </div>
              <Field label="State *" required disabled={!isEditing} value={form.state} placeholder="e.g. Maharashtra" onChange={(v) => setForm({ ...form, state: v })} />
              <Field label="Pincode *" required disabled={!isEditing} value={form.pincode} placeholder="e.g. 400053" onChange={(v) => setForm({ ...form, pincode: v })} />
            </div>
          </div>

          {/* Action buttons */}
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
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
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

// ── Tiny reusable field ───────────────────────────────────────────────────────
function Field({
  label, value, onChange, disabled, required, type = "text", placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  required?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm text-gray-700 mb-1.5">{label}</label>
      <input
        required={required}
        type={type}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:bg-gray-50 disabled:text-gray-600"
      />
    </div>
  );
}