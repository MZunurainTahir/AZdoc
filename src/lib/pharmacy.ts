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
  // ── Human ──
  { id: "hum-paracetamol", name: "Paracetamol 500mg (20 tabs)", nameUrdu: "پیراسیٹامول 500mg (20 گولیاں)", domain: "human", category: "medicine", categoryUrdu: "دوا", pricePkr: 60, unit: "strip", description: "Fever & mild pain relief", descriptionUrdu: "بخار اور ہلکے درد کے لیے", emoji: "💊" },
  { id: "hum-ors", name: "ORS Sachets (pack of 5)", nameUrdu: "او آر ایس (5 کے پیک)", domain: "human", category: "supplement", categoryUrdu: "سپلیمنٹ", pricePkr: 80, unit: "pack", description: "Rehydration for diarrhea & heat", descriptionUrdu: "اسہال اور گرمی کے لیے", emoji: "🧴" },
  { id: "hum-antifungal", name: "Antifungal Cream 30g", nameUrdu: "اینٹی فنگل کریم 30g", domain: "human", category: "medicine", categoryUrdu: "دوا", pricePkr: 250, unit: "tube", description: "Ringworm & skin fungal infections", descriptionUrdu: "داد اور جلد کے فنگل انفیکشن", emoji: "🧯", rxRequired: true },
  { id: "hum-vitamin-d", name: "Vitamin D3 Drops", nameUrdu: "وٹامن ڈی 3 ڈراپس", domain: "human", category: "supplement", categoryUrdu: "سپلیمنٹ", pricePkr: 450, unit: "bottle", description: "Immunity & bone support", descriptionUrdu: "مدافعت اور ہڈیوں کے لیے", emoji: "☀️" },
  { id: "hum-bp-monitor", name: "Digital BP Monitor", nameUrdu: "ڈیجیٹل بلڈ پریشر مشین", domain: "human", category: "equipment", categoryUrdu: "آلہ", pricePkr: 3500, unit: "device", description: "Home blood pressure tracking", descriptionUrdu: "گھر پر بلڈ پریشر چیک", emoji: "🩺" },

  // ── Livestock ──
  { id: "liv-oxfendazole", name: "Oxfendazole Dewormer 1L", nameUrdu: "اوکسفینڈازول کیڑے مار دوا 1 لیٹر", domain: "livestock", category: "medicine", categoryUrdu: "دوا", pricePkr: 850, unit: "bottle", description: "Broad-spectrum wormer for cattle", descriptionUrdu: "مویشیوں کے کیڑوں کے لیے", emoji: "💊" },
  { id: "liv-mastitis-spray", name: "Teat Dip & Mastitis Spray", nameUrdu: "تھن ڈپ اور ماسٹائٹس اسپرے", domain: "livestock", category: "medicine", categoryUrdu: "دوا", pricePkr: 620, unit: "bottle", description: "Post-milking udder protection", descriptionUrdu: "دودھ دینے کے بعد تھن کی حفاظت", emoji: "🧴" },
  { id: "liv-calcium-borus", name: "Calcium Borogluconate 400ml", nameUrdu: "کیلشیم بوروگلوکونیٹ 400ml", domain: "livestock", category: "medicine", categoryUrdu: "دوا", pricePkr: 380, unit: "bottle", description: "Milk fever treatment & prevention", descriptionUrdu: "دودھ کا بخار کا علاج", emoji: "🦴" },
  { id: "liv-fmd-spray", name: "Lal Dawai FMD Wash 500ml", nameUrdu: "لال دوا ایف ایم ڈی واش", domain: "livestock", category: "medicine", categoryUrdu: "دوا", pricePkr: 300, unit: "bottle", description: "Traditional mouth/hoof wash for FMD", descriptionUrdu: "ایف ایم ڈی میں منہ کھر دھلائی", emoji: "🔴" },

  // ── Pets ──
  { id: "pet-deworm-tab", name: "Pet Deworming Tablets (10)", nameUrdu: "پالتو کیڑے مار گولیاں (10)", domain: "pet", category: "medicine", categoryUrdu: "دوا", pricePkr: 550, unit: "pack", description: "For cats & dogs, all life stages", descriptionUrdu: "بلی کتے کے لیے", emoji: "🐕" },
  { id: "pet-mange-shampoo", name: "Anti-Mange Medicated Shampoo", nameUrdu: "خارش کا میڈیکٹڈ شیمپو", domain: "pet", category: "medicine", categoryUrdu: "دوا", pricePkr: 700, unit: "bottle", description: "Ticks, mange & coat care", descriptionUrdu: "خارش اور بالوں کی دیکھ بھال", emoji: "🧼" },
  { id: "pet-rabies-vax", name: "Rabies Vaccine Voucher", nameUrdu: "ریبز ویکسین واؤچر", domain: "pet", category: "medicine", categoryUrdu: "دوا", pricePkr: 1200, unit: "dose", description: "Redeemable at partner vet clinics", descriptionUrdu: "ویٹرنری کلینک پر استعمال", emoji: "💉", rxRequired: true },
  { id: "pet-pet-food", name: "Adult Dog Food 3kg", nameUrdu: "بڑے کتے کی خوراک 3 کلو", domain: "pet", category: "supplement", categoryUrdu: "غذا", pricePkr: 2400, unit: "bag", description: "Balanced dry food, chicken flavor", descriptionUrdu: "متوازن خشک خوراک", emoji: "🥣" },

  // ── Plants ──
  { id: "plt-neem-oil", name: "Neem Oil Concentrate 250ml", nameUrdu: "نیم کا تیل 250ml", domain: "plant", category: "pesticide", categoryUrdu: "کیڑے مار", pricePkr: 480, unit: "bottle", description: "Organic pest control for gardens", descriptionUrdu: "باغ کے کیڑوں کا قدرتی علاج", emoji: "🌿" },
  { id: "plt-fungicide", name: "Broad-Spectrum Fungicide 100g", nameUrdu: "فنگی سائیڈ 100 گرام", domain: "plant", category: "pesticide", categoryUrdu: "فنگس" , pricePkr: 560, unit: "pack", description: "Leaf spot, mildew & blight control", descriptionUrdu: "پتوں کے داغ اور جھلساؤ", emoji: "🛡️", rxRequired: false },
  { id: "plt-organic-compost", name: "Organic Compost 5kg", nameUrdu: "آرگینک کھاد 5 کلو", domain: "plant", category: "supplement", categoryUrdu: "کھاد", pricePkr: 350, unit: "bag", description: "Nutrient-rich soil booster", descriptionUrdu: "مٹی کے لیے قدرتی غذائیت", emoji: "🪴" },

  // ── Crops ──
  { id: "crp-tilt", name: "Tilt 250 EC (Propiconazole) 250ml", nameUrdu: "ٹلٹ 250 ای سی 250ml", domain: "crop", category: "pesticide", categoryUrdu: "فنگس", pricePkr: 1450, unit: "bottle", description: "Wheat rust & fungal disease control", descriptionUrdu: "گندم کنگی کا کنٹرول", emoji: "🌾" },
  { id: "crp-urea", name: "Urea Fertilizer 50kg", nameUrdu: "یوریا کھاد 50 کلو", domain: "crop", category: "supplement", categoryUrdu: "کھاد", pricePkr: 4300, unit: "bag", description: "Nitrogen for vegetative growth", descriptionUrdu: "نشوونما کے لیے نائٹروجن", emoji: "🧪" },
  { id: "crp-dap", name: "DAP Fertilizer 50kg", nameUrdu: "ڈی اے پی کھاد 50 کلو", domain: "crop", category: "supplement", categoryUrdu: "کھاد", pricePkr: 11500, unit: "bag", description: "Phosphorus for roots & flowering", descriptionUrdu: "جڑوں اور پھول کے لیے", emoji: "🧫" },
  { id: "crp-trap", name: "Yellow Sticky Traps (10 pcs)", nameUrdu: "پیلا چپچپا جال (10)", domain: "crop", category: "equipment", categoryUrdu: "آلہ", pricePkr: 600, unit: "pack", description: "Whitefly & aphid monitoring", descriptionUrdu: "سفید مکھی نگرانی", emoji: "🟡" },
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
