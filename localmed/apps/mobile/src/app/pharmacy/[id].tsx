import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MapPin, Phone, Clock, Star, ShoppingCart } from 'lucide-react-native';

interface Medicine {
  id: string;
  name: string;
  category?: string;
  stock: number;
  price: number;
  requiresPrescription: boolean;
}

interface Pharmacy {
  id: string;
  name: string;
  address: string;
  phone?: string;
  openingTime: string;
  closingTime: string;
  is24h: boolean;
  isDelivery: boolean;
  rating: number;
}

export default function PharmacyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Array<{ id: string; name: string; price: number; quantity: number }>>([]);
  const router = useRouter();

  useEffect(() => {
    fetchPharmacyDetails();
  }, [id]);

  const fetchPharmacyDetails = async () => {
    try {
      const [pharmacyRes, medicinesRes] = await Promise.all([
        fetch(`http://localhost:3000/api/v1/pharmacies/${id}`),
        fetch(`http://localhost:3000/api/v1/pharmacies/${id}/medicines?limit=50`),
      ]);

      const pharmacyData = await pharmacyRes.json();
      const medicinesData = await medicinesRes.json();

      if (pharmacyData.success) {
        setPharmacy(pharmacyData.data);
      }
      if (medicinesData.success) {
        setMedicines(medicinesData.data.medicines);
      }
    } catch (error) {
      console.error('Failed to fetch pharmacy:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (medicine: Medicine) => {
    const existing = cart.find((item) => item.id === medicine.id);
    if (existing) {
      setCart(cart.map((item) =>
        item.id === medicine.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { id: medicine.id, name: medicine.name, price: medicine.price, quantity: 1 }]);
    }
  };

  const getCartCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          
          <Text style={styles.pharmacyName}>{pharmacy?.name}</Text>
          
          <View style={styles.ratingRow}>
            <Star size={16} color="#f59e0b" />
            <Text style={styles.rating}>{pharmacy?.rating || 'New'}</Text>
            <MapPin size={16} color="#64748b" />
            <Text style={styles.address}>{pharmacy?.address}</Text>
          </View>

          <View style={styles.badges}>
            {pharmacy?.is24h && <View style={styles.badge}><Text style={styles.badgeText}>24/7</Text></View>}
            {pharmacy?.isDelivery && <View style={styles.badge}><Text style={styles.badgeText}>Delivery</Text></View>}
          </View>
        </View>

        <View style={styles.contactRow}>
          {pharmacy?.phone && (
            <TouchableOpacity style={styles.contactButton}>
              <Phone size={20} color="#2563eb" />
              <Text style={styles.contactText}>Call</Text>
            </TouchableOpacity>
          )}
          <View style={styles.contactButton}>
            <Clock size={20} color="#2563eb" />
            <Text style={styles.contactText}>
              {pharmacy?.is24h ? 'Open 24/7' : `${pharmacy?.openingTime} - ${pharmacy?.closingTime}`}
            </Text>
          </View>
        </View>

        <View style={styles.medicinesSection}>
          <Text style={styles.sectionTitle}>Available Medicines</Text>
          
          {medicines.length === 0 ? (
            <Text style={styles.emptyText}>No medicines available</Text>
          ) : (
            medicines.map((medicine) => (
              <View key={medicine.id} style={styles.medicineCard}>
                <View style={styles.medicineInfo}>
                  <Text style={styles.medicineName}>{medicine.name}</Text>
                  {medicine.category && (
                    <Text style={styles.medicineCategory}>{medicine.category}</Text>
                  )}
                </View>
                <View style={styles.medicineRight}>
                  <View style={styles.stockPrice}>
                    <Text style={[
                      styles.stock,
                      medicine.stock > 10 ? styles.inStock : medicine.stock > 0 ? styles.lowStock : styles.outStock
                    ]}>
                      {medicine.stock > 0 ? `${medicine.stock} in stock` : 'Out of stock'}
                    </Text>
                    <Text style={styles.price}>₹{medicine.price}</Text>
                  </View>
                  {medicine.stock > 0 && (
                    <TouchableOpacity
                      style={styles.addButton}
                      onPress={() => addToCart(medicine)}
                    >
                      <ShoppingCart size={16} color="#fff" />
                      <Text style={styles.addButtonText}>Add</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {cart.length > 0 && (
        <TouchableOpacity style={styles.cartBar} onPress={() => router.push('/cart')}>
          <View style={styles.cartInfo}>
            <Text style={styles.cartCount}>{getCartCount()} items</Text>
            <Text style={styles.cartTotal}>₹{getCartTotal()}</Text>
          </View>
          <Text style={styles.viewCartText}>View Cart</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    color: '#2563eb',
    fontSize: 16,
  },
  pharmacyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f59e0b',
    marginRight: 16,
  },
  address: {
    fontSize: 14,
    color: '#64748b',
    flex: 1,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '600',
  },
  contactRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    gap: 16,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
  },
  contactText: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '500',
  },
  medicinesSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#64748b',
    paddingVertical: 20,
  },
  medicineCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  medicineInfo: {
    flex: 1,
  },
  medicineName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  medicineCategory: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  medicineRight: {
    alignItems: 'flex-end',
  },
  stockPrice: {
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  stock: {
    fontSize: 12,
    marginBottom: 4,
  },
  inStock: { color: '#22c55e' },
  lowStock: { color: '#f59e0b' },
  outStock: { color: '#ef4444' },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2563eb',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2563eb',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  cartBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    padding: 16,
  },
  cartInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cartCount: {
    color: '#fff',
    fontSize: 14,
  },
  cartTotal: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  viewCartText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
