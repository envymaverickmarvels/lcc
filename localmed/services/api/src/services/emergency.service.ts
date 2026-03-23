import { medicineRepository, pharmacyRepository, stockRepository } from '../repositories/index.js';
import type { EmergencySearchResult, PharmacyWithStock, Medicine } from '../types/index.js';

const LIFE_SAVING_MEDICINES = [
  'insulin',
  'inhaler',
  'epinephrine',
  'nitroglycerin',
  'aspirin',
  'glucose',
  'salbutamol',
  'omeprazole',
  'prednisone',
  'diazepam',
];

export class EmergencyService {
  async emergencySearch(
    query: string,
    lat: number,
    lng: number,
    radiusKm: number = 10,
    emergency?: boolean
  ): Promise<EmergencySearchResult> {
    const isEmergency =
      emergency ||
      LIFE_SAVING_MEDICINES.some((med) => query.toLowerCase().includes(med));

    const searchRadius = radiusKm * 1000;

    const medicines = await medicineRepository.search(query, { limit: 10 });

    if (medicines.length === 0) {
      return {
        isEmergency,
        medicines: [],
        pharmacies: [],
        lifeSavingMedicine: null,
      };
    }

    const medicineIds = medicines.map((m) => m.id);

    const pharmacies = await stockRepository.searchNearbyWithStock(medicineIds, lat, lng, searchRadius, {
      is24h: isEmergency,
      sortBy: 'distance',
      limit: 20,
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
      isOpen: true,
      openingTime: p.openingTime,
      closingTime: p.closingTime,
      is24h: p.is24h,
    }));

    const formattedMedicines: Medicine[] = medicines.map((m) => ({
      id: m.id,
      name: m.name,
      genericName: m.genericName || undefined,
      manufacturer: m.manufacturer || undefined,
      category: m.category || undefined,
      requiresPrescription: m.requiresPrescription,
      isEssential: m.isEssential,
      composition: m.composition || undefined,
      dosageForm: m.dosageForm || undefined,
      strength: m.strength || undefined,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    }));

    const lifeSavingMedicine = isEmergency
      ? medicines.find((m) =>
          LIFE_SAVING_MEDICINES.some((med) => m.name.toLowerCase().includes(med))
        )
      : null;

    return {
      isEmergency,
      medicines: formattedMedicines,
      pharmacies: formattedPharmacies,
      lifeSavingMedicine: lifeSavingMedicine
        ? {
            id: lifeSavingMedicine.id,
            name: lifeSavingMedicine.name,
          }
        : null,
    };
  }

  async get24hPharmacies(lat: number, lng: number, radiusKm: number = 10) {
    return pharmacyRepository.find24h(lat, lng, radiusKm);
  }

  async getNearbyHospitals(_lat: number, _lng: number, _radiusKm: number = 10) {
    const mockHospitals = [
      {
        id: '1',
        name: 'City Hospital',
        address: '123 Main Road',
        phone: '+91 98765 43210',
        distance: 2.5,
      },
      {
        id: '2',
        name: 'Emergency Medical Center',
        address: '456 Hospital Road',
        phone: '+91 98765 43211',
        distance: 4.2,
      },
    ];

    return mockHospitals;
  }

  async getLifeSavingMedicines() {
    const medicines = await medicineRepository.findEssential();

    return medicines.map((m) => ({
      id: m.id,
      name: m.name,
      genericName: m.genericName,
      category: m.category,
    }));
  }

  isLifeSavingMedicine(name: string): boolean {
    return LIFE_SAVING_MEDICINES.some((med) => name.toLowerCase().includes(med));
  }
}

export const emergencyService = new EmergencyService();
