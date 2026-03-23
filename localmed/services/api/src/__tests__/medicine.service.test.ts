import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MedicineService } from '../services/medicine.service.js';
import { medicineRepository, stockRepository } from '../repositories/index.js';

vi.mock('../repositories/index.js');

describe('MedicineService', () => {
  let medicineService: MedicineService;

  beforeEach(() => {
    medicineService = new MedicineService();
    vi.clearAllMocks();
  });

  describe('search', () => {
    it('should return empty results when no medicines found', async () => {
      (medicineRepository.search as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const result = await medicineService.search({
        q: 'unknown',
        lat: 28.6139,
        lng: 77.2090,
      });

      expect(result.medicines).toEqual([]);
      expect(result.pharmacies).toEqual([]);
    });

    it('should return medicines and pharmacies when found', async () => {
      const mockMedicines = [
        {
          id: 'med-001',
          name: 'Paracetamol 500',
          genericName: 'Acetaminophen',
          manufacturer: 'Cipla',
          category: 'Analgesic',
          requiresPrescription: false,
          composition: 'Paracetamol 500mg',
          dosageForm: 'Tablet',
          strength: '500mg',
        },
      ];

      const mockPharmacies = [
        {
          pharmacyId: 'pharm-001',
          name: 'Sharma Medicos',
          address: 'Shop 12, Karol Bagh',
          phone: '+919876543210',
          distance: { toFixed: () => '0.5' },
          stock: 50,
          price: { toString: () => '28.00' },
          rating: { toString: () => '4.5' },
          openingTime: '08:00',
          closingTime: '22:00',
          is24h: false,
        },
      ];

      (medicineRepository.search as ReturnType<typeof vi.fn>).mockResolvedValue(mockMedicines);
      (stockRepository.searchNearbyWithStock as ReturnType<typeof vi.fn>).mockResolvedValue(mockPharmacies);

      const result = await medicineService.search({
        q: 'paracetamol',
        lat: 28.6139,
        lng: 77.2090,
      });

      expect(result.medicines).toHaveLength(1);
      expect(result.medicines[0].name).toBe('Paracetamol 500');
      expect(result.pharmacies).toHaveLength(1);
      expect(result.pharmacies[0].name).toBe('Sharma Medicos');
    });

    it('should respect pagination parameters', async () => {
      (medicineRepository.search as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (stockRepository.searchNearbyWithStock as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const result = await medicineService.search({
        q: 'paracetamol',
        lat: 28.6139,
        lng: 77.2090,
        page: 2,
        limit: 10,
      });

      expect(result.pagination.page).toBe(2);
      expect(result.pagination.limit).toBe(10);
    });
  });

  describe('getSuggestions', () => {
    it('should return medicine suggestions', async () => {
      const mockSuggestions = [
        { name: 'Paracetamol 500', genericName: 'Acetaminophen', manufacturer: 'Cipla', category: 'Analgesic' },
        { name: 'Paracetamol 650', genericName: 'Acetaminophen', manufacturer: 'Cipla', category: 'Analgesic' },
      ];

      (medicineRepository.getSuggestions as ReturnType<typeof vi.fn>).mockResolvedValue(mockSuggestions);

      const result = await medicineService.getSuggestions('paracet', 10);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Paracetamol 500');
    });
  });

  describe('getById', () => {
    it('should return medicine details', async () => {
      const mockMedicine = {
        id: 'med-001',
        name: 'Paracetamol 500',
        genericName: 'Acetaminophen',
        manufacturer: 'Cipla',
        category: 'Analgesic',
        composition: 'Paracetamol 500mg',
        dosageForm: 'Tablet',
        strength: '500mg',
        requiresPrescription: false,
        isEssential: true,
        imageUrl: null,
        alternatives: [],
      };

      (medicineRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(mockMedicine);

      const result = await medicineService.getById('med-001');

      expect(result?.id).toBe('med-001');
      expect(result?.name).toBe('Paracetamol 500');
      expect(result?.alternatives).toEqual([]);
    });

    it('should return null for non-existent medicine', async () => {
      (medicineRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const result = await medicineService.getById('med-999');

      expect(result).toBeNull();
    });
  });
});
