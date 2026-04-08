import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Package, Plus, CheckCircle, AlertTriangle, Settings, MapPin, Star, Clock,
  MessageCircle, Phone, Mail, X, UserIcon, Activity, TrendingUp, ShoppingBag,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  getShopBySellerId, getMaterialsByShopId, getEnquiriesForSeller,
  updateEnquiryStatus, getReviewsForShop,
  Shop, Material, Enquiry,
} from "../services/firebaseService";
import { toast } from "sonner";
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";

// Animated counter hook
function useCountUp(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

function StatCard({ stat, index }: { stat: any; index: number }) {
  const count = useCountUp(stat.value);
  return (
    <div className="s-stat-card" style={{ animationDelay: `${index * 120}ms` }}>
      <div className="s-stat-icon" style={{ background: stat.gradient }}>
        {stat.icon}
        <div className="s-icon-glow" style={{ background: stat.gradient }} />
      </div>
      <div className="s-stat-value">{count}</div>
      <div className="s-stat-label">{stat.label}</div>
      <div className="s-card-shine" />
    </div>
  );
}

export default function SellerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [shop, setShop] = useState<Shop | undefined>(undefined);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    const loadData = async () => {
      try {
        const [userShop, sellerEnquiries] = await Promise.all([
          getShopBySellerId(user.id),
          getEnquiriesForSeller(user.id).catch(() => []),
        ]);
        setShop(userShop || undefined);
        setEnquiries(sellerEnquiries);
        if (userShop) {
          const [mats, revs] = await Promise.all([
            getMaterialsByShopId(userShop.id),
            getReviewsForShop(userShop.id).catch(() => []),
          ]);
          setMaterials(mats);
          setReviews(revs);
        }
      } catch (err) {
        console.error("Dashboard load error:", err);
      }
    };
    loadData();
  }, [user?.id]);

  const handleStatusUpdate = async (enquiryId: string, status: "accepted" | "rejected") => {
    try {
      await updateEnquiryStatus(enquiryId, status);
      setEnquiries((prev) => prev.map((e) => e.id === enquiryId ? { ...e, status } : e));
      setSelectedEnquiry(null);
      toast.success(`Enquiry ${status === "accepted" ? "accepted" : "rejected"}`);
    } catch (err) {
      toast.error("Failed to update enquiry status");
    }
  };

  const inStockCount = materials.filter((m) => m.inStock).length;
  const lowStockCount = materials.filter((m) => m.inStock && m.stockQty < 100).length;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyEnquiries = enquiries.filter((e) => {
    const ts = e.createdAt as any;
    const enquiryDate = ts?.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    return enquiryDate.getMonth() === currentMonth && enquiryDate.getFullYear() === currentYear;
  });

  const recentEnquiries = enquiries.slice(0, 4);

  const enquiryStatusData = [
    { name: "Pending", value: enquiries.filter(e => e.status === "pending").length, color: "#f97316" },
    { name: "Accepted", value: enquiries.filter(e => e.status === "accepted").length, color: "#10b981" },
    { name: "Rejected", value: enquiries.filter(e => e.status === "rejected").length, color: "#6b7280" },
  ].filter(item => item.value > 0);

  const inventoryData = [
    { name: "Total", value: materials.length },
    { name: "Enquiries", value: enquiries.length },
    { name: "Accepted", value: enquiries.filter(e => e.status === "accepted").length },
    { name: "Rejected", value: enquiries.filter(e => e.status === "rejected").length },
    { name: "Pending", value: enquiries.filter(e => e.status === "pending").length },
  ];

  const statusColors: Record<string, string> = {
    pending: "s-badge-orange",
    accepted: "s-badge-green",
    rejected: "s-badge-gray",
  };

  const getStatusLabel = (status: string) => {
    if (!status) return "Unknown";
    return status === "pending" ? "New" : status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getTimeAgo = (dateString: any) => {
    const now = new Date();
    const date = dateString?.seconds ? new Date(dateString.seconds * 1000) : new Date(dateString);
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  const stats = [
    { label: "Total Products", value: materials.length, icon: <Package className="w-5 h-5 text-white" />, gradient: "linear-gradient(135deg,#4facfe,#00f2fe)" },
    { label: "In Stock", value: inStockCount, icon: <CheckCircle className="w-5 h-5 text-white" />, gradient: "linear-gradient(135deg,#11998e,#38ef7d)" },
    { label: "Out of Stock", value: materials.length - inStockCount, icon: <AlertTriangle className="w-5 h-5 text-white" />, gradient: "linear-gradient(135deg,#f5576c,#f093fb)" },
    { label: "Enquiries (Month)", value: monthlyEnquiries.length, icon: <ShoppingBag className="w-5 h-5 text-white" />, gradient: "linear-gradient(135deg,#667eea,#764ba2)" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');

        .seller-dash * { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; }

        .seller-dash {
          --sd-bg: linear-gradient(180deg, #f8fbff 0%, #eef4ff 35%, #ffffff 70%, #f7fbff 100%);
          --sd-panel: rgba(255,255,255,0.78);
          --sd-card: rgba(255,255,255,0.82);
          --sd-card-alt: rgba(248,250,252,0.92);
          --sd-border: rgba(148,163,184,0.18);
          --sd-grid: rgba(37,99,235,0.06);
          --sd-text: #0f172a;
          --sd-soft: rgba(15,23,42,0.72);
          --sd-faint: rgba(15,23,42,0.5);
          --sd-shadow: 0 18px 60px rgba(37,99,235,0.08);
          min-height: 100vh;
          background: var(--sd-bg);
          position: relative;
          overflow-x: hidden;
        }

        .dark .seller-dash {
          --sd-bg: #07060f;
          --sd-panel: rgba(7,6,15,0.88);
          --sd-card: rgba(255,255,255,0.035);
          --sd-card-alt: rgba(255,255,255,0.03);
          --sd-border: rgba(255,255,255,0.07);
          --sd-grid: rgba(255,255,255,0.025);
          --sd-text: #ffffff;
          --sd-soft: rgba(255,255,255,0.75);
          --sd-faint: rgba(255,255,255,0.45);
          --sd-shadow: 0 20px 60px rgba(0,0,0,0.5);
        }

        .seller-dash::before {
          content: '';
          position: fixed;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 15% 5%, rgba(16,185,129,0.14) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 85% 85%, rgba(102,126,234,0.12) 0%, transparent 60%),
            radial-gradient(ellipse 70% 40% at 50% 40%, rgba(249,115,22,0.07) 0%, transparent 60%);
          pointer-events: none;
          z-index: 0;
        }

        .s-orb {
          position: fixed; border-radius: 50%;
          filter: blur(90px); pointer-events: none; z-index: 0;
          animation: sOrbFloat 14s ease-in-out infinite;
        }
        .s-orb-1 { width: 500px; height: 500px; background: rgba(16,185,129,0.1); top: -120px; left: -80px; }
        .s-orb-2 { width: 450px; height: 450px; background: rgba(102,126,234,0.09); bottom: -100px; right: -100px; animation-delay: -5s; }
        .s-orb-3 { width: 350px; height: 350px; background: rgba(249,115,22,0.07); top: 40%; left: 40%; animation-delay: -9s; }

        @keyframes sOrbFloat {
          0%,100% { transform: translate(0,0) scale(1); }
          33% { transform: translate(-25px,35px) scale(1.04); }
          66% { transform: translate(20px,-20px) scale(0.97); }
        }

        .s-grid-overlay {
          position: fixed; inset: 0;
          background-image: linear-gradient(var(--sd-grid) 1px, transparent 1px), linear-gradient(90deg, var(--sd-grid) 1px, transparent 1px);
          background-size: 44px 44px;
          pointer-events: none; z-index: 0;
        }

        /* Header */
        .s-header {
          position: relative; z-index: 10;
          border-bottom: 1px solid var(--sd-border);
          background: var(--sd-panel);
          backdrop-filter: blur(20px);
          padding: 20px 32px;
          animation: sSlideDown 0.6s cubic-bezier(0.16,1,0.3,1) both;
        }

        @keyframes sSlideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .s-header-inner { max-width: 1280px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; }

        .s-header-title {
          font-size: 24px; font-weight: 800; margin: 0;
          background: linear-gradient(135deg, #0f172a 0%, #2563eb 55%, #10b981 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }

        .s-header-sub { font-size: 13px; color: var(--sd-faint); margin-top: 2px; }
        .s-header-sub span { color: rgba(110,231,183,0.9); font-weight: 600; }

        .s-btn-outline {
          display: flex; align-items: center; gap: 8px;
          padding: 9px 18px; border: 1px solid rgba(255,255,255,0.09);
          border-radius: 12px; font-size: 13px; font-weight: 500;
          color: var(--sd-soft); background: var(--sd-card-alt);
          cursor: pointer; transition: all 0.2s ease; backdrop-filter: blur(10px);
        }
        .s-btn-outline:hover { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.18); color: var(--sd-text); transform: translateY(-1px); }

        .s-btn-primary {
          display: flex; align-items: center; gap: 8px;
          padding: 9px 18px; border-radius: 12px;
          font-size: 13px; font-weight: 600; color: var(--sd-text);
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border: none; cursor: pointer; transition: all 0.2s ease;
          box-shadow: 0 4px 20px rgba(16,185,129,0.3);
        }
        .s-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(16,185,129,0.5); }

        /* Body */
        .s-body { position: relative; z-index: 1; max-width: 1280px; margin: 0 auto; padding: 32px; }

        /* Stats */
        .s-stats-grid {
          display: grid; grid-template-columns: repeat(2,1fr);
          gap: 16px; margin-bottom: 28px;
        }
        @media(min-width:1024px) { .s-stats-grid { grid-template-columns: repeat(4,1fr); } }

        .s-stat-card {
          position: relative;
          background: var(--sd-card-alt);
          border: 1px solid var(--sd-border);
          border-radius: 20px; padding: 22px; overflow: hidden;
          animation: sFadeInUp 0.7s cubic-bezier(0.16,1,0.3,1) both;
          transition: transform 0.3s, box-shadow 0.3s, border-color 0.3s;
          cursor: default;
        }
        .s-stat-card:hover { transform: translateY(-5px); box-shadow: var(--sd-shadow); border-color: rgba(255,255,255,0.13); }

        @keyframes sFadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .s-stat-icon {
          position: relative; width: 44px; height: 44px;
          border-radius: 14px; display: flex; align-items: center; justify-content: center;
          margin-bottom: 16px;
        }
        .s-icon-glow { position: absolute; inset: -4px; border-radius: 18px; opacity: 0.25; filter: blur(12px); z-index: -1; }
        .s-stat-value { font-size: 32px; font-weight: 800; color: var(--sd-text); line-height: 1; margin-bottom: 4px; font-family: 'DM Mono', monospace; }
        .s-stat-label { font-size: 12px; color: var(--sd-faint); font-weight: 500; }
        .s-card-shine { position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255,255,255,0.035) 0%, transparent 50%); border-radius: 20px; pointer-events: none; }

        /* Grid */
        .s-content-grid { display: grid; gap: 24px; }
        @media(min-width:1024px) { .s-content-grid { grid-template-columns: 1fr 1fr 1fr; } }
        .s-main-col { display: flex; flex-direction: column; gap: 20px; }
        @media(min-width:1024px) { .s-main-col { grid-column: span 2; } }

        /* Glass card */
        .s-glass-card {
          background: var(--sd-card-alt);
          border: 1px solid var(--sd-border);
          border-radius: 20px; padding: 24px;
          animation: sFadeInUp 0.7s cubic-bezier(0.16,1,0.3,1) both;
          transition: border-color 0.3s;
        }
        .s-glass-card:hover { border-color: rgba(255,255,255,0.1); }

        .s-sec-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
        .s-sec-title { font-size: 15px; font-weight: 700; color: var(--sd-text); }
        .s-view-all { font-size: 12px; font-weight: 600; color: rgba(110,231,183,0.8); background: none; border: none; cursor: pointer; transition: color 0.2s; padding: 0; }
        .s-view-all:hover { color: rgba(110,231,183,1); }

        /* Enquiry rows */
        .s-enq-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 16px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 14px;
          cursor: pointer; width: 100%; text-align: left;
          transition: all 0.2s ease;
          animation: sFadeInLeft 0.5s ease both;
        }
        .s-enq-row:hover { background: rgba(255,255,255,0.05); border-color: rgba(16,185,129,0.2); transform: translateX(3px); }

        @keyframes sFadeInLeft {
          from { opacity: 0; transform: translateX(-16px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .s-enq-avatar {
          width: 38px; height: 38px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 14px; color: var(--sd-text);
          background: linear-gradient(135deg, #10b981, #059669);
          flex-shrink: 0;
        }

        .s-enq-name { font-size: 13px; font-weight: 600; color: var(--sd-text); }
        .s-enq-sub { font-size: 11px; color: var(--sd-faint); margin-top: 2px; }
        .s-enq-date { font-size: 11px; color: var(--sd-faint); }

        /* Badges */
        .s-badge { padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
        .s-badge-orange { background: rgba(249,115,22,0.15); color: rgba(249,115,22,1); border: 1px solid rgba(249,115,22,0.2); }
        .s-badge-green { background: rgba(16,185,129,0.12); color: rgba(16,185,129,1); border: 1px solid rgba(16,185,129,0.2); }
        .s-badge-gray { background: rgba(107,114,128,0.12); color: rgba(156,163,175,1); border: 1px solid rgba(107,114,128,0.2); }

        /* Review card */
        .s-review-card {
          padding: 16px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 14px;
          transition: all 0.2s ease;
        }
        .s-review-card:hover { border-color: rgba(251,191,36,0.2); background: var(--sd-card-alt); }

        /* Empty state */
        .s-empty { text-align: center; padding: 40px 20px; }
        .s-empty-icon {
          width: 56px; height: 56px; border-radius: 50%;
          background: var(--sd-card-alt);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 12px;
          color: rgba(255,255,255,0.2);
        }
        .s-empty-text { font-size: 13px; color: var(--sd-faint); }
        .s-empty-sub { font-size: 11px; color: rgba(255,255,255,0.2); margin-top: 6px; }

        /* Shop card */
        .s-shop-card {
          background: var(--sd-card-alt);
          border: 1px solid var(--sd-border);
          border-radius: 20px; overflow: hidden;
          animation: sFadeInUp 0.7s cubic-bezier(0.16,1,0.3,1) both;
          transition: border-color 0.3s;
        }
        .s-shop-card:hover { border-color: rgba(255,255,255,0.1); }

        .s-shop-img { width: 100%; height: 120px; object-fit: cover; }

        .s-shop-body { padding: 18px; }
        .s-shop-name { font-size: 14px; font-weight: 700; color: var(--sd-text); }
        .s-shop-detail { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--sd-faint); }

        .s-settings-btn {
          padding: 6px; border-radius: 8px; border: none;
          background: var(--sd-card-alt); color: rgba(255,255,255,0.5);
          cursor: pointer; transition: all 0.2s;
        }
        .s-settings-btn:hover { background: rgba(255,255,255,0.1); color: var(--sd-text); }

        .s-open-badge { display: flex; align-items: center; gap: 5px; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; }
        .s-open { background: rgba(16,185,129,0.12); color: rgba(16,185,129,1); border: 1px solid rgba(16,185,129,0.2); }
        .s-closed { background: rgba(245,87,108,0.12); color: rgba(245,87,108,1); border: 1px solid rgba(245,87,108,0.2); }

        .s-edit-shop-btn {
          padding: 4px 14px; border-radius: 20px; font-size: 11px; font-weight: 600;
          border: 1px solid rgba(110,231,183,0.25); color: rgba(110,231,183,0.9);
          background: rgba(16,185,129,0.08); cursor: pointer; transition: all 0.2s;
        }
        .s-edit-shop-btn:hover { background: rgba(16,185,129,0.18); border-color: rgba(110,231,183,0.4); color: var(--sd-text); }

        /* Low stock alert */
        .s-alert-card {
          background: rgba(245,87,108,0.07);
          border: 1px solid rgba(245,87,108,0.18);
          border-radius: 16px; padding: 18px;
          animation: sFadeInUp 0.7s ease both;
        }
        .s-alert-title { font-size: 13px; font-weight: 700; color: rgba(245,87,108,0.9); }
        .s-alert-text { font-size: 12px; color: rgba(245,87,108,0.7); margin: 8px 0 12px; }
        .s-alert-btn {
          width: 100%; padding: 10px; border-radius: 12px;
          background: rgba(245,87,108,0.18); border: 1px solid rgba(245,87,108,0.3);
          color: rgba(245,87,108,1); font-size: 12px; font-weight: 600;
          cursor: pointer; transition: all 0.2s;
        }
        .s-alert-btn:hover { background: rgba(245,87,108,0.28); transform: translateY(-1px); }

        /* Material quick view */
        .s-mat-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .s-mat-row:last-child { border-bottom: none; }
        .s-mat-name { font-size: 12px; font-weight: 600; color: var(--sd-text); max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .s-mat-price { font-size: 11px; color: var(--sd-faint); margin-top: 2px; }
        .s-mat-qty { font-size: 12px; font-weight: 700; }
        .s-mat-unit { font-size: 11px; color: var(--sd-faint); }

        /* Quick actions */
        .s-actions-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .s-action-btn {
          display: flex; flex-direction: column; align-items: center; gap: 6px;
          padding: 14px 10px; border-radius: 14px; font-size: 11px; font-weight: 600;
          border: 1px solid var(--sd-border); background: var(--sd-card-alt);
          cursor: pointer; transition: all 0.25s ease; color: var(--sd-soft);
        }
        .s-action-btn:hover { transform: translateY(-3px) scale(1.03); border-color: rgba(255,255,255,0.14); background: rgba(255,255,255,0.07); color: var(--sd-text); box-shadow: 0 10px 30px rgba(0,0,0,0.3); }

        .s-action-icon {
          width: 32px; height: 32px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
        }

        /* Stat row */
        .s-stat-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
        .s-stat-row:last-child { border-bottom: none; }
        .s-stat-rl { font-size: 12px; color: var(--sd-faint); }
        .s-stat-rv { font-size: 13px; font-weight: 700; color: var(--sd-text); }

        /* Charts */
        .s-chart-grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
        @media(min-width:640px) { .s-chart-grid { grid-template-columns: 1fr 1fr; } }

        /* Modal */
        .s-modal-backdrop {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.75);
          backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          padding: 16px; z-index: 50;
          animation: sFadeIn 0.2s ease both;
        }
        @keyframes sFadeIn { from { opacity: 0; } to { opacity: 1; } }

        .s-modal {
          background: #0f1120;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px; padding: 28px;
          max-width: 480px; width: 100%;
          animation: sSlideUp 0.3s cubic-bezier(0.16,1,0.3,1) both;
          box-shadow: 0 40px 100px rgba(0,0,0,0.6);
        }
        @keyframes sSlideUp { from { opacity: 0; transform: translateY(30px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }

        .s-modal-title { font-size: 18px; font-weight: 800; color: var(--sd-text); }
        .s-modal-close {
          padding: 6px; border-radius: 8px; border: none;
          background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.5);
          cursor: pointer; transition: all 0.2s;
        }
        .s-modal-close:hover { background: rgba(255,255,255,0.1); color: var(--sd-text); }

        .s-modal-section {
          background: var(--sd-card-alt);
          border: 1px solid var(--sd-border);
          border-radius: 14px; padding: 16px; margin-bottom: 14px;
        }
        .s-modal-sec-title { font-size: 12px; font-weight: 700; color: var(--sd-soft); margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
        .s-modal-detail { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--sd-soft); margin-bottom: 8px; }
        .s-modal-detail:last-child { margin-bottom: 0; }

        .s-modal-msg { font-size: 13px; color: var(--sd-soft); line-height: 1.7; }
        .s-modal-material { display: inline-block; padding: 6px 14px; background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.2); border-radius: 8px; font-size: 13px; color: rgba(110,231,183,1); font-weight: 500; }

        .s-modal-time { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--sd-faint); }

        .s-modal-divider { border: none; border-top: 1px solid rgba(255,255,255,0.07); margin: 16px 0; }

        .s-reject-btn {
          flex: 1; padding: 12px; border-radius: 12px; font-size: 13px; font-weight: 600;
          border: 1px solid rgba(245,87,108,0.3); color: rgba(245,87,108,1);
          background: rgba(245,87,108,0.08); cursor: pointer; transition: all 0.2s;
        }
        .s-reject-btn:hover { background: rgba(245,87,108,0.18); transform: translateY(-1px); }

        .s-accept-btn {
          flex: 1; padding: 12px; border-radius: 12px; font-size: 13px; font-weight: 600;
          background: linear-gradient(135deg, #10b981, #059669); color: var(--sd-text); border: none;
          cursor: pointer; transition: all 0.2s;
          box-shadow: 0 4px 16px rgba(16,185,129,0.3);
        }
        .s-accept-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(16,185,129,0.5); }

        .s-status-tag {
          display: flex; align-items: center; gap: 8px;
          padding: 12px 16px; border-radius: 12px; font-size: 13px; font-weight: 500;
        }
        .s-status-accepted { background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.2); color: rgba(110,231,183,1); }
        .s-status-other { background: var(--sd-card-alt); border: 1px solid rgba(255,255,255,0.08); color: var(--sd-soft); }

        .delay-1 { animation-delay: 0.1s; }
        .delay-2 { animation-delay: 0.2s; }
        .delay-3 { animation-delay: 0.3s; }
        .delay-4 { animation-delay: 0.4s; }
        .delay-5 { animation-delay: 0.5s; }
        .space-y { display: flex; flex-direction: column; gap: 10px; }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
      `}</style>

      <div className="seller-dash">
        <div className="s-orb s-orb-1" />
        <div className="s-orb s-orb-2" />
        <div className="s-orb s-orb-3" />
        <div className="s-grid-overlay" />

        {/* Header */}
        <div className="s-header">
          <div className="s-header-inner">
            <div>
              <h1 className="s-header-title">Seller Dashboard</h1>
              <p className="s-header-sub">Welcome back, <span>{user?.name?.split(" ")[0]}</span>!</p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="s-btn-outline" onClick={() => navigate("/seller/inventory")}>
                <Package className="w-4 h-4" /> Manage Inventory
              </button>
              <button className="s-btn-primary" onClick={() => navigate("/seller/add-material")}>
                <Plus className="w-4 h-4" /> Add Material
              </button>
            </div>
          </div>
        </div>

        <div className="s-body">
          {/* Stats */}
          <div className="s-stats-grid">
            {stats.map((stat, i) => (
              <StatCard key={stat.label} stat={stat} index={i} />
            ))}
          </div>

          {/* Content Grid */}
          <div className="s-content-grid">
            {/* Main column */}
            <div className="s-main-col">
              {/* Recent Enquiries */}
              <div className="s-glass-card delay-2">
                <div className="s-sec-header">
                  <span className="s-sec-title">Recent Enquiries</span>
                  <button className="s-view-all" onClick={() => navigate("/seller/enquiries")}>View All →</button>
                </div>
                {recentEnquiries.length === 0 ? (
                  <div className="s-empty">
                    <div className="s-empty-icon"><MessageCircle className="w-6 h-6" /></div>
                    <p className="s-empty-text">No enquiries yet</p>
                  </div>
                ) : (
                  <div className="space-y">
                    {recentEnquiries.map((enq, i) => (
                      <button
                        key={enq.id}
                        className="s-enq-row"
                        style={{ animationDelay: `${i * 80 + 300}ms` }}
                        onClick={() => setSelectedEnquiry(enq)}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div className="s-enq-avatar">{enq.buyerName.charAt(0)}</div>
                          <div>
                            <div className="s-enq-name">{enq.buyerName}</div>
                            <div className="s-enq-sub">{enq.materialName || "General Enquiry"}</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                          <span className="s-enq-date">{getTimeAgo(enq.createdAt)}</span>
                          <span className={`s-badge ${statusColors[enq.status]}`}>{getStatusLabel(enq.status)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Customer Reviews */}
              <div className="s-glass-card delay-3">
                <div className="s-sec-header">
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Star className="w-5 h-5" style={{ color: "rgba(251,191,36,0.9)" }} />
                    <span className="s-sec-title">Customer Reviews</span>
                  </div>
                  {reviews.length > 0 && (
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{reviews.length} {reviews.length === 1 ? "review" : "reviews"}</span>
                  )}
                </div>
                {reviews.length === 0 ? (
                  <div className="s-empty">
                    <div className="s-empty-icon"><Star className="w-6 h-6" /></div>
                    <p className="s-empty-text">No reviews yet</p>
                    <p className="s-empty-sub">Buyers can leave reviews after you accept their enquiries</p>
                  </div>
                ) : (
                  <div className="space-y" style={{ maxHeight: 400, overflowY: "auto" }}>
                    {reviews.slice(0, 5).map((review) => (
                      <div key={review.id} className="s-review-card">
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#10b981,#059669)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: "white", flexShrink: 0 }}>
                              {review.buyerName.charAt(0)}
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>{review.buyerName}</div>
                              {review.materialName && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>{review.materialName}</div>}
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 2 }}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star key={star} className={`w-3.5 h-3.5 ${star <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-600"}`} />
                            ))}
                          </div>
                        </div>
                        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, marginBottom: 8 }}>{review.comment}</p>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                          {new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          {review.updatedAt && review.updatedAt !== review.createdAt && <span style={{ marginLeft: 4 }}>(edited)</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Analytics Charts */}
              <div className="s-chart-grid">
                <div className="s-glass-card delay-4">
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
                    <Activity className="w-4 h-4" style={{ color: "rgba(16,185,129,0.8)" }} />
                    <span className="s-sec-title">Enquiry Status</span>
                  </div>
                  {enquiryStatusData.length > 0 ? (
                    <div style={{ height: 200 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={enquiryStatusData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} outerRadius={70} fill="#10b981" dataKey="value">
                            {enquiryStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ background: "rgba(15,17,32,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>No enquiry data available</p>
                    </div>
                  )}
                </div>

                <div className="s-glass-card delay-4">
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
                    <TrendingUp className="w-4 h-4" style={{ color: "rgba(167,139,250,0.8)" }} />
                    <span className="s-sec-title">Business Overview</span>
                  </div>
                  <div style={{ height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={inventoryData}>
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} angle={-15} textAnchor="end" height={50} />
                        <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} />
                        <Tooltip contentStyle={{ background: "rgba(15,17,32,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} />
                        <Bar dataKey="value" fill="url(#barGrad)" radius={[8, 8, 0, 0]} />
                        <defs>
                          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#a78bfa" />
                            <stop offset="100%" stopColor="#7c3aed" />
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Shop card */}
              <div className="s-shop-card delay-2">
                {shop ? (
                  <>
                    <img src={shop.image} alt={shop.name} className="s-shop-img" />
                    <div className="s-shop-body">
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                        <span className="s-shop-name">{shop.name}</span>
                        <button className="s-settings-btn" onClick={() => navigate("/seller/shop-settings")}>
                          <Settings className="w-4 h-4" />
                        </button>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                        <div className="s-shop-detail">
                          <MapPin className="w-3.5 h-3.5" style={{ color: "rgba(110,231,183,0.7)", flexShrink: 0 }} />
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{shop.area}, {shop.city}</span>
                        </div>
                        <div className="s-shop-detail">
                          <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" style={{ flexShrink: 0 }} />
                          <span>{shop.rating} ({shop.reviewCount} reviews)</span>
                        </div>
                        <div className="s-shop-detail">
                          <Clock className="w-3.5 h-3.5" style={{ color: "rgba(110,231,183,0.7)", flexShrink: 0 }} />
                          <span>{shop.openHours}</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span className={`s-open-badge ${shop.isOpen ? "s-open" : "s-closed"}`}>
                          {shop.isOpen ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                          {shop.isOpen ? "Open Now" : "Closed"}
                        </span>
                        <button className="s-edit-shop-btn" onClick={() => navigate("/seller/shop-settings")}>Edit Shop</button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ padding: 20, textAlign: "center" }}>
                    <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(16,185,129,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                      <Package className="w-6 h-6" style={{ color: "rgba(16,185,129,0.8)" }} />
                    </div>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Loading shop details...</p>
                    <button className="s-btn-primary" style={{ marginTop: 12, width: "100%", justifyContent: "center" }} onClick={() => navigate("/seller/shop-settings")}>Set Up Shop</button>
                  </div>
                )}
              </div>

              {/* Low Stock Alert */}
              {lowStockCount > 0 && (
                <div className="s-alert-card delay-3">
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <AlertTriangle className="w-4 h-4" style={{ color: "rgba(245,87,108,0.9)" }} />
                    <span className="s-alert-title">Low Stock Alert</span>
                  </div>
                  <p className="s-alert-text">{lowStockCount} materials are running low on stock.</p>
                  <button className="s-alert-btn" onClick={() => navigate("/seller/inventory")}>Update Stock</button>
                </div>
              )}

              {/* Top Materials */}
              <div className="s-glass-card delay-3">
                <div className="s-sec-header">
                  <span className="s-sec-title">Top Materials</span>
                  <button className="s-view-all" onClick={() => navigate("/seller/inventory")}>View All →</button>
                </div>
                {materials.length === 0 ? (
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", textAlign: "center", padding: "16px 0" }}>No materials yet</p>
                ) : (
                  materials.slice(0, 4).map((mat) => (
                    <div key={mat.id} className="s-mat-row">
                      <div>
                        <div className="s-mat-name">{mat.name}</div>
                        <div className="s-mat-price">₹{mat.price}/{mat.unit.split(" ")[0]}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div className="s-mat-qty" style={{ color: mat.inStock ? "rgba(16,185,129,1)" : "rgba(245,87,108,1)" }}>
                          {mat.inStock ? mat.stockQty.toLocaleString() : "Out of Stock"}
                        </div>
                        {mat.inStock && <div className="s-mat-unit">{mat.unit.split(" ")[0]}s left</div>}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Quick Actions */}
              <div className="s-glass-card delay-4">
                <div style={{ marginBottom: 14 }}>
                  <span className="s-sec-title">Quick Actions</span>
                </div>
                <div className="s-actions-grid">
                  {[
                    { icon: <Plus className="w-4 h-4" />, label: "Add Material", action: () => navigate("/seller/add-material"), gradient: "linear-gradient(135deg,#11998e,#38ef7d)", bg: "rgba(16,185,129,0.1)" },
                    { icon: <Package className="w-4 h-4" />, label: "Update Stock", action: () => navigate("/seller/inventory"), gradient: "linear-gradient(135deg,#4facfe,#00f2fe)", bg: "rgba(79,172,254,0.1)" },
                    { icon: <Settings className="w-4 h-4" />, label: "Shop Settings", action: () => navigate("/seller/shop-settings"), gradient: "linear-gradient(135deg,#a1a1aa,#71717a)", bg: "rgba(161,161,170,0.1)" },
                    { icon: <MessageCircle className="w-4 h-4" />, label: "Enquiries", action: () => navigate("/seller/enquiries"), gradient: "linear-gradient(135deg,#f093fb,#f5576c)", bg: "rgba(240,147,251,0.1)" },
                  ].map((action) => (
                    <button key={action.label} className="s-action-btn" onClick={action.action}>
                      <div className="s-action-icon" style={{ background: action.bg }}>
                        <span style={{ background: action.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                          {action.icon}
                        </span>
                      </div>
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Buyer Details Modal */}
        {selectedEnquiry && (
          <div className="s-modal-backdrop" onClick={() => setSelectedEnquiry(null)}>
            <div className="s-modal" onClick={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <span className="s-modal-title">Enquiry Details</span>
                <button className="s-modal-close" onClick={() => setSelectedEnquiry(null)}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <div className="s-modal-section">
                  <div className="s-modal-sec-title">Buyer Information</div>
                  <div className="s-modal-detail">
                    <UserIcon className="w-4 h-4" style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
                    <span>{selectedEnquiry.buyerName}</span>
                  </div>
                  <div className="s-modal-detail">
                    <Phone className="w-4 h-4" style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
                    <span>{selectedEnquiry.buyerPhone}</span>
                  </div>
                  <div className="s-modal-detail">
                    <Mail className="w-4 h-4" style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
                    <span>{selectedEnquiry.buyerEmail}</span>
                  </div>
                </div>

                {selectedEnquiry.materialName && (
                  <div style={{ marginBottom: 14 }}>
                    <div className="s-modal-sec-title" style={{ marginBottom: 8, fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Material</div>
                    <span className="s-modal-material">{selectedEnquiry.materialName}</span>
                  </div>
                )}

                <div style={{ marginBottom: 14 }}>
                  <div className="s-modal-sec-title" style={{ marginBottom: 8, fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Message</div>
                  <div className="s-modal-section" style={{ marginBottom: 0 }}>
                    <p className="s-modal-msg">{selectedEnquiry.message}</p>
                  </div>
                </div>

                <div className="s-modal-time" style={{ marginBottom: 16 }}>
                  <Clock className="w-3.5 h-3.5" />
                  Sent {getTimeAgo(selectedEnquiry.createdAt)}
                </div>

                <hr className="s-modal-divider" />

                {selectedEnquiry.status === "pending" && (
                  <div style={{ display: "flex", gap: 12 }}>
                    <button className="s-reject-btn" onClick={() => handleStatusUpdate(selectedEnquiry.id, "rejected")}>Reject</button>
                    <button className="s-accept-btn" onClick={() => handleStatusUpdate(selectedEnquiry.id, "accepted")}>Accept Enquiry</button>
                  </div>
                )}
                {selectedEnquiry.status !== "pending" && (
                  <div className={`s-status-tag ${selectedEnquiry.status === "accepted" ? "s-status-accepted" : "s-status-other"}`}>
                    {selectedEnquiry.status === "accepted" ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    Enquiry {selectedEnquiry.status}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}