import { apiClient } from '../client';

export interface SearchMedicinesParams {
  q: string;
  lat: number;
  lng: number;
  radius?: number;
  page?: number;
  limit?: number;
}

export interface Medicine {
  id: string;
  name: string;
  genericName?: string;
  manufacturer?: string;
  category?: string;
  requiresPrescription: boolean;
}

export interface PharmacyWithStock {
  pharmacyId: string;
  name: string;
  address: string;
  phone?: string;
  distance: number;
  stock: number;
  price: number;
}

export interface SearchMedicinesResponse {
  medicines: Medicine[];
  pharmacies: PharmacyWithStock[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const medicineApi = {
  search: (params: SearchMedicinesParams) => 
    apiClient.get<SearchMedicinesResponse>('/medicines/search', params),
  
  suggestions: (q: string, limit = 10) => 
    apiClient.get<{ suggestions: string[] }>('/medicines/suggestions', { q, limit }),
  
  getById: (id: string) => 
    apiClient.get<Medicine>(`/medicines/${id}`),
};
