import {
  medicineRepository,
  pharmacyRepository,
  stockRepository,
} from '../repositories/index.js';
import type {
  SearchParams,
  SearchMedicinesResult,
  PharmacyWithStock,
  Medicine,
} from '../types/index.js';

export class MedicineService {
  async search(params: SearchParams): Promise<SearchMedicinesResult> {
    const {
      q,
      lat,
      lng,
      radius = 5,
      category,
      requiresRx,
      genericOnly,
      is24h,
      sortBy = 'distance',
      page = 1,
      limit = 20,
    } = params;

    const medicines = await medicineRepository.search(q, { category, limit: 20 });

    if (medicines.length === 0) {
      return {
        medicines: [],
        pharmacies: [],
        pagination: { page, limit, total: 0, pages: 0 },
      };
    }

    const medicineIds = medicines.map((m) => m.id);
    const offset = (page - 1) * limit;

    const pharmacies = await stockRepository.searchNearbyWithStock(medicineIds, lat, lng, radius, {
      is24h,
      sortBy,
      limit,
      offset,
    });

    const formattedPharmacies: PharmacyWithStock[] = pharmacies.map((p) => ({
      pharmacyId: p.pharmacyId,
      name: p.name,
      address: p.address,
      phone: p.phone || undefined,
      distance: Number(p.distance.toFixed(2)),
      stock: Number(p.stock),
      price: Number(p.price),
      rating: Number(p.rating),
      isOpen: this.isPharmacyOpen(p.openingTime, p.closingTime, p.is24h),
      openingTime: p.openingTime,
      closingTime: p.closingTime,
      is24h: p.is24h,
    }));

    return {
      medicines: medicines.map(this.formatMedicine),
      pharmacies: formattedPharmacies,
      pagination: {
        page,
        limit,
        total: pharmacies.length,
        pages: Math.ceil(pharmacies.length / limit),
      },
    };
  }

  async getSuggestions(query: string, limit = 10) {
    const suggestions = await medicineRepository.getSuggestions(query, limit);

    return suggestions.map((s) => ({
      name: s.name,
      genericName: s.genericName,
      manufacturer: s.manufacturer,
      category: s.category,
    }));
  }

  async getCategories() {
    return medicineRepository.getCategories();
  }

  async getById(id: string) {
    const medicine = await medicineRepository.findById(id);

    if (!medicine) {
      return null;
    }

    return {
      id: medicine.id,
      name: medicine.name,
      genericName: medicine.genericName,
      manufacturer: medicine.manufacturer,
      category: medicine.category,
      composition: medicine.composition,
      dosageForm: medicine.dosageForm,
      strength: medicine.strength,
      requiresPrescription: medicine.requiresPrescription,
      isEssential: medicine.isEssential,
      imageUrl: medicine.imageUrl,
      alternatives: medicine.alternatives.map((a) => ({
        id: a.alternative.id,
        name: a.alternative.name,
        genericName: a.alternative.genericName,
      })),
    };
  }

  private formatMedicine(medicine: {
    id: string;
    name: string;
    genericName: string | null;
    manufacturer: string | null;
    category: string | null;
    requiresPrescription: boolean;
    composition: string | null;
    dosageForm: string | null;
    strength: string | null;
  }): Medicine {
    return {
      id: medicine.id,
      name: medicine.name,
      genericName: medicine.genericName || undefined,
      manufacturer: medicine.manufacturer || undefined,
      category: medicine.category || undefined,
      requiresPrescription: medicine.requiresPrescription,
      composition: medicine.composition || undefined,
      dosageForm: medicine.dosageForm || undefined,
      strength: medicine.strength || undefined,
      isEssential: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private isPharmacyOpen(openingTime: string, closingTime: string, is24h: boolean): boolean {
    if (is24h) return true;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [openHour, openMin] = openingTime.split(':').map(Number);
    const [closeHour, closeMin] = closingTime.split(':').map(Number);

    const openMinutes = openHour * 60 + openMin;
    const closeMinutes = closeHour * 60 + closeMin;

    if (closeMinutes < openMinutes) {
      return currentTime >= openMinutes || currentTime <= closeMinutes;
    }

    return currentTime >= openMinutes && currentTime <= closeMinutes;
  }
}

export class PharmacyService {
  async getNearby(
    lat: number,
    lng: number,
    radiusKm: number,
    options?: { is24h?: boolean; sortBy?: string; page?: number; limit?: number }
  ) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const offset = (page - 1) * limit;

    const pharmacies = await pharmacyRepository.findNearby(lat, lng, radiusKm, {
      is24h: options?.is24h,
      limit,
      offset,
    });

    return {
      pharmacies: pharmacies.map((p) => ({
        id: p.id,
        name: p.name,
        address: p.address,
        phone: p.phone,
        openingTime: p.openingTime,
        closingTime: p.closingTime,
        is24h: p.is24h,
        rating: Number(p.rating),
        totalReviews: p.totalReviews,
        distance: Number(p.distance.toFixed(2)),
      })),
      pagination: {
        page,
        limit,
        total: pharmacies.length,
        pages: Math.ceil(pharmacies.length / limit),
      },
    };
  }

  async getById(id: string) {
    const pharmacy = await pharmacyRepository.findById(id);

    if (!pharmacy) {
      return null;
    }

    const medicineCount = await pharmacyRepository.getMedicineCount(id);

    return {
      id: pharmacy.id,
      name: pharmacy.name,
      address: pharmacy.address,
      phone: pharmacy.phone,
      email: pharmacy.email,
      openingTime: pharmacy.openingTime,
      closingTime: pharmacy.closingTime,
      is24h: pharmacy.is24h,
      isDelivery: pharmacy.isDelivery,
      rating: Number(pharmacy.rating),
      totalReviews: pharmacy.totalReviews,
      photos: pharmacy.photos,
      operatingHours: pharmacy.operatingHours,
      medicineCount,
    };
  }

  async getMedicines(
    pharmacyId: string,
    options?: { search?: string; category?: string; page?: number; limit?: number }
  ) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const offset = (page - 1) * limit;

    const stockItems = await pharmacyRepository.getMedicines(pharmacyId, {
      search: options?.search,
      category: options?.category,
      limit,
      offset,
    });

    return {
      medicines: stockItems.map((item) => ({
        id: item.medicine.id,
        name: item.medicine.name,
        genericName: item.medicine.genericName,
        manufacturer: item.medicine.manufacturer,
        category: item.medicine.category,
        stock: item.stockQuantity,
        price: Number(item.sellingPrice),
        requiresPrescription: item.medicine.requiresPrescription,
      })),
      pagination: {
        page,
        limit,
      },
    };
  }

  async getStock(pharmacyId: string, medicineId: string) {
    const stock = await stockRepository.findByPharmacyAndMedicine(pharmacyId, medicineId);

    if (!stock) {
      return null;
    }

    return {
      pharmacyId,
      medicineId,
      stock: stock.stockQuantity,
      price: Number(stock.sellingPrice),
      updatedAt: stock.updatedAt,
    };
  }

  async updateProfile(pharmacyId: string, data: Partial<{
    name: string;
    phone: string;
    email: string;
    address: string;
    openingTime: string;
    closingTime: string;
    is24h: boolean;
    isDelivery: boolean;
    deliveryRadiusKm: number;
  }>) {
    const pharmacy = await pharmacyRepository.findById(pharmacyId);

    if (!pharmacy) {
      throw new Error('Pharmacy not found');
    }

    return pharmacyRepository.update(pharmacyId, data);
  }

  async get24hPharmacies(lat: number, lng: number, radiusKm: number) {
    const pharmacies = await pharmacyRepository.find24h(lat, lng, radiusKm);

    return {
      pharmacies: pharmacies.map((p) => ({
        id: p.id,
        name: p.name,
        address: p.address,
        phone: p.phone,
        rating: Number(p.rating),
        distance: Number(p.distance.toFixed(2)),
      })),
      total: pharmacies.length,
    };
  }
}

export const medicineService = new MedicineService();
export const pharmacyService = new PharmacyService();
