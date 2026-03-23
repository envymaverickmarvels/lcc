export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export const MEDICINE_CATEGORIES = [
  'Analgesics',
  'Antibiotics',
  'Antipyretics',
  'Antihistamines',
  'Cough & Cold',
  'Diabetes',
  'Digestive',
  'Eye Care',
  'Heart Health',
  'Mental Health',
  'Pain Relief',
  'Skin Care',
  'Vitamins & Supplements',
];

export const ORDER_STATUSES = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  completed: 'Completed',
  cancelled: 'Cancelled',
} as const;

export const PRESCRIPTION_STATUSES = {
  pending: 'Pending',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
} as const;
