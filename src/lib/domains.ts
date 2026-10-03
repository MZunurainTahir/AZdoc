/**
 * AZdoc Domain Registry — the heart of the multi-domain bio-health ecosystem.
 * One app, every living being: humans, livestock, pets, plants and crops.
 * Each domain customises scanning, AI persona, doctors, pharmacy and tools.
 */

export type DomainId = "human" | "livestock" | "pet" | "plant" | "crop";

export interface DomainTheme {
  /** Tailwind classes — literal strings so Tailwind v4 can statically extract them */
  gradient: string;
  solid: string;
  softBg: string;
  text: string;
  border: string;
}

export interface Domain {
  id: DomainId;
  name: string;
  nameUrdu: string;
  tagline: string;
  taglineUrdu: string;
  emoji: string;
  /** What the photo-scanner looks at, e.g. "skin, eyes, symptoms" */
  scanHint: string;
  scanHintUrdu: string;
  /** Practitioner title used across consult flows */
  doctorLabel: string;
  doctorLabelUrdu: string;
  /** Per-domain sub-brand shown in the header & banners while this domain is active */
  brandName: string;
  brandNameUrdu: string;
  theme: DomainTheme;
  /** AI safety / scope note shown with AI answers in this domain */
  safetyNote: string;
  safetyNoteUrdu: string;
}

export const DOMAINS: Domain[] = [
  {
    id: "human",
    name: "Human Health",
    nameUrdu: "انسانی صحت",
    tagline: "Symptoms, first-aid & licensed doctors",
    taglineUrdu: "علامات، فوری علاج اور ڈاکٹرز",
    emoji: "🧑‍⚕️",
    scanHint: "skin, eyes, throat or visible symptoms",
    scanHintUrdu: "جلد، آنکھیں، گلہ یا دکھائی دینے والی علامات",
    doctorLabel: "Doctor",
    doctorLabelUrdu: "ڈاکٹر",
    brandName: "HealthDoc",
    brandNameUrdu: "ہیلتھ ڈاک",
    theme: {
      gradient: "from-rose-600 to-red-500",
      solid: "bg-rose-600",
      softBg: "bg-rose-50 dark:bg-rose-500/10",
      text: "text-rose-600",
      border: "border-rose-200",
    },
    safetyNote: "AZdoc gives preliminary guidance only — it is not a medical diagnosis. For emergencies call Rescue 1122.",
    safetyNoteUrdu: "AZdoc صرف ابتدائی رہنمائی دیتا ہے — یہ طبی تشخیص نہیں ہے۔ ایمرجنسی میں 1122 پر کال کریں۔",
  },
  {
    id: "livestock",
    name: "Livestock",
    nameUrdu: "مویشی",
    tagline: "Cattle, buffalo, goats & poultry health",
    taglineUrdu: "گائے، بھینس، بکریوں اور مرغیوں کی صحت",
    emoji: "🐄",
    scanHint: "animal skin, mouth, hooves, udder or behaviour",
    scanHintUrdu: "جانور کی جلد، منہ، کھر، تھن یا رویہ",
    doctorLabel: "Veterinarian",
    doctorLabelUrdu: "ویٹرنری ڈاکٹر",
    brandName: "StockDoc",
    brandNameUrdu: "اسٹاک ڈاک",
    theme: {
      gradient: "from-amber-500 to-orange-500",
      solid: "bg-amber-500",
      softBg: "bg-amber-50 dark:bg-amber-500/10",
      text: "text-amber-600",
      border: "border-amber-200",
    },
    safetyNote: "For notifiable diseases (e.g. FMD, LSD) always inform your local livestock department.",
    safetyNoteUrdu: "متعدی بیماریوں (جیسے ایف ایم ڈی) کی صورت میں مقامی مویشیات ڈیپارٹمنٹ کو مطلع کریں۔",
  },
  {
    id: "pet",
    name: "Pets",
    nameUrdu: "پالتو جانور",
    tagline: "Cats, dogs, birds & small companions",
    taglineUrdu: "بلی، کتے، پرندے اور چھوٹے ساتھی",
    emoji: "🐾",
    scanHint: "pet skin, coat, eyes, ears or wounds",
    scanHintUrdu: "پالتو جانور کی جلد، بال، آنکھیں، کان یا زخم",
    doctorLabel: "Pet Vet",
    doctorLabelUrdu: "پالتو جانوروں کا ڈاکٹر",
    brandName: "PetsDoc",
    brandNameUrdu: "پٹس ڈاک",
    theme: {
      gradient: "from-sky-500 to-blue-500",
      solid: "bg-sky-500",
      softBg: "bg-sky-50 dark:bg-sky-500/10",
      text: "text-sky-600",
      border: "border-sky-200",
    },
    safetyNote: "Vaccinations and rabies concerns need an in-person vet visit — book a consult below.",
    safetyNoteUrdu: "ویکسینیشن اور ریبز کے معاملات کے لیے ڈاکٹر سے ملاقات ضروری ہے۔",
  },
  {
    id: "plant",
    name: "Plants & Garden",
    nameUrdu: "پودے اور باغ",
    tagline: "House plants, vegetables & ornamentals",
    taglineUrdu: "گھریلو پودے، سبزیاں اور آرائشی پودے",
    emoji: "🪴",
    scanHint: "leaves, stems, flowers or soil condition",
    scanHintUrdu: "پتے، تنا، پھول یا مٹی کی حالت",
    doctorLabel: "Plant Doctor",
    doctorLabelUrdu: "پلانٹ ڈاکٹر",
    brandName: "PlantDoc",
    brandNameUrdu: "پلانٹ ڈاک",
    theme: {
      gradient: "from-lime-600 to-emerald-500",
      solid: "bg-lime-600",
      softBg: "bg-lime-50 dark:bg-lime-500/10",
      text: "text-lime-700",
      border: "border-lime-200",
    },
    safetyNote: "Identified issues are advisory — treat with approved products only.",
    safetyNoteUrdu: "تشخیص صرف مشورہ ہے — صرف منظور شدہ مصنوعات استعمال کریں۔",
  },
  {
    id: "crop",
    name: "Crops",
    nameUrdu: "فصلیں",
    tagline: "Field crops: wheat, cotton, rice, maize…",
    taglineUrdu: "فصلیں: گندم، کپاس، چاول، مکئی…",
    emoji: "🌾",
    scanHint: "leaves, stems, grains or field patterns",
    scanHintUrdu: "پتے، تنا، دانے یا کھیت کے نمونے",
    doctorLabel: "Crop Specialist",
    doctorLabelUrdu: "فصل ماہر",
    brandName: "FasalDoc",
    brandNameUrdu: "فصل ڈاک",
    theme: {
      gradient: "from-emerald-600 to-green-500",
      solid: "bg-emerald-600",
      softBg: "bg-emerald-50 dark:bg-emerald-500/10",
      text: "text-emerald-600",
      border: "border-emerald-200",
    },
    safetyNote: "Follow spray label rates and pre-harvest intervals for safe produce.",
    safetyNoteUrdu: "محفوظ فصل کے لیے اسپرے کی تجویز کردہ مقدار اور وقفہ ضرور اپنائیں۔",
  },
];

export const DOMAIN_IDS: DomainId[] = DOMAINS.map((d) => d.id);

export function getDomain(id: DomainId | string | null | undefined): Domain {
  return DOMAINS.find((d) => d.id === id) ?? DOMAINS[DOMAINS.length - 1]; // default: crop
}

/**
 * Coerce a stored diagnosis/library type (legacy rows may be raw strings or
 * pre-AZdoc "crop"|"livestock" only) into a valid DomainId.
 */
export function asDomainId(type: string | null | undefined): DomainId {
  return (DOMAIN_IDS as string[]).includes(type ?? "") ? (type as DomainId) : "crop";
}

/** Emoji for a scan/library type — safe for any legacy value. */
export function domainEmoji(type: string | null | undefined): string {
  return getDomain(asDomainId(type)).emoji;
}

/** Storage key for the active domain */
export const ACTIVE_DOMAIN_KEY = "azdoc_domain";
