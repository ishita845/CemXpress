// src/services/firebaseService.ts
// ─────────────────────────────────────────────────────────────────────────────
// Complete Firebase service — Shops, Materials, Enquiries, Reviews,
// Orders (COD workflow), Image Upload
// ─────────────────────────────────────────────────────────────────────────────

import {
  collection,
  doc,
  addDoc,
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
import { db, storage } from "../config/firebase";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface Shop {
  id:          string;
  sellerId:    string;
  name:        string;
  description: string;
  address:     string;
  area:        string;
  city:        string;
  phone:       string;
  email:       string;
  openHours:   string;
  isOpen:      boolean;
  tags:        string[];
  rating:      number;
  reviewCount: number;
  latitude?:   number | null;
  longitude?:  number | null;
  image?:      string;
  createdAt?:  Timestamp;
  updatedAt?:  Timestamp;
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
  unitPrice?:    number;
  quantity?:     string;
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

// Order has its own collection — not stored inside enquiries
export interface Order {
  id:              string;
  enquiryId:       string;
  buyerId:         string;
  buyerName:       string;
  buyerPhone:      string;
  buyerEmail:      string;
  sellerId:        string;
  sellerPhone?:    string;
  shopId:          string;
  shopName:        string;
  materialId?:     string;
  materialName?:   string;
  quantity?:       string;
  unitPrice?:      number;
  totalAmount:     number;
  deliveryAddress: string;
  notes?:          string;
  paymentMethod:   "cod";
  // COD workflow: pending → confirmed → shipped → delivered → payment_received
  status:          "pending" | "confirmed" | "shipped" | "delivered" | "payment_received";
  createdAt?:      Timestamp;
  updatedAt?:      Timestamp;
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
// MATERIALS
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
// ORDERS  (separate "orders" collection — not inside enquiries)
// ═══════════════════════════════════════════════════════════════

/** Called by buyer when placing a COD order from PlaceOrderModal. */
export async function createOrder(
  data: Omit<Order, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const docRef = await addDoc(collection(db, "orders"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

/** Called by seller to advance the order through the COD workflow. */
export async function updateOrderStatus(
  orderId: string,
  status: Order["status"]
): Promise<void> {
  await updateDoc(doc(db, "orders", orderId), {
    status,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Check if an order already exists for a given enquiry.
 * Used in BuyerEnquiriesPage to show "Track Order" instead of "Place Order".
 */
export async function getOrderByEnquiryId(enquiryId: string): Promise<Order | null> {
  const q    = query(collection(db, "orders"), where("enquiryId", "==", enquiryId));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as Order;
}

/** Returns all orders placed by a buyer, newest first. */
export async function getOrdersForBuyer(buyerId: string): Promise<Order[]> {
  const q    = query(
    collection(db, "orders"),
    where("buyerId", "==", buyerId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
}

/** Returns all orders belonging to a seller, newest first. */
export async function getOrdersForSeller(sellerId: string): Promise<Order[]> {
  const q    = query(
    collection(db, "orders"),
    where("sellerId", "==", sellerId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
}

// ═══════════════════════════════════════════════════════════════
// IMAGE UPLOAD (Firebase Storage)
// ═══════════════════════════════════════════════════════════════

/**
 * Upload any image file to Firebase Storage.
 * Returns the public download URL.
 * onProgress(0–100) is optional — use it to show a progress bar.
 */
export function uploadImage(
  path:        string,
  file:        File,
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

export async function uploadProfilePicture(
  uid:         string,
  file:        File,
  onProgress?: (pct: number) => void
): Promise<string> {
  const ext = file.name.split(".").pop();
  return uploadImage(`users/${uid}/profile.${ext}`, file, onProgress);
}

export async function uploadMaterialImage(
  shopId:      string,
  materialId:  string,
  file:        File,
  onProgress?: (pct: number) => void
): Promise<string> {
  const ext = file.name.split(".").pop();
  return uploadImage(
    `materials/${shopId}/${materialId}_${Date.now()}.${ext}`,
    file,
    onProgress
  );
}