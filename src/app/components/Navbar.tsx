import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  Building2, Menu, X, MapPin,
  Bell, ChevronDown, LogOut, User, LayoutDashboard, Moon, Sun,
} from "lucide-react";

export function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const { isDark, toggleDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
    setProfileOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700/60 sticky top-0 z-50 shadow-sm dark:shadow-gray-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
<div className="flex items-center gap-2">
  <div
    className="flex items-center gap-2 cursor-pointer"
    onClick={() => navigate("/")}
  >
    <span
      className="text-xl font-bold tracking-wide"
      style={{ fontFamily: "Times New Roman, serif" }}
    >
      <span className="text-blue-900 dark:text-blue-300">CEM</span>

      <span className="text-purple-900 dark:text-purple-800 text-3xl mx-0.5">
        X
      </span>

      <span className="text-blue-900 dark:text-blue-300">PRESS</span>
    </span>
  </div>
</div>

          {/* Desktop Nav Links */}
          {isAuthenticated && user?.role === "buyer" && (
            <div className="hidden md:flex items-center gap-1">
              <NavLink active={isActive("/buyer/dashboard")} onClick={() => navigate("/buyer/dashboard")}>Dashboard</NavLink>
              <NavLink active={isActive("/buyer/browse")} onClick={() => navigate("/buyer/browse")}>Browse Materials</NavLink>
              <NavLink active={isActive("/buyer/shops")} onClick={() => navigate("/buyer/shops")}>Nearby Shops</NavLink>
              <NavLink active={isActive("/buyer/enquiries")} onClick={() => navigate("/buyer/enquiries")}>Enquiries</NavLink>
            </div>
          )}
          {isAuthenticated && user?.role === "seller" && (
            <div className="hidden md:flex items-center gap-1">
              <NavLink active={isActive("/seller/dashboard")} onClick={() => navigate("/seller/dashboard")}>Dashboard</NavLink>
              <NavLink active={isActive("/seller/inventory")} onClick={() => navigate("/seller/inventory")}>Inventory</NavLink>
              <NavLink active={isActive("/seller/enquiries")} onClick={() => navigate("/seller/enquiries")}>Enquiries</NavLink>
            </div>
          )}

          {/* Right Side */}
          <div className="flex items-center gap-2">
            {/* Dark mode toggle */}
            <button
              onClick={toggleDark}
              className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle dark mode"
            >
              {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>

            {isAuthenticated ? (
              <>
                {user?.role === "buyer" && (
                  <div className="hidden md:flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-full border border-gray-200 dark:border-gray-700">
                    <MapPin className="w-3.5 h-3.5 text-blue-500" />
                    <span className="max-w-[140px] truncate">{user.location}</span>
                  </div>
                )}
                <button className="relative p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
                </button>
                {/* Profile dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                      {user?.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden md:block text-sm text-gray-700 dark:text-gray-300 max-w-[100px] truncate">
                      {user?.name.split(" ")[0]}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-400 hidden md:block" />
                  </button>
                  {profileOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                      <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg dark:shadow-gray-900/50 py-1 z-50">
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user?.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                          <span className="inline-flex items-center mt-1 px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 capitalize">
                            {user?.role}
                          </span>
                        </div>
                        <button
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          onClick={() => { setProfileOpen(false); navigate(user?.role === "buyer" ? "/buyer/profile" : "/seller/profile"); }}
                        >
                          <User className="w-4 h-4" /> My Profile
                        </button>
                        <button
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          onClick={() => { setProfileOpen(false); navigate(user?.role === "buyer" ? "/buyer/enquiries" : "/seller/enquiries"); }}
                        >
                          <Bell className="w-4 h-4" /> My Enquiries
                        </button>
                        <button
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          onClick={() => { setProfileOpen(false); navigate(user?.role === "buyer" ? "/buyer/dashboard" : "/seller/dashboard"); }}
                        >
                          <LayoutDashboard className="w-4 h-4" /> Dashboard
                        </button>
                        <button
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={handleLogout}
                        >
                          <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate("/login")}
                  className="hidden md:block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate("/register")}
                  className="px-4 py-2 text-sm bg-blue-900 text-white rounded-lg hover:bg-blue-300 transition-colors shadow-sm"
                >
                  Get Started
                </button>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 dark:border-gray-700 py-2 space-y-1 pb-3">
            {isAuthenticated && user?.role === "buyer" && (
              <>
                <MobileNavLink onClick={() => { navigate("/buyer/dashboard"); setMenuOpen(false); }}>Dashboard</MobileNavLink>
                <MobileNavLink onClick={() => { navigate("/buyer/browse"); setMenuOpen(false); }}>Browse Materials</MobileNavLink>
                <MobileNavLink onClick={() => { navigate("/buyer/shops"); setMenuOpen(false); }}>Nearby Shops</MobileNavLink>
                <MobileNavLink onClick={() => { navigate("/buyer/enquiries"); setMenuOpen(false); }}>Enquiries</MobileNavLink>
              </>
            )}
            {isAuthenticated && user?.role === "seller" && (
              <>
                <MobileNavLink onClick={() => { navigate("/seller/dashboard"); setMenuOpen(false); }}>Dashboard</MobileNavLink>
                <MobileNavLink onClick={() => { navigate("/seller/inventory"); setMenuOpen(false); }}>Inventory</MobileNavLink>
                <MobileNavLink onClick={() => { navigate("/seller/enquiries"); setMenuOpen(false); }}>Enquiries</MobileNavLink>
              </>
            )}
            {!isAuthenticated && (
              <>
                <MobileNavLink onClick={() => { navigate("/login"); setMenuOpen(false); }}>Sign In</MobileNavLink>
                <MobileNavLink onClick={() => { navigate("/register"); setMenuOpen(false); }}>Get Started</MobileNavLink>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

function NavLink({ children, active, onClick }: { children: React.ReactNode; active?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-lg text-sm transition-colors ${
        active
          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium"
          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800"
      }`}
    >
      {children}
    </button>
  );
}

function MobileNavLink({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
    >
      {children}
    </button>
  );
}
