export type UserRole = "buyer" | "seller";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  alternatePhone?: string;
  location?: string;
  address?: {
    state: string;
    pincode: string;
  };
  shopId?: string;
  profilePicture?: string;
  // Buyer specific fields
  companyName?: string;
  // Seller specific fields
  gstNumber?: string;
  panNumber?: string;
}

export interface Shop {
  id: string;
  sellerId: string;
  name: string;
  description: string;
  address: string;
  city: string;
  area: string;
  lat: number;
  lng: number;
  phone: string;
  email: string;
  image: string;
  rating: number;
  reviewCount: number;
  isOpen: boolean;
  openHours: string;
  tags: string[];
  distance?: number;
}

export interface Material {
  id: string;
  shopId: string;
  name: string;
  category: string;
  tags: string[];
  description: string;
  price: number;
  unit: string;
  stockQty: number;
  minOrder: number;
  image?: string; // Made optional to support default images
  inStock: boolean;
  discount?: number;
  brand?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  materialCount: number;
  color: string;
}

export interface Enquiry {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string;
  buyerAddress?: string; // Full address from user profile
  shopId: string;
  shopName: string;
  sellerId: string;
  materialId?: string;
  materialName?: string;
  quantity?: string; // Quantity requested
  message: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  updatedAt: string;
}

export interface Purchase {
  id: string;
  buyerId: string;
  sellerId: string;
  shopId: string;
  materialId: string;
  materialName: string;
  quantity: number;
  totalAmount: number;
  purchaseDate: string;
  status: "completed" | "pending" | "cancelled";
}

export interface Review {
  id: string;
  buyerId: string;
  buyerName: string;
  shopId: string;
  materialId?: string; // Optional - can review seller or material
  materialName?: string;
  enquiryId: string; // Reference to the accepted enquiry
  rating: number; // 1-5 stars
  comment: string;
  createdAt: string;
  updatedAt?: string; // For edits
}