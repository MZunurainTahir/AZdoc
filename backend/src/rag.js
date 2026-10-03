/**
 * FasalDoc RAG (Retrieval-Augmented Generation) & Knowledge Engine
 * Plain JavaScript ESM for Node.js backend.
 * 
 * Provides fast, offline-capable, highly accurate knowledge retrieval for Pakistani
 * agricultural (crop & livestock) questions. Covers crops (wheat, rice, cotton, tomato, 
 * potato, sugarcane, maize, citrus, chili, etc.), livestock (cattle, buffalo, goat, sheep, poultry), 
 * soil/fertilizers, wet/flooded field recovery, pest control, and disease treatment.
 */

export const KNOWLEDGE_BASE = [
  {
    id: "wheat_wet_flooded",
    category: "crop",
    topics: ["wheat", "wet crop", "waterlogging", "rain", "flood", "yellowing"],
    keywords: ["wheat", "wet", "water", "flood", "rain", "yellow", "soil", "drainage", "گندم", "پانی", "بارش", "پیلا"],
    titleEn: "Wheat Crop Waterlogging & Wet Field Recovery",
    titleUr: "گندم کی فصل میں پانی کا کھڑا ہونا اور پیلا پن",
    summaryEn: "Standing water or heavy rain causes oxygen depletion at wheat roots, leading to root rot and yellowing (nitrogen deficiency). Immediate drainage and foliar nutrition are essential.",
    summaryUr: "کھیت میں اضافی پانی یا شدید بارش سے گندم کی جڑوں کو آکسیجن نہیں ملتی جس سے جڑیں گلنے لگتی ہیں اور پتے پیلے پڑ جاتے ہیں۔ فوری پانی کی نکاسی اور فولیر اسپرے ضروری ہے۔",
    organicEn: "1. Drain excess water immediately from the field using drainage channels.\n2. Spray 2% Fermented Whey/Buttermilk mixed with wood ash extract after field dries slightly to stimulate root activity.\n3. Apply well-rotted farmyard manure or vermicompost once field permits walking.",
    organicUrdu: "1. کھیت سے اضافی پانی کا فوری نالیاں بنا کر اخراج کریں۔\n2. زمین خشک ہونے پر کھٹی لسی (2٪ محلول) کا اسپرے جڑوں کی طاقت کے لیے کریں۔\n3. گوبر کی پرانی کھاد کا استعمال کریں۔",
    chemicalEn: "1. Top-dress Urea (15-20 kg/acre) mixed with Zinc Sulphate 33% (3 kg/acre) as soon as field dries to restore green color.\n2. Apply foliar spray of NPK (19:19:19) @ 500g/acre in 100L water if roots cannot absorb soil fertilizers.\n3. Spray Propiconazole 25% EC (200ml/acre) to prevent fungal leaf rust encouraged by wet humidity.",
    chemicalUrdu: "1. وتر آنے پر یوریا (15-20 کلوگرام فی ایکڑ) اور زنک سلفیٹ (3 کلوگرام) ملا کر چھٹا دیں۔\n2. NPK 19:19:19 (500 گرام فی ایکڑ) کا پتوں پر اسپرے کریں تاکہ فوراً غذائیت ملے۔\n3. نمی کی وجہ سے کنگی کے خوف سے پروپیکونازول (Tilt) کا اسپرے کریں۔",
    dosageEn: "Foliar NPK: 500g in 100L water per acre. Tilt 250 EC: 200ml in 100L water per acre.",
    dosageUrdu: "این پی کے اسپرے: 500 گرام فی 100 لیٹر پانی۔ ٹلٹ 250 ای سی: 200 ملی لیٹر فی ایکڑ۔",
    preventionEn: "Ensure laser land leveling prior to sowing. Build raised beds (bed planting) for wheat in flood-prone zones.",
    preventionUrdu: "کاشت سے قبل لیزر لیولنگ لازمی کریں۔ نچلے اور پانی جمع ہونے والے علاقوں میں بیڈ پلانٹنگ اپنائیں۔",
    localProducts: ["Tilt 250 EC (Syngenta)", "Zincol (FMC)", "SoluPotasse (TES)", "Engro Urea"]
  },
  {
    id: "wheat_rust",
    category: "crop",
    topics: ["wheat", "rust", "fungus", "yellow leaf", "brown spot"],
    keywords: ["wheat", "rust", "brown", "yellow", "pustule", "fungus", "tilt", "گندم", "کنگی", "رسٹ", "پیلا"],
    titleEn: "Wheat Leaf & Stripe Rust (کنگی)",
    titleUr: "گندم کی بھوری اور پیلی کنگی",
    summaryEn: "Fungal disease causing orange-brown or yellow powdery streaks on leaves. Causes grain shriveling and up to 50% yield loss if untreated.",
    summaryUr: "پتوں پر نارنجی یا زرد پاؤڈر نما دھبے بن جاتے ہیں۔ بروقت علاج نہ کرنے سے دانہ چھوٹا رہ جاتا ہے اور پیداوار شدید متاثر ہوتی ہے۔",
    organicEn: "Spray sour buttermilk solution (5L buttermilk in 100L water). Sow rust-resistant certified seed varieties early (Nov 1-20).",
    organicUrdu: "کھٹی لسی کا اسپرے کریں۔ نومبر کی شروعات میں منظور شدہ اقسام کی وقت پر کاشت کریں۔",
    chemicalEn: "Spray Propiconazole 25% EC or Tebuconazole + Trifloxystrobin immediately upon first sight of yellow/brown dust on leaves.",
    chemicalUrdu: "علامات ظاہر ہوتے ہی پروپیکونازول (Tilt 250 EC) یا ٹیبوکونازول (Nativo) کا اسپرے کریں۔",
    dosageEn: "Tilt 250 EC: 200ml per acre in 100-120L water. Nativo 75 WG: 65g per acre.",
    dosageUrdu: "ٹلٹ: 200 ملی لیٹر فی 100 لیٹر پانی فی ایکڑ۔ نیٹیوو: 65 گرام فی ایکڑ۔",
    preventionEn: "Use resistant certified varieties like Akbar-19, Dilkash-20, Subhani-21, Ghazi-19.",
    preventionUrdu: "اکبر 19، دلکش 20، سبحانی 21 جیسی قوت مدافعت والی اقسام کاشت کریں۔",
    localProducts: ["Tilt 250 EC (Syngenta)", "Nativo 75 WG (Bayer)", "Folicur (Bayer)", "Topas (Syngenta)"]
  },
  {
    id: "rice_blast",
    category: "crop",
    topics: ["rice", "paddy", "blast", "neck rot", "leaf spot"],
    keywords: ["rice", "paddy", "blast", "neck", "spot", "tricyclazole", "چاول", "دھان", "بلاسٹ", "گردن توڑ"],
    titleEn: "Rice Blast & Neck Rot (دھان کا بلاسٹ)",
    titleUr: "دھان کا بلاسٹ اور گردن توڑ بیماری",
    summaryEn: "Eye-shaped lesions on leaves and neck breakage below the panicle leading to empty white heads (blanking).",
    summaryUr: "پتوں پر آنکھ نما دھبے اور سٹے کی بنیاد (گردن) کا کالا ہو کر ٹوٹ جانا، جس سے دانہ نہیں بنتا۔",
    organicEn: "Apply silica-rich rice husk ash to soil. Avoid continuous stagnant cold water in fields.",
    organicUrdu: "زمین میں چاول کی راکھ ڈالیں۔ کھڑے پانی کی جگہ تازہ پانی تبدیل کریں۔",
    chemicalEn: "Spray Tricyclazole 75% WP or Isoprothiolane 40% EC or Azoxystrobin + Difenoconazole at booting & heading stage.",
    chemicalUrdu: "ٹرائی سائیکلازول (Beam 75 WP) یا آئسوپروتھائیولین کا گوبھ اور نثار کی حالت میں اسپرے کریں۔",
    dosageEn: "Beam 75 WP: 120g/acre. Amistar Top: 200ml/acre in 100L water.",
    dosageUrdu: "بیم 75 ڈبلیو پی: 120 گرام فی ایکڑ۔ ایمسٹار ٹاپ: 200 ملی لیٹر فی ایکڑ۔",
    preventionEn: "Do not overuse nitrogen (Urea). Split nitrogen application into 3 equal doses.",
    preventionUrdu: "یوریا کی زیادتی سے پرہیز کریں۔ نائٹروجن 3 اقساط میں دیں۔",
    localProducts: ["Beam 75 WP (Corteva)", "Amistar Top (Syngenta)", "Fuji-One (Nihon Nohyaku)", "Trooper (Dow)"]
  },
  {
    id: "cotton_whitefly_blight",
    category: "crop",
    topics: ["cotton", "whitefly", "bacterial blight", "black arm", "clcuv"],
    keywords: ["cotton", "whitefly", "leaf curl", "blight", "boll", "کپاس", "سفید مکھی", "مروڑ", "کالی شاخ"],
    titleEn: "Cotton Whitefly, CLCuV & Bacterial Blight Management",
    titleUr: "کپاس کی سفید مکھی، پتے مروڑ اور کالی شاخ کا علاج",
    summaryEn: "Whitefly transmits Cotton Leaf Curl Virus (CLCuV) and sooty mold. Bacterial blight causes angular leaf spots and black arm branch rot.",
    summaryUr: "سفید مکھی وائرس پھیلاتی ہے جس سے پتے اوپر مڑ جاتے ہیں۔ بیکٹیریل بلائیٹ سے شاخیں کالی ہو کر ٹوٹتی ہیں۔",
    organicEn: "Spray Neem seed oil 5ml/L + Soap solution (2g/L) for whitefly control. Remove virus infected plants early.",
    organicUrdu: "نیم کا تیل (5 ملی لیٹر) صابن کے پانی کے ساتھ ملا کر اسپرے کریں۔ متاثرہ بوٹے نکال دیں۔",
    chemicalEn: "For Whitefly: Pyriproxyfen 10% EC or Diafenthiuron 50% WP. For Bacterial Blight: Copper Oxychloride + Streptomycin.",
    chemicalUrdu: "سفید مکھی کیلئے پائری پروکسی فن یا ڈایا فینتھیوران۔ کالی شاخ کیلئے کاپر آکسی کلورائیڈ + ایگری مائیسن۔",
    dosageEn: "Pyriproxyfen: 400ml/acre. Copper Oxychloride: 500g + Streptomycin 50g in 100L water/acre.",
    dosageUrdu: "پائری پروکسی فن: 400 ملی لیٹر۔ کاپر آکسی کلورائیڈ: 500 گرام + ایگری مائیسن 50 گرام فی ایکڑ۔",
    preventionEn: "Use acid-delinted seeds. Rotate crops with non-hosts like maize or sorghum.",
    preventionUrdu: "تیزاب سے دھویا ہوا بیج استعمال کریں۔ فصلی ہیر پھیر اپنائیں۔",
    localProducts: ["Polo 500 SC (Syngenta)", "Pyriproxyfen (FMC)", "Cuprofix (UPL)", "Agrimycin"]
  },
  {
    id: "tomato_blight",
    category: "crop",
    topics: ["tomato", "early blight", "late blight", "fruit rot"],
    keywords: ["tomato", "blight", "leaf spot", "fruit rot", "fungus", "ٹماٹر", "جھلساؤ", "داغ", "سڑن"],
    titleEn: "Tomato Early & Late Blight Treatment",
    titleUr: "ٹماٹر کا اگیتا اور پچھیتا جھلساؤ",
    summaryEn: "Early blight causes dark concentric ring spots on lower leaves. Late blight causes rapid blackening of canopy and leathery fruit rot.",
    summaryUr: "پتوں پر سیاہ دائرے دار دھبے اور ٹماٹروں کا کالا ہو کر سڑ جانا۔ نمی والے موسم میں تیزی سے پھیلتا ہے۔",
    organicEn: "Prune affected lower leaves. Spray Neem oil (5ml/L) or Copper hydroxide solution in early morning.",
    organicUrdu: "نچلے متاثرہ پتے کاٹ دیں۔ نیم کے تیل کا یا کاپر ہائیڈرو آکسائیڈ کا اسپرے کریں۔",
    chemicalEn: "Spray Chlorothalonil or Mancozeb as preventive. Use Ridomil Gold (Metalaxyl + Mancozeb) or Difenoconazole for active blight.",
    chemicalUrdu: "حفاظتی طور پر مینکوزیب کا اسپرے کریں۔ شدید حملے پر ریڈومل گولڈ یا اسکور کا اسپرے کریں۔",
    dosageEn: "Ridomil Gold: 250g per 100L water per acre. Score 250 EC: 100ml per acre.",
    dosageUrdu: "ریڈومل گولڈ: 250 گرام فی 100 لیٹر پانی فی ایکڑ۔ اسکور: 100 ملی لیٹر فی ایکڑ۔",
    preventionEn: "Avoid overhead watering. Maintain proper spacing (60cm) for airflow. Stake plants to elevate fruit.",
    preventionUrdu: "پودوں پر اوپر سے پانی نہ ڈالیں۔ پودوں کو لکڑیوں سے باندھ کر اونچا رکھیں۔",
    localProducts: ["Ridomil Gold (Syngenta)", "Score 250 EC (Syngenta)", "Antracol (Bayer)", "Acrobat MZ (BASF)"]
  },
  {
    id: "potato_late_blight",
    category: "crop",
    topics: ["potato", "late blight", "tuber rot", "black stem"],
    keywords: ["potato", "blight", "tuber", "stem", "rot", "آلو", "جھلساؤ", "سڑن"],
    titleEn: "Potato Late Blight & Tuber Management",
    titleUr: "آلو کا پچھیتا جھلساؤ اور تنے کا سڑنا",
    summaryEn: "Devastating water mold causing water-soaked leaf spots with white mildew underneath and brown tuber rot in wet cloudy weather.",
    summaryUr: "سرد اور مرطوب موسم میں پتوں پر پانی والے دھبے اور سفید فنگس، اور آلو کا اندر سے گل جانا۔",
    organicEn: "Earth up potato ridges to cover tubers deep (15cm). Spray baking soda (5g/L) with soap solution.",
    organicUrdu: "آلو کی مٹی اونچی چڑھائیں۔ بیکنگ سوڈا کے پانی کا چھڑکاؤ کریں۔",
    chemicalEn: "Spray Cymoxanil + Mancozeb (Curzate M) or Dimethomorph + Mancozeb (Acrobat MZ) at first sign of weather moisture.",
    chemicalUrdu: "کرزیٹ ایم (Curzate M) یا ایکرو بیٹ (Acrobat MZ) کا فوری اسپرے کریں۔",
    dosageEn: "Curzate M8: 250g in 100L water per acre every 7 days.",
    dosageUrdu: "کرزیٹ ایم 8: 250 گرام فی 100 لیٹر پانی فی ایکڑ۔",
    preventionEn: "Use certified disease-free seed tubers. Avoid excessive nitrogen fertilizer.",
    preventionUrdu: "تصدیق شدہ بیج استعمال کریں اور زیادہ نائٹروجن سے بچیں۔",
    localProducts: ["Curzate M8 (Corteva)", "Acrobat MZ (BASF)", "Melody Duo (Bayer)", "Revus (Syngenta)"]
  },
  {
    id: "maize_fall_armyworm",
    category: "crop",
    topics: ["maize", "corn", "fall armyworm", "borer", "whorl"],
    keywords: ["maize", "corn", "armyworm", "borer", "leaf hole", "مکئی", "فال آرمی ورم", "سنڈی", "سوراخ"],
    titleEn: "Maize Fall Armyworm & Stem Borer Control",
    titleUr: "مکئی کا فال آرمی ورم اور تنے کی سنڈی",
    summaryEn: "Chewed whorl leaves with shot-holes and sawdust-like frass inside the central growing point of maize plants.",
    summaryUr: "مکئی کے پودے کے چوڑے پتوں اور گوپ میں سوراخ اور لکڑی کی برادے نما فضلے والی سنڈی۔",
    organicEn: "Apply dry fine sand or wood ash mixed with neem dust into the central whorl of young maize plants.",
    organicUrdu: "مکئی کی گوپ میں خشک ریت یا راکھ اور نیم کی خلی کا پاؤڈر ڈالیں۔",
    chemicalEn: "Apply Emamectin Benzoate 1.9% EC or Chlorantraniliprole 20% SC or Spinetoram into the whorls.",
    chemicalUrdu: "مکئی کی گوپ میں ایمامیکٹن بینزویٹ یا کوراجن (Chlorantraniliprole) کا اسپرے کریں۔",
    dosageEn: "Emamectin Benzoate: 200ml/acre directed straight into plant whorls.",
    dosageUrdu: "ایمامیکٹن: 200 ملی لیٹر فی ایکڑ براہ راست گوپ کے اندر۔",
    preventionEn: "Early planting in spring. Intercrop with cowpea or beans.",
    preventionUrdu: "وقت پر کاشت اور بین المذاہب کاشتکاری اپنائیں۔",
    localProducts: ["Coragen (FMC)", "Match 50 EC (Syngenta)", "Proclaim (Syngenta)", "Radiant (Corteva)"]
  },
  {
    id: "fertilizer_guide",
    category: "general_agri",
    topics: ["fertilizer", "dap", "urea", "npk", "dosage", "acre"],
    keywords: ["fertilizer", "dap", "urea", "npk", "potash", "zinc", "dosage", "کھاد", "یوریا", "ڈی اے پی", "خوراک"],
    titleEn: "Fertilizer Schedule & Dosage Guide for Crops (Punjab/Sindh)",
    titleUr: "مختلف فصلوں کے لیے کھاد کا شیڈول اور مقدار",
    summaryEn: "Balanced NPK and micro-nutrient application per acre for optimal crop yields.",
    summaryUr: "بہترین پیداوار کے لیے فی ایکڑ یوریا، ڈی اے پی، پوٹاش اور زنک کی متوازن مقدار۔",
    organicEn: "Combine 2-3 tons of composted farmyard manure per acre during soil preparation with bio-fertilizers (Azotobacter/PSB).",
    organicUrdu: "زمین کی تیاری میں 2 تا 3 ٹالی گوبر کی دیسی کھاد ڈالیں۔",
    chemicalEn: "🌾 Wheat: 1 bag DAP + 1 bag Urea at sowing; 1 bag Urea at 1st irrigation (20-25 days); 0.5 bag Urea at 2nd irrigation.\n🍚 Rice: 1 bag DAP + 0.5 bag SOP at land prep; 1.5 bags Urea split in 3 doses.\n🌱 Cotton: 1.5 bags DAP + 2.5 bags Urea split across blooming/boll stages.\n🌽 Maize: 2 bags DAP + 3 bags Urea split into 4 doses.",
    chemicalUrdu: "🌾 گندم: بوائی کے وقت 1 بوری DAP + 1 بوری یوریا؛ پہلے پانی پر 1 بوری یوریا؛ دوسرے پانی پر آدھی بوری یوریا۔\n🍚 دھان: تیاری پر 1 بوری DAP؛ 1.5 بوری یوریا 3 اقساط میں۔\n🌱 کپاس: 1.5 بوری DAP + 2.5 بوری یوریا پھول اور گوڈی پر۔\n🌽 مکئی: 2 بوری DAP + 3 بوری یوریا 4 اقساط میں۔",
    dosageEn: "Standard bag size: 50kg. Zinc Sulphate 33%: 3-6 kg/acre with 1st irrigation.",
    dosageUrdu: "زنک سلفیٹ (33٪): 3 تا 6 کلوگرام فی ایکڑ پہلے پانی پر۔",
    preventionEn: "Conduct soil fertility test every 2 years. Do not broadcast Urea on dry soil surface under high sunlight.",
    preventionUrdu: "ہر 2 سال بعد مٹی کا تجربہ کروائیں۔ یوریا کھلی تیز دھوپ میں سوکھی زمین پر نہ چھٹائیں۔",
    localProducts: ["Engro DAP", "Sona Urea (FFC)", "FMC Zinc", "SOP Potash"]
  },
  {
    id: "livestock_fmd",
    category: "livestock",
    topics: ["cow", "buffalo", "fmd", "foot and mouth", "blister", "fever", "mouth"],
    keywords: ["cow", "buffalo", "fmd", "foot", "mouth", "saliva", "blister", "fever", "گائے", "بھینس", "منہ کھر", "بخار", "رال"],
    titleEn: "Foot & Mouth Disease (FMD / منہ کھر) in Cattle & Buffalo",
    titleUr: "گائے اور بھینسوں میں منہ کھر (FMD) کی بیماری",
    summaryEn: "Highly contagious viral infection causing high fever (104-106°F), excessive ropy saliva, lip smacking, and painful blisters inside mouth and between hooves.",
    summaryUr: "تیز بخار، منہ سے مسلسل رال ٹپکنا، منہ اور کھروں میں دردناک چھالے جس سے جانور لنگڑا کر چلتا ہے اور دودھ خشک ہو جاتا ہے۔",
    organicEn: "1. Wash mouth 3 times daily with 1% Potassium Permanganate (Lal Dawai / لال دوائی) or 2% Baking Soda water.\n2. Apply Neem oil mixed with turmeric paste on foot lesions.\n3. Feed soft warm porridge (dalia) with ghee or honey.",
    organicUrdu: "1. لال دوائی (پوٹاشیم پرمینگنیٹ) کے پانی سے منہ دن میں 3 بار دھوئیں۔\n2. کھروں کے زخموں پر نیم کا تیل اور ہلدی ملائیں۔\n3. نرم دلیہ اور گھی کھلائیں۔",
    chemicalEn: "No direct antiviral. Provide symptomatic relief: Oxytetracycline LA or Ceftiofur injection to prevent secondary bacterial infection + Flunixin Meglumine or Ketoprofen for fever and pain.",
    chemicalUrdu: "ثانوی انفیکشن سے بچاؤ کیلئے آکسی ٹیٹراسائیکلین ٹیکہ اور بخار/درد کیلئے فلو نکسن کا ٹیکہ ویٹرنری ڈاکٹر سے لگوائیں۔",
    dosageEn: "Oxytetracycline LA: 1ml per 10kg bodyweight (IM). Flunixin: 2ml per 45kg bodyweight.",
    dosageUrdu: "ادویات کی مقدار جانور کے وزن کے مطابق ویٹرنری ڈاکٹر کی ہدایت پر دیں۔",
    preventionEn: "Vaccinate bi-annually (Spring and Autumn) with FMD vaccine. Isolate sick animals immediately.",
    preventionUrdu: "سال میں دو بار (بہار اور خزاں) منہ کھر کی ویکسین لازمی لگوائیں۔",
    localProducts: ["Alamycin LA (Norbrook)", "Finadyne (MSD)", "Lal Dawai (KMnO4)", "AIT FMD Vaccine"]
  },
  {
    id: "livestock_mastitis",
    category: "livestock",
    topics: ["cow", "buffalo", "mastitis", "udder", "milk clots", "swelling"],
    keywords: ["cow", "buffalo", "mastitis", "udder", "milk", "clot", "swelling", "گائے", "بھینس", "سڑو", "ساڑو", "لیوا", "دودھ"],
    titleEn: "Bovine Mastitis (سڑو / ساڑو) Udder Infection",
    titleUr: "دودھیل جانوروں میں سڑو (ساڑو) کا مرض",
    summaryEn: "Bacterial infection of udder causing swelling, hardness, heat, pain, and abnormal milk (clots, flakes, pus, blood).",
    summaryUr: "حیوانے (لیوے) کی سوزش، سوجن اور دودھ میں پھٹکیاں، خون یا پیپ کا آنا۔ جانور چوائی کے وقت لات مارتا ہے۔",
    organicEn: "1. Completely strip affected quarter every 2 hours.\n2. Apply cold water compresses initially, followed by warm Epsom salt water compresses.\n3. Apply aloe vera gel with turmeric on udder skin.",
    organicUrdu: "1. متاثرہ تھن سے ہر 2 گھنٹے بعد دودھ اچھی طرح نچوڑیں۔\n2. ٹھنڈے پانی کی پٹیاں اور بعد میں گرم نمک والے پانی سے ٹکور کریں۔\n3. ایلوویرا اور ہلدی کا لیپ کریں۔",
    chemicalEn: "Infuse Intramammary antibiotic tube (Mastijet Forte or Synulox LC) into affected quarter after milking + Inject Meloxicam (NSAID) for pain/swelling.",
    chemicalUrdu: "تھن کو خالی کر کے ماسٹائی جیٹ فورٹ (Mastijet) ٹیوب تھن کے اندر چڑھائیں اور درد کا ٹیکہ دیں۔",
    dosageEn: "Intramammary tube: 1 tube per quarter daily for 3 days after complete milking.",
    dosageUrdu: "ماسٹائی جیٹ ٹیوب: 1 ٹیوب روزانہ 3 دن تک۔",
    preventionEn: "Dip teats in 0.5% iodine solution post-milking. Keep barn floor dry and clean.",
    preventionUrdu: "چوائی کے فوراً بعد تھنوں کو آیوڈین محلول میں ڈبوئیں۔ باڑے کا فرش خشک رکھیں۔",
    localProducts: ["Mastijet Forte (Intervet)", "Synulox LC (Zoetis)", "Melonex (Intas)", "Iodine Teat Dip"]
  },
  {
    id: "livestock_fever_bloat",
    category: "livestock",
    topics: ["cow", "buffalo", "goat", "fever", "bloat", "digestion", "diarrhea"],
    keywords: ["fever", "bloat", "gas", "cow", "buffalo", "goat", "diarrhea", "bukhar", "افارہ", "بخار", "پیٹ", "دست", "بکری"],
    titleEn: "Livestock Fever, Bloat (افارہ) & Digestive Care",
    titleUr: "جانوروں کا بخار، افارہ (گیس) اور پیٹ کی بیماریاں",
    summaryEn: "High fever, swollen left flank (bloat due to gas buildup), off-feed, or watery diarrhea.",
    summaryUr: "جانور کا بخار سے نڈھال ہونا، پیٹ کے بائیں طرف کا پھولنا (افارہ) یا دست لگنا۔",
    organicEn: "For Bloat: Administer 200ml Mustard oil + 20g Asafoetida (ہینگ) + 50g Black salt in lukewarm water. Drench slowly.\nFor Fever: Wash animal head with cool water and give willow bark / ginger tea.",
    organicUrdu: "افارہ کیلئے: 200 ملی لیٹر سرسوں کا تیل + 20 گرام ہینگ + 50 گرام کالا نمک نیم گرم پانی میں ملا کر پلائیں۔\nبخار کیلئے: جانور کے سر پر ٹھنڈا پانی ڈالیں۔",
    chemicalEn: "For Bloat: Administer Tympol or Bloatosil liquid via oral drench. For Fever: Inject Paracetamol / Ketoprofen / Meloxicam.",
    chemicalUrdu: "افارہ کیلئے: ٹمپول (Tympol) یا بلواٹو سل پلائیں۔ بخار کیلئے پیراسیٹامول یا کیٹوپروفن کا ٹیکہ دیکھیں۔",
    dosageEn: "Tympol: 100ml for large cattle in 500ml water. Ketoprofen: 3ml per 100kg IM.",
    dosageUrdu: "ٹمپول: 100 ملی لیٹر بڑوں کیلئے 500 ملی لیٹر پانی میں۔",
    preventionEn: "Avoid sudden feeding of wet young berseem or rotten fodder. Provide clean drinking water.",
    preventionUrdu: "گیلا یا فنگس زدہ چارہ مت کھلائیں۔ تازہ صاف پانی ہر وقت میسر رکھیں۔",
    localProducts: ["Tympol (ICI)", "Bloatosil (Sami)", "Ketovet (Star)", "Avil Vet"]
  },
  {
    id: "greetings_general",
    category: "general",
    topics: ["hello", "hi", "help", "who", "assalam", "salaam", "azdoc", "fasaldoc"],
    keywords: ["hello", "hi", "help", "who", "assalam", "salaam", "azdoc", "fasaldoc", "سلام", "السلام", "ہیلو", "مدد"],
    titleEn: "AZdoc — Bio-Health AI for Every Living Thing",
    titleUr: "اے زیڈ ڈاک — ہر زندہ مخلوق کا AI صحت معاون",
    summaryEn: "AZdoc is your AI-powered health assistant for humans, livestock, pets, plants and crops.",
    summaryUr: "اے زیڈ ڈاک انسان، مویشی، پالتو جانور، پودوں اور فصلوں کی صحت کا AI معاون ہے۔",
    organicEn: "Ask any question about human symptoms, pet or livestock health, plant problems, crop diseases, fertilizer doses — or snap a photo in the Scan tab for visual diagnosis.",
    organicUrdu: "انسانی علامات، جانوروں کی صحت، پودوں یا فصلوں کی بیماریوں کے بارے میں سوال پوچھیں یا **Scan** بٹن سے تصویر لیں!",
    chemicalEn: "Suggests exact local Pakistani products (Syngenta, Bayer, FMC, Engro, ICI, pharmacies) with dosages.",
    chemicalUrdu: "پاکستانی مارکیٹ کی اصلی ادویات اور درست مقدار بتاتا ہے۔",
    dosageEn: "Always follow recommended application rates per acre / kanal.",
    dosageUrdu: "ایکڑ اور کنال کے حساب سے درست خوراک استعمال کریں۔",
    preventionEn: "Regular health checks, early vaccination for animals and routine crop scouting.",
    preventionUrdu: "باقاعدہ معائنہ، جانوروں کو وقت پر ویکسین اور فصل کا روزانہ جائزہ۔",
    localProducts: ["AZdoc Scan", "AZdoc RAG Engine", "AZdoc Doctors", "Local Pharmacies & Agri Stores"]
  },
  /* ────────── HUMAN HEALTH (HealthDoc) ────────── */
  {
    id: "human_fever_flu",
    category: "human",
    topics: ["human", "fever", "flu", "cold", "cough", "headache"],
    keywords: ["fever", "flu", "cold", "cough", "headache", "body ache", "بخار", "فلو", "زکام", "کھانسی", "سر درد", "نزلا", "بخار ہے"],
    titleEn: "Human Fever & Flu Care",
    titleUr: "بخار اور فلو کی دیکھ بھال",
    summaryEn: "Viral fever/flu: rest, warm fluids, steam, salt-water gargle. Paracetamol 500mg every 6-8h (adults, max 4/day); children 15mg/kg per dose via syrup. Antibiotics only if a doctor confirms bacterial infection.",
    summaryUr: "وائرل بخار: آرام، گرم مائعات، بھاپ اور نمک والے پانی سے غرارے۔ بڑوں کے لیے پیراسیٹامول 500 ملی گرام ہر 6 تا 8 گھنٹے (دن میں زیادہ سے زیادہ 4)؛ بچوں کے لیے شربت 15 ملی گرام فی کلو۔ اینٹی بائیوٹک صرف ڈاکٹر کی تصدیق پر۔",
    organicEn: "Rest and drink plenty of warm fluids. Steam inhalation 2-3 times daily for a blocked nose. Gargle warm salt water for sore throat. Tepid sponging if fever rises.",
    organicUrdu: "آرام کریں اور گرم مائعات کثرت سے پئیں۔ بند ناک کے لیے دن میں 2-3 بار بھاپ لیں۔ گلے کے لیے نمک والے گرم پانی سے غرارے کریں۔",
    chemicalEn: "Paracetamol 500mg (Panadol/Calpol) 1 tab every 6-8h, max 4/day for adults. Cetirizine at night for runny nose. NO antibiotics for viral flu.",
    chemicalUrdu: "پیراسیٹامول 500 ملی گرام ہر 6 تا 8 گھنٹے بعد 1 گولی، بڑوں کے لیے دن میں زیادہ سے زیادہ 4۔ ناک بہنے پر رات کو سیٹرائزین۔",
    dosageEn: "Paracetamol 500mg: 1 tab 6-8h (max 4/day). Children: 15mg/kg/dose syrup.",
    dosageUrdu: "پیراسیٹامول: ہر 6 تا 8 گھنٹے 1 گولی۔ بچے: 15 ملی گرام فی کلو شربت۔",
    preventionEn: "Hand washing, covering sneezes, yearly flu vaccine for elderly and chronic patients.",
    preventionUrdu: "ہاتھ دھونا، چھینکتے وقت منہ ڈھانپنا، بوڑھوں کے لیے سالانہ فلو ویکسین۔",
    localProducts: ["Panadol (GSK)", "Calpol Syrup (GSK)", "Rigix (Getz)", "Cetirizine (local)"]
  },
  {
    id: "human_dengue",
    category: "human",
    topics: ["dengue", "mosquito", "platelet", "high fever"],
    keywords: ["dengue", "mosquito", "platelet", "breakbone", "ڈینگی", "مچھر", "پلیٹ لیٹ", "تپ دق"],
    titleEn: "Dengue Fever — Warning Signs & Care",
    titleUr: "ڈینگی بخار — خبردار علامات اور دیکھ بھال",
    summaryEn: "Sudden high fever (104F), pain behind eyes, severe joint pain, rash. Warning signs: bleeding gums, black stools, severe abdominal pain — hospital immediately. Papaya leaf extract is a traditional platelet support.",
    summaryUr: "اچانک تیز بخار (104)، آنکھوں کے پیچھے درد، جوڑوں کا شدید درد، جلد پر خارش۔ خبردار علامات: مسوڑھوں سے خون، کالا پاخانہ، شدید پیٹ درد — فوری ہسپتال۔",
    organicEn: "Rest, ORS and plenty of fluids. Papaya leaf extract (1 tsp twice daily) as a traditional platelet support. Avoid aspirin/ibuprofen — they worsen bleeding.",
    organicUrdu: "آرام، ORS اور وافر مائعات۔ پپیتے کے پتوں کا رس (1 چائے کا چمچ دن میں دو بار) روایتی پلیٹ لیٹ سپورٹ۔ اسپرین/بروفن سے پرہیز۔",
    chemicalEn: "Paracetamol ONLY for fever in dengue. NO aspirin/brufen (bleeding risk). IV fluids in hospital for warning signs.",
    chemicalUrdu: "ڈینگی میں صرف پیراسیٹامول۔ اسپرین/بروفن ممنوع (خون بہنے کا خطرہ)۔ خبردار علامات پر ہسپتال میں IV سیال۔",
    dosageEn: "Paracetamol 500mg every 6-8h (adults). Platelet monitoring via CBC test every 24-48h.",
    dosageUrdu: "پیراسیٹامول ہر 6 تا 8 گھنٹے۔ CBC ٹیسٹ ہر 24-48 گھنٹے۔",
    preventionEn: "Eliminate standing water around home; use mosquito nets/repellent; full sleeves at dawn/dusk.",
    preventionUrdu: "گھر کے ارد گرد کھڑا پانی ختم کریں؛ مچھر دانی اور اسپرے استعمال کریں؛ صبح و شام آستینیں پہنیں۔",
    localProducts: ["Panadol (GSK)", "ORS Sachets", "Papaya leaf extract", "Mosquito nets/repellents"]
  },
  {
    id: "human_heatstroke",
    category: "human",
    topics: ["heatstroke", "heat exhaustion", "lu lagna", "dehydration"],
    keywords: ["heatstroke", "heat stroke", "heat exhaustion", "lu lagna", "dehydration", "لو لگنا", "لو", "گرمی", "ڈی ہائیڈریشن", "بے ہوشی گرمی"],
    titleEn: "Heatstroke (Lu Lagna) — Emergency First Aid",
    titleUr: "لو لگنا — ہنگامی ابتدائی امداد",
    summaryEn: "Body temperature above 103F, hot red dry skin, confusion, fainting. EMERGENCY: move to shade, cool the body with water + fan, give ORS sips if conscious. NEVER give aspirin/brufen.",
    summaryUr: "جسم کا درجہ حرارت 103 سے اوپر، جلد گرم سرخ خشک، الجھن، بے ہوشی۔ ہنگامی: سایہ میں لے جائیں، پانی سے جسم ٹھنڈا کریں اور پنکھا کریں، ہوش ہو تو ORS کے گھونٹ۔",
    organicEn: "1. Move to shade/cool room. 2. Loosen clothing, lie down. 3. Sponge body with cool water + fan continuously. 4. Small sips of ORS/water if conscious.",
    organicUrdu: "1. سایہ یا ٹھنڈے کمرے میں لے جائیں۔ 2. کپڑے ڈھیلے کریں، لیٹائیں۔ 3. ٹھنڈے پانی سے پونچھتے رہیں اور پنکھا چلائیں۔ 4. ہوش ہو تو ORS کے چھوٹے گھونٹ۔",
    chemicalEn: "No self-medication — severe heatstroke needs hospital IV fluids and cooling. Call Rescue 1122 if unresponsive.",
    chemicalUrdu: "خود دوا ممنوع — شدید لو میں IV سیال اور ہسپتال کی ٹھنڈک ضروری۔ بے ہوشی پر 1122 پر کال کریں۔",
    dosageEn: "ORS: 1 sachet in 1 litre clean water, sip over 1 hour.",
    dosageUrdu: "ORS: 1 سیشٹ 1 لیٹر صاف پانی میں، ایک گھنٹے میں آہستہ پیئیں۔",
    preventionEn: "Avoid outdoor work 11am-4pm in summer; light loose clothes; drink water every 30 minutes even if not thirsty.",
    preventionUrdu: "گرمیوں میں 11 تا 4 دھوپ میں کام نہ کریں؛ ہلکے ڈھیلے کپڑے؛ ہر آدھے گھنٹے پانی پئیں۔",
    localProducts: ["ORS Sachets", "Panadol (fever stage only)", "Cooling towels"]
  },
  {
    id: "human_diarrhea_ors",
    category: "human",
    topics: ["diarrhea", "ors", "food poisoning", "dehydration", "zinc"],
    keywords: ["diarrhea", "diarrhoea", "ors", "food poisoning", "dehydration", "stomach", "اسہال", "دست", "او آر ایس", "فوڈ پوائزننگ", "پیٹ", "قے"],
    titleEn: "Acute Diarrhea & ORS Rehydration",
    titleUr: "اسہال اور ORS سے پانی کی کمی کا علاج",
    summaryEn: "Most important step: ORS after EVERY loose stool. Continue light food (khichri, banana, yogurt). Zinc syrup 20mg/day for 14 days for children over 6 months. Doctor if blood in stool or high fever.",
    summaryUr: "سب سے اہم قدم: ہر دست کے بعد ORS۔ ہلکی غذا جاری رکھیں (کھچڑی، کیلا، دہی)۔ 6 ماہ سے بڑے بچوں کو 14 دن زنک 20 ملی گرام۔ خونی دست یا تیز بخار پر ڈاکٹر۔",
    organicEn: "ORS after every stool. Continue breastfeeding for infants. Eat khichri, banana, yogurt, boiled potatoes. Avoid oily/spicy food.",
    organicUrdu: "ہر دست کے بعد ORS۔ بچوں کو دودھ جاری رکھیں۔ کھچڑی، کیلا، دہی، ابلے آلو کھائیں۔ تیل مرچ والی غذا بند کریں۔",
    chemicalEn: "ORS sachets. Zinc 20mg/day x14 days (children 6m-5y). Racecadotril/loperamide for adults only (NOT for children or bloody stool). Antibiotics only if doctor advises.",
    chemicalUrdu: "ORS سیشٹ۔ زنک 20 ملی گرام روزانہ 14 دن (6 ماہ-5 سال)۔ بڑوں کے لیے ریسکاڈوٹرل (بچوں/خونی دست میں نہیں)۔ اینٹی بائیوٹک صرف ڈاکٹر کے مشورے پر۔",
    dosageEn: "ORS: 1 sachet/L water — children 50-100ml after each stool, adults unlimited sips. Zinc 20mg/day x14d.",
    dosageUrdu: "ORS: 1 سیشٹ فی لیٹر — بچوں کو ہر دست کے بعد 50-100 ملی، بڑے پیئیں۔ زنک 20 ملی گرام روزانہ 14 دن۔",
    preventionEn: "Boiled/filtered water, hand washing, wash fruits/vegetables, cover food from flies.",
    preventionUrdu: "ابلا/فلٹر پانی، ہاتھ دھونا، پھل سبزیاں دھونا، کھانا ڈھانپ کر رکھنا۔",
    localProducts: ["ORS (Watershed/J&J)", "Zinc Syrup", "Smecta", "Enterogermina"]
  },
  {
    id: "human_skin_fungal",
    category: "human",
    topics: ["skin", "ringworm", "dad", "eczema", "fungal"],
    keywords: ["skin", "ringworm", "fungal", "eczema", "dad", "داد", "فنگس", "ایکزیما", "خارش", "جلد", "کھجلی"],
    titleEn: "Fungal Skin Infection (Ringworm/Dad) & Eczema",
    titleUr: "جلد کا فنگس (داد) اور ایکزیما",
    summaryEn: "Ring-shaped scaly itchy rash = tinea (dad). Wash with antifungal soap, dry completely, apply clotrimazole/miconazole cream 2x daily for 2-4 weeks (continue 1 week after it looks healed). Never share towels.",
    summaryUr: "گول خشک خارش والا دائرہ = داد۔ اینٹی فنگل صابن سے دھو کر مکمل خشک کریں، کلوٹریمازول کریم دن میں دو بار 2-4 ہفتے لگائیں (ٹھیک ہونے کے بعد بھی 1 ہفتہ مزید)۔ تولیہ مشترکہ نہ کریں۔",
    organicEn: "Wash daily with antifungal soap; dry skin folds completely; diluted tea-tree oil or fresh aloe vera gel; loose cotton clothes; sun-dry bedding.",
    organicUrdu: "روز اینٹی فنگل صابن سے دھوئیں، جلد کے تہہ دار حصے مکمل خشک کریں، ٹی ٹری آئل/ایلویرا لگائیں، کاٹن کپڑے پہنیں۔",
    chemicalEn: "Clotrimazole/Miconazole cream (Candid/Canesten/Daktarin) on and 2cm beyond the rash, 2x daily for 2-4 weeks. Fluconazole 150mg weekly for 2-4 weeks if widespread (doctor/pharmacist advice).",
    chemicalUrdu: "کلوٹریمازول کریم (کینڈڈ/کینیسٹن) داد سے 2 سینٹی میٹر باہر تک دن میں دو بار 2-4 ہفتے۔ وسیع ہونے پر فلوکونازول 150 ملی گرام ہفتہ وار (مشورہ ضروری)۔",
    dosageEn: "Cream: thin layer 2x daily, 2-4 weeks. Fluconazole 150mg: 1 tab weekly (adults).",
    dosageUrdu: "کریم: پتلی تہ، صبح و شام، 2-4 ہفتے۔ فلوکونازول: ہفتے میں 1 گولی (بڑے)۔",
    preventionEn: "Dry skin folds after bathing; never share towels/combs/shoes; slippers in shared washrooms; wash hands after touching pets with patches.",
    preventionUrdu: "نہانے کے بعد جلد خشک کریں؛ تولیہ/کنگھی/جوتے مشترکہ نہ کریں؛ مشترکہ واش روم میں چپل؛ متاثرہ جانور چھونے کے بعد ہاتھ دھوئیں۔",
    localProducts: ["Candid Cream (Glenmark)", "Canesten (Bayer)", "Daktarin (J&J)", "Antifungal soap (B-Tex)"]
  },
  /* ────────── PETS (PetsDoc) ────────── */
  {
    id: "pet_mange_ticks",
    category: "pet",
    topics: ["dog", "cat", "mange", "ticks", "fleas", "itching"],
    keywords: ["dog", "cat", "mange", "tick", "flea", "itch", "scratch", "کتا", "بلی", "خارش", "چیچر", "پسو", "مینج", "کتے", "بلیوں"],
    titleEn: "Pet Mange, Itching & Tick/Flea Control",
    titleUr: "پالتو جانوروں کی خارش، مینج اور چیچر/پسو کا علاج",
    summaryEn: "Constant scratching, hair loss, scabs = mange or allergy. Ticks = small dark bumps on ears/neck. Isolate the pet, use medicated anti-mange shampoo weekly; treat ALL pets and bedding together.",
    summaryUr: "مسلسل خارش، بال جھڑنا، کھال پر کھال = مینج یا الرجی۔ چیچر = کان/گردن پر سیاہ دانے۔ جانور کو الگ کریں، میڈیکٹڈ شیمپو ہفتہ وار استعمال کریں؛ تمام پالتو اور بسترہ کا ساتھ علاج کریں۔",
    organicEn: "Bathe with medicated anti-mange shampoo weekly. Pick ticks off with tweezers (head included), drop in kerosene/alcohol. Wash bedding on hot cycle; vacuum floors. Neem rinse after shampoo.",
    organicUrdu: "میڈیکٹڈ شیمپو سے ہفتہ وار نہلائیں۔ چیچر چمٹے سے (سر سمیت) کھینچ کر کیروسین میں ڈالیں۔ بسترہ گرم پانی سے دھوئیں۔ شیمپو کے بعد نیم کا پانی لگائیں۔",
    chemicalEn: "Amitraz dip (Taktic, 1ml/L) or Ivermectin (vet dose) for mange. Fipronil spray/drops (Frontline) or Bravecto chew for ticks/fleas. Piriton for allergy itching. NEVER use dog tick products on cats.",
    chemicalUrdu: "مینج کے لیے امیتراز (Taktic) غسل یا آئیورمیکٹن (ویٹ کی خوراک)۔ چیچر/پسو کے لیے فپرونل (Frontline) یا بریویکٹو۔ الرجی کے لیے پیرائٹن۔ کتے کی دوا بلی پر کبھی نہ لگائیں۔",
    dosageEn: "Taktic dip 1ml/L weekly in season. Bravecto: 1 chew per weight band, works 12 weeks (dogs only).",
    dosageUrdu: "Taktic: 1 ملی فی لیٹر، موسم میں ہفتے وار۔ بریویکٹو: وزن کے مطابق 1 چیو، 12 ہفتے تحفظ (صرف کتے)۔",
    preventionEn: "Monthly tick prevention in summer; keep bedding clean/dry; avoid stray contact; deworm regularly.",
    preventionUrdu: "گرمیوں میں ماہانہ چیچر روک دوا؛ بسترہ صاف خشک رکھیں؛ آوارہ جانوروں سے دور رکھیں؛ کیڑوں کی دوا باقاعدہ۔",
    localProducts: ["Frontline Spray (Merial)", "Bravecto (MSD)", "Taktic (Amitraz)", "Anti-mange shampoo", "Piriton (GSK)"]
  },
  {
    id: "pet_parvo_vomiting",
    category: "pet",
    topics: ["puppy", "parvo", "vomiting", "diarrhea", "not eating"],
    keywords: ["parvo", "parvovirus", "vomit", "vomiting", "diarrhea", "puppy", "not eating", "قے", "اسہال", "پیروو", "پٹھا", "بخار کتا"],
    titleEn: "Puppy Vomiting, Diarrhea & Parvovirus Danger",
    titleUr: "کتے کی قے، اسہال اور پیروو وائرس کا خطرہ",
    summaryEn: "Vomiting + bloody diarrhea + refusal to eat in an unvaccinated puppy = PARVO EMERGENCY — same-day vet visit, this kills fast. Until the vet: nothing to eat 6h, then tiny sips of water/ORS; keep warm.",
    summaryUr: "غیر ویکسینیٹڈ پٹھے میں قے + خونی اسہال + کھانا چھوڑنا = پیروو ایمرجنسی — اسی دن ویٹ کے پاس جائیں۔ ویٹ تک: 6 گھنٹے کچھ نہ کھلائیں، پھر پانی/ORS کے چھوٹے گھونٹ؛ گرم رکھیں۔",
    organicEn: "Withhold food 6 hours, then small sips of water or ORS every 15 minutes. Keep the puppy warm and isolated. Disinfect floors with bleach solution — parvo survives in soil for months.",
    organicUrdu: "6 گھنٹے خوراک بند، پھر ہر 15 منٹ بعد پانی/ORS کے چھوٹے گھونٹ۔ پٹھے کو گرم اور الگ رکھیں۔ فرش بلیچ محلول سے دھوئیں — پیرowo مٹی میں مہینوں زندہ رہتا ہے۔",
    chemicalEn: "VET EMERGENCY: IV fluids + anti-emetic (ondansetron/maropitant) + antibiotics for secondary infection. Home care alone is usually fatal in puppies.",
    chemicalUrdu: "ویٹ ایمرجنسی: IV سیال + قے روک دوا + ثانوی انفیکشن کے لیے اینٹی بائیوٹک۔ گھر کا علاج اکثر مہلک۔",
    dosageEn: "Ondansetron 0.5-1mg/kg (vet supervision). IV fluids: vet administered.",
    dosageUrdu: "اونڈانسیٹرون 0.5-1 ملی گرام فی کلو (صرف ویٹ)۔ IV سیال: ویٹ لگائے۔",
    preventionEn: "DHPPi vaccine series starting at 6-8 weeks until 16 weeks; no street walks until fully vaccinated; yearly booster.",
    preventionUrdu: "6-8 ہفتے سے DHPPi سیریز 16 ہفتے تک مکمل کرائیں؛ مکمل ویکسین تک گلی نہ دکھائیں؛ سالانہ بوسٹر۔",
    localProducts: ["DHPPi vaccine (vet)", "Pro-Kolin paste", "Electral/ORS", "Bleach disinfectant"]
  },
  /* ────────── PLANTS (PlantDoc) ────────── */
  {
    id: "plant_aphids_mealybug",
    category: "plant",
    topics: ["plant", "aphid", "mealybug", "whitefly", "pests"],
    keywords: ["plant", "aphid", "mealybug", "whitefly", "pest", "مہنگ", "ملی بگ", "پودا", "کیڑے", "پتوں پر کیڑے", "پودوں"],
    titleEn: "Houseplant Aphids, Mealybugs & Whitefly Control",
    titleUr: "گھریلو پودوں کے مہنگ، ملی بگ اور سفید مکھی کا علاج",
    summaryEn: "Clusters of small green/white insects on new growth, sticky honeydew, ants farming them. Organic first: strong water spray, neem oil 5ml/L weekly, insecticidal soap. Isolate the plant immediately.",
    summaryUr: "نئی شاخوں پر چھوٹے سبز/سفید کیڑوں کے جھنڈ، چپچپا مواد، چیونٹیاں۔ پہلے قدرتی: زور دار پانی کا چھڑکاؤ، نیم آئل 5 ملی فی لیٹر ہفتہ وار، صابن والا پانی۔ پودا فوری الگ کریں۔",
    organicEn: "1. Blast aphids off with a strong water jet. 2. Spray neem oil 5ml/L + drop of soap weekly, evening only. 3. Dab mealybug clusters with 70% alcohol cotton bud. 4. Isolate plant; control ants.",
    organicUrdu: "1. تیز پانی سے مہنگ اُڑا دیں۔ 2. نیم آئل 5 ملی فی لیٹر + صابن ہفتہ وار، صرف شام۔ 3. ملی بگ کے جھنڈ الکحل والی روئی سے صاف کریں۔ 4. پودا الگ کریں؛ چیونٹیاں کنٹرول کریں۔",
    chemicalEn: "Imidacloprid or Acetamiprid spray for heavy infestations; insecticidal soap for indoors. Repeat after 7-10 days for hatching eggs.",
    chemicalUrdu: "شدید حملے پر ایمڈاکلپورڈ یا ایسیٹامپریڈ؛ اندر کے لیے کیڑے مار صابن۔ انڈوں کے لیے 7-10 دن بعد دہرائیں۔",
    dosageEn: "Imidacloprid 200 SL: 1.5ml/L spray. Neem oil: 5ml/L, evening only.",
    dosageUrdu: "ایمڈاکلپورڈ: 1.5 ملی فی لیٹر۔ نیم آئل: 5 ملی فی لیٹر، شام کو۔",
    preventionEn: "Quarantine new plants 2 weeks; avoid excess nitrogen; weekly inspection of new growth; yellow sticky traps.",
    preventionUrdu: "نئے پودے 2 ہفتے الگ رکھیں؛ نائٹروجن کم کریں؛ نئی شاخوں کا ہفتہ وار معائنہ؛ پیلا جال۔",
    localProducts: ["Confidor 200 SL", "Neem oil (local)", "Insecticidal soap", "Yellow sticky traps"]
  },
  {
    id: "plant_leaf_spot_root_rot",
    category: "plant",
    topics: ["plant", "leaf spot", "root rot", "yellowing", "overwatering"],
    keywords: ["plant", "leaf spot", "root rot", "yellow", "overwater", "پودا", "دھبے", "پیلے پتے", "جڑ سڑن", "زیادہ پانی", "گملا"],
    titleEn: "Plant Leaf Spot, Yellowing & Root Rot",
    titleUr: "پودوں کے پتوں کے دھبے، پیلاپن اور جڑ سڑن",
    summaryEn: "Brown spots with yellow halo = fungal leaf spot: remove ALL spotted leaves, water at soil level, copper/chlorothalonil spray. Yellowing + wilting despite wet soil + sour smell = root rot: stop watering, cut rotten roots, repot in dry fresh mix.",
    summaryUr: "پیلا حاشیہ والے دھبے = فنگل: تمام داغ دار پتے کاٹیں، مٹی پر پانی دیں، کاپر اسپرے۔ گیلی مٹی کے باوجود پیلاپن + بدبو = جڑ سڑن: پانی بند کریں، گلی جڑیں کاٹیں، خشک نئی مٹی میں ری پوٹ کریں۔",
    organicEn: "Leaf spot: remove affected leaves, improve airflow, baking soda 1g/L + soap weekly. Root rot: unpot, wash roots, cut all soft/brown roots, repot in fresh dry mix with drainage, withhold water 5-7 days, cinnamon on cuts.",
    organicUrdu: "دھبے: متاثرہ پتے کاٹیں، ہوا کا راستہ رکھیں، بیکنگ سوڈا 1 گرام فی لیٹر ہفتہ وار۔ جڑ سڑن: پودا نکالیں، جڑیں دھو کر نرم/بھوری کاٹ دیں، نئی خشک مٹی میں ری پوٹ کریں، 5-7 دن پانی نہ دیں، کٹی جگہ دار چینی۔",
    chemicalEn: "Chlorothalonil or copper oxychloride 2g/L spray for leaf spot, repeat 10-14 days. Fungicide drench (Metalaxyl/carbendazim) after repotting for root rot. Fix drainage first.",
    chemicalUrdu: "دھبوں کے لیے کلوروتھالونل یا کاپر 2 گرام فی لیٹر، 10-14 دن بعد دہرائیں۔ جڑ سڑن کے بعد ریڈومل/کاربینڈازم مٹی میں ڈالیں۔ پہلے نکاسی درست کریں۔",
    dosageEn: "Copper oxychloride: 2-2.5g/L evening spray. Ridomil: 2g/L drench once after repotting.",
    dosageUrdu: "کاپر آکسی کلورائیڈ: 2-2.5 گرام فی لیٹر، شام کو۔ ریڈومل: 2 گرام فی لیٹر، ری پوٹ کے بعد ایک بار۔",
    preventionEn: "Water only when top 2cm soil is dry; morning watering; pots with drainage holes; never leave water standing in saucers.",
    preventionUrdu: "اوپر کی 2 سینٹی مٹی خشک ہو تب ہی پانی دیں؛ صبح پانی دیں؛ نکاسی والے گملے؛ ساس میں پانی جمع نہ ہونے دیں۔",
    localProducts: ["Dithane M-45", "Blue Copper", "Champion WP", "Fresh potting mix + perlite", "Neem oil"]
  }
];

const DOMAIN_CATEGORIES = {
  crop: ["crop", "general_agri", "general"],
  livestock: ["livestock", "general"],
  human: ["human", "general"],
  pet: ["pet", "general"],
  plant: ["plant", "general"],
};

export function searchKnowledgeBase(query, domain = null) {
  const q = (query || "").toLowerCase();
  // Strict isolation: only retrieve entries the active domain is allowed to see.
  const allowed = DOMAIN_CATEGORIES[domain] ?? null;
  const tokens = q.split(/[\s,.;:!?()"\-]+/).filter((t) => t.length > 2);

  // Meaningful-substring match only — a 2-char keyword like "hi" must not
  // match inside unrelated words such as "child" or "which".
  const kwMatch = (kw, token) => {
    const k = kw.toLowerCase();
    if (k.length < 3 || token.length < 3) return false;
    return k.includes(token) || token.includes(k);
  };

  const scored = KNOWLEDGE_BASE.map((item) => {
    let score = 0;
    for (const token of tokens) {
      if (item.keywords.some((kw) => kwMatch(kw, token))) {
        score += 4;
      }
      if (token.length >= 4 && item.topics.some((tp) => tp.toLowerCase().includes(token))) {
        score += 5;
      }
      if (token.length >= 4 && (item.titleEn.toLowerCase().includes(token) || item.titleUr.includes(token))) {
        score += 6;
      }
      if (token.length >= 4 && (item.summaryEn.toLowerCase().includes(token) || item.summaryUr.includes(token))) {
        score += 3;
      }
    }
    return { item, score };
  });

  const matches = scored
    .filter((s) => s.score > 0 && (!allowed || allowed.includes(s.item.category)))
    .map((s) => s.item);
  if (matches.length > 0) return matches;
  return [KNOWLEDGE_BASE.find((k) => k.id === "greetings_general") || KNOWLEDGE_BASE[0]];
}

export function generateRAGAnswer(query, lang = "en", domain = null) {
  const matches = searchKnowledgeBase(query, domain);
  const primary = matches[0];
  const isUr = lang === "ur" || /[\u0600-\u06FF]/.test(query || "");

  // Greetings check — word-boundary regex so "child"/"which" don't trigger it
  const qLower = (query || "").toLowerCase();
  const isGreeting =
    /\b(hi|hello|hey|assalam|as salam|salaam|salam|who are you)\b/.test(qLower) ||
    qLower.includes("سلام") ||
    qLower.includes("ہیلو");
  if (isGreeting) {
    // Domain-scoped greeting — the AI Doctor greets ONLY for its own domain.
    if (domain === "human") {
      return isUr
        ? `🩺 **السلام علیکم! میں آپ کا اے زیڈ ڈاک ہیلتھ معاون ہوں** 🩺\n\n` +
          `بخار، فلو، جلد (داد/ایکزیما)، گلا، آنکھ، پیٹ، ابتدائی امداد یا ویکسینیشن شیڈول — کچھ بھی پوچھیں۔\n\n` +
          `⚠️ میں ڈاکٹر نہیں — تشخیص کے لیے **Doctors** ٹیب سے بکنگ کریں۔ ایمرجنسی میں **1122** پر کال کریں۔\n\n` +
          `💡 *بصری معائنہ کے لیے نیچے **Scan** بٹن استعمال کریں۔*`
        : `🩺 **Assalam-o-Alaikum! I'm your AZdoc Health Assistant** 🩺\n\n` +
          `Ask me about fever, flu, skin (ringworm/eczema), throat, eyes, stomach, first aid or vaccination schedules.\n\n` +
          `⚠️ I'm not a doctor — book via the **Doctors** tab for diagnosis. For emergencies call **1122**.\n\n` +
          `💡 *Use the **Scan** button below for visual analysis!*`;
    }
    if (domain === "pet") {
      return isUr
        ? `🐾 **السلام علیکم! میں آپ کا اے زیڈ ڈاک پیٹ معاون ہوں** 🐾\n\n` +
          `کتے، بلی اور پرندوں کی خارش، چیچر/پسو، قے/اسہال، خوراک، ویکسین اور کیڑوں کی دوا — کچھ بھی پوچھیں۔\n\n` +
          `💡 *متاثرہ جگہ کی تصویر **Scan** بٹن سے بھیجیں۔*`
        : `🐾 **Assalam-o-Alaikum! I'm your AZdoc Pet Assistant** 🐾\n\n` +
          `Ask me about dogs, cats & birds — itching, ticks/fleas, vomiting, feeding, vaccination and deworming.\n\n` +
          `💡 *Snap the affected area via the **Scan** button below!*`;
    }
    if (domain === "plant") {
      return isUr
        ? `🪴 **السلام علیکم! میں آپ کا اے زیڈ ڈاک پلانٹ معاون ہوں** 🪴\n\n` +
          `پتوں کے دھبے، پیلے پتے، مہنگ/ملی بگ، جڑ سڑن، پانی اور دیکھ بھال — کچھ بھی پوچھیں۔\n\n` +
          `💡 *پودے کی تصویر **Scan** بٹن سے بھیجیں۔*`
        : `🪴 **Assalam-o-Alaikum! I'm your AZdoc Plant Assistant** 🪴\n\n` +
          `Ask me about leaf spots, yellowing, aphids/mealybugs, root rot, watering and plant care.\n\n` +
          `💡 *Snap your plant via the **Scan** button below!*`;
    }
    if (domain === "livestock") {
      return isUr
        ? `🐄 **السلام علیکم! میں آپ کا اے زیڈ ڈاک لائیوسٹاک معاون ہوں** 🐄\n\n` +
          `گائے، بھینس، بکری اور مرغی — بخار، منہ کھر، سڑو، افارہ، کیڑے اور ویکسین شیڈول پوچھیں۔\n\n` +
          `💡 *متاثرہ جانور کی تصویر **Scan** بٹن سے بھیجیں۔*`
        : `🐄 **Assalam-o-Alaikum! I'm your AZdoc Livestock Assistant** 🐄\n\n` +
          `Ask me about cattle, buffalo, goats & poultry — fever, FMD, mastitis, bloat, worms and vaccination schedules.\n\n` +
          `💡 *Snap the affected animal via the **Scan** button below!*`;
    }
    return isUr
      ? `🌾 **السلام علیکم! میں آپ کا اے زیڈ ڈاک کراپ معاون ہوں** 🌾\n\n` +
        `گندم، دھان، کپاس، مکئی، ٹماٹر، آلو — بیماریاں، کیڑے، فی ایکڑ کھاد اور گیلے کھیت کی بحالی پوچھیں۔\n\n` +
        `💡 *متاثرہ پتوں کی تصویر **Scan** بٹن سے بھیجیں۔*`
      : `🌾 **Assalam-o-Alaikum! I'm your AZdoc Crop Assistant** 🌾\n\n` +
        `Ask me about wheat, rice, cotton, maize, tomato, potato — diseases, pests, per-acre fertilizer doses and wet-field recovery.\n\n` +
        `💡 *Snap affected leaves via the **Scan** button below!*`;
  }

  // Domain-aware offline fallback — never answer a human/pet/plant question
  // with an unrelated crop/livestock catalogue entry.
  const DOMAIN_FALLBACKS = {
    human: isUr
      ? `🧑‍⚕️ **AZdoc ابتدائی طبی رہنمائی (آف لائن موڈ)**\n\n` +
        `باقاعدہ نگہداشت کے اصول:\n1. آرام اور وافر پانی/ORS۔\n2. بخار پر ٹھنڈی پٹی اور ضرورت پر پیراسیٹامول (خوراک دیکھیں)。\n3. زخم/جلد: صاف رکھیں، خشک رکھیں، کھرچنے سے بچیں۔\n\n` +
        `⚠️ **اہم:** یہ ابتدائی رہنمائی ہے، طبی تشخیص نہیں۔ تصدیق کے لیے **Doctors** ٹیب سے لائسنس یافتہ ڈاکٹر سے بک کریں۔ سانس کی تکلیف، بے ہوشی، شدید خون بہاؤ یا درد میں فوری **Rescue 1122** پر کال کریں۔`
      : `🧑‍⚕️ **AZdoc Preliminary Health Guidance (Offline Mode)**\n\n` +
        `General first-aid principles:\n1. Rest and plenty of fluids (ORS for dehydration).\n2. For fever: cool compress; paracetamol only if needed and dosed correctly.\n3. Wounds/skin: keep clean and dry, avoid scratching.\n\n` +
        `⚠️ **Important:** This is preliminary guidance, not a medical diagnosis. Book a licensed doctor in the **Doctors** tab. For breathing difficulty, unconsciousness, severe bleeding or pain — call **Rescue 1122** immediately.`,
    pet: isUr
      ? `🐾 **AZdoc پالتو جانور رہنمائی (آف لائن موڈ)**\n\n` +
        `عمومی دیکھ بھال:\n1. متاثرہ جگہ صاف رکھیں، بانڈیج/خارش پر نہ گھسیٹیں۔\n2. کیڑوں (ٹکس) کا معائنہ کریں اور میڈیکٹڈ شیمپو استعمال کریں۔\n3. کھانا پانی الگ رکھیں، دوسرے جانوروں سے دور رکھیں۔\n\n` +
        `⚠️ **اہم:** ویکسینیشن اور ریبز کے لیے ڈاکٹر سے ملاقات ضروری ہے — **Doctors** ٹیب سے Pet Vet بک کریں۔`
      : `🐾 **AZdoc Pet Care Guidance (Offline Mode)**\n\n` +
        `General care:\n1. Keep affected skin clean; use a medicated (anti-mange) shampoo.\n2. Check for ticks/fleas; treat bedding.\n3. Isolate from other pets; ensure food & water hygiene.\n\n` +
        `⚠️ **Important:** Vaccination and rabies concerns need an in-person vet — book a **Pet Vet** in the Doctors tab.`,
    plant: isUr
      ? `🪴 **AZdoc پودوں کی رہنمائی (آف لائن موڈ)**\n\n` +
        `عمومی تدابیر:\n1. متاثرہ پتے کاٹ کر ہٹائیں اور ہوا کی گردن بہتر کریں۔\n2. پہلے نیم کا تیل (5ml/L) جیسے قدرتی علاج آزمائیں۔\n3. پانی صبح دیں، پتوں پر رات کو پانی نہ رکھیں۔\n\n` +
        `⚠️ مصدقہ مصنوعات ہی استعمال کریں — Medicine Store میں دستیاب ہیں۔`
      : `🪴 **AZdoc Plant Care Guidance (Offline Mode)**\n\n` +
        `General steps:\n1. Prune and remove affected leaves; improve air circulation.\n2. Try organic treatments first (neem oil 5ml/L, weekly).\n3. Water in the morning; avoid wet leaves overnight.\n\n` +
        `⚠️ Use approved products only — see the Medicine Store.`,
  };

  // Domain-aware offline fallback — the offline catalogue only covers crops
  // and livestock, so for human/pet/plant domains an unrelated match must
  // never be shown. Return domain-appropriate guidance instead.
  // Strict isolation final guard: the retrieval is already domain-filtered, so if
  // the best match is only the generic greeting card, answer with the domain's
  // own offline fallback instead of an all-domains summary.
  const isGeneralCard = primary?.id === "greetings_general";
  if (isGeneralCard && domain && DOMAIN_FALLBACKS[domain]) {
    return DOMAIN_FALLBACKS[domain];
  }

  if (isUr) {
    return `🌍 **AZdoc AI RAG تجاویز & ماہرانہ رہنما** 🌍\n\n` +
      `📌 **تشخیص / موضوع:** ${primary.titleUr}\n\n` +
      `📝 **صورتحال کا خلاصہ:**\n${primary.summaryUr}\n\n` +
      `🌿 **قدرتی و روایتی علاج (Organic Remedy):**\n${primary.organicUrdu}\n\n` +
      `🧪 **کیمیائی علاج اور مقامی ادویات (Chemical & Products):**\n${primary.chemicalUrdu}\n\n` +
      `💊 **خوراک / مقدار (Dosage):**\n${primary.dosageUrdu}\n\n` +
      `🛍️ **پاکستان میں دستیاب کیمیائی برانڈز:**\n${primary.localProducts.map(p => `• ${p}`).join("\n")}\n\n` +
      `🛡️ **حفاظتی تدابیر (Prevention):**\n${primary.preventionUrdu}\n\n` +
      `💡 *بہترین اور 100٪ درست تشخیص کے لیے **Scan** ٹیب پر جا کر متاثرہ فصل یا جانور کی تصویر بھیجیں!*`;
  }

  return `🌍 **AZdoc AI RAG Verified Advisory** 🌍\n\n` +
    `📌 **Topic / Diagnosis:** ${primary.titleEn}\n\n` +
    `📝 **Assessment Summary:**\n${primary.summaryEn}\n\n` +
    `🌿 **Organic / Traditional Remedy:**\n${primary.organicEn}\n\n` +
    `🧪 **Chemical Treatment & Local Products:**\n${primary.chemicalEn}\n\n` +
    `💊 **Recommended Dosage:**\n${primary.dosageEn}\n\n` +
    `🛍️ **Recommended Brands (Pakistan):**\n${primary.localProducts.map(p => `• ${p}`).join("\n")}\n\n` +
    `🛡️ **Prevention & Management:**\n${primary.preventionEn}\n\n` +
    `💡 *For instant visual diagnosis, tap the **Scan** tab below and capture a photo!*`;
}
