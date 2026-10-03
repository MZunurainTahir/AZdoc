/**
 * DoctorsScreen — 1-on-1 consultations with domain-expert practitioners.
 * Directory → filters by domain → booking flow (type, date, slot, note) →
 * confirmation persisted offline-first with Supabase sync.
 */
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { useDomain } from "../context/DomainContext";
import { DOMAINS, getDomain, DomainId } from "../lib/domains";
import {
  CONSULTATION_TYPES,
  doctorsForDomain,
  nextBookingDates,
  createBooking,
  listBookings,
  cancelBooking,
  type DoctorProfile,
  type ConsultationType,
} from "../lib/doctors";
import type { LocalBooking } from "../lib/db";
import {
  Star, BadgeCheck, Video, Phone, MapPin, Tractor, X,
  CalendarCheck, CheckCircle2, MessageSquare, Stethoscope,
} from "lucide-react";

const CONSULT_ICONS: Record<ConsultationType, typeof Video> = {
  video: Video,
  audio: Phone,
  clinic: MapPin,
  field_visit: Tractor,
};

export default function DoctorsScreen() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const { domainId } = useDomain();
  const navigate = useNavigate();
  const ur = lang === "ur";

  const [filter, setFilter] = useState<DomainId | "all">(domainId);
  const [bookings, setBookings] = useState<LocalBooking[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [consultType, setConsultType] = useState<ConsultationType>("video");
  const [dateIso, setDateIso] = useState(nextBookingDates()[0].iso);
  const [slot, setSlot] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [bookingBusy, setBookingBusy] = useState(false);
  const [confirmed, setConfirmed] = useState<{ name: string; slot: string } | null>(null);

  const refreshBookings = useCallback(async () => {
    if (!user) return;
    setBookings(await listBookings(user.id));
  }, [user]);

  useEffect(() => {
    refreshBookings();
  }, [refreshBookings]);

  const doctors = doctorsForDomain(filter);
  const dates = nextBookingDates();

  const openBooking = (doc: DoctorProfile) => {
    setExpanded(expanded === doc.id ? null : doc.id);
    setSlot(null);
    setNote("");
    setConsultType("video");
    setDateIso(dates[0].iso);
    setConfirmed(null);
  };

  const confirmBooking = async (doc: DoctorProfile) => {
    if (!user || !slot) return;
    setBookingBusy(true);
    try {
      await createBooking({
        userId: user.id,
        doctor: doc,
        domain: filter === "all" ? doc.domains[0] : filter,
        consultationType: consultType,
        slot,
        dateIso,
        note,
        feePkr: doc.feePkr,
      });
      setConfirmed({ name: doc.name, slot });
      await refreshBookings();
    } finally {
      setBookingBusy(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-bg-primary pb-6">
      {/* Title */}
      <div className="px-5 pt-4 pb-2 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-sm shrink-0">
          <Stethoscope className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-heading font-bold text-lg text-text-primary leading-tight">
            {ur ? "ڈاکٹر سے مشاورت" : "Consult a Doctor"}
          </h1>
          <p className="text-[11px] text-text-muted">
            {ur ? "ہر مخلوق کے ماہر — ون ٹو ون سیشن" : "Domain experts — 1-on-1 sessions"}
          </p>
        </div>
      </div>

      {/* Domain filter chips */}
      <div className="px-5 mb-3 flex gap-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setFilter("all")}
          className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all ${
            filter === "all"
              ? "bg-primary text-white border-primary"
              : "bg-bg-elevated text-text-muted border-border hover:border-primary/30"
          }`}
        >
          {ur ? "سب" : "All"}
        </button>
        {DOMAINS.map((d) => (
          <button
            key={d.id}
            onClick={() => setFilter(d.id)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all flex items-center gap-1 ${
              filter === d.id
                ? `${d.theme.solid} text-white border-transparent`
                : "bg-bg-elevated text-text-muted border-border hover:border-primary/30"
            }`}
          >
            <span>{d.emoji}</span>
            {ur ? d.nameUrdu : d.name}
          </button>
        ))}
      </div>

      {/* My bookings */}
      {bookings.length > 0 && (
        <div className="px-5 mb-4">
          <p className="text-xs font-bold text-text-primary mb-2 flex items-center gap-1.5">
            <CalendarCheck className="w-3.5 h-3.5 text-primary" />
            {ur ? "میری بکنگز" : "My Bookings"}
          </p>
          <div className="space-y-2">
            {bookings.slice(0, 5).map((b) => {
              const d = getDomain(b.domain);
              const active = b.status === "confirmed";
              return (
                <div
                  key={b.localId ?? b.id}
                  className="bg-bg-elevated border border-border rounded-xl px-3.5 py-2.5 flex items-center gap-3"
                >
                  <span className={`text-lg ${b.status === "cancelled" ? "grayscale opacity-50" : ""}`}>{d.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-text-primary truncate">{b.doctor_name}</p>
                    <p className="text-[10px] text-text-muted">
                      {b.booking_date} · {b.slot} · {b.consultation_type.replace("_", " ")}
                    </p>
                  </div>
                  {active ? (
                    <button
                      onClick={async () => {
                        await cancelBooking(b.localId!);
                        refreshBookings();
                      }}
                      className="shrink-0 text-[10px] font-bold text-danger bg-danger/10 px-2.5 py-1 rounded-full hover:bg-danger/20 transition-colors"
                    >
                      {ur ? "منسوخ" : "Cancel"}
                    </button>
                  ) : (
                    <span className="shrink-0 text-[10px] font-bold text-text-muted bg-bg-secondary px-2.5 py-1 rounded-full">
                      {ur ? "منسوخ شدہ" : "Cancelled"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Doctor cards */}
      <div className="px-5 space-y-3">
        {doctors.map((doc) => {
          const isOpen = expanded === doc.id;
          return (
            <div key={doc.id} className="bg-bg-elevated border border-border rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 flex gap-3.5">
                <div className="relative shrink-0">
                  {doc.image ? (
                    <img
                      src={doc.image}
                      alt={doc.name}
                      className="w-14 h-14 rounded-xl object-cover border border-border"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-primary-bg flex items-center justify-center text-xl">
                      🧑‍⚕️
                    </div>
                  )}
                  {doc.verified && (
                    <BadgeCheck className="absolute -top-1 -right-1 w-4 h-4 text-primary bg-bg-elevated rounded-full" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-heading font-bold text-sm text-text-primary truncate">{doc.name}</p>
                      <p className="text-[11px] text-text-muted truncate">{ur ? doc.titleUrdu : doc.title}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 bg-warning-bg px-2 py-0.5 rounded-full">
                      <Star className="w-3 h-3 text-warning fill-warning" />
                      <span className="text-[10px] font-bold text-warning">{doc.rating}</span>
                    </div>
                  </div>

                  {/* Domain badges */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {doc.domains.map((dom) => {
                      const dd = getDomain(dom);
                      return (
                        <span key={dom} className={`text-[9px] font-bold ${dd.theme.softBg} ${dd.theme.text} px-1.5 py-0.5 rounded-md`}>
                          {dd.emoji} {ur ? dd.nameUrdu : dd.name}
                        </span>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-3 mt-2 text-[10px] text-text-muted">
                    <span>{doc.experienceYears}+ {ur ? "سال تجربہ" : "yrs exp"}</span>
                    <span>{doc.consultations.toLocaleString()}+ {ur ? "مشاورتیں" : "consults"}</span>
                    <span className="font-bold text-text-primary">
                      {doc.feePkr === 0 ? (ur ? "مفت" : "Free") : `Rs. ${doc.feePkr}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Specialties */}
              <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                {(ur ? doc.specialtiesUrdu : doc.specialties).slice(0, 4).map((s) => (
                  <span key={s} className="text-[10px] bg-bg-secondary text-text-muted px-2 py-0.5 rounded-full">
                    {s}
                  </span>
                ))}
              </div>

              {/* Book / collapse */}
              <div className="px-4 pb-4">
                <button
                  onClick={() => openBooking(doc)}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all active:scale-[0.98] ${
                    isOpen
                      ? "bg-bg-secondary text-text-muted"
                      : "bg-gradient-to-r from-primary to-primary-light text-white shadow-sm shadow-primary/25"
                  }`}
                >
                  {isOpen ? (ur ? "بند کریں" : "Close") : ur ? "بک کریں" : `Book ${doc.feePkr === 0 ? "(Free)" : ""}`}
                </button>
              </div>

              {/* Booking panel */}
              {isOpen && (
                <div className="border-t border-border bg-bg-secondary/50 p-4 space-y-3.5 animate-scaleIn">
                  {confirmed ? (
                    <div className="text-center py-4">
                      <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-2" />
                      <p className="font-heading font-bold text-sm text-text-primary">
                        {ur ? "بکنگ کامیاب!" : "Booking Confirmed!"}
                      </p>
                      <p className="text-[11px] text-text-muted mt-1">
                        {ur
                          ? `${confirmed.name} سے ${confirmed.slot} پر ملاقات طے ہو گئی۔`
                          : `${confirmed.name} will see you at ${confirmed.slot}.`}
                      </p>
                      <button
                        onClick={() => { setExpanded(null); setConfirmed(null); }}
                        className="mt-3 text-[11px] font-bold text-primary hover:underline"
                      >
                        {ur ? "ایک اور بکنگ" : "Book another"}
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Consultation type */}
                      <div>
                        <p className="text-[10px] font-bold text-text-muted mb-1.5 uppercase tracking-wide">
                          {ur ? "طرزِ مشاورت" : "Consultation Type"}
                        </p>
                        <div className="grid grid-cols-4 gap-1.5">
                          {CONSULTATION_TYPES.map((ct) => {
                            const Icon = CONSULT_ICONS[ct.id];
                            const active = consultType === ct.id;
                            return (
                              <button
                                key={ct.id}
                                onClick={() => setConsultType(ct.id)}
                                className={`flex flex-col items-center gap-1 py-2 rounded-xl border text-[9px] font-bold transition-all ${
                                  active
                                    ? "border-primary bg-primary-bg text-primary"
                                    : "border-border bg-bg-elevated text-text-muted"
                                }`}
                              >
                                <Icon className="w-4 h-4" />
                                {ur ? ct.labelUrdu : ct.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Date */}
                      <div>
                        <p className="text-[10px] font-bold text-text-muted mb-1.5 uppercase tracking-wide">
                          {ur ? "تاریخ" : "Date"}
                        </p>
                        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                          {dates.map((d) => (
                            <button
                              key={d.iso}
                              onClick={() => setDateIso(d.iso)}
                              className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${
                                dateIso === d.iso
                                  ? "border-primary bg-primary text-white"
                                  : "border-border bg-bg-elevated text-text-muted"
                              }`}
                            >
                              {ur ? d.labelUrdu : d.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Slots */}
                      <div>
                        <p className="text-[10px] font-bold text-text-muted mb-1.5 uppercase tracking-wide">
                          {ur ? "دستیاب وقت" : "Available Slots"}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {doc.availableSlots.map((s) => (
                            <button
                              key={s}
                              onClick={() => setSlot(s)}
                              className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${
                                slot === s
                                  ? "border-primary bg-primary text-white"
                                  : "border-border bg-bg-elevated text-text-muted hover:border-primary/40"
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Note */}
                      <div>
                        <p className="text-[10px] font-bold text-text-muted mb-1.5 uppercase tracking-wide">
                          {ur ? "مسئلہ بتائیں (اختیاری)" : "Describe the issue (optional)"}
                        </p>
                        <div className="relative">
                          <MessageSquare className="absolute top-2.5 left-3 w-3.5 h-3.5 text-text-muted" />
                          <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows={2}
                            placeholder={ur ? "مثلاً: بخار 2 دن سے ہے…" : "e.g. Fever since 2 days…"}
                            className="w-full pl-9 pr-3 py-2 text-xs bg-bg-elevated border border-border rounded-xl text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-primary/50 resize-none"
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => confirmBooking(doc)}
                        disabled={!slot || bookingBusy}
                        className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-primary to-primary-light text-white shadow-sm shadow-primary/25 transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
                      >
                        {bookingBusy
                          ? (ur ? "بک ہو رہی ہے…" : "Booking…")
                          : slot
                            ? ur
                              ? `تصدیق کریں — ${slot}`
                              : `Confirm — ${slot}`
                            : ur ? "پہلے وقت منتخب کریں" : "Select a slot first"}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Close float button when coming from a flow */}
      <button
        onClick={() => navigate("/")}
        className="fixed bottom-24 right-4 w-10 h-10 rounded-full bg-bg-elevated border border-border shadow-lg flex items-center justify-center text-text-muted hover:text-text-primary transition-colors z-40"
        title={ur ? "ہوم" : "Home"}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
