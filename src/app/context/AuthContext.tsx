// src/context/AuthContext.tsx  ← REPLACE YOUR EXISTING FILE WITH THIS
// Uses Firebase Auth + Firestore. Same useAuth() API — no page changes needed.

import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  signOut,
  onAuthStateChanged,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { createShop } from "../services/firebaseService";

// ── User type ─────────────────────────────────────────────────────────────────
export interface AppUser {
  id:             string;
  email:          string;
  role:           "buyer" | "seller";
  name:           string;
  phone:          string;
  alternatePhone?: string;
  location?:      string;
  area?:          string;
  city?:          string;
  latitude?:      number | null;
  longitude?:     number | null;
  address?: {
    state:   string;
    pincode: string;
  };
  profilePicture?: string;
  companyName?:    string;
  gstNumber?:      string;
  panNumber?:      string;
  shopId?:         string;
  shopName?:       string;
}

// ── Context shape ─────────────────────────────────────────────────────────────
interface AuthContextValue {
  user:            AppUser | null;
  isAuthenticated: boolean;
  isLoading:       boolean;
  login:           (email: string, password: string, role: "buyer" | "seller") => Promise<boolean>;
  register:        (data: any) => Promise<AppUser>;
  updateProfile:   (updates: Partial<AppUser>) => Promise<void>;
  logout:          () => Promise<void>;
  checkEmailExists:(email: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,      setUser]      = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Listen to Firebase auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      try {
        const snap = await getDoc(doc(db, "users", firebaseUser.uid));
        setUser(snap.exists() ? ({ id: snap.id, ...snap.data() } as AppUser) : null);
      } catch {
        setUser(null);
      }
      setIsLoading(false);
    });
    return unsub;
  }, []);

  // ── login ──────────────────────────────────────────────────────────────────
  const login = async (email: string, password: string, role: "buyer" | "seller"): Promise<boolean> => {
    const cred    = await signInWithEmailAndPassword(auth, email, password);
    const snap    = await getDoc(doc(db, "users", cred.user.uid));
    if (!snap.exists()) throw new Error("User profile not found.");

    const appUser = { id: snap.id, ...snap.data() } as AppUser;
    if (appUser.role !== role) {
      await signOut(auth);
      throw new Error(`This email is registered as a ${appUser.role}. Please select the correct role.`);
    }
    setUser(appUser);
    return true;
  };

  // ── register ───────────────────────────────────────────────────────────────
  const register = async (data: any): Promise<AppUser> => {
    const { password, confirmPassword, shopLatitude, shopLongitude, shopName, ...rest } = data;

    // Create Firebase Auth account
    const cred = await createUserWithEmailAndPassword(auth, data.email, password);
    const uid  = cred.user.uid;

    // Build Firestore user document
    const userDoc: any = {
      ...rest,
      id:        uid,
      email:     data.email.toLowerCase(),
      createdAt: serverTimestamp(),
    };
    // Remove undefined values
    Object.keys(userDoc).forEach((k) => userDoc[k] === undefined && delete userDoc[k]);

    await setDoc(doc(db, "users", uid), userDoc);
    const appUser: AppUser = { ...userDoc };

    // If seller, create the shop document too
    if (data.role === "seller") {
      const shop = await createShop({
        sellerId:    uid,
        name:        shopName || data.name,
        description: "",
        address:     data.location || "",
        area:        data.area     || "",
        city:        data.city     || "",
        phone:       data.phone,
        email:       data.email,
        openHours:   "9 AM – 6 PM",
        isOpen:      true,
        tags:        [],
        latitude:    shopLatitude  ?? null,
        longitude:   shopLongitude ?? null,
      });
      await updateDoc(doc(db, "users", uid), { shopId: shop.id });
      appUser.shopId   = shop.id;
      appUser.shopName = shopName || data.name;
    }

    setUser(appUser);
    return appUser;
  };

  // ── updateProfile ──────────────────────────────────────────────────────────
  const updateProfile = async (updates: Partial<AppUser> & { newPassword?: string; currentPassword?: string }): Promise<void> => {
    if (!user) return;
    const { newPassword, currentPassword, ...firestoreUpdates } = updates as any;

    // Clean undefined
    const clean: any = {};
    for (const [k, v] of Object.entries(firestoreUpdates)) {
      if (v !== undefined) clean[k] = v;
    }

    await updateDoc(doc(db, "users", user.id), { ...clean, updatedAt: serverTimestamp() });
    setUser({ ...user, ...clean });

    // Password change requires re-authentication
    if (newPassword && currentPassword && auth.currentUser?.email) {
      const cred = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, cred);
      await updatePassword(auth.currentUser, newPassword);
    }
  };

  // ── logout ─────────────────────────────────────────────────────────────────
  const logout = async (): Promise<void> => {
    await signOut(auth);
    setUser(null);
  };

  // ── checkEmailExists ───────────────────────────────────────────────────────
  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      const methods = await fetchSignInMethodsForEmail(auth, email.toLowerCase());
      return methods.length > 0;
    } catch {
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      updateProfile,
      logout,
      checkEmailExists,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}