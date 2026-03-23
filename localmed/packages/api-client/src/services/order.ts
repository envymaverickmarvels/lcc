import { apiClient } from '../client';

export interface CreateOrderParams {
  pharmacyId: string;
  type: 'pickup' | 'delivery';
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
  };
}

export interface OrderItem {
  id: string;
  medicineId: string;
  medicineName?: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: string;
  type: string;
  totalAmount: number;
  estimatedPickupTime?: string;
  createdAt: string;
  pharmacy: {
    name: string;
    phone: string;
    address: string;
  };
  items: OrderItem[];
}

export const orderApi = {
  create: (params: CreateOrderParams) =>
    apiClient.post<Order>('/orders', params),
  
  list: (params?: { status?: string; page?: number; limit?: number }) =>
    apiClient.get<{ orders: Order[]; pagination: any }>('/orders', params),
  
  getById: (id: string) =>
    apiClient.get<Order>(`/orders/${id}`),
  
  cancel: (id: string, reason?: string) =>
    apiClient.put(`/orders/${id}/cancel`, { reason }),
};
