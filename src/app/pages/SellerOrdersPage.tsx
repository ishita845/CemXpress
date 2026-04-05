import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import {
  ArrowLeft, ShoppingCart, Clock, CheckCircle, Package, Truck,
  Banknote, MapPin, Search, X, ChevronDown, ChevronUp,
  Phone, Mail, User, IndianRupee, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { getOrdersForSeller, updateOrderStatus, Order } from "../services/firebaseService";

type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "payment_received";

interface StatusAction {
  label: string;
  nextStatus: OrderStatus;
  color: string;
  icon: React.ReactNode;
}

const NEXT_ACTION: Record<string, StatusAction> = {
  pending: {
    label: "Confirm Order",
    nextStatus: "confirmed",
    color: "bg-blue-500 hover:bg-blue-600 shadow-blue-500/25",
    icon: <CheckCircle className="w-4 h-4" />,
  },
  confirmed: {
    label: "Mark as Shipped",
    nextStatus: "shipped",
    color: "bg-purple-600 hover:bg-purple-700 shadow-purple-500/25",
    icon: <Truck className="w-4 h-4" />,
  },
  shipped: {
    label: "Mark as Delivered",
    nextStatus: "delivered",
    color: "bg-green-500 hover:bg-green-600 shadow-green-500/25",
    icon: <Package className="w-4 h-4" />,
  },
  delivered: {
    label: "Mark Payment Received",
    nextStatus: "payment_received",
    color: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/25",
    icon: <Banknote className="w-4 h-4" />,
  },
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Order Placed",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  payment_received: "Payment Received",
};

const STATUS_COLOR: Record<string, string> = {
  pending:          "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400",
  confirmed:        "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400",
  shipped:          "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400",
  delivered:        "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400",
  payment_received: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400",
};

export default function SellerOrdersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = async () => {
    if (!user?.id) return;
    try {
      const data = await getOrdersForSeller(user.id);
      setOrders(data);
    } catch (err) {
      console.error("Failed to load orders:", err);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user?.id]);

  const handleStatusUpdate = async (orderId: string, nextStatus: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      await updateOrderStatus(orderId, nextStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
      );
      const msgs: Record<string, string> = {
        confirmed: "Order confirmed! Buyer has been notified.",
        shipped: "Marked as shipped. Buyer notified.",
        delivered: "Marked as delivered. Collect payment from buyer.",
        payment_received: "✅ Payment received. Order complete!",
      };
      toast.success(msgs[nextStatus] || "Status updated");
    } catch (err) {
      toast.error("Failed to update order status");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesFilter = filter === "all" || o.status === filter;
    if (!matchesFilter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.materialName?.toLowerCase().includes(q) ||
      o.buyerName?.toLowerCase().includes(q) ||
      o.status?.toLowerCase().includes(q)
    );
  });

  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const totalCOD = orders
    .filter((o) => o.status === "payment_received")
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const formatDate = (ts: any) => {
    if (!ts) return "";
    const date = ts?.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">Loading orders…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* ── Header ── */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700/60 px-4 sm:px-6 lg:px-8 py-5 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/seller/dashboard")}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-gray-900 dark:text-gray-100 font-bold">Orders</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage COD orders</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {pendingCount > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500 text-white rounded-full text-xs font-bold animate-pulse">
                  <span className="w-1.5 h-1.5 bg-white rounded-full" />
                  {pendingCount} New
                </div>
              )}
              <button
                onClick={load}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Stats strip */}
          {totalCOD > 0 && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl mb-3">
              <Banknote className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm text-emerald-700 dark:text-emerald-400">
                Total collected COD: <strong>₹{totalCOD.toLocaleString("en-IN")}</strong>
              </span>
            </div>
          )}

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by buyer name, material or status..."
              className="w-full pl-10 pr-10 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {([
              { v: "all",              l: "All" },
              { v: "pending",          l: "New" },
              { v: "confirmed",        l: "Confirmed" },
              { v: "shipped",          l: "Shipped" },
              { v: "delivered",        l: "Delivered" },
              { v: "payment_received", l: "Paid" },
            ] as const).map(({ v, l }) => {
              const count = v === "all" ? orders.length : orders.filter((o) => o.status === v).length;
              return (
                <button
                  key={v}
                  onClick={() => setFilter(v)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                    filter === v
                      ? "bg-blue-500 text-white"
                      : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-300"
                  }`}
                >
                  {l}
                  {count > 0 && (
                    <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold ${
                      filter === v ? "bg-white/25 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                    }`}>{count}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Orders ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {filteredOrders.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/60 rounded-2xl p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="w-10 h-10 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-gray-900 dark:text-gray-100 mb-2">No Orders</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {filter !== "all" ? "No orders with this status." : "Accept enquiries to receive orders."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const isExpanded = expandedId === order.id;
              const action = NEXT_ACTION[order.status];
              const isUpdating = updatingId === order.id;

              return (
                <div
                  key={order.id}
                  className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/60 rounded-2xl overflow-hidden"
                >
                  {/* Card summary row */}
                  <div
                    className="p-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                          <ShoppingCart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{order.buyerName}</h3>
                          {order.materialName && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1.5 mt-0.5">
                              <Package className="w-3.5 h-3.5" /> {order.materialName}
                              {order.quantity && <span className="text-gray-400">× {order.quantity}</span>}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{formatDate(order.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${STATUS_COLOR[order.status] || ""}`}>
                          {STATUS_LABEL[order.status] || order.status}
                        </span>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1 font-bold text-blue-700 dark:text-blue-400">
                        <IndianRupee className="w-3.5 h-3.5" />
                        {order.totalAmount?.toLocaleString("en-IN")}
                        <span className="text-xs text-gray-400 font-normal ml-1">COD</span>
                      </span>
                    </div>
                  </div>

                  {/* Expanded */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 dark:border-gray-800 px-5 pb-5 pt-4 space-y-4">

                      {/* COD Highlight */}
                      <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40 rounded-xl">
                        <div className="flex items-center gap-2">
                          <Banknote className="w-5 h-5 text-green-600 dark:text-green-400" />
                          <div>
                            <p className="text-xs font-bold text-green-800 dark:text-green-200">Cash on Delivery</p>
                            <p className="text-xs text-green-700 dark:text-green-400">Collect from buyer at doorstep</p>
                          </div>
                        </div>
                        <p className="text-2xl font-black text-green-700 dark:text-green-300">
                          ₹{order.totalAmount?.toLocaleString("en-IN")}
                        </p>
                      </div>

                      {/* Buyer Info */}
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                        <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Buyer</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2.5">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-900 dark:text-gray-100">{order.buyerName}</span>
                          </div>
                          {order.buyerPhone && (
                            <div className="flex items-center gap-2.5">
                              <Phone className="w-4 h-4 text-gray-400" />
                              <a href={`tel:${order.buyerPhone}`} className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
                                {order.buyerPhone}
                              </a>
                            </div>
                          )}
                          {order.buyerEmail && (
                            <div className="flex items-center gap-2.5">
                              <Mail className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-700 dark:text-gray-300 truncate">{order.buyerEmail}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Delivery Address */}
                      {order.deliveryAddress && (
                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-xl">
                          <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" /> Delivery Address
                          </h4>
                          <p className="text-sm text-amber-900 dark:text-amber-200 font-medium">{order.deliveryAddress}</p>
                          {order.notes && (
                            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1.5">Note: {order.notes}</p>
                          )}
                        </div>
                      )}

                      {/* Order Info */}
                      {(order.materialName || order.quantity || order.unitPrice) && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40 rounded-xl p-4">
                          <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-3">Order Details</h4>
                          <div className="space-y-2">
                            {order.materialName && (
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Material</span>
                                <span className="font-medium text-gray-900 dark:text-gray-100">{order.materialName}</span>
                              </div>
                            )}
                            {order.quantity && (
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Quantity</span>
                                <span className="font-medium text-gray-900 dark:text-gray-100">{order.quantity}</span>
                              </div>
                            )}
                            {order.unitPrice && (
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Unit Price</span>
                                <span className="font-medium text-gray-900 dark:text-gray-100">₹{order.unitPrice.toLocaleString("en-IN")}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-sm font-bold pt-1 border-t border-blue-200 dark:border-blue-800/40">
                              <span className="text-gray-700 dark:text-gray-300">Total (COD)</span>
                              <span className="text-blue-700 dark:text-blue-300">₹{order.totalAmount?.toLocaleString("en-IN")}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ── Action Button ── */}
                      {action && order.status !== "payment_received" && (
                        <button
                          onClick={() => handleStatusUpdate(order.id, action.nextStatus)}
                          disabled={isUpdating}
                          className={`w-full py-4 text-white font-bold rounded-2xl transition-colors shadow-lg flex items-center justify-center gap-2 ${action.color} disabled:opacity-60`}
                        >
                          {isUpdating ? (
                            <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Updating…</>
                          ) : (
                            <>{action.icon} {action.label}</>
                          )}
                        </button>
                      )}

                      {order.status === "payment_received" && (
                        <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl">
                          <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                          <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200">
                            Order complete · Payment of ₹{order.totalAmount?.toLocaleString("en-IN")} received
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