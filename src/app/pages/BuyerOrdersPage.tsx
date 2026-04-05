import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import {
  ArrowLeft, ShoppingCart, Clock, CheckCircle, Package,
  Truck, Banknote, MapPin, Search, X, ChevronDown, ChevronUp,
  Phone, Store, IndianRupee,
} from "lucide-react";
import { getOrdersForBuyer, Order } from "../services/firebaseService";

type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "payment_received";

const STATUS_STEPS: { key: OrderStatus; label: string; icon: React.ReactNode }[] = [
  { key: "pending",          label: "Order Placed",      icon: <ShoppingCart className="w-4 h-4" /> },
  { key: "confirmed",        label: "Confirmed",         icon: <CheckCircle className="w-4 h-4" /> },
  { key: "shipped",          label: "Shipped",           icon: <Truck className="w-4 h-4" /> },
  { key: "delivered",        label: "Delivered",         icon: <Package className="w-4 h-4" /> },
  { key: "payment_received", label: "Payment Received",  icon: <Banknote className="w-4 h-4" /> },
];

const STATUS_INDEX: Record<string, number> = {
  pending: 0, confirmed: 1, shipped: 2, delivered: 3, payment_received: 4,
};

export default function BuyerOrdersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");

  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      try {
        const data = await getOrdersForBuyer(user.id);
        setOrders(data);
      } catch (err) {
        console.error("Failed to load orders:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id]);

  const filteredOrders = orders.filter((o) => {
    const matchesFilter = filter === "all" || o.status === filter;
    if (!matchesFilter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.materialName?.toLowerCase().includes(q) ||
      o.shopName?.toLowerCase().includes(q) ||
      o.status?.toLowerCase().includes(q)
    );
  });

  const formatDate = (ts: any) => {
    if (!ts) return "";
    const date = ts?.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":          return "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400";
      case "confirmed":        return "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400";
      case "shipped":          return "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400";
      case "delivered":        return "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400";
      case "payment_received": return "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400";
      default:                 return "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">Loading your orders…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* ── Header ── */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700/60 px-4 sm:px-6 lg:px-8 py-5 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate("/buyer/enquiries")}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex-1">
              <h1 className="text-gray-900 dark:text-gray-100">My Orders</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Track your COD orders in real-time</p>
            </div>
            <div className="px-3 py-1.5 bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 rounded-full text-sm font-medium">
              {filteredOrders.length} Orders
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by material, shop or status..."
              className="w-full pl-10 pr-10 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {([
              { v: "all", l: "All" },
              { v: "pending", l: "Placed" },
              { v: "confirmed", l: "Confirmed" },
              { v: "shipped", l: "Shipped" },
              { v: "delivered", l: "Delivered" },
              { v: "payment_received", l: "Paid" },
            ] as const).map(({ v, l }) => (
              <button
                key={v}
                onClick={() => setFilter(v)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filter === v
                    ? "bg-orange-500 text-white"
                    : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-orange-300"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Orders List ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {filteredOrders.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/60 rounded-2xl p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="w-10 h-10 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-gray-900 dark:text-gray-100 mb-2">No Orders Yet</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Place an order from an accepted enquiry to see it here.
            </p>
            <button
              onClick={() => navigate("/buyer/enquiries")}
              className="px-6 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors"
            >
              View Enquiries
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const isExpanded = expandedId === order.id;
              const statusIdx = STATUS_INDEX[order.status] ?? 0;

              return (
                <div
                  key={order.id}
                  className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/60 rounded-2xl overflow-hidden"
                >
                  {/* Card Header */}
                  <div
                    className="p-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 bg-orange-100 dark:bg-orange-900/40 rounded-lg">
                          <ShoppingCart className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                          <h3 className="text-gray-900 dark:text-gray-100 font-semibold">{order.shopName}</h3>
                          {order.materialName && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1.5 mt-0.5">
                              <Package className="w-3.5 h-3.5" /> {order.materialName}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${getStatusColor(order.status)}`}>
                          {order.status?.replace(/_/g, " ")}
                        </span>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </div>

                    {/* Mini summary */}
                    <div className="flex items-center gap-4 text-sm">
                      {order.quantity && (
                        <span className="text-gray-500 dark:text-gray-400">Qty: <strong className="text-gray-700 dark:text-gray-300">{order.quantity}</strong></span>
                      )}
                      <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400 font-bold">
                        <IndianRupee className="w-3.5 h-3.5" />
                        {order.totalAmount?.toLocaleString("en-IN")}
                        <span className="text-xs font-normal text-gray-400 ml-1">COD</span>
                      </span>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 dark:border-gray-800 px-5 pb-5 pt-4 space-y-5">

                      {/* Progress Stepper */}
                      <div>
                        <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Order Progress</h4>
                        <div className="flex items-start gap-0">
                          {STATUS_STEPS.map((step, idx) => {
                            const done = idx <= statusIdx;
                            const active = idx === statusIdx;
                            return (
                              <React.Fragment key={step.key}>
                                <div className="flex flex-col items-center flex-1">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                                    active
                                      ? "bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-500/30"
                                      : done
                                      ? "bg-green-500 border-green-500 text-white"
                                      : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400"
                                  }`}>
                                    {step.icon}
                                  </div>
                                  <p className={`text-xs mt-1.5 text-center leading-tight ${
                                    active ? "font-bold text-orange-600 dark:text-orange-400"
                                    : done  ? "font-medium text-green-600 dark:text-green-400"
                                    : "text-gray-400 dark:text-gray-500"
                                  }`}>
                                    {step.label}
                                  </p>
                                </div>
                                {idx < STATUS_STEPS.length - 1 && (
                                  <div className={`h-0.5 flex-1 mt-4 ${
                                    idx < statusIdx ? "bg-green-400" : "bg-gray-200 dark:bg-gray-700"
                                  }`} />
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </div>

                      {/* Order Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* COD Amount */}
                        <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40 rounded-xl">
                          <Banknote className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-green-700 dark:text-green-400 font-medium">Cash on Delivery</p>
                            <p className="text-lg font-black text-green-800 dark:text-green-200">
                              ₹{order.totalAmount?.toLocaleString("en-IN")}
                            </p>
                          </div>
                        </div>

                        {/* Seller contact */}
                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                            <Store className="w-3.5 h-3.5" /> Seller
                          </p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{order.shopName}</p>
                          {order.sellerPhone && (
                            <a
                              href={`tel:${order.sellerPhone}`}
                              className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-1 hover:underline"
                            >
                              <Phone className="w-3 h-3" /> {order.sellerPhone}
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Delivery Address */}
                      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-xl">
                        <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" /> Delivery Address
                        </h4>
                        <p className="text-sm text-amber-900 dark:text-amber-200 font-medium">{order.deliveryAddress}</p>
                        {order.notes && (
                          <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">Note: {order.notes}</p>
                        )}
                      </div>

                      {/* Timeline note */}
                      {order.status === "pending" && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40 rounded-xl">
                          <p className="text-xs text-blue-700 dark:text-blue-400">
                            ⏳ Waiting for seller to confirm your order. You'll see the status update here.
                          </p>
                        </div>
                      )}
                      {order.status === "shipped" && (
                        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/40 rounded-xl">
                          <p className="text-xs text-purple-700 dark:text-purple-400">
                            🚚 Your order is on the way! Keep ₹{order.totalAmount?.toLocaleString("en-IN")} ready to pay on delivery.
                          </p>
                        </div>
                      )}
                      {order.status === "delivered" && (
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40 rounded-xl">
                          <p className="text-xs text-green-700 dark:text-green-400">
                            ✅ Order delivered! Please pay ₹{order.totalAmount?.toLocaleString("en-IN")} to the delivery agent.
                          </p>
                        </div>
                      )}
                      {order.status === "payment_received" && (
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl">
                          <p className="text-xs text-emerald-700 dark:text-emerald-400">
                            🎉 Payment received. Order complete! Thank you for your purchase.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}