import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router";
import {
  Package, TrendingUp, ShoppingBag, Star, MapPin, Phone,
  CheckCircle, AlertTriangle, BarChart3, ArrowUp, MessageCircle, User, Edit,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  getAllShops, getAllMaterials, getAllReviews, getEnquiriesForBuyer,
  Enquiry,
} from "../services/firebaseService";

// Haversine distance (km) — used for "Nearby Shops" stat
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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

// Animated stat card
function StatCard({ stat, index }: { stat: any; index: number }) {
  const count = useCountUp(stat.value);
  return (
    <div
      className="stat-card"
      style={{ animationDelay: `${index * 120}ms` }}
    >
      <div className="stat-icon-wrap" style={{ background: stat.gradient }}>
        {stat.icon}
        <div className="icon-glow" style={{ background: stat.gradient }} />
      </div>
      <div className="stat-value">{count}</div>
      <div className="stat-label">{stat.label}</div>
      <div className="stat-change">
        <ArrowUp className="w-3 h-3" />
        {stat.change}
      </div>
      <div className="card-shine" />
    </div>
  );
}

export default function BuyerDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [shops, setShops] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [shopData, materialData, reviewData] = await Promise.all([
          getAllShops(),
          getAllMaterials(),
          getAllReviews().catch(() => []),
        ]);
        setShops(shopData);
        setMaterials(materialData);
        setReviews(reviewData);
      } catch (err) {
        console.error("Dashboard load error:", err);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    getEnquiriesForBuyer(user.id)
      .then(setEnquiries)
      .catch((err) => console.error("Enquiries load error:", err));
  }, [user?.id]);

  const myReviews = reviews.filter((r) => r.buyerId === user?.id);
  const recentEnquiries = enquiries.slice(0, 5);

  const statusColors: Record<string, string> = {
    not_viewed: "badge-blue",
    accepted: "badge-green",
    rejected: "badge-red",
  };

  const purchaseStatusColors: Record<string, string> = {
    completed: "badge-green",
    pending: "badge-yellow",
    cancelled: "badge-red",
  };

  const nearbyShops = (() => {
    if (!user?.latitude || !user?.longitude) return shops.length;
    return shops.filter((s) =>
      s.latitude && s.longitude &&
      haversine(user.latitude!, user.longitude!, s.latitude, s.longitude) <= 10
    ).length;
  })();

  const stats = [
    {
      label: "Total Enquiries", value: enquiries.length,
      icon: <MessageCircle className="w-5 h-5 text-white" />,
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      change: `${enquiries.filter((e) => e.status === "accepted").length} accepted`,
    },
    {
      label: "My Reviews", value: myReviews.length,
      icon: <ShoppingBag className="w-5 h-5 text-white" />,
      gradient: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
      change: `${reviews.filter((p) => p.status === "pending").length} pending`,
    },
    {
      label: "Nearby Shops", value: nearbyShops,
      icon: <MapPin className="w-5 h-5 text-white" />,
      gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      change: user?.latitude ? "Within 10 km" : "All shops",
    },
    {
      label: "Available Materials", value: materials.filter((m) => m.inStock).length,
      icon: <Package className="w-5 h-5 text-white" />,
      gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      change: "In stock now",
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');

        .buyer-dash * { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; }

        .buyer-dash {
          --bd-bg: linear-gradient(180deg, #f8fbff 0%, #eef4ff 35%, #ffffff 70%, #f7fbff 100%);
          --bd-panel: rgba(255,255,255,0.78);
          --bd-card: rgba(255,255,255,0.82);
          --bd-card-alt: rgba(248,250,252,0.92);
          --bd-border: rgba(148,163,184,0.18);
          --bd-grid: rgba(37,99,235,0.06);
          --bd-text: #0f172a;
          --bd-soft: rgba(15,23,42,0.72);
          --bd-faint: rgba(15,23,42,0.5);
          --bd-shadow: 0 18px 60px rgba(37,99,235,0.08);
          min-height: 100vh;
          background: var(--bd-bg);
          position: relative;
          overflow-x: hidden;
        }

        .dark .buyer-dash {
          --bd-bg: #060818;
          --bd-panel: rgba(6,8,24,0.85);
          --bd-card: rgba(255,255,255,0.035);
          --bd-card-alt: rgba(255,255,255,0.03);
          --bd-border: rgba(255,255,255,0.07);
          --bd-grid: rgba(255,255,255,0.025);
          --bd-text: #ffffff;
          --bd-soft: rgba(255,255,255,0.75);
          --bd-faint: rgba(255,255,255,0.45);
          --bd-shadow: 0 20px 60px rgba(0,0,0,0.4);
        }

        /* Animated mesh background */
        .buyer-dash::before {
          content: '';
          position: fixed;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 20% 10%, rgba(102,126,234,0.18) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 80% 80%, rgba(245,87,108,0.12) 0%, transparent 60%),
            radial-gradient(ellipse 70% 40% at 60% 30%, rgba(0,242,254,0.08) 0%, transparent 60%);
          pointer-events: none;
          z-index: 0;
        }

        /* Floating orbs */
        .orb {
          position: fixed;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          z-index: 0;
          animation: orbFloat 12s ease-in-out infinite;
        }
        .orb-1 { width: 500px; height: 500px; background: rgba(102,126,234,0.12); top: -100px; left: -100px; animation-delay: 0s; }
        .orb-2 { width: 400px; height: 400px; background: rgba(245,87,108,0.10); bottom: 0; right: -100px; animation-delay: -4s; }
        .orb-3 { width: 300px; height: 300px; background: rgba(0,242,254,0.08); top: 50%; left: 50%; animation-delay: -8s; }

        @keyframes orbFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.97); }
        }

        /* Grid overlay */
        .grid-overlay {
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(var(--bd-grid) 1px, transparent 1px),
            linear-gradient(90deg, var(--bd-grid) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
          z-index: 0;
        }

        /* Header */
        .dash-header {
          position: relative;
          z-index: 10;
          border-bottom: 1px solid var(--bd-border);
          background: var(--bd-panel);
          backdrop-filter: blur(20px);
          padding: 20px 32px;
          animation: slideDown 0.6s cubic-bezier(0.16,1,0.3,1) both;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .header-inner { max-width: 1280px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; }

        .header-title {
          font-size: 24px;
          font-weight: 800;
          background: linear-gradient(135deg, #0f172a 0%, #2563eb 55%, #7c3aed 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0;
        }

        .header-subtitle {
          font-size: 13px;
          color: var(--bd-faint);
          margin-top: 2px;
        }

        .header-subtitle span {
          color: rgba(167,139,250,0.9);
          font-weight: 600;
        }

        .btn-outline {
          display: flex; align-items: center; gap: 8px;
          padding: 9px 18px;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          font-size: 13px;
          font-weight: 500;
          color: var(--bd-soft);
          background: var(--bd-card-alt);
          cursor: pointer;
          transition: all 0.2s ease;
          backdrop-filter: blur(10px);
        }
        .btn-outline:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.2);
          color: var(--bd-text);
          transform: translateY(-1px);
        }

        .btn-primary {
          display: flex; align-items: center; gap: 8px;
          padding: 9px 18px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
          color: var(--bd-text);
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 20px rgba(102,126,234,0.35);
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(102,126,234,0.5);
        }

        /* Main content */
        .dash-body {
          position: relative;
          z-index: 1;
          max-width: 1280px;
          margin: 0 auto;
          padding: 32px;
        }

        /* Stats */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-bottom: 28px;
        }
        @media(min-width: 1024px) { .stats-grid { grid-template-columns: repeat(4, 1fr); } }

        .stat-card {
          position: relative;
          background: var(--bd-card);
          border: 1px solid var(--bd-border);
          border-radius: 20px;
          padding: 22px;
          overflow: hidden;
          cursor: default;
          animation: fadeInUp 0.7s cubic-bezier(0.16,1,0.3,1) both;
          transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
        }
        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--bd-shadow);
          border-color: rgba(255,255,255,0.14);
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .stat-icon-wrap {
          position: relative;
          width: 44px; height: 44px;
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 16px;
        }

        .icon-glow {
          position: absolute;
          inset: -4px;
          border-radius: 18px;
          opacity: 0.25;
          filter: blur(12px);
          z-index: -1;
        }

        .stat-value {
          font-size: 32px;
          font-weight: 800;
          color: var(--bd-text);
          line-height: 1;
          margin-bottom: 4px;
          font-family: 'DM Mono', monospace;
        }

        .stat-label {
          font-size: 12px;
          color: var(--bd-faint);
          font-weight: 500;
          margin-bottom: 10px;
        }

        .stat-change {
          display: flex; align-items: center; gap: 4px;
          font-size: 11px;
          color: rgba(56,239,125,0.85);
          font-weight: 500;
        }

        .card-shine {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%);
          border-radius: 20px;
          pointer-events: none;
        }

        /* Grid layout */
        .content-grid {
          display: grid;
          gap: 24px;
        }
        @media(min-width: 1024px) { .content-grid { grid-template-columns: 1fr 1fr 1fr; } }
        .main-col { display: flex; flex-direction: column; gap: 20px; }
        @media(min-width: 1024px) { .main-col { grid-column: span 2; } }

        /* Glass cards */
        .glass-card {
          background: var(--bd-card-alt);
          border: 1px solid var(--bd-border);
          border-radius: 20px;
          padding: 24px;
          animation: fadeInUp 0.7s cubic-bezier(0.16,1,0.3,1) both;
          transition: border-color 0.3s ease;
        }
        .glass-card:hover { border-color: rgba(255,255,255,0.12); }

        .section-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 20px;
        }

        .section-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--bd-text);
        }

        .view-all-btn {
          font-size: 12px;
          font-weight: 600;
          color: rgba(167,139,250,0.8);
          background: none;
          border: none;
          cursor: pointer;
          transition: color 0.2s;
          padding: 0;
        }
        .view-all-btn:hover { color: rgba(167,139,250,1); }

        /* Enquiry rows */
        .enquiry-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 16px;
          background: var(--bd-card-alt);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          animation: fadeInLeft 0.5s ease both;
        }
        .enquiry-row:hover {
          background: rgba(255,255,255,0.05);
          border-color: rgba(167,139,250,0.2);
          transform: translateX(3px);
        }

        @keyframes fadeInLeft {
          from { opacity: 0; transform: translateX(-16px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .enq-avatar {
          width: 38px; height: 38px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 14px; color: var(--bd-text);
          background: linear-gradient(135deg, #667eea, #764ba2);
          flex-shrink: 0;
        }

        .enq-name { font-size: 13px; font-weight: 600; color: var(--bd-text); }
        .enq-sub { font-size: 11px; color: var(--bd-faint); margin-top: 2px; }
        .enq-date { font-size: 11px; color: var(--bd-faint); }

        /* Badges */
        .badge {
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
        }
        .badge-blue { background: rgba(102,126,234,0.18); color: rgba(167,139,250,1); border: 1px solid rgba(102,126,234,0.2); }
        .badge-green { background: rgba(56,239,125,0.12); color: rgba(56,239,125,1); border: 1px solid rgba(56,239,125,0.2); }
        .badge-red { background: rgba(245,87,108,0.12); color: rgba(245,87,108,1); border: 1px solid rgba(245,87,108,0.2); }
        .badge-yellow { background: rgba(251,191,36,0.12); color: rgba(251,191,36,1); border: 1px solid rgba(251,191,36,0.2); }

        /* Empty state */
        .empty-state {
          text-align: center;
          padding: 40px 20px;
        }
        .empty-icon {
          width: 56px; height: 56px;
          background: var(--bd-card-alt);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 12px;
          color: rgba(255,255,255,0.2);
        }
        .empty-text { font-size: 13px; color: var(--bd-faint); }
        .empty-link {
          margin-top: 8px;
          font-size: 12px;
          color: rgba(167,139,250,0.7);
          background: none; border: none; cursor: pointer;
          transition: color 0.2s;
          display: block;
          margin-left: auto; margin-right: auto;
        }
        .empty-link:hover { color: rgba(167,139,250,1); text-decoration: underline; }

        /* Review card */
        .review-card {
          padding: 16px;
          background: var(--bd-card-alt);
          border: 1px solid var(--bd-border);
          border-radius: 14px;
          transition: all 0.2s ease;
        }
        .review-card:hover {
          border-color: rgba(251,191,36,0.2);
          background: var(--bd-card-alt);
        }

        .review-shop { font-size: 13px; font-weight: 600; color: var(--bd-text); }
        .review-material { font-size: 11px; color: var(--bd-faint); margin-top: 2px; }
        .review-comment { font-size: 12px; color: var(--bd-soft); line-height: 1.6; margin: 10px 0 8px; }
        .review-date { font-size: 11px; color: var(--bd-faint); }

        .edit-btn {
          display: flex; align-items: center; gap: 4px;
          font-size: 11px; color: rgba(167,139,250,0.7);
          background: none; border: none; cursor: pointer;
          transition: color 0.2s;
          padding: 0;
        }
        .edit-btn:hover { color: rgba(167,139,250,1); }

        /* Profile card */
        .profile-avatar {
          width: 52px; height: 52px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; font-weight: 800; color: var(--bd-text);
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          flex-shrink: 0;
          box-shadow: 0 8px 24px rgba(102,126,234,0.4);
          position: relative;
        }
        .profile-avatar::after {
          content: '';
          position: absolute;
          inset: -3px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea, #764ba2);
          z-index: -1;
          opacity: 0.3;
          filter: blur(8px);
        }

        .profile-name { font-size: 15px; font-weight: 700; color: var(--bd-text); }
        .profile-email { font-size: 11px; color: var(--bd-faint); margin-top: 2px; }

        .profile-detail {
          display: flex; align-items: center; gap: 8px;
          font-size: 12px;
          color: rgba(255,255,255,0.5);
        }

        .edit-profile-btn {
          margin-top: 16px;
          width: 100%;
          padding: 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          border: 1px solid rgba(167,139,250,0.25);
          color: rgba(167,139,250,0.9);
          background: rgba(102,126,234,0.08);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .edit-profile-btn:hover {
          background: rgba(102,126,234,0.18);
          border-color: rgba(167,139,250,0.4);
          color: var(--bd-text);
          transform: translateY(-1px);
        }

        /* Quick stats */
        .stat-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .stat-row:last-child { border-bottom: none; }
        .stat-row-label { font-size: 12px; color: rgba(255,255,255,0.5); }
        .stat-row-val { font-size: 13px; font-weight: 700; color: var(--bd-text); }

        /* Quick actions */
        .actions-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }

        .action-btn {
          display: flex; flex-direction: column; align-items: center; gap: 6px;
          padding: 14px 10px;
          border-radius: 14px;
          font-size: 11px; font-weight: 600;
          border: 1px solid var(--bd-border);
          background: var(--bd-card-alt);
          cursor: pointer;
          transition: all 0.25s ease;
          color: var(--bd-soft);
        }
        .action-btn:hover {
          transform: translateY(-3px) scale(1.03);
          border-color: rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.07);
          color: var(--bd-text);
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        .action-btn .icon-wrap {
          width: 32px; height: 32px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
        }

        /* Divider */
        .space-y { display: flex; flex-direction: column; gap: 12px; }

        /* Section delay */
        .delay-1 { animation-delay: 0.1s; }
        .delay-2 { animation-delay: 0.2s; }
        .delay-3 { animation-delay: 0.3s; }
        .delay-4 { animation-delay: 0.4s; }
        .delay-5 { animation-delay: 0.5s; }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
      `}</style>

      <div className="buyer-dash">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="grid-overlay" />

        {/* Header */}
        <div className="dash-header">
          <div className="header-inner">
            <div>
              <h1 className="header-title">Buyer Dashboard</h1>
              <p className="header-subtitle">Welcome back, <span>{user?.name?.split(" ")[0]}</span>!</p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-outline" onClick={() => navigate("/buyer/browse")}>
                <Package className="w-4 h-4" /> Browse Materials
              </button>
              <button className="btn-primary" onClick={() => navigate("/buyer/shops")}>
                <MapPin className="w-4 h-4" /> Find Shops
              </button>
            </div>
          </div>
        </div>

        <div className="dash-body">
          {/* Stats */}
          <div className="stats-grid">
            {stats.map((stat, i) => (
              <StatCard key={stat.label} stat={stat} index={i} />
            ))}
          </div>

          {/* Content */}
          <div className="content-grid">
            {/* Main column */}
            <div className="main-col">
              {/* Recent Enquiries */}
              <div className="glass-card delay-2">
                <div className="section-header">
                  <span className="section-title">Recent Enquiries</span>
                  <button className="view-all-btn" onClick={() => navigate("/buyer/enquiries")}>View All →</button>
                </div>
                {recentEnquiries.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon"><MessageCircle className="w-6 h-6" /></div>
                    <p className="empty-text">No enquiries yet</p>
                    <button className="empty-link" onClick={() => navigate("/buyer/browse")}>Browse materials →</button>
                  </div>
                ) : (
                  <div className="space-y">
                    {recentEnquiries.map((enq, i) => (
                      <div key={enq.id} className="enquiry-row" style={{ animationDelay: `${i * 80 + 300}ms` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div className="enq-avatar">{enq.shopName?.charAt(0) || "S"}</div>
                          <div>
                            <div className="enq-name">{enq.shopName || "Shop"}</div>
                            <div className="enq-sub">{enq.materialName || "General Enquiry"}</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                          <span className="enq-date">{enq.createdAt ? new Date((enq.createdAt as any)?.seconds ? (enq.createdAt as any).seconds * 1000 : enq.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : ""}</span>
                          <span className={`badge ${statusColors[enq.status] || "badge-blue"}`}>
                            {enq.status === "not_viewed" ? "New" : enq.status?.charAt(0).toUpperCase() + enq.status?.slice(1)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* My Reviews */}
              <div className="glass-card delay-3">
                <div className="section-header">
                  <span className="section-title">My Reviews</span>
                  <button className="view-all-btn" onClick={() => navigate("/buyer/enquiries")}>View All Enquiries →</button>
                </div>
                {myReviews.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon"><Star className="w-6 h-6" /></div>
                    <p className="empty-text">No reviews yet</p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 6 }}>Submit reviews after sellers accept your enquiries</p>
                  </div>
                ) : (
                  <div className="space-y">
                    {myReviews.slice(0, 5).map((review) => {
                      const shop = shops.find(s => s.id === review.shopId);
                      return (
                        <div key={review.id} className="review-card">
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
                            <div>
                              <div className="review-shop">{shop?.name || "Shop"}</div>
                              {review.materialName && <div className="review-material">{review.materialName}</div>}
                            </div>
                            <div style={{ display: "flex", gap: 2 }}>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star key={star} className={`w-3.5 h-3.5 ${star <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-600"}`} />
                              ))}
                            </div>
                          </div>
                          <p className="review-comment">{review.comment}</p>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span className="review-date">
                              {new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                              {review.updatedAt && review.updatedAt !== review.createdAt && <span style={{ marginLeft: 4 }}>(edited)</span>}
                            </span>
                            <button className="edit-btn" onClick={() => navigate("/buyer/enquiries")}>
                              <Edit className="w-3 h-3" /> Edit
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Profile */}
              <div className="glass-card delay-2">
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
                  <div className="profile-avatar">{user?.name.charAt(0).toUpperCase()}</div>
                  <div>
                    <div className="profile-name">{user?.name}</div>
                    <div className="profile-email">{user?.email}</div>
                  </div>
                </div>
                <div className="space-y" style={{ gap: 8 }}>
                  {user?.location && (
                    <div className="profile-detail">
                      <MapPin className="w-3.5 h-3.5" style={{ color: "rgba(167,139,250,0.7)", flexShrink: 0 }} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.location}</span>
                    </div>
                  )}
                  {user?.phone && (
                    <div className="profile-detail">
                      <Phone className="w-3.5 h-3.5" style={{ color: "rgba(167,139,250,0.7)", flexShrink: 0 }} />
                      <span>{user.phone}</span>
                    </div>
                  )}
                </div>
                <button className="edit-profile-btn" onClick={() => navigate("/buyer/profile")}>Edit Profile</button>
              </div>

              {/* Quick Stats */}
              <div className="glass-card delay-3">
                <div style={{ marginBottom: 16 }}>
                  <span className="section-title">Quick Stats</span>
                </div>
                <div>
                  <div className="stat-row">
                    <span className="stat-row-label">Active Enquiries</span>
                    <span className="stat-row-val">{enquiries.filter((e) => e.status === "pending").length}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-row-label">Accepted Enquiries</span>
                    <span className="stat-row-val" style={{ color: "rgba(56,239,125,1)" }}>{enquiries.filter((e) => e.status === "accepted").length}</span>
                  </div>
                  <div className="stat-row">
                    <span className="stat-row-label">My Reviews</span>
                    <span className="stat-row-val" style={{ color: "rgba(251,191,36,1)" }}>{myReviews.length}</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="glass-card delay-4">
                <div style={{ marginBottom: 14 }}>
                  <span className="section-title">Quick Actions</span>
                </div>
                <div className="actions-grid">
                  {[
                    { icon: <Package className="w-4 h-4" />, label: "Browse", action: () => navigate("/buyer/browse"), gradient: "linear-gradient(135deg,#4facfe,#00f2fe)", bg: "rgba(79,172,254,0.1)" },
                    { icon: <MapPin className="w-4 h-4" />, label: "Find Shops", action: () => navigate("/buyer/shops"), gradient: "linear-gradient(135deg,#667eea,#764ba2)", bg: "rgba(102,126,234,0.1)" },
                    { icon: <MessageCircle className="w-4 h-4" />, label: "Enquiries", action: () => navigate("/buyer/enquiries"), gradient: "linear-gradient(135deg,#f093fb,#f5576c)", bg: "rgba(240,147,251,0.1)" },
                    { icon: <Star className="w-4 h-4" />, label: "Reviews", action: () => navigate("/buyer/browse"), gradient: "linear-gradient(135deg,#f6d365,#fda085)", bg: "rgba(253,160,133,0.1)" },
                  ].map((action) => (
                    <button key={action.label} className="action-btn" onClick={action.action}>
                      <div className="icon-wrap" style={{ background: action.bg }}>
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
      </div>
    </>
  );
}