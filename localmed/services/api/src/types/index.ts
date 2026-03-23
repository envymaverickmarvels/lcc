export interface User {
  id: string;
  phone: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  dateOfBirth?: Date;
  gender?: string;
  bloodType?: string;
  allergies?: string[];
  chronicConditions?: string[];
  isVerified: boolean;
  isActive: boolean;
  isPharmacyOwner: boolean;
  preferredLanguage: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Pharmacy {
  id: string;
  ownerId?: string;
  name: string;
  licenseNumber?: string;
  address: string;
  phone?: string;
  email?: string;
  openingTime: string;
  closingTime: string;
  is24h: boolean;
  isDelivery: boolean;
  deliveryRadiusKm?: number;
  rating: number;
  totalReviews: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Medicine {
  id: string;
  name: string;
  genericName?: string;
  manufacturer?: string;
  category?: string;
  subcategory?: string;
  composition?: string;
  dosageForm?: string;
  strength?: string;
  requiresPrescription: boolean;
  isEssential: boolean;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PharmacyStock {
  id: string;
  pharmacyId: string;
  medicineId: string;
  batchNumber?: string;
  expiryDate?: Date;
  mrp?: number;
  sellingPrice: number;
  costPrice?: number;
  stockQuantity: number;
  reorderLevel: number;
  isAvailable: boolean;
  lastRestockedAt?: Date;
  updatedAt: Date;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  pharmacyId: string;
  status: OrderStatus;
  type: OrderType;
  deliveryAddress?: Record<string, unknown>;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  totalAmount: number;
  prescriptionId?: string;
  notes?: string;
  estimatedPickupTime?: Date;
  pickedUpAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
export type OrderType = 'pickup' | 'delivery';

export interface OrderItem {
  id: string;
  orderId: string;
  medicineId: string;
  pharmacyStockId?: string;
  medicineName?: string;
  quantity: number;
  price: number;
  total: number;
  createdAt: Date;
}

export interface Prescription {
  id: string;
  userId: string;
  imageUrl: string;
  thumbnailUrl?: string;
  extractedText?: string;
  status: PrescriptionStatus;
  confidenceScore?: number;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type PrescriptionStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: Date;
}

export interface Address {
  id: string;
  userId: string;
  label: string;
  fullName: string;
  phone?: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  addressType: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PharmacyReview {
  id: string;
  pharmacyId: string;
  userId: string;
  rating: number;
  comment?: string;
  isVerified: boolean;
  createdAt: Date;
}

export interface UserDevice {
  id: string;
  userId: string;
  deviceId: string;
  deviceType: string;
  deviceName?: string;
  deviceModel?: string;
  osVersion?: string;
  pushEnabled: boolean;
  notificationToken?: string;
  isActive: boolean;
  lastActiveAt?: Date;
  createdAt: Date;
}

export interface SearchParams {
  q: string;
  lat: number;
  lng: number;
  radius?: number;
  category?: string;
  requiresRx?: boolean;
  genericOnly?: boolean;
  openNow?: boolean;
  is24h?: boolean;
  sortBy?: 'distance' | 'price' | 'rating';
  page?: number;
  limit?: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  message?: string;
}

export interface TokenPayload {
  id: string;
  phone: string;
  type: string;
}

export interface AuthTokens {
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface SearchMedicinesResult {
  medicines: Medicine[];
  pharmacies: PharmacyWithStock[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface PharmacyWithStock {
  pharmacyId: string;
  name: string;
  address: string;
  phone?: string;
  distance: number;
  stock: number;
  price: number;
  rating?: number;
  isOpen?: boolean;
  openingTime?: string;
  closingTime?: string;
  is24h?: boolean;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
  pharmacy?: Pharmacy;
  user?: Partial<User>;
}

export interface CreateOrderInput {
  pharmacyId: string;
  type: OrderType;
  items: Array<{
    medicineId: string;
    quantity: number;
  }>;
  prescriptionId?: string;
  notes?: string;
  deliveryAddress?: {
    fullName: string;
    phone: string;
    addressLine1: string;
    city: string;
    state: string;
    postalCode: string;
    lat?: number;
    lng?: number;
  };
}

export interface EmergencySearchResult {
  isEmergency: boolean;
  medicines: Medicine[];
  pharmacies: PharmacyWithStock[];
  lifeSavingMedicine: {
    id: string;
    name: string;
  } | null;
}

export interface PharmacyStats {
  todayOrders: number;
  pendingOrders: number;
  completedOrders: number;
  lowStockItems: number;
  todayRevenue: number;
}

export interface AnalyticsData {
  summary: {
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    totalRevenue: number;
    completionRate: string;
  };
  topMedicines: Array<{
    name: string;
    quantity: number;
  }>;
  dailyOrders: Array<{
    date: Date;
    orders: number;
    revenue: number;
  }>;
}
