import { prescriptionRepository, medicineRepository } from '../repositories/index.js';
import { AppError } from '../middleware/errorHandler.js';
import type { PrescriptionStatus } from '../types/index.js';

interface ExtractedMedicine {
  name: string;
  dosage?: string;
  frequency?: string;
  quantity?: string;
  confidence: number;
}

export class PrescriptionService {
  async upload(userId: string, imageUrl: string, thumbnailUrl?: string) {
    const prescription = await prescriptionRepository.create({
      userId,
      imageUrl,
      thumbnailUrl,
      status: 'processing',
    });

    this.processPrescription(prescription.id).catch(console.error);

    return {
      prescriptionId: prescription.id,
      status: prescription.status,
      imageUrl: prescription.imageUrl,
    };
  }

  private async processPrescription(prescriptionId: string) {
    try {
      const prescription = await prescriptionRepository.findById(prescriptionId);

      if (!prescription) return;

      const extractedText = await this.performOCR(prescription.imageUrl);

      const medicines = this.extractMedicinesFromText(extractedText);

      for (const med of medicines) {
        const existingMedicine = await medicineRepository.findByName(med.name);

        await prescriptionRepository.addMedicine(prescriptionId, {
          medicineId: existingMedicine?.id,
          name: med.name,
          dosage: med.dosage,
          frequency: med.frequency,
          quantity: med.quantity,
          confidence: med.confidence,
        });
      }

      await prescriptionRepository.update(prescriptionId, {
        extractedText,
        status: 'completed',
        confidenceScore: medicines.length > 0 ? 0.85 : 0,
      });
    } catch (error) {
      console.error('Error processing prescription:', error);

      await prescriptionRepository.update(prescriptionId, {
        status: 'failed',
      });
    }
  }

  private async performOCR(imageUrl: string): Promise<string> {
    const mockTexts = [
      'Amoxicillin 500mg - 3 times daily',
      'Paracetamol 650mg - as needed for fever',
      'Cetrizine 10mg - once daily',
    ];

    await new Promise((resolve) => setTimeout(resolve, 1000));

    return mockTexts.join('\n');
  }

  private extractMedicinesFromText(text: string): ExtractedMedicine[] {
    const medicines: ExtractedMedicine[] = [];

    const lines = text.split('\n').filter((line) => line.trim());

    const dosageRegex = /(\d+mg|\d+ml)/i;
    const freqRegex = /(\d+\s*(times|daily|weekly|once|twice|thrice))/i;

    for (const line of lines) {
      const nameMatch = line.replace(dosageRegex, '').replace(freqRegex, '').trim();

      if (nameMatch.length > 2) {
        medicines.push({
          name: nameMatch,
          dosage: line.match(dosageRegex)?.[1],
          frequency: line.match(freqRegex)?.[1],
          confidence: 0.8,
        });
      }
    }

    return medicines;
  }

  async getById(prescriptionId: string, userId: string) {
    const prescription = await prescriptionRepository.findById(prescriptionId);

    if (!prescription || prescription.userId !== userId) {
      throw new AppError(404, 'Prescription not found', 'PRESCRIPTION_NOT_FOUND');
    }

    return {
      id: prescription.id,
      status: prescription.status,
      imageUrl: prescription.imageUrl,
      extractedText: prescription.extractedText,
      confidenceScore: prescription.confidenceScore,
      createdAt: prescription.createdAt,
      medicines: prescription.medicines,
    };
  }

  async getMedicines(prescriptionId: string, userId: string) {
    const prescription = await prescriptionRepository.findById(prescriptionId);

    if (!prescription || prescription.userId !== userId) {
      throw new AppError(404, 'Prescription not found', 'PRESCRIPTION_NOT_FOUND');
    }

    return {
      prescriptionId: prescription.id,
      status: prescription.status,
      medicines: prescription.medicines.map((m) => ({
        id: m.id,
        name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        quantity: m.quantity,
        confidence: m.confidence,
        isVerified: m.isVerified,
        matchedMedicine: m.medicine
          ? {
              id: m.medicine.id,
              name: m.medicine.name,
            }
          : null,
      })),
    };
  }

  async verifyMedicine(
    prescriptionId: string,
    medicineId: string,
    userId: string,
    matchedMedicineId?: string
  ) {
    const prescription = await prescriptionRepository.findById(prescriptionId);

    if (!prescription || prescription.userId !== userId) {
      throw new AppError(404, 'Prescription not found', 'PRESCRIPTION_NOT_FOUND');
    }

    const prescriptionMedicine = await prescriptionRepository.findMedicineById(medicineId);

    if (!prescriptionMedicine || prescriptionMedicine.prescriptionId !== prescriptionId) {
      throw new AppError(404, 'Medicine not found', 'MEDICINE_NOT_FOUND');
    }

    return prescriptionRepository.updateMedicine(medicineId, {
      medicineId: matchedMedicineId,
      isVerified: true,
    });
  }

  async getUserPrescriptions(userId: string, options?: { page?: number; limit?: number }) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const offset = (page - 1) * limit;

    return prescriptionRepository.findByUser(userId, { limit, offset });
  }
}

export const prescriptionService = new PrescriptionService();
