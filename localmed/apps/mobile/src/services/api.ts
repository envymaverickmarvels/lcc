import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:3000/api/v1';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  message?: string;
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await AsyncStorage.getItem('token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async get<T>(endpoint: string, params?: Record<string, string | number>): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: await this.getAuthHeaders(),
    });

    const data: ApiResponse<T> = await response.json();

    if (!data.success) {
      throw new Error(data.error?.message || 'Request failed');
    }

    return data.data as T;
  }

  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });

    const data: ApiResponse<T> = await response.json();

    if (!data.success) {
      throw new Error(data.error?.message || 'Request failed');
    }

    return data.data as T;
  }

  async put<T>(endpoint: string, body?: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: await this.getAuthHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });

    const data: ApiResponse<T> = await response.json();

    if (!data.success) {
      throw new Error(data.error?.message || 'Request failed');
    }

    return data.data as T;
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: await this.getAuthHeaders(),
    });

    const data: ApiResponse<T> = await response.json();

    if (!data.success) {
      throw new Error(data.error?.message || 'Request failed');
    }

    return data.data as T;
  }
}

export const api = new ApiService();

export interface Medicine {
  id: string;
  name: string;
  genericName?: string;
  manufacturer?: string;
  category?: string;
  requiresPrescription: boolean;
}

export interface Pharmacy {
  pharmacyId: string;
  name: string;
  address: string;
  phone?: string;
  distance: number;
  stock: number;
  price: number;
  rating?: number;
  isOpen?: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: string;
  type: string;
  totalAmount: number;
  createdAt: string;
  items: OrderItem[];
  pharmacy?: Pharmacy;
}

export interface OrderItem {
  id: string;
  medicineId: string;
  quantity: number;
  price: number;
  total: number;
  medicineName?: string;
}

export interface User {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  isVerified: boolean;
}

export interface Address {
  id: string;
  label: string;
  fullName: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
}

export interface Prescription {
  id: string;
  status: string;
  imageUrl: string;
  createdAt: string;
  medicines?: PrescriptionMedicine[];
}

export interface PrescriptionMedicine {
  id: string;
  name: string;
  dosage?: string;
  frequency?: string;
  isVerified: boolean;
}

export const authApi = {
  register: (phone: string, name?: string, email?: string) =>
    api.post<{ userId: string; otpSent: boolean }>('/auth/register', { phone, name, email }),
  verifyOtp: (phone: string, otp: string) =>
    api.post<{ token: string; refreshToken: string; user: User }>('/auth/verify-otp', { phone, otp }),
  refreshToken: (refreshToken: string) =>
    api.post<{ token: string; refreshToken: string }>('/auth/refresh-token', { refreshToken }),
};

export const userApi = {
  getProfile: () => api.get<User>('/users/profile'),
  updateProfile: (data: Partial<User>) => api.put<User>('/users/profile', data),
  getAddresses: () => api.get<Address[]>('/users/addresses'),
  addAddress: (data: Omit<Address, 'id'>) => api.post<Address>('/users/addresses', data),
  updateAddress: (id: string, data: Partial<Address>) => api.put<Address>(`/users/addresses/${id}`, data),
  deleteAddress: (id: string) => api.delete(`/users/addresses/${id}`),
};

export const medicineApi = {
  search: (params: { q: string; lat: number; lng: number; radius?: number }) =>
    api.get<{ medicines: Medicine[]; pharmacies: Pharmacy[] }>('/medicines/search', params),
  getSuggestions: (q: string) =>
    api.get<{ suggestions: { name: string; genericName?: string }[] }>('/medicines/suggestions', { q }),
  getCategories: () => api.get<{ categories: { id: string; name: string }[] }>('/medicines/categories'),
  getById: (id: string) => api.get<Medicine>(`/medicines/${id}`),
};

export const pharmacyApi = {
  getNearby: (params: { lat: number; lng: number; radius?: number }) =>
    api.get<{ pharmacies: Pharmacy[] }>('/pharmacies', params),
  getById: (id: string) => api.get(`/pharmacies/${id}`),
  getMedicines: (id: string, params?: { search?: string }) =>
    api.get(`/pharmacies/${id}/medicines`, params),
};

export const orderApi = {
  create: (data: {
    pharmacyId: string;
    type: 'pickup' | 'delivery';
    items: { medicineId: string; quantity: number }[];
    notes?: string;
  }) => api.post<Order>('/orders', data),
  getAll: (params?: { status?: string; page?: number }) => api.get<{ orders: Order[] }>('/orders', params),
  getById: (id: string) => api.get<Order>(`/orders/${id}`),
  cancel: (id: string, reason: string) => api.post(`/orders/${id}/cancel`, { reason }),
  reorder: (id: string) => api.post(`/orders/${id}/reorder`),
};

export const prescriptionApi = {
  upload: async (imageUri: string): Promise<{ prescriptionId: string }> => {
    const token = await AsyncStorage.getItem('token');
    const formData = new FormData();

    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'prescription.jpg',
    } as unknown as Blob);

    const response = await fetch(`${API_BASE_URL}/prescriptions/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error?.message || 'Upload failed');
    }
    return data.data;
  },
  getById: (id: string) => api.get<Prescription>(`/prescriptions/${id}`),
  getMedicines: (id: string) => api.get(`/prescriptions/${id}/medicines`),
};

export const notificationApi = {
  getAll: (params?: { page?: number }) => api.get<{ notifications: unknown[] }>('/notifications', params),
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  subscribe: (data: unknown) => api.post('/notifications/subscribe', data),
};

export const emergencyApi = {
  search: (params: { q: string; lat: number; lng: number; emergency?: boolean }) =>
    api.get('/emergency/emergency-search', params),
  get24hPharmacies: (params: { lat: number; lng: number }) =>
    api.get('/emergency/24h-pharmacies', params),
  getNearbyHospitals: (params: { lat: number; lng: number }) =>
    api.get('/emergency/nearby-hospitals', params),
};

export default api;
