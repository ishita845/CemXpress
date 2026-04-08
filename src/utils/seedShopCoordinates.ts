/**
 * seedShopCoordinates  –  src/app/utils/seedShopCoordinates.ts
 *
 * One-time migration: for every shop in localStorage that has address
 * info but no latitude/longitude, look up coordinates from a built-in
 * table of Indian cities/localities and save them via updateShop().
 *
 * This runs synchronously and instantly (no network call) so demo shops
 * show distances immediately. Shops whose area isn't in the table are
 * skipped (they'll show "N/A" distance until seller runs GPS in settings).
 *
 * Call once at app startup — e.g. inside BuyerBrowsePage's first useEffect.
 */


/** lat/lon for common Indian cities & Delhi-NCR localities */
const CITY_COORDS: Record<string, [number, number]> = {
  // Delhi areas
  "dwarka":           [28.5921, 77.0460],
  "rohini":           [28.7041, 77.1025],
  "pitampura":        [28.7011, 77.1310],
  "janakpuri":        [28.6289, 77.0824],
  "rajouri garden":   [28.6471, 77.1190],
  "karol bagh":       [28.6514, 77.1908],
  "lajpat nagar":     [28.5700, 77.2432],
  "saket":            [28.5244, 77.2066],
  "nehru place":      [28.5491, 77.2512],
  "connaught place":  [28.6315, 77.2167],
  "shahdara":         [28.6739, 77.2885],
  "uttam nagar":      [28.6179, 77.0525],
  "mayur vihar":      [28.6100, 77.2950],
  "vasant kunj":      [28.5220, 77.1580],
  "south delhi":      [28.5244, 77.2066],
  "north delhi":      [28.7196, 77.2079],
  "east delhi":       [28.6671, 77.2897],
  "west delhi":       [28.6289, 77.0824],
  "new delhi":        [28.6139, 77.2090],
  "delhi":            [28.6139, 77.2090],

  // NCR
  "gurgaon":          [28.4595, 77.0266],
  "gurugram":         [28.4595, 77.0266],
  "noida":            [28.5355, 77.3910],
  "greater noida":    [28.4744, 77.5040],
  "faridabad":        [28.4089, 77.3178],
  "ghaziabad":        [28.6692, 77.4538],
  "manesar":          [28.3561, 76.9384],

  // Mumbai
  "andheri":          [19.1136, 72.8697],
  "goregaon":         [19.1663, 72.8526],
  "bandra":           [19.0544, 72.8405],
  "malad":            [19.1874, 72.8484],
  "borivali":         [19.2307, 72.8567],
  "thane":            [19.2183, 72.9781],
  "navi mumbai":      [19.0330, 73.0297],
  "kurla":            [19.0728, 72.8826],
  "dadar":            [19.0178, 72.8478],
  "mumbai":           [19.0760, 72.8777],

  // Pune
  "kothrud":          [18.5074, 73.8077],
  "hadapsar":         [18.5074, 73.9399],
  "wakad":            [18.5975, 73.7618],
  "pune":             [18.5204, 73.8567],

  // Bangalore
  "koramangala":      [12.9279, 77.6271],
  "whitefield":       [12.9698, 77.7500],
  "electronic city":  [12.8399, 77.6770],
  "indiranagar":      [12.9719, 77.6412],
  "hebbal":           [13.0358, 77.5970],
  "bangalore":        [12.9716, 77.5946],
  "bengaluru":        [12.9716, 77.5946],

  // Other cities
  "chennai":          [13.0827, 80.2707],
  "hyderabad":        [17.3850, 78.4867],
  "kolkata":          [22.5726, 88.3639],
  "ahmedabad":        [23.0225, 72.5714],
  "jaipur":           [26.9124, 75.7873],
  "lucknow":          [26.8467, 80.9462],
  "chandigarh":       [30.7333, 76.7794],
  "surat":            [21.1702, 72.8311],
  "nagpur":           [21.1458, 79.0882],
  "indore":           [22.7196, 75.8577],
  "bhopal":           [23.2599, 77.4126],
  "patna":            [25.5941, 85.1376],
  "coimbatore":       [11.0168, 76.9558],
  "visakhapatnam":    [17.6868, 83.2185],
  "kochi":            [9.9312,  76.2673],
  "bhubaneswar":      [20.2961, 85.8245],
  "vadodara":         [22.3072, 73.1812],
  "rajkot":           [22.3039, 70.8022],
};


function findCoordsForShop(shop: {
  area?: string;
  city?: string;
  address?: string;
}): [number, number] | null {
  const fields = [shop.area, shop.city, shop.address]
    .filter(Boolean)
    .map((s) => s!.toLowerCase());

  for (const field of fields) {
    for (const [key, coords] of Object.entries(CITY_COORDS)) {
      if (field.includes(key)) {
        // Add small random offset (±0.005° ≈ 500 m) so shops don't stack
        return [
          coords[0] + (Math.random() - 0.5) * 0.01,
          coords[1] + (Math.random() - 0.5) * 0.01,
        ];
      }
    }
  }
  return null;
}

export function seedShopCoordinates(): void {
  try {
    import { db } from "../config/firebase";
import { collection, getDocs } from "firebase/firestore";

const snapshot = await getDocs(collection(db, "shops"));
const shops = snapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data()
}));
    let patched = 0;

    for (const shop of shops) {
      if (shop.latitude && shop.longitude) continue; // already has coords
      const coords = findCoordsForShop(shop);
      if (coords) {
        updateShop(shop.id, { latitude: coords[0], longitude: coords[1] } as any);
        patched++;
      }
    }

    if (patched > 0) {
      console.log(`[CemXpress] Seeded coordinates for ${patched} shop(s).`);
    }
  } catch (e) {
    console.warn("[CemXpress] seedShopCoordinates error:", e);
  }
}