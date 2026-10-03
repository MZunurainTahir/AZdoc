import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { supabase, Diagnosis } from "../lib/supabase";
import { db, isOnline } from "../lib/db";
import { Camera, ChevronRight, Activity, TrendingUp, HeartPulse, Plus, WifiOff, BookOpen, Calculator, Presentation, Clock, CloudRain, TrendingDown, Minus, Droplets, Thermometer, Wind, MapPin, Stethoscope, Pill, Landmark, Video, Phone } from "lucide-react";
import { useDomain } from "../context/DomainContext";
import { asDomainId, getDomain } from "../lib/domains";
import { getCurrentMockWeather, fetchCurrentWeather, computeDomainRisk, riskColor, type WeatherSnapshot } from "../lib/weather";
import { getPricesByProvince, getLivestockPricesByProvince, PLANT_RETAIL_PRICES, PET_RETAIL_PRICES, trendSymbol, trendClass, type CommodityPrice } from "../lib/marketPrices";
import { MEDICINES } from "../lib/pharmacy";
import { getSelectedCity, setSelectedCity } from "../lib/farmProfile";
import { detectNearestCity } from "../lib/weather";
import { SkeletonList } from "../components/Skeleton";

export default function HomeScreen() {
  const { t, lang } = useLanguage();
  const { user, profile } = useAuth();
  const { domain } = useDomain();
  const navigate = useNavigate();
  const [recentDiagnoses, setRecentDiagnoses] = useState<Diagnosis[]>([]);
  const [activeCaseTypes, setActiveCaseTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingCached, setUsingCached] = useState(false);
  const [selectedCity, setCity] = useState(getSelectedCity);
  const [weather, setWeather] = useState<WeatherSnapshot>(() => getCurrentMockWeather(selectedCity));
  const [weatherLoading, setWeatherLoading] = useState(true);
  const riskAdvisory = computeDomainRisk(weather, domain.id);

  // Everything below is scoped to the ACTIVE domain so each AZdoc app
  // (FasalDoc / StockDoc / PetsDoc / HealthDoc / PlantDoc) shows its own numbers.
  const domainScans = useMemo(
    () => recentDiagnoses.filter((d) => asDomainId((d as any).type) === domain.id),
    [recentDiagnoses, domain.id],
  );
  const domainActiveCases = useMemo(
    () => activeCaseTypes.filter((t) => asDomainId(t) === domain.id).length,
    [activeCaseTypes, domain.id],
  );
  const domainRates = useMemo<CommodityPrice[]>(() => {
    switch (domain.id) {
      case "crop":
        return getPricesByProvince(selectedCity.province);
      case "livestock":
        return getLivestockPricesByProvince(selectedCity.province);
      case "plant":
        return PLANT_RETAIL_PRICES;
      case "pet":
        return PET_RETAIL_PRICES;
      case "human":
        // Human domain has no mandi — surface medicine prices instead.
        return MEDICINES.filter((m) => m.domain === "human").map((m) => ({
          id: m.id,
          nameEn: m.name,
          nameUr: m.nameUrdu,
          unit: m.unit,
          unitUr: m.unit,
          avgPrice: m.pricePkr,
          minPrice: m.pricePkr,
          maxPrice: m.pricePkr,
          trend: "stable" as const,
          trendPercent: 0,
          updatedAt: "Today",
          market: "Pharmacy",
          province: "punjab" as const,
        }));
    }
  }, [domain.id, selectedCity.province]);
  const ratesTitle = useMemo(() => {
    if (domain.id === "crop") {
      return lang === "ur"
        ? `${selectedCity.province === "punjab" ? "پنجاب" : "صوبہ"} کے منڈی ریٹ`
        : `${selectedCity.province.charAt(0).toUpperCase() + selectedCity.province.slice(1)} Mandi Rates`;
    }
    if (domain.id === "livestock") return lang === "ur" ? "مویشیوں کے منڈی ریٹ" : "Livestock Mandi Rates";
    if (domain.id === "pet") return lang === "ur" ? "پالتو جانوروں کے ریٹ" : "Pet Care Prices";
    if (domain.id === "plant") return lang === "ur" ? "نرسری کے ریٹ" : "Nursery Prices";
    return lang === "ur" ? "دواؤں کے ریٹ" : "Medicine Prices";
  }, [domain.id, lang, selectedCity.province]);

  useEffect(() => {
    let mounted = true;
    setWeatherLoading(true);
    fetchCurrentWeather(selectedCity).then((snapshot) => {
      if (!mounted) return;
      if (snapshot) setWeather(snapshot);
      else setWeather(getCurrentMockWeather(selectedCity));
      setWeatherLoading(false);
    });
    return () => { mounted = false; };
  }, [selectedCity]);

  const detectLocation = async () => {
    const nearest = await detectNearestCity();
    if (nearest) {
      setSelectedCity(nearest);
      setCity(nearest);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setUsingCached(false);

    try {
      // Always read local IndexedDB first (unsynced scans live here).
      let localDiagnoses: any[] = [];
      try {
        localDiagnoses = await db.diagnoses
          .orderBy("created_at")
          .reverse()
          .toArray();
      } catch (dbErr) {
        console.warn("[HomeScreen] IndexedDB read failed:", dbErr);
      }

      // Restrict to the current user's scans so multiple accounts on the same
      // device do not see each other's history. Demo user id is also valid.
      const userLocalDiagnoses = user
        ? localDiagnoses.filter(d => d.user_id === user.id)
        : localDiagnoses;

      // Secondary mirror: localStorage fallback used when IndexedDB fails.
      let legacyScans: any[] = [];
      try {
        const stored = localStorage.getItem("fasaldoc_scan_history");
        if (stored) {
          const parsed = JSON.parse(stored);
          legacyScans = Array.isArray(parsed)
            ? parsed.filter((s: any) => {
                if (!s || (!s.id && !s.localId)) return false;
                if (s.user_id && user && s.user_id !== user.id) return false;
                if (!s.disease && !s.predicted_disease) return false;
                if (!s.date && !s.created_at) return false;
                return true;
              })
            : [];
        }
      } catch { /* ignore */ }

      // Merge IndexedDB + localStorage, preferring IndexedDB when ids overlap.
      const localById = new Map<string, any>();
      for (const d of [...userLocalDiagnoses, ...legacyScans]) {
        const key = d.id || d.localId;
        if (key && !localById.has(key)) {
          localById.set(key, d);
        }
      }
      const mergedLocalDiagnoses = Array.from(localById.values());

      let mergedDiagnoses = [...mergedLocalDiagnoses];

      if (isOnline() && user) {
        try {
          // Fetch remote diagnoses from Supabase.
          const { data: remoteDiagnoses } = await supabase
            .from('diagnoses')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (remoteDiagnoses) {
            // Remote rows + any local rows that are not yet synced.
            const unsyncedLocal = mergedLocalDiagnoses.filter(d => !d._synced);
            mergedDiagnoses = [...remoteDiagnoses, ...unsyncedLocal];
          }

          // Active recovery cases from Supabase (keep domain type for per-domain stats).
          const { data: casesData } = await supabase
            .from('recovery_cases')
            .select('*, diagnosis:diagnosis_id(type)')
            .eq('user_id', user.id)
            .eq('status', 'active');

          // Also collect local active cases for offline-created recoveries.
          let localCaseTypes: string[] = [];
          try {
            const localActiveCasesList = await db.recoveryCases
              .where("status")
              .equals("active")
              .toArray();
            const userLocalCases = localActiveCasesList.filter(c => c.user_id === user.id);
            localCaseTypes = userLocalCases.map((c) => {
              const linked = mergedDiagnoses.find(
                (d: any) => d.id === c.diagnosis_id || d.localId === c.diagnosis_localId,
              );
              return (linked as any)?.type ?? "";
            });
          } catch { /* ignore */ }

          setActiveCaseTypes([
            ...(casesData ?? []).map((c: any) => c?.diagnosis?.type ?? ""),
            ...localCaseTypes,
          ]);
        } catch (remoteErr) {
          console.warn("[HomeScreen] Remote fetch failed — using local data:", remoteErr);
          setUsingCached(true);
        }
      } else {
        // Offline: active cases come purely from local storage.
        let localCaseTypes: string[] = [];
        if (user) {
          try {
            const localActiveCasesList = await db.recoveryCases
              .where("status")
              .equals("active")
              .toArray();
            const userLocalCases = localActiveCasesList.filter(c => c.user_id === user.id);
            localCaseTypes = userLocalCases.map((c) => {
              const linked = mergedDiagnoses.find(
                (d: any) => d.id === c.diagnosis_id || d.localId === c.diagnosis_localId,
              );
              return (linked as any)?.type ?? "";
            });
          } catch { /* ignore */ }
        }
        setActiveCaseTypes(localCaseTypes);
      }

      // Deduplicate by canonical id then sort by date (newest first).
      const seen = new Set<string>();
      const deduped = mergedDiagnoses.filter((d) => {
        const key = d.id;
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      deduped.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setRecentDiagnoses(deduped as Diagnosis[]);
    } catch (err) {
      console.error("[HomeScreen] Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const greeting = lang === "ur"
    ? `السلام علیکم, ${profile?.full_name || ''}`
    : `Assalam-o-Alaikum, ${profile?.full_name || 'Friend'}`;

  const dateStr = new Date().toLocaleDateString(lang === "ur" ? "ur-PK" : "en-IN", {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="flex flex-col flex-1 bg-bg-primary pb-4">
      {/* Greeting Section */}
      <div className="px-5 pt-4 pb-2 flex items-start justify-between gap-3">
        <div>
          <p className="text-text-muted text-sm font-medium">{dateStr}</p>
          <h1 className="text-xl font-heading font-bold text-text-primary mt-0.5">
            {greeting.split(',')[0]}<span className="text-primary">,</span>
            <br />
            <span className="text-lg">{greeting.split(',')[1]}</span>
          </h1>
        </div>
        <button
          onClick={detectLocation}
          className="shrink-0 flex items-center gap-1 px-3 py-2 bg-bg-elevated border border-border rounded-xl text-[10px] font-bold text-text-muted hover:border-primary/30 hover:text-primary transition-colors"
        >
          <MapPin className="w-3.5 h-3.5" />
          {selectedCity.nameEn}
        </button>
      </div>

      {/* Offline cached indicator */}
      {usingCached && (
        <div className="mx-5 mb-3 px-3 py-2 bg-warning-bg border border-warning/20 rounded-xl flex items-center gap-2">
          <WifiOff className="w-3.5 h-3.5 text-warning shrink-0" />
          <p className="text-xs text-warning font-medium">{t('offline.dataFromCache')}</p>
        </div>
      )}

      {/* Per-domain brand banner — FasalDoc / StockDoc / PetsDoc / HealthDoc / PlantDoc */}
      <div className="px-5 mb-4">
        <div className={`bg-gradient-to-r rounded-2xl p-4 shadow-lg animate-scaleIn ${domain.theme.gradient}`}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shrink-0">
              <span className="text-white text-xl">{domain.emoji}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-heading font-bold text-base leading-tight">
                {lang === "ur" ? domain.brandNameUrdu : domain.brandName}
              </p>
              <p className="text-white/85 text-[11px] leading-snug">{lang === "ur" ? domain.taglineUrdu : domain.tagline}</p>
              <p className="text-white/60 text-[9px] mt-0.5 uppercase tracking-wide">Powered by AZdoc</p>
            </div>
            <button
              onClick={() => navigate("/domain")}
              className="shrink-0 flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white px-2.5 py-1.5 rounded-full text-[10px] font-bold transition-transform active:scale-95"
            >
              <span className="text-xs leading-none">{domain.emoji}</span>
              <span className="max-w-16 truncate">{lang === "ur" ? domain.nameUrdu : domain.name}</span>
            </button>
          </div>
          {/* Care services quick actions */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            <button
              onClick={() => navigate("/doctors")}
              className="bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-xl px-3 py-2.5 flex items-center gap-2 transition-colors text-start"
            >
              <Stethoscope className="w-4 h-4 text-white shrink-0" />
              <div className="min-w-0">
                <p className="text-white font-bold text-[11px] leading-tight">{t('doctors.title')}</p>
                <p className="text-white/70 text-[9px] leading-tight">{lang === "ur" ? "ون ٹو ون سیشن" : "1-on-1 sessions"}</p>
              </div>
            </button>
            <button
              onClick={() => navigate("/pharmacy")}
              className="bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-xl px-3 py-2.5 flex items-center gap-2 transition-colors text-start"
            >
              <Pill className="w-4 h-4 text-white shrink-0" />
              <div className="min-w-0">
                <p className="text-white font-bold text-[11px] leading-tight">{t('pharmacy.title')}</p>
                <p className="text-white/70 text-[9px] leading-tight">{lang === "ur" ? "کیش آن ڈیلیوری" : "Cash on delivery"}</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="px-5 mt-2 mb-5">
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-bg-elevated rounded-2xl p-3.5 border border-border shadow-sm">
            <div className="w-8 h-8 bg-primary-bg rounded-xl flex items-center justify-center mb-2">
              <Camera className="w-4 h-4 text-primary" />
            </div>
            <p className="text-lg font-bold text-text-primary animate-countUp">{domainScans.length}</p>
            <p className="text-xs text-text-muted">{lang === "ur" ? `${domain.nameUrdu} اسکین` : `${domain.name} scans`}</p>
          </div>
          <div className="bg-bg-elevated rounded-2xl p-3.5 border border-border shadow-sm">
            <div className="w-8 h-8 bg-warning-bg rounded-xl flex items-center justify-center mb-2">
              <HeartPulse className="w-4 h-4 text-warning" />
            </div>
            <p className="text-lg font-bold text-text-primary animate-countUp">{domainActiveCases}</p>
            <p className="text-xs text-text-muted">{t('home.pendingReports')}</p>
          </div>
          <div className="bg-bg-elevated rounded-2xl p-3.5 border border-border shadow-sm">
            <div className="w-8 h-8 bg-info-bg rounded-xl flex items-center justify-center mb-2">
              <TrendingUp className="w-4 h-4 text-info" />
            </div>
            <p className="text-lg font-bold text-text-primary animate-countUp">
              {domainScans.filter(d => d.confidence && d.confidence >= 0.7).length}
            </p>
            <p className="text-xs text-text-muted">{t('home.diseasesIdentified')}</p>
          </div>
        </div>
      </div>

      {/* Quick action cards */}
      <div className="px-5 mb-5">
        <h2 className="text-sm font-bold text-text-primary mb-3 uppercase tracking-wide text-text-muted">
          {t('home.quickActions')}
        </h2>
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/capture?mode=${domain.id}`)}
            className={`flex-1 bg-gradient-to-br rounded-2xl p-5 flex flex-col items-center gap-2 hover:shadow-xl active:scale-[0.97] transition-all duration-200 min-touch shadow-lg ${domain.theme.gradient}`}
          >
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <span className="text-2xl">{domain.emoji}</span>
            </div>
            <span className="text-white font-bold text-sm">
              {lang === "ur" ? `${domain.nameUrdu} اسکین کریں` : `Scan ${domain.name}`}
            </span>
            <span className="text-white/70 text-[10px] text-center leading-tight">{lang === "ur" ? domain.scanHintUrdu : domain.scanHint}</span>
          </button>

          <button
            onClick={() => navigate("/doctors")}
            className="flex-1 bg-bg-elevated border border-border rounded-2xl p-5 flex flex-col items-center gap-2 hover:shadow-lg hover:border-primary/20 active:scale-[0.97] transition-all duration-200 min-touch"
          >
            <div className="w-12 h-12 bg-primary-bg rounded-full flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-primary" />
            </div>
            <span className="text-text-primary font-bold text-sm">
              {lang === "ur" ? `${domain.doctorLabelUrdu} بک کریں` : `Book ${domain.doctorLabel}`}
            </span>
            <span className="text-text-muted text-[10px] text-center leading-tight">
              {lang === "ur" ? "ون ٹو ون سیشن / ویڈیو کال" : "1-on-1 session or video call"}
            </span>
          </button>
        </div>
      </div>

      {/* Weather Disease Risk Alert */}
      <div className="px-5 mb-5">
        <div
          className="rounded-2xl p-4 flex items-start gap-3 border"
          style={{
            background: `linear-gradient(135deg, ${riskColor(riskAdvisory.level)}10, ${riskColor(riskAdvisory.level)}05)`,
            borderColor: `${riskColor(riskAdvisory.level)}30`,
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${riskColor(riskAdvisory.level)}20` }}
          >
            <CloudRain className="w-5 h-5" style={{ color: riskColor(riskAdvisory.level) }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="font-bold text-sm" style={{ color: riskColor(riskAdvisory.level) }}>
                {lang === "ur" ? riskAdvisory.titleUrdu : riskAdvisory.title}
              </p>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-bold text-white"
                style={{ background: riskColor(riskAdvisory.level) }}
              >
                {riskAdvisory.score}%
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: `${riskColor(riskAdvisory.level)}CC` }}>
              {lang === "ur" ? riskAdvisory.messageUrdu : riskAdvisory.message}
            </p>
            <div className="flex items-center gap-3 mt-2 text-[10px] text-text-muted">
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {weather.location}</span>
              {weatherLoading && <span className="text-text-muted/60">({lang === "ur" ? "لوڈ ہورہا ہے" : "loading"})</span>}
            </div>
            <div className="flex items-center gap-3 mt-1 text-[10px] text-text-muted">
              <span className="flex items-center gap-1"><Thermometer className="w-3 h-3" /> {weather.tempC}°C</span>
              <span className="flex items-center gap-1"><Droplets className="w-3 h-3" /> {weather.humidity}%</span>
              <span className="flex items-center gap-1"><Wind className="w-3 h-3" /> {weather.rainfallMm}mm</span>
            </div>
            <button
              onClick={() => navigate("/tools")}
              className="mt-2 text-[11px] font-bold flex items-center gap-1 hover:underline"
              style={{ color: riskColor(riskAdvisory.level) }}
            >
              {lang === "ur" ? "مزید تفصیلات" : "View forecast & advisory"} <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Market / Medicine Rates Widget (domain-specific) */}
      <div className="px-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-text-muted uppercase tracking-wide">{ratesTitle}</h2>
          <button
            onClick={() => navigate("/tools")}
            className="text-primary text-xs font-semibold hover:underline"
          >
            {lang === "ur" ? "سب دیکھیں" : "See all"}
          </button>
        </div>
        <div className="bg-bg-elevated rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="grid grid-cols-3 divide-x divide-border">
            {domainRates.slice(0, 3).map((item) => {
              const TrendIcon = item.trend === "up" ? TrendingUp : item.trend === "down" ? TrendingDown : Minus;
              return (
                <button
                  key={item.id}
                  onClick={() => navigate("/tools")}
                  className="p-3 text-center hover:bg-bg-secondary transition-colors"
                >
                  <p className="text-[10px] text-text-muted truncate">{lang === "ur" ? item.nameUr : item.nameEn}</p>
                  <p className="text-sm font-bold text-text-primary">Rs. {item.avgPrice.toLocaleString()}</p>
                  <div className={`flex items-center justify-center gap-0.5 text-[10px] font-medium ${trendClass(item.trend)}`}>
                    <TrendIcon className="w-3 h-3" />
                    <span>{trendSymbol(item.trend)} {Math.abs(item.trendPercent)}%</span>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="bg-bg-secondary px-3 py-2 text-[10px] text-text-muted text-center border-t border-border">
            {domain.id === "crop" || domain.id === "livestock"
              ? (lang === "ur" ? `تازہ ترین ریٹ — ${selectedCity.nameUr} اور اطراف کی منڈیاں` : `Latest rates from ${selectedCity.nameEn} & nearby mandis`)
              : (lang === "ur" ? "قریبی دکانوں اور فارمیسیوں کے تخمینہ" : "Nearby shops & pharmacy estimates")}
          </div>
        </div>
      </div>

      {/* Active Cases (this domain only) */}
      {domainActiveCases > 0 && (
        <div className="px-5 mb-5">
          <div className="bg-warning-bg border border-warning/20 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-warning/20 rounded-full flex items-center justify-center">
                <Activity className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="font-semibold text-sm text-warning">{domainActiveCases} Active {domainActiveCases === 1 ? 'Case' : 'Cases'}</p>
                <p className="text-xs text-warning/80">Track recovery progress</p>
              </div>
            </div>
            <button
              onClick={() => navigate("/history")}
              className="px-4 py-2 bg-bg-elevated rounded-lg text-warning text-sm font-medium shadow-sm hover:shadow transition-all"
            >
              View
            </button>
          </div>
        </div>
      )}

      {/* Care Hub Quick Access — tools relevant to the ACTIVE domain only */}
      <div className="px-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-text-muted uppercase tracking-wide">
            {domain.id === "crop"
              ? t('home.farmerTools')
              : (lang === "ur" ? "کیئر ٹول کٹ" : "Care Toolkit")}
          </h2>
          <button
            onClick={() => navigate("/tools")}
            className="text-primary text-xs font-semibold hover:underline"
          >
            {lang === "ur" ? "سب دیکھیں" : "See all"}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => navigate("/tools")}
            className="bg-bg-elevated rounded-2xl p-4 border border-border hover:shadow-md hover:border-primary/20 transition-all duration-200 text-left group"
          >
            <div className="w-9 h-9 bg-primary-bg rounded-xl flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
              <BookOpen className="w-4 h-4 text-primary" />
            </div>
            <p className="font-bold text-xs text-text-primary">{t('home.diseaseLib')}</p>
            <p className="text-[10px] text-text-muted mt-0.5 leading-tight">
              {domain.id === "human" ? (lang === "ur" ? "ابتدائی علاج اور رہنمائی" : "First aid & guidance")
                : domain.id === "pet" ? (lang === "ur" ? "پالتو جانوروں کی بیماریاں" : "Pet problems & treatments")
                : domain.id === "plant" ? (lang === "ur" ? "کیڑے اور نگہداشت گائیڈز" : "Pests & care guides")
                : (lang === "ur" ? "20+ بیماریاں اور علاج" : "20+ diseases & remedies")}
            </p>
          </button>
          <button
            onClick={() => navigate("/history")}
            className="bg-bg-elevated rounded-2xl p-4 border border-border hover:shadow-md hover:border-primary/20 transition-all duration-200 text-left group"
          >
            <div className="w-9 h-9 bg-info-bg rounded-xl flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4 text-info" />
            </div>
            <p className="font-bold text-xs text-text-primary">{lang === "ur" ? "بحالی ٹریکر" : "Recovery Tracker"}</p>
            <p className="text-[10px] text-text-muted mt-0.5 leading-tight">{lang === "ur" ? "فعال مقدمات" : "Track active cases"}</p>
          </button>

          {/* Domain-specific extras — FasalDoc-only tools stay in the crop domain */}
          {domain.id === "crop" && (
            <>
              <button
                onClick={() => navigate("/tools")}
                className="bg-bg-elevated rounded-2xl p-4 border border-border hover:shadow-md hover:border-primary/20 transition-all duration-200 text-left group"
              >
                <div className="w-9 h-9 bg-warning-bg rounded-xl flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                  <Calculator className="w-4 h-4 text-warning" />
                </div>
                <p className="font-bold text-xs text-text-primary">{t('home.calc')}</p>
                <p className="text-[10px] text-text-muted mt-0.5 leading-tight">{lang === "ur" ? "ایکڑ / کنال کا حساب" : "Acre & kanal dosage"}</p>
              </button>
              <button
                onClick={() => navigate("/tools")}
                className="bg-bg-elevated rounded-2xl p-4 border border-border hover:shadow-md hover:border-primary/20 transition-all duration-200 text-left group"
              >
                <div className="w-9 h-9 bg-success-bg rounded-xl flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                  <Presentation className="w-4 h-4 text-success" />
                </div>
                <p className="font-bold text-xs text-text-primary">{t('home.pitchDeck')}</p>
                <p className="text-[10px] text-text-muted mt-0.5 leading-tight">{lang === "ur" ? "BanoQabil AI Hackathon ڈیک" : "For BanoQabil AI Hackathon judges"}</p>
              </button>
            </>
          )}

          {(domain.id === "livestock" || domain.id === "pet") && (
            <button
              onClick={() => navigate("/tools")}
              className="bg-bg-elevated rounded-2xl p-4 border border-border hover:shadow-md hover:border-primary/20 transition-all duration-200 text-left group"
            >
              <div className="w-9 h-9 bg-success-bg rounded-xl flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                <Video className="w-4 h-4 text-success" />
              </div>
              <p className="font-bold text-xs text-text-primary">{lang === "ur" ? "ویڈیو کال" : "Video Consult"}</p>
              <p className="text-[10px] text-text-muted mt-0.5 leading-tight">
                {lang === "ur" ? "ڈاکٹر سے براہ راست بات" : "Talk to a vet live"}
              </p>
            </button>
          )}

          {(domain.id === "livestock" || domain.id === "plant" || domain.id === "human") && (
            <button
              onClick={() => navigate("/tools")}
              className="bg-bg-elevated rounded-2xl p-4 border border-border hover:shadow-md hover:border-primary/20 transition-all duration-200 text-left group"
            >
              <div className="w-9 h-9 bg-warning-bg rounded-xl flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                <Landmark className="w-4 h-4 text-warning" />
              </div>
              <p className="font-bold text-xs text-text-primary">{lang === "ur" ? "سرکاری اسکیمیں" : "Govt Schemes"}</p>
              <p className="text-[10px] text-text-muted mt-0.5 leading-tight">
                {domain.id === "human" ? (lang === "ur" ? "صحت کارڈ و پروگرام" : "Health cards & programmes")
                  : (lang === "ur" ? "سبسڈی اور مدد" : "Subsidies & support")}
              </p>
            </button>
          )}

          {domain.id === "pet" && (
            <button
              onClick={() => navigate("/tools")}
              className="bg-bg-elevated rounded-2xl p-4 border border-border hover:shadow-md hover:border-primary/20 transition-all duration-200 text-left group"
            >
              <div className="w-9 h-9 bg-danger-bg rounded-xl flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                <Phone className="w-4 h-4 text-danger" />
              </div>
              <p className="font-bold text-xs text-text-primary">{lang === "ur" ? "ایمرجنسی ہیلپ لائنز" : "Emergency Helplines"}</p>
              <p className="text-[10px] text-text-muted mt-0.5 leading-tight">{lang === "ur" ? "ویٹ اور ریبز ہیلپ" : "Vet & rabies help"}</p>
            </button>
          )}
        </div>
      </div>
      <div className="px-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wide text-text-muted">
            {t("home.recentScans")}
          </h2>
          {recentDiagnoses.length > 0 && (
            <button
              onClick={() => navigate("/history")}
              className="text-primary text-xs font-semibold hover:underline"
            >
              See all
            </button>
          )}
        </div>

        {loading ? (
          <SkeletonList count={3} />
        ) : domainScans.length === 0 ? (
          <div className="bg-bg-elevated rounded-2xl p-8 text-center border border-border shadow-sm">
            <div className="w-16 h-16 bg-primary-bg rounded-full flex items-center justify-center mx-auto mb-4">
              <Camera className="w-7 h-7 text-primary" />
            </div>
            <p className="text-text-muted text-sm font-medium mb-1">{t("home.noScans")}</p>
            <p className="text-text-muted/70 text-xs mb-4">
              {lang === "ur"
                ? `${domain.nameUrdu} کی پہلی تصویر لیں`
                : `Snap your first ${domain.name.toLowerCase()} photo`}
            </p>
            <button
              onClick={() => navigate(`/capture?mode=${domain.id}`)}
              className="bg-primary text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-primary-light active:scale-[0.97] transition-all shadow-md shadow-primary/20 inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {lang === "ur" ? `${domain.nameUrdu} اسکین کریں` : `Scan ${domain.name}`}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {domainScans.slice(0, 5).map((scan) => {
              const scanDomain = getDomain(asDomainId((scan as any).type));
              return (
                <button
                  key={scan.id}
                  onClick={() => navigate("/history")}
                  className="w-full bg-bg-elevated rounded-xl p-3 flex items-center gap-3 border border-border hover:shadow-md hover:border-primary/20 transition-all duration-200 min-touch group"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg ${scanDomain.theme.softBg}`}>
                    {scanDomain.emoji}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-sm text-text-primary group-hover:text-primary transition-colors">
                      {scan.predicted_disease || 'Unknown'}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {scan.confidence && (
                        <span className={`text-xs font-medium ${
                          scan.confidence >= 0.8 ? 'text-primary' :
                          scan.confidence >= 0.5 ? 'text-warning' : 'text-danger'
                        }`}>
                          {(scan.confidence * 100).toFixed(0)}%
                        </span>
                      )}
                      <span className="text-xs text-text-muted">
                        {new Date(scan.created_at).toLocaleDateString(lang === "ur" ? "ur-PK" : "en-IN", {
                          month: 'short', day: 'numeric'
                        })}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${scanDomain.theme.softBg} ${scanDomain.theme.text}`}>
                        {lang === "ur" ? scanDomain.nameUrdu : scanDomain.name}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}