/**
 * AZdoc Pharmacy — domain-scoped medicine & product catalog with a cart and
 * cash-on-delivery ordering. Offline-first: orders save to Dexie and sync to
 * Supabase (direct insert with sync-queue fallback).
 */
import { db, generateLocalId, isOnline, enqueueSync, type LocalOrder, type LocalOrderItem } from "./db";
import { supabase } from "./supabase";
import type { DomainId } from "./domains";

export interface Medicine {
  id: string;
  name: string;
  nameUrdu: string;
  domain: DomainId;
  category: "medicine" | "supplement" | "equipment" | "pesticide";
  categoryUrdu: string;
  pricePkr: number;
  unit: string;
  description: string;
  descriptionUrdu: string;
  emoji: string;
  rxRequired?: boolean;
}

export const MEDICINES: Medicine[] = [
  // ── Human Health Medicines & Alternates ──
  { id: "hum-paracetamol", name: "Paracetamol 500mg / Panadol / Calpol (20 tabs)", nameUrdu: "پیراسیٹامول / پیناڈول / کیلپول (20 گولیاں)", domain: "human", category: "medicine", categoryUrdu: "دوا", pricePkr: 60, unit: "strip", description: "Generic Paracetamol for fever & body pain (Panadol / Calpol alternate)", descriptionUrdu: "بخار اور جسم درد کے لیے پیناڈول کا متبادل", emoji: "💊" },
  { id: "hum-brufen", name: "Ibuprofen 400mg / Brufen / Arinac (10 tabs)", nameUrdu: "بروفین / آئیبوپروفین 400mg (10 گولیاں)", domain: "human", category: "medicine", categoryUrdu: "دوا", pricePkr: 90, unit: "strip", description: "Pain relief, anti-inflammatory & headache (Brufen alternate)", descriptionUrdu: "درد اور سوجن کے لیے بروفین", emoji: "💊" },
  { id: "hum-flagyl", name: "Metronidazole 400mg / Flagyl (15 tabs)", nameUrdu: "فلیجل / میٹرو نیدازول 400mg (15 گولیاں)", domain: "human", category: "medicine", categoryUrdu: "دوا", pricePkr: 110, unit: "strip", description: "Stomach infection & diarrhea (Flagyl alternate)", descriptionUrdu: "معدے اور پیچش کا علاج (فلیجل)", emoji: "💊", rxRequired: true },
  { id: "hum-zyrtec", name: "Cetirizine 10mg / Zyrtec / Rigix (10 tabs)", nameUrdu: "زیریٹک / رجیکس / سیٹریزین 10mg", domain: "human", category: "medicine", categoryUrdu: "دوا", pricePkr: 140, unit: "strip", description: "Anti-allergy & skin itching relief (Rigix / Zyrtec alternate)", descriptionUrdu: "الرجی اور خارش کے لیے (رجیکس متبادل)", emoji: "🤧" },
  { id: "hum-augmentin", name: "Co-Amoxiclav 625mg / Augmentin (6 tabs)", nameUrdu: "آگمنٹن / اموکسیکلیو 625mg", domain: "human", category: "medicine", categoryUrdu: "دوا", pricePkr: 320, unit: "strip", description: "Broad-spectrum antibiotic (Augmentin alternate)", descriptionUrdu: "اینٹی بائیوٹک (آگمنٹن متبادل)", emoji: "💊", rxRequired: true },
  { id: "hum-ors", name: "ORS Hydration Sachets (pack of 5)", nameUrdu: "او آر ایس (5 کے پیک)", domain: "human", category: "supplement", categoryUrdu: "سپلیمنٹ", pricePkr: 80, unit: "pack", description: "Instant rehydration for diarrhea & heat stroke", descriptionUrdu: "اسہال اور گرمی کے لیے او آر ایس", emoji: "🧴" },
  { id: "hum-antifungal", name: "Clotrimazole 1% Cream / Candid / Canesten 30g", nameUrdu: "اینٹی فنگل کینسٹن / کینڈڈ کریم 30g", domain: "human", category: "medicine", categoryUrdu: "دوا", pricePkr: 250, unit: "tube", description: "Ringworm, dad & skin fungal infection cream", descriptionUrdu: "داد اور فنگس کی کریم (کینسٹن)", emoji: "🧯" },
  { id: "hum-vitamin-d", name: "Sunny D / Vitamin D3 Ampoule 200,000 IU", nameUrdu: "وٹامن ڈی 3 سانی ڈی انجیکشن", domain: "human", category: "supplement", categoryUrdu: "سپلیمنٹ", pricePkr: 380, unit: "ampoule", description: "Bone strength & immunity boost", descriptionUrdu: "ہڈیوں اور قوت مدافعت کے لیے", emoji: "☀️" },
  { id: "hum-bp-monitor", name: "Digital Blood Pressure Monitor (Omron/Certeza)", nameUrdu: "ڈیجیٹل بلڈ پریشر مشین", domain: "human", category: "equipment", categoryUrdu: "آلہ", pricePkr: 3500, unit: "device", description: "Automated digital BP & pulse monitor", descriptionUrdu: "گھر پر بلڈ پریشر چیک", emoji: "🩺" },
  { id: "hum-glucometer", name: "Accu-Chek Blood Glucose Meter + 25 Strips", nameUrdu: "ایکیو چیک شوگر ٹیسٹ مشین", domain: "human", category: "equipment", categoryUrdu: "آلہ", pricePkr: 2800, unit: "kit", description: "Instant diabetes sugar test meter", descriptionUrdu: "ذیابیطس / شوگر ٹیسٹ آلہ", emoji: "🩸" },

  // ── Livestock Health Medicines ──
  { id: "liv-oxfendazole", name: "Oxfendazole Dewormer 1L", nameUrdu: "اوکسفینڈازول کیڑے مار دوا 1 لیٹر", domain: "livestock", category: "medicine", categoryUrdu: "دوا", pricePkr: 850, unit: "bottle", description: "Broad-spectrum wormer for cattle & buffalo", descriptionUrdu: "مویشیوں کے پیٹ کے کیڑوں کی دوا", emoji: "💊" },
  { id: "liv-oxy-inject", name: "Oxytetracycline LA 200mg/ml (100ml)", nameUrdu: "آکسی ٹیٹرا سائکلین 200mg (100ml)", domain: "livestock", category: "medicine", categoryUrdu: "دوا", pricePkr: 720, unit: "vial", description: "Broad-spectrum antibiotic injection for livestock fever & infections", descriptionUrdu: "جانوروں کے بخار اور انفیکشن کا ٹیکہ", emoji: "💉", rxRequired: true },
  { id: "liv-mastitis-spray", name: "Teat Dip & Mastitis Treatment Tube", nameUrdu: "تھن ڈپ اور ماسٹائٹس اسپرے", domain: "livestock", category: "medicine", categoryUrdu: "دوا", pricePkr: 620, unit: "bottle", description: "Udder care & mastitis (saroo) treatment", descriptionUrdu: "دودھ دینے کے بعد تھن کی حفاظت (سڑو علاج)", emoji: "🧴" },
  { id: "liv-calcium-borus", name: "Calcium Borogluconate 400ml", nameUrdu: "کیلشیم بوروگلوکونیٹ 400ml", domain: "livestock", category: "medicine", categoryUrdu: "دوا", pricePkr: 380, unit: "bottle", description: "Milk fever treatment & emergency infusion", descriptionUrdu: "دودھ کا بخار کا عاجلانہ علاج", emoji: "🦴" },
  { id: "liv-fmd-spray", name: "Lal Dawai Potassium Permanganate 500ml", nameUrdu: "لال دوا ایف ایم ڈی واش", domain: "livestock", category: "medicine", categoryUrdu: "دوا", pricePkr: 300, unit: "bottle", description: "Traditional mouth & hoof disinfectant wash for FMD", descriptionUrdu: "منہ کھر بیماری میں چھالوں کی دھلائی", emoji: "🔴" },

  // ── Pet Health Care ──
  { id: "pet-deworm-tab", name: "Drontal Allwormer Pet Tablets (10)", nameUrdu: "پالتو کیڑے مار گولیاں (10)", domain: "pet", category: "medicine", categoryUrdu: "دوا", pricePkr: 550, unit: "pack", description: "Broad-spectrum dewormer for cats & dogs", descriptionUrdu: "بلی اور کتے کے کیڑوں کا علاج", emoji: "🐕" },
  { id: "pet-mange-shampoo", name: "Anti-Tick & Flea Medicated Shampoo 250ml", nameUrdu: "چیچر پسو اور خارش کا میڈیکٹڈ شیمپو", domain: "pet", category: "medicine", categoryUrdu: "دوا", pricePkr: 700, unit: "bottle", description: "Ticks, mange & coat skin care for pets", descriptionUrdu: "خارش اور بالوں کی حفاظت", emoji: "🧼" },
  { id: "pet-rabies-vax", name: "Rabies & Core Vaccine Booking", nameUrdu: "ریبز ویکسین بکنگ", domain: "pet", category: "medicine", categoryUrdu: "دوا", pricePkr: 1200, unit: "dose", description: "Redeemable at verified AZdoc pet clinics", descriptionUrdu: "کلینک پر ریبز کا ٹیکہ", emoji: "💉", rxRequired: true },
  { id: "pet-pet-food", name: "Royal Canin / Pedigree Adult Dog Food 3kg", nameUrdu: "کتے کی متوازن خوراک 3 کلو", domain: "pet", category: "supplement", categoryUrdu: "غذا", pricePkr: 2400, unit: "bag", description: "High-protein nutritional kibble food", descriptionUrdu: "متوازن خشک خوراک", emoji: "🥣" },

  // ── Plant & Garden Care ──
  { id: "plt-neem-oil", name: "Cold-Pressed Organic Neem Oil 250ml", nameUrdu: "خالص نیم کا تیل 250ml", domain: "plant", category: "pesticide", categoryUrdu: "کیڑے مار", pricePkr: 480, unit: "bottle", description: "Natural pest & aphid repellent for home garden", descriptionUrdu: "باغ کے کیڑوں کا قدرتی حل", emoji: "🌿" },
  { id: "plt-fungicide", name: "Copper Oxychloride / Mancozeb Fungicide 100g", nameUrdu: "فنگی سائیڈ پاؤڈر 100 گرام", domain: "plant", category: "pesticide", categoryUrdu: "فنگس", pricePkr: 560, unit: "pack", description: "Leaf spot, black spot & mildew control", descriptionUrdu: "پتوں کے داغ اور فنگس کا اسپرے", emoji: "🛡️" },
  { id: "plt-organic-compost", name: "Enriched Vermicompost Fertilizer 5kg", nameUrdu: "آرگینک کھاد 5 کلو", domain: "plant", category: "supplement", categoryUrdu: "کھاد", pricePkr: 350, unit: "bag", description: "Micro-nutrient enriched soil conditioner", descriptionUrdu: "مٹی کے لیے قدرتی غذائیت", emoji: "🪴" },

  // ── Crop Protection & Agricultural Inputs ──
  { id: "crp-tilt", name: "Tilt 250 EC (Propiconazole Syngenta) 250ml", nameUrdu: "ٹلٹ 250 ای سی 250ml", domain: "crop", category: "pesticide", categoryUrdu: "فنگس", pricePkr: 1450, unit: "bottle", description: "Fungicide for wheat yellow rust & blight", descriptionUrdu: "گندم کی پیلی کنگی کا بہترین اسپرے", emoji: "🌾" },
  { id: "crp-nativo", name: "Nativo 75 WG (Bayer) 65g", nameUrdu: "نیٹیوو فنگی سائیڈ 65 گرام", domain: "crop", category: "pesticide", categoryUrdu: "فنگس", pricePkr: 1850, unit: "pack", description: "Systemic fungicide for wheat rust & rice blast", descriptionUrdu: "گندم اور چاول کے جھلساؤ کی دوا", emoji: "🌾" },
  { id: "crp-urea", name: "Sona Urea Fertilizer 50kg", nameUrdu: "سونا یوریا کھاد 50 کلو", domain: "crop", category: "supplement", categoryUrdu: "کھاد", pricePkr: 4300, unit: "bag", description: "46% Nitrogen for rapid vegetative crop growth", descriptionUrdu: "نشوونما کے لیے نائٹروجن", emoji: "🧪" },
  { id: "crp-dap", name: "Sona DAP Fertilizer 50kg", nameUrdu: "سونا ڈی اے پی کھاد 50 کلو", domain: "crop", category: "supplement", categoryUrdu: "کھاد", pricePkr: 11500, unit: "bag", description: "Di-Ammonium Phosphate for root & grain setting", descriptionUrdu: "جڑوں اور دانے کے لیے نائٹروجن و فاسفورس", emoji: "🧫" },
  { id: "crp-trap", name: "Yellow Sticky Traps (10 pcs)", nameUrdu: "پیلا چپچپا جال (10)", domain: "crop", category: "equipment", categoryUrdu: "آلہ", pricePkr: 600, unit: "pack", description: "Whitefly, thrips & aphid pest control", descriptionUrdu: "سفید مکھی اور تیلا کنٹرول", emoji: "🟡" },
];

export const CATEGORIES: Medicine["category"][] = ["medicine", "supplement", "equipment", "pesticide"];

/* ── Cart (localStorage) ── */

const CART_KEY = "azdoc_cart";

export interface CartLine { medicineId: string; qty: number }

export function getCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((l) => l && l.medicineId && l.qty > 0) : [];
  } catch {
    return [];
  }
}

function saveCart(lines: CartLine[]) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(lines));
  } catch {
    /* ignore */
  }
}

export function addToCart(medicineId: string, qty = 1): CartLine[] {
  const lines = getCart();
  const existing = lines.find((l) => l.medicineId === medicineId);
  if (existing) existing.qty += qty;
  else lines.push({ medicineId, qty });
  saveCart(lines);
  return lines;
}

export function setCartQty(medicineId: string, qty: number): CartLine[] {
  let lines = getCart();
  if (qty <= 0) lines = lines.filter((l) => l.medicineId !== medicineId);
  else {
    const existing = lines.find((l) => l.medicineId === medicineId);
    if (existing) existing.qty = qty;
    else lines.push({ medicineId, qty });
  }
  saveCart(lines);
  return lines;
}

export function clearCart(): CartLine[] {
  saveCart([]);
  return [];
}

export function getMedicine(id: string): Medicine | undefined {
  return MEDICINES.find((m) => m.id === id);
}

export function cartLinesDetailed(lines: CartLine[]): { medicine: Medicine; qty: number }[] {
  return lines
    .map((l) => ({ medicine: getMedicine(l.medicineId)!, qty: l.qty }))
    .filter((l) => Boolean(l.medicine));
}

export function cartTotal(lines: CartLine[]): number {
  return cartLinesDetailed(lines).reduce((sum, l) => sum + l.medicine.pricePkr * l.qty, 0);
}

/* ── Orders ── */

export async function placeOrder(params: {
  userId: string;
  address: string;
  phone: string;
}): Promise<LocalOrder> {
  const lines = getCart();
  const detailed = cartLinesDetailed(lines);
  const items: LocalOrderItem[] = detailed.map((l) => ({
    medicine_id: l.medicine.id,
    name: l.medicine.name,
    qty: l.qty,
    unit_price_pkr: l.medicine.pricePkr,
  }));

  const now = new Date().toISOString();
  const localId = generateLocalId();
  const order: LocalOrder = {
    id: localId,
    localId,
    user_id: params.userId,
    items,
    total_pkr: cartTotal(lines),
    payment_method: "cod",
    address: params.address,
    phone: params.phone,
    status: "placed",
    created_at: now,
    _synced: false,
  };

  await db.orders.add(order);

  if (isOnline()) {
    try {
      const { localId: _l, _synced: _s, id: _i, ...clean } = order;
      const { data, error } = await supabase.from("orders").insert(clean).select("id");
      if (error) throw error;
      if (data?.[0]?.id) {
        await db.orders.where("localId").equals(localId).delete();
        const synced = { ...order, id: data[0].id as string, _synced: true };
        await db.orders.add(synced);
        clearCart();
        return synced;
      }
      await db.orders.where("localId").equals(localId).modify({ _synced: true });
    } catch (err) {
      console.warn("[pharmacy] direct sync failed, queued for later:", err);
      await enqueueSync("orders", "insert", localId, order as unknown as Record<string, unknown>);
    }
  } else {
    await enqueueSync("orders", "insert", localId, order as unknown as Record<string, unknown>);
  }

  clearCart();
  return order;
}

export async function listOrders(userId: string): Promise<LocalOrder[]> {
  try {
    const rows = await db.orders.where("user_id").equals(userId).toArray();
    return rows.sort((a, b) => (b.created_at > a.created_at ? 1 : -1));
  } catch {
    return [];
  }
}
