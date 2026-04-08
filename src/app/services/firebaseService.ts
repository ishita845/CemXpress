// src/services/firebaseService.ts
// ─────────────────────────────────────────────────────────────────────────────
// This file REPLACES src/services/localStorage.ts entirely.
// All function names are identical so page imports just change the path.
// ─────────────────────────────────────────────────────────────────────────────

import {
  collection,
  collectionGroup,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { db } from "../config/firebase";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface Shop {
  id:           string;
  sellerId:     string;
  name:         string;
  description:  string;
  address:      string;
  area:         string;
  city:         string;
  phone:        string;
  email:        string;
  openHours:    string;
  isOpen:       boolean;
  tags:         string[];
  rating:       number;
  reviewCount:  number;
  latitude?:    number | null;
  longitude?:   number | null;
  image?:       string;
  createdAt?:   Timestamp;
  updatedAt?:   Timestamp;
}

export interface Material {
  id:          string;
  shopId:      string;
  sellerId:    string;
  name:        string;
  category:    string;
  brand:       string;
  price:       number;
  unit:        string;
  stockQty:    number;
  minOrder:    number;
  discount?:   number;
  description: string;
  tags:        string[];
  inStock:     boolean;
  image?:      string;
  createdAt?:  Timestamp;
  updatedAt?:  Timestamp;
}

export interface Enquiry {
  id:            string;
  buyerId:       string;
  sellerId:      string;
  shopId:        string;
  shopName:      string;
  buyerName:     string;
  buyerPhone:    string;
  buyerEmail:    string;
  buyerAddress?: string;
  materialId?:   string;
  materialName?: string;
  quantity?:     string;
  paymentMethod?: "cod" | "online";
  message:       string;
  status:        "pending" | "accepted" | "rejected";
  createdAt?:    Timestamp;
  updatedAt?:    Timestamp;
}

export interface Review {
  id:         string;
  shopId:     string;
  buyerId:    string;
  buyerName:  string;
  enquiryId:  string;
  rating:     number;
  comment:    string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// ═══════════════════════════════════════════════════════════════
// SHOPS
// ═══════════════════════════════════════════════════════════════

export async function createShop(
  data: Omit<Shop, "id" | "rating" | "reviewCount" | "createdAt" | "updatedAt">
): Promise<Shop> {
  const docRef = await addDoc(collection(db, "shops"), {
    ...data,
    rating:      0,
    reviewCount: 0,
    createdAt:   serverTimestamp(),
    updatedAt:   serverTimestamp(),
  });
  return { ...data, id: docRef.id, rating: 0, reviewCount: 0 };
}

export async function getAllShops(): Promise<Shop[]> {
  const snap = await getDocs(collection(db, "shops"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Shop));
}

export async function getShopById(shopId: string): Promise<Shop | null> {
  const snap = await getDoc(doc(db, "shops", shopId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Shop;
}

export async function getShopBySellerId(sellerId: string): Promise<Shop | null> {
  const q    = query(collection(db, "shops"), where("sellerId", "==", sellerId));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as Shop;
}

export async function updateShop(shopId: string, updates: Partial<Shop>): Promise<void> {
  await updateDoc(doc(db, "shops", shopId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

// ═══════════════════════════════════════════════════════════════
// MATERIALS  (stored in /materials collection with shopId field)
// ═══════════════════════════════════════════════════════════════

export async function saveMaterial(
  data: Omit<Material, "id" | "createdAt" | "updatedAt">
): Promise<Material> {
  const docRef = await addDoc(collection(db, "materials"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { ...data, id: docRef.id };
}

export async function updateMaterial(
  materialId: string,
  updates: Partial<Material>
): Promise<void> {
  await updateDoc(doc(db, "materials", materialId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteMaterial(materialId: string): Promise<void> {
  await deleteDoc(doc(db, "materials", materialId));
}

export async function getMaterialsByShopId(shopId: string): Promise<Material[]> {
  const q    = query(collection(db, "materials"), where("shopId", "==", shopId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Material));
}

export async function getAllMaterials(): Promise<Material[]> {
  const snap = await getDocs(collection(db, "materials"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Material));
}

// ═══════════════════════════════════════════════════════════════
// ENQUIRIES
// ═══════════════════════════════════════════════════════════════

export async function createEnquiry(
  data: Omit<Enquiry, "id" | "status" | "createdAt" | "updatedAt">
): Promise<Enquiry> {
  const docRef = await addDoc(collection(db, "enquiries"), {
    ...data,
    status:    "pending",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { ...data, id: docRef.id, status: "pending" };
}

export async function getEnquiriesForSeller(sellerId: string): Promise<Enquiry[]> {
  const q    = query(
    collection(db, "enquiries"),
    where("sellerId", "==", sellerId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Enquiry));
}

export async function getEnquiriesForBuyer(buyerId: string): Promise<Enquiry[]> {
  const q    = query(
    collection(db, "enquiries"),
    where("buyerId", "==", buyerId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Enquiry));
}

export async function updateEnquiryStatus(
  enquiryId: string,
  status: "pending" | "accepted" | "rejected"
): Promise<void> {
  await updateDoc(doc(db, "enquiries", enquiryId), {
    status,
    updatedAt: serverTimestamp(),
  });
}

export async function updateEnquiryPaymentMethod(
  enquiryId: string,
  paymentMethod: "cod" | "online"
): Promise<void> {
  await updateDoc(doc(db, "enquiries", enquiryId), {
    paymentMethod,
    updatedAt: serverTimestamp(),
  });
}

// ═══════════════════════════════════════════════════════════════
// REVIEWS
// ═══════════════════════════════════════════════════════════════

export async function saveReview(
  data: Omit<Review, "id" | "createdAt" | "updatedAt">,
  existingReviewId?: string
): Promise<Review> {
  if (existingReviewId) {
    await updateDoc(doc(db, "reviews", existingReviewId), {
      ...data,
      updatedAt: serverTimestamp(),
    });
    await _recalcShopRating(data.shopId);
    return { ...data, id: existingReviewId };
  }
  const docRef = await addDoc(collection(db, "reviews"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await _recalcShopRating(data.shopId);
  return { ...data, id: docRef.id };
}

export async function getReviewsForShop(shopId: string): Promise<Review[]> {
  const q    = query(
    collection(db, "reviews"),
    where("shopId", "==", shopId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Review));
}

export async function getReviewByEnquiryId(enquiryId: string): Promise<Review | null> {
  const q    = query(collection(db, "reviews"), where("enquiryId", "==", enquiryId));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as Review;
}

export async function getAllReviews(): Promise<Review[]> {
  const snap = await getDocs(collection(db, "reviews"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Review));
}

async function _recalcShopRating(shopId: string): Promise<void> {
  const reviews = await getReviewsForShop(shopId);
  if (!reviews.length) return;
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  await updateDoc(doc(db, "shops", shopId), {
    rating:      Math.round(avg * 10) / 10,
    reviewCount: reviews.length,
    updatedAt:   serverTimestamp(),
  });
}

// ═══════════════════════════════════════════════════════════════
// IMAGE UPLOAD (Firebase Storage)
// ═══════════════════════════════════════════════════════════════

/**
 * Upload any image file to Firebase Storage.
 * Returns the public download URL.
 * onProgress(0-100) is optional — use it to show a progress bar.
 */
export function uploadImage(
  path:       string,
  file:       File,
  onProgress?: (pct: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, path);
    const task       = uploadBytesResumable(storageRef, file);

    task.on(
      "state_changed",
      (snap) => {
        if (onProgress) {
          onProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100));
        }
      },
      reject,
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve(url);
      }
    );
  });
}

export async function uploadProfilePicture(uid: string, file: File, onProgress?: (pct: number) => void): Promise<string> {
  return uploadImage(`users/${uid}/profile.${file.name.split(".").pop()}`, file, onProgress);
}

export async function uploadMaterialImage(shopId: string, materialId: string, file: File, onProgress?: (pct: number) => void): Promise<string> {
  return uploadImage(`materials/${shopId}/${materialId}_${Date.now()}.${file.name.split(".").pop()}`, file, onProgress);
}
