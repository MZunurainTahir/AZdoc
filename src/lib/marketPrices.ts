/**
 * Market price intelligence module for FasalDoc.
 * Uses VITE_MARKET_RATES_API_URL when configured; otherwise returns curated
 * fallback rates for major mandis across all Pakistani provinces.
 */

import type { City, ProvinceId } from "./pakistanLocations";

export interface CommodityPrice {
  id: string;
  nameEn: string;
  nameUr: string;
  unit: string;
  unitUr: string;
  avgPrice: number; // PKR per unit
  minPrice: number;
  maxPrice: number;
  trend: "up" | "down" | "stable";
  trendPercent: number;
  updatedAt: string;
  market: string;
  province: ProvinceId;
}

const MARKET_RATES_API =
  import.meta.env.VITE_MARKET_RATES_API_URL || import.meta.env.MARKET_RATES_API_URL || "";

function baseCommodities(): Omit<CommodityPrice, "avgPrice" | "minPrice" | "maxPrice" | "market" | "province" | "trend" | "trendPercent">[] {
  return [
    { id: "wheat-grain", nameEn: "Wheat Grain", nameUr: "گندم", unit: "40kg", unitUr: "40 کلو", updatedAt: "Today" },
    { id: "rice-basmati", nameEn: "Super Basmati Rice", nameUr: "باسمتی چاول", unit: "40kg", unitUr: "40 کلو", updatedAt: "Today" },
    { id: "cotton-seed", nameEn: "Cotton Seed (Phutti)", nameUr: "کپاس پھٹی", unit: "40kg", unitUr: "40 کلو", updatedAt: "Today" },
    { id: "sugarcane", nameEn: "Sugarcane", nameUr: "گنا", unit: "40kg", unitUr: "40 کلو", updatedAt: "Today" },
    { id: "tomato", nameEn: "Tomato", nameUr: "ٹماٹر", unit: "15kg", unitUr: "15 کلو", updatedAt: "Today" },
    { id: "potato", nameEn: "Potato", nameUr: "آلو", unit: "50kg", unitUr: "50 کلو", updatedAt: "Today" },
    { id: "maize", nameEn: "Maize / Corn", nameUr: "مکئی", unit: "40kg", unitUr: "40 کلو", updatedAt: "Today" },
    { id: "onion", nameEn: "Onion", nameUr: "پیاز", unit: "50kg", unitUr: "50 کلو", updatedAt: "Today" },
    { id: "milk", nameEn: "Fresh Milk", nameUr: "تازہ دودھ", unit: "litre", unitUr: "لیٹر", updatedAt: "Today" },
    { id: "desi-egg", nameEn: "Desi Eggs", nameUr: "دیسی انڈے", unit: "dozen", unitUr: "درجن", updatedAt: "Today" },
    { id: "dates", nameEn: "Dates (Aseel)", nameUr: "کھجور (اسیل)", unit: "40kg", unitUr: "40 کلو", updatedAt: "Today" },
    { id: "apple", nameEn: "Apple", nameUr: "سیب", unit: "10kg", unitUr: "10 کلو", updatedAt: "Today" },
  ];
}

function makePrice(
  id: string,
  province: ProvinceId,
  market: string,
  avg: number,
  spread: number,
  trend: CommodityPrice["trend"],
  trendPercent: number,
): CommodityPrice {
  const base = baseCommodities().find((b) => b.id === id)!;
  return {
    ...base,
    province,
    market,
    avgPrice: avg,
    minPrice: Math.round(avg - spread),
    maxPrice: Math.round(avg + spread),
    trend,
    trendPercent,
  };
}

export const MARKET_PRICES: CommodityPrice[] = [
  // Punjab
  makePrice("wheat-grain", "punjab", "Gujranwala Grain Market", 3900, 200, "stable", 0.5),
  makePrice("rice-basmati", "punjab", "Muridke Mandi", 14500, 700, "up", 2.3),
  makePrice("cotton-seed", "punjab", "Bahawalpur Cotton Market", 8200, 400, "down", -1.2),
  makePrice("sugarcane", "punjab", "Government Support Price", 425, 0, "stable", 0),
  makePrice("tomato", "punjab", "Lahore Sabzi Mandi", 1200, 300, "down", -4.5),
  makePrice("potato", "punjab", "Okara Mandi", 3500, 300, "up", 3.1),
  makePrice("maize", "punjab", "Sahiwal Mandi", 2400, 200, "up", 1.8),
  makePrice("onion", "punjab", "Multan Vegetable Market", 2800, 300, "stable", 0.2),
  makePrice("milk", "punjab", "Retail Average", 170, 10, "stable", 0),
  makePrice("desi-egg", "punjab", "Retail Average", 220, 20, "up", 2.0),

  // Sindh
  makePrice("wheat-grain", "sindh", "Hyderabad Grain Market", 3850, 180, "stable", 0.3),
  makePrice("rice-basmati", "sindh", "Sukkur Rice Market", 13800, 600, "up", 1.5),
  makePrice("cotton-seed", "sindh", "Nawabshah Cotton Market", 8100, 350, "down", -0.8),
  makePrice("sugarcane", "sindh", "Tando Allahyar Mandi", 420, 10, "stable", 0),
  makePrice("tomato", "sindh", "Karachi Sabzi Mandi", 1350, 250, "down", -3.2),
  makePrice("potato", "sindh", "Mirpur Khas Vegetable Market", 3200, 250, "up", 2.4),
  makePrice("maize", "sindh", "Larkana Grain Market", 2350, 180, "stable", 0.6),
  makePrice("onion", "sindh", "Hyderabad Vegetable Market", 2650, 250, "up", 1.1),
  makePrice("milk", "sindh", "Retail Average", 175, 12, "stable", 0),
  makePrice("desi-egg", "sindh", "Retail Average", 215, 18, "up", 1.5),
  makePrice("dates", "sindh", "Khairpur Date Market", 4800, 400, "up", 3.5),

  // KPK
  makePrice("wheat-grain", "kpk", "Mardan Grain Market", 3950, 220, "stable", 0.4),
  makePrice("maize", "kpk", "Peshawar Grain Market", 2500, 200, "up", 2.0),
  makePrice("tomato", "kpk", "Peshawar Vegetable Market", 1100, 200, "down", -2.1),
  makePrice("potato", "kpk", "Abbottabad Vegetable Market", 3400, 280, "up", 2.8),
  makePrice("apple", "kpk", "Swat Fruit Market", 2200, 250, "up", 4.2),
  makePrice("milk", "kpk", "Retail Average", 180, 12, "stable", 0),
  makePrice("desi-egg", "kpk", "Retail Average", 230, 20, "up", 1.8),

  // Balochistan
  makePrice("wheat-grain", "balochistan", "Loralai Grain Market", 4000, 250, "stable", 0.5),
  makePrice("dates", "balochistan", "Turbat Date Market", 5200, 450, "up", 3.8),
  makePrice("tomato", "balochistan", "Quetta Sabzi Mandi", 1400, 280, "stable", 0.1),
  makePrice("potato", "balochistan", "Kalat Vegetable Market", 3600, 300, "up", 2.5),
  makePrice("onion", "balochistan", "Quetta Vegetable Market", 2900, 300, "stable", 0.3),
  makePrice("milk", "balochistan", "Retail Average", 185, 15, "stable", 0),

  // Gilgit-Baltistan
  makePrice("wheat-grain", "gb", "Gilgit Grain Market", 4100, 250, "stable", 0.6),
  makePrice("apple", "gb", "Hunza Fruit Market", 2600, 300, "up", 3.0),
  makePrice("potato", "gb", "Skardu Vegetable Market", 3300, 250, "up", 2.2),
  makePrice("milk", "gb", "Retail Average", 190, 15, "stable", 0),

  // AJK
  makePrice("wheat-grain", "ajk", "Mirpur Grain Market", 4050, 240, "stable", 0.4),
  makePrice("maize", "ajk", "Muzaffarabad Grain Market", 2450, 200, "up", 1.6),
  makePrice("apple", "ajk", "Rawalakot Fruit Market", 2400, 280, "up", 3.5),
  makePrice("milk", "ajk", "Retail Average", 178, 12, "stable", 0),
];

export function getPricesByProvince(province: ProvinceId): CommodityPrice[] {
  return MARKET_PRICES.filter((p) => p.province === province);
}

/* ─────────── Domain rates: livestock mandi, nursery, pet retail ─────────── */

function makeRawPrice(
  item: { id: string; nameEn: string; nameUr: string; unit: string; unitUr: string },
  province: ProvinceId,
  market: string,
  avg: number,
  spread: number,
  trend: CommodityPrice["trend"],
  trendPercent: number,
): CommodityPrice {
  return {
    ...item,
    updatedAt: "Today",
    province,
    market,
    avgPrice: avg,
    minPrice: Math.round(avg - spread),
    maxPrice: Math.round(avg + spread),
    trend,
    trendPercent,
  };
}

const LIVESTOCK_ITEMS = {
  goat: { id: "goat-desi", nameEn: "Desi Goat (live)", nameUr: "دیسی بکری (زندہ)", unit: "per animal", unitUr: "فی جانور" },
  sheep: { id: "sheep-desi", nameEn: "Sheep (live)", nameUr: "بھیڑ (زندہ)", unit: "per animal", unitUr: "فی جانور" },
  cow: { id: "cow-bull", nameEn: "Cow / Bull (live)", nameUr: "گائے / بیل (زندہ)", unit: "per animal", unitUr: "فی جانور" },
  buffalo: { id: "buffalo-nili", nameEn: "Nili-Ravi Buffalo (live)", nameUr: "بھینس نیلی راوی (زندہ)", unit: "per animal", unitUr: "فی جانور" },
  chicken: { id: "chicken-layer", nameEn: "Layer Chicken (live)", nameUr: "مرغی (زندہ)", unit: "per bird", unitUr: "فی مرغی" },
  milkcow: { id: "milk-buffalo", nameEn: "Milk Buffalo (12L/day)", nameUr: "دودھ والی بھینس (12 لیٹر)", unit: "per animal", unitUr: "فی جانور" },
};

export const LIVESTOCK_MARKET_PRICES: CommodityPrice[] = [
  // Punjab
  makeRawPrice(LIVESTOCK_ITEMS.goat, "punjab", "Lahore Bakra Mandi (Shahpur Kanjra)", 48000, 6000, "up", 2.1),
  makeRawPrice(LIVESTOCK_ITEMS.sheep, "punjab", "Lahore Bakra Mandi", 32000, 4000, "stable", 0.4),
  makeRawPrice(LIVESTOCK_ITEMS.cow, "punjab", "Kot Lakhpat Cattle Market", 185000, 15000, "up", 1.4),
  makeRawPrice(LIVESTOCK_ITEMS.buffalo, "punjab", "Kot Lakhpat Cattle Market", 265000, 20000, "up", 1.8),
  makeRawPrice(LIVESTOCK_ITEMS.chicken, "punjab", "Retail Average", 950, 100, "down", -1.5),
  makeRawPrice(LIVESTOCK_ITEMS.milkcow, "punjab", "Dairy farm rate (Nili-Ravi)", 320000, 25000, "up", 1.2),
  // Sindh
  makeRawPrice(LIVESTOCK_ITEMS.goat, "sindh", "Karachi Cattle Colony Mandi", 52000, 7000, "up", 2.5),
  makeRawPrice(LIVESTOCK_ITEMS.cow, "sindh", "Karachi Cattle Colony", 190000, 15000, "stable", 0.6),
  makeRawPrice(LIVESTOCK_ITEMS.buffalo, "sindh", "Hyderabad Cattle Market", 275000, 22000, "up", 1.6),
  makeRawPrice(LIVESTOCK_ITEMS.chicken, "sindh", "Retail Average", 980, 100, "stable", 0.2),
  // KPK
  makeRawPrice(LIVESTOCK_ITEMS.goat, "kpk", "Peshawar Bakra Mandi", 46000, 5500, "up", 1.9),
  makeRawPrice(LIVESTOCK_ITEMS.cow, "kpk", "Peshawar Cattle Market", 180000, 14000, "stable", 0.5),
  makeRawPrice(LIVESTOCK_ITEMS.chicken, "kpk", "Retail Average", 920, 90, "down", -1.2),
  // Balochistan
  makeRawPrice(LIVESTOCK_ITEMS.goat, "balochistan", "Quetta Mochi Mandi", 44000, 5000, "stable", 0.3),
  makeRawPrice(LIVESTOCK_ITEMS.sheep, "balochistan", "Quetta Mochi Mandi", 30000, 3500, "stable", 0.2),
];

export function getLivestockPricesByProvince(province: ProvinceId): CommodityPrice[] {
  const list = LIVESTOCK_MARKET_PRICES.filter((p) => p.province === province);
  return list.length > 0 ? list : LIVESTOCK_MARKET_PRICES.filter((p) => p.province === "punjab");
}

const PLANT_ITEM = { id: "nursery-item", nameEn: "", nameUr: "", unit: "per item", unitUr: "فی اکائی" };

export const PLANT_RETAIL_PRICES: CommodityPrice[] = [
  makeRawPrice({ ...PLANT_ITEM, id: "rose-plant", nameEn: "Rose Plant (potted)", nameUr: "گلاب کا پودا (گملا)", unit: "per plant", unitUr: "فی پودا" }, "punjab", "Local Nursery", 350, 100, "stable", 0.5),
  makeRawPrice({ ...PLANT_ITEM, id: "money-plant", nameEn: "Money Plant (cutting pot)", nameUr: "منی پلانٹ", unit: "per pot", unitUr: "فی گملا" }, "punjab", "Local Nursery", 250, 80, "stable", 0.0),
  makeRawPrice({ ...PLANT_ITEM, id: "vegetable-seeds", nameEn: "Vegetable Seeds Pack", nameUr: "سبزیوں کے بیج", unit: "per pack", unitUr: "فی پیکٹ" }, "punjab", "Seed Shop", 180, 60, "up", 2.0),
  makeRawPrice({ ...PLANT_ITEM, id: "potting-mix", nameEn: "Potting Mix 10kg", nameUr: "پوٹنگ مکس 10 کلو", unit: "per bag", unitUr: "فی تھیلا" }, "punjab", "Garden Store", 600, 120, "up", 3.0),
  makeRawPrice({ ...PLANT_ITEM, id: "npk-fertilizer", nameEn: "NPK Fertilizer 1kg (home use)", nameUr: "این پی کے کھاد 1 کلو", unit: "per pack", unitUr: "فی پیک" }, "punjab", "Garden Store", 450, 80, "stable", 0.8),
  makeRawPrice({ ...PLANT_ITEM, id: "clay-pot", nameEn: "Clay Pot (medium)", nameUr: "مٹی کا گملا (درمیانہ)", unit: "per pot", unitUr: "فی گملا" }, "punjab", "Kumhar Bazaar", 150, 50, "stable", 0.0),
];

export const PET_RETAIL_PRICES: CommodityPrice[] = [
  makeRawPrice({ id: "pet-food-3kg", nameEn: "Dry Dog/Cat Food 3kg", nameUr: "کتے/بلی کی خوراک 3 کلو", unit: "per bag", unitUr: "فی تھیلا" }, "punjab", "Pet Shop Retail", 2400, 300, "up", 2.2),
  makeRawPrice({ id: "pet-vaccine", nameEn: "Vaccination (DHPPi/Rabies)", nameUr: "ویکسین (ڈی ایچ پی پی آئی/ریبز)", unit: "per dose", unitUr: "فی خوراک" }, "punjab", "Vet Clinics Average", 1500, 300, "stable", 0.5),
  makeRawPrice({ id: "pet-deworm", nameEn: "Deworming Tablets (10)", nameUr: "کیڑے مار گولیاں (10)", unit: "per pack", unitUr: "فی پیک" }, "punjab", "Pet Shop Retail", 550, 100, "stable", 0.0),
  makeRawPrice({ id: "pet-groom", nameEn: "Grooming & Bath Service", nameUr: "گرومنگ اور نہلانے کی سہولت", unit: "per session", unitUr: "فی سیشن" }, "punjab", "Pet Salons Average", 1200, 300, "stable", 0.4),
  makeRawPrice({ id: "pet-litter", nameEn: "Cat Litter 5kg", nameUr: "بلی کی واشروم مٹی 5 کلو", unit: "per bag", unitUr: "فی تھیلا" }, "punjab", "Pet Shop Retail", 900, 150, "up", 1.5),
];

export async function fetchLiveMarketRates(_city?: City): Promise<CommodityPrice[]> {
  if (!MARKET_RATES_API) return MARKET_PRICES;
  try {
    const res = await fetch(`${MARKET_RATES_API}?region=pakistan`);
    if (!res.ok) return MARKET_PRICES;
    const data = (await res.json()) as { prices?: CommodityPrice[] };
    if (!Array.isArray(data.prices) || data.prices.length === 0) return MARKET_PRICES;
    return data.prices;
  } catch {
    return MARKET_PRICES;
  }
}

export function trendSymbol(trend: CommodityPrice["trend"]): string {
  if (trend === "up") return "↑";
  if (trend === "down") return "↓";
  return "→";
}

export function trendClass(trend: CommodityPrice["trend"]): string {
  if (trend === "up") return "text-green-600";
  if (trend === "down") return "text-red-600";
  return "text-gray-500";
}
