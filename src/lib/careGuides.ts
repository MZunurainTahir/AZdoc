/**
 * AZdoc Care Guides — domain-specific first-aid & care playbooks.
 * Human → First Aid procedures; Pet → daily care; Plant → houseplant care.
 * Strictly isolated per domain — no cross-domain content.
 */

export interface GuideEntry {
  id: string;
  emoji: string;
  title: string;
  titleUr: string;
  steps: string[];
  stepsUr: string[];
  warning?: string;
  warningUr?: string;
}

/* ── Human First Aid (HealthDoc) ── */
export const FIRST_AID_GUIDE: GuideEntry[] = [
  {
    id: "bleeding",
    emoji: "🩸",
    title: "Bleeding / Cuts & Wounds",
    titleUr: "خون بہنا / کاٹ لگنا",
    steps: [
      "Wash hands and put on clean gloves if available.",
      "Press the wound firmly with a clean cloth or bandage for 10–15 minutes non-stop.",
      "Raise the injured part above heart level while pressing.",
      "Once bleeding stops, rinse with clean water and cover with a sterile dressing or band-aid.",
    ],
    stepsUr: [
      "ہاتھ دھویں؛ دستیاب ہوں تو صاف دستانے پہنیں۔",
      "زخم پر صاف کپڑا یا بانڈیج رکھ کر مسلسل 10 تا 15 منٹ دبائیں۔",
      "زخمی حصے کو دل کی سطح سے اوپر اٹھا کر رکھیں۔",
      "خون رکنے کے بعد صاف پانی سے دھو کر سٹرائل ڈریسنگ لگائیں۔",
    ],
    warning: "If blood soaks through, add another layer — never remove the first cloth. Deep cuts, gaping wounds or bleeding that won't stop after 15 minutes → go to ER / call 1122.",
    warningUr: "خون کپڑے سے گزر جائے تو پہلا کپڑا نہ ہٹائیں، اوپر نیا رکھیں۔ گہرے یا کھلے زخم یا 15 منٹ بعد بھی خون نہ رکے → ہسپتال جائیں / 1122 پر کال کریں۔",
  },
  {
    id: "burns",
    emoji: "🔥",
    title: "Burns & Scalds",
    titleUr: "جلن / آگ یا گرم پانی سے جھلسنا",
    steps: [
      "Immediately hold the burn under cool running water for 15–20 minutes.",
      "Remove rings/watches near the burn before swelling starts.",
      "Cover loosely with a clean plastic wrap or sterile non-stick dressing.",
      "Take paracetamol if there is pain.",
    ],
    stepsUr: [
      "جلنے والی جگہ کو فوراً ٹھنڈے بہتے پانی میں 15 تا 20 منٹ رکھیں۔",
      "سوجن سے پہلے انگوٹھی/گھڑی اتار دیں۔",
      "صاف پلاسٹک ریپ یا نان اسٹک ڈریسنگ سے ڈھیلے ڈھانپیں۔",
      "درد ہو تو پیراسیٹامول لیں۔",
    ],
    warning: "NEVER apply toothpaste, oil, butter, egg or turmeric on burns — they trap heat and cause infection. Large, deep, or face/hand/genital burns → hospital immediately.",
    warningUr: "جلن پر کبھی پست، تیل، مکھین، انڈا یا ہلدی نہ لگائیں — یہ گرمی قید کر کے انفیکشن پھیلاتے ہیں۔ بڑی، گہری یا چہرے/ہاتھ/نجی اعضا کی جلن → فوراً ہسپتال۔",
  },
  {
    id: "fracture",
    emoji: "🦴",
    title: "Sprain & Fracture",
    titleUr: "موچ / ہڈی ٹوٹنا",
    steps: [
      "Stop activity immediately — do not let the person walk on a injured leg.",
      "Apply ice wrapped in cloth for 15–20 minutes every 2–3 hours.",
      "Wrap a soft bandage (not too tight) and keep the limb raised.",
      "If the bone looks bent/deformed or pain is severe, immobilize with a splint and go to hospital.",
    ],
    stepsUr: [
      "فوری طور پر حرکت روک دیں — زخمی ٹانگ پر چلنے نہ دیں۔",
      "کپڑے میں لپیٹ کر برف 15 تا 20 منٹ لگائیں، ہر 2-3 گھنٹے میں۔",
      "نرم بانڈیج لپیٹیں (زیادہ سخت نہ) اور ہاتھ/پاؤں کو اونچا رکھیں۔",
      "ہڈی ٹیڑھی نظر آئے یا شدید درد ہو تو اسپلنٹ سے جکڑ کر ہسپتال لے جائیں۔",
    ],
    warning: "Never try to straighten a broken bone yourself. Do not give food/drink — surgery may be needed. Open fracture (bone visible) → cover with clean cloth, call 1122.",
    warningUr: "ٹیڑھی ہڈی خود کبھی سیدھی نہ کریں۔ کھانا پانی نہ دیں — آپریشن ممکن ہے۔ ہڈی باہر نظر آئے → صاف کپڑے سے ڈھانپ کر 1122 پر کال کریں۔",
  },
  {
    id: "choking",
    emoji: "😮‍💨",
    title: "Choking",
    titleUr: "کھانے یا کوئی چیز گلے میں پھنسنا",
    steps: [
      "Ask the person to cough strongly — do not slap the back yet.",
      "If they cannot speak/cough/breathe: bend them forward and give 5 firm back slaps between the shoulder blades.",
      "Give 5 abdominal thrusts (Heimlich): fist above navel, pull inward-up sharply.",
      "Repeat 5 slaps + 5 thrusts until the object comes out.",
    ],
    stepsUr: [
      "شخص سے زور سے کھانسی کروائیں — ابھی پیٹھ نہ پیٹیں۔",
      "بول/کھانسی/سانس نہ آئے: آگے جھکا کر کندھوں کے درمیان 5 زوردار پیٹھ پر ہاتھ پھیریں۔",
      "5 پیٹ کے دھکے (ہائم لخ): ناف سے اوپر مٹھی رکھ کر اندر-اوپر کھینچیں۔",
      "چیز نکلنے تک 5 ہاتھ + 5 دھکے دہرائیں۔",
    ],
    warning: "For infants under 1 year: 5 back slaps + 5 chest thrusts only — NEVER abdominal thrusts. If the person becomes unconscious → start CPR and call 1122.",
    warningUr: "ایک سال سے چھوٹے بچے: صرف 5 پیٹھ اور 5 سینے کے ہاتھ — پیٹ کے دھکے کبھی نہیں۔ بے ہوش ہو جائے → CPR شروع کریں اور 1122 پر کال کریں۔",
  },
  {
    id: "heatstroke_fa",
    emoji: "☀️",
    title: "Heatstroke (Lu Lagna)",
    titleUr: "لو لگنا",
    steps: [
      "Move the person to shade or a cool room immediately.",
      "Loosen tight clothing and lie them down with legs slightly raised.",
      "Sponge the whole body with cool water and fan continuously.",
      "If fully conscious, give small sips of ORS or cool water.",
    ],
    stepsUr: [
      "مریض کو فوراً سایہ یا ٹھنڈے کمرے میں لے جائیں۔",
      "کپڑے ڈھیلے کریں، لیٹا دیں، ٹانگیں تھوڑی اونچی رکھیں۔",
      "پورے جسم پر ٹھنڈا پانی پونچھیں اور مسلسل پنکھا چلائیں۔",
      "مکمل ہوش ہو تو او آر ایس یا ٹھنڈے پانی کے چھوٹے گھونٹ پلائیں۔",
    ],
    warning: "NEVER give aspirin or ibuprofen (brufen) in heatstroke. Unconscious, temperature above 104°F, or no improvement in 30 minutes → hospital / 1122 immediately.",
    warningUr: "لو میں اسپرین یا بروفن کبھی نہ دیں۔ بے ہوشی، درجہ حرارت 104 سے اوپر یا 30 منٹ میں بہتری نہ ہو → فوراً ہسپتال / 1122۔",
  },
  {
    id: "snakebite",
    emoji: "🐍",
    title: "Snake Bite",
    titleUr: "سانپ کا کاٹنا",
    steps: [
      "Move the person away from the snake and keep them completely still.",
      "Remove rings/bangles/shoes from the bitten limb before swelling.",
      "Keep the bitten limb at heart level (not raised, not hanging).",
      "Take a photo of the snake from a safe distance, if possible, for identification.",
    ],
    stepsUr: [
      "شخص کو سانپ سے دور لے جائیں اور مکمل ساکن رکھیں۔",
      "سوجن سے پہلے انگوٹھیاں/چوڑیاں/جوتے اتار دیں۔",
      "کٹے ہوئے حصے کو دل کی سطح پر رکھیں (نہ اونچا، نہ لٹکا ہوا)۔",
      "ممکن ہو تو دور سے سانپ کی تصویر لیں تاکہ پہچان ہو سکے۔",
    ],
    warning: "DO NOT cut the wound, suck out venom, apply a tight tourniquet, or give alcohol/painkillers. Carry the person to hospital IMMEDIATELY — antivenom within 1–2 hours saves life.",
    warningUr: "زخم نہ کاٹیں، زہر نہ چوسیں، کسنے والی پٹی نہ باندھیں، شراب/درد کی گولی نہ دیں۔ فوراً ہسپتال لے جائیں — 1-2 گھنٹے کے اندر اینٹی وینم جان بچاتا ہے۔",
  },
  {
    id: "poisoning",
    emoji: "☠️",
    title: "Poisoning / Accidental Ingestion",
    titleUr: "زہر کھا لینا",
    steps: [
      "Remove any remaining poison from the mouth.",
      "Identify the substance — keep the bottle/packet for the doctor.",
      "If awake and breathing: call the poison centre / doctor for advice before giving anything.",
      "For kerosene/petrol/acid ingestion: do NOT induce vomiting — go to hospital at once.",
    ],
    stepsUr: [
      "منہ میں بچا ہوا زہر نکال دیں۔",
      "شے کی شناخت کریں — ڈاکٹر کے لیے بوٹل/پیکٹ ساتھ رکھیں۔",
      "ہوش اور سانس ٹھیک ہو تو کچھ دینے سے پہلے ڈاکٹر سے رابطہ کریں۔",
      "مٹی کا تیل/تیزاب جیسے مادے: قے نہ کروائیں — فوراً ہسپتال۔",
    ],
    warning: "Never induce vomiting for corrosive poisons (acid, bleach, kerosene) — it burns twice. Unconscious patient: lie on side (recovery position) and call 1122.",
    warningUr: "تیزاب، بلیچ، مٹی کے تیل جیسے زہروں میں قے کروانا ممنوع — یہ دگنا جلاتا ہے۔ بے ہوش مریض کو پہلو پر لٹا کر 1122 پر کال کریں۔",
  },
  {
    id: "electric",
    emoji: "⚡",
    title: "Electric Shock",
    titleUr: "بجلی کا جھٹکا",
    steps: [
      "Switch off the power source FIRST — do not touch the victim while current flows.",
      "If power can't be cut, push the victim away with a dry wooden stick (non-conductor).",
      "Check breathing and pulse once safe.",
      "If not breathing normally: start CPR (30 chest compressions : 2 breaths) and continue till help arrives.",
    ],
    stepsUr: [
      "پہلے بجلی کا سوئچ بند کریں — کرنٹ چلتے ہوئے مریض کو نہ چھوئیں۔",
      "بجلی بند نہ ہو سکے تو خشک لکڑی کی چھڑی سے الگ کریں۔",
      "محفوظ ہو جانے کے بعد سانس اور نبض چیک کریں۔",
      "سانس باقاعدہ نہ ہو: CPR شروع کریں (30 سینے کے دھکے : 2 سانس) اور مدد آنے تک جاری رکھیں۔",
    ],
    warning: "Even after a mild shock, a hospital ECG check is advised — heart rhythm can be disturbed hours later. Burns at entry/exit points need dressing.",
    warningUr: "ہلکے جھٹکے کے بعد بھی ECG کرانا ضروری ہے — دل کی رفتار گھنٹوں بعد بگڑ سکتی ہے۔ آمد و رفت کے داغوں پر ڈریسنگ لگائیں۔",
  },
];

/* ── Pet Care (PetsDoc) ── */
export const PET_CARE_GUIDE: GuideEntry[] = [
  {
    id: "grooming",
    emoji: "🛁",
    title: "Bathing & Grooming",
    titleUr: "نہلانا اور صفائی",
    steps: [
      "Bathe dogs every 2–4 weeks (cats clean themselves — bathe only when dirty).",
      "Use lukewarm water and pet shampoo only — human shampoo dries their skin.",
      "Brush short coats weekly, long coats daily to prevent mats.",
      "Dry ears with cotton after bath; never insert cotton buds deep.",
    ],
    stepsUr: [
      "کتے کو 2-4 ہفتے میں ایک بار نہلائیں (بلی خود صاف کرتی ہے)۔",
      "نیم گرم پانی اور صرف پالتو جانوروں کا شیمپو استعمال کریں۔",
      "چھوٹے بال ہفتہ وار، لمبے بال روزانہ کنگھی کریں۔",
      "نہلانے کے بعد کان کاٹن سے خشک کریں؛ اندر گہرائی تک کچھ نہ ڈالیں۔",
    ],
  },
  {
    id: "feeding",
    emoji: "🍖",
    title: "Feeding & Poison Foods",
    titleUr: "خوراک اور خطرناک چیزیں",
    steps: [
      "Feed adult dogs 2 measured meals/day; always keep fresh water available.",
      "Cats need taurine-rich cat food — never dog food long-term.",
      "Puppies (8+ weeks): 3–4 small meals/day of soaked puppy kibble.",
      "Treats < 10% of daily calories to avoid obesity.",
    ],
    stepsUr: [
      "بڑے کتے کو دن میں 2 بار پورشن کے حساب سے کھلائیں؛ پانی ہمیشہ رکھیں۔",
      "بلیوں کو بلی والا کھانا دیں — کتے کا کھانا مستقل نہ دیں۔",
      "چھوٹے کتوں (8 ہفتے+) کو دن میں 3-4 بار بھگوایا ہوا خوراک دیں۔",
      "ٹریٹس کل کیلوریز کا 10٪ سے کم رکھیں۔",
    ],
    warning: "NEVER feed chocolate, onions/garlic, grapes/raisins, xylitol (sugar-free gum), alcohol, or cooked bones — all are poisonous to pets.",
    warningUr: "چاکلیٹ، پیاز/لہسن، انگور/کشمش، ژائلٹول والی چیزیں، شراب یا پکے ہڈی کبھی نہ دیں — یہ سب پالتو جانوروں کے لیے زہر ہیں۔",
  },
  {
    id: "summer_heat",
    emoji: "🌡️",
    title: "Summer Heat Safety",
    titleUr: "گرمیوں میں حفاظت",
    steps: [
      "Walk dogs early morning / after sunset — hot tarmac burns paw pads.",
      "Provide shade and fresh water at all times; add ice cubes on extreme days.",
      "Never leave a pet in a parked car — even 10 minutes can kill.",
      "Signs of heatstroke: heavy panting, drooling, weakness → wet the body and fan, then rush to a vet.",
    ],
    stepsUr: [
      "کتوں کو صبح جلدی / شام کے بعد گھمائیں — گرم سڑک پنجوں کو جلاتی ہے۔",
      "سایہ اور تازہ پانی ہر وقت رکھیں؛ شدید گرمی میں برف کے ٹکڑے ڈالیں۔",
      "پالتو جانور کو گاڑی میں بند کبھی نہ چھوڑیں — 10 منٹ بھی جان لے سکتے ہیں۔",
      "لو کی علامات: سانس پھولنا، رال، کمزوری → جسم گیلا کر کے پنکھا کریں اور ویٹ کے پاس لے جائیں۔",
    ],
  },
  {
    id: "vaccination_care",
    emoji: "💉",
    title: "Vaccination & Deworming",
    titleUr: "ویکسین اور کیڑوں کی دوا",
    steps: [
      "Dogs: rabies at 12 weeks, then yearly; DHPPi 3 shots as a puppy then yearly boosters.",
      "Cats: FVRCP series as kitten, rabies yearly.",
      "Deworm every 3 months (puppies monthly till 6 months).",
      "Keep a written record of each shot — vets and boarding require it.",
    ],
    stepsUr: [
      "کتے: 12 ہفتے پر ریبز، پھر سالانہ؛ DHPPi بچپن میں 3، پھر سالانہ۔",
      "بلییں: بچپن میں FVRCP سیریز، ریبز سالانہ۔",
      "ہر 3 ماہ بعد کیڑوں کی دوا (چھوٹے کتوں کو 6 ماہ تک مہینہ وار)۔",
      "ہر ٹیکے کی تحریری ریکارڈ رکھیں — ویٹ اور بورڈنگ کے لیے ضروری۔",
    ],
  },
  {
    id: "litter",
    emoji: "🐾",
    title: "Litter & Hygiene",
    titleUr: "لیٹر اور صفائی",
    steps: [
      "Scoop the litter box daily; replace litter weekly and wash the box.",
      "One litter box per cat + one extra; place away from food bowls.",
      "Wash food/water bowls daily — biofilm causes stomach upset.",
      "Wash bedding weekly on hot cycle to kill fleas and mites.",
    ],
    stepsUr: [
      "لیٹر باکس روز صاف کریں؛ ہفتہ وار لیٹر بدل کر باکس دھوئیں۔",
      "ہر بلی کے لیے ایک باکس + ایک اضافی؛ کھانے سے دور رکھیں۔",
      "خوراک/پانی کے برتن روز دھوئیں — جراثیم پیٹ خراب کرتے ہیں۔",
      "بستر ہفتہ وار گرم پانی میں دھوئیں تاکہ پسو اور جھونپڑ مر جائیں۔",
    ],
  },
];

/* ── Plant Care (PlantDoc) ── */
export const PLANT_CARE_GUIDE: GuideEntry[] = [
  {
    id: "watering",
    emoji: "💧",
    title: "Watering Rules",
    titleUr: "پانی دینے کے اصول",
    steps: [
      "Finger-test 2cm deep: water only when the topsoil feels dry.",
      "Water deeply until it drains out of the bottom — then empty the saucer.",
      "Morning watering is best; wet leaves overnight invite fungus.",
      "Reduce watering in winter — most indoor plants rest then.",
    ],
    stepsUr: [
      "2 انچ گہرائی انگلی سے چیک کریں: اوپر کی مٹی خشک ہو تب ہی پانی دیں۔",
      "اس قدر پانی دیں کہ نیچے سے نکل جائے — پھر ساس کا پانی خالی کریں۔",
      "صبح پانی دیں؛ رات کو گیلے پتے فنگس بلاتے ہیں۔",
      "سردیوں میں پانی کم کریں — زیادہ تر پودے اس موسم میں آرام کرتے ہیں۔",
    ],
  },
  {
    id: "light",
    emoji: "☀️",
    title: "Light Requirements",
    titleUr: "روشنی کی ضرورت",
    steps: [
      "Bright indirect light suits most tropical indoor plants.",
      "South/west windows = strong light; move plants 1–2 feet back.",
      "Leggy, leaning growth means the plant needs more light.",
      "Rotate the pot a quarter-turn weekly for even growth.",
    ],
    stepsUr: [
      "زیادہ تر گھریلو پودوں کو روشن لیکن بالواسطہ روشنی چاہیے۔",
      "جنوب/مغربی کھڑکیاں = تیز روشنی؛ پودے 1-2 فٹ پیچھے رکھیں۔",
      "لمبے ٹیڑھے پودے کا مطلب ہے روشنی کم ہے۔",
      "ہفتہ وار گمل کو چوتھائی گھمائیں تاکہ برابر نشوونما ہو۔",
    ],
  },
  {
    id: "repotting",
    emoji: "🪴",
    title: "Repotting & Soil",
    titleUr: "ری پوٹنگ اور مٹی",
    steps: [
      "Repot when roots circle the drainage hole or soil dries within a day.",
      "Choose a pot only 2–3cm larger — too big soil stays wet and rots roots.",
      "Use well-draining mix: garden soil + compost + sand/perlite.",
      "Water lightly after repotting and keep in shade for a week.",
    ],
    stepsUr: [
      "جڑیں نکاسی کے سوراخ میں گھومنے لگیں یا مٹی ایک دن میں خشک ہو جائے تو ری پوٹ کریں۔",
      "گمل صرف 2-3 سینٹی میٹر بڑا لیں — زیادہ بڑا گمل مٹی گیلی رکھ کر جڑیں گلاتا ہے۔",
      "نکاسی والی مٹی: باغ کی مٹی + کھاد + ریت/پرلائٹ۔",
      "ری پوٹ کے بعد ہلکا پانی دیں اور ایک ہفتے سایہ میں رکھیں۔",
    ],
  },
  {
    id: "fertilizing",
    emoji: "🌱",
    title: "Fertilizing Schedule",
    titleUr: "کھاد کا شیڈول",
    steps: [
      "Feed only in the growing season (spring–early autumn).",
      "Dilute liquid fertilizer to half-strength — every 2 weeks is enough.",
      "Never fertilize a dry, stressed or newly repotted plant.",
      "Flush the soil with plain water monthly to remove salt buildup.",
    ],
    stepsUr: [
      "کھاد صرف نشوونما کے موسم میں (بہار – ابتدائی خزاں) دیں۔",
      "مایع کھاد آدھی مقدار میں پانی ملائیں — 2 ہفتے بعد کافی ہے۔",
      "خشک، تناؤ یا نئے ری پوٹ شدہ پودے کو کھاد نہ دیں۔",
      "ہر ماہ صاف پانی سے مٹی دھوئیں تاکہ نمک جمع نہ ہو۔",
    ],
  },
  {
    id: "pests_prevent",
    emoji: "🐛",
    title: "Pest Prevention",
    titleUr: "کیڑوں سے بچاؤ",
    steps: [
      "Inspect new plants for 2 weeks in isolation before placing near others.",
      "Wipe leaves monthly — dust blocks light and hides early pests.",
      "Yellow sticky traps catch fungus gnats and whiteflies early.",
      "First line of defence: neem oil spray (5ml/L) weekly.",
    ],
    stepsUr: [
      "نئے پودوں کو 2 ہفتے الگ رکھ کر معائنہ کریں۔",
      "ماہانہ پتے صاف کریں — مٹی روشنی روکتی اور کیڑے چھپاتی ہے۔",
      "پیلا جال پھپھوندی مکھی اور سفید مکھی جلد پکڑتا ہے۔",
      "پہلی دفاعی لکیر: نیم آئل اسپرے (5مل/لیٹر) ہفتہ وار۔",
    ],
  },
  {
    id: "pruning",
    emoji: "✂️",
    title: "Pruning & Cleaning",
    titleUr: "کاٹ چھانٹ اور صفائی",
    steps: [
      "Remove yellow/dead leaves at the stem base with clean scissors.",
      "Sterilize cutting tools with rubbing alcohol between plants.",
      "Pinch growing tips of herbs (mint, basil) to make them bushy.",
      "Prune leggy stems just above a leaf node to encourage branching.",
    ],
    stepsUr: [
      "پیلے/مردہ پتے تنے سے صاف قینچی سے کاٹیں۔",
      "کاٹنے والا اوزار ہر پودے کے بعد الکحل سے صاف کریں۔",
      "جڑی بوٹیوں (پودینہ، تلسی) کی نوک توڑیں تا کہ گھنی ہو جائیں۔",
      "لمبی ڈالیوں کو پتہ والے جوڑ سے اوپر کاٹیں تا کہ شاخیں نکلیں۔",
    ],
  },
];

/** Which guide list belongs to which domain — strict isolation. */
export const DOMAIN_GUIDES: Partial<Record<string, GuideEntry[]>> = {
  human: FIRST_AID_GUIDE,
  pet: PET_CARE_GUIDE,
  plant: PLANT_CARE_GUIDE,
};
