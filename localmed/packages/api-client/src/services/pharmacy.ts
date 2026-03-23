import { apiClient } from '../client';

export interface PharmacyListParams {
  lat: number;
  lng: number;
  radius?: number;
  openNow?: boolean;
  is24h?: boolean;
  sortBy?: 'distance' | 'rating' | 'name';
  page?: number;
  limit?: number;
}

export interface Pharmacy {
  id: string;
  name: string;
  address: string;
  phone?: string;
  distance: number;
  rating: number;
  isOpen: boolean;
  openingTime: string;
  closingTime: string;
  is24h: boolean;
}

export interface PharmacyListResponse {
  pharmacies: Pharmacy[];
  total: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const pharmacyApi = {
  list: (params: PharmacyListParams) =>
    apiClient.get<PharmacyListResponse>('/pharmacies', params),
  
  getById: (id: string) =>
    apiClient.get<Pharmacy>(`/pharmacies/${id}`),
  
  getMedicines: (id: string, params?: { search?: string; category?: string; page?: number; limit?: number }) =>
    apiClient.get(`/pharmacies/${id}/medicines`, params),
  
  getStock: (pharmacyId: string, medicineId: string) =>
    apiClient.get(`/pharmacies/${pharmacyId}/stock`, { medicineId }),
};
