import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, Phone, CreditCard } from 'lucide-react-native';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface DeliveryAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
}

export default function CheckoutScreen() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<'pickup' | 'delivery'>('pickup');
  const [address, setAddress] = useState<DeliveryAddress>({
    fullName: '',
    phone: '',
    addressLine1: '',
    city: '',
    state: '',
    postalCode: '',
  });
  const [placingOrder, setPlacingOrder] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  const getSubtotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getTotal = () => {
    return getSubtotal() + (orderType === 'delivery' ? 50 : 0);
  };

  const placeOrder = async () => {
    if (orderType === 'delivery' && (!address.fullName || !address.phone || !address.addressLine1)) {
      Alert.alert('Error', 'Please fill in delivery address');
      return;
    }

    setPlacingOrder(true);
    try {
      const response = await fetch('http://localhost:3000/api/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          pharmacyId: 'pharmacy-1',
          type: orderType,
          items: cart.map((item) => ({
            medicineId: item.id,
            quantity: item.quantity,
          })),
          deliveryAddress: orderType === 'delivery' ? address : undefined,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        localStorage.removeItem('cart');
        router.push('/orders');
      } else {
        Alert.alert('Error', data.error?.message || 'Failed to place order');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to place order. Please try again.');
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Checkout</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Type</Text>
        <View style={styles.typeOptions}>
          <TouchableOpacity
            style={[styles.typeOption, orderType === 'pickup' && styles.typeOptionSelected]}
            onPress={() => setOrderType('pickup')}
          >
            <Text style={[styles.typeOptionText, orderType === 'pickup' && styles.typeOptionTextSelected]}>
              Pickup
            </Text>
            <Text style={styles.typeOptionSubtext}>Collect from pharmacy</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeOption, orderType === 'delivery' && styles.typeOptionSelected]}
            onPress={() => setOrderType('delivery')}
          >
            <Text style={[styles.typeOptionText, orderType === 'delivery' && styles.typeOptionTextSelected]}>
              Delivery
            </Text>
            <Text style={styles.typeOptionSubtext}>Delivered to your address</Text>
          </TouchableOpacity>
        </View>
      </View>

      {orderType === 'delivery' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={address.fullName}
                onChangeText={(text) => setAddress({ ...address, fullName: text })}
                placeholder="Enter your name"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={address.phone}
                onChangeText={(text) => setAddress({ ...address, phone: text })}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Address</Text>
              <TextInput
                style={styles.input}
                value={address.addressLine1}
                onChangeText={(text) => setAddress({ ...address, addressLine1: text })}
                placeholder="Enter address"
                multiline
              />
            </View>
            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>City</Text>
                <TextInput
                  style={styles.input}
                  value={address.city}
                  onChangeText={(text) => setAddress({ ...address, city: text })}
                  placeholder="City"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Postal Code</Text>
                <TextInput
                  style={styles.input}
                  value={address.postalCode}
                  onChangeText={(text) => setAddress({ ...address, postalCode: text })}
                  placeholder="PIN code"
                  keyboardType="number-pad"
                />
              </View>
            </View>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment</Text>
        <View style={styles.paymentOption}>
          <CreditCard size={24} color="#2563eb" />
          <Text style={styles.paymentText}>Pay at Pickup/Delivery</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Summary</Text>
        <View style={styles.summaryCard}>
          {cart.map((item) => (
            <View key={item.id} style={styles.summaryItem}>
              <Text style={styles.summaryItemName}>{item.name}</Text>
              <Text style={styles.summaryItemQty}>x{item.quantity}</Text>
              <Text style={styles.summaryItemPrice}>₹{item.price * item.quantity}</Text>
            </View>
          ))}
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₹{getSubtotal()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery</Text>
            <Text style={styles.summaryValue}>₹{orderType === 'delivery' ? 50 : 0}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{getTotal()}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.placeOrderButton, placingOrder && styles.placeOrderButtonDisabled]}
        onPress={placeOrder}
        disabled={placingOrder}
      >
        <Text style={styles.placeOrderButtonText}>
          {placingOrder ? 'Placing Order...' : `Place Order - ₹${getTotal()}`}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  typeOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  typeOption: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  typeOptionSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  typeOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  typeOptionTextSelected: {
    color: '#2563eb',
  },
  typeOptionSubtext: {
    fontSize: 12,
    color: '#64748b',
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
  },
  paymentText: {
    fontSize: 16,
    color: '#1e293b',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  summaryItemName: {
    flex: 1,
    fontSize: 14,
    color: '#1e293b',
  },
  summaryItemQty: {
    fontSize: 14,
    color: '#64748b',
    marginRight: 16,
  },
  summaryItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  summaryValue: {
    fontSize: 14,
    color: '#1e293b',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  placeOrderButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 40,
  },
  placeOrderButtonDisabled: {
    opacity: 0.7,
  },
  placeOrderButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
