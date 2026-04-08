import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  CircleHelp,
  MapPin,
  Package,
  Search,
  Shield,
  Sparkles,
  Star,
  Truck,
  Users,
  Zap,
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../components/ui/carousel";

// ── animation helpers ──────────────────────────────────────────────────────
const animStyles = `
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes slideInLeft {
    from { opacity: 0; transform: translateX(-32px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes slideInRight {
    from { opacity: 0; transform: translateX(32px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.92); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  @keyframes pulse-dot {
    0%, 100% { transform: scale(1); opacity: 1; }
    50%       { transform: scale(1.35); opacity: 0.7; }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-6px); }
  }
  .anim-fade-up   { animation: fadeUp 0.6s ease both; }
  .anim-fade-in   { animation: fadeIn 0.6s ease both; }
  .anim-slide-l   { animation: slideInLeft  0.6s ease both; }
  .anim-slide-r   { animation: slideInRight 0.6s ease both; }
  .anim-scale-in  { animation: scaleIn 0.55s ease both; }
  .anim-float     { animation: float 3.5s ease-in-out infinite; }
  .delay-100 { animation-delay: 0.10s; }
  .delay-150 { animation-delay: 0.15s; }
  .delay-200 { animation-delay: 0.20s; }
  .delay-250 { animation-delay: 0.25s; }
  .delay-300 { animation-delay: 0.30s; }
  .delay-400 { animation-delay: 0.40s; }
  .delay-500 { animation-delay: 0.50s; }
  .delay-600 { animation-delay: 0.60s; }
  .delay-700 { animation-delay: 0.70s; }
  .delay-800 { animation-delay: 0.80s; }
`;

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

const CATEGORIES = [
  {
    id: "cement",
    name: "Cement & Concrete",
    description: "OPC, PPC, RMC and all cement grades",
    materialCount: 12,
    icon: "🪨",
  },
  {
    id: "steel",
    name: "Steel & Iron",
    description: "TMT bars, MS rods, structural steel",
    materialCount: 18,
    icon: "🗿",
  },
  {
    id: "sand",
    name: "Sand & Aggregates",
    description: "River sand, M-sand, crushed stone",
    materialCount: 8,
    icon: "🟨",
  },
  {
    id: "bricks",
    name: "Bricks & Blocks",
    description: "Red bricks, AAC blocks, fly ash bricks",
    materialCount: 10,
    icon: "🧱",
  },
  {
    id: "tiles",
    name: "Tiles & Flooring",
    description: "Ceramic, vitrified, marble, granite",
    materialCount: 24,
    icon: "𖣯",
  },
  {
    id: "paint",
    name: "Paint & Coatings",
    description: "Exterior, interior, waterproof paints",
    materialCount: 15,
    icon: "🫟",
  },
  {
    id: "plumbing",
    name: "Plumbing",
    description: "PVC pipes, fittings, sanitary ware",
    materialCount: 20,
    icon: "🔩",
  },
  {
    id: "electrical",
    name: "Electrical",
    description: "Wires, switches, conduits, panels",
    materialCount: 16,
    icon: "⚡",
  },
];

const SHOWCASE_SLIDES = [
  {
    title: "Discover Nearby Sellers in Minutes",
    subtitle:
      "Search by location and material tags to get a clear, relevant supplier shortlist for your project site.",
    image:
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80",
    pointA: "Distance-aware results",
    pointB: "Live stock visibility",
  },
  {
    title: "Compare Price, Rating, and Stock Together",
    subtitle:
      "Evaluate suppliers on one screen and pick the best value without making dozens of phone calls.",
    image:
      "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80",
    pointA: "Transparent pricing",
    pointB: "Verified reviews",
  },
  {
    title: "Built for Builders and Shop Owners",
    subtitle:
      "Buyers source faster while sellers manage inventory, enquiries, and growth from one dashboard.",
    image:
      "https://images.unsplash.com/photo-1551836022-4c4c79ecde51?auto=format&fit=crop&w=1200&q=80",
    pointA: "Role-based experience",
    pointB: "Operational dashboards",
  },
];

const FAQ_ITEMS = [
  {
    q: "How does CemXpress decide which shops to show first?",
    a: "Results prioritize relevance to your location, material match, stock status, and seller quality indicators so you can act quickly.",
  },
  {
    q: "Can sellers update stock and prices in real time?",
    a: "Yes. Sellers can manage inventory, pricing, and product tags from their dashboard, so buyers see fresher information.",
  },
  {
    q: "Is the platform useful for small projects too?",
    a: "Absolutely. Whether you need a few items or recurring supply, filters and comparisons help reduce sourcing friction.",
  },
  {
    q: "Do buyers and sellers need separate accounts?",
    a: "Yes. Role-based login keeps workflows clean: buyers browse and enquire, sellers manage listings and operations.",
  },
];

const PLACEHOLDER_SHOPS = [
  {
    id: "s1",
    name: "Sharma Cement Depot",
    area: "Andheri East",
    distance: 2.4,
    rating: 4.7,
    isOpen: true,
    image:
      "https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=900&q=80",
    tags: ["Cement", "Sand", "Ready Mix"],
  },
  {
    id: "s2",
    name: "Metro Steel Traders",
    area: "Kurla",
    distance: 3.1,
    rating: 4.6,
    isOpen: true,
    image:
      "https://images.unsplash.com/photo-1531497865144-0464ef8fb9a9?auto=format&fit=crop&w=900&q=80",
    tags: ["TMT", "MS Rod", "Binding Wire"],
  },
  {
    id: "s3",
    name: "BuildRight Supplies",
    area: "Powai",
    distance: 4.2,
    rating: 4.8,
    isOpen: false,
    image:
      "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=900&q=80",
    tags: ["Bricks", "Tiles", "Adhesives"],
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [shops, setShops] = useState<any[]>([]);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    setShops([]);
  }, []);

  useEffect(() => {
    if (!carouselApi) return;

    const onSelect = () => {
      setActiveSlide(carouselApi.selectedScrollSnap());
    };

    onSelect();
    carouselApi.on("select", onSelect);

    const intervalId = setInterval(() => {
      carouselApi.scrollNext();
    }, 4500);

    return () => {
      carouselApi.off("select", onSelect);
      clearInterval(intervalId);
    };
  }, [carouselApi]);

  const stats = [
    { label: "Active Suppliers", value: "150+", icon: <Building2 className="h-5 w-5" /> },
    { label: "Material Listings", value: "2.4k", icon: <Package className="h-5 w-5" /> },
    { label: "Avg. Query Response", value: "< 15 min", icon: <Zap className="h-5 w-5" /> },
    { label: "Buyer Retention", value: "92%", icon: <BarChart3 className="h-5 w-5" /> },
  ];

  const features = [
    {
      icon: <MapPin className="w-5 h-5 text-blue-500" />,
      title: "Geo-smart Search",
      desc: "Surface suppliers closest to your site to reduce lead time and logistics cost.",
    },
    {
      icon: <Search className="w-5 h-5 text-blue-500" />,
      title: "Material Tag Discovery",
      desc: "Find specific SKUs quickly with structured tags and focused filters.",
    },
    {
      icon: <Shield className="w-5 h-5 text-blue-500" />,
      title: "Verified Seller Profiles",
      desc: "Review ratings, responsiveness, and profile trust indicators before buying.",
    },
    {
      icon: <Truck className="w-5 h-5 text-blue-500" />,
      title: "Delivery-aware Decisions",
      desc: "Compare shops with delivery capability to keep project timelines predictable.",
    },
    {
      icon: <Users className="w-5 h-5 text-blue-500" />,
      title: "Buyer and Seller Workflows",
      desc: "Dedicated journeys keep actions simple for both procurement and operations.",
    },
    {
      icon: <Sparkles className="w-5 h-5 text-blue-500" />,
      title: "Professional Interface",
      desc: "A polished experience designed for faster decisions and fewer sourcing mistakes.",
    },
  ];

  const featuredShops = shops.length > 0 ? shops : PLACEHOLDER_SHOPS;

  const statsRef   = useInView();
  const catsRef    = useInView();
  const featsRef   = useInView();
  const shopsRef   = useInView();
  const faqRef     = useInView();
  const ctaRef     = useInView();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <style>{animStyles}</style>
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_20%_20%,#334155,transparent_40%),radial-gradient(circle_at_80%_10%,#92400e,transparent_35%),linear-gradient(135deg,#0f172a,#1e293b)]">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1600&q=80')] bg-cover bg-center opacity-15" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-300/30 bg-blue-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-blue-200 anim-fade-in">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Professional Construction Marketplace
            </div>
            <h1 className="mb-6 text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl anim-fade-up delay-150">
              Source Building Materials with Speed, Clarity, and Trust
            </h1>
            <p className="mb-10 max-w-2xl text-base leading-relaxed text-slate-200 sm:text-lg anim-fade-up delay-300">
              CemXpress helps contractors and procurement teams discover nearby suppliers, compare prices, and move orders forward with less friction.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row anim-fade-up delay-400">
              <button
                onClick={() => navigate("/login?role=buyer")}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-6 py-3 font-medium text-slate-900 transition hover:bg-blue-400 hover:scale-105 active:scale-95"
                style={{ transition: "background-color 0.2s, transform 0.15s" }}
              >
                <Building2 className="h-4 w-4" />
                Continue as Buyer
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => navigate("/login?role=seller")}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-100/20 bg-slate-100/10 px-6 py-3 font-medium text-white transition hover:bg-slate-100/20 hover:scale-105 active:scale-95"
                style={{ transition: "background-color 0.2s, transform 0.15s" }}
              >
                <Package className="h-4 w-4" />
                Continue as Seller
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-2 anim-fade-up delay-500">
              <span className="text-xs uppercase tracking-wide text-slate-300">Popular searches</span>
              {["Cement", "TMT Steel", "River Sand", "AAC Blocks", "Tile Adhesive"].map((tag, i) => (
                <button
                  key={tag}
                  onClick={() => navigate("/login?role=buyer")}
                  className="rounded-full border border-slate-200/20 bg-slate-100/10 px-3 py-1 text-sm text-slate-200 transition hover:bg-slate-100/20 hover:scale-105"
                  style={{ animationDelay: `${0.55 + i * 0.07}s`, transition: "background-color 0.2s, transform 0.15s" }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="-mt-8 px-4 sm:px-6 lg:px-8">
        <div ref={statsRef.ref} className="mx-auto grid max-w-7xl grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/60 sm:grid-cols-4 sm:gap-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/30">
          {stats.map((item, i) => (
            <div
              key={item.label}
              className={`rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950 ${statsRef.visible ? "anim-scale-in" : "opacity-0"}`}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="mb-2 inline-flex rounded-lg bg-blue-100 p-2 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 anim-float" style={{ animationDelay: `${i * 0.4}s` }}>
                {item.icon}
              </div>
              <p className="text-xl font-semibold sm:text-2xl">{item.value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div ref={catsRef.ref} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className={`mb-10 max-w-2xl ${catsRef.visible ? "anim-slide-l" : "opacity-0"}`}>
            <h2 className="mb-3 text-3xl font-semibold tracking-tight">Browse by Material Category</h2>
            <p className="text-slate-600 dark:text-slate-300">
              Structured categories help buyers navigate quickly and help sellers get discovered for the right demand.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CATEGORIES.map((cat, i) => (
              <button
                key={cat.id}
                onClick={() => navigate("/login?role=buyer")}
                className={`group rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100/70 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-800/70 ${catsRef.visible ? "anim-fade-up" : "opacity-0"}`}
                style={{ animationDelay: `${i * 0.07}s` }}
              >
                <div className="mb-3 text-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">{cat.icon}</div>
                <h3 className="mb-1 text-base font-semibold">{cat.name}</h3>
                <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">{cat.description}</p>
                <div className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 dark:text-blue-400">
                  {cat.materialCount} listings <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 dark:bg-slate-950">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="anim-slide-l">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
              <Sparkles className="h-3.5 w-3.5" />
              New Showcase
            </div>
            <h2 className="mb-3 text-3xl font-semibold tracking-tight">Platform Highlights in Motion</h2>
            <p className="mb-6 text-slate-600 dark:text-slate-300">
              The slider below captures how CemXpress improves procurement velocity and decision quality.
            </p>
            <div className="space-y-3">
              {SHOWCASE_SLIDES.map((slide, index) => (
                <button
                  key={slide.title}
                  onClick={() => carouselApi?.scrollTo(index)}
                  className={`flex w-full items-start justify-between rounded-xl border p-3 text-left transition ${
                    activeSlide === index
                      ? "border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20"
                      : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
                  }`}
                >
                  <span>
                    <span className="block text-sm font-semibold">{slide.title}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{slide.pointA} � {slide.pointB}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-500" />
                </button>
              ))}
            </div>
          </div>

          <div className="relative anim-slide-r delay-200">
            <Carousel setApi={setCarouselApi} opts={{ loop: true }} className="w-full">
              <CarouselContent>
                {SHOWCASE_SLIDES.map((slide) => (
                  <CarouselItem key={slide.title}>
                    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/30">
                      <img src={slide.image} alt={slide.title} className="h-56 w-full object-cover sm:h-64" />
                      <div className="p-5">
                        <h3 className="mb-2 text-xl font-semibold">{slide.title}</h3>
                        <p className="mb-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{slide.subtitle}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2 className="h-4 w-4" />
                            {slide.pointA}
                          </span>
                          <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2 className="h-4 w-4" />
                            {slide.pointB}
                          </span>
                        </div>
                      </div>
                    </article>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="-left-3 border-slate-200 bg-white/90 text-slate-800 hover:bg-white dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-100" />
              <CarouselNext className="-right-3 border-slate-200 bg-white/90 text-slate-800 hover:bg-white dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-100" />
            </Carousel>
            <div className="mt-3 flex justify-center gap-1.5">
              {SHOWCASE_SLIDES.map((slide, index) => (
                <button
                  key={slide.title}
                  aria-label={`Go to slide ${index + 1}`}
                  onClick={() => carouselApi?.scrollTo(index)}
                  className={`h-1.5 rounded-full transition-all ${activeSlide === index ? "w-8 bg-blue-500" : "w-3 bg-slate-300 dark:bg-slate-700"}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-100 py-16 dark:bg-slate-900/40">
        <div ref={featsRef.ref} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className={`mb-10 text-center ${featsRef.visible ? "anim-fade-up" : "opacity-0"}`}>
            <h2 className="mb-3 text-3xl font-semibold tracking-tight">Everything You Need to Build Faster</h2>
            <p className="mx-auto max-w-2xl text-slate-600 dark:text-slate-300">
              CemXpress combines discovery, trust signals, and communication tools so projects can source materials confidently.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((item, i) => (
              <article
                key={item.title}
                className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-950 ${featsRef.visible ? "anim-fade-up" : "opacity-0"}`}
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="mb-3 inline-flex rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30 transition-transform duration-300 group-hover:scale-110">{item.icon}</div>
                <h3 className="mb-2 text-base font-semibold">{item.title}</h3>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{item.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div ref={shopsRef.ref} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className={`mb-8 flex items-end justify-between gap-4 ${shopsRef.visible ? "anim-fade-up" : "opacity-0"}`}>
            <div>
              <h2 className="mb-2 text-3xl font-semibold tracking-tight">Featured Shops Near You</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">Verified sellers with quality ratings and in-stock materials.</p>
            </div>
            <button
              onClick={() => navigate("/login?role=buyer")}
              className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 transition hover:text-blue-600 dark:text-blue-400"
            >
              View all sellers <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {featuredShops.slice(0, 3).map((shop, i) => (
              <article
                key={shop.id}
                onClick={() => navigate("/login?role=buyer")}
                className={`group cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 ${shopsRef.visible ? "anim-fade-up" : "opacity-0"}`}
                style={{ animationDelay: `${0.1 + i * 0.12}s` }}
              >
                <div className="relative h-44">
                  <img src={shop.image} alt={shop.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/65 to-transparent p-3">
                    <p className="text-sm font-medium text-white">{shop.area}</p>
                  </div>
                </div>
                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-semibold">{shop.name}</h3>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        shop.isOpen
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                          : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                      }`}
                    >
                      {shop.isOpen ? "Open" : "Closed"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-4 w-4" /> {shop.distance} km away
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Star className="h-4 w-4 fill-blue-400 text-blue-400" /> {shop.rating}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {shop.tags.map((tag: string) => (
                      <span key={tag} className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 py-16">
        <div ref={faqRef.ref} className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className={faqRef.visible ? "anim-slide-l" : "opacity-0"}>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-300/30 bg-blue-400/10 px-3 py-1 text-xs font-semibold text-blue-200">
              <CircleHelp className="h-3.5 w-3.5" />
              FAQs
            </div>
            <h2 className="mb-3 text-3xl font-semibold text-white">Common Questions</h2>
            <p className="max-w-lg text-slate-300">
              Quick answers about how the platform works for procurement teams and suppliers.
            </p>
          </div>

          <div className={`rounded-2xl border border-slate-700/70 bg-slate-900/70 p-5 backdrop-blur ${faqRef.visible ? "anim-slide-r delay-150" : "opacity-0"}`}>
            <Accordion type="single" collapsible>
              {FAQ_ITEMS.map((item, index) => (
                <AccordionItem key={item.q} value={`faq-${index}`} className="border-slate-700">
                  <AccordionTrigger className="text-sm font-medium text-slate-100 hover:no-underline">{item.q}</AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-slate-300">{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 dark:bg-slate-950">
        <div ref={ctaRef.ref} className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className={`mb-4 text-3xl font-semibold tracking-tight ${ctaRef.visible ? "anim-fade-up" : "opacity-0"}`}>Reduce Sourcing Delays. Build with Confidence.</h2>
          <p className={`mx-auto mb-8 max-w-2xl text-slate-600 dark:text-slate-300 ${ctaRef.visible ? "anim-fade-up delay-150" : "opacity-0"}`}>
            Start with CemXpress to discover trusted nearby suppliers and streamline material procurement from day one.
          </p>
          <div className={`flex flex-col justify-center gap-3 sm:flex-row ${ctaRef.visible ? "anim-fade-up delay-250" : "opacity-0"}`}>
            <button
              onClick={() => navigate("/register")}
              className="rounded-xl bg-blue-500 px-7 py-3 font-medium text-slate-900 transition hover:bg-blue-400 hover:scale-105 active:scale-95"
              style={{ transition: "background-color 0.2s, transform 0.15s" }}
            >
              Create Free Account
            </button>
            <button
              onClick={() => navigate("/login")}
              className="rounded-xl border border-slate-300 px-7 py-3 font-medium text-slate-700 transition hover:bg-slate-100 hover:scale-105 active:scale-95 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
              style={{ transition: "background-color 0.2s, transform 0.15s" }}
            >
              Sign In
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-slate-100 py-10 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 text-slate-900 dark:text-white">
                <Building2 className="h-5 w-5 text-blue-600" />
                <span className="text-base font-semibold">CemXpress</span>
              </div>
              <p className="text-sm">A modern procurement experience for construction materials.</p>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">For Buyers</p>
              <ul className="space-y-1 text-sm">
                <li>Browse Materials</li>
                <li>Compare Suppliers</li>
                <li>Track Enquiries</li>
              </ul>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">For Sellers</p>
              <ul className="space-y-1 text-sm">
                <li>Manage Inventory</li>
                <li>Handle Buyer Leads</li>
                <li>Grow Visibility</li>
              </ul>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Platform</p>
              <ul className="space-y-1 text-sm">
                <li>Security Standards</li>
                <li>Support</li>
                <li>Terms and Privacy</li>
              </ul>
            </div>
          </div>
          <p className="mt-8 border-t border-slate-200 pt-6 text-sm dark:border-slate-800">� 2026 CemXpress. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}