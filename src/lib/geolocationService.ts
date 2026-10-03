/**
 * AZdoc Geolocation, Google Maps & Live Delivery Tracker Engine.
 * Provides live GPS detection, nearest pharmacy calculation,
 * Google Maps integration, and real-time departure tracking.
 */

export interface UserCoordinates {
  lat: number;
  lng: number;
  accuracy?: number;
  cityName?: string;
  address?: string;
}

export interface NearestStoreResult {
  storeId: string;
  distanceKm: number;
  estimatedDeliveryMins: number;
  googleMapsUrl: string;
  googleMapsEmbedUrl: string;
}

export interface DeliveryRider {
  id: string;
  name: string;
  phone: string;
  rating: number;
  vehicle: string;
  plate: string;
  photoUrl: string;
}

export type DeliveryStage = "placed" | "packing" | "departed" | "on_the_way" | "delivered";

export interface DeliveryStatusUpdate {
  orderId: string;
  stage: DeliveryStage;
  stageLabel: string;
  stageLabelUr: string;
  progressPercent: number;
  estimatedRemainingMins: number;
  rider: DeliveryRider;
  storeName: string;
  storePhone: string;
  currentRiderLocation: { lat: number; lng: number };
}

/**
 * Calculates distance in kilometers between two coordinates using Haversine formula
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Requests user's live current location with permission prompt
 */
export async function getCurrentUserLocation(): Promise<UserCoordinates> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      // Fallback to Lahore default coordinates if geolocation unsupported
      resolve({
        lat: 31.5204,
        lng: 74.3587,
        cityName: "Lahore",
        address: "Gulberg III, Lahore, Pakistan",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords: UserCoordinates = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };

        // Try reverse geocoding via OpenStreetMap or FortyGuard
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&zoom=14&addressdetails=1`,
            { headers: { "User-Agent": "AZdoc-HealthApp/1.0" } }
          );
          if (res.ok) {
            const data = await res.json();
            coords.cityName =
              data.address?.city ||
              data.address?.town ||
              data.address?.state_district ||
              "Current Location";
            coords.address = data.display_name || `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`;
          }
        } catch {
          coords.cityName = "Your Location";
          coords.address = `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`;
        }

        resolve(coords);
      },
      (error) => {
        console.warn("[Geolocation] Location access error:", error.message);
        // Resolve with default location so app does not break
        resolve({
          lat: 31.5204,
          lng: 74.3587,
          cityName: "Lahore",
          address: "Gulberg, Lahore, Pakistan (Default Location)",
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
}

/**
 * Generates Google Maps search / direction URLs
 */
export function getGoogleMapsUrl(lat: number, lng: number, label?: string): string {
  if (label) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(label)}+${lat},${lng}`;
  }
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

export function getGoogleMapsEmbedUrl(lat: number, lng: number): string {
  return `https://maps.google.com/maps?q=${lat},${lng}&hl=en&z=14&output=embed`;
}

/**
 * Active delivery riders pool for simulation
 */
export const RIDERS_POOL: DeliveryRider[] = [
  {
    id: "rider-1",
    name: "Muhammad Aslam",
    phone: "0302-8877123",
    rating: 4.9,
    vehicle: "Honda CD-70 Bike",
    plate: "LEA-4920",
    photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "rider-2",
    name: "Kamran Ali",
    phone: "0321-9988451",
    rating: 4.8,
    vehicle: "Yamaha YBR-125",
    plate: "KHI-8291",
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "rider-3",
    name: "Zeeshan Khan",
    phone: "0345-1234789",
    rating: 4.9,
    vehicle: "Suzuki GD-110S",
    plate: "RWP-3104",
    photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
  },
];

/**
 * Computes simulated live tracking progress based on order creation time
 */
export function getLiveDeliveryStatus(
  orderCreatedAt: string,
  storeName = "Sehat Partner Pharmacy",
  storePhone = "0300-7862455",
  storeCoords = { lat: 31.5204, lng: 74.3587 }
): DeliveryStatusUpdate {
  const createdTime = new Date(orderCreatedAt).getTime();
  const now = Date.now();
  const elapsedSecs = Math.max(0, Math.floor((now - createdTime) / 1000));

  let stage: DeliveryStage = "placed";
  let stageLabel = "Order Placed & Verified";
  let stageLabelUr = "آرڈر تصدیق ہو گیا";
  let progressPercent = 15;
  let estimatedRemainingMins = 30;

  if (elapsedSecs > 180) {
    stage = "delivered";
    stageLabel = "Delivered to Your Doorstep";
    stageLabelUr = "آرڈر پہنچ گیا";
    progressPercent = 100;
    estimatedRemainingMins = 0;
  } else if (elapsedSecs > 100) {
    stage = "on_the_way";
    stageLabel = "Rider on the Way — 5 Mins Away";
    stageLabelUr = "رائیڈر راستے میں ہے — 5 منٹ دوری";
    progressPercent = 80;
    estimatedRemainingMins = 5;
  } else if (elapsedSecs > 40) {
    stage = "departed";
    stageLabel = "Departed Store with Rider";
    stageLabelUr = "رائیڈر اسٹور سے روانہ ہو چکا ہے";
    progressPercent = 55;
    estimatedRemainingMins = 15;
  } else if (elapsedSecs > 15) {
    stage = "packing";
    stageLabel = "Pharmacist Packing Medicines";
    stageLabelUr = "فارماسسٹ ادویات پیک کر رہا ہے";
    progressPercent = 35;
    estimatedRemainingMins = 25;
  }

  // Jitter current rider position towards destination
  const riderProgressRatio = progressPercent / 100;
  const currentRiderLocation = {
    lat: storeCoords.lat + (0.008 * (1 - riderProgressRatio)),
    lng: storeCoords.lng + (0.008 * (1 - riderProgressRatio)),
  };

  return {
    orderId: "AZ-" + (createdTime % 100000),
    stage,
    stageLabel,
    stageLabelUr,
    progressPercent,
    estimatedRemainingMins,
    rider: RIDERS_POOL[0],
    storeName,
    storePhone,
    currentRiderLocation,
  };
}
