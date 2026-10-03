/**
 * AZdoc Vaccination Schedules — domain-specific immunization guides.
 * Human (EPI childhood + adult), Livestock (FMD/HS/LSD/PPR), Pet (rabies/DHPPi/FVRCP).
 * Strictly isolated per domain.
 */

export interface VaccineDose {
  at: string;       // e.g. "At birth"
  atUr: string;
  note?: string;
  noteUr?: string;
}

export interface VaccineEntry {
  id: string;
  emoji: string;
  title: string;
  titleUr: string;
  protects: string;
  protectsUr: string;
  doses: VaccineDose[];
  warning?: string;
  warningUr?: string;
}

/* ── Human vaccination (HealthDoc) — aligned with Pakistan EPI schedule ── */
export const HUMAN_VACCINES: VaccineEntry[] = [
  {
    id: "bcg-polio-birth",
    emoji: "👶",
    title: "BCG & Polio (Birth)",
    titleUr: "بی سی جی اور پولیو (پیدائش پر)",
    protects: "Tuberculosis & Poliomyelitis",
    protectsUr: "تیس (TB) اور پولیو",
    doses: [
      { at: "At birth", atUr: "پیدائش پر", note: "BCG left arm + OPV-0 drops within 24 hours", noteUr: "پیدائش کے 24 گھنٹوں میں بائیں بازو میں انجیکشن اور پولیو کے قطرے" },
      { at: "6 weeks", atUr: "6 ہفتے", note: "Pentavalent-1 + OPV-1 + Rotavirus-1 + Pneumococcal-1 (one combined visit)", noteUr: "پینٹا 1 + پولیو 1 + روٹا وائرس 1 + نمونیا 1 — ایک ہی دورے میں" },
      { at: "10 weeks", atUr: "10 ہفتے", note: "Pentavalent-2 + OPV-2 + Rotavirus-2", noteUr: "پینٹا 2 + پولیو 2 + روٹا 2" },
      { at: "14 weeks", atUr: "14 ہفتے", note: "Pentavalent-3 + OPV-3 + IPV (injectable polio) + Pneumococcal-2", noteUr: "پینٹا 3 + پولیو 3 + انجیکشن والا پولیو + نمونیا 2" },
      { at: "9 months", atUr: "9 ماہ", note: "Measles-1 + Vitamin A dose", noteUr: "خسرہ 1 + وٹامن اے" },
      { at: "15 months", atUr: "15 ماہ", note: "Measles-2 (MR) booster", noteUr: "خسرہ 2 بوسٹر" },
    ],
    warning: "All EPI vaccines are FREE at government hospitals & basic health units — carry the child's vaccination card every visit.",
    warningUr: "تمام ای پی آئی ویکسین سرکاری ہسپتالوں میں مفت ہیں — ہر بار بچے کا ویکسین کارڈ ساتھ لے جائیں۔",
  },
  {
    id: "pentavalent",
    emoji: "🛡️",
    title: "Pentavalent (5-in-1)",
    titleUr: "پینٹا ویلنٹ (5 بیماریوں کی ایک ویکسین)",
    protects: "Diphtheria, Pertussis (whooping cough), Tetanus, Hepatitis B, Hib",
    protectsUr: "ڈپhtیریا، کالی کھانسی، ٹیٹنس، ہیپاٹائٹس بی، ہیب",
    doses: [
      { at: "6 weeks", atUr: "6 ہفتے" },
      { at: "10 weeks", atUr: "10 ہفتے" },
      { at: "14 weeks", atUr: "14 ہفتے" },
    ],
    warning: "Mild fever for 1–2 days after the shot is normal — paracetamol syrup helps. High fever or breathing difficulty → doctor.",
    warningUr: "ٹیکے کے بعد 1-2 دن ہلکا بخار عام ہے — پیراسیٹامول شربت سے آرام۔ تیز بخار یا سانس کی تکلیف پر ڈاکٹر سے رجوع کریں۔",
  },
  {
    id: "typhoid-hepb",
    emoji: "💉",
    title: "Typhoid & Hepatitis B (Children/Adults)",
    titleUr: "ٹائفائیڈ اور ہیپاٹائٹس بی",
    protects: "Typhoid fever & liver infection",
    protectsUr: "ٹائفائیڈ اور جگر کی بیماری",
    doses: [
      { at: "2 years+", atUr: "2 سال+", note: "Typhoid conjugate vaccine (TCV) — single dose, lasts ~3-5 years", noteUr: "ٹائفائیڈ ٹیکہ ایک خوراک، 3-5 سال تک تحفظ" },
      { at: "Any age", atUr: "کسی بھی عمر", note: "Hepatitis B: 3 doses (0, 1, 6 months) for unvaccinated adults", noteUr: "ہیپاٹائٹس بی: غیر ویکسینیٹڈ بڑوں کے لیے 3 خوراکیں (0، 1، 6 ماہ)" },
    ],
  },
  {
    id: "tetanus",
    emoji: "🔩",
    title: "Tetanus (TT/Td)",
    titleUr: "ٹیٹنس (لوہے کی ٹھوکر کا ٹیکہ)",
    protects: "Lockjaw from wounds, rust injuries, deliveries",
    protectsUr: "زخم، زنگ لگی چیز یا زچگی سے ہونے والی بیماری",
    doses: [
      { at: "Childhood", atUr: "بچپن", note: "Covered in Pentavalent series", noteUr: "پینٹا ویکسین میں شامل" },
      { at: "Every 10 years", atUr: "ہر 10 سال", note: "Td booster for adults", noteUr: "بڑوں کے لیے بوسٹر" },
      { at: "After dirty wound", atUr: "کچے زخم پر", note: "Get TT shot within 24 hours if not vaccinated in last 5 years", noteUr: "آخری ٹیکہ 5 سال سے زیادہ پرانا ہو تو زخم کے 24 گھنٹوں میں لگوائیں" },
    ],
    warning: "Rusty nail, animal bite or deep cut and your last tetanus shot is older than 5 years → visit the nearest clinic today.",
    warningUr: "زنگ لگی کیل، جانور کا کاٹ یا گہرا زخم اور آخری ٹیکہ 5 سال سے پرانا ہو → آج ہی قریبی کلینک جائیں۔",
  },
  {
    id: "flu-covid",
    emoji: "🤧",
    title: "Flu & COVID-19 (Adults/Elderly)",
    titleUr: "فلو اور کورونا (بڑے/بوڑھے)",
    protects: "Seasonal influenza & COVID-19",
    protectsUr: "موسمی فلو اور کورونا",
    doses: [
      { at: "Yearly (Oct–Nov)", atUr: "سالانہ (اکتوبر–نومبر)", note: "Flu shot — especially for 60+, diabetics, asthma & heart patients", noteUr: "فلو ٹیکہ — خاص طور پر 60 سال سے اوپر، ذیابیطس، دمہ اور دل کے مریض" },
      { at: "Per health dept.", atUr: "محکمہ صحت کے مطابق", note: "COVID booster when announced by the government campaign", noteUr: "سرکاری مہم کے اعلان پر کورونا بوسٹر" },
    ],
  },
];

/* ── Livestock vaccination (StockDoc) — via vet / livestock dept ── */
export const LIVESTOCK_VACCINES: VaccineEntry[] = [
  {
    id: "fmd_vax",
    emoji: "🐄",
    title: "Foot & Mouth Disease (FMD)",
    titleUr: "منہ کھر (ایف ایم ڈی)",
    protects: "Cattle & buffalo — the #1 contagious disease",
    protectsUr: "گائے اور بھینس — سب سے زیادہ متعدی بیماری",
    doses: [
      { at: "Every 6 months", atUr: "ہر 6 ماہ", note: "Spring (Feb–Mar) & Autumn (Sep–Oct) campaigns", noteUr: "بہار (فروری–مارچ) اور خزاں (ستمبر–اکتوبر) مہم" },
      { at: "Calves 4+ months", atUr: "4 ماہ سے بڑے بچڑے", note: "First dose, then join the herd schedule", noteUr: "پہلا ٹیکہ، پھر گروہ کے شیڈول میں شامل" },
    ],
    warning: "FMD is notifiable — report outbreaks to the District Livestock Office. Vaccination is subsidized/often free in campaigns.",
    warningUr: "منہ کھر کی اطلاع لازمی ہے — ڈسٹرکٹ لائیوسٹاک آفس کو رپورٹ کریں۔ مہم میں ویکسین سبسڈی یا مفت ہوتی ہے۔",
  },
  {
    id: "hs_vax",
    emoji: "🩸",
    title: "Haemorrhagic Septicaemia (HS / گال گھنٹ)",
    titleUr: "گال گھنٹ (ایچ ایس)",
    protects: "Cattle & buffalo — high fever, swollen throat, sudden death",
    protectsUr: "گائے بھینس — تیز بخار، گلے کی سوجن، اچانک موت",
    doses: [
      { at: "Yearly (before monsoon)", atUr: "سالانہ (مون سون سے پہلے)", note: "May–June in Punjab/Sindh; consult local vet for timing", noteUr: "پنجاب/سندھ میں مئی–جون؛ وقت مقامی ویٹ سے پوچھیں" },
    ],
  },
  {
    id: "lsd_vax",
    emoji: "🔴",
    title: "Lumpy Skin Disease (LSD)",
    titleUr: "لمپی جلدی بیماری",
    protects: "Cattle — skin nodules, fever, milk drop",
    protectsUr: "گائے — جلد پر گانٹھیں، بخار، دودھ میں کمی",
    doses: [
      { at: "Yearly", atUr: "سالانہ", note: "Goat-pox vaccine is used for LSD control in Pakistan — vet administered", noteUr: "پاکستان میں LSD کے لیے بکری پوکس ویکسین استعمال ہوتی ہے — ویٹ لگاتا ہے" },
      { at: "Outbreak areas", atUr: "متاثرہ علاقوں", note: "Ring vaccination around infected villages", noteUr: "متاثرہ گاؤں کے گرد حلقہ وار ویکسینیشن" },
    ],
    warning: "Isolate animals with nodules immediately; the virus spreads via mosquitoes and shared needles.",
    warningUr: "گانٹھ والوں جانوروں کو فوری الگ کریں؛ وائرس مچھر اور مشترکہ سوئی سے پھیلتا ہے۔",
  },
  {
    id: "ppr_vax",
    emoji: "🐐",
    title: "PPR (Goat/Sheep Plague)",
    titleUr: "پی پی آر (بکری/بھیڑ کی پلیگ)",
    protects: "Goats & sheep — fever, mouth sores, pneumonia, high death rate",
    protectsUr: "بکریاں اور بھیڑیں — بخار، منہ کے چھالے، نمونیا",
    doses: [
      { at: "3+ months", atUr: "3 ماہ سے", note: "One dose yearly; lambs from 3 months of age", noteUr: "سالانہ ایک خوراک؛ 3 ماہ سے برے بھی" },
    ],
  },
  {
    id: "et_vax",
    emoji: "🌾",
    title: "Enterotoxemia (Overeating Disease)",
    titleUr: "انٹیرو ٹوکسیمیا (بکری کی اچانک موت)",
    protects: "Goats & sheep — sudden death after heavy feeding",
    protectsUr: "بکریاں اور بھیڑیں — زیادہ کھانے کے بعد اچانک موت",
    doses: [
      { at: "3+ months, then yearly", atUr: "3 ماہ، پھر سالانہ", note: "Especially before grain flushing or lush pasture season", noteUr: "خاص طور پر دانہ کھلانے یا سبز چارے کے موسم سے پہلے" },
    ],
  },
];

/* ── Pet vaccination (PetsDoc) ── */
export const PET_VACCINES: VaccineEntry[] = [
  {
    id: "rabies_vax",
    emoji: "🐕",
    title: "Rabies (Dogs & Cats)",
    titleUr: "ریبز (کتے اور بلییں)",
    protects: "Deadly virus — also protects your family (bites are fatal once symptoms start)",
    protectsUr: "جان لیوا وائرس — خاندان کا بھی تحفظ (علامات کے بعد بچنا مشکل)",
    doses: [
      { at: "12 weeks", atUr: "12 ہفتے", note: "First rabies shot", noteUr: "پہلا ریبز ٹیکہ" },
      { at: "1 year booster", atUr: "1 سال پر بوسٹر", note: "Then every 1–3 years per vaccine brand", noteUr: "پھر ہر 1-3 سال (برانڈ کے مطابق)" },
    ],
    warning: "Rabies is 100% fatal after symptoms. If bitten/scratched: wash wound with soap 15 minutes and reach a hospital the same day for vaccine.",
    warningUr: "ریبز علامات کے بعد 100٪ مہلک ہے۔ کاٹ یا نوچ لگے: صابن سے 15 منٹ دھو کر اسی دن ہسپتال جائیں۔",
  },
  {
    id: "dhppi",
    emoji: "💉",
    title: "DHPPi (Dogs — 5-in-1)",
    titleUr: "DHPPi (کتوں کی 5 بیماریوں کی ویکسین)",
    protects: "Distemper, Hepatitis, Parvovirus, Parainfluenza",
    protectsUr: "ڈسٹمپر، ہیپاٹائٹس، پیروو، پارائن فلو",
    doses: [
      { at: "6–8 weeks", atUr: "6–8 ہفتے", note: "DHPPi-1", noteUr: "پہلی خوراک" },
      { at: "9–11 weeks", atUr: "9–11 ہفتے", note: "DHPPi-2", noteUr: "دوسری خوراک" },
      { at: "12–16 weeks", atUr: "12–16 ہفتے", note: "DHPPi-3", noteUr: "تیسری خوراک" },
      { at: "Yearly booster", atUr: "سالانہ بوسٹر" },
    ],
    warning: "Until the full series is done: no walks on the street, no contact with unvaccinated dogs — parvo lives in soil for months.",
    warningUr: "مکمل ٹیکے تک: سڑک پر نہ گھمائیں، غیر ویکسینیٹد کتوں سے دور رکھیں — پیروو مٹی میں مہینوں زندہ رہتا ہے۔",
  },
  {
    id: "fever_parvo",
    emoji: "🦠",
    title: "Parvo & Distemper Watch-outs",
    titleUr: "پیروو اور ڈسٹمپر کی علامات",
    protects: "Early detection saves puppies",
    protectsUr: "جلد پکڑنا بچوں کی جان بچاتا ہے",
    doses: [
      { at: "Warning signs", atUr: "خطرے کی علامات", note: "Vomiting + bloody diarrhea + no appetite = Parvo emergency (vomit/diarrhea with blood)", noteUr: "قے + خونی اسہال + بھوک نہ لگنا = پیروو ایمرجنسی" },
      { at: "Distemper signs", atUr: "ڈسٹمپر کی علامات", note: "Fever, runny nose/eyes, twitching, paw pad hardening", noteUr: "بخار، ناک/آنکھ سے نالی، کانپنا، پنجے سخت" },
      { at: "Action", atUr: "کام", note: "Rush to a vet the same day — both diseases kill fast but are treatable early", noteUr: "اسی دن ویٹ کے پاس جائیں — دونوں بیماریاں جلدی جان لیتی ہیں مگر شروع میں علاج ممکن" },
    ],
  },
  {
    id: "fvrcp",
    emoji: "🐈",
    title: "FVRCP (Cats — 3-in-1)",
    titleUr: "FVRCP (بلیوں کی 3 بیماریوں کی ویکسین)",
    protects: "Feline viral rhinotracheitis, Calicivirus, Panleukopenia",
    protectsUr: "بلیوں کی ناک/آنکھ کی بیماریاں اور پینلوکوپینیا",
    doses: [
      { at: "8 weeks", atUr: "8 ہفتے", note: "FVRCP-1", noteUr: "پہلی خوراک" },
      { at: "12 weeks", atUr: "12 ہفتے", note: "FVRCP-2", noteUr: "دوسری خوراک" },
      { at: "16 weeks", atUr: "16 ہفتے", note: "FVRCP-3 + rabies", noteUr: "تیسری خوراک + ریبز" },
      { at: "Yearly booster", atUr: "سالانہ بوسٹر" },
    ],
  },
  {
    id: "deworm_schedule",
    emoji: "🪱",
    title: "Deworming (Dogs & Cats)",
    titleUr: "کانٹھیل کی دوا",
    protects: "Roundworm, tapeworm, hookworm — protects kids too (eggs spread via paws)",
    protectsUr: "پیٹ کے کیڑے — بچوں کا بھی تحفظ (انڈے پنجوں سے پھیلتے ہیں)",
    doses: [
      { at: "2–12 weeks", atUr: "2–12 ہفتے", note: "Every 2 weeks (puppies/kittens)", noteUr: "ہر 2 ہفتے (چھوٹے)" },
      { at: "3–6 months", atUr: "3–6 ماہ", note: "Monthly", noteUr: "ماہانہ" },
      { at: "Adult", atUr: "بالغ", note: "Every 3 months (indoor) to monthly (outdoor/hunters)", noteUr: "ہر 3 ماہ (گھر میں) تا ماہانہ (باہر)" },
    ],
  },
];

/** Which vaccine list belongs to which domain — strict isolation. */
export const DOMAIN_VACCINES: Partial<Record<string, VaccineEntry[]>> = {
  human: HUMAN_VACCINES,
  livestock: LIVESTOCK_VACCINES,
  pet: PET_VACCINES,
};
