/**
 * Client-Side RAG (Retrieval-Augmented Generation) Engine.
 * Enables instant (< 10ms) responses with verified local remedies and advice.
 */
import { REMEDY_DATABASE } from "./remedyData";

export function generateClientRAGAnswer(userQuery: string, lang: "en" | "ur" = "en", domain: string = "crop"): string {
  const q = userQuery.toLowerCase();
  const isUr = lang === "ur" || /[\u0600-\u06FF]/.test(userQuery);

  // Domain gates — STRICT ISOLATION: each playbook only runs for its own domain.
  const isCrop = domain === "crop";
  const isLivestock = domain === "livestock";
  const isHuman = domain === "human";
  const isPet = domain === "pet";
  const isPlant = domain === "plant";

  /** Standard remedy-database answer formatter (bilingual). */
  const entryAnswer = (emoji: string, key: string): string | null => {
    const item = REMEDY_DATABASE[key];
    if (!item) return null;
    return isUr
      ? `${emoji} **${item.nameUrdu} — مکمل رہنمائی** ${emoji}\n\n` +
        `📝 **علامات:** ${item.symptomsUrdu.join("، ")}\n\n` +
        `🌿 **گھریلو / قدرتی علاج:** ${item.organicUrdu}\n\n` +
        `🧪 **ادویات:** ${item.chemicalUrdu}\n\n` +
        `💊 **خوراک:** ${item.dosageUrdu}\n\n` +
        `🛍️ **مقامی مصنوعات:** ${item.localProducts.join("، ")}\n\n` +
        `🛡️ **احتیاط:** ${item.preventionUrdu}`
      : `${emoji} **${item.name} — Complete Guidance** ${emoji}\n\n` +
        `📝 **Symptoms:** ${item.symptoms.join("; ")}\n\n` +
        `🌿 **Home / Organic care:** ${item.organic}\n\n` +
        `🧪 **Medicines:** ${item.chemical}\n\n` +
        `💊 **Dosage:** ${item.dosage}\n\n` +
        `🛍️ **Local products:** ${item.localProducts.join(", ")}\n\n` +
        `🛡️ **Prevention:** ${item.prevention}`;
  };

  /* ══════════ HUMAN HEALTH (HealthDoc) — never mentions other domains ══════════ */
  if (isHuman) {
    if (q.includes("dengue") || q.includes("ڈینگی")) return entryAnswer("🦟", "Human___Dengue") ?? humanFallback(isUr);
    if (q.includes("heatstroke") || q.includes("heat stroke") || q.includes("heat exhaustion") || q.includes("لو لگ") || q.includes("گرمی سے بے حال")) return entryAnswer("🥵", "Human___Heatstroke") ?? humanFallback(isUr);
    if (q.includes("diarrhea") || q.includes("diarrhoea") || q.includes("اسہال") || q.includes("دست") || q.includes("ors") || q.includes("او آر ایس") || q.includes("food poison") || q.includes("فوڈ پوائزن")) return entryAnswer("🤢", "Human___Diarrhea") ?? humanFallback(isUr);
    if (q.includes("eczema") || q.includes("ایکزیما") || q.includes(" خشکی")) return entryAnswer("🧴", "Human___Eczema") ?? humanFallback(isUr);
    if (q.includes("skin") || q.includes("ringworm") || q.includes("داد") || q.includes("فنگس") || q.includes("fungal") || q.includes("athlete's foot") || q.includes("itchy rash")) return entryAnswer("🧴", "Human___Skin_Fungal") ?? humanFallback(isUr);
    if (q.includes("eye") || q.includes("آنکھ") || q.includes("conjunctiv")) return entryAnswer("👁️", "Human___Eye_Conjunctivitis") ?? humanFallback(isUr);
    if (q.includes("throat") || q.includes("گلا") || q.includes("tonsill")) return entryAnswer("🗣️", "Human___Throat_Tonsillitis") ?? humanFallback(isUr);
    if (q.includes("acidity") || q.includes("gas") || q.includes("دل کی جلن") || q.includes("تیزابیت") || q.includes("ہاضمہ") || q.includes("indigestion") || q.includes("heartburn")) return entryAnswer("🔥", "Human___Acidity_Gas") ?? humanFallback(isUr);
    if (q.includes("bp") || q.includes("blood pressure") || q.includes("بلڈ پریشر") || q.includes("hypertension") || q.includes("ضغط الدم")) return entryAnswer("🩺", "Human___Hypertension") ?? humanFallback(isUr);
    if (q.includes("joint") || q.includes("جوڑوں") || q.includes("گھٹن") || q.includes("کمر درد") || q.includes("back pain") || q.includes("knee pain")) return entryAnswer("🦴", "Human___Joint_Pain") ?? humanFallback(isUr);
    if (q.includes("anemia") || q.includes("anaemia") || q.includes("خون کی کمی")) return entryAnswer("🩸", "Human___Anemia") ?? humanFallback(isUr);
    if (q.includes("first aid") || q.includes("first-aid") || q.includes("firstaid") || q.includes("ابتدائی امداد") || q.includes("ابتدائی طبی")) {
      return isUr
        ? `🩹 **ابتدائی طبی امداد — فوری اقدامات** 🩹\n\n` +
          `اپنے Hub میں **First Aid** گائیڈ میں یہ موضوعات قدم بہ قدم موجود ہیں:\n\n` +
          `🩸 خون بہنا · 🔥 جلن · 🦴 موچ/ہڈی · 😮‍💨 گلے میں پھنسنا · ☀️ لو لگنا · 🐍 سانپ کاٹنا · ☠️ زہر · ⚡ بجلی کا جھٹکا\n\n` +
          `ہر موضوع کے تفصیلی اقدامات کے لیے Hub کا **First Aid** ٹیب کھولیں۔ سانس کی تکلیف، بے ہوشی یا شدید خون میں فوری **1122** پر کال کریں۔`
        : `🩹 **First Aid — Quick Actions** 🩹\n\n` +
          `Step-by-step procedures live in the **First Aid** guide inside your Hub:\n\n` +
          `🩸 Bleeding · 🔥 Burns · 🦴 Sprains/Fractures · 😮‍💨 Choking · ☀️ Heatstroke · 🐍 Snake bite · ☠️ Poisoning · ⚡ Electric shock\n\n` +
          `Open the **First Aid** tab in your Hub for full details. For breathing trouble, unconsciousness or severe bleeding call **1122** now.`;
    }
    if (q.includes("vaccin") || q.includes("ویکسین") || q.includes("ٹیکہ") || q.includes("ٹیٹنس") || q.includes("tetanus") || q.includes("ٹی ڈی")) {
      return isUr
        ? `💉 **انسانی ویکسینیشن شیڈول (پاکستان ای پی آئی)** 💉\n\n` +
          `👶 پیدائش: بی سی جی + پولیو\n` +
          `🛡️ 6/10/14 ہفتے: پینٹا ویلنٹ + پولیو + نمونیا\n` +
          `🌡️ 9 ماہ: خسرہ + وٹامن اے\n` +
          `🔩 ہر 10 سال: ٹیٹنس بوسٹر (کچے زخم پر 24 گھنٹے میں)\n` +
          `🤧 سالانہ: فلو ٹیکہ (بوڑھے، ذیابیطس، دمہ مریض)\n\n` +
          `مکمل شیڈول کے لیے Hub میں **Vaccines** ٹیب دیکھیں — یہ سب سرکاری ہسپتالوں میں مفت ہے۔`
        : `💉 **Human Vaccination Schedule (Pakistan EPI)** 💉\n\n` +
          `👶 Birth: BCG + Polio\n` +
          `🛡️ 6/10/14 weeks: Pentavalent + Polio + Pneumococcal\n` +
          `🌡️ 9 months: Measles + Vitamin A\n` +
          `🔩 Every 10 years: Tetanus booster (within 24h of dirty wounds)\n` +
          `🤧 Yearly: Flu shot (elderly, diabetics, asthma patients)\n\n` +
          `See the **Vaccines** tab in your Hub for the full schedule — all free at government hospitals.`;
    }
    if (q.includes("fever") || q.includes("بخار") || q.includes("flu") || q.includes("نزلا") || q.includes("زکام") || q.includes("cough") || q.includes("کھانسی") || q.includes("headache") || q.includes("سر درد") || q.includes("body ache") || q.includes("bodypain") || q.includes("pain in body")) {
      return entryAnswer("🤒", "Human___Fever_Flu") ?? humanFallback(isUr);
    }
    return humanFallback(isUr);
  }

  /* ══════════ PETS (PetsDoc) ══════════ */
  if (isPet) {
    if (q.includes("tick") || q.includes("flea") || q.includes("چیچر") || q.includes("پسو")) return entryAnswer("🕷️", "Pet___Ticks_Fleas") ?? petFallback(isUr);
    if (q.includes("vomit") || q.includes("قے") || q.includes("diarrhea") || q.includes("diarrhoea") || q.includes("اسہال") || q.includes("parvo") || q.includes("پیروو") || q.includes("dysentery")) return entryAnswer("🤮", "Pet___Vomiting_Diarrhea") ?? petFallback(isUr);
    if (q.includes("mange") || q.includes("خارش") || q.includes("itch") || q.includes("scratch") || q.includes("hair loss") || q.includes("بال جھڑ") || q.includes("ear infection") || q.includes("کان کی بدبو")) {
      const m = q.includes("ear") || q.includes("کان") ? entryAnswer("👂", "Pet___Ear_Infection") : entryAnswer("🐕", q.includes("mange") ? "Pet___Mange" : "Pet___Itching_Allergy");
      return m ?? petFallback(isUr);
    }
    if (q.includes("rabies") || q.includes("ریبز") || q.includes("vaccin") || q.includes("ویکسین") || q.includes("deworm") || q.includes("کانٹھیل") || q.includes("کیروں") || q.includes("کیرے") || q.includes("parvo vaccine")) {
      return isUr
        ? `💉 **پالتو جانوروں کی ویکسین اور کیڑوں کی دوا** 💉\n\n` +
          `🐕 کتے: 12 ہفتے پر ریبز پھر سالانہ؛ DHPPi بچپن میں 3 خوراکیں، پھر سالانہ بوسٹر\n` +
          `🐈 بلییں: بچپن میں FVRCP سیریز + سالانہ ریبز\n` +
          `🪱 کیڑوں کی دوا: بالغ 3 ماہ بعد، بچے ماہانہ (6 ماہ تک)\n\n` +
          `مکمل شیڈول اور ریبز کے بعد کئے جانے والے اقدامات کے لیے Hub کا **Vaccines** ٹیب دیکھیں۔ ٹیکے لگوانے کے لیے Doctors ٹیب سے پیٹ ویٹ بک کریں۔`
        : `💉 **Pet Vaccination & Deworming** 💉\n\n` +
          `🐕 Dogs: rabies at 12 weeks then yearly; DHPPi ×3 as puppy, yearly booster\n` +
          `🐈 Cats: FVRCP series as kitten + yearly rabies\n` +
          `🪱 Deworming: every 3 months (adults), monthly (puppies till 6 months)\n\n` +
          `See the **Vaccines** tab in your Hub for the full schedule, and book a Pet Vet in the Doctors tab for shots.`;
    }
    if (q.includes("food") || q.includes("chocolate") || q.includes("خوراک") || q.includes("کھانا") || q.includes("feed") || q.includes("poison") || q.includes("onion")) {
      return isUr
        ? `🍖 **پالتو جانوروں کے لیے خطرناک خوراک** 🍖\n\n` +
          `یہ چیزیں زہر کے برابر ہیں:\n` +
          `🍫 چاکلیٹ · 🧅 پیاز/لہسن · 🍇 انگور/کشمش · 🍬 ژائلٹول والی چیزیں · 🦴 پکی ہوئی ہڈیاں · 🥛 زیادہ دودھ (بڑے کتوں میں)\n\n` +
          `غلطی سے کھا لے تو فوراً ویٹ سے رابطہ کریں — بغیر مشورے قے نہ کروائیں۔`
        : `🍖 **Foods Poisonous to Pets** 🍖\n\n` +
          `These are toxic to cats and dogs:\n` +
          `🍫 Chocolate · 🧅 Onions/Garlic · 🍇 Grapes/Raisins · 🍬 Xylitol products · 🦴 Cooked bones\n\n` +
          `If eaten by mistake, contact a vet immediately — do not induce vomiting without advice.`;
    }
    return petFallback(isUr);
  }

  /* ══════════ PLANTS (PlantDoc) ══════════ */
  if (isPlant) {
    if (q.includes("root rot") || q.includes("جڑ سڑن") || q.includes("overwater") || q.includes("over-water") || q.includes("زیادہ پانی") || q.includes("soggy") || q.includes("گیلی مٹی")) return entryAnswer("🫚", "Plant___Root_Rot") ?? plantFallback(isUr);
    if (q.includes("mildew") || q.includes("سفید پھپھوندی") || q.includes("powdery") || q.includes("چاندی جیسی")) return entryAnswer("🌫️", "Plant___Powdery_Mildew") ?? plantFallback(isUr);
    if (q.includes("mealybug") || q.includes("ملی") || q.includes("scale insect") || q.includes("سفید روئی") || q.includes("woolly")) return entryAnswer("🐜", "Plant___Mealybug") ?? plantFallback(isUr);
    if (q.includes("aphid") || q.includes("مہنگ") || q.includes("whitefly") || q.includes("جھنڈ")) return entryAnswer("🐛", "Plant___Aphids") ?? plantFallback(isUr);
    if (q.includes("leaf spot") || q.includes("دھبے") || q.includes("داغ") || q.includes("spot") || q.includes("blight") || q.includes("جھلساؤ") || q.includes("black spot")) return entryAnswer("🍂", "Plant___Leaf_Spot") ?? plantFallback(isUr);
    if (q.includes("yellow") || q.includes("پیلے") || q.includes("پیلا")) return entryAnswer("🟡", "Plant___Yellowing_Leaves") ?? plantFallback(isUr);
    if (q.includes("water") || q.includes("پانی") || q.includes("watering") || q.includes("آبپاشی")) {
      return isUr
        ? `💧 **پودوں کو پانی دینے کے سنہری اصول** 💧\n\n` +
          `1. 2 انچ مٹی انگلی سے چیک کریں — خشک ہو تب ہی پانی دیں۔\n` +
          `2. اتنا پانی دیں کہ نیچے سے نکل جائے، پھر ساس کا پانی خالی کریں۔\n` +
          `3. صبح پانی دیں؛ رات کو گیلے پتے فنگس بلاتے ہیں۔\n` +
          `4. سردیوں میں پانی آدھا کر دیں۔\n\n` +
          `مزید تدابیر کے لیے Hub میں **Plant Care** ٹیب دیکھیں۔`
        : `💧 **Golden Watering Rules** 💧\n\n` +
          `1. Finger-test 2cm deep — water only when the topsoil is dry.\n` +
          `2. Water until it drains from the bottom, then empty the saucer.\n` +
          `3. Water in the morning; overnight wet leaves invite fungus.\n` +
          `4. Halve watering in winter.\n\n` +
          `See the **Plant Care** tab in your Hub for more tips.`;
    }
    if (q.includes("neem") || q.includes("نیم") || q.includes("spray") || q.includes("اسپرے") || q.includes("pest") || q.includes("کیڑ")) {
      return isUr
        ? `🌿 **نیم آئل اسپرے — قدرتی کیڑے مار** 🌿\n\n` +
          `1. نیم کا تیل 5 ملی + صاف پانی 1 لیٹر + صابن ایک قطرہ۔\n` +
          `2. شام کو چھڑکیں تاکہ پتے نہ جھلسیں۔\n` +
          `3. ہفتے وار دہرائیں — تقریباً 3 ہفتے میں مکمل کنٹرول۔\n\n` +
          `شدید حملے پر Hub کی **Disease Library** میں مہنگ، ملی بگ اور جڑ سڑن کا مکمل علاج دیکھیں۔`
        : `🌿 **Neem Oil Spray — Organic Pest Control** 🌿\n\n` +
          `1. Neem oil 5ml + 1L clean water + one drop of soap.\n` +
          `2. Spray in the evening to avoid leaf burn.\n` +
          `3. Repeat weekly — full control in ~3 weeks.\n\n` +
          `For heavy attacks see aphid/mealybug entries in the Hub **Disease Library**.`;
    }
    return plantFallback(isUr);
  }

  /* ══════════ CROPS + LIVESTOCK (FasalDoc) ══════════ */
  if (isCrop || isLivestock) {
  // 1. Wet crops / Waterlogging / Flooding
  if (q.includes("wet") || q.includes("water") || q.includes("flood") || q.includes("rain") || q.includes("پانی") || q.includes("گیلا") || q.includes("بارش")) {
    if (q.includes("wheat") || q.includes("گندم")) {
      return isUr
        ? `🌾 **گندم کی فصل میں کھڑا پانی اور پیلا پن — RAG ماہرانہ حل** 🌾\n\n` +
          `📌 **مسئلہ:** گندم کے کھیت میں پانی کھڑا رہنے سے جڑوں کو آکسیجن نہیں ملتی جس سے نائٹروجن کی کمی (پیلا پن) اور روٹ روٹ کا خطرہ ہوتا ہے۔\n\n` +
          `🌿 **قدرتی / دیسی علاج:**\n` +
          `1. کھیت سے نالیاں بنا کر پانی فوری طور پر باہر نکالیں۔\n` +
          `2. زمین خشک ہونے پر 2٪ کھٹی لسی کے محلول کا اسپرے جڑوں کی بحالی کے لیے کریں۔\n` +
          `3. لکڑی کی راکھ کے پانی کا چھڑکاؤ کریں۔\n\n` +
          `🧪 **کیمیائی علاج و غذائی سپلیمنٹ:**\n` +
          `1. **یوریا + زنک سلفیٹ:** وتر آنے پر یوریا (15-20 کلوگرام) میں زنک سلفیٹ 33٪ (3 کلوگرام) ملا کر چھٹا دیں۔\n` +
          `2. **فولیر اسپرے (NPK 19:19:19):** 500 گرام فی 100 لیٹر پانی فی ایکڑ اسپرے کریں تاکہ پتے فوراً غذا حاصل کریں۔\n` +
          `3. **کنگی (Rust) سے بچاؤ:** نمی کی وجہ سے Tilt 250 EC (200 ملی لیٹر/ایکڑ) کا حفاظتی اسپرے کریں۔\n\n` +
          `🛍️ **مقامی پروڈکٹس:** Tilt 250 EC (Syngenta), Zincol (FMC), Engro Urea.\n\n` +
          `💡 *تصویر کے ذریعے مزید درست معائنہ کے لیے **Scan** ٹیب کا استعمال کریں۔*`
        : `🌾 **Wheat Crop Waterlogging & Wet Field Recovery Advisory** 🌾\n\n` +
          `📌 **Diagnosis:** Standing water in wheat fields causes root oxygen starvation, resulting in yellowing (nitrogen leaching) and fungal root decay.\n\n` +
          `🌿 **Organic & Immediate Steps:**\n` +
          `1. **Drain Water:** Create immediate drainage channels to flush excess water out of the field.\n` +
          `2. **Root Booster:** Spray 2% fermented sour buttermilk / whey once field dries to stimulate beneficial soil microbes.\n` +
          `3. **Ash Application:** Spread dry wood ash to absorb excess moisture and add potash.\n\n` +
          `🧪 **Chemical Treatment & Fertilizer Rescue:**\n` +
          `1. **Top-Dress Nitrogen + Zinc:** Once field is workable (vattar condition), top-dress 15-20 kg Urea + 3 kg Zinc Sulphate (33%) per acre.\n` +
          `2. **Foliar NPK Spray:** Apply Soluble NPK (19:19:19) @ 500g in 100L water per acre for fast leaf absorption.\n` +
          `3. **Rust Prevention:** High moisture induces Wheat Rust — spray Propiconazole (Tilt 250 EC) @ 200ml/acre.\n\n` +
          `🛍️ **Local Recommended Products:** Tilt 250 EC (Syngenta), Zincol (FMC), SoluPotasse (TES), Sona Urea.\n\n` +
          `💡 *For visual diagnosis of leaf spots, snap a photo in the **Scan** tab!*`;
    }
    return isUr
      ? `🌧️ **فصل میں پانی کے کھڑا ہونے اور نماء کی خرابی کا حل** 🌧️\n\n` +
        `1. کھیت سے پانی کا فوری اخراج یقینی بنائیں۔\n` +
        `2. وتر آنے پر NPK (19:19:19) 500 گرام فی ایکڑ کا پتوں پر اسپرے کریں۔\n` +
        `3. نائٹروجن کی کمی دور کرنے کے لیے یوریا کھاد ہلکی مقدار میں دیں۔\n` +
        `4. فنگس اور گل سڑاؤ کے بچاؤ کے لیے کاپر آکسی کلورائیڈ کا اسپرے کریں۔`
      : `🌧️ **Wet Field & Crop Waterlogging Management** 🌧️\n\n` +
        `1. **Drainage:** Immediately remove excess water using drainage cuts.\n` +
        `2. **Foliar Spray:** Apply Soluble NPK (19:19:19) @ 500g/100L water to bypass damaged roots.\n` +
        `3. **Nitrogen Boost:** Top-dress light dose of Urea once soil becomes firm.\n` +
        `4. **Fungicide Protection:** Apply Copper Oxychloride (500g/acre) to stop root rot.`;
  }

  // 2. Wheat Rust
  if (q.includes("wheat") || q.includes("گندم")) {
    const item = REMEDY_DATABASE["Wheat___Leaf_rust"];
    return isUr
      ? `🌾 **گندم کی بیماری (کنگی / rust) کا مکمل علاج** 🌾\n\n` +
        `📝 **علامات:** ${item.symptomsUrdu.join("، ")}\n\n` +
        `🌿 **دیسی / قدرتی علاج:** ${item.organicUrdu}\n\n` +
        `🧪 **کیمیائی علاج:** ${item.chemicalUrdu}\n\n` +
        `💊 **خوراک (Dosage):** ${item.dosageUrdu}\n\n` +
        `🛍️ **پاکستان کے معیاری برانڈز:** ${item.localProducts.join(", ")}\n\n` +
        `🛡️ **حفاظتی تدابیر:** ${item.preventionUrdu}`
      : `🌾 **Wheat Rust (کنگی) Comprehensive Treatment** 🌾\n\n` +
        `📝 **Symptoms:** ${item.symptoms.join("; ")}\n\n` +
        `🌿 **Organic Remedy:** ${item.organic}\n\n` +
        `🧪 **Chemical Remedy:** ${item.chemical}\n\n` +
        `💊 **Dosage:** ${item.dosage}\n\n` +
        `🛍️ **Recommended Products:** ${item.localProducts.join(", ")}\n\n` +
        `🛡️ **Prevention:** ${item.prevention}`;
  }

  // 3. Rice Blast
  if (q.includes("rice") || q.includes("paddy") || q.includes("دھان") || q.includes("چاول")) {
    const item = REMEDY_DATABASE["Rice___Blast"];
    return isUr
      ? `🍚 **دھان کے بلاسٹ (گردن توڑ) بیماری کا علاج** 🍚\n\n` +
        `📝 **علامات:** ${item.symptomsUrdu.join("، ")}\n\n` +
        `🌿 **قدرتی حل:** ${item.organicUrdu}\n\n` +
        `🧪 **کیمیائی دوا:** ${item.chemicalUrdu}\n\n` +
        `💊 **مقدار:** ${item.dosageUrdu}\n\n` +
        `🛍️ **برانڈز:** ${item.localProducts.join(", ")}`
      : `🍚 **Rice Blast & Neck Rot Advisory** 🍚\n\n` +
        `📝 **Symptoms:** ${item.symptoms.join("; ")}\n\n` +
        `🌿 **Organic Remedy:** ${item.organic}\n\n` +
        `🧪 **Chemical Treatment:** ${item.chemical}\n\n` +
        `💊 **Dosage:** ${item.dosage}\n\n` +
        `🛍️ **Top Local Products:** ${item.localProducts.join(", ")}`;
  }

  // 4. Cow / Animal / Foot and Mouth / Mastitis / Fever
  if (q.includes("cow") || q.includes("buffalo") || q.includes("animal") || q.includes("fever") || q.includes("fmd") || q.includes("mastitis") || q.includes("گائے") || q.includes("بھینس") || q.includes("جانور") || q.includes("بخار") || q.includes("منہ کھر")) {
    if (q.includes("mastitis") || q.includes("سڑو") || q.includes("ساڑو") || q.includes("udder") || q.includes("milk")) {
      const item = REMEDY_DATABASE["Livestock___Bovine_Mastitis"];
      return isUr
        ? `🐄 **جانور کے حیوانے کی سوجن (سڑو/ساڑو) کا علاج** 🐄\n\n` +
          `📝 **علامات:** ${item.symptomsUrdu.join("، ")}\n\n` +
          `🌿 **دیسی علاج:** ${item.organicUrdu}\n\n` +
          `🧪 **کیمیائی علاج:** ${item.chemicalUrdu}\n\n` +
          `💊 **خوراک:** ${item.dosageUrdu}\n\n` +
          `🛍️ **ادویات:** ${item.localProducts.join(", ")}`
        : `🐄 **Bovine Mastitis (Udder Swelling) Advisory** 🐄\n\n` +
          `📝 **Symptoms:** ${item.symptoms.join("; ")}\n\n` +
          `🌿 **Organic Remedy:** ${item.organic}\n\n` +
          `🧪 **Chemical Remedy:** ${item.chemical}\n\n` +
          `💊 **Dosage:** ${item.dosage}\n\n` +
          `🛍️ **Products:** ${item.localProducts.join(", ")}`;
    }
    const fmd = REMEDY_DATABASE["Livestock___Foot_and_Mouth"];
    return isUr
      ? `🐄 **مویشیوں (گائے/بھینس) کی بیماری اور بخار کا حل** 🐄\n\n` +
        `📌 **منہ کھر (FMD) / بخار کی علامات:** ${fmd.symptomsUrdu.join("، ")}\n\n` +
        `🌿 **دیسی دیکھ بھال:** ${fmd.organicUrdu}\n\n` +
        `🧪 **ویٹرنری علاج:** ${fmd.chemicalUrdu}\n\n` +
        `💊 **مقدار:** ${fmd.dosageUrdu}\n\n` +
        `🛍️ **مقامی ادویات:** ${fmd.localProducts.join(", ")}`
      : `🐄 **Livestock Health & Fever Advisory** 🐄\n\n` +
        `📌 **FMD / Fever Symptoms:** ${fmd.symptoms.join("; ")}\n\n` +
        `🌿 **Organic Care:** ${fmd.organic}\n\n` +
        `🧪 **Veterinary Remedy:** ${fmd.chemical}\n\n` +
        `💊 **Dosage:** ${fmd.dosage}\n\n` +
        `🛍️ **Recommended Products:** ${fmd.localProducts.join(", ")}`;
  }

  // 5. Tomato
  if (q.includes("tomato") || q.includes("ٹماٹر")) {
    const item = REMEDY_DATABASE["Tomato___Early_blight"];
    return isUr
      ? `🍅 **ٹماٹر کے جھلساؤ (Blight) کا علاج** 🍅\n\n` +
        `📝 **علامات:** ${item.symptomsUrdu.join("، ")}\n\n` +
        `🌿 **دیسی طریقہ:** ${item.organicUrdu}\n\n` +
        `🧪 **کیمیائی طریقہ:** ${item.chemicalUrdu}\n\n` +
        `💊 **مقدار:** ${item.dosageUrdu}\n\n` +
        `🛍️ **برانڈز:** ${item.localProducts.join(", ")}`
      : `🍅 **Tomato Blight Management Guide** 🍅\n\n` +
        `📝 **Symptoms:** ${item.symptoms.join("; ")}\n\n` +
        `🌿 **Organic Method:** ${item.organic}\n\n` +
        `🧪 **Chemical Treatment:** ${item.chemical}\n\n` +
        `💊 **Dosage:** ${item.dosage}\n\n` +
        `🛍️ **Products:** ${item.localProducts.join(", ")}`;
  }

  // 6. Fertilizer / Nitrogen / Urea / DAP
  if (q.includes("fertilizer") || q.includes("dap") || q.includes("urea") || q.includes("کھاد")) {
    return isUr
      ? `🌱 **فصلوں کی کھاد کا ماہرانہ چارٹ (پاکستان)** 🌱\n\n` +
        `🌾 **گندم:** 1 بوری DAP + 1 بوری یوریا بوائی پر؛ 1 بوری یوریا پہلے پانی پر۔\n` +
        `🍚 **دھان:** 1 بوری DAP تیاری پر؛ 1.5 بوری یوریا 3 اقساط میں۔\n` +
        `🌱 **کپاس:** 1.5 بوری DAP + 2.5 بوری یوریا اقساط میں۔\n` +
        `🍅 **سبزیاں:** گوبر کی پرانی کھاد + متوازن NPK 20:20:20۔\n\n` +
        `⚠️ *ہمیشہ مٹی کا ٹیسٹ کروائیں اور تیز دھوپ میں یوریا مت چھٹائیں۔*`
      : `🌱 **Fertilizer Dosage & Application Chart** 🌱\n\n` +
        `🌾 **Wheat:** 1 bag DAP + 1 bag Urea at sowing; 1 bag Urea at 1st irrigation (20-25 days).\n` +
        `🍚 **Rice:** 1 bag DAP at land prep; 1.5 bags Urea split across 3 applications.\n` +
        `🌱 **Cotton:** 1.5 bags DAP + 2.5 bags Urea split during growth/flowering.\n` +
        `🍅 **Vegetables:** Composted manure + Balanced NPK (20:20:20).\n\n` +
        `⚠️ *Tip: Avoid broadcasting Urea on dry dry soil in hot sun to prevent ammonia loss.*`;
  }

  } // ═══ end CROP/LIVESTOCK gate ═══

  // Domain fallback routing
  switch (domain) {
    case "human":
      return humanFallback(isUr);
    case "livestock":
      return livestockFallback(isUr);
    case "pet":
      return petFallback(isUr);
    case "plant":
      return plantFallback(isUr);
    case "crop":
    default:
      return cropFallback(isUr);
  }
}

/* ── Domain-scoped offline fallback replies — strict isolation ── */

function humanFallback(isUr: boolean): string {
  return isUr
    ? `🧑‍⚕️ **صحت معاون — ابتدائی رہنمائی** 🧑‍⚕️\n\n` +
      `میں ان موضوعات میں مدد کر سکتا ہوں:\n\n` +
      `🤒 بخار، فلو، سر درد · 🤢 اسہال، پیٹ خرابی\n` +
      `🧴 جلد: داد، ایکزیما، فنگس · 👁️ آنکھ کی سوزش\n` +
      `🗣️ گلے کی خرابی، ٹانسل · 🔥 دل کی جلن، گیس\n` +
      `🩺 بلڈ پریشر، جوڑوں کا درد، خون کی کمی\n` +
      `🩹 ابتدائی امداد · 💉 ویکسینیشن شیڈول\n\n` +
      `⚠️ میں ڈاکٹر نہیں — تشخیص کے لیے **Doctors** ٹیب سے بکنگ کریں۔ ایمرجنسی میں **1122** پر کال کریں۔`
    : `🧑‍⚕️ **Health Assistant — Preliminary Guidance** 🧑‍⚕️\n\n` +
      `I can help you with:\n\n` +
      `🤒 Fever, flu, headache · 🤢 Diarrhea, stomach issues\n` +
      `🧴 Skin: ringworm/dad, eczema, fungal · 👁️ Eye infection\n` +
      `🗣️ Sore throat, tonsils · 🔥 Acidity, gas\n` +
      `🩺 Blood pressure, joint pain, anemia\n` +
      `🩹 First aid · 💉 Vaccination schedule\n\n` +
      `⚠️ I'm not a doctor — book via the **Doctors** tab for diagnosis. For emergencies call **1122**.`;
}

function petFallback(isUr: boolean): string {
  return isUr
    ? `🐾 **پالتو جانور معاون** 🐾\n\n` +
      `میں ان موضوعات میں مدد کر سکتا ہوں:\n\n` +
      `🐕 خارش، مینج، بال جھڑنا · 🕷️ چیچر اور پسو\n` +
      `🤮 قے، اسہال، پیروو خدشہ · 👂 کان کی انفیکشن\n` +
      `💉 ریبز ویکسین، DHPPi، کیڑوں کی دوا\n` +
      `🍖 محفوظ اور ممنوع خوراک\n\n` +
      `⚠️ ویکسینیشن اور شدید بیماری کے لیے **Doctors** ٹیب سے پیٹ ویٹ بک کریں۔`
    : `🐾 **Pet Care Assistant** 🐾\n\n` +
      `I can help you with:\n\n` +
      `🐕 Itching, mange, hair loss · 🕷️ Ticks & fleas\n` +
      `🤮 Vomiting, diarrhea, parvo risk · 👂 Ear infections\n` +
      `💉 Rabies, DHPPi, deworming schedule\n` +
      `🍖 Safe vs poisonous foods\n\n` +
      `⚠️ Book a Pet Vet via the **Doctors** tab for vaccination and serious illness.`;
}

function plantFallback(isUr: boolean): string {
  return isUr
    ? `🪴 **پلانٹ معاون** 🪴\n\n` +
      `میں ان موضوعات میں مدد کر سکتا ہوں:\n\n` +
      `🍂 پتوں کے دھبے، جھلساؤ · 🟡 پیلے پتے\n` +
      `🐛 مہنگ، ملی بگ، سفید مکھی · 🌫️ سفید پھپھوندی\n` +
      `🫚 جڑ سڑن (زیادہ پانی) · 💧 پانی کے اصول\n` +
      `🌿 نیم آئل اسپرے · ✂️ کاٹ چھانٹ اور دیکھ بھال\n\n` +
      `تصویر بھیج کر فوری تشخیص کے لیے **Scan** ٹیب استعمال کریں۔`
    : `🪴 **Plant Assistant** 🪴\n\n` +
      `I can help you with:\n\n` +
      `🍂 Leaf spots & blight · 🟡 Yellowing leaves\n` +
      `🐛 Aphids, mealybugs, whitefly · 🌫️ Powdery mildew\n` +
      `🫚 Root rot (overwatering) · 💧 Watering rules\n` +
      `🌿 Neem oil spray · ✂️ Pruning & plant care\n\n` +
      `Snap a photo in the **Scan** tab for instant visual diagnosis.`;
}

function livestockFallback(isUr: boolean): string {
  return isUr
    ? `🐄 **مویشی معاون** 🐄\n\n` +
      `میں ان موضوعات میں مدد کر سکتا ہوں:\n\n` +
      `🔴 منہ کھر (FMD) · 🩸 گل گھنٹو (HS) · 🔴 لمپی جلدی\n` +
      `🥛 سڑو/ساڑو (ماسٹائٹس) · 🌡️ بخار · 💨 افارہ\n` +
      `🪱 کیڑے اور کیڑے مار دوا · 🕷️ چیچر بخار\n` +
      `💉 ویکسین شیڈول (FMD سال میں دو بار)\n\n` +
      `متعدی بیماری میں مقامی محکمہ لائیوسٹاک کو مطلع کریں۔`
    : `🐄 **Livestock Assistant** 🐄\n\n` +
      `I can help you with:\n\n` +
      `🔴 FMD (منہ کھر) · 🩸 HS (gul ghuntu) · 🔴 Lumpy Skin Disease\n` +
      `🥛 Mastitis (saro) · 🌡️ Fever · 💨 Bloat (afara)\n` +
      `🪱 Worms & deworming · 🕷️ Tick fever\n` +
      `💉 Vaccine schedule (FMD twice a year)\n\n` +
      `Report notifiable diseases to the district livestock office.`;
}

function cropFallback(isUr: boolean): string {
  return isUr
    ? `🌾 **فصل معاون** 🌾\n\n` +
      `میں ان موضوعات میں مدد کر سکتا ہوں:\n\n` +
      `🌾 گندم: کنگی، گیلی فصل · 🍚 دھان: بلاسٹ\n` +
      `🌱 کپاس: سفید مکھی، کالی شاخ · 🍅 ٹماٹر: جھلساؤ\n` +
      `🥔 آلو: لیٹ بلیٹ · 🌽 مکئی: فال آرمی ورم\n` +
      `🧪 کھاد کی مقدار فی ایکڑ (DAP/یوریا)\n\n` +
      `تصویر بھیج کر فوری تشخیص کے لیے **Scan** ٹیب استعمال کریں۔`
    : `🌾 **Crop Assistant** 🌾\n\n` +
      `I can help you with:\n\n` +
      `🌾 Wheat: rust, wet fields · 🍚 Rice: blast\n` +
      `🌱 Cotton: whitefly, black arm · 🍅 Tomato: blight\n` +
      `🥔 Potato: late blight · 🌽 Maize: fall armyworm\n` +
      `🧪 Fertilizer doses per acre (DAP/Urea)\n\n` +
      `Snap a photo in the **Scan** tab for instant visual diagnosis.`;
}
