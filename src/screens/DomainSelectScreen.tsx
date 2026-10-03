/**
 * DomainSelectScreen — "Who are you caring for today?"
 * Shown on first launch and whenever the user switches domain.
 */
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useDomain } from "../context/DomainContext";
import { DOMAINS, DomainId } from "../lib/domains";
import { ArrowLeft, Check } from "lucide-react";

export default function DomainSelectScreen() {
  const { t, lang } = useLanguage();
  const { domainId: activeId, setDomain } = useDomain();
  const navigate = useNavigate();
  const ur = lang === "ur";

  const choose = (id: DomainId) => {
    setDomain(id);
    // If we came from an explicit /domain switch, go back home.
    navigate("/", { replace: true });
  };

  return (
    <div className="flex flex-col flex-1 bg-bg-primary pb-8 animate-scaleIn">
      {/* Brand hero */}
      <div className="px-5 pt-6 pb-5">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-1.5 text-text-muted hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          <span className="text-xs font-semibold">{ur ? "واپس" : "Back"}</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-500 to-sky-500 flex items-center justify-center shadow-lg shadow-emerald-600/25">
            <span className="text-white text-xl font-heading font-bold">A</span>
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold text-text-primary leading-none">
              {t("app.name")}
            </h1>
            <p className="text-[11px] font-semibold text-primary mt-1">
              {ur ? "صحت کا اے سے Z — ہر زندہ مخلوق کے لیے" : "A to Z of Health — For Every Living Thing"}
            </p>
          </div>
        </div>

        <h2 className="mt-6 text-xl font-heading font-bold text-text-primary">
          {ur ? "آپ کس کی دیکھ بھال کرنا چاہتے ہیں؟" : "Who are you caring for today?"}
        </h2>
        <p className="text-xs text-text-muted mt-1">
          {ur
            ? "اپنا ڈومین منتخب کریں — اسکینر، AI اسسٹنٹ، ڈاکٹرز اور دوائیں اسی کے مطابق ہوں گے۔"
            : "Pick your domain — the scanner, AI assistant, doctors and medicines adapt to it."}
        </p>
      </div>

      {/* Domain cards */}
      <div className="px-5 grid grid-cols-1 gap-3">
        {DOMAINS.map((d) => {
          const active = d.id === activeId;
          return (
            <button
              key={d.id}
              onClick={() => choose(d.id)}
              className={`relative w-full text-start rounded-2xl border p-4 bg-bg-elevated transition-all duration-200 active:scale-[0.98] shadow-sm ${
                active ? `${d.theme.border} ring-2 ring-emerald-500/40` : "border-border hover:border-primary/30"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${d.theme.gradient} flex items-center justify-center text-2xl shadow-sm shrink-0`}
                >
                  {d.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="font-heading font-bold text-text-primary text-sm leading-tight">
                      {ur ? d.brandNameUrdu : d.brandName}
                    </p>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${d.theme.softBg} ${d.theme.text}`}>
                      {ur ? d.nameUrdu : d.name}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-muted mt-0.5 leading-snug">
                    {ur ? d.taglineUrdu : d.tagline}
                  </p>
                </div>
                {active ? (
                  <span className="shrink-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </span>
                ) : (
                  <span className="shrink-0 text-[10px] font-bold text-primary bg-primary-bg px-2.5 py-1 rounded-full">
                    {ur ? "منتخب کریں" : "Select"}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <p className="px-6 mt-5 text-center text-[10px] leading-relaxed text-text-muted">
        {ur
          ? "آپ کسی بھی وقت اوپر والے ڈومین بٹن سے دوسری مخلوق پر سوئچ کر سکتے ہیں۔"
          : "You can switch domains anytime from the pill button in the header."}
      </p>
    </div>
  );
}
