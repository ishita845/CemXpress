import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Building2, MapPin, Search, Shield, Truck, Star,
  ArrowRight, CheckCircle, Zap, Users, Package, TrendingUp,
} from "lucide-react";

const CATEGORIES = [
  {
    id: "cement",
    name: "Cement & Concrete",
    icon: "🏗️",
    description: "OPC, PPC, RMC and all cement grades",
    materialCount: 12,
    color: "border-gray-200 dark:border-gray-700 hover:border-gray-400",
  },
  {
    id: "steel",
    name: "Steel & Iron",
    icon: "🔩",
    description: "TMT bars, MS rods, structural steel",
    materialCount: 18,
    color: "border-blue-200 dark:border-blue-800/60 hover:border-blue-400",
  },
  {
    id: "sand",
    name: "Sand & Aggregates",
    icon: "⛏️",
    description: "River sand, M-sand, crushed stone",
    materialCount: 8,
    color: "border-yellow-200 dark:border-yellow-800/60 hover:border-yellow-400",
  },
  {
    id: "bricks",
    name: "Bricks & Blocks",
    icon: "🧱",
    description: "Red bricks, AAC blocks, fly ash bricks",
    materialCount: 10,
    color: "border-red-200 dark:border-red-800/60 hover:border-red-400",
  },
  {
    id: "tiles",
    name: "Tiles & Flooring",
    icon: "🪟",
    description: "Ceramic, vitrified, marble, granite",
    materialCount: 24,
    color: "border-purple-200 dark:border-purple-800/60 hover:border-purple-400",
  },
  {
    id: "paint",
    name: "Paint & Coatings",
    icon: "🎨",
    description: "Exterior, interior, waterproof paints",
    materialCount: 15,
    color: "border-pink-200 dark:border-pink-800/60 hover:border-pink-400",
  },
  {
    id: "plumbing",
    name: "Plumbing",
    icon: "🚿",
    description: "PVC pipes, fittings, sanitary ware",
    materialCount: 20,
    color: "border-cyan-200 dark:border-cyan-800/60 hover:border-cyan-400",
  },
  {
    id: "electrical",
    name: "Electrical",
    icon: "⚡",
    description: "Wires, switches, conduits, panels",
    materialCount: 16,
    color: "border-green-200 dark:border-green-800/60 hover:border-green-400",
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [shops, setShops] = useState<any[]>([]);

  useEffect(() => {
    // TODO: replace with your Firebase getAllShops() call
    // e.g. getAllShops().then(setShops)
    setShops([]);
  }, []);

  const stats = [
    { label: "Trusted Suppliers", value: "10", icon: "" },
    { label: "Materials", value: "10+", icon: "" },
    { label: "Cities Served", value: "2", icon: "" },
    { label: "Satisfied Buyers", value: "10+", icon: "" },
  ];

  const features = [
    {
      icon: <MapPin className="w-6 h-6 text-blue-500" />,
      title: "Location-Based Search",
      desc: "Find construction materials from shops nearest to your site. Filter by distance and area.",
    },
    {
      icon: <Zap className="w-6 h-6 text-blue-500" />,
      title: "Real-Time Stock",
      desc: "See live inventory levels from every seller. Know exactly how much stock is available.",
    },
    {
      icon: <Search className="w-6 h-6 text-blue-500" />,
      title: "Tag-Based Discovery",
      desc: "Search by material tags like cement, TMT steel, sand, bricks and instantly find results.",
    },
    {
      icon: <Shield className="w-6 h-6 text-blue-500" />,
      title: "Verified Sellers",
      desc: "Every shop is verified. View ratings, reviews, and stock transparency before ordering.",
    },
    {
      icon: <Truck className="w-6 h-6 text-blue-500" />,
      title: "Price Comparison",
      desc: "Compare prices across multiple nearby shops to get the best deal for your project.",
    },
    {
      icon: <Users className="w-6 h-6 text-blue-500" />,
      title: "Seller Dashboard",
      desc: "Dedicated seller portal to manage shop, inventory, pricing and customer enquiries.",
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1761805618757-9d2b9552ee32?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25zdHJ1Y3Rpb24lMjBtYXRlcmlhbHMlMjB3YXJlaG91c2V8ZW58MXx8fHwxNzcyNTE2MDM5fDA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Construction warehouse"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 to-gray-900/60" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-36">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-full mb-6">
              <Zap className="w-3.5 h-3.5 text-blue-300" />
              <span className="text-blue-200 text-sm">Emerging Construction Marketplace</span>
            </div>
<h1
  className="text-5xl sm:text-6xl lg:text-7xl text-white mb-6"
  style={{ fontFamily: "Times New Roman, serif" }}
>
  Find Construction <br />
  <span className="text-blue-300">Materials Nearby</span>
</h1>
            <p className="text-lg text-gray-300 mb-10 max-w-xl leading-relaxed">
Find trusted suppliers near your construction site.
Browse materials, compare prices, check live stock, and order directly from nearby stores.            </p>
<div
  className="flex flex-col sm:flex-row gap-3"
  style={{ fontFamily: "Times New Roman, serif" }}
>
  <button
    onClick={() => navigate("/login?role=buyer")}
    className="flex items-center justify-center gap-2 px-7 py-3.5 bg-blue-900 hover:bg-blue-300 text-white rounded-xl transition-all shadow-lg shadow-blue-800/30 font-medium text-xl"
  >
    <Building2 className="w-5 h-5" />
    I'm a Buyer
    <ArrowRight className="w-4 h-4" />
  </button>

  <button
    onClick={() => navigate("/login?role=seller")}
    className="flex items-center justify-center gap-2 px-7 py-3.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl transition-all font-medium backdrop-blur-sm text-xl"
  >
    <Package className="w-5 h-5" />
    I'm a Seller
    <ArrowRight className="w-4 h-4" />
  </button>
</div>
            {/* Quick search */}
            
            <div className="mt-10 flex flex-wrap gap-2">
              <div style={{ fontFamily: "Times New Roman, serif" }}></div>
              <span className="text-gray-400 text-sm self-center">Popular:</span>
              {["Cement", "TMT Steel", "Sand", "Bricks", "AAC Blocks", "Paint"].map((tag) => (
                <button
                  key={tag}
                  onClick={() => navigate(`/login?role=buyer`)}
                  className="px-3 py-1 text-sm bg-white/10 hover:bg-white/20 text-gray-300 rounded-full border border-white/10 transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-blue-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center text-white">
                <div className="text-3xl mb-1">{s.icon}</div>
                <div className="text-3xl font-bold mb-1">{s.value}</div>
                <div className="text-blue-100 text-mb">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

{/* Categories */}
<section className="py-20 bg-gray-50 dark:bg-gray-950">

  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

    <div className="text-center mb-12">

      <h2
        className="text-3xl text-gray-900 dark:text-white mb-3 font-semibold"
        style={{ fontFamily: "Times New Roman, serif" }}
      >
        Browse by Category
      </h2>

      <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
        Everything your construction project needs from the first brick to the final finish
      </p>

    </div>

    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">

      {CATEGORIES.map((cat) => (

        <button
          key={cat.id}
          onClick={() => navigate("/login?role=buyer")}
          className={`flex flex-col items-start p-6 rounded-xl border-2 ${cat.color}
          bg-white dark:bg-gray-900/40
          hover:shadow-2xl hover:-translate-y-1
          transition-all duration-300 text-left group
          backdrop-blur-sm`}
        >

          <span className="text-3xl mb-3">
            {cat.icon}
          </span>

          <h4 className="text-sm font-semibold mb-1 text-gray-900 dark:text-white">
            {cat.name}
          </h4>

          <p className="text-xs text-gray-600 dark:text-gray-400">
            {cat.description}
          </p>

          <div className="mt-3 flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300">

            <span>{cat.materialCount} products</span>

            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform"/>

          </div>

        </button>

      ))}

    </div>

  </div>

</section>

      {/* Features */}
      <section className="py-20 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-gray-900 dark:text-gray-100 mb-3">Everything You Need to Build Faster</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
              CemXpress connects buyers and sellers with smart tools to make sourcing construction materials effortless.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-blue-100 dark:hover:border-blue-900/40 hover:shadow-lg dark:hover:shadow-gray-900/50 transition-all group bg-white dark:bg-gray-900"
              >
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                  {f.icon}
                </div>
                <h3 className="text-gray-900 dark:text-gray-100 mb-2">{f.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    {/* How it Works */}

<section className="py-20 bg-gray-50 dark:bg-gradient-to-b dark:from-blue-950 dark:via-gray-900 dark:to-blue-950">

  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

    <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">

      {/* Buyer flow */}

      <div>

        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 rounded-full text-sm mb-4">
          👷 For Buyers
        </div>

        <h2
          className="text-gray-900 dark:text-white mb-8 text-3xl font-semibold"
          style={{ fontFamily: "Times New Roman, serif" }}
        >
          Source Materials in 3 Simple Steps
        </h2>

        <div className="space-y-6">

          {[
            { step: "01", title: "Set Your Location", desc: "Enter your construction site location to find nearby shops." },
            { step: "02", title: "Search & Filter", desc: "Search by material tags, filter by price range and availability." },
            { step: "03", title: "Contact Seller", desc: "View shop details, compare stock levels and reach out directly." },
          ].map((item) => (

            <div key={item.step} className="flex gap-4">

              <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0">
                {item.step}
              </div>

              <div>
                <h4 className="text-gray-900 dark:text-white mb-1 font-medium">
                  {item.title}
                </h4>

                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {item.desc}
                </p>
              </div>

            </div>

          ))}

        </div>

        <button
          onClick={() => navigate("/login?role=buyer")}
          className="mt-8 flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
        >
          Start Browsing
          <ArrowRight className="w-4 h-4" />
        </button>

      </div>


      {/* Seller flow */}

      <div>

        <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 rounded-full text-sm mb-4">
          🏪 For Sellers
        </div>

        <h2
          className="text-gray-900 dark:text-white mb-8 text-3xl font-semibold"
          style={{ fontFamily: "Times New Roman, serif" }}
        >
          Grow Your Business Online
        </h2>

        <div className="space-y-6">

          {[
            { step: "01", title: "Register Your Shop", desc: "Create your seller account and set up your shop profile with location." },
            { step: "02", title: "Add Your Inventory", desc: "List your materials with prices, stock quantities and category tags." },
            { step: "03", title: "Get Discovered", desc: "Buyers near you discover your shop. Manage enquiries from your dashboard." },
          ].map((item) => (

            <div key={item.step} className="flex gap-4">

              <div className="w-10 h-10 bg-purple-600 text-white rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0">
                {item.step}
              </div>

              <div>
                <h4 className="text-gray-900 dark:text-white mb-1 font-medium">
                  {item.title}
                </h4>

                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {item.desc}
                </p>
              </div>

            </div>

          ))}

        </div>

        <button
          onClick={() => navigate("/login?role=seller")}
          className="mt-8 flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors shadow-lg"
        >
          Register as Seller
          <ArrowRight className="w-4 h-4" />
        </button>

      </div>

    </div>

  </div>

</section>
      {/* Featured Shops */}
      <section className="py-20 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-gray-900 dark:text-gray-100 mb-1">Featured Shops Near Mumbai</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Verified sellers with in-stock materials</p>
            </div>
            <button
              onClick={() => navigate("/login?role=buyer")}
              className="text-blue-500 text-sm hover:text-blue-600 flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {shops.slice(0, 3).map((shop) => (
              <div
                key={shop.id}
                className="rounded-2xl border border-gray-200 dark:border-gray-700/60 bg-white dark:bg-gray-900 overflow-hidden hover:shadow-lg dark:hover:shadow-gray-900/50 transition-all cursor-pointer group"
                onClick={() => navigate("/login?role=buyer")}
              >
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={shop.image}
                    alt={shop.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${shop.isOpen ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
                      {shop.isOpen ? "Open" : "Closed"}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur px-2 py-1 rounded-full text-xs">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    <span className="font-medium">{shop.rating}</span>
                  </div>
                </div>
                <div className="p-4">
                  <h4 className="text-gray-900 dark:text-gray-100 mb-1 truncate">{shop.name}</h4>
                  <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-2">
                    <MapPin className="w-3.5 h-3.5 text-blue-400" />
                    <span>{shop.area} • {shop.distance} km away</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {shop.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded-full">{tag}</span>
                    ))}
                    {shop.tags.length > 3 && (
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded-full">+{shop.tags.length - 3}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-900 to-blue-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
            <h2
      className="text-3xl font-semibold text-white-300 dark:text-white mb-4"
      style={{ fontFamily: "Times New Roman, serif" }}
    >
      Why run around markets when CemXpress does the work?
    </h2>
          <p className="text--100 mb-8 text-lg">
Find materials, compare prices, and build without the headache.          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate("/register")}
              className="px-8 py-4 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-colors font-medium shadow-lg"
            >
              Create Free Account
            </button>
            <button
              onClick={() => navigate("/login")}
              className="px-8 py-4 border-2 border-white text-white rounded-xl hover:bg-white/10 transition-colors font-medium"
            >
              Sign In to Browse
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-gray-950 text-gray-400 py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="">
                  <Building2 className="" />
                </div>
                <span className="text-white font-semibold">Cem<span className="text-blue-400">Xpress</span></span>
              </div>
              <p className="text-sm leading-relaxed">Emerging Construction Website</p>
            </div>
            {[
              { title: "For Buyers", links: ["Browse Materials", "Nearby Shops", "Price Compare", "Track Orders"] },
              { title: "For Sellers", links: ["Register Shop", "Manage Inventory", "Analytics", "Promotions"] },
              { title: "Support", links: ["Help Centre", "Contact Us", "Terms of Service", "Privacy Policy"] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-white text-sm mb-3">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link}>
                      <button className="text-sm hover:text-blue-400 transition-colors text-left">{link}</button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>©CemXpress.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}