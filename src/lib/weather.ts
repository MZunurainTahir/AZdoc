/**
 * Weather-based agricultural risk engine for FasalDoc.
 * Uses OpenWeatherMap API when VITE_OPENWEATHER_API_KEY is configured,
 * otherwise falls back to realistic mock snapshots keyed by Pakistani city.
 */

import type { City } from "./pakistanLocations";
import { DEFAULT_CITY, PAKISTAN_CITIES } from "./pakistanLocations";
import type { DomainId } from "./domains";

export type DiseaseRiskLevel = "low" | "moderate" | "high" | "severe";

export interface WeatherSnapshot {
  tempC: number;
  humidity: number; // 0-100
  rainfallMm: number; // last 24h
  condition: "sunny" | "cloudy" | "rainy" | "stormy";
  location: string;
  forecastDay: string;
  windKph?: number;
  pressureHpa?: number;
  uvIndex?: number;
}

export interface RiskAdvisory {
  level: DiseaseRiskLevel;
  score: number; // 0-100
  title: string;
  titleUrdu: string;
  message: string;
  messageUrdu: string;
  affectedCrops: string[];
  action: string;
  actionUrdu: string;
}

const OPENWEATHER_BASE = "https://api.openweathermap.org/data/2.5";

function getApiKey(): string | undefined {
  return import.meta.env.VITE_OPENWEATHER_API_KEY || import.meta.env.OPENWEATHER_API_KEY || undefined;
}

const RISK_THRESHOLDS: Record<DiseaseRiskLevel, number> = {
  low: 30,
  moderate: 55,
  high: 75,
  severe: 90,
};

function riskLevelFromScore(score: number): DiseaseRiskLevel {
  if (score >= RISK_THRESHOLDS.severe) return "severe";
  if (score >= RISK_THRESHOLDS.high) return "high";
  if (score >= RISK_THRESHOLDS.moderate) return "moderate";
  return "low";
}

function riskColor(level: DiseaseRiskLevel): string {
  switch (level) {
    case "low":
      return "#16A34A"; // green-600
    case "moderate":
      return "#CA8A04"; // yellow-600
    case "high":
      return "#EA580C"; // orange-600
    case "severe":
      return "#DC2626"; // red-600
  }
}

function mapCondition(code?: string, icon?: string): WeatherSnapshot["condition"] {
  if (!code) return "sunny";
  const group = code.slice(0, 2);
  if (code === "800") return "sunny";
  if (icon?.includes("n") && code === "800") return "cloudy";
  if (["02", "03", "04"].includes(group)) return "cloudy";
  if (["09", "10"].includes(group)) return "rainy";
  if (["11", "13", "50"].includes(group)) return "stormy";
  return "cloudy";
}

/**
 * Fetch current weather for a given Pakistani city from OpenWeatherMap.
 * Returns undefined on failure so the caller can fall back to mock data.
 */
export async function fetchCurrentWeather(city: City): Promise<WeatherSnapshot | undefined> {
  const key = getApiKey();
  if (!key) return undefined;

  try {
    const url = `${OPENWEATHER_BASE}/weather?lat=${city.lat}&lon=${city.lon}&units=metric&appid=${key}`;
    const res = await fetch(url);
    if (!res.ok) return undefined;
    const data = await res.json();
    return {
      tempC: Math.round(data.main.temp),
      humidity: Math.round(data.main.humidity),
      rainfallMm: data.rain?.["1h"] ? Math.round(data.rain["1h"] * 24) : data.rain?.["3h"] ? Math.round(data.rain["3h"] * 8) : 0,
      condition: mapCondition(data.weather?.[0]?.id?.toString(), data.weather?.[0]?.icon),
      location: `${city.nameEn}, ${city.province.charAt(0).toUpperCase() + city.province.slice(1)}`,
      forecastDay: "Today",
      windKph: Math.round((data.wind?.speed || 0) * 3.6),
      pressureHpa: data.main.pressure,
    };
  } catch {
    return undefined;
  }
}

/**
 * Fetch a 5-day forecast for a given city from OpenWeatherMap.
 */
export async function fetchForecast(city: City): Promise<WeatherSnapshot[] | undefined> {
  const key = getApiKey();
  if (!key) return undefined;

  try {
    const url = `${OPENWEATHER_BASE}/forecast?lat=${city.lat}&lon=${city.lon}&units=metric&appid=${key}`;
    const res = await fetch(url);
    if (!res.ok) return undefined;
    const data = await res.json();
    const list = data.list as Array<{
      dt_txt: string;
      main: { temp: number; humidity: number; pressure: number };
      weather: { id: number; icon: string }[];
      wind: { speed: number };
      rain?: { "3h": number };
    }>;

    // Pick one snapshot per day around midday
    const daily: Record<string, WeatherSnapshot> = {};
    for (const item of list) {
      const date = item.dt_txt.split(" ")[0];
      const hour = Number(item.dt_txt.split(" ")[1]?.split(":")[0]);
      if (!(date in daily) || Math.abs(hour - 12) < Math.abs(Number(daily[date].forecastDay.split(":")[0]) - 12)) {
        daily[date] = {
          tempC: Math.round(item.main.temp),
          humidity: Math.round(item.main.humidity),
          rainfallMm: item.rain ? Math.round(item.rain["3h"] * 8) : 0,
          condition: mapCondition(item.weather[0].id.toString(), item.weather[0].icon),
          location: `${city.nameEn}, ${city.province.charAt(0).toUpperCase() + city.province.slice(1)}`,
          forecastDay: date,
          windKph: Math.round((item.wind.speed || 0) * 3.6),
          pressureHpa: item.main.pressure,
        };
      }
    }
    const days = Object.values(daily).slice(0, 5);
    const labels = ["Today", "Tomorrow", "Day 3", "Day 4", "Day 5"];
    return days.map((d, i) => ({ ...d, forecastDay: labels[i] ?? d.forecastDay }));
  } catch {
    return undefined;
  }
}

/**
 * Compute a disease-risk score from weather parameters.
 * High humidity + warm temps + recent rainfall strongly favours fungal/blight outbreaks.
 */
export function computeDiseaseRisk(weather: WeatherSnapshot): RiskAdvisory {
  let score = 0;

  // Humidity contribution (most important for fungal diseases)
  if (weather.humidity >= 85) score += 40;
  else if (weather.humidity >= 70) score += 28;
  else if (weather.humidity >= 55) score += 15;

  // Temperature contribution
  if (weather.tempC >= 22 && weather.tempC <= 30) score += 25;
  else if (weather.tempC >= 18 && weather.tempC <= 32) score += 15;

  // Rainfall / leaf wetness contribution
  if (weather.rainfallMm >= 20) score += 30;
  else if (weather.rainfallMm >= 5) score += 18;
  else if (weather.rainfallMm > 0) score += 8;

  // Weather condition override
  if (weather.condition === "stormy") score += 10;
  if (weather.condition === "rainy" && weather.humidity > 75) score += 5;

  score = Math.min(100, Math.round(score));
  const level = riskLevelFromScore(score);

  const levelMeta: Record<
    DiseaseRiskLevel,
    { title: string; titleUrdu: string; message: string; messageUrdu: string; action: string; actionUrdu: string }
  > = {
    low: {
      title: "Low Disease Risk",
      titleUrdu: "بیماری کا خطرہ کم",
      message: "Weather conditions are unfavourable for fungal and bacterial disease outbreaks.",
      messageUrdu: "موسمی حالات پھپھوندی اور بیکٹیریائی بیماریوں کے پھیلاؤ کے لیے سازگار نہیں۔",
      action: "Continue regular scouting and preventive spraying as per crop calendar.",
      actionUrdu: "فصل کیلنڈر کے مطابق معمولی نگرانی اور حفاظتی اسپرے جاری رکھیں۔",
    },
    moderate: {
      title: "Moderate Disease Risk",
      titleUrdu: "درمیانہ بیماری کا خطرہ",
      message: "Humidity and temperature are rising; early blight, rust and leaf spot may appear.",
      messageUrdu: "نمی اور درجہ حرارت بڑھ رہا ہے؛ ابتدائی جھلساؤ، کنگی اور پتے کے دھبے ظاہر ہو سکتے ہیں۔",
      action: "Inspect lower leaves every 2 days. Apply preventive fungicide if forecast stays wet.",
      actionUrdu: "ہر 2 دن بعد نچلے پتے چیک کریں۔ اگر موسم گیلا رہے تو حفاظتی پھپھوند کش اسپرے کریں۔",
    },
    high: {
      title: "High Disease Risk",
      titleUrdu: "زیادہ بیماری کا خطرہ",
      message: "Warm, humid and wet conditions strongly favour late blight, rust and mastitis-causing pathogens.",
      messageUrdu: "گرم، مرطوب اور گیلے موسم میں پچھیتا جھلساؤ، کنگی اور ماسٹائیس کے جراثیم تیزی سے پھیلتے ہیں۔",
      action: "Spray recommended fungicide immediately. Ensure field drainage and teat hygiene for livestock.",
      actionUrdu: "تجویز کردہ پھپھوند کش فوری اسپرے کریں۔ نکاسی آب اور مویشیوں کی تھن کی صفائی یقینی بنائیں۔",
    },
    severe: {
      title: "Severe Outbreak Alert",
      titleUrdu: "سنگین وبا الرٹ",
      message: "Conditions are ideal for rapid spread of blight, rust and vector-borne diseases. Immediate action required.",
      messageUrdu: "پھپھوندی، کنگی اور کیڑوں سے پھیلنے والی بیماریوں کے پھیلاؤ کے لیے حالات انتہائی سازگار ہیں۔ فوری اقدام ضروری ہے۔",
      action: "Alert neighbouring farms, apply curative spray today, and contact nearest extension officer or vet.",
      actionUrdu: "ہمسایہ کھیتوں کو آگاہ کریں، آج ہی علاجی اسپرے کریں اور قریب ترین ایگری ایکسٹینشن آفیسر یا ویٹرنری سے رابطہ کریں۔",
    },
  };

  const meta = levelMeta[level];

  return {
    level,
    score,
    title: meta.title,
    titleUrdu: meta.titleUrdu,
    message: meta.message,
    messageUrdu: meta.messageUrdu,
    affectedCrops: level === "low" ? [] : ["Tomato", "Potato", "Wheat", "Cotton", "Rice"],
    action: meta.action,
    actionUrdu: meta.actionUrdu,
  };
}

/**
 * Domain-aware weather advisory: crop keeps the classic fungal-risk engine,
 * while human/livestock/pet/plant each get their own weather-health risks
 * (heatstroke, heat stress, paw burns, mildew…).
 */
export function computeDomainRisk(weather: WeatherSnapshot, domain: DomainId | string): RiskAdvisory {
  if (!domain || domain === "crop") return computeDiseaseRisk(weather);

  let score = 0;
  let meta: { title: string; titleUrdu: string; message: string; messageUrdu: string; action: string; actionUrdu: string };

  if (domain === "human") {
    // Extreme heat → heatstroke; cold/dry → flu; hot-humid + rain → dengue/malaria
    if (weather.tempC >= 40) {
      score = 95;
      meta = {
        title: "Extreme Heat — Heatstroke Alert",
        titleUrdu: "شدید گرمی — لو لگنے کا الرٹ",
        message: "Dangerous heat. Avoid outdoor activity 11am–4pm; elderly, children and outdoor workers at highest risk.",
        messageUrdu: "خطرناک گرمی۔ 11 تا 4 بجے دھوپ میں نہ نکلیں؛ بوڑھے، بچے اور مزدور سب سے زیادہ خطرے میں ہیں۔",
        action: "Drink water every 30 min, ORS if sweating heavily. Call 1122 for fainting/confusion.",
        actionUrdu: "ہر 30 منٹ بعد پانی پئیں، پسینہ زیادہ ہو تو او آر ایس۔ بے ہوشی پر 1122 پر کال کریں۔",
      };
    } else if (weather.tempC >= 36) {
      score = 75;
      meta = {
        title: "High Heat — Protect Yourself",
        titleUrdu: "تیز گرمی — احتیاط کریں",
        message: "Heat exhaustion risk. Cover your head, wear light clothes, stay hydrated.",
        messageUrdu: "گرمی کا سنہنے کا خطرہ۔ سر ڈھانپیں، ہلکے کپڑے پہنیں، پانی پیتے رہیں۔",
        action: "Carry water & ORS; take shade breaks every 30 minutes.",
        actionUrdu: "پانی اور او آر ایس ساتھ رکھیں؛ ہر آدھے گھنٹے پر سایہ لیں۔",
      };
    } else if (weather.humidity >= 70 && weather.rainfallMm > 0 && weather.tempC >= 22 && weather.tempC <= 32) {
      score = 80;
      meta = {
        title: "Dengue / Malaria Season Alert",
        titleUrdu: "ڈینگی اور ملیریا کا موسم",
        message: "Rain + humidity after heat is peak mosquito breeding weather (Aedes bites in daytime).",
        messageUrdu: "گرمی کے بعد بارش اور نمی مچھروں کے پھیلاؤ کا وقت ہے (ڈینگی والا مچھر دن میں کاٹتا ہے)۔",
        action: "Empty standing water, use nets & repellent, full-sleeve clothes at dawn/dusk.",
        actionUrdu: "جمع پانی ختم کریں، مسلار جال اور ریپیلنٹ استعمال کریں، پورے آستین کپڑے پہنیں۔",
      };
    } else if (weather.tempC <= 12) {
      score = 55;
      meta = {
        title: "Cold Wave — Flu & Chest Infection Risk",
        titleUrdu: "سردی کی لہر — فلو اور کھانسی کا خطرہ",
        message: "Cold, dry air spreads flu, cough and chest infections, especially in children and elderly.",
        messageUrdu: "سرد خشک ہوا فلو، کھانسی اور سینے کے انفیکشن پھیلاتی ہے، خاص طور پر بچوں اور بوڑھوں میں۔",
        action: "Layer warm clothing, steam inhalation, avoid cold drinks; flu vaccine for high-risk.",
        actionUrdu: "گرم کپڑے تہہ کر کے پہنیں، بھاپ لیں، ٹھنڈی چیزیں کم؛ خطرے والوں کو فلو ویکسین۔",
      };
    } else {
      score = 20;
      meta = {
        title: "Pleasant Weather — Stay Active",
        titleUrdu: "خوشگوار موسم — سرگرم رہیں",
        message: "Comfortable conditions. Good time for walks, sunlight (Vitamin D) and outdoor activity.",
        messageUrdu: "موسم خوشگوار ہے۔ سیر، دھوپ (وٹامن ڈی) اور باہر کی سرگرمیوں کا اچھا وقت۔",
        action: "15–20 min morning sunlight; keep hydration routine.",
        actionUrdu: "صبح کی دھوپ میں 15-20 منٹ؛ پانی کا معمول جاری رکھیں۔",
      };
    }
  } else if (domain === "livestock") {
    // Heat stress in cattle/buffalo; cold stress; wet ground → foot rot & mastitis
    if (weather.tempC >= 35) {
      score = 85;
      meta = {
        title: "Heat Stress Alert for Animals",
        titleUrdu: "جانوروں کو گرمی کا دباؤ",
        message: "Buffalo/cow milk yield drops and heat stroke risk rises above 35°C.",
        messageUrdu: "35 ڈگری سے زیادہ گرمی میں دودھ کم اور سنہنے کا خطرہ بڑھ جاتا ہے۔",
        action: "Give shade, cool fresh water 3–4× daily, bathe animals, feed at night.",
        actionUrdu: "سایہ دیں، دن میں 3-4 بار ٹھنڈا پانی، جانوروں کو نہلائیں، چارہ رات کو دیں۔",
      };
    } else if (weather.humidity >= 80 && weather.rainfallMm >= 5) {
      score = 70;
      meta = {
        title: "Wet Conditions — Foot Rot & Mastitis Risk",
        titleUrdu: "گیلا موسم — کھر سڑن اور تھن کی سوزش کا خطرہ",
        message: "Muddy wet floors cause foot rot; humidity raises environmental mastitis.",
        messageUrdu: "کچیچی زمین کھر سڑن کا سبب ہے؛ نمی ماسٹائٹس بڑھاتی ہے۔",
        action: "Dry bedding daily, keep sheds drained, teat-dip after milking.",
        actionUrdu: "روزانہ خشک بچھونا، شیڈ نکاسی، دودھ دینے کے بعد تھن ڈپ۔",
      };
    } else if (weather.tempC <= 8) {
      score = 60;
      meta = {
        title: "Cold Stress in Newborn & Weak Animals",
        titleUrdu: "نو مولود اور کمزور جانوروں کو سردی",
        message: "Calves/kids lose body heat fast; feed demand rises in cold.",
        messageUrdu: "بچھڑے/بکرے کی سردی سے حفاظت ضروری؛ سردی میں چارہ بڑھائیں۔",
        action: "Warm dry bedding, windbreaks, extra fodder & warm water.",
        actionUrdu: "گرم خشک بچھونا، ہوا سے بچاؤ، اضافی چارہ اور ہلکا گرم پانی۔",
      };
    } else {
      score = 20;
      meta = {
        title: "Comfortable Weather for Livestock",
        titleUrdu: "مویشیوں کے لیے مناسب موسم",
        message: "Mild conditions — good for grazing and routine vaccination/deworming.",
        messageUrdu: "معتدل موسم — چرائے اور ویکسینیشن/کیڑے مار دوا کے لیے اچھا وقت۔",
        action: "Keep routine deworming schedule; check animals for ticks.",
        actionUrdu: "کیڑے مار دوا کا معمول جاری رکھیں؛ جانوروں میں ٹک چیک کریں۔",
      };
    }
  } else if (domain === "pet") {
    if (weather.tempC >= 36) {
      score = 80;
      meta = {
        title: "Hot Pavement & Dehydration Risk for Pets",
        titleUrdu: "پالتو جانوروں کو گرم سڑک اور پانی کی کمی",
        message: "Hot ground burns paw pads; pets dehydrate faster than humans. Never leave pets in parked cars.",
        messageUrdu: "گرم سڑک پنجوں کو جلا دیتی ہے؛ پالتو جانور تیزی سے پانی کھوتے ہیں۔ گاڑی میں کبھی نہ چھوڑیں۔",
        action: "Walk early morning/late evening, test ground with your hand, keep water bowl fresh.",
        actionUrdu: "صبح سویرے یا شام کو سیر کروائیں، سڑک ہاتھ سے چیک کریں، تازہ پانی رکھیں۔",
      };
    } else if (weather.humidity >= 75 && weather.rainfallMm > 0) {
      score = 60;
      meta = {
        title: "Ticks & Fungal Coat Risk After Rain",
        titleUrdu: "بارش کے بعد ٹک اور فنگل انفیکشن",
        message: "Wet, humid weather boosts ticks, fleas and skin fungus in pets.",
        messageUrdu: "گیلا مرطوب موسم ٹک، پسو اور جلد کی فنگل بیماری بڑھاتا ہے۔",
        action: "Dry coat after walks, check ears & paws, keep spot-on treatment current.",
        actionUrdu: "سیرو کے بعد بال خشک کریں، کان اور پنجے چیک کریں، حفاظتی دوا جاری رکھیں۔",
      };
    } else {
      score = 20;
      meta = {
        title: "Good Weather for Walks & Play",
        titleUrdu: "سیر اور کھیل کے لیے اچھا موسم",
        message: "Comfortable conditions for outdoor exercise with your pet.",
        messageUrdu: "پالتو جانور کے ساتھ باہر ورزش کا اچھا وقت۔",
        action: "Keep fresh water and routine tick checks after walks.",
        actionUrdu: "تازہ پانی اور سیر کے بعد ٹک کا معائنہ معمول رکھیں۔",
      };
    }
  } else {
    // plant
    if (weather.humidity >= 80 && (weather.rainfallMm > 0 || weather.condition === "rainy")) {
      score = 75;
      meta = {
        title: "Mildew & Leaf Spot Risk in Humid Weather",
        titleUrdu: "نمی میں پھپھوندی اور پتوں کے دھبوں کا خطرہ",
        message: "Wet leaves in humid air spread fungal spots quickly.",
        messageUrdu: "مرطوب موسم میں گیلے پتوں پر فنگل دھبے تیزی سے پھیلتے ہیں۔",
        action: "Water soil-level mornings only, prune crowded growth, neem spray weekly.",
        actionUrdu: "صبح مٹی پر پانی دیں، گنجان شاخیں کاٹیں، ہفتہ وار نیم اسپرے۔",
      };
    } else if (weather.tempC >= 35) {
      score = 60;
      meta = {
        title: "Heat Stress — Water Early & Late",
        titleUrdu: "گرمی — صبح اور شام پانی دیں",
        message: "Potted plants dry out fast; leaves scorch in direct afternoon sun.",
        messageUrdu: "گملوں کی مٹی تیزی سے خشک ہوتی ہے؛ دوپہر کی دھوپ پتے جھلسا دیتی ہے۔",
        action: "Move pots to bright shade, water early morning & evening, mulch soil.",
        actionUrdu: "گملوں کو روشن سایہ دیں، صبح اور شام پانی دیں، مٹی پر توڑی بچھائیں۔",
      };
    } else {
      score = 20;
      meta = {
        title: "Great Day for Repotting & Feeding",
        titleUrdu: "ری پوٹنگ اور کھاد کا اچھا دن",
        message: "Mild weather helps plants recover from repotting and absorb fertiliser.",
        messageUrdu: "معتدل موسم ری پوٹنگ کے بعد پودوں کو سنبھلنے اور کھاد جذب کرنے میں مدد دیتا ہے۔",
        action: "Check soil moisture before watering; wipe leaves to keep them dust-free.",
        actionUrdu: "پانی سے پہلے مٹی چیک کریں؛ پتوں کی دھول صاف کریں۔",
      };
    }
  }

  const level = riskLevelFromScore(score);
  return { level, score, ...meta, affectedCrops: [] };
}

/**
 * Deterministic pseudo-random generator seeded by city name and day offset.
 * Makes mock forecasts feel realistic and consistent for the same city.
 */
function seededRandom(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  return (Math.abs(h) % 1000) / 1000;
}

function mockSnapshotForCity(city: City, dayOffset: number): WeatherSnapshot {
  const baseTemp =
    city.province === "sindh" || city.province === "balochistan"
      ? 32
      : city.province === "gb" || city.province === "ajk"
        ? 20
        : 28;
  const seed = `${city.id}-${dayOffset}-${new Date().toISOString().split("T")[0]}`;
  const r = seededRandom(seed);
  const conditions: WeatherSnapshot["condition"][] = ["sunny", "cloudy", "rainy", "stormy", "cloudy"];
  const condition = conditions[Math.floor(r * conditions.length)];
  const temp = baseTemp + Math.round((r - 0.5) * 8) - dayOffset * 1;
  const humidity = 50 + Math.round(r * 45) + (condition === "rainy" ? 15 : 0);
  const rainfall = condition === "rainy" ? 5 + Math.round(r * 25) : condition === "stormy" ? 15 + Math.round(r * 20) : 0;
  return {
    tempC: temp,
    humidity: Math.min(98, humidity),
    rainfallMm: rainfall,
    condition,
    location: `${city.nameEn}, ${city.province.charAt(0).toUpperCase() + city.province.slice(1)}`,
    forecastDay: ["Today", "Tomorrow", "Day 3", "Day 4", "Day 5"][dayOffset] ?? `Day ${dayOffset + 1}`,
    windKph: Math.round(5 + r * 20),
    pressureHpa: 1000 + Math.round(r * 30),
  };
}

export function getMockForecast(city: City = DEFAULT_CITY): WeatherSnapshot[] {
  return Array.from({ length: 5 }, (_, i) => mockSnapshotForCity(city, i));
}

export function getCurrentMockWeather(city: City = DEFAULT_CITY): WeatherSnapshot {
  return mockSnapshotForCity(city, 0);
}

/**
 * Detect user location using browser geolocation and find the nearest Pakistani city.
 */
export async function detectNearestCity(): Promise<City | undefined> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(undefined);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        let nearest: City | undefined;
        let minDist = Infinity;
        for (const city of PAKISTAN_CITIES) {
          const d = Math.hypot(latitude - city.lat, longitude - city.lon);
          if (d < minDist) {
            minDist = d;
            nearest = city;
          }
        }
        resolve(nearest);
      },
      () => resolve(undefined),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 },
    );
  });
}

export { riskColor, RISK_THRESHOLDS };
