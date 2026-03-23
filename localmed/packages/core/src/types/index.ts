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
  location?: unknown;
  addressType: 'delivery' | 'pickup';
  isDefault: boolean;
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
  location: unknown;
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
  deliveryAddress?: unknown;
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

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled';

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

export type PrescriptionStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: unknown;
  isRead: boolean;
  createdAt: Date;
}
