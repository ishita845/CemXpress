import React from "react";
import { createBrowserRouter, RouterProvider, Outlet, Navigate } from "react-router";
import { Navbar } from "./components/Navbar";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Toaster } from "sonner";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import BuyerBrowsePage from "./pages/BuyerBrowsePage";
import BuyerDashboardPage from "./pages/BuyerDashboardPage";
import ShopDetailPage from "./pages/ShopDetailPage";
import SellerDashboard from "./pages/SellerDashboard";
import SellerInventoryPage from "./pages/SellerInventoryPage";
import SellerShopSettings from "./pages/SellerShopSettings";
import AddMaterialPage from "./pages/AddMaterialPage";
import BuyerProfilePage from "./pages/BuyerProfilePage";
import SellerProfilePage from "./pages/SellerProfilePage";
import BuyerEnquiriesPage from "./pages/BuyerEnquiriesPage";
import SellerEnquiriesPage from "./pages/SellerEnquiriesPage";

// Root component that wraps everything with providers
function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Outlet />
          </main>
          <Toaster position="top-right" richColors />
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

function RequireBuyer({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login?role=buyer" replace />;
  if (user?.role !== "buyer") return <Navigate to="/seller/dashboard" replace />;
  return <>{children}</>;
}

function RequireSeller({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login?role=seller" replace />;
  if (user?.role !== "seller") return <Navigate to="/buyer/browse" replace />;
  return <>{children}</>;
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: LandingPage },
      { path: "login", Component: LoginPage },
      { path: "register", Component: RegisterPage },
      {
        path: "buyer",
        children: [
          {
            path: "browse",
            element: (
              <RequireBuyer>
                <BuyerBrowsePage />
              </RequireBuyer>
            ),
          },
          {
            path: "dashboard",
            element: (
              <RequireBuyer>
                <BuyerDashboardPage />
              </RequireBuyer>
            ),
          },
          {
            path: "shop/:shopId",
            element: (
              <RequireBuyer>
                <ShopDetailPage />
              </RequireBuyer>
            ),
          },
          {
            path: "shops",
            element: (
              <RequireBuyer>
                <BuyerBrowsePage />
              </RequireBuyer>
            ),
          },
          {
            path: "profile",
            element: (
              <RequireBuyer>
                <BuyerProfilePage />
              </RequireBuyer>
            ),
          },
          {
            path: "enquiries",
            element: (
              <RequireBuyer>
                <BuyerEnquiriesPage />
              </RequireBuyer>
            ),
          },
        ],
      },
      {
        path: "seller",
        children: [
          {
            path: "dashboard",
            element: (
              <RequireSeller>
                <SellerDashboard />
              </RequireSeller>
            ),
          },
          {
            path: "inventory",
            element: (
              <RequireSeller>
                <SellerInventoryPage />
              </RequireSeller>
            ),
          },
          {
            path: "shop-settings",
            element: (
              <RequireSeller>
                <SellerShopSettings />
              </RequireSeller>
            ),
          },
          {
            path: "add-material",
            element: (
              <RequireSeller>
                <AddMaterialPage />
              </RequireSeller>
            ),
          },
          {
            path: "profile",
            element: (
              <RequireSeller>
                <SellerProfilePage />
              </RequireSeller>
            ),
          },
          {
            path: "enquiries",
            element: (
              <RequireSeller>
                <SellerEnquiriesPage />
              </RequireSeller>
            ),
          },
        ],
      },
    ],
  },
]);