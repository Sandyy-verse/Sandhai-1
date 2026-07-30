import { useState, useEffect, useRef } from "react";
import { auth, db } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import {
  Search, Store, User, X, Menu, ArrowRight, Sprout, Shirt,
  UtensilsCrossed, Hammer, Gem, Home as HomeIcon, Eye, EyeOff,
  Loader2, CheckCircle2, ChevronRight, MapPin, ShoppingCart,
  Plus, Minus, ArrowLeft, PackageSearch, SlidersHorizontal, ArrowUpDown, Heart, Star, Package
} from "lucide-react";

const PALETTE = {
  navy: "#131921",
  navyLight: "#232F3E",
  navyHover: "#37475A",
  orange: "#FF9900",
  yellow: "#FFD814",
  yellowBorder: "#FCD200",
  link: "#007185",
  price: "#B12704",
  success: "#067D62",
  bg: "#EAEDED",
  paper: "#FFFFFF",
  ink: "#0F1111",
  muted: "#565959",
  border: "#D5D9D9",
  // legacy aliases kept so category tint colors below still read clearly
  indigo: "#131921",
  marigold: "#FF9900",
  chili: "#B12704",
  leaf: "#067D62",
};

const LANES = [
  { key: "A", name: "Farm & Garden", tag: "seeds, saplings, tools", icon: Sprout, tint: "#5C7A5E" },
  { key: "B", name: "Handloom & Apparel", tag: "sarees, fabric, tailoring", icon: Shirt, tint: "#C1442B" },
  { key: "C", name: "Food & Grocery", tag: "grains, spices, snacks", icon: UtensilsCrossed, tint: "#E8A93A" },
  { key: "D", name: "Tools & Hardware", tag: "hand tools, fittings", icon: Hammer, tint: "#1E2A52" },
  { key: "E", name: "Crafts & Art", tag: "pottery, woodwork, decor", icon: Gem, tint: "#8A5A3B" },
  { key: "F", name: "Home & Kitchen", tag: "utensils, storage, decor", icon: HomeIcon, tint: "#3B6B72" },
];

const PULSE_EVENTS = [
  "New seller onboarded \u2014 Erode",
  "Order placed \u2014 Lane B, Coimbatore",
  "5 kg turmeric listed \u2014 Farm Lane",
  "Buyer verified \u2014 Salem",
  "Stall opened \u2014 Handloom & Apparel",
  "Order delivered \u2014 Namakkal",
  "New review, 5 stars \u2014 Tools & Hardware",
  "Seller payout processed \u2014 Komarapalayam",
];

const PRODUCTS = [
  { id: "a1", img: "https://loremflickr.com/400/400/coconut,sapling,plant", laneKey: "A", name: "Coconut saplings (set of 5)", price: 450, mrp: 540, unit: "set", seller: "Murugan Nursery", town: "Erode", rating: 4.6, reviews: 92, prime: true },
  { id: "a2", img: "https://loremflickr.com/400/400/tomato,seeds,garden", laneKey: "A", name: "Organic tomato seeds", price: 60, unit: "packet", seller: "Green Earth Farms", town: "Salem", rating: 4.3, reviews: 54, prime: true },
  { id: "a3", img: "https://loremflickr.com/400/400/garden,tool,trowel", laneKey: "A", name: "Hand trowel & fork set", price: 180, unit: "set", seller: "Kisan Tools", town: "Namakkal", rating: 4.1, reviews: 37, prime: false },
  { id: "a4", img: "https://loremflickr.com/400/400/spray,bottle,organic", laneKey: "A", name: "Neem-based pest spray", price: 220, mrp: 260, unit: "bottle", seller: "Vaigai Organics", town: "Coimbatore", rating: 4.7, reviews: 118, prime: true },
  { id: "a5", img: "https://loremflickr.com/400/400/areca,palm,plant", laneKey: "A", name: "Areca palm sapling", price: 350, mrp: 420, unit: "piece", seller: "Malabar Nursery", town: "Coimbatore", rating: 4.4, reviews: 58, prime: true },
  { id: "a6", img: "https://loremflickr.com/400/400/manure,soil,farm", laneKey: "A", name: "Cow dung manure (10 kg)", price: 150, unit: "bag", seller: "Vaiyapuri Organics", town: "Namakkal", rating: 4.5, reviews: 76, prime: false },
  { id: "a7", img: "https://loremflickr.com/400/400/garden,hose", laneKey: "A", name: "Garden hose (15 m)", price: 480, mrp: 600, unit: "piece", seller: "Kisan Tools", town: "Namakkal", rating: 4.2, reviews: 33, prime: true },
  { id: "a8", img: "https://loremflickr.com/400/400/irrigation,drip,farm", laneKey: "A", name: "Drip irrigation kit", price: 890, mrp: 1100, unit: "kit", seller: "AgroFlow", town: "Salem", rating: 4.6, reviews: 145, prime: true },
  { id: "b1", img: "https://loremflickr.com/400/400/silk,saree,india", laneKey: "B", name: "Kanchipuram silk saree", price: 4200, unit: "piece", seller: "Meenakshi Silks", town: "Kanchipuram", rating: 4.9, reviews: 210, prime: true },
  { id: "b2", img: "https://loremflickr.com/400/400/dhoti,cotton,fabric", laneKey: "B", name: "Handwoven cotton dhoti", price: 650, mrp: 780, unit: "piece", seller: "Sengunthar Weaves", town: "Komarapalayam", rating: 4.4, reviews: 76, prime: true },
  { id: "b3", img: "https://loremflickr.com/400/400/fabric,textile,print", laneKey: "B", name: "Block-print cotton fabric (2m)", price: 380, unit: "length", seller: "Erode Textiles", town: "Erode", rating: 4.2, reviews: 44, prime: false },
  { id: "b4", img: "https://loremflickr.com/400/400/tailor,sewing,fabric", laneKey: "B", name: "Tailoring \u2014 blouse stitching", price: 250, unit: "service", seller: "Lakshmi Tailors", town: "Coimbatore", rating: 3.9, reviews: 61, prime: false },
  { id: "b5", img: "https://loremflickr.com/400/400/shirt,cotton,men", laneKey: "B", name: "Madurai cotton shirt, men's", price: 520, mrp: 650, unit: "piece", seller: "Meenakshi Fabrics", town: "Madurai", rating: 4.3, reviews: 88, prime: true },
  { id: "b6", img: "https://loremflickr.com/400/400/saree,cotton,india", laneKey: "B", name: "Chettinad cotton saree", price: 1450, mrp: 1800, unit: "piece", seller: "Karaikudi Weaves", town: "Karaikudi", rating: 4.7, reviews: 156, prime: true },
  { id: "b7", img: "https://loremflickr.com/400/400/dress,kids,cotton", laneKey: "B", name: "Kids cotton frock", price: 320, unit: "piece", seller: "Little Blooms", town: "Erode", rating: 4.1, reviews: 41, prime: false },
  { id: "b8", img: "https://loremflickr.com/400/400/dupatta,embroidery,scarf", laneKey: "B", name: "Embroidered cotton dupatta", price: 280, mrp: 350, unit: "piece", seller: "Sengunthar Weaves", town: "Komarapalayam", rating: 4.0, reviews: 27, prime: true },
  { id: "c1", img: "https://loremflickr.com/400/400/turmeric,spice", laneKey: "C", name: "Erode turmeric (1 kg)", price: 180, unit: "kg", seller: "Ponni Spices", town: "Erode", rating: 4.8, reviews: 302, prime: true },
  { id: "c2", img: "https://loremflickr.com/400/400/rice,grain", laneKey: "C", name: "Idli rice (5 kg)", price: 260, unit: "bag", seller: "Cauvery Grains", town: "Thanjavur", rating: 4.5, reviews: 145, prime: true },
  { id: "c3", img: "https://loremflickr.com/400/400/coffee,powder", laneKey: "C", name: "Filter coffee powder (500g)", price: 210, mrp: 250, unit: "pack", seller: "Mullai Coffee Works", town: "Coimbatore", rating: 4.7, reviews: 189, prime: true },
  { id: "c4", img: "https://loremflickr.com/400/400/snack,indian,food", laneKey: "C", name: "Homemade murukku (1 kg)", price: 320, unit: "kg", seller: "Amma's Kitchen", town: "Salem", rating: 4.9, reviews: 267, prime: false },
  { id: "c5", img: "https://loremflickr.com/400/400/jaggery,sugar", laneKey: "C", name: "Palm jaggery (1 kg)", price: 140, unit: "kg", seller: "Kolli Hills Naturals", town: "Namakkal", rating: 4.6, reviews: 98, prime: true },
  { id: "c6", img: "https://loremflickr.com/400/400/sesame,oil,bottle", laneKey: "C", name: "Gingelly oil (1 L)", price: 320, mrp: 380, unit: "bottle", seller: "Chekku Oil Mills", town: "Tiruchengode", rating: 4.8, reviews: 212, prime: true },
  { id: "c7", img: "https://loremflickr.com/400/400/banana,chips,snack", laneKey: "C", name: "Banana chips (500 g)", price: 160, unit: "pack", seller: "Amma's Kitchen", town: "Salem", rating: 4.5, reviews: 173, prime: false },
  { id: "c8", img: "https://loremflickr.com/400/400/spice,powder,masala", laneKey: "C", name: "Sambar powder (200 g)", price: 90, mrp: 110, unit: "pack", seller: "Ponni Spices", town: "Erode", rating: 4.7, reviews: 249, prime: true },
  { id: "d1", img: "https://loremflickr.com/400/400/hammer,tool", laneKey: "D", name: "Claw hammer, steel handle", price: 280, unit: "piece", seller: "Anna Hardware", town: "Namakkal", rating: 4.0, reviews: 29, prime: true },
  { id: "d2", img: "https://loremflickr.com/400/400/pipe,plumbing", laneKey: "D", name: "Pipe fittings assortment", price: 340, unit: "set", seller: "Sri Ram Traders", town: "Salem", rating: 3.8, reviews: 22, prime: false },
  { id: "d3", img: "https://loremflickr.com/400/400/drill,tool", laneKey: "D", name: "Cordless drill (12V)", price: 2100, mrp: 2500, unit: "piece", seller: "Bharathi Tools", town: "Coimbatore", rating: 4.5, reviews: 88, prime: true },
  { id: "d4", img: "https://loremflickr.com/400/400/padlock,lock", laneKey: "D", name: "Padlock set (3 pcs)", price: 150, unit: "set", seller: "Anna Hardware", town: "Namakkal", rating: 4.2, reviews: 41, prime: true },
  { id: "d5", img: "https://loremflickr.com/400/400/wrench,tool", laneKey: "D", name: "Adjustable wrench set", price: 420, mrp: 520, unit: "set", seller: "Bharathi Tools", town: "Coimbatore", rating: 4.3, reviews: 66, prime: true },
  { id: "d6", img: "https://loremflickr.com/400/400/led,light,tool", laneKey: "D", name: "LED work light, rechargeable", price: 380, unit: "piece", seller: "Sri Ram Traders", town: "Salem", rating: 4.1, reviews: 34, prime: true },
  { id: "d7", img: "https://loremflickr.com/400/400/tape,measure", laneKey: "D", name: "Measuring tape (5 m)", price: 90, unit: "piece", seller: "Anna Hardware", town: "Namakkal", rating: 4.0, reviews: 52, prime: false },
  { id: "d8", img: "https://loremflickr.com/400/400/grinder,tool", laneKey: "D", name: "Angle grinder", price: 1850, mrp: 2200, unit: "piece", seller: "Bharathi Tools", town: "Coimbatore", rating: 4.4, reviews: 77, prime: true },
  { id: "e1", img: "https://loremflickr.com/400/400/terracotta,pot,clay", laneKey: "E", name: "Terracotta water pot", price: 320, unit: "piece", seller: "Vellalore Potters", town: "Coimbatore", rating: 4.6, reviews: 63, prime: true },
  { id: "e2", img: "https://loremflickr.com/400/400/wood,carving,elephant", laneKey: "E", name: "Rosewood carved elephant", price: 890, unit: "piece", seller: "Channapatna Crafts", town: "Erode", rating: 4.8, reviews: 97, prime: false },
  { id: "e3", img: "https://loremflickr.com/400/400/painting,art,gold", laneKey: "E", name: "Tanjore painting (small)", price: 1600, mrp: 1950, unit: "piece", seller: "Thanjavur Art House", town: "Thanjavur", rating: 4.9, reviews: 134, prime: true },
  { id: "e4", img: "https://loremflickr.com/400/400/bamboo,basket", laneKey: "E", name: "Bamboo wall basket", price: 210, unit: "piece", seller: "Kolli Hills Weaves", town: "Namakkal", rating: 4.3, reviews: 48, prime: true },
  { id: "e5", img: "https://loremflickr.com/400/400/stencil,art,craft", laneKey: "E", name: "Kolam stencil set", price: 180, unit: "set", seller: "Kanyakumari Crafts", town: "Kanyakumari", rating: 4.2, reviews: 39, prime: false },
  { id: "e6", img: "https://loremflickr.com/400/400/palmleaf,art,manuscript", laneKey: "E", name: "Palm-leaf manuscript art, framed", price: 1200, mrp: 1500, unit: "piece", seller: "Thanjavur Art House", town: "Thanjavur", rating: 4.8, reviews: 61, prime: true },
  { id: "e7", img: "https://loremflickr.com/400/400/coconut,shell,bowl", laneKey: "E", name: "Coconut shell decor bowl", price: 260, unit: "piece", seller: "Vellalore Potters", town: "Coimbatore", rating: 4.3, reviews: 45, prime: true },
  { id: "e8", img: "https://loremflickr.com/400/400/bronze,statue,idol", laneKey: "E", name: "Bronze Nataraja statue, small", price: 2400, mrp: 2900, unit: "piece", seller: "Nachiarkoil Brass", town: "Kumbakonam", rating: 4.9, reviews: 88, prime: true },
  { id: "f1", img: "https://loremflickr.com/400/400/brass,bowl,urn", laneKey: "F", name: "Brass uruli, medium", price: 1450, unit: "piece", seller: "Nachiarkoil Brass", town: "Kumbakonam", rating: 4.7, reviews: 71, prime: true },
  { id: "f2", img: "https://loremflickr.com/400/400/steel,tin,container", laneKey: "F", name: "Steel storage tins (set of 3)", price: 380, unit: "set", seller: "Home Basics", town: "Salem", rating: 4.1, reviews: 39, prime: true },
  { id: "f3", img: "https://loremflickr.com/400/400/banana,leaf,plate", laneKey: "F", name: "Banana leaf plates (50 pcs)", price: 140, unit: "pack", seller: "Green Eco Store", town: "Erode", rating: 4.4, reviews: 85, prime: false },
  { id: "f4", img: "https://loremflickr.com/400/400/fan,palm,handmade", laneKey: "F", name: "Palm-leaf hand fan", price: 45, unit: "piece", seller: "Kanyakumari Crafts", town: "Kanyakumari", rating: 4.0, reviews: 26, prime: false },
  { id: "f5", img: "https://loremflickr.com/400/400/steamer,kitchen", laneKey: "F", name: "Idli steamer (4-plate)", price: 620, mrp: 750, unit: "piece", seller: "Home Basics", town: "Salem", rating: 4.5, reviews: 132, prime: true },
  { id: "f6", img: "https://loremflickr.com/400/400/stone,grinder,kitchen", laneKey: "F", name: "Stone grinder, tabletop", price: 3200, unit: "piece", seller: "Sri Meenakshi Stone Works", town: "Madurai", rating: 4.6, reviews: 94, prime: true },
  { id: "f7", img: "https://loremflickr.com/400/400/coconut,scraper,kitchen", laneKey: "F", name: "Coconut scraper, wall-mount", price: 220, unit: "piece", seller: "Anna Hardware", town: "Namakkal", rating: 4.2, reviews: 36, prime: false },
  { id: "f8", img: "https://loremflickr.com/400/400/copper,bottle,water", laneKey: "F", name: "Copper water bottle (1 L)", price: 340, mrp: 420, unit: "piece", seller: "Nachiarkoil Brass", town: "Kumbakonam", rating: 4.4, reviews: 108, prime: true },
];

const PRICE_BANDS = [
  { key: "all", label: "All prices", test: () => true },
  { key: "under200", label: "Under \u20b9200", test: (p) => p.price < 200 },
  { key: "200-500", label: "\u20b9200\u2013500", test: (p) => p.price >= 200 && p.price <= 500 },
  { key: "500-1500", label: "\u20b9500\u20131,500", test: (p) => p.price > 500 && p.price <= 1500 },
  { key: "above1500", label: "Above \u20b91,500", test: (p) => p.price > 1500 },
];

function useCounter(target, active, duration = 1400) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = null;
    let raf;
    const step = (t) => {
      if (start === null) start = t;
      const p = Math.min((t - start) / duration, 1);
      setVal(Math.floor(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration]);
  return val;
}

function AuthModal({ open, onClose, onComplete }) {
  const [mode, setMode] = useState("signup"); // signup | login
  const [role, setRole] = useState("buyer"); // buyer | seller
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | loading | success

  if (!open) return null;

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (mode === "signup" && form.name.trim().length < 2) e.name = "Enter your full name";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email";
    if (mode === "signup" && !/^[0-9]{10}$/.test(form.phone.replace(/\D/g, ""))) e.phone = "Enter a 10-digit phone number";
    if (form.password.length < 6) e.password = "At least 6 characters";
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setStatus("loading");
    try {
      if (mode === "signup") {
        const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
        await updateProfile(cred.user, { displayName: form.name });
        await setDoc(doc(db, "users", cred.user.uid), {
          name: form.name,
          email: form.email,
          phone: form.phone,
          role,
          createdAt: serverTimestamp(),
        });
      } else {
        await signInWithEmailAndPassword(auth, form.email, form.password);
      }
      setStatus("success");
    } catch (err) {
      setStatus("idle");
      const map = {
        "auth/email-already-in-use": "An account with this email already exists",
        "auth/invalid-credential": "Incorrect email or password",
        "auth/wrong-password": "Incorrect email or password",
        "auth/user-not-found": "No account found with this email",
        "auth/weak-password": "Password is too weak",
      };
      setErrors({ form: map[err.code] || "Something went wrong. Please try again." });
    }
  };

  const close = () => {
    const wasSuccess = status === "success";
    setStatus("idle");
    setErrors({});
    onClose();
    if (wasSuccess) onComplete?.();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(20,25,43,0.55)" }}
      onClick={close}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: PALETTE.paper }}
        onClick={(e) => e.stopPropagation()}
      >
        {status === "success" ? (
          <div className="p-10 flex flex-col items-center text-center gap-3">
            <CheckCircle2 size={40} color={PALETTE.leaf} />
            <h3 className="text-xl font-bold" style={{ color: PALETTE.ink, fontFamily: "Arial, sans-serif" }}>
              {mode === "signup" ? "Stall reserved" : "Welcome back"}
            </h3>
            <p className="text-sm opacity-70" style={{ color: PALETTE.ink }}>
              {mode === "signup"
                ? `Your ${role} account is ready. Check ${form.email} to confirm.`
                : `Signed in as ${form.email}.`}
            </p>
            <button
              onClick={close}
              className="mt-2 px-5 py-2 rounded-lg text-sm font-semibold"
              style={{ background: PALETTE.indigo, color: PALETTE.paper }}
            >
              Continue
            </button>
          </div>
        ) : (
          <>
            <div className="px-6 pt-6 pb-2 flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest opacity-60" style={{ color: PALETTE.ink }}>
                  {mode === "signup" ? "Open a stall or start buying" : "Enter the bazaar"}
                </p>
                <h2 className="text-2xl font-bold mt-1" style={{ color: PALETTE.ink, fontFamily: "Arial, sans-serif" }}>
                  {mode === "signup" ? "Create your account" : "Log in"}
                </h2>
              </div>
              <button onClick={close} aria-label="Close" className="p-1 rounded-md hover:bg-black/5">
                <X size={20} color={PALETTE.ink} />
              </button>
            </div>

            <div className="px-6 flex gap-2 mt-2">
              {["signup", "login"].map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setErrors({}); }}
                  className="flex-1 py-2 text-sm font-semibold rounded-lg border transition"
                  style={{
                    borderColor: mode === m ? PALETTE.indigo : "rgba(20,25,43,0.15)",
                    background: mode === m ? PALETTE.indigo : "transparent",
                    color: mode === m ? PALETTE.paper : PALETTE.ink,
                  }}
                >
                  {m === "signup" ? "Sign up" : "Log in"}
                </button>
              ))}
            </div>

            {mode === "signup" && (
              <div className="px-6 mt-4">
                <p className="text-xs font-semibold mb-2 opacity-70" style={{ color: PALETTE.ink }}>I want to</p>
                <div className="flex gap-2">
                  {[
                    { k: "buyer", label: "Buy from stalls", icon: User },
                    { k: "seller", label: "Run a stall", icon: Store },
                  ].map(({ k, label, icon: Icon }) => (
                    <button
                      key={k}
                      onClick={() => setRole(k)}
                      className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium"
                      style={{
                        borderColor: role === k ? PALETTE.marigold : "rgba(20,25,43,0.15)",
                        background: role === k ? "rgba(232,169,58,0.15)" : "transparent",
                        color: PALETTE.ink,
                      }}
                    >
                      <Icon size={16} /> {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={submit} className="px-6 py-5 flex flex-col gap-3">
              {mode === "signup" && (
                <Field label="Full name" error={errors.name}>
                  <input
                    value={form.name}
                    onChange={update("name")}
                    placeholder="e.g. Pranesh Kumar"
                    className="w-full bg-transparent outline-none text-sm"
                  />
                </Field>
              )}
              <Field label="Email" error={errors.email}>
                <input
                  value={form.email}
                  onChange={update("email")}
                  placeholder="you@example.com"
                  className="w-full bg-transparent outline-none text-sm"
                />
              </Field>
              {mode === "signup" && (
                <Field label="Phone number" error={errors.phone}>
                  <input
                    value={form.phone}
                    onChange={update("phone")}
                    placeholder="10-digit mobile number"
                    className="w-full bg-transparent outline-none text-sm"
                  />
                </Field>
              )}
              <Field label="Password" error={errors.password}>
                <div className="flex items-center gap-2">
                  <input
                    type={showPw ? "text" : "password"}
                    value={form.password}
                    onChange={update("password")}
                    placeholder="At least 6 characters"
                    className="w-full bg-transparent outline-none text-sm"
                  />
                  <button type="button" onClick={() => setShowPw((s) => !s)} className="opacity-60">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </Field>

              {errors.form && (
                <p className="text-xs text-center" style={{ color: PALETTE.chili }}>{errors.form}</p>
              )}
              <button
                type="submit"
                disabled={status === "loading"}
                className="mt-2 w-full py-3 rounded-md font-semibold text-sm flex items-center justify-center gap-2 border"
                style={{ background: PALETTE.yellow, borderColor: PALETTE.yellowBorder, color: PALETTE.ink }}
              >
                {status === "loading" ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Please wait
                  </>
                ) : mode === "signup" ? (
                  `Create ${role} account`
                ) : (
                  "Log in"
                )}
              </button>
              <p className="text-[11px] text-center opacity-50" style={{ color: PALETTE.ink }}>
                By continuing you agree to the bazaar's stall rules and buyer protections.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold opacity-70" style={{ color: PALETTE.ink }}>{label}</span>
      <div
        className="mt-1 px-3 py-2 rounded-lg border"
        style={{ borderColor: error ? PALETTE.chili : "rgba(20,25,43,0.15)", background: "rgba(255,255,255,0.6)" }}
      >
        {children}
      </div>
      {error && <span className="text-[11px]" style={{ color: PALETTE.chili }}>{error}</span>}
    </label>
  );
}

function ProductImage({ product, lane, className, iconSize = 40 }) {
  const [errored, setErrored] = useState(false);
  return (
    <div className={className} style={{ background: `${lane.tint}12` }}>
      {errored ? (
        <lane.icon size={iconSize} color={lane.tint} strokeWidth={1.25} />
      ) : (
        <img
          src={product.img}
          alt={product.name}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={() => setErrored(true)}
        />
      )}
    </div>
  );
}

function StarRow({ rating, size = 13 }) {
  return (
    <div className="flex items-center gap-[1px]">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          color={PALETTE.orange}
          fill={rating >= n - 0.25 ? PALETTE.orange : "none"}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

function ProductCard({ product, qtyInCart, onAdd, onChangeQty, isWishlisted, onToggleWishlist }) {
  const lane = LANES.find((l) => l.key === product.laneKey);
  const discount = product.mrp ? Math.round((1 - product.price / product.mrp) * 100) : 0;
  return (
    <div className="p-3 flex flex-col relative bg-white rounded-sm border hover:shadow-md transition-shadow" style={{ borderColor: PALETTE.border }}>
      <button
        onClick={() => onToggleWishlist(product.id)}
        aria-label={isWishlisted ? "Remove from wishlist" : "Save to wishlist"}
        className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full flex items-center justify-center bg-white/90 hover:bg-white"
      >
        <Heart size={14} color={PALETTE.muted} fill={isWishlisted ? PALETTE.price : "none"} />
      </button>
      <div className="w-full aspect-square rounded-sm flex items-center justify-center mb-2 overflow-hidden">
        <ProductImage product={product} lane={lane} className="w-full h-full flex items-center justify-center" />
      </div>
      {discount > 0 && (
        <span
          className="self-start text-[11px] font-bold px-1.5 py-0.5 rounded-sm mb-1"
          style={{ background: PALETTE.success, color: "#fff" }}
        >
          {discount}% off
        </span>
      )}
      <h3
        className="text-sm leading-snug line-clamp-2 hover:underline cursor-pointer"
        style={{ color: PALETTE.link }}
      >
        {product.name}
      </h3>
      <p className="text-xs mt-1" style={{ color: PALETTE.muted }}>{product.seller} \u2014 {product.town}</p>
      <div className="flex items-center gap-1.5 mt-1">
        <StarRow rating={product.rating} />
        <span className="text-xs hover:underline cursor-pointer" style={{ color: PALETTE.link }}>{product.reviews.toLocaleString()}</span>
      </div>
      <div className="mt-1.5">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[13px] align-top" style={{ color: PALETTE.ink }}>\u20b9</span>
          <span className="text-xl font-medium leading-none" style={{ color: PALETTE.ink }}>{product.price.toLocaleString()}</span>
          <span className="text-xs" style={{ color: PALETTE.muted }}>/ {product.unit}</span>
        </div>
        {product.mrp && (
          <p className="text-xs mt-0.5" style={{ color: PALETTE.muted }}>
            M.R.P: <span className="line-through">\u20b9{product.mrp.toLocaleString()}</span>
          </p>
        )}
      </div>
      {product.prime && (
        <div className="flex items-center gap-1 mt-1.5">
          <span className="text-[11px] font-bold px-1 rounded-[2px]" style={{ background: PALETTE.link, color: "#fff" }}>prime</span>
          <span className="text-[11px]" style={{ color: PALETTE.muted }}>FREE delivery</span>
        </div>
      )}
      {qtyInCart > 0 ? (
        <div
          className="mt-2 flex items-center justify-between rounded-full border"
          style={{ background: PALETTE.yellow, borderColor: PALETTE.yellowBorder }}
        >
          <button onClick={() => onChangeQty(product.id, -1)} className="p-2" aria-label="Decrease quantity">
            <Minus size={14} color={PALETTE.ink} />
          </button>
          <span className="text-sm font-semibold" style={{ color: PALETTE.ink }}>{qtyInCart}</span>
          <button onClick={() => onChangeQty(product.id, 1)} className="p-2" aria-label="Increase quantity">
            <Plus size={14} color={PALETTE.ink} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => onAdd(product)}
          className="mt-2 w-full py-1.5 rounded-full text-xs font-semibold border"
          style={{ background: PALETTE.yellow, borderColor: PALETTE.yellowBorder, color: PALETTE.ink }}
        >
          Add to Cart
        </button>
      )}
    </div>
  );
}

function BrowseView({ title, subtitle, products, cart, onAdd, onChangeQty, onBack, wishlist, onToggleWishlist, emptyMessage }) {
  const [sort, setSort] = useState("recommended");
  const [priceBand, setPriceBand] = useState("all");
  const [topRatedOnly, setTopRatedOnly] = useState(false);

  const [collapsed, setCollapsed] = useState({});

  const band = PRICE_BANDS.find((b) => b.key === priceBand);
  const filtered = products.filter(band.test).filter((p) => !topRatedOnly || p.rating >= 4.5);
  const sorted =
    sort === "price-asc" ? [...filtered].sort((a, b) => a.price - b.price)
    : sort === "price-desc" ? [...filtered].sort((a, b) => b.price - a.price)
    : sort === "rating" ? [...filtered].sort((a, b) => b.rating - a.rating)
    : filtered;

  const folders = LANES
    .map((lane) => ({ lane, items: sorted.filter((p) => p.laneKey === lane.key) }))
    .filter((g) => g.items.length > 0);

  const toggleFolder = (key) => setCollapsed((c) => ({ ...c, [key]: !c[key] }));

  return (
    <section className="max-w-[1500px] mx-auto px-3 py-6">
      <button onClick={onBack} className="flex items-center gap-1 text-xs font-semibold opacity-60 hover:opacity-100 mb-5">
        <ArrowLeft size={14} /> Back to bazaar
      </button>
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: "Arial, sans-serif", color: PALETTE.ink }}>{title}</h2>
        <p className="text-sm opacity-60 mt-1">{subtitle}</p>
      </div>

      {products.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-6 pb-5 border-b" style={{ borderColor: "rgba(20,25,43,0.08)" }}>
          <div className="flex items-center gap-1.5 text-xs font-semibold opacity-50 mr-1">
            <SlidersHorizontal size={13} /> Filter
          </div>
          {PRICE_BANDS.map((b) => (
            <button
              key={b.key}
              onClick={() => setPriceBand(b.key)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold border transition"
              style={{
                borderColor: priceBand === b.key ? PALETTE.indigo : "rgba(20,25,43,0.15)",
                background: priceBand === b.key ? PALETTE.indigo : "transparent",
                color: priceBand === b.key ? PALETTE.paper : PALETTE.ink,
              }}
            >
              {b.label}
            </button>
          ))}
          <button
            onClick={() => setTopRatedOnly((s) => !s)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition"
            style={{
              borderColor: topRatedOnly ? PALETTE.marigold : "rgba(20,25,43,0.15)",
              background: topRatedOnly ? "rgba(232,169,58,0.15)" : "transparent",
              color: PALETTE.ink,
            }}
          >
            <Star size={12} fill={topRatedOnly ? PALETTE.marigold : "none"} color={PALETTE.marigold} /> 4.5+ rated
          </button>

          <div className="flex items-center gap-2 ml-auto">
            <ArrowUpDown size={13} className="opacity-50" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="text-xs font-semibold rounded-lg border px-2 py-1.5 bg-transparent outline-none"
              style={{ borderColor: "rgba(20,25,43,0.15)", color: PALETTE.ink }}
            >
              <option value="recommended">Recommended</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="rating">Highest rated</option>
            </select>
          </div>
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center text-center py-16 gap-3">
          <PackageSearch size={32} color={PALETTE.ink} className="opacity-40" />
          <p className="text-sm opacity-60">
            {products.length === 0
              ? emptyMessage || "No stalls match that search yet. Try another lane or keyword."
              : "No items in this price range. Try a different filter."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {folders.map(({ lane, items }) => {
            const isCollapsed = !!collapsed[lane.key];
            return (
              <div key={lane.key} className="rounded-sm border overflow-hidden bg-white" style={{ borderColor: PALETTE.border }}>
                <button
                  onClick={() => toggleFolder(lane.key)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                  style={{ background: `${lane.tint}0d` }}
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${lane.tint}20` }}>
                    <lane.icon size={17} color={lane.tint} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm" style={{ fontFamily: "Arial, sans-serif", color: PALETTE.ink }}>{lane.name}</h3>
                    <p className="text-xs opacity-50">{items.length} item{items.length === 1 ? "" : "s"}</p>
                  </div>
                  <ChevronRight
                    size={16}
                    color={lane.tint}
                    className="transition-transform flex-shrink-0"
                    style={{ transform: isCollapsed ? "rotate(0deg)" : "rotate(90deg)" }}
                  />
                </button>
                {!isCollapsed && (
                  <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 pt-1">
                    {items.map((p) => (
                      <ProductCard
                        key={p.id}
                        product={p}
                        qtyInCart={cart.find((c) => c.id === p.id)?.qty || 0}
                        onAdd={onAdd}
                        onChangeQty={onChangeQty}
                        isWishlisted={wishlist.includes(p.id)}
                        onToggleWishlist={onToggleWishlist}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function CartDrawer({ open, cart, onClose, onChangeQty, onRemove, onCheckout, onBrowse }) {
  if (!open) return null;
  const items = cart.map((c) => ({ ...c, product: PRODUCTS.find((p) => p.id === c.id) }));
  const total = items.reduce((s, i) => s + i.qty * i.product.price, 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: "rgba(20,25,43,0.55)" }} onClick={onClose}>
      <div
        className="w-full max-w-sm h-full flex flex-col"
        style={{ background: PALETTE.paper }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 flex items-center justify-between border-b" style={{ borderColor: "rgba(20,25,43,0.08)" }}>
          <h3 className="text-lg font-bold" style={{ fontFamily: "Arial, sans-serif", color: PALETTE.ink }}>Your basket</h3>
          <button onClick={onClose} aria-label="Close cart" className="p-1 rounded-md hover:bg-black/5">
            <X size={20} color={PALETTE.ink} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <ShoppingCart size={28} color={PALETTE.ink} className="opacity-30" />
            <p className="text-sm opacity-60">Your basket is empty.</p>
            <button
              onClick={onBrowse}
              className="px-4 py-2 rounded-lg text-xs font-semibold"
              style={{ background: PALETTE.indigo, color: PALETTE.paper }}
            >
              Browse the lanes
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
              {items.map((i) => (
                <div key={i.id} className="flex gap-3">
                  <div className="w-14 h-14 rounded-sm overflow-hidden flex-shrink-0 border" style={{ borderColor: PALETTE.border }}>
                    {(() => {
                      const lane = LANES.find((l) => l.key === i.product.laneKey);
                      return <ProductImage product={i.product} lane={lane} className="w-full h-full flex items-center justify-center" iconSize={18} />;
                    })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: PALETTE.ink }}>{i.product.name}</p>
                    <p className="text-xs opacity-50">\u20b9{i.product.price.toLocaleString()} / {i.product.unit}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <button onClick={() => onChangeQty(i.id, -1)} className="p-1 rounded border" style={{ borderColor: "rgba(20,25,43,0.15)" }}>
                        <Minus size={12} color={PALETTE.ink} />
                      </button>
                      <span className="text-xs font-semibold w-4 text-center">{i.qty}</span>
                      <button onClick={() => onChangeQty(i.id, 1)} className="p-1 rounded border" style={{ borderColor: "rgba(20,25,43,0.15)" }}>
                        <Plus size={12} color={PALETTE.ink} />
                      </button>
                      <button onClick={() => onRemove(i.id)} className="ml-auto text-xs opacity-50 hover:opacity-100" style={{ color: PALETTE.chili }}>
                        Remove
                      </button>
                    </div>
                  </div>
                  <span className="text-sm font-semibold flex-shrink-0" style={{ color: PALETTE.ink }}>
                    \u20b9{(i.qty * i.product.price).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
            <div className="px-5 py-4 border-t" style={{ borderColor: "rgba(20,25,43,0.08)" }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm opacity-60">Total</span>
                <span className="text-lg font-bold" style={{ color: PALETTE.ink }}>\u20b9{total.toLocaleString()}</span>
              </div>
              <button
                onClick={onCheckout}
                className="w-full py-2.5 rounded-md font-semibold text-sm border"
                style={{ background: PALETTE.yellow, borderColor: PALETTE.yellowBorder, color: PALETTE.ink }}
              >
                Proceed to checkout
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function OrdersView({ orders, onBack, onBrowse }) {
  return (
    <section className="max-w-3xl mx-auto px-5 py-6">
      <button onClick={onBack} className="flex items-center gap-1 text-xs font-semibold opacity-60 hover:opacity-100 mb-5">
        <ArrowLeft size={14} /> Back to bazaar
      </button>
      <h2 className="text-2xl md:text-3xl font-bold mb-6" style={{ fontFamily: "Arial, sans-serif", color: PALETTE.ink }}>
        Your orders
      </h2>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center text-center py-16 gap-3">
          <Package size={32} color={PALETTE.ink} className="opacity-40" />
          <p className="text-sm opacity-60">No orders yet. Once you check out, they'll show up here.</p>
          <button
            onClick={onBrowse}
            className="mt-1 px-4 py-2 rounded-lg text-xs font-semibold"
            style={{ background: PALETTE.indigo, color: PALETTE.paper }}
          >
            Browse the lanes
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((o) => (
            <div key={o.id} className="rounded-2xl border p-5" style={{ borderColor: "rgba(20,25,43,0.08)" }}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-bold" style={{ fontFamily: "Arial, sans-serif", color: PALETTE.ink }}>{o.id}</p>
                  <p className="text-xs opacity-50">{o.placedAt.toLocaleDateString()} \u00b7 {o.placedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
                <span
                  className="text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded"
                  style={{ background: "rgba(92,122,94,0.15)", color: PALETTE.leaf, fontFamily: "Arial, sans-serif" }}
                >
                  Order placed
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                {o.items.map((i) => (
                  <div key={i.id} className="flex items-center justify-between text-sm">
                    <span className="opacity-70">{i.name} \u00d7 {i.qty}</span>
                    <span style={{ color: PALETTE.ink }}>\u20b9{(i.qty * i.price).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t flex items-center justify-between" style={{ borderColor: "rgba(20,25,43,0.08)" }}>
                <span className="text-xs opacity-50">Total</span>
                <span className="text-sm font-bold" style={{ color: PALETTE.ink }}>\u20b9{o.total.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function MarketplaceLanding() {
  const [authOpen, setAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [statsActive, setStatsActive] = useState(false);
  const statsRef = useRef(null);

  const [page, setPage] = useState("home"); // home | browse | orders
  const [browseFilter, setBrowseFilter] = useState(null); // { type: 'lane', key } | { type: 'search', q } | { type: 'wishlist' }
  const [cart, setCart] = useState([]); // [{ id, qty }]
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlist, setWishlist] = useState([]); // [id, id, ...]
  const [orders, setOrders] = useState([]); // [{ id, items, total, placedAt }]
  const [checkoutIntent, setCheckoutIntent] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const sellers = useCounter(18400, statsActive);
  const buyers = useCounter(96500, statsActive);
  const towns = useCounter(214, statsActive);

  // Track Firebase auth state.
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => setCurrentUser(user));
    return unsub;
  }, []);

  // Once signed in, subscribe to this user's orders from Firestore in real time.
  useEffect(() => {
    if (!currentUser) {
      setOrders([]);
      return;
    }
    const q = query(
      collection(db, "orders"),
      where("userId", "==", currentUser.uid),
      orderBy("placedAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const fetched = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: data.orderRef || d.id,
          items: data.items,
          total: data.total,
          placedAt: data.placedAt?.toDate ? data.placedAt.toDate() : new Date(),
        };
      });
      setOrders(fetched);
    });
    return unsub;
  }, [currentUser]);

  const goHome = () => { setPage("home"); setBrowseFilter(null); };
  const openLane = (key) => { setBrowseFilter({ type: "lane", key }); setPage("browse"); setSearchFocused(false); setSearchQuery(""); window.scrollTo(0, 0); };
  const runSearch = (q) => { if (!q.trim()) return; setBrowseFilter({ type: "search", q }); setPage("browse"); setSearchFocused(false); setSearchQuery(""); window.scrollTo(0, 0); };
  const openWishlist = () => { setBrowseFilter({ type: "wishlist" }); setPage("browse"); window.scrollTo(0, 0); };
  const openOrders = () => { setPage("orders"); window.scrollTo(0, 0); };

  const toggleWishlist = (id) => {
    setWishlist((w) => (w.includes(id) ? w.filter((x) => x !== id) : [...w, id]));
  };

  const placeOrder = async () => {
    const user = currentUser || auth.currentUser;
    if (cart.length === 0 || !user) return;
    const items = cart.map((c) => {
      const p = PRODUCTS.find((x) => x.id === c.id);
      return { id: c.id, name: p.name, qty: c.qty, price: p.price };
    });
    const total = items.reduce((s, i) => s + i.qty * i.price, 0);
    const orderRef = `ORD-${1000 + orders.length + 1}`;
    await addDoc(collection(db, "orders"), {
      userId: user.uid,
      orderRef,
      items,
      total,
      placedAt: serverTimestamp(),
    });
    setCart([]);
    openOrders();
  };

  const handleAuthComplete = () => {
    if (checkoutIntent) {
      setCheckoutIntent(false);
      placeOrder();
    }
  };

  const addToCart = (product) => {
    setCart((c) => {
      const found = c.find((i) => i.id === product.id);
      if (found) return c.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i));
      return [...c, { id: product.id, qty: 1 }];
    });
  };
  const changeQty = (id, delta) => {
    setCart((c) =>
      c
        .map((i) => (i.id === id ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0)
    );
  };
  const removeFromCart = (id) => setCart((c) => c.filter((i) => i.id !== id));
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const liveSearchResults = searchQuery.trim()
    ? PRODUCTS.filter((p) => {
        const q = searchQuery.trim().toLowerCase();
        const lane = LANES.find((l) => l.key === p.laneKey);
        return p.name.toLowerCase().includes(q) || lane.name.toLowerCase().includes(q);
      }).slice(0, 5)
    : [];

  const browseProducts =
    browseFilter?.type === "lane"
      ? PRODUCTS.filter((p) => p.laneKey === browseFilter.key)
      : browseFilter?.type === "search"
      ? PRODUCTS.filter((p) => {
          const q = browseFilter.q.trim().toLowerCase();
          const lane = LANES.find((l) => l.key === p.laneKey);
          return p.name.toLowerCase().includes(q) || lane.name.toLowerCase().includes(q);
        })
      : browseFilter?.type === "wishlist"
      ? PRODUCTS.filter((p) => wishlist.includes(p.id))
      : [];
  const browseTitle =
    browseFilter?.type === "lane"
      ? LANES.find((l) => l.key === browseFilter.key)?.name
      : browseFilter?.type === "search"
      ? `Results for "${browseFilter.q}"`
      : browseFilter?.type === "wishlist"
      ? "Your wishlist"
      : "";
  const browseSubtitle =
    browseFilter?.type === "lane"
      ? LANES.find((l) => l.key === browseFilter.key)?.tag
      : browseFilter?.type === "wishlist"
      ? `${browseProducts.length} saved item${browseProducts.length === 1 ? "" : "s"}`
      : `${browseProducts.length} item${browseProducts.length === 1 ? "" : "s"} found`;

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsActive(true); },
      { threshold: 0.4 }
    );
    if (statsRef.current) obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div style={{ background: PALETTE.bg, color: PALETTE.ink, fontFamily: "Inter, sans-serif" }} className="min-h-screen">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .marquee-track { animation: marquee 26s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .marquee-track { animation: none; } }
      `}</style>

      {/* NAV \u2014 Amazon-style two-tier header */}
      <header className="sticky top-0 z-40">
        <div style={{ background: PALETTE.navy }}>
          <div className="max-w-[1500px] mx-auto px-3 py-2 flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-2 py-1.5 rounded-sm border border-transparent hover:border-white" onClick={goHome}>
              <div className="w-7 h-7 rounded-sm flex items-center justify-center" style={{ background: PALETTE.orange }}>
                <Store size={15} color={PALETTE.navy} />
              </div>
              <span className="font-bold text-lg tracking-tight text-white hidden sm:inline">santhai</span>
            </button>

            <button className="hidden lg:flex flex-col px-2 py-1 rounded-sm border border-transparent hover:border-white text-left" aria-label="Delivery location">
              <span className="text-[11px] text-white/60 leading-tight">Delivering to</span>
              <span className="text-xs font-bold text-white flex items-center gap-1 leading-tight">
                <MapPin size={12} /> Tamil Nadu 641001
              </span>
            </button>

            <form
              className="relative flex-1 max-w-2xl mx-auto"
              onSubmit={(e) => { e.preventDefault(); runSearch(searchQuery); }}
            >
              <div className="flex items-center rounded-md overflow-hidden" style={{ background: "#fff" }}>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                  placeholder="Search Santhai"
                  className="w-full bg-transparent outline-none text-sm px-3 py-2"
                  style={{ color: PALETTE.ink }}
                />
                <button
                  type="submit"
                  aria-label="Search"
                  className="flex items-center justify-center px-4 h-full"
                  style={{ background: PALETTE.orange }}
                >
                  <Search size={18} color={PALETTE.navy} />
                </button>
              </div>
              {searchFocused && searchQuery.trim() && (
                <div className="absolute top-full mt-1 left-0 w-full rounded-md shadow-2xl overflow-hidden z-50" style={{ background: PALETTE.paper }}>
                  {liveSearchResults.length === 0 ? (
                    <p className="px-4 py-3 text-xs" style={{ color: PALETTE.muted }}>No matches yet.</p>
                  ) : (
                    liveSearchResults.map((p) => {
                      const lane = LANES.find((l) => l.key === p.laneKey);
                      return (
                        <button
                          key={p.id}
                          onClick={() => runSearch(p.name)}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-black/5 border-b"
                          style={{ borderColor: PALETTE.border }}
                        >
                          <lane.icon size={14} color={lane.tint} />
                          <span className="flex-1 min-w-0">
                            <span className="block text-xs font-semibold truncate" style={{ color: PALETTE.ink }}>{p.name}</span>
                            <span className="block text-[11px]" style={{ color: PALETTE.muted }}>{lane.name}</span>
                          </span>
                          <span className="text-xs font-semibold flex-shrink-0" style={{ color: PALETTE.ink }}>\u20b9{p.price.toLocaleString()}</span>
                        </button>
                      );
                    })
                  )}
                  <button
                    onClick={() => runSearch(searchQuery)}
                    className="w-full px-4 py-2.5 text-xs font-semibold text-left"
                    style={{ color: PALETTE.link }}
                  >
                    View all results for "{searchQuery}"
                  </button>
                </div>
              )}
            </form>

            <div className="hidden md:flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => (currentUser ? signOut(auth) : setAuthOpen(true))}
                className="flex flex-col px-2 py-1 rounded-sm border border-transparent hover:border-white text-left"
              >
                <span className="text-[11px] text-white/70 leading-tight">
                  {currentUser ? `Hello, ${currentUser.displayName || "there"}` : "Hello, sign in"}
                </span>
                <span className="text-xs font-bold text-white leading-tight">
                  {currentUser ? "Sign out" : "Accounts & Lists"}
                </span>
              </button>
              <button onClick={openOrders} className="relative flex flex-col px-2 py-1 rounded-sm border border-transparent hover:border-white text-left">
                <span className="text-[11px] text-white/70 leading-tight">Returns</span>
                <span className="text-xs font-bold text-white leading-tight">& Orders</span>
                {orders.length > 0 && (
                  <span
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center"
                    style={{ background: PALETTE.orange, color: PALETTE.navy }}
                  >
                    {orders.length > 9 ? "9+" : orders.length}
                  </span>
                )}
              </button>
              <button onClick={openWishlist} className="relative p-2 rounded-sm border border-transparent hover:border-white" aria-label="Open wishlist">
                <Heart size={22} color="#fff" />
                {wishlist.length > 0 && (
                  <span
                    className="absolute top-0 right-0 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center"
                    style={{ background: PALETTE.orange, color: PALETTE.navy }}
                  >
                    {wishlist.length > 9 ? "9+" : wishlist.length}
                  </span>
                )}
              </button>
              <button onClick={() => setCartOpen(true)} className="relative flex items-end gap-1 px-2 py-1 rounded-sm border border-transparent hover:border-white" aria-label="Open cart">
                <ShoppingCart size={26} color="#fff" />
                {cartCount > 0 && (
                  <span
                    className="absolute -top-1 left-3 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center"
                    style={{ background: PALETTE.orange, color: PALETTE.navy }}
                  >
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
                <span className="text-xs font-bold text-white leading-tight hidden lg:inline">Cart</span>
              </button>
            </div>

            <div className="flex items-center gap-1 md:hidden">
              <button onClick={() => setCartOpen(true)} className="relative p-2" aria-label="Open cart">
                <ShoppingCart size={22} color="#fff" />
                {cartCount > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center"
                    style={{ background: PALETTE.orange, color: PALETTE.navy }}
                  >
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </button>
              <button onClick={() => setMenuOpen((s) => !s)}>
                <Menu size={24} color="#fff" />
              </button>
            </div>
          </div>
        </div>

        {/* department strip */}
        <div className="hidden md:flex items-center gap-4 px-3 py-1.5 text-xs font-medium overflow-x-auto" style={{ background: PALETTE.navyLight, color: "#fff" }}>
          <button onClick={() => setMenuOpen((s) => !s)} className="flex items-center gap-1 font-bold flex-shrink-0 hover:opacity-80">
            <Menu size={15} /> All
          </button>
          {LANES.map((l) => (
            <button key={l.key} onClick={() => openLane(l.key)} className="flex-shrink-0 opacity-90 hover:opacity-100 hover:underline">{l.name}</button>
          ))}
          <button onClick={openWishlist} className="flex-shrink-0 opacity-90 hover:opacity-100 hover:underline">Wishlist</button>
          <button onClick={openOrders} className="flex-shrink-0 opacity-90 hover:opacity-100 hover:underline">Your Orders</button>
        </div>

        {menuOpen && (
          <div className="md:hidden px-5 py-4 flex flex-col gap-3" style={{ background: PALETTE.navyLight }}>
            <form
              className="flex items-center gap-2 px-3 py-2 rounded-md bg-white"
              onSubmit={(e) => { e.preventDefault(); runSearch(searchQuery); setMenuOpen(false); }}
            >
              <Search size={14} style={{ color: PALETTE.muted }} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Santhai"
                className="w-full bg-transparent outline-none text-sm"
              />
            </form>
            {LANES.map((l) => (
              <button key={l.key} onClick={() => { openLane(l.key); setMenuOpen(false); }} className="text-left py-1 text-sm font-medium text-white/90">
                {l.name}
              </button>
            ))}
            <button onClick={() => { openWishlist(); setMenuOpen(false); }} className="text-left py-1 text-sm font-medium text-white/90">
              Wishlist {wishlist.length > 0 ? `(${wishlist.length})` : ""}
            </button>
            <button onClick={() => { openOrders(); setMenuOpen(false); }} className="text-left py-1 text-sm font-medium text-white/90">
              Your orders {orders.length > 0 ? `(${orders.length})` : ""}
            </button>
            {currentUser ? (
              <button
                onClick={() => { signOut(auth); setMenuOpen(false); }}
                className="text-left py-2 font-semibold text-white"
              >
                Sign out ({currentUser.displayName || currentUser.email})
              </button>
            ) : (
              <>
                <button onClick={() => setAuthOpen(true)} className="text-left py-2 font-semibold text-white">Sign in</button>
                <button onClick={() => setAuthOpen(true)} className="text-left py-2 font-semibold rounded-md px-3" style={{ background: PALETTE.yellow, color: PALETTE.ink }}>Create account</button>
              </>
            )}
          </div>
        )}
      </header>

      {page === "browse" && (
        <BrowseView
          key={browseFilter?.type === "wishlist" ? "wishlist" : browseTitle}
          title={browseTitle}
          subtitle={browseSubtitle}
          products={browseProducts}
          cart={cart}
          onAdd={addToCart}
          onChangeQty={changeQty}
          onBack={goHome}
          wishlist={wishlist}
          onToggleWishlist={toggleWishlist}
          emptyMessage={
            browseFilter?.type === "wishlist"
              ? "Nothing saved yet. Tap the heart on any item to add it here."
              : undefined
          }
        />
      )}

      {page === "orders" && (
        <OrdersView orders={orders} onBack={goHome} onBrowse={goHome} />
      )}

      {page === "home" && (
      <>
      {/* HERO — Amazon-style banner with overlapping department cards */}
      <section
        className="pt-6 pb-24"
        style={{ background: `linear-gradient(180deg, ${PALETTE.navyLight} 0%, ${PALETTE.navyLight} 55%, transparent 55%)` }}
      >
        <div className="max-w-[1500px] mx-auto px-3">
          <div className="pt-2 pb-8 text-center">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase" style={{ color: PALETTE.orange }}>
              One bazaar, every lane
            </p>
            <h1 className="text-2xl md:text-4xl font-bold mt-2" style={{ color: "#fff" }}>
              Every stall in town, open at once
            </h1>
            <p className="mt-2 text-sm md:text-base max-w-lg mx-auto" style={{ color: "rgba(255,255,255,0.7)" }}>
              Thousands of small sellers across Tamil Nadu, all in one basket.
            </p>
            <button
              onClick={() => setAuthOpen(true)}
              className="mt-5 px-6 py-2.5 rounded-md font-semibold text-sm border"
              style={{ background: PALETTE.yellow, borderColor: PALETTE.yellowBorder, color: PALETTE.ink }}
            >
              Start shopping
            </button>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {LANES.map((l) => (
              <div key={l.key} className="bg-white rounded-sm p-4 shadow-sm">
                <h3 className="font-bold text-lg" style={{ color: PALETTE.ink }}>{l.name}</h3>
                <p className="text-xs mt-0.5 mb-3" style={{ color: PALETTE.muted }}>{l.tag}</p>
                <div className="w-full aspect-[16/9] rounded-sm flex items-center justify-center mb-3" style={{ background: `${l.tint}12` }}>
                  <l.icon size={40} color={l.tint} strokeWidth={1.25} />
                </div>
                <button onClick={() => openLane(l.key)} className="text-sm font-medium hover:underline" style={{ color: PALETTE.link }}>
                  Shop {l.name}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEALS TICKER — signature element */}
      <div className="overflow-hidden" style={{ background: PALETTE.navy }}>
        <div className="max-w-[1500px] mx-auto px-3 flex items-center gap-2 py-2">
          <span
            className="flex-shrink-0 text-[11px] font-bold px-2 py-1 rounded-sm uppercase tracking-wide"
            style={{ background: PALETTE.orange, color: PALETTE.navy }}
          >
            Live
          </span>
          <div className="overflow-hidden flex-1">
            <div className="flex whitespace-nowrap marquee-track" style={{ width: "200%" }}>
              {[...PULSE_EVENTS, ...PULSE_EVENTS, ...PULSE_EVENTS, ...PULSE_EVENTS].map((ev, i) => (
                <span key={i} className="mx-6 text-xs flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.75)" }}>
                  <span className="w-1 h-1 rounded-full" style={{ background: PALETTE.orange }} /> {ev}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* LANES / CATEGORIES — full grid */}
      <section id="lanes" className="max-w-[1500px] mx-auto px-3 py-10">
        <h2 className="text-xl font-bold mb-4" style={{ color: PALETTE.ink }}>Shop by department</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {LANES.map((l) => (
            <div
              key={l.key}
              onClick={() => openLane(l.key)}
              className="group bg-white rounded-sm p-4 border hover:shadow-md transition cursor-pointer"
              style={{ borderColor: PALETTE.border }}
            >
              <div className="w-10 h-10 rounded-sm flex items-center justify-center mb-3" style={{ background: `${l.tint}15` }}>
                <l.icon size={18} color={l.tint} />
              </div>
              <h3 className="font-bold text-sm" style={{ color: PALETTE.ink }}>{l.name}</h3>
              <p className="text-xs mt-1" style={{ color: PALETTE.muted }}>{l.tag}</p>
              <div className="mt-3 text-xs font-semibold flex items-center gap-1" style={{ color: PALETTE.link }}>
                Shop now <ChevronRight size={12} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SCALE / STATS */}
      <section ref={statsRef} className="py-12" style={{ background: PALETTE.navy }}>
        <div className="max-w-[1500px] mx-auto px-3">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase mb-8" style={{ color: PALETTE.orange }}>
            Built to hold the whole crowd
          </p>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { val: sellers, label: "sellers with open stalls" },
              { val: buyers, label: "buyers browsing every day" },
              { val: towns, label: "towns across Tamil Nadu" },
            ].map((s, i) => (
              <div key={i}>
                <p className="text-4xl md:text-5xl font-bold" style={{ color: "#fff" }}>
                  {s.val.toLocaleString()}
                  <span style={{ color: PALETTE.orange }}>+</span>
                </p>
                <p className="text-sm mt-2" style={{ color: "rgba(255,255,255,0.6)" }}>{s.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex items-center gap-2 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
            <MapPin size={14} /> Every account signs up in seconds, even during festival-week traffic.
          </div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="max-w-[1500px] mx-auto px-5 py-16 text-center">
        <h2 className="text-2xl md:text-3xl font-bold max-w-lg mx-auto" style={{ color: PALETTE.ink }}>
          Your stall or your cart is waiting.
        </h2>
        <button
          onClick={() => setAuthOpen(true)}
          className="mt-6 px-7 py-2.5 rounded-md font-semibold text-sm inline-flex items-center gap-2 border"
          style={{ background: PALETTE.yellow, borderColor: PALETTE.yellowBorder, color: PALETTE.ink }}
        >
          Create your account <ArrowRight size={16} />
        </button>
      </section>
      </>
      )}

      <footer style={{ background: PALETTE.navyLight }}>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="w-full py-3 text-xs font-medium text-center text-white hover:bg-white/5"
          style={{ background: PALETTE.navyHover }}
        >
          Back to top
        </button>
        <div className="max-w-[1500px] mx-auto px-5 py-8 grid sm:grid-cols-3 gap-6 text-xs" style={{ color: "rgba(255,255,255,0.75)" }}>
          <div>
            <p className="font-bold text-white mb-2">Get to know us</p>
            <p className="py-0.5">About Santhai</p>
            <p className="py-0.5">Careers</p>
            <p className="py-0.5">Press releases</p>
          </div>
          <div>
            <p className="font-bold text-white mb-2">Make money with us</p>
            <p className="py-0.5">Open a stall</p>
            <p className="py-0.5">Sell on Santhai</p>
            <p className="py-0.5">Become a delivery partner</p>
          </div>
          <div>
            <p className="font-bold text-white mb-2">Let us help you</p>
            <p className="py-0.5">Your account</p>
            <p className="py-0.5">Your orders</p>
            <p className="py-0.5">Help centre</p>
          </div>
        </div>
        <div className="border-t py-4" style={{ borderColor: "rgba(255,255,255,0.15)" }}>
          <div className="max-w-[1500px] mx-auto px-5 text-xs flex items-center justify-between" style={{ color: "rgba(255,255,255,0.5)" }}>
            <span>Santhai Marketplace</span>
            <span>Built for Tamil Nadu's sellers and buyers</span>
          </div>
        </div>
      </footer>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} onComplete={handleAuthComplete} />
      <CartDrawer
        open={cartOpen}
        cart={cart}
        onClose={() => setCartOpen(false)}
        onChangeQty={changeQty}
        onRemove={removeFromCart}
        onBrowse={() => { setCartOpen(false); goHome(); }}
        onCheckout={() => {
          setCartOpen(false);
          if (currentUser) {
            placeOrder();
          } else {
            setCheckoutIntent(true);
            setAuthOpen(true);
          }
        }}
      />
    </div>
  );
}
