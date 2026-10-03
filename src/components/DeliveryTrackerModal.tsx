import { useState, useEffect } from "react";
import {
  Truck,
  Phone,
  MapPin,
  ExternalLink,
  Navigation,
  X,
  ShieldCheck,
  Bike
} from "lucide-react";
import { getLiveDeliveryStatus, getGoogleMapsUrl, DeliveryStatusUpdate } from "../lib/geolocationService";

import type { LocalOrder } from "../lib/db";
import { useLanguage } from "../context/LanguageContext";

interface DeliveryTrackerModalProps {
  order: LocalOrder;
  storeName?: string;
  storePhone?: string;
  storeLat?: number;
  storeLng?: number;
  userAddress?: string;
  onClose: () => void;
}

export default function DeliveryTrackerModal({
  order,
  storeName = "AZdoc Partner Pharmacy",
  storePhone = "0300-7862455",
  storeLat = 31.5164,
  storeLng = 74.3487,
  userAddress,
  onClose,
}: DeliveryTrackerModalProps) {
  const { lang } = useLanguage();
  const ur = lang === "ur";

  const [status, setStatus] = useState<DeliveryStatusUpdate>(() =>
    getLiveDeliveryStatus(order.created_at, storeName, storePhone, { lat: storeLat, lng: storeLng })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setStatus(
        getLiveDeliveryStatus(order.created_at, storeName, storePhone, { lat: storeLat, lng: storeLng })
      );
    }, 4000);
    return () => clearInterval(timer);
  }, [order.created_at, storeName, storePhone, storeLat, storeLng]);

  const stages = [
    { key: "placed", label: ur ? "آرڈر تصدیق" : "Order Placed", desc: ur ? "اسٹور نے وصول کیا" : "Store Received" },
    { key: "packing", label: ur ? "پیکنگ" : "Packed", desc: ur ? "ادویات تیار ہیں" : "Medicines Sealed" },
    { key: "departed", label: ur ? "روانہ ہو گیا" : "Departed", desc: ur ? "رائیڈر روانہ ہوا" : "Left Store" },
    { key: "on_the_way", label: ur ? "راستے میں" : "On the Way", desc: ur ? "قریب پہنچ رہا ہے" : "Arriving Soon" },
    { key: "delivered", label: ur ? "پہنچ گیا" : "Delivered", desc: ur ? "کامیابی سے موصول" : "Handed Over" },
  ];

  const currentStageIndex =
    status.stage === "delivered" ? 4 : status.stage === "on_the_way" ? 3 : status.stage === "departed" ? 2 : status.stage === "packing" ? 1 : 0;

  const gmapsUrl = getGoogleMapsUrl(storeLat, storeLng, storeName);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-bg-elevated border border-border rounded-3xl w-full max-w-md max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scaleIn">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-gradient-to-r from-primary-bg/50 to-bg-secondary">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Truck className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-bold text-base text-text-primary">
                  {ur ? "لائیو ڈیلیوری ٹریکر" : "Live Delivery Radar"}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success-bg text-success border border-success/20 animate-pulse">
                  {ur ? "فعال" : "LIVE"}
                </span>
              </div>
              <p className="text-[11px] text-text-muted">
                {ur ? "آرڈر" : "Order"} #{order.localId?.slice(-6) ?? order.id?.slice(-6)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-bg-secondary flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Scrollable */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Status banner with animated departure indicator */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 via-primary-bg to-bg-secondary border border-primary/20 text-center relative overflow-hidden">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Bike className="w-5 h-5 text-primary animate-bounce" />
              <p className="font-heading font-bold text-sm text-text-primary">
                {ur ? status.stageLabelUr : status.stageLabel}
              </p>
            </div>
            <p className="text-xs text-text-muted">
              {status.stage === "delivered"
                ? ur
                  ? "آپ کا پارسل پہنچ چکا ہے۔ شکریہ!"
                  : "Package delivered to your address. Thank you!"
                : ur
                ? `متوقع وقت: تقریباً ${status.estimatedRemainingMins} منٹ باقی`
                : `Estimated Delivery: ~${status.estimatedRemainingMins} mins remaining`}
            </p>

            {/* Progress bar */}
            <div className="w-full bg-border h-2 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-primary to-accent h-full transition-all duration-700 ease-out"
                style={{ width: `${status.progressPercent}%` }}
              />
            </div>
          </div>

          {/* Stepper */}
          <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
            {stages.map((st, i) => {
              const isPassed = i <= currentStageIndex;
              const isCurrent = i === currentStageIndex;
              return (
                <div key={st.key} className="relative flex items-start gap-3">
                  <div
                    className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all ${
                      isPassed
                        ? "bg-primary text-white border-primary shadow-sm shadow-primary/30"
                        : "bg-bg-elevated text-text-muted border-border"
                    } ${isCurrent ? "ring-4 ring-primary/20 scale-110" : ""}`}
                  >
                    {isPassed ? "✓" : i + 1}
                  </div>
                  <div className="flex-1">
                    <p
                      className={`text-xs font-bold leading-tight ${
                        isCurrent
                          ? "text-primary"
                          : isPassed
                          ? "text-text-primary"
                          : "text-text-muted"
                      }`}
                    >
                      {st.label}
                    </p>
                    <p className="text-[10px] text-text-muted">{st.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Assigned Delivery Rider Card */}
          <div className="bg-bg-secondary/70 border border-border rounded-2xl p-3.5 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm">
              👨‍✈️
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-bold text-xs text-text-primary truncate">
                  {status.rider.name}
                </p>
                <span className="text-[10px] font-semibold text-amber-500 flex items-center gap-0.5">
                  ⭐ {status.rider.rating}
                </span>
              </div>
              <p className="text-[10px] text-text-muted truncate">
                {status.rider.vehicle} · {status.rider.plate}
              </p>
              <p className="text-[9px] text-success font-medium flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3 h-3" /> {ur ? "تصدیق شدہ فارمیسی رائیڈر" : "Verified Pharmacy Courier"}
              </p>
            </div>
            <a
              href={`tel:${status.rider.phone}`}
              className="p-2.5 rounded-xl bg-primary text-white hover:bg-primary-light transition-transform active:scale-95 shadow-sm shadow-primary/30"
              title={ur ? "رائیڈر کو کال کریں" : "Call Rider"}
            >
              <Phone className="w-4 h-4" />
            </a>
          </div>

          {/* Pharmacy Store & Location Card */}
          <div className="bg-bg-secondary/70 border border-border rounded-2xl p-3.5 space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-xs text-text-primary">{storeName}</p>
                  <p className="text-[10px] text-text-muted">{userAddress || order.address}</p>
                </div>
              </div>
              <a
                href={gmapsUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] font-bold text-primary flex items-center gap-1 hover:underline shrink-0"
              >
                <Navigation className="w-3 h-3" /> {ur ? "گوگل میپ" : "Google Map"}
              </a>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[11px]">
              <span className="text-text-muted flex items-center gap-1">
                <Phone className="w-3 h-3" /> {storePhone}
              </span>
              <a
                href={`tel:${storePhone}`}
                className="text-primary font-bold hover:underline"
              >
                {ur ? "اسٹور سے رابطہ" : "Call Store"}
              </a>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-bg-secondary/40 border border-border rounded-2xl p-3">
            <p className="text-[11px] font-bold text-text-primary mb-2 flex items-center justify-between">
              <span>{ur ? "آرڈر کی تفصیل" : "Order Summary"}</span>
              <span className="text-primary font-bold">Rs. {order.total_pkr.toLocaleString()} (COD)</span>
            </p>
            <div className="space-y-1">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-[10px] text-text-muted">
                  <span>{item.name} × {item.qty}</span>
                  <span>Rs. {(item.unit_price_pkr * item.qty).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-bg-secondary flex gap-2">
          <a
            href={gmapsUrl}
            target="_blank"
            rel="noreferrer"
            className="flex-1 py-2.5 rounded-xl bg-bg-elevated border border-border text-text-primary text-xs font-bold flex items-center justify-center gap-1.5 hover:border-primary/40 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {ur ? "گوگل میپ پر دیکھیں" : "View on Google Maps"}
          </a>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-light transition-colors"
          >
            {ur ? "ٹھیک ہے" : "Got it"}
          </button>
        </div>
      </div>
    </div>
  );
}
