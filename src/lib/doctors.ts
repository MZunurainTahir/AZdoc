/**
 * AZdoc Doctors — cross-domain practitioner directory + 1-on-1 consultation booking.
 * Covers human doctors, livestock vets, pet vets, plant pathologists and
 * agriculture extension officers. Bookings persist offline (Dexie) and sync
 * to Supabase when online (direct insert with sync-queue fallback).
 */
import { db, generateLocalId, isOnline, enqueueSync, type LocalBooking } from "./db";
import { supabase } from "./supabase";
import type { DomainId } from "./domains";

export type ConsultationType = "video" | "audio" | "clinic" | "field_visit";

export interface DoctorProfile {
  id: string;
  name: string;
  title: string;
  titleUrdu: string;
  /** Domains this practitioner serves */
  domains: DomainId[];
  specialties: string[];
  specialtiesUrdu: string[];
  languages: string[];
  experienceYears: number;
  rating: number;
  consultations: number;
  feePkr: number;
  availableSlots: string[];
  image?: string;
  verified: boolean;
}

export const DOCTORS: DoctorProfile[] = [
  // ── Human health ──
  {
    id: "dr-ayesha-gp",
    name: "Dr. Ayesha Malik",
    title: "General Physician (MBBS, FCPS)",
    titleUrdu: "جنرل فزیشن (ایم بی بی ایس)",
    domains: ["human"],
    specialties: ["Fever & Flu", "Diabetes", "Blood Pressure", "General Checkup"],
    specialtiesUrdu: ["بخار اور فلو", "ذیابیطس", "بلڈ پریشر", "معائنہ"],
    languages: ["Urdu", "English", "Punjabi"],
    experienceYears: 11,
    rating: 4.9,
    consultations: 3200,
    feePkr: 600,
    availableSlots: ["09:00 AM", "12:00 PM", "06:00 PM"],
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&auto=format&fit=crop&q=60",
    verified: true,
  },
  {
    id: "dr-bilal-derma",
    name: "Dr. Bilal Ahmed",
    title: "Dermatologist & Skin Specialist",
    titleUrdu: "جلدیات ماہر",
    domains: ["human"],
    specialties: ["Skin Allergy", "Fungal Infection", "Acne", "Eczema"],
    specialtiesUrdu: ["جلد کی الرجی", "فنگل انفیکشن", "دانے", "ایکزیما"],
    languages: ["Urdu", "English"],
    experienceYears: 9,
    rating: 4.8,
    consultations: 1850,
    feePkr: 800,
    availableSlots: ["10:30 AM", "03:00 PM", "08:00 PM"],
    image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&auto=format&fit=crop&q=60",
    verified: true,
  },
  {
    id: "dr-hina-ped",
    name: "Dr. Hina Shah",
    title: "Child Specialist (Pediatrician)",
    titleUrdu: "بچوں کی ماہر",
    domains: ["human"],
    specialties: ["Child Fever", "Vaccination", "Nutrition", "Stomach Issues"],
    specialtiesUrdu: ["بچوں کا بخار", "ویکسینیشن", "غذا", "پیٹ کے مسائل"],
    languages: ["Urdu", "English", "Sindhi"],
    experienceYears: 7,
    rating: 4.9,
    consultations: 2400,
    feePkr: 700,
    availableSlots: ["09:30 AM", "01:00 PM", "07:00 PM"],
    image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=200&auto=format&fit=crop&q=60",
    verified: true,
  },

  // ── Livestock ──
  {
    id: "dr-ahmed-vet",
    name: "Dr. Ahmed Raza",
    title: "Senior Livestock Veterinarian",
    titleUrdu: "سینئر مویشیات کا ویٹرنری ڈاکٹر",
    domains: ["livestock"],
    specialties: ["Mastitis", "Lumpy Skin Disease", "FMD", "Reproduction"],
    specialtiesUrdu: ["ماسٹائٹس", "لمپی سکن", "ایف ایم ڈی", "افزائش"],
    languages: ["Urdu", "English", "Punjabi"],
    experienceYears: 12,
    rating: 4.9,
    consultations: 1240,
    feePkr: 500,
    availableSlots: ["09:00 AM", "11:30 AM", "04:00 PM"],
    image: "https://images.unsplash.com/photo-1629810418831-3a3d40b85dba?w=200&auto=format&fit=crop&q=60",
    verified: true,
  },

  // ── Pets ──
  {
    id: "dr-omar-pet",
    name: "Dr. Omar Sheikh",
    title: "Small Animal Veterinarian (Cats & Dogs)",
    titleUrdu: "چھوٹے جانوروں کا ڈاکٹر",
    domains: ["pet"],
    specialties: ["Mange &Ticks", "Vaccination", "Deworming", "Nutrition"],
    specialtiesUrdu: ["خارش", "ویکسینیشن", "کیڑے مار", "غذا"],
    languages: ["Urdu", "English"],
    experienceYears: 8,
    rating: 4.8,
    consultations: 960,
    feePkr: 700,
    availableSlots: ["11:00 AM", "05:00 PM", "08:30 PM"],
    image: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=200&auto=format&fit=crop&q=60",
    verified: true,
  },
  {
    id: "dr-fatima-poultry",
    name: "Dr. Fatima Noor",
    title: "Poultry & Pet Birds Specialist",
    titleUrdu: "پولٹری اور پالتو پرندوں کی ماہر",
    domains: ["livestock", "pet"],
    specialties: ["Newcastle Disease", "Coccidiosis", "Vaccination", "Feed Formulation"],
    specialtiesUrdu: ["رانی کھیت", "کوکسڈیوسس", "ویکسینیشن", "خوراک ترکیب"],
    languages: ["Urdu", "English", "Punjabi"],
    experienceYears: 6,
    rating: 4.8,
    consultations: 640,
    feePkr: 350,
    availableSlots: ["08:00 AM", "05:00 PM", "07:00 PM"],
    image: "/dr-fatima-noor.png",
    verified: true,
  },

  // ── Plants & Crops ──
  {
    id: "dr-sana-crop",
    name: "Dr. Sana Khalid",
    title: "Plant Pathologist & Crop Advisor",
    titleUrdu: "پلانٹ پیتھالوجسٹ اور فصل مشیر",
    domains: ["plant", "crop"],
    specialties: ["Wheat Rust", "Cotton Whitefly", "Tomato Blight", "IPM"],
    specialtiesUrdu: ["گندم کنگی", "کپاس سفید مکھی", "ٹماٹر جھلساؤ", "آئی پی ایم"],
    languages: ["Urdu", "English"],
    experienceYears: 8,
    rating: 4.8,
    consultations: 856,
    feePkr: 400,
    availableSlots: ["10:00 AM", "02:00 PM", "06:00 PM"],
    image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=200&auto=format&fit=crop&q=60",
    verified: true,
  },
  {
    id: "mr-ali-extension",
    name: "Ali Hassan",
    title: "Agriculture Extension Officer",
    titleUrdu: "زرعی توسیع افسر",
    domains: ["crop", "plant"],
    specialties: ["Fertilizer Planning", "Seed Selection", "Soil Health", "Government Schemes"],
    specialtiesUrdu: ["کھاد پروگرام", "بیج منتخب کرنا", "مٹی کی صحت", "سرکاری اسکیمیں"],
    languages: ["Urdu", "Punjabi", "Saraiki"],
    experienceYears: 15,
    rating: 4.7,
    consultations: 2100,
    feePkr: 0,
    availableSlots: ["09:30 AM", "12:00 PM", "03:30 PM"],
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=60",
    verified: true,
  },
];

export const CONSULTATION_TYPES: { id: ConsultationType; label: string; labelUrdu: string }[] = [
  { id: "video", label: "Video Call", labelUrdu: "ویڈیو کال" },
  { id: "audio", label: "Audio Call", labelUrdu: "آڈیو کال" },
  { id: "clinic", label: "Clinic Visit", labelUrdu: "کلینک وزٹ" },
  { id: "field_visit", label: "Field Visit", labelUrdu: "کھیت وزٹ" },
];

export function doctorsForDomain(domain: DomainId | "all"): DoctorProfile[] {
  if (domain === "all") return DOCTORS;
  return DOCTORS.filter((d) => d.domains.includes(domain));
}

/** Next 7 days as booking date options */
export function nextBookingDates(): { iso: string; label: string; labelUrdu: string }[] {
  const out: { iso: string; label: string; labelUrdu: string }[] = [];
  const dayEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayUr = ["اتوار", "پیر", "منگل", "بدھ", "جمعرات", "جمعہ", "ہفتہ"];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    out.push({
      iso,
      label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : `${dayEn[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1}`,
      labelUrdu: i === 0 ? "آج" : i === 1 ? "کل" : `${dayUr[d.getDay()]}، ${d.getDate()}/${d.getMonth() + 1}`,
    });
  }
  return out;
}

/* ── Booking persistence ── */

export async function createBooking(params: {
  userId: string;
  doctor: DoctorProfile;
  domain: DomainId;
  consultationType: ConsultationType;
  slot: string;
  dateIso: string;
  note: string;
  feePkr: number;
}): Promise<LocalBooking> {
  const now = new Date().toISOString();
  const localId = generateLocalId();
  const booking: LocalBooking = {
    id: localId,
    localId,
    user_id: params.userId,
    doctor_id: params.doctor.id,
    doctor_name: params.doctor.name,
    domain: params.domain,
    consultation_type: params.consultationType,
    slot: params.slot,
    booking_date: params.dateIso,
    fee_pkr: params.feePkr,
    patient_note: params.note || null,
    status: "confirmed",
    created_at: now,
    _synced: false,
  };

  // 1. Always save locally first (offline-first)
  await db.bookings.add(booking);

  // 2. Try immediate Supabase sync; fall back to the sync queue
  if (isOnline()) {
    try {
      const { localId: _l, _synced: _s, id: _i, ...clean } = booking;
      const { data, error } = await supabase.from("bookings").insert(clean).select("id");
      if (error) throw error;
      if (data?.[0]?.id) {
        await db.bookings.where("localId").equals(localId).delete();
        const synced = { ...booking, id: data[0].id as string, _synced: true };
        await db.bookings.add(synced);
        return synced;
      }
      await db.bookings.where("localId").equals(localId).modify({ _synced: true });
    } catch (err) {
      console.warn("[doctors] direct sync failed, queued for later:", err);
      await enqueueSync("bookings", "insert", localId, booking as unknown as Record<string, unknown>);
    }
  } else {
    await enqueueSync("bookings", "insert", localId, booking as unknown as Record<string, unknown>);
  }

  return booking;
}

export async function listBookings(userId: string): Promise<LocalBooking[]> {
  try {
    const rows = await db.bookings.where("user_id").equals(userId).toArray();
    return rows.sort((a, b) => (b.created_at > a.created_at ? 1 : -1));
  } catch {
    return [];
  }
}

export async function cancelBooking(localId: string): Promise<void> {
  await db.bookings.where("localId").equals(localId).modify({ status: "cancelled" });
  const row = await db.bookings.where("localId").equals(localId).first();
  if (row?.id && !row.id.startsWith("local_") && isOnline()) {
    try {
      await supabase.from("bookings").update({ status: "cancelled" }).eq("id", row.id);
    } catch (err) {
      console.warn("[doctors] cancel sync failed:", err);
    }
  }
}
