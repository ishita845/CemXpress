// src/pages/RegisterPage.tsx  ← REPLACE YOUR EXISTING FILE WITH THIS
// Only change from original: register() is now async + await, and
// checkEmailExists() is async. All other logic/UI is identical.

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Building2, ArrowLeft, Package, CheckCircle, AlertCircle, Upload, User,
  Crosshair, Loader2, MapPin,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { uploadImage } from "../services/cloudinaryService";
import { toast } from "sonner";

const NOMINATIM_HEADERS = {
  "Accept-Language": "en",
  "User-Agent": "CemXpress-App/1.0 (construction-materials-marketplace)",
};

async function forwardGeocode(q: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const res  = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1&countrycodes=in`,
      { headers: NOMINATIM_HEADERS }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || !data.length) return null;
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  } catch { return null; }
}

async function reverseGeocode(lat: number, lon: number) {
  try {
    const res  = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
      { headers: NOMINATIM_HEADERS }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const a    = data.address || {};
    return {
      area:    a.suburb || a.neighbourhood || a.quarter || a.hamlet || a.village || a.town || "",
      city:    a.city   || a.town          || a.village || a.county || "",
      state:   a.state  || "",
      pincode: a.postcode || "",
      display: [a.suburb || a.neighbourhood || "", a.city || a.town || "", a.state || ""].filter(Boolean).join(", "),
    };
  } catch { return null; }
}

export default function RegisterPage() {
  const navigate  = useNavigate();
  const { register, checkEmailExists } = useAuth();
  const [role,           setRole]           = useState<"buyer" | "seller">("buyer");
  const [submitted,      setSubmitted]      = useState(false);
  const [error,          setError]          = useState("");
  const [isSubmitting,   setIsSubmitting]   = useState(false);
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState("");
  const [gpsStatus,      setGpsStatus]      = useState<"idle" | "loading" | "done" | "denied">("idle");

  const [form, setForm] = useState({
    name: "", email: "", phone: "", alternatePhone: "",
    password: "", confirmPassword: "",
    address: "", area: "", city: "", state: "", pincode: "",
    companyName: "", shopName: "", gstNumber: "", panNumber: "",
  });

  // Auto-detect GPS on mount
  useEffect(() => {
    if (!navigator.geolocation) return;
    setGpsStatus("loading");
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const geo = await reverseGeocode(coords.latitude, coords.longitude);
        if (geo) {
          setForm((prev) => ({
            ...prev,
            address: prev.address || geo.display,
            area:    prev.area    || geo.area,
            city:    prev.city    || geo.city,
            state:   prev.state   || geo.state,
            pincode: prev.pincode || geo.pincode,
          }));
          toast.success(`Location detected: ${geo.display}`);
        }
        setGpsStatus("done");
      },
      () => setGpsStatus("denied"),
      { timeout: 8000, maximumAge: 300000 }
    );
  }, []);

  const handleDetectGPS = () => {
    if (!navigator.geolocation) { toast.error("Geolocation not supported."); return; }
    setGpsStatus("loading");
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const geo = await reverseGeocode(coords.latitude, coords.longitude);
        if (geo) {
          setForm((prev) => ({
            ...prev,
            address: geo.display, area: geo.area,
            city: geo.city, state: geo.state, pincode: geo.pincode,
          }));
          toast.success(`Location detected: ${geo.display}`);
        }
        setGpsStatus("done");
      },
      () => { setGpsStatus("denied"); toast.error("GPS denied. Fill location manually."); },
      { timeout: 8000 }
    );
  };

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const isValidPhone = (p: string) => /^[0-9]{10}$/.test(p.replace(/[^0-9]/g, ""));

  const handleProfilePictureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5 MB"); return; }
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image"); return; }
    setProfilePicFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setProfilePicPreview(reader.result as string);
    reader.readAsDataURL(file);
    toast.success("Profile picture selected!");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!isValidEmail(form.email))                              { setError("Please enter a valid email address"); return; }
    if (!isValidPhone(form.phone))                              { setError("Please enter a valid 10-digit phone number"); return; }
    if (form.alternatePhone && !isValidPhone(form.alternatePhone)) { setError("Invalid alternate phone number"); return; }
    if (form.password.length < 6)                              { setError("Password must be at least 6 characters"); return; }
    if (form.password !== form.confirmPassword)                 { setError("Passwords do not match"); return; }
    if (role === "seller" && !form.shopName.trim())             { setError("Shop name is required"); return; }
    if (role === "seller" && !form.panNumber.trim())            { setError("PAN number is required"); return; }
    if (!form.name.trim())                                      { setError("Name is required"); return; }

    setIsSubmitting(true);
    try {
      // Check email uniqueness
      const exists = await checkEmailExists(form.email);
      if (exists) { setError("Email already registered"); setIsSubmitting(false); return; }

      // Geocode address for lat/lon
      const geocodeQuery = [form.address, form.city, form.state, form.pincode, "India"].filter(Boolean).join(", ");
      const coords = await forwardGeocode(geocodeQuery);

      // Build user data
      const userData: any = {
        name:           form.name,
        email:          form.email.toLowerCase().trim(),
        password:       form.password,
        role,
        phone:          form.phone.replace(/[^0-9]/g, ""),
        alternatePhone: form.alternatePhone ? form.alternatePhone.replace(/[^0-9]/g, "") : undefined,
        location:       form.address,
        area:           form.area,
        city:           form.city,
        latitude:       coords?.lat ?? null,
        longitude:      coords?.lon ?? null,
        address:        { state: form.state, pincode: form.pincode },
      };

      if (role === "buyer") {
        userData.companyName = form.companyName.trim() || undefined;
      } else {
        userData.gstNumber      = form.gstNumber.trim() || undefined;
        userData.panNumber      = form.panNumber.trim();
        userData.shopName       = form.shopName.trim();
        userData.shopLatitude   = coords?.lat ?? null;
        userData.shopLongitude  = coords?.lon ?? null;
      }

      // Register (creates Firebase Auth user + Firestore doc + shop if seller)
      const newUser = await register(userData);

      // Upload profile picture if selected
      if (profilePicFile) {
        try {
          const url = await uploadImage(profilePicFile);
          // url is a Cloudinary public URL — attach it to userData if needed
          userData.profilePicture = url;
          toast.success("Profile picture uploaded!");
        } catch {
          // Non-fatal — continue without profile pic
        }
      }

      toast.success(`${role === "buyer" ? "Buyer" : "Seller"} account created!`);
      setSubmitted(true);
    } catch (err: any) {
      const msg = err.message || "Registration failed. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-foreground mb-2">Registration Successful!</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Your {role} account has been created. Sign in to continue.
          </p>
          <button
            onClick={() => navigate(`/login?role=${role}`)}
            className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>

        <div className="flex items-center gap-2 mb-8">
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-foreground font-semibold text-xl">
            CEM<span className="text-blue-600">XPRESS</span>
          </span>
        </div>

        <h1 className="text-foreground mb-2">Create Account</h1>
        <p className="text-muted-foreground text-sm mb-8">Join CEMXPRESS and start building smarter</p>

        {/* Role toggle */}
        <div className="flex gap-2 p-1 bg-muted rounded-xl mb-8">
          <button
            onClick={() => setRole("buyer")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${role === "buyer" ? "bg-card text-blue-600 shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <User className="w-4 h-4" /> Register as Buyer
          </button>
          <button
            onClick={() => setRole("seller")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${role === "seller" ? "bg-card text-purple-600 shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Package className="w-4 h-4" /> Register as Seller
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {gpsStatus === "done" && form.area && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-xl text-xs text-green-700 dark:text-green-400">
              <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
              Location auto-detected: <strong className="ml-0.5">{form.area}{form.city ? `, ${form.city}` : ""}</strong>
            </div>
          )}
          {gpsStatus === "denied" && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl text-xs text-amber-700 dark:text-amber-400">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              GPS denied — please fill in your address manually
            </div>
          )}

          {/* Name / Shop name */}
          <div>
            <label className="block text-sm text-foreground mb-1.5">
              {role === "buyer" ? "Full Name" : "Shop Name"} *
            </label>
            <input
              type="text" required
              value={role === "buyer" ? form.name : form.shopName}
              onChange={(e) => setForm({ ...form, [role === "buyer" ? "name" : "shopName"]: e.target.value })}
              placeholder={role === "buyer" ? "Your full name" : "e.g. Suresh Building Materials"}
              className="w-full px-4 py-3 border border-border rounded-xl bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm text-foreground mb-1.5">Email Address *</label>
            <input
              type="email" required value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              className="w-full px-4 py-3 border border-border rounded-xl bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-foreground mb-1.5">Phone Number *</label>
              <input
                type="tel" required value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 9876543210"
                className="w-full px-4 py-3 border border-border rounded-xl bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm text-foreground mb-1.5">Alternate Phone</label>
              <input
                type="tel" value={form.alternatePhone}
                onChange={(e) => setForm({ ...form, alternatePhone: e.target.value })}
                placeholder="+91 9876543210"
                className="w-full px-4 py-3 border border-border rounded-xl bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm text-foreground">
                {role === "buyer" ? "Your Location" : "Shop Location"} *
              </label>
              <button
                type="button" onClick={handleDetectGPS} disabled={gpsStatus === "loading"}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/60 text-blue-600 dark:text-blue-400 rounded-lg text-xs hover:bg-blue-100 transition-colors disabled:opacity-60"
              >
                {gpsStatus === "loading" ? <Loader2 className="w-3 h-3 animate-spin" /> : gpsStatus === "done" ? <CheckCircle className="w-3 h-3 text-green-500" /> : <Crosshair className="w-3 h-3" />}
                {gpsStatus === "loading" ? "Detecting…" : "Use GPS"}
              </button>
            </div>
            <input
              type="text" required value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder={role === "buyer" ? "e.g. Andheri West, Mumbai" : "e.g. Shop No. 12, Goregaon East"}
              className="w-full px-4 py-3 border border-border rounded-xl bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text" value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                placeholder="State (e.g. Maharashtra)"
                className="w-full px-4 py-3 border border-border rounded-xl bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all text-sm"
              />
              <input
                type="text" value={form.pincode}
                onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                placeholder="Pincode"
                className="w-full px-4 py-3 border border-border rounded-xl bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all text-sm"
              />
            </div>
          </div>

          {/* Role-specific */}
          {role === "buyer" ? (
            <div>
              <label className="block text-sm text-foreground mb-1.5">Company Name (Optional)</label>
              <input
                type="text" value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                placeholder="e.g. ABC Construction Co."
                className="w-full px-4 py-3 border border-border rounded-xl bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
              />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm text-foreground mb-1.5">Owner Name *</label>
                <input
                  type="text" required value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your full name"
                  className="w-full px-4 py-3 border border-border rounded-xl bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-foreground mb-1.5">GST Number (Optional)</label>
                  <input
                    type="text" value={form.gstNumber}
                    onChange={(e) => setForm({ ...form, gstNumber: e.target.value })}
                    placeholder="27AAACG1234A1Z5"
                    className="w-full px-4 py-3 border border-border rounded-xl bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm text-foreground mb-1.5">PAN Number *</label>
                  <input
                    type="text" required value={form.panNumber}
                    onChange={(e) => setForm({ ...form, panNumber: e.target.value })}
                    placeholder="AAACG1234A"
                    className="w-full px-4 py-3 border border-border rounded-xl bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            </>
          )}

          {/* Password */}
          <div>
            <label className="block text-sm text-foreground mb-1.5">Password *</label>
            <input
              type="password" required value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="At least 6 characters"
              className="w-full px-4 py-3 border border-border rounded-xl bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm text-foreground mb-1.5">Confirm Password *</label>
            <input
              type="password" required value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              placeholder="Re-enter your password"
              className="w-full px-4 py-3 border border-border rounded-xl bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Profile picture */}
          <div className="relative">
            <label className="block text-sm text-foreground mb-1.5">Profile Picture (Optional)</label>
            <input
              type="file" accept="image/*"
              onChange={handleProfilePictureUpload}
              className="absolute top-6 left-0 w-full h-12 opacity-0 cursor-pointer"
            />
            <div className="w-full px-4 py-3 border border-border rounded-xl bg-card flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              <Upload className="w-5 h-5 mr-2" /> Upload
            </div>
            {profilePicPreview && (
              <div className="mt-2">
                <img src={profilePicPreview} alt="Profile" className="w-20 h-20 rounded-full object-cover" />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 transition-all mt-2 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</> : `Create ${role === "buyer" ? "Buyer" : "Seller"} Account`}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <button onClick={() => navigate(`/login?role=${role}`)} className="text-blue-600 hover:text-blue-700 font-medium">
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
}