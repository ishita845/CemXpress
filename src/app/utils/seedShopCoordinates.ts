// src/app/utils/seedShopCoordinates.ts
import { db } from "../config/firebase";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";

export async function seedShopCoordinates(): Promise<void> {
  try {
    const snap = await getDocs(collection(db, "shops"));

    const updates = snap.docs.map(async (shopDoc) => {
      const data = shopDoc.data();

      // Only seed if coordinates are missing
      if (data.latitude == null || data.longitude == null) {
        await updateDoc(doc(db, "shops", shopDoc.id), {
          latitude: null,
          longitude: null,
        });
      }
    });

    await Promise.all(updates);
    console.log("✅ seedShopCoordinates complete");
  } catch (err) {
    console.error("❌ seedShopCoordinates failed:", err);
  }
}