import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useAuth } from "../context/AuthContext";
import { Building2, Eye, EyeOff, ArrowLeft, AlertCircle, Package } from "lucide-react";

export default function LoginPage() {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultRole = searchParams.get("role") === "seller" ? "seller" : "buyer";

  const [role, setRole] = useState<"buyer" | "seller">(defaultRole as "buyer" | "seller");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Role-based redirection
      const redirectPath = user.role === "buyer" ? "/buyer/dashboard" : "/seller/dashboard";
      console.log("✅ User authenticated, redirecting to:", redirectPath, "User:", {
        email: user.email,
        role: user.role,
        shopId: user.shopId
      });
      navigate(redirectPath);
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password, role);
      // Navigation handled by the useEffect watching isAuthenticated
    } catch (err: any) {
      const code = err?.code || "";
      if (code === "auth/user-not-found" || code === "auth/invalid-credential" || code === "auth/invalid-login-credentials") {
        setError("No account found with this email, or incorrect password.");
      } else if (code === "auth/wrong-password") {
        setError("Incorrect password. Please try again.");
      } else if (code === "auth/too-many-requests") {
        setError("Too many failed attempts. Please wait a moment and try again.");
      } else if (err?.message?.includes("registered as a")) {
        setError(err.message);
      } else {
        setError("Sign in failed. Please check your credentials and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Remove demo autofill - use real registered accounts
  const fillDemo = () => { setError("Please use your registered account credentials."); };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1679797870465-b4eda40ead96?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25zdHJ1Y3Rpb24lMjB3b3JrZXIlMjBidWlsZGVyJTIwY29udHJhY3RvcnxlbnwxfHx8fDE3NzI1MzcyNzB8MA&ixlib=rb-4.1.0&q=80&w=1080"
            alt=""
            className="w-full h-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900/80 to-blue-900/30" />
        </div>
<div className="relative">
  <div
    className="flex items-center gap-2 cursor-pointer"
    onClick={() => navigate("/")}
  >
    <span
      className="text-3xl font-semibold tracking-wide"
      style={{ fontFamily: "Times New Roman, serif" }}
    >
      <span className="text-blue-600 dark:text-blue-400">CEM</span>

      <span className="text-purple-600 dark:text-purple-400 text-4xl mx-0.5">
        X
      </span>

      <span className="text-blue-600 dark:text-blue-400">PRESS</span>
    </span>
  </div>
</div>
        <div className="relative">
          <h2 className="text-4xl text-white mb-4 leading-snug">
            {role === "buyer"
              ? "Less Searching. More Building."
              : "Grow Your Business with CemXpress"}
          </h2>
          <p className="text-gray-300 text-base leading-relaxed mb-8">
            {role === "buyer"
              ? "Find nearby materials, check stock instantly, and pick the best price.."
              : "List your inventory, set prices, and get discovered by thousands of contractors in your area."}
          </p>
          <div className="space-y-3">
            {(role === "buyer"
              ? ["Real-time stock visibility", "Location-based shop discovery", "Price comparison across sellers"]
              : ["Dedicated seller dashboard", "Inventory & stock management", "Direct buyer enquiries"]
            ).map((point) => (
              <div key={point} className="flex items-center gap-3 text-gray-300">
                <div className="w-5 h-5 bg-blue-900/20 border border-blue-500/40 rounded-full flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 bg-blue-400 rounded-full" />
                </div>
                <span className="text-sm">{point}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative text-gray-500 text-xs">
          @CemXpress
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-12 bg-white dark:bg-gray-950">
        <div className="w-full max-w-md">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>

          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="bg-blue-500 p-1.5 rounded-lg">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-gray-900 dark:text-gray-100 font-semibold text-xl">CEM<span className="text-blue-500">XPRESS</span></span>
          </div>

          <h1 className="text-gray-900 dark:text-gray-100 mb-2">Welcome Back</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">Sign in to your account to continue</p>

          {/* Role Toggle */}
          <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-8">
            <button
              onClick={() => { setRole("buyer"); setError(""); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                role === "buyer"
                  ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              <Building2 className="w-4 h-4" />
              Buyer
            </button>
            <button
              onClick={() => { setRole("seller"); setError(""); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                role === "seller"
                  ? "bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              <Package className="w-4 h-4" />
              Seller
            </button>
          </div>



          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/60 rounded-xl text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 pr-12 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer text-gray-600 dark:text-gray-400">
                <input type="checkbox" className="rounded" />
                Remember me
              </label>
              <button type="button" className="text-blue-500 hover:text-purple-600">
                Forgot password?
              </button>
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 rounded-xl font-medium text-white transition-all ${
                role === "buyer"
                  ? "bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/25"
                  : "bg-purple-600 hover:bg-purple-700 shadow-lg shadow-blue-500/25"
              } disabled:opacity-60`}
            >
              {loading ? "Signing in..." : `Sign In as ${role === "buyer" ? "Buyer" : "Seller"}`}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            Don't have an account?{" "}
            <button
              onClick={() => navigate("/register")}
              className="text-blue-500 hover:text-blue-600 font-medium"
            >
              Create one free
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}