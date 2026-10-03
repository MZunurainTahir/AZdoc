/**
 * AZdoc Pharmacy & Medicine Store Screen
 * Features:
 * - Live GPS Location detection with Google Maps directions
 * - Real-time Nearest Partner Stores calculation with distance (km) and direct phone calling
 * - Domain & Category filters across Humans, Livestock, Pets, Plants, Crops
 * - Cart management & Instant Cash-on-Delivery Checkout
 * - Live Delivery Radar & Departure Tracker
 */
import { useEffect, useState, useCallback } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { useDomain } from "../context/DomainContext";
import { DOMAINS, DomainId } from "../lib/domains";
import {
  MEDICINES,
  addToCart,
  setCartQty,
  getCart,
  cartLinesDetailed,
  cartTotal,
  placeOrder,
  listOrders,
  type Medicine,
  type CartLine,
} from "../lib/pharmacy";
import {
  PHARMACY_STORES,
  PharmacyStore,
  getStoresForCity,
} from "../lib/pharmacyStores";
import {
  getCurrentUserLocation,
  getGoogleMapsUrl,
  UserCoordinates,
} from "../lib/geolocationService";
import type { LocalOrder } from "../lib/db";
import DeliveryTrackerModal from "../components/DeliveryTrackerModal";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Package,
  Search,
  CheckCircle2,
  Truck,
  ShieldAlert,
  MapPin,
  Navigation,
  Phone,
  Compass,
  Store,
  LocateFixed,
  Bike
} from "lucide-react";

export default function PharmacyScreen() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const { domainId } = useDomain();
  const ur = lang === "ur";

  // State
  const [filter, setFilter] = useState<DomainId | "all">(domainId);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartLine[]>(getCart());
  const [showCart, setShowCart] = useState(false);
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [placing, setPlacing] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<LocalOrder | null>(null);
  const [orders, setOrders] = useState<LocalOrder[]>([]);

  // Geolocation & Nearest Store State
  const [userLocation, setUserLocation] = useState<UserCoordinates | null>(null);
  const [locating, setLocating] = useState(false);
  const [selectedStore, setSelectedStore] = useState<PharmacyStore>(PHARMACY_STORES[0]);
  const [nearbyStores, setNearbyStores] = useState<PharmacyStore[]>(PHARMACY_STORES);
  const [trackedOrder, setTrackedOrder] = useState<LocalOrder | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setOrders(await listOrders(user.id));
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Request user location automatically on mount or trigger
  const detectLocation = useCallback(async () => {
    setLocating(true);
    try {
      const coords = await getCurrentUserLocation();
      setUserLocation(coords);
      if (coords.address && !address) {
        setAddress(coords.address);
      }

      // Sort nearby stores by GPS distance
      const sorted = getStoresForCity("lahore", coords.lat, coords.lng);
      setNearbyStores(sorted);
      if (sorted.length > 0) {
        setSelectedStore(sorted[0]);
      }
    } catch (err) {
      console.warn("[Location] Detection error:", err);
    } finally {
      setLocating(false);
    }
  }, [address]);

  useEffect(() => {
    detectLocation();
  }, [detectLocation]);

  // Filter items
  const items = MEDICINES.filter((m) => {
    if (filter !== "all" && m.domain !== filter) return false;
    if (categoryFilter !== "all" && m.category !== categoryFilter) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.nameUrdu.includes(query) ||
      m.description.toLowerCase().includes(q)
    );
  });

  const detailed = cartLinesDetailed(cart);
  const total = cartTotal(cart);
  const cartCount = cart.reduce((s, l) => s + l.qty, 0);

  const add = (m: Medicine) => setCart(addToCart(m.id));
  const dec = (m: Medicine) => {
    const line = cart.find((l) => l.medicineId === m.id);
    if (line) setCart(setCartQty(m.id, line.qty - 1));
  };

  const submitOrder = async () => {
    if (!user || !address.trim() || !phone.trim() || cart.length === 0) return;
    setPlacing(true);
    try {
      const order = await placeOrder({
        userId: user.id,
        address: address.trim(),
        phone: phone.trim(),
      });
      setPlacedOrder(order);
      setCart(getCart());
      await refresh();
      // Automatically pop live delivery radar
      setTrackedOrder(order);
    } finally {
      setPlacing(false);
    }
  };

  const googleMapsStoreLink = selectedStore
    ? getGoogleMapsUrl(selectedStore.lat, selectedStore.lng, selectedStore.name)
    : "https://maps.google.com";

  return (
    <div className="flex flex-col flex-1 bg-bg-primary pb-8">
      {/* Title & Cart Bar */}
      <div className="px-5 pt-4 pb-2 flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
          <Store className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h1 className="font-heading font-bold text-lg text-text-primary leading-tight">
              {ur ? "AZ فارمیسی و میڈیکل اسٹور" : "AZ Pharmacy & Store"}
            </h1>
            <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 text-[10px] font-bold">
              COD
            </span>
          </div>
          <p className="text-[11px] text-text-muted">
            {ur ? "قریبی اسٹور سے تصدیق شدہ ادویات — فاسٹ ڈیلیوری" : "Genuine medicines from nearest verified stores"}
          </p>
        </div>
        <button
          onClick={() => setShowCart((s) => !s)}
          className="relative w-10 h-10 rounded-2xl bg-bg-elevated border border-border flex items-center justify-center text-text-primary hover:border-primary/40 shadow-sm transition-all active:scale-95"
        >
          <ShoppingCart className="w-5 h-5" />
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center shadow-md animate-scaleIn">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {/* GPS Location & Nearest Store Bar */}
      <div className="mx-5 my-2.5 p-3.5 bg-gradient-to-br from-primary/10 via-primary-bg/50 to-bg-elevated border border-primary/20 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary">
            <Compass className="w-4 h-4 text-primary animate-spin [animation-duration:8s]" />
            <span>{ur ? "آپ کی لوکیشن اور قریبی فارمیسی" : "Live Location & Nearest Store"}</span>
          </div>
          <button
            onClick={detectLocation}
            disabled={locating}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-primary text-white text-[10px] font-bold hover:bg-primary-light transition-all disabled:opacity-50 shadow-sm"
          >
            <LocateFixed className={`w-3 h-3 ${locating ? "animate-spin" : ""}`} />
            <span>{locating ? (ur ? "تلاش جاری..." : "Locating...") : ur ? "لوکیشن ریفریش" : "Detect GPS"}</span>
          </button>
        </div>

        {userLocation && (
          <p className="text-[11px] text-text-muted flex items-center gap-1 mb-2">
            <MapPin className="w-3.5 h-3.5 text-danger shrink-0" />
            <span className="truncate">{userLocation.address || userLocation.cityName}</span>
          </p>
        )}

        {/* Selected store mini-card */}
        <div className="bg-bg-elevated border border-border rounded-xl p-2.5 flex items-center justify-between gap-2 shadow-xs">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse shrink-0" />
              <p className="text-xs font-bold text-text-primary truncate">
                {ur ? selectedStore.nameUr : selectedStore.name}
              </p>
            </div>
            <p className="text-[10px] text-text-muted truncate mt-0.5">
              {selectedStore.distanceKm !== undefined ? `📍 ${selectedStore.distanceKm} km away` : "📍 Nearest"} · ⏱️ ~{selectedStore.deliveryMins} mins · ⭐ {selectedStore.rating}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <a
              href={`tel:${selectedStore.phone}`}
              className="p-2 rounded-xl bg-bg-secondary text-primary hover:bg-primary hover:text-white transition-colors"
              title={ur ? "اسٹور پر کال کریں" : "Call Store"}
            >
              <Phone className="w-3.5 h-3.5" />
            </a>
            <a
              href={googleMapsStoreLink}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors flex items-center gap-1 text-[10px] font-bold"
              title={ur ? "گوگل میپ پر دیکھیں" : "View on Google Map"}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{ur ? "نقشہ" : "Map"}</span>
            </a>
          </div>
        </div>

        {/* Other nearby store pills */}
        {nearbyStores.length > 1 && (
          <div className="mt-2 flex gap-1.5 overflow-x-auto no-scrollbar">
            {nearbyStores.slice(0, 4).map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedStore(s)}
                className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                  selectedStore.id === s.id
                    ? "bg-primary text-white border-primary shadow-xs"
                    : "bg-bg-elevated text-text-muted border-border hover:border-primary/40"
                }`}
              >
                {ur ? s.nameUr.split(" ")[0] : s.name.split(" ")[0]} ({s.distanceKm ?? 1.2}km)
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search Input */}
      <div className="px-5 mb-3 relative">
        <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={ur ? "دوا، سپلیمنٹ یا سامان تلاش کریں…" : "Search medicines, supplements, equipment…"}
          className="w-full pl-10 pr-4 py-2.5 text-xs bg-bg-elevated border border-border rounded-2xl text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-primary/50 shadow-xs"
        />
      </div>

      {/* Domain Filters */}
      <div className="px-5 mb-2 flex gap-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setFilter("all")}
          className={`shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all ${
            filter === "all"
              ? "bg-primary text-white border-primary shadow-sm"
              : "bg-bg-elevated text-text-muted border-border hover:border-primary/30"
          }`}
        >
          {ur ? "سب" : "All Living"}
        </button>
        {DOMAINS.map((d) => (
          <button
            key={d.id}
            onClick={() => setFilter(d.id)}
            className={`shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all flex items-center gap-1 ${
              filter === d.id
                ? `${d.theme.solid} text-white border-transparent shadow-sm`
                : "bg-bg-elevated text-text-muted border-border hover:border-primary/30"
            }`}
          >
            <span>{d.emoji}</span>
            {ur ? d.nameUrdu : d.name}
          </button>
        ))}
      </div>

      {/* Category Filter Pills */}
      <div className="px-5 mb-3 flex gap-1.5 overflow-x-auto no-scrollbar">
        {[
          { key: "all", labelEn: "All Items", labelUr: "تمام اشیاء" },
          { key: "medicine", labelEn: "Medicines", labelUr: "ادویات" },
          { key: "supplement", labelEn: "Supplements", labelUr: "سپلیمنٹس" },
          { key: "equipment", labelEn: "Equipment", labelUr: "آلات" },
          { key: "pesticide", labelEn: "Agro / Plant Care", labelUr: "پودوں کی نگہداشت" },
        ].map((cat) => (
          <button
            key={cat.key}
            onClick={() => setCategoryFilter(cat.key)}
            className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
              categoryFilter === cat.key
                ? "bg-text-primary text-bg-primary border-text-primary"
                : "bg-bg-secondary text-text-muted border-border/60 hover:text-text-primary"
            }`}
          >
            {ur ? cat.labelUr : cat.labelEn}
          </button>
        ))}
      </div>

      {/* Cart Drawer / Panel */}
      {showCart && (
        <div className="mx-5 mb-4 bg-bg-elevated border border-border rounded-3xl p-4 shadow-xl animate-scaleIn">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-primary" />
              <p className="font-heading font-bold text-sm text-text-primary">
                {ur ? "آپ کی آرڈر ٹوکری" : "Your Medicine Cart"}
              </p>
            </div>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="text-[10px] font-bold text-danger hover:underline flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> {ur ? "خالی کریں" : "Clear"}
              </button>
            )}
          </div>

          {placedOrder ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-14 h-14 rounded-full bg-success/10 border border-success/30 flex items-center justify-center mx-auto text-success">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <p className="font-heading font-bold text-base text-text-primary">
                  {ur ? "آرڈر کامیابی سے ہو گیا!" : "Order Successfully Placed!"}
                </p>
                <p className="text-xs text-text-muted mt-1">
                  {ur
                    ? `آرڈر #${placedOrder.localId?.slice(-6) ?? ""} · Rs. ${placedOrder.total_pkr} · کیش آن ڈیلیوری`
                    : `Order #${placedOrder.localId?.slice(-6) ?? ""} · Rs. ${placedOrder.total_pkr} · Cash on Delivery`}
                </p>
              </div>

              <div className="p-3 bg-bg-secondary rounded-2xl flex items-center justify-between text-xs">
                <span className="text-text-muted">{ur ? "تفویض کردہ اسٹور:" : "Assigned Store:"}</span>
                <span className="font-bold text-text-primary">{selectedStore.name}</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setTrackedOrder(placedOrder)}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white text-xs font-bold shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                >
                  <Bike className="w-4 h-4" />
                  {ur ? "لائیو ڈیلیوری ٹریکر" : "Track Live Radar"}
                </button>
                <button
                  onClick={() => {
                    setPlacedOrder(null);
                    setShowCart(false);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-bg-secondary text-text-primary text-xs font-bold hover:bg-bg-elevated transition-all"
                >
                  {ur ? "بند کریں" : "Close"}
                </button>
              </div>
            </div>
          ) : detailed.length === 0 ? (
            <p className="text-xs text-text-muted text-center py-6">
              {ur ? "ٹوکری خالی ہے — نیچے ادویات میں سے منتخب کریں۔" : "Your cart is empty — browse medicines below."}
            </p>
          ) : (
            <>
              {/* Selected Store indicator in Cart */}
              <div className="mb-3 p-2.5 bg-primary-bg/60 border border-primary/20 rounded-xl flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-primary" />
                  <span className="font-bold text-text-primary">{selectedStore.name}</span>
                </div>
                <span className="text-primary font-bold">~{selectedStore.deliveryMins}m ETA</span>
              </div>

              {/* Items List */}
              <div className="space-y-2 mb-3 max-h-48 overflow-y-auto pr-1">
                {detailed.map(({ medicine, qty }) => (
                  <div
                    key={medicine.id}
                    className="flex items-center gap-2.5 bg-bg-secondary rounded-2xl px-3 py-2 border border-border/50"
                  >
                    <span className="text-xl shrink-0">{medicine.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-text-primary truncate">
                        {ur ? medicine.nameUrdu : medicine.name}
                      </p>
                      <p className="text-[10px] text-text-muted">
                        Rs. {medicine.pricePkr} × {qty} = Rs. {medicine.pricePkr * qty}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => dec(medicine)}
                        className="w-6 h-6 rounded-lg bg-bg-elevated border border-border flex items-center justify-center text-text-muted hover:text-danger"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold text-text-primary w-5 text-center">{qty}</span>
                      <button
                        onClick={() => add(medicine)}
                        className="w-6 h-6 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Delivery Details Inputs */}
              <div className="space-y-2">
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  inputMode="tel"
                  placeholder={ur ? "فون نمبر برائے رائیڈر (03xx…)" : "Phone number for rider (03xx…)"}
                  className="w-full px-3 py-2 text-xs bg-bg-secondary border border-border rounded-xl text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-primary/50"
                />
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  placeholder={ur ? "گھر یا فارم کا مکمل پتہ…" : "Delivery street/house/farm address…"}
                  className="w-full px-3 py-2 text-xs bg-bg-secondary border border-border rounded-xl text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-primary/50 resize-none"
                />
              </div>

              {/* Order total & Submit */}
              <div className="flex items-center justify-between mt-3 text-xs pt-2 border-t border-border">
                <span className="text-text-muted font-medium flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5" /> {ur ? "کیش آن ڈیلیوری" : "Cash on Delivery"}
                </span>
                <span className="font-bold text-text-primary text-sm">
                  Total: Rs. {total.toLocaleString()}
                </span>
              </div>

              <button
                onClick={submitOrder}
                disabled={placing || !address.trim() || !phone.trim()}
                className="w-full mt-3 py-3 rounded-2xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25 transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
              >
                {placing
                  ? ur
                    ? "آرڈر بھیجا جا رہا ہے…"
                    : "Placing Order with Store…"
                  : ur
                  ? `آرڈر کنفرم کریں — Rs. ${total.toLocaleString()}`
                  : `Confirm Order — Rs. ${total.toLocaleString()} (COD)`}
              </button>
            </>
          )}
        </div>
      )}

      {/* Active Orders & Live Delivery Radar Button */}
      {orders.length > 0 && !showCart && (
        <div className="px-5 mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-text-primary">
              {ur ? "حالیہ آرڈرز اور لائیو ٹریکنگ" : "Recent Orders & Live Tracker"}
            </p>
          </div>
          <div className="space-y-2">
            {orders.slice(0, 3).map((o) => (
              <div
                key={o.localId ?? o.id}
                className="bg-bg-elevated border border-border rounded-2xl p-3 flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-primary-bg flex items-center justify-center text-primary shrink-0">
                    <Package className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-text-primary truncate">
                      {ur ? "آرڈر" : "Order"} #{o.localId?.slice(-6) ?? o.id?.slice(-6)}
                    </p>
                    <p className="text-[10px] text-text-muted">
                      {o.items.length} {ur ? "اشیاء" : "items"} · Rs. {o.total_pkr.toLocaleString()}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setTrackedOrder(o)}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white text-[10px] font-bold flex items-center gap-1 shadow-sm active:scale-95 transition-all shrink-0"
                >
                  <Bike className="w-3.5 h-3.5" />
                  {ur ? "ٹریک کریں" : "Track Radar"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Catalog Grid */}
      <div className="px-5 grid grid-cols-2 gap-3">
        {items.map((m) => {
          const inCart = cart.find((l) => l.medicineId === m.id);
          const dom = DOMAINS.find((d) => d.id === m.domain)!;
          return (
            <div
              key={m.id}
              className="bg-bg-elevated border border-border rounded-3xl p-3.5 flex flex-col shadow-sm hover:border-primary/40 transition-all group"
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-3xl group-hover:scale-110 transition-transform">{m.emoji}</span>
                <span
                  className={`text-[8px] font-bold ${dom.theme.softBg} ${dom.theme.text} px-2 py-0.5 rounded-full`}
                >
                  {dom.emoji} {dom.name.split(" ")[0]}
                </span>
              </div>
              <p className="text-xs font-bold text-text-primary leading-snug">
                {ur ? m.nameUrdu : m.name}
              </p>
              <p className="text-[10px] text-text-muted mt-1 leading-relaxed flex-1 line-clamp-2">
                {ur ? m.descriptionUrdu : m.description}
              </p>

              {m.rxRequired && (
                <p className="text-[9px] font-bold text-danger mt-1.5 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" /> Rx Required
                </p>
              )}

              <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
                <div>
                  <p className="text-xs font-bold text-text-primary">Rs. {m.pricePkr.toLocaleString()}</p>
                  <p className="text-[9px] text-text-muted">/ {m.unit}</p>
                </div>
                {inCart ? (
                  <div className="flex items-center gap-1 bg-bg-secondary rounded-xl p-0.5 border border-border">
                    <button
                      onClick={() => dec(m)}
                      className="w-6 h-6 rounded-lg bg-bg-elevated flex items-center justify-center text-text-muted hover:text-danger"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold text-text-primary w-4 text-center">{inCart.qty}</span>
                    <button
                      onClick={() => add(m)}
                      className="w-6 h-6 rounded-lg bg-primary text-white flex items-center justify-center"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => add(m)}
                    className="px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold hover:bg-primary hover:text-white transition-all active:scale-95"
                  >
                    + {ur ? "شامل" : "Add"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {items.length === 0 && (
        <div className="px-5 py-12 text-center text-xs text-text-muted">
          <p className="text-2xl mb-2">🔍</p>
          <p>{ur ? "کوئی دوا نہیں ملی — دوسری تلاش کریں۔" : "No items matched your filter."}</p>
        </div>
      )}

      {/* Live Delivery Tracker Modal */}
      {trackedOrder && (
        <DeliveryTrackerModal
          order={trackedOrder}
          storeName={selectedStore.name}
          storePhone={selectedStore.phone}
          storeLat={selectedStore.lat}
          storeLng={selectedStore.lng}
          userAddress={userLocation?.address || address}
          onClose={() => setTrackedOrder(null)}
        />
      )}
    </div>
  );
}
